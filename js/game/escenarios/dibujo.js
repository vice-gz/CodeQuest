// dibujo.js
// Utilidades de Canvas 2D compartidas por todos los escenarios, para que los
// mundos compartan estilo (esquinas, tipografía, mascota, iluminación).

export const FUENTE = "'Space Grotesk', system-ui, sans-serif";
export const FUENTE_MONO = "'JetBrains Mono', ui-monospace, monospace";

export function rr(ctx, x, y, w, h, r) {
  const radio = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radio, y);
  ctx.arcTo(x + w, y, x + w, y + h, radio);
  ctx.arcTo(x + w, y + h, x, y + h, radio);
  ctx.arcTo(x, y + h, x, y, radio);
  ctx.arcTo(x, y, x + w, y, radio);
  ctx.closePath();
}

export function texto(ctx, str, x, y, { fuente = `600 14px ${FUENTE}`, color = "#edeffa", align = "center", base = "middle", maxAncho = null } = {}) {
  ctx.save();
  ctx.font = fuente;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = base;
  let t = String(str);
  if (maxAncho) {
    while (t.length > 1 && ctx.measureText(t).width > maxAncho) t = `${t.slice(0, -2)}…`;
  }
  ctx.fillText(t, x, y);
  ctx.restore();
}

/** Dibuja con un resplandor del color indicado. */
export function conBrillo(ctx, color, desenfoque, fn) {
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = desenfoque;
  fn();
  ctx.restore();
}

/** Cabeza de Robot1 como mascota: aparece en los mundos donde no es protagonista. */
export function mascota(ctx, cx, cy, r, { color = "#5eead4", mirada = 0 } = {}) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = color;
  rr(ctx, -r, -r * 0.85, r * 2, r * 1.7, r * 0.4);
  ctx.fill();
  ctx.fillStyle = "#0f1424";
  for (const dx of [-0.38, 0.38]) {
    ctx.beginPath();
    ctx.arc(r * dx + mirada * r * 0.08, -r * 0.1, r * 0.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillRect(-r * 0.3, r * 0.3, r * 0.6, r * 0.1);
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1.5, r * 0.1);
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.85);
  ctx.lineTo(0, -r * 1.2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, -r * 1.25, r * 0.12, 0, Math.PI * 2);
  ctx.fillStyle = "#ffb84d";
  ctx.fill();
  ctx.restore();
}

export const facilitar = (t) => 1 - (1 - t) ** 3;
export const mezclar = (a, b, t) => a + (b - a) * t;
