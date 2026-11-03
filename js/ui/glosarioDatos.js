// glosarioDatos.js
// Contenido del glosario "Conceptos" (texto fijo del proyecto, sin DOM, para poder
// probarlo con Node). Cada concepto pertenece al mundo donde se aprende por
// primera vez, y el glosario solo muestra lo que el alumno ya pudo ver
// (mundo actual y anteriores). Cada entrada tiene:
//   titulo · definicion (1-2 líneas) · analogia · ejemplo (código CQL) · visual (opcional)

export const CONCEPTOS = [
  // ------------------------------------------------------------ Mundo 1 · Despertar
  {
    id: "instruccion", mundo: 1, titulo: "Instrucción",
    definicion: "Una instrucción es una orden que la computadora entiende y ejecuta. Un programa es una lista de instrucciones, una por línea.",
    analogia: "Es como pedirle algo a un robot de cocina: «corta», «mezcla», «hornea». Cada orden se cumple en su momento y en el orden en que la escribes.",
    ejemplo: 'robot1.avanzar(3)\nrobot1.girar("norte")',
  },
  {
    id: "algoritmo", mundo: 1, titulo: "Algoritmo y programa", visual: "algoritmo",
    definicion: "Un algoritmo es una lista de pasos, en orden, que resuelve un problema. Un programa es un algoritmo escrito en un lenguaje que la computadora entiende.",
    analogia: "Una receta de cocina: si cambias el orden de los pasos, el platillo sale distinto (o no sale).",
    ejemplo: "robot1.avanzar(2)\nrobot1.recoger()\nrobot1.retroceder(2)",
  },
  {
    id: "diagrama_flujo", mundo: 1, titulo: "Diagrama de flujo",
    definicion: "Un diagrama de flujo dibuja un algoritmo con cajas unidas por flechas: un óvalo para Inicio y Fin, y un rectángulo para cada paso. Se lee de arriba hacia abajo.",
    analogia: "Es el mapa de una receta: cada caja es un paso y las flechas dicen cuál sigue. Si las cajas están en otro orden, el robot choca.",
    ejemplo: 'robot1.avanzar(3)\nrobot1.hablar("Listo")',
  },
  {
    id: "metodo", mundo: 1, titulo: "Método y parámetro",
    definicion: "Un método es una acción que sabe hacer un objeto, como robot1.avanzar(). Lo que va entre paréntesis (el parámetro) dice cuánto o cómo hacerla.",
    analogia: "Es un control remoto: el botón es el método y el número que escribes dice cuántas veces lo aprietas.",
    ejemplo: 'robot1.avanzar(4)\nrobot1.hablar("Hola")',
  },
  {
    id: "print", mundo: 1, titulo: "print() — mostrar un resultado",
    definicion: "print() muestra un valor en el panel de Salida. Así el programa «dice» lo que calculó o lo que quiere contarte.",
    analogia: "Es el altavoz del programa: lo que pasa por dentro solo lo conoces si el programa lo anuncia.",
    ejemplo: 'print("Hola, mundo")\nprint(2 + 3)',
  },
  {
    id: "entrada", mundo: 1, titulo: "input() — pedir un dato",
    definicion: "input() pausa el programa y espera a que escribas un dato en la terminal; el programa lo recibe como TEXTO (así funciona Python) y puede usarlo.",
    analogia: "Como el cajero que pregunta «¿cuánto quieres retirar?»: hasta que respondes, no continúa.",
    ejemplo: "print(input())",
  },
  {
    id: "error", mundo: 1, titulo: "Error y mensajes de error",
    definicion: "Un error avisa que algo del código no se puede ejecutar. El mensaje dice qué pasó y casi siempre sugiere cómo arreglarlo; el código (como SEM_001) sirve para buscarlo.",
    analogia: "Es el GPS diciendo «giro no permitido»: no te regaña, te avisa para que tomes otro camino.",
    ejemplo: "robot1.avanzar(3      # falta cerrar el paréntesis",
  },

  // ------------------------------------------------------------ Mundo 2 · Memoria
  {
    id: "variable", mundo: 2, titulo: "Variable", visual: "variable",
    definicion: "Una variable es un nombre que guarda un valor para usarlo después. Con el signo = se guarda, y el valor puede cambiar.",
    analogia: "Piensa en una variable como una caja donde guardas un juguete. Le pones una etiqueta con un nombre para saber qué hay dentro.",
    ejemplo: 'edad = 15\nnombre = "Ana"\nprint(edad)',
  },
  {
    id: "asignacion", mundo: 2, titulo: "Asignación y reasignación",
    definicion: "Asignar es guardar un valor en una variable con =. Reasignar es guardar otro valor: el anterior se pierde.",
    analogia: "Es cambiar lo que hay dentro de la caja: sacas el juguete viejo y metes uno nuevo; la etiqueta se queda igual.",
    ejemplo: "puntos = 10\npuntos = 25\nprint(puntos)   # 25",
  },
  {
    id: "tipos", mundo: 2, titulo: "Tipos de dato",
    definicion: "Los datos tienen tipo: entero (15), decimal (1.75, con punto) y texto (entre comillas, como \"Ana\"). El tipo decide qué se puede hacer con el dato.",
    analogia: "Son como los envases: una botella sirve para líquidos y una caja para objetos; no puedes «sumar» leche con ladrillos.",
    ejemplo: 'edad = 15\naltura = 1.75\nnombre = "Ana"',
  },
  {
    id: "operadores", mundo: 2, titulo: "Operadores aritméticos", visual: "operadores",
    definicion: "+ suma, - resta, * multiplica, / divide (SIEMPRE da un decimal), // da la división entera, % da el residuo y ** eleva a una potencia.",
    analogia: "Son las teclas de una calculadora: tú pones los números y la tecla decide qué hacer con ellos. / es la tecla de la división «con decimales» y // la de «cuántas veces cabe, sin decimales».",
    ejemplo: "print(17 / 4)    # 4.25\nprint(17 // 4)   # 4\nprint(17 % 5)    # 2\nprint(2 ** 3)    # 8",
  },
  {
    id: "concatenacion", mundo: 2, titulo: "Concatenar textos",
    definicion: "Sumar dos textos los une en uno solo (se llama concatenar). Solo funciona entre textos: mezclar un texto con un número da un TypeError; para unirlos, convierte el número con str().",
    analogia: "Es pegar dos tiras de papel con cinta para formar una tira más larga.",
    ejemplo: 'a = "Rob"\nb = "ot1"\nprint(a + b)   # Robot1\nprint("Total: " + str(5))\n# "5" + 3 daría un error',
  },
  {
    id: "identificador", mundo: 2, titulo: "Identificador (nombre de variable)",
    definicion: "Es el nombre que le das a una variable: letras, números y _, sin empezar con número. Las mayúsculas y minúsculas cuentan.",
    analogia: "Es el nombre escrito en la etiqueta: «Nombre» y «nombre» son dos etiquetas distintas, aunque se parezcan.",
    ejemplo: "energia_total = 90\nvalor2 = 7      # 2valor no sería válido",
  },
  {
    id: "constante", mundo: 2, titulo: "Constante (por convención)",
    definicion: "Un valor que no debe cambiar se escribe en MAYÚSCULAS, como MAXIMO. Es una costumbre entre programadores para recordar «esto no se toca».",
    analogia: "La capacidad de un tanque viene impresa en el tanque y no cambia; el nivel del agua sí cambia todo el tiempo.",
    ejemplo: "MAXIMO = 100\nactual = 40\nactual = actual + 25",
  },
  {
    id: "conversiones", mundo: 2, titulo: "Conversión de tipos: int(), float(), str()",
    definicion: 'Cambian un valor de un tipo a otro: int("12") da el entero 12, float("3.5") da el decimal 3.5 y str(5) da el texto "5". Si el texto no parece un número (int("hola")) Python da un ValueError.',
    analogia: "Es un traductor: el dato dice lo mismo, pero en otro idioma. input() siempre habla «texto» y para calcular necesitas traducirlo a «número».",
    ejemplo: 'edad = int("15")\naltura = float("1.75")\netiqueta = "Edad: " + str(edad)\nprint(etiqueta)',
  },
  {
    id: "entrada_datos", mundo: 2, titulo: "Entrada de datos con variables",
    definicion: "input() recibe un dato de quien usa el programa y se guarda en una variable. Siempre llega como texto: para calcular con él hay que convertirlo con int() o float().",
    analogia: "Es un formulario: dejas un espacio en blanco y la persona lo llena; después tú usas lo que escribió.",
    ejemplo: "valor = int(input())\ntotal = valor + 5\nprint(total)",
  },

  // ------------------------------------------------------------ Mundo 3 · Lógica
  {
    id: "condicional", mundo: 3, titulo: "Condicional (if)", visual: "condicional",
    definicion: "Un if hace una pregunta cuya respuesta es True o False. Si es True, ejecuta las líneas con sangría; si es False, las salta.",
    analogia: "Es un semáforo: si está en verde, avanzas; si no, te quedas esperando.",
    ejemplo: 'if total > 21:\n    print("Bust")',
  },
  {
    id: "else", mundo: 3, titulo: "else (si no)",
    definicion: "else es el camino alternativo de un if: se ejecuta cuando la condición fue False. Con if y else siempre se ejecuta exactamente una de las dos ramas.",
    analogia: "Es el plan B: si llueve llevas paraguas; si no, llevas lentes de sol.",
    ejemplo: 'if total > 21:\n    print("Perdiste")\nelse:\n    print("Ganaste")',
  },
  {
    id: "comparadores", mundo: 3, titulo: "Comparadores", visual: "comparadores",
    definicion: "== igual, != distinto, < menor, > mayor, <= menor o igual y >= mayor o igual. Cada comparación da True o False.",
    analogia: "Es una báscula: pone dos cosas en los platos y dice cuál pesa más o si pesan lo mismo.",
    ejemplo: 'if carta1 == carta2:\n    print("Par")\n# OJO: un = guarda, dos == preguntan',
  },
  {
    id: "logicos", mundo: 3, titulo: "and y or",
    definicion: "and es True solo si AMBAS condiciones lo son; or es True si al menos UNA lo es. Sirven para juntar preguntas.",
    analogia: "Para entrar al cine necesitas boleto Y ser de la edad (and); para pagar sirve efectivo O tarjeta (or).",
    ejemplo: 'if color1 == "roja" and total < 21:\n    print("Apuesta")',
  },
  {
    id: "not_booleanos", mundo: 3, titulo: "not y valores lógicos (True / False)",
    definicion: "True y False son valores que se pueden guardar en variables. not los invierte: not True es False.",
    analogia: "Es un interruptor: not lo pasa de encendido a apagado y viceversa.",
    ejemplo: 'seguro = total <= 21\nif not seguro:\n    print("Peligro")',
  },
  {
    id: "elif", mundo: 3, titulo: "elif (si no, y además…)",
    definicion: "elif añade otra pregunta a un if. Las preguntas se revisan en orden y solo se ejecuta la primera rama que sea verdadera.",
    analogia: "Son las ventanillas de un banco: te atiende la primera que corresponde a tu trámite y las demás ya no se usan.",
    ejemplo: 'if total > 21:\n    print("Bust")\nelif total == 21:\n    print("Blackjack")\nelse:\n    print("Sigue")',
  },
  {
    id: "anidados", mundo: 3, titulo: "Condicionales anidados",
    definicion: "Un if puede ir dentro de otro. La sangría indica a cuál pertenece cada línea: cuanto más a la derecha, más adentro.",
    analogia: "Son muñecas rusas: una decisión guardada dentro de otra decisión.",
    ejemplo: 'if total <= 21:\n    if total == 21:\n        print("Blackjack")\n    else:\n        print("Seguro")\nelse:\n    print("Bust")',
  },
  {
    id: "sangria", mundo: 3, titulo: "Sangría (indentación)",
    definicion: "Las líneas que pertenecen a un if, while o for se mueven 4 espacios a la derecha (tecla Tab). Al volver a la columna anterior termina el bloque.",
    analogia: "Es una lista con viñetas: lo que está más metido pertenece al punto de arriba.",
    ejemplo: 'if total > 21:\n    print("Bust")      # dentro del if\nprint("Fin")          # ya fuera',
  },

  // ------------------------------------------------------------ Mundo 4 · Automatización
  {
    id: "while", mundo: 4, titulo: "Ciclo while", visual: "ciclo",
    definicion: "while repite sus líneas MIENTRAS una condición sea True. Antes de cada vuelta pregunta; cuando la respuesta es False, se detiene.",
    analogia: "Es llenar una tina: mientras no esté llena, la llave sigue abierta.",
    ejemplo: "piso = 1\nwhile piso < 5:\n    elevador.subir(1)\n    piso = piso + 1",
  },
  {
    id: "for_range", mundo: 4, titulo: "Ciclo for y range()",
    definicion: "for i in range(n) repite n veces. range(n) cuenta de 0 a n-1; range(a, b) de a a b-1; range(a, b, paso) salta de paso en paso.",
    analogia: "Es dar vueltas a una pista cuando ya sabes cuántas son: las cuentas una por una hasta terminar.",
    ejemplo: "for i in range(3):\n    elevador.subir(1)",
  },
  {
    id: "contador", mundo: 4, titulo: "Contador",
    definicion: "Un contador es una variable que empieza en 0 y suma 1 cada vez que pasa algo. Sirve para contar vueltas, viajes o cosas.",
    analogia: "Es el contador de pasos de un reloj: suma uno por cada paso que das.",
    ejemplo: "viajes = 0\nwhile viajes < 3:\n    elevador.subir(1)\n    elevador.bajar(1)\n    viajes = viajes + 1",
  },
  {
    id: "variable_ciclo", mundo: 4, titulo: "La variable del for (i)",
    definicion: "En un for, la variable (por costumbre i) toma un valor distinto en cada vuelta y se puede usar dentro del bloque.",
    analogia: "Es el número de vuelta que aparece en el marcador de una carrera.",
    ejemplo: "for i in range(2, 6):\n    print(i)   # 2, 3, 4, 5",
  },
  {
    id: "bucle_infinito", mundo: 4, titulo: "Bucle infinito",
    definicion: "Es un ciclo cuya condición nunca se vuelve False. CodeQuest lo detiene a las 1000 repeticiones con el error RUN_005. Casi siempre falta cambiar algo dentro del ciclo.",
    analogia: "Es una escalera eléctrica que sube y sube sin llegar: alguien tiene que apagarla desde afuera.",
    ejemplo: "piso = 1\nwhile piso < 5:\n    elevador.recoger()   # ¡falta subir y cambiar piso!",
  },
  {
    id: "preguntar", mundo: 4, titulo: "Preguntar antes de actuar",
    definicion: "Antes de hacer algo, el programa puede preguntarle al mundo cómo está (elevador.piso(), elevador.hayPasajero(), elevador.llevando()) y decidir con un if.",
    analogia: "Es mirar a ambos lados antes de cruzar la calle: primero observas, luego decides.",
    ejemplo: "if elevador.hayPasajero() and elevador.llevando() < 2:\n    elevador.recoger()",
  },
  // ------------------------------------------------------------ Mundo 5 · Modularidad
  {
    id: "funcion", mundo: 5, titulo: "Función (def)",
    definicion: "Una función es un bloque de código con nombre. Se define una vez con def y se usa (se llama) las veces que haga falta. Dividir un programa en funciones se llama modularidad.",
    analogia: "Es una máquina de la fábrica: la construyes una sola vez y luego solo aprietas el botón cada vez que la necesitas.",
    ejemplo: 'def saludar():\n    print("Hola desde la fábrica")\nsaludar()\nsaludar()',
  },
  {
    id: "parametro", mundo: 5, titulo: "Parámetro y argumento",
    definicion: "Un parámetro es un hueco con nombre en el def: recibe un valor distinto en cada llamada. El valor que pones al llamar la función se llama argumento.",
    analogia: "Es la ranura de entrada de la máquina: por la misma ranura puedes meter piezas distintas, y la máquina trabaja con la que le des.",
    ejemplo: "def avanzar_n(n):\n    robot1.avanzar(n)\navanzar_n(2)\navanzar_n(4)",
  },
  {
    id: "retorno", mundo: 5, titulo: "return y valor de retorno",
    definicion: "return devuelve un resultado a quien llamó la función y la termina. Ese valor se puede guardar en una variable o usar en una cuenta. Sin return, la función devuelve None (nada).",
    analogia: "Es la bandeja de salida de la máquina: lo que cae ahí es lo que recibes. Si la máquina no tiene bandeja, solo trabaja y no te entrega nada.",
    ejemplo: "def calcular_doble(x):\n    return x * 2\nresultado = calcular_doble(21)\nprint(resultado)",
  },
  {
    id: "ambito", mundo: 5, titulo: "Variable local (ámbito)",
    definicion: "Las variables que creas dentro de una función son locales: existen solo mientras la función trabaja. Desde fuera no se pueden usar; para sacar un valor, se devuelve con return.",
    analogia: "Es el cuarto interno de la máquina: lo que ocurre ahí dentro no se ve desde afuera, solo sale lo que entregas por la bandeja.",
    ejemplo: "def calcular():\n    interno = 5 * 4\n    return interno\nresultado = calcular()\nprint(resultado)",
  },
  {
    id: "encadenar", mundo: 5, titulo: "Encadenar funciones",
    definicion: "El valor que devuelve una función se puede usar como parámetro de otra: doble(sumar(2, 3)). Python ejecuta primero la llamada de más adentro y su resultado entra a la de afuera.",
    analogia: "Es una línea de producción: el producto terminado de una máquina es el material de la siguiente.",
    ejemplo: "def sumar(a, b):\n    return a + b\ndef doble(x):\n    return x * 2\nprint(doble(sumar(2, 3)))",
  },
];

/** Compatibilidad: el glosario completo. */
export const GLOSARIO = CONCEPTOS;

/** Conceptos que el alumno ya pudo ver: los del mundo actual y los anteriores. */
export const conceptosHasta = (mundo) => CONCEPTOS.filter((c) => c.mundo <= mundo);

/** Solo los que se aprenden en ese mundo. */
export const conceptosDelMundo = (mundo) => CONCEPTOS.filter((c) => c.mundo === mundo);

export const normalizar = (t) =>
  String(t || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

/** Búsqueda simple: todas las palabras escritas deben aparecer en título, definición, analogía o ejemplo. */
export function buscarConceptos(lista, texto) {
  const palabras = normalizar(texto).split(/\s+/).filter(Boolean);
  if (!palabras.length) return lista;
  return lista.filter((c) => {
    const pajar = normalizar(`${c.titulo} ${c.definicion} ${c.analogia} ${c.ejemplo}`);
    return palabras.every((p) => pajar.includes(p));
  });
}
