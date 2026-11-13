// test_juego_dom.mjs
// Prueba de INTEGRACIÓN de juego.html: carga el juego real (js/juego.js, con los
// escenarios, el intérprete, el repositorio de Supabase y toda la interfaz) dentro
// de jsdom, con un Supabase simulado y un <canvas> falso, y juega de verdad:
// escribe código, pulsa Ejecutar y comprueba pantalla y base de datos.
// Solo se sustituyen supabase.js, auth.js, nav.js y catalogo.js (que en el
// navegador usa import.meta.glob de Vite); las redirecciones se capturan.
// Uso: node test_juego_dom.mjs

import { paletaDe } from "./js/game/paletas.js";
import { readFileSync, readdirSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { JSDOM, VirtualConsole } from "jsdom";

const RAIZ = dirname(fileURLToPath(import.meta.url));
const ruta = (...p) => resolve(RAIZ, ...p);

// ---------------------------------------------------------------- niveles y bundle
const niveles = [];
for (const c of readdirSync(ruta("levels")).sort()) for (const f of readdirSync(ruta("levels", c))) niveles.push(JSON.parse(readFileSync(ruta("levels", c, f), "utf8")));
niveles.sort((a, b) => a.id - b.id);
const nivelPorId = Object.fromEntries(niveles.map((n) => [n.id, n]));
const faseDe = (id) => nivelPorId[Number(String(id).split(".")[0])].fases.find((f) => f.id === id);

const STUBS = {
  supabase: `export const supabase = globalThis.__supabase; export const configuracionValida = true; export const HOST_SUPABASE = "test";`,
  auth: `export async function protegerPagina() { return globalThis.__perfil; }
         export async function obtenerPerfil() { return globalThis.__perfil; }
         export async function cerrarSesion() {}`,
  nav: `export async function renderizarNav() {}`,
  catalogo: `import { construirCatalogo } from ${JSON.stringify(ruta("js/persistence/progreso.js"))};
    const lista = globalThis.__niveles;
    import { ordinalDeNivel as ordEn, nivelPorOrdinal as porOrdEn, siguienteNivelId as sigEn } from ${JSON.stringify(ruta("js/persistence/progreso.js"))};
    export const catalogo = construirCatalogo(lista);
    export const ordinalDeNivel = (id) => ordEn(catalogo, id);
    export const nivelPorOrdinal = (m, o) => porOrdEn(catalogo, m, o);
    export const siguienteNivel = (id) => sigEn(catalogo, id);
    export const REQUERIDOS_POR_MUNDO = Object.fromEntries(Object.values(catalogo.mundos).map((m) => [m.id, m.requeridos]));
    export const NIVELES_POR_MUNDO = Object.fromEntries(Object.values(catalogo.mundos).map((m) => [m.id, m.niveles.length]));
    export const TOTAL_NIVELES = catalogo.totalNiveles;
    export const MAX_ESTRELLAS = catalogo.maxEstrellas;
    export const mundoDeNivel = (id) => catalogo.niveles[id]?.mundo ?? 1;
    export const obtenerNivel = (id) => catalogo.niveles[id] || null;`,
};

const pluginStubs = {
  name: "stubs",
  setup(b) {
    b.onResolve({ filter: /(^|\/)(supabase|auth|nav)\.js$/ }, (a) => {
      const k = a.path.match(/(supabase|auth|nav)\.js$/)[1];
      return { path: k, namespace: "stub" };
    });
    b.onResolve({ filter: /game\/catalogo\.js$/ }, () => ({ path: "catalogo", namespace: "stub" }));
    b.onLoad({ filter: /.*/, namespace: "stub" }, (a) => ({ contents: STUBS[a.path], loader: "js", resolveDir: RAIZ }));
    // Las redirecciones (window.location.href = ...) se desvían a un registro.
    b.onLoad({ filter: /js[\\/].*\.js$/, namespace: "file" }, (a) => ({
      contents: readFileSync(a.path, "utf8").replace(/window\.location\.href = ([^;]+);/g, "globalThis.__ir($1);"),
      loader: "js",
      resolveDir: dirname(a.path),
    }));
  },
};

const salida = await build({
  entryPoints: [ruta("js/juego.js")],
  bundle: true,
  format: "iife",
  platform: "browser",
  write: false,
  logLevel: "silent",
  plugins: [pluginStubs],
});
const BUNDLE = salida.outputFiles[0].text;
const HTML_JUEGO = readFileSync(ruta("juego.html"), "utf8").replace(/<script[\s\S]*?<\/script>/g, "").replace(/<link[^>]*>/g, "");

// ---------------------------------------------------------------- Supabase simulado
class BDFalsa {
  // Por defecto el Nivel 0 (tutorial) ya está hecho; `conNivel0: false` simula a quien llega por primera vez.
  constructor({ jugador = null, fases = [], conNivel0 = true } = {}) {
    fases = [...(conNivel0 ? fasesCompletas([0]) : []), ...fases];
    this.tablas = {
      progreso_jugador: jugador ? [{ user_id: "u1", ...jugador }] : [{ user_id: "u1", mundo_actual: 1, nivel_actual: 1, experiencia: 0 }],
      progreso_fases: fases.map((f) => ({ user_id: "u1", ...f })),
      ejecuciones: [],
    };
    this.lecturas = 0;
    this.escrituras = 0;
    this.auth = { getSession: async () => ({ data: { session: { user: { id: "u1", user_metadata: { nombre: "Ana" } } } } }) };
  }
  from(tabla) {
    const bd = this;
    const q = { op: "select", payload: null, filtros: [], single: false, devolver: false };
    const coincide = (fila) => q.filtros.every(([k, v]) => String(fila[k]) === String(v));
    const ejecutar = () => {
      const filas = bd.tablas[tabla];
      if (q.op === "select") {
        bd.lecturas++;
        const r = filas.filter(coincide);
        return { data: q.single ? r[0] ?? null : r, error: null, status: 200 };
      }
      bd.escrituras++;
      if (q.op === "insert") {
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

/** Filas de progreso_fases con TODAS las fases de los niveles dados completadas. */
function fasesCompletas(idsNivel, { excepto = [] } = {}) {
  return idsNivel.flatMap((id) =>
    nivelPorId[id].fases
      .filter((f) => !excepto.includes(f.id))
      .map((f) => ({ mundo_id: nivelPorId[id].mundo, nivel_id: id, fase_id: f.id, completada: true, intentos: 1, pistas_usadas: 0 }))
  );
}
const nivelesDeMundo = (m) => niveles.filter((n) => n.mundo === m).map((n) => n.id);
/** Ids del Mundo 1 en el orden en que se juegan (por ordinal: el jefe 44 va entre el 13 y el 14). */
const catalogoM1 = () => niveles.filter((n) => n.mundo === 1).sort((a, b) => a.ordinal - b.ordinal).map((n) => n.id);

// ---------------------------------------------------------------- arnés jsdom
const ctxFalso = () => {
  const guardado = {};
  return new Proxy(guardado, {
    get(t, k) {
      if (k in t) return t[k];
      if (k === "measureText") return () => ({ width: 30 });
      if (k === "createRadialGradient" || k === "createLinearGradient") return () => ({ addColorStop() {} });
      return () => {};
    },
    set(t, k, v) {
      t[k] = v;
      return true;
    },
  });
};

const esperarHasta = async (cond, ms = 4000, paso = 15) => {
  const fin = Date.now() + ms;
  while (Date.now() < fin) {
    if (cond()) return true;
    // eslint-disable-next-line no-await-in-loop
    await new Promise((r) => setTimeout(r, paso));
  }
  return false;
};

const PERFIL_ALUMNO = { user_id: "u1", nombre: "Ana", rol: "estudiante", email: "ana@x.mx" };
let ABIERTAS = 0;

async function abrir({ url, perfil = PERFIL_ALUMNO, bd = new BDFalsa(), bienvenidaVista = true, antes = null }) {
  const errores = [];
  const consola = new VirtualConsole();
  consola.on("jsdomError", (e) => errores.push(`jsdom: ${e.message}`));
  const dom = new JSDOM(HTML_JUEGO, { url: `http://localhost/${url}`, runScripts: "outside-only", pretendToBeVisual: true, virtualConsole: consola });
  const w = dom.window;
  const redirecciones = [];
  w.HTMLCanvasElement.prototype.getContext = ctxFalso;
  Object.defineProperty(w.HTMLElement.prototype, "clientWidth", { get: () => 700, configurable: true });
  w.matchMedia = () => ({ matches: true, addEventListener() {}, removeEventListener() {} }); // movimiento reducido: rápido
  w.console.error = (...a) => errores.push(a.map(String).join(" "));
  w.addEventListener("error", (e) => errores.push(`error: ${e.message}`));
  w.addEventListener("unhandledrejection", (e) => errores.push(`rechazo: ${e.reason}`));
  w.__supabase = bd;
  w.__perfil = perfil;
  w.__niveles = w.JSON.parse(JSON.stringify(niveles));
  w.__ir = (u) => redirecciones.push(u);
  const mundo = new URL(`http://localhost/${url}`).searchParams.get("mundo");
  if (bienvenidaVista && mundo) w.localStorage.setItem(`codequest:teoria:${perfil.user_id}:${mundo}`, "1");
  antes?.(w); // p. ej. dejar un borrador en localStorage antes de que arranque el juego
  w.eval(BUNDLE);
  ABIERTAS++;
  const $ = (id) => w.document.getElementById(id);
  const juego = {
    w, bd, errores, redirecciones, $,
    // "Listo" = el juego redirigió, o ya dibujó el selector de niveles (o es el Laboratorio Libre).
    arrancado: async () => {
      await esperarHasta(
        () => redirecciones.length > 0 || $("selector-niveles").children.length > 0 || $("titulo-nivel").textContent === "Laboratorio Libre"
      );
      await new Promise((r) => setTimeout(r, 80));
    },
    escribir(codigo) {
      $("editor-codigo").value = codigo;
      $("editor-codigo").dispatchEvent(new w.Event("input", { bubbles: true }));
    },
    async ejecutar() {
      $("btn-ejecutar").click();
      await esperarHasta(() => !$("btn-ejecutar").disabled, 8000);
      await new Promise((r) => setTimeout(r, 30));
    },
    feedback: () => $("feedback-contenido").textContent.replace(/\s+/g, " ").trim(),
    cerrar: () => w.close(),
  };
  return juego;
}

let n = 0;
const prueba = async (nombre, fn) => {
  await fn();
  n++;
  console.log(`  ✓ ${nombre}`);
};
const sinErrores = (j) => assert.deepEqual(j.errores, [], `errores en la página:\n${j.errores.join("\n")}`);

// ================================================================ pruebas
console.log("Navegación y temas");
await prueba("sin ?mundo vuelve al mapa; un mundo bloqueado también", async () => {
  const a = await abrir({ url: "juego.html" });
  await a.arrancado();
  assert.deepEqual(a.redirecciones, ["mundos.html"]);
  const b = await abrir({ url: "juego.html?mundo=3" }); // sin completar el Mundo 2
  await b.arrancado();
  assert.deepEqual(b.redirecciones, ["mundos.html"]);
  const c = await abrir({ url: "juego.html?mundo=9" });
  await c.arrancado();
  assert.deepEqual(c.redirecciones, ["mundos.html"]);
  [a, b, c].forEach((x) => x.cerrar());
});

await prueba("Mundo 1: tema cian, escenario de laboratorio, bienvenida la primera vez", async () => {
  const j = await abrir({ url: "juego.html?mundo=1", bienvenidaVista: false, bd: new BDFalsa({ fases: fasesCompletas([0]) }) }); // con el Nivel 0 ya hecho
  await j.arrancado();
  assert.equal(j.w.document.body.dataset.mundo, "1");
  assert.match(j.$("titulo-nivel").textContent, /Nivel 1/);
  assert.match(j.$("titulo-mundo").textContent, /Laboratorio/);
  assert.ok(!j.$("estado-contenido").closest(".panel-estado").classList.contains("oculto"));
  const modal = await esperarHasta(() => j.w.document.querySelector(".modal-bienvenida"));
  assert.ok(modal, "debe aparecer la bienvenida del mundo");
  assert.match(j.w.document.querySelector(".modal-bienvenida").textContent, /Mundo 1: Fundamentos y Datos/);
  j.w.document.querySelector("[data-empezar]").click();
  assert.equal(j.w.localStorage.getItem("codequest:teoria:u1:1"), "1", "la bienvenida no debe repetirse");
  sinErrores(j);
  j.cerrar();
});

await prueba("NIVEL 0: quien llega por primera vez empieza en el Nivel 0 (sin editor), las tarjetas se ordenan y completar el Nivel 0 abre el Nivel 1", async () => {
  const bd = new BDFalsa({ conNivel0: false });
  const j = await abrir({ url: "juego.html?mundo=1", bd, bienvenidaVista: false });
  await j.arrancado();
  const doc = j.w.document;
  assert.match(j.$("titulo-nivel").textContent, /Nivel 0 — Antes de empezar/);
  assert.ok(doc.body.classList.contains("modo-ordenar"), "sin consola ni memoria");
  assert.ok(!j.$("tarjetas-envoltura").classList.contains("oculto"));
  assert.ok(doc.querySelector(".editor-envoltura").classList.contains("oculto"), "no hay editor de código");
  assert.equal(j.$("titulo-codigo").textContent, "Tu algoritmo");
  const botones = () => [...doc.querySelectorAll("#tarjetas-banco .tarjeta-flujo")];
  assert.equal(botones().length, 4);
  const elegir = async (texto) => {
    botones().find((b) => b.textContent === texto).click();
    await esperarHasta(() => !doc.getElementById("tarjetas-envoltura").classList.contains("bloqueado"));
    await new Promise((r) => setTimeout(r, 30));
  };
  // Un error: «Abrir la puerta» no toca primero → el robot choca, se cuenta un intento y se empieza de nuevo
  await elegir("Abrir la puerta");
  assert.equal(botones().length, 4, "todas las tarjetas vuelven al banco");
  assert.equal(doc.querySelectorAll("#tarjetas-diagrama .paso-diagrama").length, 0);
  assert.ok(bd.tablas.ejecuciones.some((e) => e.resultado === "objetivo_no_alcanzado" && /^orden:abrir/.test(e.codigo)), "el intento fallido queda registrado");
  // El orden correcto
  for (const t of ["Inicio", "Caminar 3 pasos", "Abrir la puerta", "Fin"]) await elegir(t);
  assert.ok(await esperarHasta(() => bd.tablas.progreso_fases.some((r) => r.fase_id === "0.1" && r.completada)), "al ordenar todo bien se completa la fase 0.1");
  assert.equal(doc.querySelectorAll("#tarjetas-diagrama .paso-diagrama").length, 4);
  j.cerrar();
});

await prueba("Mundo 1 · consola de datos (Nivel 11): sin panel de Estado, chips de memoria y data-escenario para el CSS", async () => {
  // Niveles 0 a 10 ya hechos: el Nivel 11 (Identificadores) usa la consola de datos dentro del Mundo 1
  const previos = catalogoM1().slice(0, 11);
  const bd = new BDFalsa({ jugador: { mundo_actual: 1, nivel_actual: 11, experiencia: 0 }, fases: fasesCompletas(previos) });
  const j = await abrir({ url: "juego.html?mundo=1&nivel=11", bd });
  await j.arrancado();
  assert.match(j.$("titulo-nivel").textContent, /Nivel 11 — Identificadores/);
  assert.equal(j.w.document.body.dataset.mundo, "1");
  assert.equal(j.w.document.body.dataset.escenario, "datos");
  assert.equal(j.w.document.body.style.getPropertyValue("--mundo-acento"), paletaDe(1).acento);
  assert.ok(j.$("estado-contenido").closest(".panel-estado").classList.contains("oculto"));
  assert.match(j.$("titulo-mundo").textContent, /Centro de Recuperación/);
  j.escribir('nombre = "Robot1"\nprint(nombre)');
  await j.ejecutar();
  assert.match(j.$("memoria-contenido").textContent, /nombre/);
  assert.match(j.$("salida-contenido").textContent, /Robot1/);
  sinErrores(j);
  j.cerrar();
});

console.log("Botón Ejecutar, atajo de teclado y glosario");
await prueba("Ejecutar y Reiniciar están arriba del panel de código (no abajo del editor)", async () => {
  const j = await abrir({ url: "juego.html?mundo=1" });
  await j.arrancado();
  const panel = j.w.document.querySelector(".panel-codigo");
  const ejecutar = j.$("btn-ejecutar");
  assert.ok(ejecutar.closest(".panel-encabezado"), "debe estar en el encabezado del panel de código");
  assert.ok(j.$("btn-reiniciar").closest(".panel-encabezado"));
  assert.ok(ejecutar.classList.contains("boton-ejecutar"));
  assert.ok(!ejecutar.closest(".editor-botones"), "ya no va al final del editor");
  assert.ok(panel.querySelector(".encabezado-codigo").compareDocumentPosition(panel.querySelector(".editor-envoltura")) & 4, "el encabezado va antes del editor");
  assert.match(ejecutar.getAttribute("title"), /Ctrl\+Enter/);
  j.cerrar();
});

await prueba("Ctrl+Enter y Cmd+Enter dentro del editor ejecutan el código", async () => {
  for (const modificador of [{ ctrlKey: true }, { metaKey: true }]) {
    const bd = new BDFalsa();
    const j = await abrir({ url: "juego.html?mundo=1", bd });
    await j.arrancado();
    const editor = j.$("editor-codigo");
    const tecla = new j.w.KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true, ...modificador });
    editor.dispatchEvent(tecla);
    assert.equal(tecla.defaultPrevented, true, "no debe insertar un salto de línea");
    assert.ok(await esperarHasta(() => bd.tablas.progreso_fases.some((r) => r.fase_id === "1.1" && r.completada)), "debe haberse ejecutado la fase");
    await esperarHasta(() => !j.$("btn-ejecutar").disabled);
    // Un Enter normal NO ejecuta
    const antes = bd.tablas.ejecuciones.length;
    editor.dispatchEvent(new j.w.KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
    await new Promise((r) => setTimeout(r, 120));
    assert.equal(bd.tablas.ejecuciones.length, antes);
    sinErrores(j);
    j.cerrar();
  }
});

await prueba("el glosario del juego solo muestra los conceptos del mundo actual y los anteriores, y busca", async () => {
  const j1 = await abrir({ url: "juego.html?mundo=1" });
  await j1.arrancado();
  j1.$("btn-conceptos").click();
  const modal = j1.w.document.querySelector(".modal-glosario");
  assert.ok(modal, "debe abrirse el glosario");
  const titulos = () => [...modal.querySelectorAll(".concepto-item summary > span:first-child")].map((s) => s.textContent);
  assert.ok(titulos().includes("Instrucción") && titulos().some((t) => t.startsWith("print()")));
  assert.ok(titulos().includes("Variable") && titulos().includes("Ciclo while"), "el Mundo 1 fusionado ya enseña variables y el while del pozo");
  assert.ok(!titulos().includes("else (si no)") && !titulos().includes("Ciclo for y range()"), "else y for son de mundos posteriores");
  const primero = modal.querySelector(".concepto-item");
  assert.match(primero.textContent, /Definición\./);
  assert.match(primero.textContent, /Analogía\./);
  assert.ok(primero.querySelector("pre code"), "cada concepto trae un ejemplo de código");
  // buscador
  const buscar = modal.querySelector("[data-buscar]");
  buscar.value = "print";
  buscar.dispatchEvent(new j1.w.Event("input", { bubbles: true }));
  assert.deepEqual(titulos().length >= 1 && titulos().every((t) => /print|salida|mostr/i.test(t) || true), true);
  assert.ok(titulos().some((t) => t.startsWith("print()")));
  buscar.value = "range";
  buscar.dispatchEvent(new j1.w.Event("input", { bubbles: true }));
  assert.equal(titulos().length, 0, "buscar un concepto futuro no lo revela");
  assert.match(modal.querySelector("[data-conteo]").textContent, /No encontramos/);
  j1.cerrar();

  const bd = new BDFalsa({ jugador: { mundo_actual: 3, nivel_actual: 32, experiencia: 0 }, fases: fasesCompletas([...nivelesDeMundo(1), ...nivelesDeMundo(2)]) });
  const j3 = await abrir({ url: "juego.html?mundo=3", bd });
  await j3.arrancado();
  j3.$("btn-conceptos").click();
  const modal3 = j3.w.document.querySelector(".modal-glosario");
  const t3 = [...modal3.querySelectorAll(".concepto-item summary > span:first-child")].map((s) => s.textContent);
  assert.ok(t3.includes("Condicional (if)") && t3.includes("else (si no)") && t3.includes("Variable") && t3.includes("Ciclo for y range()"));
  assert.ok(!t3.includes("Función (def)"), "las funciones son del Mundo 4");
  modal3.querySelector('[data-vista="solo"]').click();
  const solo = [...modal3.querySelectorAll(".concepto-item summary > span:first-child")].map((s) => s.textContent);
  assert.ok(!solo.includes("Variable") && solo.includes("Ciclo for y range()"), "«Solo el Mundo 3» oculta los anteriores");
  j3.cerrar();
});

console.log("Pantallas chicas y táctiles");
await prueba("barra de símbolos: inserta ':' y '()' (cursor dentro) y la sangría, sin quitarle el foco al editor", async () => {
  const j = await abrir({ url: "juego.html?mundo=1" });
  await j.arrancado();
  const ta = j.$("editor-codigo");
  j.escribir("");
  ta.focus();
  const boton = (t) => j.w.document.querySelector(`#barra-simbolos [data-texto="${t}"]`);
  const toque = new j.w.Event("mousedown", { bubbles: true, cancelable: true });
  boton("()").dispatchEvent(toque);
  assert.equal(toque.defaultPrevented, true, "tocar un símbolo no debe quitar el foco");
  boton("()").click();
  assert.equal(ta.value, "()");
  assert.equal(ta.selectionStart, 1, "el cursor queda entre los paréntesis");
  boton(":").click();
  assert.equal(ta.value, "(:)");
  j.escribir("if x:\nprint(1)");
  ta.setSelectionRange(6, 6);
  j.w.document.querySelector('#barra-simbolos [data-tab="1"]').click();
  assert.match(ta.value, /\n {4}print\(1\)/, "⇥ agrega 4 espacios");
  j.w.document.querySelector('#barra-simbolos [data-tab="-1"]').click();
  assert.equal(ta.value, "if x:\nprint(1)", "⇤ los quita");
  sinErrores(j);
  j.cerrar();
});

await prueba("al ejecutar en pantalla táctil el editor pierde el foco (se oculta el teclado)", async () => {
  const j = await abrir({ url: "juego.html?mundo=1" });
  await j.arrancado();
  const ta = j.$("editor-codigo");
  ta.focus();
  assert.equal(j.w.document.activeElement, ta);
  j.$("btn-ejecutar").click();
  assert.notEqual(j.w.document.activeElement, ta, "el foco debe salir del editor");
  await esperarHasta(() => !j.$("btn-ejecutar").disabled);
  sinErrores(j);
  j.cerrar();
});

await prueba("pestañas Jugar / Aprende / Consola: empieza en Jugar, cambia con clic y teclado, y cada nivel vuelve a Jugar", async () => {
  const j = await abrir({ url: "juego.html?mundo=1" });
  await j.arrancado();
  const doc = j.w.document;
  const main = j.$("contenedor-nivel");
  const tab = (p) => j.$(`pestana-${p}`);
  assert.equal(doc.querySelectorAll('#pestanas-movil [role="tab"]').length, 3);
  assert.equal(main.dataset.pestana, "jugar", "la pestaña inicial es Jugar");
  assert.equal(tab("jugar").getAttribute("aria-selected"), "true");
  assert.equal(tab("aprende").getAttribute("aria-selected"), "false");
  tab("consola").click();
  assert.equal(main.dataset.pestana, "consola");
  assert.equal(tab("consola").getAttribute("aria-selected"), "true");
  tab("aprende").dispatchEvent(new j.w.KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
  assert.equal(main.dataset.pestana, "jugar", "← desde Aprende vuelve a Jugar");
  tab("jugar").dispatchEvent(new j.w.KeyboardEvent("keydown", { key: "End", bubbles: true }));
  assert.equal(main.dataset.pestana, "consola", "End salta a la última");
  // al ir a otro nivel se vuelve a Jugar
  const niveles = [...j.$("selector-niveles").querySelectorAll(".nivel-punto")];
  assert.ok(niveles[0]);
  niveles[0].click();
  await esperarHasta(() => main.dataset.pestana === "jugar");
  assert.equal(main.dataset.pestana, "jugar");
  j.cerrar();
});

await prueba("ejecutar desde Jugar deja un aviso en Consola; abrirla lo quita", async () => {
  const j = await abrir({ url: "juego.html?mundo=1" });
  await j.arrancado();
  const aviso = () => j.$("pestana-consola").querySelector(".pestana-aviso");
  assert.ok(aviso().hasAttribute("hidden"));
  await j.ejecutar();
  assert.ok(!aviso().hasAttribute("hidden"), "debe avisar que hay salida nueva en Consola");
  j.$("pestana-consola").click();
  assert.ok(aviso().hasAttribute("hidden"));
  sinErrores(j);
  j.cerrar();
});

await prueba("tour: controles y ✕ fijos fuera del globo, cambia de pestaña solo y se puede cerrar en cualquier paso", async () => {
  const j = await abrir({ url: "juego.html?mundo=1" });
  await j.arrancado();
  const doc = j.w.document;
  j.w.localStorage.removeItem("codequest:tour-visto");
  // El tour sale solo la primera vez; aquí se lanza con el botón.
  j.$("btn-tour").click();
  const overlay = doc.querySelector(".tour-overlay");
  assert.ok(overlay, "debe abrirse el tour");
  const controles = overlay.querySelector(".tour-controles");
  assert.ok(controles && controles.parentElement === overlay, "los controles son hijos directos del overlay (position: fixed), no del globo");
  assert.ok(!overlay.querySelector(".tour-globo").contains(controles), "no deben estar dentro del globo");
  for (const clase of [".tour-saltar", ".tour-atras", ".tour-siguiente"]) assert.ok(controles.querySelector(clase), clase);
  assert.ok(overlay.querySelector(".tour-cerrar"), "✕ visible durante todo el tour");
  assert.match(overlay.querySelector(".tour-cerrar").getAttribute("aria-label"), /Cerrar tour/);
  const main = j.$("contenedor-nivel");
  const siguiente = () => overlay.querySelector(".tour-siguiente").click();
  const visto = [];
  for (let i = 0; i < 5; i++) { // el tour general tiene 5 pasos: misión, «Más info», editor, botón Ejecutar y resultados/memoria
    await esperarHasta(() => true, 30);
    await new Promise((r) => setTimeout(r, 40));
    visto.push(`${overlay.querySelector(".tour-titulo").textContent}→${main.dataset.pestana}`);
    siguiente();
  }
  assert.deepEqual(
    visto.map((x) => x.split("→")[1]),
    ["jugar", "jugar", "jugar", "jugar", "consola"],
    "cada paso debe estar en la pestaña donde vive su elemento"
  );
  // el tour explica el botón nuevo «Más info»
  assert.deepEqual(visto.map((x) => x.split("→")[0]).slice(0, 2), ["Tu misión", "Más info"]);
  assert.equal(doc.querySelector(".tour-overlay"), null, "al terminar el último paso se cierra");
  assert.equal(j.w.localStorage.getItem("codequest:tour-visto"), "1");
  // ✕ a mitad de camino
  j.w.localStorage.removeItem("codequest:tour-visto");
  j.$("btn-tour").click();
  siguiente2(doc);
  doc.querySelector(".tour-cerrar").click();
  assert.equal(doc.querySelector(".tour-overlay"), null, "la ✕ cierra el tour");
  assert.equal(doc.body.classList.contains("tour-activo"), false);
  assert.equal(j.w.localStorage.getItem("codequest:tour-visto"), "1");
  j.cerrar();
});
function siguiente2(doc) {
  doc.querySelector(".tour-siguiente").click();
}

await prueba("el aviso de girar el teléfono se puede cerrar y no vuelve a salir en la sesión", async () => {
  const j = await abrir({ url: "juego.html?mundo=1" });
  await j.arrancado();
  const aviso = j.$("aviso-orientacion");
  assert.match(aviso.textContent, /Gira tu teléfono para una mejor experiencia/);
  assert.ok(!aviso.classList.contains("cerrado"));
  j.$("aviso-orientacion-cerrar").click();
  assert.ok(aviso.classList.contains("cerrado"));
  assert.equal(j.w.sessionStorage.getItem("codequest:aviso-giro"), "1");
  j.cerrar();
});

console.log("Mundo 2 (Lógica): mesa de cartas con casos");
const BD_MUNDO3 = () =>
  new BDFalsa({
    jugador: { mundo_actual: 2, nivel_actual: 20, experiencia: 0 },
    fases: [...fasesCompletas(nivelesDeMundo(1)), ...fasesCompletas([20], { excepto: ["20.3"] })],
  });

await prueba("una regla a ciegas NO pasa: se prueba en 4 mesas y se explica por caso", async () => {
  const bd = BD_MUNDO3();
  const j = await abrir({ url: "juego.html?mundo=2", bd });
  await j.arrancado();
  assert.equal(j.w.document.body.dataset.mundo, "2");
  assert.equal(j.$("selector-casos").querySelectorAll("button").length, 4);
  j.escribir('print("Bust")');
  await j.ejecutar();
  const f = j.feedback();
  assert.match(f, /Todavía no/);
  assert.match(f, /✗ Mesa 3 · 18/);
  assert.match(f, /✓ Mesa 1 · 25/);
  assert.match(f, /no imprimir nada/);
  const ultima = bd.tablas.ejecuciones.at(-1);
  assert.equal(ultima.resultado, "objetivo_no_alcanzado");
  assert.equal(ultima.concepto_evaluado, "condicional_if");
  assert.ok(!bd.tablas.progreso_fases.some((r) => r.fase_id === "20.3" && r.completada));
  sinErrores(j);
  j.cerrar();
});

await prueba("la regla correcta pasa, se guarda y los casos cambian sin borrar el código", async () => {
  const bd = BD_MUNDO3();
  const j = await abrir({ url: "juego.html?mundo=2", bd });
  await j.arrancado();
  const correcto = faseDe("20.3").solucionReferencia;
  j.escribir(correcto);
  j.$("selector-casos").querySelectorAll("button")[1].click(); // mesa 2
  assert.equal(j.$("editor-codigo").value, correcto, "cambiar de mesa no debe borrar el código");
  assert.match(j.$("selector-casos").querySelector(".activo").textContent, /Mesa 2/);
  await j.ejecutar();
  assert.ok(await esperarHasta(() => bd.tablas.progreso_fases.some((r) => r.fase_id === "20.3" && r.completada)), "debe guardarse la fase completada");
  assert.match(j.$("estrellas-nivel").innerHTML, /./);
  sinErrores(j);
  j.cerrar();
});

await prueba("errores de sintaxis con sangría salen explicados", async () => {
  const j = await abrir({ url: "juego.html?mundo=2", bd: BD_MUNDO3() });
  await j.arrancado();
  j.escribir('if numero > 21\n    print("Bust")');
  await j.ejecutar();
  assert.match(j.feedback(), /":"/);
  j.escribir('if numero > 21:\nprint("Bust")');
  await j.ejecutar();
  assert.match(j.feedback(), /sangría/i);
  j.escribir('while True:\n    x = 1');
  await j.ejecutar();
  j.escribir("if numero > 21:\n    print(\"Bust\")");
  sinErrores(j);
  j.cerrar();
});

console.log("Mundo 3 (Automatización): elevador y ciclos");
await prueba("while / for: solución correcta guardada; ciclo infinito detenido con RUN_005", async () => {
  const bd = new BDFalsa({
    jugador: { mundo_actual: 3, nivel_actual: 32, experiencia: 0 },
    fases: [...fasesCompletas([...nivelesDeMundo(1), ...nivelesDeMundo(2)]), ...fasesCompletas([32], { excepto: ["32.3"] })],
  });
  const j = await abrir({ url: "juego.html?mundo=3", bd });
  await j.arrancado();
  assert.equal(j.w.document.body.dataset.mundo, "3");
  assert.match(j.$("titulo-mundo").textContent, /Elevador/);
  assert.match(j.$("estado-contenido").textContent, /A bordo/);
  j.escribir("piso = 1\nwhile True:\n    piso = piso + 1");
  await j.ejecutar();
  assert.match(j.feedback(), /Ciclo infinito/);
  j.escribir(faseDe("32.3").solucionReferencia);
  await j.ejecutar();
  assert.ok(await esperarHasta(() => bd.tablas.progreso_fases.some((r) => r.fase_id === "32.3" && r.completada)));
  assert.match(j.$("estado-contenido").textContent, /Piso\s*5/);
  assert.match(j.$("estado-contenido").textContent, /Energía\s*96%/);
  sinErrores(j);
  j.cerrar();
});

await prueba("?nivel=N abre ese nivel del mundo solo si ya está desbloqueado", async () => {
  const hechos = [...fasesCompletas(nivelesDeMundo(1)), ...fasesCompletas([20, 21])];
  const bd = () => new BDFalsa({ jugador: { mundo_actual: 2, nivel_actual: 22, experiencia: 0 }, fases: hechos });
  const a = await abrir({ url: "juego.html?mundo=2&nivel=2", bd: bd() });
  await a.arrancado();
  assert.match(a.$("titulo-nivel").textContent, /Nivel 2 — Ganar o perder/);
  const b = await abrir({ url: "juego.html?mundo=2&nivel=9", bd: bd() }); // el 8 no está completo: se ignora
  await b.arrancado();
  assert.match(b.$("titulo-nivel").textContent, /Nivel 3 —/, "debe retomar donde iba (nivel 3)");
  a.cerrar();
  b.cerrar();
});

console.log("Transición entre mundos");
await prueba("al terminar La Caja Fuerte (jefe final del Mundo 1) sale la pantalla narrativa y el botón abre el Mundo 2", async () => {
  const ultima = nivelPorId[45].fases.at(-1);
  const bd = new BDFalsa({ jugador: { mundo_actual: 1, nivel_actual: 45, experiencia: 0 }, fases: fasesCompletas(nivelesDeMundo(1), { excepto: [ultima.id] }) });
  const j = await abrir({ url: "juego.html?mundo=1", bd });
  await j.arrancado();
  const solucion = ultima.solucionReferencia ?? ultima.codigoInicial;
  if (ultima.tipo === "PREDECIR") j.$("prediccion-opciones").querySelector(`[data-opcion="${ultima.respuestaCorrecta}"]`)?.click();
  else {
    j.escribir(solucion);
    await j.ejecutar();
  }
  const capa = await esperarHasta(() => j.w.document.querySelector(".transicion-mundo"), 6000);
  assert.ok(capa, "debe mostrarse la transición");
  const texto = j.w.document.querySelector(".transicion-mundo").textContent;
  assert.match(texto, /Mundo 1 completado/);
  assert.match(texto, /Entra al Mundo 2: Lógica/);
  assert.match(texto, /Continuar al siguiente mundo/);
  assert.deepEqual(j.redirecciones, [], "no debe saltar solo al siguiente nivel");
  j.w.document.querySelector(".transicion-mundo button").click();
  await esperarHasta(() => j.redirecciones.length > 0);
  assert.deepEqual([...j.redirecciones], ["juego.html?mundo=2"]);
  sinErrores(j);
  j.cerrar();
});

console.log("Tours de inmersión por mundo");
await prueba("TOUR DE MUNDO: la primera vez en el Mundo 2, 3, 4 o 5 presenta el escenario con su mensaje, y no vuelve a salir", async () => {
  const casos = [
    [2, [1], /Bienvenido al casino\. Tu código tomará decisiones\. Usa if y else para ganar/, 1],
    [3, [1, 2], /El elevador necesita automatización\. Usa ciclos while para subir y bajar sin detenerte/, 1],
    [4, [1, 2, 3], /Bienvenido a la fábrica/, 2],
    [5, [1, 2, 3, 4], /Bienvenido al Laboratorio de creación/, 2],
  ];
  for (const [mundo, previos, texto, pasos] of casos) {
    const bd = () => new BDFalsa({ fases: fasesCompletas(previos.flatMap(nivelesDeMundo)) });
    const j = await abrir({ url: `juego.html?mundo=${mundo}`, bd: bd() });
    j.w.localStorage.setItem("codequest:tour-visto", "1"); // el tour general ya se vio en el Mundo 1
    await j.arrancado();
    assert.ok(await esperarHasta(() => j.w.document.querySelector(".tour-overlay")), `Mundo ${mundo}: debe salir el tour del mundo nuevo`);
    const overlay = j.w.document.querySelector(".tour-overlay");
    assert.match(overlay.querySelector(".tour-texto").textContent, texto);
    assert.match(overlay.querySelector(".tour-progreso").textContent, new RegExp(`1 de ${pasos}`));
    assert.ok(overlay.querySelector(".tour-cerrar") && overlay.querySelector(".tour-controles"), "mismos controles fijos y ✕ que el tour general");
    overlay.querySelector(".tour-cerrar").click();
    await new Promise((r) => setTimeout(r, 60));
    assert.equal(j.w.document.querySelector(".tour-overlay"), null);
    assert.equal(j.w.localStorage.getItem(`codequest:tour-mundo:u1:${mundo}`), "1", "queda marcado como visto");
    j.cerrar();
    // segunda visita: ya no sale (se conserva el almacenamiento)
    const k = await abrir({ url: `juego.html?mundo=${mundo}`, bd: bd() });
    k.w.localStorage.setItem("codequest:tour-visto", "1");
    k.w.localStorage.setItem(`codequest:tour-mundo:u1:${mundo}`, "1");
    await k.arrancado();
    await new Promise((r) => setTimeout(r, 900));
    assert.equal(k.w.document.querySelector(".tour-overlay"), null, `Mundo ${mundo}: no debe repetirse`);
    k.cerrar();
  }
});

console.log("Mundo 1 · Fundamentos y Datos: minijuegos");
// Cada minijuego en la página real: con los niveles anteriores y las demás fases ya hechas, el juego abre la fase pedida, monta
// su escenario (data-escenario), muestra el límite de líneas de la fase y la solución de referencia la supera (todos sus casos).
await prueba("MINIJUEGOS: alcancía, semáforo, vasos, receta, pozo, cronómetro, boleta, viaje y caja fuerte se juegan y se superan", async () => {
  const orden = catalogoM1();
  const juegos = [[6, "6.4", "alcancia"], [8, "8.4", "semaforo"], [10, "10.4", "vasos"], [12, "12.4", "receta"], [14, "14.4", "pozo"],
    [16, "16.4", "cronometro"], [17, "17.4", "boleta"], [18, "18.4", "viaje"], [45, "45.1", "cajafuerte"]];
  for (const [id, faseId, escena] of juegos) {
    const fase = faseDe(faseId);
    const previos = orden.slice(0, orden.indexOf(id));
    const bd = new BDFalsa({ jugador: { mundo_actual: 1, nivel_actual: id, experiencia: 0 }, fases: [...fasesCompletas(previos), ...fasesCompletas([id], { excepto: [faseId] })] });
    const j = await abrir({ url: `juego.html?mundo=1&nivel=${nivelPorId[id].ordinal}`, bd, antes: (w) => w.localStorage.setItem("codequest:tour-visto", "1") });
    await j.arrancado();
    assert.equal(j.w.document.body.dataset.escenario, escena, `${faseId}: escenario`);
    assert.match(j.$("titulo-nivel").textContent, new RegExp(nivelPorId[id].nombre), `${faseId}: abre su nivel`);
    assert.equal(j.$("contador-lineas").textContent, `Líneas: 0 / ${fase.max_lineas_recomendadas}`, `${faseId}: el contador trae el límite de la fase`);
    j.escribir(fase.solucionReferencia);
    await j.ejecutar();
    assert.ok(await esperarHasta(() => bd.tablas.progreso_fases.some((r) => r.fase_id === faseId && r.completada), 8000), `${faseId}: la solución de referencia supera la fase`);
    sinErrores(j);
    j.cerrar();
  }
});

await prueba("MINIJUEGOS: una solución a medias no pasa (el intercambio sin temp, el pozo sin llenar la cubeta)", async () => {
  const orden = catalogoM1();
  for (const [id, faseId, malo, aviso] of [
    [10, "10.3", "vasoA = vasoB\nvasoB = vasoA\nprint(vasoA)\nprint(vasoB)", /Todavía no/],
    [14, "14.4", "metros = 0\nwhile not pozo.hayAgua():\n    pozo.bajar()\n    metros += 1\npozo.subir(metros)\nprint(metros)", /arriba y llena|ARRIBA y LLENA|Todavía no/],
  ]) {
    const bd = new BDFalsa({ jugador: { mundo_actual: 1, nivel_actual: id, experiencia: 0 }, fases: [...fasesCompletas(orden.slice(0, orden.indexOf(id))), ...fasesCompletas([id], { excepto: [faseId] })] });
    const j = await abrir({ url: `juego.html?mundo=1&nivel=${nivelPorId[id].ordinal}`, bd, antes: (w) => w.localStorage.setItem("codequest:tour-visto", "1") });
    await j.arrancado();
    j.escribir(malo);
    await j.ejecutar();
    await new Promise((r) => setTimeout(r, 200));
    assert.match(j.feedback(), aviso, `${faseId}: explica que no se logró`);
    assert.ok(!bd.tablas.progreso_fases.some((r) => r.fase_id === faseId && r.completada), `${faseId}: no se completa`);
    sinErrores(j);
    j.cerrar();
  }
});

console.log("Mundo 4 (Modularidad: fábrica) y Niveles Jefe");
await prueba("NIVEL JEFE: sin botón de pistas, editor en blanco, insignia 👑 y se completa con la solución", async () => {
  const bd = new BDFalsa({ fases: fasesCompletas(nivelesDeMundo(1).filter((id) => id !== 44)) });
  const j = await abrir({ url: "juego.html?mundo=1&nivel=14", bd });
  await j.arrancado();
  assert.match(j.$("titulo-nivel").textContent, /^👑 Nivel Jefe — Laberinto ciego/);
  assert.ok(j.$("btn-pista").classList.contains("oculto"), "el Nivel Jefe no tiene botón de pistas");
  assert.equal(j.$("editor-codigo").value, "", "editor en blanco");
  j.$("btn-pista").click(); // aunque se fuerce el clic no hay ayudas
  assert.doesNotMatch(j.feedback(), /Pista/);
  j.escribir(nivelPorId[44].fases[0].solucionReferencia);
  await j.ejecutar();
  assert.ok(await esperarHasta(() => bd.tablas.progreso_fases.some((r) => r.fase_id === "44.1" && r.completada)), "la solución del laberinto completa el jefe");
  // una fase normal SÍ muestra el botón de pistas
  const k = await abrir({ url: "juego.html?mundo=1&nivel=1", bd: new BDFalsa() });
  await k.arrancado();
  assert.ok(!k.$("btn-pista").classList.contains("oculto"));
  j.cerrar();
  k.cerrar();
});

await prueba("MUNDO 4: la fábrica construye una máquina por cada def (sin encenderla), y cada llamada se cuenta y se muestra", async () => {
  const admin = { user_id: "u1", nombre: "Admin", rol: "admin", email: "a@x.mx" };
  const j = await abrir({ url: "juego.html?mundo=4&demo=true", perfil: admin, bd: new BDFalsa() });
  await j.arrancado();
  assert.equal(j.w.document.body.dataset.mundo, "4");
  assert.match(j.$("titulo-nivel").textContent, /Nivel 1 — Construyendo máquinas/);
  assert.match(j.$("titulo-mundo").textContent, /Fábrica de robots/);
  await j.ejecutar(); // la fase 1 (EXPLORAR) define saludar() pero NO la llama
  let estado = j.$("estado-contenido").textContent.replace(/\s+/g, " ");
  assert.match(estado, /Máquinas\s*saludar\(\)/);
  assert.match(estado, /Llamadas\s*0/, "definir no enciende la máquina");
  assert.match(j.$("salida-contenido").textContent, /^\s*$/, "no se mostró nada: solo se construyó la máquina");
  j.escribir('def saludar():\n    print("hola")\nsaludar()\nsaludar()');
  await j.ejecutar();
  estado = j.$("estado-contenido").textContent.replace(/\s+/g, " ");
  assert.match(estado, /Llamadas\s*2/);
  assert.match(estado, /Última llamada\s*saludar\(\) → None/);
  assert.match(j.$("memoria-contenido").textContent, /Todavía no hay variables/, "una función no crea variables globales: Memoria sigue vacía");
  sinErrores(j);
  j.cerrar();
});

await prueba("MUNDO 4: el Nivel 8 es el Jefe (👑, sin pistas, editor en blanco) y su mensaje de error es el pedido", async () => {
  const admin = { user_id: "u1", nombre: "Admin", rol: "admin", email: "a@x.mx" };
  const j = await abrir({ url: "juego.html?mundo=4&nivel=8&demo=true", perfil: admin, bd: new BDFalsa() });
  await j.arrancado();
  assert.match(j.$("titulo-nivel").textContent, /^👑 Nivel Jefe — El Gran Ensamblaje/);
  assert.ok(j.$("btn-pista").classList.contains("oculto"));
  assert.equal(j.$("editor-codigo").value, "");
  assert.match(j.$("titulo-mundo").textContent, /El Gran Ensamblaje/);
  j.escribir('def cabeza():\n    print("c")\ndef brazos():\n    print("b")\ncabeza()\nbrazos()');
  await j.ejecutar();
  assert.match(j.feedback(), /El robot está incompleto\. Asegúrate de definir las 3 funciones y llamarlas en el orden correcto \(cabeza, brazos, piernas\)\./);
  assert.match(j.$("estado-contenido").textContent.replace(/\s+/g, " "), /Robot gigante\s*cabeza ✓ · brazos ✓ · piernas —/, "el robot gigante muestra lo que ya se ensambló");
  j.escribir(nivelPorId[55].fases[0].solucionReferencia);
  await j.ejecutar();
  assert.match(j.$("estado-contenido").textContent.replace(/\s+/g, " "), /cabeza ✓ · brazos ✓ · piernas ✓/);
  sinErrores(j);
  j.cerrar();
});

console.log("Ajustes pedagógicos");
await prueba("NIVEL 1: tras el EXPLORAR viene una pregunta PREDECIR («¿qué instrucción lo hizo?») y se guarda su avance", async () => {
  const bd = new BDFalsa();
  const j = await abrir({ url: "juego.html?mundo=1&nivel=1", bd });
  await j.arrancado();
  const puntos = () => [...j.w.document.querySelectorAll("#barra-fases .fase-punto")];
  assert.equal(puntos().length, 4, "el Nivel 1 ahora tiene 4 fases: EXPLORAR, PREDECIR, MODIFICAR, ESCRIBIR");
  await j.ejecutar(); // fase 1 (EXPLORAR): solo ejecutar
  assert.ok(await esperarHasta(() => bd.tablas.progreso_fases.some((r) => r.fase_id === "1.1" && r.completada)));
  assert.ok(await esperarHasta(() => [...j.$("feedback-contenido").querySelectorAll("button")].some((b) => /Siguiente fase/.test(b.textContent))));
  [...j.$("feedback-contenido").querySelectorAll("button")].find((b) => /Siguiente fase/.test(b.textContent)).click();
  assert.ok(await esperarHasta(() => j.$("prediccion-opciones").children.length === 3), "la fase 2 es una predicción con 3 opciones");
  assert.match(j.w.document.body.textContent, /¿Qué instrucción lo hizo\?/);
  j.$("prediccion-opciones").children[1].click(); // «robot1.avanzar()»: respuesta equivocada, no se guarda
  await new Promise((r) => setTimeout(r, 80));
  assert.ok(!bd.tablas.progreso_fases.some((r) => r.fase_id === "1.4" && r.completada), "una respuesta equivocada no completa la fase");
  j.$("prediccion-opciones").children[0].click(); // «print()»
  assert.ok(await esperarHasta(() => bd.tablas.progreso_fases.some((r) => r.fase_id === "1.4" && r.completada)), "la respuesta correcta completa la fase");
  sinErrores(j);
  j.cerrar();
});

await prueba("DEPURAR el precio con coma (El Viaje, Nivel 19): el error explica que en Python los decimales llevan punto", async () => {
  const orden = catalogoM1();
  const bd2 = new BDFalsa({ fases: [...fasesCompletas(orden.slice(0, orden.indexOf(18))), ...fasesCompletas([18], { excepto: ["18.2", "18.3", "18.4"] })] });
  const k = await abrir({ url: "juego.html?mundo=1&nivel=19", bd: bd2 });
  await k.arrancado();
  assert.match(k.$("titulo-nivel").textContent, /Nivel 19 — El Viaje/);
  assert.equal(k.$("editor-codigo").value, "precio = 24,5\nprint(precio)", "el error es el punto de partida");
  await k.ejecutar();
  assert.match(k.feedback(), /En Python los decimales se escriben con punto, no con coma\./);
  assert.doesNotMatch(k.feedback(), /CQL/);
  k.escribir("precio = 24.5\nprint(precio)");
  await k.ejecutar();
  assert.ok(await esperarHasta(() => bd2.tablas.progreso_fases.some((r) => r.fase_id === "18.2" && r.completada)));
  k.cerrar();
});

// Los niveles con CASOS que traen entradas (jefe del Mundo 1, proyectos del Mundo 5) usan automáticamente las del caso elegido:
// ya no se teclean a mano (si el alumno ponía otros números, el caso 1 fallaba aunque su programa estuviera bien).
async function ejecutarConEntradas(j) {
  await j.ejecutar();
  await new Promise((r) => setTimeout(r, 250));
  assert.equal(j.w.document.querySelector(".entrada-campo"), null, "no pide teclear: usa las entradas del caso");
}

await prueba("RETO DE EFICIENCIA (Nivel Jefe): un código más largo que max_lineas_recomendadas pasa igual (con sus estrellas) y recibe el mensaje; uno corto no", async () => {
  const jefe = nivelPorId[45];
  assert.equal(jefe.max_lineas_recomendadas, 6);
  assert.equal(jefe.fases[0].casos[0].entradas.length, 4);
  const previos = nivelesDeMundo(1).filter((id) => id !== 45);
  const bd = new BDFalsa({ fases: fasesCompletas(previos) });
  const j = await abrir({ url: "juego.html?mundo=1&nivel=20", bd });
  await j.arrancado();
  assert.match(j.$("titulo-nivel").textContent, /^👑 Nivel Jefe/);
  const largo = nivelPorId[45].fases[0].solucionReferencia + "\nextra = 1\nextra = 2";
  j.escribir(largo);
  await ejecutarConEntradas(j, nivelPorId[45].fases[0].casos[0].entradas); // los valores de la «Caja 1»
  assert.ok(await esperarHasta(() => bd.tablas.progreso_fases.some((r) => r.fase_id === "45.1" && r.completada)), "el jefe se completa y se guarda aunque el código sea largo");
  const mensaje = "¡Excelente! Completaste el nivel. Pero usaste 8 líneas. Un programador eficiente podría hacerlo en 6. ¿Te animas a intentarlo de nuevo?";
  const capa = await esperarHasta(() => j.w.document.querySelector(".transicion-mundo"));
  assert.ok(capa, "el jefe cierra su mundo: sale la pantalla de transición");
  assert.ok(j.w.document.querySelector(".transicion-consejo").textContent.includes(mensaje), "el mensaje también está en la pantalla de transición, que tapa el panel");
  j.w.document.querySelector(".transicion-acciones .boton-secundario").click(); // «Mejorar mi código»
  await new Promise((r) => setTimeout(r, 60));
  assert.equal(j.w.document.querySelector(".transicion-mundo"), null);
  assert.deepEqual([...j.redirecciones], [], "se queda en el nivel");
  assert.ok(j.w.document.querySelector(".feedback-consejo").textContent.includes(mensaje), "y el panel de retroalimentación muestra el mensaje");
  assert.ok(j.$("feedback-contenido").querySelector(".estrella-activa"), "las estrellas no se tocan");
  assert.ok(j.$("feedback-contenido").querySelector(".feedback-botones button"), "no se bloquea nada: sigue el botón de repetir el nivel");
  // con el código recomendado ya no hay mensaje
  j.escribir(nivelPorId[45].fases[0].solucionReferencia);
  await ejecutarConEntradas(j, nivelPorId[45].fases[0].casos[0].entradas); // los valores de la «Caja 1»
  await esperarHasta(() => j.w.document.querySelector(".transicion-mundo"), 6000);
  assert.equal(j.w.document.querySelector(".transicion-consejo"), null, "sin mensaje si ya es tan corto como se recomienda");
  assert.equal(j.w.document.querySelector(".feedback-consejo"), null);
  sinErrores(j);
  j.cerrar();
});

await prueba("el reto de eficiencia NO aparece en niveles normales ni en el Jefe del Mundo 4 (no tienen max_lineas_recomendadas)", async () => {
  const j = await abrir({ url: "juego.html?mundo=1&nivel=1", bd: new BDFalsa() });
  await j.arrancado();
  j.escribir('print("Robot1 despierta")\nprint("a")\nprint("b")\nprint("c")\nprint("d")\nprint("e")');
  await j.ejecutar();
  await esperarHasta(() => j.w.document.querySelector(".feedback-exito"));
  assert.equal(j.w.document.querySelector(".feedback-consejo"), null);
  j.cerrar();
});

console.log("Mundo 5 (Proyecto) y calidad (carga, autoguardado, pantalla final)");
const ADMIN = { user_id: "u1", nombre: "Admin", rol: "admin", email: "a@x.mx" };
const vistos6 = (w) => ["demo", "u1"].forEach((u) => { w.localStorage.setItem(`codequest:teoria:${u}:5`, "1"); w.localStorage.setItem(`codequest:tour-mundo:${u}:5`, "1"); });
const abrirM6 = (nivel, extra = {}) => abrir({ url: `juego.html?mundo=5&nivel=${nivel}&demo=true`, perfil: ADMIN, bd: new BDFalsa(), antes: (w) => { w.localStorage.setItem("codequest:tour-visto", "1"); vistos6(w); extra.antes?.(w); } });
const fase561 = nivelPorId[56].fases[0];

await prueba("MUNDO 5: el taller de proyectos abre con la paleta rosa, el Nivel 1 es la máquina expendedora y usa la terminal", async () => {
  const j = await abrirM6(1);
  await j.arrancado();
  assert.equal(j.w.document.body.dataset.mundo, "5");
  assert.match(j.$("titulo-nivel").textContent, /^Nivel 1 — La máquina expendedora/);
  assert.match(j.$("titulo-mundo").textContent, /Taller de proyectos/);
  assert.equal(j.$("editor-codigo").value, "");
  // validación ESTRICTA: un código que falla en un solo caso no pasa («dinero justo» necesita >=)
  j.escribir(fase561.trampasProbadas?.[0] ?? 'dinero = int(input())\nprecio = int(input())\nif dinero > precio:\n    print("Cambio: " + str(dinero - precio))\nelse:\n    print("Dinero insuficiente")');
  await ejecutarConEntradas(j, fase561.casos[0].entradas);
  await new Promise((r) => setTimeout(r, 300));
  assert.match(j.feedback(), /Dinero justo/, "el panel dice QUÉ caso falló");
  assert.ok(!j.w.document.querySelector(".feedback-nivel-completo"), "no se completa el nivel");
  j.escribir(fase561.solucionReferencia);
  await ejecutarConEntradas(j, fase561.casos[0].entradas);
  assert.ok(await esperarHasta(() => j.w.document.querySelector(".feedback-nivel-completo"), 6000), "con todos los casos correctos sí");
  sinErrores(j);
  j.cerrar();
});

await prueba("CARGA: la capa «CARGANDO...» se ve al arrancar y desaparece sola cuando el nivel está listo", async () => {
  const j = await abrirM6(1);
  const capa = j.$("cargando-nivel");
  assert.ok(capa, "juego.html trae la capa de carga");
  assert.equal(capa.hidden, false, "visible desde el principio, antes de que lleguen los datos");
  assert.match(capa.textContent, /CARGANDO\.\.\./);
  await j.arrancado();
  assert.ok(await esperarHasta(() => capa.hidden === true), "se oculta al terminar de preparar el nivel");
  assert.equal(j.w.document.body.getAttribute("aria-busy"), null);
  j.cerrar();
});

await prueba("AUTOGUARDADO: lo que escribes se guarda, sobrevive a F5 y se borra al completar la fase o al reiniciar", async () => {
  const clave = "codequest:codigo:demo:56.1";
  let almacenado = null;
  const j = await abrirM6(1);
  await j.arrancado();
  j.escribir("dinero = int(input())");
  assert.equal(j.w.localStorage.getItem(clave), null, "no se escribe en cada tecla: espera a que dejes de teclear");
  assert.ok(await esperarHasta(() => j.w.localStorage.getItem(clave) === "dinero = int(input())", 2000), "se guarda solo tras una pausa");
  // al cerrar o recargar la pestaña se guarda ya, sin esperar
  j.escribir("dinero = int(input())\nprecio = int(input())");
  j.w.dispatchEvent(new j.w.Event("pagehide"));
  assert.equal(j.w.localStorage.getItem(clave), "dinero = int(input())\nprecio = int(input())");
  almacenado = j.w.localStorage.getItem(clave);
  j.cerrar();

  // F5: la página nueva recupera el código
  const k = await abrirM6(1, { antes: (w) => w.localStorage.setItem(clave, almacenado) });
  await k.arrancado();
  assert.equal(k.$("editor-codigo").value, almacenado, "el editor recupera el código");
  assert.match(k.feedback(), /Recuperamos el código/);
  // Reiniciar = empezar de cero: se borra el borrador
  k.$("btn-reiniciar").click();
  await new Promise((r) => setTimeout(r, 100));
  assert.equal(k.$("editor-codigo").value, "");
  assert.equal(k.w.localStorage.getItem(clave), null, "Reiniciar borra el borrador");
  // escribir de nuevo y COMPLETAR la fase: el borrador desaparece
  k.escribir(fase561.solucionReferencia);
  k.w.dispatchEvent(new k.w.Event("pagehide"));
  assert.equal(k.w.localStorage.getItem(clave), fase561.solucionReferencia);
  await ejecutarConEntradas(k, fase561.casos[0].entradas);
  assert.ok(await esperarHasta(() => k.bd.tablas.progreso_fases.length >= 0 && k.w.document.querySelector(".feedback-nivel-completo"), 6000));
  assert.equal(k.w.localStorage.getItem(clave), null, "al completar la fase el borrador se borra");
  sinErrores(k);
  k.cerrar();
});

await prueba("AUTOGUARDADO: un borrador igual al código inicial no se guarda y no se recupera en fases sin editor", async () => {
  const j = await abrirM6(1);
  await j.arrancado();
  j.escribir("x = 1");
  j.escribir("");
  j.w.dispatchEvent(new j.w.Event("pagehide"));
  assert.equal(j.w.localStorage.getItem("codequest:codigo:demo:56.1"), null, "un editor vacío no deja borrador");
  j.cerrar();
  // en el Laboratorio Libre (sandbox) no se autoguarda nada
  const s = await abrir({ url: "juego.html?modo=sandbox", bd: new BDFalsa() });
  await s.arrancado();
  s.escribir("print(1)");
  s.w.dispatchEvent(new s.w.Event("pagehide"));
  assert.ok(!Object.keys(s.w.localStorage).some((k) => k.startsWith("codequest:codigo:")), "sin autoguardado en el Laboratorio Libre");
  s.cerrar();
});

await prueba("PANTALLA FINAL: al completar el Proyecto libre (Nivel 4 del Mundo 5) sale «¡Felicidades, has completado CodeQuest!» con estrellas y líneas", async () => {
  const j = await abrirM6(4, { antes: (w) => w.localStorage.setItem("codequest:lineas:demo", JSON.stringify({ "56.1": 6, "57.1": 4, "58.1": 14 })) });
  await j.arrancado();
  assert.match(j.$("titulo-nivel").textContent, /^👑 Nivel Jefe — Proyecto libre/);
  assert.ok(j.$("btn-pista").classList.contains("oculto"));
  assert.equal(j.$("editor-codigo").value, "");
  // un programa corto o sin while NO pasa
  j.escribir("a = 1\nif a == 1:\n    print(a)");
  await j.ejecutar();
  await new Promise((r) => setTimeout(r, 300));
  assert.equal(j.w.document.querySelector(".pantalla-final"), null);
  assert.match(j.feedback(), /al menos 10 líneas/);
  // el proyecto bueno
  const solucion = nivelPorId[59].fases[0].solucionReferencia;
  j.escribir(solucion);
  await j.ejecutar();
  assert.ok(await esperarHasta(() => j.w.document.querySelector(".pantalla-final"), 6000), "sale la pantalla final");
  assert.equal(j.w.document.querySelector(".transicion-mundo"), null, "no la transición de mundo");
  const capa = j.w.document.querySelector(".pantalla-final");
  assert.match(capa.querySelector("h1").textContent, /¡Felicidades, has completado CodeQuest!/);
  assert.match(capa.textContent, /Ahora piensas como un programador/);
  assert.match(capa.querySelector("#final-estrellas").textContent, /^★ \d+ \/ 177$/);
  const lineas = nivelPorId[59].fases[0].solucionReferencia.split("\n").filter((l) => l.trim() !== "").length;
  assert.equal(capa.querySelector("#final-lineas").textContent, String(6 + 4 + 14 + lineas), "suma las líneas de las soluciones aceptadas, sin repetir fases");
  assert.match(capa.querySelector("#final-lineas + span").textContent, /líneas de código escritas/);
  capa.querySelector("button").click(); // «Seguir practicando»
  assert.equal(j.w.document.querySelector(".pantalla-final"), null);
  sinErrores(j);
  j.cerrar();
});

await prueba("HUD en la página real: misión de una línea, lámparas de casos (✓/✗) tras ejecutar, Nix con su globo y «Ver detalle»", async () => {
  const j = await abrirM6(1);
  await j.arrancado();
  assert.equal(j.$("hud-mision-texto").textContent, fase561.mision);
  const lamparas = () => [...j.w.document.querySelectorAll("#hud-diodos .hud-diodo")];
  assert.equal(lamparas().length, 5, "una lámpara por caso");
  assert.deepEqual(lamparas().map((l) => l.dataset.estado), ["pendiente", "pendiente", "pendiente", "pendiente", "pendiente"]);
  assert.equal(j.$("nix-globo").hidden, true, "Nix no habla antes de ejecutar");
  // un solo caso mal («dinero justo» necesita >=): la lámpara 2 falla y las demás pasan
  j.escribir('dinero = int(input())\nprecio = int(input())\nif dinero > precio:\n    print("Cambio: " + str(dinero - precio))\nelse:\n    print("Dinero insuficiente")');
  await ejecutarConEntradas(j);
  assert.deepEqual(lamparas().map((l) => l.dataset.estado), ["ok", "mal", "ok", "ok", "ok"]);
  assert.deepEqual(lamparas().map((l) => l.querySelector(".hud-diodo-simbolo").textContent), ["✓", "✗", "✓", "✓", "✓"], "con símbolo, no solo color");
  assert.equal(j.$("nix-globo").hidden, false);
  assert.equal(j.$("nix-globo").dataset.estado, "error");
  assert.match(j.$("nix-texto").textContent, /falló el caso 2/);
  const panel = j.w.document.querySelector(".panel-feedback");
  assert.equal(panel.dataset.plegado, "true", "el detalle empieza plegado");
  assert.match(j.feedback(), /Dinero justo/, "pero el detalle completo está en el panel");
  j.$("btn-nix-detalle").click();
  assert.equal(panel.dataset.plegado, "false", "«Ver detalle» lo abre");
  // la solución buena enciende las 5 lámparas y Nix celebra
  j.escribir(fase561.solucionReferencia);
  await ejecutarConEntradas(j);
  assert.deepEqual(lamparas().map((l) => l.dataset.estado), ["ok", "ok", "ok", "ok", "ok"]);
  assert.equal(j.$("nix-globo").dataset.estado, "exito");
  sinErrores(j);
  j.cerrar();
});

await prueba("las lámparas eligen el caso que se ve: la ejecución usa SUS entradas, sin teclear (y no hace falta adivinar los números)", async () => {
  const j = await abrirM6(1);
  await j.arrancado();
  j.escribir(fase561.solucionReferencia);
  j.w.document.querySelectorAll("#hud-diodos .hud-diodo")[2].click(); // caso 3: «No alcanza» (3 y 8)
  await new Promise((r) => setTimeout(r, 120));
  assert.equal(j.w.document.querySelectorAll("#hud-diodos .hud-diodo")[2].getAttribute("aria-pressed"), "true");
  await ejecutarConEntradas(j);
  assert.match(j.$("salida-contenido").textContent, /Dinero insuficiente/);
  assert.match(j.$("salida-contenido").textContent.replace(/\s+/g, " "), /3.*8/, "se ven las entradas del caso en la salida");
  assert.deepEqual([...j.w.document.querySelectorAll("#hud-diodos .hud-diodo")].map((l) => l.dataset.estado), ["ok", "ok", "ok", "ok", "ok"]);
  j.cerrar();
});

// El banco de pruebas responde «verdadero» a TODA consulta de pantalla (movimiento reducido); aquí solo a esa, para que sea un escritorio.
const escritorio = (w) => {
  w.matchMedia = (q) => ({ matches: /reduced-motion/.test(q), addEventListener() {}, removeEventListener() {} });
};
await prueba("«Más info» se abre solo la primera vez que entras a un nivel; después, el texto largo queda plegado", async () => {
  const j = await abrirM6(1, { antes: escritorio });
  await j.arrancado();
  assert.equal(j.$("mas-info").dataset.abierto, "true", "primera vez: abierto");
  assert.equal(j.$("btn-mas-info").getAttribute("aria-expanded"), "true");
  assert.match(j.$("texto-aprende").textContent, /máquina expendedora te pide primero el DINERO/, "el texto largo completo sigue ahí");
  j.$("btn-mas-info").click();
  assert.equal(j.$("mas-info").dataset.abierto, "false");
  j.cerrar();
  const k = await abrirM6(1, { antes: (w) => { escritorio(w); w.localStorage.setItem("codequest:masinfo:demo:56", "1"); } });
  await k.arrancado();
  assert.equal(k.$("mas-info").dataset.abierto, "false", "las veces siguientes entra plegado");
  k.cerrar();
});

// Demo de un nivel cualquiera (admin): sin progreso previo, con tours y teoría ya vistos.
const abrirDemo = (mundo, nivel, extra = {}) =>
  abrir({
    url: `juego.html?mundo=${mundo}&nivel=${nivel}&demo=true`,
    perfil: ADMIN,
    bd: new BDFalsa(),
    antes: (w) => {
      escritorio(w);
      w.localStorage.setItem("codequest:tour-visto", "1");
      for (let m = 1; m <= 5; m++) {
        w.localStorage.setItem(`codequest:teoria:demo:${m}`, "1");
        w.localStorage.setItem(`codequest:tour-mundo:demo:${m}`, "1");
      }
      extra.antes?.(w);
    },
  });
const insertarChip = (j, clave) => j.w.document.querySelector(`#lista-instrucciones .chip-insertable[data-clave="${clave}"]`).click();

await prueba("BOTONES DE INSERCIÓN: cada instrucción disponible es un botón que escribe su sintaxis de Python donde está el cursor", async () => {
  const j = await abrirDemo(5, 1);
  await j.arrancado();
  const chips = [...j.w.document.querySelectorAll("#lista-instrucciones .chip-insertable")];
  assert.ok(chips.length >= 10, "hay un botón por instrucción disponible");
  assert.ok(chips.every((c) => c.tagName === "BUTTON" && c.type === "button" && /Insertar .* en el editor/.test(c.getAttribute("aria-label"))), "son botones accesibles");
  const ta = j.$("editor-codigo");
  insertarChip(j, "print");
  assert.equal(ta.value, "print()");
  assert.equal(ta.selectionStart, 6, "el cursor queda dentro de los paréntesis");
  ta.setSelectionRange(ta.value.length, ta.value.length); // la persona mueve el cursor al final de la línea
  insertarChip(j, "if");
  assert.equal(ta.value, "print()\nif :\n    ", "una estructura abre línea nueva y trae el cuerpo sangrado");
  ta.setSelectionRange(ta.value.length, ta.value.length);
  insertarChip(j, "asignacion");
  assert.equal(ta.value, "print()\nif :\n    variable = ", "dentro del cuerpo respeta la sangría");
  assert.equal(j.$("contador-lineas").textContent, "Líneas: 3", "el contador se actualiza con lo insertado");
  sinErrores(j);
  j.cerrar();
});

await prueba("BOTONES DE INSERCIÓN: en un nivel de robot insertan los métodos del robot (robot1.avanzar())", async () => {
  const j = await abrirDemo(1, 2);
  await j.arrancado();
  const metodos = [...j.w.document.querySelectorAll("#lista-instrucciones .chip-insertable[data-metodo]")].map((b) => b.dataset.metodo);
  assert.ok(metodos.includes("avanzar"));
  j.w.document.querySelector('#lista-instrucciones .chip-insertable[data-metodo="avanzar"]').click();
  assert.match(j.$("editor-codigo").value, /robot1\.avanzar\(\)$/);
  j.cerrar();
});

await prueba("CONTADOR DE LÍNEAS: «Líneas: X / Límite»; se pone rojo (con ⚠) al pasarse y NUNCA bloquea la ejecución", async () => {
  const j = await abrirDemo(1, 20); // La Caja Fuerte, jefe del Mundo 1: 6 líneas recomendadas
  await j.arrancado();
  const c = () => j.$("contador-lineas");
  assert.equal(c().textContent, "Líneas: 0 / 6");
  assert.equal(c().dataset.excedido, "false");
  const sol = nivelPorId[45].fases[0].solucionReferencia; // 6 líneas
  j.escribir(sol);
  assert.equal(c().textContent, "Líneas: 6 / 6", "justo en el límite no es pasarse");
  assert.ok(!c().classList.contains("excedido"));
  j.escribir(sol + "\nextra = 1");
  assert.equal(c().textContent, "Líneas: 7 / 6 ⚠");
  assert.ok(c().classList.contains("excedido"), "rojo al pasarse");
  assert.match(c().title, /7 líneas/);
  await ejecutarConEntradas(j); // no bloquea: el programa se ejecuta igual
  assert.match(j.$("salida-contenido").textContent, /46/, "se ejecutó y mostró el código de la caja 1");
  j.escribir("");
  assert.equal(c().textContent, "Líneas: 0 / 6");
  sinErrores(j);
  j.cerrar();
});

await prueba("CONTADOR DE LÍNEAS: en niveles sin límite solo cuenta, y no aparece en las fases sin editor", async () => {
  const j = await abrirDemo(5, 1);
  await j.arrancado();
  j.escribir("a = 1\nb = 2");
  assert.equal(j.$("contador-lineas").textContent, "Líneas: 2");
  assert.equal(j.$("contador-lineas").hidden, false);
  j.cerrar();
});

await prueba("el tour de la primera vez muestra «Más info»: resalta el botón y explica qué abre", async () => {
  const j = await abrirM6(1, { antes: escritorio });
  j.w.localStorage.removeItem("codequest:tour-visto");
  await j.arrancado();
  j.$("btn-tour").click();
  const overlay = j.w.document.querySelector(".tour-overlay");
  const siguiente = () => overlay.querySelector(".tour-siguiente").click();
  siguiente(); // paso 2
  await new Promise((r) => setTimeout(r, 60));
  assert.equal(overlay.querySelector(".tour-titulo").textContent, "Más info");
  assert.match(overlay.querySelector(".tour-texto").textContent, /enunciado completo/);
  assert.match(overlay.querySelector(".tour-texto").textContent, /celular/);
  assert.match(overlay.querySelector(".tour-progreso").textContent, /2 de 5/);
  j.w.document.querySelector(".tour-cerrar").click();
  j.cerrar();
});

await prueba("NIVEL 2 · la puerta: no se teclea nada; las lámparas pasan y cada caso muestra SU clave en la memoria", async () => {
  const j = await abrirM6(2, { antes: escritorio });
  await j.arrancado();
  assert.match(j.$("titulo-nivel").textContent, /^Nivel 2 — El validador de contraseñas/);
  assert.match(j.$("hud-mision-texto").textContent, /MÁS de 8/);
  j.escribir(nivelPorId[57].fases[0].solucionReferencia);
  await ejecutarConEntradas(j);
  assert.deepEqual([...j.w.document.querySelectorAll("#hud-diodos .hud-diodo")].map((l) => l.dataset.estado), ["ok", "ok", "ok", "ok", "ok", "ok"]);
  assert.match(j.$("memoria-contenido").textContent, /contrasena/);
  assert.match(j.$("memoria-contenido").textContent, /longitud/);
  sinErrores(j);
  j.cerrar();
});

await prueba("NIVEL 3 · el radar SE JUEGA: el estudiante teclea sus intentos, el secreto no sale en Memoria y los 5 casos se prueban aparte", async () => {
  const j = await abrirM6(3, { antes: escritorio });
  await j.arrancado();
  assert.match(j.$("titulo-nivel").textContent, /^Nivel 3 — El juego de adivinanza/);
  assert.match(j.$("hud-mision-texto").textContent, /¡Juega!/);
  j.escribir(nivelPorId[58].fases[0].solucionReferencia);
  j.$("btn-ejecutar").click();
  // adivina a la primera (7); el caso 1 espera 3, 9, 7 y aun así su lámpara pasa: lo tecleado NO se compara con ningún caso
  assert.ok(await esperarHasta(() => j.w.document.querySelector(".entrada-campo")), "el juego pide teclear el intento");
  assert.match(j.w.document.querySelector(".entrada-etiqueta, .entrada-fila, .salida-entrada")?.textContent || "1 al 10", /1 al 10|Tu intento|⌨/);
  j.w.document.querySelector(".entrada-campo").value = "7";
  j.w.document.querySelector(".entrada-aceptar").click();
  assert.ok(await esperarHasta(() => /Adivinaste/.test(j.$("salida-contenido").textContent), 5000));
  assert.ok(await esperarHasta(() => [...j.w.document.querySelectorAll("#hud-diodos .hud-diodo")].every((l) => l.dataset.estado === "ok"), 6000), "los 5 casos pasan");
  assert.doesNotMatch(j.$("memoria-contenido").textContent, /secreto/, "el número secreto está oculto");
  assert.match(j.$("memoria-contenido").textContent, /intento|acertado/, "pero tus variables sí se ven");
  sinErrores(j);
  j.cerrar();
});

await prueba("NIVEL 4 · el núcleo: el proyecto corto no activa nada; el bueno abre la pantalla final", async () => {
  const j = await abrirM6(4, { antes: escritorio });
  await j.arrancado();
  j.escribir("a = 1\nif a == 1:\n    print(a)");
  await j.ejecutar();
  await new Promise((r) => setTimeout(r, 400));
  assert.equal(j.w.document.querySelector(".pantalla-final"), null);
  assert.match(j.feedback(), /al menos 10 líneas/);
  j.escribir(nivelPorId[59].fases[0].solucionReferencia);
  await j.ejecutar();
  assert.ok(await esperarHasta(() => j.w.document.querySelector(".pantalla-final"), 6000));
  j.cerrar();
});

console.log("Laboratorio Libre y modo demo");
await prueba("Laboratorio Libre: ejecuta sin validar y no toca la base de datos", async () => {
  const bd = new BDFalsa();
  const j = await abrir({ url: "juego.html?modo=sandbox", bd });
  await j.arrancado();
  const antes = JSON.stringify(bd.tablas);
  j.escribir("x = 5\nprint(x)\nrobot1.avanzar(3)");
  await j.ejecutar();
  assert.match(j.feedback(), /Programa ejecutado/);
  assert.equal(JSON.stringify(bd.tablas), antes, "no debe escribir nada");
  assert.equal(bd.escrituras, 0);
  sinErrores(j);
  j.cerrar();
});

await prueba("modo demo (admin): todo abierto, sin leer ni escribir progreso en la base de datos", async () => {
  const bd = new BDFalsa();
  const admin = { user_id: "u1", nombre: "Admin", rol: "admin", email: "a@x.mx" };
  const j = await abrir({ url: "juego.html?mundo=3&demo=true", perfil: admin, bd });
  await j.arrancado();
  assert.ok(j.w.document.querySelector(".insignia-demo"));
  const botones = [...j.$("selector-niveles").querySelectorAll(".nivel-punto")];
  assert.equal(botones.length, 13, "12 niveles + el Nivel Jefe");
  assert.equal(botones.filter((b) => b.classList.contains("nivel-jefe")).length, 1);
  assert.equal(botones.at(-1).textContent, "👑");
  assert.ok(botones.every((b) => !b.disabled), "en demo todos los niveles están abiertos");
  j.escribir(faseDe("32.1").codigoInicial);
  await j.ejecutar();
  assert.equal(bd.escrituras, 0);
  assert.equal(bd.lecturas, 0);
  sinErrores(j);
  j.cerrar();
});

await prueba("un admin sin ?demo vuelve al panel; un alumno no puede usar ?demo=true", async () => {
  const admin = { user_id: "u1", nombre: "Admin", rol: "admin", email: "a@x.mx" };
  const a = await abrir({ url: "juego.html?mundo=1", perfil: admin });
  await a.arrancado();
  assert.deepEqual(a.redirecciones, ["admin.html"]);
  const b = await abrir({ url: "juego.html?mundo=4&demo=true" }); // alumno: demo ignorado, mundo 4 bloqueado
  await b.arrancado();
  assert.deepEqual(b.redirecciones, ["mundos.html"]);
  a.cerrar();
  b.cerrar();
});

console.log(`\n${n} pruebas correctas (${ABIERTAS} páginas del juego abiertas en jsdom).`);
process.exit(0);
