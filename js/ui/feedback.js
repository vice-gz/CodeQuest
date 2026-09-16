// feedback.js
// Retroalimentación educativa (Documento 1, sección 9; Documento 3,
// sección 6). Nunca muestra solo "Error de sintaxis": siempre incluye
// mensaje técnico, contexto educativo y una sugerencia.
//
// Cambio respecto a la v1: ya no existe un modal que tape el escenario.
// Al completar una fase o un nivel aparecen botones inline dentro de este
// mismo panel (prompt de cambios, sección 5).

// Todo texto que venga de un JSON de nivel o de un mensaje de error pasa
// por aquí antes de insertarse como HTML, para que un texto con < o >
// no pueda inyectar marcado en el panel.
function escapeHtml(texto) {
  const div = document.createElement("div");
  div.textContent = texto == null ? "" : String(texto);
  return div.innerHTML;
}

export class Feedback {
  constructor(container) {
    this.container = container;
  }

  limpiar() {
    this.container.innerHTML = "";
    this.container.className = "feedback-panel";
  }

  mostrarInicial(mensaje) {
    this.limpiar();
    this.container.classList.add("feedback-neutral");
    this.container.innerHTML = `<p class="feedback-texto">${escapeHtml(mensaje)}</p>`;
  }

  mostrarError(error) {
    this.limpiar();
    this.container.classList.add("feedback-error");
    const linea = error.linea ? `<span class="feedback-linea">Línea ${escapeHtml(error.linea)}</span>` : "";
    this.container.innerHTML = `
      <div class="feedback-encabezado">
        <span class="feedback-icono">!</span>
        <strong>${escapeHtml(error.mensaje)}</strong>
        ${linea}
      </div>
      ${error.educativo ? `<p class="feedback-texto">${escapeHtml(error.educativo)}</p>` : ""}
      ${error.sugerencia ? `<p class="feedback-sugerencia">💡 ${escapeHtml(error.sugerencia)}</p>` : ""}
      <p class="feedback-codigo">${escapeHtml(error.codigo)}</p>
    `;
  }

  mostrarObjetivoNoAlcanzado(mensaje) {
    this.limpiar();
    this.container.classList.add("feedback-error");
    this.container.innerHTML = `
      <div class="feedback-encabezado">
        <span class="feedback-icono">!</span>
        <strong>Todavía no</strong>
      </div>
      <p class="feedback-texto">${escapeHtml(mensaje)}</p>
    `;
  }

  mostrarPista(texto, numero) {
    this.limpiar();
    this.container.classList.add("feedback-pista");
    this.container.innerHTML = `
      <div class="feedback-encabezado">
        <span class="feedback-icono">?</span>
        <strong>Pista ${escapeHtml(numero)}</strong>
      </div>
      <p class="feedback-texto">${escapeHtml(texto)}</p>
    `;
  }

  /**
   * @param {{mensaje:string, botones:{texto:string, tipo?:string, onClick:Function}[]}} opciones
   */
  mostrarResultadoFase({ mensaje, botones = [] }) {
    this.limpiar();
    this.container.classList.add("feedback-exito");
    this.container.innerHTML = `
      <div class="feedback-encabezado">
        <span class="feedback-icono">✓</span>
        <strong>Fase completada</strong>
      </div>
      <p class="feedback-texto">${escapeHtml(mensaje)}</p>
    `;
    this.renderBotones(botones, "feedback-botones");
  }

  /**
   * @param {{estrellas:number, mensaje:string, botones:{texto:string, tipo?:string, onClick:Function}[]}} opciones
   */
  mostrarResultadoNivel({ estrellas, mensaje, botones = [] }) {
    this.limpiar();
    this.container.classList.add("feedback-exito", "feedback-nivel-completo");
    const estrellasHtml = Array.from({ length: 3 })
      .map((_, i) => `<span class="estrella-grande${i < estrellas ? " estrella-activa" : ""}">★</span>`)
      .join("");
    this.container.innerHTML = `
      <div class="feedback-encabezado">
        <span class="feedback-icono">✓</span>
        <strong>¡Nivel completado!</strong>
      </div>
      <div class="estrellas-grandes">${estrellasHtml}</div>
      <p class="feedback-texto">${escapeHtml(mensaje)}</p>
    `;
    this.renderBotones(botones, "feedback-botones feedback-botones-grandes");
  }

  renderBotones(botones, className) {
    if (botones.length === 0) return;
    const contenedor = document.createElement("div");
    contenedor.className = className;
    botones.forEach((b) => {
      const boton = document.createElement("button");
      boton.type = "button";
      boton.className = `boton boton-${b.tipo || "secundario"}`;
      boton.textContent = b.texto;
      // El handler puede ser asíncrono (cargar la siguiente fase). Se
      // deshabilita mientras corre para que un doble clic no avance dos veces.
      boton.addEventListener("click", async () => {
        boton.disabled = true;
        try {
          await b.onClick();
        } finally {
          boton.disabled = false;
        }
      });
      contenedor.appendChild(boton);
    });
    this.container.appendChild(contenedor);
  }
}
