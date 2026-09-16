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
    costoEnergiaPorCasilla: escenario.costoEnergiaPorCasilla ?? 1,
  });
  const scene = new SceneNula(world, robot1);

  const salidas = [];
  const memoria = {};
  const motor = crearMotor({
    scene,
    world,
    robot1,
    entradasSimuladas: fase.entradasSimuladas || [],
    callbacks: {
      onSalida: (s) => salidas.push(s),
      onAsignacion: (n, v) => {
        memoria[n] = v;
      },
      onEstado: () => {},
    },
  });

  const codigo = fase.solucionReferencia ?? fase.codigoInicial ?? "";
  const tokens = new Lexer(codigo).tokenizar();
  const ast = new Parser(tokens).parsear();
  new Validator(fase).validar(ast);
  await new Interpreter(motor).ejecutar(ast);

  return { salidas, memoria, robot1, estado: snapshotEstado(robot1) };
}

function evaluar(fase, { salidas, robot1 }) {
  const v = fase.validacion || { tipo: "ejecutado" };
  if (v.tipo === "ejecutado") return true;
  if (v.tipo === "output") {
    return salidas.some((s) => String(s.valor) === String(v.valorEsperado));
  }
  if (v.tipo === "posicion") {
    const [x, y] = robot1.posicion();
    return x === v.valorEsperado[0] && y === v.valorEsperado[1];
  }
  if (v.tipo === "estado") {
    const [x, y] = robot1.posicion();
    let ok = true;
    if (v.posicionEsperada) ok = ok && x === v.posicionEsperada[0] && y === v.posicionEsperada[1];
    if (v.direccionEsperada) ok = ok && robot1.direccion === v.direccionEsperada;
    if (v.energiaMinima !== undefined) ok = ok && robot1.energia >= v.energiaMinima;
    return ok;
  }
  return false;
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
      console.log(`✗ ${fase.id} (${fase.tipo}): lanzó ${e.codigo || ""} ${e.mensaje || e.message}`);
      fallos++;
    }
  }
}

console.log(`\n${fasesProbadas} fases probadas en ${TOTAL_NIVELES} niveles.`);
console.log(`Tipos de fase usados: ${[...tiposVistos].sort().join(", ")}`);
console.log(fallos === 0 ? "✓ TODO OK" : `✗ ${fallos} problema(s)`);
process.exit(fallos === 0 ? 0 : 1);
