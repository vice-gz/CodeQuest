// phases.js
// Barra de fases arriba del área "Aprende" (prompt de cambios, sección 5.1).
// ● fase activa · ✓ fase completada · ○ fase pendiente.

export class PhaseBar {
  constructor(container) {
    this.container = container;
  }

  /**
   * @param {{id:string, titulo:string}[]} fases
   * @param {number} indiceActual - índice (0-based) de la fase que se está jugando
   * @param {Set<string>} completadas - ids de fases ya completadas
   * @param {(indice:number)=>void} alClic - se llama al hacer clic en una fase alcanzable
   */
  render(fases, indiceActual, completadas, alClic) {
    this.container.innerHTML = "";
    fases.forEach((fase, i) => {
      const completada = completadas.has(fase.id);
      const activa = i === indiceActual;
      const alcanzable = completada || i <= indiceActual;

      const boton = document.createElement("button");
      boton.type = "button";
      boton.className = "fase-punto";
      if (activa) boton.classList.add("fase-activa");
      if (completada) boton.classList.add("fase-completada");
      if (!alcanzable) boton.classList.add("fase-bloqueada");

      boton.innerHTML = `<span class="fase-icono">${completada ? "✓" : activa ? "●" : "○"}</span> Fase ${i + 1}`;
      boton.title = fase.titulo;
      boton.disabled = !alcanzable;
      if (alcanzable) {
        boton.addEventListener("click", () => alClic(i));
      }
      this.container.appendChild(boton);
    });
  }
}
