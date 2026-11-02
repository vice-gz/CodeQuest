// validator.js
// Verifica la semántica del AST: variables definidas, funciones/métodos que
// existen (según el mundo), que las instrucciones estén permitidas en la fase
// actual, y que solo se use como valor lo que realmente devuelve un valor.
//
// Python 3: además lleva una "inferencia de tipos" sencilla para dar errores
// EDUCATIVOS antes de ejecutar, igual que el TypeError que daría Python:
//   - input() devuelve SIEMPRE texto: input() + 5 se rechaza y se explica int(input()).
//   - "5" + 3 (texto + número) se rechaza. Solo texto + texto o número + número.
// Solo se avisa cuando el tipo de AMBOS lados es seguro; si hay duda (una variable que
// cambia de tipo según una condición, el valor de un método...) se deja pasar y el
// intérprete lo detecta al ejecutar.
//
// Permisos en instruccionesPermitidas de cada fase:
//   print, input, int, float, str, asignacion, if, elif, else, while, for, and, or, not, booleanos
// Las comparaciones (==, !=, <, >, <=, >=) y True/False se aceptan cuando la fase
// permite if, while o booleanos.

import { Errores } from "./errors.js";
import { esDireccionValida } from "../game/movimiento.js";
import { BIBLIOTECA_ROBOT } from "./bibliotecas.js";
import { formatearExpresion } from "./ast.js";

const FUNCIONES_CONOCIDAS = new Set(["print", "input", "int", "float", "str"]);
const FUNCIONES_QUE_RETORNAN_VALOR = new Set(["input", "int", "float", "str"]);
// Nombres de funciones de Python: no se pueden usar como nombre de variable.
const RESERVADOS = new Set(["print", "input", "int", "float", "str", "range"]);

const DESCONOCIDO = { t: null, input: false };
const esNumerico = (x) => x.t === "entero" || x.t === "decimal";
const nombreTipoCorto = (x) => ({ entero: "un número entero", decimal: "un número decimal", texto: "un texto", logico: "un valor lógico (True/False)" })[x.t];

export class Validator {
  /**
   * @param {object} fase - configuración de la fase actual
   *   (instruccionesPermitidas, metodosPermitidos)
   * @param {object} [opciones]
   * @param {object} [opciones.biblioteca] objetos y métodos del mundo (bibliotecas.js)
   * @param {string[]} [opciones.variablesIniciales] variables que el escenario ya define
   */
  constructor(fase, { biblioteca = BIBLIOTECA_ROBOT, variablesIniciales = [] } = {}) {
    this.fase = fase;
    this.biblioteca = biblioteca;
    this.instruccionesPermitidas = new Set(fase?.instruccionesPermitidas || []);
    this.metodosPermitidos = new Set(fase?.metodosPermitidos || []);
    this.variables = new Set(variablesIniciales);
    this.tipos = new Map(); // variable -> {t, input}
  }

  validar(programa) {
    this.validarSentencias(programa.sentencias);
    return true;
  }

  validarSentencias(sentencias) {
    for (const sentencia of sentencias) this.validarSentencia(sentencia);
  }

  permitido(clave) {
    return this.instruccionesPermitidas.has(clave);
  }

  exigir(clave, nombreEnError, linea) {
    if (!this.permitido(clave)) throw Errores.palabraNoPermitidaEnNivel(nombreEnError, linea);
  }

  // ------------------------------------------------------------ tipos (inferencia sencilla)

  /** Tipo estático de una expresión: {t: "entero"|"decimal"|"texto"|"logico"|null, input: ¿viene de input()?} */
  tipoDe(nodo) {
    switch (nodo.tipo) {
      case "Numero":
        return { t: nodo.decimal ? "decimal" : "entero", input: false };
      case "Texto":
        return { t: "texto", input: false };
      case "Booleano":
      case "Comparacion":
      case "Logica":
      case "Negacion":
        return { t: "logico", input: false };
      case "Identificador":
        return this.tipos.get(nodo.nombre) || DESCONOCIDO;
      case "Negativo":
        return { ...this.tipoDe(nodo.operando), input: false };
      case "LlamadaFuncion":
        if (nodo.nombre === "input") return { t: "texto", input: true };
        if (nodo.nombre === "str") return { t: "texto", input: false };
        if (nodo.nombre === "int") return { t: "entero", input: false };
        if (nodo.nombre === "float") return { t: "decimal", input: false };
        return DESCONOCIDO;
      case "OperacionBinaria": {
        const a = this.tipoDe(nodo.izquierda);
        const b = this.tipoDe(nodo.derecha);
        if (nodo.operador === "/") return esNumerico(a) && esNumerico(b) ? { t: "decimal", input: false } : DESCONOCIDO;
        if (nodo.operador === "+" && a.t === "texto" && b.t === "texto") return { t: "texto", input: false };
        if (!esNumerico(a) || !esNumerico(b)) return DESCONOCIDO;
        if (nodo.operador === "**") return a.t === "entero" && b.t === "entero" ? DESCONOCIDO : { t: "decimal", input: false }; // 2 ** -1 es decimal
        return { t: a.t === "decimal" || b.t === "decimal" ? "decimal" : "entero", input: false };
      }
      default:
        return DESCONOCIDO;
    }
  }

  /** Junta los tipos de varias ramas: si no coinciden, la variable queda con tipo "dudoso". */
  fusionar(mapas) {
    const claves = new Set(mapas.flatMap((m) => [...m.keys()]));
    const resultado = new Map();
    for (const k of claves) {
      const tipos = mapas.map((m) => m.get(k) || DESCONOCIDO);
      const igual = tipos.every((x) => x.t && x.t === tipos[0].t);
      resultado.set(k, igual ? { t: tipos[0].t, input: tipos.every((x) => x.input) } : DESCONOCIDO);
    }
    this.tipos = resultado;
  }

  /** Valida cada rama partiendo del mismo estado y luego fusiona lo que cada una dejó. */
  conRamas(ramas, { hayCaminoSinRama = false } = {}) {
    const antes = new Map(this.tipos);
    const despues = [];
    for (const rama of ramas) {
      this.tipos = new Map(antes);
      rama();
      despues.push(this.tipos);
    }
    if (hayCaminoSinRama) despues.push(antes);
    this.fusionar(despues);
  }

  /** Descripción para el mensaje de TypeError: «un texto ("5")». */
  describir(nodo, info) {
    return { tipo: info.t === "texto" ? "texto" : info.t === "logico" ? "logico" : "numero", repr: formatearExpresion(nodo) };
  }

  /** TypeError "estático": solo cuando el tipo de AMBOS lados es seguro. */
  revisarOperacion(nodo) {
    const a = this.tipoDe(nodo.izquierda);
    const b = this.tipoDe(nodo.derecha);
    if (!a.t || !b.t) return;
    const bien = nodo.operador === "+" ? (esNumerico(a) && esNumerico(b)) || (a.t === "texto" && b.t === "texto") : esNumerico(a) && esNumerico(b);
    if (bien) return;

    // Caso estrella de la clase: operar con lo que devolvió input() sin convertirlo.
    if ((a.input && b.t !== "texto") || (b.input && a.t !== "texto")) {
      const conv = (n, info) => (info.input ? `int(${formatearExpresion(n)})` : formatearExpresion(n));
      throw Errores.inputDevuelveTexto(nodo.linea, `${conv(nodo.izquierda, a)} ${nodo.operador} ${conv(nodo.derecha, b)}`);
    }
    if (nodo.operador === "+") throw Errores.sumaMezclada(this.describir(nodo.izquierda, a), this.describir(nodo.derecha, b), nodo.linea);
    throw Errores.operacionConTexto(nodo.operador, nombreTipoCorto(a), nombreTipoCorto(b), nodo.linea);
  }

  // ------------------------------------------------------------ sentencias

  validarSentencia(sentencia) {
    switch (sentencia.tipo) {
      case "Asignacion":
        this.validarAsignacion(sentencia);
        break;
      case "LlamadaFuncion":
        this.validarLlamadaFuncion(sentencia, false);
        break;
      case "LlamadaMetodo":
        this.validarLlamadaMetodo(sentencia, false);
        break;
      case "Condicional":
        this.validarCondicional(sentencia);
        break;
      case "Mientras":
        this.exigir("while", "while", sentencia.linea);
        this.validarExpresion(sentencia.condicion);
        this.conRamas([() => this.validarSentencias(sentencia.bloque.sentencias)], { hayCaminoSinRama: true });
        break;
      case "Para":
        this.exigir("for", "for", sentencia.linea);
        if (RESERVADOS.has(sentencia.variable)) throw Errores.nombreReservado(sentencia.variable, sentencia.linea);
        sentencia.argumentos.forEach((a) => this.validarExpresion(a));
        this.variables.add(sentencia.variable);
        this.conRamas(
          [
            () => {
              this.tipos.set(sentencia.variable, { t: "entero", input: false });
              this.validarSentencias(sentencia.bloque.sentencias);
            },
          ],
          { hayCaminoSinRama: true }
        );
        break;
      default:
        break;
    }
  }

  validarCondicional(nodo) {
    this.exigir(nodo.esElif ? "elif" : "if", nodo.esElif ? "elif" : "if", nodo.linea);
    this.validarExpresion(nodo.condicion);
    const ramas = [() => this.validarSentencias(nodo.bloqueSi.sentencias)];
    if (nodo.bloqueSino) {
      const esCadenaElif = nodo.bloqueSino.sentencias.length === 1 && nodo.bloqueSino.sentencias[0].esElif === true;
      if (!esCadenaElif) this.exigir("else", "else", nodo.bloqueSino.linea);
      ramas.push(() => this.validarSentencias(nodo.bloqueSino.sentencias));
    }
    this.conRamas(ramas, { hayCaminoSinRama: !nodo.bloqueSino });
  }

  validarAsignacion(nodo) {
    if (!this.permitido("asignacion")) {
      throw Errores.asignacionNoPermitidaEnNivel(nodo.linea);
    }
    if (RESERVADOS.has(nodo.variable)) throw Errores.nombreReservado(nodo.variable, nodo.linea);
    this.validarExpresion(nodo.expresion);
    this.variables.add(nodo.variable);
    this.tipos.set(nodo.variable, this.tipoDe(nodo.expresion));
  }

  validarLlamadaFuncion(nodo, comoExpresion) {
    if (!FUNCIONES_CONOCIDAS.has(nodo.nombre)) {
      throw Errores.funcionNoExiste(nodo.nombre, nodo.linea);
    }
    if (!this.permitido(nodo.nombre)) {
      throw Errores.funcionNoPermitidaEnNivel(nodo.nombre, nodo.linea);
    }
    if (comoExpresion && !FUNCIONES_QUE_RETORNAN_VALOR.has(nodo.nombre)) {
      throw Errores.noRetornaValor(`${nodo.nombre}()`, nodo.linea);
    }
    const n = nodo.argumentos.length;
    if (nodo.nombre === "print" && n === 0) throw Errores.printNecesitaValor(nodo.linea);
    if (nodo.nombre === "input" && n > 1) throw Errores.argumentosFuncion("input", "como máximo un mensaje", nodo.linea);
    if (["int", "float", "str"].includes(nodo.nombre) && n !== 1) throw Errores.argumentosFuncion(nodo.nombre, "exactamente un valor", nodo.linea);
    nodo.argumentos.forEach((arg) => this.validarExpresion(arg));
  }

  validarLlamadaMetodo(nodo, comoExpresion) {
    const { objeto, metodos } = this.biblioteca;
    if (nodo.objeto !== objeto) {
      throw Errores.objetoNoExiste(nodo.objeto, objeto, nodo.linea);
    }
    const definicion = metodos[nodo.metodo];
    if (!definicion) {
      throw Errores.metodoNoExiste(nodo.metodo, nodo.linea, objeto);
    }
    if (!this.metodosPermitidos.has(nodo.metodo)) {
      throw Errores.metodoNoPermitidoEnNivel(`${objeto}.${nodo.metodo}`, nodo.linea);
    }
    if (comoExpresion && !definicion.retorna) {
      throw Errores.noRetornaValor(`${objeto}.${nodo.metodo}()`, nodo.linea);
    }

    if (definicion.numerico && nodo.argumentos.length > 0) {
      const arg = nodo.argumentos[0];
      if (arg.tipo === "Identificador" && !this.variables.has(arg.nombre)) {
        throw Errores.variableNoExiste(arg.nombre, arg.linea);
      }
      const info = this.tipoDe(arg);
      if (info.t === "texto" && info.input) throw Errores.inputDevuelveTexto(nodo.linea, `${objeto}.${nodo.metodo}(int(${formatearExpresion(arg)}))`);
      if (info.t === "texto" || info.t === "logico") throw Errores.accionNecesitaNumero(nodo.metodo, nodo.linea, objeto);
    }

    if (objeto === "robot1" && nodo.metodo === "girar" && nodo.argumentos.length > 0) {
      const arg = nodo.argumentos[0];
      if (arg.tipo === "Texto" && !esDireccionValida(arg.valor)) {
        throw Errores.direccionInvalida(arg.valor, nodo.linea);
      }
    }

    nodo.argumentos.forEach((arg) => this.validarExpresion(arg));
  }

  permiteComparar() {
    return this.permitido("if") || this.permitido("while") || this.permitido("booleanos");
  }

  validarExpresion(nodo) {
    switch (nodo.tipo) {
      case "Identificador":
        if (!this.variables.has(nodo.nombre)) {
          if (nodo.nombre === "true" || nodo.nombre === "false") {
            throw Errores.booleanoMinuscula(nodo.nombre, nodo.linea);
          }
          throw Errores.variableNoExiste(nodo.nombre, nodo.linea);
        }
        break;
      case "OperacionBinaria":
        this.validarExpresion(nodo.izquierda);
        this.validarExpresion(nodo.derecha);
        this.revisarOperacion(nodo);
        break;
      case "Comparacion":
        if (!this.permiteComparar()) throw Errores.palabraNoPermitidaEnNivel(nodo.operador, nodo.linea);
        this.validarExpresion(nodo.izquierda);
        this.validarExpresion(nodo.derecha);
        break;
      case "Logica":
        this.exigir(nodo.operador, nodo.operador, nodo.linea);
        this.validarExpresion(nodo.izquierda);
        this.validarExpresion(nodo.derecha);
        break;
      case "Negacion":
        this.exigir("not", "not", nodo.linea);
        this.validarExpresion(nodo.operando);
        break;
      case "Negativo":
        this.validarExpresion(nodo.operando);
        break;
      case "Booleano":
        if (!this.permiteComparar()) throw Errores.palabraNoPermitidaEnNivel(nodo.valor ? "True" : "False", nodo.linea);
        break;
      case "LlamadaFuncion":
        this.validarLlamadaFuncion(nodo, true);
        break;
      case "LlamadaMetodo":
        this.validarLlamadaMetodo(nodo, true);
        break;
      default:
        break;
    }
  }
}
