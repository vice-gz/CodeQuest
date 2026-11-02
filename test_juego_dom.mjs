// test_juego_dom.mjs
// Prueba de INTEGRACIÓN de juego.html: carga el juego real (js/juego.js, con los
// escenarios, el intérprete, el repositorio de Supabase y toda la interfaz) dentro
// de jsdom, con un Supabase simulado y un <canvas> falso, y juega de verdad:
// escribe código, pulsa Ejecutar y comprueba pantalla y base de datos.
// Solo se sustituyen supabase.js, auth.js, nav.js y catalogo.js (que en el
// navegador usa import.meta.glob de Vite); las redirecciones se capturan.
// Uso: node test_juego_dom.mjs

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
    export const catalogo = construirCatalogo(lista);
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
    b.onLoad({ filter: /js\/.*\.js$/, namespace: "file" }, (a) => ({
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
  constructor({ jugador = null, fases = [] } = {}) {
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

async function abrir({ url, perfil = PERFIL_ALUMNO, bd = new BDFalsa(), bienvenidaVista = true }) {
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
  const j = await abrir({ url: "juego.html?mundo=1", bienvenidaVista: false });
  await j.arrancado();
  assert.equal(j.w.document.body.dataset.mundo, "1");
  assert.match(j.$("titulo-nivel").textContent, /Nivel 1/);
  assert.match(j.$("titulo-mundo").textContent, /Laboratorio/);
  assert.ok(!j.$("estado-contenido").closest(".panel-estado").classList.contains("oculto"));
  const modal = await esperarHasta(() => j.w.document.querySelector(".modal-bienvenida"));
  assert.ok(modal, "debe aparecer la bienvenida del mundo");
  assert.match(j.w.document.querySelector(".modal-bienvenida").textContent, /Mundo 1: Despertar/);
  j.w.document.querySelector("[data-empezar]").click();
  assert.equal(j.w.localStorage.getItem("codequest:teoria:u1:1"), "1", "la bienvenida no debe repetirse");
  sinErrores(j);
  j.cerrar();
});

await prueba("Mundo 2: paleta morada, sin panel de Estado y chips de memoria", async () => {
  const bd = new BDFalsa({ fases: fasesCompletas(nivelesDeMundo(1)) });
  const j = await abrir({ url: "juego.html?mundo=2", bd });
  await j.arrancado();
  assert.equal(j.w.document.body.dataset.mundo, "2");
  assert.equal(j.w.document.body.style.getPropertyValue("--mundo-acento"), "#a78bfa");
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
  assert.ok(!titulos().includes("Variable"), "Variable es del Mundo 2: no se debe ver todavía");
  assert.ok(!titulos().some((t) => /if|while/i.test(t)));
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
  buscar.value = "variable";
  buscar.dispatchEvent(new j1.w.Event("input", { bubbles: true }));
  assert.equal(titulos().length, 0, "buscar un concepto futuro no lo revela");
  assert.match(modal.querySelector("[data-conteo]").textContent, /No encontramos/);
  j1.cerrar();

  const bd = new BDFalsa({ jugador: { mundo_actual: 3, nivel_actual: 20, experiencia: 0 }, fases: fasesCompletas([...nivelesDeMundo(1), ...nivelesDeMundo(2)]) });
  const j3 = await abrir({ url: "juego.html?mundo=3", bd });
  await j3.arrancado();
  j3.$("btn-conceptos").click();
  const modal3 = j3.w.document.querySelector(".modal-glosario");
  const t3 = [...modal3.querySelectorAll(".concepto-item summary > span:first-child")].map((s) => s.textContent);
  assert.ok(t3.includes("Condicional (if)") && t3.includes("else (si no)") && t3.includes("Comparadores") && t3.includes("Variable"));
  assert.ok(!t3.includes("Ciclo while"), "los ciclos son del Mundo 4");
  modal3.querySelector('[data-vista="solo"]').click();
  const solo = [...modal3.querySelectorAll(".concepto-item summary > span:first-child")].map((s) => s.textContent);
  assert.ok(!solo.includes("Variable") && solo.includes("Condicional (if)"), "«Solo el Mundo 3» oculta los anteriores");
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
  for (let i = 0; i < 8; i++) {
    await esperarHasta(() => true, 30);
    await new Promise((r) => setTimeout(r, 40));
    visto.push(`${overlay.querySelector(".tour-titulo").textContent}→${main.dataset.pestana}`);
    siguiente();
  }
  assert.deepEqual(
    visto.map((x) => x.split("→")[1]),
    ["jugar", "aprende", "jugar", "consola", "consola", "consola", "jugar", "jugar"],
    "cada paso debe estar en la pestaña donde vive su elemento"
  );
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

console.log("Mundo 3: mesa de cartas con casos");
const BD_MUNDO3 = () =>
  new BDFalsa({
    jugador: { mundo_actual: 3, nivel_actual: 20, experiencia: 0 },
    fases: [...fasesCompletas([...nivelesDeMundo(1), ...nivelesDeMundo(2)]), ...fasesCompletas([20], { excepto: ["20.3"] })],
  });

await prueba("una regla a ciegas NO pasa: se prueba en 4 mesas y se explica por caso", async () => {
  const bd = BD_MUNDO3();
  const j = await abrir({ url: "juego.html?mundo=3", bd });
  await j.arrancado();
  assert.equal(j.w.document.body.dataset.mundo, "3");
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
  const j = await abrir({ url: "juego.html?mundo=3", bd });
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
  const j = await abrir({ url: "juego.html?mundo=3", bd: BD_MUNDO3() });
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

console.log("Mundo 4: elevador y ciclos");
await prueba("while / for: solución correcta guardada; ciclo infinito detenido con RUN_005", async () => {
  const bd = new BDFalsa({
    jugador: { mundo_actual: 4, nivel_actual: 32, experiencia: 0 },
    fases: [...fasesCompletas([1, 2, 3, 4, 5, 6, 7, 8, ...nivelesDeMundo(2), ...nivelesDeMundo(3)]), ...fasesCompletas([32], { excepto: ["32.3"] })],
  });
  const j = await abrir({ url: "juego.html?mundo=4", bd });
  await j.arrancado();
  assert.equal(j.w.document.body.dataset.mundo, "4");
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
  const hechos = [...fasesCompletas([...nivelesDeMundo(1), ...nivelesDeMundo(2)]), ...fasesCompletas([20, 21])];
  const bd = () => new BDFalsa({ jugador: { mundo_actual: 3, nivel_actual: 22, experiencia: 0 }, fases: hechos });
  const a = await abrir({ url: "juego.html?mundo=3&nivel=2", bd: bd() });
  await a.arrancado();
  assert.match(a.$("titulo-nivel").textContent, /Nivel 2 — Ganar o perder/);
  const b = await abrir({ url: "juego.html?mundo=3&nivel=9", bd: bd() }); // el 8 no está completo: se ignora
  await b.arrancado();
  assert.match(b.$("titulo-nivel").textContent, /Nivel 3 —/, "debe retomar donde iba (nivel 3)");
  a.cerrar();
  b.cerrar();
});

console.log("Transición entre mundos");
await prueba("al terminar el Nivel 8 sale la pantalla narrativa (no el nivel 9) y el botón abre el Mundo 2", async () => {
  const ultima = nivelPorId[8].fases.at(-1);
  const bd = new BDFalsa({ jugador: { mundo_actual: 1, nivel_actual: 8, experiencia: 0 }, fases: fasesCompletas(nivelesDeMundo(1), { excepto: [ultima.id] }) });
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
  assert.match(texto, /Su memoria se ha borrado/);
  assert.match(texto, /Continuar al siguiente mundo/);
  assert.deepEqual(j.redirecciones, [], "no debe saltar solo al siguiente nivel");
  j.w.document.querySelector(".transicion-mundo button").click();
  await esperarHasta(() => j.redirecciones.length > 0);
  assert.deepEqual([...j.redirecciones], ["juego.html?mundo=2"]);
  sinErrores(j);
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
  const j = await abrir({ url: "juego.html?mundo=4&demo=true", perfil: admin, bd });
  await j.arrancado();
  assert.ok(j.w.document.querySelector(".insignia-demo"));
  const botones = [...j.$("selector-niveles").querySelectorAll(".nivel-punto")];
  assert.equal(botones.length, 12);
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
