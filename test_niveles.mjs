// test_niveles.mjs
// Arnés de pruebas headless: corre la solución de referencia de CADA fase
// de CADA nivel por el motor real (Lexer -> Parser -> Validator ->
// Interpreter -> Robot1/World) y comprueba que pasa su propia validación.
// Uso: node test_niveles.mjs

import { readFileSync, existsSync } from "fs";
import { Lexer } from "./js/interpreter/lexer.js";
import { Parser } from "./js/interpreter/parser.js";
import { Validator } from "./js/interpreter/validator.js";
import { Interpreter } from "./js/interpreter/interpreter.js";
import { World } from "./js/game/world.js";
import { Robot1 } from "./js/game/robot1.js";
import { crearMotor, snapshotEstado } from "./js/game/ejecutor.js";

// Escena nula: no dibuja nada y resuelve las animaciones al instante.
class SceneNula {
  constructor(world, robot1) {
    this.world = world;
    this.robot1 = robot1;
  }
  render() {}
  reiniciar(world, robot1) {
    this.world = world;
    this.robot1 = robot1;
  }
  async moverAnimado() {}
}

const NIVELES_POR_MUNDO = { 1: 8, 2: 11 };
const TOTAL_NIVELES = 19;
const mundoDeNivel = (id) => (id <= NIVELES_POR_MUNDO[1] ? 1 : 2);

async function correrFase(nivel, fase) {
  const escenario = { ...nivel.escenario, ...(fase.escenario || {}) };
  const world = new World(escenario);
  const robot1 = new Robot1({
    posicion: escenario.robotPosicion || [0, 0],
    direccion: escenario.robotDireccion || "este",
    energiaInicial: escenario.energiaInicial ?? 100,
    energiaMaxima: escenario.energiaMaxima ?? null,
    costoEnergiaPorCasilla: escenario.costoEnergiaPorCasilla ?? 1,
  });
  const scene = new SceneNula(world, robot1);
  // Respuestas que el "estudiante" escribiría en las entradas interactivas.
  const colaInteractiva = [...(fase.entradasEstudiante || [])];

  const salidas = [];
  const memoria = {};
  const motor = crearMotor({
    scene,
    world,
    robot1,
    callbacks: {
      onSalida: (s) => salidas.push(s),
      onAsignacion: (n, v) => {
        memoria[n] = v;
      },
      onEstado: () => {},
      pedirEntrada: async () => {
        if (colaInteractiva.length === 0) {
          throw new Error("la fase pide una entrada interactiva pero no definió entradasEstudiante para la prueba");
        }
        return colaInteractiva.shift();
      },
    },
  });

  const codigo = fase.solucionReferencia ?? fase.codigoInicial ?? "";
  const tokens = new Lexer(codigo).tokenizar();
  const ast = new Parser(tokens).parsear();
  new Validator(fase).validar(ast);
  await new Interpreter(motor).ejecutar(ast);

  return { salidas, memoria, robot1, world, codigo, estado: snapshotEstado(robot1) };
}

function codigoSinTextos(codigo) {
  return codigo
    .replace(/#.*$/gm, "")
    .replace(/"[^"]*"/g, '""')
    .replace(/'[^']*'/g, "''");
}

// Espejo de evaluarResultado() en main.js.
function evaluar(fase, { salidas, robot1, world, codigo }) {
  const v = fase.validacion || { tipo: "ejecutado" };
  const fuente = codigoSinTextos(codigo);
  const [x, y] = robot1.posicion();
  const pos = (e) => x === e[0] && y === e[1];
  const inc = (val) => salidas.some((s) => String(s.valor).includes(String(val)));
  const exact = (val) => salidas.some((s) => String(s.valor) === String(val));
  const todosObjetivos = () =>
    world.objetivos.every((o) => robot1.objetivosAlcanzados.includes(`${o[0]},${o[1]}`));
  const tieneVar = (n) => new RegExp(`\\b${n}\\s*=`).test(fuente);

  switch (v.tipo) {
    case "ejecutado":
    case "codigo_sin_error":
      return true;
    case "output":
    case "output_exacto":
      return exact(v.valorEsperado);
    case "output_contiene":
      return inc(v.valor ?? v.valorEsperado);
    case "output_con_variable":
      return exact(v.valorEsperado) && tieneVar(v.variableRequerida);
    case "posicion":
      return pos(v.valorEsperado);
    case "posicion_con_operacion":
      return pos(v.valorEsperado) && fuente.includes(v.operadorRequerido);
    case "posicion_con_variable":
      return pos(v.valorEsperado) && tieneVar(v.variableRequerida);
    case "posicion_sin_numero_literal":
      return pos(v.valorEsperado) && !new RegExp(`\\b${v.numeroProhibido}\\b`).test(fuente);
    case "objetivos":
      return todosObjetivos();
    case "estado":
    case "estado_variable": {
      let ok = true;
      if (v.posicionEsperada) ok = ok && pos(v.posicionEsperada);
      if (v.direccionEsperada) ok = ok && robot1.direccion === v.direccionEsperada;
      if (v.energiaMinima !== undefined) ok = ok && robot1.energia >= v.energiaMinima;
      if (v.outputContiene) ok = ok && inc(v.outputContiene);
      if (v.outputEsperado) ok = ok && exact(v.outputEsperado);
      if (v.todosLosObjetivos) ok = ok && todosObjetivos();
      if (v.operadorRequerido) ok = ok && fuente.includes(v.operadorRequerido);
      if (v.variableRequerida) ok = ok && tieneVar(v.variableRequerida);
      return ok;
    }
    default:
      return false;
  }
}

const TIPOS_FASE = new Set([
  "EXPLORAR", "MODIFICAR", "PREDECIR", "ESCRIBIR", "RESOLVER", "DEBUG", "LIBRE",
]);

let fallos = 0;
let fasesProbadas = 0;
const tiposVistos = new Set();

for (let id = 1; id <= TOTAL_NIVELES; id++) {
  const ruta = `levels/mundo${mundoDeNivel(id)}/level${id}.json`;
  if (!existsSync(ruta)) {
    console.log(`⚠ Nivel ${id}: archivo no encontrado (${ruta})`);
    fallos++;
    continue;
  }
  const nivel = JSON.parse(readFileSync(ruta, "utf8"));

  if (nivel.id !== id) {
    console.log(`✗ Nivel ${id}: el campo id dice ${nivel.id}`);
    fallos++;
  }
  if (nivel.mundo !== mundoDeNivel(id)) {
    console.log(`✗ Nivel ${id}: el campo mundo dice ${nivel.mundo}`);
    fallos++;
  }
  if (nivel.fases.length < 3 || nivel.fases.length > 4) {
    console.log(`✗ Nivel ${id}: tiene ${nivel.fases.length} fases (deben ser 3 o 4)`);
    fallos++;
  }

  for (const fase of nivel.fases) {
    fasesProbadas++;
    tiposVistos.add(fase.tipo);
    if (!TIPOS_FASE.has(fase.tipo)) {
      console.log(`✗ ${fase.id}: tipo de fase desconocido "${fase.tipo}"`);
      fallos++;
      continue;
    }

    if (fase.tipo === "PREDECIR") {
      const ok =
        Array.isArray(fase.opciones) &&
        fase.opciones.length >= 2 &&
        fase.opciones.some((o) => o.id === fase.respuestaCorrecta);
      if (!ok) {
        console.log(`✗ ${fase.id}: fase PREDECIR mal formada`);
        fallos++;
      }
      continue; // no se ejecuta código
    }

    try {
      const r = await correrFase(nivel, fase);
      if (!evaluar(fase, r)) {
        console.log(
          `✗ ${fase.id} (${fase.tipo}): la solución de referencia NO pasa su validación. ` +
            `salidas=${JSON.stringify(r.salidas.map((s) => s.valor))} pos=${JSON.stringify(r.robot1.posicion())} dir=${r.robot1.direccion} energia=${r.robot1.energia}`
        );
        fallos++;
      }
    } catch (e) {
      const v = fase.validacion || {};
      const esperado =
        v.tipo === "error_esperado" && (!v.codigoError || v.codigoError === e.codigo);
      if (!esperado) {
        console.log(`✗ ${fase.id} (${fase.tipo}): lanzó ${e.codigo || ""} ${e.mensaje || e.message}`);
        fallos++;
      }
    }
  }
}

console.log(`\n${fasesProbadas} fases probadas en ${TOTAL_NIVELES} niveles.`);
console.log(`Tipos de fase usados: ${[...tiposVistos].sort().join(", ")}`);
console.log(fallos === 0 ? "✓ TODO OK" : `✗ ${fallos} problema(s)`);
process.exit(fallos === 0 ? 0 : 1);
