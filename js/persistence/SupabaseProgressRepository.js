// SupabaseProgressRepository.js
// Implementación principal de ProgressRepository (Avance 2): el progreso
// vive en Supabase (progreso_jugador, progreso_fases, ejecuciones).
//
// Cómo funciona:
//  - cargarProgreso() lee de Supabase UNA vez y guarda el estado en memoria.
//    Los niveles completados y las estrellas se DERIVAN de las filas de
//    progreso_fases usando el catálogo de niveles (la tabla no los guarda).
//  - Las lecturas (obtenerEstadoNivel, obtenerProgreso...) salen de memoria,
//    por eso son instantáneas aunque sean `async`.
//  - Cada escritura actualiza memoria + un espejo en localStorage y entra en
//    una cola persistente que se envía a Supabase en segundo plano. Si no hay
//    conexión la cola se conserva y se reintenta al volver "online" o en la
//    siguiente carga (estrategia de la sección 6.3 de la especificación).
//  - Si Supabase no responde al cargar, se usa el espejo de localStorage.
//
// Regla de puntuación: una fase ya completada no cambia sus intentos ni sus
// pistas (repasar un nivel no debe quitar estrellas ya ganadas).

import { ProgressRepository } from "./ProgressRepository.js";
import { LocalStorageProgressRepository } from "./LocalStorageProgressRepository.js";
import {
  claveFase,
  estadoFaseVacio,
  construirProgresoJuego,
  filasDesdeProgresoJuego,
  calcularResumen,
  calcularExperiencia,
} from "./progreso.js";

const MAX_EJECUCIONES_MEMORIA = 50;
const MAX_EJECUCIONES_EN_COLA = 200;

function esErrorDeRed(error, status) {
  if (status === 0 || status >= 500) return true;
  const msg = String(error?.message || error || "").toLowerCase();
  return !error?.code && /fetch|network|timeout|load failed|offline|abort/.test(msg);
}

// 401 = sesión caducada: se conserva la operación para reintentarla.
const esReintentable = (error, status) => esErrorDeRed(error, status) || status === 401;

export class SupabaseProgressRepository extends ProgressRepository {
  /**
   * @param {object} o
   * @param {object} o.supabase  cliente de supabase-js
   * @param {object} o.catalogo  catálogo de niveles (ver progreso.js)
   * @param {Function} [o.alCambiarEstado] ({conectado, pendientes, falloPermanente}) => void
   * @param {Storage} [o.almacen] localStorage (inyectable para pruebas)
   */
  constructor({ supabase, catalogo, alCambiarEstado = () => {}, almacen = globalThis.localStorage }) {
    super();
    this.supabase = supabase;
    this.catalogo = catalogo;
    this.alCambiarEstado = alCambiarEstado;
    this.almacen = almacen;

    this.userId = null;
    this.nombre = "Estudiante";
    this.jugador = { mundoActual: 1, nivelActual: 1, experiencia: 0 };
    this.fases = new Map();
    this.ejecuciones = [];
    this.ultimoCodigo = new Map();
    this.pendientes = [];
    this.local = null;
    this.enLinea = true;
    this._vaciando = null;
    this.sinColumnaConcepto = false;

    if (typeof window !== "undefined" && window.addEventListener) {
      window.addEventListener("online", () => this.sincronizarPendientes());
    }
  }

  // ---------- Carga ----------

  async cargarProgreso() {
    const { data } = await this.supabase.auth.getSession();
    const user = data?.session?.user;
    if (!user) return null;

    this.userId = user.id;
    this.nombre = user.user_metadata?.nombre || "Estudiante";
    this.local = new LocalStorageProgressRepository(`codequest:progreso:v2:${user.id}`, this.almacen);
    this.pendientes = this._leerPendientes();

    try {
      const [jug, fases] = await Promise.all([
        this.supabase.from("progreso_jugador").select("*").eq("user_id", user.id).maybeSingle(),
        this.supabase.from("progreso_fases").select("*").eq("user_id", user.id),
      ]);
      if (jug.error) throw jug.error;
      if (fases.error) throw fases.error;

      const progreso = construirProgresoJuego({
        jugador: jug.data,
        filas: fases.data,
        catalogo: this.catalogo,
        nombre: this.nombre,
      });
      this._cargarEstadoDesde(progreso);
      // Lo que quedó sin enviar en una sesión anterior se mezcla con lo del servidor.
      this._mezclarPendientes();
      this._espejo();
      this._marcarRed(true);
      this._vaciarCola(); // en segundo plano
    } catch (e) {
      console.warn("Supabase no respondió; se usa la copia local.", e);
      this._cargarEstadoDesde(this.local.cargarProgreso());
      this._mezclarPendientes();
      this._marcarRed(false);
    }
    return this._vista();
  }

  _cargarEstadoDesde(progreso) {
    this.jugador = {
      mundoActual: progreso.jugador.mundoActual || 1,
      nivelActual: progreso.jugador.nivelActual || 1,
      experiencia: progreso.jugador.experiencia || 0,
    };
    this.fases = new Map();
    filasDesdeProgresoJuego(progreso).forEach((f) => {
      this.fases.set(claveFase(f.mundoId, f.nivelId, f.faseId), f);
    });
    this.ejecuciones = progreso.ejecuciones || [];
  }

  _mezclarPendientes() {
    this.pendientes.forEach((op) => {
      if (op.t === "fase") {
        const k = claveFase(op.mundoId, op.nivelId, op.faseId);
        const e = this.fases.get(k);
        this.fases.set(k, {
          mundoId: op.mundoId,
          nivelId: op.nivelId,
          faseId: op.faseId,
          completada: Boolean(e?.completada) || op.completada,
          intentos: Math.max(e?.intentos || 0, op.intentos),
          pistas: Math.max(e?.pistas || 0, op.pistas),
        });
      } else if (op.t === "jugador" && op.nivelActual >= this.jugador.nivelActual) {
        this.jugador = {
          mundoActual: op.mundoActual,
          nivelActual: op.nivelActual,
          experiencia: Math.max(this.jugador.experiencia, op.experiencia),
        };
      }
    });
  }

  // ---------- Vista para el juego (misma forma que en el Avance 1) ----------

  _vista() {
    const filas = [...this.fases.values()].map((f) => ({
      mundo_id: f.mundoId,
      nivel_id: f.nivelId,
      fase_id: f.faseId,
      completada: f.completada,
      intentos: f.intentos,
      pistas_usadas: f.pistas,
    }));
    const vista = construirProgresoJuego({
      jugador: this.jugador,
      filas,
      catalogo: this.catalogo,
      nombre: this.nombre,
    });
    vista.ejecuciones = this.ejecuciones;
    return vista;
  }

  _espejo() {
    if (this.local) this.local.guardarProgreso(this._vista());
  }

  async obtenerProgreso() {
    return this._vista();
  }

  async obtenerEstadoNivel(mundoId, nivelId) {
    const nivel = this._vista().mundos[mundoId]?.niveles?.[nivelId];
    return nivel || { completado: false, estrellas: 0, fases: {} };
  }

  async obtenerEstadoFase(mundoId, nivelId, faseId) {
    const f = this.fases.get(claveFase(mundoId, nivelId, faseId));
    return f ? { completada: f.completada, intentos: f.intentos, pistas: f.pistas } : estadoFaseVacio();
  }

  async obtenerEstrellas(nivelId) {
    const nivelCat = this.catalogo.niveles[nivelId];
    if (!nivelCat) return 0;
    return (await this.obtenerEstadoNivel(nivelCat.mundo, nivelId)).estrellas || 0;
  }

  // ---------- Escrituras ----------

  async registrarIntentoFase(mundoId, nivelId, faseId, { pistasUsadas, codigo } = {}) {
    const clave = claveFase(mundoId, nivelId, faseId);
    const fase = this.fases.get(clave) || {
      mundoId: Number(mundoId),
      nivelId: Number(nivelId),
      faseId,
      ...estadoFaseVacio(),
    };
    let cambio = !this.fases.has(clave);

    if (!fase.completada) {
      // Reejecutar el mismo código sin tocarlo no cuenta como intento nuevo.
      if (codigo !== undefined && this.ultimoCodigo.get(clave) !== codigo) {
        fase.intentos += 1;
        cambio = true;
      }
      if (pistasUsadas !== undefined && pistasUsadas > fase.pistas) {
        fase.pistas = pistasUsadas;
        cambio = true;
      }
    }
    if (codigo !== undefined) this.ultimoCodigo.set(clave, codigo);

    this.fases.set(clave, fase);
    if (cambio) this._persistirFase(fase);
    return { completada: fase.completada, intentos: fase.intentos, pistas: fase.pistas };
  }

  async completarFase(mundoId, nivelId, faseId) {
    const clave = claveFase(mundoId, nivelId, faseId);
    const fase = this.fases.get(clave) || {
      mundoId: Number(mundoId),
      nivelId: Number(nivelId),
      faseId,
      ...estadoFaseVacio(),
    };
    if (!fase.completada) {
      fase.completada = true;
      this.fases.set(clave, fase);
      this._persistirFase(fase);
    }
    return { completada: true, intentos: fase.intentos, pistas: fase.pistas };
  }

  async completarNivel(mundoId, nivelId, { siguienteMundo, siguienteNivel } = {}) {
    const resumen = this._resumenActual();
    // El jugador solo avanza: repasar un nivel anterior no lo hace retroceder.
    if (siguienteNivel && siguienteNivel > this.jugador.nivelActual) {
      this.jugador.mundoActual = siguienteMundo || this.jugador.mundoActual;
      this.jugador.nivelActual = siguienteNivel;
    }
    this.jugador.experiencia = calcularExperiencia(
      resumen.totales.nivelesCompletados,
      resumen.totales.estrellas
    );
    this._persistirJugador();
    return this.obtenerEstadoNivel(mundoId, nivelId);
  }

  async guardarEjecucion(e) {
    const clave = claveFase(e.mundoId, e.nivelId, e.faseId);
    const fase = this.fases.get(clave) || estadoFaseVacio();
    this.ejecuciones.unshift({ ...e, timestamp: Date.now() });
    if (this.ejecuciones.length > MAX_EJECUCIONES_MEMORIA) this.ejecuciones.length = MAX_EJECUCIONES_MEMORIA;

    this._encolar({
      t: "ejecucion",
      mundoId: Number(e.mundoId),
      nivelId: Number(e.nivelId),
      faseId: e.faseId,
      codigo: String(e.codigo ?? ""),
      resultado: e.resultado,
      codigoError: e.codigoError ?? null,
      conceptoEvaluado: e.conceptoEvaluado ?? null,
      tiempoMs: Number.isFinite(e.tiempoMs) ? Math.round(e.tiempoMs) : null,
      intentoNumero: fase.intentos,
      pistasUsadas: fase.pistas,
    });
    this._espejo();
    this._vaciarCola();
    return this._vista();
  }

  // Compatibilidad con la interfaz: guarda todo el progreso recibido.
  async guardarProgreso(progreso) {
    this._cargarEstadoDesde({ ...progreso, ejecuciones: this.ejecuciones });
    this.fases.forEach((f) => this._encolar({ t: "fase", ...f }));
    this._persistirJugador();
    return true;
  }

  _resumenActual() {
    const filas = [...this.fases.values()].map((f) => ({
      nivel_id: f.nivelId,
      fase_id: f.faseId,
      completada: f.completada,
      intentos: f.intentos,
      pistas_usadas: f.pistas,
    }));
    return calcularResumen(filas, this.catalogo);
  }

  _persistirFase(f) {
    this._encolar({
      t: "fase",
      mundoId: f.mundoId,
      nivelId: f.nivelId,
      faseId: f.faseId,
      completada: f.completada,
      intentos: f.intentos,
      pistas: f.pistas,
    });
    this._espejo();
    this._vaciarCola();
  }

  _persistirJugador() {
    this._encolar({ t: "jugador", ...this.jugador });
    this._espejo();
    this._vaciarCola();
  }

  // ---------- Cola de sincronización ----------

  _claveCola() {
    return `codequest:pendientes:v1:${this.userId}`;
  }

  _leerPendientes() {
    try {
      return JSON.parse(this.almacen?.getItem(this._claveCola()) || "[]");
    } catch {
      return [];
    }
  }

  _guardarPendientes() {
    try {
      this.almacen?.setItem(this._claveCola(), JSON.stringify(this.pendientes));
    } catch (e) {
      console.warn("No se pudo guardar la cola de pendientes", e);
    }
  }

  _encolar(op) {
    if (op.t === "fase") {
      this.pendientes = this.pendientes.filter(
        (p) => !(p.t === "fase" && claveFase(p.mundoId, p.nivelId, p.faseId) === claveFase(op.mundoId, op.nivelId, op.faseId))
      );
    } else if (op.t === "jugador") {
      this.pendientes = this.pendientes.filter((p) => p.t !== "jugador");
    }
    this.pendientes.push(op);

    const ejec = this.pendientes.filter((p) => p.t === "ejecucion");
    if (ejec.length > MAX_EJECUCIONES_EN_COLA) {
      const sobrantes = new Set(ejec.slice(0, ejec.length - MAX_EJECUCIONES_EN_COLA));
      this.pendientes = this.pendientes.filter((p) => !sobrantes.has(p));
    }
    this._guardarPendientes();
    this.alCambiarEstado(this._estado());
  }

  _estado(extra = {}) {
    return { conectado: this.enLinea, pendientes: this.pendientes.length, ...extra };
  }

  _marcarRed(conectado) {
    this.enLinea = conectado;
    this.alCambiarEstado(this._estado());
  }

  sincronizarPendientes() {
    return this.userId ? this._vaciarCola() : Promise.resolve(false);
  }

  hayPendientes() {
    return this.pendientes.length > 0;
  }

  _vaciarCola() {
    if (this._vaciando) return this._vaciando;
    const trabajo = this._procesarCola();
    this._vaciando = trabajo;
    // La marca se libera DESPUÉS de asignarla (si no, una cola vacía que
    // termina al instante dejaría `_vaciando` atascado para siempre).
    const liberar = () => {
      if (this._vaciando === trabajo) this._vaciando = null;
    };
    trabajo.then(liberar, liberar);
    return trabajo;
  }

  async _procesarCola() {
    while (this.pendientes.length) {
      const op = this.pendientes[0];
      let resultado;
      try {
        resultado = await this._enviarOp(op);
      } catch (e) {
        resultado = { error: e, status: 0 };
      }
      if (!resultado.error) {
        this._quitar(op);
        continue;
      }
      if (esReintentable(resultado.error, resultado.status)) {
        this._marcarRed(false);
        return false;
      }
      // Error permanente (por ejemplo una política RLS): reintentar no sirve.
      console.error("No se pudo guardar en Supabase; se descarta la operación.", op, resultado.error);
      this._quitar(op);
      this.alCambiarEstado(this._estado({ falloPermanente: true }));
    }
    this._marcarRed(true);
    return true;
  }

  _quitar(op) {
    const i = this.pendientes.indexOf(op);
    if (i >= 0) this.pendientes.splice(i, 1);
    this._guardarPendientes();
  }

  async _enviarOp(op) {
    const uid = this.userId;
    const db = this.supabase;

    if (op.t === "fase") {
      const filtro = { user_id: uid, mundo_id: op.mundoId, nivel_id: op.nivelId, fase_id: op.faseId };
      const campos = { completada: op.completada, intentos: op.intentos, pistas_usadas: op.pistas };
      const upd = await db.from("progreso_fases").update(campos).match(filtro).select();
      if (upd.error || (upd.data && upd.data.length > 0)) return upd;
      return db.from("progreso_fases").insert({ ...filtro, ...campos });
    }

    if (op.t === "jugador") {
      const campos = { mundo_actual: op.mundoActual, nivel_actual: op.nivelActual, experiencia: op.experiencia };
      const upd = await db.from("progreso_jugador").update(campos).eq("user_id", uid).select();
      if (upd.error || (upd.data && upd.data.length > 0)) return upd;
      return db.from("progreso_jugador").insert({ user_id: uid, ...campos });
    }

    const fila = {
      user_id: uid,
      mundo_id: op.mundoId,
      nivel_id: op.nivelId,
      fase_id: op.faseId,
      codigo: op.codigo,
      resultado: op.resultado,
      codigo_error: op.codigoError,
      tiempo_ms: op.tiempoMs,
      intento_numero: op.intentoNumero,
      pistas_usadas: op.pistasUsadas,
    };
    if (!this.sinColumnaConcepto) {
      const r = await db.from("ejecuciones").insert({ ...fila, concepto_evaluado: op.conceptoEvaluado ?? null });
      // Si aún no se ejecutó avance2_3.sql, la columna no existe: se guarda igual,
      // sin el concepto, en vez de perder todas las ejecuciones.
      const faltaColumna = r.error && (r.error.code === "PGRST204" || /concepto_evaluado/.test(r.error.message || ""));
      if (!faltaColumna) return r;
      this.sinColumnaConcepto = true;
    }
    return db.from("ejecuciones").insert(fila);
  }
}
