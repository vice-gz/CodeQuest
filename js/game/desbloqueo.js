// desbloqueo.js
// Regla del mapa de mundos (pura, sin DOM; la usan mundos.js, juego.js y los tests):
//   - el Mundo 1 siempre está abierto;
//   - cada mundo siguiente se abre al completar TODOS los niveles del anterior;
//   - un mundo sin niveles todavía es "proximamente";
//   - en modo demo (solo admins) están abiertos todos los que tienen niveles.

/**
 * @param {number} mundoId
 * @param {{mundos: object}} catalogo
 * @param {(id:number)=>boolean} mundoCompletado  ¿el estudiante completó ese mundo?
 * @param {boolean} [demo]
 * @returns {"completado"|"disponible"|"bloqueado"|"proximamente"}
 */
export function estadoDelMundo(mundoId, catalogo, mundoCompletado, demo = false) {
  if (!catalogo.mundos[mundoId]) return "proximamente";
  if (demo) return "disponible";
  if (mundoCompletado(mundoId)) return "completado";
  if (mundoId === 1) return "disponible";
  return catalogo.mundos[mundoId - 1] && mundoCompletado(mundoId - 1) ? "disponible" : "bloqueado";
}

export function mundoAbierto(mundoId, catalogo, mundoCompletado, demo = false) {
  const e = estadoDelMundo(mundoId, catalogo, mundoCompletado, demo);
  return e === "disponible" || e === "completado";
}
