// tarjetas.js
// Panel del Nivel 0 (diagramas de flujo): un banco de tarjetas y, al lado, el diagrama que el alumno va
// armando. Solo dibuja y avisa; la lógica de "¿esta tarjeta toca ahora?" está en game/ordenar.js.

export class PanelTarjetas {
  /**
   * @param {{envoltura:HTMLElement, banco:HTMLElement, diagrama:HTMLElement, btnReiniciar:HTMLButtonElement}} nodos
   */
  constructor(nodos) {
    this.envoltura = nodos.envoltura;
    this.banco = nodos.banco;
    this.diagrama = nodos.diagrama;
    this.btnReiniciar = nodos.btnReiniciar;
    this.tarjetas = [];
    this.alElegir = null;
    this.bloqueado = false;
    this.btnReiniciar.addEventListener("click", () => {
      if (!this.bloqueado) this.alReiniciar?.();
    });
  }

  /** Dibuja el banco con las tarjetas (en el orden barajado de la fase). */
  mostrar(fase, { alElegir, alReiniciar }) {
    this.tarjetas = fase.tarjetas || [];
    this.alElegir = alElegir;
    this.alReiniciar = alReiniciar;
    this.reiniciar();
  }

  reiniciar() {
    this.banco.innerHTML = "";
    this.diagrama.innerHTML = "";
    this.tarjetas.forEach((t) => {
      const boton = document.createElement("button");
      boton.type = "button";
      boton.className = `tarjeta-flujo tarjeta-${t.forma || "paso"}`;
      boton.dataset.id = t.id;
      boton.textContent = t.texto;
      boton.setAttribute("aria-label", `Tarjeta: ${t.texto}`);
      boton.addEventListener("click", () => {
        if (!this.bloqueado) this.alElegir?.(t.id);
      });
      this.banco.appendChild(boton);
    });
    this.vacioDiagrama();
  }

  buscarEnBanco(id) {
    return [...this.banco.children].find((n) => n.dataset.id === id) || null;
  }

  vacioDiagrama() {
    if (this.diagrama.children.length) return;
    const li = document.createElement("li");
    li.className = "diagrama-vacio";
    li.textContent = "Aquí aparecerá tu algoritmo";
    this.diagrama.appendChild(li);
  }

  /** La tarjeta era la correcta: pasa del banco al diagrama. */
  agregarAlDiagrama(id) {
    const t = this.tarjetas.find((x) => x.id === id);
    this.buscarEnBanco(id)?.remove();
    this.diagrama.querySelector(".diagrama-vacio")?.remove();
    const li = document.createElement("li");
    li.className = `paso-diagrama tarjeta-${t.forma || "paso"}`;
    li.textContent = t.texto;
    this.diagrama.appendChild(li);
  }

  /** La tarjeta NO tocaba: se sacude en rojo un momento. */
  marcarError(id) {
    this.buscarEnBanco(id)?.classList.add("tarjeta-error");
  }

  bloquear(valor) {
    this.bloqueado = valor;
    this.envoltura.classList.toggle("bloqueado", valor);
  }
}
