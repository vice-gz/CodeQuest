// test_insercion.mjs — botones de inserción rápida y contador de líneas.
// Uso: node test_insercion.mjs

import assert from "node:assert/strict";
import { PLANTILLAS, plantillaMetodo, calcularInsercion } from "./js/ui/chipsInsercion.js";
import { estadoContador } from "./js/ui/contadorLineas.js";

let n = 0;
const prueba = (nombre, fn) => {
  fn();
  n++;
  console.log(`  ✓ ${nombre}`);
};
/** Aplica la inserción como lo haría el editor y devuelve el texto con «|» donde queda el cursor. */
function aplicar(valor, inicio, fin, p) {
  const { texto, atras } = calcularInsercion(valor, inicio, fin, p);
  const nuevo = valor.slice(0, inicio) + texto + valor.slice(fin);
  const cursor = inicio + texto.length - atras;
  return nuevo.slice(0, cursor) + "|" + nuevo.slice(cursor);
}

console.log("Botones de inserción rápida");
prueba("print() deja el cursor ENTRE los paréntesis; int(), float(), str() e input() igual", () => {
  for (const k of ["print", "input", "int", "float", "str"]) assert.equal(aplicar("", 0, 0, PLANTILLAS[k]), `${k}(|)`);
});
prueba("variable = deja el cursor después del «=» para escribir el valor", () => {
  assert.equal(aplicar("", 0, 0, PLANTILLAS.asignacion), "variable = |");
});
prueba("las estructuras (if, elif, else, while, for, def) traen el cuerpo ya sangrado y el cursor donde se escribe la condición", () => {
  assert.equal(aplicar("", 0, 0, PLANTILLAS.if), "if |:\n    ");
  assert.equal(aplicar("", 0, 0, PLANTILLAS.elif), "elif |:\n    ");
  assert.equal(aplicar("", 0, 0, PLANTILLAS.else), "else:\n    |");
  assert.equal(aplicar("", 0, 0, PLANTILLAS.while), "while |:\n    ");
  assert.equal(aplicar("", 0, 0, PLANTILLAS.for), "for i in range(|):\n    ");
  assert.equal(aplicar("", 0, 0, PLANTILLAS.def), "def nombre(|):\n    ");
});
prueba("una sentencia insertada después de texto abre línea nueva (no se pega al código: «x = 1print()»)", () => {
  assert.equal(aplicar("x = 1", 5, 5, PLANTILLAS.print), "x = 1\nprint(|)");
  assert.equal(aplicar("x = 1\n", 6, 6, PLANTILLAS.print), "x = 1\nprint(|)", "en una línea vacía no se añade otro salto");
});
prueba("dentro de un bloque conserva la sangría: el cuerpo y las líneas siguientes quedan alineados", () => {
  assert.equal(aplicar("if x:\n    ", 10, 10, PLANTILLAS.print), "if x:\n    print(|)");
  assert.equal(aplicar("while a:\n    ", 13, 13, PLANTILLAS.if), "while a:\n    if |:\n        ");
  assert.equal(aplicar("if x:\n    y = 1", 15, 15, PLANTILLAS.if), "if x:\n    y = 1\n    if |:\n        ", "tras una línea sangrada abre otra al mismo nivel");
});
prueba("las expresiones (int, and, or, not, True) se insertan EN LÍNEA, sin saltos", () => {
  assert.equal(aplicar("x = ", 4, 4, PLANTILLAS.int), "x = int(|)");
  assert.equal(aplicar("if a", 4, 4, PLANTILLAS.and), "if a and |");
  assert.equal(aplicar("if a ", 5, 5, PLANTILLAS.and), "if a and |", "sin espacio doble si ya hay uno antes");
  assert.equal(aplicar("if a  b", 5, 5, PLANTILLAS.or), "if a or| b", "sin espacios dobles a los lados (queda un solo espacio a cada lado)");
  assert.equal(aplicar("x = ", 4, 4, PLANTILLAS.booleanos), "x = True|");
  assert.equal(aplicar("if ", 3, 3, PLANTILLAS.not), "if not |");
});
prueba("si hay texto seleccionado, la inserción lo reemplaza", () => {
  assert.equal(aplicar("print(hola)", 6, 10, PLANTILLAS.int), "print(int(|))");
});
prueba("métodos del escenario: robot1.avanzar() con el cursor dentro; el valor del argumento lo escribe la persona", () => {
  assert.equal(aplicar("", 0, 0, plantillaMetodo("robot1", "avanzar")), "robot1.avanzar(|)");
  assert.equal(aplicar("robot1.avanzar(2)", 17, 17, plantillaMetodo("robot1", "girar")), "robot1.avanzar(2)\nrobot1.girar(|)");
});
prueba("todas las instrucciones del juego tienen plantilla (y todas tienen o no marcador de cursor de forma consistente)", () => {
  const permitidas = ["asignacion", "print", "input", "int", "float", "str", "if", "elif", "else", "while", "for", "and", "or", "not", "booleanos", "def", "return"];
  for (const k of permitidas) assert.ok(PLANTILLAS[k], `falta la plantilla de ${k}`);
  for (const [k, p] of Object.entries(PLANTILLAS)) assert.ok((p.plantilla.match(/\|/g) || []).length <= 1, `${k}: como mucho un marcador`);
});

console.log("Contador de líneas");
prueba("cuenta líneas no vacías; con límite muestra «X / L»", () => {
  assert.equal(estadoContador("", null).texto, "Líneas: 0");
  assert.equal(estadoContador("a = 1\n\n   \nprint(a)\n", null).texto, "Líneas: 2");
  assert.equal(estadoContador("a = 1\nprint(a)", 5).texto, "Líneas: 2 / 5");
});
prueba("pasarse del límite: excedido (rojo) y con ⚠ (no solo color); estar justo en el límite NO es pasarse", () => {
  const justo = estadoContador("a\nb\nc", 3);
  assert.equal(justo.excedido, false);
  const pasado = estadoContador("a\nb\nc\nd", 3);
  assert.equal(pasado.excedido, true);
  assert.equal(pasado.texto, "Líneas: 4 / 3 ⚠");
});
prueba("límites inválidos (0, negativos, texto, undefined) se ignoran: solo cuenta", () => {
  for (const l of [0, -2, "3", undefined, null, NaN, 2.5]) assert.equal(estadoContador("a\nb\nc", l).excedido, false, String(l));
  assert.equal(estadoContador("a\nb\nc", 0).texto, "Líneas: 3");
});

console.log(`\n${n} pruebas correctas.`);
process.exit(0);
