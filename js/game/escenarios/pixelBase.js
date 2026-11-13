// pixelBase.js
// Base común de las escenas de PIXEL ART del Mundo 6 (puerta, radar, núcleo…). Pone lo que todas comparten para que cada escena solo
// cuente SU historia:
//   · lienzo pequeño (200×112) con capa estática en caché + capa dinámica, escalado con escala entera (ver pixel.js);
//   · motor: print / input() / asignaciones, con ganchos `alImprimir(texto)` y `alRecibirEntrada(valor, indice)` que cada escena rellena;
//   · lámparas de casos (✓/✗) en `marcarCasos`, Nix con expresión y pantallita LCD con texto que se desplaza.
// Cada escena implementa pintarEstatico(c) (se pinta UNA vez) y pintarDinamico(c, ahora) (solo lo que se mueve).

import { EscenarioBase } from "./base.js";
import { Errores } from "../../interpreter/errors.js";
import { PAL, crearLienzoPixel, px, escribir, anchoTexto, pintarNix, escalaEntera, simboloOk } from "../pixel.js";

export const LW = 200;
export const LH = 112;

export const entero = (v) => {
  const n = Number.parseInt(String(v).trim(), 10);
  return Number.isFinite(n) ? n : null;
};
export const limitar = (n, a, b) => Math.max(a, Math.min(b, n));

export class EscenarioPixel extends EscenarioBase {
  constructor(config, opciones) {
    super({ ...config, mundo: 5 }, opciones);
    this._estatico = null;
    this._lienzo = null;
    this.reiniciarModelo();
  }

  get textoProtagonista() {
    return "la escena";
  }

  /** Estado común; cada escena llama a super.reiniciarModelo() y añade el suyo. */
  reiniciarModelo() {
    this.entradasRecibidas = 0;
    this.esperandoEntrada = false;
    this.lcd = "";
    this.casos = [];
    this.destello = 0;
    this.nix = "normal";
  }

  reiniciar() {
    this.reiniciarModelo();
    this.render();
  }

  /** Lo llama el juego al terminar de evaluar: una lámpara por caso (✓ / ✗) y Nix reacciona. */
  marcarCasos(resultados) {
    this.casos = resultados.map((ok) => (ok === null || ok === undefined ? null : Boolean(ok)));
    this.nix = this.casos.length && this.casos.every((c) => c === true) ? "feliz" : this.casos.some((c) => c === false) ? "preocupado" : "normal";
    return this.animar(550, (t) => {
      this.destello = 1 - t;
    });
  }

  // ---------------------------------------------------------------- motor
  crearMotor(callbacks = {}) {
    const esc = this;
    return {
      async print(valor) {
        callbacks.onSalida?.({ tipo: "PRINT", valor });
        await esc.alImprimir(String(valor));
        esc.render();
      },
      async entrada(prompt) {
        if (typeof callbacks.pedirEntrada !== "function") throw Errores.entradaNoDisponible();
        esc.esperandoEntrada = true;
        esc.render();
        callbacks.onEntradaPendiente?.();
        const valor = await callbacks.pedirEntrada({ etiqueta: prompt });
        esc.esperandoEntrada = false;
        callbacks.onSalida?.({ tipo: "ENTRADA", valor });
        const indice = esc.entradasRecibidas++;
        await esc.alRecibirEntrada(valor, indice);
        esc.render();
        return valor;
      },
      async asignacion(nombre, valor) {
        callbacks.onAsignacion?.(nombre, valor);
      },
      async metodo() {
        return undefined;
      },
    };
  }

  /** Ganchos: cada escena decide qué hace con lo que imprime y con lo que recibe. */
  async alImprimir(texto) {
    this.lcd = texto;
    await this.esperar(160);
  }
  async alRecibirEntrada() {}

  // ---------------------------------------------------------------- vista
  ajustarTamano() {
    // El lienzo mide EXACTAMENTE el arte con escala entera (sin franjas vacías) y queda centrado en su marco.
    const dpr = (typeof window !== "undefined" && window.devicePixelRatio) || 1;
    const alturaMax = typeof window !== "undefined" ? Math.max(240, window.innerHeight * 0.6) : 400;
    const medidas = (disponible) => escalaEntera(disponible, alturaMax, LW, LH, dpr).css;
    if (this.canvas?.dataset) this.canvas.dataset.pixel = "1"; // pixel art: puede dejar franjas a los lados (escala entera)
    this.ajustarCanvas(
      (ancho) => ancho * (LH / LW),
      (disponible) => LW * medidas(disponible)
    );
  }

  pintarEstatico() {}
  pintarDinamico() {}

  /** Pantallita LCD de 48×8: texto estático o que se desplaza si no cabe. */
  pintarLcd(c, x, y, ancho, texto, color, ahora) {
    px(c, x, y, ancho, 8, "#0b3d2e");
    const t = texto;
    const w = anchoTexto(t);
    if (w <= ancho - 2) escribir(c, t, x + 1, y + 2, color);
    else {
      const total = w + 12;
      const desfase = Math.floor(ahora / 90) % total;
      c.save();
      c.beginPath();
      c.rect(x + 1, y, ancho - 2, 8);
      c.clip();
      escribir(c, t, x + ancho - 1 - desfase, y + 2, color);
      c.restore();
    }
  }

  pintarLampara(c, x, y, estado, destello) {
    const color = estado === true ? PAL.verde : estado === false ? PAL.rojo : PAL.pizarra;
    px(c, x - 1, y - 1, 7, 7, PAL.negro);
    px(c, x, y, 5, 5, color);
    if (destello > 0.3 && estado !== null) px(c, x, y, 5, 5, PAL.blanco);
    simboloOk(c, x, y + 0, estado === true ? true : estado === false ? false : null);
  }

  /** Fila de lámparas de casos (hasta 6). */
  pintarCasos(c, x, y, paso = 11) {
    const n = Math.min(this.casos.length || 5, 6);
    for (let i = 0; i < n; i++) this.pintarLampara(c, x + i * paso, y, this.casos[i] ?? null, this.destello);
  }

  render() {
    if (!this.ctx) return;
    const { w, h, dpr } = this.dimensiones();
    const ctx = this.ctx;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = PAL.negro;
    ctx.fillRect(0, 0, w, h);
    if (!this._lienzo) {
      this._lienzo = crearLienzoPixel(LW, LH);
      this._estatico = crearLienzoPixel(LW, LH);
      if (this._estatico) this.pintarEstatico(this._estatico.ctx);
    }
    if (!this._lienzo || !this._estatico) return; // sin lienzo auxiliar (pruebas sin navegador): no hay nada que dibujar
    const c = this._lienzo.ctx;
    c.clearRect(0, 0, LW, LH);
    c.drawImage(this._estatico.canvas, 0, 0);
    const ahora = typeof performance !== "undefined" ? performance.now() : 0;
    this.pintarDinamico(c, this.reducido ? 0 : ahora);

    const { css } = escalaEntera(w, h, LW, LH, dpr);
    const ancho = LW * css;
    const alto = LH * css;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this._lienzo.canvas, Math.round(((w - ancho) / 2) * dpr) / dpr, Math.round(((h - alto) / 2) * dpr) / dpr, ancho, alto);
  }
}

export { PAL, px, escribir, anchoTexto, pintarNix };
