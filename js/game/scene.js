// scene.js
// Escena en Canvas 2D con estética "Cyber-Mágico":
// fondo espacial morado (#120E24) con estrellas y partículas de datos,
// celdas violetas biseladas (#1E1836 / #2A2148) y la mascota cósmica Nix
// con animación de flotación/reposo, estela direccional y expresión Feliz/Celebrando al ejecutar.

import { brilloCalidad, crearBucleReposo, aplicarModo, escucharModo } from "./rendimiento.js";

const COLOR_FONDO_ALTO = "#1A1333";
const COLOR_FONDO = "#120E24";
const COLOR_CELDA = "#1E1836";
const COLOR_CELDA_INTERIOR = "#251D42";
const COLOR_CELDA_BORDE = "#4C3A82";
const COLOR_OBJETIVO = "#ffc83d";
const COLOR_OBJETO = "#A855F7";
const COLOR_OBSTACULO = "#35285E";
const COLOR_RECARGA = "#00E5FF";
const COLOR_NIX_CUERPO = "#4C3A82";
const COLOR_NIX_MORADO = "#A855F7";
const COLOR_NIX_CIAN = "#00E5FF";
const COLOR_BURBUJA = "#E2D9F3";
const COLOR_TEXTO_BURBUJA = "#120E24";

const ANGULOS = { norte: -Math.PI / 2, sur: Math.PI / 2, este: 0, oeste: Math.PI };

// Estrellas/partículas cósmicas deterministas para el fondo del laboratorio espacial
const ESTRELLAS_COSMICAS = [
  [0.08, 0.14, 1.6, "#00E5FF"],
  [0.19, 0.78, 1.3, "#E2D9F3"],
  [0.27, 0.22, 2.0, "#A855F7"],
  [0.36, 0.88, 1.4, "#00E5FF"],
  [0.48, 0.12, 1.8, "#E2D9F3"],
  [0.62, 0.28, 1.5, "#00E5FF"],
  [0.74, 0.82, 2.1, "#A855F7"],
  [0.83, 0.18, 1.7, "#00E5FF"],
  [0.91, 0.64, 1.5, "#E2D9F3"],
  [0.14, 0.48, 1.9, "#A855F7"],
  [0.88, 0.42, 1.4, "#00E5FF"],
  [0.54, 0.91, 1.6, "#E2D9F3"],
];

const movimientoReducido = () =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export class Scene {
  constructor(canvas, world, robot1) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.world = world;
    this.robot1 = robot1;
    this.visualX = robot1.x;
    this.visualY = robot1.y;
    this.mostrarRobot = true;
    this.tiempoCelebracion = 0;
    this._reposo = null;
    this._animando = 0;

    this._vincularBotonEjecutar();
    this._iniciarCicloFlotacion();
  }

  _vincularBotonEjecutar() {
    if (typeof document === "undefined") return;
    const btn = document.getElementById("btn-ejecutar");
    if (btn && !btn._nixVinculado) {
      btn._nixVinculado = true;
      btn.addEventListener("click", () => {
        if (Scene.instanciaActiva) Scene.instanciaActiva.activarCelebracion(2200);
      });
    }
    Scene.instanciaActiva = this;
  }

  activarCelebracion(duracionMs = 1800) {
    const ahora = typeof performance !== "undefined" ? performance.now() : Date.now();
    this.tiempoCelebracion = ahora + duracionMs;
    this.render();
  }

  _iniciarCicloFlotacion() {
    if (movimientoReducido()) return;
    // Un solo bucle de reposo, con cuadros limitados, que se pausa fuera de pantalla y se detiene con destruir() (ver rendimiento.js).
    this._reposo = crearBucleReposo({
      canvas: this.canvas,
      dibujar: () => {
        if (this.mostrarRobot !== false) this.render();
      },
      ocupado: () => this._animando > 0,
    });
    this._reposo.iniciar();
    this._alCambiarModo = () => {
      aplicarModo();
      this._reposo?.reconfigurar();
      this.render();
    };
    this._dejarDeEscucharModo = escucharModo(this._alCambiarModo);
  }

  /** Detiene el dibujo de reposo: hay que llamarlo antes de crear otra escena sobre el mismo canvas. */
  destruir() {
    this._reposo?.detener();
    this._reposo = null;
    this._dejarDeEscucharModo?.();
    this._dejarDeEscucharModo = null;
    this._alCambiarModo = null;
  }

  reiniciar(world, robot1, { mostrarRobot = true } = {}) {
    this.world = world;
    this.robot1 = robot1;
    this.mostrarRobot = mostrarRobot;
    this.visualX = robot1.x;
    this.visualY = robot1.y;
    Scene.instanciaActiva = this;
    this.render();
  }

  ajustarTamano() {
    const contenedor = this.canvas.parentElement;
    const ancho = contenedor.clientWidth;
    if (ancho <= 0) return;
    const proporcion = this.world.alto / Math.max(1, this.world.ancho);
    const alto = Math.max(160, Math.min(320, ancho * Math.max(0.32, proporcion * 0.9)));
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = ancho * dpr;
    this.canvas.height = alto * dpr;
    this.canvas.style.width = `${ancho}px`;
    this.canvas.style.height = `${alto}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.render();
  }

  cellSize() {
    const anchoCss = this.canvas.width / (window.devicePixelRatio || 1);
    const altoCss = this.canvas.height / (window.devicePixelRatio || 1);
    const margen = 20;
    const w = (anchoCss - margen * 2) / this.world.ancho;
    const h = (altoCss - margen * 2) / this.world.alto;
    return Math.min(w, h, 90);
  }

  origen() {
    const anchoCss = this.canvas.width / (window.devicePixelRatio || 1);
    const altoCss = this.canvas.height / (window.devicePixelRatio || 1);
    const cell = this.cellSize();
    const totalW = cell * this.world.ancho;
    const totalH = cell * this.world.alto;
    return { x: (anchoCss - totalW) / 2, y: (altoCss - totalH) / 2, cell };
  }

  render() {
    const ctx = this.ctx;
    const anchoCss = this.canvas.width / (window.devicePixelRatio || 1);
    const altoCss = this.canvas.height / (window.devicePixelRatio || 1);
    const ahora = typeof performance !== "undefined" ? performance.now() : 0;
    ctx.clearRect(0, 0, anchoCss, altoCss);

    // Fondo morado espacial con nebulosa y partículas/estrellas cósmicas
    const bgGrad = ctx.createLinearGradient(0, 0, 0, altoCss);
    if (bgGrad && bgGrad.addColorStop) {
      bgGrad.addColorStop(0, COLOR_FONDO_ALTO);
      bgGrad.addColorStop(0.55, COLOR_FONDO);
      bgGrad.addColorStop(1, "#0A0813");
      ctx.fillStyle = bgGrad;
    } else {
      ctx.fillStyle = COLOR_FONDO;
    }
    ctx.fillRect(0, 0, anchoCss, altoCss);

    // Retícula sutil Cyber-Mágica
    ctx.strokeStyle = "rgba(168, 85, 247, 0.075)";
    ctx.lineWidth = 1;
    for (let gx = 0; gx < anchoCss; gx += 24) {
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, altoCss);
      ctx.stroke();
    }
    for (let gy = 0; gy < altoCss; gy += 24) {
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(anchoCss, gy);
      ctx.stroke();
    }

    // Estrellas y partículas de datos flotando en el fondo espacial
    for (let i = 0; i < ESTRELLAS_COSMICAS.length; i++) {
      const [fx, fy, radioBase, color] = ESTRELLAS_COSMICAS[i];
      const pulso = movimientoReducido() ? 0.75 : 0.45 + 0.45 * Math.sin(ahora * 0.0025 + i * 1.3);
      ctx.save();
      ctx.globalAlpha = pulso;
      ctx.fillStyle = color;
      const sx = fx * anchoCss;
      const sy = fy * altoCss;
      if (i % 3 === 0) {
        // Píxel de datos cuadrado como en la hoja de referencia de Nix
        ctx.fillRect(sx - radioBase, sy - radioBase, radioBase * 2.1, radioBase * 2.1);
      } else {
        ctx.beginPath();
        ctx.arc(sx, sy, radioBase, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    const { x: startX, y: startY, cell } = this.origen();

    // Marco exterior de la plataforma del laboratorio cósmico
    const totalW = cell * this.world.ancho;
    const totalH = cell * this.world.alto;
    ctx.save();
    ctx.fillStyle = "rgba(168, 85, 247, 0.05)";
    ctx.strokeStyle = "rgba(0, 229, 255, 0.3)";
    ctx.lineWidth = 1.5;
    this.roundRect(ctx, startX - 6, startY - 6, totalW + 12, totalH + 12, 14);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    for (let row = 0; row < this.world.alto; row++) {
      for (let col = 0; col < this.world.ancho; col++) {
        const x = startX + col * cell;
        const y = startY + row * cell;
        ctx.fillStyle = (row + col) % 2 === 0 ? COLOR_CELDA : COLOR_CELDA_INTERIOR;
        ctx.strokeStyle = COLOR_CELDA_BORDE;
        ctx.lineWidth = 1.8;
        this.roundRect(ctx, x + 3, y + 3, cell - 6, cell - 6, 10);
        ctx.fill();
        ctx.stroke();

        // Nodo mágico sutil en el centro de cada casilla
        ctx.fillStyle = "rgba(0, 229, 255, 0.16)";
        ctx.beginPath();
        ctx.arc(x + cell / 2, y + cell / 2, Math.max(1.5, cell * 0.03), 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Obstáculos: cristales / bloques de bloqueo oscuro-lila con detalle ámbar
    for (const [ox, oy] of this.world.obstaculos) {
      const bx = startX + ox * cell + 5;
      const by = startY + oy * cell + 5;
      const bw = cell - 10;
      const bh = cell - 10;
      ctx.fillStyle = COLOR_OBSTACULO;
      ctx.strokeStyle = "#7E67B8";
      ctx.lineWidth = 2;
      this.roundRect(ctx, bx, by, bw, bh, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "rgba(255, 200, 61, 0.25)";
      this.roundRect(ctx, bx + 4, by + 4, bw - 8, Math.max(4, bh * 0.22), 4);
      ctx.fill();
    }

    // Recargas de energía cian
    for (const recarga of this.world.recargas) {
      const [rx, ry] = recarga.posicion;
      this.dibujarRayo(ctx, startX + rx * cell + cell / 2, startY + ry * cell + cell / 2, cell * 0.26);
    }

    // Objetivos (uno o varios); los ya alcanzados se atenúan
    const alcanzados = this.robot1.objetivosAlcanzados || [];
    for (const [gx, gy] of this.world.objetivos) {
      const hecho = alcanzados.includes(`${gx},${gy}`);
      ctx.globalAlpha = hecho ? 0.35 : 1;
      this.dibujarEstrella(
        ctx,
        startX + gx * cell + cell / 2,
        startY + gy * cell + cell / 2,
        cell * 0.24,
        COLOR_OBJETIVO
      );
      ctx.globalAlpha = 1;
    }

    for (const objeto of this.world.objetos) {
      const [ox, oy] = objeto.posicion;
      ctx.save();
      ctx.shadowColor = COLOR_OBJETO;
      ctx.shadowBlur = brilloCalidad(10);
      ctx.fillStyle = COLOR_OBJETO;
      this.roundRect(
        ctx,
        startX + ox * cell + cell * 0.3,
        startY + oy * cell + cell * 0.3,
        cell * 0.4,
        cell * 0.4,
        7
      );
      ctx.fill();
      ctx.restore();
    }

    if (this.mostrarRobot !== false) {
      const rx = startX + this.visualX * cell + cell / 2;
      const ry = startY + this.visualY * cell + cell / 2;
      this.dibujarRobot(ctx, rx, ry, cell * 0.35, cell, ahora);
    }
  }

  /**
   * Dibuja a Nix, el ser de datos (reemplazo cósmico/mágico de Robot1):
   * - Marco cian brillante en su casilla con indicador direccional (como en "Versión para el Simulador 2D")
   * - Animación suave de Flotación/Reposo (sube y baja lentamente)
   * - Estela cósmica + píxeles digitales traseros y branquias/antenas laterales morado-cian
   * - Cuerpo ovalado morado con núcleo frontal y ojos cian brillantes que indican hacia dónde mira
   * - Estado iluminado "Feliz / Celebrando" al presionar Ejecutar o alcanzar un objetivo
   */
  dibujarRobot(ctx, cx, cy, r, cell = r * 2.85, ahora = 0) {
    const celebrando =
      ahora < this.tiempoCelebracion ||
      (this.robot1.objetivosAlcanzados && this.robot1.objetivosAlcanzados.length > 0 && Boolean(this.robot1.mensaje));
    const faseFlotacion = movimientoReducido() ? 0 : Math.sin(ahora * 0.0042);
    const offsetFlotacionY = faseFlotacion * (r * 0.14);
    const angulo = ANGULOS[this.robot1.direccion] ?? 0;

    ctx.save();
    ctx.translate(cx, cy);

    // 1) Recuadro luminoso cian de simulador 2D alrededor de la casilla actual
    const medio = cell * 0.44;
    ctx.save();
    ctx.strokeStyle = celebrando ? "#FFFFFF" : COLOR_NIX_CIAN;
    ctx.shadowColor = COLOR_NIX_CIAN;
    ctx.shadowBlur = brilloCalidad(celebrando ? 14 : 8);
    ctx.lineWidth = celebrando ? 2.2 : 1.6;
    this.roundRect(ctx, -medio, -medio, medio * 2, medio * 2, 10);
    ctx.stroke();
    ctx.restore();

    // 2) Sombra/halo mágico debajo de Nix
    ctx.fillStyle = celebrando ? "rgba(0, 229, 255, 0.32)" : "rgba(168, 85, 247, 0.28)";
    ctx.beginPath();
    ctx.ellipse(0, r * 0.92, r * (0.88 - faseFlotacion * 0.08), r * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();

    // Aplicamos la flotación vertical suave y rotamos según la dirección de Nix
    ctx.translate(0, offsetFlotacionY);
    ctx.rotate(angulo);

    // 3) Punta triangular direccional exterior (indica con claridad hacia dónde mira)
    ctx.fillStyle = COLOR_OBJETIVO;
    ctx.beginPath();
    ctx.moveTo(r * 1.48, 0);
    ctx.lineTo(r * 1.05, -r * 0.32);
    ctx.lineTo(r * 1.05, r * 0.32);
    ctx.closePath();
    ctx.fill();

    // 4) Estela cósmica y partículas de píxeles digitales detrás de Nix (opuestas a la mirada)
    ctx.fillStyle = "rgba(0, 229, 255, 0.24)";
    ctx.beginPath();
    ctx.moveTo(-r * 0.25, -r * 0.42);
    ctx.quadraticCurveTo(-r * 1.38, -r * 0.18, -r * 1.45, faseFlotacion * r * 0.22);
    ctx.quadraticCurveTo(-r * 1.15, r * 0.36, -r * 0.25, r * 0.42);
    ctx.closePath();
    ctx.fill();

    // Píxeles digitales flotantes en la estela
    const pixeles = [
      [-r * 1.28, -r * 0.44, r * 0.18, COLOR_NIX_CIAN],
      [-r * 1.46, r * 0.12, r * 0.16, COLOR_NIX_MORADO],
      [-r * 1.12, r * 0.48, r * 0.15, COLOR_NIX_CIAN],
    ];
    for (const [px, py, tam, col] of pixeles) {
      ctx.fillStyle = col;
      ctx.fillRect(px, py, tam, tam);
    }

    // 5) Branquias / apéndices cósmicos laterales (3 a cada lado, orientados hacia atrás)
    const aletas = [-0.58, -0.22, 0.14];
    for (const signo of [-1, 1]) {
      for (let i = 0; i < aletas.length; i++) {
        const baseX = -r * (0.05 + i * 0.22);
        const baseY = signo * r * (0.58 - i * 0.05);
        const puntaX = -r * (0.78 + i * 0.24);
        const puntaY = signo * r * (1.06 - i * 0.12 + faseFlotacion * 0.06);
        ctx.strokeStyle = i === 0 ? COLOR_NIX_CIAN : COLOR_NIX_MORADO;
        ctx.lineWidth = Math.max(2, r * 0.18);
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(baseX, baseY);
        ctx.quadraticCurveTo(baseX - r * 0.32, puntaY, puntaX, puntaY);
        ctx.stroke();
      }
    }

    // 6) Cuerpo ovalado principal de Nix (morado cósmico con borde luminoso)
    ctx.shadowColor = celebrando ? COLOR_NIX_CIAN : COLOR_NIX_MORADO;
    ctx.shadowBlur = brilloCalidad(celebrando ? 18 : 12);
    ctx.fillStyle = COLOR_NIX_CUERPO;
    ctx.strokeStyle = celebrando ? COLOR_NIX_CIAN : COLOR_NIX_MORADO;
    ctx.lineWidth = Math.max(1.8, r * 0.12);
    ctx.beginPath();
    ctx.ellipse(r * 0.06, 0, r * 0.88, r * 0.72, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    // 7) Núcleo de datos frontal (rombo/destello cian en la frente de Nix)
    ctx.fillStyle = COLOR_NIX_CIAN;
    ctx.beginPath();
    ctx.arc(r * 0.18, 0, celebrando ? r * 0.34 : r * 0.24, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(r * 0.2, 0, celebrando ? r * 0.18 : r * 0.11, 0, Math.PI * 2);
    ctx.fill();

    // 8) Ojos brillantes cian orientados hacia el frente (expresión Normal o Feliz/Celebrando)
    ctx.fillStyle = COLOR_NIX_CIAN;
    ctx.beginPath();
    ctx.ellipse(r * 0.46, -r * 0.32, r * 0.18, r * 0.13, 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(r * 0.46, r * 0.32, r * 0.18, r * 0.13, -0.25, 0, Math.PI * 2);
    ctx.fill();

    // Brillo blanco interior en los ojos
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(r * 0.5, -r * 0.32, r * 0.07, 0, Math.PI * 2);
    ctx.arc(r * 0.5, r * 0.32, r * 0.07, 0, Math.PI * 2);
    ctx.fill();

    // Si está celebrando (al presionar Ejecutar), destellos extra de energía alrededor
    if (celebrando) {
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(r * 0.65, -r * 0.75, r * 0.16, r * 0.16);
      ctx.fillRect(r * 0.65, r * 0.62, r * 0.16, r * 0.16);
      ctx.fillStyle = COLOR_NIX_CIAN;
      ctx.fillRect(-r * 0.35, -r * 0.92, r * 0.15, r * 0.15);
      ctx.fillRect(-r * 0.35, r * 0.8, r * 0.15, r * 0.15);
    }

    ctx.restore();

    if (this.robot1.mensaje) {
      const texto = this.robot1.mensaje;
      ctx.font = "700 13px 'Space Grotesk', sans-serif";
      const anchoTexto = ctx.measureText(texto).width;
      const padX = 11;
      const bw = anchoTexto + padX * 2;
      const bh = 28;
      const bx = cx - bw / 2;
      const by = cy - r - bh - 16;

      ctx.save();
      ctx.shadowColor = "rgba(0, 229, 255, 0.45)";
      ctx.shadowBlur = brilloCalidad(10);
      ctx.fillStyle = COLOR_BURBUJA;
      this.roundRect(ctx, bx, by, bw, bh, 9);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx - 6, by + bh);
      ctx.lineTo(cx + 6, by + bh);
      ctx.lineTo(cx, by + bh + 8);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = COLOR_TEXTO_BURBUJA;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(texto, cx, by + bh / 2);
    }
  }

  dibujarRayo(ctx, cx, cy, r) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = "rgba(0, 229, 255, 0.18)";
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowColor = COLOR_RECARGA;
    ctx.shadowBlur = brilloCalidad(10);
    ctx.fillStyle = COLOR_RECARGA;
    ctx.beginPath();
    ctx.moveTo(-r * 0.25, -r);
    ctx.lineTo(r * 0.5, -r * 0.1);
    ctx.lineTo(r * 0.1, -r * 0.1);
    ctx.lineTo(r * 0.3, r);
    ctx.lineTo(-r * 0.5, r * 0.05);
    ctx.lineTo(-r * 0.1, r * 0.05);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  dibujarEstrella(ctx, cx, cy, r, color) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = "rgba(255, 200, 61, 0.18)";
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.35, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowColor = color;
    ctx.shadowBlur = brilloCalidad(12);
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angExt = (Math.PI / 5) * (2 * i) - Math.PI / 2;
      const angInt = angExt + Math.PI / 5;
      const px = Math.cos(angExt) * r;
      const py = Math.sin(angExt) * r;
      const qx = Math.cos(angInt) * (r * 0.45);
      const qy = Math.sin(angInt) * (r * 0.45);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
      ctx.lineTo(qx, qy);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  roundRect(ctx, x, y, w, h, r0) {
    const r = Math.max(0, Math.min(r0, Math.abs(w) / 2, Math.abs(h) / 2));
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  async moverAnimado(destinoX, destinoY, duracionMs = 380) {
    this.activarCelebracion(duracionMs + 900);
    const inicioX = this.visualX;
    const inicioY = this.visualY;
    const deltaX = destinoX - inicioX;
    const deltaY = destinoY - inicioY;
    const t0 = performance.now();
    this._animando++;
    return new Promise((resolve) => {
      const paso = (ahora) => {
        const t = Math.min(1, (ahora - t0) / duracionMs);
        const easeT = 1 - Math.pow(1 - t, 3);
        this.visualX = inicioX + deltaX * easeT;
        this.visualY = inicioY + deltaY * easeT;
        this.render();
        if (t < 1) {
          requestAnimationFrame(paso);
        } else {
          this.visualX = destinoX;
          this.visualY = destinoY;
          this._animando = Math.max(0, this._animando - 1);
          this.render();
          resolve();
        }
      };
      requestAnimationFrame(paso);
    });
  }
}
