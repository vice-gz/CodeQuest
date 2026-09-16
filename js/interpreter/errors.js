// errors.js
// Catálogo de errores de CQL. Cada error trae código, mensaje técnico,
// mensaje educativo y una sugerencia concreta para corregirlo.

export class CQLError extends Error {
  constructor(codigo, mensaje, { educativo = "", sugerencia = "", linea = null } = {}) {
    super(mensaje);
    this.codigo = codigo;
    this.mensaje = mensaje;
    this.educativo = educativo;
    this.sugerencia = sugerencia;
    this.linea = linea;
  }
}

// Fábricas de error: cada una arma el mensaje técnico + el contexto
// educativo descrito en el Documento 3, sección 5 y 6.
export const Errores = {
  // Léxicos
  caracterNoReconocido: (caracter, linea) =>
    new CQLError("LEX_001", `Carácter no reconocido: ${caracter}`, {
      educativo: `El carácter "${caracter}" no forma parte del lenguaje CQL.`,
      sugerencia: "Revisa que no haya símbolos de más, como @, $ o ?.",
      linea,
    }),
  textoSinCerrar: (linea) =>
    new CQLError("LEX_002", "Texto sin cerrar", {
      educativo: "Todo texto debe abrir y cerrar con la misma comilla.",
      sugerencia: 'Agrega la comilla que falta, por ejemplo: "Hola".',
      linea,
    }),

  // Sintácticos
  faltaParenCierre: (linea) =>
    new CQLError("SYN_001", `Falta un paréntesis de cierre en la línea ${linea}`, {
      educativo: "Cada paréntesis que abres debe cerrarse.",
      sugerencia: "Agrega el ) que falta al final de la instrucción.",
      linea,
    }),
  faltaParenApertura: (linea) =>
    new CQLError("SYN_002", `Falta un paréntesis de apertura en la línea ${linea}`, {
      educativo: "Las funciones y métodos necesitan paréntesis para recibir argumentos.",
      sugerencia: "Agrega ( justo después del nombre de la función o método.",
      linea,
    }),
  esperabaIgual: (linea) =>
    new CQLError("SYN_003", "Se esperaba = después de nombre", {
      educativo: "Para crear una variable necesitas asignarle un valor con =.",
      sugerencia: 'Escribe algo como: nombre = "Robot1"',
      linea,
    }),
  instruccionIncompleta: (linea) =>
    new CQLError("SYN_004", `Instrucción incompleta en la línea ${linea}`, {
      educativo: "La instrucción se quedó a medias.",
      sugerencia: "Revisa que la línea tenga todas sus partes, por ejemplo robot1.avanzar(3).",
      linea,
    }),
  esperabaValor: (linea) =>
    new CQLError("SYN_005", "Se esperaba un valor después de =", {
      educativo: "Toda asignación necesita un valor a la derecha del =.",
      sugerencia: "Ejemplo: pasos = 3",
      linea,
    }),

  // Semánticos
  variableNoExiste: (nombre, linea) =>
    new CQLError("SEM_001", `La variable ${nombre} no existe todavía`, {
      educativo: "Recuerda: antes de usar una variable, debes darle un valor.",
      sugerencia: `Ejemplo: ${nombre} = 3`,
      linea,
    }),
  metodoNoExiste: (nombre, linea) =>
    new CQLError("SEM_002", `El método robot1.${nombre} no existe`, {
      educativo: "Robot1 solo entiende los métodos definidos en su manual de instrucciones.",
      sugerencia: "Revisa cómo se llama el método que quieres usar.",
      linea,
    }),
  funcionNoExiste: (nombre, linea) =>
    new CQLError("SEM_003", `La función ${nombre} no existe`, {
      educativo: "CQL solo reconoce las funciones de su biblioteca.",
      sugerencia: 'Por ejemplo, usa print(...) para mostrar algo en pantalla.',
      linea,
    }),
  avanzarNecesitaNumero: (linea) =>
    new CQLError("SEM_004", "robot1.avanzar() necesita un número", {
      educativo: "Robot1 solo puede avanzar una cantidad numérica de casillas.",
      sugerencia: "Ejemplo: robot1.avanzar(3) o robot1.avanzar(pasos).",
      linea,
    }),
  accionNecesitaNumero: (metodo, linea) =>
    new CQLError("SEM_004", `robot1.${metodo}() necesita un número`, {
      educativo: "Este movimiento solo acepta una cantidad numérica de casillas.",
      sugerencia: `Ejemplo: robot1.${metodo}(3) o robot1.${metodo}(pasos).`,
      linea,
    }),
  direccionInvalida: (valor, linea) =>
    new CQLError("SEM_008", `"${valor}" no es una dirección válida`, {
      educativo: "robot1.girar() solo entiende norte, sur, este, oeste (o arriba, abajo, izquierda, derecha).",
      sugerencia: 'Ejemplo: robot1.girar("norte")',
      linea,
    }),
  noRetornaValor: (nombre, linea) =>
    new CQLError("SEM_009", `${nombre} no devuelve ningún valor`, {
      educativo: "Solo algunas instrucciones producen un valor que puedas guardar o mostrar.",
      sugerencia: "Usa entrada(), robot1.mirar(), robot1.posicion() o robot1.energia() cuando necesites un valor.",
      linea,
    }),
  entradaNoDisponible: (linea) =>
    new CQLError("RUN_004", "entrada() no tiene ningún valor disponible en esta fase", {
      educativo: "En esta fase no hay datos de entrada preparados.",
      sugerencia: "Revisa el enunciado de la fase: puede que no necesites usar entrada().",
      linea,
    }),
  printNecesitaValor: (linea) =>
    new CQLError("SEM_005", "print() necesita un valor", {
      educativo: "print() muestra algo en pantalla, así que necesita saber qué mostrar.",
      sugerencia: 'Ejemplo: print("Hola mundo")',
      linea,
    }),
  divisionEntreCero: (linea) =>
    new CQLError("SEM_006", "No puedes dividir entre cero", {
      educativo: "Dividir entre cero no tiene un resultado definido.",
      sugerencia: "Revisa el número por el que estás dividiendo.",
      linea,
    }),
  metodoNoPermitidoEnNivel: (nombre, linea) =>
    new CQLError("SEM_007", `El método ${nombre} no está permitido en este nivel`, {
      educativo: "Cada nivel solo desbloquea ciertas instrucciones.",
      sugerencia: "Usa únicamente las instrucciones permitidas que se muestran en 'Aprende'.",
      linea,
    }),
  funcionNoPermitidaEnNivel: (nombre, linea) =>
    new CQLError("SEM_007", `La función ${nombre} no está permitida en este nivel`, {
      educativo: "Cada nivel solo desbloquea ciertas instrucciones.",
      sugerencia: "Usa únicamente las instrucciones permitidas que se muestran en 'Aprende'.",
      linea,
    }),
  asignacionNoPermitidaEnNivel: (linea) =>
    new CQLError("SEM_007", "Las variables no están permitidas todavía en este nivel", {
      educativo: "Cada nivel solo desbloquea ciertas instrucciones.",
      sugerencia: "Usa únicamente las instrucciones permitidas que se muestran en 'Aprende'.",
      linea,
    }),

  // Ejecución
  saleDelLaboratorio: () =>
    new CQLError("RUN_001", "Robot1 intentó salir del laboratorio", {
      educativo: "El laboratorio tiene un tamaño limitado.",
      sugerencia: "Revisa cuántas casillas le estás pidiendo a Robot1 que avance.",
    }),
  noLlegoAlObjetivo: () =>
    new CQLError("RUN_002", "Robot1 no llegó al objetivo", {
      educativo: "Parece que necesita avanzar una casilla más.",
      sugerencia: "Revisa cuántos pasos le estás indicando.",
    }),
  choqueConObstaculo: () =>
    new CQLError("RUN_003", "Robot1 chocó con un obstáculo", {
      educativo: "Hay algo en el camino de Robot1.",
      sugerencia: "Busca una ruta alterna (disponible a partir del Avance 2).",
    }),
  sinValoresDeEntrada: (linea) =>
    new CQLError("RUN_004", "No hay más valores de entrada disponibles", {
      educativo: "entrada() solo puede leer los valores que este nivel preparó para ti.",
      sugerencia: "Revisa cuántas veces estás llamando a entrada() en tu código.",
      linea,
    }),
};

// Errores semánticos adicionales del rediseño del robot (Mundos 1 y 2).
Errores.direccionInvalida = (valor, linea) =>
  new CQLError("SEM_008", `"${valor}" no es una dirección válida`, {
    educativo: 'robot1.girar() solo entiende "norte", "sur", "este" u "oeste" (o sus equivalentes).',
    sugerencia: 'Prueba con robot1.girar("norte").',
    linea,
  });
