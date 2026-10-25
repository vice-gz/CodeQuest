// NoopProgressRepository.js
// Repositorio que NO guarda nada. Lo usa el Laboratorio Libre: sin estrellas,
// sin progreso, sin escrituras a Supabase ni a localStorage.

import { ProgressRepository } from "./ProgressRepository.js";

const PROGRESO_VACIO = () => ({
  jugador: { nombre: "", mundoActual: 1, nivelActual: 1, experiencia: 0 },
  mundos: {},
  ejecuciones: [],
});

export class NoopProgressRepository extends ProgressRepository {
  async cargarProgreso() {
    return PROGRESO_VACIO();
  }
  async obtenerProgreso() {
    return PROGRESO_VACIO();
  }
  async guardarProgreso() {
    return true;
  }
  async guardarEjecucion() {
    return PROGRESO_VACIO();
  }
  async obtenerEstrellas() {
    return 0;
  }
  async obtenerEstadoNivel() {
    return { completado: false, estrellas: 0, fases: {} };
  }
  async registrarIntentoFase() {
    return { completada: false, intentos: 0, pistas: 0 };
  }
  async completarFase() {
    return { completada: false, intentos: 0, pistas: 0 };
  }
  async completarNivel() {
    return { completado: false, estrellas: 0, fases: {} };
  }
}
