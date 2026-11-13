// datos.js
// Consola de datos (Mundo 1 · Fundamentos y Datos, antes Mundo 2 «Memoria»): un sistema vivo bioluminiscente en azul profundo
// y cian eléctrico. Cada variable habita un nodo circular flotante que emite ondas expansivas
// al cambiar de valor y se conecta mediante filamentos de energía cian con los nodos de origen
// o con la bio-terminal, mientras Nix (el ajolote cósmico) observa desde la esquina inferior derecha.

import { EscenarioBase } from "./base.js";
import { rr, texto, conBrillo, dibujarMascota, gradRadial, FUENTE_MONO, facilitar, capaCacheada } from "./dibujo.js";
import { BIBLIOTECA_SIN_OBJETOS } from "../../interpreter/bibliotecas.js";
import { Errores } from "../../interpreter/errors.js";
import { reprPython, etiquetaDeTipo } from "../../interpreter/valores.js";
import { PALETA_MEMORIA } from "../paletas.js";

export const formatearValor = reprPython;
export const tipoDeValor = etiquetaDeTipo;

const PALETA_ECOSISTEMA = {
  fondoTop: "#040C1C",
  fondoMid: "#071733",
  fondoBot: "#0A2348",
  cian: "#00E5FF",
  cianSuave: "#38BDF8",
  azulLuz: "#7DD3FC",
  nodoActivo: "#0B294E",
  nodoNucleo: "#0F3868",
  nodoVacio: "rgba(11, 34, 68, 0.48)",
  bordeVacio: "rgba(56, 189, 248, 0.24)",
  glow: "rgba(0, 229, 255, 0.52)",
};

export class EscenarioDatos extends EscenarioBase {
  constructor(config, opciones) {
    super({ ...config, mundo: 1 }, opciones);
    this.capacidad = config.capacidad ?? 8;
    this.p = PALETA_MEMORIA;
    this.reiniciarModelo();
    this.iniciarReposo();
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
    this.slots = new Map(); // nombre -> {valor, anterior, t0, tsCambio, fuentes}
    for (const [n, v] of Object.entries(this.config.variables || {})) {
      this.slots.set(n, { valor: v, anterior: undefined, t0: -1e9, tsCambio: -1e9, fuentes: [] });
    }
    this.terminal = [];
    this.flujos = [];
    this.ondas = []; // ondas expansivas [{ nombre, inicioMs, duracionMs }]
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
        const ahora = typeof performance !== "undefined" ? performance.now() : 0;
        const fuentesValidas = (info.fuentes || []).filter((n) => escenario.slots.has(n) && n !== nombre);
        escenario.slots.set(nombre, {
          valor,
          anterior: previo?.valor,
          t0: escenario.reloj,
          tsCambio: ahora,
          fuentes: fuentesValidas.length ? fuentesValidas : previo?.fuentes || [],
        });
        escenario.ondas.push({ nombre, inicioMs: ahora, duracionMs: 850, p: 0 });
        if (escenario.ondas.length > 14) escenario.ondas.shift();
        await escenario.lanzarFlujos(info.fuentes || [], { destino: nombre, rapido: info.esContador });
        await escenario.esperar(info.esContador ? 0 : 120);
      },

      async metodo() {
        return undefined;
      },
    };
  }

  /** Líneas de energía cian desde los nodos leídos hasta `destino` (nodo) o la terminal. */
  async lanzarFlujos(fuentes, { destino = null, terminal = false, rapido = false }) {
    const origen = fuentes.filter((n) => this.slots.has(n) && n !== destino);
    this.flujos = origen.map((n) => ({ desde: n, hacia: destino, terminal, p: 0 }));
    if (!origen.length && terminal) this.terminalFlash = 1;
    const ondaActual = this.ondas.at(-1);
    await this.animar(rapido ? 140 : 380, (t) => {
      this.flujos.forEach((f) => {
        f.p = t;
      });
      if (ondaActual) ondaActual.p = t;
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

  posicionChip(d, indice, tiempoSeg = 0) {
    const col = indice % d.cols;
    const fila = Math.floor(indice / d.cols);
    // Desplazamiento orgánico senoidal para que los nodos floten como células/nodos vivos
    const fase = indice * 1.37 + fila * 0.8;
    const dx = this.reducido ? 0 : Math.cos(tiempoSeg * 1.5 + fase) * 2.6;
    const dy = this.reducido ? 0 : Math.sin(tiempoSeg * 2.1 + fase) * 4.2 + (col % 2 === 1 ? 3 : -2);
    return {
      x: d.zonaChips.x + col * (d.cw + d.gap) + dx,
      y: d.zonaChips.y + fila * (d.ch + d.gap) + dy,
    };
  }

  centroNodo(d, indice, tiempoSeg = 0) {
    const pos = this.posicionChip(d, indice, tiempoSeg);
    return {
      x: pos.x + d.cw / 2,
      y: pos.y + d.ch / 2,
      r: Math.max(18, Math.min(d.cw, d.ch) * 0.44),
    };
  }

  render() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const d = this.distribucion();
    const { w, h } = d;
    const ahoraMs = typeof performance !== "undefined" ? performance.now() : 0;
    const tSeg = this.reducido ? 0 : ahoraMs * 0.001;

    ctx.clearRect(0, 0, w, h);

    // 1. Fondo bioluminiscente azul profundo («El Ecosistema de Datos») + resplandor ambiental sumergido.
    //    Es lo mismo en todos los cuadros: se pinta una vez en una capa en caché y luego solo se copia.
    capaCacheada(this, "fondo", ctx, w, h, `${d.zonaChips.x | 0},${d.zonaChips.y | 0},${d.zonaChips.w | 0},${d.zonaChips.h | 0}`, (c) => {
      const gradFondo = c.createLinearGradient(0, 0, 0, h);
      gradFondo.addColorStop(0, PALETA_ECOSISTEMA.fondoTop);
      gradFondo.addColorStop(0.55, PALETA_ECOSISTEMA.fondoMid);
      gradFondo.addColorStop(1, PALETA_ECOSISTEMA.fondoBot);
      c.fillStyle = gradFondo;
      c.fillRect(0, 0, w, h);
      c.fillStyle = gradRadial(
        c,
        d.zonaChips.x + d.zonaChips.w * 0.48,
        d.zonaChips.y + d.zonaChips.h * 0.5,
        10,
        d.zonaChips.x + d.zonaChips.w * 0.48,
        d.zonaChips.y + d.zonaChips.h * 0.5,
        Math.max(w, h) * 0.55,
        [
          [0, "rgba(0, 229, 255, 0.12)"],
          [0.5, "rgba(56, 189, 248, 0.05)"],
          [1, "rgba(4, 12, 28, 0)"],
        ],
        "rgba(0, 229, 255, 0.04)"
      );
      c.fillRect(0, 0, w, h);
    });

    // 2. Red orgánica y esporas de datos de fondo
    this.dibujarFondoOrganico(ctx, w, h, tSeg);

    // Encabezado del ecosistema
    texto(ctx, "ECOSISTEMA DE DATOS · NODOS DE MEMORIA", 14, 15, {
      fuente: `700 11px ${FUENTE_MONO}`,
      color: PALETA_ECOSISTEMA.cian,
      align: "left",
    });

    const nombres = [...this.slots.keys()];

    // 3. Conexiones de energía persistentes entre nodos con dependencias y ondas expansivas
    this.dibujarConexionesSinapticas(ctx, d, nombres, tSeg);
    this.dibujarOndasExpansivas(ctx, d, nombres, ahoraMs, tSeg);

    // 4. Nodos flotantes circulares
    for (let i = 0; i < d.n; i++) {
      this.dibujarNodo(ctx, d, i, nombres[i], ahoraMs, tSeg);
    }

    // 5. Rayos de energía activa (flujos en curso)
    this.dibujarFlujos(ctx, d, nombres, tSeg);

    // 6. Bio-Terminal
    this.dibujarTerminal(ctx, d);

    // 7. Mascota (Ajolote cósmico Nix) en la esquina inferior derecha observando los nodos
    const mascotaX = w < 560 ? w - 34 : d.zonaChips.x + d.zonaChips.w - 18;
    const mascotaY = w < 560 ? d.zonaChips.y + d.zonaChips.h - 22 : h - 34;
    dibujarMascota(ctx, mascotaX, mascotaY, 15, {
      color: PALETA_ECOSISTEMA.cian,
      acento: "#A855F7",
      mirada: -0.6,
      anim: tSeg * 1.8,
      estado: this.flujos.length > 0 ? "exito" : "normal",
    });
  }

  dibujarFondoOrganico(ctx, w, h, tSeg) {
    ctx.save();
    // Ondas corrientes submarinas / bio-digitales
    ctx.strokeStyle = "rgba(0, 229, 255, 0.06)";
    ctx.lineWidth = 1.2;
    for (let fila = 0; fila < 5; fila++) {
      const yBase = (h / 5) * (fila + 0.5);
      ctx.beginPath();
      for (let x = 0; x <= w; x += 24) {
        const y = yBase + Math.sin(x * 0.018 + tSeg * 1.2 + fila) * 8;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Bioluminiscencia flotante (partículas de datos)
    for (let i = 0; i < 14; i++) {
      const px = ((i * 73 + Math.sin(tSeg + i) * 16) % Math.max(1, w));
      const py = ((i * 47 + Math.cos(tSeg * 0.8 + i * 1.3) * 14) % Math.max(1, h));
      const r = 1.2 + (i % 3) * 0.7;
      ctx.fillStyle = i % 2 === 0 ? "rgba(0, 229, 255, 0.25)" : "rgba(125, 211, 252, 0.18)";
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  dibujarConexionesSinapticas(ctx, d, nombres, tSeg) {
    ctx.save();
    // Filamentos suaves entre nodos ocupados consecutivos (red viva)
    for (let i = 0; i < nombres.length - 1; i++) {
      const a = this.centroNodo(d, i, tSeg);
      const b = this.centroNodo(d, i + 1, tSeg);
      ctx.strokeStyle = "rgba(56, 189, 248, 0.14)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.quadraticCurveTo((a.x + b.x) / 2, (a.y + b.y) / 2 - 10, b.x, b.y);
      ctx.stroke();
    }

    // Líneas de energía cian entre nodos de origen y nodo de destino cuando una variable usó a otra
    nombres.forEach((nombreDestino, idxDestino) => {
      const slot = this.slots.get(nombreDestino);
      if (!slot || !slot.fuentes?.length) return;
      const b = this.centroNodo(d, idxDestino, tSeg);
      for (const nombreOrigen of slot.fuentes) {
        const idxOrigen = nombres.indexOf(nombreOrigen);
        if (idxOrigen < 0 || idxOrigen === idxDestino) continue;
        const a = this.centroNodo(d, idxOrigen, tSeg);
        const mx = (a.x + b.x) / 2;
        const my = Math.min(a.y, b.y) - 18;
        conBrillo(ctx, PALETA_ECOSISTEMA.cian, 8, () => {
          ctx.strokeStyle = "rgba(0, 229, 255, 0.48)";
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.lineDashOffset = -tSeg * 22;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.quadraticCurveTo(mx, my, b.x, b.y);
          ctx.stroke();
        });
        ctx.setLineDash([]);
      }
    });
    ctx.restore();
  }

  dibujarOndasExpansivas(ctx, d, nombres, ahoraMs, tSeg) {
    // Filtramos ondas vigentes o con progreso activo
    this.ondas = this.ondas.filter((o) => {
      const edad = ahoraMs > 0 && o.inicioMs > 0 ? (ahoraMs - o.inicioMs) / o.duracionMs : o.p;
      return edad < 1;
    });

    for (const o of this.ondas) {
      const idx = nombres.indexOf(o.nombre);
      if (idx < 0) continue;
      const progreso = Math.max(
        o.p || 0,
        ahoraMs > 0 && o.inicioMs > 0 ? Math.min(1, (ahoraMs - o.inicioMs) / o.duracionMs) : 0
      );
      if (progreso <= 0 || progreso >= 1) continue;
      const { x, y, r } = this.centroNodo(d, idx, tSeg);
      const radioOnda = r * (1.05 + facilitar(progreso) * 1.45);
      const alfa = (1 - progreso) * 0.85;

      ctx.save();
      ctx.strokeStyle = `rgba(0, 229, 255, ${alfa.toFixed(3)})`;
      ctx.lineWidth = 2.6 * (1 - progreso * 0.6);
      ctx.beginPath();
      ctx.arc(x, y, radioOnda, 0, Math.PI * 2);
      ctx.stroke();

      // Segunda onda armónica interior
      if (progreso > 0.15) {
        const p2 = (progreso - 0.15) / 0.85;
        ctx.strokeStyle = `rgba(125, 211, 252, ${((1 - p2) * 0.5).toFixed(3)})`;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(x, y, r * (1.0 + p2 * 1.1), 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  dibujarNodo(ctx, d, i, nombre, ahoraMs, tSeg) {
    const { x: cx, y: cy, r } = this.centroNodo(d, i, tSeg);
    const slot = nombre ? this.slots.get(nombre) : null;
    const recientePorReloj = slot ? Math.max(0, 1 - (this.reloj - slot.t0) / 30) : 0;
    const recientePorTiempo = slot && ahoraMs > 0 && slot.tsCambio > 0 ? Math.max(0, 1 - (ahoraMs - slot.tsCambio) / 900) : 0;
    const reciente = Math.max(recientePorReloj, recientePorTiempo);

    // Si recién cambió y aún no hay onda registrada en la lista, dibujamos una onda inmediata basada en `reciente`
    if (slot && reciente > 0.05 && !this.ondas.some((o) => o.nombre === nombre)) {
      const pOnda = 1 - reciente;
      ctx.save();
      ctx.strokeStyle = `rgba(0, 229, 255, ${(reciente * 0.75).toFixed(3)})`;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(cx, cy, r * (1.08 + pOnda * 1.2), 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    if (!slot) {
      // Nodo celular latente (vacío)
      ctx.save();
      ctx.fillStyle = PALETA_ECOSISTEMA.nodoVacio;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.86, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = PALETA_ECOSISTEMA.bordeVacio;
      ctx.lineWidth = 1.4;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.86, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Pequeño núcleo latente
      ctx.fillStyle = "rgba(56, 189, 248, 0.16)";
      ctx.beginPath();
      ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
      ctx.fill();

      texto(ctx, "libre", cx, cy + r * 0.42, {
        fuente: `500 10px ${FUENTE_MONO}`,
        color: "rgba(125, 211, 252, 0.42)",
      });
      ctx.restore();
      return;
    }

    // Nodo vivo activo
    ctx.save();
    // Membrana exterior bioluminiscente
    conBrillo(ctx, PALETA_ECOSISTEMA.cian, 12 + reciente * 18, () => {
      ctx.fillStyle = gradRadial(
        ctx,
        cx - r * 0.22,
        cy - r * 0.22,
        r * 0.1,
        cx,
        cy,
        r,
        [
          [0, "#134E80"],
          [0.65, PALETA_ECOSISTEMA.nodoActivo],
          [1, "#061830"],
        ],
        PALETA_ECOSISTEMA.nodoActivo
      );
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Anillo principal cian eléctrico
    ctx.strokeStyle = reciente > 0.1 ? "#FFFFFF" : PALETA_ECOSISTEMA.cian;
    ctx.lineWidth = 2.2 + reciente * 1.4;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();

    // Anillo orbital interno
    ctx.strokeStyle = "rgba(125, 211, 252, 0.35)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.82, 0, Math.PI * 2);
    ctx.stroke();

    // Etiqueta del nombre de la variable (cápsula superior sobre el nodo)
    const maxAnchoTexto = r * 1.75;
    texto(ctx, nombre, cx, cy - r * 0.52, {
      fuente: `700 10px ${FUENTE_MONO}`,
      color: PALETA_ECOSISTEMA.cian,
      maxAncho: maxAnchoTexto,
    });

    // Valor central brillante
    texto(ctx, formatearValor(slot.valor), cx, cy + 1, {
      fuente: `700 ${Math.max(13, Math.min(19, r * 0.56))}px ${FUENTE_MONO}`,
      color: "#F0F9FF",
      maxAncho: maxAnchoTexto,
    });

    // Tipo de dato en la parte inferior del nodo
    texto(ctx, tipoDeValor(slot.valor), cx, cy + r * 0.54, {
      fuente: `600 9px ${FUENTE_MONO}`,
      color: PALETA_ECOSISTEMA.azulLuz,
    });

    if (slot.anterior !== undefined && reciente > 0.05) {
      ctx.globalAlpha = reciente;
      texto(ctx, `← ${formatearValor(slot.anterior)}`, cx, cy - r - 7, {
        fuente: `600 9px ${FUENTE_MONO}`,
        color: "#A5F3FC",
        maxAncho: d.cw,
      });
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  dibujarFlujos(ctx, d, nombres, tSeg) {
    const centro = (nombre) => {
      const i = nombres.indexOf(nombre);
      return this.centroNodo(d, Math.max(0, i), tSeg);
    };
    for (const f of this.flujos) {
      const a = centro(f.desde);
      const b = f.terminal
        ? { x: d.zonaTerminal.x + d.zonaTerminal.w / 2, y: d.zonaTerminal.y + 24 }
        : f.hacia && nombres.includes(f.hacia)
          ? centro(f.hacia)
          : a;
      const cx = (a.x + b.x) / 2;
      const cy = Math.min(a.y, b.y) - 26;

      // Línea de energía cian eléctrica
      conBrillo(ctx, PALETA_ECOSISTEMA.cian, 14, () => {
        ctx.strokeStyle = PALETA_ECOSISTEMA.cian;
        ctx.lineWidth = 3;
        ctx.setLineDash([7, 5]);
        ctx.lineDashOffset = -f.p * 44;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.quadraticCurveTo(cx, cy, b.x, b.y);
        ctx.stroke();
      });
      ctx.setLineDash([]);

      // Pulso de bio-energía que viaja por la línea
      const t = facilitar(f.p);
      const px = (1 - t) ** 2 * a.x + 2 * (1 - t) * t * cx + t ** 2 * b.x;
      const py = (1 - t) ** 2 * a.y + 2 * (1 - t) * t * cy + t ** 2 * b.y;
      conBrillo(ctx, PALETA_ECOSISTEMA.cian, 16, () => {
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.arc(px, py, 5.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = PALETA_ECOSISTEMA.cian;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(px, py, 9, 0, Math.PI * 2);
        ctx.stroke();
      });
    }
  }

  dibujarTerminal(ctx, d) {
    const z = d.zonaTerminal;
    conBrillo(ctx, this.terminalFlash > 0 ? PALETA_ECOSISTEMA.cian : "transparent", 16 * this.terminalFlash, () => {
      rr(ctx, z.x, z.y, z.w, z.h, 12);
      ctx.fillStyle = "rgba(4, 13, 28, 0.92)";
      ctx.fill();
    });
    rr(ctx, z.x, z.y, z.w, z.h, 12);
    ctx.strokeStyle = this.terminalFlash > 0 ? PALETA_ECOSISTEMA.cian : "rgba(0, 229, 255, 0.32)";
    ctx.lineWidth = 2;
    ctx.stroke();
    texto(ctx, "BIO-TERMINAL", z.x + 12, z.y + 13, {
      fuente: `700 10px ${FUENTE_MONO}`,
      color: PALETA_ECOSISTEMA.cianSuave,
      align: "left",
    });

    const lineas = this.terminal.slice(-Math.floor((z.h - 30) / 17));
    lineas.forEach((l, i) => {
      texto(ctx, `${l.tipo === "entrada" ? "‹ " : "› "}${l.texto}`, z.x + 12, z.y + 32 + i * 17, {
        fuente: `500 12px ${FUENTE_MONO}`,
        color: l.tipo === "entrada" ? "#7DD3FC" : "#00E5FF",
        align: "left",
        maxAncho: z.w - 24,
      });
    });
    if (this.esperandoEntrada) {
      texto(ctx, "esperando entrada… ▌", z.x + 12, z.y + z.h - 14, {
        fuente: `500 11px ${FUENTE_MONO}`,
        color: PALETA_ECOSISTEMA.cian,
        align: "left",
      });
    }
  }
}
