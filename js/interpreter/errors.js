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
  metodoNoExiste: (nombre, linea, objeto = "robot1") =>
    new CQLError("SEM_002", `El método ${objeto}.${nombre} no existe`, {
      educativo: `${objeto === "robot1" ? "Robot1" : "El objeto " + objeto} solo entiende los métodos definidos en su manual de instrucciones.`,
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
  accionNecesitaNumero: (metodo, linea, objeto = "robot1") =>
    new CQLError("SEM_004", `${metodo === "-" ? "El signo - necesita" : `${objeto}.${metodo}() necesita`} un número`, {
      educativo:
        metodo === "-"
          ? "El signo - solo se puede aplicar a un número."
          : "Este movimiento solo acepta una cantidad numérica.",
      sugerencia: metodo === "-" ? "Ejemplo: -5 o -pasos (si pasos es un número)." : `Ejemplo: ${objeto}.${metodo}(3) o ${objeto}.${metodo}(pasos).`,
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

// ---------------------------------------------------------------------------
// Avance 3: condicionales, ciclos y bloques con sangría (Mundos 3 y 4).
// ---------------------------------------------------------------------------

// Sintácticos
Errores.faltaDosPuntos = (palabra, linea) =>
  new CQLError("SYN_006", `Falta ":" al final de la línea del ${palabra}`, {
    educativo: `Después de la condición de un ${palabra} (o del else) va el signo ":".`,
    sugerencia: palabra === "else" ? "Escribe: else:" : `Ejemplo: ${palabra} x > 10:`,
    linea,
  });
Errores.faltaSangria = (linea) =>
  new CQLError("SYN_007", "Falta la sangría después de los dos puntos", {
    educativo: "Las instrucciones que pertenecen al bloque van en las líneas de abajo, movidas 4 espacios a la derecha (tecla Tab).",
    sugerencia: 'Ejemplo:\nif x > 10:\n    print("grande")',
    linea,
  });
Errores.sangriaInesperada = (linea) =>
  new CQLError("SYN_008", "Sangría inesperada", {
    educativo: "Solo se mueven a la derecha las líneas que están dentro de un if, elif, else, while o for.",
    sugerencia: "Quita los espacios del inicio de esa línea (Shift+Tab), o agrega arriba la línea que termina en \":\".",
    linea,
  });
Errores.sinIfPrevio = (palabra, linea) =>
  new CQLError("SYN_009", `Hay un ${palabra} sin if antes`, {
    educativo: `${palabra} siempre acompaña a un if: va justo debajo del bloque del if y alineado con él.`,
    sugerencia: `Revisa que el ${palabra} empiece en la misma columna que su if.`,
    linea,
  });
Errores.sangriaInconsistente = (linea) =>
  new CQLError("SYN_010", "La sangría no coincide con ninguna línea anterior", {
    educativo: "Al salir de un bloque, la línea debe quedar alineada exactamente con la línea que lo abrió.",
    sugerencia: "Usa 4 espacios por nivel (tecla Tab) y alinea las líneas del mismo nivel.",
    linea,
  });
Errores.igualEnCondicion = (linea) =>
  new CQLError("SYN_011", "Usaste = donde va ==", {
    educativo: "Un solo = guarda un valor en una variable. Para PREGUNTAR si dos valores son iguales se usa ==.",
    sugerencia: "Ejemplo: if total == 21:",
    linea,
  });
Errores.forSoloRange = (linea) =>
  new CQLError("SYN_012", "El for necesita range(...)", {
    educativo: "En CodeQuest el for repite una cantidad de veces usando range().",
    sugerencia: "Ejemplo: for i in range(3):",
    linea,
  });
Errores.argumentosRange = (linea) =>
  new CQLError("SYN_013", "range() recibe 1, 2 o 3 números", {
    educativo: "range(n) cuenta de 0 a n-1; range(a, b) cuenta de a a b-1; range(a, b, paso) salta de paso en paso.",
    sugerencia: "Ejemplo: range(3) repite 3 veces.",
    linea,
  });
Errores.comparacionEncadenada = (linea) =>
  new CQLError("SYN_014", "No se pueden encadenar dos comparaciones", {
    educativo: "Cada comparación se hace por separado y se unen con and / or.",
    sugerencia: "En vez de 1 < x < 5, escribe: x > 1 and x < 5",
    linea,
  });

// Semánticos
Errores.objetoNoExiste = (nombre, esperado, linea) =>
  new CQLError("SEM_010", `El objeto ${nombre} no existe aquí`, {
    educativo: esperado
      ? `En este mundo el único objeto que puedes usar es ${esperado}.`
      : "En este mundo no hay objetos con métodos: solo usas variables, print() y entrada().",
    sugerencia: esperado ? `Ejemplo: ${esperado}.metodo(...)` : "Escribe el nombre de una variable o una instrucción permitida.",
    linea,
  });
Errores.palabraNoPermitidaEnNivel = (palabra, linea) =>
  new CQLError("SEM_007", `${palabra} no está permitido todavía en este nivel`, {
    educativo: "Cada nivel solo desbloquea ciertas instrucciones.",
    sugerencia: "Usa únicamente las instrucciones que aparecen en 'Disponible en esta fase'.",
    linea,
  });
Errores.booleanoMinuscula = (nombre, linea) =>
  new CQLError("SEM_001", `${nombre} no es un valor: se escribe ${nombre === "true" ? "True" : "False"}`, {
    educativo: "Los valores lógicos se escriben con mayúscula inicial: True y False.",
    sugerencia: `Escribe ${nombre === "true" ? "True" : "False"}`,
    linea,
  });

// Ejecución
Errores.cicloInfinito = (linea) =>
  new CQLError("RUN_005", "Ciclo infinito detectado", {
    educativo:
      "Tu programa repitió instrucciones más de 1000 veces y se detuvo para no congelar el navegador. Casi siempre es un while cuya condición nunca se vuelve falsa.",
    sugerencia: "Revisa que dentro del ciclo cambies la variable de la condición (por ejemplo: piso = piso + 1).",
    linea,
  });
Errores.condicionNoBooleana = (texto, linea) =>
  new CQLError("RUN_006", `La condición "${texto}" no dio True ni False`, {
    educativo: "Un if o un while necesita una pregunta con respuesta True o False, como x > 5 o color == \"roja\".",
    sugerencia: "Compara el valor con algo usando ==, !=, <, >, <= o >=.",
    linea,
  });
Errores.comparacionInvalida = (operador, tipoA, tipoB, linea) =>
  new CQLError("RUN_007", `No se puede comparar ${tipoA} con ${tipoB} usando ${operador}`, {
    educativo: "Con <, >, <= y >= solo se comparan dos números o dos textos.",
    sugerencia: "Revisa que los dos lados de la comparación sean del mismo tipo.",
    linea,
  });
Errores.operandoLogicoNoBooleano = (operador, linea) =>
  new CQLError("RUN_011", `${operador} necesita valores True o False`, {
    educativo: "and, or y not trabajan con respuestas de comparaciones (True / False).",
    sugerencia: "Ejemplo: total < 21 and color == \"roja\"",
    linea,
  });
Errores.rangoInvalido = (linea) =>
  new CQLError("RUN_010", "range() necesita números enteros (y el paso no puede ser 0)", {
    educativo: "El for cuenta con números enteros.",
    sugerencia: "Ejemplo: for i in range(3):",
    linea,
  });
Errores.elevadorFueraDelEdificio = (pisos, linea = null) =>
  new CQLError("RUN_008", "El elevador intentó salir del edificio", {
    educativo: `El edificio tiene ${pisos} pisos (del 1 al ${pisos}). El elevador no puede subir más ni bajar de la planta baja.`,
    sugerencia: "Revisa cuántos pisos le pides subir o bajar, o la condición de tu ciclo.",
    linea,
  });
Errores.elevadorLleno = (capacidad) =>
  new CQLError("RUN_009", "El elevador está lleno", {
    educativo: `En la cabina caben ${capacidad} pasajeros. Hay que bajarlos antes de recoger a más.`,
    sugerencia: "Lleva a los pasajeros a la planta baja con elevador.soltar() antes de recoger más.",
  });
Errores.elevadorSinEnergia = () =>
  new CQLError("RUN_012", "El elevador se quedó sin energía", {
    educativo: "Cada piso que recorre el elevador gasta 1% de energía y la cabina empieza con 100%.",
    sugerencia: "Revisa que el ciclo no haga viajes de más.",
  });
Errores.mesaLlena = (maximo) =>
  new CQLError("RUN_013", "La mesa está llena", {
    educativo: `En la mesa caben ${maximo} cartas como máximo.`,
    sugerencia: "Usa mesa.voltear() para revisar las cartas que ya pusiste.",
  });
Errores.colorDeCartaInvalido = (valor) =>
  new CQLError("RUN_014", `"${valor}" no es un color de carta`, {
    educativo: 'Las cartas son "roja" o "negra".',
    sugerencia: 'Ejemplo: mesa.poner_carta(7, "roja")',
  });
