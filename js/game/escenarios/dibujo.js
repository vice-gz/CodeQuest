// dibujo.js
// Utilidades de Canvas 2D compartidas por todos los escenarios, para que los
// mundos compartan estilo (esquinas, tipografía, mascota, iluminación y texturas).

import { calidad } from "../rendimiento.js";

export const FUENTE = "'Space Grotesk', system-ui, sans-serif";
export const FUENTE_MONO = "'JetBrains Mono', ui-monospace, monospace";

export function rr(ctx, x, y, w, h, r) {
  // Si el lienzo aún no tiene tamaño (w o h ≤ 0) el radio no puede ser negativo: arcTo lanzaría un error.
  const radio = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + radio, y);
  ctx.arcTo(x + w, y, x + w, y + h, radio);
  ctx.arcTo(x + w, y + h, x, y + h, radio);
  ctx.arcTo(x, y + h, x, y, radio);
  ctx.arcTo(x, y, x + w, y, radio);
  ctx.closePath();
}

export function texto(ctx, str, x, y, { fuente = `600 14px ${FUENTE}`, color = "#f0f4ff", align = "center", base = "middle", maxAncho = null } = {}) {
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
  if (!calidad.bajo) {
    // Los resplandores (shadowBlur) son lo más caro de Canvas 2D: en calidad baja se dibuja la forma sin ellos.
    ctx.shadowColor = color;
    ctx.shadowBlur = desenfoque;
  }
  fn();
  ctx.restore();
}

/** Gradiente radial seguro (compatible con mocks de pruebas sin createRadialGradient). */
export function gradRadial(ctx, x0, y0, r0, x1, y1, r1, paradas = [], fallback = "#00E5FF") {
  if (typeof ctx.createRadialGradient !== "function") return fallback;
  const g = ctx.createRadialGradient(x0, y0, r0, x1, y1, r1);
  if (!g || typeof g.addColorStop !== "function") return fallback;
  for (const [offset, color] of paradas) g.addColorStop(offset, color);
  return g;
}

/**
 * Dibuja a Nix (el ajolote espacial / ser de datos) en cualquier escenario Canvas 2D.
 * Se puede invocar como `dibujarMascota(ctx, x, y)` o `dibujarMascota(ctx, x, y, r, opciones)`.
 */
export function dibujarMascota(ctx, cx, cy, r = 16, { color = "#00E5FF", acento = "#A855F7", mirada = 0, anim = null, estado = "normal", etiqueta = null } = {}) {
  const t = anim !== null ? anim : (typeof performance !== "undefined" ? performance.now() : 0) * 0.0028;
  const flotarY = Math.sin(t * 1.6) * (r * 0.16);
  const flotarX = Math.cos(t * 0.9) * (r * 0.06);

  ctx.save();
  ctx.translate(cx + flotarX, cy + flotarY);

  // 1. Aura cósmica exterior
  const auraColor = estado === "error" ? "rgba(255, 68, 102, 0.35)" : estado === "exito" ? "rgba(0, 229, 255, 0.45)" : "rgba(168, 85, 247, 0.32)";
  ctx.fillStyle = gradRadial(
    ctx,
    0,
    0,
    r * 0.2,
    0,
    0,
    r * 2.1,
    [
      [0, auraColor],
      [0.55, "rgba(0, 229, 255, 0.14)"],
      [1, "rgba(18, 14, 36, 0)"],
    ],
    "rgba(168, 85, 247, 0.18)"
  );
  ctx.beginPath();
  ctx.arc(0, 0, r * 2.1, 0, Math.PI * 2);
  ctx.fill();

  // 2. Estela / cola cósmica inferior con partículas de datos
  const ondulaCola = Math.sin(t * 2.8) * (r * 0.22);
  ctx.save();
  ctx.fillStyle = acento;
  ctx.globalAlpha = 0.78;
  ctx.beginPath();
  ctx.moveTo(-r * 0.42, r * 0.45);
  ctx.quadraticCurveTo(-r * 0.55 + ondulaCola * 0.5, r * 1.25, ondulaCola, r * 1.75);
  ctx.quadraticCurveTo(r * 0.55 + ondulaCola * 0.5, r * 1.25, r * 0.42, r * 0.45);
  ctx.closePath();
  ctx.fill();

  // Filamento bioluminiscente interno de la cola
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  ctx.moveTo(-r * 0.18, r * 0.5);
  ctx.quadraticCurveTo(ondulaCola * 0.4, r * 1.1, ondulaCola * 0.75, r * 1.42);
  ctx.quadraticCurveTo(r * 0.18 + ondulaCola * 0.3, r * 1.05, r * 0.18, r * 0.5);
  ctx.closePath();
  ctx.fill();

  // Píxeles de datos desprendiéndose
  for (let i = 0; i < 3; i++) {
    const px = Math.sin(t * 2.1 + i * 2.1) * (r * 0.7);
    const py = r * (1.15 + ((t * 0.5 + i * 0.33) % 0.85));
    const tam = Math.max(1.5, r * 0.13 * (1 - (py - r) / (r * 1.1)));
    ctx.fillStyle = i % 2 === 0 ? color : "#E2D9F3";
    ctx.globalAlpha = 0.75;
    ctx.fillRect(px - tam / 2, py - tam / 2, tam, tam);
  }
  ctx.restore();

  // 3. Branquias mágicas de ajolote (3 pares a cada lado)
  for (const lado of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const angBase = (i - 1) * 0.36 + Math.sin(t * 2.6 + i + lado) * 0.08;
      const gx0 = lado * r * 0.78;
      const gy0 = (-0.28 + i * 0.26) * r;
      const gx1 = lado * r * (1.48 - i * 0.08) + Math.cos(angBase) * lado * r * 0.12;
      const gy1 = gy0 + Math.sin(angBase) * r * 0.42 - r * 0.12;

      ctx.strokeStyle = acento;
      ctx.lineWidth = Math.max(2, r * 0.22);
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(gx0, gy0);
      ctx.quadraticCurveTo((gx0 + gx1) * 0.5, gy0 - r * 0.14, gx1, gy1);
      ctx.stroke();

      // Punta cian bioluminiscente en cada branquia
      ctx.fillStyle = estado === "error" ? "#FF5470" : color;
      ctx.beginPath();
      ctx.arc(gx1, gy1, Math.max(1.6, r * 0.13), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 4. Cabeza / Cuerpo ovalado de ajolote cósmico
  conBrillo(ctx, estado === "error" ? "#FF5470" : color, r * 0.65, () => {
    const gradCuerpo = ctx.createLinearGradient(-r, -r, r, r);
    gradCuerpo.addColorStop(0, "#3D2478");
    gradCuerpo.addColorStop(0.55, "#23144A");
    gradCuerpo.addColorStop(1, "#140B2E");
    ctx.fillStyle = gradCuerpo;
    rr(ctx, -r * 0.96, -r * 0.78, r * 1.92, r * 1.52, r * 0.72);
    ctx.fill();
  });

  ctx.strokeStyle = estado === "error" ? "#FF5470" : color;
  ctx.lineWidth = Math.max(1.4, r * 0.1);
  rr(ctx, -r * 0.96, -r * 0.78, r * 1.92, r * 1.52, r * 0.72);
  ctx.stroke();

  // 5. Gema / Núcleo de datos en la frente
  conBrillo(ctx, color, 8, () => {
    ctx.fillStyle = estado === "error" ? "#FF5470" : color;
    ctx.beginPath();
    ctx.arc(mirada * r * 0.08, -r * 0.34, r * 0.16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(mirada * r * 0.08, -r * 0.34, r * 0.07, 0, Math.PI * 2);
    ctx.fill();
  });

  // 6. Ojos expresivos y sonrisa
  const ox = mirada * r * 0.11;
  for (const dx of [-0.4, 0.4]) {
    const ex = r * dx + ox;
    const ey = -r * 0.02;
    if (estado === "exito" || estado === "feliz") {
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(1.8, r * 0.13);
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(ex, ey + r * 0.05, r * 0.18, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
    } else {
      conBrillo(ctx, estado === "error" ? "#FF5470" : color, 6, () => {
        ctx.fillStyle = estado === "error" ? "#FF5470" : color;
        ctx.beginPath();
        ctx.arc(ex, ey, r * 0.21, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(ex - r * 0.06, ey - r * 0.06, r * 0.07, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Sonrisa sutil
  ctx.strokeStyle = "#E2D9F3";
  ctx.lineWidth = Math.max(1.2, r * 0.08);
  ctx.lineCap = "round";
  ctx.beginPath();
  if (estado === "error") {
    ctx.arc(ox, r * 0.34, r * 0.14, Math.PI * 1.15, Math.PI * 1.85);
  } else {
    ctx.arc(ox, r * 0.18, r * 0.18, Math.PI * 0.18, Math.PI * 0.82);
  }
  ctx.stroke();

  if (etiqueta) {
    texto(ctx, etiqueta, 0, -r * 1.15, {
      fuente: `700 ${Math.max(9, Math.round(r * 0.55))}px ${FUENTE_MONO}`,
      color: "#E2D9F3",
    });
  }

  ctx.restore();
}

/** Alias de compatibilidad para todos los mundos que invocan `mascota()`. */
export function mascota(ctx, cx, cy, r = 14, opciones = {}) {
  dibujarMascota(ctx, cx, cy, r, opciones);
}

/**
 * Dibuja un bloque/cubo en perspectiva isométrica 2.5D con cara superior,
 * frontal-izquierda y frontal-derecha.
 */
export function cuboIsometrico(
  ctx,
  cx,
  cy,
  rx,
  ry,
  alto,
  { arriba = "#1E293B", izquierda = "#0F172A", derecha = "#334155", borde = "#14B8A6", grosor = 1.5 } = {}
) {
  ctx.save();
  ctx.lineJoin = "round";
  ctx.lineWidth = grosor;
  ctx.strokeStyle = borde;

  // Cara superior (rombo en cy - alto/2)
  const yTop = cy - alto / 2;
  const yBot = cy + alto / 2;

  // Cara izquierda
  ctx.fillStyle = izquierda;
  ctx.beginPath();
  ctx.moveTo(cx - rx, yTop);
  ctx.lineTo(cx, yTop + ry);
  ctx.lineTo(cx, yBot + ry);
  ctx.lineTo(cx - rx, yBot);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Cara derecha
  ctx.fillStyle = derecha;
  ctx.beginPath();
  ctx.moveTo(cx + rx, yTop);
  ctx.lineTo(cx, yTop + ry);
  ctx.lineTo(cx, yBot + ry);
  ctx.lineTo(cx + rx, yBot);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Cara superior
  ctx.fillStyle = arriba;
  ctx.beginPath();
  ctx.moveTo(cx, yTop - ry);
  ctx.lineTo(cx + rx, yTop);
  ctx.lineTo(cx, yTop + ry);
  ctx.lineTo(cx - rx, yTop);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

export const facilitar = (t) => 1 - (1 - t) ** 3;
export const mezclar = (a, b, t) => a + (b - a) * t;

/**
 * Capa estática en caché: lo que no cambia de un cuadro a otro (fondos con degradados, mallas…) se pinta UNA vez en un canvas
 * aparte y después solo se copia con drawImage (mucho más barato que recalcular degradados a pantalla completa en cada cuadro).
 * La caché se rehace sola si cambia el tamaño, la densidad de pantalla o la `variante` (cualquier dato del que dependa el dibujo).
 * Si no se puede crear un canvas auxiliar (pruebas sin navegador) se pinta directo.
 * @param {object} duenio    objeto donde se guarda la caché (el escenario)
 * @param {string} nombre    nombre de la capa
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} w         ancho en píxeles CSS
 * @param {number} h
 * @param {string} variante
 * @param {(c:CanvasRenderingContext2D)=>void} pintar  dibuja la capa en coordenadas CSS (0..w, 0..h)
 */
export function capaCacheada(duenio, nombre, ctx, w, h, variante, pintar) {
  const dpr = (typeof window !== "undefined" && window.devicePixelRatio) || 1;
  const clave = `${Math.round(w)}x${Math.round(h)}@${dpr}|${variante}`;
  const capas = (duenio._capas ??= {});
  let capa = capas[nombre];
  if (!capa || capa.clave !== clave) {
    let lienzo = null;
    let cx = null;
    try {
      lienzo = typeof document !== "undefined" ? document.createElement("canvas") : null;
      cx = lienzo?.getContext?.("2d") ?? null;
    } catch {
      cx = null;
    }
    if (cx && w > 0 && h > 0) {
      lienzo.width = Math.max(1, Math.round(w * dpr));
      lienzo.height = Math.max(1, Math.round(h * dpr));
      cx.setTransform(lienzo.width / w, 0, 0, lienzo.height / h, 0, 0);
      pintar(cx);
      capa = capas[nombre] = { clave, lienzo };
    } else {
      capa = capas[nombre] = { clave, lienzo: null };
    }
  }
  if (capa.lienzo) ctx.drawImage(capa.lienzo, 0, 0, w, h);
  else pintar(ctx);
}
