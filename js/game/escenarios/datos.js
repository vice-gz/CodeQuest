// datos.js
// Mundo 2 (Memoria): el Centro de Recuperación. No hay robot en movimiento:
// cada variable ocupa un "chip" de memoria que se ilumina al asignarla, los
// valores fluyen por cables luminosos desde los chips que se leen hasta el
// chip destino o hasta la terminal (print). Todo lo dibujado sale del estado
// real que reporta el intérprete.

import { EscenarioBase } from "./base.js";
import { rr, texto, conBrillo, mascota, FUENTE_MONO, facilitar } from "./dibujo.js";
import { BIBLIOTECA_SIN_OBJETOS } from "../../interpreter/bibliotecas.js";
import { Errores } from "../../interpreter/errors.js";
import { reprPython, etiquetaDeTipo } from "../../interpreter/valores.js";
import { paletaDe } from "../paletas.js";

export const formatearValor = reprPython;
export const tipoDeValor = etiquetaDeTipo;

export class EscenarioDatos extends EscenarioBase {
  constructor(config, opciones) {
    super({ ...config, mundo: 2 }, opciones);
    this.capacidad = config.capacidad ?? 8;
    this.p = paletaDe(2);
    this.reiniciarModelo();
  }

  get tipo() {
    return "datos";
  }
  get biblioteca() {
    return BIBLIOTECA_SIN_OBJETOS;
  }
  get tituloPanel() {
    return "Centro de Recuperación · Memoria";
  }
  get tituloEstado() {
    return null; // en este mundo manda el panel de Memoria
  }
  get textoObserva() {
    return "Ejecuta el código y observa cómo se llenan los módulos de memoria.";
  }
  get textoProtagonista() {
    return "tu programa";
  }

  reiniciarModelo() {
    this.slots = new Map(); // nombre -> {valor, anterior, t0}
    for (const [n, v] of Object.entries(this.config.variables || {})) this.slots.set(n, { valor: v, anterior: undefined, t0: -1e9 });
    this.terminal = [];
    this.flujos = [];
    this.esperandoEntrada = false;
    this.terminalFlash = 0;
    this.reloj = 0;
  }

  reiniciar() {
    this.reiniciarModelo();
    this.render();
  }

  snapshot() {
    return { variables: Object.fromEntries([...this.slots].map(([n, s]) => [n, s.valor])) };
  }

  filasEstado() {
    return [];
  }

  evaluar(v) {
    if (v.tipo === "modulos") return this.slots.size >= (v.minimo ?? 1);
    return undefined;
  }

  // ---------- Motor: lo que el intérprete le pide al mundo ----------
  crearMotor(callbacks = {}) {
    const escenario = this;
    return {
      async print(valor, info = {}) {
        callbacks.onSalida?.({ tipo: "PRINT", valor });
        escenario.terminal.push({ texto: String(valor), tipo: "print" });
        if (escenario.terminal.length > 7) escenario.terminal.shift();
        await escenario.lanzarFlujos(info.fuentes || [], { terminal: true });
        await escenario.esperar(120);
      },

      async entrada(prompt) {
        if (typeof callbacks.pedirEntrada !== "function") throw Errores.entradaNoDisponible();
        escenario.esperandoEntrada = true;
        escenario.render();
        callbacks.onEntradaPendiente?.();
        const valor = await callbacks.pedirEntrada({ etiqueta: prompt });
        escenario.esperandoEntrada = false;
        callbacks.onSalida?.({ tipo: "ENTRADA", valor });
        escenario.terminal.push({ texto: String(valor), tipo: "entrada" });
        if (escenario.terminal.length > 7) escenario.terminal.shift();
        escenario.render();
        return valor;
      },

      async asignacion(nombre, valor, info = {}) {
        callbacks.onAsignacion?.(nombre, valor);
        const previo = escenario.slots.get(nombre);
        escenario.slots.set(nombre, { valor, anterior: previo?.valor, t0: escenario.reloj });
        await escenario.lanzarFlujos(info.fuentes || [], { destino: nombre, rapido: info.esContador });
        await escenario.esperar(info.esContador ? 0 : 120);
      },

      async metodo() {
        return undefined;
      },
    };
  }

  /** Cables luminosos desde los chips leídos hasta `destino` (chip) o la terminal. */
  async lanzarFlujos(fuentes, { destino = null, terminal = false, rapido = false }) {
    const origen = fuentes.filter((n) => this.slots.has(n) && n !== destino);
    this.flujos = origen.map((n) => ({ desde: n, hacia: destino, terminal, p: 0 }));
    if (!origen.length && terminal) this.terminalFlash = 1;
    await this.animar(rapido ? 140 : 380, (t) => {
      this.flujos.forEach((f) => {
        f.p = t;
      });
      this.reloj += 1;
      if (this.terminalFlash) this.terminalFlash = 1 - t;
    });
    this.flujos = [];
    this.terminalFlash = 0;
    this.render();
  }

  // ---------- Vista ----------
  ajustarTamano() {
    this.ajustarCanvas((w) => Math.max(250, Math.min(400, w * 0.62)));
  }

  distribucion() {
    const { w, h } = this.dimensiones();
    const ancho = w < 560;
    const margen = 14;
    const titulo = 26;
    const zonaTerminal = ancho
      ? { x: margen, y: h * 0.62, w: w - margen * 2, h: h * 0.38 - margen }
      : { x: w * 0.64, y: titulo + 10, w: w * 0.36 - margen, h: h - titulo - 10 - margen };
    const zonaChips = ancho
      ? { x: margen, y: titulo + 6, w: w - margen * 2, h: h * 0.62 - titulo - 12 }
      : { x: margen, y: titulo + 10, w: w * 0.64 - margen * 1.6, h: h - titulo - 10 - margen };
    const n = Math.max(this.capacidad, this.slots.size);
    const cols = 4;
    const filas = Math.ceil(n / cols);
    const gap = 8;
    const cw = (zonaChips.w - gap * (cols - 1)) / cols;
    const ch = Math.min(88, (zonaChips.h - gap * (filas - 1)) / filas);
    return { w, h, zonaTerminal, zonaChips, cols, filas, gap, cw, ch, n };
  }

  posicionChip(d, indice) {
    const col = indice % d.cols;
    const fila = Math.floor(indice / d.cols);
    return { x: d.zonaChips.x + col * (d.cw + d.gap), y: d.zonaChips.y + fila * (d.ch + d.gap) };
  }

  render() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const d = this.distribucion();
    const { w, h } = d;
    const p = this.p;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = p.fondo;
    ctx.fillRect(0, 0, w, h);

    // circuito de fondo
    ctx.strokeStyle = "rgba(167, 139, 250, 0.07)";
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 28) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 28) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    texto(ctx, "MÓDULOS DE MEMORIA", 14, 14, { fuente: `600 11px ${FUENTE_MONO}`, color: p.acento, align: "left" });
    mascota(ctx, w - 22, 16, 9, { color: p.acento });

    const nombres = [...this.slots.keys()];
    for (let i = 0; i < d.n; i++) this.dibujarChip(ctx, d, i, nombres[i]);
    this.dibujarFlujos(ctx, d, nombres);
    this.dibujarTerminal(ctx, d);
  }

  dibujarChip(ctx, d, i, nombre) {
    const { x, y } = this.posicionChip(d, i);
    const { cw, ch } = d;
    const p = this.p;
    const slot = nombre ? this.slots.get(nombre) : null;
    const reciente = slot ? Math.max(0, 1 - (this.reloj - slot.t0) / 30) : 0;

    // patas del chip
    ctx.fillStyle = slot ? p.acento : "#2a2742";
    for (let k = 0; k < 4; k++) {
      const px = x + 10 + k * ((cw - 20) / 3.2);
      ctx.fillRect(px, y - 3, 4, 4);
      ctx.fillRect(px, y + ch - 1, 4, 4);
    }

    conBrillo(ctx, slot ? p.glow : "transparent", slot ? 10 + reciente * 18 : 0, () => {
      rr(ctx, x, y, cw, ch, 8);
      ctx.fillStyle = slot ? "#1b1633" : "#0f0d1f";
      ctx.fill();
    });
    rr(ctx, x, y, cw, ch, 8);
    ctx.lineWidth = slot ? 2 : 1.5;
    ctx.strokeStyle = slot ? p.acento : "#2a2742";
    if (!slot) ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    if (!slot) {
      texto(ctx, "libre", x + cw / 2, y + ch / 2, { fuente: `500 11px ${FUENTE_MONO}`, color: "#4b4670" });
      return;
    }
    texto(ctx, nombre, x + 8, y + 12, { fuente: `600 11px ${FUENTE_MONO}`, color: p.acento2, align: "left", maxAncho: cw - 16 });
    texto(ctx, formatearValor(slot.valor), x + cw / 2, y + ch / 2 + 2, {
      fuente: `700 ${Math.max(14, Math.min(22, ch * 0.3))}px ${FUENTE_MONO}`,
      color: "#f5f3ff",
      maxAncho: cw - 14,
    });
    texto(ctx, tipoDeValor(slot.valor), x + 8, y + ch - 10, { fuente: `600 9px ${FUENTE_MONO}`, color: "#8b86b5", align: "left" });
    if (slot.anterior !== undefined && reciente > 0.05) {
      ctx.globalAlpha = reciente;
      texto(ctx, `antes: ${formatearValor(slot.anterior)}`, x + cw - 8, y + ch - 10, {
        fuente: `500 9px ${FUENTE_MONO}`,
        color: "#c4b5fd",
        align: "right",
        maxAncho: cw * 0.6,
      });
      ctx.globalAlpha = 1;
    }
  }

  dibujarFlujos(ctx, d, nombres) {
    const centro = (nombre) => {
      const i = nombres.indexOf(nombre);
      const { x, y } = this.posicionChip(d, i);
      return { x: x + d.cw / 2, y: y + d.ch / 2 };
    };
    for (const f of this.flujos) {
      const a = centro(f.desde);
      const b = f.terminal
        ? { x: d.zonaTerminal.x + d.zonaTerminal.w / 2, y: d.zonaTerminal.y + 20 }
        : f.hacia && nombres.includes(f.hacia)
          ? centro(f.hacia)
          : a;
      const cx = (a.x + b.x) / 2;
      const cy = Math.min(a.y, b.y) - 24;
      conBrillo(ctx, this.p.acento, 12, () => {
        ctx.strokeStyle = this.p.acento2;
        ctx.lineWidth = 2.5;
        ctx.setLineDash([6, 6]);
        ctx.lineDashOffset = -f.p * 40;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.quadraticCurveTo(cx, cy, b.x, b.y);
        ctx.stroke();
      });
      ctx.setLineDash([]);
      // el "dato" que viaja por el cable
      const t = facilitar(f.p);
      const px = (1 - t) ** 2 * a.x + 2 * (1 - t) * t * cx + t ** 2 * b.x;
      const py = (1 - t) ** 2 * a.y + 2 * (1 - t) * t * cy + t ** 2 * b.y;
      conBrillo(ctx, "#fff", 14, () => {
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(px, py, 4.5, 0, Math.PI * 2);
        ctx.fill();
      });
    }
  }

  dibujarTerminal(ctx, d) {
    const z = d.zonaTerminal;
    const p = this.p;
    conBrillo(ctx, this.terminalFlash > 0 ? p.acento : "transparent", 16 * this.terminalFlash, () => {
      rr(ctx, z.x, z.y, z.w, z.h, 10);
      ctx.fillStyle = "#07060f";
      ctx.fill();
    });
    rr(ctx, z.x, z.y, z.w, z.h, 10);
    ctx.strokeStyle = this.terminalFlash > 0 ? p.acento2 : "#2e2a55";
    ctx.lineWidth = 2;
    ctx.stroke();
    texto(ctx, "TERMINAL", z.x + 10, z.y + 12, { fuente: `600 10px ${FUENTE_MONO}`, color: "#6d68a0", align: "left" });

    const lineas = this.terminal.slice(-Math.floor((z.h - 30) / 17));
    lineas.forEach((l, i) => {
      texto(ctx, `${l.tipo === "entrada" ? "‹ " : "› "}${l.texto}`, z.x + 10, z.y + 32 + i * 17, {
        fuente: `500 12px ${FUENTE_MONO}`,
        color: l.tipo === "entrada" ? "#c4b5fd" : "#86efac",
        align: "left",
        maxAncho: z.w - 20,
      });
    });
    if (this.esperandoEntrada) {
      texto(ctx, "esperando entrada… ▌", z.x + 10, z.y + z.h - 14, { fuente: `500 11px ${FUENTE_MONO}`, color: p.acento2, align: "left" });
    }
  }
}
