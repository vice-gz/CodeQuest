// cajafuerte.js
// Mundo 1 · Nivel 20 👑 «La Caja Fuerte» (jefe final: integración de input, int, variables y la fórmula (a + b) * c - d % 7).
// Cuatro cajas fuertes en fila (una por caso: config.indice dice cuál se está jugando). Cada número que entra por input()
// aparece en el teclado de la caja; el número que el programa muestra con print() se marca en la pantalla y, si es la
// combinación correcta de esa caja (config.combinacion), la puerta se abre. Si no, parpadea en rojo.
//
// config: { tipo: "cajafuerte", combinacion: "46", indice: 1, total: 4 }

import { EscenarioMinijuego, COLORES } from "./minijuego.js";
import { rr, texto, FUENTE, FUENTE_MONO, facilitar } from "./dibujo.js";

export class EscenarioCajaFuerte extends EscenarioMinijuego {
  get tipo() {
    return "cajafuerte";
  }
  get tituloPanel() {
    return "La Caja Fuerte";
  }
  get textoObserva() {
    return "Ejecuta el código y observa si la caja fuerte se abre.";
  }

  modeloPropio() {
    this.entradas = [];
    this.intento = null; // último número mostrado
    this.abierta = 0; // 0..1 apertura de la puerta
    this.error = 0;
  }

  async alEntrar(valor) {
    this.entradas.push(valor);
    if (this.entradas.length > 4) this.entradas.shift();
  }

  async alImprimir(t) {
    this.intento = t.trim();
    if (this.config.combinacion !== undefined && this.intento === String(this.config.combinacion)) {
      await this.animar(800, (p) => {
        this.abierta = facilitar(p);
      });
    } else {
      await this.animar(500, (p) => {
        this.error = 1 - p;
      });
    }
  }

  dibujarEscena(ctx, z) {
    const total = this.config.total ?? 4;
    const actual = (this.config.indice ?? 1) - 1;
    // fila de cajas pequeñas arriba
    const paso = Math.min(46, (z.w - 28) / total);
    for (let i = 0; i < total; i++) {
      const x = z.x + 14 + i * paso;
      rr(ctx, x, z.y + 10, paso - 8, 26, 5);
      ctx.fillStyle = i === actual ? COLORES.amarillo : "#3a4260";
      ctx.fill();
      texto(ctx, String(i + 1), x + (paso - 8) / 2, z.y + 23, { fuente: `700 12px ${FUENTE}`, color: i === actual ? "#2a2000" : COLORES.suave });
    }
    // caja grande
    const s = Math.min(z.h - 60, z.w * 0.42);
    const cx = z.x + z.w * 0.36;
    const cy = z.y + 44 + s / 2;
    rr(ctx, cx - s / 2, cy - s / 2, s, s, 12);
    ctx.fillStyle = "#59617a";
    ctx.fill();
    rr(ctx, cx - s / 2 + 8, cy - s / 2 + 8, s - 16, s - 16, 8);
    ctx.fillStyle = "#151a2c";
    ctx.fill();
    // puerta (se abre achicándose hacia la izquierda)
    const ancho = (s - 20) * (1 - 0.85 * this.abierta);
    rr(ctx, cx - s / 2 + 10, cy - s / 2 + 10, ancho, s - 20, 8);
    ctx.fillStyle = this.error > 0 ? `rgb(${120 + 100 * this.error}, 60, 70)` : "#7d869f";
    ctx.fill();
    if (this.abierta < 0.5) {
      ctx.beginPath();
      ctx.arc(cx, cy, s * 0.18, 0, Math.PI * 2);
      ctx.strokeStyle = "#cfd6e8";
      ctx.lineWidth = 4;
      ctx.stroke();
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2;
        ctx.fillStyle = "#cfd6e8";
        ctx.fillRect(cx + Math.cos(a) * s * 0.22 - 2, cy + Math.sin(a) * s * 0.22 - 2, 4, 4);
      }
    } else {
      texto(ctx, "$", cx + s * 0.12, cy, { fuente: `800 ${Math.round(s * 0.3)}px ${FUENTE}`, color: COLORES.amarillo });
    }
    // panel: entradas y código
    // el panel se reparte en el alto disponible (en celular el lienzo es bajo)
    const px = z.x + z.w * 0.64;
    const renglon = Math.max(15, Math.min(20, (z.h - 120) / 5));
    const y0 = z.y + 52;
    texto(ctx, "Datos recibidos", px, y0, { fuente: `700 12px ${FUENTE}`, color: COLORES.suave, align: "left" });
    ["a", "b", "c", "d"].forEach((n, i) => {
      const v = this.vars[n];
      texto(ctx, `${n} = ${v === undefined ? (this.entradas[i] !== undefined ? `"${this.entradas[i]}"` : "?") : v}`, px, y0 + (i + 1) * renglon, {
        fuente: `600 12px ${FUENTE_MONO}`,
        color: v === undefined ? COLORES.suave : COLORES.texto,
        align: "left",
      });
    });
    const yPantalla = y0 + 5 * renglon;
    const anchoPantalla = Math.min(150, z.x + z.w - px - 10);
    rr(ctx, px, yPantalla, anchoPantalla, 30, 6);
    ctx.fillStyle = "#07120c";
    ctx.fill();
    texto(ctx, this.intento ?? "----", px + 10, yPantalla + 15, { fuente: `700 16px ${FUENTE_MONO}`, color: this.abierta > 0 ? COLORES.verde : this.intento ? COLORES.rojo : "#2c5a3e", align: "left" });
    if (this.abierta >= 1) texto(ctx, "¡ABIERTA!", px + anchoPantalla - 8, yPantalla + 15, { fuente: `800 12px ${FUENTE}`, color: COLORES.verde, align: "right" });
  }
}
