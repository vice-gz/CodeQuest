// ProgressRepository.js
// Interfaz de persistencia. Define el contrato que cualquier
// implementación de almacenamiento debe cumplir (Documento 2, sección 6).
// La versión actual usa localStorage; una futura versión podrá
// implementar esta misma interfaz con una API REST, sin tocar el juego.

export class ProgressRepository {
  /** @param {object} progreso */
  guardarProgreso(progreso) {
    throw new Error("guardarProgreso() no implementado");
  }

  /** @returns {object} */
  cargarProgreso() {
    throw new Error("cargarProgreso() no implementado");
  }

  /** @param {object} ejecucion */
  guardarEjecucion(ejecucion) {
    throw new Error("guardarEjecucion() no implementado");
  }

  /** @param {number|string} nivelId
   *  @returns {number} */
  obtenerEstrellas(nivelId) {
    throw new Error("obtenerEstrellas() no implementado");
  }
}
