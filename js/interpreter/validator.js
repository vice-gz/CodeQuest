// validator.js
// Verifica la semántica del AST: variables definidas, funciones/métodos
// que existen, que las instrucciones estén permitidas en la fase actual,
// y que solo se use como valor lo que realmente devuelve un valor.

import { Errores } from "./errors.js";
import { esDireccionValida } from "../game/movimiento.js";

// Biblioteca de instrucciones conocidas por CQL (rediseño del robot).
const FUNCIONES_CONOCIDAS = new Set(["print", "entrada"]);
const METODOS_CONOCIDOS = new Set([
  "hablar",
  "avanzar",
  "retroceder",
  "girar",
  "mirar",
  "posicion",
  "energia",
  "recoger",
  "soltar",
]);
const METODOS_NUMERICOS = new Set(["avanzar", "retroceder"]);
const METODOS_QUE_RETORNAN_VALOR = new Set(["mirar", "posicion", "energia"]);
const FUNCIONES_QUE_RETORNAN_VALOR = new Set(["entrada"]);

export class Validator {
  /**
   * @param {object} fase - configuración de la fase actual
   *   (instruccionesPermitidas, metodosPermitidos)
   */
  constructor(fase) {
    this.fase = fase;
    this.instruccionesPermitidas = new Set(fase?.instruccionesPermitidas || []);
    this.metodosPermitidos = new Set(fase?.metodosPermitidos || []);
    this.variables = new Set();
  }

  validar(programa) {
    for (const sentencia of programa.sentencias) {
      this.validarSentencia(sentencia);
    }
    return true;
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
      default:
        break;
    }
  }

  validarAsignacion(nodo) {
    if (!this.instruccionesPermitidas.has("asignacion")) {
      throw Errores.asignacionNoPermitidaEnNivel(nodo.linea);
    }
    this.validarExpresion(nodo.expresion);
    this.variables.add(nodo.variable);
  }

  validarLlamadaFuncion(nodo, comoExpresion) {
    if (!FUNCIONES_CONOCIDAS.has(nodo.nombre)) {
      throw Errores.funcionNoExiste(nodo.nombre, nodo.linea);
    }
    if (!this.instruccionesPermitidas.has(nodo.nombre)) {
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
    if (!METODOS_CONOCIDOS.has(nodo.metodo)) {
      throw Errores.metodoNoExiste(nodo.metodo, nodo.linea);
    }
    if (!this.metodosPermitidos.has(nodo.metodo)) {
      throw Errores.metodoNoPermitidoEnNivel(`robot1.${nodo.metodo}`, nodo.linea);
    }
    if (comoExpresion && !METODOS_QUE_RETORNAN_VALOR.has(nodo.metodo)) {
      throw Errores.noRetornaValor(`robot1.${nodo.metodo}()`, nodo.linea);
    }

    if (METODOS_NUMERICOS.has(nodo.metodo) && nodo.argumentos.length > 0) {
      const arg = nodo.argumentos[0];
      if (arg.tipo === "Texto") {
        throw Errores.accionNecesitaNumero(nodo.metodo, nodo.linea);
      }
      if (arg.tipo === "Identificador" && !this.variables.has(arg.nombre)) {
        throw Errores.variableNoExiste(arg.nombre, arg.linea);
      }
    }

    if (nodo.metodo === "girar" && nodo.argumentos.length > 0) {
      const arg = nodo.argumentos[0];
      if (arg.tipo === "Texto" && !esDireccionValida(arg.valor)) {
        throw Errores.direccionInvalida(arg.valor, nodo.linea);
      }
    }

    nodo.argumentos.forEach((arg) => this.validarExpresion(arg));
  }

  validarExpresion(nodo) {
    switch (nodo.tipo) {
      case "Identificador":
        if (!this.variables.has(nodo.nombre)) {
          throw Errores.variableNoExiste(nodo.nombre, nodo.linea);
        }
        break;
      case "OperacionBinaria":
        this.validarExpresion(nodo.izquierda);
        this.validarExpresion(nodo.derecha);
        break;
      case "LlamadaFuncion":
        this.validarLlamadaFuncion(nodo, true);
        break;
      case "LlamadaMetodo":
        this.validarLlamadaMetodo(nodo, true);
        break;
      case "Numero":
      case "Texto":
        break;
      default:
        break;
    }
  }
}
