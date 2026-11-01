// validator.js
// Verifica la semántica del AST: variables definidas, funciones/métodos que
// existen (según el mundo), que las instrucciones estén permitidas en la fase
// actual, y que solo se use como valor lo que realmente devuelve un valor.
//
// Avance 3 — permisos nuevos en instruccionesPermitidas de cada fase:
//   "if", "elif", "else", "while", "for", "and", "or", "not", "booleanos"
// Las comparaciones (==, !=, <, >, <=, >=) y True/False se aceptan cuando la fase
// permite if, while o booleanos. Una variable asignada dentro de un bloque cuenta
// como definida más abajo (como en Python); si esa rama no se ejecutó, el
// intérprete avisa en tiempo de ejecución.

import { Errores } from "./errors.js";
import { esDireccionValida } from "../game/movimiento.js";
import { BIBLIOTECA_ROBOT } from "./bibliotecas.js";

const FUNCIONES_CONOCIDAS = new Set(["print", "entrada"]);
const FUNCIONES_QUE_RETORNAN_VALOR = new Set(["entrada"]);

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
        this.validarSentencias(sentencia.bloque.sentencias);
        break;
      case "Para":
        this.exigir("for", "for", sentencia.linea);
        sentencia.argumentos.forEach((a) => this.validarExpresion(a));
        this.variables.add(sentencia.variable);
        this.validarSentencias(sentencia.bloque.sentencias);
        break;
      default:
        break;
    }
  }

  validarCondicional(nodo) {
    this.exigir(nodo.esElif ? "elif" : "if", nodo.esElif ? "elif" : "if", nodo.linea);
    this.validarExpresion(nodo.condicion);
    this.validarSentencias(nodo.bloqueSi.sentencias);
    if (nodo.bloqueSino) {
      const esCadenaElif = nodo.bloqueSino.sentencias.length === 1 && nodo.bloqueSino.sentencias[0].esElif === true;
      if (!esCadenaElif) this.exigir("else", "else", nodo.bloqueSino.linea);
      this.validarSentencias(nodo.bloqueSino.sentencias);
    }
  }

  validarAsignacion(nodo) {
    if (!this.permitido("asignacion")) {
      throw Errores.asignacionNoPermitidaEnNivel(nodo.linea);
    }
    this.validarExpresion(nodo.expresion);
    this.variables.add(nodo.variable);
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
    if (nodo.nombre === "print" && nodo.argumentos.length === 0) {
      throw Errores.printNecesitaValor(nodo.linea);
    }
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
      if (arg.tipo === "Texto") {
        throw Errores.accionNecesitaNumero(nodo.metodo, nodo.linea, objeto);
      }
      if (arg.tipo === "Identificador" && !this.variables.has(arg.nombre)) {
        throw Errores.variableNoExiste(arg.nombre, arg.linea);
      }
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
