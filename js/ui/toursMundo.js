// toursMundo.js
// Tour de INMERSIÓN: la primera vez que el alumno entra a un mundo nuevo (2, 3, 4 o 5; el Mundo 1 tiene el recorrido general) se le presenta el
// escenario nuevo y lo que va a hacer en él. Usa la misma clase Tour de la interfaz (scroll automático,
// controles fijos, ✕, cambio de pestaña en el celular). Cada mundo se muestra UNA vez por persona.

export const PASOS_MUNDO = {
  2: [
    {
      selector: ".panel-mundo",
      pestana: "jugar",
      titulo: "La mesa de cartas",
      texto: "Bienvenido al casino. Tu código tomará decisiones. Usa if y else para ganar: la mesa juzgará cada condición con un VERDADERO o un FALSO.",
    },
  ],
  3: [
    {
      selector: ".panel-mundo",
      pestana: "jugar",
      titulo: "El edificio y su elevador",
      texto: "El elevador necesita automatización. Usa ciclos while para subir y bajar sin detenerte, y for para repetir un número exacto de veces.",
    },
  ],
  4: [
    {
      selector: ".panel-mundo",
      pestana: "jugar",
      titulo: "La línea de ensamble",
      texto: "Bienvenido a la fábrica. Cada función que definas con def se construye aquí como una máquina. Cuando la llames, verás viajar una caja de materiales con tus parámetros, las variables locales encenderse dentro y salir el producto terminado (return).",
    },
    {
      selector: ".panel-codigo",
      pestana: "jugar",
      titulo: "Tus máquinas se escriben aquí",
      texto: "Dentro del def va lo que hace la máquina (con sangría). Para encenderla, escribe su nombre con paréntesis; si recibe valores, van entre los paréntesis.",
    },
  ],
};

PASOS_MUNDO[5] = [
  {
    selector: ".panel-mundo",
    pestana: "jugar",
    titulo: "El taller de proyectos",
    texto: "Bienvenido al Laboratorio de creación. Aquí no hay sintaxis nueva: combina input, if, while y variables para resolver cada proyecto. Tus variables aparecen como chips en la memoria.",
  },
  {
    selector: ".panel-codigo",
    pestana: "jugar",
    titulo: "Tu programa se prueba con varios casos",
    texto: "Cada proyecto se ejecuta con varios casos de prueba y tienes que pasarlos todos. Si uno falla, el panel te dice cuál. El Nivel 4 es tu proyecto libre: ¡el cierre de CodeQuest!",
  },
];

const clave = (usuarioId, mundo) => `codequest:tour-mundo:${usuarioId}:${mundo}`;

export function tourDeMundoVisto(usuarioId, mundo) {
  try {
    return localStorage.getItem(clave(usuarioId, mundo)) === "1";
  } catch {
    return false;
  }
}

export function marcarTourDeMundoVisto(usuarioId, mundo) {
  try {
    localStorage.setItem(clave(usuarioId, mundo), "1");
  } catch {
    /* sin localStorage el tour volvería a salir: no pasa nada grave */
  }
}
