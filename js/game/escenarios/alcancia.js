// alcancia.js
// Mundo 1 · Nivel 6 «La Alcancía» (reasignación: ahorro = ahorro + mesada, o ahorro += mesada).
// Un cochinito con una ranura: cada vez que la variable del dinero (config.variable, «ahorro» por omisión) AUMENTA, cae una
// moneda por la ranura y se marca una semana en el calendario. Así se ve que reasignar no crea otra variable: cambia el
// valor de la misma caja. La meta (config.meta) se muestra como una barra.
//
// config: { tipo: "alcancia", variable: "ahorro", semanas: 4, meta: 400 }
// Validación propia: { tipo: "alcancia_depositos", minimo: 4 }  → hubo al menos 4 depósitos (4 reasignaciones que suben)

import { EscenarioMinijuego, COLORES, num } from "./minijuego.js";
import { rr, texto, FUENTE, FUENTE_MONO, facilitar } from "./dibujo.js";

export class EscenarioAlcancia extends EscenarioMinijuego {
  get tipo() {
    return "alcancia";
  }
  get tituloPanel() {
    return "La Alcancía";
  }
  get textoObserva() {
    return "Ejecuta el código y observa cómo cae cada moneda en la alcancía.";
  }
  get nombreVariable() {
    return this.config.variable || "ahorro";
  }

  modeloPropio() {
    this.depositos = []; // cantidad que entró en cada depósito
    this.moneda = null; // { p } animación de la moneda que cae
  }

  async alAsignar(nombre, valor, anterior) {
    if (nombre !== this.nombreVariable) return;
    const a = num(anterior);
    const v = num(valor);
    if (a === null || v === null || v <= a) return;
    this.depositos.push(v - a);
    this.moneda = { p: 0, cantidad: v - a };
    await this.animar(520, (t) => {
      this.moneda.p = facilitar(t);
    });
    this.moneda = null;
  }

  evaluar(v) {
    if (v.tipo === "alcancia_depositos") return this.depositos.length >= (v.minimo ?? 1);
    return undefined;
  }

  dibujarEscena(ctx, z) {
    const dinero = num(this.vars[this.nombreVariable]);
    const angosto = z.w < 520;
    // --- cochinito
    const cx = z.x + (angosto ? z.w * 0.3 : z.w * 0.28);
    const cy = z.y + z.h * 0.52;
    const r = Math.min(z.h * 0.27, z.w * (angosto ? 0.2 : 0.16));
    ctx.fillStyle = "#b9476b";
    for (const dx of [-0.55, 0.45]) {
      rr(ctx, cx + dx * r, cy + r * 0.62, r * 0.22, r * 0.42, 4);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.ellipse(cx, cy, r * 1.15, r * 0.85, 0, 0, Math.PI * 2);
    ctx.fillStyle = COLORES.rosa;
    ctx.fill();
    ctx.beginPath(); // oreja
    ctx.moveTo(cx - r * 0.35, cy - r * 0.7);
    ctx.lineTo(cx - r * 0.05, cy - r * 1.12);
    ctx.lineTo(cx + r * 0.15, cy - r * 0.72);
    ctx.fillStyle = "#f06d97";
    ctx.fill();
    ctx.beginPath(); // trompa
    ctx.ellipse(cx + r * 1.12, cy + r * 0.05, r * 0.24, r * 0.3, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#f06d97";
    ctx.fill();
    ctx.fillStyle = "#7a2442";
    for (const dy of [-0.08, 0.16]) {
      ctx.beginPath();
      ctx.arc(cx + r * 1.15, cy + dy * r, r * 0.05, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.beginPath(); // ojo
    ctx.arc(cx + r * 0.62, cy - r * 0.3, r * 0.08, 0, Math.PI * 2);
    ctx.fillStyle = "#2b0f1c";
    ctx.fill();
    rr(ctx, cx - r * 0.3, cy - r * 0.86, r * 0.6, r * 0.11, 3); // ranura
    ctx.fillStyle = "#3b0f22";
    ctx.fill();
    texto(ctx, dinero === null ? "$ ?" : `$ ${dinero}`, cx, cy + r * 0.18, { fuente: `800 ${Math.round(r * 0.36)}px ${FUENTE}`, color: "#4a1028" });

    // --- moneda cayendo
    if (this.moneda) {
      const y0 = z.y + 14;
      const y1 = cy - r * 0.8;
      const my = y0 + (y1 - y0) * this.moneda.p;
      ctx.beginPath();
      ctx.ellipse(cx, my, r * 0.2, r * 0.2 * (1 - 0.5 * this.moneda.p), 0, 0, Math.PI * 2);
      ctx.fillStyle = COLORES.amarillo;
      ctx.fill();
      ctx.strokeStyle = "#b8860b";
      ctx.lineWidth = 2;
      ctx.stroke();
      texto(ctx, `+${this.moneda.cantidad}`, cx + r * 0.42, my, { fuente: `700 12px ${FUENTE}`, color: COLORES.amarillo, align: "left" });
    }

    // --- calendario de semanas
    const semanas = this.config.semanas ?? 4;
    const zx = angosto ? z.x + z.w * 0.6 : z.x + z.w * 0.55;
    const zw = z.x + z.w - 14 - zx;
    texto(ctx, "Calendario de ahorro", zx + zw / 2, z.y + 22, { fuente: `700 13px ${FUENTE}`, color: COLORES.suave });
    const filas = angosto ? semanas : Math.ceil(semanas / 2);
    const cols = angosto ? 1 : 2;
    const alto = Math.min(46, (z.h * 0.62) / filas - 6);
    const anchoCaja = (zw - (cols - 1) * 8) / cols;
    for (let i = 0; i < semanas; i++) {
      const col = i % cols;
      const fila = Math.floor(i / cols);
      const x = zx + col * (anchoCaja + 8);
      const y = z.y + 38 + fila * (alto + 6);
      const hecho = this.depositos[i] !== undefined;
      rr(ctx, x, y, anchoCaja, alto, 8);
      ctx.fillStyle = hecho ? "rgba(56, 249, 151, 0.16)" : "rgba(15, 26, 54, 0.9)";
      ctx.fill();
      ctx.strokeStyle = hecho ? COLORES.verde : COLORES.linea;
      ctx.lineWidth = 1.2;
      ctx.stroke();
      texto(ctx, `Semana ${i + 1}`, x + 10, y + alto / 2, { fuente: `600 12px ${FUENTE}`, color: COLORES.texto, align: "left" });
      texto(ctx, hecho ? `+$${this.depositos[i]}` : "—", x + anchoCaja - 10, y + alto / 2, { fuente: `700 12px ${FUENTE_MONO}`, color: hecho ? COLORES.verde : COLORES.suave, align: "right" });
    }

    // --- meta
    const meta = this.config.meta;
    if (meta) {
      const by = z.y + z.h - 26;
      const bx = z.x + 16;
      const bw = z.w - 32;
      rr(ctx, bx, by, bw, 12, 6);
      ctx.fillStyle = "rgba(15, 26, 54, 0.9)";
      ctx.fill();
      const p = Math.max(0, Math.min(1, (dinero ?? 0) / meta));
      if (p > 0) {
        rr(ctx, bx, by, bw * p, 12, 6);
        ctx.fillStyle = p >= 1 ? COLORES.verde : COLORES.amarillo;
        ctx.fill();
      }
      texto(ctx, `Meta: $${meta}${p >= 1 ? "  ✓" : ""}`, bx + bw, by - 10, { fuente: `600 12px ${FUENTE}`, color: p >= 1 ? COLORES.verde : COLORES.suave, align: "right" });
    }
  }
}
