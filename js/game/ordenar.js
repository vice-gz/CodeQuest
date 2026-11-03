// ordenar.js
// Lógica PURA del minijuego del Nivel 0 (diagramas de flujo): el alumno hace clic en las tarjetas
// en el orden correcto. Si una tarjeta no toca todavía, el robot choca y se empieza de nuevo.
// La usan juego.js y las pruebas.
//
// Una fase de tipo ORDENAR declara:
//   tarjetas:      [{ id, texto, forma?: "inicio"|"fin"|"paso", accion?: {tipo, ...} }]  (ya barajadas)
//   ordenCorrecto: [id, id, ...]                                                       (todas las tarjetas)

/** @returns {{ok:boolean, completo:boolean, esperado:string}} */
export function evaluarEleccion(ordenCorrecto, elegidos, id) {
  const esperado = ordenCorrecto[elegidos.length];
  const ok = id === esperado;
  return { ok, esperado, completo: ok && elegidos.length + 1 === ordenCorrecto.length };
}

/** Revisa que la definición de una fase ORDENAR sea coherente. Devuelve una lista de problemas (vacía = bien). */
export function problemasDeFaseOrdenar(fase) {
  const problemas = [];
  const ids = (fase.tarjetas || []).map((t) => t.id);
  if (new Set(ids).size !== ids.length) problemas.push("hay tarjetas con el mismo id");
  const orden = fase.ordenCorrecto || [];
  if (orden.length !== ids.length || orden.some((id) => !ids.includes(id)) || new Set(orden).size !== orden.length) {
    problemas.push("ordenCorrecto debe contener cada tarjeta exactamente una vez");
  }
  const t = (id) => (fase.tarjetas || []).find((x) => x.id === id);
  if (orden.length && t(orden[0])?.forma !== "inicio") problemas.push("la primera tarjeta del orden correcto debe ser «Inicio»");
  if (orden.length && t(orden.at(-1))?.forma !== "fin") problemas.push("la última tarjeta del orden correcto debe ser «Fin»");
  if (orden.length && ids.length > 1 && JSON.stringify(ids) === JSON.stringify(orden)) problemas.push("las tarjetas ya vienen en el orden correcto (deben venir barajadas)");
  return problemas;
}
