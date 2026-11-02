// exportarCsv.js
// Exportación de datos para la tesis (panel de admin → "Exportar a CSV").
// Funciones PURAS (sin DOM ni red) para poder probarlas con Node.
//
// Definiciones:
//   - "ejecución fallida" = cualquier ejecución cuyo resultado no sea "exito"
//     (errores de código y también "objetivo no alcanzado").
//   - "error más frecuente" = el código de error (SEM_001, SYN_006…) que más veces
//     aparece en las ejecuciones del alumno; si hay empate, el primero por orden
//     alfabético; vacío si nunca tuvo un error de código.

import { nombreError } from "./erroresCatalogo.js";

export const ENCABEZADOS = [
  "Nombre del alumno",
  "Email",
  "Rol",
  "Mundo actual",
  "Nivel actual",
  "Nivel (número global)",
  "Estrellas totales",
  "Niveles completados",
  "Fases completadas",
  "Experiencia",
  "Total de ejecuciones",
  "Total de errores",
  "Error más frecuente",
  "Error más frecuente (descripción)",
  "Fecha de registro",
  "Última actividad",
];

/**
 * Agrega filas de `ejecuciones` ({user_id, resultado, codigo_error}) por usuario.
 * @returns {Map<string, {totalEjecuciones:number, totalErrores:number, errorMasFrecuente:string|null}>}
 */
export function agregarErroresPorUsuario(filas) {
  const porUsuario = new Map();
  for (const f of filas || []) {
    if (!porUsuario.has(f.user_id)) porUsuario.set(f.user_id, { totalEjecuciones: 0, totalErrores: 0, codigos: {} });
    const u = porUsuario.get(f.user_id);
    u.totalEjecuciones += 1;
    if (String(f.resultado) !== "exito") u.totalErrores += 1;
    if (f.codigo_error) u.codigos[f.codigo_error] = (u.codigos[f.codigo_error] || 0) + 1;
  }
  const resultado = new Map();
  porUsuario.forEach((u, id) => {
    const top = Object.entries(u.codigos).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
    resultado.set(id, { totalEjecuciones: u.totalEjecuciones, totalErrores: u.totalErrores, errorMasFrecuente: top ? top[0] : null });
  });
  return resultado;
}

/** Convierte el resultado de la función SQL admin_errores_por_usuario() al mismo formato. */
export function erroresDesdeRpc(filas) {
  return new Map(
    (filas || []).map((r) => [
      r.usuario_id,
      { totalEjecuciones: Number(r.total_ejecuciones) || 0, totalErrores: Number(r.total_errores) || 0, errorMasFrecuente: r.error_mas_frecuente || null },
    ])
  );
}

// Excel ejecuta como fórmula las celdas que empiezan con = + - @ (inyección de fórmulas).
export function celdaCsv(valor) {
  let t = String(valor ?? "");
  if (/^[=+\-@\t\r]/.test(t)) t = `'${t}`;
  return `"${t.replace(/"/g, '""')}"`;
}

/**
 * @param {object} p
 * @param {Array} p.usuarios   [{id, nombre, email, rol, mundo, nivel, experiencia, fechaRegistro, ultimaActividad}]
 * @param {Map} p.resumenes    userId -> calcularResumen(...)
 * @param {Map} p.errores      userId -> {totalEjecuciones, totalErrores, errorMasFrecuente}
 * @param {object} p.catalogo
 * @returns {string} CSV con saltos de línea \r\n (sin BOM)
 */
export function construirCsv({ usuarios, resumenes, errores, catalogo, etiquetaRol = (r) => r }) {
  const filas = usuarios.map((u) => {
    const t = resumenes.get(u.id)?.totales;
    const e = errores.get(u.id) || { totalEjecuciones: 0, totalErrores: 0, errorMasFrecuente: null };
    const mundo = catalogo.mundos[u.mundo];
    const ordinal = mundo ? mundo.niveles.indexOf(u.nivel) + 1 : 0;
    return [
      u.nombre,
      u.email,
      etiquetaRol(u.rol),
      u.mundo,
      ordinal > 0 ? ordinal : u.nivel,
      u.nivel,
      t?.estrellas ?? 0,
      t?.nivelesCompletados ?? 0,
      t?.fasesCompletadas ?? 0,
      u.experiencia,
      e.totalEjecuciones,
      e.totalErrores,
      e.errorMasFrecuente ?? "",
      e.errorMasFrecuente ? nombreError(e.errorMasFrecuente).replace(`${e.errorMasFrecuente} · `, "") : "",
      u.fechaRegistro || "",
      u.ultimaActividad || "",
    ];
  });
  return [ENCABEZADOS, ...filas].map((f) => f.map(celdaCsv).join(",")).join("\r\n");
}
