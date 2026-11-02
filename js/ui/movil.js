// movil.js
// Comportamiento propio de pantallas chicas y táctiles (ver css/responsive.css):
//   - pestañas Jugar / Aprende / Consola,
//   - botón Ejecutar flotante y barra de símbolos sobre el teclado virtual,
//   - aviso "Gira tu teléfono" (celular en vertical),
//   - barra de símbolos para el teclado virtual,
//   - ocultar el teclado al ejecutar y llevar la vista al escenario / al resultado.

const consulta = (q) => (typeof window !== "undefined" && typeof window.matchMedia === "function" ? window.matchMedia(q) : { matches: false, addEventListener() {} });

/** Una sola columna (tablet vertical y celulares). */
export const esUnaColumna = () => consulta("(max-width: 992px)").matches;
/** Pantalla táctil: el teclado virtual puede tapar el escenario. */
export const esTactil = () => consulta("(pointer: coarse)").matches;
const sinAnimacion = () => consulta("(prefers-reduced-motion: reduce)").matches;

// ---------------------------------------------------------------- Pestañas (Jugar · Aprende · Consola)
// En una columna el juego se reparte en 3 pestañas en vez de apilar todo:
//   Jugar   → escenario + editor + resultado   (la pestaña inicial de cada nivel)
//   Aprende → concepto del nivel e instrucciones
//   Consola → Salida, Memoria y Estado
// Las reglas que muestran/ocultan los paneles están en css/responsive.css
// (atributo data-pestana del contenedor). En PC no se usan.

export const PESTANAS = ["jugar", "aprende", "consola"];

/** Pestaña a la que pertenece un elemento del juego (para el tour). */
export function pestanaDe(elemento) {
  if (!elemento) return null;
  if (elemento.closest(".panel-aprende")) return "aprende";
  if (elemento.closest(".panel-salida, .panel-memoria, .panel-estado")) return "consola";
  if (elemento.closest(".panel-mundo, .panel-codigo, .panel-feedback")) return "jugar";
  return null;
}

/**
 * @param {object} p
 * @param {HTMLElement} p.contenedor  <main> con data-pestana
 * @param {HTMLElement} p.barra       la tablist
 * @param {(pestana:string)=>void} [p.alCambiar]  p. ej. reajustar el canvas al volver a Jugar
 */
export function configurarPestanas({ contenedor, barra, alCambiar = () => {} }) {
  const botones = [...barra.querySelectorAll('[role="tab"]')];
  let actual = "jugar";

  function seleccionar(pestana, { enfocar = false, subir = true } = {}) {
    if (!PESTANAS.includes(pestana)) return;
    const cambio = pestana !== actual;
    actual = pestana;
    contenedor.dataset.pestana = pestana;
    botones.forEach((b) => {
      const activa = b.dataset.pestana === pestana;
      b.setAttribute("aria-selected", String(activa));
      b.tabIndex = activa ? 0 : -1;
      b.classList.toggle("activa", activa);
      if (activa) b.querySelector(".pestana-aviso")?.setAttribute("hidden", "");
    });
    if (enfocar) botones.find((b) => b.dataset.pestana === pestana)?.focus();
    // Al cambiar de pestaña se empieza arriba del contenido (la barra de pestañas queda a la vista).
    if (cambio && subir && esUnaColumna() && barra.getBoundingClientRect().top < 0) barra.scrollIntoView({ block: "start" });
    alCambiar(pestana, cambio);
  }

  botones.forEach((b, i) => {
    b.addEventListener("click", () => seleccionar(b.dataset.pestana));
    b.addEventListener("keydown", (e) => {
      const paso = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
      if (paso) {
        e.preventDefault();
        seleccionar(botones[(i + paso + botones.length) % botones.length].dataset.pestana, { enfocar: true });
      } else if (e.key === "Home" || e.key === "End") {
        e.preventDefault();
        seleccionar(botones[e.key === "Home" ? 0 : botones.length - 1].dataset.pestana, { enfocar: true });
      }
    });
  });

  seleccionar("jugar", { subir: false });
  return {
    seleccionar,
    actual: () => actual,
    /** Punto en la pestaña: «hay algo nuevo ahí» (p. ej. salida nueva en Consola). */
    marcarNuevo(pestana) {
      if (pestana === actual) return;
      botones.find((b) => b.dataset.pestana === pestana)?.querySelector(".pestana-aviso")?.removeAttribute("hidden");
    },
  };
}

// ---------------------------------------------------------------- Teclado virtual
/**
 * Publica en --teclado la altura del teclado virtual (iOS no encoge la pantalla
 * cuando sale el teclado: hay que medirlo con visualViewport). Así el botón
 * Ejecutar flotante y la barra de símbolos quedan justo ENCIMA del teclado.
 */
export function seguirTeclado() {
  const vv = window.visualViewport;
  if (!vv) return;
  const actualizar = () => {
    const alto = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
    document.documentElement.style.setProperty("--teclado", `${Math.round(alto)}px`);
  };
  vv.addEventListener("resize", actualizar);
  vv.addEventListener("scroll", actualizar);
  actualizar();
}

/** Marca el <body> mientras se edita el código (aparece la barra de símbolos sobre el teclado). */
export function marcarEdicion(textarea) {
  textarea.addEventListener("focus", () => document.body.classList.add("editando-codigo"));
  textarea.addEventListener("blur", () => document.body.classList.remove("editando-codigo"));
}

// ---------------------------------------------------------------- Aviso de orientación
export function configurarAvisoOrientacion(aviso, boton) {
  if (!aviso) return;
  try {
    if (sessionStorage.getItem("codequest:aviso-giro") === "1") aviso.classList.add("cerrado");
  } catch {
    /* sin sessionStorage: se muestra siempre hasta cerrarlo */
  }
  boton?.addEventListener("click", () => {
    aviso.classList.add("cerrado");
    try {
      sessionStorage.setItem("codequest:aviso-giro", "1");
    } catch {
      /* nada */
    }
  });
}

// ---------------------------------------------------------------- Barra de símbolos
export function configurarBarraSimbolos(barra, editor) {
  if (!barra) return;
  // pointerdown + preventDefault: tocar un símbolo NO le quita el foco al editor (el teclado se queda).
  barra.addEventListener("pointerdown", (e) => e.target.closest(".simbolo") && e.preventDefault());
  barra.addEventListener("mousedown", (e) => e.target.closest(".simbolo") && e.preventDefault());
  barra.addEventListener("click", (e) => {
    const boton = e.target.closest(".simbolo");
    if (!boton) return;
    if (boton.dataset.tab) editor.aplicarTab(boton.dataset.tab === "-1");
    else editor.insertarTexto(boton.dataset.texto, Number(boton.dataset.atras) || 0);
  });
}

// ---------------------------------------------------------------- Al ejecutar
/** Antes de ejecutar: quita el foco del editor (oculta el teclado) y lleva la vista al escenario. */
export function prepararEjecucion({ editor, panelEscenario }) {
  if (esTactil()) {
    editor?.blur?.();
    if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur?.();
  }
  if (esUnaColumna() && panelEscenario) {
    const r = panelEscenario.getBoundingClientRect();
    if (r.top < 0 || r.bottom > window.innerHeight) panelEscenario.scrollIntoView({ block: "start", behavior: sinAnimacion() ? "auto" : "smooth" });
  }
}

/** Al terminar: en una columna, muestra el resultado si quedó fuera de la pantalla. */
export function mostrarResultado(panelResultado) {
  if (!esUnaColumna() || !panelResultado) return;
  const r = panelResultado.getBoundingClientRect();
  if (r.bottom > window.innerHeight || r.top < 0) panelResultado.scrollIntoView({ block: "nearest", behavior: sinAnimacion() ? "auto" : "smooth" });
}
