// test_dashboard_admin.mjs — dashboard del administrador (filtro por grupo, KPIs, gráficas y CSV).
//  1) lógica pura de js/ui/dashboardDatos.js
//  2) la página admin.html REAL (js/admin.js) en jsdom con un Supabase simulado y una Chart.js
//     falsa que registra lo que dibuja. Los resultados esperados están calculados A MANO.
// Uso: node test_dashboard_admin.mjs

import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "fs";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";
import { build } from "esbuild";
import { JSDOM, VirtualConsole } from "jsdom";
import {
  construirMembresias, usuariosDelFiltro, alumnosDelFiltro, calcularKpis, topErrores, alumnosPorMundo,
  ejecucionesPorDia, diaLocal, sumarDias, etiquetaDia, agregarEjecuciones, valorFiltroClase,
} from "./js/ui/dashboardDatos.js";
import { calcularResumen, construirCatalogo } from "./js/persistence/progreso.js";

const RAIZ = dirname(fileURLToPath(import.meta.url));
const plano = (x) => JSON.parse(JSON.stringify(x));
let n = 0;
const prueba = async (nombre, fn) => {
  await fn();
  n++;
  console.log(`  ✓ ${nombre}`);
};

// ---------------------------------------------------------------- datos de prueba (calculados a mano)
const NIVELES = [];
for (const c of readdirSync(join(RAIZ, "levels"))) for (const f of readdirSync(join(RAIZ, "levels", c))) NIVELES.push(JSON.parse(readFileSync(join(RAIZ, "levels", c, f), "utf8")));
const catalogo = construirCatalogo(NIVELES);

const U = (k) => `00000000-0000-4000-8000-${String(k).padStart(12, "0")}`;
const A = Object.fromEntries([1, 2, 3, 4, 5, 6, 7].map((i) => [`A${i}`, U(i)]));
const PROFE = U(90);
const ADMIN = U(99);
const CLASE_A = U(501);
const CLASE_B = U(502);

// mundo_actual: A1 y A2 en el mundo 1, A3 en el 2, A4 en el 3, A5 en el 4, A6 y A7 en el 1
const MUNDO = { A1: 1, A2: 1, A3: 2, A4: 3, A5: 4, A6: 1, A7: 1 };
const usuariosBD = [
  ...Object.entries(A).map(([clave, id]) => ({ usuario_id: id, nombre: `Alumno ${clave}`, email: `${clave.toLowerCase()}@pachuca.tecnm.mx`, rol: "estudiante", fecha_registro: "2026-09-01T10:00:00Z", ultimo_acceso: null, mundo_actual: MUNDO[clave], nivel_actual: 1, experiencia: 0, ultima_actividad: null })),
  { usuario_id: PROFE, nombre: "Profe Ana", email: "ana@pachuca.tecnm.mx", rol: "profesor", fecha_registro: "2026-08-01T10:00:00Z", ultimo_acceso: null, mundo_actual: 1, nivel_actual: 1, experiencia: 0, ultima_actividad: null },
  { usuario_id: ADMIN, nombre: "Admin Root", email: "root@pachuca.tecnm.mx", rol: "admin", fecha_registro: "2026-08-01T10:00:00Z", ultimo_acceso: null, mundo_actual: 1, nivel_actual: 1, experiencia: 0, ultima_actividad: null },
];
const gruposBD = [
  { clase_id: CLASE_A, nombre: "ISC-1A", codigo_acceso: "AAA111", profesor_nombre: "Profe Ana", alumnos: 3 },
  { clase_id: CLASE_B, nombre: "ISC-1B", codigo_acceso: "BBB222", profesor_nombre: "Profe Ana", alumnos: 2 },
];
const inscripcionesBD = [A.A1, A.A2, A.A3].map((e) => ({ clase_id: CLASE_A, estudiante_id: e })).concat([A.A4, A.A5].map((e) => ({ clase_id: CLASE_B, estudiante_id: e })));
// «Sin grupo»: A6 y A7.

const mediodia = (haceDias) => {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - haceDias);
  return d.toISOString();
};
const ej = (usuario, haceDias, resultado, codigo = null) => ({ user_id: usuario, created_at: mediodia(haceDias), resultado, codigo_error: codigo, mundo_id: 1, nivel_id: 1, fase_id: "1.1" });
const ejecucionesBD = [
  // ISC-1A: A1 (5: 3 éxitos, 2 errores), A2 (4: 1 éxito, 3 errores), A3 (0)  → 9 ejecuciones, 4 éxitos
  ej(A.A1, 0, "exito"), ej(A.A1, 0, "error_sintaxis", "SEM_001"),
  ej(A.A1, 1, "exito"), ej(A.A1, 1, "exito"), ej(A.A1, 1, "error_sintaxis", "SYN_006"),
  ej(A.A2, 2, "exito"), ej(A.A2, 2, "error_sintaxis", "SEM_001"), ej(A.A2, 2, "error_sintaxis", "SEM_001"), ej(A.A2, 2, "objetivo_no_alcanzado", "RUN_005"),
  // ISC-1B: A4 (6 éxitos), A5 (2 errores)  → 8 ejecuciones, 6 éxitos
  ...Array.from({ length: 6 }, () => ej(A.A4, 3, "exito")),
  ej(A.A5, 4, "error_sintaxis", "RUN_015"), ej(A.A5, 4, "error_sintaxis", "RUN_015"),
  // Sin grupo: A6 (3: 1 éxito, 2 errores) y A7 (0)  → 3 ejecuciones, 1 éxito
  ej(A.A6, 5, "exito"), ej(A.A6, 5, "error_sintaxis", "SYN_001"), ej(A.A6, 5, "error_sintaxis", "SYN_001"),
  // El profesor también juega: NO debe contar en ningún KPI (solo alumnos)
  ...Array.from({ length: 10 }, () => ej(PROFE, 0, "exito")),
];
const filasNivel1 = (usuario, intentos, pistas) => catalogo.niveles[1].fases.map((f) => ({ user_id: usuario, mundo_id: 1, nivel_id: 1, fase_id: f.id, completada: true, intentos, pistas_usadas: pistas }));
const progresoFasesBD = [...filasNivel1(A.A1, 1, 0), ...filasNivel1(A.A2, 1, 1), ...filasNivel1(A.A4, 3, 0)]; // A1: 3★, A2: 1★, A4: 2★ (verificado con calcularResumen)

// ================================================================ 1) lógica pura
console.log("Lógica del dashboard");
const usuariosApp = usuariosBD.map((r) => ({ id: r.usuario_id, nombre: r.nombre, rol: r.rol, mundo: r.mundo_actual }));
const membresias = construirMembresias(inscripcionesBD);
const resumenesApp = new Map(usuariosApp.map((u) => [u.id, calcularResumen(progresoFasesBD.filter((f) => f.user_id === u.id), catalogo)]));
const zona = Intl.DateTimeFormat().resolvedOptions().timeZone;
const datosApp = agregarEjecuciones(ejecucionesBD, { dias: 7, zona });
const nombres = (lista) => lista.map((u) => u.nombre);

await prueba("el filtro separa «Todos», «Sin grupo» y cada clase (solo alumnos en los grupos)", () => {
  assert.equal(usuariosDelFiltro(usuariosApp, "todos", membresias).length, 9);
  assert.deepEqual(nombres(usuariosDelFiltro(usuariosApp, valorFiltroClase(CLASE_A), membresias)), ["Alumno A1", "Alumno A2", "Alumno A3"]);
  assert.deepEqual(nombres(usuariosDelFiltro(usuariosApp, valorFiltroClase(CLASE_B), membresias)), ["Alumno A4", "Alumno A5"]);
  assert.deepEqual(nombres(usuariosDelFiltro(usuariosApp, "sin_grupo", membresias)), ["Alumno A6", "Alumno A7"], "ni el profesor ni el admin cuentan como «sin grupo»");
  assert.deepEqual(usuariosDelFiltro(usuariosApp, "clase:inexistente", membresias), []);
  assert.equal(alumnosDelFiltro(usuariosApp, "todos", membresias).length, 7, "en «Todos» los KPIs cuentan solo alumnos");
});
await prueba("KPIs por grupo (calculados a mano)", () => {
  const k = (f) => calcularKpis(alumnosDelFiltro(usuariosApp, f, membresias), resumenesApp, datosApp);
  const a = k(valorFiltroClase(CLASE_A));
  assert.deepEqual([a.alumnos, a.ejecuciones, a.exitos], [3, 9, 4]);
  assert.equal(a.estrellasPromedio, (3 + 1 + 0) / 3);
  assert.ok(Math.abs(a.tasaExito - (4 / 9) * 100) < 1e-9);
  const b = k(valorFiltroClase(CLASE_B));
  assert.deepEqual([b.alumnos, b.ejecuciones, b.exitos, b.estrellasPromedio, b.tasaExito], [2, 8, 6, 1, 75]);
  const s = k("sin_grupo");
  assert.deepEqual([s.alumnos, s.ejecuciones, s.exitos, s.estrellasPromedio], [2, 3, 1, 0]);
  const t = k("todos");
  assert.deepEqual([t.alumnos, t.ejecuciones, t.exitos], [7, 20, 11], "las 10 ejecuciones del profesor no cuentan");
  assert.equal(calcularKpis([], resumenesApp, datosApp).tasaExito, null, "sin ejecuciones no hay tasa (no divide entre 0)");
  assert.equal(calcularKpis([], resumenesApp, datosApp).estrellasPromedio, 0);
});
await prueba("top de errores: orden por total y desempate alfabético; máximo 5", () => {
  assert.deepEqual(plano(topErrores(alumnosDelFiltro(usuariosApp, valorFiltroClase(CLASE_A), membresias), datosApp)), [{ codigo: "SEM_001", total: 3 }, { codigo: "RUN_005", total: 1 }, { codigo: "SYN_006", total: 1 }]);
  assert.deepEqual(plano(topErrores(alumnosDelFiltro(usuariosApp, "todos", membresias), datosApp)).map((e) => e.codigo), ["SEM_001", "RUN_015", "SYN_001", "RUN_005", "SYN_006"]);
  const muchos = { errores: ["C1", "C2", "C3", "C4", "C5", "C6", "C7"].map((c, i) => ({ usuario_id: "x", codigo_error: c, total: 10 - i })) };
  assert.equal(topErrores([{ id: "x" }], muchos).length, 5);
});
await prueba("alumnos por mundo y ejecuciones por día (con ceros y en la zona horaria de quien mira)", () => {
  const A_ = alumnosDelFiltro(usuariosApp, valorFiltroClase(CLASE_A), membresias);
  assert.deepEqual(plano(alumnosPorMundo(A_, [1, 2, 3, 4, 5])), [{ mundo: 1, total: 2 }, { mundo: 2, total: 1 }, { mundo: 3, total: 0 }, { mundo: 4, total: 0 }, { mundo: 5, total: 0 }]);
  const hoy = diaLocal(Date.now(), zona);
  const dias = ejecucionesPorDia(A_, datosApp, hoy, 7);
  assert.equal(dias.length, 7);
  assert.equal(dias[6].dia, hoy);
  assert.deepEqual(dias.map((d) => d.total), [0, 0, 0, 0, 4, 3, 2], "hace 2 días: A2 (4) · ayer: A1 (3) · hoy: A1 (2)");
  // hace 5 días: A6 (3) · hace 4: A5 (2) · hace 3: A4 (6) · hace 2: A2 (4) · ayer: A1 (3) · hoy: A1 (2) — sin las 10 del profesor
  assert.deepEqual(ejecucionesPorDia(alumnosDelFiltro(usuariosApp, "todos", membresias), datosApp, hoy, 7).map((d) => d.total), [0, 3, 2, 6, 4, 3, 2]);
  assert.equal(sumarDias("2026-03-01", -1), "2026-02-28");
  assert.equal(sumarDias("2026-12-31", 1), "2027-01-01");
  assert.match(etiquetaDia("2026-11-02"), /lun/);
  assert.equal(diaLocal("2026-11-02T03:00:00Z", "America/Mexico_City"), "2026-11-01", "a las 03:00 UTC en México aún es el día anterior");
});

// ================================================================ 2) admin.html en jsdom
console.log("Panel de administración (admin.html)");
const STUBS = {
  supabase: `export const supabase = globalThis.__supabase; export const configuracionValida = true; export const HOST_SUPABASE = "test";`,
  auth: `export async function protegerPagina() { return globalThis.__perfil; }
         export async function exigirAdmin() { return globalThis.__perfil; }
         export function mensajeRpc(e, d) { return d; }
         export async function obtenerPerfil() { return globalThis.__perfil; }`,
  nav: `export async function renderizarNav() {}`,
  catalogo: `import { construirCatalogo } from "${RAIZ}/js/persistence/progreso.js";
    export const catalogo = construirCatalogo(globalThis.__niveles);
    export const NIVELES_POR_MUNDO = Object.fromEntries(Object.values(catalogo.mundos).map((m) => [m.id, m.niveles.length]));
    export const TOTAL_NIVELES = catalogo.totalNiveles; export const MAX_ESTRELLAS = catalogo.maxEstrellas;
    export function mundoDeNivel(id) { return catalogo.niveles[id]?.mundo ?? 1; }`,
};
const BUNDLE = (
  await build({
    entryPoints: [resolve(RAIZ, "js/admin.js")],
    bundle: true,
    format: "iife",
    platform: "browser",
    write: false,
    logLevel: "silent",
    plugins: [
      {
        name: "stubs",
        setup(b) {
          const mapa = [[/(^|\/)supabase\.js$/, "supabase"], [/(^|\/)auth\.js$/, "auth"], [/(^|\/)nav\.js$/, "nav"], [/game\/catalogo\.js$/, "catalogo"]];
          b.onResolve({ filter: /.*/ }, (a) => {
            const m = mapa.find(([re]) => re.test(a.path));
            return m ? { path: m[1], namespace: "stub" } : null;
          });
          b.onLoad({ filter: /.*/, namespace: "stub" }, (a) => ({ contents: STUBS[a.path], loader: "js", resolveDir: RAIZ }));
        },
      },
    ],
  })
).outputFiles[0].text;
const HTML = readFileSync(resolve(RAIZ, "admin.html"), "utf8").replace(/<script[\s\S]*?<\/script>/g, "").replace(/<link[^>]*>/g, "");

// ---- Supabase simulado
const FALTA = { code: "PGRST202", message: "Could not find the function public.x in the schema cache" };
function crearSupabase({ sql = true, ejecuciones = ejecucionesBD } = {}) {
  const registro = { ejecucionesIn: [], consultasEjecuciones: 0, rpcs: [] };
  const tablas = { progreso_fases: progresoFasesBD, ejecuciones, perfiles: [] };
  const rpcs = {
    admin_listar_usuarios: () => ({ data: usuariosBD }),
    admin_grupos: () => (sql ? { data: gruposBD } : { error: FALTA }),
    admin_inscripciones: () => (sql ? { data: inscripcionesBD } : { error: FALTA }),
    admin_dashboard_datos: (args) => (sql ? { data: agregarEjecuciones(ejecuciones, { dias: args.p_dias, zona: args.p_zona }) } : { error: FALTA }),
    admin_errores_por_usuario: () => ({
      data: Object.values(A).map((id) => {
        const mias = ejecuciones.filter((e) => e.user_id === id);
        return { usuario_id: id, total_ejecuciones: mias.length, total_errores: mias.filter((e) => e.resultado !== "exito").length, error_mas_frecuente: mias.find((e) => e.codigo_error)?.codigo_error ?? null };
      }),
    }),
  };
  const constructor = (obtenerFilas, esRpc = false) => {
    const q = { filtros: [], rango: null, contar: false, cabeza: false };
    const api = {
      select(_cols, op = {}) { q.contar = op.count === "exact"; q.cabeza = op.head === true; return api; },
      eq(k, v) { q.filtros.push((r) => String(r[k]) === String(v)); return api; },
      in(k, vs) { q.filtros.push((r) => vs.includes(r[k])); q.enLista = vs; return api; },
      like(k, p) { q.filtros.push((r) => String(r[k]).startsWith(p.replace("%", ""))); return api; },
      gte() { return api; }, lte() { return api; }, order() { return api; }, limit() { return api; },
      range(a, b) { q.rango = [a, b]; return api; },
      maybeSingle: async () => ({ data: obtenerFilas().filter((r) => q.filtros.every((f) => f(r)))[0] ?? null, error: null }),
      then(ok, err) {
        const r = obtenerFilas();
        if (r.error) return Promise.resolve({ data: null, error: r.error }).then(ok, err);
        const filas = r.filter((x) => q.filtros.every((f) => f(x)));
        if (q.enLista && !esRpc) registro.ejecucionesIn.push(q.enLista);
        const data = q.rango ? filas.slice(q.rango[0], q.rango[1] + 1) : filas;
        return Promise.resolve({ data: q.cabeza ? null : data, error: null, count: filas.length }).then(ok, err);
      },
    };
    return api;
  };
  return {
    registro,
    auth: { getSession: async () => ({ data: { session: { user: { id: ADMIN } } } }), getUser: async () => ({ data: { user: { id: ADMIN } }, error: null }), onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }) },
    from(tabla) {
      if (tabla === "ejecuciones") registro.consultasEjecuciones += 1;
      return constructor(() => tablas[tabla] || []);
    },
    rpc(nombre, args = {}) {
      registro.rpcs.push(nombre);
      const f = rpcs[nombre];
      const resultado = f ? f(args) : { error: FALTA };
      const base = constructor(() => (resultado.error ? Object.assign([], { error: resultado.error }) : resultado.data), true);
      if (!Array.isArray(resultado.data) && !resultado.error) {
        // resultado no tabular (jsonb): se devuelve tal cual, sin paginar
        return Promise.resolve({ data: resultado.data, error: null });
      }
      return base;
    },
  };
}

// ---- Chart.js falso: registra la configuración y los datos de cada gráfica
class ChartFalso {
  constructor(canvas, config) {
    this.canvas = canvas;
    this.config = config;
    this.data = config.data;
    this.actualizaciones = 0;
    ChartFalso.instancias.push(this);
  }
  update() { this.actualizaciones += 1; }
  destroy() {}
}
ChartFalso.defaults = { font: {} };

async function abrir({ sql = true, chart = true, bd = crearSupabase({ sql }) } = {}) {
  ChartFalso.instancias = [];
  const errores = [];
  const consola = new VirtualConsole();
  consola.on("jsdomError", (e) => errores.push(e.message));
  const dom = new JSDOM(HTML, { url: "http://localhost/admin.html", runScripts: "outside-only", pretendToBeVisual: true, virtualConsole: consola });
  const w = dom.window;
  const descargas = [];
  const blobs = [];
  w.__supabase = bd;
  w.__perfil = { user_id: ADMIN, nombre: "Admin Root", email: "root@pachuca.tecnm.mx", rol: "admin" };
  w.__niveles = NIVELES;
  if (chart) w.Chart = ChartFalso;
  w.Blob = class { constructor(partes, op) { this.texto = partes.join(""); this.type = op?.type; blobs.push(this); } };
  w.URL.createObjectURL = (b) => `blob:${blobs.indexOf(b)}`;
  w.URL.revokeObjectURL = () => {};
  w.HTMLAnchorElement.prototype.click = function () { descargas.push({ nombre: this.download, indice: Number(this.href.replace("blob:", "")) }); };
  w.console.error = () => {};
  w.console.warn = () => {};
  w.eval(BUNDLE);
  const $ = (id) => w.document.getElementById(id);
  const esperar = async (cond, ms = 3000) => {
    const fin = Date.now() + ms;
    while (Date.now() < fin) {
      if (cond()) return true;
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, 15));
    }
    return false;
  };
  await esperar(() => !$("kpis").textContent.includes("Cargando"));
  await new Promise((r) => setTimeout(r, 30));
  const kpis = () => Object.fromEntries([...w.document.querySelectorAll(".kpi-tarjeta")].map((t) => [t.querySelector(".kpi-titulo").textContent, t.querySelector(".kpi-valor").textContent.replace(/\s+/g, " ").trim()]));
  const elegir = (valor) => { $("filtro-grupos").value = valor; $("filtro-grupos").dispatchEvent(new w.Event("change", { bubbles: true })); };
  const graficas = () => ({ errores: ChartFalso.instancias[0], mundos: ChartFalso.instancias[1], dias: ChartFalso.instancias[2] });
  const ultimoCsv = async () => {
    const d = descargas.at(-1);
    return d ? { nombre: d.nombre, texto: blobs[d.indice].texto } : null;
  };
  return { w, $, bd, errores, esperar, kpis, elegir, graficas, descargas, ultimoCsv };
}
const filasCsv = (texto) => texto.replace(/^\ufeff/, "").split(/\r?\n/).filter(Boolean);

await prueba("PANTALLA: filtro arriba con «Todos», «Sin grupo» y los grupos; 4 KPIs y 3 gráficas; exportar está en el dashboard", async () => {
  const j = await abrir();
  const sel = j.$("filtro-grupos");
  assert.deepEqual([...sel.options].map((o) => o.textContent), ["Todos los usuarios", "Sin grupo asignado", "ISC-1A (3 alumnos)", "ISC-1B (2 alumnos)"]);
  assert.equal(sel.querySelector("optgroup").label, "Grupos");
  assert.ok(sel.compareDocumentPosition(j.$("seccion-resumen")) & 4, "el filtro va antes que el contenido");
  assert.deepEqual(Object.keys(j.kpis()), ["Total de alumnos", "Estrellas promedio", "Ejecuciones totales", "Tasa de éxito"]);
  assert.equal(ChartFalso.instancias.length, 3);
  assert.deepEqual(ChartFalso.instancias.map((c) => c.config.type), ["bar", "doughnut", "line"]);
  assert.ok(j.$("seccion-resumen").contains(j.$("btn-exportar")), "el botón de exportar está en la vista Dashboard");
  assert.equal(j.$("seccion-usuarios").querySelector("#btn-exportar"), null, "y ya no en Usuarios");
  assert.equal(j.errores.length, 0);
  j.w.close();
});

await prueba("TODOS: KPIs solo con alumnos (sin el profesor) y gráficas con todos los datos", async () => {
  const j = await abrir();
  assert.deepEqual(j.kpis(), { "Total de alumnos": "7", "Estrellas promedio": "★ 0.9", "Ejecuciones totales": "20", "Tasa de éxito": "55.0%" });
  // estrellas: A1 3 + A2 1 + A4 2 = 6 entre 7 alumnos = 0,857 → 0,9
  const g = j.graficas();
  assert.deepEqual(plano(g.errores.data.labels), ["SEM_001", "RUN_015", "SYN_001", "RUN_005", "SYN_006"]);
  assert.deepEqual(plano(g.errores.data.datasets[0].data), [3, 2, 2, 1, 1]);
  assert.deepEqual(plano(g.mundos.data.datasets[0].data), [4, 1, 1, 1, 0], "A1, A2, A6 y A7 en el mundo 1; A3 en el 2; A4 en el 3; A5 en el 4; nadie en el 5");
  assert.deepEqual(plano(g.dias.data.datasets[0].data), [0, 3, 2, 6, 4, 3, 2]);
  assert.equal(g.dias.data.labels.length, 7);
  assert.match(g.mundos.data.labels[0], /^Mundo 1 · /);
  j.w.close();
});

await prueba("GRUPO ISC-1A: al elegirlo se actualizan los KPIs y las 3 gráficas al instante", async () => {
  const j = await abrir();
  const antes = ChartFalso.instancias.map((c) => c.actualizaciones);
  j.elegir(`clase:${CLASE_A}`);
  assert.deepEqual(j.kpis(), { "Total de alumnos": "3", "Estrellas promedio": "★ 1.3", "Ejecuciones totales": "9", "Tasa de éxito": "44.4%" });
  const g = j.graficas();
  assert.deepEqual(plano(g.errores.data.labels), ["SEM_001", "RUN_005", "SYN_006"]);
  assert.deepEqual(plano(g.errores.data.datasets[0].data), [3, 1, 1]);
  assert.deepEqual(plano(g.mundos.data.datasets[0].data), [2, 1, 0, 0, 0]);
  assert.deepEqual(plano(g.dias.data.datasets[0].data), [0, 0, 0, 0, 4, 3, 2]);
  assert.ok(ChartFalso.instancias.every((c, i) => c.actualizaciones > antes[i]), "las tres gráficas se redibujaron");
  assert.match(j.$("filtro-detalle").textContent, /Profesor: Profe Ana · código AAA111 · 3 alumnos/);
  j.w.close();
});

await prueba("GRUPO ISC-1B y SIN GRUPO", async () => {
  const j = await abrir();
  j.elegir(`clase:${CLASE_B}`);
  assert.deepEqual(j.kpis(), { "Total de alumnos": "2", "Estrellas promedio": "★ 1.0", "Ejecuciones totales": "8", "Tasa de éxito": "75.0%" });
  j.elegir("sin_grupo");
  assert.deepEqual(j.kpis(), { "Total de alumnos": "2", "Estrellas promedio": "★ 0.0", "Ejecuciones totales": "3", "Tasa de éxito": "33.3%" });
  assert.deepEqual(plano(j.graficas().errores.data.labels), ["SYN_001"]);
  assert.match(j.$("filtro-detalle").textContent, /no están inscritos en ninguna clase: 2/);
  j.w.close();
});

await prueba("SIN EJECUCIONES: la tasa de éxito muestra «—» (no divide entre 0) y cada gráfica muestra su aviso de vacío", async () => {
  const j = await abrir({ bd: crearSupabase({ ejecuciones: [] }) });
  assert.deepEqual(j.kpis(), { "Total de alumnos": "7", "Estrellas promedio": "★ 0.9", "Ejecuciones totales": "0", "Tasa de éxito": "—" });
  for (const id of ["errores", "mundos", "dias"]) {
    if (id === "mundos") continue; // hay alumnos: la dona sí tiene datos
    assert.equal(j.$(`vacia-${id}`).classList.contains("oculto"), false, `aviso de ${id}`);
    assert.equal(j.$(`grafica-${id}`).classList.contains("oculto"), true, `canvas de ${id} escondido`);
  }
  assert.equal(j.$("vacia-mundos").classList.contains("oculto"), true);
  // un grupo sin alumnos: la dona también avisa
  j.elegir("sin_grupo");
  assert.equal(j.kpis()["Tasa de éxito"], "—");
  j.w.close();
  // con datos, los avisos se esconden
  const k = await abrir();
  assert.ok(["errores", "mundos", "dias"].every((id) => k.$(`vacia-${id}`).classList.contains("oculto")));
  k.w.close();
});

await prueba("TABLAS: Usuarios solo muestra al grupo, y el selector de Ejecuciones también", async () => {
  const j = await abrir();
  const nombresTabla = () => [...j.w.document.querySelectorAll("#tabla-usuarios tbody tr td:first-child")].map((td) => td.textContent.replace("tú", "").trim());
  assert.equal(nombresTabla().length, 9);
  j.elegir(`clase:${CLASE_A}`);
  assert.deepEqual(nombresTabla(), ["Alumno A1", "Alumno A2", "Alumno A3"]);
  assert.match(j.$("usuarios-conteo").textContent, /3 de 3 usuarios · ISC-1A/);
  assert.deepEqual([...j.$("e-usuario").options].slice(1).map((o) => o.textContent.split(" (")[0]), ["Alumno A1", "Alumno A2", "Alumno A3"]);
  j.elegir("sin_grupo");
  assert.deepEqual(nombresTabla(), ["Alumno A6", "Alumno A7"]);
  j.elegir("todos");
  assert.equal(nombresTabla().length, 9);
  assert.match(j.$("usuarios-conteo").textContent, /^9 de 9 usuarios$/);
  j.w.close();
});

await prueba("EJECUCIONES: con un grupo seleccionado la consulta solo pide a esos alumnos (y sin grupo, sin filtro)", async () => {
  const j = await abrir();
  j.elegir(`clase:${CLASE_B}`);
  j.w.document.querySelector('.admin-pestana[data-seccion="ejecuciones"]').click();
  await j.esperar(() => j.bd.registro.ejecucionesIn.length > 0);
  assert.deepEqual(plano(j.bd.registro.ejecucionesIn.at(-1).sort()), [A.A4, A.A5].sort());
  j.elegir("todos");
  const antes = j.bd.registro.ejecucionesIn.length;
  await new Promise((r) => setTimeout(r, 100));
  assert.equal(j.bd.registro.ejecucionesIn.length, antes, "con «Todos» no se filtra por usuario");
  j.w.close();
});

await prueba("EXPORTAR CSV: solo el grupo seleccionado (no todo el sistema) y con su nombre en el archivo", async () => {
  const j = await abrir();
  j.elegir(`clase:${CLASE_A}`);
  j.$("btn-exportar").click();
  await j.esperar(() => j.descargas.length === 1);
  let csv = await j.ultimoCsv();
  assert.match(csv.nombre, /^codequest-isc-1a-\d{4}-\d{2}-\d{2}\.csv$/);
  let filas = filasCsv(csv.texto);
  assert.equal(filas.length, 1 + 3, "encabezado + los 3 alumnos de ISC-1A");
  assert.ok(["Alumno A1", "Alumno A2", "Alumno A3"].every((nombre) => csv.texto.includes(nombre)));
  assert.ok(["Alumno A4", "Alumno A6", "Profe Ana", "Admin Root"].every((nombre) => !csv.texto.includes(nombre)), "nadie de fuera del grupo");

  j.elegir("sin_grupo");
  j.$("btn-exportar").click();
  await j.esperar(() => j.descargas.length === 2);
  csv = await j.ultimoCsv();
  assert.match(csv.nombre, /^codequest-sin-grupo-asignado-/);
  assert.equal(filasCsv(csv.texto).length, 1 + 2);

  j.elegir("todos");
  j.$("btn-exportar").click();
  await j.esperar(() => j.descargas.length === 3);
  csv = await j.ultimoCsv();
  assert.match(csv.nombre, /^codequest-todos-/);
  assert.equal(filasCsv(csv.texto).length, 1 + 9, "todos: alumnos, profesor y admin como antes");
  j.w.close();
});

await prueba("el texto debajo del botón dice cuántos usuarios y de qué grupo se exportan", async () => {
  const j = await abrir();
  j.elegir(`clase:${CLASE_A}`);
  assert.match(j.$("exportar-detalle").textContent, /Se exportarán 3 usuarios de: ISC-1A/);
  j.elegir("sin_grupo");
  assert.match(j.$("exportar-detalle").textContent, /Se exportarán 2 usuarios de: Sin grupo asignado/);
  j.w.close();
});

await prueba("SIN LAS FUNCIONES SQL: sigue funcionando (KPIs con las filas de ejecuciones), «Sin grupo» se deshabilita y se avisa cómo instalarlas", async () => {
  const j = await abrir({ sql: false });
  assert.deepEqual(j.kpis(), { "Total de alumnos": "7", "Estrellas promedio": "★ 0.9", "Ejecuciones totales": "20", "Tasa de éxito": "55.0%" });
  const sin = [...j.$("filtro-grupos").options].find((o) => o.value === "sin_grupo");
  assert.equal(sin.disabled, true);
  assert.equal(j.$("filtro-grupos").querySelector("optgroup"), null);
  assert.match(j.$("admin-aviso").textContent, /avance3_3\.sql/);
  assert.match(j.$("filtro-detalle").textContent, /avance3_3\.sql/);
  j.w.close();
});

await prueba("SIN INTERNET (Chart.js no cargó): los números y las tablas funcionan y se explica por qué faltan las gráficas", async () => {
  const j = await abrir({ chart: false });
  assert.equal(j.$("graficas-aviso").classList.contains("oculto"), false);
  assert.match(j.$("graficas-aviso").textContent, /No se pudieron cargar las gráficas/);
  assert.equal(j.kpis()["Total de alumnos"], "7");
  j.elegir(`clase:${CLASE_A}`);
  assert.equal(j.kpis()["Total de alumnos"], "3");
  assert.equal(j.errores.length, 0);
  j.w.close();
});

await prueba("el filtro se esconde en Auditoría y Configuración (no aplica) y vuelve en las demás", async () => {
  const j = await abrir();
  const ir = (s) => j.w.document.querySelector(`.admin-pestana[data-seccion="${s}"]`).click();
  ir("config");
  assert.ok(j.$("admin-filtro").classList.contains("oculto"));
  ir("usuarios");
  assert.ok(!j.$("admin-filtro").classList.contains("oculto"));
  ir("auditoria");
  assert.ok(j.$("admin-filtro").classList.contains("oculto"));
  ir("resumen");
  assert.ok(!j.$("admin-filtro").classList.contains("oculto"));
  j.w.close();
});

console.log(`\n${n} pruebas correctas.`);
process.exit(0);
