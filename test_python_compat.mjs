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

const PERMISOS = ["print", "input", "int", "float", "str", "round", "asignacion", "if", "elif", "else", "while", "for", "and", "or", "not", "booleanos", "def", "return"];

// Código de error de CQL -> clase de excepción de Python que le corresponde
const EXCEPCION = {
  SEM_006: "ZeroDivisionError", RUN_015: "TypeError", RUN_016: "TypeError", RUN_007: "TypeError", SEM_011: "TypeError", RUN_017: "ValueError", SEM_001: "NameError",
  // funciones
  SEM_003: "NameError", SEM_014: "TypeError", SEM_015: "NameError", SEM_017: "NameError", RUN_020: "NameError", RUN_021: "RecursionError", RUN_023: "UnboundLocalError", RUN_022: "TypeError",
  SYN_015: "SyntaxError", SYN_016: "SyntaxError", SYN_017: "SyntaxError",
  RUN_024: "TypeError", SEM_002: "TypeError",
};

function python(codigo, stdin = "") {
  // PYTHONIOENCODING y quitar \r: en Windows Python escribe CRLF y usa otra codificación.
  const r = spawnSync("python3", ["-c", codigo], { input: stdin, encoding: "utf8", env: { ...process.env, PYTHONIOENCODING: "utf-8" } });
  const stdout = String(r.stdout ?? "").replace(/\r/g, "");
  if (r.status === 0) return { lineas: stdout.split("\n").filter((l, i, a) => !(i === a.length - 1 && l === "")) };
  const clase = (String(r.stderr ?? r.error ?? "").replace(/\r/g, "").trim().split("\n").pop() || "").split(":")[0];
  return { error: clase, lineas: stdout.split("\n").filter(Boolean) };
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
//   def dentro de un if/while/otro def (Python lo permite) -> en CQL es un error: def va al margen izquierdo
//   valores por omisión, *args, lambda, global, nonlocal   -> no existen en CQL

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
  // --- round(): al entero más cercano; en un empate EXACTO va al par; round(x, n) redondea el valor binario exacto (2.675 -> 2.67)
  ["print(round(2.5))"], ["print(round(2.5, 0))"], ["print(round(2.5, 1))"], ["print(round(2.5, 2))"], ["print(round(2.5, 3))"], ["print(round(2.5, -1))"], ["print(round(2.5, -2))"], ["print(round(3.5))"], ["print(round(3.5, 0))"], ["print(round(3.5, 1))"], ["print(round(3.5, 2))"], ["print(round(3.5, 3))"], ["print(round(3.5, -1))"], ["print(round(3.5, -2))"], ["print(round(-2.5))"], ["print(round(-2.5, 0))"], ["print(round(-2.5, 1))"], ["print(round(-2.5, 2))"], ["print(round(-2.5, 3))"], ["print(round(-2.5, -1))"], ["print(round(-2.5, -2))"], ["print(round(0.5))"], ["print(round(0.5, 0))"], ["print(round(0.5, 1))"], ["print(round(0.5, 2))"], ["print(round(0.5, 3))"], ["print(round(0.5, -1))"], ["print(round(0.5, -2))"], ["print(round(1.5))"], ["print(round(1.5, 0))"], ["print(round(1.5, 1))"], ["print(round(1.5, 2))"], ["print(round(1.5, 3))"], ["print(round(1.5, -1))"], ["print(round(1.5, -2))"], ["print(round(2.675))"], ["print(round(2.675, 0))"], ["print(round(2.675, 1))"], ["print(round(2.675, 2))"], ["print(round(2.675, 3))"], ["print(round(2.675, -1))"], ["print(round(2.675, -2))"], ["print(round(0.125))"], ["print(round(0.125, 0))"], ["print(round(0.125, 1))"], ["print(round(0.125, 2))"], ["print(round(0.125, 3))"], ["print(round(0.125, -1))"], ["print(round(0.125, -2))"], ["print(round(0.375))"], ["print(round(0.375, 0))"], ["print(round(0.375, 1))"], ["print(round(0.375, 2))"], ["print(round(0.375, 3))"], ["print(round(0.375, -1))"], ["print(round(0.375, -2))"], ["print(round(1234.5678))"], ["print(round(1234.5678, 0))"], ["print(round(1234.5678, 1))"], ["print(round(1234.5678, 2))"], ["print(round(1234.5678, 3))"], ["print(round(1234.5678, -1))"], ["print(round(1234.5678, -2))"], ["print(round(-0.4))"], ["print(round(-0.4, 0))"], ["print(round(-0.4, 1))"], ["print(round(-0.4, 2))"], ["print(round(-0.4, 3))"], ["print(round(-0.4, -1))"], ["print(round(-0.4, -2))"], ["print(round(7))"], ["print(round(7, 0))"], ["print(round(7, 1))"], ["print(round(7, 2))"], ["print(round(7, 3))"], ["print(round(7, -1))"], ["print(round(7, -2))"], ["print(round(2.0))"], ["print(round(2.0, 0))"], ["print(round(2.0, 1))"], ["print(round(2.0, 2))"], ["print(round(2.0, 3))"], ["print(round(2.0, -1))"], ["print(round(2.0, -2))"], ["print(round(0.1))"], ["print(round(0.1, 0))"], ["print(round(0.1, 1))"], ["print(round(0.1, 2))"], ["print(round(0.1, 3))"], ["print(round(0.1, -1))"], ["print(round(0.1, -2))"], ["print(round(10 / 3))"], ["print(round(10 / 3, 0))"], ["print(round(10 / 3, 1))"], ["print(round(10 / 3, 2))"], ["print(round(10 / 3, 3))"], ["print(round(10 / 3, -1))"], ["print(round(10 / 3, -2))"], ["print(round(-1.005))"], ["print(round(-1.005, 0))"], ["print(round(-1.005, 1))"], ["print(round(-1.005, 2))"], ["print(round(-1.005, 3))"], ["print(round(-1.005, -1))"], ["print(round(-1.005, -2))"], ["print(round(163.335))"], ["print(round(163.335, 0))"], ["print(round(163.335, 1))"], ["print(round(163.335, 2))"], ["print(round(163.335, 3))"], ["print(round(163.335, -1))"], ["print(round(163.335, -2))"], ["print(round(1 / 3))"], ["print(round(1 / 3, 0))"], ["print(round(1 / 3, 1))"], ["print(round(1 / 3, 2))"], ["print(round(1 / 3, 3))"], ["print(round(1 / 3, -1))"], ["print(round(1 / 3, -2))"],
  ["print(round(True))"], ["print(round(1250, -2))"], ["print(round(1350, -2))"], ["print(round(-7, -1))"], ["print(round(300.0) + 1)"], ["x = round(4.5)\nprint(x * 2)"],
  ['print(round("5"))'], ["print(round(2.5, 1.0))"], ["x = int(4.5 + 0.5)\nprint(x)"],
  // --- asignación compuesta: += -= *= /= //= %=
  ["x = 5\nx += 3\nx -= 1\nx *= 2\nprint(x)\nx /= 4\nprint(x)\nx //= 2\nprint(x)"], ["y = 17\ny %= 5\nprint(y)"], ['t = "a"\nt += "b"\nprint(t)'],
  ["ahorro = 0\nfor i in range(4):\n    ahorro += 100\nprint(ahorro)"], ["z += 1"], ['n = "5"\nn += 1'],
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
  // --- funciones: def, parámetros, return, ámbito local
  ['def saludar():\n    print("Hola")\nsaludar()\nsaludar()'],
  ["def doble(x):\n    return x * 2\nprint(doble(21))"],
  ["def sumar(a, b):\n    return a + b\nprint(sumar(2, 3) * 2)"],
  ["def area(ancho, alto):\n    return ancho * alto\nr = area(4, 5)\nprint(r)"],
  ["def sin_return():\n    x = 5\nprint(sin_return())"],
  ["def f():\n    return\nprint(f())"],
  ['def f(x):\n    if x > 0:\n        return "positivo"\n    return "no positivo"\nprint(f(3))\nprint(f(-1))'],
  ["def cuenta(n):\n    for i in range(n):\n        print(i)\ncuenta(3)"],
  ["def fact(n):\n    if n <= 1:\n        return 1\n    return n * fact(n - 1)\nprint(fact(10))"],
  ["def fib(n):\n    if n < 2:\n        return n\n    return fib(n - 1) + fib(n - 2)\nprint(fib(12))"],
  ["x = 10\ndef cambia():\n    x = 99\n    return x\nprint(cambia())\nprint(x)"],
  ["g = 5\ndef lee():\n    return g * 2\nprint(lee())"],
  ["def a():\n    return b() + 1\ndef b():\n    return 41\nprint(a())"],
  ['def mensaje(nombre):\n    return "Hola " + nombre\nprint(mensaje("Ana"))'],
  ["def dobla(x):\n    return x * 2\nprint(dobla(dobla(3)))"],
  ["def par(n):\n    return n % 2 == 0\nprint(par(4))\nprint(par(7))"],
  ["def media(a, b):\n    return (a + b) / 2\nprint(media(3, 4))\nprint(media(2, 4))"],
  ["def suma_hasta(n):\n    total = 0\n    i = 1\n    while i <= n:\n        total = total + i\n        i = i + 1\n    return total\nprint(suma_hasta(10))"],
  ["def f(x):\n    return x\nprint(f(1) + f(2))\nprint(f(2.5))"],
  ["print(None)\nx = None\nprint(x == None)\nprint(x != None)"],
  ["def f(n):\n    for i in range(n):\n        if i == 2:\n            return i\n    return 99\nprint(f(5))\nprint(f(1))"],
  ["def ordena(a, b):\n    if a > b:\n        return a\n    elif a == b:\n        return 0\n    else:\n        return b\nprint(ordena(3, 9))\nprint(ordena(4, 4))"],
  ["def f(x):\n    y = x * 2\n    return y\nprint(f(f(f(1))))\nprint(str(f(4)) + \"!\")"],
  ["def inc(n):\n    n = n + 1\n    return n\nv = 5\nr = inc(v)\nprint(v)\nprint(r)"],
  ['def f():\n    return "a"\ndef g():\n    return f() + "b"\nprint(g())'],
  ["def f(a):\n    return a\nprint(f())"],
  ["def f(a):\n    return a\nprint(f(1, 2))"],
  ["def f():\n    y = 1\nf()\nprint(y)"],
  ["saludar()\ndef saludar():\n    print(1)"],
  ["def f():\n    f()\nf()"],
  ["return 5"],
  ["def f(a, a):\n    return a"],
  ["print(g(1))"],
  ["def f():\n    x = 1\nprint(f() + 1)"],
  ['def f(x):\n    return x + 1\nprint(f("a"))'],
  ["def f():\n    return int(None)\nprint(f())"],
  ["total = 0\ndef sumar_uno():\n    total = total + 1\nsumar_uno()\nprint(total)"],
  ["x = 5\ndef f():\n    print(x)\n    x = 1\nf()"],
  ["x = 5\ndef f():\n    y = x + 1\n    return y\nprint(f())"],
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
