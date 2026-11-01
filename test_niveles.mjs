// test_niveles.mjs
// Arnés de pruebas headless: corre la solución de referencia de CADA fase de
// CADA nivel (todos los mundos) por el motor real —Lexer -> Parser -> Validator
// -> Interpreter -> Escenario del mundo— y comprueba que pasa SU PROPIA
// validación con el mismo código que usa el juego (js/game/evaluacion.js).
// Además comprueba que las `solucionesIncorrectas` de cada fase NO pasan: así
// se sabe que la validación realmente exige el concepto y no se puede "tramposear".
// Uso: node test_niveles.mjs

import { readFileSync, readdirSync } from "fs";
import { Lexer } from "./js/interpreter/lexer.js";
import { Parser } from "./js/interpreter/parser.js";
import { Validator } from "./js/interpreter/validator.js";
import { crearEscenario, configDeFase } from "./js/game/escenarios/index.js";
import { ejecutarPrograma, evaluarFase } from "./js/game/evaluacion.js";
import { NIVEL_SANDBOX } from "./js/game/sandbox.js";
import { construirCatalogo } from "./js/persistence/progreso.js";

// ---------- Carga de niveles ----------
const niveles = [];
for (const carpeta of readdirSync("levels").sort()) {
  for (const archivo of readdirSync(`levels/${carpeta}`)) {
    const nivel = JSON.parse(readFileSync(`levels/${carpeta}/${archivo}`, "utf8"));
    niveles.push({ nivel, carpeta, archivo });
  }
}
niveles.sort((a, b) => a.nivel.id - b.nivel.id);
const catalogo = construirCatalogo(niveles.map((n) => n.nivel));
const nivelPorId = Object.fromEntries(niveles.map((n) => [n.nivel.id, n.nivel]));

const TIPOS_FASE = new Set(["EXPLORAR", "MODIFICAR", "PREDECIR", "ESCRIBIR", "RESOLVER", "DEBUG", "LIBRE"]);
const PERMISOS = new Set(["print", "entrada", "asignacion", "if", "elif", "else", "while", "for", "and", "or", "not", "booleanos"]);
const TIPO_POR_MUNDO = { 1: "laboratorio", 2: "datos", 3: "cartas", 4: "elevador" };

let fallos = 0;
let fasesProbadas = 0;
let trampasProbadas = 0;
const tiposVistos = new Set();
const falla = (msg) => {
  console.log(`✗ ${msg}`);
  fallos++;
};

// Ejecuta un código sobre una fase y devuelve { evaluacion, visual, escenario } o lanza el CQLError.
async function correr(nivel, fase, codigo) {
  const caso0 = fase.casos?.[0] ?? null;
  const escenario = crearEscenario(configDeFase(nivel, fase, caso0), { canvas: null });
  const ast = new Parser(new Lexer(codigo).tokenizar()).parsear();
  new Validator(fase, {
    biblioteca: escenario.biblioteca,
    variablesIniciales: Object.keys(escenario.variablesIniciales),
  }).validar(ast);
  const visual = await ejecutarPrograma({
    ast,
    escenario,
    entradas: fase.entradasEstudiante ?? caso0?.entradas ?? [],
  });
  const evaluacion = await evaluarFase({ nivel, fase, codigo, ast, visual: { ...visual, escenario }, casoVisual: 0 });
  return { evaluacion, visual, escenario };
}

// ---------- Estructura global ----------
const ids = niveles.map((n) => n.nivel.id);
if (ids.some((id, i) => id !== i + 1)) falla(`los ids de nivel deben ser consecutivos desde 1: ${ids.join(",")}`);

const ultimoDeMundo = new Set(Object.values(catalogo.mundos).map((m) => m.niveles[m.niveles.length - 1]));

for (const { nivel, carpeta } of niveles) {
  const id = nivel.id;
  if (carpeta !== `mundo${nivel.mundo}`) falla(`Nivel ${id}: está en ${carpeta} pero dice mundo ${nivel.mundo}`);
  if (nivel.escenario?.tipo && TIPO_POR_MUNDO[nivel.mundo] && nivel.escenario.tipo !== TIPO_POR_MUNDO[nivel.mundo]) {
    falla(`Nivel ${id}: el mundo ${nivel.mundo} debe usar escenario "${TIPO_POR_MUNDO[nivel.mundo]}"`);
  }
  if (nivel.mundo > 1 && !nivel.escenario?.tipo) falla(`Nivel ${id}: falta escenario.tipo`);
  if (nivel.fases.length < 3 || nivel.fases.length > 4) falla(`Nivel ${id}: tiene ${nivel.fases.length} fases (deben ser 3 o 4)`);
  if (!/^[a-z0-9_]+$/.test(nivel.concepto_evaluado || "")) falla(`Nivel ${id}: falta concepto_evaluado (snake_case)`);

  const tieneNarrativa = typeof nivel.narrativaSiguienteMundo === "string" && nivel.narrativaSiguienteMundo.length > 20;
  if (ultimoDeMundo.has(id) !== tieneNarrativa) {
    falla(`Nivel ${id}: narrativaSiguienteMundo ${ultimoDeMundo.has(id) ? "falta" : "sobra (solo va en el último nivel de cada mundo)"}`);
  }

  const fasesIds = new Set();
  for (const fase of nivel.fases) {
    if (fasesIds.has(fase.id)) falla(`${fase.id}: id de fase repetido`);
    fasesIds.add(fase.id);
    for (const p of fase.instruccionesPermitidas || []) if (!PERMISOS.has(p)) falla(`${fase.id}: permiso desconocido "${p}"`);
  }
}

// ---------- Estructura por bloques de los Mundos 3 y 4 (12 niveles cada uno) ----------
for (const mundo of [3, 4]) {
  const ids = catalogo.mundos[mundo].niveles;
  if (ids.length !== 12) falla(`el Mundo ${mundo} debe tener 12 niveles (tiene ${ids.length})`);
  ids.forEach((id, i) => {
    const ord = i + 1;
    const tipos = nivelPorId[id].fases.map((f) => f.tipo);
    const tiene = (t) => tipos.includes(t);
    if (ord <= 4 && tipos.some((t) => !["EXPLORAR", "PREDECIR", "MODIFICAR"].includes(t))) {
      falla(`Mundo ${mundo} nivel ${ord} (Aprender): solo debe usar fases Explorar, Predecir y Modificar (usa ${tipos.join(", ")})`);
    }
    if (ord >= 5 && ord <= 8 && !(tiene("DEBUG") && tiene("ESCRIBIR"))) falla(`Mundo ${mundo} nivel ${ord} (Practicar): debe mezclar fases DEBUG y ESCRIBIR`);
    if (ord >= 9 && !(tiene("RESOLVER") && tiene("LIBRE"))) falla(`Mundo ${mundo} nivel ${ord} (Dominar): debe tener fases RESOLVER y LIBRE`);
    if (ord >= 10) {
      for (const f of nivelPorId[id].fases) {
        if (["ESCRIBIR", "RESOLVER"].includes(f.tipo) && (f.casos?.length ?? 0) < 3) falla(`${f.id}: los niveles 10 a 12 deben validar con al menos 3 casos (tiene ${f.casos?.length ?? 0})`);
      }
    }
  });
}

// ---------- Cada fase con su solución de referencia ----------
for (const { nivel } of niveles) {
  for (const fase of nivel.fases) {
    fasesProbadas++;
    tiposVistos.add(fase.tipo);
    if (!TIPOS_FASE.has(fase.tipo)) {
      falla(`${fase.id}: tipo de fase desconocido "${fase.tipo}"`);
      continue;
    }

    if (fase.tipo === "PREDECIR") {
      const ok =
        Array.isArray(fase.opciones) && fase.opciones.length >= 2 && fase.opciones.some((o) => o.id === fase.respuestaCorrecta);
      if (!ok) falla(`${fase.id}: fase PREDECIR mal formada`);
      continue; // no se ejecuta código
    }

    const codigo = fase.solucionReferencia ?? fase.codigoInicial ?? "";
    try {
      const { evaluacion, visual } = await correr(nivel, fase, codigo);
      if (!evaluacion.exito) {
        const malos = evaluacion.casos.filter((c) => !c.ok).map((c) => `${c.etiqueta}: debía ${c.esperado}, ${c.obtenido || c.error?.mensaje || "falló"}`);
        falla(
          `${fase.id} (${fase.tipo}): la solución de referencia NO pasa su validación. ` +
            `salidas=${JSON.stringify(visual.salidas.map((s) => s.valor))} ${malos.join(" | ")}`
        );
      }
    } catch (e) {
      const v = fase.validacion || {};
      const esperado = v.tipo === "error_esperado" && (!v.codigoError || v.codigoError === e.codigo);
      if (!esperado) falla(`${fase.id} (${fase.tipo}): lanzó ${e.codigo || ""} ${e.mensaje || e.message}`);
    }

    // Las soluciones "tramposas" o incompletas NO deben pasar.
    for (const mala of fase.solucionesIncorrectas || []) {
      trampasProbadas++;
      try {
        const { evaluacion } = await correr(nivel, fase, mala);
        if (evaluacion.exito) falla(`${fase.id}: la solución incorrecta PASA la validación:\n${mala}`);
      } catch {
        /* lanzar un error también cuenta como "no pasa" */
      }
    }
  }
}

// ---------- Laboratorio Libre ----------
{
  const nivel = NIVEL_SANDBOX;
  const fase = {
    ...nivel.fases[0],
    entradasEstudiante: ["42"],
    codigoInicial: [
      "x = entrada()",
      "robot1.avanzar(9)",
      'robot1.girar("sur")',
      "robot1.avanzar(9)",
      'robot1.hablar("hola")',
      "print(robot1.posicion())",
      "print(robot1.energia())",
      "robot1.soltar()",
      "print(robot1.mirar())",
      "print(x)",
    ].join("\n"),
  };
  try {
    const { visual, escenario } = await correr(nivel, fase, fase.codigoInicial);
    const [x, y] = escenario.robot1.posicion();
    if (x !== 9 || y !== 9) throw new Error(`Robot1 debía terminar en (9,9) y está en (${x},${y})`);
    if (!visual.salidas.some((s) => String(s.valor) === "42")) throw new Error("falta la salida de entrada()");
    console.log("✓ Laboratorio Libre: cuadrícula 10×10 y todas las instrucciones funcionan");
  } catch (e) {
    falla(`Laboratorio Libre: ${e.codigo || ""} ${e.mensaje || e.message}`);
  }
}

console.log(`\n${fasesProbadas} fases probadas en ${niveles.length} niveles (${Object.keys(catalogo.mundos).length} mundos), ${trampasProbadas} soluciones incorrectas rechazadas.`);
console.log(`Tipos de fase usados: ${[...tiposVistos].sort().join(", ")}`);
if (fallos) {
  console.log(`\n✗ ${fallos} problema(s)`);
  process.exit(1);
}
console.log("✓ TODO OK");
