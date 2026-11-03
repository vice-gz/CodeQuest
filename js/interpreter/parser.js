// parser.js
// Convierte la lista de tokens en un AST siguiendo la gramática del
// Avance 1 (Documento 3, secciones 2.1 a 2.4).

// Gramática (Avance 3; ya incluye bloques por sangría estilo Python):
//   programa      := sentencia*
//   sentencia     := asignacion | llamada | condicional | mientras | para | def | return
//   def           := "def" IDENT "(" (IDENT ("," IDENT)*)? ")" bloque        (solo al margen izquierdo)
//   return        := "return" expresion?                                      (solo dentro de un def)
//   bloque        := ":" NUEVA_LINEA INDENTACION sentencia+ DEDENTACION
//   condicional   := "if" expresion bloque ("elif" expresion bloque)* ("else" bloque)?
//   mientras      := "while" expresion bloque
//   para          := "for" IDENT "in" "range" "(" expresion ("," expresion){0,2} ")" bloque
//   expresion     := or ; or := and ("or" and)* ; and := not ("and" not)*
//   not           := "not" not | comparacion
//   comparacion   := aritmetica (("=="|"!="|"<"|">"|"<="|">=") aritmetica)?
//   aritmetica    := termino (("+"|"-") termino)* ; termino := unario (("*"|"/"|"%") unario)*
//   unario        := "-" unario | factor
//
// Nodos nuevos del AST: Bloque, Condicional {condicion, bloqueSi, bloqueSino, esElif},
// Mientras, Para, Comparacion, Logica, Negacion, Negativo, Booleano.
// (elif se guarda como un Condicional anidado dentro de bloqueSino, con esElif = true.)

import { TipoToken } from "./lexer.js";
import { Errores } from "./errors.js";

export class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.pos = 0;
    this.anidamiento = 0; // cuántos bloques abiertos hay (def solo va al margen izquierdo)
    this.dentroDeFuncion = 0; // return solo se acepta dentro de un def
  }

  actual() {
    return this.tokens[this.pos];
  }

  avanzar() {
    return this.tokens[this.pos++];
  }

  esperar(tipo) {
    if (this.actual().tipo !== tipo) return null;
    return this.avanzar();
  }

  parsear() {
    const sentencias = [];
    this.saltarNuevasLineas();
    while (this.actual().tipo !== TipoToken.EOF) {
      // Una línea con sangría que no está dentro de ningún bloque.
      if (this.actual().tipo === TipoToken.INDENTACION || this.actual().tipo === TipoToken.DEDENTACION) {
        throw Errores.sangriaInesperada(this.actual().linea);
      }
      sentencias.push(this.parsearSentencia());
      this.saltarNuevasLineas();
    }
    return { tipo: "Programa", sentencias };
  }

  // bloque := ":" NUEVA_LINEA INDENTACION sentencia+ DEDENTACION
  // `palabra` solo sirve para redactar el error ("if", "while", "else"...).
  parsearBloque(palabra, linea) {
    const dosPuntos = this.actual();
    if (dosPuntos.tipo === TipoToken.ASIGNACION && palabra !== "else") throw Errores.igualEnCondicion(linea);
    if (dosPuntos.tipo !== TipoToken.DOS_PUNTOS) throw Errores.faltaDosPuntos(palabra, linea);
    this.avanzar();

    if (this.actual().tipo !== TipoToken.NUEVA_LINEA && this.actual().tipo !== TipoToken.EOF) {
      throw Errores.faltaSangria(linea); // código en la misma línea: if x: print(1)
    }
    this.saltarNuevasLineas();
    if (this.actual().tipo !== TipoToken.INDENTACION) throw Errores.faltaSangria(linea);
    this.avanzar();

    const sentencias = [];
    this.anidamiento += 1;
    this.saltarNuevasLineas();
    while (this.actual().tipo !== TipoToken.DEDENTACION && this.actual().tipo !== TipoToken.EOF) {
      if (this.actual().tipo === TipoToken.INDENTACION) throw Errores.sangriaInesperada(this.actual().linea);
      sentencias.push(this.parsearSentencia());
      this.saltarNuevasLineas();
    }
    this.anidamiento -= 1;
    if (this.actual().tipo === TipoToken.DEDENTACION) this.avanzar();
    return { tipo: "Bloque", sentencias, linea };
  }

  parsearCondicional(esElif = false) {
    const clave = this.avanzar(); // IF o ELIF
    const palabra = esElif ? "elif" : "if";
    if (this.finDeSentencia()) throw Errores.esperabaValor(clave.linea);
    const condicion = this.parsearExpresion();
    const bloqueSi = this.parsearBloque(palabra, clave.linea);

    let bloqueSino = null;
    if (this.actual().tipo === TipoToken.ELIF) {
      const anidado = this.parsearCondicional(true);
      bloqueSino = { tipo: "Bloque", sentencias: [anidado], linea: anidado.linea };
    } else if (this.actual().tipo === TipoToken.ELSE) {
      const sino = this.avanzar();
      bloqueSino = this.parsearBloque("else", sino.linea);
    }
    return { tipo: "Condicional", condicion, bloqueSi, bloqueSino, esElif, linea: clave.linea };
  }

  parsearMientras() {
    const clave = this.avanzar(); // WHILE
    if (this.finDeSentencia()) throw Errores.esperabaValor(clave.linea);
    const condicion = this.parsearExpresion();
    const bloque = this.parsearBloque("while", clave.linea);
    return { tipo: "Mientras", condicion, bloque, linea: clave.linea };
  }

  // for i in range(n) | range(a, b) | range(a, b, paso)
  parsearPara() {
    const clave = this.avanzar(); // FOR
    const variable = this.esperar(TipoToken.IDENTIFICADOR);
    if (!variable) throw Errores.instruccionIncompleta(clave.linea);
    if (!this.esperar(TipoToken.IN)) throw Errores.forSoloRange(clave.linea);

    const rango = this.actual();
    const siguiente = this.tokens[this.pos + 1];
    if (rango.tipo !== TipoToken.IDENTIFICADOR || rango.valor !== "range" || siguiente?.tipo !== TipoToken.PAREN_IZQ) {
      throw Errores.forSoloRange(clave.linea);
    }
    this.avanzar(); // range
    this.avanzar(); // (
    const argumentos = this.parsearArgumentos();
    if (!this.esperar(TipoToken.PAREN_DER)) throw Errores.faltaParenCierre(clave.linea);
    if (argumentos.length < 1 || argumentos.length > 3) throw Errores.argumentosRange(clave.linea);

    const bloque = this.parsearBloque("for", clave.linea);
    return { tipo: "Para", variable: variable.valor, argumentos, bloque, linea: clave.linea };
  }

  // def nombre(param1, param2): bloque
  parsearDef() {
    const clave = this.avanzar(); // DEF
    if (this.anidamiento > 0) throw Errores.defSoloArriba(clave.linea);
    const nombre = this.esperar(TipoToken.IDENTIFICADOR);
    if (!nombre) throw Errores.defMalEscrito(clave.linea);
    if (!this.esperar(TipoToken.PAREN_IZQ)) throw Errores.faltaParenApertura(clave.linea);
    const parametros = [];
    if (this.actual().tipo !== TipoToken.PAREN_DER) {
      for (;;) {
        const p = this.esperar(TipoToken.IDENTIFICADOR);
        if (!p) throw Errores.parametrosInvalidos(clave.linea);
        if (parametros.includes(p.valor)) throw Errores.parametroRepetido(p.valor, clave.linea);
        parametros.push(p.valor);
        if (this.actual().tipo === TipoToken.COMA) {
          this.avanzar();
          continue;
        }
        if (this.actual().tipo !== TipoToken.PAREN_DER) throw Errores.parametrosInvalidos(clave.linea);
        break;
      }
    }
    if (!this.esperar(TipoToken.PAREN_DER)) throw Errores.faltaParenCierre(clave.linea);
    this.dentroDeFuncion += 1;
    const bloque = this.parsearBloque("def", clave.linea);
    this.dentroDeFuncion -= 1;
    return { tipo: "DefFuncion", nombre: nombre.valor, parametros, bloque, linea: clave.linea };
  }

  // return [expresion]
  parsearReturn() {
    const clave = this.avanzar(); // RETURN
    if (this.dentroDeFuncion === 0) throw Errores.returnFueraDeFuncion(clave.linea);
    const expresion = this.finDeSentencia() ? null : this.parsearExpresion();
    this.terminarSentencia(clave.linea);
    return { tipo: "Retorno", expresion, linea: clave.linea };
  }

  saltarNuevasLineas() {
    while (this.actual().tipo === TipoToken.NUEVA_LINEA) {
      this.avanzar();
    }
  }

  finDeSentencia() {
    const t = this.actual().tipo;
    return t === TipoToken.NUEVA_LINEA || t === TipoToken.EOF || t === TipoToken.DEDENTACION;
  }

  parsearSentencia() {
    const token = this.actual();

    switch (token.tipo) {
      case TipoToken.IF:
        return this.parsearCondicional(false);
      case TipoToken.WHILE:
        return this.parsearMientras();
      case TipoToken.FOR:
        return this.parsearPara();
      case TipoToken.DEF:
        return this.parsearDef();
      case TipoToken.RETURN:
        return this.parsearReturn();
      case TipoToken.ELIF:
        throw Errores.sinIfPrevio("elif", token.linea);
      case TipoToken.ELSE:
        throw Errores.sinIfPrevio("else", token.linea);
      default:
        break;
    }

    if (token.tipo !== TipoToken.IDENTIFICADOR) {
      throw Errores.instruccionIncompleta(token.linea);
    }

    const siguiente = this.tokens[this.pos + 1];

    // asignacion := IDENTIFICADOR "=" expresion
    if (siguiente && siguiente.tipo === TipoToken.ASIGNACION) {
      return this.parsearAsignacion();
    }

    // llamada_metodo := IDENTIFICADOR "." IDENTIFICADOR "(" argumentos? ")"
    if (siguiente && siguiente.tipo === TipoToken.PUNTO) {
      return this.parsearLlamadaMetodo();
    }

    // llamada_funcion := IDENTIFICADOR "(" argumentos? ")"
    if (siguiente && siguiente.tipo === TipoToken.PAREN_IZQ) {
      return this.parsearLlamadaFuncion();
    }

    // Nombre seguido de algo que no es =, . ni ( -> probablemente faltó el =
    if (!siguiente || this.finDeSentenciaToken(siguiente)) {
      throw Errores.instruccionIncompleta(token.linea);
    }

    throw Errores.esperabaIgual(token.linea);
  }

  finDeSentenciaToken(token) {
    return token.tipo === TipoToken.NUEVA_LINEA || token.tipo === TipoToken.EOF || token.tipo === TipoToken.DEDENTACION;
  }

  parsearAsignacion() {
    const nombre = this.avanzar(); // IDENTIFICADOR
    this.avanzar(); // =
    if (this.finDeSentencia()) {
      throw Errores.esperabaValor(nombre.linea);
    }
    const expresion = this.parsearExpresion();
    this.terminarSentencia(nombre.linea);
    return { tipo: "Asignacion", variable: nombre.valor, expresion, linea: nombre.linea };
  }

  parsearLlamadaMetodo() {
    const objeto = this.avanzar(); // IDENTIFICADOR (robot1)
    this.avanzar(); // .
    const metodoTok = this.esperar(TipoToken.IDENTIFICADOR);
    if (!metodoTok) throw Errores.instruccionIncompleta(objeto.linea);

    if (!this.esperar(TipoToken.PAREN_IZQ)) {
      throw Errores.faltaParenApertura(objeto.linea);
    }
    const argumentos = this.parsearArgumentos();
    if (!this.esperar(TipoToken.PAREN_DER)) {
      throw Errores.faltaParenCierre(objeto.linea);
    }
    this.terminarSentencia(objeto.linea);

    return {
      tipo: "LlamadaMetodo",
      objeto: objeto.valor,
      metodo: metodoTok.valor,
      argumentos,
      linea: objeto.linea,
    };
  }

  parsearLlamadaFuncion() {
    const nombre = this.avanzar(); // IDENTIFICADOR
    if (!this.esperar(TipoToken.PAREN_IZQ)) {
      throw Errores.faltaParenApertura(nombre.linea);
    }
    const argumentos = this.parsearArgumentos();
    if (!this.esperar(TipoToken.PAREN_DER)) {
      throw Errores.faltaParenCierre(nombre.linea);
    }
    this.terminarSentencia(nombre.linea);

    return {
      tipo: "LlamadaFuncion",
      nombre: nombre.valor,
      argumentos,
      linea: nombre.linea,
    };
  }

  parsearArgumentos() {
    const argumentos = [];
    if (this.actual().tipo === TipoToken.PAREN_DER) {
      return argumentos;
    }
    argumentos.push(this.parsearExpresion());
    while (this.actual().tipo === TipoToken.COMA) {
      this.avanzar();
      argumentos.push(this.parsearExpresion());
    }
    return argumentos;
  }

  // expresion := or
  parsearExpresion() {
    return this.parsearOr();
  }

  parsearOr() {
    let nodo = this.parsearAnd();
    while (this.actual().tipo === TipoToken.OR) {
      const op = this.avanzar();
      nodo = { tipo: "Logica", operador: "or", izquierda: nodo, derecha: this.parsearAnd(), linea: op.linea };
    }
    return nodo;
  }

  parsearAnd() {
    let nodo = this.parsearNot();
    while (this.actual().tipo === TipoToken.AND) {
      const op = this.avanzar();
      nodo = { tipo: "Logica", operador: "and", izquierda: nodo, derecha: this.parsearNot(), linea: op.linea };
    }
    return nodo;
  }

  parsearNot() {
    if (this.actual().tipo === TipoToken.NOT) {
      const op = this.avanzar();
      return { tipo: "Negacion", operando: this.parsearNot(), linea: op.linea };
    }
    return this.parsearComparacion();
  }

  // comparacion := aritmetica (opComp aritmetica)?   (no se encadenan)
  parsearComparacion() {
    const izquierda = this.parsearAritmetica();
    const esComparador = (t) =>
      t === TipoToken.IGUAL || t === TipoToken.DISTINTO || t === TipoToken.MENOR ||
      t === TipoToken.MAYOR || t === TipoToken.MENOR_IGUAL || t === TipoToken.MAYOR_IGUAL;
    if (!esComparador(this.actual().tipo)) return izquierda;

    const op = this.avanzar();
    if (this.finDeSentencia() || this.actual().tipo === TipoToken.DOS_PUNTOS) throw Errores.esperabaValor(op.linea);
    const derecha = this.parsearAritmetica();
    if (esComparador(this.actual().tipo)) throw Errores.comparacionEncadenada(op.linea);
    return { tipo: "Comparacion", operador: op.valor, izquierda, derecha, linea: op.linea };
  }

  // aritmetica := termino (("+" | "-") termino)*
  parsearAritmetica() {
    let nodo = this.parsearTermino();
    while (this.actual().tipo === TipoToken.SUMA || this.actual().tipo === TipoToken.RESTA) {
      const operadorTok = this.avanzar();
      const derecha = this.parsearTermino();
      nodo = { tipo: "OperacionBinaria", operador: operadorTok.valor, izquierda: nodo, derecha, linea: operadorTok.linea };
    }
    return nodo;
  }

  // termino := unario (("*" | "/" | "%") unario)*
  parsearTermino() {
    let nodo = this.parsearUnario();
    while (
      this.actual().tipo === TipoToken.MULT ||
      this.actual().tipo === TipoToken.DIV ||
      this.actual().tipo === TipoToken.DIV_ENTERA ||
      this.actual().tipo === TipoToken.MODULO
    ) {
      const operadorTok = this.avanzar();
      const derecha = this.parsearUnario();
      nodo = { tipo: "OperacionBinaria", operador: operadorTok.valor, izquierda: nodo, derecha, linea: operadorTok.linea };
    }
    return nodo;
  }

  parsearUnario() {
    if (this.actual().tipo === TipoToken.RESTA) {
      const op = this.avanzar();
      return { tipo: "Negativo", operando: this.parsearUnario(), linea: op.linea };
    }
    return this.parsearPotencia();
  }

  // potencia := factor ("**" unario)?   — como en Python: asociativa a la derecha y
  // más fuerte que el signo menos de la izquierda (-2 ** 2 es -4), pero el exponente sí puede llevar signo (2 ** -1).
  parsearPotencia() {
    const base = this.parsearFactor();
    if (this.actual().tipo !== TipoToken.POTENCIA) return base;
    const op = this.avanzar();
    if (this.finDeSentencia()) throw Errores.esperabaValor(op.linea);
    return { tipo: "OperacionBinaria", operador: "**", izquierda: base, derecha: this.parsearUnario(), linea: op.linea };
  }

  // factor := NUMERO | TEXTO | IDENTIFICADOR | "(" expresion ")"
  parsearFactor() {
    const token = this.actual();

    if (token.tipo === TipoToken.NUMERO) {
      this.avanzar();
      return { tipo: "Numero", valor: token.valor, decimal: token.decimal === true, linea: token.linea };
    }

    if (token.tipo === TipoToken.TEXTO) {
      this.avanzar();
      return { tipo: "Texto", valor: token.valor, linea: token.linea };
    }

    if (token.tipo === TipoToken.NONE) {
      this.avanzar();
      return { tipo: "Ninguno", linea: token.linea };
    }

    if (token.tipo === TipoToken.TRUE || token.tipo === TipoToken.FALSE) {
      this.avanzar();
      return { tipo: "Booleano", valor: token.tipo === TipoToken.TRUE, linea: token.linea };
    }

    if (token.tipo === TipoToken.IDENTIFICADOR) {
      const siguiente = this.tokens[this.pos + 1];

      // llamada_funcion usada como expresión, ej: valor = entrada()
      if (siguiente && siguiente.tipo === TipoToken.PAREN_IZQ) {
        return this.parsearLlamadaFuncionComoExpresion();
      }

      // llamada_metodo usada como expresión, ej: direccion = robot1.mirar()
      if (siguiente && siguiente.tipo === TipoToken.PUNTO) {
        return this.parsearLlamadaMetodoComoExpresion();
      }

      this.avanzar();
      return { tipo: "Identificador", nombre: token.valor, linea: token.linea };
    }

    if (token.tipo === TipoToken.PAREN_IZQ) {
      this.avanzar();
      const expresion = this.parsearExpresion();
      if (!this.esperar(TipoToken.PAREN_DER)) {
        throw Errores.faltaParenCierre(token.linea);
      }
      return expresion;
    }

    throw Errores.esperabaValor(token.linea);
  }

  // Igual que parsearLlamadaFuncion, pero sin exigir fin de sentencia:
  // se usa cuando la llamada aparece dentro de una expresión.
  parsearLlamadaFuncionComoExpresion() {
    const nombre = this.avanzar(); // IDENTIFICADOR
    this.avanzar(); // (
    const argumentos = this.parsearArgumentos();
    if (!this.esperar(TipoToken.PAREN_DER)) {
      throw Errores.faltaParenCierre(nombre.linea);
    }
    return { tipo: "LlamadaFuncion", nombre: nombre.valor, argumentos, linea: nombre.linea };
  }

  parsearLlamadaMetodoComoExpresion() {
    const objeto = this.avanzar(); // IDENTIFICADOR
    this.avanzar(); // .
    const metodoTok = this.esperar(TipoToken.IDENTIFICADOR);
    if (!metodoTok) throw Errores.instruccionIncompleta(objeto.linea);
    if (!this.esperar(TipoToken.PAREN_IZQ)) {
      throw Errores.faltaParenApertura(objeto.linea);
    }
    const argumentos = this.parsearArgumentos();
    if (!this.esperar(TipoToken.PAREN_DER)) {
      throw Errores.faltaParenCierre(objeto.linea);
    }
    return {
      tipo: "LlamadaMetodo",
      objeto: objeto.valor,
      metodo: metodoTok.valor,
      argumentos,
      linea: objeto.linea,
    };
  }

  terminarSentencia(linea) {
    if (!this.finDeSentencia()) {
      // «precio = 2,5»: un número, una coma y otro número seguidos → casi seguro quería un decimal
      const [anterior, actual, siguiente] = [this.tokens[this.pos - 1], this.actual(), this.tokens[this.pos + 1]];
      if (actual.tipo === TipoToken.COMA && anterior?.tipo === TipoToken.NUMERO && siguiente?.tipo === TipoToken.NUMERO) {
        throw Errores.decimalConComa(linea);
      }
      throw Errores.instruccionIncompleta(linea);
    }
  }
}
