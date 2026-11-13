// requisitos.js
// Lista de requisitos de una fase LIBRE-ESTRUCTURAL (como el proyecto libre del Mundo 6) para que la escena los muestre uno por uno.
// Se deduce de la propia validación del nivel (min_lineas + requiere.construcciones + requiere.algunaVariable), así que el
// nivel y la escena nunca se contradicen.

import { crearAyudas } from "./validaciones.js";

/**
 * @returns {{id:string, ok:boolean, detalle?:string}[]}  vacío si la fase no tiene requisitos de estructura
 */
export function listarRequisitos(fase, codigo, ejecutoSinErrores = true) {
  const v = fase?.validacion;
  if (!v) return [];
  const req = v.requiere || {};
  const min = (v.condiciones || []).find((c) => c.tipo === "min_lineas");
  const construcciones = req.construcciones || [];
  if (!min && !construcciones.length && !req.algunaVariable) return [];
  const h = crearAyudas({ codigo });
  const items = [];
  if (min) items.push({ id: "lineas", ok: h.lineasDeCodigo >= min.minimo, detalle: `${h.lineasDeCodigo}/${min.minimo}` });
  construcciones.forEach((c) => items.push({ id: c, ok: h.tiene(c) }));
  if (req.algunaVariable) items.push({ id: "variable", ok: h.tieneAlgunaVariable() });
  items.push({ id: "ejecucion", ok: ejecutoSinErrores });
  return items;
}
