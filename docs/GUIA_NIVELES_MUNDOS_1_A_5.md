# CodeQuest — Guía de niveles y fases (Mundos 1 a 5)

Guía para **facilitar** el juego: qué trabaja cada nivel, qué pide cada fase y **cómo se pasa**, sin necesidad de leer código. Las soluciones de ejemplo están escondidas (spoiler) al final de cada fase de escritura.

> Se genera automáticamente desde los niveles del juego (`python3 herramientas/generar_guia.py`), así que siempre coincide con lo que ven los estudiantes.

## Cómo funciona todo

- **Mundos:** se juegan en orden. Un mundo se abre al completar **todos** los niveles del anterior, **incluidos sus Niveles Jefe** (👑: sin botón de pistas, editor en blanco y un solo enunciado; cierran cada mundo, y el Mundo 1 tiene además un jefe intermedio, el Laberinto ciego). El **Nivel 0** (diagramas de flujo) es el primero del Mundo 1 y se da por hecho si ya se había jugado antes.
- **Niveles:** cada nivel tiene de 3 a 5 fases que se hacen en orden (el Nivel Jefe tiene una sola). En el juego los niveles se numeran dentro de su mundo (Nivel 0, 1, 2…); entre paréntesis va el número interno.
- **Estrellas por nivel:** ⭐ completar todas las fases · ⭐⭐ además, sin usar pistas · ⭐⭐⭐ además, acertando a la **primera** en cada fase.
- **Casos:** en las fases de lógica y ciclos el programa se prueba en varias mesas o edificios. Un programa que solo funciona para el caso que se ve **no pasa**.
- **Sangría:** dentro de `if`, `while` y `for` las líneas van movidas 4 espacios (tecla **Tab**). Cada pregunta o ciclo termina en dos puntos `:`.

### Tipos de fase

| Tipo | Qué es |
|---|---|
| **EXPLORAR** | Solo hay que **ejecutar** el código que ya viene y observar qué pasa. Se pasa con cualquier ejecución sin errores. |
| **PREDECIR** | No se escribe código: se lee un programa y se **elige qué resultado dará**. |
| **MODIFICAR** | Viene un programa casi listo; hay que **cambiar una parte** para lograr el objetivo. |
| **ESCRIBIR** | Se escribe el programa desde cero (o casi) siguiendo el enunciado. |
| **RESOLVER** | Un reto más abierto: se combinan varias ideas del nivel. |
| **DEBUG** | El programa tiene un **error**; hay que encontrarlo y corregirlo. |
| **LIBRE** | Zona de práctica: no se evalúa nada, solo se experimenta. |
| **ORDENAR** | Solo en el Nivel 0: **no hay código**; se hace clic en las tarjetas de un diagrama de flujo en el orden correcto. Si una tarjeta no toca todavía, Robot1 choca y se empieza de nuevo. |

## Resumen

### Mundo 1 · Fundamentos y Datos

| Nivel | Nombre | Concepto | Fases |
|---|---|---|---|
| 0 (id 0) | Antes de empezar: el algoritmo | algoritmo y diagrama de flujo | 3: Ordenar, Ordenar, Ordenar |
| 1 (id 1) | Despertar | programa, instrucción, ejecución, salida | 4: Explorar, Predecir, Modificar, Escribir |
| 2 (id 2) | Primeros movimientos | secuencia, orden, estructura básica | 3: Explorar, Modificar, Escribir |
| 3 (id 3) | Haz que me entienda | instrucciones disponibles, llamadas a métodos, sintaxis | 5: Explorar, Predecir, Explorar, Predecir, Resolver |
| 4 (id 4) | ¿Cuánto? | parámetros, argumentos, literales numéricos | 3: Explorar, Predecir, Resolver |
| 5 (id 5) | La orden equivocada | sintaxis, errores, mensajes del sistema | 4: Explorar, Debug, Predecir, Debug |
| 6 (id 6) | La Alcancía | variables y reasignación (ahorro = ahorro + mesada) | 4: Explorar, Predecir, Modificar, Escribir |
| 7 (id 7) | La terminal | input(), int(), print() | 4: Explorar, Predecir, Escribir, Resolver |
| 8 (id 8) | Semáforos y Decisiones | if / else, comparaciones (==) y and / or | 4: Explorar, Predecir, Escribir, Resolver |
| 9 (id 9) | La salida | robot, obstáculos y salida | 3: Resolver, Predecir, Resolver |
| 10 (id 10) | El Intercambio | intercambiar variables con una temporal (temp) | 4: Explorar, Predecir, Debug, Resolver |
| 11 (id 11) | Identificadores | nombres de variables válidos (identificadores) | 4: Explorar, Debug, Predecir, Debug |
| 12 (id 12) | La Receta | operadores * y /, y redondeo con int() y round() | 4: Explorar, Predecir, Modificar, Resolver |
| 13 (id 13) | El Sistema de Energía | constantes (MAXIMO) y variables que cambian | 3: Explorar, Modificar, Resolver |
| 14 👑 (id 44) | Laberinto ciego | integración de los Bloques A a C | 1: Resolver |
| 15 (id 14) | El Pozo | ciclo while, not y contadores | 4: Explorar, Predecir, Escribir, Resolver |
| 16 (id 15) | El Puente de Datos | input(), int(), operadores y robot juntos | 3: Escribir, Resolver, Resolver |
| 17 (id 16) | El Cronómetro | división entera // y residuo % | 4: Explorar, Predecir, Debug, Resolver |
| 18 (id 17) | La Boleta | expresiones booleanas sin if (True / False) | 4: Explorar, Predecir, Escribir, Resolver |
| 19 (id 18) | El Viaje | combinar operadores y round(x, 2) | 4: Explorar, Debug, Predecir, Resolver |
| 20 👑 (id 45) | La Caja Fuerte | integración del Mundo 1 | 1: Resolver |

### Mundo 2 · Lógica

| Nivel | Nombre | Concepto | Fases |
|---|---|---|---|
| 1 (id 20) | Pasarse de 21 | condicional if | 3: Explorar, Predecir, Modificar |
| 2 (id 21) | Ganar o perder | if / else | 3: Explorar, Predecir, Modificar |
| 3 (id 22) | Comparar es preguntar | comparación de igualdad (==) | 3: Explorar, Predecir, Modificar |
| 4 (id 23) | Mayor, menor o igual | comparación de orden (<, >, <=, >=) | 3: Explorar, Predecir, Modificar |
| 5 (id 24) | Dos condiciones a la vez | operador lógico and | 3: Debug, Escribir, Debug |
| 6 (id 25) | O, y no | operadores lógicos or y not | 3: Debug, Escribir, Predecir |
| 7 (id 26) | Varios caminos | elif | 4: Debug, Predecir, Escribir, Debug |
| 8 (id 27) | Decisiones dentro de decisiones | condicionales anidados | 3: Debug, Predecir, Escribir |
| 9 (id 28) | El aviso del crupier | reglas con elif | 3: Resolver, Resolver, Libre |
| 10 (id 29) | Pares | pares y condiciones combinadas | 3: Resolver, Resolver, Libre |
| 11 (id 30) | Combinaciones | combinaciones lógicas | 3: Resolver, Resolver, Libre |
| 12 (id 31) | El crupier final | integración de condicionales | 3: Resolver, Resolver, Libre |
| 13 👑 (id 46) | Torneo de cartas | integración del Mundo 2 | 1: Resolver |

### Mundo 3 · Automatización

| Nivel | Nombre | Concepto | Fases |
|---|---|---|---|
| 1 (id 32) | El ascensor automático | ciclo while | 3: Explorar, Predecir, Modificar |
| 2 (id 33) | Repetir con for | ciclo for con range | 3: Explorar, Predecir, Modificar |
| 3 (id 34) | Contar repeticiones | contadores en un while | 3: Explorar, Predecir, Modificar |
| 4 (id 35) | El valor de i | for con variable y range(inicio, fin) | 3: Explorar, Predecir, Modificar |
| 5 (id 36) | El bucle infinito | ciclos con condición y bucles infinitos | 3: Debug, Escribir, Debug |
| 6 (id 37) | Recoger pasajeros | while con decisiones | 3: Debug, Escribir, Escribir |
| 7 (id 38) | For con decisiones | for con if | 3: Debug, Predecir, Escribir |
| 8 (id 39) | Cuenta lo que haces | contadores con condición | 3: Debug, Escribir, Escribir |
| 9 (id 40) | Evacuación completa | evacuación con ciclos | 3: Resolver, Resolver, Libre |
| 10 (id 41) | La cabina chica | capacidad limitada | 3: Resolver, Resolver, Libre |
| 11 (id 42) | Reportes por piso | ciclos con reportes | 3: Resolver, Resolver, Libre |
| 12 (id 43) | El gran operativo | contadores con ciclos | 3: Resolver, Resolver, Libre |
| 13 👑 (id 47) | Evacuación crítica | integración del Mundo 3 | 1: Resolver |

### Mundo 4 · Modularidad

| Nivel | Nombre | Concepto | Fases |
|---|---|---|---|
| 1 (id 48) | Construyendo máquinas | definir una función con def | 4: Explorar, Predecir, Modificar, Escribir |
| 2 (id 49) | Activando la producción | llamar funciones ya definidas | 4: Explorar, Predecir, Resolver, Resolver |
| 3 (id 50) | Personalizando productos | parámetros de una función | 4: Explorar, Predecir, Escribir, Escribir |
| 4 (id 51) | El producto terminado | return y valor de retorno | 4: Explorar, Predecir, Debug, Debug |
| 5 (id 52) | Información confidencial | variables locales y ámbito | 4: Explorar, Predecir, Predecir, Debug |
| 6 (id 53) | Producción en cadena | usar el return de una función como parámetro de otra | 4: Explorar, Predecir, Resolver, Resolver |
| 7 (id 54) | Reparando la fábrica | depurar funciones | 4: Debug, Debug, Debug, Debug |
| 8 👑 (id 55) | El Gran Ensamblaje | integración del Mundo 4 | 1: Resolver |

### Mundo 5 · Proyecto

| Nivel | Nombre | Concepto | Fases |
|---|---|---|---|
| 1 (id 56) | La máquina expendedora | proyecto: input, if y cálculos | 1: Resolver |
| 2 (id 57) | El validador de contraseñas | proyecto: variables, if y and | 1: Resolver |
| 3 (id 58) | El juego de adivinanza | proyecto: while, límite de intentos e if | 1: Resolver |
| 4 👑 (id 59) | Proyecto libre | proyecto final de CodeQuest | 1: Resolver |

---

## Mundo 1 · Fundamentos y Datos

- **Escenario:** Laboratorio de **Robot1** y el pueblo (cada nivel elige su escenario: robot, consola de datos o un minijuego).
- **Qué se aprende:** Fusión de los antiguos Mundos 1 y 2, todo en Python. El Nivel 0 enseña qué es un algoritmo con un diagrama de flujo. Bloque A (robot): `print()`, `avanzar`, `girar` y errores. Bloque B: variables y reasignación en **La Alcancía** (`ahorro += mesada`), `input()` e `int()` en la terminal y `if` / `and` / `or` en **Semáforos**. Bloque C: el **Intercambio** de vasos (`temp`), identificadores, **La Receta** (`*`, `/`, `int(x + 0.5)` y `round()`) y constantes; cierra el jefe intermedio **Laberinto ciego**. Bloque D: `while` y contadores en **El Pozo**, el puente de datos, `//` y `%` en **El Cronómetro**, expresiones booleanas sin `if` en **La Boleta**, `round(x, 2)` en **El Viaje** y el jefe final **La Caja Fuerte**. Cada fase donde se escribe código trae un límite de líneas recomendado (contador «Líneas: X / Límite»).
- **Niveles:** 21 · **Estrellas posibles:** 63

### Nivel 0 del Mundo 1 (id 0) — Antes de empezar: el algoritmo

**Concepto:** algoritmo y diagrama de flujo  ·  **Historia:** _Antes de entrar al laboratorio, Robot1 necesita aprender lo más importante: seguir un algoritmo, una lista de pasos en el orden correcto._

#### Fase 1 · ORDENAR — «La puerta del laboratorio»  `0.1`

**Qué hay que hacer:** Un ALGORITMO es una lista de pasos, en orden, que resuelve un problema. Robot1 está frente a una puerta: haz clic en las tarjetas en el orden correcto para que llegue y la abra. Cada diagrama de flujo empieza en Inicio y termina en Fin.

**En pantalla:** Un pasillo de 5 casillas con una puerta.

**Cómo se pasa:**

- Hay que hacer clic en las tarjetas en este orden: **Inicio** → **Caminar 3 pasos** → **Abrir la puerta** → **Fin**.
- Cada tarjeta correcta se ejecuta en el pasillo; una tarjeta equivocada hace que Robot1 choque y todo vuelve a empezar.

**Pistas del juego:** Un diagrama siempre empieza con Inicio. · Robot1 tiene que estar junto a la puerta antes de abrirla.

**Si no pasa, el juego dice:** «Esa tarjeta no iba todavía: ¡Robot1 chocó! Piensa qué tiene que pasar primero y vuelve a empezar.»

#### Fase 2 · ORDENAR — «La puerta con llave»  `0.2`

**Qué hay que hacer:** Ahora la puerta está cerrada con llave, y la llave está tirada en el pasillo. Ordena el algoritmo completo para que Robot1 recoja la llave y abra la puerta.

**En pantalla:** Un pasillo de 6 casillas con una puerta, con una llave en el pasillo.

**Cómo se pasa:**

- Hay que hacer clic en las tarjetas en este orden: **Inicio** → **Caminar 1 paso** → **Recoger la llave** → **Caminar 3 pasos** → **Abrir la puerta** → **Fin**.
- Cada tarjeta correcta se ejecuta en el pasillo; una tarjeta equivocada hace que Robot1 choque y todo vuelve a empezar.

**Pistas del juego:** La llave está a 1 paso de Robot1. · Sin la llave, la puerta no abre.

**Si no pasa, el juego dice:** «Esa tarjeta no iba todavía: ¡Robot1 chocó! Piensa qué tiene que pasar primero y vuelve a empezar.»

#### Fase 3 · ORDENAR — «Robot1 apagado»  `0.3`

**Qué hay que hacer:** Robot1 está apagado y no puede caminar. Ordena TODO el algoritmo: despertarlo, recoger la llave y abrir la puerta.

**En pantalla:** Un pasillo de 6 casillas con una puerta, con una llave en el pasillo y Robot1 apagado.

**Cómo se pasa:**

- Hay que hacer clic en las tarjetas en este orden: **Inicio** → **Encender a Robot1** → **Caminar 1 paso** → **Recoger la llave** → **Caminar 3 pasos** → **Abrir la puerta** → **Fin**.
- Cada tarjeta correcta se ejecuta en el pasillo; una tarjeta equivocada hace que Robot1 choque y todo vuelve a empezar.

**Pistas del juego:** Un robot apagado no se mueve. · Primero encender, luego caminar.

**Si no pasa, el juego dice:** «Esa tarjeta no iba todavía: ¡Robot1 chocó! Piensa qué tiene que pasar primero y vuelve a empezar.»

### Nivel 1 del Mundo 1 (id 1) — Despertar

**Concepto:** programa, instrucción, ejecución, salida  ·  **Historia:** _Robot1 está apagado en una instalación desconocida. El jugador ejecuta su primer programa._

#### Fase 1 · EXPLORAR — «Enciende a Robot1»  `1.1`

**Qué hay que hacer:** Ejecuta el código y observa qué aparece en el panel de Salida.

**En pantalla:** Mundo 2D: cuadrícula de 6×1; Robot1 empieza en (0,0) mirando al este.

**Cómo se pasa:**

- Basta con ejecutar el programa sin errores.

**Pistas del juego:** Solo presiona ▶ Ejecutar y observa el panel de Salida.

#### Fase 2 · PREDECIR — «¿Qué instrucción lo hizo?»  `1.4`

**Qué hay que hacer:** Acabas de ver que apareció un mensaje en el panel de Salida. ¿Qué instrucción del programa lo mostró?

**Cómo se pasa:**

- ✅ print()
- ▫️ robot1.avanzar()
- ▫️ robot1.girar()
- Se pasa eligiendo: **print()**.

**Pistas del juego:** Piensa en dónde apareció el texto: en el panel de Salida.

<details><summary>Ver el código de la fase</summary>

```python
print("Robot1 despierta")
```
</details>

#### Fase 3 · MODIFICAR — «Cambia el mensaje»  `1.2`

**Qué hay que hacer:** Cambia el texto para que Robot1 diga "Robot1 está listo".

**En pantalla:** Mundo 2D: cuadrícula de 6×1; Robot1 empieza en (0,0) mirando al este.

**Cómo se pasa:**

- El programa debe mostrar exactamente «Robot1 está listo».

**Pistas del juego:** Solo cambia lo que está entre comillas, no el resto de la línea.

<details><summary>Ver el código de la fase</summary>

```python
print("cambia este texto")
```
</details>

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
print("Robot1 está listo")
```
</details>

#### Fase 4 · ESCRIBIR — «Tu primer programa»  `1.3`

**Qué hay que hacer:** Escribe un programa que muestre "Hola mundo" en pantalla.

**En pantalla:** Mundo 2D: cuadrícula de 6×1; Robot1 empieza en (0,0) mirando al este.

**Cómo se pasa:**

- El programa debe mostrar exactamente «Hola mundo».

**Pistas del juego:** Usa print("...") con el texto entre comillas.

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
print("Hola mundo")
```
</details>

### Nivel 2 del Mundo 1 (id 2) — Primeros movimientos

**Concepto:** secuencia, orden, estructura básica  ·  **Historia:** _Robot1 da sus primeros pasos por un pasillo recto de la instalación._

#### Fase 1 · EXPLORAR — «Robot1 se mueve»  `2.1`

**Qué hay que hacer:** Esta es una instrucción nueva: robot1.avanzar(n) mueve a Robot1 n casillas hacia donde mira. Ejecútala y observa el panel de Estado.

**En pantalla:** Mundo 2D: cuadrícula de 6×1; Robot1 empieza en (0,0) mirando al este; bandera en (4,0).

**Cómo se pasa:**

- Basta con ejecutar el programa sin errores.

**Pistas del juego:** Solo presiona ▶ Ejecutar y mira cómo cambia la posición.

#### Fase 2 · MODIFICAR — «Llega a la estación»  `2.2`

**Qué hay que hacer:** Cambia el número para que Robot1 llegue justo a la casilla 4.

**En pantalla:** Mundo 2D: cuadrícula de 6×1; Robot1 empieza en (0,0) mirando al este; bandera en (4,0).

**Cómo se pasa:**

- Robot1 debe terminar en la casilla (4,0).

**Pistas del juego:** Robot1 empieza en la casilla 0. · Cuenta las casillas hasta la estrella.

<details><summary>Ver el código de la fase</summary>

```python
robot1.avanzar(1)
```
</details>

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
robot1.avanzar(4)
```
</details>

#### Fase 3 · ESCRIBIR — «Una detrás de otra»  `2.3`

**Qué hay que hacer:** Escribe DOS instrucciones: que avance 2 casillas y luego 3 más. Se ejecutan en orden, de arriba hacia abajo.

**En pantalla:** Mundo 2D: cuadrícula de 6×1; Robot1 empieza en (0,0) mirando al este; bandera en (5,0).

**Cómo se pasa:**

- Robot1 debe terminar en la casilla (5,0).

**Pistas del juego:** Escribe una instrucción por línea. · 2 + 3 casillas te dejan en la 5.

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
robot1.avanzar(2)
robot1.avanzar(3)
```
</details>

### Nivel 3 del Mundo 1 (id 3) — Haz que me entienda

**Concepto:** instrucciones disponibles, llamadas a métodos, sintaxis  ·  **Historia:** _Robot1 revela el resto de instrucciones que entiende: hablar y girar._

#### Fase 1 · EXPLORAR — «Robot1 puede hablar»  `3.1`

**Qué hay que hacer:** Instrucción nueva: robot1.hablar("texto"). Ejecútala y fíjate en que produce burbuja en el mundo Y línea en Salida.

**En pantalla:** Mundo 2D: cuadrícula de 4×2; Robot1 empieza en (0,0) mirando al este; bandera en (2,1).

**Cómo se pasa:**

- Basta con ejecutar el programa sin errores.

**Pistas del juego:** Observa el mundo 2D y el panel de Salida a la vez.

#### Fase 2 · PREDECIR — «¿Dónde aparece cada cosa?»  `3.2`

**Qué hay que hacer:** Si ejecutas print("Hola"), ¿dónde aparece el texto?

**Cómo se pasa:**

- ✅ Solo en el panel de Salida
- ▫️ En una burbuja sobre Robot1
- ▫️ En el panel de Estado
- Se pasa eligiendo: **Solo en el panel de Salida**.

**Pistas del juego:** Una es salida de consola y la otra salida visual.

<details><summary>Ver el código de la fase</summary>

```python
print("Hola")
```
</details>

#### Fase 3 · EXPLORAR — «Robot1 puede girar»  `3.3`

**Qué hay que hacer:** Instrucción nueva: robot1.girar(direccion) cambia hacia dónde mira. Las direcciones son "norte", "sur", "este" y "oeste". Ejecuta y mira la Dirección en el panel de Estado.

**En pantalla:** Mundo 2D: cuadrícula de 4×2; Robot1 empieza en (0,0) mirando al este; bandera en (2,1).

**Cómo se pasa:**

- Basta con ejecutar el programa sin errores.

**Pistas del juego:** Compara la Dirección en el panel de Estado antes y después. · La punta naranja del robot también gira.

#### Fase 4 · PREDECIR — «¿Qué cambió al girar?»  `3.5`

**Qué hay que hacer:** Acabas de ejecutar robot1.girar("sur"). ¿Qué cambió en Robot1?

**Cómo se pasa:**

- ✅ Ahora mira hacia el sur (cambió su Dirección)
- ▫️ Se movió una casilla hacia el sur
- ▫️ Dijo la palabra «sur»
- Se pasa eligiendo: **Ahora mira hacia el sur (cambió su Dirección)**.

**Pistas del juego:** Mira la Dirección y la Posición en el panel de Estado.

<details><summary>Ver el código de la fase</summary>

```python
robot1.girar("sur")
```
</details>

#### Fase 5 · RESOLVER — «Baja una fila»  `3.4`

**Qué hay que hacer:** Ahora combínalas: la meta está en (2,1), una fila más abajo. Avanza, gira al sur y avanza otra vez.

**En pantalla:** Mundo 2D: cuadrícula de 4×2; Robot1 empieza en (0,0) mirando al este; bandera en (2,1).

**Cómo se pasa:**

- Robot1 debe terminar en la casilla (2,1).

**Pistas del juego:** Primero muévete en horizontal. · Gira al "sur" para bajar y avanza 1.

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
robot1.avanzar(2)
robot1.girar("sur")
robot1.avanzar(1)
```
</details>

### Nivel 4 del Mundo 1 (id 4) — ¿Cuánto?

**Concepto:** parámetros, argumentos, literales numéricos  ·  **Historia:** _El valor entre paréntesis es lo que hace que una misma instrucción sirva para muchas cosas._

#### Fase 1 · EXPLORAR — «Ir y volver»  `4.1`

**Qué hay que hacer:** Instrucción nueva: robot1.retroceder(n) mueve a Robot1 hacia atrás SIN cambiar hacia dónde mira. Ejecuta y compara con avanzar().

**En pantalla:** Mundo 2D: cuadrícula de 5×2; Robot1 empieza en (0,0) mirando al este; bandera en (4,1).

**Cómo se pasa:**

- Basta con ejecutar el programa sin errores.

**Pistas del juego:** Observa la posición al terminar: avanzó 3 y retrocedió 1.

#### Fase 2 · PREDECIR — «Predice los dos tramos»  `4.2`

**Qué hay que hacer:** Robot1 está en (0,0) mirando al este. Tras avanzar(4), girar("sur") y avanzar(1), ¿dónde queda?

**Cómo se pasa:**

- ✅ En (4,1)
- ▫️ En (1,4)
- ▫️ En (5,1)
- Se pasa eligiendo: **En (4,1)**.

**Pistas del juego:** El primer número es la columna; el segundo, la fila.

<details><summary>Ver el código de la fase</summary>

```python
robot1.avanzar(4)
robot1.girar("sur")
robot1.avanzar(1)
```
</details>

#### Fase 3 · RESOLVER — «Elige bien cada argumento»  `4.3`

**Qué hay que hacer:** La meta está en (4,1). Llega usando dos avanzar() y un girar(), eligiendo el número correcto en cada uno.

**En pantalla:** Mundo 2D: cuadrícula de 5×2; Robot1 empieza en (0,0) mirando al este; bandera en (4,1).

**Cómo se pasa:**

- Robot1 debe terminar en la casilla (4,1).

**Pistas del juego:** Cuenta las columnas del tramo horizontal. · Luego las filas del tramo vertical.

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
robot1.avanzar(4)
robot1.girar("sur")
robot1.avanzar(1)
```
</details>

### Nivel 5 del Mundo 1 (id 5) — La orden equivocada

**Concepto:** sintaxis, errores, mensajes del sistema  ·  **Historia:** _Robot1 recibe órdenes mal escritas. Los mensajes de error no son castigos: son información._

#### Fase 1 · EXPLORAR — «Lee el error»  `5.1`

**Qué hay que hacer:** Este código falla a propósito. Ejecútalo y lee el mensaje completo en Retroalimentación: trae un código, una explicación y una sugerencia.

**En pantalla:** Mundo 2D: cuadrícula de 5×2; Robot1 empieza en (0,0) mirando al este; bandera en (3,1).

**Cómo se pasa:**

- Esta fase **busca un error a propósito**: el programa debe fallar con el error `SYN_001`.
- El código que viene ya cumple esto: solo hay que ejecutarlo.

**Pistas del juego:** No lo corrijas todavía: solo ejecútalo y lee.

**Si no pasa, el juego dice:** «Ejecuta el código tal como está y lee el error que aparece.»

#### Fase 2 · DEBUG — «Falta un paréntesis»  `5.2`

**Qué hay que hacer:** Ahora sí, corrige el error de sintaxis para que muestre "Reparado".

**En pantalla:** Mundo 2D: cuadrícula de 5×2; Robot1 empieza en (0,0) mirando al este; bandera en (3,1).

**Cómo se pasa:**

- El programa debe mostrar exactamente «Reparado».

**Pistas del juego:** Mira el final de la línea.

<details><summary>Ver el código de la fase</summary>

```python
print("Reparado"
```
</details>

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
print("Reparado")
```
</details>

#### Fase 3 · PREDECIR — «¿Qué error tiene?»  `5.3`

**Qué hay que hacer:** ¿Qué falla en robot1.volar(3)?

**Cómo se pasa:**

- ▫️ Falta un paréntesis
- ✅ El método volar() no existe en Robot1
- ▫️ El argumento 3 es inválido
- Se pasa eligiendo: **El método volar() no existe en Robot1**.

**Pistas del juego:** Abre el Diccionario y revisa qué instrucciones conoce Robot1.

<details><summary>Ver el código de la fase</summary>

```python
robot1.volar(3)
```
</details>

#### Fase 4 · DEBUG — «Corrige el método»  `5.4`

**Qué hay que hacer:** Cambia volar() por la instrucción real, y añade lo necesario para llegar a la meta en (3,1).

**En pantalla:** Mundo 2D: cuadrícula de 5×2; Robot1 empieza en (0,0) mirando al este; bandera en (3,1).

**Cómo se pasa:**

- Robot1 debe terminar en la casilla (3,1).

**Pistas del juego:** El método correcto para moverse es avanzar. · La meta está una fila más abajo: usa girar("sur").

**Si no pasa, el juego dice:** «Robot1 debe terminar en (3,1).»

<details><summary>Ver el código de la fase</summary>

```python
robot1.volar(3)
```
</details>

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
robot1.avanzar(3)
robot1.girar("sur")
robot1.avanzar(1)
```
</details>

### Nivel 6 del Mundo 1 (id 6) — La Alcancía

**Concepto:** variables y reasignación (ahorro = ahorro + mesada)  ·  **Historia:** _Robot1 salió del laboratorio y llegó al pueblo. Sus habitantes tienen problemas reales que se resuelven con datos. Lupita quiere juntar $400 en su alcancía en 4 semanas. Una variable será su alcancía: una caja con nombre que guarda el dinero._

#### Fase 1 · EXPLORAR — «Tu primera variable»  `6.1`

**Qué hay que hacer:** Concepto nuevo: una VARIABLE es una caja con nombre que guarda un valor. ahorro = 0 crea la caja ahorro con un 0 adentro. Después, ahorro = ahorro + 100 toma lo que ya había, le suma 100 y lo guarda otra vez en la MISMA caja (eso es reasignar). Ejecuta y mira caer la moneda.

**Cómo se pasa:**

- Basta con ejecutar el programa sin errores.

**Pistas del juego:** Mira el panel de Memoria: el valor de ahorro cambia.

#### Fase 2 · PREDECIR — «¿Cuánto hay en la alcancía?»  `6.2`

**Qué hay que hacer:** Lee el programa con calma, renglón por renglón. ¿Qué muestra al final?

**Cómo se pasa:**

- ▫️ 100
- ✅ 250
- ▫️ 50
- Se pasa eligiendo: **250**.

**Pistas del juego:** Ve sumando: empieza en 50.

<details><summary>Ver el código de la fase</summary>

```python
ahorro = 50
ahorro = ahorro + 100
ahorro = ahorro + 100
print(ahorro)
```
</details>

#### Fase 3 · MODIFICAR — «La mesada cambia»  `6.3`

**Qué hay que hacer:** La mesada se guarda en su propia variable. Cambia SOLO el valor de mesada para que, después de dos semanas, la alcancía tenga 300.

**Cómo se pasa:**

- Al terminar, `ahorro` debe valer 300.
- El programa debe mostrar «300».
- Debe crear una variable llamada `mesada`.

**Pistas del juego:** Dos mesadas iguales deben sumar 300.

**Si no pasa, el juego dice:** «Después de dos depósitos de mesada, ahorro debe valer 300.»

<details><summary>Ver el código de la fase</summary>

```python
mesada = 100
ahorro = 0
ahorro = ahorro + mesada
ahorro = ahorro + mesada
print(ahorro)
```
</details>

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
mesada = 150
ahorro = 0
ahorro = ahorro + mesada
ahorro = ahorro + mesada
print(ahorro)
```
</details>

#### Fase 4 · ESCRIBIR — «Cuatro semanas de ahorro»  `6.4`

**Qué hay que hacer:** Empieza con ahorro = 0 y mesada = 100. Durante 4 semanas, cada semana suma la mesada a la alcancía con ahorro = ahorro + mesada. Python tiene un atajo que hace lo mismo: ahorro += mesada. Al final muestra ahorro (400).

**Cómo se pasa:**

- El programa debe mostrar «400».
- Debe crear una variable llamada `mesada`.

**Pistas del juego:** Cuatro semanas = cuatro reasignaciones. · ahorro += mesada

**Si no pasa, el juego dice:** «Deben caer 4 depósitos en la alcancía (uno por semana) y mostrarse 400.»

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
ahorro = 0
mesada = 100
ahorro += mesada
ahorro += mesada
ahorro += mesada
ahorro += mesada
print(ahorro)
```
</details>

### Nivel 7 del Mundo 1 (id 7) — La terminal

**Concepto:** input(), int(), print()  ·  **Historia:** _La instalación tiene una terminal. Ahora los datos no los escribe el programa: los escribes tú._

#### Fase 1 · EXPLORAR — «La terminal te pregunta»  `7.1`

**Qué hay que hacer:** Instrucción nueva: input() pausa el programa y te pide un valor. Ejecuta, escribe lo que quieras en el campo que aparece y observa el panel de Salida.

**En pantalla:** Mundo 2D: cuadrícula de 4×2; Robot1 empieza en (0,0) mirando al este; bandera en (3,1).

**Cómo se pasa:**

- Basta con ejecutar el programa sin errores.

> ⌨️ Esta fase pide datos con `input()` (siempre llega como texto): cuando la terminal pregunte, escribe **7**.

**Pistas del juego:** Puedes escribir un número o una palabra: pruébalo.

#### Fase 2 · PREDECIR — «¿Qué hace input()?»  `7.2`

**Qué hay que hacer:** Acabas de ejecutar input(). ¿Qué hace esta instrucción?

**Cómo se pasa:**

- ✅ Pausa el programa y espera a que escribas un valor
- ▫️ Muestra la palabra input en el panel de Salida
- ▫️ Hace avanzar a Robot1
- Se pasa eligiendo: **Pausa el programa y espera a que escribas un valor**.

**Pistas del juego:** ¿Quién escribió el 7 que se pidió?

<details><summary>Ver el código de la fase</summary>

```python
input()
```
</details>

#### Fase 3 · ESCRIBIR — «Usa lo que escribes»  `7.3`

**Qué hay que hacer:** input() DEVUELVE un valor, así que puedes ponerlo justo donde harías falta un dato: dentro de print(). Escribe un programa que muestre lo que teclees. Escribe 7 cuando se te pida.

**En pantalla:** Mundo 2D: cuadrícula de 4×2; Robot1 empieza en (0,0) mirando al este; bandera en (3,1).

**Cómo se pasa:**

- El programa debe mostrar exactamente «7».

> ⌨️ Esta fase pide datos con `input()` (siempre llega como texto): cuando la terminal pregunte, escribe **7**.

**Pistas del juego:** Puedes escribir una instrucción dentro de otra. · print(input()) muestra lo que teclees.

**Si no pasa, el juego dice:** «Debes mostrar con print() el valor que escribes en la terminal. Escribe 7 cuando se te pida.»

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
print(input())
```
</details>

#### Fase 4 · RESOLVER — «Tú marcas el rumbo»  `7.4`

**Qué hay que hacer:** En Python, input() SIEMPRE lee texto, incluso si escribes un número. Para contar casillas necesitas un número entero: conviértelo con int(input()). Haz que Robot1 avance las casillas que teclees, luego gire al sur y avance 1, para llegar a (3,1). Escribe 3 cuando se te pida.

**En pantalla:** Mundo 2D: cuadrícula de 4×2; Robot1 empieza en (0,0) mirando al este; bandera en (3,1).

**Cómo se pasa:**

- Robot1 debe terminar en la casilla (3,1).

> ⌨️ Esta fase pide datos con `input()` (siempre llega como texto): cuando la terminal pregunte, escribe **3**.

**Pistas del juego:** Puedes poner int(input()) como argumento de avanzar(). · Después gira al sur y avanza 1.

**Si no pasa, el juego dice:** «Robot1 debe terminar en (3,1) usando el valor que escribes en la terminal.»

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
robot1.avanzar(int(input()))
robot1.girar("sur")
robot1.avanzar(1)
```
</details>

### Nivel 8 del Mundo 1 (id 8) — Semáforos y Decisiones

**Concepto:** if / else, comparaciones (==) y and / or  ·  **Historia:** _En la avenida principal hay un cruce peligroso. El auto autónomo del pueblo necesita reglas para decidir cuándo avanzar y cuándo frenar._

#### Fase 1 · EXPLORAR — «El semáforo pregunta»  `8.1`

**Qué hay que hacer:** Concepto nuevo: if hace una PREGUNTA y elige qué hacer. color == "rojo" compara (== significa «¿es igual?») y responde True o False. Si es True se ejecuta lo de adentro del if; si es False, lo del else. Las líneas de adentro llevan 4 espacios de sangría. Ejecuta: el semáforo está en rojo.

**Cómo se pasa:**

- Basta con ejecutar el programa sin errores.

**Pistas del juego:** Arriba a la izquierda de la escena aparece la condición y su resultado.

#### Fase 2 · PREDECIR — «Las dos condiciones»  `8.2`

**Qué hay que hacer:** and exige que las DOS condiciones sean True. Aquí el semáforo está en rojo pero NO hay peatón. ¿Qué muestra el programa?

**Cómo se pasa:**

- ▫️ Frenar
- ✅ Avanzar
- ▫️ Las dos cosas
- Se pasa eligiendo: **Avanzar**.

**Pistas del juego:** ¿Las dos condiciones son verdaderas?

<details><summary>Ver el código de la fase</summary>

```python
color = "rojo"
peaton = False
if color == "rojo" and peaton == True:
    print("Frenar")
else:
    print("Avanzar")
```
</details>

#### Fase 3 · ESCRIBIR — «Rojo o peatón»  `8.3`

**Qué hay que hacer:** El auto debe frenar si el semáforo está en rojo O si hay un peatón cruzando (peaton == True). En cualquier otro caso, avanza. Usa if, else y or, y muestra "Frenar" o "Avanzar". Se prueba con 4 cruces.

**Cómo se pasa:**

- Tu programa se prueba en **todos** estos casos (se ve uno con animación y los demás se prueban en silencio). Hay que acertar en cada uno:

  | Caso | Situación | Resultado esperado |
  |---|---|---|
  | verde · sin peatón |  | Mostrar «Avanzar» |
  | rojo · sin peatón |  | Mostrar «Frenar» |
  | verde · con peatón |  | Mostrar «Frenar» |
  | amarillo · sin peatón |  | Mostrar «Avanzar» |

- Tu código debe usar: `if` y `or`.

**Pistas del juego:** Une las dos preguntas con or. · if color == "rojo" or peaton == True:

**Si no pasa, el juego dice:** «Revisa los 4 cruces: hay que frenar con rojo o con peatón.»

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
if color == "rojo" or peaton == True:
    print("Frenar")
else:
    print("Avanzar")
```
</details>

#### Fase 4 · RESOLVER — «Solo con luz verde»  `8.4`

**Qué hay que hacer:** La patrulla escolar puso una regla más estricta: el auto solo avanza si el semáforo está en verde Y no hay peatón (peaton == False). Muestra "Avanzar" en ese caso y "Frenar" en cualquier otro. Se prueba con 5 cruces.

**Cómo se pasa:**

- Tu programa se prueba en **todos** estos casos (se ve uno con animación y los demás se prueban en silencio). Hay que acertar en cada uno:

  | Caso | Situación | Resultado esperado |
  |---|---|---|
  | verde · sin peatón |  | Mostrar «Avanzar» |
  | verde · con peatón |  | Mostrar «Frenar» |
  | rojo · sin peatón |  | Mostrar «Frenar» |
  | amarillo · sin peatón |  | Mostrar «Frenar» |
  | rojo · con peatón |  | Mostrar «Frenar» |

- Tu código debe usar: `if` y `and`.

**Pistas del juego:** Une las dos condiciones con and.

**Si no pasa, el juego dice:** «Solo se avanza con verde y sin peatón; todo lo demás es Frenar.»

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
if color == "verde" and peaton == False:
    print("Avanzar")
else:
    print("Frenar")
```
</details>

### Nivel 9 del Mundo 1 (id 9) — La salida

**Concepto:** robot, obstáculos y salida  ·  **Historia:** _Robot1 encontró la puerta, pero el pasillo se volvió un laberinto._

#### Fase 1 · RESOLVER — «Recupera la tarjeta»  `9.1`

**Qué hay que hacer:** Instrucción nueva: robot1.recoger() levanta el objeto de la casilla donde está Robot1. La tarjeta morada está en (2,0): ve hasta ella y recógela.

**En pantalla:** Mundo 2D: cuadrícula de 6×4; Robot1 empieza en (0,0) mirando al este; bandera en (2,0); objetos en (2,0).

**Cómo se pasa:**

- Robot1 debe terminar en la casilla (2,0).

**Pistas del juego:** Avanza hasta la casilla morada. · Después, en otra línea, robot1.recoger().

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
robot1.avanzar(2)
robot1.recoger()
```
</details>

#### Fase 2 · PREDECIR — «Lee el laberinto»  `9.2`

**Qué hay que hacer:** Robot1 está en (0,0) mirando al este y hay un muro justo en (1,0). ¿Qué instrucción debe ir PRIMERO?

**Cómo se pasa:**

- ▫️ robot1.avanzar(1), porque la meta está a la derecha
- ✅ robot1.girar("sur"), porque el este está bloqueado
- ▫️ robot1.recoger(), para quitar el muro
- Se pasa eligiendo: **robot1.girar("sur"), porque el este está bloqueado**.

**Pistas del juego:** Si la casilla de al lado tiene muro, avanzar hacia allá es chocar.

<details><summary>Ver el código de la fase</summary>

```python
# muro en (1,0)
# Robot1 en (0,0) mirando al este
```
</details>

#### Fase 3 · RESOLVER — «Escapa del laberinto»  `9.3`

**Qué hay que hacer:** La salida está en (5,3). Encuentra una ruta entre los muros y anuncia tu escape con print("Libre").

**En pantalla:** Mundo 2D: cuadrícula de 6×4; Robot1 empieza en (0,0) mirando al este; bandera en (5,3); 6 muros.

**Cómo se pasa:**

- Robot1 debe terminar en la casilla (5,3).
- El programa debe mostrar exactamente «Libre».

**Pistas del juego:** La columna 0 y la fila 3 están libres de muros. · No olvides el print("Libre").

**Si no pasa, el juego dice:** «Robot1 debe terminar en (5,3) y mostrar "Libre" con print().»

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
robot1.girar("sur")
robot1.avanzar(3)
robot1.girar("este")
robot1.avanzar(5)
print("Libre")
```
</details>

### Nivel 10 del Mundo 1 (id 10) — El Intercambio

**Concepto:** intercambiar variables con una temporal (temp)  ·  **Historia:** _En la cafetería del pueblo los pedidos salieron cruzados: el agua está en el vaso del jugo y al revés. Hay que intercambiarlos sin tirar nada._

#### Fase 1 · EXPLORAR — «Copiar no es mover»  `10.1`

**Qué hay que hacer:** Cada vaso es una variable y su líquido es un texto. vasoA = vasoB COPIA el líquido de B en A. Ejecuta y fíjate: ¿qué le pasa al agua que tenía vasoA?

**Cómo se pasa:**

- Basta con ejecutar el programa sin errores.

**Pistas del juego:** Mira el aviso rojo arriba de los vasos.

#### Fase 2 · PREDECIR — «¿Dónde quedó el agua?»  `10.2`

**Qué hay que hacer:** Después de vasoA = vasoB, ¿qué tienen los vasos?

**Cómo se pasa:**

- ✅ Los dos tienen jugo y el agua se perdió
- ▫️ Se intercambiaron: A tiene jugo y B tiene agua
- ▫️ vasoB quedó vacío
- Se pasa eligiendo: **Los dos tienen jugo y el agua se perdió**.

**Pistas del juego:** vasoB no cambió en ningún renglón.

<details><summary>Ver el código de la fase</summary>

```python
vasoA = vasoB
print(vasoA)
print(vasoB)
```
</details>

#### Fase 3 · DEBUG — «El intercambio roto»  `10.3`

**Qué hay que hacer:** Este programa quería intercambiar los líquidos, pero los dos vasos terminan iguales. Usa el vaso temp para guardar el líquido de vasoA ANTES de que se pierda (temp = vasoA). Se prueba con 3 pares de vasos.

**Cómo se pasa:**

- Tu programa se prueba en **todos** estos casos (se ve uno con animación y los demás se prueban en silencio). Hay que acertar en cada uno:

  | Caso | Situación | Resultado esperado |
  |---|---|---|
  | agua y jugo |  | Al terminar, `vasoA` debe valer "jugo" y `vasoB` debe valer "agua". · Mostrar «jugo», luego «agua» |
  | leche y cafe |  | Al terminar, `vasoA` debe valer "cafe" y `vasoB` debe valer "leche". · Mostrar «cafe», luego «leche» |
  | te y refresco |  | Al terminar, `vasoA` debe valer "refresco" y `vasoB` debe valer "te". · Mostrar «refresco», luego «te» |

- Debe crear una variable llamada `temp`.

**Pistas del juego:** Primero: temp = vasoA. · Luego vasoA = vasoB y al final vasoB = temp.

**Si no pasa, el juego dice:** «Al final vasoA debe tener lo que tenía vasoB y al revés, en los 3 pares.»

<details><summary>Ver el código de la fase</summary>

```python
vasoA = vasoB
vasoB = vasoA
print(vasoA)
print(vasoB)
```
</details>

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
temp = vasoA
vasoA = vasoB
vasoB = temp
print(vasoA)
print(vasoB)
```
</details>

#### Fase 4 · RESOLVER — «La ronda de tres vasos»  `10.4`

**Qué hay que hacer:** Ahora hay tres vasos. El líquido de vasoA debe pasar a vasoB, el de vasoB a vasoC y el de vasoC a vasoA, sin perder ninguno. Tienes un solo vaso extra: temp. Se prueba con 3 rondas distintas.

**Cómo se pasa:**

- Tu programa se prueba en **todos** estos casos (se ve uno con animación y los demás se prueban en silencio). Hay que acertar en cada uno:

  | Caso | Situación | Resultado esperado |
  |---|---|---|
  | agua, jugo, leche |  | Al terminar, `vasoA` debe valer "leche", `vasoB` debe valer "agua" y `vasoC` debe valer "jugo". |
  | cafe, te, limonada |  | Al terminar, `vasoA` debe valer "limonada", `vasoB` debe valer "cafe" y `vasoC` debe valer "te". |
  | refresco, chocolate, agua |  | Al terminar, `vasoA` debe valer "agua", `vasoB` debe valer "refresco" y `vasoC` debe valer "chocolate". |

- Debe crear una variable llamada `temp`.

**Pistas del juego:** ¿Qué líquido se perdería primero? Guárdalo en temp. · Empieza por temp = vasoC.

**Si no pasa, el juego dice:** «A debe quedar con lo de C, B con lo de A y C con lo de B, en las 3 rondas.»

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
temp = vasoC
vasoC = vasoB
vasoB = vasoA
vasoA = temp
```
</details>

### Nivel 11 del Mundo 1 (id 11) — Identificadores

**Concepto:** nombres de variables válidos (identificadores)  ·  **Historia:** _La consola del ayuntamiento no encuentra algunos datos: alguien escribió mal sus nombres. Un nombre mal escrito deja un dato huérfano._

#### Fase 1 · EXPLORAR — «Nombres válidos»  `11.1`

**Qué hay que hacer:** Concepto nuevo: el nombre de una variable (identificador) puede llevar letras, números y _, pero NO empieza con número ni lleva espacios. También importa si es mayúscula o minúscula.

**Cómo se pasa:**

- Basta con ejecutar el programa sin errores.

**Pistas del juego:** energia_total usa guion bajo en vez de espacio.

#### Fase 2 · DEBUG — «Empieza con número»  `11.2`

**Qué hay que hacer:** El nombre 2valor no es válido porque empieza con un número. Cámbialo por valor2 para que el programa muestre 5.

**Cómo se pasa:**

- Debe mostrar «5» y el código tiene que crear la variable `valor2`.

**Pistas del juego:** Pasa el 2 al final del nombre.

<details><summary>Ver el código de la fase</summary>

```python
2valor = 5
print(2valor)
```
</details>

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
valor2 = 5
print(valor2)
```
</details>

#### Fase 3 · PREDECIR — «Mayúsculas importan»  `11.3`

**Qué hay que hacer:** ¿Qué pasa al ejecutar este programa?

**Cómo se pasa:**

- ▫️ Muestra Ana
- ✅ Error: la variable nombre no existe
- ▫️ Muestra Nombre
- Se pasa eligiendo: **Error: la variable nombre no existe**.

**Pistas del juego:** Compara cómo se escribe la variable en cada línea.

<details><summary>Ver el código de la fase</summary>

```python
Nombre = "Ana"
print(nombre)
```
</details>

#### Fase 4 · DEBUG — «Una letra de más»  `11.4`

**Qué hay que hacer:** Corrige el programa para que muestre 10. Las dos líneas deben usar exactamente el mismo nombre.

**Cómo se pasa:**

- El programa debe mostrar exactamente «10».

**Pistas del juego:** Usa minúscula en la primera línea.

<details><summary>Ver el código de la fase</summary>

```python
Puntos = 10
print(puntos)
```
</details>

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
puntos = 10
print(puntos)
```
</details>

### Nivel 12 del Mundo 1 (id 12) — La Receta

**Concepto:** operadores * y /, y redondeo con int() y round()  ·  **Historia:** _Doña Rosa hará su pastel para la fiesta del pueblo. Su receta es para 4 personas, pero los invitados cambian: hay que recalcular los ingredientes._

#### Fase 1 · EXPLORAR — «Receta para el doble»  `12.1`

**Qué hay que hacer:** Para 8 invitados la receta se multiplica por factor = 8 / 4. Fíjate en el resultado: en Python la división / SIEMPRE da un decimal (2.0), y por eso huevos sale 6.0.

**Cómo se pasa:**

- Basta con ejecutar el programa sin errores.

**Pistas del juego:** Mira la etiqueta DECIMAL en la Memoria.

#### Fase 2 · PREDECIR — «¿Medio huevo?»  `12.2`

**Qué hay que hacer:** Ahora son 6 invitados. ¿Qué muestra el programa?

**Cómo se pasa:**

- ✅ 4.5
- ▫️ 4
- ▫️ 5
- Se pasa eligiendo: **4.5**.

**Pistas del juego:** Primero calcula factor.

<details><summary>Ver el código de la fase</summary>

```python
invitados = 6
factor = invitados / 4
huevos = 3 * factor
print(huevos)
```
</details>

#### Fase 3 · MODIFICAR — «Redondea los huevos»  `12.3`

**Qué hay que hacer:** Los invitados los trae cada fiesta (variable invitados). Cambia la línea de huevos para redondear al entero más cercano con el truco int(x + 0.5): int() corta los decimales, y sumar 0.5 antes hace que 4.5 suba a 5. Se prueba con 4 fiestas.

**Cómo se pasa:**

- Tu programa se prueba en **todos** estos casos (se ve uno con animación y los demás se prueban en silencio). Hay que acertar en cada uno:

  | Caso | Situación | Resultado esperado |
  |---|---|---|
  | 6 invitados |  | Al terminar, `huevos` debe valer 5. · Mostrar «5» |
  | 10 invitados |  | Al terminar, `huevos` debe valer 8. · Mostrar «8» |
  | 2 invitados |  | Al terminar, `huevos` debe valer 2. · Mostrar «2» |
  | 4 invitados |  | Al terminar, `huevos` debe valer 3. · Mostrar «3» |

- Tu código debe usar: `int`.

**Pistas del juego:** huevos = int(3 * factor + 0.5)

**Si no pasa, el juego dice:** «huevos debe ser un entero redondeado (por ejemplo, 5 con 6 invitados) en las 4 fiestas.»

<details><summary>Ver el código de la fase</summary>

```python
factor = invitados / 4
huevos = 3 * factor
print(huevos)
```
</details>

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
factor = invitados / 4
huevos = int(3 * factor + 0.5)
print(huevos)
```
</details>

#### Fase 4 · RESOLVER — «La receta completa»  `12.4`

**Qué hay que hacer:** Para los invitados de cada fiesta calcula factor = invitados / 4; huevos (3 por receta, redondeado con int(x + 0.5)) y harina (200 g por receta, con round() para quitar el .0). Muestra huevos y luego harina. Se prueba con 4 fiestas.

**Cómo se pasa:**

- Tu programa se prueba en **todos** estos casos (se ve uno con animación y los demás se prueban en silencio). Hay que acertar en cada uno:

  | Caso | Situación | Resultado esperado |
  |---|---|---|
  | 6 invitados |  | Mostrar «5», luego «300» |
  | 10 invitados |  | Mostrar «8», luego «500» |
  | 3 invitados |  | Mostrar «2», luego «150» |
  | 7 invitados |  | Mostrar «5», luego «350» |

- Tu código debe usar: `int` y `round`.
- Debe usar los operadores `*` y `/`.

**Pistas del juego:** harina = round(200 * factor)

**Si no pasa, el juego dice:** «Debe mostrar los huevos (entero) y la harina sin decimales (con round) en las 4 fiestas.»

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
factor = invitados / 4
huevos = int(3 * factor + 0.5)
harina = round(200 * factor)
print(huevos)
print(harina)
```
</details>

### Nivel 13 del Mundo 1 (id 13) — El Sistema de Energía

**Concepto:** constantes (MAXIMO) y variables que cambian  ·  **Historia:** _La planta de energía del pueblo tiene un tanque. Algunos datos no deben cambiar nunca (la capacidad máxima) y otros cambian todo el tiempo (la carga actual)._

#### Fase 1 · EXPLORAR — «MAXIMO y actual»  `13.1`

**Qué hay que hacer:** Concepto nuevo: por costumbre, los valores que NO deben cambiar se escriben en MAYÚSCULAS (MAXIMO). Los que cambian, en minúsculas. Mira qué chip se reasigna.

**Cómo se pasa:**

- Basta con ejecutar el programa sin errores.

**Pistas del juego:** Solo el chip de actual muestra «antes».

#### Fase 2 · MODIFICAR — «Hasta el tope»  `13.2`

**Qué hay que hacer:** actual vale 20 y se le suma 30. Cambia el 30 por el número correcto para que actual llegue exactamente a MAXIMO (100). Debes seguir usando una suma.

**Cómo se pasa:**

- El programa debe mostrar exactamente «100».
- Debe usar el operador `+`.

**Pistas del juego:** ¿Cuánto le falta a 20 para llegar a 100?

<details><summary>Ver el código de la fase</summary>

```python
MAXIMO = 100
actual = 20
actual = actual + 30
print(actual)
```
</details>

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
MAXIMO = 100
actual = 20
actual = actual + 80
print(actual)
```
</details>

#### Fase 3 · RESOLVER — «¿Cuánto falta?»  `13.3`

**Qué hay que hacer:** Con MAXIMO = 100 y actual = 35, calcula en faltante cuánto falta para llenar y muéstralo (65).

**Cómo se pasa:**

- Debe mostrar «65» y el código tiene que crear la variable `faltante`.
- Debe usar el operador `-`.

**Pistas del juego:** faltante = MAXIMO - actual

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
MAXIMO = 100
actual = 35
faltante = MAXIMO - actual
print(faltante)
```
</details>

### Nivel Jefe 👑 del Mundo 1 (id 44) — Laberinto ciego

**Concepto:** integración de los Bloques A a C  ·  **Historia:** _Antes del último tramo del pueblo, Robot1 debe atravesar el viejo almacén: un laberinto a oscuras. Aquí nadie te dará pasos: tendrás que calcularlos tú._

> 👑 **Nivel Jefe:** no hay botón de pistas, el editor empieza en blanco.

#### Fase 1 · RESOLVER — «Laberinto ciego»  `44.1`

**Qué hay que hacer:** El laberinto está a oscuras y esta vez nadie te dirá cuántos pasos dar. Mira el mapa, cuenta las casillas libres y programa a Robot1 para llegar a la meta, en la casilla (7,5), sin chocar con ningún muro.

**En pantalla:** Mundo 2D: cuadrícula de 8×6; Robot1 empieza en (0,0) mirando al este; bandera en (7,5); 21 muros.

**Cómo se pasa:**

- Robot1 debe terminar en la casilla (7,5).

**Si no pasa, el juego dice:** «Robot1 debe llegar a la meta (7,5) sin chocar con los muros.»

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
robot1.avanzar(5)
robot1.girar("sur")
robot1.avanzar(2)
robot1.girar("oeste")
robot1.avanzar(5)
robot1.girar("sur")
robot1.avanzar(2)
robot1.girar("este")
robot1.avanzar(7)
robot1.girar("sur")
robot1.avanzar(1)
```
</details>

### Nivel 15 del Mundo 1 (id 14) — El Pozo

**Concepto:** ciclo while, not y contadores  ·  **Historia:** _Se secó la llave del pueblo y solo queda el pozo viejo. Nadie sabe a cuántos metros está el agua: habrá que bajar la cubeta y contar._

#### Fase 1 · EXPLORAR — «Baja la cubeta»  `14.1`

**Qué hay que hacer:** El objeto pozo tiene métodos: pozo.bajar() baja la cubeta 1 metro y pozo.hayAgua() responde True si la cubeta ya llegó al agua (si no, False). Ejecuta y observa.

**Cómo se pasa:**

- Basta con ejecutar el programa sin errores.

**Pistas del juego:** Mira las marcas de metros en el pozo.

#### Fase 2 · PREDECIR — «Repetir mientras…»  `14.2`

**Qué hay que hacer:** Concepto nuevo: while repite su bloque MIENTRAS la condición sea True, y not invierte un valor lógico (not False es True). metros += 1 suma 1 al contador en cada vuelta. Si el agua está a 3 metros, ¿qué muestra este programa?

**Cómo se pasa:**

- ✅ 3
- ▫️ 1
- ▫️ Nada: se repite para siempre
- Se pasa eligiendo: **3**.

**Pistas del juego:** Cuenta cuántas veces se repite el bloque.

<details><summary>Ver el código de la fase</summary>

```python
metros = 0
while not pozo.hayAgua():
    pozo.bajar()
    metros += 1
print(metros)
```
</details>

#### Fase 3 · ESCRIBIR — «Cuenta los metros»  `14.3`

**Qué hay que hacer:** Usa while not pozo.hayAgua(): para bajar la cubeta metro a metro hasta el agua, contando los metros en la variable metros (empieza en 0 y súmale 1 en cada vuelta). Al final muestra metros. Se prueba con 3 pozos de distinta profundidad.

**Cómo se pasa:**

- Tu programa se prueba en **todos** estos casos (se ve uno con animación y los demás se prueban en silencio). Hay que acertar en cada uno:

  | Caso | Situación | Resultado esperado |
  |---|---|---|
  | Pozo de 4 m |  | Mostrar «4» |
  | Pozo de 7 m |  | Mostrar «7» |
  | Pozo de 2 m |  | Mostrar «2» |

- Tu código debe usar: `while` y `not`.
- Debe crear una variable llamada `metros`.

**Pistas del juego:** metros = 0 antes del ciclo. · Dentro del while: pozo.bajar() y metros += 1.

**Si no pasa, el juego dice:** «Debe mostrar los metros que bajó la cubeta en los 3 pozos (cada uno tiene otra profundidad).»

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
metros = 0
while not pozo.hayAgua():
    pozo.bajar()
    metros += 1
print(metros)
```
</details>

#### Fase 4 · RESOLVER — «Agua para el pueblo»  `14.4`

**Qué hay que hacer:** Ahora completa el trabajo: baja la cubeta hasta el agua contando los metros, llénala con pozo.llenar(), súbela con pozo.subir(metros) (sube esa cantidad de metros) y muestra los metros. Se prueba con 3 pozos.

**Cómo se pasa:**

- Tu programa se prueba en **todos** estos casos (se ve uno con animación y los demás se prueban en silencio). Hay que acertar en cada uno:

  | Caso | Situación | Resultado esperado |
  |---|---|---|
  | Pozo de 3 m |  |  · Mostrar «3» |
  | Pozo de 6 m |  |  · Mostrar «6» |
  | Pozo de 5 m |  |  · Mostrar «5» |

- Tu código debe usar: `while` y `not`.

**Pistas del juego:** Después del ciclo: pozo.llenar() · pozo.subir(metros) usa el contador.

**Si no pasa, el juego dice:** «La cubeta debe terminar ARRIBA y LLENA, y debes mostrar los metros, en los 3 pozos.»

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
metros = 0
while not pozo.hayAgua():
    pozo.bajar()
    metros += 1
pozo.llenar()
pozo.subir(metros)
print(metros)
```
</details>

### Nivel 16 del Mundo 1 (id 15) — El Puente de Datos

**Concepto:** input(), int(), operadores y robot juntos  ·  **Historia:** _Robot1 vuelve al río: el puente del pueblo está roto y la terminal del puente le dirá cuánto mide cada tramo._

#### Fase 1 · ESCRIBIR — «Distancia»  `15.1`

**Qué hay que hacer:** Guarda tiempo = 3 y velocidad = 12. Calcula distancia = tiempo * velocidad y muéstrala (36).

**En pantalla:** Mundo 2D: cuadrícula de 6×1; Robot1 empieza en (0,0) mirando al este; bandera en (5,0).

**Cómo se pasa:**

- Debe mostrar «36» y el código tiene que crear la variable `distancia`.
- Debe usar el operador `*`.

**Pistas del juego:** Tres variables: tiempo, velocidad y distancia.

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
tiempo = 3
velocidad = 12
distancia = tiempo * velocidad
print(distancia)
```
</details>

#### Fase 2 · RESOLVER — «Cruza con el sensor»  `15.2`

**Qué hay que hacer:** Pide un valor al sensor (escribe 10), conviértelo con int(), súmale 15 y muestra el resultado (25) usando una variable llamada resultado.

**En pantalla:** Mundo 2D: cuadrícula de 6×1; Robot1 empieza en (0,0) mirando al este; bandera en (5,0).

**Cómo se pasa:**

- Debe mostrar «25» y el código tiene que crear la variable `resultado`.

> ⌨️ Esta fase pide datos con `input()` (siempre llega como texto): cuando la terminal pregunte, escribe **10**.

**Pistas del juego:** Convierte con int(input()) antes de sumar.

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
dato = int(input())
resultado = dato + 15
print(resultado)
```
</details>

#### Fase 3 · RESOLVER — «El puente»  `15.3`

**Qué hay que hacer:** El sensor dice cuántas casillas mide el puente (escribe 3), pero Robot1 necesita 2 casillas más para bajar de él. Guarda en pasos el valor del sensor (convertido con int()) más 2, muestra pasos y haz que Robot1 avance pasos casillas para llegar a (5,0).

**En pantalla:** Mundo 2D: cuadrícula de 6×1; Robot1 empieza en (0,0) mirando al este; bandera en (5,0).

**Cómo se pasa:**

- Robot1 debe terminar en la casilla (5,0).
- El programa debe mostrar exactamente «5».

> ⌨️ Esta fase pide datos con `input()` (siempre llega como texto): cuando la terminal pregunte, escribe **3**.

**Pistas del juego:** pasos = int(input()) + 2 · robot1.avanzar(pasos)

**Si no pasa, el juego dice:** «Robot1 debe llegar a (5,0) avanzando pasos (el valor del sensor más 2), y debes mostrar pasos.»

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
pasos = int(input()) + 2
print(pasos)
robot1.avanzar(pasos)
```
</details>

### Nivel 17 del Mundo 1 (id 16) — El Cronómetro

**Concepto:** división entera // y residuo %  ·  **Historia:** _En la carrera del pueblo el cronómetro solo cuenta segundos. Los corredores quieren ver su tiempo en horas, minutos y segundos._

#### Fase 1 · EXPLORAR — «Cuántas veces cabe»  `16.1`

**Qué hay que hacer:** Concepto nuevo: // es la división ENTERA (cuántas veces cabe, sin decimales) y % es el residuo (lo que sobra). 17 // 5 es 3 porque el 5 cabe 3 veces en 17, y 17 % 5 es 2 porque sobran 2.

**Cómo se pasa:**

- Basta con ejecutar el programa sin errores.

**Pistas del juego:** 3 × 5 = 15 y sobran 2.

#### Fase 2 · PREDECIR — «Segundos a minutos»  `16.2`

**Qué hay que hacer:** total vale 125 segundos. ¿Qué muestra el programa?

**Cómo se pasa:**

- ✅ 2 y luego 5
- ▫️ 2.08 y luego 0
- ▫️ 5 y luego 2
- Se pasa eligiendo: **2 y luego 5**.

**Pistas del juego:** ¿Cuántas veces cabe 60 en 125?

<details><summary>Ver el código de la fase</summary>

```python
print(total // 60)
print(total % 60)
```
</details>

#### Fase 3 · DEBUG — «El cronómetro loco»  `16.3`

**Qué hay que hacer:** Este programa convierte total en minutos y segundos, pero los segundos salen mal. Corrige la línea de segundos: lo que sobra se calcula con %. Se prueba con 3 tiempos.

**Cómo se pasa:**

- Tu programa se prueba en **todos** estos casos (se ve uno con animación y los demás se prueban en silencio). Hay que acertar en cada uno:

  | Caso | Situación | Resultado esperado |
  |---|---|---|
  | 125 s |  | Mostrar «2», luego «5» |
  | 59 s |  | Mostrar «0», luego «59» |
  | 600 s |  | Mostrar «10», luego «0» |

- Debe usar los operadores `//` y `%`.

**Pistas del juego:** segundos = total % 60

<details><summary>Ver el código de la fase</summary>

```python
minutos = total // 60
segundos = total // 60
print(minutos)
print(segundos)
```
</details>

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
minutos = total // 60
segundos = total % 60
print(minutos)
print(segundos)
```
</details>

#### Fase 4 · RESOLVER — «Horas, minutos y segundos»  `16.4`

**Qué hay que hacer:** Convierte total en horas, minutos y segundos: horas = total // 3600 (una hora tiene 3600 s); para los minutos, quita las horas completas con total % 3600 y divide entre 60 con //; los segundos son total % 60. Muestra horas, minutos y segundos, en ese orden. Se prueba con 4 tiempos.

**Cómo se pasa:**

- Tu programa se prueba en **todos** estos casos (se ve uno con animación y los demás se prueban en silencio). Hay que acertar en cada uno:

  | Caso | Situación | Resultado esperado |
  |---|---|---|
  | 3725 s |  | Al terminar, `horas` debe valer 1, `minutos` debe valer 2 y `segundos` debe valer 5. · Mostrar «1», luego «2», luego «5» |
  | 7384 s |  | Al terminar, `horas` debe valer 2, `minutos` debe valer 3 y `segundos` debe valer 4. · Mostrar «2», luego «3», luego «4» |
  | 59 s |  | Al terminar, `horas` debe valer 0, `minutos` debe valer 0 y `segundos` debe valer 59. · Mostrar «0», luego «0», luego «59» |
  | 86399 s |  | Al terminar, `horas` debe valer 23, `minutos` debe valer 59 y `segundos` debe valer 59. · Mostrar «23», luego «59», luego «59» |

- Debe usar los operadores `//` y `%`.

**Pistas del juego:** horas = total // 3600 · minutos = total % 3600 // 60

**Si no pasa, el juego dice:** «Revisa los 4 tiempos: por ejemplo, 3725 s son 1 h, 2 min y 5 s.»

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
horas = total // 3600
minutos = total % 3600 // 60
segundos = total % 60
print(horas)
print(minutos)
print(segundos)
```
</details>

### Nivel 18 del Mundo 1 (id 17) — La Boleta

**Concepto:** expresiones booleanas sin if (True / False)  ·  **Historia:** _Fin de cursos en la escuela del pueblo. La directora quiere que el sistema decida quién aprueba, pero sin escribir un if para cada alumno._

#### Fase 1 · EXPLORAR — «Una comparación es un valor»  `17.1`

**Qué hay que hacer:** Concepto nuevo: una comparación no necesita if: da directamente True o False, y ese valor se puede guardar en una variable. Ejecuta y mira el sello.

**Cómo se pasa:**

- Basta con ejecutar el programa sin errores.

**Pistas del juego:** En la Memoria, aprobado es LÓGICO.

#### Fase 2 · PREDECIR — «Dos reglas a la vez»  `17.2`

**Qué hay que hacer:** ¿Qué muestra este programa?

**Cómo se pasa:**

- ▫️ True
- ✅ False
- ▫️ Un error, porque falta el if
- Se pasa eligiendo: **False**.

**Pistas del juego:** Revisa cada regla por separado.

<details><summary>Ver el código de la fase</summary>

```python
promedio = 90
asistencia = 75
aprobado = promedio >= 70 and asistencia >= 80
print(aprobado)
```
</details>

#### Fase 3 · ESCRIBIR — «La regla de la escuela»  `17.3`

**Qué hay que hacer:** Con promedio y asistencia (los trae cada boleta), guarda en aprobado si el alumno pasa: promedio de 70 o más Y asistencia de 80 o más. Sin if: escribe la comparación directo. Muestra aprobado. Se prueba con 4 boletas.

**Cómo se pasa:**

- Tu programa se prueba en **todos** estos casos (se ve uno con animación y los demás se prueban en silencio). Hay que acertar en cada uno:

  | Caso | Situación | Resultado esperado |
  |---|---|---|
  | 85 y 90 % |  | Al terminar, `aprobado` debe valer true. · Mostrar «True» |
  | 90 y 75 % |  | Al terminar, `aprobado` debe valer false. · Mostrar «False» |
  | 65 y 95 % |  | Al terminar, `aprobado` debe valer false. · Mostrar «False» |
  | 70 y 80 % |  | Al terminar, `aprobado` debe valer true. · Mostrar «True» |

- Tu código debe usar: `and`.
- Debe crear una variable llamada `aprobado`.

**Pistas del juego:** aprobado = promedio >= 70 and asistencia >= 80

**Si no pasa, el juego dice:** «aprobado debe ser True solo si promedio >= 70 y asistencia >= 80 (revisa las 4 boletas, incluida la del límite).»

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
aprobado = promedio >= 70 and asistencia >= 80
print(aprobado)
```
</details>

#### Fase 4 · RESOLVER — «Derecho a extraordinario»  `17.4`

**Qué hay que hacer:** Quien NO aprueba puede presentar examen extraordinario si su promedio es de 50 o más O su asistencia es de 90 o más. Calcula aprobado (la regla de antes) y extraordinario = not aprobado and (...). Muestra aprobado y luego extraordinario. Se prueba con 5 boletas.

**Cómo se pasa:**

- Tu programa se prueba en **todos** estos casos (se ve uno con animación y los demás se prueban en silencio). Hay que acertar en cada uno:

  | Caso | Situación | Resultado esperado |
  |---|---|---|
  | 85 y 90 % |  | Mostrar «True», luego «False» |
  | 65 y 95 % |  | Mostrar «False», luego «True» |
  | 40 y 70 % |  | Mostrar «False», luego «False» |
  | 55 y 60 % |  | Mostrar «False», luego «True» |
  | 90 y 75 % |  | Mostrar «False», luego «True» |

- Tu código debe usar: `and`, `or` y `not`.

**Pistas del juego:** El paréntesis agrupa la parte del or. · extraordinario = not aprobado and (promedio >= 50 or asistencia >= 90)

**Si no pasa, el juego dice:** «Revisa las 5 boletas: quien aprueba nunca va a extraordinario.»

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
aprobado = promedio >= 70 and asistencia >= 80
extraordinario = not aprobado and (promedio >= 50 or asistencia >= 90)
print(aprobado)
print(extraordinario)
```
</details>

### Nivel 19 del Mundo 1 (id 18) — El Viaje

**Concepto:** combinar operadores y round(x, 2)  ·  **Historia:** _Los amigos de Robot1 se van de paseo a la playa y quieren dividir la gasolina en partes iguales, al centavo._

#### Fase 1 · EXPLORAR — «¿Cuántos litros?»  `18.1`

**Qué hay que hacer:** El auto recorre rendimiento kilómetros con un litro. Para saber cuántos litros necesita, divide la distancia entre el rendimiento. Ejecuta y mira el indicador de gasolina.

**Cómo se pasa:**

- Basta con ejecutar el programa sin errores.

**Pistas del juego:** Mira la barra de gasolina.

#### Fase 2 · DEBUG — «El precio con coma»  `18.2`

**Qué hay que hacer:** El precio del litro se escribió como en la gasolinera: con coma. En Python los decimales se escriben con punto, no con coma. Corrige el programa para que precio valga 24.5 y se muestre.

**Cómo se pasa:**

- Al terminar, `precio` debe valer 24.5.
- El programa debe mostrar «24.5».

**Pistas del juego:** Cambia la coma por un punto.

**Si no pasa, el juego dice:** «En Python los decimales se escriben con punto, no con coma. precio debe valer 24.5 y mostrarse.»

<details><summary>Ver el código de la fase</summary>

```python
precio = 24,5
print(precio)
```
</details>

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
precio = 24.5
print(precio)
```
</details>

#### Fase 3 · PREDECIR — «Centavos de más»  `18.3`

**Qué hay que hacer:** Concepto nuevo: round(x, 2) redondea x a 2 decimales (los centavos). ¿Qué muestra este programa?

**Cómo se pasa:**

- ✅ 3.33
- ▫️ 3.3333333333333335
- ▫️ 3
- Se pasa eligiendo: **3.33**.

**Pistas del juego:** El 2 indica cuántos decimales quedan.

<details><summary>Ver el código de la fase</summary>

```python
print(round(10 / 3, 2))
```
</details>

#### Fase 4 · RESOLVER — «¿Cuánto paga cada quien?»  `18.4`

**Qué hay que hacer:** Con los datos de cada viaje calcula litros = distancia / rendimiento, costo = litros * precio y por_persona = round(costo / pasajeros, 2). Muestra costo y luego por_persona. Se prueba con 4 viajes.

**Cómo se pasa:**

- Tu programa se prueba en **todos** estos casos (se ve uno con animación y los demás se prueban en silencio). Hay que acertar en cada uno:

  | Caso | Situación | Resultado esperado |
  |---|---|---|
  | 240 km · 3 personas |  | Al terminar, `por_persona` debe valer 163.33. · Mostrar «490.0», luego «163.33» |
  | 150 km · 4 personas |  | Al terminar, `por_persona` debe valer 59.5. · Mostrar «238.0», luego «59.5» |
  | 100 km · 3 personas |  | Al terminar, `por_persona` debe valer 104.17. · Mostrar «312.5», luego «104.17» |
  | 360 km · 5 personas |  | Al terminar, `por_persona` debe valer 124.97. · Mostrar «624.8571428571429», luego «124.97» |

- Tu código debe usar: `round`.
- Debe usar los operadores `/` y `*`.

**Pistas del juego:** Tres variables: litros, costo y por_persona. · por_persona = round(costo / pasajeros, 2)

**Si no pasa, el juego dice:** «Revisa los 4 viajes: por_persona debe redondearse a 2 decimales con round(…, 2).»

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
litros = distancia / rendimiento
costo = litros * precio
por_persona = round(costo / pasajeros, 2)
print(costo)
print(por_persona)
```
</details>

### Nivel Jefe 👑 del Mundo 1 (id 45) — La Caja Fuerte

**Concepto:** integración del Mundo 1  ·  **Historia:** _El alcalde guardó el tesoro del pueblo en 4 cajas fuertes y olvidó los códigos. Solo queda una fórmula y los datos que llegan por la terminal._

> 👑 **Nivel Jefe:** no hay botón de pistas, el editor empieza en blanco y se prueba en varios casos.

#### Fase 1 · RESOLVER — «La Caja Fuerte»  `45.1`

**Qué hay que hacer:** El tesoro del pueblo está repartido en 4 cajas fuertes. Cada una se abre con un código que tú calculas. La terminal te enviará, uno por uno y como texto, cuatro números: a, b, c y d. El código es: la suma de a y b, multiplicada por c, menos el residuo de dividir d entre 7, es decir (a + b) * c - d % 7. Muéstralo con print(). Se prueba con las 4 cajas.

**Cómo se pasa:**

- Tu programa se prueba en **todos** estos casos (se ve uno con animación y los demás se prueban en silencio). Hay que acertar en cada uno:

  | Caso | Situación | Resultado esperado |
  |---|---|---|
  | Caja 1 |  | Mostrar «46» |
  | Caja 2 |  | Mostrar «29» |
  | Caja 3 |  | Mostrar «82» |
  | Caja 4 |  | Mostrar «-6» |

- Tu código debe usar: `int` y `input`.
- Debe usar los operadores `+`, `*`, `-` y `%`.

**Si no pasa, el juego dice:** «El código debe ser (a + b) * c - d % 7 para las 4 cajas. Recuerda convertir lo que llega de input().»

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
a = int(input())
b = int(input())
c = int(input())
d = int(input())
codigo = (a + b) * c - d % 7
print(codigo)
```
</details>

> 🎬 **Al terminar este nivel** aparece la pantalla de transición: _¡Las 4 cajas están abiertas y el pueblo está a salvo! Robot1 ya domina los fundamentos y los datos. Ahora una mesa de cartas holográfica lo espera para enseñarle a decidir. Entra al Mundo 2: Lógica._

---

## Mundo 2 · Lógica

- **Escenario:** Sala de Estrategia (mesa de cartas).
- **Qué se aprende:** Decisiones con `if`, `elif`, `else`, comparadores y `and` / `or` / `not`. Al ejecutar las cartas se voltean y cada pregunta se juzga con ✓ VERDADERO o ✗ FALSO.
- **Niveles:** 13 · **Estrellas posibles:** 39

### Nivel 1 del Mundo 2 (id 20) — Pasarse de 21

**Concepto:** condicional if  ·  **Historia:** _Robot1 cruza la puerta y entra a la Sala de Estrategia: una mesa de cartas holográfica que solo se abre ante quien sabe tomar decisiones._

#### Fase 1 · EXPLORAR — «La primera decisión»  `20.1`

**Qué hay que hacer:** Concepto nuevo: if ("si") ejecuta las líneas con sangría SOLO cuando la condición es verdadera. Aquí numero es el total de la mano. Ejecuta y cambia de mesa para ver cuándo se cumple.

**Cómo se pasa:**

- Basta con ejecutar el programa sin errores. Los botones de arriba del escenario permiten probarlo en distintas situaciones:
  - **Mesa 1 · 25:** Cartas: 10♠ 9♠ 6♠ (total 25) · `numero` = 25
  - **Mesa 2 · 18:** Cartas: 10♠ 8♠ (total 18) · `numero` = 18

**Pistas del juego:** Mira el sello VERDADERO / FALSO que aparece en la mesa.

#### Fase 2 · PREDECIR — «¿Dice Bust?»  `20.2`

**Qué hay que hacer:** La mano suma 25. ¿Qué muestra este programa?

**En pantalla:** Mesa: 10♠ 9♠ 6♠ (total 25).

**Cómo se pasa:**

- ▫️ No muestra nada
- ✅ Bust
- ▫️ Un error
- Se pasa eligiendo: **Bust**.

**Pistas del juego:** ¿25 > 21 es verdadero o falso?

<details><summary>Ver el código de la fase</summary>

```python
if numero > 21:
    print("Bust")
```
</details>

#### Fase 3 · MODIFICAR — «La casa cambia el límite»  `20.3`

**Qué hay que hacer:** La casa cambió las reglas: ahora hay Bust cuando numero es mayor que 18. Modifica el programa (solo hay que cambiar un número). Se prueba en 4 mesas.

**Cómo se pasa:**

- Tu programa se prueba en **todos** estos casos (se ve uno con animación y los demás se prueban en silencio). Hay que acertar en cada uno:

  | Caso | Situación | Resultado esperado |
  |---|---|---|
  | Mesa 1 · 25 | Cartas: 10♠ 9♠ 6♠ (total 25) · `numero` = 25 | Mostrar «Bust» |
  | Mesa 2 · 19 | Cartas: 10♠ 9♠ (total 19) · `numero` = 19 | Mostrar «Bust» |
  | Mesa 3 · 18 | Cartas: 10♠ 8♠ (total 18) · `numero` = 18 | **No mostrar nada** |
  | Mesa 4 · 12 | Cartas: 7♠ 5♠ (total 12) · `numero` = 12 | **No mostrar nada** |

- Tu código debe usar: `if`.

**Pistas del juego:** El límite ahora es 18.

**Si no pasa, el juego dice:** «Con 19 hay Bust, pero con 18 exacto todavía no.»

<details><summary>Ver el código de la fase</summary>

```python
if numero > 21:
    print("Bust")
```
</details>

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
if numero > 18:
    print("Bust")
```
</details>

### Nivel 2 del Mundo 2 (id 21) — Ganar o perder

**Concepto:** if / else  ·  **Historia:** _La mesa quiere una respuesta para cada situación, no solo para una._

#### Fase 1 · EXPLORAR — «Dos caminos»  `21.1`

**Qué hay que hacer:** Concepto nuevo: else ("si no") es el camino alternativo: se ejecuta cuando la condición del if es falsa. Siempre se ejecuta UNA de las dos ramas.

**Cómo se pasa:**

- Basta con ejecutar el programa sin errores. Los botones de arriba del escenario permiten probarlo en distintas situaciones:
  - **Mesa 1 · 25:** Cartas: 10♠ 9♠ 6♠ (total 25)
  - **Mesa 2 · 17:** Cartas: 10♠ 7♠ (total 17)

**Pistas del juego:** Prueba las dos mesas y compara.

#### Fase 2 · PREDECIR — «¿Gana o pierde?»  `21.2`

**Qué hay que hacer:** La mano suma 17. ¿Qué muestra este programa?

**En pantalla:** Mesa: 10♠ 7♠ (total 17).

**Cómo se pasa:**

- ▫️ Perdiste
- ✅ Ganaste
- ▫️ Perdiste y Ganaste
- Se pasa eligiendo: **Ganaste**.

**Pistas del juego:** ¿17 > 21?

<details><summary>Ver el código de la fase</summary>

```python
if total > 21:
    print("Perdiste")
else:
    print("Ganaste")
```
</details>

#### Fase 3 · MODIFICAR — «Una casa más estricta»  `21.3`

**Qué hay que hacer:** Ahora la casa pierde a quien suma más de 17. Modifica el programa para que muestre Perdiste con total mayor que 17 y Ganaste en cualquier otro caso.

**Cómo se pasa:**

- Tu programa se prueba en **todos** estos casos (se ve uno con animación y los demás se prueban en silencio). Hay que acertar en cada uno:

  | Caso | Situación | Resultado esperado |
  |---|---|---|
  | Mesa 1 · 25 | Cartas: 10♠ 9♠ 6♠ (total 25) | Mostrar «Perdiste» |
  | Mesa 2 · 18 | Cartas: 10♠ 8♠ (total 18) | Mostrar «Perdiste» |
  | Mesa 3 · 17 | Cartas: 10♠ 7♠ (total 17) | Mostrar «Ganaste» |
  | Mesa 4 · 12 | Cartas: 7♠ 5♠ (total 12) | Mostrar «Ganaste» |

- Tu código debe usar: `if` y `else`.

**Pistas del juego:** Cambia el número de la condición.

**Si no pasa, el juego dice:** «Con 18 ya se pierde; con 17 todavía se gana.»

<details><summary>Ver el código de la fase</summary>

```python
if total > 21:
    print("Perdiste")
else:
    print("Ganaste")
```
</details>

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
if total > 17:
    print("Perdiste")
else:
    print("Ganaste")
```
</details>

### Nivel 3 del Mundo 2 (id 22) — Comparar es preguntar

**Concepto:** comparación de igualdad (==)  ·  **Historia:** _Una condición es una pregunta. La más común es: ¿son iguales?_

#### Fase 1 · EXPLORAR — «¿Son iguales?»  `22.1`

**Qué hay que hacer:** Concepto nuevo: == pregunta si dos valores son iguales y != si son distintos. OJO: un solo = guarda un valor; DOS == preguntan.

**Cómo se pasa:**

- Basta con ejecutar el programa sin errores. Los botones de arriba del escenario permiten probarlo en distintas situaciones:
  - **Mesa 1 · 14:** Cartas: 7♠ 7♠ (total 14)
  - **Mesa 2 · 16:** Cartas: 7♠ 9♠ (total 16)

**Pistas del juego:** Compara el sello de la mesa en las dos manos.

#### Fase 2 · PREDECIR — «Distinto de»  `22.2`

**Qué hay que hacer:** Las dos cartas valen 6. ¿Qué muestra este programa?

**En pantalla:** Mesa: 6♠ 6♠ (total 12).

**Cómo se pasa:**

- ▫️ Distintas
- ✅ Par
- ▫️ Nada
- Se pasa eligiendo: **Par**.

**Pistas del juego:** != significa «es distinto de».

<details><summary>Ver el código de la fase</summary>

```python
if carta1 != carta2:
    print("Distintas")
else:
    print("Par")
```
</details>

#### Fase 3 · MODIFICAR — «Solo el 21 exacto»  `22.3`

**Qué hay que hacer:** Este programa da Blackjack con cualquier total mayor que 21. Modifícalo para que solo se muestre Blackjack con 21 exacto; en cualquier otro caso, Sigue.

**Cómo se pasa:**

- Tu programa se prueba en **todos** estos casos (se ve uno con animación y los demás se prueban en silencio). Hay que acertar en cada uno:

  | Caso | Situación | Resultado esperado |
  |---|---|---|
  | Mesa 1 · 21 | Cartas: 11♥ 10♠ (total 21) | Mostrar «Blackjack» |
  | Mesa 2 · 21 | Cartas: 7♠ 7♠ 7♠ (total 21) | Mostrar «Blackjack» |
  | Mesa 3 · 20 | Cartas: 10♠ 10♠ (total 20) | Mostrar «Sigue» |
  | Mesa 4 · 22 | Cartas: 10♠ 9♠ 3♠ (total 22) | Mostrar «Sigue» |

- Tu código debe usar: `if` y `else`.

**Pistas del juego:** Cambia > por ==

**Si no pasa, el juego dice:** «Con 22 NO es Blackjack.»

<details><summary>Ver el código de la fase</summary>

```python
if total > 21:
    print("Blackjack")
else:
    print("Sigue")
```
</details>

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
if total == 21:
    print("Blackjack")
else:
    print("Sigue")
```
</details>

### Nivel 4 del Mundo 2 (id 23) — Mayor, menor o igual

**Concepto:** comparación de orden (<, >, <=, >=)  ·  **Historia:** _Comparar también es decir quién es mayor. Y a veces el empate cuenta._

#### Fase 1 · EXPLORAR — «¿Quién gana?»  `23.1`

**Qué hay que hacer:** Concepto nuevo: < menor, > mayor, <= menor o igual, >= mayor o igual. Compara las dos cartas y mira el resultado en cada mesa.

**Cómo se pasa:**

- Basta con ejecutar el programa sin errores. Los botones de arriba del escenario permiten probarlo en distintas situaciones:
  - **Mesa 1 · 16:** Cartas: 9♠ 7♠ (total 16)
  - **Mesa 2 · 16:** Cartas: 7♠ 9♠ (total 16)
  - **Mesa 3 · 16:** Cartas: 8♠ 8♠ (total 16)

**Pistas del juego:** Prueba la mesa del empate.

#### Fase 2 · PREDECIR — «Con empate»  `23.2`

**Qué hay que hacer:** Las dos cartas valen 7. ¿Qué muestra este programa?

**En pantalla:** Mesa: 7♠ 7♠ (total 14).

**Cómo se pasa:**

- ✅ Gana o empata
- ▫️ Pierde
- ▫️ Nada
- Se pasa eligiendo: **Gana o empata**.

**Pistas del juego:** ¿7 >= 7?

<details><summary>Ver el código de la fase</summary>

```python
if carta1 >= carta2:
    print("Gana o empata")
else:
    print("Pierde")
```
</details>

#### Fase 3 · MODIFICAR — «El empate también gana»  `23.3`

**Qué hay que hacer:** Ahora el empate favorece a la primera carta. Modifica el programa para mostrar Gana la primera cuando carta1 sea mayor O IGUAL que carta2.

**Cómo se pasa:**

- Tu programa se prueba en **todos** estos casos (se ve uno con animación y los demás se prueban en silencio). Hay que acertar en cada uno:

  | Caso | Situación | Resultado esperado |
  |---|---|---|
  | Mesa 1 · 16 | Cartas: 9♠ 7♠ (total 16) | Mostrar «Gana la primera» |
  | Mesa 2 · 16 | Cartas: 7♠ 9♠ (total 16) | Mostrar «No gana» |
  | Mesa 3 · 16 | Cartas: 8♠ 8♠ (total 16) | Mostrar «Gana la primera» |
  | Mesa 4 · 4 | Cartas: 2♠ 2♠ (total 4) | Mostrar «Gana la primera» |

- Tu código debe usar: `if` y `else`.

**Pistas del juego:** Cambia > por >=

**Si no pasa, el juego dice:** «Revisa la mesa del empate.»

<details><summary>Ver el código de la fase</summary>

```python
if carta1 > carta2:
    print("Gana la primera")
else:
    print("No gana")
```
</details>

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
if carta1 >= carta2:
    print("Gana la primera")
else:
    print("No gana")
```
</details>

### Nivel 5 del Mundo 2 (id 24) — Dos condiciones a la vez

**Concepto:** operador lógico and  ·  **Historia:** _A veces una sola pregunta no alcanza: la mesa pide que se cumplan dos cosas a la vez._

#### Fase 1 · DEBUG — «Roja Y segura»  `24.1`

**Qué hay que hacer:** Concepto nuevo: and ("y") exige que AMBAS condiciones sean verdaderas. Ahora también hay color1 ("roja" o "negra"). Debe mostrar Apuesta solo si carta1 es roja Y el total es menor que 21, pero está usando or. Corrígelo.

**En pantalla:** Las cartas empiezan boca abajo y se voltean al ejecutar.

**Cómo se pasa:**

- Tu programa se prueba en **todos** estos casos (se ve uno con animación y los demás se prueban en silencio). Hay que acertar en cada uno:

  | Caso | Situación | Resultado esperado |
  |---|---|---|
  | Mesa 1 · 17 | Cartas: 8♥ 9♦ (total 17) | Mostrar «Apuesta» |
  | Mesa 2 · 23 | Cartas: 8♥ 10♦ 5♥ (total 23) | Mostrar «Pasa» |
  | Mesa 3 · 17 | Cartas: 8♠ 9♦ (total 17) | Mostrar «Pasa» |
  | Mesa 4 · 21 | Cartas: 10♥ 11♦ (total 21) | Mostrar «Pasa» |

- Tu código debe usar: `and`.

**Pistas del juego:** Cambia la palabra que une las dos preguntas.

**Si no pasa, el juego dice:** «Debe cumplirse color Y total a la vez.»

<details><summary>Ver el código de la fase</summary>

```python
if color1 == "roja" or total < 21:
    print("Apuesta")
else:
    print("Pasa")
```
</details>

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
if color1 == "roja" and total < 21:
    print("Apuesta")
else:
    print("Pasa")
```
</details>

#### Fase 2 · ESCRIBIR — «Zona segura»  `24.2`

**Qué hay que hacer:** Si total es 15 o más Y a la vez 20 o menos, muestra Zona segura; en cualquier otro caso, Fuera. Usa and.

**En pantalla:** Las cartas empiezan boca abajo y se voltean al ejecutar.

**Cómo se pasa:**

- Tu programa se prueba en **todos** estos casos (se ve uno con animación y los demás se prueban en silencio). Hay que acertar en cada uno:

  | Caso | Situación | Resultado esperado |
  |---|---|---|
  | Mesa 1 · 14 | Cartas: 8♠ 6♠ (total 14) | Mostrar «Fuera» |
  | Mesa 2 · 15 | Cartas: 8♠ 7♠ (total 15) | Mostrar «Zona segura» |
  | Mesa 3 · 18 | Cartas: 10♠ 8♠ (total 18) | Mostrar «Zona segura» |
  | Mesa 4 · 20 | Cartas: 10♠ 10♠ (total 20) | Mostrar «Zona segura» |
  | Mesa 5 · 21 | Cartas: 11♥ 10♠ (total 21) | Mostrar «Fuera» |
  | Mesa 6 · 25 | Cartas: 10♠ 9♠ 6♠ (total 25) | Mostrar «Fuera» |

- Tu código debe usar: `if`, `else` y `and`.

**Pistas del juego:** total >= 15 and total <= 20

**Si no pasa, el juego dice:** «Los extremos (15 y 20) sí están dentro de la zona; 14 y 21 no.»

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
if total >= 15 and total <= 20:
    print("Zona segura")
else:
    print("Fuera")
```
</details>

#### Fase 3 · DEBUG — «El símbolo equivocado»  `24.3`

**Qué hay que hacer:** Este programa da un error porque usa un símbolo de otro lenguaje para decir «y». En Python se escribe con la palabra and. Corrígelo.

**En pantalla:** Las cartas empiezan boca abajo y se voltean al ejecutar.

**Cómo se pasa:**

- Tu programa se prueba en **todos** estos casos (se ve uno con animación y los demás se prueban en silencio). Hay que acertar en cada uno:

  | Caso | Situación | Resultado esperado |
  |---|---|---|
  | Mesa 1 · 17 | Cartas: 8♥ 9♦ (total 17) | Mostrar «Apuesta» |
  | Mesa 2 · 23 | Cartas: 8♥ 10♦ 5♥ (total 23) | Mostrar «Pasa» |
  | Mesa 3 · 17 | Cartas: 8♠ 9♦ (total 17) | Mostrar «Pasa» |
  | Mesa 4 · 21 | Cartas: 10♥ 11♦ (total 21) | Mostrar «Pasa» |

- Tu código debe usar: `and`.

**Pistas del juego:** Cambia && por una palabra.

<details><summary>Ver el código de la fase</summary>

```python
if color1 == "roja" && total < 21:
    print("Apuesta")
else:
    print("Pasa")
```
</details>

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
if color1 == "roja" and total < 21:
    print("Apuesta")
else:
    print("Pasa")
```
</details>

### Nivel 6 del Mundo 2 (id 25) — O, y no

**Concepto:** operadores lógicos or y not  ·  **Historia:** _Otras veces basta con que se cumpla una de varias cosas, o hay que dar la vuelta a una pregunta._

#### Fase 1 · DEBUG — «Alguna roja»  `25.1`

**Qué hay que hacer:** Concepto nuevo: or ("o") exige que al menos UNA condición sea verdadera. Este programa debería mostrar Hay roja si carta1 O carta2 es roja, pero usa and. Corrígelo.

**En pantalla:** Las cartas empiezan boca abajo y se voltean al ejecutar.

**Cómo se pasa:**

- Tu programa se prueba en **todos** estos casos (se ve uno con animación y los demás se prueban en silencio). Hay que acertar en cada uno:

  | Caso | Situación | Resultado esperado |
  |---|---|---|
  | Mesa 1 · 17 | Cartas: 8♥ 9♠ (total 17) | Mostrar «Hay roja» |
  | Mesa 2 · 17 | Cartas: 8♠ 9♥ (total 17) | Mostrar «Hay roja» |
  | Mesa 3 · 17 | Cartas: 8♠ 9♣ (total 17) | Mostrar «Todo negro» |
  | Mesa 4 · 17 | Cartas: 8♥ 9♦ (total 17) | Mostrar «Hay roja» |

- Tu código debe usar: `or`.

**Pistas del juego:** Cambia la palabra que une las dos preguntas.

<details><summary>Ver el código de la fase</summary>

```python
if color1 == "roja" and color2 == "roja":
    print("Hay roja")
else:
    print("Todo negro")
```
</details>

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
if color1 == "roja" or color2 == "roja":
    print("Hay roja")
else:
    print("Todo negro")
```
</details>

#### Fase 2 · ESCRIBIR — «Lo contrario»  `25.2`

**Qué hay que hacer:** Concepto nuevo: not invierte una condición. Usa not para mostrar Negra cuando carta1 NO sea roja y Roja cuando sí lo sea.

**En pantalla:** Las cartas empiezan boca abajo y se voltean al ejecutar.

**Cómo se pasa:**

- Tu programa se prueba en **todos** estos casos (se ve uno con animación y los demás se prueban en silencio). Hay que acertar en cada uno:

  | Caso | Situación | Resultado esperado |
  |---|---|---|
  | Mesa 1 · 17 | Cartas: 8♥ 9♠ (total 17) | Mostrar «Roja» |
  | Mesa 2 · 17 | Cartas: 8♠ 9♠ (total 17) | Mostrar «Negra» |
  | Mesa 3 · 17 | Cartas: 8♦ 9♠ (total 17) | Mostrar «Roja» |
  | Mesa 4 · 17 | Cartas: 8♣ 9♠ (total 17) | Mostrar «Negra» |

- Tu código debe usar: `if`, `else` y `not`.

**Pistas del juego:** not color1 == "roja"

**Si no pasa, el juego dice:** «Debes usar not en la condición.»

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
if not color1 == "roja":
    print("Negra")
else:
    print("Roja")
```
</details>

#### Fase 3 · PREDECIR — «Quién va primero»  `25.3`

**Qué hay que hacer:** Primero se resuelve not, luego and y al final or. ¿Qué muestra este programa?

**Cómo se pasa:**

- ✅ A
- ▫️ B
- ▫️ Nada
- Se pasa eligiendo: **A**.

**Pistas del juego:** and se resuelve antes que or.

<details><summary>Ver el código de la fase</summary>

```python
if True or False and False:
    print("A")
else:
    print("B")
```
</details>

### Nivel 7 del Mundo 2 (id 26) — Varios caminos

**Concepto:** elif  ·  **Historia:** _Cuando hay más de dos situaciones, encadenar muchos if se vuelve un laberinto. Hay una forma más limpia._

#### Fase 1 · DEBUG — «Ifs que se pisan»  `26.1`

**Qué hay que hacer:** Concepto nuevo: elif ("si no, y además...") añade otra pregunta; se evalúan en orden y solo se ejecuta la PRIMERA rama verdadera. Este programa imprime DOS mensajes cuando se pasa de 21. Corrígelo.

**En pantalla:** Las cartas empiezan boca abajo y se voltean al ejecutar.

**Cómo se pasa:**

- Tu programa se prueba en **todos** estos casos (se ve uno con animación y los demás se prueban en silencio). Hay que acertar en cada uno:

  | Caso | Situación | Resultado esperado |
  |---|---|---|
  | Mesa 1 · 25 | Cartas: 10♠ 9♠ 6♠ (total 25) | Mostrar «Bust» |
  | Mesa 2 · 18 | Cartas: 10♠ 8♠ (total 18) | Mostrar «Te plantas» |
  | Mesa 3 · 10 | Cartas: 5♠ 5♠ (total 10) | Mostrar «Pide carta» |

- Tu código debe usar: `elif`.

**Pistas del juego:** La segunda pregunta debería depender de la primera.

<details><summary>Ver el código de la fase</summary>

```python
if total > 21:
    print("Bust")
if total >= 17:
    print("Te plantas")
else:
    print("Pide carta")
```
</details>

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
if total > 21:
    print("Bust")
elif total >= 17:
    print("Te plantas")
else:
    print("Pide carta")
```
</details>

#### Fase 2 · PREDECIR — «¿Cuántas ramas se ejecutan?»  `26.2`

**Qué hay que hacer:** La mano suma 19. ¿Qué muestra este programa?

**En pantalla:** Mesa: 10♠ 9♠ (total 19).

**Cómo se pasa:**

- ✅ Te plantas
- ▫️ Te plantas y Pide carta
- ▫️ Pide carta
- Se pasa eligiendo: **Te plantas**.

**Pistas del juego:** Solo una rama se ejecuta.

<details><summary>Ver el código de la fase</summary>

```python
if total > 21:
    print("Bust")
elif total == 21:
    print("Blackjack")
elif total >= 17:
    print("Te plantas")
else:
    print("Pide carta")
```
</details>

#### Fase 3 · ESCRIBIR — «Las cuatro reglas»  `26.3`

**Qué hay que hacer:** Si total > 21 muestra Bust; si es 21 muestra Blackjack; si es 17 o más muestra Te plantas; en cualquier otro caso muestra Pide carta. Usa elif.

**En pantalla:** Las cartas empiezan boca abajo y se voltean al ejecutar.

**Cómo se pasa:**

- Tu programa se prueba en **todos** estos casos (se ve uno con animación y los demás se prueban en silencio). Hay que acertar en cada uno:

  | Caso | Situación | Resultado esperado |
  |---|---|---|
  | Mesa 1 · 25 | Cartas: 10♠ 9♠ 6♠ (total 25) | Mostrar «Bust» |
  | Mesa 2 · 21 | Cartas: 11♥ 10♠ (total 21) | Mostrar «Blackjack» |
  | Mesa 3 · 19 | Cartas: 10♠ 9♠ (total 19) | Mostrar «Te plantas» |
  | Mesa 4 · 17 | Cartas: 10♠ 7♠ (total 17) | Mostrar «Te plantas» |
  | Mesa 5 · 12 | Cartas: 7♠ 5♠ (total 12) | Mostrar «Pide carta» |

- Tu código debe usar: `if`, `elif` y `else`.

**Pistas del juego:** El orden importa: pregunta primero lo más específico. · Se escribe elif condición:

**Si no pasa, el juego dice:** «Revisa el orden de las preguntas y que 21 sea Blackjack, no Te plantas.»

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
if total > 21:
    print("Bust")
elif total == 21:
    print("Blackjack")
elif total >= 17:
    print("Te plantas")
else:
    print("Pide carta")
```
</details>

#### Fase 4 · DEBUG — «El else se adelantó»  `26.4`

**Qué hay que hacer:** Este programa da error: un elif nunca puede ir después de un else. Reordena las ramas para que el else sea la última.

**En pantalla:** Las cartas empiezan boca abajo y se voltean al ejecutar.

**Cómo se pasa:**

- Tu programa se prueba en **todos** estos casos (se ve uno con animación y los demás se prueban en silencio). Hay que acertar en cada uno:

  | Caso | Situación | Resultado esperado |
  |---|---|---|
  | Mesa 1 · 25 | Cartas: 10♠ 9♠ 6♠ (total 25) | Mostrar «Bust» |
  | Mesa 2 · 21 | Cartas: 11♥ 10♠ (total 21) | Mostrar «Blackjack» |
  | Mesa 3 · 18 | Cartas: 10♠ 8♠ (total 18) | Mostrar «Sigue» |

- Tu código debe usar: `elif` y `else`.

**Pistas del juego:** Cambia el orden de las ramas.

<details><summary>Ver el código de la fase</summary>

```python
if total > 21:
    print("Bust")
else:
    print("Sigue")
elif total == 21:
    print("Blackjack")
```
</details>

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
if total > 21:
    print("Bust")
elif total == 21:
    print("Blackjack")
else:
    print("Sigue")
```
</details>

### Nivel 8 del Mundo 2 (id 27) — Decisiones dentro de decisiones

**Concepto:** condicionales anidados  ·  **Historia:** _Algunas reglas tienen una pregunta dentro de otra, como una puerta que lleva a otra puerta._

#### Fase 1 · DEBUG — «Falta una sangría»  `27.1`

**Qué hay que hacer:** Concepto nuevo: un if puede ir DENTRO de otro; la sangría indica a cuál pertenece cada línea (cuanto más a la derecha, más adentro). A este programa le falta una sangría y da error. Corrígelo.

**En pantalla:** Las cartas empiezan boca abajo y se voltean al ejecutar.

**Cómo se pasa:**

- Tu programa se prueba en **todos** estos casos (se ve uno con animación y los demás se prueban en silencio). Hay que acertar en cada uno:

  | Caso | Situación | Resultado esperado |
  |---|---|---|
  | Mesa 1 · 21 | Cartas: 11♥ 10♠ (total 21) | Mostrar «Blackjack» |
  | Mesa 2 · 18 | Cartas: 10♠ 8♠ (total 18) | Mostrar «Seguro» |
  | Mesa 3 · 25 | Cartas: 10♠ 9♠ 6♠ (total 25) | Mostrar «Bust» |

- Tu código debe usar: `if` y `else`.

**Pistas del juego:** Mira la última línea.

<details><summary>Ver el código de la fase</summary>

```python
if total <= 21:
    if total == 21:
        print("Blackjack")
    else:
        print("Seguro")
else:
print("Bust")
```
</details>

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
if total <= 21:
    if total == 21:
        print("Blackjack")
    else:
        print("Seguro")
else:
    print("Bust")
```
</details>

#### Fase 2 · PREDECIR — «¿Qué camino toma?»  `27.2`

**Qué hay que hacer:** La mano suma 18. ¿Qué muestra este programa?

**En pantalla:** Mesa: 10♠ 8♠ (total 18).

**Cómo se pasa:**

- ▫️ Blackjack
- ✅ Seguro
- ▫️ Bust
- Se pasa eligiendo: **Seguro**.

**Pistas del juego:** Primero responde la pregunta de afuera.

<details><summary>Ver el código de la fase</summary>

```python
if total <= 21:
    if total == 21:
        print("Blackjack")
    else:
        print("Seguro")
else:
    print("Bust")
```
</details>

#### Fase 3 · ESCRIBIR — «El árbol de decisiones»  `27.3`

**Qué hay que hacer:** Si total es mayor que 21 muestra Bust. Si no, y total es exactamente 21, muestra Blackjack; en el resto de los casos muestra Seguro. Usa un if dentro de otro.

**En pantalla:** Las cartas empiezan boca abajo y se voltean al ejecutar.

**Cómo se pasa:**

- Tu programa se prueba en **todos** estos casos (se ve uno con animación y los demás se prueban en silencio). Hay que acertar en cada uno:

  | Caso | Situación | Resultado esperado |
  |---|---|---|
  | Mesa 1 · 21 | Cartas: 11♥ 10♠ (total 21) | Mostrar «Blackjack» |
  | Mesa 2 · 18 | Cartas: 10♠ 8♠ (total 18) | Mostrar «Seguro» |
  | Mesa 3 · 25 | Cartas: 10♠ 9♠ 6♠ (total 25) | Mostrar «Bust» |
  | Mesa 4 · 22 | Cartas: 10♠ 10♠ 2♠ (total 22) | Mostrar «Bust» |
  | Mesa 5 · 5 | Cartas: 2♠ 3♠ (total 5) | Mostrar «Seguro» |

- Tu código debe usar: `if` y `else`.

**Pistas del juego:** Decide primero si se pasó o no. · Dentro del caso «no se pasó», compara con 21.

**Si no pasa, el juego dice:** «Revisa cada mesa: 21 es Blackjack, menos de 21 es Seguro, más de 21 es Bust.»

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
if total <= 21:
    if total == 21:
        print("Blackjack")
    else:
        print("Seguro")
else:
    print("Bust")
```
</details>

### Nivel 9 del Mundo 2 (id 28) — El aviso del crupier

**Concepto:** reglas con elif  ·  **Historia:** _El crupier holográfico empieza a exigir reglas completas. Ya no basta con acertar una mesa: tu programa se prueba en muchas._

#### Fase 1 · RESOLVER — «Tres jugadas»  `28.1`

**Qué hay que hacer:** Si total > 21 muestra Bust; si no, si total es 17 o más muestra Te plantas; en cualquier otro caso muestra Pide carta. Se prueba en 6 mesas.

**En pantalla:** Las cartas empiezan boca abajo y se voltean al ejecutar.

**Cómo se pasa:**

- Tu programa se prueba en **todos** estos casos (se ve uno con animación y los demás se prueban en silencio). Hay que acertar en cada uno:

  | Caso | Situación | Resultado esperado |
  |---|---|---|
  | Mesa 1 · 25 | Cartas: 10♠ 9♠ 6♠ (total 25) | Mostrar «Bust» |
  | Mesa 2 · 21 | Cartas: 11♥ 10♠ (total 21) | Mostrar «Te plantas» |
  | Mesa 3 · 17 | Cartas: 10♠ 7♠ (total 17) | Mostrar «Te plantas» |
  | Mesa 4 · 16 | Cartas: 10♠ 6♠ (total 16) | Mostrar «Pide carta» |
  | Mesa 5 · 12 | Cartas: 7♠ 5♠ (total 12) | Mostrar «Pide carta» |
  | Mesa 6 · 4 | Cartas: 2♠ 2♠ (total 4) | Mostrar «Pide carta» |

- Tu código debe usar: `if`, `elif` y `else`.

**Pistas del juego:** Una cadena: if, elif, else.

**Si no pasa, el juego dice:** «Revisa los bordes: 21 se planta, 17 se planta, 16 pide.»

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
if total > 21:
    print("Bust")
elif total >= 17:
    print("Te plantas")
else:
    print("Pide carta")
```
</details>

#### Fase 2 · RESOLVER — «Con color»  `28.2`

**Qué hay que hacer:** Igual que antes, pero entre 12 y 16 (inclusive): si carta1 es roja muestra Arriesga; si es negra, Pide carta. Menos de 12 siempre es Pide carta. Se prueba en 6 mesas.

**En pantalla:** Las cartas empiezan boca abajo y se voltean al ejecutar.

**Cómo se pasa:**

- Tu programa se prueba en **todos** estos casos (se ve uno con animación y los demás se prueban en silencio). Hay que acertar en cada uno:

  | Caso | Situación | Resultado esperado |
  |---|---|---|
  | Mesa 1 · 19 | Cartas: 10♥ 9♠ (total 19) | Mostrar «Te plantas» |
  | Mesa 2 · 14 | Cartas: 10♥ 4♠ (total 14) | Mostrar «Arriesga» |
  | Mesa 3 · 14 | Cartas: 10♠ 4♥ (total 14) | Mostrar «Pide carta» |
  | Mesa 4 · 12 | Cartas: 8♥ 4♦ (total 12) | Mostrar «Arriesga» |
  | Mesa 5 · 11 | Cartas: 7♥ 4♦ (total 11) | Mostrar «Pide carta» |
  | Mesa 6 · 25 | Cartas: 10♦ 10♣ 5♠ (total 25) | Mostrar «Bust» |

- Tu código debe usar: `elif` y `and`.

**Pistas del juego:** elif color1 == "roja" and total >= 12:

**Si no pasa, el juego dice:** «Revisa la mesa de 11 con carta roja: no llega a 12.»

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
if total > 21:
    print("Bust")
elif total >= 17:
    print("Te plantas")
elif color1 == "roja" and total >= 12:
    print("Arriesga")
else:
    print("Pide carta")
```
</details>

#### Fase 3 · LIBRE — «Mesa libre»  `28.3`

**Qué hay que hacer:** Experimenta con tus propias reglas. Además puedes poner cartas con mesa.poner_carta(valor, color) (color: "roja" o "negra") y voltearlas con mesa.voltear(). Las cartas nuevas no cambian el total. Nada se evalúa.

**Cómo se pasa:**

- No hay objetivo: escribe y ejecuta lo que quieras. La fase se completa al ejecutar.

**Pistas del juego:** mesa.poner_carta(5, "roja")

### Nivel 10 del Mundo 2 (id 29) — Pares

**Concepto:** pares y condiciones combinadas  ·  **Historia:** _Los pares son la jugada favorita del crupier: hay que decidir cuándo dividir._

#### Fase 1 · RESOLVER — «¿Divide o no?»  `29.1`

**Qué hay que hacer:** Si carta1 y carta2 son iguales Y carta1 vale 8 o más, muestra Divide; si son iguales pero menores, Par bajo; si no son iguales, No par. Se prueba en 6 mesas.

**En pantalla:** Las cartas empiezan boca abajo y se voltean al ejecutar.

**Cómo se pasa:**

- Tu programa se prueba en **todos** estos casos (se ve uno con animación y los demás se prueban en silencio). Hay que acertar en cada uno:

  | Caso | Situación | Resultado esperado |
  |---|---|---|
  | Mesa 1 · 20 | Cartas: 10♠ 10♠ (total 20) | Mostrar «Divide» |
  | Mesa 2 · 16 | Cartas: 8♠ 8♠ (total 16) | Mostrar «Divide» |
  | Mesa 3 · 14 | Cartas: 7♠ 7♠ (total 14) | Mostrar «Par bajo» |
  | Mesa 4 · 8 | Cartas: 4♠ 4♠ (total 8) | Mostrar «Par bajo» |
  | Mesa 5 · 19 | Cartas: 10♠ 9♠ (total 19) | Mostrar «No par» |
  | Mesa 6 · 21 | Cartas: 8♠ 8♠ 5♠ (total 21) | Mostrar «Divide» |

- Tu código debe usar: `elif` y `and`.

**Pistas del juego:** La condición más específica va primero.

**Si no pasa, el juego dice:** «Revisa 8 y 8: ya es un par alto.»

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
if carta1 == carta2 and carta1 >= 8:
    print("Divide")
elif carta1 == carta2:
    print("Par bajo")
else:
    print("No par")
```
</details>

#### Fase 2 · RESOLVER — «El crupier decide»  `29.2`

**Qué hay que hacer:** Si las dos primeras cartas son iguales Y el total es menor que 21 muestra Par: divide; si no, si total > 21 muestra Bust; si no, si total == 21 muestra Blackjack; en cualquier otro caso muestra Pide carta. Se prueba en 7 mesas.

**En pantalla:** Las cartas empiezan boca abajo y se voltean al ejecutar.

**Cómo se pasa:**

- Tu programa se prueba en **todos** estos casos (se ve uno con animación y los demás se prueban en silencio). Hay que acertar en cada uno:

  | Caso | Situación | Resultado esperado |
  |---|---|---|
  | Mesa 1 · 16 | Cartas: 8♠ 8♠ (total 16) | Mostrar «Par: divide» |
  | Mesa 2 · 20 | Cartas: 10♠ 10♠ (total 20) | Mostrar «Par: divide» |
  | Mesa 3 · 22 | Cartas: 10♠ 10♠ 2♠ (total 22) | Mostrar «Bust» |
  | Mesa 4 · 21 | Cartas: 10♠ 10♠ 1♠ (total 21) | Mostrar «Blackjack» |
  | Mesa 5 · 21 | Cartas: 10♥ 11♦ (total 21) | Mostrar «Blackjack» |
  | Mesa 6 · 11 | Cartas: 5♠ 6♠ (total 11) | Mostrar «Pide carta» |
  | Mesa 7 · 27 | Cartas: 9♠ 9♠ 9♠ (total 27) | Mostrar «Bust» |

- Tu código debe usar: `if`, `elif`, `else` y `and`.

**Pistas del juego:** Primero el par, luego Bust, luego Blackjack.

**Si no pasa, el juego dice:** «Un par con total 21 es Blackjack y un par con total 22 es Bust.»

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
if carta1 == carta2 and total < 21:
    print("Par: divide")
elif total > 21:
    print("Bust")
elif total == 21:
    print("Blackjack")
else:
    print("Pide carta")
```
</details>

#### Fase 3 · LIBRE — «Mesa libre»  `29.3`

**Qué hay que hacer:** Experimenta con pares y totales en distintas mesas. Nada se evalúa.

**Cómo se pasa:**

- No hay objetivo: escribe y ejecuta lo que quieras. La fase se completa al ejecutar.

**Pistas del juego:** Prueba cambiar de mesa.

### Nivel 11 del Mundo 2 (id 30) — Combinaciones

**Concepto:** combinaciones lógicas  ·  **Historia:** _La mesa mezcla rangos, colores y pares. Hay que combinar and y or con cuidado._

#### Fase 1 · RESOLVER — «Cuándo doblar»  `30.1`

**Qué hay que hacer:** Si total > 21 muestra Bust; si no, si total está entre 9 y 11 (inclusive) muestra Doble; en cualquier otro caso muestra Normal. Se prueba en 7 mesas.

**En pantalla:** Las cartas empiezan boca abajo y se voltean al ejecutar.

**Cómo se pasa:**

- Tu programa se prueba en **todos** estos casos (se ve uno con animación y los demás se prueban en silencio). Hay que acertar en cada uno:

  | Caso | Situación | Resultado esperado |
  |---|---|---|
  | Mesa 1 · 25 | Cartas: 10♠ 9♠ 6♠ (total 25) | Mostrar «Bust» |
  | Mesa 2 · 11 | Cartas: 5♠ 6♠ (total 11) | Mostrar «Doble» |
  | Mesa 3 · 9 | Cartas: 4♠ 5♠ (total 9) | Mostrar «Doble» |
  | Mesa 4 · 10 | Cartas: 5♠ 5♠ (total 10) | Mostrar «Doble» |
  | Mesa 5 · 12 | Cartas: 7♠ 5♠ (total 12) | Mostrar «Normal» |
  | Mesa 6 · 8 | Cartas: 4♠ 4♠ (total 8) | Mostrar «Normal» |
  | Mesa 7 · 21 | Cartas: 11♥ 10♠ (total 21) | Mostrar «Normal» |

- Tu código debe usar: `elif` y `and`.

**Pistas del juego:** total >= 9 and total <= 11

**Si no pasa, el juego dice:** «9 y 11 sí doblan; 8 y 12 no.»

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
if total > 21:
    print("Bust")
elif total >= 9 and total <= 11:
    print("Doble")
else:
    print("Normal")
```
</details>

#### Fase 2 · RESOLVER — «Bonus»  `30.2`

**Qué hay que hacer:** Si total > 21 muestra Bust. Si no, hay Bonus cuando carta1 y carta2 son iguales O carta1 es roja; en otro caso, Sin bonus. Se prueba en 6 mesas.

**En pantalla:** Las cartas empiezan boca abajo y se voltean al ejecutar.

**Cómo se pasa:**

- Tu programa se prueba en **todos** estos casos (se ve uno con animación y los demás se prueban en silencio). Hay que acertar en cada uno:

  | Caso | Situación | Resultado esperado |
  |---|---|---|
  | Mesa 1 · 17 | Cartas: 8♥ 9♠ (total 17) | Mostrar «Bonus» |
  | Mesa 2 · 17 | Cartas: 8♠ 9♥ (total 17) | Mostrar «Sin bonus» |
  | Mesa 3 · 14 | Cartas: 7♠ 7♣ (total 14) | Mostrar «Bonus» |
  | Mesa 4 · 24 | Cartas: 10♠ 9♦ 5♠ (total 24) | Mostrar «Bust» |
  | Mesa 5 · 8 | Cartas: 4♥ 4♠ (total 8) | Mostrar «Bonus» |
  | Mesa 6 · 15 | Cartas: 6♠ 9♣ (total 15) | Mostrar «Sin bonus» |

- Tu código debe usar: `elif` y `or`.

**Pistas del juego:** Dos preguntas unidas con or en el mismo elif.

**Si no pasa, el juego dice:** «Una mano que se pasa siempre es Bust, aunque sea par o roja.»

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
if total > 21:
    print("Bust")
elif carta1 == carta2 or color1 == "roja":
    print("Bonus")
else:
    print("Sin bonus")
```
</details>

#### Fase 3 · LIBRE — «Mesa libre»  `30.3`

**Qué hay que hacer:** Experimenta mezclando condiciones. Nada se evalúa.

**Cómo se pasa:**

- No hay objetivo: escribe y ejecuta lo que quieras. La fase se completa al ejecutar.

**Pistas del juego:** Prueba con not.

### Nivel 12 del Mundo 2 (id 31) — El crupier final

**Concepto:** integración de condicionales  ·  **Historia:** _El crupier holográfico propone el desafío final: una regla con varias condiciones combinadas que decide la jugada perfecta._

#### Fase 1 · RESOLVER — «Desafío final»  `31.1`

**Qué hay que hacer:** Si total > 21 muestra Bust; si total es 21, Blackjack; si las dos primeras cartas son iguales y carta1 es roja, Par rojo; si son iguales (negras), Par negro; si total es 17 o más, Te plantas; en cualquier otro caso, Pide carta. Se prueba en 8 mesas.

**En pantalla:** Las cartas empiezan boca abajo y se voltean al ejecutar.

**Cómo se pasa:**

- Tu programa se prueba en **todos** estos casos (se ve uno con animación y los demás se prueban en silencio). Hay que acertar en cada uno:

  | Caso | Situación | Resultado esperado |
  |---|---|---|
  | Mesa 1 · 25 | Cartas: 10♥ 9♠ 6♦ (total 25) | Mostrar «Bust» |
  | Mesa 2 · 21 | Cartas: 11♥ 10♠ (total 21) | Mostrar «Blackjack» |
  | Mesa 3 · 16 | Cartas: 8♥ 8♦ (total 16) | Mostrar «Par rojo» |
  | Mesa 4 · 16 | Cartas: 8♠ 8♣ (total 16) | Mostrar «Par negro» |
  | Mesa 5 · 21 | Cartas: 10♥ 10♠ 1♦ (total 21) | Mostrar «Blackjack» |
  | Mesa 6 · 19 | Cartas: 10♠ 9♥ (total 19) | Mostrar «Te plantas» |
  | Mesa 7 · 12 | Cartas: 7♠ 5♦ (total 12) | Mostrar «Pide carta» |
  | Mesa 8 · 25 | Cartas: 10♥ 10♦ 5♠ (total 25) | Mostrar «Bust» |

- Tu código debe usar: `if`, `elif`, `else` y `and`.

**Pistas del juego:** Primero lo que corta todo: Bust y Blackjack. · Luego los pares, de lo más específico a lo más general.

**Si no pasa, el juego dice:** «Un par con total 21 es Blackjack, no Par; un par con total 22 es Bust.»

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
if total > 21:
    print("Bust")
elif total == 21:
    print("Blackjack")
elif carta1 == carta2 and color1 == "roja":
    print("Par rojo")
elif carta1 == carta2:
    print("Par negro")
elif total >= 17:
    print("Te plantas")
else:
    print("Pide carta")
```
</details>

#### Fase 2 · RESOLVER — «Una variable lógica»  `31.2`

**Qué hay que hacer:** Guarda en seguro el resultado de total <= 21. Usa not para mostrar Bust cuando no sea seguro; si lo es, muestra Te plantas con 17 o más y Pide carta con menos. Se prueba en 6 mesas.

**En pantalla:** Las cartas empiezan boca abajo y se voltean al ejecutar.

**Cómo se pasa:**

- Tu programa se prueba en **todos** estos casos (se ve uno con animación y los demás se prueban en silencio). Hay que acertar en cada uno:

  | Caso | Situación | Resultado esperado |
  |---|---|---|
  | Mesa 1 · 25 | Cartas: 10♠ 9♠ 6♠ (total 25) | Mostrar «Bust» |
  | Mesa 2 · 21 | Cartas: 11♥ 10♠ (total 21) | Mostrar «Te plantas» |
  | Mesa 3 · 17 | Cartas: 10♠ 7♠ (total 17) | Mostrar «Te plantas» |
  | Mesa 4 · 16 | Cartas: 10♠ 6♠ (total 16) | Mostrar «Pide carta» |
  | Mesa 5 · 12 | Cartas: 7♠ 5♠ (total 12) | Mostrar «Pide carta» |
  | Mesa 6 · 22 | Cartas: 10♠ 10♠ 2♠ (total 22) | Mostrar «Bust» |

- Tu código debe usar: `if`, `not` y `elif`.
- Debe crear una variable llamada `seguro`.

**Pistas del juego:** seguro = total <= 21 · if not seguro:

**Si no pasa, el juego dice:** «Debes guardar seguro y usar not.»

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
seguro = total <= 21
if not seguro:
    print("Bust")
elif total >= 17:
    print("Te plantas")
else:
    print("Pide carta")
```
</details>

#### Fase 3 · LIBRE — «Mesa libre»  `31.3`

**Qué hay que hacer:** Experimenta con todo lo aprendido. Nada se evalúa: es tu despedida del Mundo 2.

**Cómo se pasa:**

- No hay objetivo: escribe y ejecuta lo que quieras. La fase se completa al ejecutar.

**Pistas del juego:** Prueba cambiar de mesa.

### Nivel Jefe 👑 del Mundo 2 (id 46) — Torneo de cartas

**Concepto:** integración del Mundo 2  ·  **Historia:** _El torneo final de la Sala de Estrategia empieza. El crupier ya no te dirá qué regla aplicar: tendrás que escribirlas todas._

> 👑 **Nivel Jefe:** no hay botón de pistas, el editor empieza en blanco y se prueba en varios casos.

#### Fase 1 · RESOLVER — «Torneo de cartas»  `46.1`

**Qué hay que hacer:** Eres el crupier del gran torneo. Escribe las reglas completas para una mano (usa total y cantidad, el número de cartas que hay) y muestra UNA sola palabra: Blackjack (suma 21 con exactamente 2 cartas), Bust (se pasa de 21), 21 (suma 21 con 3 o más cartas), Plantarse (de 17 a 20) o Pedir carta (menos de 17). Se prueba con 10 manos distintas.

**En pantalla:** Las cartas empiezan boca abajo y se voltean al ejecutar.

**Cómo se pasa:**

- Tu programa se prueba en **todos** estos casos (se ve uno con animación y los demás se prueban en silencio). Hay que acertar en cada uno:

  | Caso | Situación | Resultado esperado |
  |---|---|---|
  | Mano 1 · 21 | Cartas: 10♠ 11♠ (total 21) | Mostrar «Blackjack» |
  | Mano 2 · 21 | Cartas: 7♠ 7♠ 7♠ (total 21) | Mostrar «21» |
  | Mano 3 · 24 | Cartas: 10♠ 9♠ 5♠ (total 24) | Mostrar «Bust» |
  | Mano 4 · 17 | Cartas: 10♠ 7♠ (total 17) | Mostrar «Plantarse» |
  | Mano 5 · 20 | Cartas: 10♠ 10♠ (total 20) | Mostrar «Plantarse» |
  | Mano 6 · 15 | Cartas: 5♠ 6♠ 4♠ (total 15) | Mostrar «Pedir carta» |
  | Mano 7 · 11 | Cartas: 6♠ 5♠ (total 11) | Mostrar «Pedir carta» |
  | Mano 8 · 21 | Cartas: 9♠ 8♠ 4♠ (total 21) | Mostrar «21» |
  | Mano 9 · 22 | Cartas: 10♠ 10♠ 2♠ (total 22) | Mostrar «Bust» |
  | Mano 10 · 16 | Cartas: 10♠ 6♠ (total 16) | Mostrar «Pedir carta» |

- Tu código debe usar: `if`, `elif` y `and`.

**Si no pasa, el juego dice:** «Revisa el orden de las reglas: Blackjack va antes que el 21 normal, y Bust antes de comparar con 17.»

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
if total == 21 and cantidad == 2:
    print("Blackjack")
elif total > 21:
    print("Bust")
elif total == 21:
    print("21")
elif total >= 17:
    print("Plantarse")
else:
    print("Pedir carta")
```
</details>

> 🎬 **Al terminar este nivel** aparece la pantalla de transición: _¡La sala de estrategia se abre! Pero al cruzar, Robot1 oye un zumbido: un edificio entero depende de un elevador que no deja de fallar. Entra al Mundo 3: Automatización._

---

## Mundo 3 · Automatización

- **Escenario:** Complejo industrial (edificio de 5 pisos con elevador).
- **Qué se aprende:** Ciclos `while` y `for`, contadores. Un letrero muestra en qué repetición va el ciclo; el piso 1 es la planta baja.
- **Niveles:** 13 · **Estrellas posibles:** 39

### Nivel 1 del Mundo 3 (id 32) — El ascensor automático

**Concepto:** ciclo while  ·  **Historia:** _En el complejo industrial, el elevador solo hace lo que se le ordena. Repetir la misma orden a mano es agotador: hay que enseñarle a repetirse._

#### Fase 1 · EXPLORAR — «Sube mientras haya pisos»  `32.1`

**Qué hay que hacer:** Concepto nuevo: while ("mientras") repite su bloque MIENTRAS la condición sea verdadera. Cada vuelta se llama repetición. Ejecuta y mira el contador del letrero.

**En pantalla:** El elevador empieza en el piso 1; sin pasajeros.

**Cómo se pasa:**

- El elevador debe quedar en el piso 5.
- El código que viene ya cumple esto: solo hay que ejecutarlo.

**Pistas del juego:** Mira el letrero: cuenta cada repetición.

#### Fase 2 · PREDECIR — «¿Dónde se detiene?»  `32.2`

**Qué hay que hacer:** ¿En qué piso queda el elevador al terminar?

**En pantalla:** El elevador empieza en el piso 1; sin pasajeros.

**Cómo se pasa:**

- ▫️ En el piso 2
- ✅ En el piso 3
- ▫️ En el piso 4
- Se pasa eligiendo: **En el piso 3**.

**Pistas del juego:** Cuenta las repeticiones: piso vale 1, 2 y luego la condición falla.

<details><summary>Ver el código de la fase</summary>

```python
piso = 1
while piso < 3:
    elevador.subir(1)
    piso = piso + 1
```
</details>

#### Fase 3 · MODIFICAR — «Hasta arriba»  `32.3`

**Qué hay que hacer:** Este programa se detiene en el piso 3. Modifícalo para que el elevador llegue hasta el piso 5 sin dejar de usar el while.

**En pantalla:** El elevador empieza en el piso 1; sin pasajeros.

**Cómo se pasa:**

- El elevador debe quedar en el piso 5.
- Tu código debe usar: `while`.
- Debe crear una variable llamada `piso`.

**Pistas del juego:** Solo cambia un número.

**Si no pasa, el juego dice:** «Debe terminar en el piso 5 usando el while.»

<details><summary>Ver el código de la fase</summary>

```python
piso = 1
while piso < 3:
    elevador.subir(1)
    piso = piso + 1
```
</details>

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
piso = 1
while piso < 5:
    elevador.subir(1)
    piso = piso + 1
```
</details>

### Nivel 2 del Mundo 3 (id 33) — Repetir con for

**Concepto:** ciclo for con range  ·  **Historia:** _Cuando ya sabes cuántas veces repetir, hay una herramienta más corta que el while con contador._

#### Fase 1 · EXPLORAR — «Tres veces»  `33.1`

**Qué hay que hacer:** Concepto nuevo: for i in range(3): repite su bloque 3 veces. La variable i cuenta sola, empezando en 0. No necesitas contador ni condición.

**En pantalla:** El elevador empieza en el piso 1; sin pasajeros.

**Cómo se pasa:**

- El elevador debe quedar en el piso 4.
- El código que viene ya cumple esto: solo hay que ejecutarlo.

**Pistas del juego:** Cuenta las repeticiones en el letrero.

#### Fase 2 · PREDECIR — «¿Cuántos pisos sube?»  `33.2`

**Qué hay que hacer:** El elevador empieza en el piso 1. ¿En qué piso termina?

**En pantalla:** El elevador empieza en el piso 1; sin pasajeros.

**Cómo se pasa:**

- ▫️ Piso 2
- ✅ Piso 3
- ▫️ Piso 4
- Se pasa eligiendo: **Piso 3**.

**Pistas del juego:** range(2) repite 2 veces.

<details><summary>Ver el código de la fase</summary>

```python
for i in range(2):
    elevador.subir(1)
```
</details>

#### Fase 3 · MODIFICAR — «Hasta arriba, con for»  `33.3`

**Qué hay que hacer:** El programa sube solo 2 veces. Modifícalo (solo un número) para que el elevador llegue al piso 5.

**En pantalla:** El elevador empieza en el piso 1; sin pasajeros.

**Cómo se pasa:**

- El elevador debe quedar en el piso 5.
- Tu código debe usar: `for` y `range`.
- No debe usar: `while`.

**Pistas del juego:** ¿Cuántos pisos hay entre el 1 y el 5?

**Si no pasa, el juego dice:** «Debe terminar en el piso 5 usando for ... in range(...).»

<details><summary>Ver el código de la fase</summary>

```python
for i in range(2):
    elevador.subir(1)
```
</details>

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
for i in range(4):
    elevador.subir(1)
```
</details>

### Nivel 3 del Mundo 3 (id 34) — Contar repeticiones

**Concepto:** contadores en un while  ·  **Historia:** _Para repetir algo exactamente N veces, el ciclo necesita llevar la cuenta de cuántas van._

#### Fase 1 · EXPLORAR — «Un contador»  `34.1`

**Qué hay que hacer:** Concepto nuevo: un contador es una variable que empieza en 0 y suma 1 en cada vuelta. La condición del while lo compara con el máximo.

**En pantalla:** El elevador empieza en el piso 1; sin pasajeros.

**Cómo se pasa:**

- El elevador debe quedar en el piso 1 (planta baja).
- El código que viene ya cumple esto: solo hay que ejecutarlo.

**Pistas del juego:** Mira el letrero de repetición y el chip viajes.

#### Fase 2 · PREDECIR — «¿Cuántos viajes?»  `34.2`

**Qué hay que hacer:** ¿Qué muestra este programa al final?

**En pantalla:** El elevador empieza en el piso 1; sin pasajeros.

**Cómo se pasa:**

- ▫️ 3
- ✅ 4
- ▫️ 5
- Se pasa eligiendo: **4**.

**Pistas del juego:** Cuenta: 0, 1, 2, 3 y luego la condición falla con 4.

<details><summary>Ver el código de la fase</summary>

```python
viajes = 0
while viajes < 4:
    elevador.subir(1)
    elevador.bajar(1)
    viajes = viajes + 1
print(viajes)
```
</details>

#### Fase 3 · MODIFICAR — «Cinco viajes»  `34.3`

**Qué hay que hacer:** Este programa hace 3 viajes. Modifícalo para que el elevador haga 5 viajes y muestre al final que hizo 5.

**En pantalla:** El elevador empieza en el piso 1; sin pasajeros.

**Cómo se pasa:**

- El programa debe mostrar «5».
- El elevador debe quedar en el piso 1 (planta baja).
- Tu código debe usar: `while`.
- Debe crear una variable llamada `viajes`.

**Pistas del juego:** Cambia el número de la condición.

**Si no pasa, el juego dice:** «Debe mostrar 5.»

<details><summary>Ver el código de la fase</summary>

```python
viajes = 0
while viajes < 3:
    elevador.subir(1)
    elevador.bajar(1)
    viajes = viajes + 1
print(viajes)
```
</details>

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
viajes = 0
while viajes < 5:
    elevador.subir(1)
    elevador.bajar(1)
    viajes = viajes + 1
print(viajes)
```
</details>

### Nivel 4 del Mundo 3 (id 35) — El valor de i

**Concepto:** for con variable y range(inicio, fin)  ·  **Historia:** _La variable del for no es solo un contador interno: puedes usarla dentro del ciclo._

#### Fase 1 · EXPLORAR — «Imprimir i»  `35.1`

**Qué hay que hacer:** Concepto nuevo: range(2, 6) cuenta desde 2 hasta 5 (el final NO se incluye). La variable i cambia en cada vuelta y se puede mostrar. Aquí i coincide con el piso al que llega el elevador.

**En pantalla:** El elevador empieza en el piso 1; sin pasajeros.

**Cómo se pasa:**

- El elevador debe quedar en el piso 5.
- El código que viene ya cumple esto: solo hay que ejecutarlo.

**Pistas del juego:** Mira cómo coincide el valor impreso con el piso.

#### Fase 2 · PREDECIR — «¿Qué números salen?»  `35.2`

**Qué hay que hacer:** ¿Qué muestra este programa?

**En pantalla:** El elevador empieza en el piso 1; sin pasajeros.

**Cómo se pasa:**

- ✅ 1, 2 y 3
- ▫️ 0, 1, 2 y 3
- ▫️ 1, 2, 3 y 4
- Se pasa eligiendo: **1, 2 y 3**.

**Pistas del juego:** El segundo número no se incluye.

<details><summary>Ver el código de la fase</summary>

```python
for i in range(1, 4):
    print(i)
```
</details>

#### Fase 3 · MODIFICAR — «Solo hasta el 4»  `35.3`

**Qué hay que hacer:** Modifica el programa para que el elevador se detenga en el piso 4 (imprimiendo 2, 3 y 4).

**En pantalla:** El elevador empieza en el piso 1; sin pasajeros.

**Cómo se pasa:**

- El elevador debe quedar en el piso 4.
- El programa debe mostrar «2», luego «3», luego «4».

**Pistas del juego:** Cambia el número final de range.

<details><summary>Ver el código de la fase</summary>

```python
for i in range(2, 6):
    elevador.subir(1)
    print(i)
```
</details>

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
for i in range(2, 5):
    elevador.subir(1)
    print(i)
```
</details>

### Nivel 5 del Mundo 3 (id 36) — El bucle infinito

**Concepto:** ciclos con condición y bucles infinitos  ·  **Historia:** _Un ciclo que nunca termina congelaría todo el complejo. Aquí aprenderás a detectarlo y a escribir ciclos que sí terminan._

#### Fase 1 · DEBUG — «El ciclo que no termina»  `36.1`

**Qué hay que hacer:** Este ciclo nunca termina: el elevador no se mueve y la condición siempre es verdadera. Observa el error y corrígelo para que el elevador suba hasta el piso 5. Dentro del while hay que CAMBIAR la variable de la condición.

**En pantalla:** El elevador empieza en el piso 1; sin pasajeros.

**Cómo se pasa:**

- El elevador debe quedar en el piso 5.
- Tu código debe usar: `while`.

**Pistas del juego:** ¿Qué variable usa la condición? Tiene que cambiar en cada vuelta.

**Si no pasa, el juego dice:** «El elevador debe terminar en el piso 5.»

<details><summary>Ver el código de la fase</summary>

```python
piso = 1
while piso < 5:
    elevador.recoger()
```
</details>

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
piso = 1
while piso < 5:
    elevador.subir(1)
    piso = piso + 1
```
</details>

#### Fase 2 · ESCRIBIR — «Desde cualquier piso»  `36.2`

**Qué hay que hacer:** Escribe un while que lleve el elevador a la planta baja (piso 1) sin importar en qué piso empiece. Pregúntale al elevador con elevador.piso(). Se prueba desde 3 pisos distintos.

**Cómo se pasa:**

- Tu programa se prueba en **todos** estos casos (se ve uno con animación y los demás se prueban en silencio). Hay que acertar en cada uno:

  | Caso | Situación | Resultado esperado |
  |---|---|---|
  | Desde el piso 5 | El elevador empieza en el piso 5; sin pasajeros | Terminar en el piso 1 |
  | Desde el piso 3 | El elevador empieza en el piso 3; sin pasajeros | Terminar en el piso 1 |
  | Ya en el piso 1 | El elevador empieza en el piso 1; sin pasajeros | Terminar en el piso 1 |

- Tu código debe usar: `while`.

**Pistas del juego:** Pregunta con elevador.piso() > 1.

**Si no pasa, el juego dice:** «Debe funcionar también si ya está en el piso 1 (no se mueve).»

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
while elevador.piso() > 1:
    elevador.bajar(1)
```
</details>

#### Fase 3 · DEBUG — «La condición al revés»  `36.3`

**Qué hay que hacer:** El elevador está en el piso 5 y debería bajar a la planta baja, pero el programa sube y se sale del edificio. Corrígelo.

**En pantalla:** El elevador empieza en el piso 5; sin pasajeros.

**Cómo se pasa:**

- El elevador debe quedar en el piso 1 (planta baja).
- Tu código debe usar: `while`.

**Pistas del juego:** ¿Hacia dónde debe moverse para llegar a la planta baja?

<details><summary>Ver el código de la fase</summary>

```python
while elevador.piso() > 1:
    elevador.subir(1)
```
</details>

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
while elevador.piso() > 1:
    elevador.bajar(1)
```
</details>

### Nivel 6 del Mundo 3 (id 37) — Recoger pasajeros

**Concepto:** while con decisiones  ·  **Historia:** _Los pasajeros esperan en distintos pisos. El elevador debe recorrer el edificio y decidir qué hacer en cada uno._

#### Fase 1 · DEBUG — «Buscando pasajero»  `37.1`

**Qué hay que hacer:** Concepto nuevo: elevador.hayPasajero() dice si hay alguien esperando en el piso actual. Este programa busca a un pasajero pero se queda dando vueltas sin moverse: es un ciclo infinito. Corrígelo para que suba hasta encontrarlo y lo recoja.

**Cómo se pasa:**

- Tu programa se prueba en **todos** estos casos (se ve uno con animación y los demás se prueban en silencio). Hay que acertar en cada uno:

  | Caso | Situación | Resultado esperado |
  |---|---|---|
  | Pasajero en el 2 | El elevador empieza en el piso 1; pasajeros esperando en piso 2 | Al terminar deben ir 1 pasajeros en la cabina. |
  | Pasajero en el 3 | El elevador empieza en el piso 1; pasajeros esperando en piso 3 | Al terminar deben ir 1 pasajeros en la cabina. |
  | Pasajero en el 5 | El elevador empieza en el piso 1; pasajeros esperando en piso 5 | Al terminar deben ir 1 pasajeros en la cabina. |

- Tu código debe usar: `while`.

**Pistas del juego:** ¿Qué debe hacer el elevador mientras no haya pasajero?

**Si no pasa, el juego dice:** «Debe subir hasta encontrar al pasajero y recogerlo (en el piso 2, 3 o 5).»

<details><summary>Ver el código de la fase</summary>

```python
while not elevador.hayPasajero():
    elevador.soltar()
elevador.recoger()
```
</details>

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
while not elevador.hayPasajero():
    elevador.subir(1)
elevador.recoger()
```
</details>

#### Fase 2 · ESCRIBIR — «Un pasajero perdido»  `37.2`

**Qué hay que hacer:** Hay UN pasajero en un piso que no sabes cuál es (2, 3 o 5). Sube hasta encontrarlo, recógelo, baja a la planta baja y suéltalo.

**Cómo se pasa:**

- Tu programa se prueba en **todos** estos casos (se ve uno con animación y los demás se prueban en silencio). Hay que acertar en cada uno:

  | Caso | Situación | Resultado esperado |
  |---|---|---|
  | Pasajero en el 2 | El elevador empieza en el piso 1; pasajeros esperando en piso 2 | Entregar a todos en la planta baja |
  | Pasajero en el 3 | El elevador empieza en el piso 1; pasajeros esperando en piso 3 | Entregar a todos en la planta baja |
  | Pasajero en el 5 | El elevador empieza en el piso 1; pasajeros esperando en piso 5 | Entregar a todos en la planta baja |

- Tu código debe usar: `while`.

**Pistas del juego:** Primer ciclo: sube mientras NO haya pasajero. · Segundo ciclo: baja mientras el piso sea mayor que 1.

**Si no pasa, el juego dice:** «Debe funcionar con el pasajero en cualquier piso: 2, 3 o 5.»

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
while not elevador.hayPasajero():
    elevador.subir(1)
elevador.recoger()
while elevador.piso() > 1:
    elevador.bajar(1)
elevador.soltar()
```
</details>

#### Fase 3 · ESCRIBIR — «Evacuación»  `37.3`

**Qué hay que hacer:** Hay 2 o 3 pasajeros en distintos pisos. Recógelos a todos subiendo hasta el piso 5 (¡no olvides el piso 5!) y llévalos a la planta baja. Se prueba con 3 edificios distintos.

**Cómo se pasa:**

- Tu programa se prueba en **todos** estos casos (se ve uno con animación y los demás se prueban en silencio). Hay que acertar en cada uno:

  | Caso | Situación | Resultado esperado |
  |---|---|---|
  | Pisos 2 y 4 | El elevador empieza en el piso 1; pasajeros esperando en piso 2 y piso 4 | Entregar a todos en la planta baja |
  | Pisos 3 y 5 | El elevador empieza en el piso 1; pasajeros esperando en piso 3 y piso 5 | Entregar a todos en la planta baja |
  | Pisos 2, 3 y 5 | El elevador empieza en el piso 1; pasajeros esperando en piso 2, piso 3 y piso 5 | Entregar a todos en la planta baja |

- Tu código debe usar: `while` y `if`.

**Pistas del juego:** Cuando el ciclo termina, el elevador está en el piso 5: ¿hay alguien allí?

**Si no pasa, el juego dice:** «Revisa que recojas también al pasajero del último piso.»

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
while elevador.piso() < 5:
    if elevador.hayPasajero():
        elevador.recoger()
    elevador.subir(1)
if elevador.hayPasajero():
    elevador.recoger()
while elevador.piso() > 1:
    elevador.bajar(1)
elevador.soltar()
```
</details>

### Nivel 7 del Mundo 3 (id 38) — For con decisiones

**Concepto:** for con if  ·  **Historia:** _Un for también puede tomar decisiones en cada vuelta, como un guardia que revisa cada piso._

#### Fase 1 · DEBUG — «Una vuelta de más»  `38.1`

**Qué hay que hacer:** El elevador debe subir revisando cada piso (del 2 al 5) y recoger a quien encuentre. Este programa da una vuelta de más y el elevador intenta salir del edificio. Corrígelo.

**Cómo se pasa:**

- Tu programa se prueba en **todos** estos casos (se ve uno con animación y los demás se prueban en silencio). Hay que acertar en cada uno:

  | Caso | Situación | Resultado esperado |
  |---|---|---|
  | Pisos 2 y 4 | El elevador empieza en el piso 1; pasajeros esperando en piso 2 y piso 4 | Al terminar deben ir 2 pasajeros en la cabina. |
  | Piso 3 | El elevador empieza en el piso 1; pasajeros esperando en piso 3 | Al terminar deben ir 1 pasajeros en la cabina. |
  | Pisos 2, 3 y 5 | El elevador empieza en el piso 1; pasajeros esperando en piso 2, piso 3 y piso 5 | Al terminar deben ir 3 pasajeros en la cabina. |

- Tu código debe usar: `for` y `if`.

**Pistas del juego:** ¿Cuántas veces hay que subir para llegar al piso 5?

**Si no pasa, el juego dice:** «El elevador no debe salirse del edificio.»

<details><summary>Ver el código de la fase</summary>

```python
for i in range(5):
    elevador.subir(1)
    if elevador.hayPasajero():
        elevador.recoger()
```
</details>

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
for i in range(4):
    elevador.subir(1)
    if elevador.hayPasajero():
        elevador.recoger()
```
</details>

#### Fase 2 · PREDECIR — «Los pisos pares»  `38.2`

**Qué hay que hacer:** ¿Qué muestra este programa?

**En pantalla:** El elevador empieza en el piso 1; pasajeros en piso 2 y piso 4.

**Cómo se pasa:**

- ✅ 2 y 4
- ▫️ 1, 3 y 5
- ▫️ Todos los números del 1 al 5
- Se pasa eligiendo: **2 y 4**.

**Pistas del juego:** % da el residuo: los pares dejan residuo 0 al dividir entre 2.

<details><summary>Ver el código de la fase</summary>

```python
for piso in range(1, 6):
    if piso % 2 == 0:
        print(piso)
```
</details>

#### Fase 3 · ESCRIBIR — «Recoger y entregar»  `38.3`

**Qué hay que hacer:** Con un for sube 4 veces; en cada piso, si hay pasajero, recógelo. Luego baja a la planta baja y suelta a todos. Se prueba con 3 edificios.

**Cómo se pasa:**

- Tu programa se prueba en **todos** estos casos (se ve uno con animación y los demás se prueban en silencio). Hay que acertar en cada uno:

  | Caso | Situación | Resultado esperado |
  |---|---|---|
  | Pisos 2 y 4 | El elevador empieza en el piso 1; pasajeros esperando en piso 2 y piso 4 | Entregar a todos en la planta baja |
  | Piso 3 | El elevador empieza en el piso 1; pasajeros esperando en piso 3 | Entregar a todos en la planta baja |
  | Pisos 2, 3 y 5 | El elevador empieza en el piso 1; pasajeros esperando en piso 2, piso 3 y piso 5 | Entregar a todos en la planta baja |

- Tu código debe usar: `for` y `if`.

**Pistas del juego:** Primer for: sube y pregunta. Segundo for: baja 4 veces.

**Si no pasa, el juego dice:** «Debe recoger a todos y dejarlos en la planta baja.»

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
for i in range(4):
    elevador.subir(1)
    if elevador.hayPasajero():
        elevador.recoger()
for i in range(4):
    elevador.bajar(1)
elevador.soltar()
```
</details>

### Nivel 8 del Mundo 3 (id 39) — Cuenta lo que haces

**Concepto:** contadores con condición  ·  **Historia:** _El jefe de seguridad pide números: ¿cuántos pisos tienen gente? Un contador lleva la cuenta mientras el elevador trabaja._

#### Fase 1 · DEBUG — «El contador mentiroso»  `39.1`

**Qué hay que hacer:** Este programa debe mostrar en cuántos pisos hay pasajeros, pero cuenta TODOS los pisos que visita. El contador debe sumar solo cuando hayPasajero() sea verdadero. Corrígelo.

**Cómo se pasa:**

- Tu programa se prueba en **todos** estos casos (se ve uno con animación y los demás se prueban en silencio). Hay que acertar en cada uno:

  | Caso | Situación | Resultado esperado |
  |---|---|---|
  | Pisos 2 y 4 | El elevador empieza en el piso 1; pasajeros esperando en piso 2 y piso 4 | Mostrar «2» |
  | Piso 3 | El elevador empieza en el piso 1; pasajeros esperando en piso 3 | Mostrar «1» |
  | Pisos 2, 3 y 5 | El elevador empieza en el piso 1; pasajeros esperando en piso 2, piso 3 y piso 5 | Mostrar «3» |

- Tu código debe usar: `if`.
- Debe crear una variable llamada `llevados`.

**Pistas del juego:** Mueve una línea para que quede dentro del if.

<details><summary>Ver el código de la fase</summary>

```python
llevados = 0
for i in range(4):
    elevador.subir(1)
    if elevador.hayPasajero():
        elevador.recoger()
    llevados = llevados + 1
print(llevados)
```
</details>

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
llevados = 0
for i in range(4):
    elevador.subir(1)
    if elevador.hayPasajero():
        elevador.recoger()
        llevados = llevados + 1
print(llevados)
```
</details>

#### Fase 2 · ESCRIBIR — «Pisos con gente»  `39.2`

**Qué hay que hacer:** Sin recoger a nadie, sube 4 veces y muestra cuántos pisos tienen al menos un pasajero esperando (usa un contador llamado pisos_con_gente). Ojo: dos pasajeros en el mismo piso cuentan UNA vez. Se prueba en 4 edificios.

**Cómo se pasa:**

- Tu programa se prueba en **todos** estos casos (se ve uno con animación y los demás se prueban en silencio). Hay que acertar en cada uno:

  | Caso | Situación | Resultado esperado |
  |---|---|---|
  | Pisos 2 y 4 | El elevador empieza en el piso 1; pasajeros esperando en piso 2 y piso 4 | Mostrar «2» |
  | Dos en el piso 3 | El elevador empieza en el piso 1; pasajeros esperando en piso 3 y piso 3 | Mostrar «1» |
  | Pisos 2, 3 y 5 | El elevador empieza en el piso 1; pasajeros esperando en piso 2, piso 3 y piso 5 | Mostrar «3» |
  | Edificio vacío | El elevador empieza en el piso 1; sin pasajeros | Mostrar «0» |

- Tu código debe usar: `for` y `if`.
- Debe crear una variable llamada `pisos_con_gente`.

**Pistas del juego:** Empieza en 0 y suma 1 solo si hayPasajero() es verdadero.

**Si no pasa, el juego dice:** «Dos pasajeros en el mismo piso cuentan como un solo piso.»

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
pisos_con_gente = 0
for i in range(4):
    elevador.subir(1)
    if elevador.hayPasajero():
        pisos_con_gente = pisos_con_gente + 1
print(pisos_con_gente)
```
</details>

#### Fase 3 · ESCRIBIR — «Tres viajes»  `39.3`

**Qué hay que hacer:** Con un for, sube y baja el elevador 3 veces (un piso cada vez) y, al terminar, muestra cuántos viajes hizo (3) usando un contador llamado viajes.

**En pantalla:** El elevador empieza en el piso 1; pasajeros en piso 2 y piso 4.

**Cómo se pasa:**

- El programa debe mostrar «3».
- El elevador debe quedar en el piso 1 (planta baja).
- Tu código debe usar: `for`.
- Debe crear una variable llamada `viajes`.

**Pistas del juego:** viajes = 0 antes del ciclo y viajes = viajes + 1 dentro.

**Si no pasa, el juego dice:** «Debe mostrar 3 y dejar el elevador en el piso 1.»

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
viajes = 0
for i in range(3):
    elevador.subir(1)
    elevador.bajar(1)
    viajes = viajes + 1
print(viajes)
```
</details>

### Nivel 9 del Mundo 3 (id 40) — Evacuación completa

**Concepto:** evacuación con ciclos  ·  **Historia:** _Empieza la evacuación del complejo. Tu programa se prueba en edificios distintos: no basta con acertar el que ves._

#### Fase 1 · RESOLVER — «Todos a la planta baja»  `40.1`

**Qué hay que hacer:** Recoge a todos los pasajeros (puede haber varios en el mismo piso) y llévalos a la planta baja. Se prueba en 5 edificios.

**Cómo se pasa:**

- Tu programa se prueba en **todos** estos casos (se ve uno con animación y los demás se prueban en silencio). Hay que acertar en cada uno:

  | Caso | Situación | Resultado esperado |
  |---|---|---|
  | Pasajeros en 2, 4 | El elevador empieza en el piso 1; pasajeros esperando en piso 2 y piso 4 | Entregar a todos en la planta baja |
  | Pasajeros en 3 | El elevador empieza en el piso 1; pasajeros esperando en piso 3 | Entregar a todos en la planta baja |
  | Pasajeros en 2, 3, 4, 5 | El elevador empieza en el piso 1; pasajeros esperando en piso 2, piso 3, piso 4 y piso 5 | Entregar a todos en la planta baja |
  | Pasajeros en 4, 4, 5 | El elevador empieza en el piso 1; pasajeros esperando en piso 4, piso 4 y piso 5 | Entregar a todos en la planta baja |
  | Pasajeros en 5 | El elevador empieza en el piso 1; pasajeros esperando en piso 5 | Entregar a todos en la planta baja |

- Tu código debe usar: `if`.

**Pistas del juego:** Sube 4 veces recogiendo; baja 4 veces; suelta.

**Si no pasa, el juego dice:** «No olvides el piso 5 ni los pisos con más de un pasajero.»

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
for i in range(4):
    elevador.subir(1)
    if elevador.hayPasajero():
        elevador.recoger()
for i in range(4):
    elevador.bajar(1)
elevador.soltar()
```
</details>

#### Fase 2 · RESOLVER — «Evacuar y contar»  `40.2`

**Qué hay que hacer:** Haz la evacuación y, ANTES de soltar, muestra cuántas personas van en la cabina con elevador.llevando(). Se prueba en 5 edificios, incluso uno vacío.

**Cómo se pasa:**

- Tu programa se prueba en **todos** estos casos (se ve uno con animación y los demás se prueban en silencio). Hay que acertar en cada uno:

  | Caso | Situación | Resultado esperado |
  |---|---|---|
  | Pasajeros en 2, 4 | El elevador empieza en el piso 1; pasajeros esperando en piso 2 y piso 4 | Entregar a todos en la planta baja · Mostrar «2» |
  | Pasajeros en 3 | El elevador empieza en el piso 1; pasajeros esperando en piso 3 | Entregar a todos en la planta baja · Mostrar «1» |
  | Pasajeros en 4, 4, 5 | El elevador empieza en el piso 1; pasajeros esperando en piso 4, piso 4 y piso 5 | Entregar a todos en la planta baja · Mostrar «3» |
  | Edificio vacío | El elevador empieza en el piso 1; sin pasajeros | Entregar a todos en la planta baja · Mostrar «0» |
  | Pasajeros en 2, 3, 4, 5 | El elevador empieza en el piso 1; pasajeros esperando en piso 2, piso 3, piso 4 y piso 5 | Entregar a todos en la planta baja · Mostrar «4» |

- Tu código debe usar: `if`.

**Pistas del juego:** print(elevador.llevando()) justo antes de bajar.

**Si no pasa, el juego dice:** «Debe entregar a todos y mostrar cuántas personas iban.»

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
for i in range(4):
    elevador.subir(1)
    if elevador.hayPasajero():
        elevador.recoger()
print(elevador.llevando())
for i in range(4):
    elevador.bajar(1)
elevador.soltar()
```
</details>

#### Fase 3 · LIBRE — «Torre libre»  `40.3`

**Qué hay que hacer:** Experimenta con ciclos y el elevador como quieras. Nada se evalúa.

**En pantalla:** El elevador empieza en el piso 1; pasajeros en piso 2, piso 3 y piso 5.

**Cómo se pasa:**

- No hay objetivo: escribe y ejecuta lo que quieras. La fase se completa al ejecutar.

**Pistas del juego:** Prueba combinar while, for e if.

### Nivel 10 del Mundo 3 (id 41) — La cabina chica

**Concepto:** capacidad limitada  ·  **Historia:** _Un elevador de servicio más pequeño: solo caben 2 personas. Si intentas subir a una tercera, la cabina se llena y el programa falla._

#### Fase 1 · RESOLVER — «No te pases de la capacidad»  `41.1`

**Qué hay que hacer:** En la cabina caben 2 personas. Sube recogiendo pasajeros SOLO mientras elevador.llevando() sea menor que 2, baja y suelta. Los que no caben se quedan esperando. Se prueba en 5 edificios.

**Cómo se pasa:**

- Tu programa se prueba en **todos** estos casos (se ve uno con animación y los demás se prueban en silencio). Hay que acertar en cada uno:

  | Caso | Situación | Resultado esperado |
  |---|---|---|
  | Pasajeros en 2, 3, 4 | El elevador empieza en el piso 1; pasajeros esperando en piso 2, piso 3 y piso 4 | Al terminar deben ir 0 pasajeros en la cabina. |
  | Pasajeros en 3, 4, 5 | El elevador empieza en el piso 1; pasajeros esperando en piso 3, piso 4 y piso 5 | Al terminar deben ir 0 pasajeros en la cabina. |
  | Pasajeros en 2, 5 | El elevador empieza en el piso 1; pasajeros esperando en piso 2 y piso 5 | Al terminar deben ir 0 pasajeros en la cabina. |
  | Pasajeros en 4 | El elevador empieza en el piso 1; pasajeros esperando en piso 4 | Al terminar deben ir 0 pasajeros en la cabina. |
  | Pasajeros en 2, 2, 5 | El elevador empieza en el piso 1; pasajeros esperando en piso 2, piso 2 y piso 5 | Al terminar deben ir 0 pasajeros en la cabina. |

- Tu código debe usar: `if` y `and`.

**Pistas del juego:** Une las dos preguntas con and.

**Si no pasa, el juego dice:** «Deben entregarse exactamente 2 personas (o 1 si solo hay una).»

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
for i in range(4):
    elevador.subir(1)
    if elevador.hayPasajero() and elevador.llevando() < 2:
        elevador.recoger()
for i in range(4):
    elevador.bajar(1)
elevador.soltar()
```
</details>

#### Fase 2 · RESOLVER — «Dos viajes»  `41.2`

**Qué hay que hacer:** Hay 4 pasajeros, en parejas por piso, y caben 2. Haz DOS viajes completos: en cada uno sube hasta encontrar a una pareja, recógela, baja a la planta baja y suéltala. Se prueba en 4 edificios.

**Cómo se pasa:**

- Tu programa se prueba en **todos** estos casos (se ve uno con animación y los demás se prueban en silencio). Hay que acertar en cada uno:

  | Caso | Situación | Resultado esperado |
  |---|---|---|
  | Pasajeros en 2, 2, 4, 4 | El elevador empieza en el piso 1; pasajeros esperando en piso 2, piso 2, piso 4 y piso 4 | Entregar a todos en la planta baja |
  | Pasajeros en 3, 3, 5, 5 | El elevador empieza en el piso 1; pasajeros esperando en piso 3, piso 3, piso 5 y piso 5 | Entregar a todos en la planta baja |
  | Pasajeros en 2, 2, 3, 3 | El elevador empieza en el piso 1; pasajeros esperando en piso 2, piso 2, piso 3 y piso 3 | Entregar a todos en la planta baja |
  | Pasajeros en 4, 4, 5, 5 | El elevador empieza en el piso 1; pasajeros esperando en piso 4, piso 4, piso 5 y piso 5 | Entregar a todos en la planta baja |

- Tu código debe usar: `while`.

**Pistas del juego:** El ciclo de afuera repite 2 veces todo el recorrido.

**Si no pasa, el juego dice:** «Con un solo viaje solo se entregan 2 de las 4 personas.»

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
viajes = 0
while viajes < 2:
    while not elevador.hayPasajero():
        elevador.subir(1)
    elevador.recoger()
    while elevador.piso() > 1:
        elevador.bajar(1)
    elevador.soltar()
    viajes = viajes + 1
```
</details>

#### Fase 3 · LIBRE — «Cabina chica libre»  `41.3`

**Qué hay que hacer:** Experimenta con la cabina de 2 personas. Nada se evalúa.

**En pantalla:** El elevador empieza en el piso 1; pasajeros en piso 2, piso 2 y piso 3.

**Cómo se pasa:**

- No hay objetivo: escribe y ejecuta lo que quieras. La fase se completa al ejecutar.

**Pistas del juego:** Prueba llevando().

### Nivel 11 del Mundo 3 (id 42) — Reportes por piso

**Concepto:** ciclos con reportes  ·  **Historia:** _El jefe de seguridad quiere saber EN QUÉ pisos hay gente y que solo se atienda a los pisos pares._

#### Fase 1 · RESOLVER — «Pisos con gente»  `42.1`

**Qué hay que hacer:** Sube 4 veces y, cada vez que haya pasajeros en el piso, muestra el número de ese piso (usa elevador.piso()). No recojas a nadie. Se prueba en 5 edificios.

**Cómo se pasa:**

- Tu programa se prueba en **todos** estos casos (se ve uno con animación y los demás se prueban en silencio). Hay que acertar en cada uno:

  | Caso | Situación | Resultado esperado |
  |---|---|---|
  | Pasajeros en 2, 4 | El elevador empieza en el piso 1; pasajeros esperando en piso 2 y piso 4 | Mostrar «2», luego «4» |
  | Pasajeros en 3 | El elevador empieza en el piso 1; pasajeros esperando en piso 3 | Mostrar «3» |
  | Pasajeros en 2, 3, 5 | El elevador empieza en el piso 1; pasajeros esperando en piso 2, piso 3 y piso 5 | Mostrar «2», luego «3», luego «5» |
  | Edificio vacío | El elevador empieza en el piso 1; sin pasajeros | **No mostrar nada** |
  | Pasajeros en 2, 2, 4 | El elevador empieza en el piso 1; pasajeros esperando en piso 2, piso 2 y piso 4 | Mostrar «2», luego «4» |

- Tu código debe usar: `for` y `if`.

**Pistas del juego:** print(elevador.piso()) dentro del if.

**Si no pasa, el juego dice:** «Debe mostrar cada piso con gente, en orden y una sola vez.»

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
for i in range(4):
    elevador.subir(1)
    if elevador.hayPasajero():
        print(elevador.piso())
```
</details>

#### Fase 2 · RESOLVER — «Solo pisos pares»  `42.2`

**Qué hay que hacer:** Sube 4 veces y recoge a los pasajeros ÚNICAMENTE en los pisos pares (2 y 4). No los bajes: solo cuenta lo que queda en la cabina. Se prueba en 5 edificios.

**Cómo se pasa:**

- Tu programa se prueba en **todos** estos casos (se ve uno con animación y los demás se prueban en silencio). Hay que acertar en cada uno:

  | Caso | Situación | Resultado esperado |
  |---|---|---|
  | Pasajeros en 2, 3, 4, 5 | El elevador empieza en el piso 1; pasajeros esperando en piso 2, piso 3, piso 4 y piso 5 | Al terminar deben ir 2 pasajeros en la cabina. |
  | Pasajeros en 3, 5 | El elevador empieza en el piso 1; pasajeros esperando en piso 3 y piso 5 | Al terminar deben ir 0 pasajeros en la cabina. |
  | Pasajeros en 2, 4, 4 | El elevador empieza en el piso 1; pasajeros esperando en piso 2, piso 4 y piso 4 | Al terminar deben ir 3 pasajeros en la cabina. |
  | Pasajeros en 2 | El elevador empieza en el piso 1; pasajeros esperando en piso 2 | Al terminar deben ir 1 pasajeros en la cabina. |
  | Pasajeros en 5 | El elevador empieza en el piso 1; pasajeros esperando en piso 5 | Al terminar deben ir 0 pasajeros en la cabina. |

- Tu código debe usar: `for`, `if` y `and`.

**Pistas del juego:** piso % 2 == 0 es verdadero en los pisos pares.

**Si no pasa, el juego dice:** «Los pasajeros de pisos impares deben quedarse esperando.»

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
for i in range(4):
    elevador.subir(1)
    if elevador.piso() % 2 == 0 and elevador.hayPasajero():
        elevador.recoger()
```
</details>

#### Fase 3 · LIBRE — «Torre libre»  `42.3`

**Qué hay que hacer:** Experimenta con reportes y condiciones. Nada se evalúa.

**En pantalla:** El elevador empieza en el piso 1; pasajeros en piso 2, piso 3 y piso 5.

**Cómo se pasa:**

- No hay objetivo: escribe y ejecuta lo que quieras. La fase se completa al ejecutar.

**Pistas del juego:** Prueba % con otros números.

### Nivel 12 del Mundo 3 (id 43) — El gran operativo

**Concepto:** contadores con ciclos  ·  **Historia:** _El complejo entero debe evacuarse y el jefe de seguridad quiere un reporte: cuántas personas salvó el elevador._

#### Fase 1 · RESOLVER — «Evacuación con reporte»  `43.1`

**Qué hay que hacer:** Recoge a todos los pasajeros (hay entre 0 y 4, uno por piso), llévalos a la planta baja y muestra cuántos fueron usando un contador llamado llevados. Se prueba con 5 edificios, ¡incluso uno vacío!

**Cómo se pasa:**

- Tu programa se prueba en **todos** estos casos (se ve uno con animación y los demás se prueban en silencio). Hay que acertar en cada uno:

  | Caso | Situación | Resultado esperado |
  |---|---|---|
  | Pasajeros en 2, 4 | El elevador empieza en el piso 1; pasajeros esperando en piso 2 y piso 4 | Entregar a todos en la planta baja · Mostrar «2» |
  | Pasajeros en 3 | El elevador empieza en el piso 1; pasajeros esperando en piso 3 | Entregar a todos en la planta baja · Mostrar «1» |
  | Pasajeros en 2, 3, 4, 5 | El elevador empieza en el piso 1; pasajeros esperando en piso 2, piso 3, piso 4 y piso 5 | Entregar a todos en la planta baja · Mostrar «4» |
  | Edificio vacío | El elevador empieza en el piso 1; sin pasajeros | Entregar a todos en la planta baja · Mostrar «0» |
  | Pasajeros en 5 | El elevador empieza en el piso 1; pasajeros esperando en piso 5 | Entregar a todos en la planta baja · Mostrar «1» |

- Tu código debe usar: `if`.
- Debe crear una variable llamada `llevados`.

**Pistas del juego:** Sube 4 veces; en cada piso, if hayPasajero(): recoger() y suma 1 a llevados. · Después baja 4 veces, suelta y muestra llevados.

**Si no pasa, el juego dice:** «Debe entregar a todos y mostrar la cantidad correcta (0 si no había nadie).»

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
llevados = 0
for i in range(4):
    elevador.subir(1)
    if elevador.hayPasajero():
        elevador.recoger()
        llevados = llevados + 1
for i in range(4):
    elevador.bajar(1)
elevador.soltar()
print(llevados)
```
</details>

#### Fase 2 · RESOLVER — «El operativo de dos viajes»  `43.2`

**Qué hay que hacer:** Cabina de 2 personas y 4 pasajeros en parejas. Haz dos viajes completos (sube hasta una pareja, recógela, baja y suéltala) contándolos con la variable viajes, y al final muestra cuántos viajes hiciste (2). Se prueba en 4 edificios.

**Cómo se pasa:**

- Tu programa se prueba en **todos** estos casos (se ve uno con animación y los demás se prueban en silencio). Hay que acertar en cada uno:

  | Caso | Situación | Resultado esperado |
  |---|---|---|
  | Parejas en 2-4 | El elevador empieza en el piso 1; pasajeros esperando en piso 2, piso 2, piso 4 y piso 4 | Entregar a todos en la planta baja · Mostrar «2» |
  | Parejas en 3-5 | El elevador empieza en el piso 1; pasajeros esperando en piso 3, piso 3, piso 5 y piso 5 | Entregar a todos en la planta baja · Mostrar «2» |
  | Parejas en 2-3 | El elevador empieza en el piso 1; pasajeros esperando en piso 2, piso 2, piso 3 y piso 3 | Entregar a todos en la planta baja · Mostrar «2» |
  | Parejas en 4-5 | El elevador empieza en el piso 1; pasajeros esperando en piso 4, piso 4, piso 5 y piso 5 | Entregar a todos en la planta baja · Mostrar «2» |

- Tu código debe usar: `while`.
- Debe crear una variable llamada `viajes`.

**Pistas del juego:** El ciclo de afuera cuenta los viajes; el de adentro busca a la pareja.

**Si no pasa, el juego dice:** «Deben quedar entregadas las 4 personas y mostrarse 2 viajes.»

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
viajes = 0
while viajes < 2:
    while not elevador.hayPasajero():
        elevador.subir(1)
    elevador.recoger()
    while elevador.piso() > 1:
        elevador.bajar(1)
    elevador.soltar()
    viajes = viajes + 1
print(viajes)
```
</details>

#### Fase 3 · LIBRE — «Torre libre»  `43.3`

**Qué hay que hacer:** Experimenta con todo lo aprendido. Nada se evalúa: es tu despedida del Mundo 3.

**En pantalla:** El elevador empieza en el piso 1; pasajeros en piso 2, piso 3 y piso 5.

**Cómo se pasa:**

- No hay objetivo: escribe y ejecuta lo que quieras. La fase se completa al ejecutar.

**Pistas del juego:** Prueba combinar while, for e if.

### Nivel Jefe 👑 del Mundo 3 (id 47) — Evacuación crítica

**Concepto:** integración del Mundo 3  ·  **Historia:** _El complejo entero está en llamas y el elevador tiene la batería casi agotada. Cada piso cuenta._

> 👑 **Nivel Jefe:** no hay botón de pistas, el editor empieza en blanco y se prueba en varios casos.

#### Fase 1 · RESOLVER — «Evacuación crítica»  `47.1`

**Qué hay que hacer:** ¡Alarma en el edificio! Hay pasajeros esperando en todos los pisos y la batería del elevador solo alcanza para recorrer 10 pisos (cada piso recorrido gasta 1). Evacúa a todos hasta la planta baja sin quedarte sin energía. Se prueba con 5 edificios distintos.

**Cómo se pasa:**

- Tu programa se prueba en **todos** estos casos (se ve uno con animación y los demás se prueban en silencio). Hay que acertar en cada uno:

  | Caso | Situación | Resultado esperado |
  |---|---|---|
  | Edificio 1 | El elevador empieza en el piso 1; pasajeros esperando en piso 2, piso 3, piso 4 y piso 5 | Entregar a todos en la planta baja |
  | Edificio 2 | El elevador empieza en el piso 1; pasajeros esperando en piso 3, piso 3, piso 5 y piso 5 | Entregar a todos en la planta baja |
  | Edificio 3 | El elevador empieza en el piso 1; pasajeros esperando en piso 2, piso 2, piso 4 y piso 5 | Entregar a todos en la planta baja |
  | Edificio 4 | El elevador empieza en el piso 1; pasajeros esperando en piso 5, piso 5, piso 5 y piso 5 | Entregar a todos en la planta baja |
  | Edificio 5 | El elevador empieza en el piso 1; pasajeros esperando en piso 2, piso 3, piso 3 y piso 4 | Entregar a todos en la planta baja |


**Si no pasa, el juego dice:** «Deben quedar todos en la planta baja sin agotar la batería: planea un solo viaje de subida y bajada.»

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
for i in range(4):
    elevador.subir(1)
    if elevador.hayPasajero():
        elevador.recoger()
for i in range(4):
    elevador.bajar(1)
elevador.soltar()
```
</details>

> 🎬 **Al terminar este nivel** aparece la pantalla de transición: _¡Evacuación completada! Robot1 descubre una puerta con luces parpadeantes: es la entrada a una fábrica de robots gigante. Allí lo espera el Mundo 4: Modularidad._

---

## Mundo 4 · Modularidad

- **Escenario:** Fábrica de robots (cada función se construye como una **máquina**; a veces con una pista para Robot1).
- **Qué se aprende:** Funciones: `def`, llamar una función, parámetros, `return`, variables locales y depuración de errores de ámbito y de orden.
- **Niveles:** 8 · **Estrellas posibles:** 24

### Nivel 1 del Mundo 4 (id 48) — Construyendo máquinas

**Concepto:** definir una función con def  ·  **Historia:** _Al otro lado de la puerta hay una fábrica de robots gigante. Aquí nadie repite el trabajo a mano: se construyen máquinas que reciben materiales, los procesan y entregan un producto terminado. Robot1 aprenderá a construir las suyas._

#### Fase 1 · EXPLORAR — «Se construye una máquina»  `48.1`

**Qué hay que hacer:** Concepto nuevo: una función es una MÁQUINA con nombre. def la construye una sola vez, pero construirla no la enciende. Ejecuta el programa: verás aparecer la máquina en la línea de ensamble, pero no pasa nada más… ¿por qué?

**En pantalla:** La **línea de ensamble** muestra una máquina por cada `def`; en cada llamada viaja una caja de materiales con los parámetros, aparecen las variables locales dentro de la máquina y sale una caja de producto terminado (verde con el valor del `return`, gris con `None` si no hubo) o una burbuja si hay `print`.

**Cómo se pasa:**

- Basta con ejecutar el programa sin errores.

**Pistas del juego:** Fíjate: la máquina aparece, pero no entra ninguna caja de materiales. · Las líneas de dentro del def llevan sangría.

#### Fase 2 · PREDECIR — «¿Qué muestra?»  `48.2`

**Qué hay que hacer:** En Python, ¿qué muestra este programa?

**Cómo se pasa:**

- ✅ No muestra nada
- ▫️ ¡Piii!
- ▫️ Un error
- Se pasa eligiendo: **No muestra nada**.

**Pistas del juego:** ¿Hay alguna línea que llame a pitar()?

<details><summary>Ver el código de la fase</summary>

```python
def pitar():
    print("¡Piii!")
```
</details>

#### Fase 3 · MODIFICAR — «Abre la fábrica»  `48.3`

**Qué hay que hacer:** Esta máquina está construida pero el programa no muestra nada. Modifícalo (sin cambiar la máquina) para que se vea Fábrica abierta.

**En pantalla:** La **línea de ensamble** muestra una máquina por cada `def`; en cada llamada viaja una caja de materiales con los parámetros, aparecen las variables locales dentro de la máquina y sale una caja de producto terminado (verde con el valor del `return`, gris con `None` si no hubo) o una burbuja si hay `print`.

**Cómo se pasa:**

- El programa debe mostrar «Fábrica abierta».
- Debe definir una función llamada `abrir_fabrica` con 0 parámetro(s).
- Debe llamar a `abrir_fabrica()` al menos 1 vez/veces.
- Tu código debe usar: `def`.

**Pistas del juego:** Falta una línea, sin sangría, debajo del def.

**Si no pasa, el juego dice:** «Debe verse Fábrica abierta: la máquina hay que encenderla escribiendo abrir_fabrica().»

<details><summary>Ver el código de la fase</summary>

```python
def abrir_fabrica():
    print("Fábrica abierta")
```
</details>

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
def abrir_fabrica():
    print("Fábrica abierta")
abrir_fabrica()
```
</details>

#### Fase 4 · ESCRIBIR — «Construye tu primera máquina»  `48.4`

**Qué hay que hacer:** Construye una función llamada saludar que muestre Hola fábrica, y enciéndela una vez.

**En pantalla:** La **línea de ensamble** muestra una máquina por cada `def`; en cada llamada viaja una caja de materiales con los parámetros, aparecen las variables locales dentro de la máquina y sale una caja de producto terminado (verde con el valor del `return`, gris con `None` si no hubo) o una burbuja si hay `print`.

**Cómo se pasa:**

- El programa debe mostrar «Hola fábrica».
- Debe definir una función llamada `saludar` con 0 parámetro(s).
- Debe llamar a `saludar()` al menos 1 vez/veces.
- Tu código debe usar: `def`.

**Pistas del juego:** def saludar(): y dentro, con sangría, el print. · Después, en otra línea sin sangría: saludar()

**Si no pasa, el juego dice:** «Debe haber una función saludar y llamarse una vez (se verá Hola fábrica).»

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
def saludar():
    print("Hola fábrica")
saludar()
```
</details>

### Nivel 2 del Mundo 4 (id 49) — Activando la producción

**Concepto:** llamar funciones ya definidas  ·  **Historia:** _Las máquinas ya están construidas. Ahora hay que encenderlas, y el orden de las llamadas decide el orden de la producción._

#### Fase 1 · EXPLORAR — «Cada llamada enciende una máquina»  `49.1`

**Qué hay que hacer:** Estas dos máquinas ya están definidas. Cada línea saludar() o despedir() enciende UNA máquina; una misma máquina se puede encender las veces que quieras. Ejecuta y cuenta las veces que trabaja cada una.

**En pantalla:** La **línea de ensamble** muestra una máquina por cada `def`; en cada llamada viaja una caja de materiales con los parámetros, aparecen las variables locales dentro de la máquina y sale una caja de producto terminado (verde con el valor del `return`, gris con `None` si no hubo) o una burbuja si hay `print`.

**Cómo se pasa:**

- Basta con ejecutar el programa sin errores.

**Pistas del juego:** Cuenta las cajas de materiales que entran a cada máquina.

#### Fase 2 · PREDECIR — «¿En qué orden?»  `49.2`

**Qué hay que hacer:** En Python, ¿qué muestra este programa?

**Cómo se pasa:**

- ▫️ A, B, A
- ✅ B, A, B
- ▫️ A, B
- Se pasa eligiendo: **B, A, B**.

**Pistas del juego:** Mira solo las líneas que llaman: b(), a(), b().

<details><summary>Ver el código de la fase</summary>

```python
def a():
    print("A")
def b():
    print("B")
b()
a()
b()
```
</details>

#### Fase 3 · RESOLVER — «Activa la línea de producción»  `49.3`

**Qué hay que hacer:** Las máquinas cortar(), soldar() y pintar() ya están definidas. Escribe las llamadas para que la producción sea: primero cortar, luego soldar y por último pintar.

**En pantalla:** La **línea de ensamble** muestra una máquina por cada `def`; en cada llamada viaja una caja de materiales con los parámetros, aparecen las variables locales dentro de la máquina y sale una caja de producto terminado (verde con el valor del `return`, gris con `None` si no hubo) o una burbuja si hay `print`.

**Cómo se pasa:**

- El programa debe mostrar «Cortando», luego «Soldando», luego «Pintando».
- Debe llamar a `cortar()` al menos 1 vez/veces.
- Debe llamar a `soldar()` al menos 1 vez/veces.
- Debe llamar a `pintar()` al menos 1 vez/veces.

**Pistas del juego:** Debajo de los tres def, una llamada por línea.

**Si no pasa, el juego dice:** «Debe mostrar Cortando, Soldando y Pintando, en ese orden (llama a las tres máquinas).»

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
def cortar():
    print("Cortando")
def soldar():
    print("Soldando")
def pintar():
    print("Pintando")
cortar()
soldar()
pintar()
```
</details>

#### Fase 4 · RESOLVER — «Una máquina con el robot»  `49.4`

**Qué hay que hacer:** La máquina paso() ya está definida: avanza 1 casilla. Úsala dentro de un ciclo for para que Robot1 llegue a la bandera, en la casilla (5,0).

**En pantalla:** Mundo 2D: cuadrícula de 8×1; Robot1 empieza en (0,0) mirando al este; bandera en (5,0).

**Cómo se pasa:**

- Robot1 debe terminar en la casilla (5,0).
- Debe llamar a `paso()` al menos 5 vez/veces.
- Tu código debe usar: `for`.

**Pistas del juego:** for i in range(5): y dentro paso()

**Si no pasa, el juego dice:** «Robot1 debe llegar a (5,0) llamando a paso() cinco veces dentro de un for.»

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
def paso():
    robot1.avanzar(1)
for i in range(5):
    paso()
```
</details>

### Nivel 3 del Mundo 4 (id 50) — Personalizando productos

**Concepto:** parámetros de una función  ·  **Historia:** _Una máquina que siempre hace lo mismo sirve poco. Con parámetros, la misma máquina fabrica productos distintos según los materiales que reciba._

#### Fase 1 · EXPLORAR — «La caja de materiales»  `50.1`

**Qué hay que hacer:** Concepto nuevo: un PARÁMETRO es una ranura de entrada de la máquina. Cada llamada lleva una caja de materiales con los valores (los argumentos). Mira cómo n recibe 2 y luego 4.

**En pantalla:** Mundo 2D: cuadrícula de 8×1; Robot1 empieza en (0,0) mirando al este; bandera en (6,0).

**Cómo se pasa:**

- Basta con ejecutar el programa sin errores.

**Pistas del juego:** Mira la caja azul que entra a la máquina y el chip n = ... que aparece dentro.

#### Fase 2 · PREDECIR — «¿Qué entra y qué sale?»  `50.2`

**Qué hay que hacer:** En Python, ¿qué muestra este programa?

**Cómo se pasa:**

- ▫️ ok una sola vez
- ✅ ok dos veces
- ▫️ texto veces
- Se pasa eligiendo: **ok dos veces**.

**Pistas del juego:** Primero reemplaza los parámetros por los valores de la llamada.

<details><summary>Ver el código de la fase</summary>

```python
def repetir(texto, veces):
    for i in range(veces):
        print(texto)
repetir("ok", 2)
```
</details>

#### Fase 3 · ESCRIBIR — «Una máquina que repite lo que le dan»  `50.3`

**Qué hay que hacer:** Construye la función decir(mensaje) que muestre el mensaje que reciba. Llámala con "A" y después con "B".

**En pantalla:** La **línea de ensamble** muestra una máquina por cada `def`; en cada llamada viaja una caja de materiales con los parámetros, aparecen las variables locales dentro de la máquina y sale una caja de producto terminado (verde con el valor del `return`, gris con `None` si no hubo) o una burbuja si hay `print`.

**Cómo se pasa:**

- El programa debe mostrar «A», luego «B».
- Debe definir una función llamada `decir` con 1 parámetro(s).
- Debe llamar a `decir()` al menos 2 vez/veces.
- Tu código debe usar: `def`.

**Pistas del juego:** def decir(mensaje): y dentro print(mensaje).

**Si no pasa, el juego dice:** «Debe verse A y luego B, usando la función decir con un parámetro.»

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
def decir(mensaje):
    print(mensaje)
decir("A")
decir("B")
```
</details>

#### Fase 4 · ESCRIBIR — «Fabrica productos distintos»  `50.4`

**Qué hay que hacer:** Construye la función fabricar(producto, cantidad) que muestre una línea con el producto, una x y la cantidad (por ejemplo: tornillos x 5). Úsala para fabricar tornillos (5) y luego tuercas (3).

**En pantalla:** La **línea de ensamble** muestra una máquina por cada `def`; en cada llamada viaja una caja de materiales con los parámetros, aparecen las variables locales dentro de la máquina y sale una caja de producto terminado (verde con el valor del `return`, gris con `None` si no hubo) o una burbuja si hay `print`.

**Cómo se pasa:**

- El programa debe mostrar «tornillos x 5», luego «tuercas x 3».
- Debe definir una función llamada `fabricar` con 2 parámetro(s).
- Debe llamar a `fabricar()` al menos 2 vez/veces.
- Tu código debe usar: `def`.

**Pistas del juego:** Recuerda que para unir un texto con un número hay que usar str().

**Si no pasa, el juego dice:** «Debe mostrar tornillos x 5 y tuercas x 3 con una función fabricar de dos parámetros.»

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
def fabricar(producto, cantidad):
    print(producto + " x " + str(cantidad))
fabricar("tornillos", 5)
fabricar("tuercas", 3)
```
</details>

### Nivel 4 del Mundo 4 (id 51) — El producto terminado

**Concepto:** return y valor de retorno  ·  **Historia:** _Hasta ahora las máquinas mostraban cosas. Una buena máquina ENTREGA un producto terminado: un valor que el programa puede guardar y usar._

#### Fase 1 · EXPLORAR — «La bandeja de salida»  `51.1`

**Qué hay que hacer:** Concepto nuevo: return devuelve un valor a quien llamó la función: sale de la máquina en una caja de producto terminado. Ese valor se puede guardar en una variable. Ejecuta y mira la caja que sale.

**En pantalla:** La **línea de ensamble** muestra una máquina por cada `def`; en cada llamada viaja una caja de materiales con los parámetros, aparecen las variables locales dentro de la máquina y sale una caja de producto terminado (verde con el valor del `return`, gris con `None` si no hubo) o una burbuja si hay `print`.

**Cómo se pasa:**

- Basta con ejecutar el programa sin errores.

**Pistas del juego:** La caja verde que sale de la máquina lleva el valor 42.

#### Fase 2 · PREDECIR — «¿Qué devuelve?»  `51.2`

**Qué hay que hacer:** En Python, ¿qué muestra este programa?

**Cómo se pasa:**

- ▫️ 5
- ✅ 10
- ▫️ 7
- Se pasa eligiendo: **10**.

**Pistas del juego:** Primero calcula suma(2, 3).

<details><summary>Ver el código de la fase</summary>

```python
def suma(a, b):
    return a + b
print(suma(2, 3) * 2)
```
</details>

#### Fase 3 · DEBUG — «Muestra, pero no entrega»  `51.3`

**Qué hay que hacer:** Esta máquina MUESTRA el doble con print, pero no lo DEVUELVE: la variable resultado se queda con None (caja gris) y el programa imprime dos líneas. Arréglala para que la máquina entregue el valor con return y el programa muestre solo 42.

**En pantalla:** La **línea de ensamble** muestra una máquina por cada `def`; en cada llamada viaja una caja de materiales con los parámetros, aparecen las variables locales dentro de la máquina y sale una caja de producto terminado (verde con el valor del `return`, gris con `None` si no hubo) o una burbuja si hay `print`.

**Cómo se pasa:**

- El programa debe mostrar «42».
- La función `calcular_doble` debe **devolver** un valor con `return` (no solo mostrarlo).
- Tu código debe usar: `return`.

**Pistas del juego:** Cambia print por return dentro de la función.

**Si no pasa, el juego dice:** «Debe mostrarse solo 42, y la función tiene que devolver el valor con return.»

<details><summary>Ver el código de la fase</summary>

```python
def calcular_doble(x):
    print(x * 2)
resultado = calcular_doble(21)
print(resultado)
```
</details>

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
def calcular_doble(x):
    return x * 2
resultado = calcular_doble(21)
print(resultado)
```
</details>

#### Fase 4 · DEBUG — «¿Es par? (otra vez sin entregar)»  `51.4`

**Qué hay que hacer:** Esta máquina debería DEVOLVER True si el número es par, pero solo lo muestra. Corrígela para que es_par(8) y es_par(7) entreguen su valor y el programa muestre True y False (una sola vez cada uno).

**En pantalla:** La **línea de ensamble** muestra una máquina por cada `def`; en cada llamada viaja una caja de materiales con los parámetros, aparecen las variables locales dentro de la máquina y sale una caja de producto terminado (verde con el valor del `return`, gris con `None` si no hubo) o una burbuja si hay `print`.

**Cómo se pasa:**

- El programa debe mostrar «True», luego «False».
- La función `es_par` debe **devolver** un valor con `return` (no solo mostrarlo).
- Tu código debe usar: `return`.

**Pistas del juego:** return n % 2 == 0 devuelve True o False.

**Si no pasa, el juego dice:** «Debe mostrar True y luego False, devolviendo el resultado con return.»

<details><summary>Ver el código de la fase</summary>

```python
def es_par(n):
    print(n % 2 == 0)
print(es_par(8))
print(es_par(7))
```
</details>

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
def es_par(n):
    return n % 2 == 0
print(es_par(8))
print(es_par(7))
```
</details>

### Nivel 5 del Mundo 4 (id 52) — Información confidencial

**Concepto:** variables locales y ámbito  ·  **Historia:** _Lo que ocurre dentro de una máquina es confidencial: sus variables locales no se ven desde fuera. Solo sale lo que la máquina entrega con return._

#### Fase 1 · EXPLORAR — «El cuarto interno de la máquina»  `52.1`

**Qué hay que hacer:** Concepto nuevo: las variables que se crean dentro de una función son LOCALES. Mira cómo aparece el chip interno = 20 dentro de la máquina… y desaparece cuando la máquina termina. Solo sale lo que se devuelve.

**En pantalla:** La **línea de ensamble** muestra una máquina por cada `def`; en cada llamada viaja una caja de materiales con los parámetros, aparecen las variables locales dentro de la máquina y sale una caja de producto terminado (verde con el valor del `return`, gris con `None` si no hubo) o una burbuja si hay `print`.

**Cómo se pasa:**

- Basta con ejecutar el programa sin errores.

**Pistas del juego:** El chip dentro de la máquina es la variable local.

#### Fase 2 · PREDECIR — «Lo que pasa dentro, se queda dentro»  `52.2`

**Qué hay que hacer:** En Python, ¿qué pasa al ejecutar este programa?

**Cómo se pasa:**

- ▫️ Muestra 20
- ✅ Error: resultado solo existe dentro de la función
- ▫️ Muestra None
- Se pasa eligiendo: **Error: resultado solo existe dentro de la función**.

**Pistas del juego:** ¿Dónde se creó resultado?

<details><summary>Ver el código de la fase</summary>

```python
def calcular():
    resultado = 5 * 4
calcular()
print(resultado)
```
</details>

#### Fase 3 · PREDECIR — «¿La de afuera cambia?»  `52.3`

**Qué hay que hacer:** En Python, ¿qué muestra este programa?

**Cómo se pasa:**

- ▫️ 99
- ✅ 10
- ▫️ Un error
- Se pasa eligiendo: **10**.

**Pistas del juego:** ¿Cuántas variables llamadas x hay?

<details><summary>Ver el código de la fase</summary>

```python
x = 10
def cambiar():
    x = 99
cambiar()
print(x)
```
</details>

#### Fase 4 · DEBUG — «Saca el valor de la máquina»  `52.4`

**Qué hay que hacer:** Este programa da error porque resultado es local. Corrígelo para que muestre 20: haz que la función devuelva el valor con return y guárdalo en resultado.

**En pantalla:** La **línea de ensamble** muestra una máquina por cada `def`; en cada llamada viaja una caja de materiales con los parámetros, aparecen las variables locales dentro de la máquina y sale una caja de producto terminado (verde con el valor del `return`, gris con `None` si no hubo) o una burbuja si hay `print`.

**Cómo se pasa:**

- Debe mostrar «20» y el código tiene que crear la variable `resultado`.
- La función `calcular` debe **devolver** un valor con `return` (no solo mostrarlo).
- Tu código debe usar: `return`.

**Pistas del juego:** Cambia la asignación de dentro por return 5 * 4. · Afuera: resultado = calcular()

**Si no pasa, el juego dice:** «Debe mostrar 20 devolviendo el valor con return.»

<details><summary>Ver el código de la fase</summary>

```python
def calcular():
    resultado = 5 * 4
calcular()
print(resultado)
```
</details>

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
def calcular():
    return 5 * 4
resultado = calcular()
print(resultado)
```
</details>

### Nivel 6 del Mundo 4 (id 53) — Producción en cadena

**Concepto:** usar el return de una función como parámetro de otra  ·  **Historia:** _Las máquinas se pueden conectar: lo que sale de una entra a la siguiente. Así se arma una cadena de producción._

#### Fase 1 · EXPLORAR — «Una máquina alimenta a otra»  `53.1`

**Qué hay que hacer:** El producto terminado de una máquina puede ser el material de la siguiente: doble(sumar(2, 3)). Python primero ejecuta la máquina de adentro y su resultado entra a la de afuera. Mira cómo la caja verde de sumar pasa a ser la caja de materiales de doble.

**En pantalla:** La **línea de ensamble** muestra una máquina por cada `def`; en cada llamada viaja una caja de materiales con los parámetros, aparecen las variables locales dentro de la máquina y sale una caja de producto terminado (verde con el valor del `return`, gris con `None` si no hubo) o una burbuja si hay `print`.

**Cómo se pasa:**

- Basta con ejecutar el programa sin errores.

**Pistas del juego:** Se ejecuta primero lo que está más adentro de los paréntesis.

#### Fase 2 · PREDECIR — «¿Qué sale de la cadena?»  `53.2`

**Qué hay que hacer:** En Python, ¿qué muestra este programa?

**Cómo se pasa:**

- ▫️ 9
- ✅ 10
- ▫️ 8
- Se pasa eligiendo: **10**.

**Pistas del juego:** Empieza por la máquina de adentro.

<details><summary>Ver el código de la fase</summary>

```python
def doble(x):
    return x * 2
def sumar_uno(x):
    return x + 1
print(doble(sumar_uno(4)))
```
</details>

#### Fase 3 · RESOLVER — «Conecta dos máquinas»  `53.3`

**Qué hay que hacer:** Construye cuadrado(n), que devuelva n * n, y mitad(n), que devuelva n // 2. Muestra el resultado de pasar el cuadrado de 6 por la máquina mitad (18), conectándolas en una sola línea.

**En pantalla:** La **línea de ensamble** muestra una máquina por cada `def`; en cada llamada viaja una caja de materiales con los parámetros, aparecen las variables locales dentro de la máquina y sale una caja de producto terminado (verde con el valor del `return`, gris con `None` si no hubo) o una burbuja si hay `print`.

**Cómo se pasa:**

- El programa debe mostrar «18».
- La función `cuadrado` debe **devolver** un valor con `return` (no solo mostrarlo).
- La función `mitad` debe **devolver** un valor con `return` (no solo mostrarlo).
- Debe llamar a `cuadrado()` al menos 1 vez/veces.
- Debe llamar a `mitad()` al menos 1 vez/veces.
- Tu código debe usar: `return`.

**Pistas del juego:** mitad(cuadrado(6))

**Si no pasa, el juego dice:** «Debe mostrar 18 usando las dos funciones, una dentro de la otra.»

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
def cuadrado(n):
    return n * n
def mitad(n):
    return n // 2
print(mitad(cuadrado(6)))
```
</details>

#### Fase 4 · RESOLVER — «La cadena de tres»  `53.4`

**Qué hay que hacer:** Construye tres máquinas: quitar_dos(n) devuelve n - 2, duplicar(n) devuelve n * 2 y sumar_tres(n) devuelve n + 3. Pasa el número 10 por las tres, en ese orden, y muestra el resultado final (19).

**En pantalla:** La **línea de ensamble** muestra una máquina por cada `def`; en cada llamada viaja una caja de materiales con los parámetros, aparecen las variables locales dentro de la máquina y sale una caja de producto terminado (verde con el valor del `return`, gris con `None` si no hubo) o una burbuja si hay `print`.

**Cómo se pasa:**

- El programa debe mostrar «19».
- La función `quitar_dos` debe **devolver** un valor con `return` (no solo mostrarlo).
- La función `duplicar` debe **devolver** un valor con `return` (no solo mostrarlo).
- La función `sumar_tres` debe **devolver** un valor con `return` (no solo mostrarlo).
- Tu código debe usar: `return`.

**Pistas del juego:** La primera en ejecutarse es la más interna: quitar_dos(10).

**Si no pasa, el juego dice:** «Debe mostrar 19: ((10 - 2) * 2) + 3, pasando el valor por las tres máquinas.»

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
def quitar_dos(n):
    return n - 2
def duplicar(n):
    return n * 2
def sumar_tres(n):
    return n + 3
print(sumar_tres(duplicar(quitar_dos(10))))
```
</details>

### Nivel 7 del Mundo 4 (id 54) — Reparando la fábrica

**Concepto:** depurar funciones  ·  **Historia:** _La fábrica sufrió un apagón y varias máquinas fallan. Reparar es leer el error y encontrar qué le falta a cada máquina._

#### Fase 1 · DEBUG — «Falta el return»  `54.1`

**Qué hay que hacer:** Este programa muestra None en lugar de 8: a la máquina le falta algo. Corrígela para que muestre 8.

**En pantalla:** La **línea de ensamble** muestra una máquina por cada `def`; en cada llamada viaja una caja de materiales con los parámetros, aparecen las variables locales dentro de la máquina y sale una caja de producto terminado (verde con el valor del `return`, gris con `None` si no hubo) o una burbuja si hay `print`.

**Cómo se pasa:**

- El programa debe mostrar «8».
- La función `doble` debe **devolver** un valor con `return` (no solo mostrarlo).
- Tu código debe usar: `return`.

**Pistas del juego:** Falta una palabra antes de x * 2.

**Si no pasa, el juego dice:** «Debe mostrar 8: la función doble tiene que devolver el resultado.»

<details><summary>Ver el código de la fase</summary>

```python
def doble(x):
    x * 2
print(doble(4))
```
</details>

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
def doble(x):
    return x * 2
print(doble(4))
```
</details>

#### Fase 2 · DEBUG — «Mal parámetro»  `54.2`

**Qué hay que hacer:** Este programa da un error de tipos: la máquina pide dos valores y solo le dan uno. Corrígelo para que muestre 8.

**En pantalla:** La **línea de ensamble** muestra una máquina por cada `def`; en cada llamada viaja una caja de materiales con los parámetros, aparecen las variables locales dentro de la máquina y sale una caja de producto terminado (verde con el valor del `return`, gris con `None` si no hubo) o una burbuja si hay `print`.

**Cómo se pasa:**

- El programa debe mostrar «8».
- Debe llamar a `sumar()` al menos 1 vez/veces.
- Tu código debe usar: `return`.

**Pistas del juego:** sumar necesita a y b.

**Si no pasa, el juego dice:** «Debe mostrar 8 llamando a sumar con sus dos valores.»

<details><summary>Ver el código de la fase</summary>

```python
def sumar(a, b):
    return a + b
print(sumar(5))
```
</details>

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
def sumar(a, b):
    return a + b
print(sumar(5, 3))
```
</details>

#### Fase 3 · DEBUG — «La máquina que nadie enciende»  `54.3`

**Qué hay que hacer:** Este programa debería mostrar Hola, pero no muestra nada. Corrígelo.

**En pantalla:** La **línea de ensamble** muestra una máquina por cada `def`; en cada llamada viaja una caja de materiales con los parámetros, aparecen las variables locales dentro de la máquina y sale una caja de producto terminado (verde con el valor del `return`, gris con `None` si no hubo) o una burbuja si hay `print`.

**Cómo se pasa:**

- El programa debe mostrar «Hola».
- Debe definir una función llamada `saludar` con 0 parámetro(s).
- Debe llamar a `saludar()` al menos 1 vez/veces.
- Tu código debe usar: `def`.

**Pistas del juego:** ¿Quién enciende la máquina?

**Si no pasa, el juego dice:** «Debe mostrar Hola: llama a la función saludar.»

<details><summary>Ver el código de la fase</summary>

```python
def saludar():
    print("Hola")
```
</details>

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
def saludar():
    print("Hola")
saludar()
```
</details>

#### Fase 4 · DEBUG — «Los tres fallos juntos»  `54.4`

**Qué hay que hacer:** El código tiene TRES errores a la vez: a una máquina le falta el return, otra llamada no recibe todos sus valores y hay una máquina que nadie enciende. Repáralos para que el programa muestre 10 y luego Listo (suma 4 y 6, y anuncia Listo con la máquina anunciar).

**En pantalla:** La **línea de ensamble** muestra una máquina por cada `def`; en cada llamada viaja una caja de materiales con los parámetros, aparecen las variables locales dentro de la máquina y sale una caja de producto terminado (verde con el valor del `return`, gris con `None` si no hubo) o una burbuja si hay `print`.

**Cómo se pasa:**

- El programa debe mostrar «10», luego «Listo».
- La función `sumar` debe **devolver** un valor con `return` (no solo mostrarlo).
- Debe llamar a `anunciar()` al menos 1 vez/veces.
- Tu código debe usar: `return`.

**Pistas del juego:** Arregla una máquina a la vez, leyendo el error que aparece. · sumar necesita 2 valores y anunciar nunca se llama.

**Si no pasa, el juego dice:** «Debe mostrar 10 y luego Listo: revisa el return, los valores de sumar y la llamada a anunciar.»

<details><summary>Ver el código de la fase</summary>

```python
def sumar(a, b):
    a + b
def anunciar(texto):
    print(texto)
total = sumar(4)
print(total)
```
</details>

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
def sumar(a, b):
    return a + b
def anunciar(texto):
    print(texto)
total = sumar(4, 6)
print(total)
anunciar("Listo")
```
</details>

### Nivel Jefe 👑 del Mundo 4 (id 55) — El Gran Ensamblaje

**Concepto:** integración del Mundo 4  ·  **Historia:** _Llegó el pedido más grande de la historia de la fábrica: un Robot1 gigante. Nadie te dirá cómo hacerlo: tendrás que dividirlo en máquinas._

> 👑 **Nivel Jefe:** no hay botón de pistas, el editor empieza en blanco.

#### Fase 1 · RESOLVER — «El Gran Ensamblaje»  `55.1`

**Qué hay que hacer:** ¡El pedido final! La fábrica debe construir un Robot1 gigante. Define EXACTAMENTE tres funciones: cabeza(), brazos() y piernas() (cada una muestra con print un mensaje de lo que ensambla) y llámalas, una vez cada una, en ese orden. El robot gigante se irá armando mientras tu código se ejecuta.

**En pantalla:** La línea de ensamble muestra una máquina por función y, abajo, un **Robot1 gigante** que se va armando (cabeza, brazos y piernas) conforme se llama a cada función.

**Cómo se pasa:**

- Debe definir **exactamente** estas funciones: `cabeza()`, `brazos()` y `piernas()`, y llamar a cada una al menos una vez, **en ese orden** (la primera llamada de cada una).
- Debe definir una función llamada `cabeza` con 0 parámetro(s).
- Debe definir una función llamada `brazos` con 0 parámetro(s).
- Debe definir una función llamada `piernas` con 0 parámetro(s).
- Tu código debe usar: `def`.

**Si no pasa, el juego dice:** «El robot está incompleto. Asegúrate de definir las 3 funciones y llamarlas en el orden correcto (cabeza, brazos, piernas).»

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
def cabeza():
    print("Cabeza lista")
def brazos():
    print("Brazos listos")
def piernas():
    print("Piernas listas")
cabeza()
brazos()
piernas()
```
</details>

> 🎬 **Al terminar este nivel** aparece la pantalla de transición: _¡El Robot1 gigante está completo y la fábrica es un éxito! Robot1 ya sabe dividir un problema en máquinas. Ahora le espera el último desafío: el Mundo 5, el taller donde construirá proyectos completos por su cuenta._

---

## Mundo 5 · Proyecto

- **Escenario:** Taller de proyectos (la terminal y la memoria, en color rosa).
- **Qué se aprende:** No hay sintaxis nueva: cada nivel es un proyecto que integra `input()`, `if`, `while` y variables. Los niveles 1 a 3 se prueban con varios casos (si falla uno, no pasa) y el Nivel 4 es el proyecto libre que cierra CodeQuest.
- **Niveles:** 4 · **Estrellas posibles:** 12

### Nivel 1 del Mundo 5 (id 56) — La máquina expendedora

**Concepto:** proyecto: input, if y cálculos  ·  **Historia:** _Robot1 llega al Laboratorio de creación: un taller con planos holográficos donde ya no hay lecciones, solo proyectos. Aquí se junta todo lo aprendido._

#### Fase 1 · RESOLVER — «La máquina expendedora»  `56.1`

**Qué hay que hacer:** La máquina expendedora te pide primero el DINERO que metes y después el PRECIO del producto (los dos son números enteros). Si el dinero alcanza, muestra Cambio: seguido del cambio que devuelve (por ejemplo, Cambio: 3). Si no alcanza, muestra Dinero insuficiente. Cuidado con el caso en que el dinero es justo el precio.

**Cómo se pasa:**

- Tu programa se prueba en **todos** estos casos (se ve uno con animación y los demás se prueban en silencio). Hay que acertar en cada uno:

  | Caso | Situación | Resultado esperado |
  |---|---|---|
  | 10 para un producto de 7 |  | Mostrar «Cambio: 3» |
  | Dinero justo |  | Mostrar «Cambio: 0» |
  | No alcanza |  | Mostrar «Dinero insuficiente» |
  | Billete grande |  | Mostrar «Cambio: 19» |
  | Falta una moneda |  | Mostrar «Dinero insuficiente» |

- Tu código debe usar: `input`, `int`, `if` y `else`.

**Pistas del juego:** Convierte cada entrada con int(input()). · if dinero >= precio: ... else: ... (con >= el dinero justo también alcanza).

**Si no pasa, el juego dice:** «Revisa los 5 casos: el dinero justo da Cambio: 0 y, si no alcanza, solo debe verse Dinero insuficiente.»

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
dinero = int(input())
precio = int(input())
if dinero >= precio:
    print("Cambio: " + str(dinero - precio))
else:
    print("Dinero insuficiente")
```
</details>

### Nivel 2 del Mundo 5 (id 57) — El validador de contraseñas

**Concepto:** proyecto: variables, if y and  ·  **Historia:** _Robot1 llega al Laboratorio de creación: un taller con planos holográficos donde ya no hay lecciones, solo proyectos. Aquí se junta todo lo aprendido._

#### Fase 1 · RESOLVER — «El validador de contraseñas»  `57.1`

**Qué hay que hacer:** El sistema ya revisó la contraseña y te dejó listas tres variables en la memoria: contrasena (el texto), longitud (cuántos caracteres tiene) y tiene_numero (True si contiene algún número). Una contraseña es segura si tiene MÁS de 8 caracteres y además contiene un número. Muestra Contraseña segura o Contraseña débil.

**Cómo se pasa:**

- Tu programa se prueba en **todos** estos casos (se ve uno con animación y los demás se prueban en silencio). Hay que acertar en cada uno:

  | Caso | Situación | Resultado esperado |
  |---|---|---|
  | Robot12345 |  | Mostrar «Contraseña segura» |
  | Larga pero sin número |  | Mostrar «Contraseña débil» |
  | Con número pero corta |  | Mostrar «Contraseña débil» |
  | Justo 8 caracteres |  | Mostrar «Contraseña débil» |
  | 9 caracteres con número |  | Mostrar «Contraseña segura» |
  | Corta y sin número |  | Mostrar «Contraseña débil» |

- Tu código debe usar: `if`, `and` y `else`.

**Pistas del juego:** Las dos condiciones se unen con and: longitud > 8 and tiene_numero. · «Más de 8» es > 8; con 8 justos no alcanza.

**Si no pasa, el juego dice:** «Una contraseña es segura SOLO si tiene más de 8 caracteres Y contiene un número. Revisa los casos que fallan.»

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
if longitud > 8 and tiene_numero:
    print("Contraseña segura")
else:
    print("Contraseña débil")
```
</details>

### Nivel 3 del Mundo 5 (id 58) — El juego de adivinanza

**Concepto:** proyecto: while, límite de intentos e if  ·  **Historia:** _Robot1 llega al Laboratorio de creación: un taller con planos holográficos donde ya no hay lecciones, solo proyectos. Aquí se junta todo lo aprendido._

#### Fase 1 · RESOLVER — «El juego de adivinanza»  `58.1`

**Qué hay que hacer:** La computadora ya eligió un número secreto y lo guardó en la variable secreto. El jugador tiene como máximo 5 INTENTOS, y en cada uno escribe un número. Si acierta, muestra ¡Adivinaste! y el juego termina. Si se queda corto, muestra Muy bajo; si se pasa, Muy alto. Si gasta los 5 intentos sin acertar, muestra Perdiste. El juego no debe pedir más números de los necesarios.

**Cómo se pasa:**

- Tu programa se prueba en **todos** estos casos (se ve uno con animación y los demás se prueban en silencio). Hay que acertar en cada uno:

  | Caso | Situación | Resultado esperado |
  |---|---|---|
  | Acierta al tercero |  | Mostrar «Muy bajo», luego «Muy alto», luego «¡Adivinaste!» |
  | Acierta al primero |  | Mostrar «¡Adivinaste!» |
  | Pierde |  | Mostrar «Muy bajo», luego «Muy bajo», luego «Muy bajo», luego «Muy bajo», luego «Muy bajo», luego «Perdiste» |
  | Acierta justo en el último intento |  | Mostrar «Muy alto», luego «Muy alto», luego «Muy alto», luego «Muy alto», luego «¡Adivinaste!» |
  | Alto, bajo y acierta |  | Mostrar «Muy alto», luego «Muy bajo», luego «¡Adivinaste!» |

- Tu código debe usar: `while`, `if`, `int` y `input`.

**Pistas del juego:** Lleva la cuenta con una variable intentos y repite mientras intentos < 5. · Usa otra variable (acertado) para salir del ciclo cuando el jugador gane.

**Si no pasa, el juego dice:** «Revisa los casos: acertar en el 5.º intento todavía gana, y no se deben pedir números de más después de acertar.»

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
intentos = 0
acertado = False
while intentos < 5 and not acertado:
    intento = int(input())
    intentos = intentos + 1
    if intento == secreto:
        print("¡Adivinaste!")
        acertado = True
    elif intento < secreto:
        print("Muy bajo")
    else:
        print("Muy alto")
if not acertado:
    print("Perdiste")
```
</details>

### Nivel Jefe 👑 del Mundo 5 (id 59) — Proyecto libre

**Concepto:** proyecto final de CodeQuest  ·  **Historia:** _Robot1 llega al Laboratorio de creación: un taller con planos holográficos donde ya no hay lecciones, solo proyectos. Aquí se junta todo lo aprendido._

> 👑 **Nivel Jefe:** no hay botón de pistas, el editor empieza en blanco.

#### Fase 1 · RESOLVER — «Proyecto libre»  `59.1`

**Qué hay que hacer:** Este es TU proyecto: un juego, una calculadora, una simulación… lo que imagines. Escribe un programa de al menos 10 líneas de código (los comentarios y las líneas vacías no cuentan) que use un if, un while y al menos una variable. Se comprobará que se ejecute sin errores.

**Cómo se pasa:**

- Basta con ejecutar el programa sin errores.
- El programa debe tener **al menos 10 líneas de código** (las líneas vacías y los comentarios no cuentan).
- Tu código debe usar: `if` y `while`.

**Si no pasa, el juego dice:** «Tu programa necesita al menos 10 líneas de código (sin contar comentarios ni líneas vacías) y usar un if, un while y una variable.»

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
energia = 10
ciclos = 0
print("Iniciando el sistema")
while energia > 0:
    energia = energia - 3
    ciclos = ciclos + 1
    if energia > 5:
        print("Energía alta")
    else:
        print("Energía baja")
print("Ciclos: " + str(ciclos))
```
</details>

> 🎬 **Al terminar este nivel** aparece la pantalla final de CodeQuest (con las estrellas totales y las líneas de código escritas): _¡Felicidades, has completado CodeQuest! Ahora piensas como un programador._
