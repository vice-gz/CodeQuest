// eficiencia.js
// Reto de optimización de los Niveles Jefe: un mensaje MOTIVACIONAL cuando el programa que pasó es más largo de lo
// que recomienda el nivel (`max_lineas_recomendadas` en su JSON). Nunca quita estrellas ni bloquea el avance.

/** Líneas de código no vacías (los comentarios cuentan: son líneas del programa). */
export function contarLineasDeCodigo(codigo) {
  return String(codigo ?? "")
    .split("\n")
    .filter((linea) => linea.trim() !== "").length;
}

/**
 * @param {string} codigo
 * @param {number|undefined} maxLineasRecomendadas  propiedad `max_lineas_recomendadas` del nivel
 * @returns {string|null} el mensaje, o null si el nivel no lo define o el código ya es tan corto como se recomienda
 */
export function mensajeEficiencia(codigo, maxLineasRecomendadas) {
  if (!Number.isInteger(maxLineasRecomendadas) || maxLineasRecomendadas < 1) return null;
  const usadas = contarLineasDeCodigo(codigo);
  if (usadas <= maxLineasRecomendadas) return null;
  return `¡Excelente! Completaste el nivel. Pero usaste ${usadas} líneas. Un programador eficiente podría hacerlo en ${maxLineasRecomendadas}. ¿Te animas a intentarlo de nuevo?`;
}
