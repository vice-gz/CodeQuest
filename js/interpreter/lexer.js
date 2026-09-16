// lexer.js
// Convierte el texto que escribe el estudiante en una lista de tokens.

import { Errores } from "./errors.js";

export const TipoToken = {
  IDENTIFICADOR: "IDENTIFICADOR",
  NUMERO: "NUMERO",
  TEXTO: "TEXTO",
  ASIGNACION: "ASIGNACION",
  PUNTO: "PUNTO",
  PAREN_IZQ: "PAREN_IZQ",
  PAREN_DER: "PAREN_DER",
  COMA: "COMA",
  SUMA: "SUMA",
  RESTA: "RESTA",
  MULT: "MULT",
  DIV: "DIV",
  MODULO: "MODULO",
  NUEVA_LINEA: "NUEVA_LINEA",
  EOF: "EOF",
};

function esDigito(c) {
  return c >= "0" && c <= "9";
}

function esLetra(c) {
  return /[a-zA-Z_]/.test(c);
}

function esAlfanumerico(c) {
  return esLetra(c) || esDigito(c);
}

export class Lexer {
  constructor(codigo) {
    this.codigo = codigo;
    this.pos = 0;
    this.linea = 1;
    this.tokens = [];
  }

  tokenizar() {
    while (this.pos < this.codigo.length) {
      const c = this.codigo[this.pos];

      if (c === "\n") {
        this.push(TipoToken.NUEVA_LINEA, "\n");
        this.pos++;
        this.linea++;
        continue;
      }

      if (c === " " || c === "\t" || c === "\r") {
        this.pos++;
        continue;
      }

      if (c === "#") {
        while (this.pos < this.codigo.length && this.codigo[this.pos] !== "\n") {
          this.pos++;
        }
        continue;
      }

      if (c === '"' || c === "'") {
        this.leerTexto(c);
        continue;
      }

      if (esDigito(c)) {
        this.leerNumero();
        continue;
      }

      if (esLetra(c)) {
        this.leerIdentificador();
        continue;
      }

      switch (c) {
        case "=":
          this.push(TipoToken.ASIGNACION, "=");
          this.pos++;
          break;
        case ".":
          this.push(TipoToken.PUNTO, ".");
          this.pos++;
          break;
        case "(":
          this.push(TipoToken.PAREN_IZQ, "(");
          this.pos++;
          break;
        case ")":
          this.push(TipoToken.PAREN_DER, ")");
          this.pos++;
          break;
        case ",":
          this.push(TipoToken.COMA, ",");
          this.pos++;
          break;
        case "+":
          this.push(TipoToken.SUMA, "+");
          this.pos++;
          break;
        case "-":
          this.push(TipoToken.RESTA, "-");
          this.pos++;
          break;
        case "*":
          this.push(TipoToken.MULT, "*");
          this.pos++;
          break;
        case "/":
          this.push(TipoToken.DIV, "/");
          this.pos++;
          break;
        case "%":
          this.push(TipoToken.MODULO, "%");
          this.pos++;
          break;
        default:
          throw Errores.caracterNoReconocido(c, this.linea);
      }
    }

    this.push(TipoToken.EOF, null);
    return this.tokens;
  }

  leerTexto(comilla) {
    const lineaInicio = this.linea;
    this.pos++; // saltar comilla de apertura
    let valor = "";
    while (this.pos < this.codigo.length && this.codigo[this.pos] !== comilla) {
      if (this.codigo[this.pos] === "\n") {
        throw Errores.textoSinCerrar(lineaInicio);
      }
      valor += this.codigo[this.pos];
      this.pos++;
    }
    if (this.pos >= this.codigo.length) {
      throw Errores.textoSinCerrar(lineaInicio);
    }
    this.pos++; // saltar comilla de cierre
    this.push(TipoToken.TEXTO, valor, lineaInicio);
  }

  leerNumero() {
    let valor = "";
    while (this.pos < this.codigo.length && esDigito(this.codigo[this.pos])) {
      valor += this.codigo[this.pos];
      this.pos++;
    }
    // Decimales: el Mundo 2 (Nivel 11) enseña tipos de dato, así que el
    // lexer acepta un punto decimal seguido de al menos un dígito.
    if (
      this.codigo[this.pos] === "." &&
      esDigito(this.codigo[this.pos + 1])
    ) {
      valor += ".";
      this.pos++;
      while (this.pos < this.codigo.length && esDigito(this.codigo[this.pos])) {
        valor += this.codigo[this.pos];
        this.pos++;
      }
      this.push(TipoToken.NUMERO, parseFloat(valor));
      return;
    }
    this.push(TipoToken.NUMERO, parseInt(valor, 10));
  }

  leerIdentificador() {
    let valor = "";
    while (this.pos < this.codigo.length && esAlfanumerico(this.codigo[this.pos])) {
      valor += this.codigo[this.pos];
      this.pos++;
    }
    this.push(TipoToken.IDENTIFICADOR, valor);
  }

  push(tipo, valor, linea = this.linea) {
    this.tokens.push({ tipo, valor, linea });
  }
}
