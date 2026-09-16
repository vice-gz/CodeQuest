// movimiento.js
// Utilidades de dirección compartidas por js/game/robot1.js (robot visual)
// y js/interpreter/interpreter.js (robot simulado que calcula valores de
// robot1.mirar() / robot1.posicion() / robot1.energia() en el momento en
// que se evalúan, antes de que la animación se reproduzca).
//
// Decisión no especificada en los documentos: se centraliza aquí para no
// duplicar la lógica de vectores/energía en dos lugares (Documento 2,
// prompt maestro original, sección 19: "evitar duplicación").

export const DIRECCIONES_VALIDAS = new Set([
  "norte", "sur", "este", "oeste",
  "arriba", "abajo", "izquierda", "derecha",
]);

const EQUIVALENCIAS = {
  arriba: "norte",
  abajo: "sur",
  derecha: "este",
  izquierda: "oeste",
};

export function normalizarDireccion(direccion) {
  return EQUIVALENCIAS[direccion] || direccion;
}

const VECTORES = {
  norte: [0, -1],
  sur: [0, 1],
  este: [1, 0],
  oeste: [-1, 0],
};

export function vectorDireccion(direccion) {
  const normal = normalizarDireccion(direccion);
  return VECTORES[normal] || [1, 0];
}

export function esDireccionValida(direccion) {
  return DIRECCIONES_VALIDAS.has(direccion);
}
