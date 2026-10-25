// codeEditor.js
// Editor de código sencillo: textarea + numeración de líneas.
// Avance 2.3: Tab inserta 4 espacios (o indenta las líneas seleccionadas) y
// Shift+Tab desindenta. Accesibilidad: Esc suelta el foco del editor, así que
// "Esc y luego Tab" mueve el foco al siguiente control (si no, quien navega
// con teclado quedaría atrapado). Autocompletado avanzado: fuera de alcance.

import { calcularIndentacion } from "./indentacion.js";

export class CodeEditor {
  constructor({ textareaEl, lineNumbersEl }) {
    this.textarea = textareaEl;
    this.lineNumbers = lineNumbersEl;
    this.textarea.addEventListener("input", () => this.actualizarNumeros());
    this.textarea.addEventListener("scroll", () => this.sincronizarScroll());
    this.textarea.addEventListener("keydown", (e) => this.manejarTecla(e));
    this.textarea.addEventListener("blur", () => {
      this.tabLiberado = false;
    });
    this.tabLiberado = false;
    this.actualizarNumeros();
  }

  manejarTecla(e) {
    if (e.key === "Escape") {
      this.tabLiberado = true; // el siguiente Tab mueve el foco fuera del editor
      return;
    }
    if (e.key !== "Tab" || e.ctrlKey || e.metaKey || e.altKey) return;
    if (this.tabLiberado) {
      this.tabLiberado = false;
      return;
    }
    e.preventDefault();

    const ta = this.textarea;
    const r = calcularIndentacion({
      valor: ta.value,
      inicio: ta.selectionStart,
      fin: ta.selectionEnd,
      shift: e.shiftKey,
    });
    if (r.texto === ta.value.slice(r.desde, r.hasta)) return; // nada que cambiar (Shift+Tab sin sangría)

    // execCommand conserva el historial de deshacer (Ctrl+Z); setRangeText es el plan B.
    ta.setSelectionRange(r.desde, r.hasta);
    let hecho = false;
    try {
      hecho = document.execCommand("insertText", false, r.texto);
    } catch {
      hecho = false;
    }
    if (!hecho) ta.setRangeText(r.texto, r.desde, r.hasta, "end");
    ta.setSelectionRange(r.selInicio, r.selFin);
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
