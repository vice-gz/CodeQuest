// elevador.js
// Mundo 4 (Automatización): un edificio de 5 pisos visto de perfil con un
// elevador. Los pasajeros esperan en distintos pisos y hay que llevarlos a la
// planta baja (piso 1). while y for se aprecian como movimientos repetidos:
// un letrero muestra en qué repetición va el ciclo y qué dijo la última
// condición. Todo lo que se mueve responde a las llamadas reales del programa.

import { EscenarioBase } from "./base.js";
import { rr, texto, conBrillo, mascota, FUENTE, FUENTE_MONO, mezclar, facilitar } from "./dibujo.js";
import { BIBLIOTECA_ELEVADOR } from "../../interpreter/bibliotecas.js";
import { Errores } from "../../interpreter/errors.js";
import { paletaDe } from "../paletas.js";

const COLORES_PASAJERO = ["#38bdf8", "#f472b6", "#a3e635", "#facc15", "#c084fc", "#34d399"];

export class EscenarioElevador extends EscenarioBase {
  constructor(config, opciones) {
    super({ ...config, mundo: 3 }, opciones);
    this.pisos = config.pisos ?? 5;
    this.capacidad = config.capacidad ?? 4;
    this.p = paletaDe(3);
    this.reiniciarModelo();
  }

  get tipo() {
    return "elevador";
  }
  get biblioteca() {
    return BIBLIOTECA_ELEVADOR;
  }
  get tituloPanel() {
    return "Complejo Industrial · Elevador";
  }
  get tituloEstado() {
    return "Estado del elevador";
  }
  get textoObserva() {
    return "Ejecuta el código y observa cómo trabaja el elevador.";
  }
  get textoProtagonista() {
    return "el elevador";
  }

  reiniciarModelo() {
    this.piso = this.config.pisoInicial ?? 1;
    this.visualPiso = this.piso; // posición dibujada (puede estar entre dos pisos)
    this.esperando = (this.config.pasajeros || []).map((p, i) => {
      const piso = typeof p === "number" ? p : p.piso;
      return { id: i, piso, color: COLORES_PASAJERO[i % COLORES_PASAJERO.length] };
    });
    this.totalPasajeros = this.esperando.length;
    this.abordo = [];
    this.entregados = 0;
    this.repeticion = 0;
    this.condicion = null; // {texto, resultado}
    this.mensaje = null;
    this.parpadeo = 0;
    this.vueltasTotales = 0;
    this.rapido = false;
    this.energia = this.config.energiaInicial ?? 100; // cada piso recorrido gasta 1%
  }

  reiniciar() {
    this.reiniciarModelo();
    this.render();
  }

  snapshot() {
    return {
      piso: this.piso,
      abordo: this.abordo.length,
      esperando: this.esperando.length,
      entregados: this.entregados,
      total: this.totalPasajeros,
      energia: this.energia,
    };
  }

  filasEstado() {
    return [
      { etiqueta: "Piso", valor: this.piso === 1 ? "1 (planta baja)" : this.piso },
      { etiqueta: "A bordo", valor: `${this.abordo.length} / ${this.capacidad}` },
      { etiqueta: "Esperando", valor: this.esperando.length },
      { etiqueta: "Entregados", valor: `${this.entregados} / ${this.totalPasajeros}` },
      { etiqueta: "Energía", valor: `${this.energia}%` },
    ];
  }

  evaluar(v) {
    switch (v.tipo) {
      case "elevador_entrega":
        return this.entregados === this.totalPasajeros && this.abordo.length === 0 && (v.piso === undefined || this.piso === v.piso);
      case "elevador_piso":
        return this.piso === v.valorEsperado;
      case "elevador_estado": {
        let ok = true;
        if (v.entregados !== undefined) ok = ok && this.entregados === v.entregados;
        if (v.piso !== undefined) ok = ok && this.piso === v.piso;
        if (v.abordo !== undefined) ok = ok && this.abordo.length === v.abordo;
        if (v.esperando !== undefined) ok = ok && this.esperando.length === v.esperando;
        return ok;
      }
      default:
        return undefined;
    }
  }

  // ---------- Motor ----------
  crearMotor(callbacks = {}) {
    const e = this;
    const notificar = () => callbacks.onEstado?.(e.snapshot());

    function exigirNumero(metodo, n) {
      if (typeof n !== "number" || Number.isNaN(n)) throw Errores.accionNecesitaNumero(metodo, null, "elevador");
      return n;
    }

    async function desplazar(metodo, n, signo) {
      exigirNumero(metodo, n);
      const sentido = n < 0 ? -signo : signo;
      const pasos = Math.abs(n);
      const duracion = Math.max(140, Math.min(380, 800 / Math.max(1, pasos)));
      for (let i = 0; i < pasos; i++) {
        const destino = e.piso + sentido;
        if (destino < 1 || destino > e.pisos) {
          e.visualPiso = e.piso;
          e.render();
          throw Errores.elevadorFueraDelEdificio(e.pisos);
        }
        if (e.energia < 1) throw Errores.elevadorSinEnergia();
        const origen = e.visualPiso;
        // eslint-disable-next-line no-await-in-loop
        await e.animar(duracion, (t) => {
          e.visualPiso = mezclar(origen, destino, facilitar(t));
        });
        e.piso = destino;
        e.visualPiso = destino;
        e.energia -= 1;
        notificar();
      }
    }

    const motor = {
      async print(valor) {
        callbacks.onSalida?.({ tipo: "PRINT", valor });
        e.mensaje = String(valor);
        e.render();
        await e.esperar(350);
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
      async condicion(textoCondicion, resultado) {
        e.condicion = { texto: textoCondicion, resultado };
        e.render();
        await e.esperar(160);
      },
      async iteracion(n) {
        e.repeticion = n;
        e.vueltasTotales += 1;
        if (e.vueltasTotales > 12) e.rapido = true; // ciclos largos: sin animación para no hacer esperar
        e.parpadeo = 1;
        await e.animar(160, (t) => {
          e.parpadeo = 1 - t;
        });
      },

      async subir(n) {
        await desplazar("subir", n, 1);
      },
      async bajar(n) {
        await desplazar("bajar", n, -1);
      },
      async recoger() {
        const aqui = e.esperando.filter((p) => p.piso === e.piso);
        if (!aqui.length) return;
        for (const p of aqui) {
          if (e.abordo.length >= e.capacidad) {
            e.render();
            throw Errores.elevadorLleno(e.capacidad);
          }
          e.esperando = e.esperando.filter((x) => x !== p);
          e.abordo.push(p);
          // eslint-disable-next-line no-await-in-loop
          await e.animar(220, () => {});
        }
        notificar();
      },
      async soltar() {
        if (!e.abordo.length) return;
        const bajan = e.abordo;
        e.abordo = [];
        if (e.piso === 1) e.entregados += bajan.length;
        else bajan.forEach((p) => e.esperando.push({ ...p, piso: e.piso }));
        await e.animar(260, () => {});
        notificar();
      },
      async piso() {
        return e.piso;
      },
      async hayPasajero() {
        return e.esperando.some((p) => p.piso === e.piso);
      },
      async llevando() {
        return e.abordo.length;
      },
    };

    const METODOS = ["subir", "bajar", "recoger", "soltar", "piso", "hayPasajero", "llevando"];
    motor.metodo = async (objeto, nombre, args = []) => (METODOS.includes(nombre) ? motor[nombre](...args) : undefined);
    return motor;
  }

  // ---------- Vista ----------
  ajustarTamano() {
    this.ajustarCanvas((w) => Math.max(300, Math.min(440, w * 0.78)));
  }

  render() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const { w, h } = this.dimensiones();
    const p = this.p;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = p.fondo;
    ctx.fillRect(0, 0, w, h);

    texto(ctx, "COMPLEJO INDUSTRIAL", 14, 14, { fuente: `600 11px ${FUENTE_MONO}`, color: p.acento, align: "left" });

    // Edificio
    const bx = 12;
    const by = 28;
    const bw = Math.min(w - 24, w > 560 ? w * 0.64 : w - 24);
    const bh = h - by - 10;
    const filaH = bh / this.pisos;
    const eje = { x: bx + bw * 0.5 - 34, w: 68 };

    conBrillo(ctx, p.glow, 14, () => {
      rr(ctx, bx, by, bw, bh, 12);
      ctx.fillStyle = "#15110d";
      ctx.fill();
    });
    rr(ctx, bx, by, bw, bh, 12);
    ctx.strokeStyle = "#3b2d20";
    ctx.lineWidth = 2;
    ctx.stroke();

    const yDePiso = (piso) => by + (this.pisos - piso) * filaH; // borde superior del piso
    for (let piso = this.pisos; piso >= 1; piso--) {
      const y = yDePiso(piso);
      const actual = Math.round(this.visualPiso) === piso;
      if (actual) {
        ctx.fillStyle = "rgba(251, 146, 60, 0.07)";
        ctx.fillRect(bx + 2, y + 1, bw - 4, filaH - 2);
      }
      ctx.strokeStyle = "#2c2118";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(bx + 2, y + filaH);
      ctx.lineTo(bx + bw - 2, y + filaH);
      ctx.stroke();
      texto(ctx, piso === 1 ? "PB" : String(piso), bx + 16, y + filaH / 2, {
        fuente: `700 13px ${FUENTE_MONO}`,
        color: actual ? p.acento : "#7a6a58",
      });
    }

    // Pasajeros que esperan (a la izquierda del eje)
    const porPiso = {};
    this.esperando.forEach((pj) => {
      (porPiso[pj.piso] ||= []).push(pj);
    });
    Object.entries(porPiso).forEach(([piso, lista]) => {
      const y = yDePiso(Number(piso));
      lista.forEach((pj, i) => this.dibujarPasajero(ctx, bx + 46 + i * 24, y + filaH - 8, filaH * 0.62, pj.color, true));
    });

    // Eje y cabina
    ctx.fillStyle = "#0a0806";
    ctx.fillRect(eje.x, by + 2, eje.w, bh - 4);
    ctx.strokeStyle = "#3b2d20";
    ctx.strokeRect(eje.x, by + 2, eje.w, bh - 4);

    const yCabina = by + (this.pisos - this.visualPiso) * filaH;
    const cabH = filaH - 6;
    conBrillo(ctx, p.glow, 16, () => {
      rr(ctx, eje.x + 4, yCabina + 3, eje.w - 8, cabH, 6);
      ctx.fillStyle = "#2a1d12";
      ctx.fill();
    });
    rr(ctx, eje.x + 4, yCabina + 3, eje.w - 8, cabH, 6);
    ctx.strokeStyle = p.acento;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    mascota(ctx, eje.x + eje.w / 2, yCabina + 3 + cabH * 0.3, Math.min(9, cabH * 0.14), { color: p.acento });
    this.abordo.forEach((pj, i) =>
      this.dibujarPasajero(ctx, eje.x + 14 + (i % 4) * 13, yCabina + 3 + cabH - 15, cabH * 0.4, pj.color, false)
    );
    texto(ctx, `${this.abordo.length}/${this.capacidad}`, eje.x + eje.w / 2, yCabina + 3 + cabH - 6, {
      fuente: `600 9px ${FUENTE_MONO}`,
      color: "#cdb89f",
    });

    // Salida de la planta baja
    const yPB = yDePiso(1);
    texto(ctx, "SALIDA ▶", bx + bw - 48, yPB + filaH / 2 - 8, { fuente: `700 11px ${FUENTE_MONO}`, color: "#86efac" });
    texto(ctx, `entregados ${this.entregados}/${this.totalPasajeros}`, bx + bw - 60, yPB + filaH / 2 + 10, {
      fuente: `500 10px ${FUENTE_MONO}`,
      color: "#cdb89f",
    });

    this.dibujarPanel(ctx, w, h, bx + bw);
  }

  dibujarPasajero(ctx, x, yBase, alto, color, queEspera) {
    const r = alto * 0.2;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, yBase - alto + r, r, 0, Math.PI * 2);
    ctx.fill();
    rr(ctx, x - r * 1.1, yBase - alto + r * 2.2, r * 2.2, alto - r * 2.2, r * 0.7);
    ctx.fill();
    if (queEspera) {
      texto(ctx, "↓", x, yBase - alto - 5, { fuente: `700 11px ${FUENTE}`, color: "#cdb89f" });
    }
  }

  // Letrero lateral (o inferior si la pantalla es estrecha): ciclo, condición y mensaje.
  dibujarPanel(ctx, w, h, finEdificio) {
    const ancho = w - finEdificio - 24;
    if (ancho < 90) {
      // Pantalla estrecha: una sola línea superior.
      const resumen = this.repeticion ? `repetición ${this.repeticion}` : "";
      texto(ctx, resumen, w - 14, 14, { fuente: `600 11px ${FUENTE_MONO}`, color: this.p.acento2, align: "right" });
      return;
    }
    const x = finEdificio + 12;
    const y = 28;
    const pulso = this.parpadeo;
    conBrillo(ctx, this.p.acento, 14 * pulso, () => {
      rr(ctx, x, y, ancho, 64, 10);
      ctx.fillStyle = "#0c0906";
      ctx.fill();
    });
    rr(ctx, x, y, ancho, 64, 10);
    ctx.strokeStyle = pulso > 0.05 ? this.p.acento : "#3b2d20";
    ctx.lineWidth = 2;
    ctx.stroke();
    texto(ctx, "REPETICIÓN", x + ancho / 2, y + 14, { fuente: `600 10px ${FUENTE_MONO}`, color: "#a08c75" });
    texto(ctx, this.repeticion ? String(this.repeticion) : "—", x + ancho / 2, y + 42, {
      fuente: `700 28px ${FUENTE_MONO}`,
      color: this.p.acento,
    });

    if (this.condicion) {
      const ok = this.condicion.resultado;
      const yy = y + 76;
      rr(ctx, x, yy, ancho, 56, 10);
      ctx.fillStyle = "#0c0906";
      ctx.fill();
      ctx.strokeStyle = ok ? "#4ade80" : "#f87171";
      ctx.lineWidth = 2;
      ctx.stroke();
      texto(ctx, this.condicion.texto, x + ancho / 2, yy + 18, { fuente: `500 11px ${FUENTE_MONO}`, color: "#e5e7eb", maxAncho: ancho - 12 });
      texto(ctx, ok ? "✓ True" : "✗ False", x + ancho / 2, yy + 40, { fuente: `700 13px ${FUENTE}`, color: ok ? "#4ade80" : "#f87171" });
    }
    if (this.mensaje) {
      texto(ctx, this.mensaje, x + ancho / 2, h - 28, { fuente: `600 12px ${FUENTE}`, color: this.p.acento2, maxAncho: ancho - 8 });
    }
  }
}
