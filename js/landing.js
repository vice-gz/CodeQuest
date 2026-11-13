// landing.js
// Página de inicio: contenido de mundos con ilustraciones SVG, temas y año del pie.
// El acceso (login / registro) vive en auth.html.

import { escaparHtml } from "./util.js";
import { MUNDOS_INFO } from "./game/mundosInfo.js";
import { paletaDe } from "./game/paletas.js";
import { ILUSTRACIONES } from "./ui/ilustraciones.js";
import { iniciarNavInicio } from "./ui/menuUsuario.js";
import { supabase, configuracionValida } from "./supabase.js";
import { obtenerPerfil, cerrarSesion } from "./auth.js";

// Mundos 1 a 6 jugables (datos en game/mundosInfo.js).
const MUNDOS_ACTIVOS = new Set([1, 2, 3, 4, 5]);

document.getElementById("anio").textContent = String(new Date().getFullYear());
document.getElementById("rejilla-mundos").innerHTML = MUNDOS_INFO.map((m) => {
  const activo = MUNDOS_ACTIVOS.has(m.id);
  const p = paletaDe(m.id);
  const temas = (m.aprenderas || [])
    .slice(0, 3)
    .map((t) => `<span class="mundo-chip-landing">${escaparHtml(t)}</span>`)
    .join("");
  return `
  <article class="mundo-tarjeta ${activo ? "mundo-activo" : "mundo-bloqueado"}" style="--mundo-acento:${p.acento};--mundo-acento-2:${p.acento2};--mundo-glow:${p.glow}">
    <div class="mundo-ilustracion-landing" aria-hidden="true">${ILUSTRACIONES[m.id] || ""}</div>
    <div class="mundo-tarjeta-cuerpo">
      <div class="mundo-tarjeta-top">
        <span class="mundo-numero">Mundo ${m.id} · ${escaparHtml(m.lugar)}</span>
        <span class="etiqueta-estado ${activo ? "etiqueta-ok" : ""}">${activo ? "▶ Disponible" : "Próximamente"}</span>
      </div>
      <h3>${escaparHtml(m.nombre)}</h3>
      <p>${escaparHtml(m.resumen)}</p>
      <div class="mundo-chips-landing">${temas}</div>
    </div>
  </article>`;
}).join("");

// Sesión: «Iniciar sesión» para invitados; «Hola, nombre» con su menú para quien ya entró.
iniciarNavInicio({
  obtenerSesion: async () => {
    if (!configuracionValida) return null;
    const { data } = await supabase.auth.getSession();
    return data?.session ?? null;
  },
  obtenerPerfil,
  cerrarSesion, // supabase.auth.signOut() y vuelve a index.html: se recarga con el estado de invitado
});
