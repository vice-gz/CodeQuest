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
import { formatearExpresion, variablesUsadas, variablesAsignadas } from "./ast.js";
import { Flotante, esEntero, esFlotante, esLogico, formatear, aJS, nombreDeTipo } from "./valores.js";
import { OPERACIONES, negar, iguales, ordenar, convertirAEntero, convertirADecimal, redondear } from "./aritmetica.js";

export const MAX_INSTRUCCIONES = 1000;
export const MAX_PROFUNDIDAD = 100; // llamadas de función anidadas (RecursionError)

/** return lanza esta señal; llamarFuncionUsuario() la recoge y devuelve el valor. No es un error. */
class RetornoSenal {
  constructor(valor) {
    this.valor = valor;
  }
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
    // Un número con decimales que trae el escenario (precio: 24.5) es un float de Python, no un int.
    this.variables = new Map(Object.entries(variablesIniciales).map(([n, v]) => [n, typeof v === "number" && !Number.isInteger(v) ? new Flotante(v) : v]));
    this.maxInstrucciones = maxInstrucciones;
    this.iteraciones = 0;
    // Funciones del estudiante (def): se guardan al ejecutar el def; cada llamada crea un marco con sus variables locales.
    this.funciones = new Map(); // nombre -> nodo DefFuncion
    this.pila = []; // marcos de llamada: { nombre, locales: Map }
    this.registroLlamadas = []; // { nombre, args, retorno } de cada llamada (para las validaciones)
  }

  /** Donde se guardan las variables ahora mismo: las locales de la función en curso o las globales. */
  get ambito() {
    return this.pila.length ? this.pila[this.pila.length - 1].locales : this.variables;
  }

  /** Lee una variable: primero las locales de la función en curso, luego las globales. */
  leerVariable(nombre, linea) {
    const marco = this.pila[this.pila.length - 1];
    if (marco?.locales.has(nombre)) return marco.locales.get(nombre);
    if (marco?.declaradas.has(nombre)) throw Errores.variableLocalSinValor(nombre, marco.nombre, linea);
    if (this.variables.has(nombre)) return this.variables.get(nombre);
    if (this.funciones.has(nombre)) throw Errores.funcionSinParentesis(nombre, linea);
    throw Errores.variableNoExiste(nombre, linea);
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
        this.ambito.set(nodo.variable, valor);
        const fuentes = [...variablesUsadas(nodo.expresion)];
        if (this.pila.length) await this.motor.asignacionLocal?.(nodo.variable, valor, { fuentes, funcion: this.pila[this.pila.length - 1].nombre });
        else await this.motor.asignacion(nodo.variable, valor, { fuentes });
        break;
      }
      case "DefFuncion":
        this.funciones.set(nodo.nombre, nodo);
        await this.motor.funcionDefinida?.(nodo.nombre, nodo.parametros);
        break;
      case "Retorno":
        throw new RetornoSenal(nodo.expresion ? await this.evaluar(nodo.expresion) : null);
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
    if (!valores.every(esEntero)) throw Errores.rangoInvalido(nodo.linea); // un float (aunque sea 3.0) no sirve en range()
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
      this.ambito.set(nodo.variable, i);
      // eslint-disable-next-line no-await-in-loop
      if (this.pila.length) await this.motor.asignacionLocal?.(nodo.variable, i, { fuentes: [], esContador: true, funcion: this.pila[this.pila.length - 1].nombre });
      // eslint-disable-next-line no-await-in-loop
      else await this.motor.asignacion(nodo.variable, i, { fuentes: [], esContador: true });
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

  /** Llama a una función definida con def: argumentos, marco local, return y avisos al escenario. */
  async llamarFuncionUsuario(nodo) {
    const def = this.funciones.get(nodo.nombre);
    const args = [];
    for (const a of nodo.argumentos) {
      // eslint-disable-next-line no-await-in-loop
      args.push(await this.evaluar(a));
    }
    if (args.length !== def.parametros.length) throw Errores.argumentosDeFuncion(nodo.nombre, def.parametros.length, args.length, nodo.linea);
    if (this.pila.length >= MAX_PROFUNDIDAD) throw Errores.recursionExcesiva(nodo.linea);

    if (!def.declaradas) def.declaradas = variablesAsignadas(def.bloque.sentencias);
    this.pila.push({ nombre: nodo.nombre, locales: new Map(def.parametros.map((p, i) => [p, args[i]])), declaradas: def.declaradas });
    const registro = { nombre: nodo.nombre, args: args.map(aJS), retorno: null };
    this.registroLlamadas.push(registro);
    await this.motor.llamadaIniciada?.(nodo.nombre, args, { profundidad: this.pila.length, parametros: def.parametros });
    let retorno = null;
    try {
      await this.ejecutarSentencias(def.bloque.sentencias);
    } catch (e) {
      if (!(e instanceof RetornoSenal)) throw e;
      retorno = e.valor;
    } finally {
      this.pila.pop();
    }
    registro.retorno = aJS(retorno);
    await this.motor.llamadaTerminada?.(nodo.nombre, retorno, { profundidad: this.pila.length });
    return retorno;
  }

  async ejecutarLlamadaFuncion(nodo) {
    if (this.funciones.has(nodo.nombre)) {
      await this.llamarFuncionUsuario(nodo); // como instrucción, el valor que devuelva se descarta
      return;
    }
    if (nodo.nombre === "print") {
      const valor = await this.evaluar(nodo.argumentos[0]);
      const fuentes = [...variablesUsadas(nodo.argumentos[0])];
      // Se muestra como lo haría Python: True/False, 4.25, 5.0 ...
      await this.motor.print(esFlotante(valor) || esLogico(valor) || valor === null ? formatear(valor) : valor, { fuentes });
    } else {
      // input(), int(), float(), str(), round() como instrucción suelta: se ejecutan y el resultado se descarta.
      await this.evaluarFuncion(nodo);
    }
  }

  /** Funciones integradas que devuelven un valor: input, int, float, str, round. */
  async evaluarFuncion(nodo) {
    if (this.funciones.has(nodo.nombre)) return this.llamarFuncionUsuario(nodo);
    const args = [];
    for (const a of nodo.argumentos) {
      // eslint-disable-next-line no-await-in-loop
      args.push(await this.evaluar(a));
    }
    switch (nodo.nombre) {
      case "input":
        // input() SIEMPRE devuelve texto, como en Python. El mensaje opcional se le muestra a la persona.
        return String(await this.motor.entrada(args.length ? formatear(args[0]) : undefined));
      case "int":
        return convertirAEntero(args[0], nodo.linea);
      case "float":
        return convertirADecimal(args[0], nodo.linea);
      case "str":
        return formatear(args[0]);
      case "round":
        return redondear(args[0], args[1], nodo.linea);
      default:
        throw Errores.funcionNoDefinida(nodo.nombre, nodo.linea);
    }
  }

  async llamarMetodo(nodo) {
    const args = [];
    for (const arg of nodo.argumentos) {
      // eslint-disable-next-line no-await-in-loop
      args.push(aJS(await this.evaluar(arg))); // los motores del mundo trabajan con números planos
    }
    return this.motor.metodo(nodo.objeto, nodo.metodo, args);
  }

  async evaluar(nodo) {
    switch (nodo.tipo) {
      case "Numero":
        return nodo.decimal ? new Flotante(nodo.valor) : nodo.valor;
      case "Texto":
      case "Booleano":
        return nodo.valor;
      case "Identificador":
        return this.leerVariable(nodo.nombre, nodo.linea);
      case "Ninguno":
        return null;
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
      case "Negativo":
        return negar(await this.evaluar(nodo.operando), nodo.linea);
      case "LlamadaFuncion":
        return this.evaluarFuncion(nodo);
      case "LlamadaMetodo":
        return this.llamarMetodo(nodo);
      default:
        return undefined;
    }
  }

  async evaluarComparacion(nodo) {
    const izquierda = await this.evaluar(nodo.izquierda);
    const derecha = await this.evaluar(nodo.derecha);
    if (nodo.operador === "==") return iguales(izquierda, derecha);
    if (nodo.operador === "!=") return !iguales(izquierda, derecha);
    return ordenar(nodo.operador, izquierda, derecha, nodo.linea); // < > <= >=
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
    // Misma semántica que Python (ver aritmetica.js): / siempre da decimal, // es división entera, etc.
    return OPERACIONES[nodo.operador](izquierda, derecha, nodo.linea);
  }
}
