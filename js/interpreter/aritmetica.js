// aritmetica.js
// Operaciones de CQL con la MISMA semántica que Python 3 (se comprueba contra el
// Python real en test_python_compat.mjs):
//   +  - *      int con int -> int; si algún lado es float -> float
//   /           SIEMPRE float:  17 / 4 -> 4.25 ,  10 / 2 -> 5.0
//   //          división "hacia abajo":  17 // 4 -> 4 ,  -7 // 2 -> -4
//   %           el residuo toma el signo del divisor:  -5 % 3 -> 1
//   **          potencia:  2 ** 3 -> 8 ,  2 ** -1 -> 0.5
// Solo se mezclan números con números (int y float entre sí) o textos con textos
// en el +. Cualquier otra mezcla es un error de tipos (TypeError en Python).

import { Errores } from "./errors.js";
import { Flotante, esEntero, esFlotante, esNumero, esTexto, esLogico, aNumero, nombreDeTipo, reprPython } from "./valores.js";

const MAX_ENTERO = Number.MAX_SAFE_INTEGER;

function tipoParaMensaje(v) {
  if (v === null || v === undefined) return { tipo: "ninguno", repr: "None" };
  if (esTexto(v)) return { tipo: "texto", repr: reprPython(v) };
  if (esLogico(v)) return { tipo: "logico", repr: reprPython(v) };
  return { tipo: "numero", repr: reprPython(v) };
}

function entero(x, linea) {
  if (!Number.isSafeInteger(x)) throw Errores.enteroDemasiadoGrande(linea);
  return x === 0 ? 0 : x; // evita -0
}

function flotante(x, linea) {
  if (!Number.isFinite(x)) throw Errores.enteroDemasiadoGrande(linea);
  return new Flotante(x);
}

function exigirNumeros(op, a, b, linea) {
  if (esNumero(a) && esNumero(b)) return;
  throw Errores.operacionConTexto(op, nombreDeTipo(a), nombreDeTipo(b), linea);
}

export function sumar(a, b, linea) {
  if (esEntero(a) && esEntero(b)) return entero(a + b, linea);
  if (esNumero(a) && esNumero(b)) return flotante(aNumero(a) + aNumero(b), linea);
  if (esTexto(a) && esTexto(b)) return a + b;
  throw Errores.sumaMezclada(tipoParaMensaje(a), tipoParaMensaje(b), linea);
}

export function restar(a, b, linea) {
  exigirNumeros("-", a, b, linea);
  if (esEntero(a) && esEntero(b)) return entero(a - b, linea);
  return flotante(aNumero(a) - aNumero(b), linea);
}

export function multiplicar(a, b, linea) {
  exigirNumeros("*", a, b, linea);
  if (esEntero(a) && esEntero(b)) return entero(a * b, linea);
  return flotante(aNumero(a) * aNumero(b), linea);
}

export function dividir(a, b, linea) {
  exigirNumeros("/", a, b, linea);
  if (aNumero(b) === 0) throw Errores.divisionEntreCero(linea);
  return flotante(aNumero(a) / aNumero(b), linea);
}

export function divisionEntera(a, b, linea) {
  exigirNumeros("//", a, b, linea);
  const x = aNumero(a);
  const y = aNumero(b);
  if (y === 0) throw Errores.divisionEntreCero(linea);
  if (esEntero(a) && esEntero(b)) {
    let q = Math.trunc(x / y);
    if (x % y !== 0 && x < 0 !== y < 0) q -= 1; // hacia -infinito, como Python
    return entero(q, linea);
  }
  return flotante(Math.floor(x / y), linea);
}

export function modulo(a, b, linea) {
  exigirNumeros("%", a, b, linea);
  const x = aNumero(a);
  const y = aNumero(b);
  if (y === 0) throw Errores.divisionEntreCero(linea);
  let r = x % y;
  if (r !== 0 && r < 0 !== y < 0) r += y; // el signo del residuo es el del divisor
  if (esEntero(a) && esEntero(b)) return entero(r, linea);
  return flotante(r === 0 ? 0 : r, linea);
}

export function potencia(a, b, linea) {
  exigirNumeros("**", a, b, linea);
  const x = aNumero(a);
  const y = aNumero(b);
  if (x === 0 && y < 0) throw Errores.divisionEntreCero(linea);
  const r = Math.pow(x, y);
  if (Number.isNaN(r)) throw Errores.potenciaInvalida(linea); // base negativa con exponente decimal: en Python es complejo
  if (esEntero(a) && esEntero(b) && y >= 0) return entero(r, linea);
  return flotante(r, linea);
}

export function negar(a, linea) {
  if (esEntero(a)) return a === 0 ? 0 : -a;
  if (esFlotante(a)) return new Flotante(-a.v);
  throw Errores.operacionConTexto("-", nombreDeTipo(a), "un número", linea);
}

export const OPERACIONES = { "+": sumar, "-": restar, "*": multiplicar, "/": dividir, "//": divisionEntera, "%": modulo, "**": potencia };

/** ==  !=  entre cualquier tipo: números por valor (1 == 1.0), el resto por tipo y valor. */
export function iguales(a, b) {
  if (esNumero(a) && esNumero(b)) return aNumero(a) === aNumero(b);
  return a === b;
}

/** <  >  <=  >= : solo número con número o texto con texto. */
export function ordenar(op, a, b, linea) {
  const ambosNumeros = esNumero(a) && esNumero(b);
  const ambosTextos = esTexto(a) && esTexto(b);
  if (!ambosNumeros && !ambosTextos) throw Errores.comparacionInvalida(op, nombreDeTipo(a), nombreDeTipo(b), linea);
  const x = ambosNumeros ? aNumero(a) : a;
  const y = ambosNumeros ? aNumero(b) : b;
  if (op === "<") return x < y;
  if (op === ">") return x > y;
  if (op === "<=") return x <= y;
  return x >= y;
}

export { MAX_ENTERO };

// ---------------------------------------------------------------- conversiones: int(), float(), str()

const PATRON_ENTERO = /^[+-]?\d+$/;
const PATRON_DECIMAL = /^[+-]?(\d+(\.\d*)?|\.\d+)$/;

export function convertirAEntero(v, linea) {
  if (v === null || v === undefined) throw Errores.conversionNinguno("int", linea);
  if (esEntero(v)) return v;
  if (esFlotante(v)) return entero(Math.trunc(v.v), linea); // int(3.9) -> 3 ; int(-3.9) -> -3
  if (esLogico(v)) return v ? 1 : 0;
  const t = String(v).trim();
  if (!PATRON_ENTERO.test(t)) throw Errores.valorNoNumerico("int", v, linea);
  return entero(parseInt(t, 10), linea);
}

export function convertirADecimal(v, linea) {
  if (v === null || v === undefined) throw Errores.conversionNinguno("float", linea);
  if (esFlotante(v)) return v;
  if (esEntero(v)) return flotante(v, linea);
  if (esLogico(v)) return new Flotante(v ? 1 : 0);
  const t = String(v).trim();
  if (!PATRON_DECIMAL.test(t)) throw Errores.valorNoNumerico("float", v, linea);
  return flotante(parseFloat(t), linea);
}
