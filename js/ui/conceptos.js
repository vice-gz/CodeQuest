// conceptos.js
// Teoría de CodeQuest: (1) el modal de bienvenida que aparece la primera vez
// que un estudiante entra a un mundo y (2) el glosario "Conceptos" con
// ejemplos visuales. Todo el contenido es texto fijo escrito aquí (no viene
// de la base de datos), por eso se puede insertar como HTML.

import { paletaDe } from "../game/paletas.js";
import { CONCEPTOS, conceptosHasta, conceptosDelMundo, buscarConceptos } from "./glosarioDatos.js";

// ---------------------------------------------------------------- Ilustraciones (SVG)
const SVG_BASE = 'viewBox="0 0 240 110" role="img" xmlns="http://www.w3.org/2000/svg"';

const VISUALES = {
  variable: `<svg ${SVG_BASE} aria-label="Una variable es una caja con nombre que guarda un valor">
    <rect x="20" y="25" width="86" height="60" rx="10" fill="none" stroke="currentColor" stroke-width="3"/>
    <text x="63" y="44" text-anchor="middle" font-size="13" fill="currentColor" font-family="monospace">edad</text>
    <text x="63" y="71" text-anchor="middle" font-size="24" font-weight="700" fill="currentColor" font-family="monospace">15</text>
    <path d="M118 55 h40" stroke="currentColor" stroke-width="3"/><path d="M150 46 l10 9 l-10 9" fill="none" stroke="currentColor" stroke-width="3"/>
    <text x="196" y="52" text-anchor="middle" font-size="13" fill="currentColor" font-family="monospace">edad = 15</text>
    <text x="196" y="72" text-anchor="middle" font-size="11" opacity=".7" fill="currentColor">nombre = valor</text></svg>`,
  algoritmo: `<svg ${SVG_BASE} aria-label="Un algoritmo es una lista de pasos en orden">
    ${[0, 1, 2]
      .map(
        (i) => `<g transform="translate(${14 + i * 78},30)"><rect width="66" height="50" rx="10" fill="none" stroke="currentColor" stroke-width="3"/>
        <text x="33" y="22" text-anchor="middle" font-size="12" font-weight="700" fill="currentColor">${i + 1}</text>
        <text x="33" y="40" text-anchor="middle" font-size="11" fill="currentColor">${["mirar", "subir", "recoger"][i]}</text></g>
        ${i < 2 ? `<path d="M${82 + i * 78} 55 h10" stroke="currentColor" stroke-width="3"/>` : ""}`
      )
      .join("")}
    <text x="120" y="102" text-anchor="middle" font-size="11" opacity=".7" fill="currentColor">pasos en orden</text></svg>`,
  operadores: `<svg ${SVG_BASE} aria-label="Operadores: suman, restan, multiplican, dividen y dan el residuo">
    ${["+", "−", "×", "÷", "%"]
      .map(
        (o, i) => `<g transform="translate(${10 + i * 45},28)"><circle cx="20" cy="22" r="19" fill="none" stroke="currentColor" stroke-width="3"/>
        <text x="20" y="30" text-anchor="middle" font-size="22" font-weight="700" fill="currentColor">${o}</text>
        <text x="20" y="60" text-anchor="middle" font-size="10" fill="currentColor" opacity=".8">${["suma", "resta", "por", "entre", "resto"][i]}</text></g>`
      )
      .join("")}</svg>`,
  condicional: `<svg ${SVG_BASE} aria-label="Un condicional es una pregunta con dos caminos">
    <path d="M120 8 l46 30 l-46 30 l-46 -30 z" fill="none" stroke="currentColor" stroke-width="3"/>
    <text x="120" y="42" text-anchor="middle" font-size="12" font-family="monospace" fill="currentColor">total &gt; 21 ?</text>
    <path d="M74 38 h-40 v34" fill="none" stroke="currentColor" stroke-width="3"/><path d="M166 38 h40 v34" fill="none" stroke="currentColor" stroke-width="3"/>
    <rect x="6" y="72" width="64" height="28" rx="8" fill="none" stroke="currentColor" stroke-width="3"/><text x="38" y="91" text-anchor="middle" font-size="12" fill="currentColor">Bust</text>
    <rect x="170" y="72" width="64" height="28" rx="8" fill="none" stroke="currentColor" stroke-width="3"/><text x="202" y="91" text-anchor="middle" font-size="12" fill="currentColor">Sigue</text>
    <text x="52" y="30" font-size="11" font-weight="700" fill="currentColor">Sí</text><text x="178" y="30" font-size="11" font-weight="700" fill="currentColor">No</text></svg>`,
  comparadores: `<svg ${SVG_BASE} aria-label="Comparadores y operadores lógicos">
    ${["==", "!=", "<", ">", "<=", ">="]
      .map(
        (o, i) => `<g transform="translate(${12 + (i % 3) * 76},${8 + Math.floor(i / 3) * 46})"><rect width="64" height="36" rx="9" fill="none" stroke="currentColor" stroke-width="3"/>
        <text x="32" y="24" text-anchor="middle" font-size="16" font-weight="700" font-family="monospace" fill="currentColor">${o.replace("<", "&lt;").replace(">", "&gt;")}</text></g>`
      )
      .join("")}
    <text x="120" y="106" text-anchor="middle" font-size="11" opacity=".75" fill="currentColor">and · or · not  combinan respuestas True / False</text></svg>`,
  ciclo: `<svg ${SVG_BASE} aria-label="Un ciclo repite instrucciones">
    <path d="M60 70 a44 40 0 1 1 22 34" fill="none" stroke="currentColor" stroke-width="3.5"/><path d="M82 104 l-4 -14 l15 6" fill="none" stroke="currentColor" stroke-width="3.5"/>
    <text x="60" y="52" text-anchor="middle" font-size="12" fill="currentColor" font-family="monospace">subir(1)</text>
    <text x="60" y="68" text-anchor="middle" font-size="10" opacity=".7" fill="currentColor">repetir</text>
    <text x="170" y="42" text-anchor="middle" font-size="12" font-family="monospace" fill="currentColor">while piso &lt; 5:</text>
    <text x="170" y="62" text-anchor="middle" font-size="12" font-family="monospace" fill="currentColor">for i in range(3):</text>
    <text x="170" y="86" text-anchor="middle" font-size="11" opacity=".7" fill="currentColor">mientras… / N veces</text></svg>`,
  funcion: `<svg ${SVG_BASE} aria-label="Una función es una máquina: entra un material, sale un producto">
    <rect x="12" y="46" width="44" height="28" rx="6" fill="none" stroke="currentColor" stroke-width="2.5"/>
    <text x="34" y="64" text-anchor="middle" font-size="12" font-family="monospace" fill="currentColor">[5, 3]</text>
    <path d="M60 60 H86" stroke="currentColor" stroke-width="2.5"/><path d="M80 54 l8 6 l-8 6" fill="none" stroke="currentColor" stroke-width="2.5"/>
    <rect x="92" y="28" width="56" height="64" rx="10" fill="none" stroke="currentColor" stroke-width="3"/>
    <circle cx="120" cy="52" r="10" fill="none" stroke="currentColor" stroke-width="3" stroke-dasharray="4 3"/>
    <text x="120" y="80" text-anchor="middle" font-size="10" font-family="monospace" fill="currentColor">sumar</text>
    <path d="M152 60 H178" stroke="currentColor" stroke-width="2.5"/><path d="M172 54 l8 6 l-8 6" fill="none" stroke="currentColor" stroke-width="2.5"/>
    <rect x="184" y="46" width="44" height="28" rx="6" fill="currentColor" opacity=".25" stroke="currentColor" stroke-width="2.5"/>
    <text x="206" y="64" text-anchor="middle" font-size="13" font-family="monospace" fill="currentColor">8</text>
    <text x="34" y="96" text-anchor="middle" font-size="10" opacity=".7" fill="currentColor">parámetros</text>
    <text x="206" y="96" text-anchor="middle" font-size="10" opacity=".7" fill="currentColor">return</text></svg>`,
};

// ---------------------------------------------------------------- Glosario
// El contenido está en glosarioDatos.js. Aquí vive la pantalla: buscador, filtro
// por mundo y tarjetas con definición + analogía + ejemplo.
export { GLOSARIO, CONCEPTOS, conceptosHasta, conceptosDelMundo, buscarConceptos } from "./glosarioDatos.js";

// ---------------------------------------------------------------- Bienvenidas por mundo
export const BIENVENIDAS = {
  1: {
    titulo: "¡Bienvenido al Mundo 1: Fundamentos y Datos!",
    texto: "Robot1 acaba de despertar en un laboratorio y solo entiende instrucciones simples. Después saldrá al pueblo, donde cada problema se resuelve con datos: guardarlos en variables, pedirlos con input() y calcular con ellos.",
    puntos: ["Cada instrucción va en su propia línea y el orden importa.", "Una variable es una caja con nombre: = guarda un valor y ahorro += 100 lo actualiza.", "El contador «Líneas: X / Límite» te avisa si tu solución se puede escribir más corta.", "Si algo falla, el mensaje de error te dirá cómo corregirlo."],
    ejemplo: "robot1.avanzar(3)\nahorro = 0\nahorro += 100\nprint(ahorro)",
    visual: "algoritmo",
  },
  2: {
    titulo: "¡Bienvenido al Mundo 2: Lógica!",
    texto: "Un programa útil sabe decidir. Aquí aprenderás a hacer preguntas con if, elif y else, a compararlas y a combinarlas con and, or y not.",
    puntos: ["Una condición responde True o False.", "Las líneas dentro de un if llevan sangría (4 espacios, tecla Tab).", "Tu regla se prueba en varias mesas: tiene que funcionar siempre."],
    ejemplo: 'if total > 21:\n    print("Bust")\nelse:\n    print("Sigue")',
    visual: "condicional",
  },
  3: {
    titulo: "¡Bienvenido al Mundo 3: Automatización!",
    texto: "Repetir órdenes a mano es agotador. Aquí aprenderás a automatizar con ciclos: while repite mientras algo sea cierto y for repite una cantidad de veces.",
    puntos: ["Cada vuelta del ciclo es una repetición.", "Dentro del ciclo hay que cambiar algo, o no terminará nunca.", "Si el programa repite más de 1000 veces, se detiene para protegerte."],
    ejemplo: "for i in range(4):\n    elevador.subir(1)",
    visual: "ciclo",
  },
  4: {
    titulo: "¡Bienvenido al Mundo 4: Modularidad!",
    texto: "En la fábrica de robots no se repite el trabajo a mano: se construyen máquinas. Aquí aprenderás a crear funciones con def, a darles parámetros y a pedirles resultados con return.",
    puntos: ["def construye la máquina; llamarla con su nombre la enciende.", "Los parámetros son las ranuras de entrada; return es la bandeja de salida.", "Las variables de dentro de una función son locales: no se ven desde fuera."],
    ejemplo: "def calcular_doble(x):\n    return x * 2\nprint(calcular_doble(21))",
    visual: "funcion",
  },
  5: {
    titulo: "¡Bienvenido al Mundo 5: Proyecto!",
    texto: "Aquí ya no hay lecciones nuevas: solo proyectos. Cada reto junta lo que sabes (entradas, decisiones, ciclos y variables) y se prueba con varios casos, así que tu programa tiene que funcionar siempre, no solo una vez.",
    puntos: ["Lee bien el enunciado: los casos de prueba revisan los detalles (por ejemplo, qué pasa justo en el límite).", "Si un caso falla, el panel te dice cuál para que lo revises.", "El último nivel es tu proyecto libre: tú decides qué construir."],
    ejemplo: 'dinero = int(input())\nprecio = int(input())\nif dinero >= precio:\n    print("Cambio: " + str(dinero - precio))',
  },
};

// ---------------------------------------------------------------- Modales
function crearModal(clase = "") {
  const fondo = document.createElement("div");
  fondo.className = "modal-fondo modal-teoria-fondo";
  const caja = document.createElement("div");
  caja.className = `modal modal-teoria ${clase}`;
  caja.setAttribute("role", "dialog");
  caja.setAttribute("aria-modal", "true");
  fondo.appendChild(caja);
  document.body.appendChild(fondo);
  document.body.classList.add("sin-scroll");
  const cerrar = () => {
    fondo.remove();
    document.body.classList.remove("sin-scroll");
    document.removeEventListener("keydown", alTeclear);
  };
  const alTeclear = (e) => {
    if (e.key === "Escape") cerrar();
  };
  document.addEventListener("keydown", alTeclear);
  fondo.addEventListener("click", (e) => {
    if (e.target === fondo) cerrar();
  });
  return { caja, cerrar };
}

const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function bloqueCodigo(codigo) {
  return `<pre class="teoria-codigo"><code>${esc(codigo)}</code></pre>`;
}

function tarjetaConcepto(c, { abierta, mundoActual }) {
  const nuevo = c.mundo === mundoActual;
  const urlLaboratorio = `juego.html?modo=sandbox&concepto=${encodeURIComponent(c.id)}`;
  return `<details class="teoria-item concepto-item"${abierta ? " open" : ""}>
    <summary><span>${esc(c.titulo)}</span><span class="concepto-etiqueta-mundo${nuevo ? " nuevo" : ""}">${nuevo ? "Nuevo · " : ""}Mundo ${c.mundo}</span></summary>
    <div class="teoria-cuerpo">
      ${c.visual && VISUALES[c.visual] ? `<div class="teoria-visual">${VISUALES[c.visual]}</div>` : ""}
      <p class="concepto-def"><strong>Definición.</strong> ${esc(c.definicion)}</p>
      <p class="concepto-analogia"><span aria-hidden="true">💡</span> <strong>Analogía.</strong> ${esc(c.analogia)}</p>
      ${bloqueCodigo(c.ejemplo)}
      <div class="concepto-acciones">
        <a class="boton boton-secundario boton-chico concepto-probar" href="${urlLaboratorio}" data-probar-concepto="${esc(c.id)}">Probar en el Laboratorio Libre</a>
      </div>
    </div></details>`;
}

/**
 * Pinta el glosario dentro de `raiz`: buscador + filtro por mundo + tarjetas.
 * Solo muestra los conceptos de `mundoActual` y de los mundos anteriores.
 */
export function montarGlosario(raiz, mundoActual = 1) {
  const mundo = Math.min(Math.max(Number(mundoActual) || 1, 1), 6);
  raiz.innerHTML = `
    <div class="glosario-barra">
      <label class="glosario-buscador">
        <span class="solo-lectores">Buscar un concepto</span>
        <input type="search" class="campo" placeholder="Buscar: variable, if, ciclo…" autocomplete="off" data-buscar />
      </label>
      <div class="glosario-filtros" role="group" aria-label="Qué conceptos mostrar">
        <button type="button" class="caso-boton activo" data-vista="hasta" aria-pressed="true">Todo hasta el Mundo ${mundo}</button>
        <button type="button" class="caso-boton" data-vista="solo" aria-pressed="false">Solo el Mundo ${mundo}</button>
      </div>
    </div>
    <p class="texto-vacio" data-conteo role="status"></p>
    <div class="teoria-lista" data-lista></div>`;
  const entrada = raiz.querySelector("[data-buscar]");
  const lista = raiz.querySelector("[data-lista]");
  const conteo = raiz.querySelector("[data-conteo]");
  let vista = "hasta";

  const pintar = () => {
    const base = vista === "solo" ? conceptosDelMundo(mundo) : conceptosHasta(mundo);
    const texto = entrada.value;
    const visibles = buscarConceptos(base, texto);
    const buscando = texto.trim() !== "";
    lista.innerHTML = visibles.map((c, i) => tarjetaConcepto(c, { abierta: buscando || (vista === "solo" ? i === 0 : c.mundo === mundo && i === base.findIndex((x) => x.mundo === mundo)), mundoActual: mundo })).join("");
    conteo.textContent = visibles.length
      ? `${visibles.length} concepto${visibles.length === 1 ? "" : "s"}${buscando ? " encontrado" + (visibles.length === 1 ? "" : "s") : ""}.`
      : `No encontramos «${texto.trim()}» entre los conceptos de los mundos que llevas. Prueba con otra palabra.`;
  };
  entrada.addEventListener("input", pintar);
  raiz.querySelectorAll("[data-vista]").forEach((b) =>
    b.addEventListener("click", () => {
      vista = b.dataset.vista;
      raiz.querySelectorAll("[data-vista]").forEach((x) => {
        x.classList.toggle("activo", x === b);
        x.setAttribute("aria-pressed", String(x === b));
      });
      pintar();
    })
  );
  pintar();
  return { entrada, pintar };
}

/** Glosario en ventana (botón "Conceptos" del juego y del mapa). */
export function abrirGlosario(mundoActual = 1) {
  const { caja, cerrar } = crearModal("modal-ancho modal-glosario");
  caja.style.setProperty("--teoria-acento", paletaDe(mundoActual).acento);
  caja.innerHTML = `
    <div class="teoria-encabezado"><h2>Conceptos de programación</h2>
      <button type="button" class="boton boton-secundario boton-chico" data-cerrar>Cerrar</button></div>
    <div data-glosario></div>`;
  montarGlosario(caja.querySelector("[data-glosario]"), mundoActual);
  caja.querySelector("[data-cerrar]").addEventListener("click", cerrar);
  caja.querySelector("[data-buscar]").focus();
}

const claveVista = (usuarioId, mundo) => `codequest:teoria:${usuarioId || "anon"}:${mundo}`;

export function bienvenidaYaVista(usuarioId, mundo) {
  try {
    return localStorage.getItem(claveVista(usuarioId, mundo)) === "1";
  } catch {
    return false;
  }
}

/**
 * Modal de bienvenida a un mundo. Se muestra solo la primera vez (por usuario
 * y por mundo, guardado en este navegador), salvo que se fuerce.
 * @returns {Promise<void>} se resuelve cuando el estudiante lo cierra
 */
export function mostrarBienvenidaMundo(mundo, { usuarioId = null, forzar = false } = {}) {
  const b = BIENVENIDAS[mundo];
  if (!b || (!forzar && bienvenidaYaVista(usuarioId, mundo))) return Promise.resolve();

  return new Promise((resolve) => {
    const { caja, cerrar } = crearModal("modal-bienvenida");
    caja.setAttribute("aria-labelledby", "bienvenida-titulo");
    caja.style.setProperty("--teoria-acento", paletaDe(mundo).acento);
    caja.innerHTML = `
      <div class="bienvenida-cabecera">
        <p class="teoria-etiqueta">Mundo ${mundo}</p>
        <h2 class="bienvenida-titulo" id="bienvenida-titulo">${esc(b.titulo)}</h2>
      </div>
      ${VISUALES[b.visual] ? `<div class="teoria-visual">${VISUALES[b.visual]}</div>` : ""}
      <p class="bienvenida-texto">${esc(b.texto)}</p>
      <ul class="bienvenida-puntos">${b.puntos.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
      ${bloqueCodigo(b.ejemplo)}
      <div class="modal-acciones modal-acciones-bienvenida">
        <button type="button" class="boton boton-primario boton-bienvenida boton-bienvenida-empezar" data-empezar>¡Empezar!</button>
        <button type="button" class="boton boton-secundario boton-bienvenida boton-bienvenida-conceptos" data-glosario>Ver conceptos</button>
      </div>`;
    const terminar = () => {
      try {
        if (usuarioId !== undefined) localStorage.setItem(claveVista(usuarioId, mundo), "1");
      } catch {
        /* sin localStorage: se mostrará de nuevo la próxima vez */
      }
      cerrar();
      resolve();
    };
    caja.querySelector("[data-empezar]").addEventListener("click", terminar);
    caja.querySelector("[data-glosario]").addEventListener("click", () => abrirGlosario(mundo));
    caja.parentElement.addEventListener("click", (e) => {
      if (e.target === caja.parentElement) terminar();
    });
    caja.querySelector("[data-empezar]").focus();
  });
}

export { VISUALES };
