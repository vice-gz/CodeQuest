// transicionMundo.js
// Pantalla narrativa que se muestra al terminar el último nivel de un mundo
// (en lugar del botón "Siguiente nivel"). Cubre toda el área del juego.
// El texto del relato sale del JSON del nivel (narrativaSiguienteMundo) y se
// inserta con textContent, nunca como HTML.

/**
 * @param {object} o
 * @param {number} o.mundoCompletado
 * @param {string} o.nombreMundo
 * @param {number} o.estrellas        estrellas ganadas en el mundo
 * @param {number} o.estrellasMax
 * @param {string} o.narrativa
 * @param {string|null} o.nombreSiguiente  null si no hay mundo siguiente todavía
 * @param {string|null} [o.enlacePerfil]   URL para el botón secundario (opcional)
 * @returns {Promise<"continuar"|"cerrar">}
 */
export function mostrarTransicionMundo({
  mundoCompletado,
  nombreMundo,
  estrellas,
  estrellasMax,
  narrativa,
  nombreSiguiente,
  enlacePerfil = null,
}) {
  return new Promise((resolve) => {
    document.querySelector(".transicion-mundo")?.remove();

    const capa = document.createElement("div");
    capa.className = "transicion-mundo";
    capa.setAttribute("role", "dialog");
    capa.setAttribute("aria-modal", "true");
    capa.setAttribute("aria-labelledby", "transicion-titulo");

    const caja = document.createElement("div");
    caja.className = "transicion-caja";

    const etiqueta = document.createElement("p");
    etiqueta.className = "transicion-etiqueta";
    etiqueta.textContent = `Mundo ${mundoCompletado} completado`;

    const titulo = document.createElement("h2");
    titulo.id = "transicion-titulo";
    titulo.textContent = nombreMundo;

    const resumen = document.createElement("p");
    resumen.className = "transicion-estrellas";
    resumen.textContent = `★ ${estrellas} / ${estrellasMax} estrellas en este mundo`;

    const relato = document.createElement("p");
    relato.className = "transicion-relato";
    relato.textContent = narrativa;

    const acciones = document.createElement("div");
    acciones.className = "transicion-acciones";

    const principal = document.createElement("button");
    principal.type = "button";
    principal.className = "boton boton-primario transicion-boton";
    principal.textContent = nombreSiguiente ? "Continuar al siguiente mundo" : "Entendido";
    acciones.appendChild(principal);

    if (!nombreSiguiente && enlacePerfil) {
      const perfil = document.createElement("a");
      perfil.className = "boton boton-secundario transicion-boton";
      perfil.href = enlacePerfil;
      perfil.textContent = "Ver mi perfil";
      acciones.appendChild(perfil);
    }

    caja.append(etiqueta, titulo, resumen, relato, acciones);
    capa.appendChild(caja);
    document.body.appendChild(capa);
    document.body.classList.add("sin-scroll");

    principal.addEventListener("click", () => {
      capa.remove();
      document.body.classList.remove("sin-scroll");
      resolve(nombreSiguiente ? "continuar" : "cerrar");
    });
    principal.focus();
  });
}
