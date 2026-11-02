// nav.js
// Barra de navegación reutilizable. Se genera según el rol. En pantallas
// estrechas los enlaces se colapsan en un menú hamburguesa.

import { obtenerPerfil, cerrarSesion } from "./auth.js";
import { escaparHtml, esRolAdmin, ETIQUETA_ROL } from "./util.js";

export async function renderizarNav(contenedorId = "nav", perfilDado = null) {
  const nav = document.getElementById(contenedorId);
  if (!nav) return;
  const perfil = perfilDado || (await obtenerPerfil());
  if (!perfil) return;

  const actual = window.location.pathname.split("/").pop() || "index.html";
  const enSandbox = new URLSearchParams(window.location.search).get("modo") === "sandbox";
  // Jugar y Laboratorio Libre comparten página: se distinguen por ?modo=sandbox.
  const esActual = (href) =>
    href.includes("modo=sandbox")
      ? actual === "juego.html" && enSandbox
      : href === "mundos.html"
        ? (actual === "mundos.html" || actual === "juego.html") && !enSandbox
        : actual === href;
  const enlace = (href, texto) =>
    `<a href="${href}"${esActual(href) ? ' aria-current="page"' : ""}>${texto}</a>`;

  // admin y super_root solo ven el panel; el resto ve su menú de juego.
  let enlaces;
  if (esRolAdmin(perfil.rol)) {
    enlaces = enlace("admin.html", "Panel de admin");
  } else {
    enlaces = enlace("mundos.html", "Mapa de mundos") + enlace("juego.html?modo=sandbox", "Laboratorio Libre") + enlace("conceptos.html", "Conceptos");
    if (perfil.rol === "profesor") enlaces += enlace("profesor.html", "Mis clases");
    enlaces += enlace("perfil.html", "Mi perfil");
  }

  nav.classList.add("nav-principal");
  nav.innerHTML = `
    <a class="nav-logo" href="${esRolAdmin(perfil.rol) ? "admin.html" : "mundos.html"}"><span aria-hidden="true">◆</span> CodeQuest</a>
    <button class="nav-hamburguesa" id="nav-hamburguesa" type="button" aria-expanded="false" aria-controls="nav-menu" aria-label="Abrir menú">☰</button>
    <div class="nav-menu" id="nav-menu">
      <div class="nav-enlaces">${enlaces}</div>
      <div class="nav-usuario">
        <span class="nav-nombre" title="${escaparHtml(perfil.email || "")}">${escaparHtml(perfil.nombre)}</span>
        <span class="etiqueta-estado">${escaparHtml(ETIQUETA_ROL[perfil.rol] || perfil.rol)}</span>
        <button class="boton boton-secundario boton-chico" id="btn-cerrar-sesion" type="button">Cerrar sesión</button>
      </div>
    </div>
  `;

  const hamburguesa = nav.querySelector("#nav-hamburguesa");
  const fijarMenu = (abierto) => {
    nav.classList.toggle("nav-abierto", abierto);
    hamburguesa.setAttribute("aria-expanded", String(abierto));
    hamburguesa.setAttribute("aria-label", abierto ? "Cerrar menú" : "Abrir menú");
    hamburguesa.textContent = abierto ? "✕" : "☰";
  };
  hamburguesa.addEventListener("click", () => fijarMenu(!nav.classList.contains("nav-abierto")));
  // Se cierra con Escape, al tocar fuera del menú (el fondo oscuro) o al elegir un enlace.
  document.addEventListener("keydown", (e) => e.key === "Escape" && fijarMenu(false));
  nav.addEventListener("click", (e) => {
    if (e.target === nav || e.target.closest(".nav-enlaces a")) fijarMenu(false);
  });
  document.addEventListener("click", (e) => {
    if (nav.classList.contains("nav-abierto") && !nav.contains(e.target)) fijarMenu(false);
  });
  nav.querySelector("#btn-cerrar-sesion").addEventListener("click", cerrarSesion);
}
