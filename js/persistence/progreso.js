// progreso.js
// Funciones PURAS (sin DOM ni red) que convierten las filas de Supabase
// (progreso_fases) en la estructura que usa el juego y en los resúmenes
// que muestran el perfil y el panel de admin. Al ser puras se pueden probar
// con Node (test_persistencia.mjs).
//
// `catalogo` tiene la forma { niveles: { [id]: { id, mundo, nombre, fases: [{id}] } },
//                             mundos:  { [id]: { id, nombre, niveles: [ids] } } }

import { calcularEstrellasNivel } from "../ui/stars.js";

const NOMBRES_MUNDO = { 1: "Despertar", 2: "Memoria" };

/** Construye el catálogo a partir de la lista de JSON de niveles. */
export function construirCatalogo(listaNiveles) {
  const niveles = {};
  const mundos = {};
  listaNiveles.forEach((n) => {
    niveles[n.id] = n;
    if (!mundos[n.mundo]) {
      mundos[n.mundo] = { id: n.mundo, nombre: NOMBRES_MUNDO[n.mundo] || `Mundo ${n.mundo}`, niveles: [] };
    }
    mundos[n.mundo].niveles.push(n.id);
  });
  Object.values(mundos).forEach((m) => m.niveles.sort((a, b) => a - b));
  const totalNiveles = Object.keys(niveles).length;
  return { niveles, mundos, totalNiveles, maxEstrellas: totalNiveles * 3 };
}

export const claveFase = (mundoId, nivelId, faseId) => `${Number(mundoId)}|${Number(nivelId)}|${faseId}`;

export function estadoFaseVacio() {
  return { completada: false, intentos: 0, pistas: 0 };
}

// Experiencia = 100 por nivel completado + 50 por estrella ganada.
// Se recalcula siempre desde el progreso, así nunca se cuenta dos veces.
export function calcularExperiencia(nivelesCompletados, estrellas) {
  return nivelesCompletados * 100 + estrellas * 50;
}

/** Filas de BD -> { [nivelId]: { [faseId]: {completada, intentos, pistas} } } */
export function agruparFilasPorNivel(filas) {
  const porNivel = {};
  (filas || []).forEach((f) => {
    const nivelId = Number(f.nivel_id);
    if (!porNivel[nivelId]) porNivel[nivelId] = {};
    porNivel[nivelId][f.fase_id] = {
      completada: f.completada === true,
      intentos: Number(f.intentos) || 0,
      pistas: Number(f.pistas_usadas) || 0,
    };
  });
  return porNivel;
}

/** Estado derivado de un nivel (completado y estrellas) a partir de sus fases. */
export function estadoNivelDerivado(nivelCatalogo, fasesGuardadas = {}) {
  const completas = {};
  nivelCatalogo.fases.forEach((f) => {
    completas[f.id] = fasesGuardadas[f.id] || estadoFaseVacio();
  });
  const completado = nivelCatalogo.fases.every((f) => completas[f.id].completada);
  return {
    completado,
    estrellas: completado ? calcularEstrellasNivel(completas) : 0,
    fases: { ...fasesGuardadas },
  };
}

/** Estructura que espera el juego (la misma que usaba localStorage). */
export function construirProgresoJuego({ jugador, filas, catalogo, nombre = "Estudiante" }) {
  const porNivel = agruparFilasPorNivel(filas);
  const mundos = {};

  Object.keys(porNivel).forEach((nivelKey) => {
    const nivelId = Number(nivelKey);
    const nivelCat = catalogo.niveles[nivelId];
    if (!nivelCat) return; // fila de un nivel que ya no existe en el catálogo
    if (!mundos[nivelCat.mundo]) mundos[nivelCat.mundo] = { completado: false, niveles: {} };
    mundos[nivelCat.mundo].niveles[nivelId] = estadoNivelDerivado(nivelCat, porNivel[nivelId]);
  });

  Object.keys(mundos).forEach((mundoKey) => {
    const mundoCat = catalogo.mundos[mundoKey];
    mundos[mundoKey].completado = mundoCat.niveles.every(
      (id) => mundos[mundoKey].niveles[id]?.completado === true
    );
  });

  return {
    jugador: {
      nombre,
      mundoActual: Number(jugador?.mundo_actual ?? jugador?.mundoActual) || 1,
      nivelActual: Number(jugador?.nivel_actual ?? jugador?.nivelActual) || 1,
      experiencia: Number(jugador?.experiencia) || 0,
    },
    mundos,
    ejecuciones: [],
  };
}

/** Estructura del juego -> filas planas {mundoId, nivelId, faseId, ...}. */
export function filasDesdeProgresoJuego(progreso) {
  const filas = [];
  Object.entries(progreso?.mundos || {}).forEach(([mundoId, mundo]) => {
    Object.entries(mundo.niveles || {}).forEach(([nivelId, nivel]) => {
      Object.entries(nivel.fases || {}).forEach(([faseId, f]) => {
        filas.push({
          mundoId: Number(mundoId),
          nivelId: Number(nivelId),
          faseId,
          completada: f.completada === true,
          intentos: f.intentos || 0,
          pistas: f.pistas || 0,
        });
      });
    });
  });
  return filas;
}

/**
 * Resumen para perfil y admin.
 * @param {Array} filas filas de progreso_fases de UN usuario
 */
export function calcularResumen(filas, catalogo) {
  const porNivel = agruparFilasPorNivel(filas);
  const niveles = {};
  const mundos = {};

  Object.values(catalogo.mundos).forEach((m) => {
    mundos[m.id] = {
      id: m.id,
      nombre: m.nombre,
      estrellas: 0,
      estrellasMax: m.niveles.length * 3,
      fasesCompletadas: 0,
      fasesTotal: 0,
      nivelesCompletados: 0,
      nivelesTotal: m.niveles.length,
      completado: false,
      porcentaje: 0,
    };
  });

  Object.values(catalogo.niveles).forEach((n) => {
    const guardadas = porNivel[n.id] || {};
    const estado = estadoNivelDerivado(n, guardadas);
    const fasesCompletadas = n.fases.filter((f) => guardadas[f.id]?.completada).length;
    const intentos = Object.values(guardadas).reduce((s, f) => s + f.intentos, 0);
    const pistas = Object.values(guardadas).reduce((s, f) => s + f.pistas, 0);

    niveles[n.id] = {
      id: n.id,
      mundo: n.mundo,
      nombre: n.nombre,
      completado: estado.completado,
      estrellas: estado.estrellas,
      fasesCompletadas,
      fasesTotal: n.fases.length,
      intentos,
      pistas,
    };

    const m = mundos[n.mundo];
    m.estrellas += estado.estrellas;
    m.fasesCompletadas += fasesCompletadas;
    m.fasesTotal += n.fases.length;
    if (estado.completado) m.nivelesCompletados += 1;
  });

  Object.values(mundos).forEach((m) => {
    m.completado = m.nivelesCompletados === m.nivelesTotal;
    m.porcentaje = m.fasesTotal ? Math.round((m.fasesCompletadas / m.fasesTotal) * 100) : 0;
  });

  const lista = Object.values(mundos);
  const totales = {
    estrellas: lista.reduce((s, m) => s + m.estrellas, 0),
    estrellasMax: lista.reduce((s, m) => s + m.estrellasMax, 0),
    nivelesCompletados: lista.reduce((s, m) => s + m.nivelesCompletados, 0),
    nivelesTotal: lista.reduce((s, m) => s + m.nivelesTotal, 0),
    fasesCompletadas: lista.reduce((s, m) => s + m.fasesCompletadas, 0),
    fasesTotal: lista.reduce((s, m) => s + m.fasesTotal, 0),
    mundosCompletados: lista.filter((m) => m.completado).length,
    mundosTotal: lista.length,
  };
  return { niveles, mundos, totales };
}

/** Agrupa filas de varios usuarios por user_id. */
export function agruparFilasPorUsuario(filas) {
  const mapa = new Map();
  (filas || []).forEach((f) => {
    if (!mapa.has(f.user_id)) mapa.set(f.user_id, []);
    mapa.get(f.user_id).push(f);
  });
  return mapa;
}

/** Cuenta cuántos errores hay de cada código -> [{codigo, total}] ordenado. */
export function contarErrores(filas, limite = 5) {
  const cuenta = {};
  (filas || []).forEach((f) => {
    const c = f.codigo_error;
    if (c) cuenta[c] = (cuenta[c] || 0) + 1;
  });
  return Object.entries(cuenta)
    .map(([codigo, total]) => ({ codigo, total }))
    .sort((a, b) => b.total - a.total || a.codigo.localeCompare(b.codigo))
    .slice(0, limite);
}

// El texto de `resultado` depende del tipo de fallo (prefijo del código CQL).
const RESULTADO_POR_PREFIJO = {
  LEX: "error_lexico",
  SYN: "error_sintaxis",
  SEM: "error_semantico",
  RUN: "error_ejecucion",
};

export function resultadoDeError(codigoError) {
  const prefijo = String(codigoError || "").split("_")[0];
  return RESULTADO_POR_PREFIJO[prefijo] || "error_inesperado";
}

export const RESULTADO_EXITO = "exito";
export const RESULTADO_OBJETIVO_NO_ALCANZADO = "objetivo_no_alcanzado";
