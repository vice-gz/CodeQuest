// proyecto.js
// Mundo 6 (Proyecto · «El Creador»): el taller donde se juntan todos los escenarios anteriores.
// No enseña sintaxis nueva: es un lienzo de trabajo con la terminal y la memoria del Mundo 2 (variables y entradas), y las
// reglas de decisión y repetición del 3 y el 4 las pone el propio programa del estudiante. Hereda TODO de EscenarioDatos
// (chips de memoria, cables de datos, terminal, entradas con input(), variables iniciales por caso); solo cambia la
// presentación y la paleta rosa del mundo.
//
// Los casos de cada nivel pueden traer `escenario.variables` (p. ej. la contraseña a revisar o el número secreto), que
// aparecen como chips de memoria ya cargados.

// proyecto.js
// Mundo 6 (Proyecto · «El Núcleo de Creación»): el escenario más místico y libre.
// En el centro se alza una Mesa Holográfica con anillos arcanos que proyecta un
// holograma reactivo según el proyecto (Máquina expendedora / Lata, Candado de
// contraseñas o Cristal del Núcleo). Si el código falla, el holograma se vuelve
// rojo y se distorsiona; si funciona, se vuelve sólido y brilla, acompañado por
// Nix (el ajolote cósmico) flotando como asistente mágico.

import { EscenarioDatos, formatearValor, tipoDeValor } from "./datos.js";
import { paletaDe } from "../paletas.js";
import { rr, texto, conBrillo, dibujarMascota, gradRadial, FUENTE_MONO, facilitar, capaCacheada } from "./dibujo.js";

const PALETA_NUCLEO = {
  negroProfundo: "#07040F",
  fondoMedio: "#120926",
  fondoVioleta: "#1D0F3A",
  violeta: "#7C3AED",
  purpura: "#A855F7",
  lavanda: "#C4B5FD",
  lavandaLuz: "#EDE9FE",
  holoAzul: "#00E5FF",
  holoCian: "#38BDF8",
  holoError: "#FF3B6B",
  holoErrorLuz: "#FCA5A5",
};

export class EscenarioProyecto extends EscenarioDatos {
  constructor(config, opciones) {
    super({ ...config }, opciones);
    this.mundo = 5;
    this.p = paletaDe(5);
    this.ejecutado = false;
    this.estadoForzado = null; // "exito" | "error" | null
  }

  get tipo() {
    return "proyecto";
  }
  get tituloPanel() {
    return "Taller de proyectos · Terminal y memoria";
  }
  get textoObserva() {
    return "Ejecuta tu programa: la terminal muestra lo que imprime y los módulos guardan tus variables.";
  }
  get textoProtagonista() {
    return "tu proyecto";
  }

  reiniciarModelo() {
    super.reiniciarModelo();
    this.ejecutado = false;
    this.estadoForzado = null;
  }

  crearMotor(callbacks = {}) {
    const base = super.crearMotor(callbacks);
    const escenario = this;
    return {
      ...base,
      async print(valor, info = {}) {
        escenario.ejecutado = true;
        return base.print(valor, info);
      },
      async entrada(prompt) {
        escenario.ejecutado = true;
        return base.entrada(prompt);
      },
      async asignacion(nombre, valor, info = {}) {
        escenario.ejecutado = true;
        return base.asignacion(nombre, valor, info);
      },
    };
  }

  /**
   * Detecta qué proyecto se está trabajando para proyectar el holograma adecuado:
   * - "expendedora": máquina expendedora / lata holográfica
   * - "candado": validador de contraseñas / candado holográfico
   * - "nucleo": adivinanza o proyecto libre / cristal arcano
   */
  detectarTipoHolograma() {
    const vars = [...this.slots.keys()].map((k) => k.toLowerCase());
    const salidas = this.terminal.map((l) => l.texto.toLowerCase()).join(" ");
    let tituloDom = "";
    if (typeof document !== "undefined") {
      const elTitulo = document.getElementById("nivel-titulo") || document.getElementById("fase-titulo");
      if (elTitulo?.textContent) tituloDom = elTitulo.textContent.toLowerCase();
    }

    if (
      vars.some((v) => ["dinero", "precio", "cambio", "moneda", "producto"].includes(v)) ||
      salidas.includes("cambio") ||
      salidas.includes("insuficiente") ||
      tituloDom.includes("expendedora")
    ) {
      return "expendedora";
    }

    if (
      vars.some((v) => ["contrasena", "contraseña", "longitud", "tiene_numero", "clave", "password"].includes(v)) ||
      salidas.includes("contraseña") ||
      salidas.includes("segura") ||
      salidas.includes("débil") ||
      tituloDom.includes("contraseña")
    ) {
      return "candado";
    }

    return "nucleo";
  }

  /**
   * Determina el estado visual del holograma:
   * - "error": si el feedback del DOM muestra error/advertencia o estadoForzado === "error"
   * - "exito": si el código se ejecutó y funciona (feedback de éxito o salida activa sin error)
   * - "reposo": antes de ejecutar (proyección holográfica en líneas azules/lavanda)
   */
  detectarEstadoHolograma() {
    if (this.estadoForzado) return this.estadoForzado;
    if (typeof document !== "undefined") {
      const fb = document.getElementById("panel-feedback");
      if (fb && !fb.hidden) {
        if (fb.classList.contains("error") || fb.classList.contains("advertencia")) return "error";
        if (fb.classList.contains("exito")) return "exito";
      }
    }
    if (this.ejecutado && (this.terminal.length > 0 || this.slots.size > Object.keys(this.config.variables || {}).length)) {
      return "exito";
    }
    return "reposo";
  }

  distribucionProyecto() {
    const { w, h } = this.dimensiones();
    const estrecho = w < 560;
    const margen = 12;
    const top = 28;
    const zonaTerminal = estrecho
      ? { x: margen, y: h * 0.66, w: w - margen * 2, h: h * 0.34 - margen }
      : { x: w * 0.67, y: top, w: w * 0.33 - margen, h: h - top - margen };
    const zonaEscena = estrecho
      ? { x: margen, y: top, w: w - margen * 2, h: h * 0.66 - top - 8 }
      : { x: margen, y: top, w: w * 0.67 - margen * 1.5, h: h - top - margen };

    // Centro de la Mesa Holográfica en el corazón del área de escena
    const mesaCx = zonaEscena.x + zonaEscena.w * 0.52;
    const mesaCy = zonaEscena.y + zonaEscena.h * 0.68;
    const mesaRx = Math.min(96, zonaEscena.w * 0.28);
    const mesaRy = Math.max(18, mesaRx * 0.32);

    return { w, h, estrecho, zonaTerminal, zonaEscena, mesaCx, mesaCy, mesaRx, mesaRy };
  }

  posicionNodoOrbital(dp, indice, total, tSeg = 0) {
    // Distribuimos las variables en dos columnas místicas a izquierda y derecha de la mesa holográfica
    const { zonaEscena, mesaCx } = dp;
    const ladoIzq = indice % 2 === 0;
    const fila = Math.floor(indice / 2);
    const filasPorLado = Math.max(2, Math.ceil(total / 2));
    const margenLateral = Math.min(48, zonaEscena.w * 0.14);
    const xBase = ladoIzq ? zonaEscena.x + margenLateral : Math.min(zonaEscena.x + zonaEscena.w - margenLateral, mesaCx + dp.mesaRx + 42);
    const altoDisponible = Math.max(90, zonaEscena.h - 36);
    const pasoY = altoDisponible / Math.max(1, filasPorLado);
    const yBase = zonaEscena.y + 24 + fila * Math.min(54, pasoY);
    const flotarY = this.reducido ? 0 : Math.sin(tSeg * 2.1 + indice * 1.3) * 3.5;
    return { x: xBase, y: yBase + flotarY };
  }

  render() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const dp = this.distribucionProyecto();
    const { w, h } = dp;
    const ahoraMs = typeof performance !== "undefined" ? performance.now() : 0;
    const tSeg = this.reducido ? 0 : ahoraMs * 0.001;

    const tipoHolo = this.detectarTipoHolograma();
    const estadoHolo = this.detectarEstadoHolograma();

    ctx.clearRect(0, 0, w, h);

    // 1. Fondo místico (Negro profundo -> Violeta -> Púrpura) + nebulosa violeta en el centro de creación.
    //    No cambia de un cuadro a otro (solo con el tamaño o si la mesa pasa a estado de error): va en una capa en caché.
    capaCacheada(this, "fondo", ctx, w, h, `${dp.mesaCx | 0},${dp.mesaCy | 0},${estadoHolo}`, (c) => {
      const gradFondo = c.createLinearGradient(0, 0, 0, h);
      gradFondo.addColorStop(0, PALETA_NUCLEO.negroProfundo);
      gradFondo.addColorStop(0.55, PALETA_NUCLEO.fondoMedio);
      gradFondo.addColorStop(1, PALETA_NUCLEO.fondoVioleta);
      c.fillStyle = gradFondo;
      c.fillRect(0, 0, w, h);
      c.fillStyle = gradRadial(
        c,
        dp.mesaCx,
        dp.mesaCy - 45,
        8,
        dp.mesaCx,
        dp.mesaCy - 45,
        Math.max(w, h) * 0.48,
        [
          [0, estadoHolo === "error" ? "rgba(255, 59, 107, 0.22)" : "rgba(168, 85, 247, 0.26)"],
          [0.45, "rgba(124, 58, 237, 0.11)"],
          [1, "rgba(7, 4, 15, 0)"],
        ],
        "rgba(124, 58, 237, 0.1)"
      );
      c.fillRect(0, 0, w, h);
    });

    // Constelaciones y polvo estelar lavanda
    this.dibujarEstrellasMisticas(ctx, w, h, tSeg);

    // Título superior
    texto(ctx, "NÚCLEO DE CREACIÓN · MESA HOLOGRÁFICA", 14, 15, {
      fuente: `700 11px ${FUENTE_MONO}`,
      color: PALETA_NUCLEO.lavanda,
      align: "left",
    });

    // 2. Mesa Holográfica central con líneas mágicas
    this.dibujarMesaHolografica(ctx, dp, estadoHolo, tSeg);

    // 3. Holograma reactivo proyectado sobre la mesa (Máquina expendedora / Candado / Núcleo)
    this.dibujarHologramaCentral(ctx, dp, tipoHolo, estadoHolo, tSeg);

    // 4. Nodos orbitales de variables y flujos de energía hacia la mesa/terminal
    const nombres = [...this.slots.keys()];
    this.dibujarNodosProyecto(ctx, dp, nombres, tSeg);
    this.dibujarFlujosProyecto(ctx, dp, nombres, tSeg);

    // 5. Mascota (Ajolote Nix) flotando cerca de la mesa holográfica como asistente mágico
    const nixX = dp.mesaCx - dp.mesaRx * 0.78;
    const nixY = dp.mesaCy - dp.mesaRy * 0.45;
    dibujarMascota(ctx, nixX, nixY, 16, {
      color: estadoHolo === "error" ? PALETA_NUCLEO.holoError : PALETA_NUCLEO.holoAzul,
      acento: PALETA_NUCLEO.purpura,
      mirada: 0.7,
      anim: tSeg * 2,
      estado: estadoHolo === "error" ? "error" : estadoHolo === "exito" ? "exito" : "normal",
    });

    // 6. Terminal arcana
    this.dibujarTerminalProyecto(ctx, dp, estadoHolo);
  }

  dibujarEstrellasMisticas(ctx, w, h, tSeg) {
    ctx.save();
    for (let i = 0; i < 18; i++) {
      const x = (i * 67 + 23) % Math.max(1, w);
      const y = (i * 43 + 19) % Math.max(1, h);
      const pulso = 0.35 + 0.65 * Math.abs(Math.sin(tSeg * 1.4 + i));
      ctx.fillStyle = i % 3 === 0 ? `rgba(196, 181, 253, ${pulso * 0.55})` : `rgba(168, 85, 247, ${pulso * 0.4})`;
      ctx.beginPath();
      ctx.arc(x, y, i % 4 === 0 ? 1.8 : 1.1, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  dibujarMesaHolografica(ctx, dp, estadoHolo, tSeg) {
    const { mesaCx: cx, mesaCy: cy, mesaRx: rx, mesaRy: ry } = dp;
    const colorPrincipal =
      estadoHolo === "error"
        ? PALETA_NUCLEO.holoError
        : estadoHolo === "exito"
          ? PALETA_NUCLEO.holoAzul
          : PALETA_NUCLEO.purpura;
    const colorSecundario = estadoHolo === "error" ? PALETA_NUCLEO.holoErrorLuz : PALETA_NUCLEO.lavanda;

    ctx.save();

    // Base física oscura del pedestal circular
    ctx.fillStyle = "#120924";
    ctx.strokeStyle = PALETA_NUCLEO.violeta;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(cx, cy + 10, rx * 1.06, ry * 1.12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Superficie circular brillante de la mesa holográfica
    conBrillo(ctx, colorPrincipal, estadoHolo === "exito" ? 22 : 14, () => {
      ctx.fillStyle = gradRadial(
        ctx,
        cx,
        cy,
        4,
        cx,
        cy,
        rx,
        [
          [0, estadoHolo === "error" ? "rgba(255, 59, 107, 0.42)" : "rgba(0, 229, 255, 0.36)"],
          [0.55, "rgba(168, 85, 247, 0.25)"],
          [1, "rgba(18, 9, 36, 0.9)"],
        ],
        "rgba(124, 58, 237, 0.3)"
      );
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    // Anillos mágicos concéntricos sobre la mesa
    ctx.strokeStyle = colorPrincipal;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = colorSecundario;
    ctx.lineWidth = 1.3;
    ctx.setLineDash([6, 4]);
    ctx.lineDashOffset = -tSeg * 18;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx * 0.72, ry * 0.72, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Líneas mágicas radiales (runas geométricas en la plataforma)
    for (let k = 0; k < 8; k++) {
      const ang = (k * Math.PI) / 4 + tSeg * 0.25;
      const x0 = cx + Math.cos(ang) * rx * 0.32;
      const y0 = cy + Math.sin(ang) * ry * 0.32;
      const x1 = cx + Math.cos(ang) * rx * 0.94;
      const y1 = cy + Math.sin(ang) * ry * 0.94;
      ctx.strokeStyle = "rgba(196, 181, 253, 0.35)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    }

    // Haz de luz cónico ascendente del proyector holográfico
    const gradHaz = ctx.createLinearGradient(cx, cy, cx, cy - 125);
    gradHaz.addColorStop(
      0,
      estadoHolo === "error"
        ? "rgba(255, 59, 107, 0.28)"
        : estadoHolo === "exito"
          ? "rgba(0, 229, 255, 0.28)"
          : "rgba(168, 85, 247, 0.2)"
    );
    gradHaz.addColorStop(1, "rgba(7, 4, 15, 0)");
    ctx.fillStyle = gradHaz;
    ctx.beginPath();
    ctx.moveTo(cx - rx * 0.65, cy);
    ctx.lineTo(cx - rx * 0.92, cy - 120);
    ctx.lineTo(cx + rx * 0.92, cy - 120);
    ctx.lineTo(cx + rx * 0.65, cy);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  dibujarHologramaCentral(ctx, dp, tipoHolo, estadoHolo, tSeg) {
    const cx = dp.mesaCx;
    const flotar = this.reducido ? 0 : Math.sin(tSeg * 2.4) * 4;
    const cy = dp.mesaCy - 56 + flotar;

    const esError = estadoHolo === "error";
    const esSolido = estadoHolo === "exito";
    // Si falla, el holograma se vuelve rojo y se distorsiona
    const glitchX = esError && !this.reducido ? Math.sin(tSeg * 48) * 5 : 0;
    const colorLinea = esError ? PALETA_NUCLEO.holoError : PALETA_NUCLEO.holoAzul;
    const colorBrillo = esError ? PALETA_NUCLEO.holoError : esSolido ? "#00E5FF" : PALETA_NUCLEO.purpura;
    const colorRelleno = esError
      ? "rgba(255, 59, 107, 0.22)"
      : esSolido
        ? "rgba(0, 229, 255, 0.34)"
        : "rgba(56, 189, 248, 0.12)";

    ctx.save();
    ctx.translate(cx + glitchX, cy);

    conBrillo(ctx, colorBrillo, esSolido ? 22 : esError ? 16 : 10, () => {
      ctx.strokeStyle = colorLinea;
      ctx.fillStyle = colorRelleno;
      ctx.lineWidth = esSolido ? 2.6 : 1.8;
      if (!esSolido && !esError) ctx.setLineDash([4, 3]);

      if (tipoHolo === "expendedora") {
        // HOLOGRAMA 1: Máquina expendedora / Lata holográfica (líneas azules)
        // Cuerpo de la lata/máquina
        rr(ctx, -26, -38, 52, 74, 10);
        ctx.fill();
        ctx.stroke();

        // Tapa superior e inferior metálica de la lata/máquina
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.ellipse(0, -34, 22, 5, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Visor y ranura de moneda / onda de refresco
        rr(ctx, -18, -22, 36, 26, 5);
        ctx.stroke();

        // Pequeña lata/ícono dentro o burbujas de energía
        ctx.beginPath();
        ctx.arc(-6, -9, 4, 0, Math.PI * 2);
        ctx.arc(7, -12, 3, 0, Math.PI * 2);
        ctx.stroke();

        // Bandeja dispensadora inferior
        rr(ctx, -16, 12, 32, 14, 4);
        ctx.fill();
        ctx.stroke();
      } else if (tipoHolo === "candado") {
        // HOLOGRAMA 2: Candado holográfico (Validador de contraseñas)
        // Arco superior del candado
        ctx.beginPath();
        ctx.arc(0, -14, 18, Math.PI, 0, false);
        ctx.lineTo(18, -2);
        ctx.moveTo(-18, -14);
        ctx.lineTo(-18, -2);
        ctx.stroke();

        // Cuerpo blindado del candado
        rr(ctx, -28, -2, 56, 44, 9);
        ctx.fill();
        ctx.stroke();

        // Cerradura digital en el centro
        ctx.setLineDash([]);
        ctx.fillStyle = esError ? PALETA_NUCLEO.holoErrorLuz : "#FFFFFF";
        ctx.beginPath();
        ctx.arc(0, 15, 5.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(-2.5, 18, 5, 11);
      } else {
        // HOLOGRAMA 3: Cristal / Orbe del Núcleo de Creación (Adivinanza y Proyecto Libre)
        // Octaedro / Cristal mágico flotante
        ctx.beginPath();
        ctx.moveTo(0, -40);
        ctx.lineTo(28, 0);
        ctx.lineTo(0, 40);
        ctx.lineTo(-28, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Aristas internas del cristal
        ctx.beginPath();
        ctx.moveTo(0, -40);
        ctx.lineTo(0, 40);
        ctx.moveTo(-28, 0);
        ctx.lineTo(28, 0);
        ctx.stroke();

        // Anillo orbital alrededor del cristal
        ctx.setLineDash([]);
        ctx.strokeStyle = esError ? PALETA_NUCLEO.holoErrorLuz : PALETA_NUCLEO.lavanda;
        ctx.beginPath();
        ctx.ellipse(0, 0, 38, 12, 0.35, 0, Math.PI * 2);
        ctx.stroke();
      }
    });

    ctx.setLineDash([]);

    // Líneas de escaneo holográfico (o distorsión roja si hay fallo)
    if (esError) {
      ctx.strokeStyle = "rgba(255, 59, 107, 0.85)";
      ctx.lineWidth = 2;
      for (let y = -32; y <= 32; y += 16) {
        const desvio = ((y * 7) % 11) - 5;
        ctx.beginPath();
        ctx.moveTo(-36 + desvio, y);
        ctx.lineTo(36 + desvio, y);
        ctx.stroke();
      }
    } else if (esSolido) {
      // Destellos mágicos de éxito alrededor del holograma sólido
      for (let i = 0; i < 4; i++) {
        const ang = tSeg * 2 + (i * Math.PI) / 2;
        const px = Math.cos(ang) * 38;
        const py = Math.sin(ang) * 26;
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.arc(px, py, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Etiqueta de estado bajo la proyección
    const textoEstado = esError
      ? "⚠ HOLOGRAMA INESTABLE"
      : esSolido
        ? "✦ PROYECCIÓN ACTIVA"
        : "◇ PLANO HOLOGRÁFICO";
    texto(ctx, textoEstado, 0, -52, {
      fuente: `700 9.5px ${FUENTE_MONO}`,
      color: esError ? PALETA_NUCLEO.holoErrorLuz : esSolido ? "#A5F3FC" : PALETA_NUCLEO.lavanda,
    });

    ctx.restore();
  }

  dibujarNodosProyecto(ctx, dp, nombres, tSeg) {
    const total = Math.max(nombres.length, Math.min(4, this.capacidad));
    for (let i = 0; i < nombres.length; i++) {
      const nombre = nombres[i];
      const slot = this.slots.get(nombre);
      if (!slot) continue;
      const { x, y } = this.posicionNodoOrbital(dp, i, total, tSeg);
      const r = 20;

      // Hilo de luz mística desde el nodo orbital hacia la mesa holográfica
      ctx.save();
      ctx.strokeStyle = "rgba(196, 181, 253, 0.25)";
      ctx.lineWidth = 1.2;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(dp.mesaCx, dp.mesaCy);
      ctx.stroke();
      ctx.setLineDash([]);

      // Esfera cristalina violeta/lavanda para la variable
      conBrillo(ctx, PALETA_NUCLEO.purpura, 10, () => {
        ctx.fillStyle = "rgba(29, 15, 58, 0.9)";
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.strokeStyle = PALETA_NUCLEO.lavanda;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.stroke();

      texto(ctx, nombre, x, y - r - 7, {
        fuente: `700 9.5px ${FUENTE_MONO}`,
        color: PALETA_NUCLEO.lavanda,
        maxAncho: 72,
      });
      texto(ctx, formatearValor(slot.valor), x, y, {
        fuente: `700 11px ${FUENTE_MONO}`,
        color: "#FFFFFF",
        maxAncho: r * 1.7,
      });
      texto(ctx, tipoDeValor(slot.valor), x, y + r * 0.55, {
        fuente: `600 8px ${FUENTE_MONO}`,
        color: PALETA_NUCLEO.purpura,
      });
      ctx.restore();
    }
  }

  dibujarFlujosProyecto(ctx, dp, nombres, tSeg) {
    const total = Math.max(nombres.length, 4);
    const punto = (nombre) => {
      const idx = nombres.indexOf(nombre);
      if (idx < 0) return { x: dp.mesaCx, y: dp.mesaCy - 40 };
      return this.posicionNodoOrbital(dp, idx, total, tSeg);
    };
    for (const f of this.flujos) {
      const a = punto(f.desde);
      const b = f.terminal
        ? { x: dp.zonaTerminal.x + dp.zonaTerminal.w / 2, y: dp.zonaTerminal.y + 24 }
        : f.hacia && nombres.includes(f.hacia)
          ? punto(f.hacia)
          : { x: dp.mesaCx, y: dp.mesaCy - 45 };
      const t = facilitar(f.p);
      const px = a.x + (b.x - a.x) * t;
      const py = a.y + (b.y - a.y) * t;
      conBrillo(ctx, PALETA_NUCLEO.holoAzul, 14, () => {
        ctx.strokeStyle = PALETA_NUCLEO.lavanda;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();

        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.arc(px, py, 4.5, 0, Math.PI * 2);
        ctx.fill();
      });
    }
  }

  dibujarTerminalProyecto(ctx, dp, estadoHolo) {
    const z = dp.zonaTerminal;
    const bordeColor =
      estadoHolo === "error"
        ? PALETA_NUCLEO.holoError
        : this.terminalFlash > 0
          ? PALETA_NUCLEO.holoAzul
          : PALETA_NUCLEO.purpura;

    conBrillo(ctx, this.terminalFlash > 0 ? PALETA_NUCLEO.purpura : "transparent", 16 * this.terminalFlash, () => {
      rr(ctx, z.x, z.y, z.w, z.h, 12);
      ctx.fillStyle = "rgba(10, 5, 22, 0.92)";
      ctx.fill();
    });
    rr(ctx, z.x, z.y, z.w, z.h, 12);
    ctx.strokeStyle = bordeColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    texto(ctx, "TERMINAL DEL NÚCLEO", z.x + 12, z.y + 13, {
      fuente: `700 10px ${FUENTE_MONO}`,
      color: PALETA_NUCLEO.lavanda,
      align: "left",
    });

    const lineas = this.terminal.slice(-Math.floor((z.h - 30) / 17));
    lineas.forEach((l, i) => {
      texto(ctx, `${l.tipo === "entrada" ? "‹ " : "› "}${l.texto}`, z.x + 12, z.y + 32 + i * 17, {
        fuente: `500 12px ${FUENTE_MONO}`,
        color: l.tipo === "entrada" ? PALETA_NUCLEO.lavanda : "#00E5FF",
        align: "left",
        maxAncho: z.w - 24,
      });
    });
    if (this.esperandoEntrada) {
      texto(ctx, "esperando entrada… ▌", z.x + 12, z.y + z.h - 14, {
        fuente: `500 11px ${FUENTE_MONO}`,
        color: PALETA_NUCLEO.lavandaLuz,
        align: "left",
      });
    }
  }
}
