// catalogo.js
// Catálogo de mundos y niveles construido a partir de levels/**/*.json.
// Lo comparten el juego, el perfil y el panel de admin: es la única fuente
// que sabe cuántas fases tiene cada nivel (necesario para calcular niveles
// completados y estrellas a partir de las filas de progreso_fases).
// Vite empaqueta los JSON en tiempo de build (import.meta.glob), así que no
// hace falta copiar la carpeta levels/ al publicar.

import { construirCatalogo, ordinalDeNivel as ordinalEn, nivelPorOrdinal as nivelPorOrdinalEn, siguienteNivelId as siguienteEn } from "../persistence/progreso.js";

const modulos = import.meta.glob("../../levels/mundo*/level*.json", {
  eager: true,
  import: "default",
});

export const catalogo = construirCatalogo(Object.values(modulos));

export const NIVELES_POR_MUNDO = Object.fromEntries(
  Object.values(catalogo.mundos).map((m) => [m.id, m.niveles.length])
);
export const TOTAL_NIVELES = catalogo.totalNiveles;
export const MAX_ESTRELLAS = catalogo.maxEstrellas;

export function mundoDeNivel(id) {
  return catalogo.niveles[id]?.mundo ?? 1;
}

export function obtenerNivel(id) {
  return catalogo.niveles[id] || null;
}

/** Número de nivel dentro de su mundo, tal como lo ve el estudiante (el Nivel 0 es 0). */
export const ordinalDeNivel = (id) => ordinalEn(catalogo, id);
export const nivelPorOrdinal = (mundoId, ordinal) => nivelPorOrdinalEn(catalogo, mundoId, ordinal);
/** Id del nivel siguiente (del mismo mundo o el primero del mundo que sigue); null si no hay más. */
export const siguienteNivel = (id) => siguienteEn(catalogo, id);
/** Niveles que hay que superar para completar cada mundo (sin los de tutorial). */
export const REQUERIDOS_POR_MUNDO = Object.fromEntries(Object.values(catalogo.mundos).map((m) => [m.id, m.requeridos]));
