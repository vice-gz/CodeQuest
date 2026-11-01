// conceptos.js
// Teoría de CodeQuest: (1) el modal de bienvenida que aparece la primera vez
// que un estudiante entra a un mundo y (2) el glosario "Conceptos" con
// ejemplos visuales. Todo el contenido es texto fijo escrito aquí (no viene
// de la base de datos), por eso se puede insertar como HTML.

import { paletaDe } from "../game/paletas.js";

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
};

// ---------------------------------------------------------------- Glosario
export const GLOSARIO = [
  {
    id: "variable",
    titulo: "Variable",
    resumen: "Una variable es una caja con nombre donde el programa guarda un valor para usarlo después. El signo = guarda el valor; el valor puede cambiar.",
    ejemplo: 'edad = 15\nnombre = "Ana"\nedad = 16   # ahora vale 16',
    visual: "variable",
  },
  {
    id: "algoritmo",
    titulo: "Algoritmo",
    resumen: "Un algoritmo es una receta: una lista de pasos, en orden, que resuelve un problema. Un programa es un algoritmo escrito en un lenguaje que la computadora entiende.",
    ejemplo: "robot1.avanzar(3)\nrobot1.recoger()\nrobot1.girar(\"norte\")",
    visual: "algoritmo",
  },
  {
    id: "operadores",
    titulo: "Operadores",
    resumen: "Los operadores calculan con valores: + suma, - resta, * multiplica, / divide y % da lo que sobra de una división.",
    ejemplo: "total = 17 / 4   # 4\nsobra = 17 % 5   # 2",
    visual: "operadores",
  },
  {
    id: "condicional",
    titulo: "Condicional",
    resumen: "Un condicional es una pregunta con respuesta True o False que decide qué camino sigue el programa. if pregunta, elif añade otra pregunta y else es lo que se hace si ninguna se cumplió.",
    ejemplo: 'if total > 21:\n    print("Bust")\nelif total == 21:\n    print("Blackjack")\nelse:\n    print("Sigue")',
    visual: "condicional",
  },
  {
    id: "comparadores",
    titulo: "Comparadores y lógica",
    resumen: "Para hacer preguntas se comparan valores: == (igual), != (distinto), <, >, <=, >=. Con and, or y not se combinan varias preguntas. OJO: = guarda un valor; == pregunta.",
    ejemplo: 'if color1 == "roja" and total < 21:\n    print("Apuesta")',
    visual: "comparadores",
  },
  {
    id: "ciclo",
    titulo: "Ciclo",
    resumen: "Un ciclo repite instrucciones. while repite MIENTRAS una condición sea verdadera; for repite una cantidad conocida de veces con range(). Cada vuelta es una repetición.",
    ejemplo: "while piso < 5:\n    elevador.subir(1)\n    piso = piso + 1\n\nfor i in range(3):\n    elevador.subir(1)",
    visual: "ciclo",
  },
];

// ---------------------------------------------------------------- Bienvenidas por mundo
export const BIENVENIDAS = {
  1: {
    titulo: "¡Bienvenido al Mundo 1: Despertar!",
    texto: "Robot1 acaba de despertar en un laboratorio y solo entiende instrucciones simples. Aquí aprenderás qué es un programa: una lista de órdenes que se ejecutan una tras otra.",
    puntos: ["Cada instrucción va en su propia línea.", "El orden importa: Robot1 las ejecuta de arriba hacia abajo.", "Si algo falla, el mensaje de error te dirá cómo corregirlo."],
    ejemplo: "robot1.avanzar(3)\nrobot1.hablar(\"Hola\")",
    visual: "algoritmo",
  },
  2: {
    titulo: "¡Bienvenido al Mundo 2: Memoria!",
    texto: "Robot1 perdió la memoria. Aquí aprenderás a guardar datos en variables: cajas con nombre que recuerdan valores para usarlos después.",
    puntos: ["= guarda un valor en una variable.", "Los datos tienen tipo: números, decimales y textos.", "Los operadores (+ - * / %) permiten calcular con ellos."],
    ejemplo: 'energia = 80\nenergia = energia - 15\nprint(energia)',
    visual: "variable",
  },
  3: {
    titulo: "¡Bienvenido al Mundo 3: Lógica!",
    texto: "Un programa útil sabe decidir. Aquí aprenderás a hacer preguntas con if, elif y else, a compararlas y a combinarlas con and, or y not.",
    puntos: ["Una condición responde True o False.", "Las líneas dentro de un if llevan sangría (4 espacios, tecla Tab).", "Tu regla se prueba en varias mesas: tiene que funcionar siempre."],
    ejemplo: 'if total > 21:\n    print("Bust")\nelse:\n    print("Sigue")',
    visual: "condicional",
  },
  4: {
    titulo: "¡Bienvenido al Mundo 4: Automatización!",
    texto: "Repetir órdenes a mano es agotador. Aquí aprenderás a automatizar con ciclos: while repite mientras algo sea cierto y for repite una cantidad de veces.",
    puntos: ["Cada vuelta del ciclo es una repetición.", "Dentro del ciclo hay que cambiar algo, o no terminará nunca.", "Si el programa repite más de 1000 veces, se detiene para protegerte."],
    ejemplo: "for i in range(4):\n    elevador.subir(1)",
    visual: "ciclo",
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

/** Glosario de conceptos con ejemplos visuales (botón "Conceptos"). */
export function abrirGlosario(mundoActual = 1) {
  const { caja, cerrar } = crearModal("modal-ancho");
  caja.style.setProperty("--teoria-acento", paletaDe(mundoActual).acento);
  caja.innerHTML = `
    <div class="teoria-encabezado"><h2>Conceptos de programación</h2>
      <button type="button" class="boton boton-secundario boton-chico" data-cerrar>Cerrar</button></div>
    <div class="teoria-lista">
      ${GLOSARIO.map(
        (g, i) => `<details class="teoria-item"${i === 0 ? " open" : ""}>
          <summary>${esc(g.titulo)}</summary>
          <div class="teoria-cuerpo">
            <div class="teoria-visual">${VISUALES[g.visual]}</div>
            <p>${esc(g.resumen)}</p>
            ${bloqueCodigo(g.ejemplo)}
          </div></details>`
      ).join("")}
    </div>`;
  caja.querySelector("[data-cerrar]").addEventListener("click", cerrar);
  caja.querySelector("[data-cerrar]").focus();
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
    caja.style.setProperty("--teoria-acento", paletaDe(mundo).acento);
    caja.innerHTML = `
      <p class="teoria-etiqueta">Mundo ${mundo}</p>
      <h2>${esc(b.titulo)}</h2>
      <div class="teoria-visual">${VISUALES[b.visual]}</div>
      <p>${esc(b.texto)}</p>
      <ul>${b.puntos.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
      ${bloqueCodigo(b.ejemplo)}
      <div class="modal-acciones">
        <button type="button" class="boton boton-secundario" data-glosario>Ver conceptos</button>
        <button type="button" class="boton boton-primario" data-empezar>¡Empezar!</button>
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
