// test_persistencia.mjs
// Pruebas headless de la capa de persistencia del Avance 2: funciones puras
// (progreso.js) y SupabaseProgressRepository contra un Supabase simulado en
// memoria (sin red). Uso: node test_persistencia.mjs

import { readFileSync, readdirSync } from "fs";
import assert from "node:assert/strict";
import {
  construirCatalogo,
  calcularResumen,
  construirProgresoJuego,
  contarErrores,
  resultadoDeError,
  calcularExperiencia,
} from "./js/persistence/progreso.js";
import { SupabaseProgressRepository } from "./js/persistence/SupabaseProgressRepository.js";

// ---------- Catálogo real desde levels/ ----------
const niveles = [];
for (const carpeta of readdirSync("levels")) {
  for (const f of readdirSync(`levels/${carpeta}`)) {
    niveles.push(JSON.parse(readFileSync(`levels/${carpeta}/${f}`, "utf8")));
  }
}
const catalogo = construirCatalogo(niveles);

// ---------- Supabase simulado ----------
class BDFalsa {
  constructor() {
    this.tablas = {
      progreso_jugador: [{ user_id: "u1", mundo_actual: 1, nivel_actual: 1, experiencia: 0 }],
      progreso_fases: [],
      ejecuciones: [],
    };
    this.sinRed = false;
    this.auth = { getSession: async () => ({ data: { session: { user: { id: "u1", user_metadata: { nombre: "Ana" } } } } }) };
  }
  from(tabla) {
    const bd = this;
    const q = { op: "select", payload: null, filtros: [], single: false, devolver: false };
    const coincide = (fila) => q.filtros.every(([k, v]) => String(fila[k]) === String(v));
    const ejecutar = () => {
      if (bd.sinRed) return { data: null, error: { message: "TypeError: Failed to fetch" }, status: 0 };
      const filas = bd.tablas[tabla];
      if (q.op === "select") {
        const r = filas.filter(coincide);
        return { data: q.single ? r[0] ?? null : r, error: null, status: 200 };
      }
      if (q.op === "insert") {
        // Simula la tabla `ejecuciones` sin la columna concepto_evaluado (SQL 2.3 sin ejecutar).
        if (tabla === "ejecuciones" && bd.sinColumnaConcepto && "concepto_evaluado" in q.payload) {
          return {
            data: null,
            error: { code: "PGRST204", message: "Could not find the 'concepto_evaluado' column of 'ejecuciones' in the schema cache" },
            status: 400,
          };
        }
        filas.push({ ...q.payload });
        return { data: null, error: null, status: 201 };
      }
      const afectadas = filas.filter(coincide);
      afectadas.forEach((f) => Object.assign(f, q.payload));
      return { data: q.devolver ? afectadas : null, error: null, status: 200 };
    };
    const api = {
      select() { if (q.op === "update") q.devolver = true; return api; },
      insert(p) { q.op = "insert"; q.payload = p; return api; },
      update(p) { q.op = "update"; q.payload = p; return api; },
      eq(k, v) { q.filtros.push([k, v]); return api; },
      match(o) { Object.entries(o).forEach(([k, v]) => q.filtros.push([k, v])); return api; },
      maybeSingle() { q.single = true; return api; },
      then(res, rej) { return Promise.resolve(ejecutar()).then(res, rej); },
    };
    return api;
  }
}

function almacenFalso() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), _m: m };
}

const esperar = () => new Promise((r) => setTimeout(r, 0));
let pruebas = 0;
const prueba = async (nombre, fn) => {
  await fn();
  pruebas += 1;
  console.log(`  ✓ ${nombre}`);
};

console.log("Catálogo y funciones puras");
await prueba("19 niveles, 2 mundos, 57 estrellas máximas", () => {
  assert.equal(catalogo.totalNiveles, 19);
  assert.deepEqual(Object.keys(catalogo.mundos), ["1", "2"]);
  assert.equal(catalogo.mundos[1].niveles.length, 8);
  assert.equal(catalogo.mundos[2].niveles.length, 11);
  assert.equal(catalogo.maxEstrellas, 57);
});

await prueba("nivel con todas sus fases a la primera = 3 estrellas", () => {
  const filas = ["1.1", "1.2", "1.3"].map((f) => ({ nivel_id: 1, fase_id: f, completada: true, intentos: 1, pistas_usadas: 0 }));
  const r = calcularResumen(filas, catalogo);
  assert.equal(r.niveles[1].estrellas, 3);
  assert.equal(r.mundos[1].estrellas, 3);
  assert.equal(r.totales.nivelesCompletados, 1);
  assert.equal(r.totales.fasesCompletadas, 3);
});

await prueba("nivel incompleto = 0 estrellas aunque haya fases hechas", () => {
  const filas = [{ nivel_id: 1, fase_id: "1.1", completada: true, intentos: 1, pistas_usadas: 0 }];
  const r = calcularResumen(filas, catalogo);
  assert.equal(r.niveles[1].completado, false);
  assert.equal(r.niveles[1].estrellas, 0);
  assert.equal(r.mundos[1].porcentaje, Math.round((1 / r.mundos[1].fasesTotal) * 100));
});

await prueba("pistas bajan a 1 estrella; reintentos a 2", () => {
  const base = ["1.1", "1.2", "1.3"].map((f) => ({ nivel_id: 1, fase_id: f, completada: true, intentos: 1, pistas_usadas: 0 }));
  assert.equal(calcularResumen(base.map((f, i) => (i === 0 ? { ...f, pistas_usadas: 1 } : f)), catalogo).niveles[1].estrellas, 1);
  assert.equal(calcularResumen(base.map((f, i) => (i === 1 ? { ...f, intentos: 3 } : f)), catalogo).niveles[1].estrellas, 2);
});

await prueba("contarErrores ordena y limita al top 5", () => {
  const filas = [..."AAABBC"].map((c) => ({ codigo_error: `SEM_00${c.charCodeAt(0) - 64}` })).concat([{ codigo_error: null }]);
  const top = contarErrores(filas, 2);
  assert.deepEqual(top, [{ codigo: "SEM_001", total: 3 }, { codigo: "SEM_002", total: 2 }]);
});

await prueba("resultadoDeError según prefijo del código CQL", () => {
  assert.equal(resultadoDeError("LEX_002"), "error_lexico");
  assert.equal(resultadoDeError("SYN_001"), "error_sintaxis");
  assert.equal(resultadoDeError("SEM_001"), "error_semantico");
  assert.equal(resultadoDeError("RUN_003"), "error_ejecucion");
  assert.equal(resultadoDeError("ERR_INESPERADO"), "error_inesperado");
});

await prueba("progreso del juego tiene la forma que espera juego.js", () => {
  const p = construirProgresoJuego({
    jugador: { mundo_actual: 1, nivel_actual: 2, experiencia: 150 },
    filas: ["1.1", "1.2", "1.3"].map((f) => ({ mundo_id: 1, nivel_id: 1, fase_id: f, completada: true, intentos: 1, pistas_usadas: 0 })),
    catalogo,
    nombre: "Ana",
  });
  assert.equal(p.jugador.nivelActual, 2);
  assert.equal(p.mundos[1].niveles[1].completado, true);
  assert.equal(p.mundos[1].niveles[1].estrellas, 3);
  assert.equal(p.mundos[1].completado, false);
});

console.log("SupabaseProgressRepository (BD simulada)");
async function nuevoRepo(bd = new BDFalsa(), almacen = almacenFalso()) {
  const estados = [];
  const repo = new SupabaseProgressRepository({ supabase: bd, catalogo, almacen, alCambiarEstado: (e) => estados.push(e) });
  await repo.cargarProgreso();
  return { repo, bd, almacen, estados };
}

async function jugarNivel1(repo, { falloEn = null } = {}) {
  for (const faseId of ["1.1", "1.2", "1.3"]) {
    if (faseId === falloEn) {
      await repo.registrarIntentoFase(1, 1, faseId, { codigo: "mal" });
      await repo.guardarEjecucion({ mundoId: 1, nivelId: 1, faseId, codigo: "mal", resultado: "error_semantico", codigoError: "SEM_001", tiempoMs: 12 });
    }
    await repo.registrarIntentoFase(1, 1, faseId, { codigo: `ok-${faseId}` });
    await repo.completarFase(1, 1, faseId);
    await repo.guardarEjecucion({ mundoId: 1, nivelId: 1, faseId, codigo: `ok-${faseId}`, resultado: "exito", tiempoMs: 20 });
  }
  const estado = await repo.obtenerEstadoNivel(1, 1);
  await repo.completarNivel(1, 1, { estrellas: estado.estrellas, siguienteMundo: 1, siguienteNivel: 2 });
  await repo.sincronizarPendientes();
  return estado;
}

await prueba("jugador nuevo: carga vacía y sin red no hace falta", async () => {
  const { repo } = await nuevoRepo();
  const p = await repo.obtenerProgreso();
  assert.equal(p.jugador.nivelActual, 1);
  assert.equal(p.jugador.nombre, "Ana");
  assert.deepEqual(p.mundos, {});
});

await prueba("completar un nivel escribe fases, jugador y ejecuciones en Supabase", async () => {
  const { repo, bd } = await nuevoRepo();
  const estado = await jugarNivel1(repo);
  assert.equal(estado.estrellas, 3);
  assert.equal(bd.tablas.progreso_fases.length, 3);
  assert.ok(bd.tablas.progreso_fases.every((f) => f.completada === true && f.intentos === 1 && f.pistas_usadas === 0));
  assert.equal(bd.tablas.ejecuciones.length, 3);
  assert.equal(bd.tablas.ejecuciones[0].user_id, "u1");
  assert.equal(bd.tablas.ejecuciones[0].intento_numero, 1);
  const j = bd.tablas.progreso_jugador[0];
  assert.equal(j.nivel_actual, 2);
  assert.equal(j.experiencia, calcularExperiencia(1, 3)); // 100 + 150
  assert.equal(repo.hayPendientes(), false);
});

await prueba("un fallo registra la ejecución con codigo_error y no completa la fase", async () => {
  const { repo, bd } = await nuevoRepo();
  await repo.registrarIntentoFase(1, 1, "1.1", { codigo: "print(x)" });
  await repo.guardarEjecucion({ mundoId: 1, nivelId: 1, faseId: "1.1", codigo: "print(x)", resultado: "error_semantico", codigoError: "SEM_001", tiempoMs: 7 });
  await repo.sincronizarPendientes();
  const fila = bd.tablas.progreso_fases.find((f) => f.fase_id === "1.1");
  assert.equal(fila.completada, false);
  assert.equal(fila.intentos, 1);
  const e = bd.tablas.ejecuciones[0];
  assert.equal(e.codigo_error, "SEM_001");
  assert.equal(e.resultado, "error_semantico");
  assert.equal(e.tiempo_ms, 7);
});

await prueba("fallar una fase antes de acertar da 2 estrellas, no 3", async () => {
  const { repo } = await nuevoRepo();
  const estado = await jugarNivel1(repo, { falloEn: "1.2" });
  assert.equal(estado.estrellas, 2);
});

await prueba("repasar un nivel ya completado no quita estrellas", async () => {
  const { repo } = await nuevoRepo();
  await jugarNivel1(repo);
  await repo.registrarIntentoFase(1, 1, "1.1", { codigo: "otro intento" });
  await repo.registrarIntentoFase(1, 1, "1.1", { pistasUsadas: 2 });
  assert.equal((await repo.obtenerEstadoNivel(1, 1)).estrellas, 3);
  await repo.completarNivel(1, 1, { siguienteMundo: 1, siguienteNivel: 2 });
  assert.equal((await repo.obtenerProgreso()).jugador.nivelActual, 2);
});

await prueba("repetir el mismo código no cuenta como intento nuevo", async () => {
  const { repo } = await nuevoRepo();
  await repo.registrarIntentoFase(1, 1, "1.1", { codigo: "x" });
  const f = await repo.registrarIntentoFase(1, 1, "1.1", { codigo: "x" });
  assert.equal(f.intentos, 1);
});

await prueba("el jugador no retrocede al repasar un nivel anterior", async () => {
  const { repo } = await nuevoRepo();
  repo.jugador.nivelActual = 10;
  repo.jugador.mundoActual = 2;
  await repo.completarNivel(1, 1, { siguienteMundo: 1, siguienteNivel: 2 });
  const p = await repo.obtenerProgreso();
  assert.equal(p.jugador.nivelActual, 10);
  assert.equal(p.jugador.mundoActual, 2);
});

await prueba("sin conexión: el progreso queda en cola y se envía al volver la red", async () => {
  const bd = new BDFalsa();
  const { repo, estados } = await nuevoRepo(bd);
  bd.sinRed = true;
  await jugarNivel1(repo);
  assert.equal(bd.tablas.progreso_fases.length, 0);
  assert.equal(repo.hayPendientes(), true);
  assert.equal((await repo.obtenerEstadoNivel(1, 1)).estrellas, 3, "el juego sigue funcionando offline");
  assert.equal(estados.at(-1).conectado, false);

  bd.sinRed = false;
  await repo.sincronizarPendientes();
  assert.equal(repo.hayPendientes(), false);
  assert.equal(bd.tablas.progreso_fases.length, 3);
  assert.equal(bd.tablas.ejecuciones.length, 3);
  assert.equal(estados.at(-1).conectado, true);
});

await prueba("pendientes de una sesión anterior se mezclan y se envían en la siguiente carga", async () => {
  const bd = new BDFalsa();
  const almacen = almacenFalso();
  const a = await nuevoRepo(bd, almacen);
  bd.sinRed = true;
  await jugarNivel1(a.repo);
  // "Cerrar la pestaña" y abrirla con red:
  bd.sinRed = false;
  const b = await nuevoRepo(bd, almacen);
  await b.repo.sincronizarPendientes();
  assert.equal(b.repo.hayPendientes(), false);
  assert.equal(bd.tablas.progreso_fases.length, 3);
  assert.equal((await b.repo.obtenerProgreso()).jugador.nivelActual, 2);
});

await prueba("si Supabase falla al cargar, se usa la copia local del mismo usuario", async () => {
  const bd = new BDFalsa();
  const almacen = almacenFalso();
  const a = await nuevoRepo(bd, almacen);
  await jugarNivel1(a.repo);
  bd.sinRed = true;
  const b = await nuevoRepo(bd, almacen);
  assert.equal((await b.repo.obtenerEstadoNivel(1, 1)).completado, true);
  assert.equal(b.estados.at(-1).conectado, false);
});

await prueba("la ejecución guarda el concepto evaluado del nivel", async () => {
  const { repo, bd } = await nuevoRepo();
  await repo.registrarIntentoFase(1, 1, "1.1", { codigo: "x" });
  await repo.guardarEjecucion({ mundoId: 1, nivelId: 1, faseId: "1.1", codigo: "x", resultado: "exito", conceptoEvaluado: "instrucciones" });
  await repo.sincronizarPendientes();
  assert.equal(bd.tablas.ejecuciones.at(-1).concepto_evaluado, "instrucciones");
});

await prueba("sin la columna concepto_evaluado en la BD no se pierden ejecuciones", async () => {
  const bd = new BDFalsa();
  bd.sinColumnaConcepto = true;
  const { repo } = await nuevoRepo(bd);
  await repo.registrarIntentoFase(1, 1, "1.1", { codigo: "x" });
  await repo.guardarEjecucion({ mundoId: 1, nivelId: 1, faseId: "1.1", codigo: "x", resultado: "exito", conceptoEvaluado: "instrucciones" });
  await repo.guardarEjecucion({ mundoId: 1, nivelId: 1, faseId: "1.1", codigo: "y", resultado: "exito", conceptoEvaluado: "instrucciones" });
  await repo.sincronizarPendientes();
  assert.equal(bd.tablas.ejecuciones.length, 2);
  assert.ok(!("concepto_evaluado" in bd.tablas.ejecuciones[0]));
  assert.equal(repo.hayPendientes(), false);
});

await prueba("el repositorio sin persistencia (Laboratorio Libre) no guarda nada", async () => {
  const { NoopProgressRepository } = await import("./js/persistence/NoopProgressRepository.js");
  const r = new NoopProgressRepository();
  await r.registrarIntentoFase(0, 0, "L.1", { codigo: "x" });
  await r.completarFase(0, 0, "L.1");
  await r.guardarEjecucion({ resultado: "exito" });
  assert.equal((await r.obtenerEstadoNivel(0, 0)).estrellas, 0);
  assert.deepEqual((await r.obtenerProgreso()).mundos, {});
});

console.log(`\n${pruebas} pruebas correctas.`);
