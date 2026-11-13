// pozo.js
// Mundo 1 · Nivel 15 «El Pozo» (ciclo while y contadores).
// Un pozo visto en corte: la cubeta cuelga de una cuerda y el agua está a `profundidad` metros (cada caso trae otra
// profundidad, así no se puede adivinar el número). El objeto `pozo` tiene:
//   pozo.bajar()      baja la cubeta 1 metro (si ya está en el agua y baja más, se atora: RUN_025)
//   pozo.hayAgua()    True si la cubeta ya llegó al agua
//   pozo.llenar()     llena la cubeta (solo funciona dentro del agua)
//   pozo.subir(n)     sube la cubeta n metros
// La forma de resolverlo es contar los metros mientras se baja:
//   metros = 0
//   while not pozo.hayAgua():
//       pozo.bajar()
//       metros += 1
//   pozo.llenar()
//   pozo.subir(metros)
//   print(metros)
//
// config: { tipo: "pozo", profundidad: 5 }
// Validación propia: { tipo: "pozo", lleno: true, arriba: true }

import { EscenarioMinijuego, COLORES } from "./minijuego.js";
import { rr, texto, FUENTE, FUENTE_MONO } from "./dibujo.js";
import { BIBLIOTECA_POZO } from "../../interpreter/bibliotecas.js";
import { Errores } from "../../interpreter/errors.js";

export class EscenarioPozo extends EscenarioMinijuego {
  get tipo() {
    return "pozo";
  }
  get biblioteca() {
    return BIBLIOTECA_POZO;
  }
  get tituloPanel() {
    return "El Pozo";
  }
  get tituloEstado() {
    return "Estado de la cubeta";
  }
  get textoObserva() {
    return "Ejecuta el código y observa la cubeta dentro del pozo.";
  }
  get textoProtagonista() {
    return "la cubeta";
  }
  get profundidad() {
    return this.config.profundidad ?? 5;
  }

  modeloPropio() {
    this.metros = 0; // a qué profundidad está la cubeta (0 = arriba)
    this.visual = 0; // posición dibujada (se anima hacia `metros`)
    this.lleno = false;
  }

  snapshot() {
    return { ...super.snapshot(), metros: this.metros, lleno: this.lleno, profundidad: this.profundidad };
  }

  filasEstado() {
    return [
      { etiqueta: "Profundidad de la cubeta", valor: `${this.metros} m` },
      { etiqueta: "¿Hay agua?", valor: this.metros >= this.profundidad ? "True" : "False" },
      { etiqueta: "Cubeta", valor: this.lleno ? "llena" : "vacía" },
    ];
  }

  evaluar(v) {
    if (v.tipo !== "pozo") return undefined;
    if (v.lleno && !this.lleno) return false;
    if (v.arriba && this.metros !== 0) return false;
    return true;
  }

  async moverA(destino) {
    const desde = this.visual;
    await this.animar(Math.min(500, 160 + 80 * Math.abs(destino - desde)), (t) => {
      this.visual = desde + (destino - desde) * t;
    });
    this.visual = destino;
  }

  async metodo(objeto, nombre, args, callbacks) {
    if (objeto !== "pozo") return undefined;
    const avisar = () => callbacks.onEstado?.(this.snapshot());
    switch (nombre) {
      case "bajar":
        if (this.metros >= this.profundidad) throw Errores.cubetaEnElFondo();
        this.metros += 1;
        await this.moverA(this.metros);
        avisar();
        return null;
      case "hayAgua":
        return this.metros >= this.profundidad;
      case "llenar":
        if (this.metros >= this.profundidad) this.lleno = true;
        else callbacks.onSalida?.({ tipo: "SISTEMA", valor: "La cubeta todavía no llega al agua: no se pudo llenar" });
        await this.esperar(300);
        avisar();
        return null;
      case "subir": {
        const n = Math.max(0, Math.floor(Number(args[0]) || 0));
        if (n > this.metros) callbacks.onSalida?.({ tipo: "SISTEMA", valor: `La cubeta solo estaba a ${this.metros} m: subió hasta arriba` });
        this.metros = Math.max(0, this.metros - n);
        await this.moverA(this.metros);
        avisar();
        return null;
      }
      default:
        return undefined;
    }
  }

  dibujarEscena(ctx, z) {
    const prof = this.profundidad;
    const niveles = Math.max(prof, 6);
    const top = z.y + 46;
    const fondo = z.y + z.h - 8;
    const m = (fondo - top - 10) / niveles; // píxeles por metro
    const cx = z.x + z.w * (z.w < 420 ? 0.52 : 0.42); // en celular se centra más para no tapar los textos de la izquierda
    const ancho = Math.min(90, z.w * 0.2);
    // tierra
    ctx.fillStyle = "#3b2a1e";
    ctx.fillRect(z.x, top, z.w, fondo - top);
    ctx.fillStyle = "#2a1d14";
    ctx.fillRect(cx - ancho / 2 - 8, top, ancho + 16, fondo - top);
    ctx.fillStyle = "#0b0f1d";
    ctx.fillRect(cx - ancho / 2, top, ancho, fondo - top);
    // agua (empieza en `prof` metros)
    const yAgua = top + prof * m;
    ctx.fillStyle = "rgba(79, 195, 247, 0.75)";
    ctx.fillRect(cx - ancho / 2, yAgua, ancho, fondo - yAgua);
    ctx.fillStyle = "#9be7ff";
    ctx.fillRect(cx - ancho / 2, yAgua, ancho, 2);
    // marcas de metros
    for (let i = 0; i <= niveles; i++) {
      const y = top + i * m;
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.fillRect(cx + ancho / 2 + 8, y, 8, 1);
      texto(ctx, `${i} m`, cx + ancho / 2 + 20, y, { fuente: `500 10px ${FUENTE_MONO}`, color: COLORES.suave, align: "left" });
    }
    // brocal, poste y polea
    rr(ctx, cx - ancho / 2 - 14, top - 16, ancho + 28, 16, 4);
    ctx.fillStyle = "#8a8f9c";
    ctx.fill();
    ctx.fillStyle = "#6b4a2b";
    ctx.fillRect(cx - ancho / 2 - 10, z.y + 8, 6, top - 22 - z.y);
    ctx.fillRect(cx + ancho / 2 + 4, z.y + 8, 6, top - 22 - z.y);
    ctx.fillRect(cx - ancho / 2 - 10, z.y + 8, ancho + 20, 5);
    ctx.beginPath();
    ctx.arc(cx, z.y + 16, 7, 0, Math.PI * 2);
    ctx.fillStyle = COLORES.amarillo;
    ctx.fill();
    // cuerda y cubeta
    const yCubeta = top + this.visual * m - 4;
    ctx.strokeStyle = "#d9c49a";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, z.y + 16);
    ctx.lineTo(cx, yCubeta - 14);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - 14, yCubeta - 14);
    ctx.lineTo(cx + 14, yCubeta - 14);
    ctx.lineTo(cx + 10, yCubeta + 4);
    ctx.lineTo(cx - 10, yCubeta + 4);
    ctx.closePath();
    ctx.fillStyle = "#9aa3b5";
    ctx.fill();
    if (this.lleno) {
      ctx.fillStyle = "#4fc3f7";
      ctx.fillRect(cx - 12, yCubeta - 12, 24, 5);
    }
    // panel lateral
    const px = z.x + 14;
    texto(ctx, `Cubeta a ${this.metros} m`, px, z.y + 18, { fuente: `700 13px ${FUENTE}`, color: COLORES.texto, align: "left" });
    texto(ctx, this.lleno ? "Cubeta llena ✓" : "Cubeta vacía", px, z.y + 36, { fuente: `600 12px ${FUENTE}`, color: this.lleno ? COLORES.verde : COLORES.suave, align: "left" });
    const contador = Object.entries(this.vars).find(([, v]) => typeof v === "number");
    if (contador) texto(ctx, `${contador[0]} = ${contador[1]}`, z.x + z.w - 14, z.y + 18, { fuente: `700 13px ${FUENTE_MONO}`, color: this.brillo(contador[0]) > 0 ? COLORES.verde : COLORES.cian, align: "right" });
  }
}
