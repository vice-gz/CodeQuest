// generar_referencia_cql.mjs
// Genera docs/REFERENCIA_LENGUAJE_CQL.md: la referencia completa del lenguaje CQL
// (lexemas, tokens, gramática, tipos, operadores, sentencias, objetos de cada mundo,
// errores y qué se desbloquea en cada nivel). Las tablas de tokens, errores y
// desbloqueos se calculan DESDE EL CÓDIGO del juego, así nunca se desactualizan.
//
// Uso: node herramientas/generar_referencia_cql.mjs   (desde la raíz del proyecto)

import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Lexer, TipoToken, PALABRAS_CLAVE } from "../js/interpreter/lexer.js";
import { Errores } from "../js/interpreter/errors.js";
import { CATALOGO } from "../js/ui/dictionary.js";
import { construirCatalogo } from "../js/persistence/progreso.js";
import { BIBLIOTECA_ROBOT, BIBLIOTECA_ELEVADOR, BIBLIOTECA_MESA } from "../js/interpreter/bibliotecas.js";
import { MAX_INSTRUCCIONES } from "../js/interpreter/interpreter.js";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const niveles = [];
for (const c of readdirSync(join(RAIZ, "levels"))) for (const f of readdirSync(join(RAIZ, "levels", c))) niveles.push(JSON.parse(readFileSync(join(RAIZ, "levels", c, f), "utf8")));
const catalogo = construirCatalogo(niveles);

const esc = (t) => String(t ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");
const tabla = (cabeceras, filas) =>
  [`| ${cabeceras.join(" | ")} |`, `|${cabeceras.map(() => "---").join("|")}|`, ...filas.map((f) => `| ${f.map(esc).join(" | ")} |`)].join("\n");

// ------------------------------------------------------------------ tokens (desde el lexer)
const DESCRIPCION_TOKEN = {
  IDENTIFICADOR: ["nombre", "Nombre de una variable, de una función de Python (print, input, int, float, str, range) o de un objeto del mundo (robot1, elevador, mesa)"],
  NUMERO: ["12  3.5", "Número entero o decimal (con punto)"],
  TEXTO: ['"hola"  \'hola\'', "Texto entre comillas dobles o simples"],
  ASIGNACION: ["=", "Guarda un valor en una variable"],
  PUNTO: [".", "Separa el objeto del método: robot1.avanzar"],
  PAREN_IZQ: ["(", "Abre una llamada o agrupa una expresión"],
  PAREN_DER: [")", "Cierra una llamada o un grupo"],
  COMA: [",", "Separa argumentos: range(1, 5)"],
  SUMA: ["+", "Suma números / une textos"],
  RESTA: ["-", "Resta, o cambia el signo de un número"],
  MULT: ["*", "Multiplica"],
  DIV: ["/", "Divide: SIEMPRE da un decimal (17 / 4 es 4.25)"],
  DIV_ENTERA: ["//", "División entera: solo la parte entera, hacia abajo (17 // 4 es 4)"],
  POTENCIA: ["**", "Potencia (2 ** 3 es 8)"],
  MODULO: ["%", "Residuo de la división"],
  NUEVA_LINEA: ["salto de línea", "Termina una instrucción (una instrucción por línea)"],
  EOF: ["(fin del código)", "Marca el final del programa"],
  IF: ["if", "Pregunta: ejecuta su bloque si la condición es True"],
  ELIF: ["elif", "Otra pregunta, si las anteriores fueron False"],
  ELSE: ["else", "Camino alternativo cuando ninguna pregunta fue True"],
  WHILE: ["while", "Ciclo: repite mientras la condición sea True"],
  FOR: ["for", "Ciclo con contador: for i in range(...)"],
  IN: ["in", "Une la variable del for con range(...)"],
  AND: ["and", "«y» lógico: True si las DOS condiciones son True"],
  OR: ["or", "«o» lógico: True si AL MENOS UNA es True"],
  NOT: ["not", "«no» lógico: invierte True/False"],
  TRUE: ["True", "Valor lógico verdadero (con T mayúscula)"],
  FALSE: ["False", "Valor lógico falso (con F mayúscula)"],
  IGUAL: ["==", "¿Son iguales?"],
  DISTINTO: ["!=", "¿Son distintos?"],
  MENOR: ["<", "¿Es menor?"],
  MAYOR: [">", "¿Es mayor?"],
  MENOR_IGUAL: ["<=", "¿Es menor o igual?"],
  MAYOR_IGUAL: [">=", "¿Es mayor o igual?"],
  DOS_PUNTOS: [":", "Cierra la línea de un if / elif / else / while / for y abre su bloque"],
  INDENTACION: ["(sube la sangría)", "Aparece al empezar un bloque: la línea está más a la derecha que la anterior"],
  DEDENTACION: ["(baja la sangría)", "Aparece al terminar un bloque: una por cada nivel que se cierra"],
};
const GRUPOS = [
  ["Palabras clave", ["IF", "ELIF", "ELSE", "WHILE", "FOR", "IN", "AND", "OR", "NOT", "TRUE", "FALSE"]],
  ["Valores y nombres", ["IDENTIFICADOR", "NUMERO", "TEXTO"]],
  ["Operadores aritméticos", ["SUMA", "RESTA", "MULT", "DIV", "DIV_ENTERA", "MODULO", "POTENCIA"]],
  ["Operadores de comparación", ["IGUAL", "DISTINTO", "MENOR", "MAYOR", "MENOR_IGUAL", "MAYOR_IGUAL"]],
  ["Asignación y delimitadores", ["ASIGNACION", "PUNTO", "PAREN_IZQ", "PAREN_DER", "COMA", "DOS_PUNTOS"]],
  ["Estructura del programa (los inserta el lexer)", ["NUEVA_LINEA", "INDENTACION", "DEDENTACION", "EOF"]],
];
const sinDescribir = Object.keys(TipoToken).filter((t) => !DESCRIPCION_TOKEN[t]);
if (sinDescribir.length) throw new Error(`Faltan descripciones para los tokens: ${sinDescribir.join(", ")}`);
const sinGrupo = Object.keys(TipoToken).filter((t) => !GRUPOS.some(([, ts]) => ts.includes(t)));
if (sinGrupo.length) throw new Error(`Tokens sin grupo: ${sinGrupo.join(", ")}`);

const tablasTokens = GRUPOS.map(([titulo, tipos]) => `#### ${titulo}\n\n${tabla(["Token", "Lexema", "Para qué sirve"], tipos.map((t) => [`\`${t}\``, `\`${DESCRIPCION_TOKEN[t][0]}\``, DESCRIPCION_TOKEN[t][1]]))}`).join("\n\n");

const mostrarTokens = (codigo) =>
  new Lexer(codigo)
    .tokenizar()
    .map((t) => (["NUMERO", "TEXTO", "IDENTIFICADOR"].includes(t.tipo) ? `${t.tipo}(${JSON.stringify(t.valor)})` : t.tipo === "INDENTACION" ? `INDENTACION(${t.valor})` : t.tipo))
    .join(" ");

const EJEMPLOS_TOKENS = [
  ['edad = int(input())', "Una asignación con input() convertido a entero"],
  ['if total > 21:\n    print("Bust")', "Un if con su bloque (observa INDENTACION y DEDENTACION)"],
  ['for i in range(3):\n    elevador.subir(1)  # sube un piso', "Un for con un método y un comentario (el comentario no genera tokens)"],
];
const bloqueTokens = EJEMPLOS_TOKENS.map(([codigo, nota]) => `**${nota}**\n\n\`\`\`python\n${codigo}\n\`\`\`\n\n\`\`\`text\n${mostrarTokens(codigo)}\n\`\`\``).join("\n\n");

// ------------------------------------------------------------------ errores (desde errors.js)
const marcador = "‹x›";
const filasError = [];
const vistos = new Set();
for (const [nombre, fabrica] of Object.entries(Errores)) {
  let e;
  try {
    e = fabrica(marcador, marcador, marcador, marcador);
  } catch {
    continue;
  }
  const clave = `${e.codigo}|${e.mensaje}`;
  if (vistos.has(clave)) continue;
  vistos.add(clave);
  filasError.push({ codigo: e.codigo, mensaje: e.mensaje.replace(/en la línea ‹x›/, "en la línea N"), educativo: e.educativo, sugerencia: e.sugerencia });
}
filasError.sort((a, b) => a.codigo.localeCompare(b.codigo) || a.mensaje.localeCompare(b.mensaje));
const FAMILIAS = [
  ["LEX", "Léxicos (el lexer no entiende un carácter o un texto)"],
  ["SYN", "Sintácticos (la estructura del código está mal escrita)"],
  ["SEM", "Semánticos (la instrucción existe pero no se puede usar así aquí)"],
  ["RUN", "De ejecución (fallan mientras el programa corre)"],
];
const tablasErrores = FAMILIAS.map(([pref, titulo]) => {
  const filas = filasError.filter((f) => f.codigo.startsWith(pref));
  return `#### ${titulo}\n\n${tabla(["Código", "Mensaje", "Qué significa", "Cómo se arregla"], filas.map((f) => [`\`${f.codigo}\``, f.mensaje, f.educativo, f.sugerencia]))}`;
}).join("\n\n");

// ------------------------------------------------------------------ qué se desbloquea y cuándo
const lugar = (faseId) => {
  const nivelId = Number(String(faseId).split(".")[0]);
  const n = catalogo.niveles[nivelId];
  const ord = catalogo.mundos[n.mundo].niveles.indexOf(nivelId) + 1;
  return `Mundo ${n.mundo} · Nivel ${ord} (${n.nombre}), fase ${faseId}`;
};
const tablaDesbloqueos = tabla(
  ["Instrucción", "Grupo", "Desde dónde se puede usar", "Qué hace"],
  CATALOGO.map((c) => [`\`${c.firma}\``, c.categoria, lugar(c.desbloqueaEn), c.descripcion])
);

// ------------------------------------------------------------------ texto
const metodos = (bib) => Object.entries(bib.metodos).map(([m, d]) => `${m}${d.numerico ? "(n)" : "()"}${d.retorna ? " → valor" : ""}`).join(", ");

const doc = `# CQL — Referencia del lenguaje de CodeQuest

**CQL** (*CodeQuest Language*) es el lenguaje de programación que se escribe en el juego. **Es Python 3**: el código que escribes en CodeQuest es el mismo que ejecutarías en Python real (se comprueba comparando la salida con la del Python de verdad en \`test_python_compat.mjs\`). Es un subconjunto pequeño de Python pensado para enseñar —sus mensajes de error explican qué pasó y cómo arreglarlo— y hay unas pocas diferencias deliberadas, listadas en la sección 13.

Este documento reúne **todo lo que se puede hacer en CQL**: los lexemas y tokens, la gramática, los tipos de dato, los operadores, las sentencias, los objetos de cada mundo, el catálogo de errores y en qué nivel se desbloquea cada instrucción. Las tablas de tokens, errores y desbloqueos se generan automáticamente desde el código del juego (\`node herramientas/generar_referencia_cql.mjs\`).

## Contenido

1. [Cómo se ejecuta un programa](#1-cómo-se-ejecuta-un-programa)
2. [Lexemas y tokens](#2-lexemas-y-tokens)
3. [Gramática](#3-gramática)
4. [Tipos de dato y valores](#4-tipos-de-dato-y-valores)
5. [Operadores y precedencia](#5-operadores-y-precedencia)
6. [Sentencias](#6-sentencias)
7. [Funciones integradas](#7-funciones-integradas)
8. [Objetos y métodos de cada mundo](#8-objetos-y-métodos-de-cada-mundo)
9. [Qué se desbloquea y cuándo](#9-qué-se-desbloquea-y-cuándo)
10. [Catálogo de errores](#10-catálogo-de-errores)
11. [Lo que CQL NO tiene](#11-lo-que-cql-no-tiene)
12. [Ejemplos](#12-ejemplos)
13. [Compatibilidad con Python 3](#13-compatibilidad-con-python-3)

---

## 1. Cómo se ejecuta un programa

El código del estudiante pasa por cuatro etapas, en este orden. Un error en cualquier etapa detiene el programa y muestra un mensaje con su código (ver sección 10).

| Etapa | Qué hace | Ejemplo de lo que detecta |
|---|---|---|
| **1. Lexer** (análisis léxico) | Convierte el texto en una lista de **tokens** | Un carácter que CQL no conoce (\`@\`), un texto sin cerrar |
| **2. Parser** (análisis sintáctico) | Arma el **árbol de sintaxis (AST)** siguiendo la gramática | Falta un \`:\`, una sangría mal puesta, un \`else\` sin \`if\` |
| **3. Validador** (análisis semántico) | Revisa que lo escrito exista y esté permitido en esa fase | Variable sin definir, método que no existe, instrucción que aún no se desbloquea |
| **4. Intérprete** | Ejecuta el árbol paso a paso, esperando a que cada acción del mundo (mover el robot, voltear una carta, subir el elevador…) termine | División entre cero, ciclo infinito, el elevador se sale del edificio |

Después de ejecutar, el juego **evalúa la fase**: compara lo que hizo el programa con lo que pedía el nivel (en los niveles de lógica y ciclos, el programa se prueba además en varios casos —mesas o edificios— distintos).

**Límite de seguridad.** Si entre todos los ciclos (\`while\` y \`for\`) el programa da más de **${MAX_INSTRUCCIONES} vueltas**, se detiene con el error \`RUN_005\` (Ciclo infinito detectado), para no congelar el navegador.

---

## 2. Lexemas y tokens

El **lexer** lee el código carácter por carácter y lo agrupa en **lexemas** (trozos con significado). A cada lexema le asigna un **token** (su categoría).

### 2.1 Alfabeto: qué caracteres se aceptan

| Clase | Caracteres | Notas |
|---|---|---|
| Letras | \`a\`–\`z\`, \`A\`–\`Z\`, \`_\` | **Solo ASCII**: una \`ñ\` o una letra con acento **fuera de un texto** da error \`LEX_001\` |
| Dígitos | \`0\`–\`9\` | |
| Operadores | \`+ - * / // % ** = == != < > <= >=\` | |
| Delimitadores | \`( ) , . :\` | |
| Comillas | \`"\` y \`'\` | Para escribir textos |
| Espacios | espacio, tabulador | Un tabulador cuenta como **4 espacios** |
| Fin de línea | salto de línea | Termina la instrucción |
| Comentario | \`#\` | Todo lo que sigue hasta el fin de la línea se ignora |

Cualquier otro carácter (por ejemplo \`@  $  &  [  ]  {  }  ;  ?  \\\`) produce \`LEX_001: Carácter no reconocido\`. Un \`!\` solo es válido si va seguido de \`=\` (\`!=\`).

### 2.2 Lexemas: cómo se forma cada uno

| Lexema | Se escribe así | Expresión regular | Ejemplos | Token |
|---|---|---|---|---|
| **Identificador** | Empieza con letra o \`_\`; después letras, dígitos o \`_\`. **Distingue mayúsculas de minúsculas** (\`Nombre\` ≠ \`nombre\`) | \`[A-Za-z_][A-Za-z0-9_]*\` | \`edad\`, \`total_2\`, \`MAXIMO\`, \`robot1\` | \`IDENTIFICADOR\` |
| **Palabra clave** | Un identificador que está en la lista de palabras reservadas (no se pueden usar como nombre de variable) | \`if elif else while for in and or not True False\` | \`if\`, \`True\` | su propio token (\`IF\`, \`TRUE\`…) |
| **Número entero** | Uno o más dígitos | \`[0-9]+\` | \`0\`, \`15\`, \`1000\` | \`NUMERO\` |
| **Número decimal** | Dígitos, **punto** y al menos un dígito más (nunca coma) | \`[0-9]+\\.[0-9]+\` | \`1.75\`, \`0.5\` | \`NUMERO\` |
| **Texto** | Caracteres entre comillas dobles o simples **en una sola línea**. No hay secuencias de escape (no existe \`\\n\` ni \`\\"\`) | \`"[^"\\n]*"\` o \`'[^'\\n]*'\` | \`"Hola"\`, \`'robot'\` | \`TEXTO\` |
| **Comentario** | \`#\` hasta el fin de la línea | \`#[^\\n]*\` | \`# esto se ignora\` | *(no genera token)* |

Detalles que conviene saber:

- \`2,5\` **no** es un decimal: son tres lexemas (\`2\`, \`,\`, \`5\`). Los decimales usan punto.
- \`.5\` y \`3.\` **no** son números válidos: el punto decimal necesita dígitos a ambos lados.
- \`2valor\` se lee como el número \`2\` seguido del identificador \`valor\`: un nombre **no puede empezar con un dígito**.
- \`true\` y \`false\` (minúsculas) **no** son palabras clave: se leen como identificadores y el validador avisa que se escriben \`True\` y \`False\`.
- Dentro de un texto sí se aceptan acentos, \`ñ\` y cualquier símbolo, excepto el salto de línea y la comilla que lo cierra.

### 2.3 Sangría (indentación)

CQL, como Python, usa la **sangría** para agrupar instrucciones en bloques. El lexer la convierte en tokens:

- Al **empezar una línea con contenido**, compara su sangría con la de las líneas anteriores.
- Si está **más a la derecha** → emite \`INDENTACION\` (empieza un bloque).
- Si está **más a la izquierda** → emite una \`DEDENTACION\` por cada nivel que se cierra. La línea debe quedar alineada **exactamente** con alguna línea anterior; si no, error \`SYN_010\`.
- Las líneas vacías o con solo un comentario **no** cambian la sangría.
- Al terminar el código se cierran todos los bloques abiertos.
- Convención recomendada: **4 espacios** por nivel (la tecla **Tab** del editor inserta 4; **Shift+Tab** los quita; Ctrl+Enter ejecuta).

### 2.4 Tabla de tokens

Hay **${Object.keys(TipoToken).length} tipos de token**. Esta tabla sale del propio lexer:

${tablasTokens}

### 2.5 Ejemplos de tokenización

${bloqueTokens}

---

## 3. Gramática

Notación: \`*\` = cero o más veces, \`+\` = una o más, \`?\` = opcional, \`|\` = o. Lo que va entre comillas es un lexema literal.

\`\`\`text
programa      := sentencia*
sentencia     := asignacion | llamada | condicional | mientras | para

asignacion    := IDENTIFICADOR "=" expresion NUEVA_LINEA
llamada       := IDENTIFICADOR "(" argumentos? ")"                 (print, input, int, float, str)
               | IDENTIFICADOR "." IDENTIFICADOR "(" argumentos? ")"  (robot1.avanzar(3))
argumentos    := expresion ("," expresion)*

bloque        := ":" NUEVA_LINEA INDENTACION sentencia+ DEDENTACION
condicional   := "if" expresion bloque
                 ("elif" expresion bloque)*
                 ("else" bloque)?
mientras      := "while" expresion bloque
para          := "for" IDENTIFICADOR "in" "range" "(" expresion ("," expresion){0,2} ")" bloque

expresion     := o_logico
o_logico      := y_logico ("or" y_logico)*
y_logico      := no_logico ("and" no_logico)*
no_logico     := "not" no_logico | comparacion
comparacion   := aritmetica ( ("==" | "!=" | "<" | ">" | "<=" | ">=") aritmetica )?     ← no se encadenan
aritmetica    := termino (("+" | "-") termino)*
termino       := unario (("*" | "/" | "//" | "%") unario)*
unario        := "-" unario | potencia
potencia      := factor ("**" unario)?        ← como Python: -2 ** 2 es -4 y 2 ** 3 ** 2 es 512
factor        := NUMERO | TEXTO | "True" | "False" | IDENTIFICADOR
               | llamada | "(" expresion ")"
\`\`\`

Observaciones:

- Una instrucción por línea; **no hay** \`;\` ni llaves.
- \`elif\` se guarda internamente como un \`if\` anidado dentro del \`else\` del anterior.
- \`for\` **solo** acepta \`range(...)\` con 1, 2 o 3 argumentos.
- Una comparación no se puede encadenar: \`1 < x < 5\` es error (\`SYN_014\`); se escribe \`x > 1 and x < 5\`.

---

## 4. Tipos de dato y valores

CQL es de **tipado dinámico**: no se declara el tipo; lo decide el valor, y una variable puede guardar valores de distinto tipo en momentos distintos (\`x = 5\` y luego \`x = "cinco"\`).

| Tipo | Cómo se escribe | Ejemplos | Etiqueta en el panel de Memoria |
|---|---|---|---|
| **Entero** (\`int\`) | dígitos | \`15\`, \`0\`, \`-3\` (el signo es un operador) | \`ENTERO\` |
| **Decimal** (\`float\`) | dígitos, punto, dígitos | \`1.75\`, \`2.5\`, \`5.0\` | \`DECIMAL\` |
| **Texto** (\`str\`) | entre comillas | \`"Ana"\`, \`'hola'\` | \`TEXTO\` |
| **Lógico** (\`bool\`) | \`True\` / \`False\` | \`True\`, \`3 > 2\` | \`LÓGICO\` |

Reglas importantes:

- **Los valores lógicos se imprimen como \`True\` / \`False\`** (con mayúscula).
- Una **condición** (de \`if\`, \`elif\`, \`while\`) debe dar \`True\` o \`False\`. CQL **no** convierte números ni textos en «verdadero/falso»: \`if 5:\` es el error \`RUN_006\`.
- **Entero y decimal son tipos distintos, como en Python:** \`5\` es un entero y \`5.0\` es un decimal (se muestra \`5.0\`). \`10 / 2\` da \`5.0\`, no \`5\`.
- **Los enteros llegan hasta unos 9 mil billones (2⁵³):** más allá da el error \`RUN_018\` (Python no tiene ese límite).
- **\`input()\` siempre devuelve texto**, aunque se escriba un número. Para calcular con él hay que convertirlo: \`int(input())\`, \`float(input())\`.
- Los decimales son de coma flotante, así que \`0.1 + 0.2\` muestra \`0.30000000000000004\`.
- Una variable creada **dentro** de un \`if\` o ciclo se puede usar después; pero si esa rama no llegó a ejecutarse, usarla da error de variable sin definir.
- La variable de un \`for\` (\`i\`) sigue existiendo al terminar el ciclo, con el último valor.
- Todas las variables son **globales** (no hay funciones ni ámbitos locales).

---

## 5. Operadores y precedencia

De **mayor** a **menor** prioridad (los de arriba se calculan primero; los paréntesis siempre mandan):

| Prioridad | Operador(es) | Operandos | Resultado |
|---|---|---|---|
| 1 (más alta) | \`( )\` paréntesis | cualquiera | — |
| 2 | \`**\` potencia (asociativa a la derecha) | números | número |
| 3 | \`-\` unario (cambio de signo) | número | número |
| 4 | \`*\`  \`/\`  \`//\`  \`%\` | números | número |
| 5 | \`+\`  \`-\` | números (o dos textos para \`+\`) | número (o texto) |
| 6 | \`==\`  \`!=\`  \`<\`  \`>\`  \`<=\`  \`>=\` | ver abajo | lógico |
| 7 | \`not\` | lógico | lógico |
| 8 | \`and\` | lógicos | lógico |
| 9 (más baja) | \`or\` | lógicos | lógico |

### Aritméticos

| Operador | Significado | Ejemplo | Resultado | Notas |
|---|---|---|---|---|
| \`+\` | suma | \`5 + 3\` | \`8\` | |
| \`+\` | **concatenar** textos | \`"Rob" + "ot1"\` | \`"Robot1"\` | solo texto con texto |
| \`-\` | resta / cambio de signo | \`10 - 4\`, \`-x\` | \`6\` | |
| \`*\` | multiplicación | \`6 * 7\` | \`42\` | |
| \`/\` | división | \`17 / 4\` | \`4.25\` | **SIEMPRE da un decimal**, aunque sea exacta: \`10 / 2\` es \`5.0\`. Dividir entre 0 → \`SEM_006\` (ZeroDivisionError) |
| \`//\` | división entera | \`17 // 4\` | \`4\` | Solo la parte entera, **hacia abajo**: \`-7 // 2\` es \`-4\`. Con algún decimal da decimal (\`7.5 // 2\` es \`3.0\`). Entre 0 → \`SEM_006\` |
| \`%\` | residuo | \`17 % 5\` | \`2\` | El signo del resultado es el del divisor, como en Python: \`-5 % 3\` es \`1\` y \`5 % -3\` es \`-1\`. Con 0 → \`SEM_006\` |
| \`**\` | potencia | \`2 ** 3\` | \`8\` | Con exponente negativo da decimal: \`2 ** -1\` es \`0.5\`. \`0 ** -1\` → \`SEM_006\`; \`(-8) ** 0.5\` → \`RUN_019\` |

Entero con entero da entero (\`+ - * // % **\`); si algún lado es decimal, el resultado es decimal.

**Sin mezclas silenciosas (como el TypeError de Python):** \`+\` une texto con texto o suma número con número. Mezclarlos (\`"5" + 3\`) es el error \`RUN_015\`, y el juego lo detecta ANTES de ejecutar cuando los tipos se conocen: «TypeError: No puedes sumar un texto ("5") con un número (3) directamente. Usa int("5") o str(3)». Usar \`- * / // % **\` con textos es \`RUN_016\`. Operar con lo que devolvió \`input()\` sin convertirlo (\`input() + 5\`) es \`SEM_011\`, con la solución \`int(input()) + 5\`.

### Comparación

| Operador | Pregunta | Entre qué tipos |
|---|---|---|
| \`==\`  \`!=\` | ¿iguales? / ¿distintos? | **cualquier** tipo. Tipos distintos nunca son iguales (\`3 == "3"\` es \`False\`); \`1 == 1.0\` es \`True\` |
| \`<\`  \`>\`  \`<=\`  \`>=\` | menor / mayor / … | solo **número con número** o **texto con texto** (orden alfabético); otra mezcla → \`RUN_007\` |

### Lógicos

| Operador | Se evalúa | Notas |
|---|---|---|
| \`and\` | True solo si ambos lados son True | **Cortocircuito:** si el lado izquierdo es \`False\`, el derecho ni se calcula (así \`x != 0 and 10 / x > 1\` no divide entre cero) |
| \`or\` | True si alguno es True | Cortocircuito: si el izquierdo es \`True\`, el derecho no se calcula |
| \`not\` | invierte | \`not 5 > 3\` es \`not (5 > 3)\` → \`False\` |

Los operandos de \`and\`, \`or\` y \`not\` **deben** ser \`True\`/\`False\` (si no, \`RUN_011\`).

---

## 6. Sentencias

### 6.1 Asignación

\`\`\`python
nombre = "Ana"        # crea la variable
nombre = "Beto"       # reasigna: el valor anterior se pierde
total = a + b * 2     # el lado derecho es cualquier expresión
\`\`\`

Una sola variable por línea (no existe \`x = y = 3\`) y sin operadores abreviados (no existe \`x += 1\`; se escribe \`x = x + 1\`). El lado derecho puede incluir llamadas con valor: \`pos = robot1.posicion()\`, \`n = int(input())\`. Los nombres \`print\`, \`input\`, \`int\`, \`float\`, \`str\` y \`range\` están reservados (\`SEM_012\`).

### 6.2 Condicionales

\`\`\`python
if total > 21:
    print("Bust")
elif total == 21:
    print("Blackjack")
else:
    print("Sigue")
\`\`\`

- Se evalúan en orden y **solo se ejecuta la primera rama verdadera**.
- \`elif\` y \`else\` van **alineados** con su \`if\`; \`else\` es siempre la última rama y no lleva condición.
- Se pueden **anidar** (un \`if\` dentro de otro); la sangría decide a cuál pertenece cada línea.
- Un \`=\` donde va \`==\` da \`SYN_011\`.

### 6.3 Ciclo \`while\`

\`\`\`python
piso = 1
while piso < 5:
    elevador.subir(1)
    piso = piso + 1
\`\`\`

Pregunta **antes** de cada vuelta; termina cuando la condición es \`False\`. Dentro del ciclo debe cambiar algo, o nunca terminará (\`RUN_005\` a las ${MAX_INSTRUCCIONES} vueltas).

### 6.4 Ciclo \`for\` con \`range\`

| Forma | Recorre | Ejemplo | Valores de \`i\` |
|---|---|---|---|
| \`range(n)\` | de 0 a n−1 | \`for i in range(3):\` | 0, 1, 2 |
| \`range(a, b)\` | de a a b−1 | \`for i in range(2, 6):\` | 2, 3, 4, 5 |
| \`range(a, b, paso)\` | de a hacia b saltando \`paso\` (puede ser negativo) | \`for i in range(5, 0, -2):\` | 5, 3, 1 |

Los argumentos pueden ser expresiones, pero deben dar **enteros** y el paso no puede ser 0 (\`RUN_010\`). Si el rango está vacío (\`range(0)\`, \`range(3, 0)\`) el bloque no se ejecuta. Los ciclos se pueden **anidar**.

### 6.5 Llamadas

- **Funciones integradas** como instrucción: \`print("hola")\`.
- **Métodos de un objeto**: \`robot1.avanzar(3)\`, \`elevador.subir(1)\`, \`mesa.voltear()\`.
- Los métodos que **devuelven valor** también se pueden usar dentro de expresiones: \`if elevador.hayPasajero():\`, \`print(robot1.energia())\`. Usar en una expresión un método que no devuelve valor es el error \`SEM_009\`.

### 6.6 Comentarios y líneas vacías

\`\`\`python
# Un comentario en su propia línea
x = 5   # o al final de una instrucción
\`\`\`

---

## 7. Funciones integradas

Son las de Python (más \`range\`, que únicamente vive dentro del \`for\`). \`entrada()\` **ya no existe**: se llama \`input()\`.

| Función | Qué hace | Devuelve | Detalles |
|---|---|---|---|
| \`print(valor)\` | Muestra un valor en el panel de **Salida** | nada | Necesita un valor (\`print()\` es \`SEM_005\`). Con varios argumentos solo se muestra el primero. Los lógicos salen como \`True\`/\`False\` y los decimales como en Python (\`5.0\`, \`4.25\`) |
| \`input()\` / \`input("mensaje")\` | Pausa el programa y espera a que la persona escriba un dato. El mensaje opcional se le muestra en la terminal | **siempre texto** | \`input()\` devuelve \`"12"\` aunque se escriba 12. Para calcular: \`int(input())\` o \`float(input())\`. Más de un argumento → \`SEM_013\` |
| \`int(valor)\` | Convierte a número entero | entero | \`int("12")\` → 12; \`int(3.9)\` → 3 (corta, no redondea); \`int(" 7 ")\` → 7. Un texto que no parece un entero (\`int("hola")\`, \`int("3.5")\`) → **ValueError** \`RUN_017\`: «El valor ingresado no es un número válido» |
| \`float(valor)\` | Convierte a número decimal | decimal | \`float("3.5")\` → 3.5; \`float(3)\` → 3.0. Texto inválido → \`RUN_017\` |
| \`str(valor)\` | Convierte a texto | texto | \`str(5)\` → \`"5"\`; \`str(2.5)\` → \`"2.5"\`; \`str(True)\` → \`"True"\`. Sirve para unir números con textos: \`"Total: " + str(5)\` |
| \`range(...)\` | Genera la cuenta de un \`for\` | — | Ver 6.4. Sus argumentos deben ser enteros |

\`int\`, \`float\` y \`str\` necesitan **exactamente un** valor (\`SEM_013\`).

---

## 8. Objetos y métodos de cada mundo

Cada mundo tiene **su propio objeto** (o ninguno). Usar un objeto que no es del mundo actual da \`SEM_010\`. Un método solo se puede usar cuando el nivel lo permite (si aún no se desbloquea: \`SEM_007\`; si no existe en absoluto: \`SEM_002\`).

| Mundo | Objeto | Métodos |
|---|---|---|
| 1 · Despertar (y Laboratorio Libre) | \`robot1\` | ${metodos(BIBLIOTECA_ROBOT)} |
| 2 · Memoria | *(ninguno)* | solo variables, \`print\`, \`input\` y las conversiones \`int\`, \`float\`, \`str\` |
| 3 · Lógica | \`mesa\` | ${metodos(BIBLIOTECA_MESA)} |
| 4 · Automatización | \`elevador\` | ${metodos(BIBLIOTECA_ELEVADOR)} |

### 8.1 \`robot1\` (cuadrícula del laboratorio)

El laboratorio es una cuadrícula con **(0, 0) en la esquina superior izquierda**; la x crece hacia el este (derecha) y la y hacia el sur (abajo). En el Laboratorio Libre es de 10 × 10.

| Método | Qué hace | Detalles |
|---|---|---|
| \`avanzar(n)\` | Avanza n casillas en la dirección que mira | Gasta energía (1 por casilla, según el nivel). Si se sale de la cuadrícula: \`RUN_001\`; si choca con un obstáculo: \`RUN_003\` |
| \`retroceder(n)\` | Retrocede n casillas | Igual que avanzar pero hacia atrás |
| \`girar("dirección")\` | Cambia hacia dónde mira | Direcciones válidas: \`"norte"\`, \`"sur"\`, \`"este"\`, \`"oeste"\`, y los alias \`"arriba"\`, \`"abajo"\`, \`"derecha"\`, \`"izquierda"\` |
| \`hablar("texto")\` | Robot1 dice un mensaje (globo + panel de Salida) | |
| \`recoger()\` | Recoge el objeto de la casilla donde está | Si al terminar la fase Robot1 no llegó adonde debía, el juego lo dice con \`RUN_002\` |
| \`soltar()\` | Deja el objeto que lleva en la casilla actual | |
| \`mirar()\` → texto | Devuelve hacia dónde mira (\`"este"\`, …) | |
| \`posicion()\` → texto | Devuelve la posición como texto \`"(x,y)"\` | |
| \`energia()\` → número | Devuelve la energía que le queda | |

### 8.2 Mundo 2 · Memoria (sin objetos)

El «Centro de Recuperación» dibuja cada variable como un **chip de memoria** (con su nombre, valor y tipo) y muestra los cables por donde viaja cada dato. No hay robot: se programa solo con variables, operadores, \`print\`, \`input\` y las conversiones \`int\`, \`float\` y \`str\`.

### 8.3 Mundo 3 · Lógica (la mesa de cartas)

Cada mesa trae **variables ya definidas** que el programa puede leer:

| Variable | Contenido |
|---|---|
| \`carta1\`, \`carta2\`, \`carta3\`… | El valor de cada carta de la mano (número) |
| \`total\` | La suma de los valores de la mano |
| \`color1\`, \`color2\`… | \`"roja"\` o \`"negra"\` (cuando el nivel lo habilita) |
| \`numero\` | Igual que \`total\` (solo en el Nivel 1 del Mundo 3) |

Métodos de la mesa (solo en las fases «Libre»; son **visuales**: no cambian \`carta1\`, \`total\`, etc.):

| Método | Qué hace |
|---|---|
| \`mesa.poner_carta(valor, color)\` | Pone una carta nueva (color \`"roja"\` o \`"negra"\`; máximo 6 cartas) |
| \`mesa.voltear()\` | Voltea las cartas: si hay alguna boca abajo las muestra todas; si ya están todas visibles, las tapa |

Durante la ejecución la mesa **juzga cada \`if\`/\`elif\`** con un sello ✓ VERDADERO / ✗ FALSO, y las cartas se iluminan en verde o rojo. Lo que se imprime con \`print\` aparece como mensaje central de la mesa.

### 8.4 \`elevador\` (edificio de 5 pisos)

El **piso 1 es la planta baja**; el edificio llega hasta el piso 5. Los pasajeros esperan en distintos pisos y hay que **llevarlos a la planta baja**. La cabina tiene capacidad limitada (4 pasajeros; 2 en la «cabina chica») y **energía** (empieza en 100 y cada piso recorrido gasta 1).

| Método | Qué hace | Errores posibles |
|---|---|---|
| \`subir(n)\` | Sube n pisos (de uno en uno) | Salirse del edificio (\`RUN_008\`), sin energía (\`RUN_012\`) |
| \`bajar(n)\` | Baja n pisos | Igual |
| \`recoger()\` | Sube a la cabina a **todos** los que esperan en este piso | Cabina llena (\`RUN_009\`) |
| \`soltar()\` | Baja a todos los pasajeros: en la planta baja quedan **entregados**; en otro piso se quedan esperando ahí | |
| \`piso()\` → número | Piso donde está el elevador | |
| \`hayPasajero()\` → lógico | ¿Hay alguien esperando en este piso? | |
| \`llevando()\` → número | Cuántas personas van en la cabina | |

---

## 9. Qué se desbloquea y cuándo

El lenguaje se **va abriendo nivel por nivel**: cada fase declara qué instrucciones permite, y usar una que todavía no se ha aprendido da un error educativo (\`SEM_007\`: «no está permitido todavía en este nivel»), no un fallo misterioso. Los **permisos** que puede abrir una fase son: \`print\`, \`input\`, \`int\`, \`float\`, \`str\`, \`asignacion\`, \`if\`, \`elif\`, \`else\`, \`while\`, \`for\`, \`and\`, \`or\`, \`not\` y \`booleanos\` (los comparadores y \`True\`/\`False\` se permiten cuando está abierto \`if\`, \`while\` o \`booleanos\`), más la lista de métodos del objeto del mundo.

Esta tabla es la del **Diccionario** del juego:

${tablaDesbloqueos}

Los operadores aritméticos \`+ - *\` se usan desde el Mundo 2; \`/\`, \`//\` y \`%\` se enseñan en el Nivel 5 del Mundo 2 (Calcula el reparto). \`**\` está disponible en todo CQL aunque ningún nivel lo exige.

---

## 10. Catálogo de errores

Todos los errores de CQL tienen un **código**, un **mensaje**, una explicación (*qué significa*) y una sugerencia (*cómo se arregla*). Los textos entre ‹ › son marcadores que el juego reemplaza por el nombre, valor o número de línea real. Estos códigos son los que aparecen en el panel de administración y en la exportación a CSV para la tesis (columna «Error más frecuente»).

${tablasErrores}

---

## 11. Lo que CQL NO tiene

CQL es deliberadamente pequeño. Todo esto **no existe** (y la mayoría produce un error de sintaxis o de «nombre no definido»):

| No existe | Qué pasa si se intenta |
|---|---|
| Funciones propias (\`def\`), \`return\` | \`def f():\` → error de sintaxis |
| Listas, diccionarios, tuplas (\`[ ]\`, \`{ }\`) | \`LEX_001\`: carácter no reconocido |
| Recorrer con \`for x in lista\` | \`SYN_012\`: el for solo acepta \`range(...)\` |
| \`break\`, \`continue\`, \`pass\` | Se leen como nombres de variable sin sentido |
| \`+=\`, \`-=\`, \`x = y = 3\`, varias asignaciones en una línea | Error de sintaxis |
| \`;\` para separar instrucciones, llaves \`{ }\` | \`LEX_001\` |
| Secuencias de escape en textos (\`\\n\`, \`\\"\`), textos de varias líneas, f-strings | No se interpretan |
| \`print\` con varios argumentos | Solo se muestra el primero |
| \`True\`/\`False\` como número (\`True + 1\`) o «verdadero/falso» de números y textos (\`if 5:\`) | \`RUN_015\`, \`RUN_006\` |
| Comparaciones encadenadas (\`1 < x < 5\`) | \`SYN_014\` |
| \`import\`, clases, módulos, \`len()\`, \`type()\`, \`round()\`, \`abs()\` y el resto de funciones de Python | No existen: solo \`print\`, \`input\`, \`int\`, \`float\`, \`str\` y \`range\` (\`SEM_003\`) |
| \`entrada()\` (el nombre antiguo) | \`SEM_003\`: «se llama input()» |
| Variables con tilde o \`ñ\` en el nombre | \`LEX_001\` |

---

## 12. Ejemplos

### Mundo 1 — instrucciones en orden

\`\`\`python
robot1.avanzar(3)
robot1.girar("sur")
robot1.avanzar(2)
robot1.hablar("¡Llegué!")
\`\`\`

### Mundo 2 — variables, operadores y entrada

\`\`\`python
MAXIMO = 100
actual = int(input())       # input() devuelve texto: se convierte con int()
faltante = MAXIMO - actual
print(faltante)

nombre = "Rob" + "ot1"      # concatenar
print(nombre)
print(17 / 4)               # 4.25  (/ siempre da decimal)
print(17 // 4)              # 4     (división entera)
print(17 % 5)               # 2     (residuo)
print("Total: " + str(5))   # str() convierte el número en texto
\`\`\`

### Mundo 3 — decisiones

\`\`\`python
if total > 21:
    print("Bust")
elif total == 21:
    print("Blackjack")
elif carta1 == carta2 and color1 == "roja":
    print("Par rojo")
else:
    print("Pide carta")

seguro = total <= 21
if not seguro:
    print("Peligro")
\`\`\`

### Mundo 4 — ciclos y el elevador

\`\`\`python
# Sube revisando cada piso y recoge a quien encuentre
for i in range(4):
    elevador.subir(1)
    if elevador.hayPasajero() and elevador.llevando() < 4:
        elevador.recoger()

# Baja a la planta baja y entrega
while elevador.piso() > 1:
    elevador.bajar(1)
elevador.soltar()
print(elevador.llevando())   # 0
\`\`\`

### Un error de tipos, como en Python

\`\`\`python
edad = input()      # edad vale "15" (texto)
print(edad + 1)
\`\`\`

\`\`\`text
SEM_011 · input() devuelve texto: conviértelo a número antes de operar
En Python, input() SIEMPRE devuelve un texto, aunque la persona escriba un número.
Conviértelo primero: int(edad) + 1   (usa float(input()) si el número lleva decimales).
\`\`\`

### Un error y su mensaje

\`\`\`python
if total > 21
    print("Bust")
\`\`\`

\`\`\`text
SYN_006 · Falta ":" al final de la línea del if
Después de la condición de un if (o del else) va el signo ":".
Ejemplo: if x > 10:
\`\`\`

---

## 13. Compatibilidad con Python 3

CQL es un **subconjunto de Python 3**: todo programa de CQL que funciona se comporta igual en Python real. La prueba \`test_python_compat.mjs\` ejecuta más de cien programas en el Python del sistema y en CQL y compara la salida (o el tipo de error: \`ZeroDivisionError\`, \`TypeError\`, \`ValueError\`, \`NameError\`).

**Diferencias deliberadas** (CQL es *más estricto* que Python para enseñar mejor; nunca acepta algo que Python rechace):

| En Python | En CQL | Por qué |
|---|---|---|
| \`True + 1\` es \`2\` | Error de tipos (\`RUN_015\`) | En Python \`bool\` es un tipo de número; en CQL se mantienen separados para evitar confusiones |
| \`"ab" * 3\` es \`"ababab"\` | Error de tipos (\`RUN_016\`) | La repetición de textos no se enseña |
| \`if 5:\`, \`while "x":\` (cualquier valor es «verdadero» o «falso») | La condición debe dar \`True\`/\`False\` (\`RUN_006\`) | Evita condiciones ambiguas |
| \`(-8) ** 0.5\` da un número complejo | Error (\`RUN_019\`) | CQL no tiene números complejos |
| Los enteros no tienen límite | Enteros de hasta 2⁵³ (\`RUN_018\`) | Representación interna |
| \`print(a, b)\` imprime los dos | Solo muestra el primero | Una sola salida por \`print\` |
| Todo el vocabulario de Python (listas, \`def\`, \`import\`…) | No existe | CQL es un subconjunto |
| \`print\`, \`input\`, \`int\`… son funciones que se pueden reasignar | Son nombres reservados (\`SEM_012\`) | Evita romper las funciones por accidente |

Además, CQL muestra algunos errores **antes de ejecutar** (el validador sabe, por ejemplo, que \`input()\` es texto) y con mensajes educativos; Python los daría al llegar a esa línea.
`;

writeFileSync(join(RAIZ, "docs", "REFERENCIA_LENGUAJE_CQL.md"), doc);
console.log(`Referencia generada: docs/REFERENCIA_LENGUAJE_CQL.md (${doc.split("\n").length} líneas, ${filasError.length} errores, ${CATALOGO.length} instrucciones del diccionario)`);
