// stars.js
// Cálculo y visualización de estrellas (prompt de cambios, sección 9).
// 1 estrella: completar todas las fases del nivel.
// 2 estrellas: completarlo sin usar pistas en ninguna fase.
// 3 estrellas: sin pistas + primer intento en cada fase.
// Las estrellas se calculan al completar el nivel entero, no cada fase.

export function calcularEstrellasNivel(estadoFases) {
  const fases = Object.values(estadoFases);
  if (fases.length === 0) return 1;
  const sinPistas = fases.every((f) => (f.pistas || 0) === 0);
  const primerIntentoSiempre = fases.every((f) => (f.intentos || 0) <= 1);
  if (sinPistas && primerIntentoSiempre) return 3;
  if (sinPistas) return 2;
  return 1;
}

export function renderizarEstrellas(container, cantidad, total = 3) {
  container.innerHTML = "";
  for (let i = 1; i <= total; i++) {
    const span = document.createElement("span");
    span.className = "estrella" + (i <= cantidad ? " estrella-activa" : "");
    span.textContent = "★";
    container.appendChild(span);
  }
}
