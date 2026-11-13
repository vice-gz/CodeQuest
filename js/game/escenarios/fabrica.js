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
import { brilloCalidad } from "../rendimiento.js";
import { reprPython } from "../../interpreter/valores.js";
import { rr, conBrillo, dibujarMascota, cuboIsometrico, gradRadial, FUENTE_MONO } from "./dibujo.js";

const MAX_MAQUINAS = 4;
const PARTES = ["cabeza", "brazos", "piernas"]; // en el orden del ensamble
const MAX_CHIPS = 4;

const PALETA_FABRICA = {
  fondoTop: "#071717",
  fondoMid: "#0B2223",
  fondoBot: "#081518",
  esmeralda: "#10B981",
  esmeraldaLuz: "#34D399",
  turquesa: "#14B8A6",
  turquesaLuz: "#2DD4BF",
  aceroOscuro: "#1E293B",
  aceroMedio: "#334155",
  aceroClaro: "#64748B",
  naranjaAlerta: "#F59E0B",
  naranjaBrillo: "#FB923C",
};

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
    const p = paletaDe(4);
    const ahoraMs = typeof performance !== "undefined" ? performance.now() : 0;
    const tSeg = esc.reducido ? 0 : ahoraMs * 0.001;
    ctx.clearRect(0, 0, w, h);

    // 1. Fondo industrial Verde Esmeralda / Turquesa / Gris Acero
    const fondo = ctx.createLinearGradient(0, 0, 0, h);
    fondo.addColorStop(0, PALETA_FABRICA.fondoTop);
    fondo.addColorStop(0.55, PALETA_FABRICA.fondoMid);
    fondo.addColorStop(1, PALETA_FABRICA.fondoBot);
    ctx.fillStyle = fondo;
    ctx.fillRect(0, 0, w, h);

    // Retícula isométrica sutil de planta de ensamblaje
    ctx.save();
    ctx.strokeStyle = "rgba(20, 184, 166, 0.08)";
    ctx.lineWidth = 1;
    const pasoIso = 36;
    for (let x = -h; x < w + h; x += pasoIso) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + h * 0.85, h);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x - h * 0.85, h);
      ctx.stroke();
    }
    ctx.restore();

    // Franja superior de seguridad industrial (gris acero + naranja de advertencia)
    this.dibujarFranjaSeguridad(ctx, w, 0, 4);

    const altoPista = this.conPista ? Math.min(112, h * 0.28) : 0;
    const altoLinea = h - altoPista - 6;
    if (esc.ensamble) {
      const altoMaq = Math.min(190, altoLinea * 0.48);
      this.dibujarLinea(ctx, p, w, altoMaq, tSeg);
      this.dibujarRobotGigante(ctx, p, w, altoMaq, altoLinea, tSeg);
    } else {
      this.dibujarLinea(ctx, p, w, altoLinea, tSeg);
    }
    if (this.conPista) this.dibujarPista(ctx, p, w, h, altoPista, tSeg);
  }

  dibujarFranjaSeguridad(ctx, w, y, alto = 5) {
    ctx.save();
    ctx.fillStyle = PALETA_FABRICA.aceroOscuro;
    ctx.fillRect(0, y, w, alto);
    ctx.fillStyle = PALETA_FABRICA.naranjaAlerta;
    for (let x = 0; x < w; x += 24) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 12, y);
      ctx.lineTo(x + 8, y + alto);
      ctx.lineTo(x - 4, y + alto);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  /** La línea de ensamble isométrica: estaciones de trabajo, cintas con textura, cubos de datos y Nix supervisando. */
  dibujarLinea(ctx, p, w, alto, tSeg = 0) {
    const esc = this.esc;
    const maquinas = esc.maquinas;

    ctx.fillStyle = PALETA_FABRICA.turquesaLuz;
    ctx.font = `700 11px ${FUENTE_MONO}`;
    ctx.textAlign = "left";
    if (!(esc.burbuja && esc.burbuja.vida > 0)) {
      ctx.fillText(
        esc.ensamble ? "PLANTA ISOMÉTRICA · ENSAMBLAJE MODULAR (def)" : "FÁBRICA ISOMÉTRICA · ESTACIONES DE TRABAJO (def)",
        12,
        19
      );
    }

    const yCinta = alto - 34;
    this.dibujarCinta(ctx, w, yCinta, tSeg);

    // Indicadores de ENTRADA y SALIDA con acento naranja de advertencia y esmeralda
    ctx.font = `700 10px ${FUENTE_MONO}`;
    ctx.fillStyle = PALETA_FABRICA.naranjaBrillo;
    ctx.textAlign = "left";
    ctx.fillText("▶ ENTRADA [ARGS]", 10, yCinta + 30);
    ctx.fillStyle = PALETA_FABRICA.esmeraldaLuz;
    ctx.textAlign = "right";
    ctx.fillText("[RETURN] SALIDA ◀", w - 10, yCinta + 30);

    // Mascota (Ajolote Nix) supervisando desde su plataforma sobre la cinta derecha
    this.dibujarPlataformaMascota(ctx, w - 38, Math.max(36, yCinta - 36), tSeg, esc.activas.length > 0);

    if (!maquinas.length) {
      // Holograma constructivo de espera en el centro
      ctx.save();
      rr(ctx, w / 2 - 155, alto / 2 - 30, 310, 52, 10);
      ctx.fillStyle = "rgba(15, 23, 42, 0.78)";
      ctx.fill();
      ctx.strokeStyle = PALETA_FABRICA.naranjaAlerta;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = PALETA_FABRICA.naranjaBrillo;
      ctx.font = `700 12px ${FUENTE_MONO}`;
      ctx.textAlign = "center";
      ctx.fillText("⚠ SIN ESTACIONES DE TRABAJO", w / 2, alto / 2 - 9);
      ctx.fillStyle = "#CBD5E1";
      ctx.font = "12px sans-serif";
      ctx.fillText("Cada instrucción def construye una estación isométrica aquí.", w / 2, alto / 2 + 11);
      ctx.restore();
      return;
    }

    const margen = 12;
    const n = Math.min(MAX_MAQUINAS, maquinas.length);
    const anchoUtil = w - 64; // reserva espacio a la derecha para la plataforma de supervisión de Nix
    const ancho = (anchoUtil - margen * (n + 1)) / n;
    const top = 26;
    const altoM = Math.max(70, yCinta - top - 28);

    // Conectores de tubería/cinta secundarios desde cada estación hacia la cinta principal
    maquinas.slice(0, MAX_MAQUINAS).forEach((m, i) => {
      m.cx = margen + i * (ancho + margen) + ancho / 2;
      this.dibujarConectorEstacion(ctx, m.cx, top + altoM - 6, yCinta, m.activa > 0.05);
      this.dibujarMaquina(ctx, p, m, m.cx, top, ancho, altoM, tSeg);
    });

    // Paquetes (cubos isométricos) viajando por la cinta transportadora
    const f = esc.flujo;
    if (f.entrada) this.dibujarCaja(ctx, f.entrada.x * w, yCinta + 4, f.entrada.texto, "material");
    if (f.salida) this.dibujarCaja(ctx, f.salida.x * w, yCinta + 4, f.salida.texto, f.salida.gris ? "gris" : "producto", f.salida.brillo);
    if (esc.bandeja) this.dibujarCaja(ctx, w - 52, yCinta + 4, esc.bandeja.texto, esc.bandeja.gris ? "gris" : "producto", 0.55);

    // Burbuja de print
    if (esc.burbuja && esc.burbuja.vida > 0) {
      const b = esc.burbuja;
      const maq = maquinas.find((x) => x.nombre === b.maquina);
      const bx = Math.max(65, Math.min(w - 75, maq?.cx ?? w / 2));
      ctx.save();
      ctx.globalAlpha = Math.min(1, b.vida);
      ctx.font = `700 12px ${FUENTE_MONO}`;
      const t = this.recortar(ctx, b.texto, Math.min(w * 0.6, 220));
      const tw = ctx.measureText(t).width + 20;
      ctx.fillStyle = "#064E3B";
      ctx.strokeStyle = PALETA_FABRICA.esmeraldaLuz;
      ctx.lineWidth = 2;
      rr(ctx, bx - tw / 2, 2, tw, 24, 8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#ECFDF5";
      ctx.textAlign = "center";
      ctx.fillText(t, bx, 18);
      ctx.restore();
    }
  }

  dibujarPlataformaMascota(ctx, x, y, tSeg, trabajando) {
    ctx.save();
    // Pedestal isométrico de supervisión
    cuboIsometrico(ctx, x, y + 18, 22, 9, 10, {
      arriba: PALETA_FABRICA.aceroMedio,
      izquierda: PALETA_FABRICA.aceroOscuro,
      derecha: "#0F172A",
      borde: PALETA_FABRICA.naranjaAlerta,
      grosor: 1.3,
    });
    // Mascota Nix sentada/flotando sobre la plataforma supervisando la cinta
    dibujarMascota(ctx, x, y - 2, 13, {
      color: PALETA_FABRICA.turquesaLuz,
      acento: PALETA_FABRICA.esmeralda,
      mirada: -0.7,
      anim: tSeg * 2,
      estado: trabajando ? "exito" : "normal",
    });
    ctx.restore();
  }

  dibujarConectorEstacion(ctx, cx, yEstacion, yCinta, activa) {
    ctx.save();
    ctx.fillStyle = "#1E293B";
    ctx.fillRect(cx - 8, yEstacion, 16, Math.max(4, yCinta - yEstacion));
    ctx.strokeStyle = activa ? PALETA_FABRICA.esmeraldaLuz : PALETA_FABRICA.aceroClaro;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - 8, yEstacion);
    ctx.lineTo(cx - 8, yCinta);
    ctx.moveTo(cx + 8, yEstacion);
    ctx.lineTo(cx + 8, yCinta);
    ctx.stroke();
    ctx.restore();
  }

  dibujarCinta(ctx, w, y, tSeg = 0) {
    ctx.save();
    // Riel isométrico con profundidad
    const gradCinta = ctx.createLinearGradient(0, y - 4, 0, y + 18);
    gradCinta.addColorStop(0, "#334155");
    gradCinta.addColorStop(0.35, "#1E293B");
    gradCinta.addColorStop(1, "#0F172A");
    ctx.fillStyle = gradCinta;
    ctx.fillRect(0, y - 2, w, 18);

    // Bordes metálicos + franja naranja de advertencia inferior
    ctx.strokeStyle = PALETA_FABRICA.turquesa;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(0, y - 2);
    ctx.lineTo(w, y - 2);
    ctx.stroke();

    ctx.strokeStyle = PALETA_FABRICA.naranjaAlerta;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, y + 16);
    ctx.lineTo(w, y + 16);
    ctx.stroke();

    // Textura de chevrons y rodillos en movimiento sobre la cinta
    const desfase = ((this.esc.cinta + tSeg * 14) % 22) | 0;
    ctx.strokeStyle = "rgba(45, 212, 191, 0.42)";
    ctx.lineWidth = 2;
    for (let x = -22 + desfase; x < w; x += 22) {
      ctx.beginPath();
      ctx.moveTo(x, y + 2);
      ctx.lineTo(x + 6, y + 7);
      ctx.lineTo(x, y + 12);
      ctx.stroke();
    }

    // Rodillos laterales inferiores
    ctx.fillStyle = PALETA_FABRICA.aceroClaro;
    for (let x = 16; x < w; x += 44) {
      ctx.beginPath();
      ctx.arc(x, y + 16, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  /** Paquete que viaja por la cinta como un cubo isométrico 3D con etiqueta. */
  dibujarCaja(ctx, x, yBase, valor, estilo, brillo = 0) {
    ctx.save();
    ctx.font = `700 11px ${FUENTE_MONO}`;
    const t = this.recortar(ctx, valor, 90);
    const paletaCubo = {
      material: {
        arriba: "#F59E0B",
        izquierda: "#B45309",
        derecha: "#D97706",
        borde: "#FDE68A",
        placaBg: "rgba(30, 41, 59, 0.92)",
        placaBorde: "#F59E0B",
      },
      producto: {
        arriba: "#10B981",
        izquierda: "#047857",
        derecha: "#059669",
        borde: "#6EE7B7",
        placaBg: "rgba(6, 78, 59, 0.94)",
        placaBorde: "#34D399",
      },
      gris: {
        arriba: "#64748B",
        izquierda: "#334155",
        derecha: "#475569",
        borde: "#94A3B8",
        placaBg: "rgba(30, 41, 59, 0.9)",
        placaBorde: "#94A3B8",
      },
    }[estilo];

    if (estilo === "producto" && brillo > 0) {
      ctx.shadowColor = PALETA_FABRICA.esmeraldaLuz;
      ctx.shadowBlur = brilloCalidad(16 * brillo);
    }

    // Cubo isométrico 3D sobre la cinta
    cuboIsometrico(ctx, x, yBase - 14, 15, 7, 15, {
      arriba: paletaCubo.arriba,
      izquierda: paletaCubo.izquierda,
      derecha: paletaCubo.derecha,
      borde: paletaCubo.borde,
      grosor: 1.5,
    });
    ctx.shadowBlur = 0;

    // Etiqueta flotante del valor del paquete
    const anchoPlaca = Math.max(38, ctx.measureText(t).width + 12);
    const yPlaca = yBase - 42;
    rr(ctx, x - anchoPlaca / 2, yPlaca, anchoPlaca, 17, 5);
    ctx.fillStyle = paletaCubo.placaBg;
    ctx.fill();
    ctx.strokeStyle = paletaCubo.placaBorde;
    ctx.lineWidth = 1.3;
    ctx.stroke();

    ctx.fillStyle = "#F8FAFC";
    ctx.textAlign = "center";
    ctx.fillText(t, x, yPlaca + 12);
    ctx.restore();
  }

  /** Estación de trabajo metálica en perspectiva isométrica con temblor de ensamblaje. */
  dibujarMaquina(ctx, p, m, cxBase, top, ancho, alto, tSeg = 0) {
    const escala = 0.65 + 0.35 * m.alta;
    const brillo = m.activa;
    // Temblor mecánico cuando la estación está ensamblando/activa
    const temblorX = brillo > 0.08 && !this.esc.reducido ? Math.sin((tSeg * 55) + m.giro * 8) * 2.4 * brillo : 0;
    const temblorY = brillo > 0.08 && !this.esc.reducido ? Math.cos((tSeg * 48) + m.giro * 6) * 1.6 * brillo : 0;
    const cx = cxBase + temblorX;
    const cy = top + alto / 2 + temblorY;
    const aw = ancho * escala;
    const ah = alto * escala;

    ctx.save();
    ctx.globalAlpha = Math.min(1, 0.3 + m.alta * 0.7);

    // Techo isométrico 2.5D de la estación metálica
    const biselIso = Math.min(12, ah * 0.14);
    const colorArriba = brillo > 0.05 ? "#065F46" : "#334155";
    const colorFrente = brillo > 0.05 ? "#064E3B" : "#1E293B";
    const colorLateral = brillo > 0.05 ? "#047857" : "#0F172A";
    const colorBorde = brillo > 0.05 ? PALETA_FABRICA.esmeraldaLuz : PALETA_FABRICA.turquesa;

    const xIzq = cx - aw / 2;
    const xDer = cx + aw / 2;
    const yArr = cy - ah / 2 + biselIso;
    const yAbj = cy + ah / 2;

    if (brillo > 0.05) {
      ctx.shadowColor = PALETA_FABRICA.esmeralda;
      ctx.shadowBlur = brilloCalidad(18 * brillo);
    }

    // Cara superior inclinada (perspectiva isométrica)
    ctx.fillStyle = colorArriba;
    ctx.strokeStyle = colorBorde;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(xIzq + 8, yArr - biselIso);
    ctx.lineTo(xDer, yArr - biselIso);
    ctx.lineTo(xDer - 8, yArr);
    ctx.lineTo(xIzq, yArr);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Cara lateral derecha isométrica
    ctx.fillStyle = colorLateral;
    ctx.beginPath();
    ctx.moveTo(xDer - 8, yArr);
    ctx.lineTo(xDer, yArr - biselIso);
    ctx.lineTo(xDer, yAbj - biselIso);
    ctx.lineTo(xDer - 8, yAbj);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Cuerpo frontal metálico de la estación
    ctx.fillStyle = colorFrente;
    rr(ctx, xIzq, yArr, aw - 8, yAbj - yArr, 6);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Franja naranja de advertencia en la base de la estación
    const cxFrontal = xIzq + (aw - 8) / 2;
    ctx.fillStyle = brillo > 0.05 ? PALETA_FABRICA.naranjaBrillo : PALETA_FABRICA.naranjaAlerta;
    ctx.fillRect(xIzq + 4, yAbj - 6, Math.max(10, aw - 16), 3);

    // Engrane industrial turquesa/esmeralda (gira mientras trabaja)
    const rGear = Math.min(aw, ah) * 0.12;
    ctx.save();
    ctx.translate(cxFrontal, yArr + (yAbj - yArr) * 0.25);
    ctx.rotate(m.giro);
    ctx.fillStyle = brillo > 0.05 ? PALETA_FABRICA.esmeraldaLuz : PALETA_FABRICA.turquesa;
    for (let d = 0; d < 8; d++) {
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-rGear * 0.18, -rGear * 1.28, rGear * 0.36, rGear * 0.52);
    }
    ctx.beginPath();
    ctx.arc(0, 0, rGear, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#0F172A";
    ctx.beginPath();
    ctx.arc(0, 0, rGear * 0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Etiqueta de la función def
    ctx.fillStyle = "#ECFDF5";
    ctx.font = `700 ${Math.max(10, Math.min(13, ancho / 9.2))}px ${FUENTE_MONO}`;
    ctx.textAlign = "center";
    ctx.fillText(this.recortar(ctx, `def ${firma(m)}`, aw - 14), cxFrontal, cy + ah * 0.03);

    // Chips de variables LOCALES en el visor de la estación
    ctx.font = `600 10.5px ${FUENTE_MONO}`;
    m.locales.slice(0, MAX_CHIPS).forEach((c, i) => {
      const t = this.recortar(ctx, `${c.nombre} = ${c.texto}`, aw - 18);
      const tw = ctx.measureText(t).width + 12;
      const y = cy + ah * 0.13 + i * 18;
      ctx.globalAlpha = Math.min(1, 0.2 + m.alta * 0.8) * Math.min(1, c.vida);
      ctx.fillStyle = "rgba(16, 185, 129, 0.22)";
      ctx.strokeStyle = PALETA_FABRICA.turquesaLuz;
      ctx.lineWidth = 1.2;
      rr(ctx, cxFrontal - tw / 2, y, tw, 15, 6);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#ECFDF5";
      ctx.fillText(t, cxFrontal, y + 11);
    });
    ctx.restore();
  }

  recortar(ctx, t, max) {
    if (ctx.measureText(t).width <= max) return t;
    let s = t;
    while (s.length > 4 && ctx.measureText(`${s}…`).width > max) s = s.slice(0, -1);
    return `${s}…`;
  }

  /** Nivel Jefe (Ensamblaje): las piezas del robot flotan en el aire y se mueven a su lugar al ensamblarse. */
  dibujarRobotGigante(ctx, p, w, yTop, h, tSeg = 0) {
    const partes = this.esc.partes;
    const alto = h - yTop - 8;
    const cx = w / 2;
    const base = yTop + 6;
    const u = Math.min(alto / 9.2, w / 14);

    // Plataforma holográfica/isométrica de ensamblaje en la base
    ctx.save();
    ctx.fillStyle = gradRadial(
      ctx,
      cx,
      base + u * 7.8,
      u * 0.5,
      cx,
      base + u * 7.8,
      u * 4.5,
      [
        [0, "rgba(16, 185, 129, 0.32)"],
        [0.6, "rgba(20, 184, 166, 0.12)"],
        [1, "rgba(8, 21, 24, 0)"],
      ],
      "rgba(16, 185, 129, 0.18)"
    );
    ctx.beginPath();
    ctx.ellipse(cx, base + u * 8.2, u * 4.2, u * 0.9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETA_FABRICA.turquesa;
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.restore();

    // Helper: pieza que flota en el aire cuando progreso < 1 y viaja suavemente a su lugar al llamarse la función
    const piezaFlotante = (progreso, offsetFlotanteX, offsetFlotanteY, faseFlotacion, fn) => {
      const libre = 1 - progreso;
      const flotarY = Math.sin(tSeg * 2.4 + faseFlotacion) * u * 0.35 * libre;
      const flotarX = Math.cos(tSeg * 1.7 + faseFlotacion) * u * 0.2 * libre;
      const dx = offsetFlotanteX * libre + flotarX;
      const dy = offsetFlotanteY * libre + flotarY;

      ctx.save();
      ctx.translate(dx, dy);

      // Si aún está flotando sin ensamblar, dibujamos un halo antigravedad bajo la pieza
      if (progreso < 0.99) {
        ctx.strokeStyle = "rgba(245, 158, 11, 0.45)";
        ctx.lineWidth = 1.2;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.arc(cx, base + u * 4, u * 0.4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      ctx.globalAlpha = 0.55 + 0.45 * progreso;
      ctx.fillStyle = progreso > 0.99 ? PALETA_FABRICA.esmeralda : "rgba(30, 41, 59, 0.85)";
      ctx.strokeStyle = progreso > 0.99 ? PALETA_FABRICA.esmeraldaLuz : PALETA_FABRICA.naranjaBrillo;
      ctx.lineWidth = 2.2;
      if (progreso > 0.99) {
        ctx.shadowColor = PALETA_FABRICA.esmeraldaLuz;
        ctx.shadowBlur = brilloCalidad(14);
      }
      fn();
      ctx.restore();
    };

    // Chasis central (núcleo de ensamblaje)
    ctx.save();
    ctx.fillStyle = "rgba(15, 23, 42, 0.88)";
    ctx.strokeStyle = PALETA_FABRICA.turquesa;
    ctx.lineWidth = 2;
    rr(ctx, cx - u * 1.6, base + u * 2.6, u * 3.2, u * 3, 8);
    ctx.fill();
    ctx.stroke();

    // Núcleo reactor esmeralda en el pecho
    ctx.fillStyle = PALETA_FABRICA.esmeraldaLuz;
    ctx.beginPath();
    ctx.arc(cx, base + u * 3.8, u * 0.45, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ECFDF5";
    ctx.font = `700 ${Math.max(9, u * 0.48)}px ${FUENTE_MONO}`;
    ctx.textAlign = "center";
    ctx.fillText("MECHA-NIX", cx, base + u * 5.1);
    ctx.restore();

    // 1. Cabeza (flota arriba a la izquierda antes de ensamblarse)
    piezaFlotante(partes.cabeza, -u * 3.2, -u * 0.6, 0.5, () => {
      rr(ctx, cx - u * 1.25, base + u * 0.35, u * 2.5, u * 1.9, 8);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#0F172A";
      rr(ctx, cx - u * 0.9, base + u * 0.7, u * 1.8, u * 1.0, 5);
      ctx.fill();
      ctx.fillStyle = partes.cabeza > 0.99 ? "#00E5FF" : PALETA_FABRICA.naranjaBrillo;
      ctx.beginPath();
      ctx.arc(cx - u * 0.42, base + u * 1.2, u * 0.22, 0, Math.PI * 2);
      ctx.arc(cx + u * 0.42, base + u * 1.2, u * 0.22, 0, Math.PI * 2);
      ctx.fill();
    });

    // 2. Brazos (flotan separados a los lados antes de ensamblarse)
    piezaFlotante(partes.brazos, u * 3.4, -u * 0.5, 2.1, () => {
      [-1, 1].forEach((lado) => {
        const separacionExtra = (1 - partes.brazos) * lado * u * 1.1;
        rr(ctx, cx + lado * u * 2.35 + separacionExtra - u * 0.5, base + u * 2.7, u, u * 2.9, 6);
        ctx.fill();
        ctx.stroke();
      });
    });

    // 3. Piernas (flotan abajo a la derecha antes de ensamblarse)
    piezaFlotante(partes.piernas, u * 2.8, u * 0.4, 3.8, () => {
      [-1, 1].forEach((lado) => {
        const separacionExtra = (1 - partes.piernas) * lado * u * 0.8;
        rr(ctx, cx + lado * u * 0.85 + separacionExtra - u * 0.55, base + u * 5.7, u * 1.1, u * 2.7, 6);
        ctx.fill();
        ctx.stroke();
      });
    });

    // Checklist industrial de piezas con estado
    ctx.font = `700 11px ${FUENTE_MONO}`;
    ctx.textAlign = "left";
    PARTES.forEach((nombre, i) => {
      const listo = partes[nombre] > 0.99;
      ctx.fillStyle = listo ? PALETA_FABRICA.esmeraldaLuz : PALETA_FABRICA.naranjaBrillo;
      ctx.fillText(`${listo ? "✓" : "⚙"} ${nombre}()`, 12, yTop + 18 + i * 17);
    });
  }

  dibujarPista(ctx, p, w, h, alto, tSeg = 0) {
    const world = this.world;
    const margen = 14;
    const y0 = h - alto + 6;
    const celda = Math.min((w - margen * 2) / world.ancho, (alto - 10) / world.alto, 56);
    const ancho = celda * world.ancho;
    const x0 = (w - ancho) / 2;

    ctx.fillStyle = "rgba(15, 23, 42, 0.72)";
    rr(ctx, x0 - 6, y0 - 4, ancho + 12, celda * world.alto + 8, 8);
    ctx.fill();
    for (let cy = 0; cy < world.alto; cy++) {
      for (let cx = 0; cx < world.ancho; cx++) {
        const px = x0 + cx * celda;
        const py = y0 + cy * celda;
        ctx.strokeStyle = "rgba(20, 184, 166, 0.35)";
        ctx.strokeRect(px + 0.5, py + 0.5, celda - 1, celda - 1);
        if (world.hayObstaculoEn(cx, cy)) {
          ctx.fillStyle = PALETA_FABRICA.aceroMedio;
          ctx.fillRect(px + 3, py + 3, celda - 6, celda - 6);
        }
        if (world.esObjetivo(cx, cy)) {
          ctx.fillStyle = PALETA_FABRICA.esmeraldaLuz;
          ctx.font = `${celda * 0.55}px sans-serif`;
          ctx.textAlign = "center";
          ctx.fillText("⚑", px + celda / 2, py + celda * 0.72);
        }
      }
    }
    const rx = x0 + (this.visualX + 0.5) * celda;
    const ry = y0 + (this.visualY + 0.5) * celda;
    dibujarMascota(ctx, rx, ry, celda * 0.34, {
      color: "#00E5FF",
      acento: PALETA_FABRICA.esmeralda,
      anim: tSeg * 2,
    });
  }
}

export class EscenarioFabrica extends EscenarioLaboratorio {
  constructor(config, opciones) {
    super({ ...config, mundo: 4 }, opciones);
    this.conRobot = config.robot !== false;
    this.ensamble = config.ensamble === true; // Nivel Jefe: Robot1 gigante
    this.reiniciarFabrica();
    this.iniciarReposo(); // máquinas y cinta con vida propia (un solo bucle, ver rendimiento.js)
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
