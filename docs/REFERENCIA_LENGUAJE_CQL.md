# CQL — Referencia del lenguaje de CodeQuest

**CQL** (*CodeQuest Language*) es el lenguaje de programación que se escribe en el juego. **Es Python 3**: el código que escribes en CodeQuest es el mismo que ejecutarías en Python real (se comprueba comparando la salida con la del Python de verdad en `test_python_compat.mjs`). Es un subconjunto pequeño de Python pensado para enseñar —sus mensajes de error explican qué pasó y cómo arreglarlo— y hay unas pocas diferencias deliberadas, listadas en la sección 13.

Este documento reúne **todo lo que se puede hacer en CQL**: los lexemas y tokens, la gramática, los tipos de dato, los operadores, las sentencias, los objetos de cada mundo, el catálogo de errores y en qué nivel se desbloquea cada instrucción. Las tablas de tokens, errores y desbloqueos se generan automáticamente desde el código del juego (`node herramientas/generar_referencia_cql.mjs`).

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
| **1. Lexer** (análisis léxico) | Convierte el texto en una lista de **tokens** | Un carácter que CQL no conoce (`@`), un texto sin cerrar |
| **2. Parser** (análisis sintáctico) | Arma el **árbol de sintaxis (AST)** siguiendo la gramática | Falta un `:`, una sangría mal puesta, un `else` sin `if` |
| **3. Validador** (análisis semántico) | Revisa que lo escrito exista y esté permitido en esa fase | Variable sin definir, método que no existe, instrucción que aún no se desbloquea |
| **4. Intérprete** | Ejecuta el árbol paso a paso, esperando a que cada acción del mundo (mover el robot, voltear una carta, subir el elevador…) termine | División entre cero, ciclo infinito, el elevador se sale del edificio |

Después de ejecutar, el juego **evalúa la fase**: compara lo que hizo el programa con lo que pedía el nivel (en los niveles de lógica y ciclos, el programa se prueba además en varios casos —mesas o edificios— distintos).

**Límite de seguridad.** Si entre todos los ciclos (`while` y `for`) el programa da más de **1000 vueltas**, se detiene con el error `RUN_005` (Ciclo infinito detectado), para no congelar el navegador.

---

## 2. Lexemas y tokens

El **lexer** lee el código carácter por carácter y lo agrupa en **lexemas** (trozos con significado). A cada lexema le asigna un **token** (su categoría).

### 2.1 Alfabeto: qué caracteres se aceptan

| Clase | Caracteres | Notas |
|---|---|---|
| Letras | `a`–`z`, `A`–`Z`, `_` | **Solo ASCII**: una `ñ` o una letra con acento **fuera de un texto** da error `LEX_001` |
| Dígitos | `0`–`9` | |
| Operadores | `+ - * / // % ** = == != < > <= >=` | |
| Delimitadores | `( ) , . :` | |
| Comillas | `"` y `'` | Para escribir textos |
| Espacios | espacio, tabulador | Un tabulador cuenta como **4 espacios** |
| Fin de línea | salto de línea | Termina la instrucción |
| Comentario | `#` | Todo lo que sigue hasta el fin de la línea se ignora |

Cualquier otro carácter (por ejemplo `@  $  &  [  ]  {  }  ;  ?  \`) produce `LEX_001: Carácter no reconocido`. Un `!` solo es válido si va seguido de `=` (`!=`).

### 2.2 Lexemas: cómo se forma cada uno

| Lexema | Se escribe así | Expresión regular | Ejemplos | Token |
|---|---|---|---|---|
| **Identificador** | Empieza con letra o `_`; después letras, dígitos o `_`. **Distingue mayúsculas de minúsculas** (`Nombre` ≠ `nombre`) | `[A-Za-z_][A-Za-z0-9_]*` | `edad`, `total_2`, `MAXIMO`, `robot1` | `IDENTIFICADOR` |
| **Palabra clave** | Un identificador que está en la lista de palabras reservadas (no se pueden usar como nombre de variable) | `if elif else while for in and or not True False` | `if`, `True` | su propio token (`IF`, `TRUE`…) |
| **Número entero** | Uno o más dígitos | `[0-9]+` | `0`, `15`, `1000` | `NUMERO` |
| **Número decimal** | Dígitos, **punto** y al menos un dígito más (nunca coma) | `[0-9]+\.[0-9]+` | `1.75`, `0.5` | `NUMERO` |
| **Texto** | Caracteres entre comillas dobles o simples **en una sola línea**. No hay secuencias de escape (no existe `\n` ni `\"`) | `"[^"\n]*"` o `'[^'\n]*'` | `"Hola"`, `'robot'` | `TEXTO` |
| **Comentario** | `#` hasta el fin de la línea | `#[^\n]*` | `# esto se ignora` | *(no genera token)* |

Detalles que conviene saber:

- `2,5` **no** es un decimal: son tres lexemas (`2`, `,`, `5`). Los decimales usan punto.
- `.5` y `3.` **no** son números válidos: el punto decimal necesita dígitos a ambos lados.
- `2valor` se lee como el número `2` seguido del identificador `valor`: un nombre **no puede empezar con un dígito**.
- `true` y `false` (minúsculas) **no** son palabras clave: se leen como identificadores y el validador avisa que se escriben `True` y `False`.
- Dentro de un texto sí se aceptan acentos, `ñ` y cualquier símbolo, excepto el salto de línea y la comilla que lo cierra.

### 2.3 Sangría (indentación)

CQL, como Python, usa la **sangría** para agrupar instrucciones en bloques. El lexer la convierte en tokens:

- Al **empezar una línea con contenido**, compara su sangría con la de las líneas anteriores.
- Si está **más a la derecha** → emite `INDENTACION` (empieza un bloque).
- Si está **más a la izquierda** → emite una `DEDENTACION` por cada nivel que se cierra. La línea debe quedar alineada **exactamente** con alguna línea anterior; si no, error `SYN_010`.
- Las líneas vacías o con solo un comentario **no** cambian la sangría.
- Al terminar el código se cierran todos los bloques abiertos.
- Convención recomendada: **4 espacios** por nivel (la tecla **Tab** del editor inserta 4; **Shift+Tab** los quita; Ctrl+Enter ejecuta).

### 2.4 Tabla de tokens

Hay **40 tipos de token**. Esta tabla sale del propio lexer:

#### Palabras clave

| Token | Lexema | Para qué sirve |
|---|---|---|
| `IF` | `if` | Pregunta: ejecuta su bloque si la condición es True |
| `ELIF` | `elif` | Otra pregunta, si las anteriores fueron False |
| `ELSE` | `else` | Camino alternativo cuando ninguna pregunta fue True |
| `WHILE` | `while` | Ciclo: repite mientras la condición sea True |
| `FOR` | `for` | Ciclo con contador: for i in range(...) |
| `IN` | `in` | Une la variable del for con range(...) |
| `AND` | `and` | «y» lógico: True si las DOS condiciones son True |
| `OR` | `or` | «o» lógico: True si AL MENOS UNA es True |
| `NOT` | `not` | «no» lógico: invierte True/False |
| `TRUE` | `True` | Valor lógico verdadero (con T mayúscula) |
| `FALSE` | `False` | Valor lógico falso (con F mayúscula) |
| `DEF` | `def` | Define una función: def nombre(parametros): |
| `RETURN` | `return` | Devuelve un valor desde una función y la termina |
| `NONE` | `None` | El valor «nada»: lo que devuelve una función sin return |

#### Valores y nombres

| Token | Lexema | Para qué sirve |
|---|---|---|
| `IDENTIFICADOR` | `nombre` | Nombre de una variable, de una función de Python (print, input, int, float, str, range) o de un objeto del mundo (robot1, elevador, mesa) |
| `NUMERO` | `12  3.5` | Número entero o decimal (con punto) |
| `TEXTO` | `"hola"  'hola'` | Texto entre comillas dobles o simples |

#### Operadores aritméticos

| Token | Lexema | Para qué sirve |
|---|---|---|
| `SUMA` | `+` | Suma números / une textos |
| `RESTA` | `-` | Resta, o cambia el signo de un número |
| `MULT` | `*` | Multiplica |
| `DIV` | `/` | Divide: SIEMPRE da un decimal (17 / 4 es 4.25) |
| `DIV_ENTERA` | `//` | División entera: solo la parte entera, hacia abajo (17 // 4 es 4) |
| `MODULO` | `%` | Residuo de la división |
| `POTENCIA` | `**` | Potencia (2 ** 3 es 8) |

#### Operadores de comparación

| Token | Lexema | Para qué sirve |
|---|---|---|
| `IGUAL` | `==` | ¿Son iguales? |
| `DISTINTO` | `!=` | ¿Son distintos? |
| `MENOR` | `<` | ¿Es menor? |
| `MAYOR` | `>` | ¿Es mayor? |
| `MENOR_IGUAL` | `<=` | ¿Es menor o igual? |
| `MAYOR_IGUAL` | `>=` | ¿Es mayor o igual? |

#### Asignación y delimitadores

| Token | Lexema | Para qué sirve |
|---|---|---|
| `ASIGNACION` | `=` | Guarda un valor en una variable |
| `PUNTO` | `.` | Separa el objeto del método: robot1.avanzar |
| `PAREN_IZQ` | `(` | Abre una llamada o agrupa una expresión |
| `PAREN_DER` | `)` | Cierra una llamada o un grupo |
| `COMA` | `,` | Separa argumentos: range(1, 5) |
| `DOS_PUNTOS` | `:` | Cierra la línea de un if / elif / else / while / for y abre su bloque |

#### Estructura del programa (los inserta el lexer)

| Token | Lexema | Para qué sirve |
|---|---|---|
| `NUEVA_LINEA` | `salto de línea` | Termina una instrucción (una instrucción por línea) |
| `INDENTACION` | `(sube la sangría)` | Aparece al empezar un bloque: la línea está más a la derecha que la anterior |
| `DEDENTACION` | `(baja la sangría)` | Aparece al terminar un bloque: una por cada nivel que se cierra |
| `EOF` | `(fin del código)` | Marca el final del programa |

### 2.5 Ejemplos de tokenización

**Una asignación con input() convertido a entero**

```python
edad = int(input())
```

```text
IDENTIFICADOR("edad") ASIGNACION IDENTIFICADOR("int") PAREN_IZQ IDENTIFICADOR("input") PAREN_IZQ PAREN_DER PAREN_DER EOF
```

**Un if con su bloque (observa INDENTACION y DEDENTACION)**

```python
if total > 21:
    print("Bust")
```

```text
IF IDENTIFICADOR("total") MAYOR NUMERO(21) DOS_PUNTOS NUEVA_LINEA INDENTACION(4) IDENTIFICADOR("print") PAREN_IZQ TEXTO("Bust") PAREN_DER DEDENTACION EOF
```

**Un for con un método y un comentario (el comentario no genera tokens)**

```python
for i in range(3):
    elevador.subir(1)  # sube un piso
```

```text
FOR IDENTIFICADOR("i") IN IDENTIFICADOR("range") PAREN_IZQ NUMERO(3) PAREN_DER DOS_PUNTOS NUEVA_LINEA INDENTACION(4) IDENTIFICADOR("elevador") PUNTO IDENTIFICADOR("subir") PAREN_IZQ NUMERO(1) PAREN_DER DEDENTACION EOF
```

---

## 3. Gramática

Notación: `*` = cero o más veces, `+` = una o más, `?` = opcional, `|` = o. Lo que va entre comillas es un lexema literal.

```text
programa      := sentencia*
sentencia     := asignacion | llamada | condicional | mientras | para | def | return
def           := "def" IDENTIFICADOR "(" (IDENTIFICADOR ("," IDENTIFICADOR)*)? ")" bloque     ← solo al margen izquierdo
return        := "return" expresion?                                                            ← solo dentro de un def

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
```

Observaciones:

- Una instrucción por línea; **no hay** `;` ni llaves.
- `elif` se guarda internamente como un `if` anidado dentro del `else` del anterior.
- `for` **solo** acepta `range(...)` con 1, 2 o 3 argumentos.
- Una comparación no se puede encadenar: `1 < x < 5` es error (`SYN_014`); se escribe `x > 1 and x < 5`.

---

## 4. Tipos de dato y valores

CQL es de **tipado dinámico**: no se declara el tipo; lo decide el valor, y una variable puede guardar valores de distinto tipo en momentos distintos (`x = 5` y luego `x = "cinco"`).

| Tipo | Cómo se escribe | Ejemplos | Etiqueta en el panel de Memoria |
|---|---|---|---|
| **Entero** (`int`) | dígitos | `15`, `0`, `-3` (el signo es un operador) | `ENTERO` |
| **Decimal** (`float`) | dígitos, punto, dígitos | `1.75`, `2.5`, `5.0` | `DECIMAL` |
| **Texto** (`str`) | entre comillas | `"Ana"`, `'hola'` | `TEXTO` |
| **Lógico** (`bool`) | `True` / `False` | `True`, `3 > 2` | `LÓGICO` |
| **None** | `None` | lo que devuelve una función sin `return` | `NONE` |

Reglas importantes:

- **Los valores lógicos se imprimen como `True` / `False`** (con mayúscula).
- Una **condición** (de `if`, `elif`, `while`) debe dar `True` o `False`. CQL **no** convierte números ni textos en «verdadero/falso»: `if 5:` es el error `RUN_006`.
- **Entero y decimal son tipos distintos, como en Python:** `5` es un entero y `5.0` es un decimal (se muestra `5.0`). `10 / 2` da `5.0`, no `5`.
- **Los enteros llegan hasta unos 9 mil billones (2⁵³):** más allá da el error `RUN_018` (Python no tiene ese límite).
- **`input()` siempre devuelve texto**, aunque se escriba un número. Para calcular con él hay que convertirlo: `int(input())`, `float(input())`.
- Los decimales son de coma flotante, así que `0.1 + 0.2` muestra `0.30000000000000004`.
- Una variable creada **dentro** de un `if` o ciclo se puede usar después; pero si esa rama no llegó a ejecutarse, usarla da error de variable sin definir.
- La variable de un `for` (`i`) sigue existiendo al terminar el ciclo, con el último valor.
- Todas las variables son **globales** (no hay funciones ni ámbitos locales).

---

## 5. Operadores y precedencia

De **mayor** a **menor** prioridad (los de arriba se calculan primero; los paréntesis siempre mandan):

| Prioridad | Operador(es) | Operandos | Resultado |
|---|---|---|---|
| 1 (más alta) | `( )` paréntesis | cualquiera | — |
| 2 | `**` potencia (asociativa a la derecha) | números | número |
| 3 | `-` unario (cambio de signo) | número | número |
| 4 | `*`  `/`  `//`  `%` | números | número |
| 5 | `+`  `-` | números (o dos textos para `+`) | número (o texto) |
| 6 | `==`  `!=`  `<`  `>`  `<=`  `>=` | ver abajo | lógico |
| 7 | `not` | lógico | lógico |
| 8 | `and` | lógicos | lógico |
| 9 (más baja) | `or` | lógicos | lógico |

### Aritméticos

| Operador | Significado | Ejemplo | Resultado | Notas |
|---|---|---|---|---|
| `+` | suma | `5 + 3` | `8` | |
| `+` | **concatenar** textos | `"Rob" + "ot1"` | `"Robot1"` | solo texto con texto |
| `-` | resta / cambio de signo | `10 - 4`, `-x` | `6` | |
| `*` | multiplicación | `6 * 7` | `42` | |
| `/` | división | `17 / 4` | `4.25` | **SIEMPRE da un decimal**, aunque sea exacta: `10 / 2` es `5.0`. Dividir entre 0 → `SEM_006` (ZeroDivisionError) |
| `//` | división entera | `17 // 4` | `4` | Solo la parte entera, **hacia abajo**: `-7 // 2` es `-4`. Con algún decimal da decimal (`7.5 // 2` es `3.0`). Entre 0 → `SEM_006` |
| `%` | residuo | `17 % 5` | `2` | El signo del resultado es el del divisor, como en Python: `-5 % 3` es `1` y `5 % -3` es `-1`. Con 0 → `SEM_006` |
| `**` | potencia | `2 ** 3` | `8` | Con exponente negativo da decimal: `2 ** -1` es `0.5`. `0 ** -1` → `SEM_006`; `(-8) ** 0.5` → `RUN_019` |

Entero con entero da entero (`+ - * // % **`); si algún lado es decimal, el resultado es decimal.

**Sin mezclas silenciosas (como el TypeError de Python):** `+` une texto con texto o suma número con número. Mezclarlos (`"5" + 3`) es el error `RUN_015`, y el juego lo detecta ANTES de ejecutar cuando los tipos se conocen: «TypeError: No puedes sumar un texto ("5") con un número (3) directamente. Usa int("5") o str(3)». Usar `- * / // % **` con textos es `RUN_016`. Operar con lo que devolvió `input()` sin convertirlo (`input() + 5`) es `SEM_011`, con la solución `int(input()) + 5`.

### Comparación

| Operador | Pregunta | Entre qué tipos |
|---|---|---|
| `==`  `!=` | ¿iguales? / ¿distintos? | **cualquier** tipo. Tipos distintos nunca son iguales (`3 == "3"` es `False`); `1 == 1.0` es `True` |
| `<`  `>`  `<=`  `>=` | menor / mayor / … | solo **número con número** o **texto con texto** (orden alfabético); otra mezcla → `RUN_007` |

### Lógicos

| Operador | Se evalúa | Notas |
|---|---|---|
| `and` | True solo si ambos lados son True | **Cortocircuito:** si el lado izquierdo es `False`, el derecho ni se calcula (así `x != 0 and 10 / x > 1` no divide entre cero) |
| `or` | True si alguno es True | Cortocircuito: si el izquierdo es `True`, el derecho no se calcula |
| `not` | invierte | `not 5 > 3` es `not (5 > 3)` → `False` |

Los operandos de `and`, `or` y `not` **deben** ser `True`/`False` (si no, `RUN_011`).

---

## 6. Sentencias

### 6.1 Asignación

```python
nombre = "Ana"        # crea la variable
nombre = "Beto"       # reasigna: el valor anterior se pierde
total = a + b * 2     # el lado derecho es cualquier expresión
```

Una sola variable por línea (no existe `x = y = 3`) y sin operadores abreviados (no existe `x += 1`; se escribe `x = x + 1`). El lado derecho puede incluir llamadas con valor: `pos = robot1.posicion()`, `n = int(input())`. Los nombres `print`, `input`, `int`, `float`, `str` y `range` están reservados (`SEM_012`).

### 6.2 Condicionales

```python
if total > 21:
    print("Bust")
elif total == 21:
    print("Blackjack")
else:
    print("Sigue")
```

- Se evalúan en orden y **solo se ejecuta la primera rama verdadera**.
- `elif` y `else` van **alineados** con su `if`; `else` es siempre la última rama y no lleva condición.
- Se pueden **anidar** (un `if` dentro de otro); la sangría decide a cuál pertenece cada línea.
- Un `=` donde va `==` da `SYN_011`.

### 6.3 Ciclo `while`

```python
piso = 1
while piso < 5:
    elevador.subir(1)
    piso = piso + 1
```

Pregunta **antes** de cada vuelta; termina cuando la condición es `False`. Dentro del ciclo debe cambiar algo, o nunca terminará (`RUN_005` a las 1000 vueltas).

### 6.4 Ciclo `for` con `range`

| Forma | Recorre | Ejemplo | Valores de `i` |
|---|---|---|---|
| `range(n)` | de 0 a n−1 | `for i in range(3):` | 0, 1, 2 |
| `range(a, b)` | de a a b−1 | `for i in range(2, 6):` | 2, 3, 4, 5 |
| `range(a, b, paso)` | de a hacia b saltando `paso` (puede ser negativo) | `for i in range(5, 0, -2):` | 5, 3, 1 |

Los argumentos pueden ser expresiones, pero deben dar **enteros** y el paso no puede ser 0 (`RUN_010`). Si el rango está vacío (`range(0)`, `range(3, 0)`) el bloque no se ejecuta. Los ciclos se pueden **anidar**.

### 6.5 Llamadas

- **Funciones integradas** como instrucción: `print("hola")`.
- **Métodos de un objeto**: `robot1.avanzar(3)`, `elevador.subir(1)`, `mesa.voltear()`.
- Los métodos que **devuelven valor** también se pueden usar dentro de expresiones: `if elevador.hayPasajero():`, `print(robot1.energia())`. Usar en una expresión un método que no devuelve valor es el error `SEM_009`.

### 6.6 Funciones: `def`, parámetros y `return` (Mundo 5)

```python
def calcular_area(ancho, alto):     # define la función (aún no se ejecuta nada)
    return ancho * alto             # devuelve el resultado y termina la función

a = calcular_area(2, 3)            # llama a la función: a vale 6
print(calcular_area(4, 5))         # 20
```

- **Definir y llamar.** `def` solo *guarda* la función; cada llamada `nombre(valores)` la ejecuta. La función debe estar definida **antes** de la línea que la llama (`SEM_017`), pero dentro de una función sí se puede llamar a otra que se defina después.
- **Parámetros.** Son los nombres entre paréntesis del `def`; cada llamada debe dar **exactamente un valor por parámetro** (`SEM_014`, TypeError).
- **`return`.** Devuelve un valor y termina la función ahí mismo (lo que haya después no se ejecuta). Sin `return` —o con `return` a secas— la función devuelve `None`, y operar con `None` da un error de tipos.
- **Variables locales.** Lo que se asigna dentro de una función es **local**: no existe fuera (`SEM_015`) y, si la función asigna una variable, esa variable es local en TODA la función, aunque haya una global con el mismo nombre (`RUN_023`, UnboundLocalError). Las variables globales sí se pueden **leer** desde la función. No existen `global` ni `nonlocal`.
- **Recursión.** Una función puede llamarse a sí misma; el límite es de 100 llamadas anidadas (`RUN_021`, RecursionError).
- **Nombre sin paréntesis** (`x = doble`) no ejecuta nada: error `SEM_016`. `def` solo va al margen izquierdo (`SYN_018`); `return` fuera de una función es `SYN_017`. Los nombres `print`, `input`, `int`, `float` y `str` no se pueden usar como nombre de función ni de parámetro.
- **Mundo 5:** cada `def` se dibuja como una **máquina** en la fábrica; cada llamada la enciende (entra el argumento, sale el `return`).

### 6.7 Comentarios y líneas vacías

```python
# Un comentario en su propia línea
x = 5   # o al final de una instrucción
```

---

## 7. Funciones integradas

Son las de Python (más `range`, que únicamente vive dentro del `for`). `entrada()` **ya no existe**: se llama `input()`.

| Función | Qué hace | Devuelve | Detalles |
|---|---|---|---|
| `print(valor)` | Muestra un valor en el panel de **Salida** | nada | Necesita un valor (`print()` es `SEM_005`). Con varios argumentos solo se muestra el primero. Los lógicos salen como `True`/`False` y los decimales como en Python (`5.0`, `4.25`) |
| `input()` / `input("mensaje")` | Pausa el programa y espera a que la persona escriba un dato. El mensaje opcional se le muestra en la terminal | **siempre texto** | `input()` devuelve `"12"` aunque se escriba 12. Para calcular: `int(input())` o `float(input())`. Más de un argumento → `SEM_013` |
| `int(valor)` | Convierte a número entero | entero | `int("12")` → 12; `int(3.9)` → 3 (corta, no redondea); `int(" 7 ")` → 7. Un texto que no parece un entero (`int("hola")`, `int("3.5")`) → **ValueError** `RUN_017`: «El valor ingresado no es un número válido» |
| `float(valor)` | Convierte a número decimal | decimal | `float("3.5")` → 3.5; `float(3)` → 3.0. Texto inválido → `RUN_017` |
| `str(valor)` | Convierte a texto | texto | `str(5)` → `"5"`; `str(2.5)` → `"2.5"`; `str(True)` → `"True"`. Sirve para unir números con textos: `"Total: " + str(5)` |
| `range(...)` | Genera la cuenta de un `for` | — | Ver 6.4. Sus argumentos deben ser enteros |

`int`, `float` y `str` necesitan **exactamente un** valor (`SEM_013`).

---

## 8. Objetos y métodos de cada mundo

Cada mundo tiene **su propio objeto** (o ninguno). Usar un objeto que no es del mundo actual da `SEM_010`. Un método solo se puede usar cuando el nivel lo permite (si aún no se desbloquea: `SEM_007`; si no existe en absoluto: `SEM_002`).

| Mundo | Objeto | Métodos |
|---|---|---|
| 1 · Despertar (y Laboratorio Libre) | `robot1` | hablar(), avanzar(n), retroceder(n), girar(), mirar() → valor, posicion() → valor, energia() → valor, recoger(), soltar() |
| 2 · Memoria | *(ninguno)* | solo variables, `print`, `input` y las conversiones `int`, `float`, `str` |
| 3 · Lógica | `mesa` | poner_carta(n), voltear() |
| 4 · Automatización | `elevador` | subir(n), bajar(n), recoger(), soltar(), piso() → valor, hayPasajero() → valor, llevando() → valor |
| 5 · Modularidad | `robot1` (a veces) | los del robot; la fábrica dibuja cada función como una máquina |
| Nivel 0 (antes del Mundo 1) | *(sin código)* | se ordenan tarjetas de un diagrama de flujo: Inicio, pasos y Fin |

### 8.1 `robot1` (cuadrícula del laboratorio)

El laboratorio es una cuadrícula con **(0, 0) en la esquina superior izquierda**; la x crece hacia el este (derecha) y la y hacia el sur (abajo). En el Laboratorio Libre es de 10 × 10.

| Método | Qué hace | Detalles |
|---|---|---|
| `avanzar(n)` | Avanza n casillas en la dirección que mira | Gasta energía (1 por casilla, según el nivel). Si se sale de la cuadrícula: `RUN_001`; si choca con un obstáculo: `RUN_003` |
| `retroceder(n)` | Retrocede n casillas | Igual que avanzar pero hacia atrás |
| `girar("dirección")` | Cambia hacia dónde mira | Direcciones válidas: `"norte"`, `"sur"`, `"este"`, `"oeste"`, y los alias `"arriba"`, `"abajo"`, `"derecha"`, `"izquierda"` |
| `hablar("texto")` | Robot1 dice un mensaje (globo + panel de Salida) | |
| `recoger()` | Recoge el objeto de la casilla donde está | Si al terminar la fase Robot1 no llegó adonde debía, el juego lo dice con `RUN_002` |
| `soltar()` | Deja el objeto que lleva en la casilla actual | |
| `mirar()` → texto | Devuelve hacia dónde mira (`"este"`, …) | |
| `posicion()` → texto | Devuelve la posición como texto `"(x,y)"` | |
| `energia()` → número | Devuelve la energía que le queda | |

### 8.2 Mundo 2 · Memoria (sin objetos)

El «Centro de Recuperación» dibuja cada variable como un **chip de memoria** (con su nombre, valor y tipo) y muestra los cables por donde viaja cada dato. No hay robot: se programa solo con variables, operadores, `print`, `input` y las conversiones `int`, `float` y `str`.

### 8.3 Mundo 3 · Lógica (la mesa de cartas)

Cada mesa trae **variables ya definidas** que el programa puede leer:

| Variable | Contenido |
|---|---|
| `carta1`, `carta2`, `carta3`… | El valor de cada carta de la mano (número) |
| `total` | La suma de los valores de la mano |
| `color1`, `color2`… | `"roja"` o `"negra"` (cuando el nivel lo habilita) |
| `numero` | Igual que `total` (solo en el Nivel 1 del Mundo 3) |

Métodos de la mesa (solo en las fases «Libre»; son **visuales**: no cambian `carta1`, `total`, etc.):

| Método | Qué hace |
|---|---|
| `mesa.poner_carta(valor, color)` | Pone una carta nueva (color `"roja"` o `"negra"`; máximo 6 cartas) |
| `mesa.voltear()` | Voltea las cartas: si hay alguna boca abajo las muestra todas; si ya están todas visibles, las tapa |

Durante la ejecución la mesa **juzga cada `if`/`elif`** con un sello ✓ VERDADERO / ✗ FALSO, y las cartas se iluminan en verde o rojo. Lo que se imprime con `print` aparece como mensaje central de la mesa.

### 8.4 `elevador` (edificio de 5 pisos)

El **piso 1 es la planta baja**; el edificio llega hasta el piso 5. Los pasajeros esperan en distintos pisos y hay que **llevarlos a la planta baja**. La cabina tiene capacidad limitada (4 pasajeros; 2 en la «cabina chica») y **energía** (empieza en 100 y cada piso recorrido gasta 1).

| Método | Qué hace | Errores posibles |
|---|---|---|
| `subir(n)` | Sube n pisos (de uno en uno) | Salirse del edificio (`RUN_008`), sin energía (`RUN_012`) |
| `bajar(n)` | Baja n pisos | Igual |
| `recoger()` | Sube a la cabina a **todos** los que esperan en este piso | Cabina llena (`RUN_009`) |
| `soltar()` | Baja a todos los pasajeros: en la planta baja quedan **entregados**; en otro piso se quedan esperando ahí | |
| `piso()` → número | Piso donde está el elevador | |
| `hayPasajero()` → lógico | ¿Hay alguien esperando en este piso? | |
| `llevando()` → número | Cuántas personas van en la cabina | |

---

### 8.5 Mundo 5 · Modularidad (la fábrica de robots)

No hay un objeto nuevo: lo que se dibuja son **tus funciones**, como una **línea de ensamble con visualización paso a paso**:

| Qué ocurre en el código | Qué se ve en la fábrica |
|---|---|
| `def nombre(...)` | Se **construye una máquina** sobre la línea (no trabaja todavía) |
| Una **llamada** `nombre(5, 3)` | Una **caja de materiales** `[5, 3]` viaja por la cinta hasta la máquina |
| La función se ejecuta | La máquina se **ilumina** y aparecen **chips** flotantes con las variables locales: `a = 5`, `b = 3`, `resultado = 8` |
| `print(...)` | Sale una **burbuja de texto** |
| `return valor` | Sale una **caja de producto terminado** (verde, brillante) con el valor |
| Sin `return` | Sale una **caja gris** con `None` |

El panel de estado lista las máquinas, cuántas llamadas van y la última (`doble(4) → 8`). Las variables locales no aparecen en Memoria. Algunos niveles añaden una pista con **Robot1** (`robot1.avanzar(n)` dentro de una función) para llegar a una bandera.

Validaciones propias de la fábrica (las usan los niveles): la función *se definió* con tal nombre y número de parámetros, *se llamó* al menos N veces, y *devolvió* un valor (no solo lo mostró).

### 8.6 Nivel 0 y Niveles Jefe

- **Nivel 0 (antes del Mundo 1):** no se escribe código. Se hace clic en las tarjetas de un **diagrama de flujo** (`Inicio`, pasos como `Caminar 3 pasos` o `Abrir la puerta`, y `Fin`) en el orden correcto; cada tarjeta correcta se ejecuta en un pasillo y, si no tocaba todavía, Robot1 choca y se empieza de nuevo. Es el equivalente visual de «un programa es una lista de instrucciones en orden».
- **Nivel 8 del Mundo 5 · El Gran Ensamblaje (Jefe):** hay que definir exactamente tres funciones, `cabeza()`, `brazos()` y `piernas()`, y llamarlas en ese orden; un **Robot1 gigante** se arma en pantalla conforme se ejecutan las llamadas. Sin pistas y con el editor en blanco.
- **Niveles Jefe** (último nivel de los Mundos 1 a 4): usan el CQL de su mundo, pero **sin botón de pistas**, con el editor en blanco y un solo enunciado; los de los Mundos 2 a 4 se prueban en varios casos.

## 9. Qué se desbloquea y cuándo

El lenguaje se **va abriendo nivel por nivel**: cada fase declara qué instrucciones permite, y usar una que todavía no se ha aprendido da un error educativo (`SEM_007`: «no está permitido todavía en este nivel»), no un fallo misterioso. Los **permisos** que puede abrir una fase son: `print`, `input`, `int`, `float`, `str`, `asignacion`, `if`, `elif`, `else`, `while`, `for`, `and`, `or`, `not` y `booleanos` (los comparadores y `True`/`False` se permiten cuando está abierto `if`, `while` o `booleanos`), más la lista de métodos del objeto del mundo.

Esta tabla es la del **Diccionario** del juego:

| Instrucción | Grupo | Desde dónde se puede usar | Qué hace |
|---|---|---|---|
| `print(valor)` | Salida | Mundo 1 · Nivel 1 (Despertar), fase 1.1 | Muestra un valor en el panel de Salida. El texto va entre comillas. |
| `robot1.avanzar(n)` | Movimiento | Mundo 1 · Nivel 2 (Primeros movimientos), fase 2.1 | Robot1 avanza n casillas en la dirección a la que mira. |
| `robot1.hablar("texto")` | Salida | Mundo 1 · Nivel 3 (Haz que me entienda), fase 3.1 | Robot1 dice un texto: aparece una burbuja en el mundo 2D y una línea en Salida. No es lo mismo que print(). |
| `robot1.girar(direccion)` | Movimiento | Mundo 1 · Nivel 3 (Haz que me entienda), fase 3.3 | Cambia hacia dónde mira Robot1. Direcciones válidas: "norte", "sur", "este", "oeste". |
| `robot1.retroceder(n)` | Movimiento | Mundo 1 · Nivel 4 (¿Cuánto?), fase 4.1 | Robot1 retrocede n casillas sin cambiar la dirección a la que mira. |
| `input()` | Entrada | Mundo 1 · Nivel 6 (La terminal), fase 6.1 | Pausa el programa y pide un dato a quien está jugando. Como en Python, input() SIEMPRE devuelve texto, aunque se escriba un número: si lo necesitas como número, conviértelo con int() o float(). Puede llevar un mensaje: input("¿Cuántos pisos?"). |
| `int(valor)` | Conversión | Mundo 1 · Nivel 6 (La terminal), fase 6.3 | Convierte un valor en número entero: int("12") vale 12 y int(3.9) vale 3. Si el texto no parece un número entero (int("hola"), int("3.5")) da un ValueError. Lo típico: int(input()). |
| `float(valor)` | Conversión | Mundo 2 · Nivel 6 (Información del exterior), fase 14.4 | Convierte un valor en número decimal: float("3.5") vale 3.5 y float(3) vale 3.0. Si el texto no parece un número, da un ValueError. |
| `str(valor)` | Conversión | Mundo 2 · Nivel 8 (Módulos que se combinan), fase 16.4 | Convierte un valor en texto: str(5) vale "5". Sirve para unir números con textos: "Total: " + str(5). |
| `robot1.recoger()` | Objetos | Mundo 1 · Nivel 8 (La salida), fase 8.1 | Recoge el objeto que haya en la casilla donde está Robot1. |
| `nombre = valor` | Variables | Mundo 2 · Nivel 1 (Necesito recordar), fase 9.1 | Guarda un valor con un nombre para reutilizarlo después. Aparece en el panel de Memoria. |
| `+  -  *  /  **` | Operadores | Mundo 2 · Nivel 4 (Cálculo de energía), fase 12.2 | Operaciones aritméticas. Primero se resuelve ** (potencia), después * y /, y al final + y -, igual que en matemáticas. Ojo: / SIEMPRE da un decimal (10 / 2 vale 5.0). |
| `a // b   a % b` | Operadores | Mundo 2 · Nivel 5 (Calcula el reparto), fase 13.1 | a // b es la división entera (solo la parte entera: 17 // 4 vale 4). a % b devuelve el residuo (17 % 5 vale 2). |
| `def nombre(parametros):` | Funciones | Mundo 5 · Nivel 1 (Construyendo máquinas), fase 48.1 | Define una función: un bloque de código con nombre que puedes usar (llamar) las veces que quieras. Los parámetros son los valores que recibe. Las variables que crees dentro son locales: solo existen ahí. |
| `nombre(valores)` | Funciones | Mundo 5 · Nivel 1 (Construyendo máquinas), fase 48.1 | Llama (ejecuta) una función que ya definiste con def. Si tiene parámetros, hay que darle un valor por cada uno. |
| `return valor` | Funciones | Mundo 5 · Nivel 4 (El producto terminado), fase 51.1 | Termina la función y devuelve un valor a quien la llamó: resultado = calcular_doble(4). Si una función no tiene return (o solo dice return), devuelve None. |
| `None` | Funciones | Mundo 5 · Nivel 4 (El producto terminado), fase 51.1 | El valor que significa «nada». Una función sin return devuelve None, y print(None) muestra None. |
| `robot1.energia()` | Estado | Mundo 1 · Nivel 8 (La salida), fase 8.3 | Devuelve la energía que le queda a Robot1. Pruébala en el Laboratorio Libre. |
| `robot1.posicion()` | Estado | Mundo 1 · Nivel 8 (La salida), fase 8.3 | Devuelve la posición actual de Robot1 como (columna,fila). Pruébala en el Laboratorio Libre. |
| `robot1.mirar()` | Estado | Mundo 1 · Nivel 8 (La salida), fase 8.3 | Devuelve la dirección hacia la que mira Robot1. Pruébala en el Laboratorio Libre. |
| `if condición:` | Decisiones | Mundo 3 · Nivel 1 (Pasarse de 21), fase 20.1 | Ejecuta las líneas con sangría solo si la condición es verdadera (True). Si es falsa, las salta. |
| `else:` | Decisiones | Mundo 3 · Nivel 2 (Ganar o perder), fase 21.1 | El camino alternativo de un if: se ejecuta cuando la condición del if es falsa. |
| `==  !=  <  >  <=  >=` | Decisiones | Mundo 3 · Nivel 3 (Comparar es preguntar), fase 22.1 | Comparan dos valores y dan True o False. Ojo: un solo = guarda un valor; dos == preguntan si son iguales. |
| `a and b   a or b` | Decisiones | Mundo 3 · Nivel 5 (Dos condiciones a la vez), fase 24.1 | and es verdadero si AMBAS condiciones lo son; or, si al menos UNA lo es. |
| `not x   True   False` | Decisiones | Mundo 3 · Nivel 6 (O, y no), fase 25.1 | True y False son valores lógicos que se pueden guardar en variables. not invierte uno: not True es False. |
| `elif condición:` | Decisiones | Mundo 3 · Nivel 7 (Varios caminos), fase 26.1 | Añade otra pregunta a un if. Se evalúan en orden y solo se ejecuta la primera rama verdadera. |
| `mesa.poner_carta(valor, color)` | Decisiones | Mundo 3 · Nivel 9 (El aviso del crupier), fase 28.3 | Pone una carta nueva en la mesa; color es "roja" o "negra". Es solo visual: no cambia total ni carta1. Pruébala en la Mesa libre. |
| `mesa.voltear()` | Decisiones | Mundo 3 · Nivel 9 (El aviso del crupier), fase 28.3 | Voltea las cartas de la mesa: las que están boca abajo se muestran y, si ya están todas visibles, las vuelve a tapar. |
| `while condición:` | Ciclos | Mundo 4 · Nivel 1 (El ascensor automático), fase 32.1 | Repite sus líneas con sangría MIENTRAS la condición sea verdadera. Dentro hay que cambiar algo, o no termina. |
| `for i in range(n):` | Ciclos | Mundo 4 · Nivel 2 (Repetir con for), fase 33.1 | Repite n veces. range(n) cuenta de 0 a n-1; range(a, b) de a a b-1; range(a, b, paso) salta de paso en paso. |
| `elevador.subir(n)` | Elevador | Mundo 4 · Nivel 1 (El ascensor automático), fase 32.1 | Sube el elevador n pisos. Si se sale del edificio (pisos 1 a 5) da error. |
| `elevador.bajar(n)` | Elevador | Mundo 4 · Nivel 3 (Contar repeticiones), fase 34.1 | Baja el elevador n pisos. El piso 1 es la planta baja. |
| `elevador.piso()` | Elevador | Mundo 4 · Nivel 5 (El bucle infinito), fase 36.2 | Devuelve el piso donde está el elevador. Sirve para las condiciones de un while. |
| `elevador.recoger()` | Elevador | Mundo 4 · Nivel 6 (Recoger pasajeros), fase 37.1 | Sube a la cabina a los pasajeros que esperan en este piso (caben 4). Con elevador.hayPasajero() se sabe si hay alguien. |
| `elevador.soltar()` | Elevador | Mundo 4 · Nivel 6 (Recoger pasajeros), fase 37.2 | Baja de la cabina a todos los pasajeros. En la planta baja quedan entregados. |
| `elevador.llevando()` | Elevador | Mundo 4 · Nivel 9 (Evacuación completa), fase 40.2 | Devuelve cuántos pasajeros van en la cabina (personas, no pisos). |

Los operadores aritméticos `+ - *` se usan desde el Mundo 2; `/`, `//` y `%` se enseñan en el Nivel 5 del Mundo 2 (Calcula el reparto). `**` está disponible en todo CQL aunque ningún nivel lo exige.

---

## 10. Catálogo de errores

Todos los errores de CQL tienen un **código**, un **mensaje**, una explicación (*qué significa*) y una sugerencia (*cómo se arregla*). Los textos entre ‹ › son marcadores que el juego reemplaza por el nombre, valor o número de línea real. Estos códigos son los que aparecen en el panel de administración y en la exportación a CSV para la tesis (columna «Error más frecuente»).

#### Léxicos (el lexer no entiende un carácter o un texto)

| Código | Mensaje | Qué significa | Cómo se arregla |
|---|---|---|---|
| `LEX_001` | Carácter no reconocido: ‹x› | El carácter "‹x›" no forma parte del lenguaje de este juego (un subconjunto de Python). | Revisa que no haya símbolos de más, como @, $ o ?. |
| `LEX_002` | Texto sin cerrar | Todo texto debe abrir y cerrar con la misma comilla. | Agrega la comilla que falta, por ejemplo: "Hola". |

#### Sintácticos (la estructura del código está mal escrita)

| Código | Mensaje | Qué significa | Cómo se arregla |
|---|---|---|---|
| `SYN_001` | Falta un paréntesis de cierre en la línea N | Cada paréntesis que abres debe cerrarse. | Agrega el ) que falta al final de la instrucción. |
| `SYN_002` | Falta un paréntesis de apertura en la línea N | Las funciones y métodos necesitan paréntesis para recibir argumentos. | Agrega ( justo después del nombre de la función o método. |
| `SYN_003` | Se esperaba = después de nombre | Para crear una variable necesitas asignarle un valor con =. | Escribe algo como: nombre = "Robot1" |
| `SYN_004` | Instrucción incompleta en la línea N | La instrucción se quedó a medias. | Revisa que la línea tenga todas sus partes, por ejemplo robot1.avanzar(3). |
| `SYN_005` | Se esperaba un valor después de = | Toda asignación necesita un valor a la derecha del =. | Ejemplo: pasos = 3 |
| `SYN_006` | Falta ":" al final de la línea del ‹x› | Después de la condición de un ‹x› (o del else) va el signo ":". | Ejemplo: ‹x› x > 10: |
| `SYN_007` | Falta la sangría después de los dos puntos | Las instrucciones que pertenecen al bloque van en las líneas de abajo, movidas 4 espacios a la derecha (tecla Tab). | Ejemplo: if x > 10:     print("grande") |
| `SYN_008` | Sangría inesperada | Solo se mueven a la derecha las líneas que están dentro de un if, elif, else, while o for. | Quita los espacios del inicio de esa línea (Shift+Tab), o agrega arriba la línea que termina en ":". |
| `SYN_009` | Hay un ‹x› sin if antes | ‹x› siempre acompaña a un if: va justo debajo del bloque del if y alineado con él. | Revisa que el ‹x› empiece en la misma columna que su if. |
| `SYN_010` | La sangría no coincide con ninguna línea anterior | Al salir de un bloque, la línea debe quedar alineada exactamente con la línea que lo abrió. | Usa 4 espacios por nivel (tecla Tab) y alinea las líneas del mismo nivel. |
| `SYN_011` | Usaste = donde va == | Un solo = guarda un valor en una variable. Para PREGUNTAR si dos valores son iguales se usa ==. | Ejemplo: if total == 21: |
| `SYN_012` | El for necesita range(...) | En CodeQuest el for repite una cantidad de veces usando range(). | Ejemplo: for i in range(3): |
| `SYN_013` | range() recibe 1, 2 o 3 números | range(n) cuenta de 0 a n-1; range(a, b) cuenta de a a b-1; range(a, b, paso) salta de paso en paso. | Ejemplo: range(3) repite 3 veces. |
| `SYN_014` | No se pueden encadenar dos comparaciones | Cada comparación se hace por separado y se unen con and / or. | En vez de 1 < x < 5, escribe: x > 1 and x < 5 |
| `SYN_015` | ‹x› después de def | Una función se define así: la palabra def, el nombre, paréntesis con los parámetros y dos puntos. | Ejemplo: def saludar():   o   def sumar(a, b): |
| `SYN_016` | Los parámetros de la función están mal escritos | Los parámetros son nombres de variable separados por comas, entre los paréntesis del def. | Ejemplo: def calcular_area(ancho, alto): |
| `SYN_016` | SyntaxError: el parámetro "‹x›" está repetido | Cada parámetro necesita un nombre distinto. | Cambia el nombre de uno de los parámetros. |
| `SYN_017` | SyntaxError: "return" solo se puede usar dentro de una función | return devuelve un valor desde una función y termina esa función. Fuera de una función no tiene sentido. | Escribe el return dentro del def, con sangría. |
| `SYN_018` | Las funciones se definen al inicio del programa, no dentro de otros bloques | En CodeQuest, def va al margen izquierdo: no dentro de un if, un ciclo u otra función. | Mueve el def al margen izquierdo, sin sangría. |
| `SYN_019` | Los decimales se escriben con punto, no con coma (línea ‹x›) | En Python los decimales se escriben con punto, no con coma. Con una coma, Python ve dos números separados, no un decimal. | Cambia la coma por un punto: por ejemplo, 2.5 en lugar de 2,5. |

#### Semánticos (la instrucción existe pero no se puede usar así aquí)

| Código | Mensaje | Qué significa | Cómo se arregla |
|---|---|---|---|
| `SEM_001` | ‹x› no es un valor: se escribe False | Los valores lógicos se escriben con mayúscula inicial: True y False. | Escribe False |
| `SEM_001` | La variable ‹x› no existe todavía | Recuerda: antes de usar una variable, debes darle un valor. | Ejemplo: ‹x› = 3 |
| `SEM_002` | El método ‹x›.‹x› no existe | El objeto ‹x› solo entiende los métodos definidos en su manual de instrucciones. | Revisa cómo se llama el método que quieres usar. |
| `SEM_003` | La función ‹x› no existe | Aquí solo se usan estas funciones de Python: print, input, int, float y str (más las que definas tú con def). | Por ejemplo, usa print(...) para mostrar algo en pantalla. |
| `SEM_004` | ‹x›.‹x›() necesita un número | Este movimiento solo acepta una cantidad numérica. | Ejemplo: ‹x›.‹x›(3) o ‹x›.‹x›(pasos). |
| `SEM_004` | robot1.avanzar() necesita un número | Robot1 solo puede avanzar una cantidad numérica de casillas. | Ejemplo: robot1.avanzar(3) o robot1.avanzar(pasos). |
| `SEM_005` | print() necesita un valor | print() muestra algo en pantalla, así que necesita saber qué mostrar. | Ejemplo: print("Hola mundo") |
| `SEM_006` | ZeroDivisionError: no puedes dividir entre cero | Dividir entre cero (con /, // o %) no tiene un resultado definido, y Python lo prohíbe. | Revisa el número por el que estás dividiendo. |
| `SEM_007` | ‹x› no está permitido todavía en este nivel | Cada nivel solo desbloquea ciertas instrucciones. | Usa únicamente las instrucciones que aparecen en 'Disponible en esta fase'. |
| `SEM_007` | El método ‹x› no está permitido en este nivel | Cada nivel solo desbloquea ciertas instrucciones. | Usa únicamente las instrucciones permitidas que se muestran en 'Aprende'. |
| `SEM_007` | La función ‹x› no está permitida en este nivel | Cada nivel solo desbloquea ciertas instrucciones. | Usa únicamente las instrucciones permitidas que se muestran en 'Aprende'. |
| `SEM_007` | Las variables no están permitidas todavía en este nivel | Cada nivel solo desbloquea ciertas instrucciones. | Usa únicamente las instrucciones permitidas que se muestran en 'Aprende'. |
| `SEM_008` | "‹x›" no es una dirección válida | robot1.girar() solo entiende "norte", "sur", "este" u "oeste" (o sus equivalentes). | Prueba con robot1.girar("norte"). |
| `SEM_009` | ‹x› no devuelve ningún valor | Solo algunas instrucciones producen un valor que puedas guardar o mostrar. | Usa input(), robot1.mirar(), robot1.posicion() o robot1.energia() cuando necesites un valor. |
| `SEM_010` | El objeto ‹x› no existe aquí | En este mundo el único objeto que puedes usar es ‹x›. | Ejemplo: ‹x›.metodo(...) |
| `SEM_011` | input() devuelve texto: conviértelo a número antes de operar | En Python, input() SIEMPRE devuelve un texto, aunque la persona escriba un número. Un texto no se puede sumar, restar ni multiplicar con un número. | Conviértelo primero: ‹x›   (usa float(input()) si el número lleva decimales). |
| `SEM_012` | "‹x›" es una función de Python: no puede usarse como nombre de variable | print, input, int, float, str y range ya significan algo en Python. Si los usas como nombre de variable, dejarías de poder usarlos. | Elige otro nombre, por ejemplo ‹x›_1 o mi_‹x›. |
| `SEM_013` | TypeError: ‹x›() recibe ‹x› | ‹x›() necesita exactamente un valor para convertir. | Ejemplo: ‹x›(input()) |
| `SEM_014` | TypeError: ‹x›() recibe ‹x› argumento(s) pero le diste ‹x› | Al llamar a una función hay que darle exactamente un valor por cada parámetro que tiene en su def. | Dale ‹x› valor(es) entre paréntesis: ‹x›() |
| `SEM_015` | NameError: la variable "‹x›" solo existe dentro de la función ‹x›() | Las variables que se crean dentro de una función son LOCALES: desaparecen cuando la función termina. Desde fuera no se pueden usar. | Haz que ‹x›() devuelva el valor con return, y guárdalo al llamarla: resultado = ‹x›(...) |
| `SEM_016` | "‹x›" es una función: para usarla hay que llamarla con paréntesis | El nombre solo, sin paréntesis, no ejecuta la función. | Escribe ‹x›() (con los valores que necesite entre los paréntesis). |
| `SEM_017` | NameError: la función ‹x›() todavía no está definida en este punto | Python lee el programa de arriba hacia abajo: una función tiene que estar definida (def) ANTES de la línea donde la llamas. | Mueve el def ‹x› más arriba que la llamada. |

#### De ejecución (fallan mientras el programa corre)

| Código | Mensaje | Qué significa | Cómo se arregla |
|---|---|---|---|
| `RUN_001` | Robot1 intentó salir del laboratorio | El laboratorio tiene un tamaño limitado. | Revisa cuántas casillas le estás pidiendo a Robot1 que avance. |
| `RUN_002` | Robot1 no llegó al objetivo | Parece que necesita avanzar una casilla más. | Revisa cuántos pasos le estás indicando. |
| `RUN_003` | Robot1 chocó con un obstáculo | Hay algo en el camino de Robot1. | Busca una ruta alterna (disponible a partir del Avance 2). |
| `RUN_004` | input() no tiene ningún valor disponible en esta fase | En esta fase no hay datos de entrada preparados. | Revisa el enunciado de la fase: puede que no necesites usar input(). |
| `RUN_004` | No hay más valores de entrada disponibles | input() solo puede leer los valores que este nivel preparó para ti. | Revisa cuántas veces estás llamando a input() en tu código. |
| `RUN_005` | Ciclo infinito detectado | Tu programa repitió instrucciones más de 1000 veces y se detuvo para no congelar el navegador. Casi siempre es un while cuya condición nunca se vuelve falsa. | Revisa que dentro del ciclo cambies la variable de la condición (por ejemplo: piso = piso + 1). |
| `RUN_006` | La condición "‹x›" no dio True ni False | Un if o un while necesita una pregunta con respuesta True o False, como x > 5 o color == "roja". | Compara el valor con algo usando ==, !=, <, >, <= o >=. |
| `RUN_007` | No se puede comparar ‹x› con ‹x› usando ‹x› | Con <, >, <= y >= solo se comparan dos números o dos textos. | Revisa que los dos lados de la comparación sean del mismo tipo. |
| `RUN_008` | El elevador intentó salir del edificio | El edificio tiene ‹x› pisos (del 1 al ‹x›). El elevador no puede subir más ni bajar de la planta baja. | Revisa cuántos pisos le pides subir o bajar, o la condición de tu ciclo. |
| `RUN_009` | El elevador está lleno | En la cabina caben ‹x› pasajeros. Hay que bajarlos antes de recoger a más. | Lleva a los pasajeros a la planta baja con elevador.soltar() antes de recoger más. |
| `RUN_010` | range() necesita números enteros (y el paso no puede ser 0) | El for cuenta con números enteros. | Ejemplo: for i in range(3): |
| `RUN_011` | ‹x› necesita valores True o False | and, or y not trabajan con respuestas de comparaciones (True / False). | Ejemplo: total < 21 and color == "roja" |
| `RUN_012` | El elevador se quedó sin energía | Cada piso que recorre el elevador gasta 1% de energía y la cabina empieza con 100%. | Revisa que el ciclo no haga viajes de más. |
| `RUN_013` | La mesa está llena | En la mesa caben ‹x› cartas como máximo. | Usa mesa.voltear() para revisar las cartas que ya pusiste. |
| `RUN_014` | "‹x›" no es un color de carta | Las cartas son "roja" o "negra". | Ejemplo: mesa.poner_carta(7, "roja") |
| `RUN_015` | TypeError: No puedes sumar undefined (undefined) con undefined (undefined) directamente. | El + une textos con textos (concatenar) y suma números con números, pero Python no mezcla ambos tipos por su cuenta. | Usa + solo entre dos números o entre dos textos. |
| `RUN_016` | TypeError: El operador ‹x› solo funciona con números (aquí hay ‹x› y ‹x›) | Con texto solo se puede usar + para unir dos textos. Restar, multiplicar, dividir y sacar el residuo necesitan números. | Revisa que las dos variables sean números (sin comillas), o conviértelas con int() o float(). |
| `RUN_017` | ValueError: El valor ingresado no es un número válido (‹x›("‹x›")) | float() solo convierte textos que parezcan un número, como "3.5" o "7". No acepta letras. | ‹x›("12") funciona; ‹x›("hola") no. Revisa lo que escribió quien usa el programa. |
| `RUN_018` | OverflowError: el número es demasiado grande | CodeQuest solo maneja enteros de hasta unas 9 mil billones (2⁵³) y decimales finitos. | Revisa las multiplicaciones y potencias: algo creció demasiado. |
| `RUN_019` | ValueError: esa potencia no da un número real | Un número negativo elevado a un exponente decimal (como (-8) ** 0.5) no es un número real. | Usa una base positiva o un exponente entero. |
| `RUN_020` | NameError: la función ‹x›() no está definida | Se llamó a una función que todavía no se había definido con def. | Define la función con def ‹x›(): antes de llamarla. |
| `RUN_021` | RecursionError: demasiadas llamadas de función una dentro de otra | Una función se llamó a sí misma (o a otra) una y otra vez sin parar. El límite en CodeQuest es de 100 llamadas anidadas. | Revisa que la función tenga una condición que la detenga. |
| `RUN_022` | TypeError: ‹x›() no puede convertir None | None es lo que devuelve una función que no tiene return: no es un número ni un texto. | Agrega return con el valor en la función que estás llamando. |
| `RUN_023` | UnboundLocalError: la variable "‹x›" es local en ‹x›() y todavía no tiene valor | Si una función asigna una variable (x = ...), esa variable es LOCAL en toda la función: no se puede leer la de afuera con el mismo nombre antes de asignarle un valor. | Recibe el valor como parámetro y devuelve el nuevo con return: def f(n): return n + 1   y afuera:  total = f(total) |

---

## 11. Lo que CQL NO tiene

CQL es deliberadamente pequeño. Todo esto **no existe** (y la mayoría produce un error de sintaxis o de «nombre no definido»):

| No existe | Qué pasa si se intenta |
|---|---|
| `def` dentro de un `if`, un ciclo u otro `def`; valores por omisión (`def f(a=1)`), `*args`, `lambda`, `global`, `nonlocal` | `SYN_018` o error de sintaxis |
| Listas, diccionarios, tuplas (`[ ]`, `{ }`) | `LEX_001`: carácter no reconocido |
| Recorrer con `for x in lista` | `SYN_012`: el for solo acepta `range(...)` |
| `break`, `continue`, `pass` | Se leen como nombres de variable sin sentido |
| `+=`, `-=`, `x = y = 3`, varias asignaciones en una línea | Error de sintaxis |
| `;` para separar instrucciones, llaves `{ }` | `LEX_001` |
| Secuencias de escape en textos (`\n`, `\"`), textos de varias líneas, f-strings | No se interpretan |
| `print` con varios argumentos | Solo se muestra el primero |
| `True`/`False` como número (`True + 1`) o «verdadero/falso» de números y textos (`if 5:`) | `RUN_015`, `RUN_006` |
| Comparaciones encadenadas (`1 < x < 5`) | `SYN_014` |
| `import`, clases, módulos, `len()`, `type()`, `round()`, `abs()` y el resto de funciones de Python | No existen: solo `print`, `input`, `int`, `float`, `str` y `range` (`SEM_003`) |
| `entrada()` (el nombre antiguo) | `SEM_003`: «se llama input()» |
| Variables con tilde o `ñ` en el nombre | `LEX_001` |

---

## 12. Ejemplos

### Mundo 1 — instrucciones en orden

```python
robot1.avanzar(3)
robot1.girar("sur")
robot1.avanzar(2)
robot1.hablar("¡Llegué!")
```

### Mundo 2 — variables, operadores y entrada

```python
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
```

### Mundo 3 — decisiones

```python
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
```

### Mundo 4 — ciclos y el elevador

```python
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
```

### Mundo 5 — funciones

```python
def calcular_area(ancho, alto):
    return ancho * alto

a1 = calcular_area(2, 3)
a2 = calcular_area(4, 5)
print(a1)             # 6
print(a2)             # 20
print(a1 + a2)        # 26

def saludar(nombre):
    print("Hola " + nombre)   # sin return: devuelve None

saludar("Robot1")
```

Un error típico del Mundo 5 (la variable local no existe afuera):

```python
def calcular():
    resultado = 5 * 4
calcular()
print(resultado)
```

```text
SEM_015 · NameError: la variable "resultado" solo existe dentro de la función calcular()
Haz que calcular() devuelva el valor con return, y guárdalo al llamarla: resultado = calcular(...)
```

### Mundo 4, Nivel Jefe — la energía se planea

```python
# 5 pisos, cabina de 4 y batería de 10: un solo viaje de subida y uno de bajada gasta 8
for i in range(4):
    elevador.subir(1)
    if elevador.hayPasajero():
        elevador.recoger()
for i in range(4):
    elevador.bajar(1)
elevador.soltar()
```

### Un error de tipos, como en Python

```python
edad = input()      # edad vale "15" (texto)
print(edad + 1)
```

```text
SEM_011 · input() devuelve texto: conviértelo a número antes de operar
En Python, input() SIEMPRE devuelve un texto, aunque la persona escriba un número.
Conviértelo primero: int(edad) + 1   (usa float(input()) si el número lleva decimales).
```

### Un error y su mensaje

```python
if total > 21
    print("Bust")
```

```text
SYN_006 · Falta ":" al final de la línea del if
Después de la condición de un if (o del else) va el signo ":".
Ejemplo: if x > 10:
```

---

## 13. Compatibilidad con Python 3

CQL es un **subconjunto de Python 3**: todo programa de CQL que funciona se comporta igual en Python real. La prueba `test_python_compat.mjs` ejecuta más de 150 programas (36 con funciones) en el Python del sistema y en CQL y compara la salida (o el tipo de error: `ZeroDivisionError`, `TypeError`, `ValueError`, `NameError`, `UnboundLocalError`, `RecursionError`).

**Diferencias deliberadas** (CQL es *más estricto* que Python para enseñar mejor; nunca acepta algo que Python rechace):

| En Python | En CQL | Por qué |
|---|---|---|
| `True + 1` es `2` | Error de tipos (`RUN_015`) | En Python `bool` es un tipo de número; en CQL se mantienen separados para evitar confusiones |
| `"ab" * 3` es `"ababab"` | Error de tipos (`RUN_016`) | La repetición de textos no se enseña |
| `if 5:`, `while "x":` (cualquier valor es «verdadero» o «falso») | La condición debe dar `True`/`False` (`RUN_006`) | Evita condiciones ambiguas |
| `(-8) ** 0.5` da un número complejo | Error (`RUN_019`) | CQL no tiene números complejos |
| Los enteros no tienen límite | Enteros de hasta 2⁵³ (`RUN_018`) | Representación interna |
| `print(a, b)` imprime los dos | Solo muestra el primero | Una sola salida por `print` |
| `def` dentro de un bloque (Python lo permite); parámetros opcionales, `*args`, `lambda`, `global` | Error (`SYN_018` / sintaxis) | Las funciones se enseñan en su forma más simple |
| Todo el vocabulario de Python (listas, `import`, clases…) | No existe | CQL es un subconjunto |
| `print`, `input`, `int`… son funciones que se pueden reasignar | Son nombres reservados (`SEM_012`) | Evita romper las funciones por accidente |

Además, CQL muestra algunos errores **antes de ejecutar** (el validador sabe, por ejemplo, que `input()` es texto) y con mensajes educativos; Python los daría al llegar a esa línea.
