// boleta.js
// Mundo 1 · Nivel 18 «La Boleta» (expresiones booleanas: aprobado = promedio >= 70 and asistencia >= 80, sin if).
// Una boleta de calificaciones con el promedio y la asistencia del alumno (variables que trae cada caso). Cuando el programa
// guarda un valor lógico (True / False) en `aprobado` (config.variable), cae el sello APROBADO o REPROBADO; y cada regla de la
// boleta se marca ✓/✗ con el valor real, para comparar lo que calculó el programa con lo que dice la regla.
//
// config: { tipo: "boleta", variables: { promedio: 85, asistencia: 90 }, minimoPromedio: 70, minimoAsistencia: 80 }

import { EscenarioMinijuego, COLORES, num, mostrar } from "./minijuego.js";
import { rr, texto, FUENTE, FUENTE_MONO, facilitar } from "./dibujo.js";

export class EscenarioBoleta extends EscenarioMinijuego {
  get tipo() {
    return "boleta";
  }
  get tituloPanel() {
    return "La Boleta";
  }
  get textoObserva() {
    return "Ejecuta el código y observa qué sello recibe la boleta.";
  }
  get nombreVariable() {
    return this.config.variable || "aprobado";
  }

  modeloPropio() {
    this.selloP = 0;
  }

  async alAsignar(nombre, valor) {
    if (nombre !== this.nombreVariable || typeof valor !== "boolean") return;
    this.selloP = 0;
    await this.animar(420, (t) => {
      this.selloP = facilitar(t);
    });
  }

  dibujarEscena(ctx, z) {
    const bw = Math.min(z.w - 28, 420);
    const bx = z.x + (z.w - bw) / 2;
    const by = z.y + 12;
    const bh = z.h - 22;
    rr(ctx, bx, by, bw, bh, 10);
    ctx.fillStyle = "#f5f1e6";
    ctx.fill();
    ctx.fillStyle = "#1f3a6b";
    rr(ctx, bx, by, bw, 32, 10);
    ctx.fill();
    ctx.fillRect(bx, by + 20, bw, 12);
    texto(ctx, "BOLETA DE CALIFICACIONES", bx + bw / 2, by + 16, { fuente: `800 13px ${FUENTE}`, color: "#ffffff" });

    const minP = this.config.minimoPromedio ?? 70;
    const minA = this.config.minimoAsistencia ?? 80;
    const p = num(this.vars.promedio);
    const a = num(this.vars.asistencia);
    const reglas = [
      { etiqueta: "Promedio", valor: p === null ? "?" : mostrar(this.vars.promedio), regla: `>= ${minP}`, ok: p === null ? null : p >= minP },
      { etiqueta: "Asistencia", valor: a === null ? "?" : `${mostrar(this.vars.asistencia)} %`, regla: `>= ${minA}`, ok: a === null ? null : a >= minA },
    ];
    const asignado = typeof this.vars[this.nombreVariable] === "boolean";
    reglas.forEach((r, i) => {
      const y = by + 58 + i * 34;
      texto(ctx, r.etiqueta, bx + 16, y, { fuente: `600 13px ${FUENTE}`, color: "#2a2a2a", align: "left" });
      texto(ctx, r.valor, bx + bw * 0.5, y, { fuente: `700 14px ${FUENTE_MONO}`, color: "#1f3a6b" });
      texto(ctx, r.regla, bx + bw * 0.72, y, { fuente: `500 12px ${FUENTE_MONO}`, color: "#6b6b6b" });
      if (asignado && r.ok !== null) texto(ctx, r.ok ? "✓" : "✗", bx + bw - 20, y, { fuente: `800 16px ${FUENTE}`, color: r.ok ? "#1f8a4c" : "#c0392b" });
      ctx.fillStyle = "rgba(0,0,0,0.08)";
      ctx.fillRect(bx + 12, y + 16, bw - 24, 1);
    });
    texto(ctx, `${this.nombreVariable} = ${asignado ? mostrar(this.vars[this.nombreVariable]) : "?"}`, bx + 16, by + 58 + 2 * 34, {
      fuente: `700 13px ${FUENTE_MONO}`,
      color: asignado ? "#1f3a6b" : "#8a8a8a",
      align: "left",
    });
    if (asignado) {
      const ok = this.vars[this.nombreVariable];
      this.sello(ctx, ok ? "APROBADO" : "REPROBADO", bx + bw * 0.68, by + bh - 34, ok ? "#1f8a4c" : "#c0392b", 0.6 + 0.4 * this.selloP);
    }
  }
}
