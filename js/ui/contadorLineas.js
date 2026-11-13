// contadorLineas.js
// «Líneas: X / Límite» en la cabecera del editor. Si el estudiante pasa del límite recomendado del nivel (`max_lineas_recomendadas`)
// el contador se pone rojo y lleva un ⚠ (no depende solo del color), pero NUNCA bloquea la ejecución: es un aviso de que su
// solución no es la más corta. Se cuentan las líneas no vacías, igual que el mensaje de eficiencia de los niveles jefe.

import { contarLineasDeCodigo } from "../game/eficiencia.js";

export function estadoContador(codigo, limite) {
  const lineas = contarLineasDeCodigo(codigo);
  const hayLimite = Number.isInteger(limite) && limite >= 1;
  const excedido = hayLimite && lineas > limite;
  const texto = `Líneas: ${lineas}${hayLimite ? ` / ${limite}` : ""}${excedido ? " ⚠" : ""}`;
  return { lineas, limite: hayLimite ? limite : null, excedido, texto };
}

export class ContadorLineas {
  constructor(elemento) {
    this.el = elemento;
  }

  actualizar(codigo, limite = null) {
    if (!this.el) return null;
    const e = estadoContador(codigo, limite);
    this.el.textContent = e.texto;
    this.el.classList.toggle("excedido", e.excedido);
    this.el.dataset.excedido = String(e.excedido);
    this.el.title = e.excedido
      ? `Tu solución usa ${e.lineas} líneas y lo recomendado son ${e.limite}. Puedes ejecutarla igual, pero se puede hacer en menos.`
      : e.limite
        ? `Lo recomendado para este nivel son ${e.limite} líneas como máximo.`
        : "Líneas de código (sin contar las vacías).";
    return e;
  }

  ocultar(oculto) {
    if (this.el) this.el.hidden = Boolean(oculto);
  }
}
