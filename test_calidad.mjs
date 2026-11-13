// test_calidad.mjs — mejoras de calidad (QA) del cierre del proyecto:
//   3.1 canvas nítido (devicePixelRatio) · 3.2 indicadores de carga · 3.3 autoguardado · 3.4 pantalla final y conteo de líneas
//   + las validaciones nuevas del Mundo 6 (min_lineas, algunaVariable).
// Uso: node test_calidad.mjs

import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { EscenarioDatos } from "./js/game/escenarios/datos.js";
import { claveBorrador, guardarBorrador, leerBorrador, borrarBorrador, crearAutoguardado } from "./js/game/autoguardado.js";
import { registrarLineas, totalLineasEscritas } from "./js/game/lineasEscritas.js";
import { crearIndicadorCarga, crearCargaNivel } from "./js/ui/cargando.js";
import { mostrarPantallaFinal } from "./js/ui/pantallaFinal.js";
import { evaluarValidacion, contarLineasDePrograma } from "./js/game/validaciones.js";

let n = 0;
const prueba = async (nombre, fn) => {
  await fn();
  n++;
  console.log(`  ✓ ${nombre}`);
};
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

// Almacén de mentira con la misma interfaz que localStorage
const almacenFalso = () => {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), _m: m };
};

console.log("3.1 Canvas nítido");
await prueba("el buffer del canvas son píxeles FÍSICOS enteros y la escala los lleva exacto al tamaño CSS (dpr 1, 2 y 2.625)", async () => {
  for (const dpr of [1, 2, 2.625, 1.5, 3]) {
    globalThis.window = { devicePixelRatio: dpr, innerHeight: 900 };
    const transformaciones = [];
    const ctx = new Proxy({}, { get: (o, k) => (k === "setTransform" ? (...a) => transformaciones.push(a) : k === "measureText" ? () => ({ width: 10 }) : k === "createLinearGradient" ? () => ({ addColorStop() {} }) : () => {}), set: () => true });
    const canvas = { getContext: () => ctx, width: 0, height: 0, style: {}, parentElement: { clientWidth: 391 } };
    const esc = new EscenarioDatos({ tipo: "datos" }, { canvas });
    esc.ajustarTamano();
    assert.ok(Number.isInteger(canvas.width) && Number.isInteger(canvas.height), `dpr ${dpr}: el buffer debe medir píxeles enteros (${canvas.width}×${canvas.height})`);
    assert.equal(canvas.width, Math.round(391 * dpr));
    assert.equal(canvas.style.width, "391px", "el tamaño CSS no cambia con el dpr");
    const [sx, , , sy] = transformaciones.at(-1);
    assert.ok(Math.abs(canvas.width / sx - 391) < 1e-9, `dpr ${dpr}: la escala horizontal lleva el buffer exacto a 391 px CSS`);
    assert.ok(Math.abs(canvas.height / sy - parseFloat(canvas.style.height)) < 1e-9, `dpr ${dpr}: igual en vertical`);
    // el código de dibujo trabaja en píxeles CSS (no en físicos)
    const { w, h } = esc.dimensiones();
    assert.equal(w, 391);
    assert.equal(h, parseFloat(canvas.style.height));
  }
  globalThis.window = { devicePixelRatio: 1, innerHeight: 900 };
});

console.log("3.2 Feedback de carga");
const dom = () => new JSDOM("<body><div id='consola'></div><div id='capa' ></div></body>");
await prueba("el indicador «EJECUTANDO...» espera un instante (si todo es rápido no se ve) y se quita solo", async () => {
  const d = dom();
  globalThis.document = d.window.document;
  const consola = d.window.document.getElementById("consola");
  const rapido = crearIndicadorCarga({ contenedor: consola, texto: "EJECUTANDO...", retardoMs: 40 });
  rapido.iniciar();
  rapido.terminar(); // terminó antes del retardo
  await espera(80);
  assert.equal(consola.querySelector(".indicador-carga"), null, "una ejecución rápida nunca muestra el indicador");
  const lento = crearIndicadorCarga({ contenedor: consola, texto: "EJECUTANDO...", retardoMs: 30 });
  lento.iniciar();
  assert.equal(consola.querySelector(".indicador-carga"), null);
  await espera(70);
  assert.equal(consola.querySelector(".indicador-carga .carga-texto").textContent, "EJECUTANDO...");
  assert.equal(consola.querySelector(".indicador-carga").getAttribute("role"), "status");
  assert.equal(lento.visible, true);
  lento.iniciar(); // volver a iniciar no duplica
  await espera(70);
  assert.equal(consola.querySelectorAll(".indicador-carga").length, 1);
  lento.terminar();
  assert.equal(consola.querySelector(".indicador-carga"), null);
  assert.equal(lento.visible, false);
});
await prueba("la capa «CARGANDO...» del nivel: inmediata la primera vez, con retardo después, y se oculta", async () => {
  const d = dom();
  globalThis.document = d.window.document;
  const capa = d.window.document.getElementById("capa");
  capa.hidden = true;
  const carga = crearCargaNivel(capa);
  carga.mostrar(0);
  assert.equal(capa.hidden, false);
  assert.equal(d.window.document.body.getAttribute("aria-busy"), "true");
  carga.ocultar();
  assert.equal(capa.hidden, true);
  assert.equal(d.window.document.body.getAttribute("aria-busy"), null);
  carga.mostrar(40);
  assert.equal(capa.hidden, true, "con retardo: todavía no");
  carga.ocultar(); // terminó rápido: nunca aparece
  await espera(80);
  assert.equal(capa.hidden, true);
  carga.mostrar(30);
  await espera(70);
  assert.equal(capa.hidden, false);
  carga.ocultar();
  assert.doesNotThrow(() => crearCargaNivel(null).mostrar(), "sin el elemento no falla");
});

console.log("3.3 Autoguardado");
await prueba("guardar, leer y borrar el borrador (por persona y por fase)", async () => {
  const a = almacenFalso();
  assert.equal(guardarBorrador("u1", "1.1", "x = 1", "", a), true);
  assert.equal(leerBorrador("u1", "1.1", a), "x = 1");
  assert.equal(a.getItem(claveBorrador("u1", "1.1")), "x = 1");
  assert.equal(leerBorrador("u2", "1.1", a), null, "otra persona no ve el borrador");
  assert.equal(leerBorrador("u1", "1.2", a), null, "otra fase no lo ve");
  borrarBorrador("u1", "1.1", a);
  assert.equal(leerBorrador("u1", "1.1", a), null);
});
await prueba("no guarda borradores inútiles: vacío, igual al código inicial o enorme (y los borra)", async () => {
  const a = almacenFalso();
  guardarBorrador("u1", "1.1", "x = 1", "", a);
  assert.equal(guardarBorrador("u1", "1.1", "   \n ", "", a), false);
  assert.equal(leerBorrador("u1", "1.1", a), null, "un editor vacío borra el borrador");
  assert.equal(guardarBorrador("u1", "1.2", "print(1)", "print(1)", a), false);
  assert.equal(leerBorrador("u1", "1.2", a), null, "igual al código de partida: no hay nada que recuperar");
  assert.equal(guardarBorrador("u1", "1.3", "x".repeat(20001), "", a), false);
});
await prueba("si localStorage falla (lleno o bloqueado) el juego sigue sin autoguardado y sin errores", async () => {
  const roto = { getItem: () => { throw new Error("bloqueado"); }, setItem: () => { throw new Error("lleno"); }, removeItem: () => { throw new Error("bloqueado"); } };
  assert.doesNotThrow(() => {
    assert.equal(guardarBorrador("u1", "1.1", "x = 1", "", roto), false);
    assert.equal(leerBorrador("u1", "1.1", roto), null);
    borrarBorrador("u1", "1.1", roto);
  });
});
await prueba("crearAutoguardado: espera a que dejes de teclear, guarda ya con guardarAhora y descartar cancela lo pendiente", async () => {
  const a = almacenFalso();
  let codigo = "";
  let fase = "5.1";
  const auto = crearAutoguardado({ usuarioId: () => "u1", faseId: () => fase, codigoInicial: () => "", obtenerCodigo: () => codigo, retardoMs: 40, almacen: a });
  codigo = "a = 1";
  auto.programar();
  codigo = "a = 1\nb = 2";
  auto.programar();
  assert.equal(leerBorrador("u1", "5.1", a), null, "todavía no");
  await espera(80);
  assert.equal(leerBorrador("u1", "5.1", a), "a = 1\nb = 2", "una sola escritura, con lo último");
  codigo = "c = 3";
  auto.programar();
  auto.guardarAhora(); // al cambiar de fase o cerrar la página
  assert.equal(leerBorrador("u1", "5.1", a), "c = 3");
  codigo = "d = 4";
  auto.programar();
  auto.descartar(); // la fase se completó
  await espera(80);
  assert.equal(leerBorrador("u1", "5.1", a), null, "descartar borra y cancela lo pendiente (no reaparece)");
  fase = null; // fase sin editor (PREDECIR…)
  auto.programar();
  await espera(80);
  assert.equal(a._m.size, 0);
});

console.log("3.4 Pantalla final y líneas escritas");
await prueba("cuenta líneas de código (sin vacías ni comentarios) por fase, sin repetir, y solo en fases donde se escribe código", async () => {
  const a = almacenFalso();
  assert.equal(contarLineasDePrograma("a = 1\n\n# nota\n  \nprint(a)\n"), 2);
  registrarLineas("u1", "56.1", "RESOLVER", "a = 1\nprint(a)\n\n# x", a);
  registrarLineas("u1", "57.1", "RESOLVER", "if x:\n    print(1)\nelse:\n    print(2)", a);
  assert.equal(totalLineasEscritas("u1", a), 6);
  registrarLineas("u1", "56.1", "RESOLVER", "a = 1\nb = 2\nprint(a + b)", a); // repetir la fase NO suma dos veces: cuenta la última solución
  assert.equal(totalLineasEscritas("u1", a), 7);
  registrarLineas("u1", "1.1", "EXPLORAR", "print(1)", a);
  registrarLineas("u1", "1.2", "PREDECIR", "print(1)", a);
  registrarLineas("u1", "0.1", "ORDENAR", "orden:a>b", a);
  assert.equal(totalLineasEscritas("u1", a), 7, "EXPLORAR, PREDECIR y ORDENAR no son código escrito");
  assert.equal(totalLineasEscritas("u2", a), 0, "cada persona su total");
  a.setItem("codequest:lineas:u3", "esto no es json");
  assert.equal(totalLineasEscritas("u3", a), 0, "un dato dañado no rompe nada");
});
await prueba("la pantalla final muestra el mensaje, las estrellas y las líneas, y «Seguir practicando» la cierra", async () => {
  const d = new JSDOM("<body></body>");
  globalThis.document = d.window.document;
  const promesa = mostrarPantallaFinal({ estrellas: 150, estrellasMax: 180, lineas: 231, nombre: "<b>Ana</b>" });
  const capa = d.window.document.querySelector(".pantalla-final");
  assert.equal(capa.getAttribute("role"), "dialog");
  assert.equal(capa.querySelector("h1").textContent, "¡Felicidades, has completado CodeQuest!");
  assert.equal(capa.querySelector(".final-sub").textContent, "Ahora piensas como un programador, <b>Ana</b>.");
  assert.equal(capa.querySelector("b"), null, "el nombre se inserta como texto, nunca como HTML");
  assert.equal(capa.querySelector("#final-estrellas").textContent, "★ 150 / 180");
  assert.equal(capa.querySelector("#final-lineas").textContent, "231");
  assert.match(capa.textContent, /231\s*líneas de código escritas/);
  assert.ok(d.window.document.body.classList.contains("sin-scroll"));
  assert.equal(capa.querySelector('a[href="mundos.html"]').textContent, "Volver al mapa");
  capa.querySelector("button").click();
  assert.equal(await promesa, "cerrar");
  assert.equal(d.window.document.querySelector(".pantalla-final"), null);
  assert.ok(!d.window.document.body.classList.contains("sin-scroll"));
  const una = mostrarPantallaFinal({ estrellas: 1, estrellasMax: 180, lineas: 1 });
  assert.match(d.window.document.querySelector(".final-dato:nth-child(2) span").textContent, /^línea de código escrita$/, "singular con 1 línea");
  d.window.document.querySelector(".pantalla-final button").click();
  await una;
});

console.log("Validaciones del Mundo 6");
await prueba("min_lineas y algunaVariable: el proyecto libre exige 10 líneas de código, if, while y una variable", async () => {
  const esc = { evaluar: () => undefined };
  const v = { tipo: "todos", condiciones: [{ tipo: "ejecutado" }, { tipo: "min_lineas", minimo: 10 }], requiere: { construcciones: ["if", "while"], algunaVariable: true } };
  const ok = (codigo) => evaluarValidacion(v, esc, { salidas: [], memoria: {}, codigo });
  const bueno = "e = 10\nc = 0\nprint(1)\nwhile e > 0:\n    e = e - 3\n    c = c + 1\n    if e > 5:\n        print(2)\n    else:\n        print(3)\nprint(c)";
  assert.equal(ok(bueno), true);
  assert.equal(ok(bueno.split("\n").slice(0, 9).join("\n")), false, "9 líneas no alcanzan");
  assert.equal(ok("# a\n# b\n# c\n" + bueno.split("\n").slice(0, 9).join("\n")), false, "los comentarios no cuentan como líneas");
  assert.equal(ok(bueno.replace("while", "if")), false, "sin while");
  assert.equal(ok(bueno.replace("    if e > 5:", "    print(9)\n    if_x = 1").replace("if_x", "z")), false, "sin if");
  const sinVariable = "print(1)\nprint(2)\nwhile True:\n    print(3)\nif 1 == 1:\n    print(4)\nprint(5)\nprint(6)\nprint(7)\nprint(8)";
  assert.equal(ok(sinVariable), false, "sin ninguna variable");
  assert.equal(ok(bueno.replace('print(1)', 'print("if while x = 5")').replace("while e > 0:", "pass")), false, "las palabras dentro de textos no cuentan");
});

console.log(`\n${n} pruebas correctas.`);
process.exit(0);
