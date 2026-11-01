// interpreter.js
// Ejecuta el AST validado paso a paso, esperando a que cada acción del
// mundo (mover a Robot1, subir el elevador, voltear una carta...) termine
// antes de continuar. Así robot1.posicion() / elevador.piso() / etc. siempre
// leen el estado real y actualizado.
//
// Avance 3: bloques, condicionales (if / elif / else), ciclos (while / for con
// range), comparaciones y operadores lógicos (and, or, not).
//
// LÍMITE DE SEGURIDAD: cada vuelta de un while o de un for suma 1 a un
// contador global. Si pasa de maxInstrucciones (1000) se lanza RUN_005
// ("Ciclo infinito detectado") y la ejecución se detiene, para que un
// `while True:` nunca congele el navegador.
//
// Contrato con el "motor" del mundo (ver js/game/escenarios/):
//   motor.print(valor, {fuentes})            motor.entrada()
//   motor.asignacion(nombre, valor, {fuentes})
//   motor.metodo(objeto, metodo, args)       -> objetos del mundo (robot1, elevador)
//   motor.condicion?(texto, resultado, {tipo, linea})   -> la UI muestra True/False
//   motor.iteracion?(n, {tipo, variable})               -> la UI muestra "Repetición n"

import { Errores } from "./errors.js";
import { formatearExpresion, variablesUsadas } from "./ast.js";

export const MAX_INSTRUCCIONES = 1000;

function nombreDeTipo(valor) {
  if (typeof valor === "number") return "un número";
  if (typeof valor === "string") return "un texto";
  if (typeof valor === "boolean") return "un valor lógico (True/False)";
  return "un valor";
}

export class Interpreter {
  /**
   * @param {object} motor
   * @param {object} [opciones]
   * @param {object} [opciones.variablesIniciales] variables ya definidas por el escenario
   * @param {number} [opciones.maxInstrucciones]
   */
  constructor(motor, { variablesIniciales = {}, maxInstrucciones = MAX_INSTRUCCIONES } = {}) {
    this.motor = motor;
    this.variables = new Map(Object.entries(variablesIniciales));
    this.maxInstrucciones = maxInstrucciones;
    this.iteraciones = 0;
  }

  async ejecutar(programa) {
    await this.ejecutarSentencias(programa.sentencias);
  }

  async ejecutarSentencias(sentencias) {
    for (const sentencia of sentencias) {
      // eslint-disable-next-line no-await-in-loop
      await this.ejecutarSentencia(sentencia);
    }
  }

  contarIteracion(linea) {
    this.iteraciones += 1;
    if (this.iteraciones > this.maxInstrucciones) throw Errores.cicloInfinito(linea);
  }

  async ejecutarSentencia(nodo) {
    switch (nodo.tipo) {
      case "Asignacion": {
        const valor = await this.evaluar(nodo.expresion);
        this.variables.set(nodo.variable, valor);
        await this.motor.asignacion(nodo.variable, valor, { fuentes: [...variablesUsadas(nodo.expresion)] });
        break;
      }
      case "LlamadaFuncion":
        await this.ejecutarLlamadaFuncion(nodo);
        break;
      case "LlamadaMetodo":
        await this.llamarMetodo(nodo);
        break;
      case "Condicional": {
        const cumple = await this.evaluarCondicion(nodo.condicion, nodo.esElif ? "elif" : "if", nodo.linea);
        if (cumple) await this.ejecutarSentencias(nodo.bloqueSi.sentencias);
        else if (nodo.bloqueSino) await this.ejecutarSentencias(nodo.bloqueSino.sentencias);
        break;
      }
      case "Mientras": {
        let vuelta = 0;
        // eslint-disable-next-line no-await-in-loop
        while (await this.evaluarCondicion(nodo.condicion, "while", nodo.linea)) {
          this.contarIteracion(nodo.linea);
          vuelta += 1;
          // eslint-disable-next-line no-await-in-loop
          await this.motor.iteracion?.(vuelta, { tipo: "while" });
          // eslint-disable-next-line no-await-in-loop
          await this.ejecutarSentencias(nodo.bloque.sentencias);
        }
        break;
      }
      case "Para":
        await this.ejecutarPara(nodo);
        break;
      default:
        break;
    }
  }

  async ejecutarPara(nodo) {
    const valores = [];
    for (const arg of nodo.argumentos) {
      // eslint-disable-next-line no-await-in-loop
      valores.push(await this.evaluar(arg));
    }
    if (!valores.every((v) => Number.isInteger(v))) throw Errores.rangoInvalido(nodo.linea);
    let inicio = 0;
    let fin;
    let paso = 1;
    if (valores.length === 1) [fin] = valores;
    else [inicio, fin, paso = 1] = valores;
    if (paso === 0) throw Errores.rangoInvalido(nodo.linea);

    let vuelta = 0;
    for (let i = inicio; paso > 0 ? i < fin : i > fin; i += paso) {
      this.contarIteracion(nodo.linea);
      vuelta += 1;
      this.variables.set(nodo.variable, i);
      // eslint-disable-next-line no-await-in-loop
      await this.motor.asignacion(nodo.variable, i, { fuentes: [], esContador: true });
      // eslint-disable-next-line no-await-in-loop
      await this.motor.iteracion?.(vuelta, { tipo: "for", variable: nodo.variable });
      // eslint-disable-next-line no-await-in-loop
      await this.ejecutarSentencias(nodo.bloque.sentencias);
    }
  }

  async evaluarCondicion(nodoCondicion, tipo, linea) {
    const valor = await this.evaluar(nodoCondicion);
    const texto = formatearExpresion(nodoCondicion);
    if (typeof valor !== "boolean") throw Errores.condicionNoBooleana(texto, linea);
    await this.motor.condicion?.(texto, valor, { tipo, linea });
    return valor;
  }

  async ejecutarLlamadaFuncion(nodo) {
    if (nodo.nombre === "print") {
      const valor = await this.evaluar(nodo.argumentos[0]);
      const fuentes = [...variablesUsadas(nodo.argumentos[0])];
      // Los valores lógicos se muestran como en Python: True / False.
      await this.motor.print(typeof valor === "boolean" ? (valor ? "True" : "False") : valor, { fuentes });
    } else if (nodo.nombre === "entrada") {
      await this.motor.entrada();
    }
  }

  async llamarMetodo(nodo) {
    const args = [];
    for (const arg of nodo.argumentos) {
      // eslint-disable-next-line no-await-in-loop
      args.push(await this.evaluar(arg));
    }
    return this.motor.metodo(nodo.objeto, nodo.metodo, args);
  }

  async evaluar(nodo) {
    switch (nodo.tipo) {
      case "Numero":
      case "Texto":
      case "Booleano":
        return nodo.valor;
      case "Identificador":
        if (!this.variables.has(nodo.nombre)) throw Errores.variableNoExiste(nodo.nombre, nodo.linea);
        return this.variables.get(nodo.nombre);
      case "OperacionBinaria":
        return this.evaluarOperacion(nodo);
      case "Comparacion":
        return this.evaluarComparacion(nodo);
      case "Logica":
        return this.evaluarLogica(nodo);
      case "Negacion": {
        const v = await this.evaluar(nodo.operando);
        if (typeof v !== "boolean") throw Errores.operandoLogicoNoBooleano("not", nodo.linea);
        return !v;
      }
      case "Negativo": {
        const v = await this.evaluar(nodo.operando);
        if (typeof v !== "number") throw Errores.accionNecesitaNumero("-", nodo.linea);
        return -v;
      }
      case "LlamadaFuncion":
        if (nodo.nombre === "entrada") return this.motor.entrada();
        return undefined;
      case "LlamadaMetodo":
        return this.llamarMetodo(nodo);
      default:
        return undefined;
    }
  }

  async evaluarComparacion(nodo) {
    const izquierda = await this.evaluar(nodo.izquierda);
    const derecha = await this.evaluar(nodo.derecha);
    switch (nodo.operador) {
      case "==":
        return izquierda === derecha;
      case "!=":
        return izquierda !== derecha;
      default: {
        // <, >, <=, >=: solo entre dos números o dos textos.
        const mismoTipo = typeof izquierda === typeof derecha && ["number", "string"].includes(typeof izquierda);
        if (!mismoTipo) {
          throw Errores.comparacionInvalida(nodo.operador, nombreDeTipo(izquierda), nombreDeTipo(derecha), nodo.linea);
        }
        if (nodo.operador === "<") return izquierda < derecha;
        if (nodo.operador === ">") return izquierda > derecha;
        if (nodo.operador === "<=") return izquierda <= derecha;
        return izquierda >= derecha;
      }
    }
  }

  async evaluarLogica(nodo) {
    const izquierda = await this.evaluar(nodo.izquierda);
    if (typeof izquierda !== "boolean") throw Errores.operandoLogicoNoBooleano(nodo.operador, nodo.linea);
    // Cortocircuito: si el resultado ya se conoce, no se evalúa el otro lado.
    if (nodo.operador === "and" && !izquierda) return false;
    if (nodo.operador === "or" && izquierda) return true;
    const derecha = await this.evaluar(nodo.derecha);
    if (typeof derecha !== "boolean") throw Errores.operandoLogicoNoBooleano(nodo.operador, nodo.linea);
    return derecha;
  }

  async evaluarOperacion(nodo) {
    const izquierda = await this.evaluar(nodo.izquierda);
    const derecha = await this.evaluar(nodo.derecha);
    switch (nodo.operador) {
      case "+":
        return izquierda + derecha;
      case "-":
        return izquierda - derecha;
      case "*":
        return izquierda * derecha;
      case "/":
        if (derecha === 0) {
          throw Errores.divisionEntreCero(nodo.linea);
        }
        // División entera si ambos operandos son enteros; decimal si no.
        return Number.isInteger(izquierda) && Number.isInteger(derecha)
          ? Math.trunc(izquierda / derecha)
          : izquierda / derecha;
      case "%":
        if (derecha === 0) {
          throw Errores.divisionEntreCero(nodo.linea);
        }
        return izquierda % derecha;
      default:
        return undefined;
    }
  }
}
