// pantallaFinal.js
// Pantalla especial a pantalla completa al terminar el último nivel del último mundo (el proyecto libre del Mundo 6):
// «¡Felicidades, has completado CodeQuest!», con las estrellas totales y las líneas de código escritas.
// Todo el texto se inserta con textContent (nada de HTML con datos del usuario).

export const MENSAJE_FINAL = "¡Felicidades, has completado CodeQuest!";
export const SUBMENSAJE_FINAL = "Ahora piensas como un programador";

/**
 * @param {object} o
 * @param {number} o.estrellas       estrellas totales ganadas
 * @param {number} o.estrellasMax
 * @param {number} o.lineas          líneas de código escritas
 * @param {string|null} [o.nombre]
 * @param {string|null} [o.urlMapa]
 * @param {string|null} [o.urlPerfil]
 * @returns {Promise<"cerrar">} se resuelve cuando la persona elige «Seguir practicando»
 */
export function mostrarPantallaFinal({ estrellas, estrellasMax, lineas, nombre = null, urlMapa = "mundos.html", urlPerfil = "perfil.html" }) {
  return new Promise((resolve) => {
    document.querySelector(".pantalla-final")?.remove();

    const capa = document.createElement("div");
    capa.className = "pantalla-final";
    capa.setAttribute("role", "dialog");
    capa.setAttribute("aria-modal", "true");
    capa.setAttribute("aria-labelledby", "final-titulo");

    const confeti = document.createElement("div");
    confeti.className = "final-confeti";
    confeti.setAttribute("aria-hidden", "true");
    for (let i = 0; i < 24; i++) {
      const pieza = document.createElement("span");
      pieza.style.setProperty("--x", `${(i * 41) % 100}%`);
      pieza.style.setProperty("--retardo", `${(i % 8) * 0.25}s`);
      pieza.style.setProperty("--color", ["#f472b6", "#5eead4", "#fbbf24", "#a78bfa", "#60a5fa"][i % 5]);
      confeti.appendChild(pieza);
    }

    const caja = document.createElement("div");
    caja.className = "final-caja";

    const trofeo = document.createElement("div");
    trofeo.className = "final-trofeo";
    trofeo.setAttribute("aria-hidden", "true");
    trofeo.textContent = "🏆";

    const titulo = document.createElement("h1");
    titulo.id = "final-titulo";
    titulo.textContent = MENSAJE_FINAL;

    const sub = document.createElement("p");
    sub.className = "final-sub";
    sub.textContent = nombre ? `${SUBMENSAJE_FINAL}, ${nombre}.` : `${SUBMENSAJE_FINAL}.`;

    const resumen = document.createElement("div");
    resumen.className = "final-resumen";
    const dato = (valor, etiqueta, id) => {
      const d = document.createElement("div");
      d.className = "final-dato";
      const v = document.createElement("strong");
      v.id = id;
      v.textContent = valor;
      const e = document.createElement("span");
      e.textContent = etiqueta;
      d.append(v, e);
      return d;
    };
    resumen.append(
      dato(`★ ${estrellas} / ${estrellasMax}`, "estrellas ganadas", "final-estrellas"),
      dato(String(lineas), lineas === 1 ? "línea de código escrita" : "líneas de código escritas", "final-lineas")
    );

    const acciones = document.createElement("div");
    acciones.className = "final-acciones";
    const mapa = document.createElement("a");
    mapa.className = "boton boton-primario boton-grande";
    mapa.href = urlMapa;
    mapa.textContent = "Volver al mapa";
    const seguir = document.createElement("button");
    seguir.type = "button";
    seguir.className = "boton boton-secundario boton-grande";
    seguir.textContent = "Seguir practicando";
    acciones.append(mapa, seguir);
    if (urlPerfil) {
      const perfil = document.createElement("a");
      perfil.className = "boton boton-secundario boton-grande";
      perfil.href = urlPerfil;
      perfil.textContent = "Ver mi perfil";
      acciones.appendChild(perfil);
    }

    caja.append(trofeo, titulo, sub, resumen, acciones);
    capa.append(confeti, caja);
    document.body.appendChild(capa);
    document.body.classList.add("sin-scroll");

    seguir.addEventListener("click", () => {
      capa.remove();
      document.body.classList.remove("sin-scroll");
      resolve("cerrar");
    });
    seguir.focus();
  });
}
