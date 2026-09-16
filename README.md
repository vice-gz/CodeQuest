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
