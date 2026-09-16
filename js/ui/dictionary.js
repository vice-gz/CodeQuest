// dictionary.js
// Diccionario de instrucciones: una referencia de consulta que se va
// desbloqueando conforme el estudiante COMPLETA la fase donde cada
// instrucción se enseña.
//
// Diferencia con las pistas: el diccionario nunca dice cómo resolver la
// fase actual. Describe qué hace una instrucción y su forma general
// (robot1.girar(direccion)), no la línea concreta que falta. Por eso una
// fase de corregir sintaxis no se arruina: el diccionario dice que print
// muestra un texto entre comillas, pero no muestra el código corregido.

// Catálogo completo. `desbloqueaEn` es el id de la fase que la enseña.
export const CATALOGO = [
  {
    id: "print",
    firma: 'print(valor)',
    categoria: "Salida",
    descripcion: "Muestra un valor en el panel de Salida. El texto va entre comillas.",
    desbloqueaEn: "1.1",
  },
  {
    id: "avanzar",
    firma: "robot1.avanzar(n)",
    categoria: "Movimiento",
    descripcion: "Robot1 avanza n casillas en la dirección a la que mira.",
    desbloqueaEn: "2.1",
  },
  {
    id: "hablar",
    firma: 'robot1.hablar("texto")',
    categoria: "Salida",
    descripcion:
      "Robot1 dice un texto: aparece una burbuja en el mundo 2D y una línea en Salida. No es lo mismo que print().",
    desbloqueaEn: "3.1",
  },
  {
    id: "girar",
    firma: 'robot1.girar(direccion)',
    categoria: "Movimiento",
    descripcion:
      'Cambia hacia dónde mira Robot1. Direcciones válidas: "norte", "sur", "este", "oeste".',
    desbloqueaEn: "3.3",
  },
  {
    id: "retroceder",
    firma: "robot1.retroceder(n)",
    categoria: "Movimiento",
    descripcion:
      "Robot1 retrocede n casillas sin cambiar la dirección a la que mira.",
    desbloqueaEn: "4.1",
  },
  {
    id: "entrada",
    firma: "entrada()",
    categoria: "Entrada",
    descripcion:
      "Pausa el programa y pide un valor a quien está jugando. Devuelve ese valor, así que suele guardarse en una variable.",
    desbloqueaEn: "6.1",
  },
  {
    id: "recoger",
    firma: "robot1.recoger()",
    categoria: "Objetos",
    descripcion: "Recoge el objeto que haya en la casilla donde está Robot1.",
    desbloqueaEn: "8.1",
  },
  {
    id: "asignacion",
    firma: "nombre = valor",
    categoria: "Variables",
    descripcion:
      "Guarda un valor con un nombre para reutilizarlo después. Aparece en el panel de Memoria.",
    desbloqueaEn: "9.1",
  },
  {
    id: "operadores",
    firma: "+  -  *  /",
    categoria: "Operadores",
    descripcion:
      "Operaciones aritméticas. Primero se resuelven * y /, después + y -, igual que en matemáticas.",
    desbloqueaEn: "12.2",
  },
  {
    id: "modulo",
    firma: "a % b",
    categoria: "Operadores",
    descripcion: "Devuelve el residuo de dividir a entre b. Por ejemplo, 7 % 2 vale 1.",
    desbloqueaEn: "13.1",
  },
  {
    id: "energia",
    firma: "robot1.energia()",
    categoria: "Estado",
    descripcion: "Devuelve la energía que le queda a Robot1.",
    desbloqueaEn: "12.1",
  },
  {
    id: "posicion",
    firma: "robot1.posicion()",
    categoria: "Estado",
    descripcion: "Devuelve la posición actual de Robot1 como (columna,fila).",
    desbloqueaEn: "16.1",
  },
  {
    id: "mirar",
    firma: "robot1.mirar()",
    categoria: "Estado",
    descripcion: "Devuelve la dirección hacia la que mira Robot1.",
    desbloqueaEn: "16.1",
  },
];

export class Dictionary {
  /**
   * @param {HTMLElement} contenedor - panel donde se dibuja
   * @param {HTMLElement} boton - botón que lo abre/cierra
   * @param {HTMLElement} contadorEl - indicador "n/total"
   */
  constructor(contenedor, boton, contadorEl) {
    this.contenedor = contenedor;
    this.boton = boton;
    this.contadorEl = contadorEl;
    this.desbloqueadas = new Set();
    this.abierto = false;

    this.boton.addEventListener("click", () => this.alternar());
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.abierto) this.cerrar();
    });
  }

  /**
   * Recalcula qué entradas están desbloqueadas a partir del progreso.
   * @param {Set<string>} fasesCompletadas - ids de fase ya superadas
   * @param {boolean} todoDesbloqueado - modo demo: se muestra todo
   */
  actualizar(fasesCompletadas, todoDesbloqueado = false) {
    this.desbloqueadas = new Set(
      CATALOGO.filter(
        (e) => todoDesbloqueado || fasesCompletadas.has(e.desbloqueaEn)
      ).map((e) => e.id)
    );
    this.contadorEl.textContent = `${this.desbloqueadas.size}/${CATALOGO.length}`;
    if (this.abierto) this.render();
  }

  alternar() {
    if (this.abierto) this.cerrar();
    else this.abrir();
  }

  abrir() {
    this.abierto = true;
    this.contenedor.classList.remove("oculto");
    this.boton.setAttribute("aria-expanded", "true");
    this.render();
  }

  cerrar() {
    this.abierto = false;
    this.contenedor.classList.add("oculto");
    this.boton.setAttribute("aria-expanded", "false");
  }

  render() {
    const porCategoria = new Map();
    CATALOGO.forEach((entrada) => {
      if (!this.desbloqueadas.has(entrada.id)) return;
      if (!porCategoria.has(entrada.categoria)) porCategoria.set(entrada.categoria, []);
      porCategoria.get(entrada.categoria).push(entrada);
    });

    const pendientes = CATALOGO.length - this.desbloqueadas.size;

    if (this.desbloqueadas.size === 0) {
      this.contenedor.innerHTML = `
        <div class="dic-encabezado">
          <h2>Diccionario</h2>
          <button type="button" class="dic-cerrar" aria-label="Cerrar">✕</button>
        </div>
        <p class="panel-vacio">Todavía no has aprendido ninguna instrucción. Se irán guardando aquí conforme completes las fases.</p>`;
      this.contenedor.querySelector(".dic-cerrar").addEventListener("click", () => this.cerrar());
      return;
    }

    let html = `
      <div class="dic-encabezado">
        <h2>Diccionario</h2>
        <button type="button" class="dic-cerrar" aria-label="Cerrar">✕</button>
      </div>
      <p class="dic-intro">Instrucciones que ya aprendiste. Puedes consultarlas cuando quieras.</p>`;

    for (const [categoria, entradas] of porCategoria) {
      html += `<h3 class="dic-categoria">${categoria}</h3><div class="dic-lista">`;
      entradas.forEach((e) => {
        html += `
          <article class="dic-entrada">
            <code class="dic-firma"></code>
            <p class="dic-descripcion"></p>
          </article>`;
      });
      html += `</div>`;
    }

    if (pendientes > 0) {
      html += `<p class="dic-pendientes">${pendientes} instrucción(es) más se desbloquearán conforme avances.</p>`;
    }

    this.contenedor.innerHTML = html;

    // El texto se inserta como textContent, no como HTML.
    const firmas = this.contenedor.querySelectorAll(".dic-firma");
    const descripciones = this.contenedor.querySelectorAll(".dic-descripcion");
    const planas = [...porCategoria.values()].flat();
    planas.forEach((e, i) => {
      firmas[i].textContent = e.firma;
      descripciones[i].textContent = e.descripcion;
    });

    this.contenedor.querySelector(".dic-cerrar").addEventListener("click", () => this.cerrar());
  }
}
