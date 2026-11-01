// evaluacion.js
// Ejecución y evaluación de una fase. La comparten juego.js y las pruebas.
//
// CASOS: una fase puede declarar `casos` (varias "mesas", "edificios" o
// valores de entrada distintos). El programa del estudiante se ejecuta con la
// animación completa sobre el caso que está viendo y, en silencio, sobre los
// demás; la fase solo se supera si TODOS los casos dan lo esperado. Así un
// programa que solo "adivina" el caso visible (print("Bust") a ciegas) no pasa:
// hay que escribir la regla de verdad.
//
//   fase.casos = [{ etiqueta, escenario:{...}, entradas:[...], esperado:{validacion} }]
//   fase.validacion = { tipo: "casos", requiere:{ construcciones:["if"] } }

import { Interpreter } from "../interpreter/interpreter.js";
import { evaluarValidacion, crearAyudas } from "./validaciones.js";
import { crearEscenario, configDeFase } from "./escenarios/index.js";
import { Errores } from "../interpreter/errors.js";

/**
 * Ejecuta un AST ya validado sobre un escenario.
 * @returns {{salidas:Array, memoria:object, interprete:Interpreter}}
 */
export async function ejecutarPrograma({ ast, escenario, callbacks = {}, entradas = null }) {
  const salidas = [];
  const cola = entradas ? [...entradas] : null;

  const motor = escenario.crearMotor({
    ...callbacks,
    onSalida: (s) => {
      salidas.push(s);
      callbacks.onSalida?.(s);
    },
    pedirEntrada: cola
      ? async () => {
          if (!cola.length) throw Errores.sinValoresDeEntrada();
          return cola.shift();
        }
      : callbacks.pedirEntrada,
  });

  const variablesIniciales = escenario.variablesIniciales;
  Object.entries(variablesIniciales).forEach(([n, v]) => callbacks.onAsignacion?.(n, v));

  const interprete = new Interpreter(motor, { variablesIniciales });
  await interprete.ejecutar(ast);
  return { salidas, memoria: Object.fromEntries(interprete.variables), interprete };
}

function describirEsperado(esperado) {
  if (!esperado) return "";
  switch (esperado.tipo) {
    case "output_lineas": {
      const v = esperado.valores || [];
      return v.length ? `imprimir ${v.map((x) => `«${x}»`).join(", luego ")}` : "no imprimir nada";
    }
    case "variables":
      return Object.entries(esperado.variables || {})
        .map(([n, x]) => `${n} = ${typeof x === "string" ? `"${x}"` : x}`)
        .join(", ");
    case "elevador_entrega":
      return "dejar a todos los pasajeros en la planta baja";
    case "elevador_piso":
      return `dejar el elevador en el piso ${esperado.valorEsperado}`;
    case "todos":
      return (esperado.condiciones || []).map(describirEsperado).filter(Boolean).join(" y ");
    default:
      return "";
  }
}

function describirObtenido(esperado, resultado) {
  const lineas = (e) => {
    if (e?.tipo === "output_lineas") return e;
    return (e?.condiciones || []).find((c) => c.tipo === "output_lineas") || null;
  };
  if (lineas(esperado)) {
    const l = crearAyudas(resultado).lineasPrint;
    return l.length ? `imprimió ${l.map((x) => `«${x}»`).join(", luego ")}` : "no imprimió nada";
  }
  if (resultado.escenario?.tipo === "elevador") {
    const s = resultado.escenario.snapshot();
    return `terminó en el piso ${s.piso} con ${s.entregados} de ${s.total} pasajeros entregados`;
  }
  return "";
}

/**
 * Evalúa la fase tras la ejecución visual.
 * @param {object} p
 * @param {object} p.nivel
 * @param {object} p.fase
 * @param {string} p.codigo
 * @param {object} p.ast
 * @param {{escenario:object, salidas:Array, memoria:object}} p.visual resultado de la ejecución visible
 * @param {number} [p.casoVisual] índice del caso que se ejecutó con animación
 * @returns {Promise<{exito:boolean, requisitos:boolean, casos:Array}>}
 */
export async function evaluarFase({ nivel, fase, codigo, ast, visual, casoVisual = 0 }) {
  const ctxVisual = { salidas: visual.salidas, memoria: visual.memoria, codigo };

  if (!fase.casos?.length) {
    const ok = evaluarValidacion(fase.validacion, visual.escenario, ctxVisual);
    return { exito: ok, requisitos: true, casos: [] };
  }

  const requiere = fase.validacion?.requiere;
  const requisitos = evaluarValidacion({ tipo: "ejecutado", requiere }, visual.escenario, ctxVisual);

  const resultados = [];
  for (let i = 0; i < fase.casos.length; i++) {
    const caso = fase.casos[i];
    const esperado = caso.esperado || fase.validacion?.esperado;
    let ejecucion;
    try {
      if (i === casoVisual) {
        ejecucion = { escenario: visual.escenario, salidas: visual.salidas, memoria: visual.memoria };
      } else {
        const escenario = crearEscenario(configDeFase(nivel, fase, caso), { canvas: null });
        const r = await ejecutarPrograma({ ast, escenario, entradas: caso.entradas ?? [] });
        ejecucion = { escenario, salidas: r.salidas, memoria: r.memoria };
      }
      const ok = evaluarValidacion(esperado, ejecucion.escenario, { ...ejecucion, codigo });
      resultados.push({
        etiqueta: caso.etiqueta || `Caso ${i + 1}`,
        ok,
        esperado: describirEsperado(esperado),
        obtenido: describirObtenido(esperado, ejecucion),
      });
    } catch (error) {
      // Un caso que hace fallar el programa (variable sin definir en una rama, etc.)
      resultados.push({ etiqueta: caso.etiqueta || `Caso ${i + 1}`, ok: false, error, esperado: describirEsperado(esperado), obtenido: "" });
    }
  }
  return { exito: requisitos && resultados.every((r) => r.ok), requisitos, casos: resultados };
}
