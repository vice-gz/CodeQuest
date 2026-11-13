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
import { crearBucleReposo, aplicarModo, escucharModo } from "../rendimiento.js";

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
    this._animando = 0; // animaciones de ejecución en curso (durante ellas no hace falta el dibujo de reposo)
    this._reposo = null;
    this.destruido = false;
  }

  // ----- Animación en reposo y ciclo de vida -----
  /** Arranca (una sola vez) el dibujo de reposo: flotar, ondas, partículas… Ver rendimiento.js. */
  iniciarReposo() {
    if (!this.canvas || !this.ctx || this.reducido || this.destruido) return;
    if (!this._reposo) {
      this._reposo = crearBucleReposo({ canvas: this.canvas, dibujar: () => this.render(), ocupado: () => this._animando > 0 });
      this._alCambiarModo = () => {
        aplicarModo();
        this._reposo?.reconfigurar();
        this.render(); // el cambio de modo se nota al instante (con o sin resplandores)
      };
      this._dejarDeEscucharModo = escucharModo(this._alCambiarModo);
    }
    this._reposo.iniciar();
  }

  /** Detiene todo lo que este escenario dejó corriendo. Hay que llamarlo antes de crear el siguiente escenario sobre el mismo canvas. */
  destruir() {
    this.destruido = true;
    this._reposo?.detener();
    this._reposo = null;
    this._dejarDeEscucharModo?.();
    this._dejarDeEscucharModo = null;
    this._alCambiarModo = null;
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
    this._animando++;
    return new Promise((resolve) => {
      const cuadro = (ahora) => {
        const t = Math.min(1, (ahora - t0) / ms);
        paso(t);
        this.render();
        if (t < 1 && !this.destruido) requestAnimationFrame(cuadro);
        else {
          this._animando = Math.max(0, this._animando - 1);
          resolve();
        }
      };
      requestAnimationFrame(cuadro);
    });
  }

  dimensiones() {
    const dpr = (typeof window !== "undefined" && window.devicePixelRatio) || 1;
    // Tamaño en píxeles CSS con el que se ajustó el canvas (si aún no se ajustó, se deduce del buffer).
    return { w: this.anchoCss ?? this.canvas.width / dpr, h: this.altoCss ?? this.canvas.height / dpr, dpr };
  }

  /** Ajusta el canvas al ancho del contenedor con el alto que pida el escenario. */
  ajustarCanvas(altoPara, anchoPara = null) {
    if (!this.canvas) return;
    const contenedor = this.canvas.parentElement;
    const disponible = contenedor.clientWidth;
    if (disponible <= 0) return; // escenario oculto (otra pestaña): se reajusta al volver a «Jugar»
    // `anchoPara` permite que un escenario use MENOS que todo el ancho (p. ej. pixel art con escala entera, centrado).
    const ancho = anchoPara ? Math.min(disponible, anchoPara(disponible)) : disponible;
    // En celulares horizontales (poco alto) el escenario no debe ocupar más que la pantalla.
    const alto = Math.min(altoPara(ancho), Math.max(240, window.innerHeight * 0.8));
    const dpr = window.devicePixelRatio || 1;
    // Buffer de píxeles FÍSICOS (ancho × dpr, redondeado a entero) y una escala que lo lleva exacto al tamaño CSS:
    // así cada línea (también las punteadas) cae sobre píxeles reales y se ve nítida en pantallas Retina y celulares.
    const anchoPx = Math.max(1, Math.round(ancho * dpr));
    const altoPx = Math.max(1, Math.round(alto * dpr));
    this.canvas.width = anchoPx;
    this.canvas.height = altoPx;
    this.canvas.style.width = `${ancho}px`;
    this.canvas.style.height = `${alto}px`;
    this.anchoCss = ancho;
    this.altoCss = alto;
    this.ctx.setTransform(anchoPx / ancho, 0, 0, altoPx / alto, 0, 0);
    this.render();
  }
}
