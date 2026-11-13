// lineasEscritas.js
// Cuenta las líneas de código que el estudiante ha escrito en las soluciones que el juego aceptó (para la pantalla final).
// Por cada fase se guarda el tamaño de la ÚLTIMA solución aceptada (repetir una fase no suma dos veces). Es un dato local
// del navegador: cuenta desde que existe este registro. Las líneas vacías y los comentarios no cuentan.

import { contarLineasDePrograma } from "./validaciones.js";

// Fases donde el estudiante escribe o edita código (en EXPLORAR, PREDECIR y ORDENAR no escribe un programa).
export const TIPOS_CON_CODIGO = ["ESCRIBIR", "RESOLVER", "MODIFICAR", "DEBUG", "LIBRE"];

const clave = (usuarioId) => `codequest:lineas:${usuarioId}`;

function almacenamiento(almacen) {
  if (almacen) return almacen;
  try {
    return typeof localStorage !== "undefined" ? localStorage : null;
  } catch {
    return null;
  }
}

function leerMapa(usuarioId, almacen) {
  try {
    const crudo = almacenamiento(almacen)?.getItem(clave(usuarioId));
    const mapa = crudo ? JSON.parse(crudo) : {};
    return mapa && typeof mapa === "object" && !Array.isArray(mapa) ? mapa : {};
  } catch {
    return {};
  }
}

export function registrarLineas(usuarioId, faseId, tipoFase, codigo, almacen = null) {
  if (!usuarioId || !faseId || !TIPOS_CON_CODIGO.includes(tipoFase)) return;
  const a = almacenamiento(almacen);
  if (!a) return;
  try {
    const mapa = leerMapa(usuarioId, a);
    mapa[faseId] = contarLineasDePrograma(codigo);
    a.setItem(clave(usuarioId), JSON.stringify(mapa));
  } catch {
    /* sin almacenamiento: el total simplemente no crece */
  }
}

export function totalLineasEscritas(usuarioId, almacen = null) {
  return Object.values(leerMapa(usuarioId, almacen)).reduce((t, n) => t + (Number.isFinite(n) ? n : 0), 0);
}
