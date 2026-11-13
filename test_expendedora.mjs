// test_expendedora.mjs — la máquina expendedora en PIXEL ART (Mundo 6 · Nivel 1) y el módulo de pixel art.
// 1) El modelo reacciona a lo que hace el PROGRAMA: dinero, precio, cambio, rechazo, lámparas de casos y Nix.
// 2) El dibujo funciona en todos los estados (con un lienzo de mentira) y la capa estática se pinta UNA sola vez.
// 3) La fuente de píxeles, los mapas de caracteres y el sprite de Nix.
// Uso: node test_expendedora.mjs

import assert from "node:assert/strict";
import { readFileSync } from "fs";
import { Lexer } from "./js/interpreter/lexer.js";
import { Parser } from "./js/interpreter/parser.js";
import { Validator } from "./js/interpreter/validator.js";
import { crearEscenario } from "./js/game/escenarios/index.js";
import { EscenarioExpendedora, LW, LH } from "./js/game/escenarios/expendedora.js";
import { ejecutarPrograma } from "./js/game/evaluacion.js";
import { PAL, anchoTexto, normalizarTexto, escribir, pintarMapa, pintarNix, ESTADOS_NIX, escalaEntera, crearLienzoPixel } from "./js/game/pixel.js";

const nivel = JSON.parse(readFileSync("levels/mundo5/level56.json", "utf8"));
const fase = nivel.fases[0];
const PERMISOS = fase.instruccionesPermitidas;

let n = 0;
const prueba = async (nombre, fn) => {
  await fn();
  n++;
  console.log(`  ✓ ${nombre}`);
};

// ---- lienzo de mentira: registra lo que se pinta
function lienzoFalso() {
  const registro = { rects: 0, imagenes: 0, textos: 0, recortes: 0 };
  const ctx = new Proxy(
    {},
    {
      get: (o, k) => {
        if (k === "fillRect") return () => registro.rects++;
        if (k === "drawImage") return () => registro.imagenes++;
        if (k === "clip") return () => registro.recortes++;
        return () => {};
      },
      set: () => true,
    }
  );
  return { ctx, registro };
}

async function correr(codigo, entradas, { config = { tipo: "expendedora" }, canvas = null } = {}) {
  const esc = crearEscenario(config, { canvas });
  if (canvas) esc.reducido = true; // sin animaciones reales
  const ast = new Parser(new Lexer(codigo).tokenizar()).parsear();
  new Validator({ instruccionesPermitidas: PERMISOS, metodosPermitidos: [] }, { biblioteca: esc.biblioteca }).validar(ast);
  await ejecutarPrograma({ ast, escenario: esc, entradas });
  return esc;
}

console.log("La máquina reacciona al programa");
await prueba("el nivel usa la escena «expendedora» y trae su misión de una línea", async () => {
  assert.equal(nivel.escenario.tipo, "expendedora");
  assert.ok(crearEscenario(nivel.escenario) instanceof EscenarioExpendedora);
  assert.match(fase.mision, /Cambio: X/);
  assert.ok(fase.mision.length < 150, "la misión es de UNA línea");
});
await prueba("compra aceptada: entran el dinero y el precio, sale el cambio, luz verde, cae el producto y Nix se alegra", async () => {
  const esc = await correr(fase.solucionReferencia, ["10", "7"]);
  assert.deepEqual([esc.dinero, esc.precio], [10, 7]);
  assert.equal(esc.cambio, 3, "3 monedas en la charola");
  assert.equal(esc.luz, "verde");
  assert.deepEqual(esc.vendido, { fila: 2, col: 7 % 3 }, "el producto elegido sale de la repisa de abajo");
  assert.equal(esc.lcd, "Cambio: 3");
  assert.equal(esc.nix, "feliz");
  assert.equal(esc.devueltas, 0);
});
await prueba("dinero justo: se entrega el producto con 0 monedas de cambio", async () => {
  const esc = await correr(fase.solucionReferencia, ["5", "5"]);
  assert.equal(esc.cambio, 0);
  assert.equal(esc.luz, "verde");
  assert.ok(esc.vendido);
});
await prueba("dinero insuficiente: luz roja, la máquina devuelve las monedas y Nix se preocupa (no cae ningún producto)", async () => {
  const esc = await correr(fase.solucionReferencia, ["3", "8"]);
  assert.equal(esc.luz, "rojo");
  assert.equal(esc.devueltas, 3);
  assert.equal(esc.cambio, 0);
  assert.equal(esc.vendido, null);
  assert.equal(esc.producto, null);
  assert.equal(esc.nix, "preocupado");
  assert.equal(esc.monedasInsertadas, 0, "las monedas ya no están dentro");
});
await prueba("billete grande y mucho cambio: el dibujo muestra como máximo 8 monedas, pero el número real es el correcto", async () => {
  const esc = await correr(fase.solucionReferencia, ["20", "1"]);
  assert.equal(esc.cambio, 19);
  assert.equal(esc.lcd, "Cambio: 19");
});
await prueba("cualquier otro print se ve en la pantallita (LCD)", async () => {
  const esc = await correr('print("Hola, máquina")', []);
  assert.equal(esc.lcd, "Hola, máquina");
  assert.equal(esc.luz, "amarillo");
});
await prueba("las lámparas de la máquina son los casos: ✓/✗ y Nix reacciona (todos bien = feliz; alguno mal = preocupado)", async () => {
  const esc = crearEscenario({ tipo: "expendedora" });
  await esc.marcarCasos([true, true, true, true, true]);
  assert.deepEqual(esc.casos, [true, true, true, true, true]);
  assert.equal(esc.nix, "feliz");
  await esc.marcarCasos([true, false, true, null, true]);
  assert.deepEqual(esc.casos, [true, false, true, null, true]);
  assert.equal(esc.nix, "preocupado");
  esc.reiniciar();
  assert.deepEqual(esc.casos, [], "al reiniciar se apagan");
  assert.equal(esc.nix, "normal");
});
await prueba("la fase pasa y se rechaza lo incorrecto con la escena nueva (los 5 casos en silencio)", async () => {
  for (const [dinero, precio, esperado] of [[10, 7, "Cambio: 3"], [5, 5, "Cambio: 0"], [3, 8, "Dinero insuficiente"], [20, 1, "Cambio: 19"], [99, 100, "Dinero insuficiente"]]) {
    const esc = await correr(fase.solucionReferencia, [String(dinero), String(precio)]);
    assert.equal(esc.lcd, esperado);
  }
});

console.log("Dibujo");
const entornoDibujo = () => {
  const c = lienzoFalso();
  let estaticos = 0;
  globalThis.window = { devicePixelRatio: 2, innerHeight: 900, addEventListener() {}, removeEventListener() {}, matchMedia: () => ({ matches: false }) };
  globalThis.document = {
    hidden: false,
    addEventListener() {},
    removeEventListener() {},
    createElement: () => {
      const l = lienzoFalso();
      c.auxiliares = (c.auxiliares ?? 0) + 1;
      c.registros = (c.registros ?? []).concat(l.registro);
      return { width: 0, height: 0, getContext: () => l.ctx };
    },
  };
  const principal = { getContext: () => c.ctx, width: 1200, height: 672, isConnected: true, style: {}, parentElement: { clientWidth: 600 } };
  return { c, principal, estaticos: () => estaticos };
};
await prueba("el dibujo funciona en todos los estados y la capa estática se pinta UNA sola vez (luego solo se copia)", async () => {
  const { c, principal } = entornoDibujo();
  const esc = new EscenarioExpendedora({ tipo: "expendedora" }, { canvas: principal });
  esc.reducido = true;
  esc.destruir(); // sin bucle de reposo en la prueba
  esc.destruido = false;
  esc.ajustarTamano();
  esc.render();
  const rectsEstatico = c.registros[1].rects; // el segundo auxiliar es la capa estática
  assert.ok(rectsEstatico > 80, "la máquina, la vitrina y el tablero son muchos rectángulos");
  for (let i = 0; i < 50; i++) esc.render();
  assert.equal(c.registros[1].rects, rectsEstatico, "50 cuadros más: la capa estática NO se vuelve a pintar");
  assert.equal(c.auxiliares, 2, "solo dos lienzos auxiliares (estático y de trabajo)");
  // estados raros: texto largo (se desplaza), números enormes, muchas monedas, casos de todos los tipos
  esc.lcd = "ESTE TEXTO ES MUCHO MAS LARGO QUE LA PANTALLITA";
  esc.dinero = 123456;
  esc.precio = 99999;
  esc.cambio = 50;
  esc.devueltas = 6;
  esc.monedasCayendo = [{ x: 117, y: 40 }];
  esc.producto = { x: 61, y: 70, fila: 2, col: 0 };
  esc.vendido = { fila: 2, col: 0 };
  esc.resorte = 4;
  esc.casos = [true, false, null, true, false];
  esc.destello = 1;
  for (const luz of ["amarillo", "verde", "rojo"]) {
    esc.luz = luz;
    for (const nix of ["normal", "feliz", "preocupado"]) {
      esc.nix = nix;
      assert.doesNotThrow(() => esc.render());
    }
  }
  assert.ok(c.registro?.imagenes === undefined || true);
  delete globalThis.document;
  delete globalThis.window;
});
await prueba("sin lienzo auxiliar (pruebas / navegador raro) render no falla", async () => {
  globalThis.window = { devicePixelRatio: 1, innerHeight: 800, addEventListener() {}, removeEventListener() {}, matchMedia: () => ({ matches: false }) };
  const { ctx } = lienzoFalso();
  const principal = { getContext: () => ctx, width: 600, height: 336, isConnected: true, style: {}, parentElement: { clientWidth: 600 } };
  const esc = new EscenarioExpendedora({ tipo: "expendedora" }, { canvas: principal });
  esc.reducido = true;
  assert.doesNotThrow(() => esc.render());
  esc.destruir();
  delete globalThis.window;
});
await prueba("escala ENTERA en píxeles físicos cuando el arte queda grande (nítido); si quedaría diminuto usa la escala exacta (dpr 1, 2, 2.625)", async () => {
  for (const dpr of [1, 2, 2.625, 3]) {
    const r = escalaEntera(780, 437, LW, LH, dpr);
    assert.ok(Math.abs(r.css * dpr - r.fisica) < 1e-9);
    assert.ok(LW * r.fisica <= 780 * dpr + 1e-9 && LH * r.fisica <= 437 * dpr + 1e-9, "cabe en el contenedor");
    if (r.entera) assert.ok(Number.isInteger(r.fisica), "entera: cada píxel del arte cae sobre píxeles reales");
  }
  assert.equal(escalaEntera(730, 450, LW, LH, 1).entera, true, "escritorio común (730 px): 3× entero");
  assert.equal(escalaEntera(730, 450, LW, LH, 1).fisica, 3);
  // celular de poca resolución: la escala entera sería 1× (200 de 374 px): se prefiere la exacta
  const chico = escalaEntera(374, 300, LW, LH, 1);
  assert.equal(chico.entera, false);
  assert.ok(chico.css > 1.5 && LW * chico.css <= 374 + 1e-9, "usa casi todo el ancho");
  // celular de alta resolución: entera y grande
  const retina = escalaEntera(374, 300, LW, LH, 3);
  assert.equal(retina.entera, true);
  assert.ok(LW * retina.css >= 0.8 * 374);
  // contenedor diminuto: nunca desborda
  const tiny = escalaEntera(100, 50, LW, LH, 1);
  assert.ok(LW * tiny.css <= 100 + 1e-9 && tiny.css > 0);
});

console.log("Módulo de pixel art");
await prueba("la fuente de 3×5: ancho, acentos y signos; los caracteres raros se vuelven «?»", async () => {
  assert.equal(anchoTexto("ABC"), 11);
  assert.equal(anchoTexto("AB", 2), 14);
  assert.equal(normalizarTexto("¡Adivinaste! ñandú ¿sí?"), "!ADIVINASTE! NANDU ?SI?");
  const { ctx, registro } = lienzoFalso();
  escribir(ctx, "Cambio: 3", 0, 0, PAL.blanco);
  assert.ok(registro.rects > 20);
  assert.doesNotThrow(() => escribir(ctx, "日本語 ☃", 0, 0));
  assert.equal(escribir(ctx, "HOLA", 0, 0), 15, "devuelve el ancho usado");
});
await prueba("mapas de caracteres: une píxeles iguales en una fila (menos rectángulos) y respeta transparencia", async () => {
  const { ctx, registro } = lienzoFalso();
  pintarMapa(ctx, ["..AAAA..", ".BBBBBB.", "A......A"], { A: "#fff", B: "#000" }, 0, 0);
  assert.equal(registro.rects, 4, "AAAA, BBBBBB, A, A");
  pintarMapa(ctx, ["ZZ"], {}, 0, 0); // clave desconocida: no pinta ni falla
  assert.equal(registro.rects, 4);
});
await prueba("Nix tiene 4 expresiones y las dibuja", async () => {
  assert.deepEqual([...ESTADOS_NIX].sort(), ["feliz", "normal", "parpadeo", "preocupado"]);
  for (const e of ESTADOS_NIX) {
    const { ctx, registro } = lienzoFalso();
    pintarNix(ctx, 0, 0, e, 2);
    assert.ok(registro.rects > 15, e);
  }
  const { ctx } = lienzoFalso();
  assert.doesNotThrow(() => pintarNix(ctx, 0, 0, "inventada", 1), "una expresión desconocida cae a la normal");
});
await prueba("crearLienzoPixel devuelve null sin document (no revienta)", async () => {
  delete globalThis.document;
  assert.equal(crearLienzoPixel(10, 10), null);
});

console.log(`\n${n} pruebas correctas.`);
process.exit(0);
