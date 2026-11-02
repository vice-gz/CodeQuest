# CodeQuest — Guía de niveles y fases (Mundos 2 a 4)

Guía para **facilitar** el juego: qué trabaja cada nivel, qué pide cada fase y **cómo se pasa**, sin necesidad de leer código. Las soluciones de ejemplo están escondidas (spoiler) al final de cada fase de escritura.

> Se genera automáticamente desde los niveles del juego (`python3 herramientas/generar_guia.py`), así que siempre coincide con lo que ven los estudiantes.

## Cómo funciona todo

- **Mundos:** se juegan en orden. Un mundo se abre al completar **todos** los niveles del anterior.
- **Niveles:** cada nivel tiene 3 o 4 fases que se hacen en orden. En el juego los niveles se numeran dentro de su mundo (Nivel 1, 2, 3…); entre paréntesis va el número interno.
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

## Resumen

### Mundo 2 · Memoria

| Nivel | Nombre | Concepto | Fases |
|---|---|---|---|
| 1 (id 9) | Necesito recordar | variable, asignación, identificador, literal | 3: Explorar, Predecir, Escribir |
| 2 (id 10) | Cambia de opinión | reasignación, estado | 3: Explorar, Predecir, Resolver |
| 3 (id 11) | No todo es lo mismo | entero, decimal, texto | 4: Explorar, Predecir, Debug, Debug |
| 4 (id 12) | Cálculo de energía | operadores, expresiones | 3: Explorar, Modificar, Resolver |
| 5 (id 13) | Calcula el reparto | multiplicación, división, división entera y residuo | 4: Explorar, Predecir, Predecir, Resolver |
| 6 (id 14) | Información del exterior | input(), int() y float() | 4: Explorar, Predecir, Escribir, Resolver |
| 7 (id 15) | El identificador incorrecto | identificadores | 4: Explorar, Debug, Predecir, Debug |
| 8 (id 16) | Módulos que se combinan | combinación de variables, tipos y operadores | 4: Explorar, Escribir, Resolver, Escribir |
| 9 (id 17) | El sistema de energía | valores que cambian y valores que no | 3: Explorar, Modificar, Resolver |
| 10 (id 18) | El puente de datos | variables, operadores, input y conversiones juntos | 3: Escribir, Resolver, Libre |
| 11 (id 19) | La puerta del Mundo 3 | integración total del Mundo 2 | 3: Resolver, Escribir, Libre |

### Mundo 3 · Lógica

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

### Mundo 4 · Automatización

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

---

## Mundo 2 · Memoria

- **Escenario:** Centro de Recuperación (módulos de memoria y terminal, **sin robot**).
- **Qué se aprende:** Variables, tipos de dato, operadores, input() y conversiones de tipo (int, float, str). Se ven chips que se iluminan al guardar un valor y cables que muestran de dónde viene cada dato.
- **Niveles:** 11 · **Estrellas posibles:** 33

### Nivel 1 del Mundo 2 (id 9) — Necesito recordar

**Concepto:** variable, asignación, identificador, literal  ·  **Historia:** _En la terminal, cada valor que escribías se usaba y se perdía. Robot1 despierta en el Centro de Recuperación: para recordar, necesita módulos de memoria._

#### Fase 1 · EXPLORAR — «El primer módulo»  `9.1`

**Qué hay que hacer:** Concepto nuevo: el signo = guarda un valor con un nombre en un módulo de memoria. Ese nombre es una variable. Ejecuta y mira cómo se ilumina un chip.

**Cómo se pasa:**

- Basta con ejecutar el programa sin errores.

**Pistas del juego:** Mira los chips morados: el nombre está arriba y el valor al centro.

#### Fase 2 · PREDECIR — «¿Qué muestra print?»  `9.2`

**Qué hay que hacer:** Con nombre = "Robot1", ¿qué muestra print(nombre), sin comillas?

**Cómo se pasa:**

- ▫️ La palabra nombre
- ✅ El texto Robot1
- ▫️ Un error, porque faltan comillas
- Se pasa eligiendo: **El texto Robot1**.

**Pistas del juego:** print("nombre") y print(nombre) son cosas distintas.

<details><summary>Ver el código de la fase</summary>

```python
nombre = "Robot1"
print(nombre)
```
</details>

#### Fase 3 · ESCRIBIR — «Guarda y reutiliza»  `9.3`

**Qué hay que hacer:** Crea una variable llamada mision con el texto "Explorar" y muéstrala con print().

**Cómo se pasa:**

- Debe mostrar «Explorar» y el código tiene que crear la variable `mision`.

**Pistas del juego:** Primero mision = "Explorar". · Luego print(mision), sin comillas.

**Si no pasa, el juego dice:** «Debes usar una variable llamada mision y mostrarla con print().»

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
mision = "Explorar"
print(mision)
```
</details>

### Nivel 2 del Mundo 2 (id 10) — Cambia de opinión

**Concepto:** reasignación, estado  ·  **Historia:** _Un módulo de memoria no es una caja sellada: puede guardar otro valor cuando el programa lo decide._

#### Fase 1 · EXPLORAR — «Un valor nuevo»  `10.1`

**Qué hay que hacer:** Concepto nuevo: reasignar es darle otro valor a una variable que ya existe. El valor anterior se pierde. Ejecuta y mira el chip.

**Cómo se pasa:**

- Basta con ejecutar el programa sin errores.

**Pistas del juego:** Fíjate en el texto pequeño «antes:» dentro del chip.

#### Fase 2 · PREDECIR — «¿Con qué valor termina?»  `10.2`

**Qué hay que hacer:** ¿Qué muestra este programa?

**Cómo se pasa:**

- ▫️ 10
- ✅ 25
- ▫️ 35
- Se pasa eligiendo: **25**.

**Pistas del juego:** Una variable guarda UN solo valor a la vez.

<details><summary>Ver el código de la fase</summary>

```python
puntos = 10
puntos = 25
print(puntos)
```
</details>

#### Fase 3 · RESOLVER — «Carga la batería»  `10.3`

**Qué hay que hacer:** La variable bateria vale 20. Cámbiala a 90 y muestra su valor.

**Cómo se pasa:**

- Al terminar, `bateria` debe valer 90.
- El programa debe mostrar «90».

**Pistas del juego:** Escribe bateria = 90 debajo de la primera línea. · Después usa print(bateria).

**Si no pasa, el juego dice:** «bateria debe terminar valiendo 90 y debes mostrarla una sola vez.»

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
bateria = 20
bateria = 90
print(bateria)
```
</details>

### Nivel 3 del Mundo 2 (id 11) — No todo es lo mismo

**Concepto:** entero, decimal, texto  ·  **Historia:** _La información llega en formas distintas: números enteros, decimales y textos. Cada chip lo indica con una etiqueta._

#### Fase 1 · EXPLORAR — «Tres tipos de dato»  `11.1`

**Qué hay que hacer:** Concepto nuevo: los datos tienen tipo. 15 es un ENTERO, 1.75 es un DECIMAL (con punto) y "Ana" es un TEXTO (entre comillas). Mira la etiqueta de cada chip.

**Cómo se pasa:**

- Basta con ejecutar el programa sin errores.

**Pistas del juego:** Compara las etiquetas ENTERO, DECIMAL y TEXTO en la parte baja de los chips.

#### Fase 2 · PREDECIR — «Unir textos»  `11.2`

**Qué hay que hacer:** Concepto nuevo: en CQL, sumar dos textos los une en uno solo (se llama concatenar). Aquí a y b son textos porque están entre comillas. ¿Qué muestra este programa?

**Cómo se pasa:**

- ▫️ 8
- ✅ 53
- ▫️ Un error
- Se pasa eligiendo: **53**.

**Pistas del juego:** Las comillas convierten al 5 y al 3 en textos. · Unir textos no es lo mismo que sumar números.

<details><summary>Ver el código de la fase</summary>

```python
a = "5"
b = "3"
print(a + b)
```
</details>

#### Fase 3 · DEBUG — «El número disfrazado»  `11.3`

**Qué hay que hacer:** Este programa debería mostrar 16, pero da un error: edad está entre comillas, así que es un TEXTO, y no se puede sumar un texto con un número. Corrígelo.

**Cómo se pasa:**

- El programa debe mostrar «16».
- Debe usar el operador `+`.
- Debe crear una variable llamada `edad`.

**Pistas del juego:** ¿Las comillas son necesarias aquí?

**Si no pasa, el juego dice:** «La salida debe ser exactamente 16.»

<details><summary>Ver el código de la fase</summary>

```python
edad = "15"
print(edad + 1)
```
</details>

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
edad = 15
print(edad + 1)
```
</details>

#### Fase 4 · DEBUG — «El decimal con coma»  `11.4`

**Qué hay que hacer:** En CQL los decimales se escriben con punto, no con coma. Corrige el programa para que precio valga 2.5 y se muestre.

**Cómo se pasa:**

- Al terminar, `precio` debe valer 2.5.
- El programa debe mostrar «2.5».

**Pistas del juego:** Cambia la coma por un punto.

<details><summary>Ver el código de la fase</summary>

```python
precio = 2,5
print(precio)
```
</details>

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
precio = 2.5
print(precio)
```
</details>

### Nivel 4 del Mundo 2 (id 12) — Cálculo de energía

**Concepto:** operadores, expresiones  ·  **Historia:** _Los módulos pueden calcular. Los valores viajan por cables luminosos de un chip a otro._

#### Fase 1 · EXPLORAR — «Sumar módulos»  `12.1`

**Qué hay que hacer:** Concepto nuevo: los operadores + y - calculan con variables. Mira cómo los valores de a y b fluyen hacia total.

**Cómo se pasa:**

- Basta con ejecutar el programa sin errores.

**Pistas del juego:** Sigue los cables: salen de a y b y llegan a total.

#### Fase 2 · MODIFICAR — «¿Cuánta queda?»  `12.2`

**Qué hay que hacer:** La reserva es 80 y se usaron 35. Modifica UNA línea para que el programa muestre cuánta energía queda (45).

**Cómo se pasa:**

- El programa debe mostrar exactamente «45».
- Debe usar el operador `-`.

**Pistas del juego:** Lo que queda se calcula restando.

**Si no pasa, el juego dice:** «Debe mostrar 45 usando una resta.»

<details><summary>Ver el código de la fase</summary>

```python
reserva = 80
usada = 35
restante = reserva + usada
print(restante)
```
</details>

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
reserva = 80
usada = 35
restante = reserva - usada
print(restante)
```
</details>

#### Fase 3 · RESOLVER — «Dos módulos, una suma»  `12.3`

**Qué hay que hacer:** Dos módulos tienen 30 y 45 de energía. Guarda cada valor en una variable, suma ambas en total y muestra total (75).

**Cómo se pasa:**

- Debe mostrar «75» y el código tiene que crear la variable `total`.
- Debe usar el operador `+`.

**Pistas del juego:** Primero a = 30 y b = 45. · Luego total = a + b.

**Si no pasa, el juego dice:** «Debes calcular total con + y mostrarlo.»

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
a = 30
b = 45
total = a + b
print(total)
```
</details>

### Nivel 5 del Mundo 2 (id 13) — Calcula el reparto

**Concepto:** multiplicación, división, división entera y residuo  ·  **Historia:** _Repartir recursos exige más que sumar: multiplicar, dividir y averiguar qué sobra._

#### Fase 1 · EXPLORAR — «Cuatro operadores nuevos»  `13.1`

**Qué hay que hacer:** Conceptos nuevos (como en Python): * multiplica; / divide y SIEMPRE da un decimal (17 / 4 es 4.25); // es la división entera: solo la parte entera (17 // 4 es 4); y % da el RESIDUO: lo que sobra al dividir.

**Cómo se pasa:**

- Basta con ejecutar el programa sin errores.

**Pistas del juego:** % no es porcentaje: es el residuo de la división. · Fíjate en la etiqueta DECIMAL del chip cuando usas /.

#### Fase 2 · PREDECIR — «La división siempre da decimal»  `13.2`

**Qué hay que hacer:** En Python, ¿qué muestra este programa?

**Cómo se pasa:**

- ▫️ 5
- ✅ 5.0
- ▫️ 2
- Se pasa eligiendo: **5.0**.

**Pistas del juego:** Si quisieras un entero usarías //.

<details><summary>Ver el código de la fase</summary>

```python
a = 10
b = 2
print(a / b)
```
</details>

#### Fase 3 · PREDECIR — «¿Cuánto sobra?»  `13.3`

**Qué hay que hacer:** ¿Qué muestra este programa?

**Cómo se pasa:**

- ✅ 2
- ▫️ 3
- ▫️ 3.5
- Se pasa eligiendo: **2**.

**Pistas del juego:** 14 = 4 × 3 + ?

<details><summary>Ver el código de la fase</summary>

```python
x = 14
y = x % 4
print(y)
```
</details>

#### Fase 4 · RESOLVER — «Cajas de cinco»  `13.4`

**Qué hay que hacer:** Hay 23 baterías y se guardan en cajas de 5. Muestra primero cuántas cajas se llenan (4, usa la división entera) y luego cuántas baterías sobran (3), en ese orden.

**Cómo se pasa:**

- El programa debe mostrar «4», luego «3».
- Debe usar los operadores `//` y `%`.

**Pistas del juego:** Cajas llenas: baterias // 5. · Sobrante: baterias % 5.

**Si no pasa, el juego dice:** «Debe mostrar 4 y luego 3, usando // y %.»

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
baterias = 23
print(baterias // 5)
print(baterias % 5)
```
</details>

### Nivel 6 del Mundo 2 (id 14) — Información del exterior

**Concepto:** input(), int() y float()  ·  **Historia:** _Hasta ahora todos los datos los escribía el programa. Ahora un sensor externo va a enviar un valor._

#### Fase 1 · EXPLORAR — «El sensor pregunta»  `14.1`

**Qué hay que hacer:** Concepto nuevo: input() pausa el programa y espera un dato de quien juega; se guarda en una variable. OJO, como en Python: input() SIEMPRE lee TEXTO, aunque escribas un número. Cuando la terminal te lo pida, escribe 12 y mira qué muestra valor + valor.

**Cómo se pasa:**

- Basta con ejecutar el programa sin errores.

> ⌨️ Esta fase pide datos con `input()` (siempre llega como texto): cuando la terminal pregunte, escribe **12**.

**Pistas del juego:** Escribe 12 en el campo de la terminal y pulsa Enter. · Compara lo que muestra valor con lo que muestra valor + valor.

#### Fase 2 · PREDECIR — «Convertir con int()»  `14.2`

**Qué hay que hacer:** En Python, si necesitas un número debes convertir el texto: int("12") lo vuelve el número entero 12. ¿Qué muestra este programa?

**Cómo se pasa:**

- ✅ 13
- ▫️ 121
- ▫️ Un error
- Se pasa eligiendo: **13**.

**Pistas del juego:** int() convierte texto en número entero. · float() hace lo mismo pero con decimales.

<details><summary>Ver el código de la fase</summary>

```python
numero = int("12")
print(numero + 1)
```
</details>

#### Fase 3 · ESCRIBIR — «Suma con el sensor»  `14.3`

**Qué hay que hacer:** Pide el valor del sensor (escribe 12), conviértelo con int(input()), guárdalo en una variable, súmale 5 en total y muestra total (17).

**Cómo se pasa:**

- Debe mostrar «17» y el código tiene que crear la variable `total`.
- Tu código debe usar: `int`.

> ⌨️ Esta fase pide datos con `input()` (siempre llega como texto): cuando la terminal pregunte, escribe **12**.

**Pistas del juego:** valor = int(input()) · total = valor + 5

**Si no pasa, el juego dice:** «Con el valor 12, total debe ser 17. Recuerda convertir con int().»

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
valor = int(input())
total = valor + 5
print(total)
```
</details>

#### Fase 4 · RESOLVER — «La mitad del tramo»  `14.4`

**Qué hay que hacer:** Pide el valor del sensor como número decimal con float(input()) (escribe 7) y muestra su mitad (3.5) usando una división.

**Cómo se pasa:**

- El programa debe mostrar exactamente «3.5».
- Tu código debe usar: `float`.
- Debe usar el operador `/`.

> ⌨️ Esta fase pide datos con `input()` (siempre llega como texto): cuando la terminal pregunte, escribe **7**.

**Pistas del juego:** Guarda float(input()) y divide entre 2.

**Si no pasa, el juego dice:** «Con 7, la mitad es 3.5 (usa float y /).»

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
tramo = float(input())
print(tramo / 2)
```
</details>

### Nivel 7 del Mundo 2 (id 15) — El identificador incorrecto

**Concepto:** identificadores  ·  **Historia:** _Un nombre mal escrito deja un módulo huérfano: el programa no sabe encontrarlo._

#### Fase 1 · EXPLORAR — «Nombres válidos»  `15.1`

**Qué hay que hacer:** Concepto nuevo: el nombre de una variable (identificador) puede llevar letras, números y _, pero NO empieza con número. También importa si es mayúscula o minúscula.

**Cómo se pasa:**

- Basta con ejecutar el programa sin errores.

**Pistas del juego:** energia_total usa guion bajo en vez de espacio.

#### Fase 2 · DEBUG — «Empieza con número»  `15.2`

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

#### Fase 3 · PREDECIR — «Mayúsculas importan»  `15.3`

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

#### Fase 4 · DEBUG — «Una letra de más»  `15.4`

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

### Nivel 8 del Mundo 2 (id 16) — Módulos que se combinan

**Concepto:** combinación de variables, tipos y operadores  ·  **Historia:** _Los módulos recuperados ya pueden trabajar juntos: valores de distintos tipos y cálculos que dependen de otros._

#### Fase 1 · EXPLORAR — «Área y etiqueta»  `16.1`

**Qué hay que hacer:** Observa cómo un cálculo usa dos variables y cómo otra variable guarda un texto.

**Cómo se pasa:**

- Basta con ejecutar el programa sin errores.

**Pistas del juego:** Mira los tipos: dos ENTERO y un TEXTO.

#### Fase 2 · ESCRIBIR — «El triángulo»  `16.2`

**Qué hay que hacer:** Guarda 12 en base y 5 en altura. Calcula area = base * altura / 2 y muéstrala (recuerda que / siempre da un decimal: verás 30.0).

**Cómo se pasa:**

- Debe mostrar «30.0» y el código tiene que crear la variable `area`.
- Debe usar los operadores `*` y `/`.

**Pistas del juego:** base * altura primero, luego / 2.

**Si no pasa, el juego dice:** «area debe ser 30.0 y calcularse con * y /.»

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
base = 12
altura = 5
area = base * altura / 2
print(area)
```
</details>

#### Fase 3 · RESOLVER — «Mensaje recuperado»  `16.3`

**Qué hay que hacer:** Guarda en mensaje el texto "Memoria recuperada" y en modulos el resultado de 4 * 3. Muestra primero mensaje y luego modulos.

**Cómo se pasa:**

- El programa debe mostrar «Memoria recuperada», luego «12».
- Al terminar, `mensaje` debe valer "Memoria recuperada" y `modulos` debe valer 12.

**Pistas del juego:** Dos variables y dos print.

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
mensaje = "Memoria recuperada"
modulos = 4 * 3
print(mensaje)
print(modulos)
```
</details>

#### Fase 4 · ESCRIBIR — «Etiqueta con número»  `16.4`

**Qué hay que hacer:** Para unir un texto con un número hay que convertir el número en texto con str(); si no, Python da un error. Guarda 12 en modulos y muestra exactamente: Modulos: 12 (uniendo el texto "Modulos: " con modulos).

**Cómo se pasa:**

- El programa debe mostrar «Modulos: 12».
- Tu código debe usar: `str`.
- Debe crear una variable llamada `modulos`.

**Pistas del juego:** print("Modulos: " + str(modulos))

**Si no pasa, el juego dice:** «Debe mostrar Modulos: 12 usando str().»

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
modulos = 12
print("Modulos: " + str(modulos))
```
</details>

### Nivel 9 del Mundo 2 (id 17) — El sistema de energía

**Concepto:** valores que cambian y valores que no  ·  **Historia:** _Algunos datos no deben cambiar nunca (como la capacidad máxima) y otros cambian todo el tiempo (la carga actual)._

#### Fase 1 · EXPLORAR — «MAXIMO y actual»  `17.1`

**Qué hay que hacer:** Concepto nuevo: por costumbre, los valores que NO deben cambiar se escriben en MAYÚSCULAS (MAXIMO). Los que cambian, en minúsculas. Mira qué chip se reasigna.

**Cómo se pasa:**

- Basta con ejecutar el programa sin errores.

**Pistas del juego:** Solo el chip de actual muestra «antes».

#### Fase 2 · MODIFICAR — «Hasta el tope»  `17.2`

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

#### Fase 3 · RESOLVER — «¿Cuánto falta?»  `17.3`

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

### Nivel 10 del Mundo 2 (id 18) — El puente de datos

**Concepto:** variables, operadores, input y conversiones juntos  ·  **Historia:** _Para cruzar el puente de datos hay que combinar todo lo recuperado hasta ahora._

#### Fase 1 · ESCRIBIR — «Distancia»  `18.1`

**Qué hay que hacer:** Guarda tiempo = 3 y velocidad = 12. Calcula distancia = tiempo * velocidad y muéstrala (36).

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

#### Fase 2 · RESOLVER — «Cruza con el sensor»  `18.2`

**Qué hay que hacer:** Pide un valor al sensor (escribe 10), conviértelo con int(), súmale 15 y muestra el resultado (25) usando una variable llamada resultado.

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

#### Fase 3 · LIBRE — «Laboratorio de memoria»  `18.3`

**Qué hay que hacer:** Experimenta: crea las variables que quieras, cambia sus valores y combínalas. Nada de esto se evalúa.

**Cómo se pasa:**

- No hay objetivo: escribe y ejecuta lo que quieras. La fase se completa al ejecutar.

**Pistas del juego:** Prueba restar, multiplicar y reasignar.

### Nivel 11 del Mundo 2 (id 19) — La puerta del Mundo 3

**Concepto:** integración total del Mundo 2  ·  **Historia:** _La puerta al Mundo 3 pide un código de acceso hecho con todo lo que Robot1 recuperó._

#### Fase 1 · RESOLVER — «El código de acceso»  `19.1`

**Qué hay que hacer:** Guarda a = 7 y b = 3. Muestra, en este orden: a + b, a - b, a * b y a % b.

**Cómo se pasa:**

- El programa debe mostrar «10», luego «4», luego «21», luego «1».
- Debe usar los operadores `+`, `-`, `*` y `%`.

**Pistas del juego:** Cuatro print, uno por cada operación.

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
a = 7
b = 3
print(a + b)
print(a - b)
print(a * b)
print(a % b)
```
</details>

#### Fase 2 · ESCRIBIR — «El triple»  `19.2`

**Qué hay que hacer:** Pide un número al sensor (escribe 9), conviértelo con int() y muestra su triple (27) con una variable llamada triple.

**Cómo se pasa:**

- Debe mostrar «27» y el código tiene que crear la variable `triple`.

> ⌨️ Esta fase pide datos con `input()` (siempre llega como texto): cuando la terminal pregunte, escribe **9**.

**Pistas del juego:** n = int(input()) · triple = n * 3

<details><summary>Ver una solución de ejemplo (spoiler)</summary>

```python
n = int(input())
triple = n * 3
print(triple)
```
</details>

#### Fase 3 · LIBRE — «Tu mejor programa»  `19.3`

**Qué hay que hacer:** Construye el programa que quieras con todo lo aprendido. Nada se evalúa: es tu despedida del Mundo 2.

**Cómo se pasa:**

- No hay objetivo: escribe y ejecuta lo que quieras. La fase se completa al ejecutar.

**Pistas del juego:** Prueba pedir datos con int(input()) y calcular con ellos.

> 🎬 **Al terminar este nivel** aparece la pantalla de transición: _¡Has cruzado el puente! Pero al otro lado te espera un desafío mayor: la puerta al Mundo 3 está bloqueada. Robot1 necesitará aprender a tomar decisiones. (Próximamente en el Avance 3)._

---

## Mundo 3 · Lógica

- **Escenario:** Sala de Estrategia (mesa de cartas).
- **Qué se aprende:** Decisiones con `if`, `elif`, `else`, comparadores y `and` / `or` / `not`. Al ejecutar las cartas se voltean y cada pregunta se juzga con ✓ VERDADERO o ✗ FALSO.
- **Niveles:** 12 · **Estrellas posibles:** 36

### Nivel 1 del Mundo 3 (id 20) — Pasarse de 21

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

### Nivel 2 del Mundo 3 (id 21) — Ganar o perder

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

### Nivel 3 del Mundo 3 (id 22) — Comparar es preguntar

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

### Nivel 4 del Mundo 3 (id 23) — Mayor, menor o igual

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

### Nivel 5 del Mundo 3 (id 24) — Dos condiciones a la vez

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

**Qué hay que hacer:** Este programa da un error porque usa un símbolo de otro lenguaje para decir «y». En CQL se escribe con la palabra and. Corrígelo.

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

### Nivel 6 del Mundo 3 (id 25) — O, y no

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

### Nivel 7 del Mundo 3 (id 26) — Varios caminos

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

### Nivel 8 del Mundo 3 (id 27) — Decisiones dentro de decisiones

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

### Nivel 9 del Mundo 3 (id 28) — El aviso del crupier

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

### Nivel 10 del Mundo 3 (id 29) — Pares

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

### Nivel 11 del Mundo 3 (id 30) — Combinaciones

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

### Nivel 12 del Mundo 3 (id 31) — El crupier final

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

**Qué hay que hacer:** Experimenta con todo lo aprendido. Nada se evalúa: es tu despedida del Mundo 3.

**Cómo se pasa:**

- No hay objetivo: escribe y ejecuta lo que quieras. La fase se completa al ejecutar.

**Pistas del juego:** Prueba cambiar de mesa.

> 🎬 **Al terminar este nivel** aparece la pantalla de transición: _¡La sala de estrategia se abre! Pero al cruzar, Robot1 oye un zumbido: un edificio entero depende de un elevador que no deja de fallar. Entra al Mundo 4: Automatización._

---

## Mundo 4 · Automatización

- **Escenario:** Complejo industrial (edificio de 5 pisos con elevador).
- **Qué se aprende:** Ciclos `while` y `for`, contadores. Un letrero muestra en qué repetición va el ciclo; el piso 1 es la planta baja.
- **Niveles:** 12 · **Estrellas posibles:** 36

### Nivel 1 del Mundo 4 (id 32) — El ascensor automático

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

### Nivel 2 del Mundo 4 (id 33) — Repetir con for

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

### Nivel 3 del Mundo 4 (id 34) — Contar repeticiones

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

### Nivel 4 del Mundo 4 (id 35) — El valor de i

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

### Nivel 5 del Mundo 4 (id 36) — El bucle infinito

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

### Nivel 6 del Mundo 4 (id 37) — Recoger pasajeros

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

### Nivel 7 del Mundo 4 (id 38) — For con decisiones

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

### Nivel 8 del Mundo 4 (id 39) — Cuenta lo que haces

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

### Nivel 9 del Mundo 4 (id 40) — Evacuación completa

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

### Nivel 10 del Mundo 4 (id 41) — La cabina chica

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

### Nivel 11 del Mundo 4 (id 42) — Reportes por piso

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

### Nivel 12 del Mundo 4 (id 43) — El gran operativo

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

**Qué hay que hacer:** Experimenta con todo lo aprendido. Nada se evalúa: es tu despedida del Mundo 4.

**En pantalla:** El elevador empieza en el piso 1; pasajeros en piso 2, piso 3 y piso 5.

**Cómo se pasa:**

- No hay objetivo: escribe y ejecuta lo que quieras. La fase se completa al ejecutar.

**Pistas del juego:** Prueba combinar while, for e if.

> 🎬 **Al terminar este nivel** aparece la pantalla de transición: _¡Evacuación completada! Robot1 descubre una puerta con luces parpadeantes: el sistema de diagnóstico del complejo está lleno de errores. Allí lo espera el Mundo 5: Programador. (Próximamente.)_
