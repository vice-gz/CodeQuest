// statePanel.js
// Panel de ESTADO DE ROBOT1 (nuevo, prompt de cambios sección 5.4):
// posición, dirección y energía (si aplica al nivel). Se actualiza en vivo.

export class StatePanel {
  constructor(container) {
    this.container = container;
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
