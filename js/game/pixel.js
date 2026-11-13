// pixel.js
// Herramientas de PIXEL ART para el juego: paleta fija, una fuente de 3×5 píxeles, mapas de caracteres y el sprite de Nix.
// El estilo se consigue dibujando en un lienzo pequeño (p. ej. 200×112) y escalándolo con números ENTEROS sin suavizado:
// se ve nítido y casi no cuesta CPU (la capa estática se pinta una sola vez; lo que se mueve son unos cuantos rectángulos).

/** Paleta de 16 colores (la clásica «Sweetie 16») + dos rosas para Nix. Todo el pixel art del juego sale de aquí. */
export const PAL = {
  negro: "#1a1c2c",
  vino: "#5d275d",
  rojo: "#b13e53",
  naranja: "#ef7d57",
  amarillo: "#ffcd75",
  verdeClaro: "#a7f070",
  verde: "#38b764",
  turquesa: "#257179",
  azulOscuro: "#29366f",
  azul: "#3b5dc9",
  celeste: "#41a6f6",
  cian: "#73eff7",
  blanco: "#f4f4f4",
  gris: "#94b0c2",
  grisOscuro: "#566c86",
  pizarra: "#333c57",
  rosa: "#ff8fb8",
  rosaClaro: "#ffc2d9",
};

/** Lienzo auxiliar pequeño. Devuelve null donde no existe `document` (pruebas): quien lo use debe tolerarlo. */
export function crearLienzoPixel(ancho, alto) {
  try {
    if (typeof document === "undefined") return null;
    const canvas = document.createElement("canvas");
    canvas.width = ancho;
    canvas.height = alto;
    const ctx = canvas.getContext?.("2d");
    if (!ctx) return null;
    ctx.imageSmoothingEnabled = false;
    return { canvas, ctx };
  } catch {
    return null;
  }
}

/** Rectángulo de píxeles enteros. */
export function px(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), w, h);
}

/** Pinta un mapa de caracteres: cada letra de `claves` es un color; «.» es transparente. */
export function pintarMapa(ctx, filas, claves, x, y) {
  filas.forEach((fila, j) => {
    let i = 0;
    while (i < fila.length) {
      const c = fila[i];
      if (c === "." || !claves[c]) {
        i++;
        continue;
      }
      let k = i + 1;
      while (k < fila.length && fila[k] === c) k++; // une los píxeles iguales de una fila en un solo rectángulo
      px(ctx, x + i, y + j, k - i, 1, claves[c]);
      i = k;
    }
  });
}

// ---------------------------------------------------------------- Fuente 3×5 (mayúsculas, dígitos y signos básicos)
const GLIFOS = {
  0: "111101101101111", 1: "010110010010111", 2: "111001111100111", 3: "111001111001111", 4: "101101111001001",
  5: "111100111001111", 6: "111100111101111", 7: "111001001001001", 8: "111101111101111", 9: "111101111001111",
  A: "010101111101101", B: "110101110101110", C: "011100100100011", D: "110101101101110", E: "111100110100111",
  F: "111100110100100", G: "011100101101011", H: "101101111101101", I: "111010010010111", J: "001001001101010",
  K: "101101110101101", L: "100100100100111", M: "101111111101101", N: "110101101101101", O: "010101101101010",
  P: "110101110100100", Q: "010101101111011", R: "110101110101101", S: "011100010001110", T: "111010010010010",
  U: "101101101101111", V: "101101101101010", W: "101101111111101", X: "101101010101101", Y: "101101010010010",
  Z: "111001010100111",
  "/": "001001010100100", ":": "000010000010000", ".": "000000000000010", ",": "000000000010100", "-": "000000111000000", "!": "010010010000010",
  "?": "110001010000010", $: "011110010011110", "+": "000010111010000", "=": "000111000111000", "(": "010100100100010",
  ")": "010001001001010", " ": "000000000000000",
};

/** Quita acentos y pasa a mayúsculas (la fuente solo tiene A-Z). «¡» se escribe como «!». */
export function normalizarTexto(texto) {
  return String(texto)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/¡/g, "!")
    .replace(/¿/g, "?")
    .toUpperCase();
}

export const anchoTexto = (texto, escala = 1) => Math.max(0, normalizarTexto(texto).length * 4 - 1) * escala;

/** Escribe texto con la fuente de píxeles. Devuelve el ancho usado. */
export function escribir(ctx, texto, x, y, color = PAL.blanco, escala = 1) {
  const t = normalizarTexto(texto);
  ctx.fillStyle = color;
  for (let n = 0; n < t.length; n++) {
    const g = GLIFOS[t[n]] ?? GLIFOS["?"];
    for (let i = 0; i < 15; i++) {
      if (g[i] === "1") ctx.fillRect(Math.round(x + (n * 4 + (i % 3)) * escala), Math.round(y + Math.floor(i / 3) * escala), escala, escala);
    }
  }
  return anchoTexto(t, escala);
}

// ---------------------------------------------------------------- Nix, el ajolote cósmico (16×16)
const NIX_BASE = [
  "................",
  "..C..........C..",
  ".CC...DDDD...CC.",
  "CCC..DPPPPD..CCC",
  ".CC.DPPPPPPD.CC.",
  "..C.DPPPPPPD.C..",
  "...DPPPPPPPPD...",
  "...DPPPPPPPPD...",
  "...DPPPPPPPPD...",
  "...DPPPPPPPPD...",
  "...DPPPPPPPPD...",
  "....DPPPPPPD....",
  ".....DDPPDD.....",
  "......DDDD......",
  "................",
  "................",
];
const NIX_CLAVES = { C: PAL.cian, D: PAL.vino, P: PAL.rosa };

// Cada expresión añade píxeles [x, y, color] sobre el cuerpo.
const K = PAL.negro;
const W = PAL.blanco;
const M = PAL.rojo;
const NIX_CARAS = {
  normal: [
    [5, 7, K], [6, 7, K], [5, 8, K], [6, 8, W],
    [9, 7, K], [10, 7, K], [9, 8, W], [10, 8, K],
    [7, 10, M], [8, 10, M],
  ],
  feliz: [
    [5, 8, K], [6, 7, K], [7, 8, K],
    [8, 8, K], [9, 7, K], [10, 8, K],
    [4, 9, PAL.rosaClaro], [11, 9, PAL.rosaClaro],
    [6, 10, M], [7, 11, M], [8, 11, M], [9, 10, M],
  ],
  preocupado: [
    [5, 6, K], [6, 6, K], [9, 6, K], [10, 6, K],
    [5, 7, K], [6, 7, K], [5, 8, K], [6, 8, W],
    [9, 7, K], [10, 7, K], [9, 8, W], [10, 8, K],
    [7, 10, M], [8, 10, M], [6, 11, M], [9, 11, M],
    [13, 5, PAL.cian], [13, 6, PAL.cian],
  ],
  parpadeo: [
    [5, 8, K], [6, 8, K], [9, 8, K], [10, 8, K],
    [7, 10, M], [8, 10, M],
  ],
};

export const ESTADOS_NIX = Object.keys(NIX_CARAS);

/** Dibuja a Nix (16×16 · escala entera) con la expresión indicada. */
export function pintarNix(ctx, x, y, estado = "normal", escala = 1) {
  const cara = NIX_CARAS[estado] ?? NIX_CARAS.normal;
  NIX_BASE.forEach((fila, j) => {
    let i = 0;
    while (i < fila.length) {
      const c = fila[i];
      if (c === ".") {
        i++;
        continue;
      }
      let k = i + 1;
      while (k < fila.length && fila[k] === c) k++;
      ctx.fillStyle = NIX_CLAVES[c];
      ctx.fillRect(x + i * escala, y + j * escala, (k - i) * escala, escala);
      i = k;
    }
  });
  for (const [cx, cy, color] of cara) {
    ctx.fillStyle = color;
    ctx.fillRect(x + cx * escala, y + cy * escala, escala, escala);
  }
}

/** Escala ENTERA en píxeles físicos que cabe en (ancho × alto) CSS: así cada píxel del arte cae sobre píxeles reales y no se ve borroso. */
export function escalaEntera(anchoCss, altoCss, anchoLogico, altoLogico, dpr = 1) {
  const exacta = Math.min((anchoCss * dpr) / anchoLogico, (altoCss * dpr) / altoLogico);
  const fisica = Math.max(1, Math.floor(exacta));
  // Si la escala entera dejaría el arte muy chico (pantallas de poca resolución: un 1× de 200 px en un celular de 374 px) o no cabría,
  // se usa la escala exacta (fraccionaria, sin suavizado): se ve menos «perfecta» pero mucho más grande y legible.
  if (fisica / exacta < 0.8 || fisica > exacta) return { fisica: exacta, css: exacta / dpr, entera: false };
  return { fisica, css: fisica / dpr, entera: true };
}

// ---------------------------------------------------------------- Formas básicas en píxeles
/** Disco relleno de radio r. */
export function disco(ctx, cx, cy, r, color) {
  for (let y = -r; y <= r; y++) {
    const w = Math.floor(Math.sqrt(r * r - y * y));
    px(ctx, cx - w, cy + y, 2 * w + 1, 1, color);
  }
}

/** Anillo de 1 píxel de grosor. `desde`/`hasta` en grados para dibujar solo un arco. */
export function anillo(ctx, cx, cy, r, color, desde = 0, hasta = 360) {
  const paso = Math.max(1.5, 90 / Math.max(r, 1));
  ctx.fillStyle = color;
  for (let a = desde; a < hasta; a += paso) {
    const rad = (a * Math.PI) / 180;
    ctx.fillRect(Math.round(cx + Math.cos(rad) * r), Math.round(cy + Math.sin(rad) * r), 1, 1);
  }
}

/** Línea de 1 píxel (Bresenham). */
export function linea(ctx, x0, y0, x1, y1, color) {
  ctx.fillStyle = color;
  x0 = Math.round(x0);
  y0 = Math.round(y0);
  x1 = Math.round(x1);
  y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  for (let n = 0; n < 400; n++) {
    ctx.fillRect(x0, y0, 1, 1);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x0 += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y0 += sy;
    }
  }
}

/** Flecha de 5×5 apuntando hacia «arriba» o «abajo». */
export function flecha(ctx, x, y, direccion, color) {
  const arriba = ["..X..", ".XXX.", "XXXXX", "..X..", "..X.."];
  const filas = direccion === "abajo" ? [...arriba].reverse() : arriba;
  pintarMapa(ctx, filas, { X: color }, x, y);
}

/** Símbolo ✓ (true) o ✗ (false) de 3×3 píxeles dentro de una lámpara de 5×5. */
export function simboloOk(ctx, x, y, ok, color = PAL.blanco) {
  if (ok === true) {
    [[0, 1], [1, 2], [2, 1], [3, 0]].forEach(([i, j]) => px(ctx, x + i, y + j, 1, 1, color));
  } else if (ok === false) {
    [[1, 1], [3, 1], [2, 2], [1, 3], [3, 3]].forEach(([i, j]) => px(ctx, x + i, y + j, 1, 1, color));
  }
}
