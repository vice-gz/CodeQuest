// codeEditor.js
// Editor de código sencillo: textarea + numeración de líneas.
// Autocompletado avanzado queda fuera de alcance del Avance 1
// (Documento 1, sección 6.3 y Documento 2, prompt sección 14).

export class CodeEditor {
  constructor({ textareaEl, lineNumbersEl }) {
    this.textarea = textareaEl;
    this.lineNumbers = lineNumbersEl;
    this.textarea.addEventListener("input", () => this.actualizarNumeros());
    this.textarea.addEventListener("scroll", () => this.sincronizarScroll());
    this.actualizarNumeros();
  }

  obtenerCodigo() {
    return this.textarea.value;
  }

  establecerCodigo(codigo) {
    this.textarea.value = codigo;
    this.actualizarNumeros();
  }

  actualizarNumeros() {
    const lineas = this.textarea.value.split("\n").length;
    let html = "";
    for (let i = 1; i <= lineas; i++) {
      html += `<span>${i}</span>`;
    }
    this.lineNumbers.innerHTML = html;
    this.sincronizarScroll();
  }

  sincronizarScroll() {
    this.lineNumbers.scrollTop = this.textarea.scrollTop;
  }

  marcarLineaError(numeroLinea) {
    this.limpiarMarcaError();
    if (!numeroLinea) return;
    const spans = this.lineNumbers.querySelectorAll("span");
    const span = spans[numeroLinea - 1];
    if (span) span.classList.add("linea-error");
  }

  limpiarMarcaError() {
    this.lineNumbers.querySelectorAll("span.linea-error").forEach((s) => {
      s.classList.remove("linea-error");
    });
  }

  deshabilitar(deshabilitado) {
    this.textarea.disabled = deshabilitado;
  }
}
