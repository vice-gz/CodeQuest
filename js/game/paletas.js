// paletas.js
// Identidad de color de cada mundo (fuente única: la usan los escenarios en
// canvas y aplicarTema(), que la vuelca en variables CSS del <body>).
// Mundo 1 cian/verde · 2 rojo/dorado · 3 naranja · 4 azul · 5 rosa.

export const PALETAS = {
  1: { nombre: "Fundamentos y Datos", acento: "#00f5d4", acento2: "#38f997", fondo: "#070d19", glow: "rgba(0, 245, 212, 0.42)" },
  2: { nombre: "Lógica", acento: "#ff5c7c", acento2: "#ffca3a", fondo: "#14080e", glow: "rgba(255, 92, 124, 0.42)" },
  3: { nombre: "Automatización", acento: "#ff8c24", acento2: "#ffd166", fondo: "#140b05", glow: "rgba(255, 140, 36, 0.42)" },
  4: { nombre: "Modularidad", acento: "#00bbf9", acento2: "#72efdd", fondo: "#060e1a", glow: "rgba(0, 187, 249, 0.42)" },
  5: { nombre: "Proyecto", acento: "#ff4ecd", acento2: "#ff9ebb", fondo: "#140714", glow: "rgba(255, 78, 205, 0.42)" },
};

/** La consola de datos (escenario «datos») conserva el morado del antiguo Mundo 2 aunque ahora viva en el Mundo 1. */
export const PALETA_MEMORIA = { nombre: "Memoria", acento: "#b37eff", acento2: "#e0c3fc", fondo: "#0b081c", glow: "rgba(179, 126, 255, 0.42)" };

export function paletaDe(mundo) {
  return PALETAS[mundo] || PALETAS[1];
}

/** Aplica el tema del mundo al <body>: data-mundo y variables CSS. */
export function aplicarTema(mundo, cuerpo = document.body) {
  const p = paletaDe(mundo);
  cuerpo.dataset.mundo = String(PALETAS[mundo] ? mundo : 1);
  cuerpo.style.setProperty("--mundo-acento", p.acento);
  cuerpo.style.setProperty("--mundo-acento-2", p.acento2);
  cuerpo.style.setProperty("--mundo-fondo", p.fondo);
  cuerpo.style.setProperty("--mundo-glow", p.glow);
}
