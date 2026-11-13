// minijuego.js
// Base de los MINIJUEGOS del Mundo 1 (Fundamentos y Datos): alcancía, semáforo, vasos, receta, pozo, cronómetro, boleta,
// viaje y caja fuerte. Todos funcionan igual por dentro y solo cambia el dibujo:
//   - el MODELO es la memoria del programa (this.vars, valores planos de JavaScript) más lo que cada escena quiera recordar;
//   - el MOTOR recibe del intérprete cada print, input y asignación y avisa a la escena (alImprimir / alAsignar / alEntrar),
//     que puede animar algo (una moneda que cae, un líquido que se vierte…) antes de que el programa siga;
//   - la VISTA son formas geométricas sencillas en Canvas (sin imágenes), con una franja de «pantalla» abajo que muestra el
//     último print.
// Sin canvas (pruebas y casos silenciosos) todo se comporta igual pero sin dibujar ni esperar.
//
// Para crear otra escena: extiende EscenarioMinijuego, define tipo / tituloPanel / textoObserva, y dibuja en
// dibujarEscena(ctx, zona). Si reacciona a algo, redefine alAsignar(nombre, valor, anterior, info) o alImprimir(texto).

import { EscenarioBase } from "./base.js";
import { rr, texto, FUENTE, FUENTE_MONO } from "./dibujo.js";
import { BIBLIOTECA_SIN_OBJETOS } from "../../interpreter/bibliotecas.js";
import { Errores } from "../../interpreter/errors.js";
import { aJS, formatear } from "../../interpreter/valores.js";

export const COLORES = {
  fondo: "#0b1226",
  fondo2: "#121c38",
  linea: "rgba(148, 178, 255, 0.22)",
  texto: "#eef3ff",
  suave: "#9fb0d6",
  cian: "#00e5ff",
  verde: "#38f997",
  rojo: "#ff5c7c",
  amarillo: "#ffd166",
  naranja: "#ff9f43",
  rosa: "#ff8fb1",
  morado: "#b37eff",
};

export const ahora = () => (typeof performance !== "undefined" ? performance.now() : Date.now());

/** Número para dibujar (o null si la variable no existe o no es número). */
export const num = (v) => (typeof v === "number" && Number.isFinite(v) ? v : null);

/** Cómo se ve un valor en el dibujo: 2.5, True, "agua" → agua. */
export const mostrar = (v) => (v === undefined ? "—" : typeof v === "boolean" ? (v ? "True" : "False") : formatear(v));

export class EscenarioMinijuego extends EscenarioBase {
  constructor(config, opciones) {
    super({ ...config, mundo: 1 }, opciones);
    this.reiniciarModelo();
    this.iniciarReposo();
  }

  get biblioteca() {
    return BIBLIOTECA_SIN_OBJETOS;
  }
  get tituloEstado() {
    return null; // manda el panel de Memoria
  }
  get textoProtagonista() {
    return "tu programa";
  }
  /** Alto deseado del lienzo para un ancho dado. */
  altoPara(w) {
    return Math.max(250, Math.min(380, w * 0.6));
  }

  // ---------- Modelo ----------
  reiniciarModelo() {
    this.vars = { ...(this.config.variables || {}) };
    this.pantalla = []; // últimos print (y entradas) para la franja de abajo
    this.cambio = { nombre: null, t: -1e9 }; // última variable que cambió (para resaltarla)
    this.esperandoEntrada = false;
    this.modeloPropio();
  }
  /** Lo que cada escena guarda además de las variables. */
  modeloPropio() {}

  reiniciar() {
    this.reiniciarModelo();
    this.render();
  }

  snapshot() {
    return { variables: { ...this.vars } };
  }

  /** ¿La variable cambió hace poco? (0..1, 1 = recién cambiada) para resaltarla en el dibujo. */
  brillo(nombre, ms = 900) {
    if (this.cambio.nombre !== nombre) return 0;
    return Math.max(0, 1 - (ahora() - this.cambio.t) / ms);
  }

  // ---------- Reacciones (cada escena redefine las que necesite) ----------
  async alAsignar() {}
  async alImprimir() {}
  async alEntrar() {}
  async alCondicion() {}
  /** Métodos de un objeto del escenario (pozo.bajar()...). undefined = no existe. */
  async metodo() {
    return undefined;
  }

  // ---------- Motor ----------
  crearMotor(callbacks = {}) {
    const esc = this;
    const anotar = (t, tipo) => {
      esc.pantalla.push({ texto: String(t), tipo });
      if (esc.pantalla.length > 3) esc.pantalla.shift();
    };
    return {
      async print(valor) {
        callbacks.onSalida?.({ tipo: "PRINT", valor });
        anotar(valor, "print");
        await esc.alImprimir(String(valor));
        esc.render();
        await esc.esperar(160);
      },
      async entrada(prompt) {
        if (typeof callbacks.pedirEntrada !== "function") throw Errores.entradaNoDisponible();
        esc.esperandoEntrada = true;
        esc.render();
        callbacks.onEntradaPendiente?.();
        const valor = await callbacks.pedirEntrada({ etiqueta: prompt });
        esc.esperandoEntrada = false;
        callbacks.onSalida?.({ tipo: "ENTRADA", valor });
        anotar(`> ${valor}`, "entrada");
        await esc.alEntrar(String(valor));
        esc.render();
        return valor;
      },
      async asignacion(nombre, valor, info = {}) {
        callbacks.onAsignacion?.(nombre, valor);
        const anterior = esc.vars[nombre];
        const plano = aJS(valor);
        esc.vars[nombre] = plano;
        esc.cambio = { nombre, t: ahora() };
        await esc.alAsignar(nombre, plano, anterior, info);
        esc.render();
        await esc.esperar(info.esContador ? 0 : 140);
      },
      async condicion(textoCondicion, resultado, info) {
        await esc.alCondicion(textoCondicion, resultado, info);
      },
      async metodo(objeto, nombre, args = []) {
        const r = await esc.metodo(objeto, nombre, args, callbacks);
        esc.render();
        return r;
      },
    };
  }

  // ---------- Vista ----------
  ajustarTamano() {
    this.ajustarCanvas((w) => this.altoPara(w));
  }

  render() {
    if (!this.ctx) return;
    const { w, h } = this.dimensiones();
    if (!(w > 0 && h > 0)) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = this.colorFondo || COLORES.fondo;
    ctx.fillRect(0, 0, w, h);
    const franja = 34;
    this.dibujarEscena(ctx, { x: 0, y: 0, w, h: h - franja });
    this.dibujarPantalla(ctx, { x: 0, y: h - franja, w, h: franja });
    ctx.restore();
  }

  dibujarEscena() {}

  /** Franja inferior: el último print, como la pantallita de una máquina. */
  dibujarPantalla(ctx, z) {
    ctx.fillStyle = "#060a16";
    ctx.fillRect(z.x, z.y, z.w, z.h);
    ctx.fillStyle = COLORES.linea;
    ctx.fillRect(z.x, z.y, z.w, 1);
    const ultimo = this.pantalla.at(-1);
    const t = this.esperandoEntrada ? "Esperando tu respuesta en la terminal…" : ultimo ? ultimo.texto : "La salida de print() aparecerá aquí";
    const color = this.esperandoEntrada ? COLORES.amarillo : ultimo ? (ultimo.tipo === "entrada" ? COLORES.amarillo : COLORES.verde) : COLORES.suave;
    texto(ctx, `▸ ${t}`, z.x + 12, z.y + z.h / 2, { fuente: `500 13px ${FUENTE_MONO}`, color, align: "left", maxAncho: z.w - 24 });
  }

  // ---------- Utilidades de dibujo comunes ----------
  titulo(ctx, str, x, y, color = COLORES.texto, tam = 15) {
    texto(ctx, str, x, y, { fuente: `700 ${tam}px ${FUENTE}`, color });
  }

  /** Etiqueta «nombre = valor» con un resaltado si acaba de cambiar. */
  etiquetaVariable(ctx, nombre, x, y, { ancho = 130, align = "center" } = {}) {
    const v = this.vars[nombre];
    const b = this.brillo(nombre);
    const x0 = align === "center" ? x - ancho / 2 : x;
    rr(ctx, x0, y - 12, ancho, 24, 7);
    ctx.fillStyle = b > 0 ? `rgba(56, 249, 151, ${0.15 + 0.35 * b})` : "rgba(15, 26, 54, 0.9)";
    ctx.fill();
    ctx.strokeStyle = v === undefined ? COLORES.linea : b > 0 ? COLORES.verde : "rgba(0, 229, 255, 0.45)";
    ctx.lineWidth = 1.2;
    ctx.stroke();
    texto(ctx, `${nombre} = ${v === undefined ? "?" : typeof v === "string" ? `"${v}"` : mostrar(v)}`, x0 + ancho / 2, y, {
      fuente: `600 12px ${FUENTE_MONO}`,
      color: v === undefined ? COLORES.suave : COLORES.texto,
      maxAncho: ancho - 10,
    });
  }

  /** Sello grande (APROBADO, ¡ABIERTA!...) inclinado. */
  sello(ctx, str, x, y, color, escala = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.16);
    ctx.scale(escala, escala);
    ctx.font = `800 22px ${FUENTE}`;
    const ancho = Math.max(90, (ctx.measureText?.(str)?.width ?? 90) + 26);
    rr(ctx, -ancho / 2, -19, ancho, 38, 8);
    ctx.lineWidth = 3;
    ctx.strokeStyle = color;
    ctx.stroke();
    texto(ctx, str, 0, 1, { fuente: `800 22px ${FUENTE}`, color });
    ctx.restore();
  }
}
