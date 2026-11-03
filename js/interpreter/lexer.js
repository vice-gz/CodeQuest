// lexer.js
// Convierte el texto que escribe el estudiante en una lista de tokens.

// Avance 3: además de los tokens del Avance 1-2, este lexer reconoce
//   - palabras clave: if, elif, else, while, for, in, and, or, not, True, False
//   - operadores: ==, !=, <, >, <=, >= y el signo ":"
//   - sangría estilo Python: al empezar cada línea con contenido emite
//     INDENTACION (sube de nivel) o una DEDENTACION por cada nivel que baja.
//     Los tabuladores cuentan como 4 espacios; las líneas vacías o con solo
//     comentarios no cambian la sangría.

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
  DIV_ENTERA: "DIV_ENTERA", // //
  POTENCIA: "POTENCIA", // **
  NUEVA_LINEA: "NUEVA_LINEA",
  EOF: "EOF",
  // Avance 3
  IF: "IF",
  ELIF: "ELIF",
  ELSE: "ELSE",
  WHILE: "WHILE",
  FOR: "FOR",
  IN: "IN",
  AND: "AND",
  OR: "OR",
  NOT: "NOT",
  TRUE: "TRUE",
  FALSE: "FALSE",
  DEF: "DEF",
  RETURN: "RETURN",
  NONE: "NONE",
  IGUAL: "IGUAL", // ==
  DISTINTO: "DISTINTO", // !=
  MENOR: "MENOR",
  MAYOR: "MAYOR",
  MENOR_IGUAL: "MENOR_IGUAL",
  MAYOR_IGUAL: "MAYOR_IGUAL",
  DOS_PUNTOS: "DOS_PUNTOS",
  INDENTACION: "INDENTACION",
  DEDENTACION: "DEDENTACION",
};

export const PALABRAS_CLAVE = {
  if: TipoToken.IF,
  elif: TipoToken.ELIF,
  else: TipoToken.ELSE,
  while: TipoToken.WHILE,
  for: TipoToken.FOR,
  in: TipoToken.IN,
  and: TipoToken.AND,
  or: TipoToken.OR,
  not: TipoToken.NOT,
  True: TipoToken.TRUE,
  False: TipoToken.FALSE,
  def: TipoToken.DEF,
  return: TipoToken.RETURN,
  None: TipoToken.NONE,
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
    this.pila = [0]; // niveles de sangría abiertos
    this.inicioLinea = true;
  }

  // Al empezar una línea con contenido compara su sangría con la pila.
  procesarSangria() {
    let i = this.pos;
    let ancho = 0;
    while (i < this.codigo.length && (this.codigo[i] === " " || this.codigo[i] === "\t")) {
      ancho += this.codigo[i] === "\t" ? 4 : 1;
      i++;
    }
    const c = this.codigo[i];
    this.pos = i;
    if (i >= this.codigo.length || c === "\n" || c === "\r" || c === "#") return; // línea vacía o comentario

    const tope = this.pila[this.pila.length - 1];
    if (ancho > tope) {
      this.pila.push(ancho);
      this.push(TipoToken.INDENTACION, ancho);
    } else if (ancho < tope) {
      while (this.pila[this.pila.length - 1] > ancho) {
        this.pila.pop();
        this.push(TipoToken.DEDENTACION, ancho);
      }
      if (this.pila[this.pila.length - 1] !== ancho) throw Errores.sangriaInconsistente(this.linea);
    }
  }

  tokenizar() {
    while (this.pos < this.codigo.length) {
      if (this.inicioLinea) {
        this.inicioLinea = false;
        this.procesarSangria();
        if (this.pos >= this.codigo.length) break;
      }
      const c = this.codigo[this.pos];

      if (c === "\n") {
        this.push(TipoToken.NUEVA_LINEA, "\n");
        this.pos++;
        this.linea++;
        this.inicioLinea = true;
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
          if (this.codigo[this.pos + 1] === "=") {
            this.push(TipoToken.IGUAL, "==");
            this.pos += 2;
          } else {
            this.push(TipoToken.ASIGNACION, "=");
            this.pos++;
          }
          break;
        case "!":
          if (this.codigo[this.pos + 1] !== "=") throw Errores.caracterNoReconocido(c, this.linea);
          this.push(TipoToken.DISTINTO, "!=");
          this.pos += 2;
          break;
        case "<":
        case ">": {
          const conIgual = this.codigo[this.pos + 1] === "=";
          const tipo = c === "<" ? (conIgual ? TipoToken.MENOR_IGUAL : TipoToken.MENOR) : conIgual ? TipoToken.MAYOR_IGUAL : TipoToken.MAYOR;
          this.push(tipo, conIgual ? `${c}=` : c);
          this.pos += conIgual ? 2 : 1;
          break;
        }
        case ":":
          this.push(TipoToken.DOS_PUNTOS, ":");
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
          if (this.codigo[this.pos + 1] === "*") {
            this.push(TipoToken.POTENCIA, "**");
            this.pos += 2;
          } else {
            this.push(TipoToken.MULT, "*");
            this.pos++;
          }
          break;
        case "/":
          if (this.codigo[this.pos + 1] === "/") {
            this.push(TipoToken.DIV_ENTERA, "//");
            this.pos += 2;
          } else {
            this.push(TipoToken.DIV, "/");
            this.pos++;
          }
          break;
        case "%":
          this.push(TipoToken.MODULO, "%");
          this.pos++;
          break;
        default:
          throw Errores.caracterNoReconocido(c, this.linea);
      }
    }

    // Cierra los bloques que sigan abiertos al terminar el código.
    while (this.pila.length > 1) {
      this.pila.pop();
      this.push(TipoToken.DEDENTACION, 0);
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
      this.tokens[this.tokens.length - 1].decimal = true; // 5.0 es un float, aunque valga lo mismo que 5
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
    const clave = Object.prototype.hasOwnProperty.call(PALABRAS_CLAVE, valor) ? PALABRAS_CLAVE[valor] : null;
    this.push(clave || TipoToken.IDENTIFICADOR, valor);
  }

  push(tipo, valor, linea = this.linea) {
    this.tokens.push({ tipo, valor, linea });
  }
}
