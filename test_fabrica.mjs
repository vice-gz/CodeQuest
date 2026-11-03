// test_fabrica.mjs — el Visualizador de Flujo del Mundo 5 (fábrica de robots).
// 1) El escenario recibe del intérprete los eventos correctos y EN ORDEN (llamada → ejecución → retorno → salida).
// 2) El dibujo no falla en ningún estado (con un canvas de mentira que acepta cualquier instrucción).
// 3) El Nivel Jefe «El Gran Ensamblaje»: validación de definir 3 funciones y llamarlas en orden, y el robot gigante se arma.
// Uso: node test_fabrica.mjs

import assert from "node:assert/strict";
import { readFileSync } from "fs";
import { Lexer } from "./js/interpreter/lexer.js";
import { Parser } from "./js/interpreter/parser.js";
import { Validator } from "./js/interpreter/validator.js";
import { EscenarioFabrica } from "./js/game/escenarios/fabrica.js";
import { ejecutarPrograma, evaluarFase } from "./js/game/evaluacion.js";

const PERMISOS = ["print", "asignacion", "def", "return", "if", "elif", "else", "for", "while", "and", "or", "not", "booleanos", "str", "int", "float"];
globalThis.window = { innerHeight: 800, devicePixelRatio: 1 }; // el escenario consulta el tamaño de la ventana al ajustar el canvas
let n = 0;
const prueba = async (nombre, fn) => {
  await fn();
  n++;
  console.log(`  ✓ ${nombre}`);
};

// ---- canvas de mentira: acepta cualquier método y cualquier propiedad
function canvasFalso(ancho = 600, alto = 400) {
  const ctx = new Proxy(
    { llamadas: 0 },
    {
      get: (o, k) => {
        if (k === "llamadas") return o.llamadas;
        if (k === "measureText") return (t) => ({ width: String(t).length * 7 });
        if (k === "createLinearGradient") return () => ({ addColorStop() {} });
        return () => {
          o.llamadas += 1;
        };
      },
      set: () => true,
    }
  );
  return { ctx, canvas: { getContext: () => ctx, width: ancho, height: alto, style: {}, parentElement: { clientWidth: ancho } } };
}

async function correr(codigo, { config = { tipo: "fabrica", ancho: 8, alto: 1, robot: false }, canvas = null } = {}) {
  const esc = new EscenarioFabrica(config, { canvas });
  if (canvas) esc.reducido = true; // sin animaciones reales: cada paso se dibuja al instante
  const ast = new Parser(new Lexer(codigo).tokenizar()).parsear();
  new Validator({ instruccionesPermitidas: PERMISOS, metodosPermitidos: ["avanzar"] }, { biblioteca: esc.biblioteca }).validar(ast);
  const r = await ejecutarPrograma({ ast, escenario: esc });
  return { esc, r };
}
const tipos = (esc) => esc.registro.map((e) => e.tipo);

console.log("Visualizador de flujo: eventos");
await prueba("LA LLAMADA, LA EJECUCIÓN, LA SALIDA Y EL RETORNO llegan al escenario en ese orden", async () => {
  const { esc } = await correr(
    'def sumar(a, b):\n    resultado = a + b\n    print("sumando")\n    return resultado\nx = sumar(5, 3)'
  );
  assert.deepEqual(tipos(esc), ["maquina", "entrada", "locales", "local", "burbuja", "salida"]);
  const [maquina, entrada, locales, local, burbuja, salida] = esc.registro;
  assert.deepEqual([maquina.nombre, maquina.parametros], ["sumar", ["a", "b"]]);
  assert.deepEqual(entrada.args, ["5", "3"], "la caja de materiales lleva los valores de los parámetros");
  assert.deepEqual(locales.locales, ["a = 5", "b = 3"], "aparecen los parámetros como variables locales");
  assert.deepEqual([local.nombre, local.valor], ["resultado", "8"], "y luego cada variable local que se asigna");
  assert.deepEqual([burbuja.texto, burbuja.maquina], ["sumando", "sumar"], "print dentro de la máquina sale como burbuja de texto");
  assert.deepEqual([salida.valor, salida.none], ["8", false], "el return sale como producto terminado con su valor");
});
await prueba("SIN RETURN sale una caja gris con None", async () => {
  const { esc } = await correr('def avisar():\n    x = 1\navisar()');
  const salida = esc.registro.find((e) => e.tipo === "salida");
  assert.deepEqual([salida.valor, salida.none], ["None", true]);
});
await prueba("ENCADENAR: el producto terminado de una máquina entra como material de la siguiente", async () => {
  const { esc } = await correr("def sumar(a, b):\n    return a + b\ndef doble(x):\n    return x * 2\nprint(doble(sumar(2, 3)))");
  assert.deepEqual(
    esc.registro.filter((e) => ["entrada", "salida"].includes(e.tipo)).map((e) => `${e.tipo}:${e.nombre}:${e.args ?? e.valor}`),
    ["entrada:sumar:2,3", "salida:sumar:5", "entrada:doble:5", "salida:doble:10"]
  );
  const burbuja = esc.registro.find((e) => e.tipo === "burbuja");
  assert.deepEqual([burbuja.texto, burbuja.maquina], ["10", null], "el print de afuera no pertenece a ninguna máquina");
});
await prueba("definir NO enciende la máquina: solo aparece (y las variables locales no ensucian la memoria global)", async () => {
  const { esc, r } = await correr('x = 1\ndef f():\n    x = 2\n    y = 3');
  assert.deepEqual(tipos(esc), ["maquina"]);
  assert.equal(esc.llamadas, 0);
  assert.deepEqual(JSON.parse(JSON.stringify(r.memoria)), { x: 1 });
});
await prueba("el panel de estado cuenta máquinas y llamadas, y reinicia con el escenario", async () => {
  const { esc } = await correr("def f(a):\n    return a\nf(1)\nf(2)");
  const fila = (e) => Object.fromEntries(esc.filasEstado().map((x) => [x.etiqueta, x.valor]));
  assert.deepEqual([fila().Máquinas, fila().Llamadas, fila()["Última llamada"]], ["f(a)", "2", "f(2) → 2"]);
  esc.reiniciar();
  assert.deepEqual([esc.maquinas.length, esc.llamadas, esc.registro.length], [0, 0, 0]);
});

console.log("Visualizador de flujo: dibujo");
await prueba("el dibujo funciona en TODOS los estados (sin máquinas, construida, en ejecución, con chips, con salida, con None, con robot)", async () => {
  const { ctx, canvas } = canvasFalso();
  const programas = [
    "",
    'def a():\n    print("x")',
    'def sumar(a, b):\n    resultado = a + b\n    print("hola")\n    return resultado\nprint(sumar(5, 3))',
    "def a():\n    x = 1\ndef b():\n    y = 2\ndef c():\n    z = 3\ndef d():\n    w = 4\ndef e():\n    v = 5\na()\nb()",
    "def f(a, b, c, d, e, f):\n    g = 1\n    h = 2\n    i = 3\n    return g\nf(1, 2, 3, 4, 5, 6)",
  ];
  for (const codigo of programas) {
    const { esc } = await correr(codigo, { canvas });
    esc.render();
  }
  const antes = ctx.llamadas;
  const { esc } = await correr("def paso():\n    robot1.avanzar(1)\npaso()\npaso()", { canvas, config: { tipo: "fabrica", ancho: 8, alto: 1, robot: true, objetivoPosicion: [3, 0] } });
  esc.ajustarTamano();
  esc.render();
  assert.ok(ctx.llamadas > antes + 50, "se dibujó la pista y el robot");
  assert.equal(esc.robot1.x, 2);
  // textos largos y valores raros no rompen el recorte
  const largo = await correr('def f(a):\n    return a\nf("' + "x".repeat(200) + '")', { canvas });
  largo.esc.render();
});
await prueba("la caja de entrada viaja y se muestra mientras ocurre (estado intermedio de la animación)", async () => {
  const { ctx, canvas } = canvasFalso();
  const esc = new EscenarioFabrica({ tipo: "fabrica", robot: false }, { canvas });
  esc.maquinas.push({ nombre: "f", parametros: ["x"], alta: 1, activa: 0.7, giro: 1, locales: [{ nombre: "x", texto: "5", vida: 1 }], cx: 150 });
  esc.flujo.entrada = { x: 0.3, texto: "[5]" };
  esc.flujo.salida = { x: 0.7, texto: "10", gris: false, brillo: 1 };
  esc.bandeja = { texto: "None", gris: true };
  esc.burbuja = { texto: "hola", maquina: "f", vida: 1 };
  esc.render();
  assert.ok(ctx.llamadas > 80);
});

console.log("Nivel Jefe: El Gran Ensamblaje");
const jefe = JSON.parse(readFileSync("levels/mundo5/level55.json", "utf8"));
const fase = jefe.fases[0];
async function evaluar(codigo) {
  const cfg = { ...jefe.escenario, ...(fase.escenario || {}) };
  const esc = new EscenarioFabrica(cfg, { canvas: null });
  const ast = new Parser(new Lexer(codigo).tokenizar()).parsear();
  new Validator(fase, { biblioteca: esc.biblioteca }).validar(ast);
  const r = await ejecutarPrograma({ ast, escenario: esc });
  const ev = await evaluarFase({ nivel: jefe, fase, codigo, ast, visual: { ...r, escenario: esc }, casoVisual: 0 });
  return { esc, ev };
}
await prueba("la solución del jefe pasa y el robot gigante se arma en orden: cabeza → brazos → piernas", async () => {
  const { esc, ev } = await evaluar(fase.solucionReferencia);
  assert.equal(ev.exito, true);
  assert.deepEqual(esc.registro.filter((e) => e.tipo === "parte").map((e) => e.nombre), ["cabeza", "brazos", "piernas"]);
  assert.deepEqual(esc.partes, { cabeza: 1, brazos: 1, piernas: 1 });
  assert.match(esc.filasEstado().find((f) => f.etiqueta === "Robot gigante").valor, /cabeza ✓ · brazos ✓ · piernas ✓/);
});
await prueba("el jefe NO tiene pistas ni editor con código, y dice el mensaje de «robot incompleto»", async () => {
  assert.equal(jefe.jefe, true);
  assert.equal(fase.sinPistas, true);
  assert.equal(fase.pistas, undefined);
  assert.equal(fase.codigoInicial, "");
  assert.equal(fase.mensajeNoLogrado, "El robot está incompleto. Asegúrate de definir las 3 funciones y llamarlas en el orden correcto (cabeza, brazos, piernas).");
});
await prueba("NO pasa: faltan funciones, orden equivocado, sin llamar, una función de más o sin definir nada", async () => {
  const cuerpo = (nombre) => `def ${nombre}():\n    print("${nombre}")\n`;
  const malos = {
    "falta piernas": cuerpo("cabeza") + cuerpo("brazos") + "cabeza()\nbrazos()",
    "orden al revés": cuerpo("cabeza") + cuerpo("brazos") + cuerpo("piernas") + "piernas()\nbrazos()\ncabeza()",
    "sin llamar": cuerpo("cabeza") + cuerpo("brazos") + cuerpo("piernas"),
    "una función de más": cuerpo("cabeza") + cuerpo("brazos") + cuerpo("piernas") + cuerpo("pies") + "cabeza()\nbrazos()\npiernas()",
    "sin def": 'print("cabeza")\nprint("brazos")\nprint("piernas")',
    "nombres distintos": cuerpo("head") + cuerpo("arms") + cuerpo("legs") + "head()\narms()\nlegs()",
  };
  for (const [nombre, codigo] of Object.entries(malos)) {
    const { ev } = await evaluar(codigo);
    assert.equal(ev.exito, false, `«${nombre}» no debe pasar`);
  }
});
await prueba("SÍ pasa llamando varias veces cada una, siempre que la primera llamada de cada una siga el orden", async () => {
  const cuerpo = (nombre) => `def ${nombre}():\n    print("${nombre}")\n`;
  const { ev } = await evaluar(cuerpo("cabeza") + cuerpo("brazos") + cuerpo("piernas") + "cabeza()\nbrazos()\nbrazos()\npiernas()\ncabeza()");
  assert.equal(ev.exito, true);
});

console.log(`\n${n} pruebas correctas.`);
process.exit(0);
