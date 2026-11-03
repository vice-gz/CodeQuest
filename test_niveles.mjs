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
import { problemasDeFaseOrdenar, evaluarEleccion } from "./js/game/ordenar.js";

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

const TIPOS_FASE = new Set(["EXPLORAR", "MODIFICAR", "PREDECIR", "ESCRIBIR", "RESOLVER", "DEBUG", "LIBRE", "ORDENAR"]);
const PERMISOS = new Set(["print", "input", "int", "float", "str", "asignacion", "if", "elif", "else", "while", "for", "and", "or", "not", "booleanos", "def", "return"]);
const TIPO_POR_MUNDO = { 1: "laboratorio", 2: "datos", 3: "cartas", 4: "elevador", 5: "fabrica" };

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
// Los ids NO son consecutivos (Nivel 0, jefes 44-47 y Mundo 5 se añadieron después): solo deben ser únicos.
if (new Set(ids).size !== ids.length) falla(`hay ids de nivel repetidos: ${ids.join(",")}`);
const ESPERADOS = [0, ...Array.from({ length: 55 }, (_, i) => i + 1)];
if (JSON.stringify([...ids].sort((a, b) => a - b)) !== JSON.stringify(ESPERADOS)) falla(`deben existir los niveles 0 a 55: ${ids.join(",")}`);

const ultimoDeMundo = new Set(Object.values(catalogo.mundos).map((m) => m.niveles[m.niveles.length - 1]));

for (const { nivel, carpeta } of niveles) {
  const id = nivel.id;
  if (carpeta !== `mundo${nivel.mundo}`) falla(`Nivel ${id}: está en ${carpeta} pero dice mundo ${nivel.mundo}`);
  if (nivel.escenario?.tipo && TIPO_POR_MUNDO[nivel.mundo] && nivel.escenario.tipo !== TIPO_POR_MUNDO[nivel.mundo] && !(nivel.tutorial && nivel.escenario.tipo === "diagrama")) {
    falla(`Nivel ${id}: el mundo ${nivel.mundo} debe usar escenario "${TIPO_POR_MUNDO[nivel.mundo]}"`);
  }
  if (nivel.mundo > 1 && !nivel.escenario?.tipo) falla(`Nivel ${id}: falta escenario.tipo`);
  if (nivel.jefe) {
    // Nivel Jefe: una sola fase, sin pistas, editor en blanco y al final de su mundo.
    const f = nivel.fases[0];
    if (nivel.fases.length !== 1) falla(`Nivel jefe ${id}: debe tener UNA fase`);
    if (f.sinPistas !== true || f.pistas || f.codigoInicial !== "") falla(`Nivel jefe ${id}: debe ser sinPistas, sin lista de pistas y con el editor en blanco`);
    if (catalogo.mundos[nivel.mundo].niveles.at(-1) !== id) falla(`Nivel jefe ${id}: debe ser el último de su mundo`);
    if (nivel.mundo > 1 && nivel.mundo < 5 && (f.casos?.length ?? 0) < 3) falla(`Nivel jefe ${id}: debe validar con al menos 3 casos`);
  } else if (nivel.fases.length < 3 || nivel.fases.length > 5) falla(`Nivel ${id}: tiene ${nivel.fases.length} fases (deben ser de 3 a 5; las de 5 llevan una pregunta extra de comprensión tras un EXPLORAR)`);
  if (!nivel.jefe && nivel.fases.some((f) => f.sinPistas)) falla(`Nivel ${id}: solo los niveles jefe pueden ser sinPistas`);
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
  const ids = catalogo.mundos[mundo].niveles.filter((id) => !nivelPorId[id].jefe);
  if (ids.length !== 12) falla(`el Mundo ${mundo} debe tener 12 niveles normales (tiene ${ids.length}) y su jefe`);
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

// ---------- Ajustes pedagógicos ----------
{
  const texto = (n) => JSON.stringify(n);
  for (const { nivel: n } of niveles) {
    if (/\bCQL\b/.test(texto(n))) falla(`Nivel ${n.id}: el texto que ve el estudiante dice «CQL»; debe decir «Python»`);
    for (const f of n.fases) {
      // Una fase LIBRE es de verdad libre: solo pide ejecutar y no exige objetivos
      if (f.tipo === "LIBRE") {
        const e = { ...n.escenario, ...(f.escenario || {}) };
        if (f.validacion.tipo !== "ejecutado") falla(`${f.id}: una fase LIBRE solo puede validar «ejecutado» (esta valida «${f.validacion.tipo}»: debe ser RESOLVER)`);
        if (e.objetivoPosicion || e.objetivosPosicion) falla(`${f.id}: una fase LIBRE no puede exigir objetivos`);
      }
    }
    // En los mundos 1 y 2, un EXPLORAR de «solo ejecutar» va seguido de una comprobación (PREDECIR, MODIFICAR o DEBUG)
    if (n.mundo <= 2 && !n.tutorial) {
      n.fases.forEach((f, i) => {
        if (f.tipo !== "EXPLORAR" || f.validacion.tipo !== "ejecutado" || i === n.fases.length - 1) return;
        if (!["PREDECIR", "MODIFICAR", "DEBUG"].includes(n.fases[i + 1].tipo)) falla(`${f.id}: tras un EXPLORAR de «solo ejecutar» debe venir un PREDECIR, MODIFICAR o DEBUG (viene ${n.fases[i + 1].tipo})`);
      });
    }
    // Reto de optimización: solo los jefes 1 a 4 llevan la recomendación, y su propia solución de referencia la cumple
    if (n.jefe && n.mundo <= 4) {
      const lineas = n.fases[0].solucionReferencia.split("\n").filter((l) => l.trim() !== "").length;
      if (!Number.isInteger(n.max_lineas_recomendadas) || n.max_lineas_recomendadas < 1) falla(`Jefe ${n.id}: falta max_lineas_recomendadas`);
      else if (lineas > n.max_lineas_recomendadas) falla(`Jefe ${n.id}: su solución de referencia (${lineas} líneas) supera max_lineas_recomendadas (${n.max_lineas_recomendadas})`);
    } else if (n.max_lineas_recomendadas !== undefined) falla(`Nivel ${n.id}: solo los Niveles Jefe de los mundos 1 a 4 llevan max_lineas_recomendadas`);
  }
  // Nivel 11 (Mundo 2), fase del decimal: el error de coma sigue ahí y explica la regla de Python
  const f114 = nivelPorId[11].fases.find((f) => f.id === "11.4");
  if (f114.codigoInicial !== "precio = 2,5\nprint(precio)") falla("11.4: el código con el error (precio = 2,5) debe seguir siendo el punto de partida de la depuración");
  if (f114.solucionReferencia !== "precio = 2.5\nprint(precio)") falla("11.4: la solución debe usar precio = 2.5");
  for (const campo of ["enunciado", "mensajeNoLogrado"]) {
    if (!f114[campo]?.includes("En Python los decimales se escriben con punto, no con coma.")) falla(`11.4: «${campo}» debe aclarar que en Python los decimales se escriben con punto, no con coma`);
  }
  try {
    new Parser(new Lexer(f114.codigoInicial).tokenizar()).parsear();
    falla("11.4: el código con coma debe dar un error al ejecutarse");
  } catch (e) {
    if (e.codigo !== "SYN_019" || !e.educativo.includes("En Python los decimales se escriben con punto, no con coma.")) falla(`11.4: el error de la coma debe ser SYN_019 con la aclaración (dio ${e.codigo}: ${e.educativo})`);
  }
}

// ---------- Nivel 0, jefes y Mundo 5: estructura ----------
{
  const ord = (id) => catalogo.ordinales[id];
  if (ord(0) !== 0 || ord(1) !== 1 || ord(8) !== 8) falla("el Nivel 0 debe tener ordinal 0 y los niveles 1 a 8 sus propios números");
  const esperadosJefe = { 44: 9, 45: 12, 46: 13, 47: 13, 55: 8 };
  for (const [id, o] of Object.entries(esperadosJefe)) {
    if (!nivelPorId[id]?.jefe) falla(`el nivel ${id} debe ser un Nivel Jefe`);
    if (ord(id) !== o) falla(`el jefe ${id} debe ser el Nivel ${o} de su mundo (es el ${ord(id)})`);
  }
  if (catalogo.mundos[5].niveles.length !== 8) falla(`el Mundo 5 debe tener 8 niveles (tiene ${catalogo.mundos[5].niveles.length})`);
  // Mundo 5: Definir → Llamar → Parametrizar → Retornar → Variables locales → Encadenar → Depurar → Ensamblar (jefe)
  const tiposM5 = catalogo.mundos[5].niveles.map((id) => nivelPorId[id].fases.map((f) => f.tipo));
  const debeTener = [["EXPLORAR", "MODIFICAR"], ["RESOLVER"], ["ESCRIBIR"], ["DEBUG"], ["PREDECIR"], ["RESOLVER"], ["DEBUG"], ["RESOLVER"]];
  debeTener.forEach((tipos, i) => {
    for (const t of tipos) if (!tiposM5[i].includes(t)) falla(`Mundo 5 nivel ${i + 1}: debe tener una fase ${t} (tiene ${tiposM5[i].join(", ")})`);
  });
  if (tiposM5[6].filter((t) => t === "DEBUG").length < 3) falla("Mundo 5 nivel 7 (Reparando la fábrica): debe tener al menos 3 fases DEBUG (falta return, mal parámetro, función sin llamar)");
  if (!nivelPorId[55].jefe || nivelPorId[55].fases.length !== 1) falla("el Nivel 8 del Mundo 5 es el Nivel Jefe (una sola fase RESOLVER)");
  if (nivelPorId[55].fases[0].mensajeNoLogrado !== "El robot está incompleto. Asegúrate de definir las 3 funciones y llamarlas en el orden correcto (cabeza, brazos, piernas).") falla("el jefe del Mundo 5 debe decir el mensaje de «robot incompleto»");
  if (!nivelPorId[0].tutorial || catalogo.mundos[1].requeridos.includes(0)) falla("el Nivel 0 es tutorial y no cuenta para completar el Mundo 1");
  if (nivelPorId[0].fases.some((f) => f.tipo !== "ORDENAR")) falla("el Nivel 0 solo usa fases ORDENAR");
}

// ---------- Corrección pedagógica: "sumar textos" explica la concatenación ----------
{
  const f = nivelPorId[11].fases.find((x) => x.id === "11.2");
  const ok = /concatenar/i.test(f.enunciado) && /unir|une/i.test(f.enunciado) && f.respuestaCorrecta === "b" && f.opciones.find((o) => o.id === "b").texto === "53" &&
    /¡Cuidado!/.test(f.retroalimentacion) && /"5" \+ 3/.test(f.retroalimentacion) && /error/.test(f.retroalimentacion);
  if (!ok) falla("11.2 debe explicar la concatenación, mantener la respuesta 53 y avisar del error al mezclar texto con número");
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

    if (fase.tipo === "ORDENAR") {
      // Minijuego de tarjetas: la definición es coherente, el orden correcto CUMPLE el pasillo y cualquier otro orden falla.
      const problemas = problemasDeFaseOrdenar(fase);
      if (problemas.length) falla(`${fase.id}: ${problemas.join("; ")}`);
      const nuevo = () => crearEscenario(configDeFase(nivel, fase), { canvas: null });
      const esc = nuevo();
      for (const id of fase.ordenCorrecto) {
        const t = fase.tarjetas.find((x) => x.id === id);
        const r = esc.aplicar(t.accion);
        if (!r.ok) falla(`${fase.id}: la tarjeta «${t.texto}» del orden correcto no se puede ejecutar (${r.razon})`);
      }
      if (!esc.exito) falla(`${fase.id}: al ejecutar el orden correcto Robot1 no cruza la puerta`);
      // el orden correcto se acepta tarjeta por tarjeta; una tarjeta equivocada en cualquier posición se rechaza
      const elegidas = [];
      fase.ordenCorrecto.forEach((id, i) => {
        const r = evaluarEleccion(fase.ordenCorrecto, elegidas, id);
        if (!r.ok || r.completo !== (i === fase.ordenCorrecto.length - 1)) falla(`${fase.id}: el orden correcto no se acepta en el paso ${i + 1}`);
        elegidas.push(id);
        const otra = fase.ordenCorrecto.find((x) => x !== id && !elegidas.includes(x));
        if (otra && evaluarEleccion(fase.ordenCorrecto, elegidas.slice(0, -1), otra).ok) falla(`${fase.id}: una tarjeta equivocada se aceptó en el paso ${i + 1}`);
      });
      trampasProbadas += fase.ordenCorrecto.length;
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
      "x = int(input())",
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
    if (!visual.salidas.some((s) => String(s.valor) === "42")) throw new Error("falta la salida de input()");
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
