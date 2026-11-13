// test_escenas_mundo6.mjs — las escenas propias de los niveles 2, 3 y 4 del Mundo 5 · Proyecto (antes Mundo 6: puerta, radar y núcleo):
// cada nivel se juega distinto y su escena reacciona a SU programa. También prueba la lista de requisitos del proyecto libre.
// Uso: node test_escenas_mundo6.mjs

import assert from "node:assert/strict";
import { readFileSync } from "fs";
import { Lexer } from "./js/interpreter/lexer.js";
import { Parser } from "./js/interpreter/parser.js";
import { Validator } from "./js/interpreter/validator.js";
import { crearEscenario, configDeFase } from "./js/game/escenarios/index.js";
import { EscenarioPuerta } from "./js/game/escenarios/puerta.js";
import { EscenarioRadar } from "./js/game/escenarios/radar.js";
import { EscenarioNucleo } from "./js/game/escenarios/nucleo.js";
import { ejecutarPrograma } from "./js/game/evaluacion.js";
import { listarRequisitos } from "./js/game/requisitos.js";
import { disco, anillo, linea, flecha, simboloOk } from "./js/game/pixel.js";

const cargar = (id) => JSON.parse(readFileSync(`levels/mundo5/level${id}.json`, "utf8"));
const N57 = cargar(57), N58 = cargar(58), N59 = cargar(59);
let n = 0;
const prueba = async (nombre, fn) => {
  await fn();
  n++;
  console.log(`  ✓ ${nombre}`);
};

async function correr(nivel, indiceCaso, codigo, { entradas = null } = {}) {
  const fase = nivel.fases[0];
  const caso = fase.casos?.[indiceCaso];
  const esc = crearEscenario(configDeFase(nivel, fase, caso), { canvas: null });
  const ast = new Parser(new Lexer(codigo).tokenizar()).parsear();
  new Validator({ instruccionesPermitidas: fase.instruccionesPermitidas, metodosPermitidos: [] }, { biblioteca: esc.biblioteca, variablesIniciales: Object.keys(esc.variablesIniciales) }).validar(ast);
  await ejecutarPrograma({ ast, escenario: esc, entradas: entradas ?? caso?.entradas ?? [] });
  return esc;
}
const idx = (nivel, etiqueta) => nivel.fases[0].casos.findIndex((c) => c.etiqueta === etiqueta);

console.log("Cada nivel tiene SU escena");
await prueba("el nivel 2 usa la puerta, el 3 el radar y el 4 el núcleo (y ninguna se parece a la máquina del nivel 1)", async () => {
  assert.ok(crearEscenario(N57.escenario) instanceof EscenarioPuerta);
  assert.ok(crearEscenario(N58.escenario) instanceof EscenarioRadar);
  assert.ok(crearEscenario(N59.escenario) instanceof EscenarioNucleo);
});

console.log("Nivel 2 · La puerta");
const SOL57 = N57.fases[0].solucionReferencia;
await prueba("los instrumentos muestran los datos del caso (clave, longitud y número) sin que el estudiante programe nada", async () => {
  const esc = crearEscenario(configDeFase(N57, N57.fases[0], N57.fases[0].casos[0]));
  assert.equal(esc.clave, "Robot12345");
  assert.equal(esc.longitud, 10);
  assert.equal(esc.tieneNumero, true);
  assert.deepEqual([esc.rele1, esc.acceso], [null, null], "antes de decidir, los relés no dicen nada (no se regala la respuesta)");
});
await prueba("clave segura: se retiran los cerrojos, sube la puerta y los dos relés quedan verdes", async () => {
  const esc = await correr(N57, 0, SOL57);
  assert.deepEqual([esc.rele1, esc.rele2, esc.acceso], [true, true, true]);
  assert.equal(esc.puerta, 1);
  assert.equal(esc.cerrojo, 1);
  assert.equal(esc.nix, "feliz");
});
await prueba("clave débil: la puerta NO se abre y los relés explican por qué (largo, número o los dos)", async () => {
  const sinNumero = await correr(N57, idx(N57, "Larga pero sin número"), SOL57);
  assert.deepEqual([sinNumero.rele1, sinNumero.rele2, sinNumero.acceso, sinNumero.puerta], [true, false, false, 0]);
  const corta = await correr(N57, idx(N57, "Con número pero corta"), SOL57);
  assert.deepEqual([corta.rele1, corta.rele2], [false, true]);
  const justo8 = await correr(N57, idx(N57, "Justo 8 caracteres"), SOL57);
  assert.deepEqual([justo8.rele1, justo8.rele2, justo8.acceso], [false, true, false], "8 no es «más de 8»");
  assert.equal(justo8.nix, "preocupado");
});
await prueba("si el programa dice «segura» para una clave débil, la puerta SE ABRE (la consecuencia del error se ve) pero el caso falla", async () => {
  const esc = await correr(N57, idx(N57, "Corta y sin número"), 'print("Contraseña segura")');
  assert.equal(esc.puerta, 1);
  assert.deepEqual([esc.rele1, esc.rele2], [false, false], "los relés muestran la realidad: no debía abrirse");
});

console.log("Nivel 3 · El radar (se juega a mano)");
const SOL58 = N58.fases[0].solucionReferencia;
await prueba("se juega: el estudiante teclea sus intentos (el nivel lo marca) y el secreto no aparece en Memoria", async () => {
  const f = N58.fases[0];
  assert.equal(f.entradasInteractivas, true);
  assert.deepEqual(f.variablesOcultas, ["secreto"]);
  assert.match(f.etiquetaEntrada, /1 al 10/);
});
await prueba("cada intento lanza una onda y gasta una pila; al acertar se revela la cápsula y Nix celebra", async () => {
  const esc = await correr(N58, 0, SOL58, { entradas: ["3", "9", "7"] });
  assert.equal(esc.secreto, 7);
  assert.equal(esc.intentos, 3);
  assert.equal(esc.pings.length, 3);
  assert.deepEqual(esc.pings.map((p) => p.nivel), [3, 9, 7]);
  assert.equal(esc.ultimo, 7);
  assert.equal(esc.revelada, true);
  assert.equal(esc.nix, "feliz");
  assert.equal(esc.maxIntentos, 5);
});
await prueba("pistas: «Muy bajo» → flecha arriba · «Muy alto» → flecha abajo (se ve en el último marcador)", async () => {
  const esc = crearEscenario(configDeFase(N58, N58.fases[0], N58.fases[0].casos[0]));
  await esc.alImprimir("Muy bajo");
  assert.equal(esc.pista, "bajo");
  await esc.alImprimir("Muy alto");
  assert.equal(esc.pista, "alto");
  await esc.alImprimir("¡Adivinaste!");
  assert.equal(esc.pista, null);
  assert.equal(esc.revelada, true);
});
await prueba("perder: las 5 pilas se agotan, estática en el radar, se revela el secreto y Nix se preocupa", async () => {
  const esc = await correr(N58, idx(N58, "Pierde"), SOL58, { entradas: ["1", "2", "3", "4", "5"] });
  assert.equal(esc.intentos, 5);
  assert.equal(esc.secreto, 10);
  assert.equal(esc.revelada, true);
  assert.equal(esc.nix, "preocupado");
});
await prueba("las lámparas eligen el secreto con el que juegas (cada caso trae el suyo)", async () => {
  const secretos = N58.fases[0].casos.map((c) => crearEscenario(configDeFase(N58, N58.fases[0], c)).secreto);
  assert.deepEqual(secretos, [7, 4, 10, 5, 2]);
});

console.log("Nivel 4 · El núcleo");
await prueba("el monitor guarda solo las últimas 3 líneas que imprimió el programa", async () => {
  const esc = await correr(N59, 0, 'print("a")\nprint("b")\nprint("c")\nprint("d")', { entradas: [] });
  assert.deepEqual(esc.salidas, ["b", "c", "d"]);
});
await prueba("requisitos: se deducen de la validación del nivel (líneas, if, while, variable y ejecución)", async () => {
  const f = N59.fases[0];
  const bien = listarRequisitos(f, f.solucionReferencia);
  assert.deepEqual(bien.map((r) => r.id), ["lineas", "if", "while", "variable", "ejecucion"]);
  assert.ok(bien.every((r) => r.ok), "la solución de referencia cumple todo");
  assert.match(bien[0].detalle, /^\d+\/10$/);
  const corto = listarRequisitos(f, "a = 1\nif a == 1:\n    print(a)");
  assert.deepEqual(corto.map((r) => [r.id, r.ok]), [["lineas", false], ["if", true], ["while", false], ["variable", true], ["ejecucion", true]]);
  assert.deepEqual(listarRequisitos(N57.fases[0], "x = 1").map((r) => r.id), ["if", "and", "else", "ejecucion"], "también sirve para otros niveles con construcciones requeridas");
  assert.deepEqual(listarRequisitos({ validacion: { tipo: "ejecutado" } }, "x = 1"), [], "una fase sin requisitos de estructura no genera lista");
  assert.deepEqual(listarRequisitos(null, ""), []);
});
await prueba("todos los módulos en verde: el núcleo se activa, se abre el domo y Nix sube a la superficie", async () => {
  const esc = crearEscenario(N59.escenario);
  await esc.marcarRequisitos(listarRequisitos(N59.fases[0], N59.fases[0].solucionReferencia));
  assert.equal(esc.energia, 1);
  assert.equal(esc.domo, 1);
  assert.equal(esc.fin, true);
  assert.ok(esc.nixY < 10, "Nix llegó arriba");
  assert.equal(esc.nix, "feliz");
  assert.equal(esc.revelados, 5);
});
await prueba("un módulo en rojo: los demás se sincronizan, pero el núcleo NO se activa y el domo sigue cerrado", async () => {
  const esc = crearEscenario(N59.escenario);
  await esc.marcarRequisitos(listarRequisitos(N59.fases[0], "a = 1\nif a == 1:\n    print(a)"));
  assert.equal(esc.fin, false);
  assert.equal(esc.domo, 0);
  assert.equal(esc.energia, 0);
  assert.equal(esc.nix, "preocupado");
  assert.equal(esc.revelados, 5);
  esc.reiniciar();
  assert.deepEqual([esc.revelados, esc.salidas.length, esc.fin], [0, 0, false]);
});

console.log("Dibujo");
function entorno() {
  const reg = { aux: [], principal: 0 };
  const mk = (cuenta) => new Proxy({}, { get: (o, k) => (k === "fillRect" ? () => { cuenta.rects++; } : k === "measureText" ? () => ({ width: 5 }) : () => {}), set: () => true });
  globalThis.window = { devicePixelRatio: 1, innerHeight: 800, addEventListener() {}, removeEventListener() {}, matchMedia: () => ({ matches: false }) };
  globalThis.document = {
    hidden: false, addEventListener() {}, removeEventListener() {},
    createElement: () => { const cuenta = { rects: 0 }; reg.aux.push(cuenta); return { width: 0, height: 0, getContext: () => mk(cuenta) }; },
  };
  const principal = { getContext: () => mk({ rects: 0 }), width: 600, height: 336, isConnected: true, style: {}, dataset: {}, parentElement: { clientWidth: 600 } };
  return { reg, principal };
}
await prueba("cada escena se dibuja en todos sus estados, la capa estática se pinta UNA vez y el lienzo se marca como pixel art", async () => {
  const { reg, principal } = entorno();
  const escenas = [
    [N57.escenario, N57.fases[0].casos[0], { puerta: 0.5, cerrojo: 0.4, rele1: true, rele2: false, acceso: false, alarma: 1, vibra: 1, casos: [true, false, null, true, true, false], lcd: "mensaje largo que se desplaza por la pantallita" }],
    [N58.escenario, N58.fases[0].casos[0], { intentos: 4, pings: [{ nivel: 3, t: 0.5 }, { nivel: 9, t: 1 }], ultimo: 9, pista: "alto", revelada: true, estatica: 1, destelloCapsula: 1, esperandoEntrada: true, casos: [true, false, null, true, true] }],
    [N59.escenario, null, { requisitos: { lineas: { ok: false, detalle: "7/10" }, if: { ok: true }, while: { ok: true }, variable: { ok: true }, ejecucion: { ok: true } }, revelados: 5, energia: 1, domo: 0.6, nixY: 30, fin: true, flash: 1, salidas: ["hola", "mundo"] }],
  ];
  for (const [config, caso, estado] of escenas) {
    const esc = crearEscenario({ ...config, ...(caso?.escenario ?? {}) }, { canvas: principal });
    esc.reducido = true;
    esc.destruir();
    esc.destruido = false;
    esc.ajustarTamano();
    esc.render();
    const antes = reg.aux.length;
    const estaticos = reg.aux[antes - 1].rects;
    for (let i = 0; i < 20; i++) esc.render();
    assert.equal(reg.aux[antes - 1].rects, estaticos, `${esc.tipo}: la capa estática no se vuelve a pintar`);
    Object.assign(esc, estado);
    for (const nix of ["normal", "feliz", "preocupado"]) {
      esc.nix = nix;
      assert.doesNotThrow(() => esc.render(), esc.tipo);
    }
    assert.equal(principal.dataset.pixel, "1", `${esc.tipo}: marca de pixel art`);
  }
  delete globalThis.document;
  delete globalThis.window;
});
await prueba("las formas de píxeles (disco, anillo, línea, flecha, símbolo) pintan sin fallar y de forma acotada", async () => {
  let rects = 0;
  const ctx = new Proxy({}, { get: (o, k) => (k === "fillRect" ? () => rects++ : () => {}), set: () => true });
  disco(ctx, 20, 20, 5, "#fff");
  assert.ok(rects >= 11 && rects <= 12, "un disco de radio 5 son 11 filas");
  rects = 0;
  anillo(ctx, 20, 20, 10, "#fff");
  assert.ok(rects > 20 && rects < 120);
  rects = 0;
  linea(ctx, 0, 0, 10, 5, "#fff");
  assert.ok(rects >= 11 && rects <= 12);
  rects = 0;
  linea(ctx, 0, 0, 1e6, 1e6, "#fff"); // una línea enorme no cuelga la página
  assert.ok(rects <= 400);
  rects = 0;
  flecha(ctx, 0, 0, "arriba", "#fff");
  flecha(ctx, 0, 0, "abajo", "#fff");
  assert.ok(rects > 6);
  rects = 0;
  simboloOk(ctx, 0, 0, true);
  simboloOk(ctx, 0, 0, false);
  simboloOk(ctx, 0, 0, null);
  assert.equal(rects, 9, "✓ = 4, ✗ = 5, sin probar = 0");
});

console.log(`\n${n} pruebas correctas.`);
process.exit(0);
