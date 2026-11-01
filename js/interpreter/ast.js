// ast.js
// Utilidades sobre el AST: convierte una expresión de vuelta a texto (para
// mostrar "total > 21" en la mesa de cartas) y recoge las variables que usa
// (para dibujar de dónde fluyen los valores en el Centro de Recuperación).

const PRECEDENCIA = { or: 1, and: 2, not: 3, cmp: 4, "+": 5, "-": 5, "*": 6, "/": 6, "%": 6, neg: 7 };

function precedencia(nodo) {
  switch (nodo.tipo) {
    case "Logica":
      return PRECEDENCIA[nodo.operador];
    case "Negacion":
      return PRECEDENCIA.not;
    case "Comparacion":
      return PRECEDENCIA.cmp;
    case "OperacionBinaria":
      return PRECEDENCIA[nodo.operador];
    case "Negativo":
      return PRECEDENCIA.neg;
    default:
      return 99;
  }
}

function conParen(hijo, minimo) {
  const t = formatearExpresion(hijo);
  return precedencia(hijo) < minimo ? `(${t})` : t;
}

export function formatearExpresion(nodo) {
  if (!nodo) return "";
  switch (nodo.tipo) {
    case "Numero":
      return String(nodo.valor);
    case "Texto":
      return `"${nodo.valor}"`;
    case "Booleano":
      return nodo.valor ? "True" : "False";
    case "Identificador":
      return nodo.nombre;
    case "OperacionBinaria":
      return `${conParen(nodo.izquierda, precedencia(nodo))} ${nodo.operador} ${conParen(nodo.derecha, precedencia(nodo) + 1)}`;
    case "Comparacion":
      return `${conParen(nodo.izquierda, PRECEDENCIA.cmp + 1)} ${nodo.operador} ${conParen(nodo.derecha, PRECEDENCIA.cmp + 1)}`;
    case "Logica":
      return `${conParen(nodo.izquierda, precedencia(nodo))} ${nodo.operador} ${conParen(nodo.derecha, precedencia(nodo) + 1)}`;
    case "Negacion":
      return `not ${conParen(nodo.operando, PRECEDENCIA.not)}`;
    case "Negativo":
      return `-${conParen(nodo.operando, PRECEDENCIA.neg)}`;
    case "LlamadaFuncion":
      return `${nodo.nombre}(${nodo.argumentos.map(formatearExpresion).join(", ")})`;
    case "LlamadaMetodo":
      return `${nodo.objeto}.${nodo.metodo}(${nodo.argumentos.map(formatearExpresion).join(", ")})`;
    default:
      return "?";
  }
}

/** Nombres de variables que aparecen en una expresión (sin repetir). */
export function variablesUsadas(nodo, acumulado = new Set()) {
  if (!nodo) return acumulado;
  switch (nodo.tipo) {
    case "Identificador":
      acumulado.add(nodo.nombre);
      break;
    case "OperacionBinaria":
    case "Comparacion":
    case "Logica":
      variablesUsadas(nodo.izquierda, acumulado);
      variablesUsadas(nodo.derecha, acumulado);
      break;
    case "Negacion":
    case "Negativo":
      variablesUsadas(nodo.operando, acumulado);
      break;
    case "LlamadaFuncion":
    case "LlamadaMetodo":
      nodo.argumentos.forEach((a) => variablesUsadas(a, acumulado));
      break;
    default:
      break;
  }
  return acumulado;
}
