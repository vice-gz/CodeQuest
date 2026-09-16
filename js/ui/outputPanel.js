// outputPanel.js
// Panel de SALIDA (nuevo, prompt de cambios sección 5.2): muestra todo lo
// que se ejecuta con print() y entrada(), y también lo que dice Robot1
// con hablar() (Documento de cambios, sección 7: hablar = burbuja + panel).
// Se actualiza en vivo durante la ejecución y tiene scroll propio.

const ICONOS = {
  PRINT: "›",
  ENTRADA: "⌨",
  HABLAR: "💬",
};

export class OutputPanel {
  constructor(container) {
    this.container = container;
  }

  limpiar() {
    this.container.innerHTML = "";
  }

  agregar({ tipo, valor }) {
    const linea = document.createElement("div");
    linea.className = `salida-linea salida-${tipo.toLowerCase()}`;
    const icono = ICONOS[tipo] || "›";
    linea.innerHTML = `<span class="salida-icono">${icono}</span><span class="salida-valor"></span>`;
    linea.querySelector(".salida-valor").textContent = String(valor);
    this.container.appendChild(linea);
    this.container.scrollTop = this.container.scrollHeight;
  }

  mostrarVacio(mensaje = "Aquí verás lo que muestre print() y lo que diga Robot1.") {
    this.limpiar();
    const vacio = document.createElement("p");
    vacio.className = "panel-vacio";
    vacio.textContent = mensaje;
    this.container.appendChild(vacio);
  }
}
