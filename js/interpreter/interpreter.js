// interpreter.js
// Ejecuta el AST validado paso a paso, esperando a que cada acción del
// robot termine (motor.avanzar, motor.girar, etc.) antes de continuar.
// Esto permite que robot1.posicion() / mirar() / energia() siempre lean
// el estado real y actualizado del robot (Documento 3, sección 4;
// prompt de cambios, sección 8).

import { Errores } from "./errors.js";

export class Interpreter {
  /**
   * @param {object} motor - ver js/game/ejecutor.js:crearMotor()
   */
  constructor(motor) {
    this.motor = motor;
    this.variables = new Map();
  }

  async ejecutar(programa) {
    for (const sentencia of programa.sentencias) {
      // eslint-disable-next-line no-await-in-loop
      await this.ejecutarSentencia(sentencia);
    }
  }

  async ejecutarSentencia(nodo) {
    switch (nodo.tipo) {
      case "Asignacion": {
        const valor = await this.evaluar(nodo.expresion);
        this.variables.set(nodo.variable, valor);
        await this.motor.asignacion(nodo.variable, valor);
        break;
      }
      case "LlamadaFuncion":
        await this.ejecutarLlamadaFuncion(nodo);
        break;
      case "LlamadaMetodo":
        await this.ejecutarLlamadaMetodo(nodo);
        break;
      default:
        break;
    }
  }

  async ejecutarLlamadaFuncion(nodo) {
    if (nodo.nombre === "print") {
      const valor = await this.evaluar(nodo.argumentos[0]);
      await this.motor.print(valor);
    } else if (nodo.nombre === "entrada") {
      await this.motor.entrada();
    }
  }

  async ejecutarLlamadaMetodo(nodo) {
    const args = [];
    for (const arg of nodo.argumentos) {
      // eslint-disable-next-line no-await-in-loop
      args.push(await this.evaluar(arg));
    }
    switch (nodo.metodo) {
      case "hablar":
        await this.motor.hablar(args[0]);
        break;
      case "avanzar":
        await this.motor.avanzar(args[0]);
        break;
      case "retroceder":
        await this.motor.retroceder(args[0]);
        break;
      case "girar":
        await this.motor.girar(args[0]);
        break;
      case "recoger":
        await this.motor.recoger();
        break;
      case "soltar":
        await this.motor.soltar();
        break;
      default:
        break;
    }
  }

  async evaluar(nodo) {
    switch (nodo.tipo) {
      case "Numero":
      case "Texto":
        return nodo.valor;
      case "Identificador":
        return this.variables.get(nodo.nombre);
      case "OperacionBinaria":
        return this.evaluarOperacion(nodo);
      case "LlamadaFuncion":
        if (nodo.nombre === "entrada") return this.motor.entrada();
        return undefined;
      case "LlamadaMetodo":
        if (nodo.metodo === "mirar") return this.motor.mirar();
        if (nodo.metodo === "posicion") return this.motor.posicion();
        if (nodo.metodo === "energia") return this.motor.energia();
        return undefined;
      default:
        return undefined;
    }
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
