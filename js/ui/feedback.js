// feedback.js
// Retroalimentación educativa (Documento 1, sección 9; Documento 3,
// sección 6). Nunca muestra solo "Error de sintaxis": siempre incluye
// mensaje técnico, contexto educativo y una sugerencia.
//
// Cambio respecto a la v1: ya no existe un modal que tape el escenario.
// Al completar una fase o un nivel aparecen botones inline dentro de este
// mismo panel (prompt de cambios, sección 5).

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
    this.container.innerHTML = `<p class="feedback-texto">${mensaje}</p>`;
  }

  mostrarError(error) {
    this.limpiar();
    this.container.classList.add("feedback-error");
    const linea = error.linea ? `<span class="feedback-linea">Línea ${error.linea}</span>` : "";
    this.container.innerHTML = `
      <div class="feedback-encabezado">
        <span class="feedback-icono">!</span>
        <strong>${error.mensaje}</strong>
        ${linea}
      </div>
      ${error.educativo ? `<p class="feedback-texto">${error.educativo}</p>` : ""}
      ${error.sugerencia ? `<p class="feedback-sugerencia">💡 ${error.sugerencia}</p>` : ""}
      <p class="feedback-codigo">${error.codigo}</p>
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
      <p class="feedback-texto">${mensaje}</p>
    `;
  }

  mostrarPista(texto, numero) {
    this.limpiar();
    this.container.classList.add("feedback-pista");
    this.container.innerHTML = `
      <div class="feedback-encabezado">
        <span class="feedback-icono">?</span>
        <strong>Pista ${numero}</strong>
      </div>
      <p class="feedback-texto">${texto}</p>
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
      <p class="feedback-texto">${mensaje}</p>
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
      <p class="feedback-texto">${mensaje}</p>
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
      boton.addEventListener("click", b.onClick);
      contenedor.appendChild(boton);
    });
    this.container.appendChild(contenedor);
  }
}
