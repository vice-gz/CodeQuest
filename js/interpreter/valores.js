// valores.js
// Representación de los valores de CQL, calcada de Python:
//   int    -> número de JavaScript que siempre es entero            5, -3
//   float  -> instancia de Flotante (así 5.0 sigue siendo float)    new Flotante(5)
//   str    -> string de JavaScript                                   "hola"
//   bool   -> boolean de JavaScript                                  true / false
//
// Un número de JavaScript no distingue 5 de 5.0, y en Python eso importa:
// 10 / 2 da 5.0 (no 5). Por eso los decimales se guardan en una clase propia.

export class Flotante {
  constructor(v) {
    this.v = v;
  }
}

export const esFlotante = (x) => x instanceof Flotante;
export const esEntero = (x) => typeof x === "number";
export const esNumero = (x) => esEntero(x) || esFlotante(x);
export const esTexto = (x) => typeof x === "string";
export const esLogico = (x) => typeof x === "boolean";

/** Valor de JavaScript "plano" (los Flotante pasan a número): para motores y validaciones. */
export const aJS = (x) => (esFlotante(x) ? x.v : x);

/** El número de JavaScript que hay dentro de un int o un float. */
export const aNumero = (x) => (esFlotante(x) ? x.v : x);

/** Cómo imprime Python un float: 5.0, 4.25, 1e-07, 1e+16 */
export function reprFlotante(x) {
  if (Object.is(x, -0)) return "-0.0";
  const a = Math.abs(x);
  if (a !== 0 && (a >= 1e16 || a < 1e-4)) {
    return x.toExponential().replace(/e([+-])(\d)$/, "e$10$2");
  }
  return Number.isInteger(x) ? `${x}.0` : String(x);
}

/** Lo que muestra print() y lo que devuelve str(): textos tal cual, True/False, floats al estilo Python. */
export function formatear(v) {
  if (esFlotante(v)) return reprFlotante(v.v);
  if (esLogico(v)) return v ? "True" : "False";
  return String(v);
}

/** Como se ve un valor dentro de un mensaje o del panel de Memoria: los textos entre comillas. */
export function reprPython(v) {
  return esTexto(v) ? `"${v}"` : formatear(v);
}

export function nombreDeTipo(v) {
  if (esEntero(v)) return "un número entero";
  if (esFlotante(v)) return "un número decimal";
  if (esTexto(v)) return "un texto";
  if (esLogico(v)) return "un valor lógico (True/False)";
  return "un valor";
}

/** Tipo "corto" para las etiquetas del panel de Memoria. */
export function etiquetaDeTipo(v) {
  if (esEntero(v)) return "ENTERO";
  if (esFlotante(v)) return "DECIMAL";
  if (esTexto(v)) return "TEXTO";
  if (esLogico(v)) return "LÓGICO";
  return "?";
}
