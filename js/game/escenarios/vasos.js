// vasos.js
// Mundo 1 · Nivel 10 «El Intercambio» (intercambiar dos variables con una temporal: temp = vasoA; vasoA = vasoB; vasoB = temp).
// Tres vasos en una mesa; cada uno es una variable (config.vasos, por omisión vasoA, vasoB y temp) y su líquido es el texto que
// guarda ("agua", "jugo"...). Al asignar, un chorro va del vaso que se lee al vaso que recibe y este cambia de color.
// Importante: en Python asignar COPIA el valor; el vaso de origen NO se vacía. Por eso, si haces vasoA = vasoB sin guardar
// antes vasoA en temp, el líquido de A se pierde (los dos vasos quedan iguales). La escena lo marca con «¡Se perdió …!».
//
// config: { tipo: "vasos", vasos: ["vasoA", "vasoB", "temp"], variables: { vasoA: "agua", vasoB: "jugo" } }

import { EscenarioMinijuego, COLORES } from "./minijuego.js";
import { rr, texto, FUENTE, FUENTE_MONO, facilitar } from "./dibujo.js";

const LIQUIDOS = {
  agua: "#4fc3f7",
  jugo: "#ffa726",
  leche: "#f1f1f1",
  cafe: "#8d5a3b",
  refresco: "#e53935",
  te: "#9ccc65",
  chocolate: "#6d3b23",
  limonada: "#d4e157",
};

export function colorLiquido(v) {
  if (v === undefined || v === null) return null;
  const k = String(v).toLowerCase();
  if (LIQUIDOS[k]) return LIQUIDOS[k];
  let h = 0;
  for (const c of k) h = (h * 31 + c.charCodeAt(0)) % 360;
  return `hsl(${h}, 70%, 60%)`;
}

export class EscenarioVasos extends EscenarioMinijuego {
  get tipo() {
    return "vasos";
  }
  get tituloPanel() {
    return "El Intercambio · Tres vasos";
  }
  get textoObserva() {
    return "Ejecuta el código y sigue el líquido de cada vaso.";
  }
  get nombres() {
    return this.config.vasos || ["vasoA", "vasoB", "temp"];
  }

  modeloPropio() {
    this.chorro = null; // { desde, hacia, p, color }
    this.perdidos = []; // líquidos que ya no están en ningún vaso
    this.inicial = new Set(Object.values(this.config.variables || {}).map(String));
  }

  async alAsignar(nombre, valor, anterior, info) {
    if (!this.nombres.includes(nombre)) return;
    const desde = (info.fuentes || []).find((f) => this.nombres.includes(f) && f !== nombre);
    if (desde) {
      this.chorro = { desde, hacia: nombre, p: 0, color: colorLiquido(valor) };
      await this.animar(650, (t) => {
        this.chorro.p = facilitar(t);
      });
      this.chorro = null;
    }
    // ¿Algún líquido del principio ya no está en ningún vaso?
    const presentes = new Set(this.nombres.map((n) => this.vars[n]).filter((x) => x !== undefined).map(String));
    this.perdidos = [...this.inicial].filter((l) => !presentes.has(l));
  }

  posiciones(z) {
    const n = this.nombres.length;
    const paso = z.w / (n + 1);
    return Object.fromEntries(this.nombres.map((nombre, i) => [nombre, { x: z.x + paso * (i + 1), y: z.y + z.h * 0.66 }]));
  }

  dibujarEscena(ctx, z) {
    // mesa
    ctx.fillStyle = "#3a2a1d";
    ctx.fillRect(z.x, z.y + z.h * 0.66 + 34, z.w, 10);
    const pos = this.posiciones(z);
    const alto = Math.min(110, z.h * 0.46);
    const ancho = Math.min(76, z.w / (this.nombres.length + 1) - 16);
    for (const nombre of this.nombres) {
      const { x, y } = pos[nombre];
      const v = this.vars[nombre];
      const color = colorLiquido(v);
      const arriba = y + 34 - alto;
      // vaso (trapecio)
      const trapecio = (relleno) => {
        const t = relleno ? 0.18 : 0;
        ctx.beginPath();
        ctx.moveTo(x - ancho / 2, arriba + alto * t);
        ctx.lineTo(x + ancho / 2, arriba + alto * t);
        ctx.lineTo(x + ancho * 0.38, y + 34);
        ctx.lineTo(x - ancho * 0.38, y + 34);
        ctx.closePath();
      };
      if (color) {
        trapecio(true);
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.85;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      trapecio(false);
      ctx.strokeStyle = this.brillo(nombre) > 0 ? COLORES.verde : "rgba(220, 235, 255, 0.75)";
      ctx.lineWidth = 2.5;
      if (v === undefined) ctx.setLineDash?.([5, 4]);
      ctx.stroke();
      ctx.setLineDash?.([]);
      texto(ctx, nombre, x, arriba - 14, { fuente: `700 13px ${FUENTE_MONO}`, color: COLORES.texto });
      texto(ctx, v === undefined ? "(vacío)" : `"${v}"`, x, y + 58, { fuente: `600 12px ${FUENTE_MONO}`, color: v === undefined ? COLORES.suave : color });
    }

    // chorro animado: un arco del vaso que se lee al que recibe
    if (this.chorro) {
      const a = pos[this.chorro.desde];
      const b = pos[this.chorro.hacia];
      const yA = a.y + 34 - alto;
      const cx = (a.x + b.x) / 2;
      const cyArco = Math.min(yA, b.y + 34 - alto) - 46;
      const p = this.chorro.p;
      ctx.strokeStyle = this.chorro.color || COLORES.cian;
      ctx.lineWidth = 6;
      ctx.lineCap = "round";
      ctx.beginPath();
      const pasos = 24;
      for (let i = 0; i <= pasos * p; i++) {
        const t = i / pasos;
        const x = (1 - t) ** 2 * a.x + 2 * (1 - t) * t * cx + t ** 2 * b.x;
        const y = (1 - t) ** 2 * yA + 2 * (1 - t) * t * cyArco + t ** 2 * (b.y + 34 - alto);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      texto(ctx, "copia", cx, cyArco - 8, { fuente: `600 11px ${FUENTE}`, color: COLORES.suave });
    }

    if (this.perdidos.length) {
      texto(ctx, `¡Se perdió ${this.perdidos.map((l) => `"${l}"`).join(" y ")}! Ningún vaso lo tiene ya.`, z.x + z.w / 2, z.y + 18, { fuente: `700 13px ${FUENTE}`, color: COLORES.rojo, maxAncho: z.w - 20 });
    } else {
      texto(ctx, "Asignar COPIA el valor: el vaso de origen no se vacía.", z.x + z.w / 2, z.y + 18, { fuente: `500 12px ${FUENTE}`, color: COLORES.suave, maxAncho: z.w - 20 });
    }
  }
}
