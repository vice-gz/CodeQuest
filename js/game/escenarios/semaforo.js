// semaforo.js
// Mundo 1 · Nivel 8 «Semáforos y Decisiones» (comparadores, if / else, and, or).
// Un cruce visto desde arriba: el semáforo muestra la variable `color` ("verde", "amarillo" o "rojo") y, si `peaton` es True,
// hay una persona cruzando. El programa decide con un if y lo dice con print: «Avanzar» hace que el auto cruce, «Frenar» lo
// detiene antes de la línea (con luces de freno). Si el auto avanza con el semáforo en rojo o con alguien cruzando, choca de
// mentiritas (✗): la escena lo marca, pero quien decide si la fase pasa son los casos del nivel.
// Cada condición que evalúa el if aparece arriba con su resultado (True / False).
//
// config: { tipo: "semaforo", variables: { color: "rojo", peaton: true } }   (cada caso trae sus propias variables)

import { EscenarioMinijuego, COLORES } from "./minijuego.js";
import { rr, texto, FUENTE, FUENTE_MONO, facilitar } from "./dibujo.js";

const LUCES = { rojo: "#ff3b3b", amarillo: "#ffd23f", verde: "#2ee86b" };

export class EscenarioSemaforo extends EscenarioMinijuego {
  get tipo() {
    return "semaforo";
  }
  get tituloPanel() {
    return "El cruce · Semáforo";
  }
  get textoObserva() {
    return "Ejecuta el código y observa qué decide el auto en el cruce.";
  }

  modeloPropio() {
    this.auto = 0; // 0 = antes del cruce · 0.42 = detenido en la línea · 1 = ya cruzó
    this.decision = null; // "avanzar" | "frenar"
    this.condiciones = []; // [{ texto, valor }]
  }

  get peligro() {
    return this.vars.color === "rojo" || this.vars.peaton === true;
  }

  async alCondicion(t, valor) {
    this.condiciones.push({ texto: t, valor });
    if (this.condiciones.length > 2) this.condiciones.shift();
    this.render();
    await this.esperar(380);
  }

  async alImprimir(t) {
    const orden = t.trim().toLowerCase();
    if (orden === "avanzar") {
      this.decision = "avanzar";
      const desde = this.auto;
      await this.animar(900, (p) => {
        this.auto = desde + (1 - desde) * facilitar(p);
      });
    } else if (orden === "frenar") {
      this.decision = "frenar";
      const desde = this.auto;
      await this.animar(600, (p) => {
        this.auto = desde + (0.42 - desde) * facilitar(p);
      });
    }
  }

  dibujarEscena(ctx, z) {
    // calle horizontal y cruce peatonal
    const cy = z.y + z.h * 0.58;
    const alto = Math.min(110, z.h * 0.42);
    ctx.fillStyle = "#1b2238";
    ctx.fillRect(z.x, cy - alto / 2, z.w, alto);
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    for (let x = z.x + 10; x < z.x + z.w; x += 44) ctx.fillRect(x, cy - 1.5, 24, 3);
    const cruceX = z.x + z.w * 0.58;
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    for (let y = cy - alto / 2 + 6; y < cy + alto / 2 - 6; y += 14) ctx.fillRect(cruceX, y, 34, 8);
    ctx.fillStyle = COLORES.texto;
    ctx.fillRect(cruceX - 8, cy - alto / 2, 4, alto); // línea de alto

    // semáforo
    const sx = cruceX - 46;
    const sy = z.y + 16;
    ctx.fillStyle = "#444b63";
    ctx.fillRect(sx + 14, sy + 92, 6, cy - alto / 2 - sy - 92);
    rr(ctx, sx, sy, 34, 94, 8);
    ctx.fillStyle = "#11141f";
    ctx.fill();
    ["rojo", "amarillo", "verde"].forEach((c, i) => {
      const encendida = this.vars.color === c;
      ctx.beginPath();
      ctx.arc(sx + 17, sy + 17 + i * 30, 11, 0, Math.PI * 2);
      ctx.fillStyle = encendida ? LUCES[c] : "rgba(255,255,255,0.08)";
      ctx.fill();
    });
    // la etiqueta va a la izquierda del semáforo, sobre la banqueta (no encima del paso peatonal)
    texto(ctx, `color = "${this.vars.color ?? "?"}"`, sx - 8, sy + 60, { fuente: `600 11px ${FUENTE_MONO}`, color: COLORES.suave, align: "right" });

    // peatón
    if (this.vars.peaton === true) {
      const px = cruceX + 17;
      const py = cy - 6;
      ctx.fillStyle = COLORES.amarillo;
      ctx.beginPath();
      ctx.arc(px, py - 22, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = COLORES.amarillo;
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(px, py - 14);
      ctx.lineTo(px, py + 6);
      ctx.moveTo(px, py + 6);
      ctx.lineTo(px - 7, py + 18);
      ctx.moveTo(px, py + 6);
      ctx.lineTo(px + 7, py + 18);
      ctx.moveTo(px - 8, py - 6);
      ctx.lineTo(px + 8, py - 4);
      ctx.stroke();
    }
    texto(ctx, `peaton = ${this.vars.peaton === true ? "True" : this.vars.peaton === false ? "False" : "?"}`, cruceX + 17, cy + alto / 2 + 14, { fuente: `600 11px ${FUENTE_MONO}`, color: COLORES.suave });

    // auto
    const ax = z.x + 20 + (z.w - 120) * this.auto;
    const ay = cy + alto * 0.12;
    rr(ctx, ax, ay - 14, 74, 30, 9);
    ctx.fillStyle = COLORES.cian;
    ctx.fill();
    rr(ctx, ax + 18, ay - 10, 34, 22, 5);
    ctx.fillStyle = "#0d3b4a";
    ctx.fill();
    ctx.fillStyle = this.decision === "frenar" ? "#ff3b3b" : "#5b1b1b"; // luces de freno
    ctx.fillRect(ax - 2, ay - 11, 4, 7);
    ctx.fillRect(ax - 2, ay + 6, 4, 7);
    ctx.fillStyle = "#fff6c2";
    ctx.fillRect(ax + 72, ay - 11, 4, 6);
    ctx.fillRect(ax + 72, ay + 7, 4, 6);

    // resultado de la decisión
    if (this.decision && this.auto >= 0.99 && this.peligro) this.sello(ctx, "¡PELIGRO!", z.x + z.w * 0.82, z.y + 34, COLORES.rojo, 0.85);
    else if (this.decision === "frenar" && !this.peligro) this.sello(ctx, "¿Por qué?", z.x + z.w * 0.82, z.y + 34, COLORES.amarillo, 0.8);
    else if (this.decision) this.sello(ctx, "✓ Seguro", z.x + z.w * 0.82, z.y + 34, COLORES.verde, 0.85);

    // condiciones evaluadas
    this.condiciones.forEach((c, i) => {
      const y = z.y + 16 + i * 22;
      texto(ctx, `${c.texto}  →  ${c.valor ? "True" : "False"}`, z.x + 12, y, {
        fuente: `600 12px ${FUENTE_MONO}`,
        color: c.valor ? COLORES.verde : COLORES.rojo,
        align: "left",
        maxAncho: sx - z.x - 20,
      });
    });
    if (!this.condiciones.length) texto(ctx, "Aquí verás cada condición del if", z.x + 12, z.y + 16, { fuente: `500 12px ${FUENTE}`, color: COLORES.suave, align: "left", maxAncho: sx - z.x - 20 });
  }
}
