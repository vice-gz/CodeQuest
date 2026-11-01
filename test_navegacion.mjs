// test_navegacion.mjs — reglas del mapa de mundos, catálogo y contenido de teoría.
// Uso: node test_navegacion.mjs

import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "fs";
import { estadoDelMundo, mundoAbierto } from "./js/game/desbloqueo.js";
import { construirCatalogo, calcularResumen } from "./js/persistence/progreso.js";
import { MUNDOS_INFO } from "./js/game/mundosInfo.js";
import { PALETAS } from "./js/game/paletas.js";
import { ILUSTRACIONES } from "./js/ui/ilustraciones.js";
import { GLOSARIO, BIENVENIDAS, VISUALES } from "./js/ui/conceptos.js";

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

prueba("teoría: bienvenida para cada mundo jugable y glosario con visual", () => {
  for (const id of [1, 2, 3, 4]) {
    assert.ok(BIENVENIDAS[id]?.titulo.includes(`Mundo ${id}`), `bienvenida del mundo ${id}`);
    assert.ok(VISUALES[BIENVENIDAS[id].visual]);
  }
  const ids = GLOSARIO.map((g) => g.id);
  for (const requerido of ["variable", "algoritmo", "condicional", "ciclo"]) assert.ok(ids.includes(requerido), requerido);
  for (const g of GLOSARIO) assert.ok(VISUALES[g.visual] && g.ejemplo && g.resumen);
});

console.log(`\n${n} pruebas correctas.`);
