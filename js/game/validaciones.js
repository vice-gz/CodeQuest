// validaciones.js
// Evaluación de las validaciones de cada fase (campo `validacion` del JSON).
// Fuente única: la usan juego.js y las pruebas (test_niveles.mjs), así lo que
// se prueba en Node es EXACTAMENTE lo que ve el estudiante.
//
// Tipos genéricos (cualquier mundo):
//   ejecutado | codigo_sin_error      el programa corrió sin error
//   output / output_exacto            alguna salida es exactamente valorEsperado
//   output_contiene                   alguna salida contiene valor
//   output_con_variable               output exacto + variableRequerida usada en el código
//   output_lineas                     las líneas de print son EXACTAMENTE `valores`, en orden
//   variables                         memoria final: { x: 10, nombre: "Ana" }
//   min_lineas                        el programa tiene al menos `minimo` líneas de código (sin vacías ni comentarios)
//   todos                             todas las `condiciones` (lista de validaciones)
// Cualquier validación acepta además `requiere`:
//   { construcciones: ["if","else"], prohibe: ["print"], operador: "+", operadores: ["/","%"], variable: "total", algunaVariable: true }
// Cada escenario añade sus propios tipos en escenario.evaluar() (posición, objetivos,
// cartas, elevador...). Un tipo que nadie conoce cuenta como NO cumplido.

export function codigoSinTextos(codigo) {
  return String(codigo)
    .replace(/#.*$/gm, "")
    .replace(/"[^"]*"/g, '""')
    .replace(/'[^']*'/g, "''");
}

/** Líneas de programa: no vacías y que no sean solo un comentario. */
export function contarLineasDePrograma(codigo) {
  return String(codigo ?? "")
    .split("\n")
    .filter((l) => l.trim() !== "" && !l.trim().startsWith("#")).length;
}

export function crearAyudas({ salidas = [], memoria = {}, codigo = "" }) {
  const fuente = codigoSinTextos(codigo);
  const lineasPrint = salidas.filter((s) => s.tipo === "PRINT").map((s) => String(s.valor));
  return {
    fuente,
    lineasPrint,
    inc: (v) => salidas.some((s) => String(s.valor).includes(String(v))),
    exact: (v) => salidas.some((s) => String(s.valor) === String(v)),
    // «x = …» y también la asignación compuesta «x += …» (-=, *=, /=, //=, %=)
    tieneAlgunaVariable: () => /(^|\n)[ \t]*[A-Za-z_]\w*[ \t]*(?:\/\/|[-+*/%])?=(?!=)/.test(fuente),
    lineasDeCodigo: contarLineasDePrograma(codigo),
    tieneVar: (n) => new RegExp(`\\b${n}\\s*(?:\\/\\/|[-+*/%])?=(?!=)`).test(fuente),
    tiene: (palabra) => (/^[A-Za-z_]+$/.test(palabra) ? new RegExp(`\\b${palabra}\\b`).test(fuente) : fuente.includes(palabra)),
    memoria,
  };
}

function cumpleRequisitos(req, h) {
  if (!req) return true;
  if ((req.construcciones || []).some((c) => !h.tiene(c))) return false;
  if ((req.prohibe || []).some((c) => h.tiene(c))) return false;
  if (req.operador && !h.fuente.includes(req.operador)) return false;
  if ((req.operadores || []).some((o) => !h.fuente.includes(o))) return false;
  if (req.variable && !h.tieneVar(req.variable)) return false;
  if (req.algunaVariable && !h.tieneAlgunaVariable()) return false;
  return true;
}

/**
 * @param {object} validacion
 * @param {object} escenario  instancia de EscenarioBase (para tipos propios del mundo)
 * @param {{salidas:Array, memoria:object, codigo:string}} ctx
 */
export function evaluarValidacion(validacion, escenario, ctx) {
  const v = validacion || { tipo: "ejecutado" };
  const h = crearAyudas(ctx);
  if (!cumpleRequisitos(v.requiere, h)) return false;

  switch (v.tipo) {
    case "ejecutado":
    case "codigo_sin_error":
      return true;
    case "output":
    case "output_exacto":
      return h.exact(v.valorEsperado);
    case "output_contiene":
      return h.inc(v.valor ?? v.valorEsperado);
    case "output_con_variable":
      return h.exact(v.valorEsperado) && h.tieneVar(v.variableRequerida);
    case "output_lineas": {
      const esperadas = (v.valores || []).map(String);
      return esperadas.length === h.lineasPrint.length && esperadas.every((e, i) => e === h.lineasPrint[i]);
    }
    case "variables":
      return Object.entries(v.variables || {}).every(([nombre, valor]) => h.memoria[nombre] === valor);
    case "min_lineas":
      return h.lineasDeCodigo >= (v.minimo ?? 1);
    case "todos":
      return (v.condiciones || []).every((c) => evaluarValidacion(c, escenario, ctx));
    default: {
      const propio = escenario?.evaluar?.(v, ctx, h);
      return propio === undefined ? false : propio;
    }
  }
}
