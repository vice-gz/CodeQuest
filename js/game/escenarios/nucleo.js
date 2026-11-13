// nucleo.js
// Mundo 6 · Nivel 4 «Proyecto libre» (jefe final): el núcleo de la supercomputadora del mundo submarino, en pixel art.
// El estudiante escribe SU programa (puede usar input() y print()); lo que se ve:
//   · lo que imprime aparece en un monitor;
//   · al comprobarlo, los módulos que piden los requisitos se sincronizan UNO POR UNO (✓ verde / ✗ rojo con símbolo):
//     LÍNEAS (≥ 10), IF, WHILE, VARIABLE y EJECUTA (sin errores); los cables se encienden del color del módulo;
//   · si TODOS cierran, el núcleo se activa: destello, anillos de energía, el domo se abre y se ve la superficie con el sol,
//     mientras Nix nada hacia arriba y aparece el mensaje final.
// Los requisitos llegan de fuera con marcarRequisitos([{ id, ok, detalle }]) (ver game/requisitos.js).

import { EscenarioPixel, LW, LH } from "./pixelBase.js";
import { PAL, px, escribir, anchoTexto, pintarNix, disco, anillo, linea, simboloOk } from "../pixel.js";

const MODULOS = [
  { id: "lineas", etiqueta: "LINEAS", x: 10, y: 14 },
  { id: "if", etiqueta: "IF", x: 10, y: 42 },
  { id: "while", etiqueta: "WHILE", x: 10, y: 70 },
  { id: "variable", etiqueta: "VARIABLE", x: 142, y: 14 },
  { id: "ejecucion", etiqueta: "EJECUTA", x: 142, y: 42 },
];
const NUCLEO = { x: 100, y: 48, r: 20 };
const DOMO = { x: 62, y: 4, w: 76, h: 26 };

export class EscenarioNucleo extends EscenarioPixel {
  constructor(config, opciones) {
    super(config, opciones);
    this.iniciarReposo();
  }

  get tipo() {
    return "nucleo";
  }
  get tituloPanel() {
    return "Taller de proyectos · Núcleo del laboratorio";
  }
  get textoObserva() {
    return "Escribe tu proyecto y ejecútalo: los módulos del núcleo se sincronizan cuando cumple lo pedido.";
  }

  reiniciarModelo() {
    super.reiniciarModelo();
    this.salidas = []; // últimas líneas que imprimió el programa
    this.requisitos = {}; // id → { ok, detalle }
    this.revelados = 0; // cuántos módulos ya se sincronizaron (animación)
    this.energia = 0; // 0..1
    this.domo = 0; // 0 cerrado … 1 abierto
    this.nixY = 70;
    this.fin = false;
    this.flash = 0;
  }

  snapshot() {
    return { requisitos: { ...this.requisitos } };
  }

  async alImprimir(texto) {
    this.salidas.push(texto);
    if (this.salidas.length > 3) this.salidas.shift();
    await this.esperar(120);
  }

  /** Lo llama el juego al terminar de comprobar el proyecto. */
  async marcarRequisitos(lista) {
    this.requisitos = Object.fromEntries(lista.map((r) => [r.id, r]));
    this.revelados = 0;
    this.energia = 0;
    this.domo = 0;
    this.nixY = 70;
    this.fin = false;
    for (let i = 1; i <= MODULOS.length; i++) {
      await this.animar(260, () => {
        this.revelados = i;
      });
    }
    const todos = lista.length > 0 && MODULOS.every((m) => this.requisitos[m.id]?.ok !== false) && lista.every((r) => r.ok);
    this.nix = todos ? "feliz" : "preocupado";
    if (todos) await this.activar();
  }

  async activar() {
    await this.animar(600, (t) => {
      this.energia = t;
      this.flash = t > 0.8 ? 1 : 0;
    });
    this.flash = 0;
    await this.animar(900, (t) => {
      this.domo = t;
    });
    await this.animar(900, (t) => {
      this.nixY = 70 - 62 * t;
    });
    this.fin = true;
    this.render();
    await this.esperar(1100); // un respiro para ver el mensaje final antes de que aparezca la pantalla de felicitación
  }

  pintarEstatico(c) {
    // casco del laboratorio
    px(c, 0, 0, LW, LH, "#0a1428");
    for (let y = 0; y < LH; y += 8) px(c, 0, y, LW, 1, "#0d1a33");
    for (let x = 0; x < LW; x += 24) px(c, x, 0, 1, LH, "#0d1a33");
    px(c, 0, 98, LW, 14, PAL.pizarra);
    px(c, 0, 98, LW, 1, PAL.negro);
    // domo (placas cerradas se pintan en la parte dinámica; aquí su marco)
    px(c, DOMO.x - 2, DOMO.y - 2, DOMO.w + 4, DOMO.h + 4, PAL.negro);
    // pedestal del núcleo
    px(c, 82, 72, 36, 8, PAL.grisOscuro);
    px(c, 86, 80, 28, 18, PAL.pizarra);
    px(c, 82, 72, 36, 1, PAL.gris);
    // cables base (apagados)
    MODULOS.forEach((m) => {
      const lado = m.x < 100 ? m.x + 48 : m.x;
      linea(c, lado, m.y + 11, NUCLEO.x + (m.x < 100 ? -NUCLEO.r : NUCLEO.r), NUCLEO.y, "#1d2a4d");
    });
    // módulos
    MODULOS.forEach((m) => {
      px(c, m.x, m.y, 48, 22, PAL.negro);
      px(c, m.x + 1, m.y + 1, 46, 20, "#1b2340");
      escribir(c, m.etiqueta, m.x + 4, m.y + 4, PAL.cian);
    });
    // monitor de salida
    px(c, 142, 70, 48, 26, PAL.negro);
    px(c, 143, 71, 46, 24, "#0b3d2e");
  }

  pintarDinamico(c, ahora) {
    // cielo y mar detrás del domo (se ven al abrirse)
    if (this.domo > 0) {
      px(c, DOMO.x, DOMO.y, DOMO.w, DOMO.h, "#41a6f6");
      px(c, DOMO.x, DOMO.y, DOMO.w, 8, "#73eff7");
      disco(c, DOMO.x + DOMO.w - 14, DOMO.y + 9, 6, PAL.amarillo);
      px(c, DOMO.x, DOMO.y + DOMO.h - 8, DOMO.w, 8, "#3b5dc9");
      for (let x = 0; x < DOMO.w; x += 8) px(c, DOMO.x + x + ((Math.floor(ahora / 300) + x) % 3), DOMO.y + DOMO.h - 8, 4, 1, PAL.blanco);
    }
    // placas del domo que se separan
    const apertura = Math.round((DOMO.w / 2) * this.domo);
    px(c, DOMO.x, DOMO.y, DOMO.w / 2 - apertura, DOMO.h, PAL.grisOscuro);
    px(c, DOMO.x + DOMO.w / 2 + apertura, DOMO.y, DOMO.w / 2 - apertura, DOMO.h, PAL.grisOscuro);
    px(c, DOMO.x, DOMO.y + DOMO.h - 2, DOMO.w, 2, PAL.negro);

    // módulos: lámpara con símbolo y el detalle (p. ej. 7/10)
    const sincronizados = this.revelados;
    MODULOS.forEach((m, i) => {
      const r = this.requisitos[m.id];
      const listo = r && i < sincronizados;
      const estado = !listo ? null : r.ok;
      const lampara = estado === true ? PAL.verde : estado === false ? PAL.rojo : PAL.pizarra;
      px(c, m.x + 39, m.y + 3, 7, 7, PAL.negro);
      px(c, m.x + 40, m.y + 4, 5, 5, lampara);
      simboloOk(c, m.x + 40, m.y + 4, estado);
      if (listo && r.detalle) escribir(c, r.detalle, m.x + 4, m.y + 13, estado ? PAL.verdeClaro : PAL.naranja);
      // el cable se enciende del color del módulo
      if (estado !== null) {
        const lado = m.x < 100 ? m.x + 48 : m.x;
        linea(c, lado, m.y + 11, NUCLEO.x + (m.x < 100 ? -NUCLEO.r : NUCLEO.r), NUCLEO.y, estado ? PAL.verdeClaro : PAL.rojo);
      }
    });

    // núcleo: se enciende con la energía; anillos de puntos que giran
    const e = this.energia;
    const parcial = sincronizados ? Object.values(this.requisitos).slice(0, sincronizados).filter((r) => r.ok).length / MODULOS.length : 0;
    const brillo = Math.max(e, parcial * 0.5);
    px(c, 0, 0, 0, 0, PAL.negro);
    disco(c, NUCLEO.x, NUCLEO.y, NUCLEO.r + 2, PAL.negro);
    disco(c, NUCLEO.x, NUCLEO.y, NUCLEO.r, brillo > 0.75 ? PAL.cian : brillo > 0.35 ? PAL.celeste : "#1e2a4a");
    disco(c, NUCLEO.x - 6, NUCLEO.y - 7, 6, brillo > 0.35 ? PAL.blanco : "#33406a");
    if (this.flash) disco(c, NUCLEO.x, NUCLEO.y, NUCLEO.r, PAL.blanco);
    if (brillo > 0.2) {
      const giro = ahora / 700;
      for (let k = 0; k < 18; k++) {
        const a = giro + (k * Math.PI * 2) / 18;
        px(c, Math.round(NUCLEO.x + Math.cos(a) * (NUCLEO.r + 7)), Math.round(NUCLEO.y + Math.sin(a) * (NUCLEO.r + 7)), 2, 2, k % 3 === 0 ? PAL.blanco : PAL.cian);
      }
    }
    if (e >= 1) anillo(c, NUCLEO.x, NUCLEO.y, NUCLEO.r + 12 + (Math.floor(ahora / 120) % 4), PAL.cian);

    // monitor: las últimas líneas que imprimió el programa
    this.salidas.slice(-3).forEach((t, i) => escribir(c, t.slice(0, 11), 145, 74 + i * 7, PAL.verdeClaro));
    if (!this.salidas.length) escribir(c, this.esperandoEntrada ? "ESPERANDO" : "SALIDA", 145, 74, PAL.turquesa);

    // mensaje final
    if (this.fin) {
      const t = "CODEQUEST COMPLETO";
      escribir(c, t, Math.floor((LW - anchoTexto(t)) / 2), 34, PAL.amarillo);
    }

    // Nix: de pie delante del pedestal; al final nada hacia arriba
    const bob = this.fin ? Math.round(Math.sin(ahora / 300) * 1) : 0;
    const cara = this.nix === "normal" && ahora % 3300 < 140 ? "parpadeo" : this.nix;
    pintarNix(c, 84, Math.round(this.nixY) + bob, cara, 2);
  }
}
