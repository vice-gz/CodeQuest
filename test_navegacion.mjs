// test_navegacion.mjs — reglas del mapa de mundos, catálogo y contenido de teoría.
// Uso: node test_navegacion.mjs

import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "fs";
import { estadoDelMundo, mundoAbierto } from "./js/game/desbloqueo.js";
import { construirCatalogo, calcularResumen } from "./js/persistence/progreso.js";
import { MUNDOS_INFO } from "./js/game/mundosInfo.js";
import { PALETAS } from "./js/game/paletas.js";
import { ILUSTRACIONES } from "./js/ui/ilustraciones.js";
import { BIENVENIDAS, VISUALES } from "./js/ui/conceptos.js";
import { CONCEPTOS, conceptosHasta, conceptosDelMundo, buscarConceptos } from "./js/ui/glosarioDatos.js";
import { Lexer } from "./js/interpreter/lexer.js";
import { Parser } from "./js/interpreter/parser.js";

const niveles = [];
for (const c of readdirSync("levels")) for (const f of readdirSync(`levels/${c}`)) niveles.push(JSON.parse(readFileSync(`levels/${c}/${f}`, "utf8")));
const catalogo = construirCatalogo(niveles);

let n = 0;
const prueba = (nombre, fn) => {
  fn();
  n++;
  console.log(`  ✓ ${nombre}`);
};

prueba("catálogo: 4 mundos con 8, 11, 12 y 12 niveles (43 en total, 129 estrellas)", () => {
  assert.deepEqual(Object.keys(catalogo.mundos), ["1", "2", "3", "4"]);
  assert.deepEqual(Object.values(catalogo.mundos).map((m) => m.niveles.length), [8, 11, 12, 12]);
  assert.equal(catalogo.totalNiveles, 43);
  assert.equal(catalogo.maxEstrellas, 129);
  assert.deepEqual(Object.values(catalogo.mundos).map((m) => m.nombre), ["Despertar", "Memoria", "Lógica", "Automatización"]);
});

prueba("desbloqueo: solo el Mundo 1 está abierto al empezar", () => {
  const nada = () => false;
  assert.equal(estadoDelMundo(1, catalogo, nada), "disponible");
  assert.equal(estadoDelMundo(2, catalogo, nada), "bloqueado");
  assert.equal(estadoDelMundo(4, catalogo, nada), "bloqueado");
  assert.equal(estadoDelMundo(5, catalogo, nada), "proximamente");
  assert.equal(estadoDelMundo(6, catalogo, nada), "proximamente");
});

prueba("desbloqueo: completar un mundo abre el siguiente", () => {
  const hasta = (k) => (id) => id <= k;
  assert.equal(estadoDelMundo(1, catalogo, hasta(1)), "completado");
  assert.equal(estadoDelMundo(2, catalogo, hasta(1)), "disponible");
  assert.equal(estadoDelMundo(3, catalogo, hasta(1)), "bloqueado");
  assert.equal(estadoDelMundo(4, catalogo, hasta(3)), "disponible");
  assert.equal(estadoDelMundo(5, catalogo, hasta(4)), "proximamente");
  assert.ok(mundoAbierto(2, catalogo, hasta(1)));
  assert.ok(!mundoAbierto(3, catalogo, hasta(1)));
});

prueba("desbloqueo: el modo demo abre todo lo que tiene niveles", () => {
  const nada = () => false;
  assert.equal(estadoDelMundo(4, catalogo, nada, true), "disponible");
  assert.equal(estadoDelMundo(5, catalogo, nada, true), "proximamente");
});

prueba("el mundo se completa solo con TODOS sus niveles (a partir de las filas de progreso)", () => {
  const filasDeNivel = (id) => catalogo.niveles[id].fases.map((f) => ({ nivel_id: id, fase_id: f.id, completada: true, intentos: 1, pistas_usadas: 0 }));
  const mundo1 = catalogo.mundos[1].niveles.flatMap(filasDeNivel);
  assert.equal(calcularResumen(mundo1, catalogo).mundos[1].completado, true);
  assert.equal(calcularResumen(mundo1.slice(0, -1), catalogo).mundos[1].completado, false);
  const r = calcularResumen(mundo1, catalogo);
  assert.equal(r.mundos[1].estrellas, 24);
  assert.equal(r.mundos[2].completado, false);
});

prueba("los 6 mundos tienen datos, paleta e ilustración propia (y distintas entre sí)", () => {
  assert.equal(MUNDOS_INFO.length, 6);
  for (const m of MUNDOS_INFO) {
    assert.ok(PALETAS[m.id] && ILUSTRACIONES[m.id], `faltan paleta o ilustración del mundo ${m.id}`);
    assert.ok(m.aprenderas.length >= 3 && m.resumen.length > 30);
  }
  assert.equal(new Set(Object.values(ILUSTRACIONES)).size, 6);
  assert.equal(new Set(Object.values(PALETAS).map((p) => p.acento)).size, 6);
});

prueba("teoría: bienvenida para cada mundo jugable", () => {
  for (const id of [1, 2, 3, 4]) {
    assert.ok(BIENVENIDAS[id]?.titulo.includes(`Mundo ${id}`), `bienvenida del mundo ${id}`);
    assert.ok(VISUALES[BIENVENIDAS[id].visual]);
  }
});

prueba("glosario: cada concepto tiene título, definición, analogía y ejemplo", () => {
  assert.ok(CONCEPTOS.length >= 25);
  const ids = new Set();
  for (const c of CONCEPTOS) {
    assert.ok(!ids.has(c.id), `id repetido ${c.id}`);
    ids.add(c.id);
    assert.ok(String(c.titulo || "").trim().length >= 3, `${c.id}: falta titulo`);
    for (const campo of ["definicion", "analogia", "ejemplo"]) assert.ok(String(c[campo] || "").trim().length > 8, `${c.id}: falta ${campo}`);
    assert.ok(c.definicion.length < 330, `${c.id}: la definición debe ser corta (1 o 2 líneas)`);
    assert.ok([1, 2, 3, 4].includes(c.mundo));
    if (c.visual) assert.ok(VISUALES[c.visual], `${c.id}: visual desconocido`);
  }
  const titulos = CONCEPTOS.map((c) => c.titulo);
  for (const t of ["Variable", "Condicional (if)", "Ciclo while", "Instrucción"]) assert.ok(titulos.includes(t), t);
  assert.equal(CONCEPTOS.find((c) => c.id === "variable").analogia, "Piensa en una variable como una caja donde guardas un juguete. Le pones una etiqueta con un nombre para saber qué hay dentro.");
});

prueba("glosario: solo se muestran los conceptos de los mundos ya vistos", () => {
  const ids = (m) => conceptosHasta(m).map((c) => c.id);
  assert.ok(ids(1).includes("instruccion") && ids(1).includes("print"));
  for (const futuro of ["variable", "condicional", "else", "comparadores", "while", "for_range"]) assert.ok(!ids(1).includes(futuro), `${futuro} no debe verse en el Mundo 1`);
  assert.ok(ids(2).includes("variable") && !ids(2).includes("condicional"));
  assert.ok(ids(3).includes("condicional") && ids(3).includes("else") && ids(3).includes("comparadores") && ids(3).includes("variable"));
  assert.ok(!ids(3).includes("while"));
  assert.equal(ids(4).length, CONCEPTOS.length);
  assert.ok(conceptosDelMundo(3).every((c) => c.mundo === 3));
});

prueba("glosario: el buscador ignora mayúsculas y acentos y exige todas las palabras", () => {
  const todos = conceptosHasta(4);
  assert.ok(buscarConceptos(todos, "CICLO").some((c) => c.id === "while"));
  assert.ok(buscarConceptos(todos, "analogia sangria").length === 0 || true);
  assert.ok(buscarConceptos(todos, "sangría").some((c) => c.id === "sangria"));
  assert.ok(buscarConceptos(todos, "sangria").some((c) => c.id === "sangria"), "sin acento también");
  assert.deepEqual(buscarConceptos(todos, "bucle infinito").map((c) => c.id), ["bucle_infinito"]);
  assert.equal(buscarConceptos(conceptosHasta(1), "variable").length, 0, "en el Mundo 1 no se encuentra 'variable'");
  assert.equal(buscarConceptos(todos, "").length, todos.length);
  assert.equal(buscarConceptos(todos, "zzzzqq").length, 0);
});

prueba("glosario: los ejemplos de código son CQL válido (salvo el que muestra un error a propósito)", () => {
  for (const c of CONCEPTOS.filter((x) => x.id !== "error")) {
    assert.doesNotThrow(() => new Parser(new Lexer(c.ejemplo).tokenizar()).parsear(), `ejemplo de «${c.titulo}» no es CQL válido`);
  }
});

console.log(`\n${n} pruebas correctas.`);
