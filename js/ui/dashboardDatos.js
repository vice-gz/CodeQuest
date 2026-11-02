// dashboardDatos.js
// Lógica PURA (sin DOM ni Supabase) del dashboard de la tesis: qué usuarios entran en cada
// filtro de grupo y cómo se calculan los KPIs y los datos de las 3 gráficas.
//
// Idea: el servidor entrega UNA sola vez un resumen compacto de las ejecuciones (por usuario,
// por código de error y por día; función SQL admin_dashboard_datos) y el filtro por grupo se
// aplica aquí, en el navegador. Así, al cambiar el selector todo se actualiza al instante.
// Si esa función SQL no está instalada, agregarEjecuciones() produce el mismo resumen a
// partir de las filas de `ejecuciones`.

export const FILTRO_TODOS = "todos";
export const FILTRO_SIN_GRUPO = "sin_grupo";
export const PREFIJO_CLASE = "clase:";
export const DIAS_GRAFICA = 7;

// ---------------------------------------------------------------- grupos y filtros

/** [{clase_id, estudiante_id}] -> { porClase: Map(clase_id -> Set(userId)), inscritos: Set(userId) } */
export function construirMembresias(inscripciones = []) {
  const porClase = new Map();
  const inscritos = new Set();
  for (const { clase_id: claseId, estudiante_id: userId } of inscripciones) {
    if (!porClase.has(claseId)) porClase.set(claseId, new Set());
    porClase.get(claseId).add(userId);
    inscritos.add(userId);
  }
  return { porClase, inscritos };
}

export const valorFiltroClase = (claseId) => `${PREFIJO_CLASE}${claseId}`;
export const claseDeFiltro = (filtro) => (String(filtro).startsWith(PREFIJO_CLASE) ? String(filtro).slice(PREFIJO_CLASE.length) : null);

/**
 * Usuarios que entran en el filtro:
 *   «todos»      → todas las cuentas (alumnos, profesores y administradores)
 *   «sin_grupo»  → alumnos que no están inscritos en ninguna clase
 *   «clase:<id>» → alumnos inscritos en esa clase
 */
export function usuariosDelFiltro(usuarios, filtro, membresias) {
  if (filtro === FILTRO_SIN_GRUPO) return usuarios.filter((u) => u.rol === "estudiante" && !membresias.inscritos.has(u.id));
  const clase = claseDeFiltro(filtro);
  if (clase) {
    const ids = membresias.porClase.get(clase) || new Set();
    return usuarios.filter((u) => u.rol === "estudiante" && ids.has(u.id));
  }
  return usuarios;
}

/** Solo los alumnos: la población de los KPIs y las gráficas (profesores y admins no cuentan). */
export const alumnosDelFiltro = (usuarios, filtro, membresias) => usuariosDelFiltro(usuarios, filtro, membresias).filter((u) => u.rol === "estudiante");

// ---------------------------------------------------------------- KPIs y gráficas

/** @param datos  { usuarios: [{usuario_id,total,exitos}], errores, dias } */
export function calcularKpis(alumnos, resumenes, datos) {
  const ids = new Set(alumnos.map((a) => a.id));
  const estrellas = alumnos.reduce((s, a) => s + (resumenes.get(a.id)?.totales?.estrellas ?? 0), 0);
  let ejecuciones = 0;
  let exitos = 0;
  for (const f of datos.usuarios || []) {
    if (!ids.has(f.usuario_id)) continue;
    ejecuciones += f.total;
    exitos += f.exitos;
  }
  return {
    alumnos: alumnos.length,
    estrellasPromedio: alumnos.length ? estrellas / alumnos.length : 0,
    ejecuciones,
    exitos,
    tasaExito: ejecuciones ? (exitos / ejecuciones) * 100 : null, // null = aún no hay ejecuciones
  };
}

/** Los códigos de error más frecuentes entre esos alumnos (desempate: orden alfabético). */
export function topErrores(alumnos, datos, n = 5) {
  const ids = new Set(alumnos.map((a) => a.id));
  const porCodigo = new Map();
  for (const f of datos.errores || []) {
    if (ids.has(f.usuario_id)) porCodigo.set(f.codigo_error, (porCodigo.get(f.codigo_error) || 0) + f.total);
  }
  return [...porCodigo.entries()]
    .map(([codigo, total]) => ({ codigo, total }))
    .sort((a, b) => b.total - a.total || a.codigo.localeCompare(b.codigo))
    .slice(0, n);
}

/** Cuántos alumnos están hoy en cada mundo (según su progreso). */
export function alumnosPorMundo(alumnos, idsMundos) {
  const cuenta = new Map(idsMundos.map((id) => [id, 0]));
  for (const a of alumnos) if (cuenta.has(a.mundo)) cuenta.set(a.mundo, cuenta.get(a.mundo) + 1);
  return idsMundos.map((id) => ({ mundo: id, total: cuenta.get(id) }));
}

/** 'YYYY-MM-DD' de una fecha en una zona horaria (la del navegador de quien mira el panel). */
export function diaLocal(fecha, zona = "UTC") {
  return new Intl.DateTimeFormat("en-CA", { timeZone: zona, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(fecha));
}

export function sumarDias(dia, k) {
  const [a, m, d] = dia.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d + k)).toISOString().slice(0, 10);
}

/** «dom 1», «lun 2»… (el día ya viene en la zona de quien mira; se escribe con UTC para no moverlo). */
export function etiquetaDia(dia) {
  return new Date(`${dia}T12:00:00Z`).toLocaleDateString("es-MX", { weekday: "short", day: "numeric", timeZone: "UTC" }).replace(".", "");
}

/** Ejecuciones de los últimos `n` días (el último es hoy), con 0 en los días sin actividad. */
export function ejecucionesPorDia(alumnos, datos, hoy, n = DIAS_GRAFICA) {
  const ids = new Set(alumnos.map((a) => a.id));
  const porDia = new Map();
  for (const f of datos.dias || []) if (ids.has(f.usuario_id)) porDia.set(f.dia, (porDia.get(f.dia) || 0) + f.total);
  return Array.from({ length: n }, (_, i) => {
    const dia = sumarDias(hoy, i - (n - 1));
    return { dia, etiqueta: etiquetaDia(dia), total: porDia.get(dia) || 0 };
  });
}

// ---------------------------------------------------------------- alternativa sin la función SQL

/**
 * Mismo resumen que devuelve admin_dashboard_datos(), calculado con las filas de `ejecuciones`
 * (user_id, resultado, codigo_error, created_at). Se usa si esa función aún no está instalada.
 */
export function agregarEjecuciones(filas, { dias = DIAS_GRAFICA, zona = "UTC", ahora = Date.now() } = {}) {
  const porUsuario = new Map();
  const porError = new Map();
  const porDia = new Map();
  const desde = sumarDias(diaLocal(ahora, zona), -(dias - 1));
  for (const f of filas) {
    const u = porUsuario.get(f.user_id) || { total: 0, exitos: 0 };
    u.total += 1;
    if (f.resultado === "exito") u.exitos += 1;
    porUsuario.set(f.user_id, u);
    if (f.codigo_error) {
      const k = `${f.user_id}|${f.codigo_error}`;
      porError.set(k, (porError.get(k) || 0) + 1);
    }
    const dia = diaLocal(f.created_at, zona);
    if (dia >= desde) {
      const k = `${f.user_id}|${dia}`;
      porDia.set(k, (porDia.get(k) || 0) + 1);
    }
  }
  const partir = (k) => k.split("|");
  return {
    usuarios: [...porUsuario].map(([usuario_id, v]) => ({ usuario_id, total: v.total, exitos: v.exitos })).sort((a, b) => a.usuario_id.localeCompare(b.usuario_id)),
    errores: [...porError].map(([k, total]) => ({ usuario_id: partir(k)[0], codigo_error: partir(k)[1], total })).sort((a, b) => a.usuario_id.localeCompare(b.usuario_id) || a.codigo_error.localeCompare(b.codigo_error)),
    dias: [...porDia].map(([k, total]) => ({ usuario_id: partir(k)[0], dia: partir(k)[1], total })).sort((a, b) => a.usuario_id.localeCompare(b.usuario_id) || a.dia.localeCompare(b.dia)),
  };
}
