// base.js
// Contrato común de los escenarios (un escenario por mundo). juego.js y los
// tests hablan SOLO con esta interfaz, así que cambiar de mundo = cambiar de
// escenario, sin tocar el intérprete.
//
// Un escenario tiene un MODELO (estado lógico: variables, cartas, pisos...) y,
// si recibe un <canvas>, una VISTA que lo dibuja. Sin canvas (pruebas, casos
// de validación silenciosos) se comporta igual pero sin dibujar ni esperar.
//
// Las animaciones responden al resultado REAL de la ejecución: el motor del
// escenario recibe cada asignación, condición y movimiento del intérprete y es
// quien cambia el modelo y lo dibuja.

import { BIBLIOTECA_SIN_OBJETOS } from "../../interpreter/bibliotecas.js";

export function movimientoReducido() {
  return typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;
}

export class EscenarioBase {
  /**
   * @param {object} config  nivel.escenario + fase.escenario + caso.escenario ya combinados
   * @param {object} [opciones]
   * @param {HTMLCanvasElement|null} [opciones.canvas]
   */
  constructor(config = {}, { canvas = null } = {}) {
    this.config = config;
    this.canvas = canvas;
    this.ctx = canvas ? canvas.getContext("2d") : null;
    this.reducido = movimientoReducido();
    this.mundo = config.mundo || 1;
  }

  // ----- Información del mundo (la UI la lee; cada escenario la redefine) -----
  get tipo() {
    return "base";
  }
  get biblioteca() {
    return BIBLIOTECA_SIN_OBJETOS;
  }
  get tituloPanel() {
    return "Escenario";
  }
  get tituloEstado() {
    return null; // null = el panel de estado se oculta
  }
  get textoObserva() {
    return "Ejecuta el código y observa qué pasa.";
  }
  get textoProtagonista() {
    return "tu programa";
  }
  get variablesIniciales() {
    return { ...(this.config.variables || {}) };
  }
  get dibuja() {
    return Boolean(this.ctx);
  }

  // ----- Ciclo de vida -----
  reiniciar() {}
  render() {}
  ajustarTamano() {}
  async prepararEjecucion() {}
  crearMotor() {
    throw new Error("crearMotor() no implementado");
  }
  snapshot() {
    return {};
  }
  /** Filas {etiqueta, valor} para el panel de estado. */
  filasEstado() {
    return [];
  }
  /** Validaciones propias del mundo. Devuelve true/false, o undefined si no la conoce. */
  evaluar() {
    return undefined;
  }

  // ----- Utilidades de animación -----
  // Si un ciclo repite muchas veces, el escenario pone `rapido = true`: se siguen
  // actualizando los datos, pero sin pausas ni animaciones. Así un while True:
  // llega a su límite (RUN_005) en un instante en vez de tardar minutos.
  esperar(ms) {
    if (!this.dibuja || this.rapido) return Promise.resolve();
    return new Promise((resolve) => setTimeout(resolve, this.reducido ? Math.min(ms, 50) : ms));
  }

  /** Llama paso(t) con t de 0 a 1 durante `ms` y redibuja en cada cuadro. */
  animar(ms, paso) {
    if (!this.dibuja || this.reducido || this.rapido || ms <= 0) {
      paso(1);
      this.render();
      return Promise.resolve();
    }
    const t0 = performance.now();
    return new Promise((resolve) => {
      const cuadro = (ahora) => {
        const t = Math.min(1, (ahora - t0) / ms);
        paso(t);
        this.render();
        if (t < 1) requestAnimationFrame(cuadro);
        else resolve();
      };
      requestAnimationFrame(cuadro);
    });
  }

  dimensiones() {
    const dpr = (typeof window !== "undefined" && window.devicePixelRatio) || 1;
    return { w: this.canvas.width / dpr, h: this.canvas.height / dpr, dpr };
  }

  /** Ajusta el canvas al ancho del contenedor con el alto que pida el escenario. */
  ajustarCanvas(altoPara) {
    if (!this.canvas) return;
    const contenedor = this.canvas.parentElement;
    const ancho = contenedor.clientWidth;
    const alto = altoPara(ancho);
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = ancho * dpr;
    this.canvas.height = alto * dpr;
    this.canvas.style.width = `${ancho}px`;
    this.canvas.style.height = `${alto}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.render();
  }
}
