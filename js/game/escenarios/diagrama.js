// diagrama.js
// Nivel 0 (antes del Mundo 1): un pasillo con Robot1, una puerta y, a veces, una llave. No hay código:
// el alumno ordena tarjetas de un diagrama de flujo y cada tarjeta correcta se EJECUTA aquí.
//   inicio / fin          marcan el principio y el final (no mueven nada)
//   caminar {pasos}       Robot1 avanza esas casillas
//   recoger               toma la llave si está en su casilla
//   abrir                 abre la puerta (si está pegada a ella y, si hay llave, ya la tiene)
//   encender              despierta a Robot1 (si el nivel lo pide)
// Si el alumno se equivoca de tarjeta, chocar() muestra el golpe y el nivel se reinicia.

import { EscenarioBase } from "./base.js";
import { paletaDe } from "../paletas.js";

export class EscenarioDiagrama extends EscenarioBase {
  constructor(config, opciones) {
    super({ ...config, mundo: 1 }, opciones);
    this.largo = config.largo ?? 6;
    this.puertaX = config.puertaX ?? this.largo - 1;
    this.llaveX = config.llaveX ?? null;
    this.apagado = config.apagado === true;
    this.p = paletaDe(1);
    this.reiniciarModelo();
  }

  get tipo() {
    return "diagrama";
  }
  get tituloPanel() {
    return "Antes de empezar · El pasillo";
  }
  get textoObserva() {
    return "Haz clic en las tarjetas en el orden correcto y mira qué hace Robot1.";
  }
  get textoProtagonista() {
    return "Robot1";
  }

  reiniciarModelo() {
    this.x = 0;
    this.visualX = 0;
    this.encendido = !this.apagado;
    this.puertaAbierta = false;
    this.llaveRecogida = false;
    this.aperturaVisual = 0; // 0 cerrada · 1 abierta
    this.golpe = 0; // 0..1: sacudida de choque
    this.mensaje = null;
  }

  reiniciar() {
    this.reiniciarModelo();
    this.render();
  }

  /** ¿Robot1 cruzó el nivel? (la puerta abierta y, si había llave, con ella en la mano) */
  get exito() {
    return this.puertaAbierta && (this.llaveX === null || this.llaveRecogida);
  }

  /** Aplica una acción al MODELO (sin animar). Devuelve { ok, razon }. */
  aplicar(accion = {}) {
    switch (accion.tipo) {
      case "encender":
        this.encendido = true;
        return { ok: true };
      case "caminar": {
        if (!this.encendido) return { ok: false, razon: "apagado" };
        const destino = this.x + (accion.pasos || 1);
        const limite = this.puertaAbierta ? this.largo - 1 : this.puertaX - 1;
        if (destino > limite) return { ok: false, razon: "pared" };
        this.x = destino;
        return { ok: true };
      }
      case "recoger":
        if (this.llaveX === null || this.llaveRecogida || this.x !== this.llaveX) return { ok: false, razon: "sin_llave_aqui" };
        this.llaveRecogida = true;
        return { ok: true };
      case "abrir":
        if (this.x !== this.puertaX - 1) return { ok: false, razon: "lejos" };
        if (this.llaveX !== null && !this.llaveRecogida) return { ok: false, razon: "sin_llave" };
        this.puertaAbierta = true;
        return { ok: true };
      default:
        return { ok: true }; // inicio / fin
    }
  }

  /** Ejecuta la tarjeta correcta con animación. */
  async ejecutarPaso(accion = {}) {
    const antes = this.x;
    const r = this.aplicar(accion);
    if (accion.tipo === "caminar") {
      await this.animar(Math.max(350, (accion.pasos || 1) * 280), (t) => {
        this.visualX = antes + (this.x - antes) * t;
      });
    } else if (accion.tipo === "abrir") {
      await this.animar(450, (t) => {
        this.aperturaVisual = t;
      });
    } else if (accion.tipo === "recoger" || accion.tipo === "encender") {
      await this.esperar(350);
      this.render();
    } else {
      await this.esperar(200);
    }
    return r;
  }

  /** El robot se equivoca y choca (animación); la pantalla se reinicia después. */
  async chocar() {
    this.mensaje = "¡PUM!";
    await this.animar(500, (t) => {
      this.golpe = Math.sin(t * Math.PI);
    });
    await this.esperar(350);
    this.golpe = 0;
    this.mensaje = null;
  }

  ajustarTamano() {
    this.ajustarCanvas((ancho) => Math.min(260, Math.max(190, ancho * 0.36)));
  }

  render() {
    if (!this.dibuja) return;
    const { w, h } = this.dimensiones();
    const ctx = this.ctx;
    const p = this.p;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#0a0d14";
    ctx.fillRect(0, 0, w, h);

    const margen = 16;
    const celda = Math.min((w - margen * 2) / this.largo, 90);
    const x0 = (w - celda * this.largo) / 2;
    const y0 = h / 2 - celda / 2 + 8;

    // piso del pasillo
    for (let i = 0; i < this.largo; i++) {
      ctx.fillStyle = i % 2 ? "rgba(94, 234, 212, 0.07)" : "rgba(94, 234, 212, 0.12)";
      ctx.fillRect(x0 + i * celda, y0 + celda * 0.62, celda, celda * 0.38);
      ctx.strokeStyle = "rgba(94, 234, 212, 0.25)";
      ctx.strokeRect(x0 + i * celda + 0.5, y0 + celda * 0.62 + 0.5, celda - 1, celda * 0.38 - 1);
    }

    // llave
    if (this.llaveX !== null && !this.llaveRecogida) {
      ctx.font = `${celda * 0.5}px sans-serif`;
      ctx.textAlign = "center";
      ctx.fillStyle = "#fbbf24";
      ctx.fillText("🔑", x0 + (this.llaveX + 0.5) * celda, y0 + celda * 0.58);
    }

    // puerta (se levanta al abrirse)
    const px = x0 + this.puertaX * celda;
    const alto = celda * 0.95 * (1 - 0.82 * this.aperturaVisual);
    ctx.fillStyle = this.aperturaVisual > 0.5 ? "#86efac" : "#b45309";
    ctx.fillRect(px + celda * 0.2, y0 + celda * 0.62 - alto, celda * 0.6, alto);
    ctx.strokeStyle = "#fde68a";
    ctx.strokeRect(px + celda * 0.2 + 0.5, y0 + celda * 0.62 - alto + 0.5, celda * 0.6 - 1, alto - 1);
    ctx.fillStyle = "#e2e8f0";
    ctx.font = `${Math.max(11, celda * 0.2)}px sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(this.puertaAbierta ? "abierta" : "puerta", px + celda / 2, y0 + celda * 0.62 + celda * 0.3);

    // Robot1
    const sacudida = this.golpe * celda * 0.18;
    const rx = x0 + (this.visualX + 0.5) * celda + sacudida;
    const ry = y0 + celda * 0.34;
    ctx.fillStyle = this.golpe > 0.05 ? "#f87171" : this.encendido ? p.acento : "#475569";
    ctx.beginPath();
    ctx.arc(rx, ry, celda * 0.28, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = this.encendido ? "#08121c" : "#1e293b";
    ctx.beginPath();
    ctx.arc(rx - celda * 0.09, ry - celda * 0.04, celda * 0.05, 0, Math.PI * 2);
    ctx.arc(rx + celda * 0.09, ry - celda * 0.04, celda * 0.05, 0, Math.PI * 2);
    ctx.fill();
    if (this.llaveRecogida && this.llaveX !== null) {
      ctx.font = `${celda * 0.3}px sans-serif`;
      ctx.fillText("🔑", rx + celda * 0.22, ry - celda * 0.22);
    }

    if (this.mensaje) {
      ctx.fillStyle = "#fecaca";
      ctx.font = `700 ${Math.max(18, celda * 0.38)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(this.mensaje, w / 2, y0 - celda * 0.2);
    }
  }
}
