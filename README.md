# CodeQuest: Aprende Programando — Avance 1 "Conoce a Robot1"

Prototipo funcional del primer módulo de CodeQuest: un juego web educativo
donde el estudiante escribe código en **CQL** (CodeQuest Language, un
subconjunto de Python) y observa cómo Robot1 ejecuta esas instrucciones en
un laboratorio 2D.

## 1. Crear la estructura de carpetas

Ya viene creada en este entregable:

```
codequest/
├── index.html
├── css/styles.css
├── js/
│   ├── main.js
│   ├── interpreter/  (lexer, parser, validator, interpreter, commands, errors)
│   ├── game/          (robot1, world, scene)
│   ├── ui/             (codeEditor, feedback, stars)
│   └── persistence/    (ProgressRepository, LocalStorageProgressRepository)
├── levels/level1.json … level6.json
└── docs/ (referencia a los 3 documentos de especificación)
```

## 2. Ejecutar el proyecto localmente

El proyecto usa módulos ES6 (`import`/`export`), así que el navegador debe
servirlo por **http**, no abrirlo con `file://` (los navegadores bloquean
`fetch()` de los niveles JSON y los módulos por CORS en `file://`).

Cualquiera de estas opciones sirve:

```bash
# Opción 1: servidor embebido de Python
cd codequest
python3 -m http.server 8000
# abre http://localhost:8000

# Opción 2: paquete "serve" de Node
npx serve codequest

# Opción 3: extensión "Live Server" de VS Code
```

## 3. Probar cada nivel

| Nivel | Qué escribir | Qué debe pasar |
|---|---|---|
| 1 | `print("Hola mundo")` | Aparece "Hola mundo" en Retroalimentación y se gana la estrella |
| 2 | `robot1.hablar("Hola")` seguido de `robot1.saludar()` | Robot1 habla y luego saluda, en ese orden |
| 3 | `nombre = "Robot1"` y `print(nombre)` | Se muestra "Robot1" |
| 4 | `pasos = 3` y `robot1.avanzar(pasos)` | Robot1 llega a la casilla objetivo |
| 5 | `pasos = 2 + 3` y `robot1.avanzar(pasos)` | Robot1 avanza 5 casillas |
| 6 | Cualquier combinación que sume 5 pasos | Se acepta cualquier solución válida |

También prueba casos de error para ver la retroalimentación educativa:
`print(pasos)` sin definirla (`SEM_001`), `robot1.volar()` (`SEM_002`),
`print("Hola)` sin cerrar comillas (`LEX_002`), `robot1.girarDerecha()`
en el Nivel 1 (`SEM_007`), etc. — catálogo completo en
`js/interpreter/errors.js`.

## 4. Comprobar que localStorage funciona

1. Completa un nivel y observa que el contador de estrellas del encabezado
   sube y el punto del nivel en la barra superior se marca como completado.
2. Abre las herramientas de desarrollador → Application/Storage →
   Local Storage → busca la clave `codequest:progreso`.
3. Recarga la página: el nivel actual, las estrellas y el último código
   escrito deben conservarse.
4. Para reiniciar todo el progreso, borra esa clave desde el navegador.

## 5. Agregar un nuevo nivel

Crea `levels/level7.json` siguiendo el formato del Documento 3, sección 8
(mismos campos que `level1.json`…`level6.json`: `instruccionesPermitidas`,
`metodosPermitidos`, `escenario`, `validacion`, `pistas`, etc.), agrega el
número 7 al bucle de `TOTAL_NIVELES` en `js/main.js`, y al selector de
niveles. No se requiere tocar el intérprete ni el motor del juego.

## 6. Agregar nuevos comandos en el futuro

Sigue el pipeline (`Lexer → Parser → Validator → Interpreter → Commands →
Robot1/Mundo`, Documento 2, sección 5):

1. Si el comando necesita nueva sintaxis, agrégala en `lexer.js`/`parser.js`.
2. Agrega el nombre del método/función a las listas `METODOS_CONOCIDOS` /
   `FUNCIONES_CONOCIDAS` en `validator.js`.
3. Agrega una fábrica de comando en `commands.js`.
4. Emite el comando desde `interpreter.js`.
5. Anima/renderiza el nuevo comando en `scene.js` (`reproducirComandos`).

## Decisiones técnicas tomadas sin especificación explícita

- **Motor 2D: Canvas 2D puro**, no Phaser 3. Con 6 niveles de movimiento en
  una sola cuadrícula horizontal, Canvas es más ligero y evita una
  dependencia externa grande; queda documentado en `js/game/scene.js` y es
  la alternativa que el Documento 2 (sección 3.1) ya contempla.
- **Editor de código**: `<textarea>` propio con numeración de líneas, sin
  CodeMirror, para no añadir dependencias en el Avance 1.
- **Validación de output**: comparación de string exacta contra
  `valorEsperado`.
- **Manejo de errores**: se detiene en el primer error encontrado y se
  muestra con su código, mensaje educativo y sugerencia.

## Fuera de alcance (según Documento 1, sección 11)

No se implementó: condicionales, ciclos, funciones propias del estudiante,
POO, backend, login, panel de profesores, IA, multiplayer. La arquitectura
(pipeline del intérprete + `ProgressRepository` desacoplado de la UI) queda
preparada para crecer hacia esos avances sin reescribir lo ya construido.

---

# Reconstrucción: Mundos 1 y 2, sistema de fases, 3 paneles en vivo

Esta versión sustituye a la anterior de 6 niveles sueltos.

## Qué cambió

- **19 niveles en 2 mundos**: Mundo 1 "Despertar" (niveles 1-8) y Mundo 2
  "Memoria" (niveles 9-19), en `levels/mundo1/` y `levels/mundo2/`.
- **Sistema de fases**: cada nivel tiene 3 fases. Los 7 tipos
  (EXPLORAR, MODIFICAR, PREDECIR, ESCRIBIR, RESOLVER, DEBUG, LIBRE) están
  en uso. La barra de fases (● activa · ✓ completada · ○ pendiente) va
  arriba del área "Aprende".
- **3 paneles en vivo** a la derecha: **Salida** (print/entrada/hablar),
  **Memoria** (variables actuales) y **Estado de Robot1** (posición,
  dirección, energía). Se actualizan durante la ejecución, no al final.
- **Sin modales**: al completar una fase o un nivel, los botones aparecen
  inline en el panel de Retroalimentación. El escenario nunca se tapa.
  Botones: `Siguiente fase`, `Seguir jugando`, `Siguiente nivel`,
  `Repetir nivel`.
- **Robot rediseñado**: `saludar()` eliminado; `girarDerecha()`/
  `girarIzquierda()` sustituidos por `girar("norte"|"sur"|"este"|"oeste")`
  (acepta también arriba/abajo/izquierda/derecha). Nuevos:
  `entrada()`, `retroceder(n)`, `mirar()`, `posicion()`, `energia()`,
  `recoger()`, `soltar()`.
- **print vs hablar**: `print()` solo va al panel de Salida;
  `robot1.hablar()` produce burbuja en el mundo 2D **y** línea en Salida.
- **Estrellas por nivel completo**: 1 = todas las fases; 2 = sin pistas;
  3 = sin pistas y primer intento en cada fase.
- **Persistencia por fases**: `codequest:progreso:v2` guarda
  mundos → niveles → fases (`completada`, `intentos`, `pistas`).

## Archivos

**Nuevos:** `css/panels.css`, `js/ui/outputPanel.js`, `js/ui/memoryPanel.js`,
`js/ui/statePanel.js`, `js/ui/phases.js`, `js/game/movimiento.js`,
`js/game/ejecutor.js`, `test_niveles.mjs`, `levels/mundo1/level1-8.json`,
`levels/mundo2/level9-19.json`.

**Modificados:** `index.html`, `css/styles.css`, `js/main.js`,
`js/interpreter/{lexer,parser,validator,interpreter,commands,errors}.js`,
`js/game/{robot1,world,scene}.js`, `js/ui/{feedback,stars}.js`,
`js/persistence/LocalStorageProgressRepository.js`.

**Eliminados:** `levels/level1.json` … `levels/level6.json` (reemplazados
por las carpetas por mundo).

## Decisiones no especificadas en los documentos

- **`js/game/ejecutor.js` (motor)**: el intérprete pasó a ser asíncrono y
  ejecuta cada acción contra el robot real, esperando su animación. Así
  `robot1.posicion()`, `mirar()` y `energia()` leen siempre el estado
  verdadero en el momento en que se evalúan, sin mantener un robot
  "simulado" en paralelo. Es también el punto único donde se notifica a
  los tres paneles (patrón de callbacks del documento de cambios, §8).
- **Operador `%` y literales decimales**: el Documento 3 los excluía del
  Avance 1, pero el prompt de cambios los pide explícitamente para los
  niveles 11 y 13. Se añadieron al lexer, parser e intérprete.
- **Booleanos**: el nivel 11 se enseña con entero, decimal y texto. Los
  booleanos requieren comparadores, que pertenecen al Mundo 3.
- **Chequeo numérico en tiempo de ejecución**: el validador detecta
  `avanzar("tres")`, pero no `pasos = "3"` seguido de `avanzar(pasos)`.
  Ese caso se verifica al ejecutar (lo necesita el nivel 11.3).

## Cómo probar los cambios

```bash
cd codequest
python3 -m http.server 8000     # http://localhost:8000
```

Prueba automática de los 19 niveles (requiere Node 18+):

```bash
cd codequest
echo '{"type":"module"}' > package.json
node test_niveles.mjs
rm package.json
```

Corre la solución de referencia de **cada fase** por el motor real
(Lexer → Parser → Validator → Interpreter → Robot1/Mundo) y comprueba que
pasa su propia validación. Salida esperada: `57 fases probadas … ✓ TODO OK`.

**A mano, lo más importante:**

1. Nivel 1 → las 3 fases encadenan y aparece `Siguiente fase` inline.
2. Nivel 7 fase 2 → `robot1.girar("sur")` cambia la dirección en el panel
   de Estado y `avanzar()` se mueve hacia abajo.
3. Nivel 9 → el panel de Memoria muestra `nombre = "Robot1"` al ejecutar.
4. Nivel 12 → la energía baja en el panel de Estado con cada avance.
5. Nivel 5 y 15 → fases DEBUG: el código inicial falla a propósito y el
   error trae código, mensaje educativo y sugerencia.
6. DevTools → Application → Local Storage → `codequest:progreso:v2` guarda
   las fases; recarga y el progreso sigue ahí.
7. Estrecha la ventana a menos de 900 px: las dos columnas se apilan.

---

# Correcciones, entrada interactiva y rediseño de niveles

## 1. Bugs corregidos (los 9)

| # | Archivo | Qué pasaba |
|---|---|---|
| 1.1 | `ejecutor.js` | El movimiento tenía dos fuentes de verdad (escena + `robot1.avanzar()`). Ahora el motor escribe `robot1.x/y` él mismo tras la animación. |
| 1.2 | `stars.js` | Daba estrellas sin exigir todas las fases completadas, usaba `<= 1` y devolvía 1 como fallback. Ahora exige `completada === true`, `intentos === 1` y devuelve 0 si falta algo. |
| 1.3 | `main.js` | El intento se registraba al inicio de `ejecutarCodigo()`. Ahora se registra donde ya se conoce el resultado. |
| 1.4 | `main.js` | Faltaban tipos de validación. Ahora hay 13, incluidos `output_contiene`, `estado_variable` y `codigo_sin_error`. |
| 1.5 | `main.js` | Repetir una fase ya superada volvía a contarla. Ahora se comprueba antes. |
| 1.6 | `LocalStorage…` | El merge era superficial y dejaba huecos. Ahora `mergeProfundo()` rellena recursivamente. |
| 1.7 | `LocalStorage…` | No marcaba el mundo completo. Ahora `completarNivel()` recibe `totalNivelesMundo` y lo marca. |
| 1.8 | `LocalStorage…` | Cada clic en Ejecutar gastaba un intento. Ahora solo cuenta si el código cambió. |
| 1.9 | `feedback.js` | Texto de niveles insertado como HTML sin escapar, y botones sin protección de doble clic. Corregidos ambos. |

## 2. `entrada()` interactiva

Cuando una fase no define `entradasSimuladas`, la ejecución se **pausa** y
aparece un campo en el panel de Salida. El estudiante escribe, pulsa Enter,
y el programa continúa. El valor se convierte a número si es numérico y se
conserva como texto si no.

Las fases con `entradasSimuladas` siguen funcionando igual (Mundo 1,
nivel 6.1). Los niveles 6.2, 6.3, 14.2, 14.3 y las tres fases del 18 usan
entrada real del estudiante.

## 3. Rediseño de niveles

- **7 niveles con obstáculos**: 2, 7, 8, 13, 17, 18, 19.
- **2 niveles con varios objetivos**: 7 (batería + puerta) y 16 (dos terminales).
- **2 niveles con recargas de energía**: 12 y 17, donde la batería *no*
  alcanza sin pasar por el ⚡.
- **Nivel 8** es un laberinto con muros repartidos; **nivel 13** ofrece dos
  rutas de distinta longitud.
- **Niveles 5, 11 y 15** pasaron de 3 a 4 fases mezclando EXPLORAR, PREDECIR
  y DEBUG en vez de tres DEBUG seguidos.
- **60 fases** en total. Reparto: EXPLORAR 16, RESOLVER 14, PREDECIR 10,
  ESCRIBIR 7, DEBUG 6, LIBRE 4, MODIFICAR 3.

Movimiento casilla por casilla: `avanzar(6)` ya no salta de (0,0) a (6,0).
Recorre cada casilla, de modo que un obstáculo intermedio detiene a Robot1 y
una recarga intermedia se activa al pisarla.

## 4. Validaciones que verifican el proceso

Nueve niveles usan validaciones que miran el código fuente, no solo el
resultado: `posicion_con_operacion`, `posicion_con_variable`,
`posicion_sin_numero_literal` y `output_con_variable`. Antes de inspeccionar,
se quitan comentarios y textos entre comillas, para que un número dentro de
un string no cuente como literal.

Ejemplos: el 13.3 exige usar `*` y no aceptar el número calculado a mano; el
18.2 rechaza que aparezca el literal `5` en el código.

Se añadió además `error_esperado`: fases EXPLORAR cuyo objetivo es
*provocar y leer* un error (5.1 y 15.1). Ahí el error **es** el éxito.

## 5. Mejoras visuales

Obstáculos como bloques grises, recargas como rayos verdes, y objetivos que
se atenúan al ser alcanzados (útil con varios objetivos). El escenario
soporta `objetivosPosicion` (lista), `recargas`, `energiaMaxima`,
`mostrarRobot` y `mostrarEnergia`.

## 6. Cómo probar

```bash
cd codequest
echo '{"type":"module"}' > package.json
node test_niveles.mjs      # → 60 fases probadas … ✓ TODO OK
rm package.json
```

El arnés corre la solución de referencia de cada fase por el motor real y
comprueba que pasa su propia validación, incluidas las fases con entrada
interactiva (mediante `entradasEstudiante` en el JSON, que solo usa la prueba).

A mano, lo que más conviene mirar:

1. **Nivel 2 fase 3** — la pared obliga a rodear; `avanzar(5)` choca.
2. **Nivel 6 fase 2** — aparece el campo de entrada y la ejecución se pausa.
3. **Nivel 12 fase 3** — sin pisar el ⚡ la energía llega a 0 y no se completa.
4. **Nivel 7 fase 3** — dos estrellas; cada una se atenúa al pisarla.
5. **Nivel 13 fase 3** — escribe `robot1.avanzar(4)` sin usar `*`: llega a la
   meta pero **no** se da por superada.
6. **Nivel 18 fase 2** — escribe `robot1.avanzar(5)`: rechazado por literal.
7. Pulsa Ejecutar dos veces con el mismo código: el contador de intentos no
   sube y las 3 estrellas se conservan.

## Decisiones no especificadas

- **`error_esperado`**: el prompt pedía una fase EXPLORAR que ejecuta código
  con error (5.1), pero ningún tipo de validación existente la daba por
  superada. Es el caso mínimo que lo resuelve sin tocar el pipeline.
- **`energiaMaxima`**: sin un tope configurable, una recarga no podía subir
  la energía por encima del valor inicial, que es justo lo que el nivel 12
  necesita.
- **Niveles 1 y 9 siguen siendo de una fila.** El 1 es la introducción y
  Robot1 no se mueve; el 9 ocurre "dentro de su memoria" y el robot está
  oculto (`mostrarRobot: false`). Convertirlos a 2D sería decorativo y
  sugeriría un movimiento que el nivel no pide.

---

# Continuidad pedagógica, entrada real, diccionario, tour y modo demo

## 1. Continuidad: nada se usa antes de enseñarse

Tenías razón: el nivel 2 pedía rodear un obstáculo con `girar()`, que no se
enseñaba hasta después. Reordené qué introduce cada nivel:

| Nivel | Instrucción nueva | Fase |
|---|---|---|
| 1 | `print(valor)` | 1.1 |
| 2 | `robot1.avanzar(n)` | 2.1 |
| 3 | `robot1.hablar("texto")` y `robot1.girar(direccion)` | 3.1 y 3.3 |
| 4 | `robot1.retroceder(n)` | 4.1 |
| 6 | `entrada()` | 6.1 |
| 8 | `robot1.recoger()` | 8.1 |
| 9 | variables (`nombre = valor`) | 9.1 |
| 12 | operadores `+ - * /` | 12.2 |
| 13 | operador `%` | 13.1 |
| 16 | `robot1.posicion()` y `robot1.mirar()` | 16.1 |

Consecuencias concretas:

- **Niveles 1 a 5 vuelven a ser simples.** Sin obstáculos. El nivel 2 es un
  pasillo recto con `avanzar()` y nada más.
- **`girar()` se enseña en el 3**, con una fase EXPLORAR dedicada a verlo
  antes de tener que usarlo.
- **Los obstáculos aparecen en el nivel 7**, cuando `girar()` lleva cuatro
  niveles disponible. El 7.1 es una fase PREDECIR que presenta los muros
  antes de exigir rodearlos.
- **El nivel 6 ya no usa variables.** Usa `entrada()` como valor directo
  (`print(entrada())`, `robot1.avanzar(entrada())`). Así el nivel 9 tiene un
  motivo real de existir: el valor se usaba y se perdía, ahora se guarda.

Hay una prueba automática para esto: recorre las 61 fases en orden y falla si
alguna permite o usa algo que se enseña más tarde.

## 2. `entrada()` ahora sí es interactiva

Ya no hay valores automáticos: **eliminé `entradasSimuladas` de todos los
niveles**. Cuando el programa llega a `entrada()`:

1. La ejecución se **pausa**.
2. Aparece un campo en el panel de Salida.
3. Escribes y pulsas Enter.
4. El programa continúa con **tu** valor.

Sobre los tipos, una fase puede declarar `entradaTipo`:

- `"numero"` — solo acepta números. Si escribes texto, el campo te dice
  *"perro no es un número. Robot1 no puede contar casillas con un texto"* y
  te deja corregir. Así está el 6.3.
- `"libre"` (por defecto) — acepta lo que sea. Si luego usas ese texto en
  `avanzar()`, salta el error educativo SEM_004. Esto es a propósito: en el
  6.1 puedes escribir una palabra y ver qué pasa.

## 3. Diccionario de instrucciones

Botón nuevo en la barra superior, con contador `n/12`.

Se desbloquea **por fase**, no por mundo: en cuanto completas la fase donde
se enseña algo, esa entrada aparece. Muestra la forma general y qué hace:

> `robot1.girar(direccion)`
> Cambia hacia dónde mira Robot1. Direcciones válidas: "norte", "sur", "este", "oeste".

**No da soluciones.** Sobre `print` dice que muestra un valor y que el texto
va entre comillas, pero nunca enseña la línea corregida de una fase DEBUG.
Hay una prueba que comprueba que ninguna descripción del diccionario contiene
la solución de una fase DEBUG ni código listo para pegar.

Descarté tu alternativa de desbloquearlo por mundo: con 8 niveles por mundo,
un estudiante que olvida `girar()` en el nivel 4 tendría que esperar hasta el
9 para consultarlo.

## 4. Tour de bienvenida

Se lanza solo la primera vez. Ocho pasos que señalan Robot1, el área Aprende,
el editor, los tres paneles, la retroalimentación y el diccionario. Se puede
saltar con el botón o con Escape, se navega con las flechas, y queda el botón
"Tour" en la barra para repetirlo.

## 5. Modo demo

Botón "Demo" → usuario `admin`, contraseña `123`. Desbloquea los 19 niveles y
todo el diccionario para revisarlos sin jugarlos en orden. El botón cambia a
"Salir de demo" y aparece una insignia DEMO mientras está activo. Vive en
`sessionStorage`, así que **no toca tu progreso real** y se cierra al cerrar
la pestaña.

**No es autenticación.** Las credenciales están en el JavaScript del
navegador y cualquiera puede leerlas; solo sirve para revisar el juego. El
login real vivirá en el backend cuando exista.

## 6. Archivos

**Nuevos:** `js/ui/dictionary.js`, `js/ui/tour.js`, `js/ui/demoMode.js`.

**Modificados:** `index.html`, `css/panels.css`, `css/styles.css`,
`js/main.js`, `js/ui/outputPanel.js`, `js/game/ejecutor.js`,
`test_niveles.mjs`, y los JSON de los niveles 2, 3, 4, 5, 6, 7, 8, 9 y 14.

## 7. Cómo probarlo

```bash
cd codequest
echo '{"type":"module"}' > package.json
node test_niveles.mjs     # 61 fases → ✓ TODO OK
rm package.json
```

A mano:

1. Borra `localStorage` y recarga: sale el tour. Sáltalo y vuelve a lanzarlo
   con el botón "Tour".
2. Nivel 6.1 — ejecuta y escribe **una palabra**: se acepta y aparece en
   Salida.
3. Nivel 6.3 — escribe **una palabra**: el campo la rechaza explicando por
   qué, y te deja corregir.
4. Abre el Diccionario en el nivel 1: casi vacío. Vuelve a abrirlo en el 4:
   ya están print, avanzar, hablar, girar y retroceder.
5. Botón Demo → `admin` / `123`: se desbloquean los 19 niveles y el
   diccionario completo. Sal del modo demo y tu progreso sigue intacto.
