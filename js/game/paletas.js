// paletas.js
// Identidad de color de cada mundo (fuente única: la usan los escenarios en
// canvas y aplicarTema(), que la vuelca en variables CSS del <body>).
// Mundo 1 cian/verde · 2 morado · 3 rojo/dorado · 4 naranja · 5 y 6 reservados.

export const PALETAS = {
  1: { nombre: "Despertar", acento: "#5eead4", acento2: "#7dde86", fondo: "#0a0d14", glow: "rgba(94, 234, 212, 0.35)" },
  2: { nombre: "Memoria", acento: "#a78bfa", acento2: "#c4b5fd", fondo: "#0b0a16", glow: "rgba(167, 139, 250, 0.35)" },
  3: { nombre: "Lógica", acento: "#f87171", acento2: "#fbbf24", fondo: "#0d0a0a", glow: "rgba(248, 113, 113, 0.35)" },
  4: { nombre: "Automatización", acento: "#fb923c", acento2: "#fdba74", fondo: "#0d0a07", glow: "rgba(251, 146, 60, 0.35)" },
  5: { nombre: "Modularidad", acento: "#38bdf8", acento2: "#7dd3fc", fondo: "#080c12", glow: "rgba(56, 189, 248, 0.35)" },
  6: { nombre: "Proyecto", acento: "#f472b6", acento2: "#f9a8d4", fondo: "#0d080c", glow: "rgba(244, 114, 182, 0.35)" },
};

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
