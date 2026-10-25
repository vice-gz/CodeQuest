// vistaProgreso.js
// Componentes de visualización del progreso. Los usan perfil.html y el
// detalle de usuario del panel de admin (mismo formato en ambos).
// Todo valor que viene de la base de datos pasa por escaparHtml().

import { escaparHtml, formatearFecha } from "../util.js";
import { nombreError } from "./erroresCatalogo.js";

const estrellasTexto = (n, total = 3) => "★".repeat(n) + "☆".repeat(Math.max(total - n, 0));

export function etiquetaResultado(resultado) {
  const r = String(resultado || "");
  if (r === "exito") return '<span class="etiqueta-estado etiqueta-ok">Éxito</span>';
  if (r === "objetivo_no_alcanzado") return '<span class="etiqueta-estado etiqueta-aviso">Objetivo no alcanzado</span>';
  if (r.startsWith("error")) return '<span class="etiqueta-estado etiqueta-error">Error</span>';
  return `<span class="etiqueta-estado">${escaparHtml(r || "—")}</span>`;
}

function tarjetaDato(titulo, valor, detalle = "") {
  return `<div class="dato-tarjeta">
    <span class="dato-titulo">${escaparHtml(titulo)}</span>
    <span class="dato-valor">${valor}</span>
    ${detalle ? `<span class="dato-detalle">${escaparHtml(detalle)}</span>` : ""}
  </div>`;
}

export function renderResumen(contenedor, resumen, jugador) {
  const t = resumen.totales;
  contenedor.innerHTML = `<div class="datos-rejilla">
    ${tarjetaDato("Mundo actual", escaparHtml(jugador?.mundo_actual ?? 1))}
    ${tarjetaDato("Nivel actual", escaparHtml(jugador?.nivel_actual ?? 1))}
    ${tarjetaDato("Experiencia", escaparHtml(jugador?.experiencia ?? 0), "puntos")}
    ${tarjetaDato("Estrellas", `<span class="texto-ambar">★</span> ${t.estrellas}`, `de ${t.estrellasMax}`)}
    ${tarjetaDato("Mundos completados", `${t.mundosCompletados}`, `de ${t.mundosTotal}`)}
    ${tarjetaDato("Niveles completados", `${t.nivelesCompletados}`, `de ${t.nivelesTotal}`)}
    ${tarjetaDato("Fases completadas", `${t.fasesCompletadas}`, `de ${t.fasesTotal}`)}
  </div>`;
}

export function renderMundos(contenedor, resumen) {
  contenedor.innerHTML = Object.values(resumen.mundos)
    .map(
      (m) => `<article class="mundo-progreso">
      <header>
        <h3>Mundo ${m.id} · ${escaparHtml(m.nombre)}</h3>
        <span class="etiqueta-estado ${m.completado ? "etiqueta-ok" : ""}">${m.completado ? "Completado" : `${m.porcentaje}%`}</span>
      </header>
      <div class="barra-progreso" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${m.porcentaje}" aria-label="Progreso del mundo ${m.id}">
        <span style="width:${m.porcentaje}%"></span>
      </div>
      <p class="mundo-progreso-datos">
        <span><span class="texto-ambar">★</span> ${m.estrellas}/${m.estrellasMax}</span>
        <span>${m.nivelesCompletados}/${m.nivelesTotal} niveles</span>
        <span>${m.fasesCompletadas}/${m.fasesTotal} fases</span>
      </p>
    </article>`
    )
    .join("");
}

export function renderTablaNiveles(contenedor, resumen) {
  const filas = Object.values(resumen.niveles)
    .sort((a, b) => a.id - b.id)
    .map((n) => {
      const estado = n.completado
        ? '<span class="etiqueta-estado etiqueta-ok">Completado</span>'
        : n.fasesCompletadas > 0
          ? '<span class="etiqueta-estado etiqueta-aviso">En curso</span>'
          : '<span class="etiqueta-estado">Sin empezar</span>';
      return `<tr>
        <td class="mono">${n.id}</td>
        <td>${escaparHtml(n.nombre)}</td>
        <td>M${n.mundo}</td>
        <td>${estado}</td>
        <td class="texto-ambar" aria-label="${n.estrellas} de 3 estrellas">${estrellasTexto(n.estrellas)}</td>
        <td>${n.fasesCompletadas}/${n.fasesTotal}</td>
        <td>${n.intentos}</td>
      </tr>`;
    })
    .join("");

  contenedor.innerHTML = `<div class="tabla-envoltura"><table class="tabla">
    <thead><tr><th>Nivel</th><th>Nombre</th><th>Mundo</th><th>Estado</th><th>Estrellas</th><th>Fases</th><th>Intentos</th></tr></thead>
    <tbody>${filas}</tbody></table></div>`;
}

/** Gráfico de barras horizontales hecho solo con HTML/CSS. */
export function renderBarras(titulo, items, { max = null, vacio = "Todavía no hay datos." } = {}) {
  const tope = max ?? Math.max(1, ...items.map((i) => i.valor));
  const cuerpo = items.length
    ? items
        .map(
          (i) => `<li>
        <span class="barra-etiqueta" title="${escaparHtml(i.etiqueta)}">${escaparHtml(i.etiqueta)}</span>
        <span class="barra-pista"><span class="barra-relleno" style="width:${Math.min(100, (i.valor / tope) * 100)}%"></span></span>
        <span class="barra-valor">${escaparHtml(i.texto ?? i.valor)}</span>
      </li>`
        )
        .join("")
    : `<li class="barra-vacio">${escaparHtml(vacio)}</li>`;
  return `<section class="grafico"><h3>${escaparHtml(titulo)}</h3><ul class="barras">${cuerpo}</ul></section>`;
}

export function renderGraficos(contenedor, resumen, topErrores) {
  const mundos = Object.values(resumen.mundos);
  contenedor.innerHTML =
    renderBarras(
      "Estrellas por mundo",
      mundos.map((m) => ({ etiqueta: `Mundo ${m.id}`, valor: m.estrellas, texto: `${m.estrellas}/${m.estrellasMax}` })),
      { max: Math.max(...mundos.map((m) => m.estrellasMax)) }
    ) +
    renderBarras(
      "Fases completadas por mundo",
      mundos.map((m) => ({ etiqueta: `Mundo ${m.id}`, valor: m.fasesCompletadas, texto: `${m.fasesCompletadas}/${m.fasesTotal}` })),
      { max: Math.max(...mundos.map((m) => m.fasesTotal)) }
    ) +
    renderBarras(
      "Errores más comunes (top 5)",
      topErrores.map((e) => ({ etiqueta: nombreError(e.codigo), valor: e.total })),
      { vacio: "Sin errores registrados. ¡Buen trabajo!" }
    );
}

export function renderEjecuciones(contenedor, ejecuciones, { nombres = null, mostrarConcepto = false } = {}) {
  if (!ejecuciones.length) {
    contenedor.innerHTML = '<p class="texto-vacio">Todavía no hay ejecuciones registradas.</p>';
    return;
  }
  const filas = ejecuciones
    .map(
      (e) => `<tr>
      <td>${escaparHtml(formatearFecha(e.created_at))}</td>
      ${nombres ? `<td>${escaparHtml(nombres.get(e.user_id) || "—")}</td>` : ""}
      <td class="mono">${escaparHtml(e.mundo_id)}</td>
      <td class="mono">${escaparHtml(e.nivel_id)}</td>
      <td class="mono">${escaparHtml(e.fase_id)}</td>
      <td>${etiquetaResultado(e.resultado)}</td>
      <td class="mono">${e.codigo_error ? escaparHtml(e.codigo_error) : "—"}</td>
      ${mostrarConcepto ? `<td>${e.concepto_evaluado ? escaparHtml(String(e.concepto_evaluado).replace(/_/g, " ")) : "—"}</td>` : ""}
      <td class="mono">${e.tiempo_ms != null ? `${escaparHtml(e.tiempo_ms)} ms` : "—"}</td>
    </tr>`
    )
    .join("");
  contenedor.innerHTML = `<div class="tabla-envoltura"><table class="tabla">
    <thead><tr><th>Fecha</th>${nombres ? "<th>Usuario</th>" : ""}<th>Mundo</th><th>Nivel</th><th>Fase</th><th>Resultado</th><th>Código error</th>${mostrarConcepto ? "<th>Concepto</th>" : ""}<th>Tiempo</th></tr></thead>
    <tbody>${filas}</tbody></table></div>`;
}
