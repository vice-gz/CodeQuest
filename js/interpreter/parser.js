// parser.js
// Convierte la lista de tokens en un AST siguiendo la gramática del
// Avance 1 (Documento 3, secciones 2.1 a 2.4).

import { TipoToken } from "./lexer.js";
import { Errores } from "./errors.js";

export class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.pos = 0;
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
      sentencias.push(this.parsearSentencia());
      this.saltarNuevasLineas();
    }
    return { tipo: "Programa", sentencias };
  }

  saltarNuevasLineas() {
    while (this.actual().tipo === TipoToken.NUEVA_LINEA) {
      this.avanzar();
    }
  }

  finDeSentencia() {
    const t = this.actual().tipo;
    return t === TipoToken.NUEVA_LINEA || t === TipoToken.EOF;
  }

  parsearSentencia() {
    const token = this.actual();

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
    return token.tipo === TipoToken.NUEVA_LINEA || token.tipo === TipoToken.EOF;
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

  // expresion := termino (("+" | "-") termino)*
  parsearExpresion() {
    let nodo = this.parsearTermino();
    while (
      this.actual().tipo === TipoToken.SUMA ||
      this.actual().tipo === TipoToken.RESTA
    ) {
      const operadorTok = this.avanzar();
      const derecha = this.parsearTermino();
      nodo = {
        tipo: "OperacionBinaria",
        operador: operadorTok.valor,
        izquierda: nodo,
        derecha,
        linea: operadorTok.linea,
      };
    }
    return nodo;
  }

  // termino := factor (("*" | "/" | "%") factor)*
  parsearTermino() {
    let nodo = this.parsearFactor();
    while (
      this.actual().tipo === TipoToken.MULT ||
      this.actual().tipo === TipoToken.DIV ||
      this.actual().tipo === TipoToken.MODULO
    ) {
      const operadorTok = this.avanzar();
      const derecha = this.parsearFactor();
      nodo = {
        tipo: "OperacionBinaria",
        operador: operadorTok.valor,
        izquierda: nodo,
        derecha,
        linea: operadorTok.linea,
      };
    }
    return nodo;
  }

  // factor := NUMERO | TEXTO | IDENTIFICADOR | "(" expresion ")"
  parsearFactor() {
    const token = this.actual();

    if (token.tipo === TipoToken.NUMERO) {
      this.avanzar();
      return { tipo: "Numero", valor: token.valor, linea: token.linea };
    }

    if (token.tipo === TipoToken.TEXTO) {
      this.avanzar();
      return { tipo: "Texto", valor: token.valor, linea: token.linea };
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
      throw Errores.instruccionIncompleta(linea);
    }
  }
}
