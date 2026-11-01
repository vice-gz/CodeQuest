// test_cql.mjs — pruebas del lenguaje CQL del Avance 3: bloques con sangría, if/elif/else,
// while, for/range, comparaciones, and/or/not, límite de iteraciones, errores y
// el comportamiento de los escenarios (Datos, Cartas, Elevador).
// Uso: node test_cql.mjs

import assert from "node:assert/strict";
import { Lexer } from "./js/interpreter/lexer.js";
import { Parser } from "./js/interpreter/parser.js";
import { Validator } from "./js/interpreter/validator.js";
import { crearEscenario } from "./js/game/escenarios/index.js";
import { ejecutarPrograma } from "./js/game/evaluacion.js";
import { variablesDeMano } from "./js/game/escenarios/cartas.js";
import { evaluarValidacion } from "./js/game/validaciones.js";

const TODO = ["print", "entrada", "asignacion", "if", "elif", "else", "while", "for", "and", "or", "not", "booleanos"];
const fase = (extra = {}) => ({ instruccionesPermitidas: TODO, metodosPermitidos: [], ...extra });

function parsear(codigo) {
  return new Parser(new Lexer(codigo).tokenizar()).parsear();
}

// Ejecuta `codigo` en un escenario headless. Devuelve { lineas, memoria, escenario } o lanza el CQLError.
async function correr(codigo, { tipo = "datos", config = {}, fasePermisos = fase(), entradas = [] } = {}) {
  const escenario = crearEscenario({ tipo, ...config }, { canvas: null });
  const ast = parsear(codigo);
  new Validator(fasePermisos, {
    biblioteca: escenario.biblioteca,
    variablesIniciales: Object.keys(escenario.variablesIniciales),
  }).validar(ast);
  const r = await ejecutarPrograma({ ast, escenario, entradas });
  return { lineas: r.salidas.filter((s) => s.tipo === "PRINT").map((s) => String(s.valor)), memoria: r.memoria, escenario };
}

async function lanza(codigo, codigoError, opciones) {
  try {
    await correr(codigo, opciones);
  } catch (e) {
    assert.equal(e.codigo, codigoError, `esperaba ${codigoError} y fue ${e.codigo} (${e.mensaje}) para:\n${codigo}`);
    return e;
  }
  assert.fail(`esperaba ${codigoError} pero no hubo error para:\n${codigo}`);
  return null;
}

let n = 0;
const prueba = async (nombre, fn) => {
  await fn();
  n++;
  console.log(`  ✓ ${nombre}`);
};

console.log("Condicionales");
await prueba("if / else elige la rama correcta", async () => {
  const c = 'x = 30\nif x > 21:\n    print("Bust")\nelse:\n    print("ok")';
  assert.deepEqual((await correr(c)).lineas, ["Bust"]);
  assert.deepEqual((await correr(c.replace("30", "10"))).lineas, ["ok"]);
});
await prueba("elif: solo se ejecuta la primera rama verdadera", async () => {
  const c = (x) => `x = ${x}\nif x > 20:\n    print("A")\nelif x > 10:\n    print("B")\nelif x > 5:\n    print("C")\nelse:\n    print("D")`;
  assert.deepEqual((await correr(c(25))).lineas, ["A"]);
  assert.deepEqual((await correr(c(15))).lineas, ["B"]);
  assert.deepEqual((await correr(c(7))).lineas, ["C"]);
  assert.deepEqual((await correr(c(1))).lineas, ["D"]);
});
await prueba("if sin else y condición falsa no hace nada", async () => {
  assert.deepEqual((await correr('x = 1\nif x > 5:\n    print("no")\nprint("fin")')).lineas, ["fin"]);
});
await prueba("if anidados", async () => {
  const c = (a, b) => `a = ${a}\nb = ${b}\nif a > 0:\n    if b > 0:\n        print("ambos")\n    else:\n        print("solo a")\nelse:\n    print("ninguno")`;
  assert.deepEqual((await correr(c(1, 1))).lineas, ["ambos"]);
  assert.deepEqual((await correr(c(1, -1))).lineas, ["solo a"]);
  assert.deepEqual((await correr(c(-1, 1))).lineas, ["ninguno"]);
});

console.log("Comparaciones y lógica");
await prueba("los seis comparadores", async () => {
  const casos = [["3 == 3", "True"], ["3 != 3", "False"], ["2 < 3", "True"], ["3 < 3", "False"], ["3 <= 3", "True"], ["4 > 3", "True"], ["3 >= 4", "False"]];
  for (const [expr, esperado] of casos) assert.deepEqual((await correr(`print(${expr})`)).lineas, [esperado], expr);
});
await prueba("== entre tipos distintos es False (sin error); textos se comparan", async () => {
  assert.deepEqual((await correr('print(3 == "3")\nprint("a" == "a")\nprint("a" < "b")')).lineas, ["False", "True", "True"]);
});
await prueba("and / or / not (tabla de verdad)", async () => {
  const t = [["True and True", "True"], ["True and False", "False"], ["False or True", "True"], ["False or False", "False"], ["not True", "False"], ["not 1 > 2", "True"]];
  for (const [expr, esperado] of t) assert.deepEqual((await correr(`print(${expr})`)).lineas, [esperado], expr);
});
await prueba("precedencia: not > and > or, y los paréntesis mandan", async () => {
  assert.deepEqual((await correr("print(True or False and False)")).lineas, ["True"]);
  assert.deepEqual((await correr("print((True or False) and False)")).lineas, ["False"]);
  assert.deepEqual((await correr("print(2 + 3 * 4 == 14)")).lineas, ["True"]);
});
await prueba("cortocircuito: no evalúa el lado derecho si no hace falta", async () => {
  assert.deepEqual((await correr('x = 0\nif x != 0 and 10 / x > 1:\n    print("a")\nelse:\n    print("b")')).lineas, ["b"]);
});
await prueba("menos unario", async () => {
  assert.deepEqual((await correr("x = 5\nprint(-x + 2)\nprint(3 - -2)")).lineas, ["-3", "5"]);
});

console.log("Ciclos");
await prueba("while cuenta hasta 5", async () => {
  assert.deepEqual((await correr("i = 0\nwhile i < 5:\n    i = i + 1\nprint(i)")).lineas, ["5"]);
});
await prueba("for range(3), range(1,4), range(5,0,-2), range(0)", async () => {
  assert.deepEqual((await correr("for i in range(3):\n    print(i)")).lineas, ["0", "1", "2"]);
  assert.deepEqual((await correr("for i in range(1, 4):\n    print(i)")).lineas, ["1", "2", "3"]);
  assert.deepEqual((await correr("for i in range(5, 0, -2):\n    print(i)")).lineas, ["5", "3", "1"]);
  assert.deepEqual((await correr("for i in range(0):\n    print(i)\nprint(\"fin\")")).lineas, ["fin"]);
});
await prueba("ciclos anidados y la variable del for sigue viva al terminar", async () => {
  const r = await correr("t = 0\nfor i in range(3):\n    for j in range(2):\n        t = t + 1\nprint(t)\nprint(i)");
  assert.deepEqual(r.lineas, ["6", "2"]);
});
await prueba("variable creada dentro de un if se puede usar después", async () => {
  assert.deepEqual((await correr("if 1 < 2:\n    z = 7\nprint(z)")).lineas, ["7"]);
});
await prueba("LÍMITE: while True se detiene con RUN_005", async () => {
  await lanza("while True:\n    x = 1", "RUN_005");
});
await prueba("LÍMITE: 1000 vueltas sí, 1001 no", async () => {
  assert.deepEqual((await correr("t = 0\nfor i in range(1000):\n    t = t + 1\nprint(t)")).lineas, ["1000"]);
  await lanza("for i in range(1001):\n    x = 1", "RUN_005");
});
await prueba("LÍMITE: el contador es global entre ciclos", async () => {
  await lanza("for i in range(40):\n    for j in range(40):\n        x = 1", "RUN_005");
});

console.log("Errores");
await prueba("errores de sintaxis con código y mensaje educativo", async () => {
  const casos = [
    ["if 1 > 0\n    print(1)", "SYN_006"],
    ["if x = 1:\n    print(1)", "SYN_011"],
    ["if 1 > 0:\nprint(1)", "SYN_007"],
    ["if 1 > 0: print(1)", "SYN_007"],
    ["  print(1)", "SYN_008"],
    ["else:\n    print(1)", "SYN_009"],
    ["elif 1 > 0:\n    print(1)", "SYN_009"],
    ["for i in lista:\n    print(i)", "SYN_012"],
    ["for i in range():\n    print(i)", "SYN_013"],
    ["if 1 < 2 < 3:\n    print(1)", "SYN_014"],
    ["if True:\n        a = 1\n    b = 2", "SYN_010"],
    ["x = 1 ! 2", "LEX_001"],
  ];
  for (const [codigo, cod] of casos) {
    try {
      parsear(codigo);
      assert.fail(`sin error para ${JSON.stringify(codigo)}`);
    } catch (e) {
      assert.equal(e.codigo, cod, `${JSON.stringify(codigo)} → ${e.codigo}`);
      assert.ok(e.educativo && e.sugerencia, `${cod} debe traer texto educativo y sugerencia`);
    }
  }
});
await prueba("errores de ejecución", async () => {
  await lanza("if 5:\n    print(1)", "RUN_006");
  await lanza('print("a" < 3)', "RUN_007");
  await lanza("print(not 5)", "RUN_011");
  await lanza("print(1 and True)", "RUN_011");
  await lanza("for i in range(2.5):\n    print(i)", "RUN_010");
  await lanza("for i in range(0, 5, 0):\n    print(i)", "RUN_010");
  await lanza("if 1 > 2:\n    z = 1\nprint(z)", "SEM_001"); // la rama no se ejecutó
});
await prueba("true/false en minúscula dan una pista clara", async () => {
  const e = await lanza("if true:\n    print(1)", "SEM_001");
  assert.match(e.mensaje, /True/);
});

console.log("Permisos del validador");
await prueba("las palabras nuevas respetan instruccionesPermitidas", async () => {
  const solo = fase({ instruccionesPermitidas: ["print", "asignacion"] });
  await lanza("if 1 < 2:\n    print(1)", "SEM_007", { fasePermisos: solo });
  await lanza("while 1 < 2:\n    print(1)", "SEM_007", { fasePermisos: solo });
  await lanza("for i in range(2):\n    print(i)", "SEM_007", { fasePermisos: solo });
  await lanza("x = True", "SEM_007", { fasePermisos: solo });
  const sinElse = fase({ instruccionesPermitidas: ["print", "asignacion", "if"] });
  await lanza("if 1 < 2:\n    print(1)\nelse:\n    print(2)", "SEM_007", { fasePermisos: sinElse });
  await lanza("if 1 < 2:\n    print(1)\nelif 2 < 3:\n    print(2)", "SEM_007", { fasePermisos: sinElse });
  await lanza("if 1 < 2 and 2 < 3:\n    print(1)", "SEM_007", { fasePermisos: sinElse });
  assert.deepEqual((await correr("if 1 < 2:\n    print(1)", { fasePermisos: sinElse })).lineas, ["1"]);
});
await prueba("variable sin definir dentro de una condición", async () => {
  await lanza("if y > 3:\n    print(1)", "SEM_001");
});
await prueba("objetos: en mundos sin objetos no existe robot1", async () => {
  await lanza("robot1.avanzar(1)", "SEM_010");
});

console.log("Escenarios");
await prueba("Cartas: variables de la mano, color y total", async () => {
  const v = variablesDeMano({
    mostrarColor: true,
    cartas: [{ valor: 10, palo: "corazones" }, { valor: 8, palo: "picas" }],
  });
  assert.deepEqual(v, { carta1: 10, color1: "roja", carta2: 8, color2: "negra", total: 18 });
  const r = await correr('if total > 21:\n    print("Bust")\nelse:\n    print("Ganaste")', {
    tipo: "cartas",
    config: { cartas: [{ valor: 10, palo: "picas" }, { valor: 9, palo: "picas" }, { valor: 5, palo: "picas" }] },
  });
  assert.deepEqual(r.lineas, ["Bust"]);
  assert.equal(r.escenario.historial.length, 1);
  assert.equal(r.escenario.historial[0].resultado, true);
});
await prueba("Cartas: la mesa juzga cada if/elif en orden", async () => {
  const r = await correr('if total > 30:\n    print("a")\nelif total > 20:\n    print("b")', {
    tipo: "cartas",
    config: { cartas: [{ valor: 10, palo: "picas" }, { valor: 12, palo: "picas" }] },
  });
  assert.deepEqual(r.escenario.historial.map((h) => [h.texto, h.resultado]), [["total > 30", false], ["total > 20", true]]);
});
await prueba("Elevador: while sube hasta el último piso", async () => {
  const r = await correr("piso = 1\nwhile piso < 5:\n    elevador.subir(1)\n    piso = piso + 1\nprint(elevador.piso())", {
    tipo: "elevador",
    fasePermisos: fase({ metodosPermitidos: ["subir", "bajar", "recoger", "soltar", "piso", "hayPasajero", "llevando"] }),
  });
  assert.equal(r.escenario.piso, 5);
  assert.deepEqual(r.lineas, ["5"]);
});
const ELEV = { metodosPermitidos: ["subir", "bajar", "recoger", "soltar", "piso", "hayPasajero", "llevando"] };
await prueba("Elevador: subir de más o bajar de la planta baja da RUN_008", async () => {
  await lanza("elevador.subir(5)", "RUN_008", { tipo: "elevador", fasePermisos: fase(ELEV) });
  await lanza("elevador.bajar(1)", "RUN_008", { tipo: "elevador", fasePermisos: fase(ELEV) });
});
await prueba("Elevador: recoger, llevar y entregar en la planta baja", async () => {
  const r = await correr("elevador.subir(2)\nelevador.recoger()\nelevador.bajar(2)\nelevador.soltar()", {
    tipo: "elevador",
    config: { pasajeros: [3] },
    fasePermisos: fase(ELEV),
  });
  assert.equal(r.escenario.entregados, 1);
  assert.ok(evaluarValidacion({ tipo: "elevador_entrega" }, r.escenario, { salidas: [], memoria: {}, codigo: "" }));
});
await prueba("Elevador: soltar en otro piso deja al pasajero esperando ahí", async () => {
  const r = await correr("elevador.subir(1)\nelevador.recoger()\nelevador.soltar()", {
    tipo: "elevador",
    config: { pasajeros: [2] },
    fasePermisos: fase(ELEV),
  });
  assert.equal(r.escenario.entregados, 0);
  assert.equal(r.escenario.esperando.length, 1);
});
await prueba("Elevador: capacidad (RUN_009) y hayPasajero()/llevando()", async () => {
  await lanza("elevador.subir(1)\nelevador.recoger()", "RUN_009", {
    tipo: "elevador",
    config: { pasajeros: [2, 2, 2], capacidad: 2 },
    fasePermisos: fase(ELEV),
  });
  const r = await correr("elevador.subir(1)\nprint(elevador.hayPasajero())\nelevador.recoger()\nprint(elevador.llevando())\nprint(elevador.hayPasajero())", {
    tipo: "elevador",
    config: { pasajeros: [2] },
    fasePermisos: fase(ELEV),
  });
  assert.deepEqual(r.lineas, ["True", "1", "False"]);
});
await prueba("Datos: los chips guardan el valor real y el tipo cambia con la asignación", async () => {
  const r = await correr('x = 5\ny = x + 2.5\nnombre = "Ana"\nx = "cinco"');
  assert.deepEqual(r.memoria, { x: "cinco", y: 7.5, nombre: "Ana" });
  assert.equal(r.escenario.slots.get("x").anterior, 5);
});

await prueba("Elevador: la energía baja 1% por piso y se agota con RUN_012", async () => {
  const r = await correr("elevador.subir(3)\nelevador.bajar(3)", { tipo: "elevador", fasePermisos: fase(ELEV) });
  assert.equal(r.escenario.energia, 94);
  assert.equal(r.escenario.snapshot().energia, 94);
  await lanza("for i in range(60):\n    elevador.subir(1)\n    elevador.bajar(1)", "RUN_012", { tipo: "elevador", fasePermisos: fase(ELEV) });
});

console.log("Mesa de cartas: comandos");
const MESA = { metodosPermitidos: ["poner_carta", "voltear"] };
await prueba("mesa.poner_carta y mesa.voltear cambian la mesa pero no las variables", async () => {
  const r = await correr('mesa.poner_carta(7, "roja")\nmesa.poner_carta(3, "negra")\nmesa.voltear()\nprint(total)', {
    tipo: "cartas",
    config: { cartas: [{ valor: 10, palo: "picas" }] },
    fasePermisos: fase(MESA),
  });
  assert.equal(r.escenario.cartas.length, 3);
  assert.deepEqual(r.escenario.cartas.map((c) => c.palo), ["picas", "corazones", "picas"]);
  assert.ok(r.escenario.giro.every((g) => g >= 1), "voltear deja todas las cartas boca arriba");
  assert.deepEqual(r.lineas, ["10"], "las cartas nuevas no cambian total");
});
await prueba("mesa: errores (color inválido, mesa llena, método no permitido)", async () => {
  await lanza('mesa.poner_carta(7, "azul")', "RUN_014", { tipo: "cartas", fasePermisos: fase(MESA) });
  await lanza('for i in range(7):\n    mesa.poner_carta(5, "roja")', "RUN_013", { tipo: "cartas", fasePermisos: fase(MESA) });
  await lanza('mesa.poner_carta(5, "roja")', "SEM_007", { tipo: "cartas", fasePermisos: fase() });
  await lanza("robot1.avanzar(1)", "SEM_010", { tipo: "cartas" });
});

console.log(`\n${n} pruebas correctas.`);
