// scene.js
// Escena en Canvas 2D puro (decisión documentada en README: más ligero que
// Phaser 3 para cuadrículas simples; Documento 2, sección 3.1). Ahora
// soporta cuadrículas de más de una fila para robot1.girar() en las
// cuatro direcciones cardinales.

const COLOR_FONDO = "#0f1424";
const COLOR_CELDA = "#1b2140";
const COLOR_CELDA_BORDE = "#2b3364";
const COLOR_OBJETIVO = "#ffb84d";
const COLOR_OBJETO = "#c792ff";
const COLOR_OBSTACULO = "#6b7280";
const COLOR_RECARGA = "#7dde86";
const COLOR_ROBOT = "#5eead4";
const COLOR_ROBOT_OJO = "#0f1424";
const COLOR_BURBUJA = "#edeffa";
const COLOR_TEXTO_BURBUJA = "#12162b";

const ANGULOS = { norte: -Math.PI / 2, sur: Math.PI / 2, este: 0, oeste: Math.PI };

export class Scene {
  constructor(canvas, world, robot1) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.world = world;
    this.robot1 = robot1;
    this.visualX = robot1.x;
    this.visualY = robot1.y;
    this.mostrarRobot = true;
  }

  reiniciar(world, robot1, { mostrarRobot = true } = {}) {
    this.world = world;
    this.robot1 = robot1;
    this.mostrarRobot = mostrarRobot;
    this.visualX = robot1.x;
    this.visualY = robot1.y;
    this.render();
  }

  ajustarTamano() {
    const contenedor = this.canvas.parentElement;
    const ancho = contenedor.clientWidth;
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
    ctx.clearRect(0, 0, anchoCss, altoCss);
    ctx.fillStyle = COLOR_FONDO;
    ctx.fillRect(0, 0, anchoCss, altoCss);

    const { x: startX, y: startY, cell } = this.origen();

    for (let row = 0; row < this.world.alto; row++) {
      for (let col = 0; col < this.world.ancho; col++) {
        const x = startX + col * cell;
        const y = startY + row * cell;
        ctx.fillStyle = COLOR_CELDA;
        ctx.strokeStyle = COLOR_CELDA_BORDE;
        ctx.lineWidth = 2;
        this.roundRect(ctx, x + 3, y + 3, cell - 6, cell - 6, 10);
        ctx.fill();
        ctx.stroke();
      }
    }

    // obstáculos: bloques sólidos que Robot1 no puede atravesar
    for (const [ox, oy] of this.world.obstaculos) {
      ctx.fillStyle = COLOR_OBSTACULO;
      this.roundRect(ctx, startX + ox * cell + 5, startY + oy * cell + 5, cell - 10, cell - 10, 8);
      ctx.fill();
    }

    // recargas de energía
    for (const recarga of this.world.recargas) {
      const [rx, ry] = recarga.posicion;
      this.dibujarRayo(ctx, startX + rx * cell + cell / 2, startY + ry * cell + cell / 2, cell * 0.26);
    }

    // objetivos (uno o varios); los ya alcanzados se atenúan
    const alcanzados = this.robot1.objetivosAlcanzados || [];
    for (const [gx, gy] of this.world.objetivos) {
      const hecho = alcanzados.includes(`${gx},${gy}`);
      ctx.globalAlpha = hecho ? 0.35 : 1;
      this.dibujarEstrella(
        ctx,
        startX + gx * cell + cell / 2,
        startY + gy * cell + cell / 2,
        cell * 0.22,
        COLOR_OBJETIVO
      );
      ctx.globalAlpha = 1;
    }

    for (const objeto of this.world.objetos) {
      const [ox, oy] = objeto.posicion;
      ctx.fillStyle = COLOR_OBJETO;
      this.roundRect(
        ctx,
        startX + ox * cell + cell * 0.32,
        startY + oy * cell + cell * 0.32,
        cell * 0.36,
        cell * 0.36,
        6
      );
      ctx.fill();
    }

    if (this.mostrarRobot !== false) {
      const rx = startX + this.visualX * cell + cell / 2;
      const ry = startY + this.visualY * cell + cell / 2;
      this.dibujarRobot(ctx, rx, ry, cell * 0.34);
    }
  }

  dibujarRobot(ctx, cx, cy, r) {
    ctx.save();
    ctx.translate(cx, cy);

    ctx.fillStyle = COLOR_ROBOT;
    this.roundRect(ctx, -r, -r, r * 2, r * 2, r * 0.4);
    ctx.fill();

    // indicador de dirección (punta triangular)
    const angulo = ANGULOS[this.robot1.direccion] ?? 0;
    ctx.save();
    ctx.rotate(angulo);
    ctx.fillStyle = COLOR_OBJETIVO;
    ctx.beginPath();
    ctx.moveTo(r * 1.35, 0);
    ctx.lineTo(r * 0.75, -r * 0.35);
    ctx.lineTo(r * 0.75, r * 0.35);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // ojos
    ctx.fillStyle = COLOR_ROBOT_OJO;
    ctx.beginPath();
    ctx.arc(-r * 0.15, -r * 0.1, r * 0.14, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(r * 0.3, -r * 0.1, r * 0.14, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    if (this.robot1.mensaje) {
      const texto = this.robot1.mensaje;
      ctx.font = "600 13px 'Space Grotesk', sans-serif";
      const anchoTexto = ctx.measureText(texto).width;
      const padX = 10;
      const bw = anchoTexto + padX * 2;
      const bh = 26;
      const bx = cx - bw / 2;
      const by = cy - r - bh - 14;

      ctx.fillStyle = COLOR_BURBUJA;
      this.roundRect(ctx, bx, by, bw, bh, 8);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx - 6, by + bh);
      ctx.lineTo(cx + 6, by + bh);
      ctx.lineTo(cx, by + bh + 8);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = COLOR_TEXTO_BURBUJA;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(texto, cx, by + bh / 2);
    }
  }

  dibujarRayo(ctx, cx, cy, r) {
    ctx.save();
    ctx.translate(cx, cy);
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

  roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  async moverAnimado(destinoX, destinoY, duracionMs = 380) {
    const inicioX = this.visualX;
    const inicioY = this.visualY;
    const deltaX = destinoX - inicioX;
    const deltaY = destinoY - inicioY;
    const t0 = performance.now();
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
          this.render();
          resolve();
        }
      };
      requestAnimationFrame(paso);
    });
  }
}
