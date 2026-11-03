// toursMundo.js
// Tour de INMERSIÓN: la primera vez que el alumno entra a un mundo nuevo (2, 3, 4 o 5) se le presenta el
// escenario nuevo y lo que va a hacer en él. Usa la misma clase Tour de la interfaz (scroll automático,
// controles fijos, ✕, cambio de pestaña en el celular). Cada mundo se muestra UNA vez por persona.

export const PASOS_MUNDO = {
  2: [
    {
      selector: ".panel-salida",
      pestana: "consola",
      titulo: "La terminal",
      texto: "Ya no hay robot. Ahora controlas el sistema. Usa variables para guardar datos y print() para mostrarlos en esta terminal.",
    },
    {
      selector: ".panel-mundo",
      pestana: "jugar",
      titulo: "El Centro de Recuperación",
      texto: "Cada dato que guardes aparecerá aquí como un chip de memoria, con su nombre, su valor y su tipo.",
    },
  ],
  3: [
    {
      selector: ".panel-mundo",
      pestana: "jugar",
      titulo: "La mesa de cartas",
      texto: "Bienvenido al casino. Tu código tomará decisiones. Usa if y else para ganar: la mesa juzgará cada condición con un VERDADERO o un FALSO.",
    },
  ],
  4: [
    {
      selector: ".panel-mundo",
      pestana: "jugar",
      titulo: "El edificio y su elevador",
      texto: "El elevador necesita automatización. Usa ciclos while para subir y bajar sin detenerte, y for para repetir un número exacto de veces.",
    },
  ],
  5: [
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
