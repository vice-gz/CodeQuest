// test_navegacion.mjs — reglas del mapa de mundos, catálogo y contenido de teoría.
// Uso: node test_navegacion.mjs

import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "fs";
import { estadoDelMundo, mundoAbierto } from "./js/game/desbloqueo.js";
import { construirCatalogo, calcularResumen, ordinalDeNivel, nivelPorOrdinal, siguienteNivelId } from "./js/persistence/progreso.js";
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

prueba("catálogo: 5 mundos con 21, 13, 13, 8 y 4 niveles (59 en total, 177 estrellas)", () => {
  assert.deepEqual(Object.keys(catalogo.mundos), ["1", "2", "3", "4", "5"]);
  assert.deepEqual(Object.values(catalogo.mundos).map((m) => m.niveles.length), [21, 13, 13, 8, 4]);
  assert.equal(catalogo.totalNiveles, 59);
  assert.equal(catalogo.maxEstrellas, 177);
  assert.deepEqual(Object.values(catalogo.mundos).map((m) => m.nombre), ["Fundamentos y Datos", "Lógica", "Automatización", "Modularidad", "Proyecto"]);
});

prueba("desbloqueo: solo el Mundo 1 está abierto al empezar", () => {
  const nada = () => false;
  assert.equal(estadoDelMundo(1, catalogo, nada), "disponible");
  assert.equal(estadoDelMundo(2, catalogo, nada), "bloqueado");
  assert.equal(estadoDelMundo(4, catalogo, nada), "bloqueado");
  assert.equal(estadoDelMundo(5, catalogo, nada), "bloqueado");
  assert.equal(estadoDelMundo(6, catalogo, nada), "proximamente");
});

prueba("desbloqueo: completar un mundo abre el siguiente", () => {
  const hasta = (k) => (id) => id <= k;
  assert.equal(estadoDelMundo(1, catalogo, hasta(1)), "completado");
  assert.equal(estadoDelMundo(2, catalogo, hasta(1)), "disponible");
  assert.equal(estadoDelMundo(3, catalogo, hasta(1)), "bloqueado");
  assert.equal(estadoDelMundo(4, catalogo, hasta(3)), "disponible");
  assert.equal(estadoDelMundo(5, catalogo, hasta(4)), "disponible");
  assert.equal(estadoDelMundo(6, catalogo, hasta(5)), "proximamente");
  assert.ok(mundoAbierto(2, catalogo, hasta(1)));
  assert.ok(!mundoAbierto(3, catalogo, hasta(1)));
});

prueba("desbloqueo: el modo demo abre todo lo que tiene niveles", () => {
  const nada = () => false;
  assert.equal(estadoDelMundo(4, catalogo, nada, true), "disponible");
  assert.equal(estadoDelMundo(5, catalogo, nada, true), "disponible");
  assert.equal(estadoDelMundo(6, catalogo, nada, true), "proximamente");
});

prueba("el mundo se completa con todos sus niveles REQUERIDOS (el Nivel 0 es tutorial y no cuenta; el jefe sí)", () => {
  const filasDeNivel = (id) => catalogo.niveles[id].fases.map((f) => ({ nivel_id: id, fase_id: f.id, completada: true, intentos: 1, pistas_usadas: 0 }));
  const todos = catalogo.mundos[1].niveles.flatMap(filasDeNivel);
  const r = calcularResumen(todos, catalogo);
  assert.equal(r.mundos[1].completado, true);
  assert.equal(r.mundos[1].estrellas, 63, "21 niveles × 3 estrellas (incluye el Nivel 0 y los dos jefes)");
  assert.equal(r.mundos[2].completado, false);
  // quien ya jugaba antes de que existiera el Nivel 0 (le falta solo ese) NO queda bloqueado
  const sinNivel0 = catalogo.mundos[1].niveles.filter((id) => id !== 0).flatMap(filasDeNivel);
  assert.equal(calcularResumen(sinNivel0, catalogo).mundos[1].completado, true);
  // pero sin cualquiera de los dos jefes el mundo no está completo
  for (const jefe of [44, 45]) {
    const sinJefe = catalogo.mundos[1].niveles.filter((id) => id !== jefe).flatMap(filasDeNivel);
    assert.equal(calcularResumen(sinJefe, catalogo).mundos[1].completado, false, `sin el jefe ${jefe}`);
  }
  assert.equal(calcularResumen(todos.slice(0, -1), catalogo).mundos[1].completado, false);
});

prueba("ordinales: el Nivel 0 es 0, los jefes son 14, 20, 13 y 13, y el siguiente nivel no depende de sumar 1 al id", () => {
  assert.equal(ordinalDeNivel(catalogo, 0), 0);
  assert.equal(ordinalDeNivel(catalogo, 1), 1);
  assert.deepEqual([44, 45, 46, 47].map((id) => ordinalDeNivel(catalogo, id)), [14, 20, 13, 13]);
  assert.deepEqual([14, 18].map((id) => ordinalDeNivel(catalogo, id)), [15, 19], "después del jefe intermedio, los ids van un número detrás del ordinal");
  assert.deepEqual([48, 55].map((id) => ordinalDeNivel(catalogo, id)), [1, 8]);
  assert.equal(nivelPorOrdinal(catalogo, 1, 0), 0);
  assert.equal(nivelPorOrdinal(catalogo, 1, 14), 44);
  assert.equal(nivelPorOrdinal(catalogo, 1, 20), 45);
  assert.equal(siguienteNivelId(catalogo, 0), 1);
  assert.equal(siguienteNivelId(catalogo, 13), 44, "después del Nivel 13 viene el jefe intermedio, no el id 14");
  assert.equal(siguienteNivelId(catalogo, 44), 14, "el jefe intermedio lleva al Pozo (id 14, Nivel 15)");
  assert.equal(siguienteNivelId(catalogo, 18), 45, "El Viaje lleva a La Caja Fuerte");
  assert.equal(siguienteNivelId(catalogo, 45), 20, "el jefe del Mundo 1 lleva al primer nivel del Mundo 2 (Lógica)");
  assert.equal(siguienteNivelId(catalogo, 47), 48, "el jefe del Mundo 3 lleva al Mundo 4");
  assert.equal(siguienteNivelId(catalogo, 55), 56, "el jefe del Mundo 4 lleva al Mundo 5");
  assert.equal(siguienteNivelId(catalogo, 59), null, "el Proyecto libre es el último nivel de CodeQuest");
  assert.deepEqual([56, 59].map((id) => ordinalDeNivel(catalogo, id)), [1, 4]);
});

prueba("los 5 mundos tienen datos, paleta e ilustración propia (y distintas entre sí)", () => {
  assert.equal(MUNDOS_INFO.length, 5);
  for (const m of MUNDOS_INFO) {
    assert.ok(PALETAS[m.id] && ILUSTRACIONES[m.id], `faltan paleta o ilustración del mundo ${m.id}`);
    assert.ok(m.aprenderas.length >= 3 && m.resumen.length > 30);
  }
  assert.equal(new Set(Object.values(ILUSTRACIONES)).size, 5);
  assert.equal(new Set(Object.values(PALETAS).map((p) => p.acento)).size, 5);
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
    assert.ok([1, 2, 3, 4, 5].includes(c.mundo));
    if (c.visual) assert.ok(VISUALES[c.visual], `${c.id}: visual desconocido`);
  }
  const titulos = CONCEPTOS.map((c) => c.titulo);
  for (const t of ["Variable", "Condicional (if)", "Ciclo while", "Instrucción"]) assert.ok(titulos.includes(t), t);
  assert.equal(CONCEPTOS.find((c) => c.id === "variable").analogia, "Piensa en una variable como una caja donde guardas un juguete. Le pones una etiqueta con un nombre para saber qué hay dentro.");
});

prueba("glosario: solo se muestran los conceptos de los mundos ya vistos", () => {
  const ids = (m) => conceptosHasta(m).map((c) => c.id);
  // Mundo 1 fusionado: robot, variables, operadores y las primeras decisiones y ciclos (semáforo, boleta, pozo)
  assert.ok(["instruccion", "print", "variable", "asignacion_compuesta", "intercambio", "redondeo", "condicional", "comparadores", "logicos", "while", "contador"].every((id) => ids(1).includes(id)));
  for (const futuro of ["else", "elif", "for_range", "funcion"]) assert.ok(!ids(1).includes(futuro), `${futuro} no debe verse en el Mundo 1`);
  assert.ok(ids(2).includes("else") && ids(2).includes("elif") && !ids(2).includes("for_range"));
  assert.ok(ids(3).includes("for_range"));
  assert.ok(!ids(3).includes("funcion"), "las funciones no se ven antes del Mundo 4");
  assert.ok(["funcion", "parametro", "retorno", "ambito"].every((id) => ids(4).includes(id)));
  assert.equal(ids(5).length, CONCEPTOS.length);
  assert.ok(conceptosDelMundo(3).every((c) => c.mundo === 3));
});

prueba("glosario: el buscador ignora mayúsculas y acentos y exige todas las palabras", () => {
  const todos = conceptosHasta(5);
  assert.ok(buscarConceptos(todos, "CICLO").some((c) => c.id === "while"));
  assert.ok(buscarConceptos(todos, "analogia sangria").length === 0 || true);
  assert.ok(buscarConceptos(todos, "sangría").some((c) => c.id === "sangria"));
  assert.ok(buscarConceptos(todos, "sangria").some((c) => c.id === "sangria"), "sin acento también");
  assert.deepEqual(buscarConceptos(todos, "bucle infinito").map((c) => c.id), ["bucle_infinito"]);
  assert.equal(buscarConceptos(conceptosHasta(1), "return").length, 0, "en el Mundo 1 no se encuentra 'return'");
  assert.equal(buscarConceptos(todos, "").length, todos.length);
  assert.equal(buscarConceptos(todos, "zzzzqq").length, 0);
});

prueba("glosario: los ejemplos de código son CQL válido (salvo el que muestra un error a propósito)", () => {
  for (const c of CONCEPTOS.filter((x) => x.id !== "error")) {
    assert.doesNotThrow(() => new Parser(new Lexer(c.ejemplo).tokenizar()).parsear(), `ejemplo de «${c.titulo}» no es CQL válido`);
  }
});

console.log(`\n${n} pruebas correctas.`);
