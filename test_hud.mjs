// test_hud.mjs — la interfaz «de videojuego» de la pantalla del nivel (js/ui/hud.js):
// misión de una línea, progreso, lámparas de casos (✓ / ✗ con símbolo), «Más info», Nix con su globo y retroalimentación plegable.
// Usa el panel de retroalimentación REAL (ui/feedback.js) para que la prueba no se desactualice si cambia su marcado.
// Uso: node test_hud.mjs

import assert from "node:assert/strict";
import { readFileSync } from "fs";
import { JSDOM } from "jsdom";

const HTML = readFileSync("juego.html", "utf8").replace(/<script[^>]*src="js\/juego.js"[^>]*><\/script>/, "");
const dom = new JSDOM(HTML, { url: "http://localhost/juego.html", pretendToBeVisual: true });
const w = dom.window;
globalThis.window = w;
globalThis.document = w.document;
globalThis.MutationObserver = w.MutationObserver;
globalThis.localStorage = w.localStorage;

const { Hud, misionCorta, recortar, resumirFeedback } = await import("./js/ui/hud.js");
const { Feedback } = await import("./js/ui/feedback.js");

let n = 0;
const prueba = async (nombre, fn) => {
  await fn();
  n++;
  console.log(`  ✓ ${nombre}`);
};
const esperar = (ms = 20) => new Promise((r) => setTimeout(r, ms));
const $ = (id) => w.document.getElementById(id);

let anterior = null;
function crear({ movil = false } = {}) {
  // Cada prueba arranca de cero sobre el mismo documento: se sueltan el observador y los oyentes de la anterior.
  anterior?.destruir();
  for (const id of ["btn-mas-info", "btn-nix-detalle", "btn-feedback-detalle"]) $(id).replaceWith($(id).cloneNode(true));
  $("mas-info").dataset.abierto = "false";
  $("nix-sprite").getContext = () => new Proxy({}, { get: () => () => {}, set: () => true }); // jsdom no trae canvas: lo que importa aquí es el DOM
  const feedback = new Feedback($("feedback-contenido"));
  const aprende = [];
  const hud = new Hud(
    {
      misionTexto: $("hud-mision-texto"), fases: $("hud-fases"), diodos: $("hud-diodos"), btnMasInfo: $("btn-mas-info"), masInfo: $("mas-info"),
      globo: $("nix-globo"), globoTexto: $("nix-texto"), btnNixDetalle: $("btn-nix-detalle"), nixSprite: $("nix-sprite"),
      panelFeedback: w.document.querySelector(".panel-feedback"), btnFeedbackDetalle: $("btn-feedback-detalle"), feedbackContenido: $("feedback-contenido"),
    },
    { esMovil: () => movil, irAAprende: () => aprende.push(1) }
  );
  hud.observarFeedback();
  anterior = hud;
  return { hud, feedback, aprende };
}

console.log("Misión de una línea");
await prueba("la misión sale de la fase: la autoría gana; si no, se deduce por tipo; nunca es un párrafo", async () => {
  assert.equal(misionCorta({ tipo: "RESOLVER", mision: "Cobra bien.", enunciado: "otra cosa" }), "Cobra bien.");
  assert.equal(misionCorta({ tipo: "EXPLORAR", titulo: "Se construye una máquina", enunciado: "Concepto nuevo: una función es una MÁQUINA…" }), "Ejecuta y observa: Se construye una máquina");
  assert.equal(misionCorta({ tipo: "PREDECIR", titulo: "¿Qué muestra?", enunciado: "En Python…" }), "Predice qué pasa: ¿Qué muestra?");
  assert.equal(misionCorta({ tipo: "ESCRIBIR", titulo: "x", enunciado: "Crea una variable llamada mision con el texto \"Explorar\" y muéstrala con print(). Luego algo más." }), 'Crea una variable llamada mision con el texto "Explorar" y muéstrala con print().');
  assert.equal(misionCorta({ tipo: "ESCRIBIR", titulo: "T", enunciado: "<b>Hola</b> mundo sin punto" }), "Hola mundo sin punto", "sin HTML");
  const larga = misionCorta({ tipo: "RESOLVER", titulo: "T", enunciado: `${"palabra ".repeat(60)}.` });
  assert.ok(larga.length <= 180 && larga.endsWith("…"));
  assert.equal(misionCorta(null), "");
  assert.equal(recortar("corto"), "corto");
  assert.ok(recortar("a ".repeat(200), 40).length <= 41);
});
await prueba("el HUD pone la misión en la escena", async () => {
  const { hud } = crear();
  hud.ponerMision({ tipo: "RESOLVER", mision: "Haz algo." });
  assert.equal($("hud-mision-texto").textContent, "Haz algo.");
  assert.match(w.document.querySelector(".hud-etiqueta").textContent, /MISIÓN/);
});

console.log("Progreso y lámparas de casos");
await prueba("progreso del nivel: ✓ hechas, ● actual, ○ pendientes y «Fase i/n»; con una sola fase no se muestra", async () => {
  const { hud } = crear();
  const fases = [{ id: "a", titulo: "Uno" }, { id: "b", titulo: "Dos" }, { id: "c", titulo: "Tres" }];
  hud.ponerFases(fases, 1, new Set(["a"]));
  const puntos = [...$("hud-fases").querySelectorAll(".hud-fase")];
  assert.deepEqual(puntos.map((p) => p.textContent), ["✓", "●", "○"]);
  assert.deepEqual(puntos.map((p) => p.dataset.estado), ["hecha", "actual", "pendiente"]);
  assert.match($("hud-fases").textContent, /Fase 2\/3/);
  assert.equal($("hud-fases").getAttribute("aria-label"), "Fase 2 de 3");
  hud.ponerFases([fases[0]], 0);
  assert.equal($("hud-fases").hidden, true);
});
await prueba("lámparas de casos: una por caso, con SÍMBOLO además de color y texto accesible; se pueden elegir", async () => {
  const { hud } = crear();
  const elegidos = [];
  hud.ponerCasos([{ etiqueta: "Caja 1" }, { etiqueta: "Caja 2" }, { etiqueta: "Caja 3" }], 0, (i) => elegidos.push(i));
  const lamparas = () => [...$("hud-diodos").querySelectorAll(".hud-diodo")];
  assert.equal($("hud-diodos").hidden, false);
  assert.deepEqual(lamparas().map((l) => l.querySelector(".hud-diodo-simbolo").textContent), ["○", "○", "○"]);
  assert.equal(lamparas()[0].getAttribute("aria-pressed"), "true");
  hud.marcarCasos([true, false, null]);
  assert.deepEqual(lamparas().map((l) => l.dataset.estado), ["ok", "mal", "pendiente"]);
  assert.deepEqual(lamparas().map((l) => l.querySelector(".hud-diodo-simbolo").textContent), ["✓", "✗", "○"], "no depende solo del color (daltonismo)");
  assert.equal(lamparas()[1].getAttribute("aria-label"), "Caja 2: falló");
  assert.equal(lamparas()[0].getAttribute("aria-label"), "Caja 1: correcto");
  hud.reiniciarCasos();
  assert.deepEqual(lamparas().map((l) => l.dataset.estado), ["pendiente", "pendiente", "pendiente"]);
  lamparas()[2].click();
  assert.deepEqual(elegidos, [2]);
  hud.marcarActivo(2);
  assert.deepEqual(lamparas().map((l) => l.getAttribute("aria-pressed")), ["false", "false", "true"]);
  hud.ponerCasos([], 0, null);
  assert.equal($("hud-diodos").hidden, true, "sin casos no hay lámparas");
});

console.log("Más info");
await prueba("escritorio: «Más info» abre y cierra el texto largo; en celular lleva a la pestaña Aprende", async () => {
  const d = crear();
  const panel = $("mas-info");
  assert.equal(panel.dataset.abierto, "false");
  $("btn-mas-info").click();
  assert.equal(panel.dataset.abierto, "true");
  assert.equal($("btn-mas-info").getAttribute("aria-expanded"), "true");
  $("btn-mas-info").click();
  assert.equal(panel.dataset.abierto, "false");
  const m = crear({ movil: true });
  $("btn-mas-info").click();
  assert.equal(m.aprende.length, 1, "en celular cambia de pestaña");
});
await prueba("se abre SOLO la primera vez que entras a un nivel (por persona y por nivel)", async () => {
  const almacen = new Map();
  const memoria = { getItem: (k) => almacen.get(k) ?? null, setItem: (k, v) => almacen.set(k, v) };
  const { hud } = crear();
  assert.equal(hud.abrirSiEsPrimeraVez("n:u1:5", memoria), true);
  assert.equal($("mas-info").dataset.abierto, "true");
  assert.equal(hud.abrirSiEsPrimeraVez("n:u1:5", memoria), false);
  assert.equal($("mas-info").dataset.abierto, "false", "la segunda vez entra plegado");
  assert.equal(hud.abrirSiEsPrimeraVez("n:u1:6", memoria), true, "otro nivel: otra primera vez");
  assert.equal(hud.abrirSiEsPrimeraVez("n:u2:5", memoria), true, "otra persona: otra primera vez");
  const roto = { getItem: () => { throw new Error("x"); }, setItem: () => { throw new Error("x"); } };
  assert.equal(hud.abrirSiEsPrimeraVez("n:u1:7", roto), false, "sin almacenamiento no falla");
});

console.log("Nix y la retroalimentación plegable");
await prueba("sin resultado Nix no habla; con un resultado dice la pista CORTA con su cara", async () => {
  const { feedback } = crear();
  feedback.mostrarInicial("Escribe tu código…");
  await esperar();
  assert.equal($("nix-globo").hidden, true);
  feedback.mostrarObjetivoNoAlcanzado("Revisa los casos.", [
    { etiqueta: "Caja 1", ok: true },
    { etiqueta: "Caja 2", ok: false, esperado: "46", obtenido: "imprimió 5" },
    { etiqueta: "Caja 3", ok: false, esperado: "29" },
  ]);
  await esperar();
  assert.equal($("nix-globo").hidden, false);
  assert.equal($("nix-globo").dataset.estado, "error");
  assert.match($("nix-texto").textContent, /falló los casos 2, 3/);
  assert.ok($("nix-texto").textContent.length <= 150);
});
await prueba("éxito: Nix celebra; un error de ejecución: Nix da la línea, el título y la idea", async () => {
  const { feedback } = crear();
  feedback.mostrarResultadoFase({ mensaje: "¡Bien hecho! Cobra bien.", botones: [] });
  await esperar();
  assert.equal($("nix-globo").dataset.estado, "exito");
  assert.match($("nix-texto").textContent, /Cobra bien/);
  feedback.mostrarError({ codigo: "SYN_019", mensaje: "Los decimales se escriben con punto", educativo: "En Python los decimales se escriben con punto, no con coma.", sugerencia: "Cambia la coma por un punto.", linea: 1 });
  await esperar();
  assert.equal($("nix-globo").dataset.estado, "error");
  assert.match($("nix-texto").textContent, /Línea 1/);
  assert.match($("nix-texto").textContent, /Cambia la coma por un punto/);
});
await prueba("la retroalimentación completa sigue ahí: plegada se esconde el detalle (no los botones) y «Ver detalle» la abre", async () => {
  const { feedback, hud } = crear();
  let pulsado = 0;
  feedback.mostrarObjetivoNoAlcanzado("Detalle largo de lo que falló.", [{ etiqueta: "Mesa 1", ok: false, esperado: "uno" }]);
  hud.plegarFeedback(true);
  const panel = w.document.querySelector(".panel-feedback");
  assert.equal(panel.dataset.plegado, "true");
  assert.equal($("btn-feedback-detalle").getAttribute("aria-expanded"), "false");
  assert.match($("btn-feedback-detalle").textContent, /Ver detalle/);
  // el texto completo sigue en el DOM (para lectores de pantalla y para las pruebas)
  assert.match($("feedback-contenido").textContent, /Detalle largo de lo que falló/);
  $("btn-nix-detalle").click();
  assert.equal(panel.dataset.plegado, "false", "«Ver detalle» del globo abre el panel");
  assert.match($("btn-feedback-detalle").textContent, /Ocultar detalle/);
  $("btn-feedback-detalle").click();
  assert.equal(panel.dataset.plegado, "true");
  void pulsado;
});
await prueba("un resultado nuevo repliega el detalle, pero una PISTA lo abre (la pidió la persona)", async () => {
  const { feedback } = crear();
  const panel = w.document.querySelector(".panel-feedback");
  feedback.mostrarResultadoFase({ mensaje: "Listo.", botones: [] });
  await esperar();
  assert.equal(panel.dataset.plegado, "true");
  feedback.mostrarPista("Piensa en el límite: ¿qué pasa con 8 justos?", 1, 2);
  await esperar();
  assert.equal($("nix-globo").dataset.estado, "pista");
  assert.equal(panel.dataset.plegado, "false");
});
await prueba("mientras se comprueba («COMPROBANDO…») Nix no repite el resultado anterior", async () => {
  const { feedback } = crear();
  feedback.mostrarObjetivoNoAlcanzado("Antiguo.", [{ etiqueta: "Caja 1", ok: false, esperado: "1" }]);
  await esperar();
  assert.equal($("nix-globo").hidden, false);
  const cargando = w.document.createElement("p");
  cargando.className = "indicador-carga";
  $("feedback-contenido").appendChild(cargando);
  await esperar();
  assert.equal($("nix-globo").hidden, true, "se oculta mientras llega el resultado nuevo");
  cargando.remove();
  assert.ok(true);
});
await prueba("resumirFeedback: nada que decir en el mensaje inicial", async () => {
  const { feedback } = crear();
  feedback.mostrarInicial("Hola");
  assert.equal(resumirFeedback($("feedback-contenido")), null);
  assert.equal(resumirFeedback(null), null);
});

console.log(`\n${n} pruebas correctas.`);
process.exit(0);
