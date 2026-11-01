// landing.js
// Página de inicio: solo contenido (mundos y año del pie). El acceso
// (login / registro) vive en auth.html.

import { escaparHtml } from "./util.js";
import { MUNDOS_INFO } from "./game/mundosInfo.js";
import { paletaDe } from "./game/paletas.js";

// Mundos 1 a 4 jugables; el 5 y el 6 solo se anuncian (datos en game/mundosInfo.js).
const MUNDOS_ACTIVOS = new Set([1, 2, 3, 4]);

document.getElementById("anio").textContent = String(new Date().getFullYear());
document.getElementById("rejilla-mundos").innerHTML = MUNDOS_INFO.map((m) => {
  const activo = MUNDOS_ACTIVOS.has(m.id);
  return `
  <article class="mundo-tarjeta ${activo ? "mundo-activo" : "mundo-bloqueado"}" style="--mundo-acento:${paletaDe(m.id).acento}">
    <span class="mundo-numero">Mundo ${m.id} · ${escaparHtml(m.lugar)}</span>
    <h3>${escaparHtml(m.nombre)}</h3>
    <p>${escaparHtml(m.resumen)}</p>
    <span class="etiqueta-estado ${activo ? "etiqueta-ok" : ""}">${activo ? "Disponible" : "Próximamente"}</span>
  </article>`;
}).join("");
