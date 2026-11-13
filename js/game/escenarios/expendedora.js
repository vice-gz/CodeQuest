// expendedora.js
// Mundo 6 · Nivel 1 «La máquina expendedora»: una máquina de vending en PIXEL ART que reacciona a lo que hace el programa.
//   · input() #1 (dinero)  → caen monedas por la ranura y el tablero muestra cuántas hay.
//   · input() #2 (precio)  → el tablero muestra el precio.
//   · print("Cambio: X")   → luz verde, gira el resorte, cae el producto a la bandeja y salen X monedas en la charola.
//   · print("Dinero insuficiente") → luz roja que parpadea y la máquina devuelve las monedas.
//   · cualquier otro print → se ve en la pantallita (LCD).
//   · Las 5 lámparas de la máquina son los casos de prueba: ✓ verde / ✗ rojo (con símbolo, no solo color).
// Nix mira desde la derecha y cambia de cara (feliz / preocupado).
//
// Técnica: el arte vive en un lienzo pequeño (200×112). La parte que no cambia se pinta UNA vez en caché; cada cuadro solo se
// dibujan las piezas que se mueven y se escala con un número entero, sin suavizado (nítido y casi gratis para la CPU).

import { EscenarioBase } from "./base.js";
import { Errores } from "../../interpreter/errors.js";
import { PAL, crearLienzoPixel, px, escribir, anchoTexto, pintarNix, escalaEntera } from "../pixel.js";

export const LW = 200; // ancho lógico del lienzo de pixel art
export const LH = 112; // alto lógico
const MAX_MONEDAS_VISIBLES = 6;
const MAX_CAMBIO_VISIBLE = 8;

const PRODUCTOS = [
  [PAL.naranja, PAL.amarillo, PAL.cian],
  [PAL.verde, PAL.celeste, PAL.rosa],
  [PAL.amarillo, PAL.naranja, PAL.verdeClaro],
];
const REPISAS_Y = [33, 46, 59];
const ITEMS_X = [61, 75, 89];

const limitar = (n, a, b) => Math.max(a, Math.min(b, n));
const entero = (v) => {
  const n = Number.parseInt(String(v).trim(), 10);
  return Number.isFinite(n) ? n : null;
};

export class EscenarioExpendedora extends EscenarioBase {
  constructor(config, opciones) {
    super({ ...config, mundo: 5 }, opciones);
    this.reiniciarModelo();
    this._estatico = null;
    this._lienzo = null;
    this.iniciarReposo();
  }

  get tipo() {
    return "expendedora";
  }
  get tituloPanel() {
    return "Taller de proyectos · Máquina expendedora";
  }
  get textoObserva() {
    return "Ejecuta tu programa: la máquina recibe el dinero y el precio, y entrega el cambio o rechaza la compra.";
  }
  get textoProtagonista() {
    return "la máquina";
  }

  reiniciarModelo() {
    this.entradasRecibidas = 0;
    this.dinero = null;
    this.precio = null;
    this.lcd = "";
    this.esperandoEntrada = false;
    this.monedasCayendo = []; // [{ x, y }]
    this.monedasInsertadas = 0; // lo que ya se ve dentro
    this.luz = "amarillo"; // luz de la ranura: amarillo (espera) | verde | rojo
    this.luzParpadeo = 0;
    this.resorte = 0;
    this.producto = null; // { x, y, fila, col } mientras cae
    this.vendido = null; // { fila, col }: hueco que queda en la repisa
    this.cambio = 0; // monedas en la charola de cambio
    this.devueltas = 0;
    this.casos = []; // por lámpara: true | false | null
    this.destello = 0;
    this.nix = "normal";
    this.precioDestello = 0;
  }

  reiniciar() {
    this.reiniciarModelo();
    this.render();
  }

  snapshot() {
    return { dinero: this.dinero, precio: this.precio };
  }

  /** Lo llama el juego al terminar de evaluar: una lámpara por caso (✓ / ✗) y Nix reacciona. */
  marcarCasos(resultados) {
    this.casos = resultados.map((ok) => (ok === null || ok === undefined ? null : Boolean(ok)));
    this.nix = this.casos.length && this.casos.every((c) => c === true) ? "feliz" : this.casos.some((c) => c === false) ? "preocupado" : "normal";
    return this.animar(550, (t) => {
      this.destello = 1 - t;
    });
  }

  // ---------------------------------------------------------------- motor: lo que el programa hace con la máquina
  crearMotor(callbacks = {}) {
    const esc = this;
    return {
      async print(valor) {
        callbacks.onSalida?.({ tipo: "PRINT", valor });
        await esc.mostrarMensaje(String(valor));
      },
      async entrada(prompt) {
        if (typeof callbacks.pedirEntrada !== "function") throw Errores.entradaNoDisponible();
        esc.esperandoEntrada = true;
        esc.render();
        callbacks.onEntradaPendiente?.();
        const valor = await callbacks.pedirEntrada({ etiqueta: prompt });
        esc.esperandoEntrada = false;
        callbacks.onSalida?.({ tipo: "ENTRADA", valor });
        await esc.recibirEntrada(valor);
        return valor;
      },
      async asignacion(nombre, valor) {
        callbacks.onAsignacion?.(nombre, valor);
      },
      async metodo() {
        return undefined;
      },
    };
  }

  /** El primer input() es el dinero; el segundo, el precio (así lo pide el enunciado). */
  async recibirEntrada(valor) {
    const n = entero(valor);
    const indice = this.entradasRecibidas++;
    if (indice === 0) {
      this.dinero = n;
      this.lcd = `DINERO ${n ?? "?"}`;
      await this.insertarMonedas(n ?? 0);
    } else if (indice === 1) {
      this.precio = n;
      this.lcd = `PRECIO ${n ?? "?"}`;
      await this.animar(260, (t) => {
        this.precioDestello = 1 - t;
      });
    } else {
      this.lcd = String(valor);
    }
    this.render();
  }

  async insertarMonedas(n) {
    const cuantas = limitar(n, 0, MAX_MONEDAS_VISIBLES);
    for (let i = 0; i < cuantas; i++) {
      const moneda = { x: 117 + (i % 2), y: 36 };
      this.monedasCayendo = [moneda];
      await this.animar(150, (t) => {
        moneda.y = 36 + 14 * t;
      });
      this.monedasInsertadas = i + 1;
    }
    this.monedasCayendo = [];
    this.monedasInsertadas = n;
    this.render();
  }

  async mostrarMensaje(texto) {
    const cambio = /^\s*cambio\s*:\s*(\d+)/i.exec(texto);
    this.lcd = texto;
    if (cambio) {
      await this.entregar(Number(cambio[1]));
    } else if (/insuficiente/i.test(texto)) {
      await this.rechazar();
    } else {
      await this.esperar(160);
    }
    this.render();
  }

  /** Compra aceptada: luz verde, resorte, cae el producto y salen las monedas del cambio. */
  async entregar(monedas) {
    this.luz = "verde";
    this.nix = "feliz";
    const col = limitar(this.precio ?? 0, 0, 99) % 3;
    this.resorte = 1;
    await this.animar(480, (t) => {
      this.resorte = 1 + t * 8;
    });
    this.vendido = { fila: 2, col };
    const item = { x: ITEMS_X[col], y: REPISAS_Y[2] - 9, fila: 2, col };
    this.producto = item;
    const destino = 84;
    await this.animar(420, (t) => {
      const rebote = t < 0.8 ? t / 0.8 : 1 - Math.sin(((t - 0.8) / 0.2) * Math.PI) * 0.08;
      item.y = REPISAS_Y[2] - 9 + (destino - (REPISAS_Y[2] - 9)) * rebote;
    });
    this.resorte = 0;
    const visibles = limitar(monedas, 0, MAX_CAMBIO_VISIBLE);
    for (let i = 1; i <= visibles; i++) {
      this.cambio = i;
      await this.esperar(70);
      this.render();
    }
    this.cambio = monedas;
    this.render();
  }

  /** Dinero insuficiente: luz roja parpadeando y la máquina devuelve las monedas. */
  async rechazar() {
    this.luz = "rojo";
    this.nix = "preocupado";
    for (let i = 0; i < 3; i++) {
      this.luzParpadeo = 1;
      await this.esperar(110);
      this.render();
      this.luzParpadeo = 0;
      await this.esperar(90);
      this.render();
    }
    const devolver = limitar(this.dinero ?? 0, 0, MAX_MONEDAS_VISIBLES);
    for (let i = 1; i <= devolver; i++) {
      this.devueltas = i;
      await this.esperar(70);
      this.render();
    }
    this.monedasInsertadas = 0;
  }

  // ---------------------------------------------------------------- vista
  ajustarTamano() {
    // El lienzo mide EXACTAMENTE el arte con escala entera (sin franjas vacías) y queda centrado en su marco.
    const dpr = (typeof window !== "undefined" && window.devicePixelRatio) || 1;
    const alturaMax = typeof window !== "undefined" ? Math.max(240, window.innerHeight * 0.6) : 400;
    const medidas = (disponible) => escalaEntera(disponible, alturaMax, LW, LH, dpr).css;
    if (this.canvas?.dataset) this.canvas.dataset.pixel = "1"; // pixel art: puede dejar franjas a los lados (escala entera)
    this.ajustarCanvas(
      (ancho) => ancho * (LH / LW),
      (disponible) => LW * medidas(disponible)
    );
  }

  /** Capa estática (pared, máquina, repisas, tablero): se pinta una sola vez y se copia en cada cuadro. */
  pintarEstatico(c) {
    // pared y piso
    px(c, 0, 0, LW, 96, PAL.azulOscuro);
    for (let y = 11; y < 96; y += 12) px(c, 0, y, LW, 1, "#2f3f85");
    for (let x = 0; x < LW; x += 24) px(c, x, 0, 1, 96, "#2f3f85");
    px(c, 0, 96, LW, 16, PAL.pizarra);
    px(c, 0, 96, LW, 1, PAL.negro);
    for (let x = 6; x < LW; x += 20) px(c, x, 97, 1, 15, "#2a3150");
    px(c, 46, 98, 92, 2, "#262c47"); // sombra

    // máquina: cuerpo con borde, luz y sombra
    px(c, 51, 5, 82, 92, PAL.negro);
    px(c, 52, 6, 80, 90, PAL.rojo);
    px(c, 53, 7, 2, 88, "#d1566a");
    px(c, 129, 7, 2, 88, PAL.vino);
    px(c, 54, 96, 8, 2, PAL.negro);
    px(c, 122, 96, 8, 2, PAL.negro);

    // letrero
    px(c, 56, 8, 72, 10, PAL.vino);
    for (let x = 58; x < 126; x += 6) {
      px(c, x, 8, 1, 1, PAL.amarillo);
      px(c, x, 17, 1, 1, PAL.amarillo);
    }
    escribir(c, "SNACKS", 56 + Math.floor((72 - anchoTexto("SNACKS")) / 2), 11, PAL.amarillo);

    // vitrina con repisas y productos
    px(c, 57, 20, 50, 44, PAL.negro);
    px(c, 58, 21, 48, 41, "#10162b");
    px(c, 98, 23, 3, 14, "#232c52"); // reflejo del vidrio
    REPISAS_Y.forEach((y, fila) => {
      px(c, 58, y, 48, 2, PAL.grisOscuro);
      ITEMS_X.forEach((x, col) => {
        const color = PRODUCTOS[fila][col];
        px(c, x, y - 9, 8, 9, color);
        px(c, x + 1, y - 9, 6, 2, PAL.blanco);
        px(c, x + 1, y - 6, 1, 5, "rgba(255,255,255,0.4)");
        px(c, x + 6, y - 6, 1, 6, "rgba(0,0,0,0.25)");
      });
    });

    // LCD (marco)
    px(c, 57, 64, 50, 10, PAL.negro);

    // franja de lámparas
    px(c, 57, 74, 50, 9, PAL.vino);

    // bandeja de productos
    px(c, 59, 85, 46, 10, PAL.negro);
    px(c, 60, 86, 44, 8, "#0d1022");
    px(c, 59, 94, 46, 2, PAL.grisOscuro);

    // panel derecho: teclado, ranura de monedas y devolución
    px(c, 109, 20, 20, 54, PAL.negro);
    px(c, 110, 21, 18, 52, PAL.pizarra);
    for (let j = 0; j < 4; j++) for (let i = 0; i < 3; i++) px(c, 112 + i * 5, 24 + j * 5, 4, 4, PAL.grisOscuro);
    px(c, 112, 46, 14, 8, PAL.negro);
    px(c, 116, 48, 6, 2, "#000000");
    px(c, 112, 58, 14, 10, PAL.negro);
    px(c, 113, 59, 12, 8, "#0d1022");

    // charola de cambio
    px(c, 109, 85, 20, 10, PAL.negro);
    px(c, 110, 86, 18, 8, "#0d1022");
    px(c, 109, 94, 20, 2, PAL.grisOscuro);

    // tablero de la derecha (precio y monedas)
    px(c, 145, 9, 48, 42, PAL.negro);
    px(c, 146, 10, 46, 40, PAL.pizarra);
    escribir(c, "PRECIO", 150, 13, PAL.amarillo);
    escribir(c, "MONEDAS", 150, 32, PAL.cian);

    // maceta decorativa
    px(c, 22, 82, 14, 14, PAL.naranja);
    px(c, 20, 80, 18, 3, PAL.rojo);
    px(c, 27, 66, 2, 14, PAL.verde);
    px(c, 22, 64, 6, 3, PAL.verdeClaro);
    px(c, 28, 60, 7, 3, PAL.verde);
    px(c, 30, 70, 6, 3, PAL.verdeClaro);
  }

  pintarMoneda(c, x, y) {
    px(c, x, y, 4, 4, PAL.amarillo);
    px(c, x + 1, y + 1, 2, 2, PAL.naranja);
    px(c, x, y, 1, 1, PAL.blanco);
  }

  pintarLampara(c, x, y, estado, destello) {
    const color = estado === true ? PAL.verde : estado === false ? PAL.rojo : PAL.pizarra;
    px(c, x - 1, y - 1, 7, 7, PAL.negro);
    px(c, x, y, 5, 5, color);
    if (destello > 0.3 && estado !== null) px(c, x, y, 5, 5, PAL.blanco);
    // símbolo (no solo color): ✓ o ✗ en 3×3 píxeles
    if (estado === true) {
      [[1, 3], [2, 2], [3, 1]].forEach(([i, j]) => px(c, x + i, y + j - 1, 1, 1, PAL.blanco));
      px(c, x + 1, y + 3, 1, 1, PAL.blanco);
    } else if (estado === false) {
      [[1, 1], [3, 1], [2, 2], [1, 3], [3, 3]].forEach(([i, j]) => px(c, x + i, y + j, 1, 1, PAL.blanco));
    }
  }

  pintarDinamico(c, ahora) {
    // pantallita LCD
    px(c, 58, 65, 48, 8, "#0b3d2e");
    let texto = this.lcd;
    let color = /insuficiente/i.test(texto) ? PAL.naranja : PAL.verdeClaro;
    if (!texto) {
      texto = this.esperandoEntrada ? "ESPERANDO..." : "INSERTE $";
      if (!this.esperandoEntrada && ahora % 1400 > 900) texto = "";
    }
    const ancho = anchoTexto(texto);
    if (ancho <= 46) escribir(c, texto, 59, 67, color);
    else {
      // texto largo: se desplaza como en un letrero real
      const total = ancho + 12;
      const desfase = Math.floor(ahora / 90) % total;
      c.save();
      c.beginPath();
      c.rect(59, 65, 46, 8);
      c.clip();
      escribir(c, texto, 59 + 46 - desfase, 67, color);
      c.restore();
    }

    // lámparas de los casos (una por caso; 5 como máximo en la máquina)
    const n = Math.min(this.casos.length || 5, 5);
    for (let i = 0; i < n; i++) this.pintarLampara(c, 62 + i * 9, 76, this.casos[i] ?? null, this.destello);

    // hueco del producto vendido y resorte
    if (this.vendido) px(c, ITEMS_X[this.vendido.col], REPISAS_Y[2] - 9, 8, 9, "#10162b");
    if (this.resorte > 0) {
      const paso = Math.floor(this.resorte * 3) % 6;
      for (let x = 60; x < 104; x += 6) px(c, x + paso, REPISAS_Y[2] - 1, 2, 1, PAL.blanco);
    }
    if (this.producto) {
      const p = this.producto;
      const color2 = PRODUCTOS[p.fila][p.col];
      px(c, p.x, Math.round(p.y), 8, 9, color2);
      px(c, p.x + 1, Math.round(p.y), 6, 2, PAL.blanco);
    }

    // luz de la ranura de monedas
    const base = this.luz === "verde" ? PAL.verdeClaro : this.luz === "rojo" ? PAL.rojo : PAL.amarillo;
    const encendida = this.luz === "rojo" ? this.luzParpadeo === 1 : this.luz === "amarillo" ? ahora % 1000 < 600 : true;
    px(c, 114, 43, 10, 2, encendida ? base : PAL.pizarra);

    // monedas: cayendo, dentro (contador) y devueltas / cambio
    this.monedasCayendo.forEach((m) => this.pintarMoneda(c, m.x, Math.round(m.y)));
    for (let i = 0; i < this.devueltas; i++) this.pintarMoneda(c, 114 + (i % 4) * 4, 61 + Math.floor(i / 4) * 3);
    for (let i = 0; i < Math.min(this.cambio, MAX_CAMBIO_VISIBLE); i++) this.pintarMoneda(c, 111 + (i % 4) * 4, 90 - Math.floor(i / 4) * 4);

    // tablero: precio y monedas con números grandes (3×5 a escala 2)
    const precioTxt = this.precio === null ? "--" : String(Math.min(this.precio, 999));
    escribir(c, `$${precioTxt}`, 150, 19, this.precioDestello > 0.4 ? PAL.blanco : PAL.amarillo, 2);
    const monedasTxt = this.dinero === null ? "--" : String(Math.min(this.dinero, 999));
    escribir(c, monedasTxt, 150, 38, PAL.cian, 2);

    // Nix: respira suavemente y parpadea de vez en cuando
    const sube = Math.round(Math.sin(ahora / 420) * 1);
    const cara = this.nix === "normal" && ahora % 3300 < 140 ? "parpadeo" : this.nix;
    pintarNix(c, 155, 62 + sube, cara, 2);
  }

  render() {
    if (!this.ctx) return;
    const { w, h, dpr } = this.dimensiones();
    const ctx = this.ctx;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = PAL.negro;
    ctx.fillRect(0, 0, w, h);
    if (!this._lienzo) {
      this._lienzo = crearLienzoPixel(LW, LH);
      this._estatico = crearLienzoPixel(LW, LH);
      if (this._estatico) this.pintarEstatico(this._estatico.ctx);
    }
    if (!this._lienzo || !this._estatico) return; // sin lienzo auxiliar (pruebas sin navegador): no hay nada que dibujar
    const c = this._lienzo.ctx;
    c.clearRect(0, 0, LW, LH);
    c.drawImage(this._estatico.canvas, 0, 0);
    const ahora = typeof performance !== "undefined" ? performance.now() : 0;
    this.pintarDinamico(c, this.reducido ? 0 : ahora);

    const { fisica, css } = escalaEntera(w, h, LW, LH, dpr);
    const ancho = LW * css;
    const alto = LH * css;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this._lienzo.canvas, Math.round(((w - ancho) / 2) * dpr) / dpr, Math.round(((h - alto) / 2) * dpr) / dpr, ancho, alto);
    return fisica;
  }
}
