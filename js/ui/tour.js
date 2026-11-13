// tour.js
// Tour de bienvenida: presenta cada área de la interfaz la primera vez que
// se juega. Se puede saltar en cualquier momento y no vuelve a salir, pero
// puede relanzarse desde el botón de ayuda.
//
// Pensado para que nadie se quede atrapado (sobre todo en celular):
//   - cada paso hace scroll suave hasta dejar el elemento al CENTRO de la pantalla;
//   - si el elemento vive en otra pestaña del juego móvil (Jugar / Aprende /
//     Consola), se cambia de pestaña antes de explicarlo;
//   - Atrás / Siguiente / Saltar están en una barra FIJA al pie de la pantalla,
//     fuera del globo, y hay una ✕ fija arriba a la derecha durante todo el tour.

// 2.1. Tour del Nivel 0 (Específico): solo se activa en el Nivel 0 la primera vez que se juega.
export const PASOS_NIVEL_0 = [
  {
    selector: ".panel-aprende",
    pestana: "aprende",
    titulo: "Aprende",
    texto: "Lee la historia y el concepto",
  },
  {
    selector: ".panel-codigo",
    pestana: "jugar",
    titulo: "Tu Algoritmo",
    texto: "Haz clic en las tarjetas en orden para programar a Robot1",
  },
  {
    selector: ".panel-mundo",
    pestana: "jugar",
    titulo: "Pasillo 2D",
    texto: "Mira cómo Robot1 ejecuta tus pasos",
  },
];

// 2.2. Tour General (Nivel 1 en adelante): se activa la primera vez que el alumno entra al Nivel 1.
export const PASOS_GENERAL = [
  {
    selector: ".hud-mision",
    pestana: "jugar",
    titulo: "Tu misión",
    texto: "Aquí está lo que tienes que lograr, en una línea. Las lámparas de abajo son las pruebas de tu código y Nix te da pistas.",
  },
  {
    selector: "#btn-mas-info",
    pestana: "jugar",
    titulo: "Más info",
    texto: "¿Necesitas el enunciado completo, la historia o las instrucciones que puedes usar? Pulsa «Más info»: se abre el texto largo del nivel (en el celular te lleva a la pestaña Aprende). La primera vez que entras a un nivel se abre sola.",
  },
  {
    selector: ".editor-envoltura, .panel-codigo",
    pestana: "jugar",
    titulo: "Editor de código",
    texto: "Aquí escribirás tu código Python",
  },
  {
    selector: "#btn-ejecutar",
    pestana: "jugar",
    titulo: "Botón Ejecutar",
    texto: "Presiona aquí para que Robot1 haga lo que escribiste",
  },
  {
    selector: ".panel-salida",
    selectorFin: ".panel-memoria",
    pestana: "consola",
    titulo: "Resultados y memoria",
    texto: "Aquí verás los resultados y la memoria",
  },
];

const PASOS = PASOS_GENERAL;

const CLAVE_VISTO = "codequest:tour-visto";
const CLAVE_VISTO_NIVEL_0 = "codequest:tour-nivel0-visto";
const ALTO_BARRA_INFERIOR = 84; // controles fijos + aire
const ALTO_BARRA_SUPERIOR = 60; // botón ✕

const sinAnimacion = () => typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

export class Tour {
  /**
   * @param {object} [opciones]
   * @param {(pestana:string)=>void} [opciones.alNecesitarPestana] cambia a la pestaña (Jugar/Aprende/Consola) donde vive el paso
   */
  constructor({ alNecesitarPestana = null, pasos = null, alTerminar = null } = {}) {
    // `pasos` propios = tour específico (Nivel 0 o mundo nuevo); usa su propio `alTerminar`.
    this.pasos = pasos || PASOS;
    this.pasosPropios = pasos !== null;
    this.alTerminar = alTerminar;
    this.indice = 0;
    this.overlay = null;
    this.activo = false;
    this.alNecesitarPestana = alNecesitarPestana;
    this.pasoVigente = 0; // descarta pasos viejos si el usuario avanza rápido
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

  static yaSeVioNivel0() {
    try {
      return localStorage.getItem(CLAVE_VISTO_NIVEL_0) === "1";
    } catch {
      return false;
    }
  }

  static marcarVistoNivel0() {
    try {
      localStorage.setItem(CLAVE_VISTO_NIVEL_0, "1");
    } catch {
      /* si no hay localStorage, el tour simplemente volverá a salir */
    }
  }

  iniciar() {
    if (this.activo) return;
    this.activo = true;
    this.indice = 0;
    document.body.classList.add("tour-activo"); // deja aire al final de la página para poder centrar el último panel

    this.overlay = document.createElement("div");
    this.overlay.className = "tour-overlay";
    this.overlay.innerHTML = `
      <div class="tour-recuadro" aria-hidden="true"></div>
      <button type="button" class="tour-cerrar" aria-label="Cerrar tour" title="Cerrar tour (Esc)">✕</button>
      <div class="tour-globo" role="dialog" aria-live="polite" aria-label="Tour de bienvenida">
        <p class="tour-progreso"></p>
        <h3 class="tour-titulo"></h3>
        <p class="tour-texto"></p>
      </div>
      <div class="tour-controles" role="group" aria-label="Navegación del tour">
        <button type="button" class="boton boton-secundario tour-saltar">Saltar tour</button>
        <button type="button" class="boton boton-secundario tour-atras">Atrás</button>
        <button type="button" class="boton boton-primario tour-siguiente">Siguiente</button>
      </div>`;
    document.body.appendChild(this.overlay);

    this.overlay.querySelector(".tour-saltar").addEventListener("click", () => this.terminar());
    this.overlay.querySelector(".tour-cerrar").addEventListener("click", () => this.terminar());
    this.overlay.querySelector(".tour-atras").addEventListener("click", () => this.mover(-1));
    this.overlay.querySelector(".tour-siguiente").addEventListener("click", () => this.mover(1));
    this.alPresionar = (e) => {
      if (e.key === "Escape") this.terminar();
      if (e.key === "ArrowRight") this.mover(1);
      if (e.key === "ArrowLeft") this.mover(-1);
    };
    document.addEventListener("keydown", this.alPresionar);
    // Si cambia el tamaño de la pantalla (o el usuario hace scroll) el recuadro se vuelve a alinear.
    this.alReacomodar = () => this.colocar();
    window.addEventListener("resize", this.alReacomodar);
    window.addEventListener("scroll", this.alReacomodar, { passive: true });

    this.pintarPaso();
  }

  mover(delta) {
    const siguiente = this.indice + delta;
    if (siguiente < 0) return;
    if (siguiente >= this.pasos.length) {
      this.terminar();
      return;
    }
    this.indice = siguiente;
    this.pintarPaso();
  }

  /** Elemento del paso actual, solo si realmente se ve en la vista actual. */
  objetivoActual() {
    const candidato = document.querySelector(this.pasos[this.indice].selector);
    return candidato && candidato.getClientRects().length > 0 && getComputedStyle(candidato).visibility !== "hidden" ? candidato : null;
  }

  async pintarPaso() {
    if (!this.activo) return;
    const paso = this.pasos[this.indice];
    const vigente = ++this.pasoVigente;

    this.overlay.querySelector(".tour-progreso").textContent = `${this.indice + 1} de ${this.pasos.length}`;
    this.overlay.querySelector(".tour-titulo").textContent = paso.titulo;
    this.overlay.querySelector(".tour-texto").textContent = paso.texto;
    this.overlay.querySelector(".tour-atras").disabled = this.indice === 0;
    this.overlay.querySelector(".tour-siguiente").textContent = this.indice === this.pasos.length - 1 ? "Empezar a jugar" : "Siguiente";

    // 1) Si el elemento está en otra pestaña (celular), se cambia a ella primero.
    if (paso.pestana && this.alNecesitarPestana) {
      this.alNecesitarPestana(paso.pestana);
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      if (vigente !== this.pasoVigente) return;
    }

    // 2) Scroll suave hasta dejar el elemento al centro y esperar a que termine.
    const objetivo = this.objetivoActual();
    if (objetivo) {
      const antes = objetivo.getBoundingClientRect();
      const yaCentrado = antes.top >= ALTO_BARRA_SUPERIOR && antes.bottom <= window.innerHeight - ALTO_BARRA_INFERIOR && Math.abs((antes.top + antes.bottom) / 2 - window.innerHeight / 2) < 40;
      if (!yaCentrado) {
        objetivo.scrollIntoView({ behavior: sinAnimacion() ? "auto" : "smooth", block: "center" });
        await this.esperarFinDeScroll();
        if (vigente !== this.pasoVigente) return;
      }
    }
    this.colocar();
    this.overlay?.querySelector(".tour-siguiente")?.focus({ preventScroll: true });
  }

  /** Resuelve cuando el scroll lleva ~120 ms quieto (o a los 900 ms como tope). */
  esperarFinDeScroll() {
    return new Promise((resolver) => {
      let temporizador = setTimeout(fin, 160);
      const tope = setTimeout(fin, 900);
      function alMover() {
        clearTimeout(temporizador);
        temporizador = setTimeout(fin, 120);
      }
      function fin() {
        clearTimeout(temporizador);
        clearTimeout(tope);
        window.removeEventListener("scroll", alMover);
        resolver();
      }
      window.addEventListener("scroll", alMover, { passive: true });
    });
  }

  /** Coloca el recuadro y el globo SIN mover la página. */
  colocar() {
    if (!this.activo || !this.overlay) return;
    const recuadro = this.overlay.querySelector(".tour-recuadro");
    const globo = this.overlay.querySelector(".tour-globo");
    const objetivo = this.objetivoActual();
    const zonaMin = ALTO_BARRA_SUPERIOR;
    const zonaMax = window.innerHeight - ALTO_BARRA_INFERIOR;

    globo.style.maxHeight = `${Math.max(120, zonaMax - zonaMin)}px`;
    const anchoGlobo = Math.min(340, window.innerWidth - 24);
    globo.style.width = `${anchoGlobo}px`;

    if (!objetivo) {
      // Un panel que no existe en esta vista se explica sin recuadro, en el centro.
      recuadro.style.display = "none";
      globo.style.transform = "none";
      globo.style.left = `${(window.innerWidth - anchoGlobo) / 2}px`;
      globo.style.top = `${Math.max(zonaMin, (zonaMin + zonaMax - globo.offsetHeight) / 2)}px`;
      return;
    }

    // El recuadro se recorta a lo visible (hay paneles más altos que la pantalla).
    const rIni = objetivo.getBoundingClientRect();
    const pasoActual = this.pasos[this.indice];
    const finEl = pasoActual?.selectorFin ? document.querySelector(pasoActual.selectorFin) : null;
    const rFin = finEl && finEl.getClientRects().length > 0 && getComputedStyle(finEl).visibility !== "hidden" ? finEl.getBoundingClientRect() : null;
    const r = rFin
      ? {
          top: Math.min(rIni.top, rFin.top),
          left: Math.min(rIni.left, rFin.left),
          bottom: Math.max(rIni.bottom, rFin.bottom),
          right: Math.max(rIni.right, rFin.right),
          width: Math.max(rIni.right, rFin.right) - Math.min(rIni.left, rFin.left),
        }
      : rIni;
    const margen = 6;
    const arriba = Math.max(r.top - margen, 4);
    const abajo = Math.min(r.bottom + margen, window.innerHeight - 4);
    recuadro.style.display = "block";
    recuadro.style.top = `${arriba}px`;
    recuadro.style.left = `${Math.max(r.left - margen, 4)}px`;
    recuadro.style.width = `${Math.min(r.width + margen * 2, window.innerWidth - 8)}px`;
    recuadro.style.height = `${Math.max(abajo - arriba, 0)}px`;

    // Globo: debajo del elemento; si no cabe, encima; si tampoco, sobre la parte baja de la pantalla.
    globo.style.transform = "none";
    const alto = globo.offsetHeight;
    let top = abajo + 12;
    if (top + alto > zonaMax) top = arriba - alto - 12;
    if (top < zonaMin) top = Math.min(Math.max(zonaMin, zonaMax - alto), zonaMax - alto);
    top = Math.max(zonaMin, Math.min(top, zonaMax - alto));
    const left = Math.min(Math.max(12, r.left), window.innerWidth - anchoGlobo - 12);
    globo.style.left = `${left}px`;
    globo.style.top = `${top}px`;
  }

  terminar() {
    if (!this.activo) return;
    this.activo = false;
    this.pasoVigente += 1;
    document.removeEventListener("keydown", this.alPresionar);
    window.removeEventListener("resize", this.alReacomodar);
    window.removeEventListener("scroll", this.alReacomodar);
    document.body.classList.remove("tour-activo");
    this.overlay?.remove();
    this.overlay = null;
    if (this.pasosPropios) this.alTerminar?.();
    else Tour.marcarVisto();
  }
}
