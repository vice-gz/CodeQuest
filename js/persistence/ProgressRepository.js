// ProgressRepository.js
// Interfaz de persistencia. Define el contrato que cualquier
// implementación de almacenamiento debe cumplir (Documento 2, sección 6).
// Avance 1: LocalStorageProgressRepository (síncrono).
// Avance 2: SupabaseProgressRepository (asíncrono, implementación principal).
// El juego usa `await` en todas las llamadas, así que ambas son intercambiables.

export class ProgressRepository {
  /** Carga el progreso desde la fuente de verdad. @returns {Promise<object>|object} */
  cargarProgreso() {
    throw new Error("cargarProgreso() no implementado");
  }

  /** Devuelve el progreso ya cargado (lectura rápida para la UI). */
  obtenerProgreso() {
    throw new Error("obtenerProgreso() no implementado");
  }

  /** @param {object} progreso */
  guardarProgreso(progreso) {
    throw new Error("guardarProgreso() no implementado");
  }

  /** @param {object} ejecucion */
  guardarEjecucion(ejecucion) {
    throw new Error("guardarEjecucion() no implementado");
  }

  /** @param {number|string} nivelId */
  obtenerEstrellas(nivelId) {
    throw new Error("obtenerEstrellas() no implementado");
  }

  obtenerEstadoNivel(mundoId, nivelId) {
    throw new Error("obtenerEstadoNivel() no implementado");
  }

  registrarIntentoFase(mundoId, nivelId, faseId, datos) {
    throw new Error("registrarIntentoFase() no implementado");
  }

  completarFase(mundoId, nivelId, faseId) {
    throw new Error("completarFase() no implementado");
  }

  completarNivel(mundoId, nivelId, datos) {
    throw new Error("completarNivel() no implementado");
  }
}
