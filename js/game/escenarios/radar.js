// radar.js
// Mundo 6 · Nivel 3 «El juego de adivinanza»: un radar sonar en pixel art. A diferencia de los otros niveles, ESTE SE JUEGA:
// el estudiante escribe sus intentos (input()) y ve el sonar buscar la cápsula. El número secreto está oculto (el cuadro de Memoria
// tampoco lo muestra: ver `variablesOcultas` en el nivel) y se revela al ganar o perder.
//   · cada input() → una onda de sonar sale hacia ese número de la escala y gasta una pila (los 5 intentos);
//   · print("Muy bajo") → flecha ↑ junto al marcador (el secreto está más arriba); print("Muy alto") → flecha ↓;
//   · print("¡Adivinaste!") → la cápsula aparece iluminada; print("Perdiste") → estática en el radar y se revela dónde estaba.
// Las lámparas de abajo/arriba (casos) cambian el secreto con el que juegas: caso 1 = 7, caso 2 = 4, caso 3 = 10…

import { EscenarioPixel, LW, LH, limitar, entero } from "./pixelBase.js";
import { PAL, px, escribir, pintarNix, disco, anillo, linea, flecha } from "../pixel.js";

const CX = 68;
const CY = 56;
const R = 44;
const NIVELES = 10;
const yNivel = (n) => Math.round(98 - (limitar(n, 1, NIVELES) - 1) * ((98 - 14) / (NIVELES - 1)));

export class EscenarioRadar extends EscenarioPixel {
  constructor(config, opciones) {
    super(config, opciones);
    this.iniciarReposo();
  }

  get tipo() {
    return "radar";
  }
  get tituloPanel() {
    return "Taller de proyectos · Radar sonar";
  }
  get textoObserva() {
    return "Juega: escribe tus intentos y mira cómo el sonar busca la cápsula escondida.";
  }
  get secreto() {
    const s = Number(this.config.variables?.secreto);
    return Number.isFinite(s) ? s : null;
  }
  get maxIntentos() {
    return Number(this.config.maxIntentos) || 5;
  }

  reiniciarModelo() {
    super.reiniciarModelo();
    this.intentos = 0;
    this.pings = []; // { nivel, t }
    this.ultimo = null; // último número probado
    this.pista = null; // "bajo" | "alto" | null
    this.revelada = false;
    this.estatica = 0;
    this.destelloCapsula = 0;
  }

  snapshot() {
    return { intentos: this.intentos, ultimo: this.ultimo };
  }

  async alRecibirEntrada(valor) {
    const n = entero(valor);
    this.intentos += 1;
    this.pista = null;
    this.ultimo = n;
    this.lcd = n === null ? "?" : `ONDA ${n}`;
    if (n !== null) {
      const ping = { nivel: limitar(n, 1, NIVELES), t: 0 };
      this.pings.push(ping);
      await this.animar(520, (t) => {
        ping.t = t;
      });
    }
  }

  async alImprimir(texto) {
    this.lcd = texto;
    if (/muy bajo/i.test(texto)) {
      this.pista = "bajo";
      this.nix = "normal";
      await this.esperar(200);
    } else if (/muy alto/i.test(texto)) {
      this.pista = "alto";
      this.nix = "normal";
      await this.esperar(200);
    } else if (/adivinaste/i.test(texto)) {
      this.pista = null;
      this.revelada = true;
      this.nix = "feliz";
      await this.animar(700, (t) => {
        this.destelloCapsula = 1 - t;
      });
    } else if (/perdiste/i.test(texto)) {
      this.revelada = true;
      this.nix = "preocupado";
      await this.animar(650, (t) => {
        this.estatica = 1 - t;
      });
    } else {
      await this.esperar(160);
    }
  }

  pintarEstatico(c) {
    px(c, 0, 0, LW, LH, "#0b2a2a");
    for (let y = 0; y < LH; y += 4) px(c, 0, y, LW, 1, "#0d3030");
    // radar
    disco(c, CX, CY, R + 3, PAL.negro);
    disco(c, CX, CY, R + 1, "#1c3a33");
    disco(c, CX, CY, R, "#05231f");
    for (const r of [15, 30, 44]) anillo(c, CX, CY, r, "#0f5a3f");
    linea(c, CX - R, CY, CX + R, CY, "#0b4a34");
    linea(c, CX, CY - R, CX, CY + R, "#0b4a34");
    // escala de números
    px(c, 126, 8, 12, 96, PAL.negro);
    px(c, 127, 9, 10, 94, "#0b2a2a");
    for (let n = 1; n <= NIVELES; n++) {
      px(c, 137, yNivel(n), 3, 1, PAL.gris);
      escribir(c, String(n), 141, yNivel(n) - 2, PAL.gris);
    }
    // panel derecho
    escribir(c, "SONAR", 154, 12, PAL.amarillo);
    escribir(c, "INTENTOS", 154, 22, PAL.gris);
    px(c, 153, 90, 41, 12, PAL.negro);
  }

  pintarDinamico(c, ahora) {
    // barrido del radar: una línea y una estela que se apaga
    const giro = this.esperandoEntrada ? 900 : 1800;
    const ang = ((ahora % giro) / giro) * Math.PI * 2;
    [0.45, 0.3, 0.15, 0].forEach((atras, i) => {
      const a = ang - atras;
      linea(c, CX, CY, CX + Math.cos(a) * (R - 1), CY + Math.sin(a) * (R - 1), ["#0c5a3a", "#12804f", "#1fb46a", PAL.verdeClaro][i]);
    });

    // ondas de sonar: crecen hasta el nivel probado y quedan como anillo tenue
    this.pings.forEach((p, i) => {
      const radio = Math.round((p.nivel / NIVELES) * R * Math.min(1, p.t * 1.1));
      anillo(c, CX, CY, Math.max(2, radio), i === this.pings.length - 1 ? PAL.cian : "#1b7f6a");
    });

    // cápsula escondida: aparece al ganar o perder
    if (this.revelada && this.secreto !== null) {
      const r = (limitar(this.secreto, 1, NIVELES) / NIVELES) * R;
      const bx = Math.round(CX + Math.cos(-0.7) * r);
      const by = Math.round(CY + Math.sin(-0.7) * r);
      const luz = this.destelloCapsula > 0.4 ? PAL.blanco : PAL.amarillo;
      px(c, bx - 3, by - 2, 7, 4, luz);
      px(c, bx - 3, by - 2, 3, 4, PAL.naranja);
      px(c, 130 - 1, yNivel(this.secreto) - 2, 7, 4, luz); // y en la escala
    }

    // marcador del último número y su flecha (↑ muy bajo · ↓ muy alto)
    if (this.ultimo !== null) {
      const y = yNivel(this.ultimo);
      px(c, 128, y - 1, 4, 3, PAL.cian);
      if (this.pista === "bajo") flecha(c, 130, y - 11, "arriba", PAL.verdeClaro);
      if (this.pista === "alto") flecha(c, 130, y + 4, "abajo", PAL.naranja);
    }

    // pilas = intentos que quedan (la última, en rojo)
    const quedan = Math.max(0, this.maxIntentos - this.intentos);
    for (let i = 0; i < this.maxIntentos; i++) {
      px(c, 153 + i * 9, 32, 8, 14, PAL.negro);
      px(c, 154 + i * 9, 33, 6, 12, "#1d2238");
      if (i < quedan) px(c, 154 + i * 9, 33, 6, 12, quedan === 1 ? PAL.rojo : PAL.verde);
      px(c, 156 + i * 9, 31, 2, 1, PAL.gris);
    }

    // estática (perdiste)
    if (this.estatica > 0) {
      for (let k = 0; k < 140; k++) {
        const x = CX - R + Math.floor(Math.random() * R * 2);
        const y = CY - R + Math.floor(Math.random() * R * 2);
        if ((x - CX) ** 2 + (y - CY) ** 2 < R * R) px(c, x, y, 2, 1, Math.random() < 0.5 ? PAL.gris : PAL.grisOscuro);
      }
    }

    // pantallita y Nix
    const texto = this.esperandoEntrada ? "TU TURNO" : this.lcd || "LISTO";
    this.pintarLcd(c, 154, 91, 39, texto, /perdiste/i.test(texto) ? PAL.naranja : PAL.verdeClaro, ahora);
    this.pintarCasos(c, 154, 52, 9);
    const sube = Math.round(Math.sin(ahora / 420));
    const cara = this.nix === "normal" && ahora % 3300 < 140 ? "parpadeo" : this.nix;
    pintarNix(c, 160, 62 + sube, cara, 2);
  }
}
