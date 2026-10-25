// indentacion.js
// Lógica PURA de Tab / Shift+Tab del editor (sin DOM, para poder probarla con Node).
// Dado el texto y la selección, calcula qué región reemplazar y cómo queda la selección.

export const SANGRIA = "    "; // 4 espacios

/**
 * @param {{valor:string, inicio:number, fin:number, shift:boolean}} p
 * @returns {{desde:number, hasta:number, texto:string, selInicio:number, selFin:number}}
 */
export function calcularIndentacion({ valor, inicio, fin, shift }) {
  const n = SANGRIA.length;

  // Tab sin selección: insertar 4 espacios en el cursor.
  if (inicio === fin && !shift) {
    return { desde: inicio, hasta: fin, texto: SANGRIA, selInicio: inicio + n, selFin: inicio + n };
  }

  // Líneas afectadas: desde el inicio de la primera hasta el final de la última.
  const inicioLinea = inicio === 0 ? 0 : valor.lastIndexOf("\n", inicio - 1) + 1;
  // Si la selección termina justo al empezar una línea, esa última línea no cuenta.
  const finRango = fin > inicio && valor[fin - 1] === "\n" ? fin - 1 : fin;
  let finLinea = valor.indexOf("\n", finRango);
  if (finLinea === -1) finLinea = valor.length;

  let deltaPrimera = 0;
  let deltaTotal = 0;
  const lineas = valor
    .slice(inicioLinea, finLinea)
    .split("\n")
    .map((linea, i) => {
      let delta;
      if (!shift) {
        linea = SANGRIA + linea;
        delta = n;
      } else {
        // Shift+Tab quita hasta 4 espacios (o un tabulador) del inicio.
        const quitados = (linea.match(/^( {1,4}|\t)/) || [""])[0].length;
        linea = linea.slice(quitados);
        delta = -quitados;
      }
      if (i === 0) deltaPrimera = delta;
      deltaTotal += delta;
      return linea;
    });

  const selInicio = Math.max(inicioLinea, inicio + deltaPrimera);
  const selFin = inicio === fin ? selInicio : Math.max(selInicio, fin + deltaTotal);
  return { desde: inicioLinea, hasta: finLinea, texto: lineas.join("\n"), selInicio, selFin };
}
