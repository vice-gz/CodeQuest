// cartas.js
// Mundo 3 (Lógica): la sala de estrategia con una mesa de cartas holográficas.
// Las cartas de la mano definen las variables del programa (carta1, carta2,
// total, color1...). Al ejecutar, las cartas se voltean; cada if / elif se
// "juzga" en pantalla con un sello VERDADERO / FALSO, y lo que el programa
// imprime aparece como mensaje central de la mesa.

import { EscenarioBase } from "./base.js";
import { rr, texto, conBrillo, mascota, FUENTE, FUENTE_MONO, facilitar } from "./dibujo.js";
import { BIBLIOTECA_MESA } from "../../interpreter/bibliotecas.js";
import { Errores } from "../../interpreter/errors.js";
import { paletaDe } from "../paletas.js";

const SIMBOLO = { corazones: "♥", diamantes: "♦", treboles: "♣", picas: "♠" };
const ROJO = new Set(["corazones", "diamantes"]);
const MAX_CARTAS = 6;
const POSITIVAS = ["ganaste", "ganas", "gana", "blackjack", "victoria", "bien", "perfecto"];
const NEGATIVAS = ["bust", "perdiste", "pierdes", "pierde", "derrota", "te pasaste"];

export function colorDePalo(palo) {
  return ROJO.has(palo) ? "roja" : "negra";
}

/** Variables que el programa del estudiante encuentra ya definidas. */
export function variablesDeMano(config) {
  const cartas = config.cartas || [];
  const vars = {};
  cartas.forEach((c, i) => {
    vars[`carta${i + 1}`] = c.valor;
    if (config.mostrarColor) {
      vars[`color${i + 1}`] = colorDePalo(c.palo);
    }
  });
  vars.total = cartas.reduce((t, c) => t + c.valor, 0);
  return { ...vars, ...(config.variables || {}) };
}

export class EscenarioCartas extends EscenarioBase {
  constructor(config, opciones) {
    super({ ...config, mundo: 2 }, opciones);
    this.cartas = (config.cartas || []).map((c) => ({ valor: c.valor, palo: c.palo || "picas" }));
    this.p = paletaDe(2);
    this.reiniciarModelo();
  }

  get tipo() {
    return "cartas";
  }
  get biblioteca() {
    return BIBLIOTECA_MESA;
  }
  get tituloPanel() {
    return "Sala de Estrategia · Mesa de cartas";
  }
  get tituloEstado() {
    return "Estado de la mesa";
  }
  get textoObserva() {
    return "Ejecuta el código y observa cómo la mesa juzga cada condición.";
  }
  get textoProtagonista() {
    return "la mesa";
  }
  get variablesIniciales() {
    return variablesDeMano(this.config);
  }

  reiniciarModelo() {
    // Cada carta: giro 0 = boca abajo, 1 = boca arriba (sale del estado, no es decoración).
    this.giro = this.cartas.map(() => (this.config.mostrarCartas ? 1 : 0));
    this.historial = []; // {texto, resultado, tipo}
    this.veredicto = null; // {texto, resultado, anim}
    this.mensaje = null; // {texto, tono, anim}
    this.reloj = 0;
  }

  reiniciar() {
    this.reiniciarModelo();
    this.render();
  }

  snapshot() {
    const u = this.historial[this.historial.length - 1];
    return {
      cartas: this.cartas.map((c) => c.valor),
      total: variablesDeMano(this.config).total,
      ultimaCondicion: u ? `${u.texto} → ${u.resultado ? "True" : "False"}` : null,
      mensaje: this.mensaje?.texto ?? null,
      condiciones: this.historial.length,
    };
  }

  filasEstado() {
    const s = this.snapshot();
    return [
      { etiqueta: "Cartas", valor: s.cartas.join(", ") || "—" },
      { etiqueta: "Total", valor: s.total },
      { etiqueta: "Última condición", valor: s.ultimaCondicion || "—" },
    ];
  }

  evaluar(v) {
    if (v.tipo === "condiciones_evaluadas") return this.historial.length >= (v.minimo ?? 1);
    return undefined;
  }

  tonoDe(textoMensaje) {
    const t = String(textoMensaje).toLowerCase();
    if (NEGATIVAS.some((n) => t.includes(n))) return "negativo";
    if (POSITIVAS.some((n) => t.includes(n))) return "positivo";
    return "neutral";
  }

  // ---------- Motor ----------
  async prepararEjecucion() {
    // Al ejecutar, las cartas boca abajo se voltean una por una.
    for (let i = 0; i < this.cartas.length; i++) {
      if (this.giro[i] >= 1) continue;
      // eslint-disable-next-line no-await-in-loop
      await this.animar(260, (t) => {
        this.giro[i] = t;
      });
    }
  }

  crearMotor(callbacks = {}) {
    const escenario = this;
    return {
      async print(valor) {
        callbacks.onSalida?.({ tipo: "PRINT", valor });
        escenario.mensaje = { texto: String(valor), tono: escenario.tonoDe(valor), anim: 0 };
        await escenario.animar(260, (t) => {
          escenario.mensaje.anim = t;
        });
        await escenario.esperar(420);
      },

      async entrada(prompt) {
        if (typeof callbacks.pedirEntrada !== "function") throw Errores.entradaNoDisponible();
        callbacks.onEntradaPendiente?.();
        const valor = await callbacks.pedirEntrada({ etiqueta: prompt });
        callbacks.onSalida?.({ tipo: "ENTRADA", valor });
        return valor;
      },

      async asignacion(nombre, valor) {
        callbacks.onAsignacion?.(nombre, valor);
      },

      async condicion(textoCondicion, resultado, info = {}) {
        escenario.historial.push({ texto: textoCondicion, resultado, tipo: info.tipo });
        if (escenario.historial.length > 4) escenario.historial.shift();
        escenario.veredicto = { texto: textoCondicion, resultado, tipo: info.tipo, anim: 0 };
        await escenario.animar(300, (t) => {
          escenario.veredicto.anim = t;
        });
        await escenario.esperar(520);
        callbacks.onEstado?.(escenario.snapshot());
      },

      // mesa.poner_carta(valor, color) y mesa.voltear(): visuales, no cambian las variables.
      async poner_carta(valor, color) {
        if (typeof valor !== "number" || Number.isNaN(valor)) throw Errores.accionNecesitaNumero("poner_carta", null, "mesa");
        if (color !== "roja" && color !== "negra") throw Errores.colorDeCartaInvalido(color);
        if (escenario.cartas.length >= MAX_CARTAS) throw Errores.mesaLlena(MAX_CARTAS);
        escenario.cartas.push({ valor, palo: color === "roja" ? "corazones" : "picas" });
        escenario.giro.push(0);
        escenario.render();
        await escenario.esperar(200);
      },
      async voltear() {
        const objetivo = escenario.giro.every((g) => g >= 1) ? 0 : 1;
        const inicio = [...escenario.giro];
        await escenario.animar(300, (t) => {
          escenario.giro = inicio.map((g) => (objetivo === 1 ? Math.max(g, t) : Math.min(g, 1 - t)));
        });
      },
      async metodo(objeto, nombre, args = []) {
        if (nombre === "poner_carta") return this.poner_carta(...args);
        if (nombre === "voltear") return this.voltear();
        return undefined;
      },
    };
  }

  // ---------- Vista ----------
  ajustarTamano() {
    this.ajustarCanvas((w) => Math.max(350, Math.min(440, w * 0.72)));
  }

  render() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const { w, h } = this.dimensiones();
    const p = this.p;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = p.fondo;
    ctx.fillRect(0, 0, w, h);

    // Mesa
    const mx = 12;
    const my = 30;
    const mw = w - mx * 2;
    const mh = h - my - 12;
    conBrillo(ctx, p.glow, 16, () => {
      rr(ctx, mx, my, mw, mh, 22);
      const g = ctx.createRadialGradient(w / 2, my + mh * 0.5, 20, w / 2, my + mh * 0.5, mw * 0.6);
      g.addColorStop(0, "#24402f");
      g.addColorStop(1, "#14241c");
      ctx.fillStyle = g;
      ctx.fill();
    });
    rr(ctx, mx, my, mw, mh, 22);
    ctx.strokeStyle = p.acento2;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.strokeStyle = "rgba(251, 191, 36, 0.25)";
    rr(ctx, mx + 8, my + 8, mw - 16, mh - 16, 16);
    ctx.stroke();

    texto(ctx, "SALA DE ESTRATEGIA", 14, 14, { fuente: `600 11px ${FUENTE_MONO}`, color: p.acento2, align: "left" });
    mascota(ctx, w - 22, 16, 9, { color: p.acento2 });

    // Cartas
    const cw = Math.min(70, Math.max(46, (mw - 60) / Math.max(3, this.cartas.length + 1) - 10));
    const ch = cw * 1.42;
    const n = this.cartas.length;
    const gap = 14;
    const total = n * cw + (n - 1) * gap;
    const x0 = (w - total) / 2;
    const y0 = my + 16;
    this.cartas.forEach((c, i) => {
      this.dibujarCarta(ctx, x0 + i * (cw + gap), y0, cw, ch, c, this.giro[i]);
      texto(ctx, `carta${i + 1}`, x0 + i * (cw + gap) + cw / 2, y0 + ch + 12, {
        fuente: `500 10px ${FUENTE_MONO}`,
        color: "#a7c4b3",
      });
    });

    // Total
    const vars = variablesDeMano(this.config);
    if (n > 0) {
      const visible = this.giro.every((g) => g >= 1);
      texto(ctx, visible ? `total = ${vars.total}` : "total = ?", w / 2, y0 + ch + 32, {
        fuente: `700 15px ${FUENTE_MONO}`,
        color: p.acento2,
      });
    }

    this.dibujarVeredicto(ctx, w, mx, mw, my + mh);
    this.dibujarMensaje(ctx, w, y0 + ch + 86);
  }

  dibujarCarta(ctx, x, y, w, h, carta, giro) {
    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);
    const escala = Math.abs(Math.cos(giro * Math.PI));
    ctx.scale(Math.max(0.04, escala), 1);
    const cara = giro > 0.5;
    // Tras juzgar una condición las cartas se iluminan: verde = VERDADERO, rojo = FALSO.
    const tono = this.veredicto ? (this.veredicto.resultado ? "#4ade80" : "#f87171") : null;
    conBrillo(ctx, tono && cara ? tono : "rgba(0,0,0,0.5)", tono && cara ? 18 : 10, () => {
      rr(ctx, -w / 2, -h / 2, w, h, 7);
      ctx.fillStyle = cara ? "#f8f5ee" : "#26214a";
      ctx.fill();
    });
    rr(ctx, -w / 2, -h / 2, w, h, 7);
    ctx.lineWidth = 2;
    ctx.strokeStyle = tono && cara ? tono : cara ? "#d6cfbd" : this.p.acento2;
    ctx.lineWidth = tono && cara ? 3 : 2;
    ctx.stroke();
    if (cara) {
      const rojo = ROJO.has(carta.palo);
      const color = rojo ? "#dc2626" : "#111827";
      texto(ctx, String(carta.valor), -w / 2 + 8, -h / 2 + 15, { fuente: `700 ${Math.round(w * 0.3)}px ${FUENTE}`, color, align: "left" });
      texto(ctx, SIMBOLO[carta.palo] || "♠", 0, 4, { fuente: `400 ${Math.round(w * 0.62)}px ${FUENTE}`, color });
      texto(ctx, SIMBOLO[carta.palo] || "♠", w / 2 - 8, h / 2 - 13, { fuente: `400 ${Math.round(w * 0.22)}px ${FUENTE}`, color, align: "right" });
    } else {
      ctx.strokeStyle = "rgba(251, 191, 36, 0.5)";
      ctx.lineWidth = 1.5;
      for (let k = -2; k <= 2; k++) {
        ctx.beginPath();
        ctx.moveTo(-w / 2 + 6, k * h * 0.17);
        ctx.lineTo(w / 2 - 6, k * h * 0.17 + 6);
        ctx.stroke();
      }
      texto(ctx, "?", 0, 0, { fuente: `700 ${Math.round(w * 0.5)}px ${FUENTE}`, color: this.p.acento2 });
    }
    ctx.restore();
  }

  dibujarVeredicto(ctx, w, mx, mw, base) {
    const v = this.veredicto;
    if (!v) return;
    const alto = 46;
    const ancho = Math.min(mw - 24, 340);
    const y = base - alto - 12;
    const ok = v.resultado;
    const color = ok ? "#4ade80" : "#f87171";
    const pulso = 1 + Math.sin(v.anim * Math.PI) * 0.04;
    ctx.save();
    ctx.translate(w / 2, y + alto / 2);
    ctx.scale(pulso, pulso);
    conBrillo(ctx, color, 16, () => {
      rr(ctx, -ancho / 2, -alto / 2, ancho, alto, 12);
      ctx.fillStyle = "rgba(8, 12, 10, 0.92)";
      ctx.fill();
    });
    rr(ctx, -ancho / 2, -alto / 2, ancho, alto, 12);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    texto(ctx, `${v.tipo === "elif" ? "elif" : v.tipo === "while" ? "while" : "if"} ${v.texto}`, -ancho / 2 + 14, 0, {
      fuente: `600 13px ${FUENTE_MONO}`,
      color: "#e5e7eb",
      align: "left",
      maxAncho: ancho - 140,
    });
    texto(ctx, ok ? "✓ VERDADERO" : "✗ FALSO", ancho / 2 - 12, 0, { fuente: `700 13px ${FUENTE}`, color, align: "right" });
    ctx.restore();
  }

  dibujarMensaje(ctx, w, yCentro) {
    const m = this.mensaje;
    if (!m) return;
    const colores = { positivo: "#4ade80", negativo: "#f87171", neutral: "#fbbf24" };
    const color = colores[m.tono];
    const prefijo = m.tono === "positivo" ? "★ " : m.tono === "negativo" ? "✗ " : "";
    const escala = 0.6 + 0.4 * facilitar(m.anim);
    ctx.save();
    ctx.globalAlpha = Math.min(1, m.anim * 1.5);
    ctx.translate(w / 2, yCentro);
    ctx.scale(escala, escala);
    ctx.font = `700 22px ${FUENTE}`;
    const ancho = Math.min(w - 50, ctx.measureText(`${prefijo}${m.texto}`).width + 40);
    conBrillo(ctx, color, 18, () => {
      rr(ctx, -ancho / 2, -26, ancho, 52, 14);
      ctx.fillStyle = "rgba(6, 10, 8, 0.93)";
      ctx.fill();
    });
    rr(ctx, -ancho / 2, -26, ancho, 52, 14);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    texto(ctx, `${prefijo}${m.texto}`, 0, 1, { fuente: `700 22px ${FUENTE}`, color, maxAncho: ancho - 24 });
    ctx.restore();
  }
}
