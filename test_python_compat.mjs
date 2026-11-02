// test_python_compat.mjs — CQL debe comportarse como Python 3.
// Cada programa se ejecuta en el Python REAL (python3 del sistema) y en el
// intérprete de CQL, y se comparan sus salidas (o el tipo de error que dan).
// Si no hay python3 instalado, la prueba se omite.
// Uso: node test_python_compat.mjs

import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { Lexer } from "./js/interpreter/lexer.js";
import { Parser } from "./js/interpreter/parser.js";
import { Validator } from "./js/interpreter/validator.js";
import { crearEscenario } from "./js/game/escenarios/index.js";
import { ejecutarPrograma } from "./js/game/evaluacion.js";

const hay = spawnSync("python3", ["--version"]);
if (hay.status !== 0) {
  console.log("python3 no está instalado: prueba omitida.");
  process.exit(0);
}
console.log(`Comparando con ${String(hay.stdout || hay.stderr).trim()}`);

const PERMISOS = ["print", "input", "int", "float", "str", "asignacion", "if", "elif", "else", "while", "for", "and", "or", "not", "booleanos"];

// Código de error de CQL -> clase de excepción de Python que le corresponde
const EXCEPCION = { SEM_006: "ZeroDivisionError", RUN_015: "TypeError", RUN_016: "TypeError", RUN_007: "TypeError", SEM_011: "TypeError", RUN_017: "ValueError", SEM_001: "NameError" };

function python(codigo, stdin = "") {
  const r = spawnSync("python3", ["-c", codigo], { input: stdin, encoding: "utf8" });
  if (r.status === 0) return { lineas: r.stdout.split("\n").filter((l, i, a) => !(i === a.length - 1 && l === "")) };
  const clase = (r.stderr.trim().split("\n").pop() || "").split(":")[0];
  return { error: clase, lineas: r.stdout.split("\n").filter(Boolean) };
}

async function cql(codigo, entradas = []) {
  try {
    const esc = crearEscenario({ tipo: "datos" }, { canvas: null });
    const ast = new Parser(new Lexer(codigo).tokenizar()).parsear();
    new Validator({ instruccionesPermitidas: PERMISOS, metodosPermitidos: [] }, { biblioteca: esc.biblioteca }).validar(ast);
    const r = await ejecutarPrograma({ ast, escenario: esc, entradas });
    return { lineas: r.salidas.filter((s) => s.tipo === "PRINT").map((s) => String(s.valor)) };
  } catch (e) {
    return { error: EXCEPCION[e.codigo] || `CQL:${e.codigo}`, codigo: e.codigo };
  }
}

// Diferencias DELIBERADAS (CQL es más estricto que Python, para enseñar mejor) y por eso no se comparan:
//   True + 1 (Python lo permite: bool es un int)        -> en CQL es un error de tipos
//   "ab" * 3 (Python repite el texto)                   -> en CQL es un error de tipos
//   if 5: / while "x": (Python acepta cualquier valor)  -> en CQL la condición debe ser True/False
//   (-8) ** 0.5 (Python da un número complejo)          -> en CQL es un error
//   enteros mayores que 2^53 (Python no tiene límite)   -> en CQL es un error de desbordamiento

// [programa, stdin opcional]
const PROGRAMAS = [
  // --- división: / siempre decimal, // hacia abajo
  ["print(17 / 4)"], ["print(10 / 2)"], ["print(-7 / 2)"], ["print(1 / 3)"], ["print(7.5 / 2.5)"],
  ["print(17 // 4)"], ["print(-7 // 2)"], ["print(7 // -2)"], ["print(-7 // -2)"], ["print(7.5 // 2)"], ["print(-7.5 // 2)"], ["print(6 // 3)"],
  // --- residuo: toma el signo del divisor
  ["print(17 % 5)"], ["print(-5 % 3)"], ["print(5 % -3)"], ["print(-5 % -3)"], ["print(5.5 % 2)"], ["print(-5.5 % 2)"], ["print(6 % 3)"], ["print(6.0 % 3)"],
  // --- potencia
  ["print(2 ** 3)"], ["print(2 ** 0)"], ["print(2 ** -1)"], ["print(2 ** -2)"], ["print(2 ** 0.5)"], ["print(-2 ** 2)"], ["print((-2) ** 2)"], ["print(2 ** 3 ** 2)"], ["print(10 ** 15)"], ["print(2.0 ** 3)"], ["print(2 ** 3 * 2)"], ["print(-(2 ** 2))"],
  // --- suma, resta y producto: int con int es int; con un float es float
  ["print(5 + 3)"], ["print(5 + 3.0)"], ["print(1.5 + 1.5)"], ["print(0.1 + 0.2)"], ["print(3 * 1.0)"], ["print(5 - 0.5)"], ["print(2 * 3 + 4 * 5)"], ["print((2 + 3) * 4)"], ["print(-3 - -2)"], ["print(10 - 2 - 3)"], ["print(100 / 10 / 5)"],
  // --- cómo se imprimen los decimales
  ["print(7.0)"], ["print(0.5)"], ["print(1.75)"], ["print(100000.0 * 10000000000000)"], ["print(0.00001)"], ["print(0.0001)"], ["print(123456789.0 * 10)"], ["print(2.5 * 4)"], ["print(-0.0)"], ["print(3.14159)"],
  // --- conversiones
  ['print(int("5"))'], ['print(int(" 7 "))'], ['print(int("-12"))'], ["print(int(3.9))"], ["print(int(-3.9))"], ["print(int(5))"], ["print(int(True))"],
  ['print(float("3.5"))'], ["print(float(3))"], ['print(float("7"))'], ['print(float(" .5 "))'], ['print(float("5."))'], ['print(float("-2.25"))'],
  ["print(str(5))"], ["print(str(3.0))"], ["print(str(2.5))"], ["print(str(True))"], ['print(str("a"))'], ['print("a" + str(5))'], ['print("Total: " + str(17 / 4))'],
  // --- comparaciones
  ["print(1 == 1.0)"], ['print(1 == "1")'], ['print("a" < "b")'], ["print(2 < 3.5)"], ["print(3 != 3.0)"], ["print(5 >= 5)"], ['print("b" > "a")'], ['print("abc" == "abc")'], ["print(not 2 > 3)"],
  // --- concatenar
  ['print("Rob" + "ot1")'], ['a = "5"\nb = "3"\nprint(a + b)'],
  // --- variables y programas pequeños
  ["a = 17\nb = 4\nprint(a / b)\nprint(a // b)\nprint(a % b)"],
  ["x = 10\nx = x / 4\nprint(x)"],
  ["x = 5\nx = x * 2.0\nprint(x)\nx = int(x)\nprint(x)"],
  ["total = 0\nfor i in range(1, 5):\n    total = total + i / 2\nprint(total)"],
  ["n = 7\nif n % 2 == 0:\n    print(n // 2)\nelse:\n    print(n / 2)"],
  ["suma = 0\ni = 1\nwhile i <= 4:\n    suma = suma + i ** 2\n    i = i + 1\nprint(suma)"],
  ["for i in range(5, 0, -2):\n    print(i / 2)"],
  ["base = 12\naltura = 5\nprint(base * altura / 2)"],
  // --- input() siempre devuelve texto
  ["n = input()\nprint(n + n)", "12\n"],
  ["n = int(input())\nprint(n + 1)", "12\n"],
  ["x = float(input())\nprint(x / 2)", "7\n"],
  ["a = int(input())\nb = int(input())\nprint(a + b)\nprint(a / b)\nprint(a // b)", "17\n4\n"],
  ["print(input())", "hola\n"],
  ["texto = input()\nprint(int(texto) * 2)", " 21 \n"],
  // --- errores: Python da la excepción y CQL el error equivalente
  ['print("5" + 3)'], ['print(3 + "5")'], ['print("a" - "b")'], ['print("5" - 1)'],
  ["print(10 / 0)"], ["print(10 // 0)"], ["print(10 % 0)"], ["print(0 ** -1)"], ["print(10 / 0.0)"],
  ['print(int("hola"))'], ['print(int("3.5"))'], ['print(int(""))'], ['print(float("abc"))'], ['print(int("1 2"))'],
  ["print(undefinida)"],
  ["x = input()\nprint(x + 5)", "3\n"],
  ["n = input()\nprint(n * 2 - 1)", "3\n"],
  ['print("a" < 3)'],
];

let n = 0;
let fallos = 0;
for (const [codigo, stdin = ""] of PROGRAMAS) {
  const esperado = python(codigo, stdin);
  const real = await cql(codigo, stdin ? stdin.split("\n").filter((x, i, a) => !(i === a.length - 1 && x === "")) : []);
  const ok = esperado.error ? real.error === esperado.error && real.lineas === undefined : !real.error && JSON.stringify(real.lineas) === JSON.stringify(esperado.lineas);
  n++;
  if (!ok) {
    fallos++;
    console.log(`✗ ${JSON.stringify(codigo)}\n    Python: ${esperado.error ? "ERROR " + esperado.error : JSON.stringify(esperado.lineas)}\n    CQL:    ${real.error ? "ERROR " + real.error + (real.codigo ? ` (${real.codigo})` : "") : JSON.stringify(real.lineas)}`);
  }
}
console.log(`\n${n - fallos} de ${n} programas se comportan igual que en Python 3.`);
assert.equal(fallos, 0, `${fallos} programa(s) difieren de Python`);
