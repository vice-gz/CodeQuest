// memoryPanel.js
// Panel de MEMORIA (nuevo, prompt de cambios sección 5.3): muestra las
// variables actuales del programa. Se actualiza cada vez que se ejecuta
// una asignación. Formato: nombre = valor.

export class MemoryPanel {
  constructor(container) {
    this.container = container;
    this.variables = new Map();
  }

  limpiar() {
    this.variables.clear();
    this.render();
  }

  actualizar(nombre, valor) {
    this.variables.set(nombre, valor);
    this.render();
  }

  render() {
    if (this.variables.size === 0) {
      this.container.innerHTML = `<p class="panel-vacio">Todavía no hay variables. Aparecerán aquí cuando uses =.</p>`;
      return;
    }
    const filas = [...this.variables.entries()]
      .map(
        ([nombre, valor]) => `
        <div class="memoria-fila">
          <span class="memoria-nombre">${nombre}</span>
          <span class="memoria-igual">=</span>
          <span class="memoria-valor">${this.formatearValor(valor)}</span>
        </div>`
      )
      .join("");
    this.container.innerHTML = filas;
  }

  formatearValor(valor) {
    if (typeof valor === "string") return `"${valor}"`;
    return String(valor);
  }
}
