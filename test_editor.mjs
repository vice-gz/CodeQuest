// test_editor.mjs — pruebas de Tab / Shift+Tab (lógica pura de js/ui/indentacion.js)
import assert from "node:assert/strict";
import { calcularIndentacion, SANGRIA } from "./js/ui/indentacion.js";

// Aplica el resultado como lo haría el editor y devuelve texto + selección.
function pulsar(valor, inicio, fin, shift = false) {
  const r = calcularIndentacion({ valor, inicio, fin, shift });
  return { texto: valor.slice(0, r.desde) + r.texto + valor.slice(r.hasta), ini: r.selInicio, fin: r.selFin };
}
let n = 0;
const prueba = (nombre, fn) => {
  fn();
  n++;
  console.log(`  ✓ ${nombre}`);
};

prueba("Tab sin selección inserta 4 espacios en el cursor", () => {
  const r = pulsar("ab", 1, 1);
  assert.equal(r.texto, "a" + SANGRIA + "b");
  assert.deepEqual([r.ini, r.fin], [5, 5]);
});

prueba("Tab con selección indenta TODAS las líneas seleccionadas", () => {
  const r = pulsar("uno\ndos\ntres", 1, 9); // de "no" hasta dentro de "tres"
  assert.equal(r.texto, `${SANGRIA}uno\n${SANGRIA}dos\n${SANGRIA}tres`);
  assert.equal(r.texto.slice(r.ini, r.fin), "no\n    dos\n    t"); // la selección sigue sobre el mismo texto
});

prueba("la selección que termina al inicio de una línea no indenta esa línea", () => {
  const r = pulsar("uno\ndos\ntres", 0, 8); // termina justo antes de "tres"
  assert.equal(r.texto, `${SANGRIA}uno\n${SANGRIA}dos\ntres`);
});

prueba("Shift+Tab quita hasta 4 espacios de cada línea", () => {
  const r = pulsar(`${SANGRIA}uno\n  dos\ntres`, 0, 16, true);
  assert.equal(r.texto, "uno\ndos\ntres");
});

prueba("Shift+Tab quita un tabulador", () => {
  assert.equal(pulsar("\tuno", 2, 2, true).texto, "uno");
});

prueba("Shift+Tab sin sangría no cambia nada", () => {
  const r = pulsar("uno", 1, 1, true);
  assert.equal(r.texto, "uno");
});

prueba("Shift+Tab con el cursor solo desindenta su línea y no deja el cursor fuera", () => {
  const r = pulsar("a\n    b\nc", 6, 6, true);
  assert.equal(r.texto, "a\nb\nc");
  assert.ok(r.ini >= 2 && r.ini === r.fin);
});

prueba("Shift+Tab no deja la selección antes del inicio de la línea", () => {
  const r = pulsar("  x", 0, 0, true);
  assert.equal(r.texto, "x");
  assert.deepEqual([r.ini, r.fin], [0, 0]);
});

prueba("funciona en la primera línea (índice 0) y con texto vacío", () => {
  assert.equal(pulsar("", 0, 0).texto, SANGRIA);
  assert.equal(pulsar("a\nb", 0, 3).texto, `${SANGRIA}a\n${SANGRIA}b`);
});

console.log(`\n${n} pruebas correctas.`);
