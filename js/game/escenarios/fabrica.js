// fabrica.js
// Mundo 5 (Modularidad): la Fábrica de robots como una LÍNEA DE ENSAMBLE con visualización paso a paso.
// El intérprete avisa al escenario de cada cosa que ocurre con una función (ver Interpreter):
//
//   funcionDefinida(nombre, parametros)   → se CONSTRUYE una máquina sobre la línea
//   llamadaIniciada(nombre, args)         → una CAJA DE MATERIALES con los argumentos viaja hasta la máquina;
//                                           la máquina se ilumina y aparecen chips con sus variables LOCALES (a = 5, b = 3)
//   asignacionLocal(nombre, valor)        → un chip nuevo (o actualizado): resultado = 8
//   print(valor)                          → una BURBUJA de texto
//   llamadaTerminada(nombre, valor)       → sale una caja de PRODUCTO TERMINADO con el valor del return
//                                           (verde y brillante) o una caja GRIS con None si no hubo return
//
// Todo queda anotado también en `registro` (lista de eventos) para poder probarlo sin dibujar.
//
// En el Nivel Jefe (config.ensamble) cabeza(), brazos() y piernas() van armando un Robot1 gigante.
// Hereda de EscenarioLaboratorio: el robot, la cuadrícula, sus validaciones y su motor son los mismos.

import { EscenarioLaboratorio, EscenaNula } from "./laboratorio.js";
import { paletaDe } from "../paletas.js";
import { reprPython } from "../../interpreter/valores.js";

const MAX_MAQUINAS = 4;
const PARTES = ["cabeza", "brazos", "piernas"]; // en el orden del ensamble
const MAX_CHIPS = 4;

const texto = (v) => (v === null || v === undefined ? "None" : reprPython(v));
const firma = (m) => `${m.nombre}(${m.parametros.join(", ")})`;

class EscenaFabrica {
  constructor(escenario) {
    this.esc = escenario;
    this.canvas = escenario.canvas;
    this.ctx = escenario.canvas.getContext("2d");
    this.world = escenario.world;
    this.robot1 = escenario.robot1;
    this.visualX = this.robot1.x;
    this.visualY = this.robot1.y;
    this.mostrarRobot = true;
  }

  reiniciar(world, robot1, { mostrarRobot = true } = {}) {
    this.world = world;
    this.robot1 = robot1;
    this.visualX = robot1.x;
    this.visualY = robot1.y;
    this.mostrarRobot = mostrarRobot;
  }

  get conPista() {
    return this.mostrarRobot && this.esc.conRobot;
  }

  ajustarTamano() {
    const e = this.esc;
    this.esc.ajustarCanvas((ancho) => {
      if (e.ensamble) return Math.min(470, Math.max(400, ancho * 0.78));
      return this.conPista ? Math.min(450, Math.max(360, ancho * 0.68)) : Math.min(370, Math.max(300, ancho * 0.56));
    });
  }

  async moverAnimado(px, py, duracion) {
    const x0 = this.visualX;
    const y0 = this.visualY;
    await this.esc.animar(duracion, (t) => {
      this.visualX = x0 + (px - x0) * t;
      this.visualY = y0 + (py - y0) * t;
    });
  }

  // ------------------------------------------------------------------ dibujo
  render() {
    const esc = this.esc;
    if (!esc.dibuja) return;
    const { w, h } = esc.dimensiones();
    const ctx = this.ctx;
    const p = paletaDe(5);
    ctx.clearRect(0, 0, w, h);

    const fondo = ctx.createLinearGradient(0, 0, 0, h);
    fondo.addColorStop(0, "#0d1520");
    fondo.addColorStop(1, "#080c12");
    ctx.fillStyle = fondo;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(56, 189, 248, 0.05)";
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

    const altoPista = this.conPista ? Math.min(112, h * 0.28) : 0;
    const altoLinea = h - altoPista - 6;
    if (esc.ensamble) {
      const altoMaq = Math.min(190, altoLinea * 0.5);
      this.dibujarLinea(ctx, p, w, altoMaq);
      this.dibujarRobotGigante(ctx, p, w, altoMaq, altoLinea);
    } else {
      this.dibujarLinea(ctx, p, w, altoLinea);
    }
    if (this.conPista) this.dibujarPista(ctx, p, w, h, altoPista);
  }

  /** La línea de ensamble: máquinas arriba, cinta con cajas abajo, entrada a la izquierda y salida a la derecha. */
  dibujarLinea(ctx, p, w, alto) {
    const esc = this.esc;
    const maquinas = esc.maquinas;
    ctx.fillStyle = p.acento;
    ctx.font = "600 12px sans-serif";
    ctx.textAlign = "left";
    if (!(esc.burbuja && esc.burbuja.vida > 0)) ctx.fillText(esc.ensamble ? "TALLER DE ENSAMBLE · funciones" : "LÍNEA DE ENSAMBLE · máquinas (funciones)", 12, 18); // la burbuja de print ocupa ese sitio

    const yCinta = alto - 34;
    this.dibujarCinta(ctx, w, yCinta);

    // entrada y salida
    ctx.font = "600 11px sans-serif";
    ctx.fillStyle = "rgba(125, 211, 252, 0.75)";
    ctx.textAlign = "left";
    ctx.fillText("ENTRADA ▶", 8, yCinta + 30);
    ctx.textAlign = "right";
    ctx.fillText("◀ SALIDA", w - 8, yCinta + 30);

    if (!maquinas.length) {
      ctx.fillStyle = "rgba(200, 220, 240, 0.55)";
      ctx.font = "14px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Aún no hay máquinas.", w / 2, alto / 2 - 4);
      ctx.fillText("Cada def construye una aquí.", w / 2, alto / 2 + 18);
      return;
    }

    const margen = 10;
    const n = Math.min(MAX_MAQUINAS, maquinas.length);
    const ancho = (w - margen * (n + 1)) / n;
    const top = 28;
    const altoM = Math.max(70, yCinta - top - 34); // deja sitio para las cajas, que van sobre la cinta
    maquinas.slice(0, MAX_MAQUINAS).forEach((m, i) => {
      m.cx = margen + i * (ancho + margen) + ancho / 2;
      this.dibujarMaquina(ctx, p, m, m.cx, top, ancho, altoM);
    });

    // cajas sobre la cinta
    const f = esc.flujo;
    if (f.entrada) this.dibujarCaja(ctx, f.entrada.x * w, yCinta + 3, f.entrada.texto, "material");
    if (f.salida) this.dibujarCaja(ctx, f.salida.x * w, yCinta + 3, f.salida.texto, f.salida.gris ? "gris" : "producto", f.salida.brillo);
    // la caja que ya llegó a la bandeja de salida se queda ahí
    if (esc.bandeja) this.dibujarCaja(ctx, w - 42, yCinta + 3, esc.bandeja.texto, esc.bandeja.gris ? "gris" : "producto", 0.4);

    // burbuja de print
    if (esc.burbuja && esc.burbuja.vida > 0) {
      const b = esc.burbuja;
      const maq = maquinas.find((x) => x.nombre === b.maquina);
      const bx = Math.max(60, Math.min(w - 60, maq?.cx ?? w / 2));
      ctx.globalAlpha = Math.min(1, b.vida);
      ctx.font = "600 12px ui-monospace, monospace";
      const t = this.recortar(ctx, b.texto, Math.min(w * 0.6, 220));
      const tw = ctx.measureText(t).width + 18;
      ctx.fillStyle = "#e0f2fe";
      ctx.beginPath();
      ctx.roundRect(bx - tw / 2, 2, tw, 24, 10);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(bx - 6, 26);
      ctx.lineTo(bx + 6, 26);
      ctx.lineTo(bx, 33);
      ctx.fill();
      ctx.fillStyle = "#0c4a6e";
      ctx.textAlign = "center";
      ctx.fillText(t, bx, 19);
      ctx.globalAlpha = 1;
    }
  }

  dibujarCinta(ctx, w, y) {
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(0, y, w, 14);
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.moveTo(0, y + 14);
    ctx.lineTo(w, y + 14);
    ctx.stroke();
    ctx.fillStyle = "#64748b";
    const desfase = (this.esc.cinta % 20) | 0;
    for (let x = -20 + desfase; x < w; x += 20) ctx.fillRect(x, y + 5, 8, 4);
  }

  /** Una caja pequeña con un valor adentro. estilo: material | producto | gris */
  dibujarCaja(ctx, x, yBase, valor, estilo, brillo = 0) {
    ctx.save();
    ctx.font = "600 12px ui-monospace, monospace";
    const t = this.recortar(ctx, valor, 96);
    const ancho = Math.max(44, ctx.measureText(t).width + 18);
    const alto = 28;
    const colores = {
      material: ["#1e3a5f", "#60a5fa"],
      producto: ["#14532d", "#4ade80"],
      gris: ["#374151", "#9ca3af"],
    }[estilo];
    if (estilo === "producto" && brillo > 0) {
      ctx.shadowColor = "#4ade80";
      ctx.shadowBlur = 14 * brillo;
    }
    ctx.fillStyle = colores[0];
    ctx.strokeStyle = colores[1];
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x - ancho / 2, yBase - alto, ancho, alto, 6);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#f8fafc";
    ctx.textAlign = "center";
    ctx.fillText(t, x, yBase - 9);
    ctx.restore();
  }

  dibujarMaquina(ctx, p, m, cx, top, ancho, alto) {
    const escala = 0.6 + 0.4 * m.alta;
    const cy = top + alto / 2;
    const aw = ancho * escala;
    const ah = alto * escala;
    ctx.save();
    ctx.globalAlpha = Math.min(1, 0.25 + m.alta * 0.75);

    const brillo = m.activa;
    ctx.fillStyle = `rgba(${20 + brillo * 20}, ${32 + brillo * 50}, ${46 + brillo * 60}, 1)`;
    ctx.strokeStyle = brillo > 0.05 ? p.acento2 : "rgba(56, 189, 248, 0.5)";
    ctx.lineWidth = 2 + brillo * 2;
    ctx.beginPath();
    ctx.roundRect(cx - aw / 2, cy - ah / 2, aw, ah, 12);
    ctx.fill();
    if (brillo > 0.05) {
      ctx.shadowColor = p.glow;
      ctx.shadowBlur = 18 * brillo;
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // engrane (gira mientras trabaja)
    const rGear = Math.min(aw, ah) * 0.13;
    ctx.save();
    ctx.translate(cx, cy - ah * 0.2);
    ctx.rotate(m.giro);
    ctx.fillStyle = brillo > 0.05 ? p.acento2 : "rgba(125, 211, 252, 0.45)";
    for (let d = 0; d < 8; d++) {
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-rGear * 0.18, -rGear * 1.25, rGear * 0.36, rGear * 0.5);
    }
    ctx.beginPath();
    ctx.arc(0, 0, rGear, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#0d1520";
    ctx.beginPath();
    ctx.arc(0, 0, rGear * 0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // nombre
    ctx.fillStyle = "#e6f4ff";
    ctx.font = `600 ${Math.max(11, Math.min(14, ancho / 9))}px ui-monospace, monospace`;
    ctx.textAlign = "center";
    ctx.fillText(this.recortar(ctx, `def ${firma(m)}`, aw - 8), cx, cy + ah * 0.02);

    // chips de variables LOCALES
    ctx.font = "600 11px ui-monospace, monospace";
    m.locales.slice(0, MAX_CHIPS).forEach((c, i) => {
      const t = this.recortar(ctx, `${c.nombre} = ${c.texto}`, aw - 14);
      const tw = ctx.measureText(t).width + 12;
      const y = cy + ah * 0.12 + i * 19;
      ctx.globalAlpha = Math.min(1, 0.2 + m.alta * 0.8) * Math.min(1, c.vida);
      ctx.fillStyle = "rgba(56, 189, 248, 0.22)";
      ctx.strokeStyle = p.acento2;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(cx - tw / 2, y, tw, 16, 8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#e0f2fe";
      ctx.fillText(t, cx, y + 12);
    });
    ctx.restore();
  }

  recortar(ctx, t, max) {
    if (ctx.measureText(t).width <= max) return t;
    let s = t;
    while (s.length > 4 && ctx.measureText(`${s}…`).width > max) s = s.slice(0, -1);
    return `${s}…`;
  }

  /** Nivel Jefe: el Robot1 gigante se arma pieza por pieza. */
  dibujarRobotGigante(ctx, p, w, yTop, h) {
    const partes = this.esc.partes;
    const alto = h - yTop - 8;
    const cx = w / 2;
    const base = yTop + 4;
    const u = Math.min(alto / 9, w / 14); // unidad de dibujo
    const pieza = (progreso, fn) => {
      ctx.save();
      ctx.globalAlpha = 0.18 + 0.82 * progreso;
      ctx.translate(0, (1 - progreso) * -u * 1.6); // baja desde arriba
      ctx.fillStyle = progreso > 0.99 ? p.acento : "rgba(56, 189, 248, 0.5)";
      ctx.strokeStyle = progreso > 0.05 ? p.acento2 : "rgba(125, 211, 252, 0.45)";
      ctx.lineWidth = 2;
      ctx.setLineDash(progreso > 0.05 ? [] : [5, 4]);
      fn();
      ctx.restore();
    };
    // torso (siempre está: es el «plano»)
    ctx.fillStyle = "rgba(30, 58, 95, 0.55)";
    ctx.strokeStyle = "rgba(125, 211, 252, 0.7)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(cx - u * 1.6, base + u * 2.6, u * 3.2, u * 3, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#e0f2fe";
    ctx.font = `600 ${Math.max(10, u * 0.55)}px sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("ROBOT1", cx, base + u * 4.2);

    pieza(partes.cabeza, () => {
      ctx.beginPath();
      ctx.arc(cx, base + u * 1.3, u * 1.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#08121c";
      ctx.beginPath();
      ctx.arc(cx - u * 0.45, base + u * 1.2, u * 0.22, 0, Math.PI * 2);
      ctx.arc(cx + u * 0.45, base + u * 1.2, u * 0.22, 0, Math.PI * 2);
      ctx.fill();
    });
    pieza(partes.brazos, () => {
      [-1, 1].forEach((lado) => {
        ctx.beginPath();
        ctx.roundRect(cx + lado * u * 2.5 - u * 0.5, base + u * 2.7, u, u * 2.9, 6);
        ctx.fill();
        ctx.stroke();
      });
    });
    pieza(partes.piernas, () => {
      [-1, 1].forEach((lado) => {
        ctx.beginPath();
        ctx.roundRect(cx + lado * u * 0.85 - u * 0.55, base + u * 5.7, u * 1.1, u * 3, 6);
        ctx.fill();
        ctx.stroke();
      });
    });

    // lista de piezas con su palomita
    ctx.font = "600 11px sans-serif";
    ctx.textAlign = "left";
    PARTES.forEach((nombre, i) => {
      ctx.fillStyle = partes[nombre] > 0.99 ? "#86efac" : "rgba(200, 220, 240, 0.6)";
      ctx.fillText(`${partes[nombre] > 0.99 ? "✓" : "○"} ${nombre}()`, 10, yTop + 18 + i * 16);
    });
  }

  dibujarPista(ctx, p, w, h, alto) {
    const world = this.world;
    const margen = 14;
    const y0 = h - alto + 6;
    const celda = Math.min((w - margen * 2) / world.ancho, (alto - 10) / world.alto, 56);
    const ancho = celda * world.ancho;
    const x0 = (w - ancho) / 2;

    ctx.fillStyle = "rgba(56, 189, 248, 0.08)";
    ctx.fillRect(x0 - 6, y0 - 4, ancho + 12, celda * world.alto + 8);
    for (let cy = 0; cy < world.alto; cy++) {
      for (let cx = 0; cx < world.ancho; cx++) {
        const px = x0 + cx * celda;
        const py = y0 + cy * celda;
        ctx.strokeStyle = "rgba(125, 211, 252, 0.35)";
        ctx.strokeRect(px + 0.5, py + 0.5, celda - 1, celda - 1);
        if (world.hayObstaculoEn(cx, cy)) {
          ctx.fillStyle = "#334155";
          ctx.fillRect(px + 3, py + 3, celda - 6, celda - 6);
        }
        if (world.esObjetivo(cx, cy)) {
          ctx.fillStyle = "#86efac";
          ctx.font = `${celda * 0.55}px sans-serif`;
          ctx.textAlign = "center";
          ctx.fillText("⚑", px + celda / 2, py + celda * 0.72);
        }
      }
    }
    const rx = x0 + (this.visualX + 0.5) * celda;
    const ry = y0 + (this.visualY + 0.5) * celda;
    ctx.fillStyle = p.acento;
    ctx.beginPath();
    ctx.arc(rx, ry, celda * 0.34, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#08121c";
    ctx.beginPath();
    ctx.arc(rx - celda * 0.11, ry - celda * 0.05, celda * 0.06, 0, Math.PI * 2);
    ctx.arc(rx + celda * 0.11, ry - celda * 0.05, celda * 0.06, 0, Math.PI * 2);
    ctx.fill();
  }
}

export class EscenarioFabrica extends EscenarioLaboratorio {
  constructor(config, opciones) {
    super({ ...config, mundo: 5 }, opciones);
    this.conRobot = config.robot !== false;
    this.ensamble = config.ensamble === true; // Nivel Jefe: Robot1 gigante
    this.reiniciarFabrica();
  }

  reiniciarFabrica() {
    this.maquinas = [];
    this.llamadas = 0;
    this.ultima = null;
    this.registro = []; // eventos visuales, en orden (también sirven para las pruebas)
    this.activas = []; // pila de máquinas encendidas (llamadas anidadas)
    this.flujo = { entrada: null, salida: null }; // cajas que viajan por la cinta
    this.bandeja = null; // última caja que llegó a la salida
    this.burbuja = null;
    this.cinta = 0;
    this.partes = { cabeza: 0, brazos: 0, piernas: 0 };
  }

  crearEscena() {
    return this.canvas ? new EscenaFabrica(this) : new EscenaNula(this.world, this.robot1);
  }

  get tipo() {
    return "fabrica";
  }
  get tituloPanel() {
    return this.ensamble ? "Fábrica de robots · El Gran Ensamblaje" : "Fábrica de robots · Línea de ensamble";
  }
  get tituloEstado() {
    return "Estado de la fábrica";
  }
  get textoObserva() {
    return "Ejecuta el código: cada def construye una máquina y cada llamada la enciende.";
  }
  get textoProtagonista() {
    return "la fábrica";
  }
  get etiquetaObjetivo() {
    return this.conRobot ? super.etiquetaObjetivo : "";
  }

  reiniciar() {
    this.reiniciarFabrica();
    super.reiniciar();
  }

  filasEstado() {
    const filas = [
      { etiqueta: "Máquinas", valor: this.maquinas.length ? this.maquinas.map(firma).join(", ") : "ninguna todavía" },
      { etiqueta: "Llamadas", valor: String(this.llamadas) },
    ];
    if (this.ultima) filas.push({ etiqueta: "Última llamada", valor: `${this.ultima.nombre}(${this.ultima.args}) → ${this.ultima.salida ?? "…"}` });
    if (this.ensamble) filas.push({ etiqueta: "Robot gigante", valor: PARTES.map((p) => `${p} ${this.partes[p] > 0.99 ? "✓" : "—"}`).join(" · ") });
    return this.conRobot ? [...filas, ...super.filasEstado()] : filas;
  }

  snapshot() {
    return { ...super.snapshot(), maquinas: this.maquinas.map(firma), llamadas: this.llamadas };
  }

  evento(tipo, datos = {}) {
    this.registro.push({ tipo, ...datos });
  }

  /** La cinta se mueve mientras algo viaja. */
  moverCinta(t) {
    this.cinta = t * 40;
  }

  crearMotor(callbacks) {
    const motor = super.crearMotor(callbacks);
    const avisar = () => callbacks.onEstado?.(this.snapshot());
    const buscar = (nombre) => this.maquinas.find((m) => m.nombre === nombre);
    const imprimirOriginal = motor.print;

    motor.funcionDefinida = async (nombre, parametros) => {
      let m = buscar(nombre);
      if (!m) {
        m = { nombre, parametros: [...parametros], alta: 0, activa: 0, giro: 0, locales: [], cx: 0 };
        this.maquinas.push(m);
      } else {
        m.parametros = [...parametros];
      }
      this.evento("maquina", { nombre, parametros: [...parametros] });
      await this.animar(420, (t) => {
        m.alta = t;
      });
      avisar();
    };

    // 1) LA LLAMADA: una caja de materiales viaja hacia la máquina con los valores de los parámetros
    motor.llamadaIniciada = async (nombre, args, info = {}) => {
      const m = buscar(nombre);
      this.llamadas += 1;
      const lista = args.map(texto);
      this.ultima = { nombre, args: lista.join(", "), salida: null };
      this.activas.push(nombre);
      this.bandeja = null;
      this.burbuja = null;
      this.evento("entrada", { nombre, args: lista });
      if (m) {
        m.locales = [];
        const cajaTexto = lista.length ? `[${lista.join(", ")}]` : "∅";
        const destino = Math.max(0.05, (m.cx || 120) / Math.max(1, this.dimensionesAncho()));
        await this.animar(460, (t) => {
          this.flujo.entrada = { x: 0.06 + (destino - 0.06) * t, texto: cajaTexto };
          this.moverCinta(t);
          m.activa = Math.max(m.activa, t * 0.5);
        });
        this.flujo.entrada = null;
        // 2) LA EJECUCIÓN: la máquina se ilumina y aparecen los parámetros como variables locales
        const params = info.parametros || m.parametros;
        params.forEach((nombreP, i) => {
          m.locales.push({ nombre: nombreP, texto: lista[i], vida: 0 });
        });
        this.evento("locales", { nombre, locales: m.locales.map((c) => `${c.nombre} = ${c.texto}`) });
        await this.animar(380, (t) => {
          m.activa = 0.5 + 0.5 * t;
          m.giro += 0.3;
          m.locales.forEach((c) => {
            c.vida = t;
          });
        });
      }
      avisar();
    };

    // un chip nuevo (o actualizado) por cada asignación dentro de la función
    motor.asignacionLocal = async (nombreVar, valor, info = {}) => {
      const m = buscar(info.funcion || this.activas.at(-1));
      const t = texto(valor);
      this.evento("local", { funcion: m?.nombre, nombre: nombreVar, valor: t });
      if (!m) return;
      const existente = m.locales.find((c) => c.nombre === nombreVar);
      if (existente) existente.texto = t;
      else m.locales.push({ nombre: nombreVar, texto: t, vida: 0 });
      const chip = m.locales.find((c) => c.nombre === nombreVar);
      await this.animar(260, (k) => {
        chip.vida = k;
        m.giro += 0.2;
      });
    };

    // 4) LA SALIDA: print muestra una burbuja de texto
    motor.print = async (valor, ...resto) => {
      const t = String(valor);
      this.evento("burbuja", { texto: t, maquina: this.activas.at(-1) ?? null });
      this.burbuja = { texto: t, maquina: this.activas.at(-1) ?? this.maquinas.at(-1)?.nombre, vida: 1 };
      this.render();
      return imprimirOriginal(valor, ...resto);
    };

    // 3) EL RETORNO: sale una caja de producto terminado (verde) con el valor, o una caja gris con None
    motor.llamadaTerminada = async (nombre, valor) => {
      const m = buscar(nombre);
      const salida = texto(valor);
      const sinRetorno = valor === null || valor === undefined;
      if (this.ultima && this.ultima.nombre === nombre) this.ultima.salida = salida;
      this.activas.pop();
      this.evento("salida", { nombre, valor: salida, none: sinRetorno });
      if (this.ensamble && PARTES.includes(nombre)) this.evento("parte", { nombre });
      if (m) {
        const desde = Math.max(0.05, (m.cx || 120) / Math.max(1, this.dimensionesAncho()));
        const hasta = 1 - 42 / Math.max(1, this.dimensionesAncho());
        await this.animar(520, (t) => {
          this.flujo.salida = { x: desde + (hasta - desde) * t, texto: salida, gris: sinRetorno, brillo: 1 - t * 0.5 };
          this.moverCinta(t);
          m.activa = 1 - t;
          m.giro += 0.3;
          if (this.ensamble && PARTES.includes(nombre)) this.partes[nombre] = t;
        });
        this.flujo.salida = null;
        this.bandeja = { texto: salida, gris: sinRetorno };
        m.locales = [];
        if (this.ensamble && PARTES.includes(nombre)) this.partes[nombre] = 1;
        if (this.burbuja) this.burbuja.vida = 1;
      }
      this.render();
      avisar();
    };

    return motor;
  }

  dimensionesAncho() {
    return this.dibuja ? this.dimensiones().w : 600;
  }

  // Validaciones propias del mundo 5 (las de Robot1 las hereda del laboratorio).
  //   funcion_definida: { nombre, parametros }   se definió esa función con ese número de parámetros
  //   funcion_llamada:  { nombre, minimo }       se llamó al menos `minimo` veces
  //   funcion_retorna:  { nombre }               alguna llamada devolvió un valor (no None)
  //   ensamble:         { partes: [...] }        se definieron EXACTAMENTE esas funciones, cada una se llamó al
  //                                              menos una vez y la primera llamada de cada una fue en ese orden
  evaluar(v, ctx, h) {
    const funciones = ctx.funciones || [];
    const llamadas = ctx.llamadas || [];
    switch (v.tipo) {
      case "funcion_definida":
        return funciones.some((f) => f.nombre === v.nombre && (v.parametros === undefined || f.parametros.length === v.parametros));
      case "funcion_llamada":
        return llamadas.filter((l) => l.nombre === v.nombre).length >= (v.minimo ?? 1);
      case "funcion_retorna":
        return llamadas.some((l) => l.nombre === v.nombre && l.retorno !== null && l.retorno !== undefined);
      case "ensamble": {
        const partes = v.partes || PARTES;
        const nombres = funciones.map((f) => f.nombre);
        if (nombres.length !== partes.length || !partes.every((p) => nombres.includes(p))) return false;
        const primeras = partes.map((p) => llamadas.findIndex((l) => l.nombre === p));
        return primeras.every((i) => i >= 0) && primeras.every((i, k) => k === 0 || i > primeras[k - 1]);
      }
      default:
        return super.evaluar(v, ctx, h);
    }
  }
}
