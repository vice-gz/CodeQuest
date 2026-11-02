// mundos.js
// Mapa de mundos: tarjetas del 1 al 6 con ilustración, progreso del estudiante
// (estrellas y niveles completados) y estado (bloqueado, disponible o
// completado). El estado se dice con icono y texto, no solo con color.
// Un mundo se abre cuando se completan TODOS los niveles del anterior.

import { protegerPagina } from "./auth.js";
import { renderizarNav } from "./nav.js";
import { catalogo, MAX_ESTRELLAS, TOTAL_NIVELES } from "./game/catalogo.js";
import { MUNDOS_INFO } from "./game/mundosInfo.js";
import { estadoDelMundo } from "./game/desbloqueo.js";
import { paletaDe } from "./game/paletas.js";
import { ILUSTRACIONES } from "./ui/ilustraciones.js";
import { calcularResumen } from "./persistence/progreso.js";
import { cargarFases, cargarJugador } from "./datos.js";
import { abrirGlosario } from "./ui/conceptos.js";
import { escaparHtml, esRolAdmin } from "./util.js";

const $ = (id) => document.getElementById(id);

const ETIQUETAS = {
  completado: { icono: "✔", texto: "Completado" },
  disponible: { icono: "▶", texto: "Disponible" },
  bloqueado: { icono: "🔒", texto: "Bloqueado" },
  proximamente: { icono: "🔒", texto: "Próximamente" },
};

function tarjeta(info, resumen, estado, { demo, esActual }) {
  const p = paletaDe(info.id);
  const m = resumen.mundos[info.id];
  const hayNiveles = Boolean(catalogo.mundos[info.id]);
  const e = ETIQUETAS[estado];

  const progreso = hayNiveles
    ? `<div class="mundo-barra" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${m.porcentaje}" aria-label="Progreso del mundo ${info.id}"><span style="width:${m.porcentaje}%"></span></div>
       <p class="mundo-cifras"><span><b class="estrella">★</b> ${m.estrellas}/${m.estrellasMax}</span><span>${m.nivelesCompletados}/${m.nivelesTotal} niveles</span></p>`
    : '<p class="mundo-cifras"><span>Aún sin niveles</span></p>';

  let requisito = "";
  if (estado === "bloqueado") {
    const previo = resumen.mundos[info.id - 1];
    requisito = `<p class="mundo-requisito">Completa los ${previo.nivelesTotal} niveles del Mundo ${info.id - 1} (${previo.nivelesCompletados}/${previo.nivelesTotal}) para desbloquearlo.</p>`;
  } else if (estado === "proximamente") {
    requisito = '<p class="mundo-requisito">Este mundo llegará en un próximo avance.</p>';
  }

  const accion =
    estado === "disponible" || estado === "completado"
      ? `<a class="boton boton-primario mundo-entrar" href="juego.html?mundo=${info.id}${demo ? "&demo=true" : ""}">${estado === "completado" ? "Repasar" : "Entrar"}</a>`
      : `<button class="boton boton-secundario mundo-entrar" type="button" disabled aria-disabled="true">${e.icono} ${e.texto}</button>`;

  return `<article class="mundo-card estado-${estado}${esActual ? " mundo-actual" : ""}" style="--mundo-acento:${p.acento};--mundo-acento-2:${p.acento2};--mundo-glow:${p.glow}">
    <div class="mundo-ilustracion" aria-hidden="false">${ILUSTRACIONES[info.id]}</div>
    <div class="mundo-cuerpo">
      <div class="mundo-cabecera">
        <span class="mundo-numero">Mundo ${info.id}</span>
        <span class="mundo-estado"><span aria-hidden="true">${e.icono}</span> ${e.texto}</span>
      </div>
      <h2>${escaparHtml(info.nombre)}</h2>
      <p class="mundo-lugar">${escaparHtml(info.lugar)}</p>
      <p class="mundo-resumen">${escaparHtml(info.resumen)}</p>
      <ul class="mundo-temas">${info.aprenderas.map((t) => `<li>${escaparHtml(t)}</li>`).join("")}</ul>
      ${progreso}
      ${requisito}
      ${esActual ? '<p class="mundo-aqui">📍 Aquí vas</p>' : ""}
      ${accion}
    </div>
  </article>`;
}

async function iniciar() {
  const perfil = await protegerPagina();
  if (!perfil) return;

  const params = new URLSearchParams(window.location.search);
  const demo = params.get("demo") === "true" && esRolAdmin(perfil.rol);
  if (esRolAdmin(perfil.rol) && !demo) {
    window.location.href = "admin.html";
    return;
  }
  await renderizarNav("nav", perfil);
  $("mapa-demo").classList.toggle("oculto", !demo);

  let filas = [];
  let nivelActual = 1;
  if (!demo) {
    try {
      const [fases, jugador] = await Promise.all([cargarFases(perfil.user_id), cargarJugador(perfil.user_id)]);
      filas = fases;
      nivelActual = Number(jugador?.nivel_actual) || 1;
    } catch (e) {
      console.error(e);
      const caja = $("mapa-error");
      caja.textContent = "No se pudo cargar tu progreso. Se muestra el mapa sin avances; revisa tu conexión.";
      caja.classList.remove("oculto");
    }
  }

  const resumen = calcularResumen(filas, catalogo);
  const mundoActual = catalogo.niveles[nivelActual]?.mundo ?? 1;
  const t = resumen.totales;
  $("mapa-resumen").textContent = demo
    ? "Modo demo: puedes entrar a cualquier mundo disponible."
    : `★ ${t.estrellas} de ${MAX_ESTRELLAS} estrellas · ${t.nivelesCompletados} de ${TOTAL_NIVELES} niveles completados`;

  // El glosario solo enseña lo de los mundos que ya están abiertos.
  const abierto = (id) => ["disponible", "completado"].includes(estadoDelMundo(id, catalogo, (m) => resumen.mundos[m]?.completado === true, demo));
  const mundoMaximo = Math.max(1, ...Object.keys(catalogo.mundos).map(Number).filter(abierto));
  $("btn-conceptos").addEventListener("click", () => abrirGlosario(mundoMaximo));

  $("mapa-rejilla").innerHTML = MUNDOS_INFO.map((info) => {
    const estado = estadoDelMundo(info.id, catalogo, (id) => resumen.mundos[id]?.completado === true, demo);
    return tarjeta(info, resumen, estado, {
      demo,
      esActual: !demo && estado === "disponible" && info.id === mundoActual && resumen.totales.nivelesCompletados > 0,
    });
  }).join("");
}

iniciar();
