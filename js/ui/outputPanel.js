// outputPanel.js
// Panel de SALIDA: muestra print(), entrada() y lo que dice Robot1 con
// hablar() (hablar = burbuja en el mundo + línea aquí; print = solo aquí).
//
// Además aloja la entrada interactiva: cuando el programa llega a un
// entrada() sin valor simulado, la ejecución se pausa y aquí aparece un
// campo donde el estudiante escribe el valor.

const ICONOS = {
  PRINT: "›",
  ENTRADA: "⌨",
  HABLAR: "💬",
  SISTEMA: "⚡",
};

export class OutputPanel {
  constructor(container) {
    this.container = container;
    this.entradaActiva = null;
  }

  limpiar() {
    this.cancelarEntrada();
    this.container.innerHTML = "";
  }

  agregar({ tipo, valor }) {
    const vacio = this.container.querySelector(".panel-vacio");
    if (vacio) vacio.remove();

    const linea = document.createElement("div");
    linea.className = `salida-linea salida-${tipo.toLowerCase()}`;
    const icono = ICONOS[tipo] || "›";
    linea.innerHTML = `<span class="salida-icono"></span><span class="salida-valor"></span>`;
    linea.querySelector(".salida-icono").textContent = icono;
    linea.querySelector(".salida-valor").textContent = String(valor);
    this.container.appendChild(linea);
    this.desplazarAlFinal();
  }

  mostrarVacio(mensaje = "Aquí verás lo que muestre print() y lo que diga Robot1.") {
    this.limpiar();
    const vacio = document.createElement("p");
    vacio.className = "panel-vacio";
    vacio.textContent = mensaje;
    this.container.appendChild(vacio);
  }

  desplazarAlFinal() {
    this.container.scrollTop = this.container.scrollHeight;
  }

  /**
   * Pide un valor al estudiante y devuelve una promesa que se resuelve
   * cuando lo confirma. Un valor numérico se convierte a número; cualquier
   * otra cosa se conserva como texto.
   * @param {string} [etiqueta]
   * @returns {Promise<number|string>}
   */
  /**
   * Pide un valor al estudiante y devuelve una promesa que se resuelve
   * cuando lo confirma. La ejecución del programa queda pausada mientras
   * tanto: nunca se inventa ni se rellena un valor por el estudiante.
   *
   * @param {{etiqueta?:string, tipo?:"numero"|"texto"|"libre"}} opciones
   *   tipo "numero": solo acepta números y lo explica si escriben texto.
   *   tipo "texto":  devuelve siempre texto, aunque escriban dígitos.
   *   tipo "libre" (por defecto): número si es numérico, texto si no —
   *   así el estudiante puede equivocarse a propósito y ver el error real
   *   que produce usar texto donde se esperaba un número.
   * @returns {Promise<number|string>}
   */
  pedirEntrada({ etiqueta, tipo = "libre" } = {}) {
    this.cancelarEntrada();

    const texto = etiqueta || "entrada() está esperando un valor…";
    const ayuda =
      tipo === "numero"
        ? "Escribe un número."
        : tipo === "texto"
        ? "Escribe un texto."
        : "Puedes escribir un número o un texto.";

    const bloque = document.createElement("div");
    bloque.className = "entrada-interactiva";
    bloque.innerHTML = `
      <p class="entrada-etiqueta"></p>
      <div class="entrada-controles">
        <input type="text" class="entrada-campo" autocomplete="off" />
        <button type="button" class="boton boton-primario entrada-aceptar">Aceptar</button>
      </div>
      <p class="entrada-ayuda"></p>
    `;
    bloque.querySelector(".entrada-etiqueta").textContent = texto;
    bloque.querySelector(".entrada-ayuda").textContent = ayuda;
    const campo = bloque.querySelector(".entrada-campo");
    campo.placeholder = tipo === "numero" ? "Un número, por ejemplo 3" : "Escribe aquí y pulsa Enter";

    this.container.appendChild(bloque);
    this.desplazarAlFinal();
    campo.focus();

    const ayudaEl = bloque.querySelector(".entrada-ayuda");
    const marcarError = (mensaje) => {
      campo.classList.add("entrada-campo-error");
      ayudaEl.textContent = mensaje;
      ayudaEl.classList.add("entrada-ayuda-error");
      campo.focus();
      campo.select();
    };

    return new Promise((resolve) => {
      const confirmar = () => {
        const crudo = campo.value.trim();

        if (crudo === "") {
          marcarError("Escribe algo antes de aceptar: el programa está esperando este valor.");
          return;
        }

        const comoNumero = Number(crudo);
        const esNumero = Number.isFinite(comoNumero);

        if (tipo === "numero" && !esNumero) {
          marcarError(`"${crudo}" no es un número. Robot1 no puede contar casillas con un texto.`);
          return;
        }

        bloque.remove();
        this.entradaActiva = null;

        if (tipo === "texto") resolve(crudo);
        else resolve(esNumero ? comoNumero : crudo);
      };

      bloque.querySelector(".entrada-aceptar").addEventListener("click", confirmar);
      campo.addEventListener("keydown", (e) => {
        campo.classList.remove("entrada-campo-error");
        ayudaEl.classList.remove("entrada-ayuda-error");
        ayudaEl.textContent = ayuda;
        if (e.key === "Enter") {
          e.preventDefault();
          confirmar();
        }
      });

      this.entradaActiva = { bloque, resolve };
    });
  }

  marcarEsperandoEntrada() {
    this.agregar({ tipo: "ENTRADA", valor: "esperando valor del estudiante…" });
  }

  // Si se reinicia la fase mientras hay una entrada abierta, se cierra.
  cancelarEntrada() {
    if (this.entradaActiva) {
      this.entradaActiva.bloque.remove();
      this.entradaActiva = null;
    }
  }
}
