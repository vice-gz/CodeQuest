// statePanel.js
// Panel de ESTADO del mundo actual: posición/dirección/energía de Robot1,
// estado del elevador, de la mesa de cartas... Cada escenario entrega sus
// filas {etiqueta, valor} (escenario.filasEstado()). Se actualiza en vivo.

export class StatePanel {
  constructor(container) {
    this.container = container;
  }

  mostrarFilas(filas) {
    const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    this.container.innerHTML = filas
      .map(
        (f) => `<div class="estado-fila"><span class="estado-etiqueta">${esc(f.etiqueta)}</span><span class="estado-valor">${esc(f.valor)}</span></div>`
      )
      .join("");
  }

  actualizar({ posicion, direccion, energia }, { mostrarEnergia = true } = {}) {
    const [x, y] = posicion;
    this.container.innerHTML = `
      <div class="estado-fila">
        <span class="estado-etiqueta">Posición</span>
        <span class="estado-valor">(${x}, ${y})</span>
      </div>
      <div class="estado-fila">
        <span class="estado-etiqueta">Dirección</span>
        <span class="estado-valor">${direccion}</span>
      </div>
      ${
        mostrarEnergia
          ? `<div class="estado-fila">
               <span class="estado-etiqueta">Energía</span>
               <span class="estado-valor">${energia}%</span>
             </div>`
          : ""
      }
    `;
  }
}
