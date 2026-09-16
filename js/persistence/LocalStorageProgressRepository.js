// LocalStorageProgressRepository.js
// Implementación de ProgressRepository usando localStorage, con el nuevo
// modelo de datos por mundos -> niveles -> fases (prompt de cambios,
// sección 11).

import { ProgressRepository } from "./ProgressRepository.js";

const CLAVE = "codequest:progreso:v2";
const MAX_EJECUCIONES_GUARDADAS = 50;

function progresoPorDefecto() {
  return {
    jugador: {
      nombre: "Estudiante",
      mundoActual: 1,
      nivelActual: 1,
      experiencia: 0,
    },
    mundos: {}, // { [mundoId]: { completado, niveles: { [nivelId]: {completado, estrellas, fases:{ [faseId]: {completada,intentos,pistas} }} } } }
    ejecuciones: [],
  };
}

function estadoNivelVacio() {
  return { completado: false, estrellas: 0, fases: {} };
}

// El progreso guardado puede venir de una versión anterior sin todos los
// campos. Un merge superficial dejaría huecos (por ejemplo jugador sin
// mundoActual), así que se rellena recursivamente contra el valor por defecto.
function mergeProfundo(base, datos) {
  const resultado = { ...base };
  for (const key of Object.keys(datos)) {
    const esObjeto = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
    if (esObjeto(base[key]) && esObjeto(datos[key])) {
      resultado[key] = mergeProfundo(base[key], datos[key]);
    } else {
      resultado[key] = datos[key];
    }
  }
  return resultado;
}

function estadoFaseVacio() {
  return { completada: false, intentos: 0, pistas: 0 };
}

export class LocalStorageProgressRepository extends ProgressRepository {
  guardarProgreso(progreso) {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(progreso));
      return true;
    } catch (e) {
      console.error("No se pudo guardar el progreso en localStorage", e);
      return false;
    }
  }

  cargarProgreso() {
    try {
      const crudo = localStorage.getItem(CLAVE);
      if (!crudo) return progresoPorDefecto();
      const datos = JSON.parse(crudo);
      return mergeProfundo(progresoPorDefecto(), datos);
    } catch (e) {
      console.error("No se pudo leer el progreso de localStorage", e);
      return progresoPorDefecto();
    }
  }

  guardarEjecucion(ejecucion) {
    const progreso = this.cargarProgreso();
    progreso.ejecuciones.unshift({ ...ejecucion, timestamp: Date.now() });
    if (progreso.ejecuciones.length > MAX_EJECUCIONES_GUARDADAS) {
      progreso.ejecuciones.length = MAX_EJECUCIONES_GUARDADAS;
    }
    this.guardarProgreso(progreso);
    return progreso;
  }

  obtenerEstrellas(nivelId) {
    const progreso = this.cargarProgreso();
    for (const mundo of Object.values(progreso.mundos)) {
      if (mundo.niveles[nivelId]) return mundo.niveles[nivelId].estrellas || 0;
    }
    return 0;
  }

  // --- Ayudas específicas del juego (no forman parte de la interfaz base) ---

  obtenerEstadoNivel(mundoId, nivelId) {
    const progreso = this.cargarProgreso();
    const mundo = progreso.mundos[mundoId];
    if (!mundo || !mundo.niveles[nivelId]) return estadoNivelVacio();
    return mundo.niveles[nivelId];
  }

  obtenerEstadoFase(mundoId, nivelId, faseId) {
    const estadoNivel = this.obtenerEstadoNivel(mundoId, nivelId);
    return estadoNivel.fases[faseId] || estadoFaseVacio();
  }

  registrarIntentoFase(mundoId, nivelId, faseId, { pistasUsadas, codigo } = {}) {
    const progreso = this.cargarProgreso();
    if (!progreso.mundos[mundoId]) progreso.mundos[mundoId] = { completado: false, niveles: {} };
    if (!progreso.mundos[mundoId].niveles[nivelId]) {
      progreso.mundos[mundoId].niveles[nivelId] = estadoNivelVacio();
    }
    const nivel = progreso.mundos[mundoId].niveles[nivelId];
    const fase = nivel.fases[faseId] || estadoFaseVacio();

    // Reejecutar el mismo código sin tocarlo no cuenta como intento nuevo:
    // de lo contrario, pulsar Ejecutar dos veces costaría una estrella.
    if (codigo !== undefined) {
      const ultima = progreso.ejecuciones.find(
        (e) => e.mundoId === mundoId && e.nivelId === nivelId && e.faseId === faseId
      );
      if (!ultima || ultima.codigo !== codigo) {
        fase.intentos += 1;
      }
    }

    if (pistasUsadas !== undefined) fase.pistas = Math.max(fase.pistas, pistasUsadas);
    nivel.fases[faseId] = fase;
    this.guardarProgreso(progreso);
    return fase;
  }

  completarFase(mundoId, nivelId, faseId) {
    const progreso = this.cargarProgreso();
    if (!progreso.mundos[mundoId]) progreso.mundos[mundoId] = { completado: false, niveles: {} };
    if (!progreso.mundos[mundoId].niveles[nivelId]) {
      progreso.mundos[mundoId].niveles[nivelId] = estadoNivelVacio();
    }
    const nivel = progreso.mundos[mundoId].niveles[nivelId];
    const fase = nivel.fases[faseId] || estadoFaseVacio();
    fase.completada = true;
    nivel.fases[faseId] = fase;
    this.guardarProgreso(progreso);
    return fase;
  }

  completarNivel(mundoId, nivelId, { estrellas, siguienteMundo, siguienteNivel, totalNivelesMundo } = {}) {
    const progreso = this.cargarProgreso();
    if (!progreso.mundos[mundoId]) progreso.mundos[mundoId] = { completado: false, niveles: {} };
    if (!progreso.mundos[mundoId].niveles[nivelId]) {
      progreso.mundos[mundoId].niveles[nivelId] = estadoNivelVacio();
    }
    const nivel = progreso.mundos[mundoId].niveles[nivelId];
    nivel.completado = true;
    nivel.estrellas = Math.max(nivel.estrellas, estrellas || 0);

    // Un mundo queda completo cuando todos sus niveles lo están.
    if (totalNivelesMundo) {
      const completados = Object.values(progreso.mundos[mundoId].niveles)
        .filter((n) => n.completado).length;
      if (completados >= totalNivelesMundo) {
        progreso.mundos[mundoId].completado = true;
      }
    }

    if (siguienteMundo && siguienteNivel) {
      progreso.jugador.mundoActual = siguienteMundo;
      progreso.jugador.nivelActual = siguienteNivel;
    }
    this.guardarProgreso(progreso);
    return nivel;
  }

  establecerNombreJugador(nombre) {
    const progreso = this.cargarProgreso();
    progreso.jugador.nombre = nombre;
    this.guardarProgreso(progreso);
  }
}
