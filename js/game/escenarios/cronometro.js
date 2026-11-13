// cronometro.js
// Mundo 1 · Nivel 17 «El Cronómetro» (división entera // y residuo %).
// Un cronómetro digital: arriba, el total de segundos (variable `total`, la trae cada caso); abajo, la pantalla HH:MM:SS que se
// arma con las variables horas, minutos y segundos conforme el programa las calcula. Junto a cada cifra se ve la operación
// que la produjo, para relacionar // con «cuántas veces cabe» y % con «lo que sobra».
//
// config: { tipo: "cronometro", variables: { total: 3725 } }

import { EscenarioMinijuego, COLORES, num } from "./minijuego.js";
import { rr, texto, FUENTE, FUENTE_MONO } from "./dibujo.js";

const DOS = (v) => (num(v) === null ? "--" : String(Math.trunc(v)).padStart(2, "0"));

export class EscenarioCronometro extends EscenarioMinijuego {
  get tipo() {
    return "cronometro";
  }
  get tituloPanel() {
    return "El Cronómetro";
  }
  get textoObserva() {
    return "Ejecuta el código y observa cómo se arma la hora en el cronómetro.";
  }

  dibujarEscena(ctx, z) {
    const cx = z.x + z.w / 2;
    // cuerpo del cronómetro
    const r = Math.min(z.h * 0.42, z.w * 0.3);
    const cy = z.y + z.h * 0.54;
    ctx.fillStyle = "#454d66";
    rr(ctx, cx - 14, cy - r - 22, 28, 16, 4);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = "#1d2440";
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = COLORES.cian;
    ctx.stroke();
    // aguja: avanza con los segundos calculados (o con el total si aún no hay)
    const s = num(this.vars.segundos) ?? num(this.vars.total) ?? 0;
    const ang = ((s % 60) / 60) * Math.PI * 2 - Math.PI / 2;
    ctx.strokeStyle = "rgba(255, 92, 124, 0.85)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(ang) * r * 0.82, cy + Math.sin(ang) * r * 0.82);
    ctx.stroke();
    // total
    texto(ctx, `total = ${num(this.vars.total) ?? "?"} segundos`, cx, cy - r * 0.45, { fuente: `600 ${Math.max(11, Math.round(r * 0.11))}px ${FUENTE_MONO}`, color: COLORES.suave });
    // pantalla HH:MM:SS
    const pw = r * 1.5;
    const ph = r * 0.42;
    rr(ctx, cx - pw / 2, cy - ph / 2 + r * 0.05, pw, ph, 8);
    ctx.fillStyle = "#07120c";
    ctx.fill();
    const partes = [
      ["horas", DOS(this.vars.horas)],
      ["minutos", DOS(this.vars.minutos)],
      ["segundos", DOS(this.vars.segundos)],
    ];
    const tam = Math.round(ph * 0.62);
    partes.forEach(([nombre, v], i) => {
      const x = cx + (i - 1) * pw * 0.32;
      texto(ctx, v, x, cy + r * 0.05, { fuente: `700 ${tam}px ${FUENTE_MONO}`, color: this.brillo(nombre) > 0 ? COLORES.verde : v === "--" ? "#2c5a3e" : "#3cff8f" });
      if (i < 2) texto(ctx, ":", x + pw * 0.16, cy + r * 0.03, { fuente: `700 ${tam}px ${FUENTE_MONO}`, color: "#3cff8f" });
      texto(ctx, nombre, x, cy + r * 0.05 + ph * 0.62, { fuente: `500 10px ${FUENTE}`, color: COLORES.suave });
    });
    // pista visual a los lados: 1 h = 3600 s, 1 min = 60 s
    if (z.w > 440) {
      texto(ctx, "1 hora = 3600 s", z.x + 14, z.y + 18, { fuente: `600 12px ${FUENTE}`, color: COLORES.suave, align: "left" });
      texto(ctx, "1 minuto = 60 s", z.x + 14, z.y + 36, { fuente: `600 12px ${FUENTE}`, color: COLORES.suave, align: "left" });
      texto(ctx, "//  cuántas veces cabe", z.x + z.w - 14, z.y + 18, { fuente: `600 12px ${FUENTE_MONO}`, color: COLORES.amarillo, align: "right" });
      texto(ctx, "%   lo que sobra", z.x + z.w - 14, z.y + 36, { fuente: `600 12px ${FUENTE_MONO}`, color: COLORES.amarillo, align: "right" });
    }
  }
}
