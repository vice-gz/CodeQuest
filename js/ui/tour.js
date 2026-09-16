// tour.js
// Tour de bienvenida: presenta cada área de la interfaz la primera vez que
// se juega. Se puede saltar en cualquier momento y no vuelve a salir, pero
// puede relanzarse desde el botón de ayuda.

const PASOS = [
  {
    selector: ".panel-mundo",
    titulo: "Este es Robot1",
    texto:
      "Aquí vive Robot1, dentro del laboratorio. La cuadrícula son las casillas por las que se mueve, y la punta naranja indica hacia dónde mira.",
  },
  {
    selector: ".panel-aprende",
    titulo: "Aquí aprendes",
    texto:
      "Cada nivel se divide en fases. Arriba ves en cuál vas (● actual, ✓ hecha, ○ pendiente) y abajo qué instrucciones puedes usar en esta fase.",
  },
  {
    selector: ".panel-codigo",
    titulo: "Aquí escribes tu código",
    texto:
      "Este es el editor. Escribes instrucciones y pulsas ▶ Ejecutar para que Robot1 las obedezca. Reiniciar deja la fase como estaba.",
  },
  {
    selector: ".panel-salida",
    titulo: "La salida",
    texto:
      "Todo lo que muestres con print(), lo que diga Robot1 y los valores que escribas aparecen aquí, en orden.",
  },
  {
    selector: ".panel-memoria",
    titulo: "La memoria",
    texto:
      "Cuando guardes datos en variables, los verás aquí con su valor actual. Es la memoria de tu programa.",
  },
  {
    selector: ".panel-estado",
    titulo: "El estado de Robot1",
    texto:
      "Su posición, hacia dónde mira y cuánta energía le queda. Se actualiza mientras el código corre.",
  },
  {
    selector: ".panel-feedback",
    titulo: "La retroalimentación",
    texto:
      "Aquí te digo si lo lograste y, si algo falla, qué salió mal y cómo arreglarlo. Ningún error es un castigo.",
  },
  {
    selector: "#btn-diccionario",
    titulo: "Tu diccionario",
    texto:
      "Cada instrucción que aprendas se guarda aquí. Ábrelo cuando no recuerdes cómo se usaba alguna.",
  },
];

const CLAVE_VISTO = "codequest:tour-visto";

export class Tour {
  constructor() {
    this.indice = 0;
    this.overlay = null;
    this.activo = false;
  }

  static yaSeVio() {
    try {
      return localStorage.getItem(CLAVE_VISTO) === "1";
    } catch {
      return false;
    }
  }

  static marcarVisto() {
    try {
      localStorage.setItem(CLAVE_VISTO, "1");
    } catch {
      /* si no hay localStorage, el tour simplemente volverá a salir */
    }
  }

  iniciar() {
    if (this.activo) return;
    this.activo = true;
    this.indice = 0;

    this.overlay = document.createElement("div");
    this.overlay.className = "tour-overlay";
    this.overlay.innerHTML = `
      <div class="tour-recuadro" aria-hidden="true"></div>
      <div class="tour-globo" role="dialog" aria-live="polite">
        <p class="tour-progreso"></p>
        <h3 class="tour-titulo"></h3>
        <p class="tour-texto"></p>
        <div class="tour-botones">
          <button type="button" class="boton boton-secundario tour-saltar">Saltar tour</button>
          <button type="button" class="boton boton-secundario tour-atras">Atrás</button>
          <button type="button" class="boton boton-primario tour-siguiente">Siguiente</button>
        </div>
      </div>`;
    document.body.appendChild(this.overlay);

    this.overlay.querySelector(".tour-saltar").addEventListener("click", () => this.terminar());
    this.overlay.querySelector(".tour-atras").addEventListener("click", () => this.mover(-1));
    this.overlay.querySelector(".tour-siguiente").addEventListener("click", () => this.mover(1));
    this.alPresionar = (e) => {
      if (e.key === "Escape") this.terminar();
      if (e.key === "ArrowRight") this.mover(1);
      if (e.key === "ArrowLeft") this.mover(-1);
    };
    document.addEventListener("keydown", this.alPresionar);
    this.alRedimensionar = () => this.pintarPaso();
    window.addEventListener("resize", this.alRedimensionar);

    this.pintarPaso();
  }

  mover(delta) {
    const siguiente = this.indice + delta;
    if (siguiente < 0) return;
    if (siguiente >= PASOS.length) {
      this.terminar();
      return;
    }
    this.indice = siguiente;
    this.pintarPaso();
  }

  pintarPaso() {
    if (!this.activo) return;
    const paso = PASOS[this.indice];
    const objetivo = document.querySelector(paso.selector);
    const recuadro = this.overlay.querySelector(".tour-recuadro");
    const globo = this.overlay.querySelector(".tour-globo");

    this.overlay.querySelector(".tour-progreso").textContent = `${this.indice + 1} de ${PASOS.length}`;
    this.overlay.querySelector(".tour-titulo").textContent = paso.titulo;
    this.overlay.querySelector(".tour-texto").textContent = paso.texto;
    this.overlay.querySelector(".tour-atras").disabled = this.indice === 0;
    this.overlay.querySelector(".tour-siguiente").textContent =
      this.indice === PASOS.length - 1 ? "Empezar a jugar" : "Siguiente";

    if (!objetivo) {
      recuadro.style.display = "none";
      globo.style.top = "50%";
      globo.style.left = "50%";
      globo.style.transform = "translate(-50%, -50%)";
      return;
    }

    objetivo.scrollIntoView({ block: "center", behavior: "smooth" });
    const r = objetivo.getBoundingClientRect();
    const margen = 6;

    recuadro.style.display = "block";
    recuadro.style.top = `${r.top - margen}px`;
    recuadro.style.left = `${r.left - margen}px`;
    recuadro.style.width = `${r.width + margen * 2}px`;
    recuadro.style.height = `${r.height + margen * 2}px`;

    // El globo se coloca debajo del elemento, o encima si no cabe.
    globo.style.transform = "none";
    const anchoGlobo = Math.min(340, window.innerWidth - 32);
    globo.style.width = `${anchoGlobo}px`;
    let left = Math.min(Math.max(12, r.left), window.innerWidth - anchoGlobo - 12);
    let top = r.bottom + 14;
    if (top + globo.offsetHeight > window.innerHeight - 12) {
      top = Math.max(12, r.top - globo.offsetHeight - 14);
    }
    globo.style.left = `${left}px`;
    globo.style.top = `${top}px`;
  }

  terminar() {
    if (!this.activo) return;
    this.activo = false;
    document.removeEventListener("keydown", this.alPresionar);
    window.removeEventListener("resize", this.alRedimensionar);
    this.overlay?.remove();
    this.overlay = null;
    Tour.marcarVisto();
  }
}
