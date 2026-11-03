# CodeQuest: Aprende Programando — Avance 3 (entrega final)

Avance 1 (juego, intérprete CQL, Mundos 1-2) + **landing, autenticación, persistencia en Supabase, perfil y panel de administrador**. No se implementan los Mundos 3-6. La documentación del Avance 1 está en `docs/README_avance1.md`.

## Mundo 5, Niveles Jefe, Nivel 0 y tours (Avance 3.8)

- **Funciones en el lenguaje (Unidad 5, Modularidad).** CQL acepta `def`, parámetros, `return`, `None`, variables **locales** y recursión (límite de 100 llamadas anidadas), con errores educativos (`SYN_015`-`SYN_018`, `SEM_014`-`SEM_017`, `RUN_020`-`RUN_023`). Se comparó con el Python 3 real (`test_python_compat.mjs`: 155 programas, 39 con funciones). Diferencias deliberadas: `def` solo va al margen izquierdo (no dentro de un `if`/ciclo/otro `def`) y no existen valores por omisión, `*args`, `lambda`, `global` ni `nonlocal`.
- **Mundo 5 · Modularidad (8 niveles, ids 48-55) con Visualizador de Flujo.** Escenario `fabrica` (`js/game/escenarios/fabrica.js`): una **línea de ensamble** que reacciona a lo que hace el intérprete (ganchos `funcionDefinida`, `llamadaIniciada`, `asignacionLocal`, `print`, `llamadaTerminada`): cada `def` construye una **máquina**; cada llamada manda una **caja de materiales** con los argumentos (`[5, 3]`); la máquina se ilumina y aparecen **chips con las variables locales** (`a = 5`, `resultado = 8`); un `print` sale como **burbuja**; el `return` sale como **caja de producto terminado** (verde) o una **caja gris con `None`**. Todo se anota en `escenario.registro` (se prueba sin dibujar). Progresión: 1 *Construyendo máquinas* (definir) · 2 *Activando la producción* (llamar, RESOLVER) · 3 *Personalizando productos* (parámetros, ESCRIBIR) · 4 *El producto terminado* (`return`, DEBUG de `print` por `return`) · 5 *Información confidencial* (ámbito local, PREDECIR) · 6 *Producción en cadena* (encadenar, RESOLVER) · 7 *Reparando la fábrica* (DEBUG: falta de `return`, mal parámetro, función sin llamar) · 8 👑 *El Gran Ensamblaje* (Jefe).
- **Nivel 8 · El Gran Ensamblaje (id 55, Jefe).** Sin pistas y con el editor en blanco: hay que definir **exactamente** `cabeza()`, `brazos()` y `piernas()` y llamarlas, cada una al menos una vez, en ese orden (la validación `ensamble` mira la primera llamada de cada una). Un **Robot1 gigante** se arma en pantalla conforme corre el código. Si falla: «El robot está incompleto. Asegúrate de definir las 3 funciones y llamarlas en el orden correcto (cabeza, brazos, piernas).»
- **Niveles Jefe (ids 44-47).** Uno al final de cada mundo del 1 al 4, **sin botón de pistas**, editor en blanco y un solo enunciado: Mundo 1 *Laberinto ciego* (Nivel 9), Mundo 2 *La caja fuerte* (Nivel 12; 4 casos, 4 operaciones y conversiones), Mundo 3 *Torneo de cartas* (Nivel 13; blackjack con `if`/`elif`/`and`, 10 manos) y Mundo 4 *Evacuación crítica* (Nivel 13; energía limitada de 10 pisos, 5 edificios). **Un mundo se abre al completar todos sus niveles, incluido el jefe.** La pantalla de transición narrativa ahora sale al terminar el jefe.
- **Nivel 0 · Diagramas de flujo (id 0).** Primer nivel del Mundo 1, sin editor: se hace clic en las tarjetas (`Inicio`, `Caminar 3 pasos`, `Abrir la puerta`, `Fin`…) en el orden correcto; cada tarjeta correcta se ejecuta en el pasillo y, si se equivoca, Robot1 choca y se empieza de nuevo (el intento cuenta). 3 fases de dificultad creciente. Es **tutorial**: quien ya tenía progreso no queda bloqueado y no cuenta para completar el Mundo 1.
- **Tours de inmersión.** La primera vez que se entra a los Mundos 2, 3, 4 y 5 sale un tour que presenta el escenario (usa la misma clase `Tour`; una vez por persona y mundo).
- **Cambios de catálogo.** Ya hay **56 niveles** (máximo 168 estrellas). Los ids **no son consecutivos** (0, 1-43, 44-47 jefes, 48-55 Mundo 5): el número que ve el estudiante dentro de su mundo es el *ordinal* (el Nivel 0 es 0), y el siguiente nivel se pregunta al catálogo en vez de sumar 1. En el panel de profesor y en el CSV los niveles se siguen identificando con el id interno; la equivalencia está en `MEJORAS_Y_GUIA_PROFESOR.md`.
- **Pruebas nuevas/ajustadas:** `test_niveles.mjs` (56 niveles, 176 fases, jefes y Nivel 0), `test_juego_dom.mjs` (26: Nivel 0, jefe, fábrica y tours), `test_navegacion.mjs` (ordinales y siguiente nivel).
- **Docs regeneradas:** `docs/GUIA_NIVELES_MUNDOS_1_A_5.md` (los 56 niveles; reemplaza a `..._2_A_4`) y `docs/REFERENCIA_LENGUAJE_CQL.md` (sección 6.6 Funciones).

## Ajustes pedagógicos finales (Avance 3.9)

- **Terminología:** el estudiante ve «Python», no «CQL» (niveles, mensajes de error, etiqueta del editor y página de inicio). `test_niveles.mjs` falla si reaparece «CQL» en un nivel.
- **Decimal con coma (Nivel 11, fase 11.4):** el error sigue siendo el punto de partida de la depuración; ahora lo explica un error propio, `SYN_019` («En Python los decimales se escriben con punto, no con coma»).
- **Fases LIBRE reales:** solo validan «ejecutado» y no exigen objetivos; 7.3 y 8.3 pasaron a RESOLVER.
- **Comprobación tras EXPLORAR:** en los Mundos 1 y 2, un EXPLORAR de «solo ejecutar» va seguido de PREDECIR, MODIFICAR o DEBUG (nuevas fases 1.4, 3.5, 6.4 y 16.5, colocadas tras su EXPLORAR sin renumerar las demás para no romper el progreso guardado). Los niveles pueden tener de 3 a 5 fases.
- **Reto de eficiencia (Niveles Jefe 1 a 4):** la propiedad `max_lineas_recomendadas` del nivel (el largo de su solución de referencia) activa un mensaje motivacional si el código que pasó es más largo (`js/game/eficiencia.js`, mostrado en el panel y en la pantalla de transición). No quita estrellas ni bloquea el avance; las líneas de comentario cuentan.

## Dashboard de la tesis: gráficas y filtro por grupo (Avance 3.7)

La pestaña **Resumen** del panel de administración ahora es un dashboard, y un **filtro global por grupo** arriba de todo controla qué datos se ven.

- **Filtro «Ver datos de»:** *Todos los usuarios*, *Sin grupo asignado* (alumnos que no están en ninguna clase) y cada **clase** existente (con su número de alumnos). Al cambiarlo se actualizan **al instante** los KPIs, las 3 gráficas, la tabla de **Usuarios**, el selector y la tabla de **Ejecuciones** y la **exportación a CSV**. (No aplica a Auditoría ni Configuración.)
- **4 KPIs:** Total de alumnos · Estrellas promedio · Ejecuciones totales · Tasa de éxito (ejecuciones que lograron el objetivo ÷ ejecuciones totales; «—» si todavía no hay ejecuciones). **Solo cuentan alumnos**: un profesor o administrador que juegue con su cuenta no ensucia los datos de la muestra.
- **3 gráficas con Chart.js:** *Errores más frecuentes* (barras, top 5 de códigos como `SEM_001`; al pasar el cursor sale el nombre del error), *Alumnos por mundo* (dona) y *Ejecuciones por día, últimos 7 días* (líneas, con 0 en los días sin actividad y en la zona horaria de quien mira el panel).
- **Exportar a CSV:** el botón se movió al dashboard y exporta **solo a los usuarios del filtro** (el archivo se llama, p. ej., `codequest-isc-1a-2026-11-02.csv`). Con «Todos» exporta todas las cuentas, como antes.
- **Chart.js llega por CDN** (versión fija 4.4.1, en `admin.html`). Si no hay internet, los KPIs y las tablas funcionan y se explica que faltan las gráficas. Para presentar sin internet, abre el panel antes (con conexión) o descarga `chart.umd.js` y cambia la ruta del `<script>`.
- **SQL nuevo: `supabase/avance3_3.sql`** (ejecutar en el SQL Editor, es idempotente). El administrador no puede leer `clases` ni `inscripciones` directamente (RLS), así que el filtro por grupo necesita `admin_grupos()`, `admin_inscripciones()` y `admin_dashboard_datos()` (resumen compacto de las ejecuciones, calculado en la base de datos). Sin ese SQL el panel sigue funcionando (calcula el resumen en el navegador) pero sin filtro por grupo, y avisa cómo instalarlo.
- **Pruebas:** `test_dashboard_admin.mjs` (16, con resultados calculados a mano por grupo) y `test_dashboard_sql.mjs` (corre las funciones SQL en un PostgreSQL real temporal y las compara con el cálculo en JavaScript en tres zonas horarias; se omite si no hay PostgreSQL).
- **Cambio:** las tarjetas antiguas «Nivel más completado / Nivel con más errores / Concepto con más errores» de la pestaña Resumen se reemplazaron por este dashboard.

## Login con Google y GitHub (Avance 3.5)

`auth.html` ahora permite **registrarse e iniciar sesión con Google o GitHub** (OAuth 2.0 con Supabase Auth), además del correo y la contraseña. Los botones están en las pestañas «Iniciar sesión» y «Crear cuenta», bajo el separador «O continúa con:».

- **Hay que configurarlo fuera del código** (Supabase, Google Cloud y GitHub): la guía paso a paso, la lista de pruebas y la tabla de problemas están en **`docs/LOGIN_SOCIAL.md`**. Lo mínimo: activar los proveedores en *Supabase → Authentication → Providers* y agregar `…/auth.html` en *URL Configuration → Redirect URLs*.
- **Perfil y progreso:** tu proyecto ya tiene el disparador `trigger_nuevo_usuario`, que se ejecuta también con las altas de OAuth, así que el perfil normalmente ya existe al volver. El navegador solo lo crea (como `estudiante`) si faltara, sin duplicar nada si ya existe.
- **Pantalla de acceso:** los botones de Google y GitHub van **arriba y grandes** («Entra a CodeQuest»), con el formulario de correo debajo (pestañas «Ya tengo cuenta» / «Soy nuevo»). Los mismos botones sirven para entrar y para crear cuenta.
- **«Un último paso»:** si es la primera vez que la persona entra con Google/GitHub, al volver ve «¡Hola, Ana! Un último paso: cuéntanos cómo vas a usar CodeQuest» con dos tarjetas (**Soy alumno**, ya marcada, y **Soy profesor**) y, para alumnos, un código de clase opcional. Un alumno llega a `mundos.html`; un profesor, a **`profesor.html`** con el saludo «¡Hola Profe! Configura tu primera clase en el panel». Si cierra la pestaña sin contestar, se le vuelve a preguntar. Quien ya tenía cuenta entra directo, sin esta pantalla.
- **Rol:** lo **concede el servidor** (`aplicar_registro`, una sola vez, igual que en el registro con correo): el navegador no puede escribirlo directo en `perfiles`. Si pidió ser profesor y no se concede, la página lo dice y la cuenta queda como alumno.
- **Cambio de ruta:** los profesores ahora aterrizan en `profesor.html` («Mis clases») al iniciar sesión, no en `perfil.html`. Para volver a lo anterior, cambia `profesor: "profesor.html"` en `RUTA_POR_ROL` (`js/auth.js`).
- **Correo institucional:** si `VITE_DOMINIO_INSTITUCIONAL` está definido, quien entre con otro dominio se rechaza y se cierra su sesión (excepto administradores).
- **Cuentas con el mismo correo:** Supabase las vincula solo cuando el proveedor confirma el correo; si no puede, la página lo explica.
- **Pruebas:** `test_auth_oauth.mjs` (21) abre la página real con un Supabase simulado: cuenta nueva con y sin disparador, cuenta existente por rol, profesor, dominio, errores del proveedor.


## Migración a Python 3 (Avance 3.4)

CQL ahora es un **subconjunto de Python 3**: el código que escriben los alumnos funciona igual en Python real. Se comprueba comparando la salida con la del `python3` del sistema (`test_python_compat.mjs`: 116 programas, entre ellos los errores `ZeroDivisionError`, `TypeError`, `ValueError` y `NameError`).

| Antes | Ahora (como en Python) |
|---|---|
| `entrada()` | **`input()`** (con mensaje opcional: `input("¿Cuántos pisos?")`). `entrada()` ya no existe: da un error que dice «se llama input()» |
| `entrada()` devolvía número si se escribía un número | **`input()` siempre devuelve texto**. Para calcular: `int(input())` o `float(input())` |
| `17 / 4` daba `4` | **`17 / 4` da `4.25`**; `10 / 2` da `5.0` (la `/` siempre da decimal) |
| *(no existía)* | **`//`** (división entera hacia abajo: `-7 // 2` es `-4`) y **`**`** (potencia) |
| *(no existía)* | **`int()`, `float()`, `str()`**; `int("hola")` da un `ValueError` (`RUN_017`) |
| `-5 % 3` daba `-2` | `-5 % 3` da `1` (el residuo toma el signo del divisor, como Python) |
| `5` y `5.0` eran el mismo valor | Son distintos: `5.0` es decimal y se muestra `5.0` (en Memoria, etiqueta `DECIMAL`) |
| `"5" + 3` daba `RUN_015` al ejecutar | Lo detecta el **validador antes de ejecutar**: «TypeError: No puedes sumar un texto ("5") con un número (3) directamente. Usa int("5") o str(3)» |
| *(no existía)* | `input() + 5` se rechaza con `SEM_011` y la solución `int(input()) + 5`; los nombres `print`, `input`, `int`, `float`, `str` y `range` no se pueden usar como variables (`SEM_012`) |

**Niveles ajustados:** Mundo 1 nivel 6 (ahora `int(input())`), Mundo 2 nivel 5 (`/`, `//`, `%`; 4 fases), nivel 6 «Información del exterior» (4 fases: input es texto, `int()`, suma con el sensor, `float()`), nivel 8 (el área da `30.0`; nueva fase con `str()`) y niveles 10 y 11 (`int(input())`). Diccionario, glosario, mensajes de error y las dos guías se actualizaron. El Laboratorio Libre ahora tiene **todo CQL abierto** (también `if`, `while` y `for`).

**Diferencias deliberadas** (CQL es *más estricto* que Python, nunca más permisivo): `True + 1` y `"ab" * 3` son errores de tipos; las condiciones deben ser `True`/`False` (no vale `if 5:`); `(-8) ** 0.5` es un error (sin complejos); enteros de hasta 2⁵³; `print(a, b)` solo muestra el primero. Están listadas en la sección 13 de `docs/REFERENCIA_LENGUAJE_CQL.md`.

**Decisión que tomé:** `print` e `input` siguen siendo identificadores especiales y no tokens de palabra clave (como en Python, donde son funciones, no palabras reservadas). Quedan **reservados**: no se pueden usar como nombre de variable (`SEM_012`).

**Si ya tenías alumnos:** el Mundo 2 (niveles 13, 14, 16, 18 y 19) y el nivel 6 cambiaron de fases; ejecuta el SQL de reinicio de progreso del Avance 3 (`delete from public.progreso_fases where nivel_id >= 9; …`) o, si solo quieres cubrir lo nuevo, `delete from public.progreso_fases where nivel_id in (6, 13, 14, 16, 18, 19);`.


## Versión para tablet y celular (Avance 3.2 y 3.3)

La interfaz es responsiva: se ve bien en monitor (1920×1080), tablet (iPad / Android de 10") y celular (6"), sin scroll horizontal. Punto de quiebre principal: **992 px**. En PC no cambia nada (dos columnas).

**En pantallas de 992 px o menos el juego se reparte en 3 pestañas** (en vez de apilar todo y obligar a hacer scroll):
- **🎮 Jugar:** escenario (al 100% del ancho, sin deformarse) + editor + retroalimentación. Es la pestaña inicial de cada nivel.
- **📖 Aprende:** concepto del nivel, fases e instrucciones disponibles.
- **🖥️ Consola:** Salida, Memoria y Estado. Si ejecutas desde Jugar, un punto ámbar avisa que hay contenido nuevo en Consola.
Las pestañas se manejan con el dedo, con ← → / Inicio / Fin y se anuncian como `tablist` a los lectores de pantalla.

- **▶ Ejecutar flotante:** fijo al pie de la pantalla (solo en «Jugar»), verde y grande. Sube junto con el teclado virtual (se mide con `visualViewport`, que iOS necesita; además la página declara `interactive-widget=resizes-content` para Android). Mientras escribes aparece sobre el teclado una **barra de símbolos** (`⇥ ⇤ : ( ) " " = == < > .`), porque en un teclado táctil cuesta escribirlos.
- **Al ejecutar en pantalla táctil** el editor suelta el foco (el teclado se oculta), la vista sube al escenario y, al terminar, baja al resultado.
- **Cabecera móvil:** la barra de niveles es compacta (botones de 32 px) y deslizable con el dedo; Tour, Mapa y Conceptos salen de la barra y quedan **solo en el menú hamburguesa**. El menú tiene filas de 48 px, el nombre y el rol arriba de «Cerrar sesión» (a todo el ancho), fondo oscuro detrás y se cierra con Escape, tocando fuera o eligiendo un enlace.
- **Aviso «Gira tu teléfono para una mejor experiencia»:** una franja delgada justo bajo la navegación, solo en celular vertical, con ✕ (no vuelve a salir en esa sesión).
- **Tour interactivo (todas las pantallas):** cada paso hace scroll suave hasta dejar el elemento al centro; si el elemento vive en otra pestaña, cambia de pestaña solo; **Atrás / Siguiente / Saltar** están en una barra fija al pie (fuera del globo) y hay una **✕** fija arriba a la derecha durante todo el recorrido. El globo nunca queda tapado por los controles.
- Con poca altura (celular horizontal) el escenario se limita al 80% de la pantalla y el editor se compacta.

Archivos: `css/responsive.css` (se carga al final en todas las páginas), `js/ui/movil.js` (pestañas, teclado, símbolos) y `js/ui/tour.js`.

### Cómo se probó
- `npm test` incluye pruebas con jsdom de las pestañas, la barra de símbolos, el foco al ejecutar, el aviso de giro y el tour (controles fijos fuera del globo, ✕, cambio automático de pestaña).
- **Navegador real (opcional):** `herramientas/responsive/` abre cada página (landing, acceso, conceptos, mapa, los 4 mundos, Laboratorio Libre, primer recorrido con el tour, perfil, profesor y admin con sus pestañas; también con menú, diccionario y glosario abiertos) en 8 tamaños de pantalla dentro de Chromium sin pantalla, con un Supabase simulado. Comprueba que no haya desbordes (contra el ancho REAL del dispositivo), el menú hamburguesa, las pestañas, el botón Ejecutar flotante, que el tour recorra todos sus pasos con los controles a la vista, los 44 px táctiles y las letras de 16 px. Guarda capturas en `/tmp/capturas`.
  ```
  npm i --no-save puppeteer-core @sparticuz/chromium
  VITE_SUPABASE_URL=http://127.0.0.1:4173 VITE_SUPABASE_ANON_KEY=x npx vite build
  npm run test:responsive            # o: node herramientas/responsive/medir.mjs --pagina=juego-m3 --ancho=390
  ```
- **Lo que no se puede probar así:** el teclado virtual real de iOS y Android (sobre todo que el botón flotante suba exactamente con él) y Safari. Antes de la muestra conviene abrir el juego en un iPhone y un Android de verdad.

## Correcciones de pulido (Avance 3.1)

1. **Botón Ejecutar arriba.** `▶ Ejecutar` (verde brillante) y `↺ Reiniciar` están en el encabezado del panel de Código, junto a «CQL», y se quedan pegados bajo las barras fijas al hacer scroll, así que el escenario nunca se pierde de vista. **Ctrl+Enter** (o **Cmd+Enter** en Mac) dentro del editor ejecuta; en Mac el botón muestra ⌘+Enter. Un Enter normal no ejecuta.
2. **Glosario por mundo, con buscador y más fondo.** El botón **Conceptos** del juego y `conceptos.html` solo muestran los conceptos del mundo actual y de los anteriores (28 en total; el Mundo 1 solo ve Instrucción, Algoritmo, Método, print(), entrada() y Error). Cada concepto tiene **Definición + Analogía + Ejemplo** (y dibujo en los principales). Hay un buscador que ignora mayúsculas y acentos y un filtro «Todo hasta el Mundo N / Solo el Mundo N». En `conceptos.html` el mundo sale de `?mundo=N` o, si hay sesión de alumno, de su progreso en Supabase; docentes y admins ven todo; sin sesión, el Mundo 1. El contenido está en `js/ui/glosarioDatos.js`.
3. **«Unir textos» (Mundo 2, Nivel 3, fase 2).** El enunciado ahora explica la **concatenación**, la respuesta sigue siendo `53` y la retroalimentación avisa: «¡Cuidado! Esto solo funciona con textos… `"5" + 3` dará un error». **Para que ese aviso sea verdad cambié el intérprete:** `+` solo une texto con texto o suma número con número; mezclarlos da `RUN_015` y restar, multiplicar, dividir o sacar residuo con texto da `RUN_016` (antes se mezclaba en silencio). Ningún nivel usaba esas mezclas; la fase 11.3 ahora dice que el programa «da un error» en vez de «muestra 151».
4. **CSV para la tesis.** *Exportar a CSV* ahora trae, además de lo anterior: **Nombre del alumno, Email, Nivel actual** (el número que ve el alumno dentro de su mundo; el global va en otra columna)**, Estrellas totales, Total de ejecuciones, Total de errores** (ejecuciones fallidas = cualquier resultado distinto de éxito) **y Error más frecuente** (código como `SEM_001`, con su descripción en otra columna; vacío si nunca tuvo un error de código; en empate gana el primero alfabéticamente).
   - **SQL opcional:** `supabase/avance3_1.sql` crea `admin_errores_por_usuario()`, que calcula esos dos datos en la base de datos. Sin ella el panel los calcula en el navegador leyendo las ejecuciones (más lento si hay muchas). Se probó contra PostgreSQL 16.


## Novedades del Avance 3 (mapa de mundos, escenarios y sintaxis nueva)

**Flujo nuevo:** `auth.html` → **`mundos.html`** (mapa) → `juego.html?mundo=N`. El botón *Jugar* del menú abre el mapa; *← Mundos* vuelve a él.

| Mundo | Escenario (`js/game/escenarios/`) | Qué se aprende | Niveles |
|---|---|---|---|
| 1 · Despertar | `laboratorio.js` (cuadrícula con Robot1) y `diagrama.js` (Nivel 0: pasillo con puerta) | algoritmo y diagrama de flujo, instrucciones, print, errores, input | 0 (tutorial), 1-8 y jefe 44 |
| 2 · Memoria | `datos.js` — Centro de Recuperación: chips de memoria, cables de datos, terminal. **Sin robot** | variables, tipos, operadores, input y conversiones | 9-19 y jefe 45 |
| 3 · Lógica | `cartas.js` — mesa de cartas: las cartas se voltean, se iluminan en verde/rojo y cada `if` se juzga con VERDADERO/FALSO | `if`, `elif`, `else`, comparadores, `and`/`or`/`not`, anidados | 20-31 (12) y jefe 46 |
| 4 · Automatización | `elevador.js` — edificio de 5 pisos con elevador, energía y letrero de repeticiones | `while`, `for`/`range`, contadores, capacidad | 32-43 (12) y jefe 47 |
| 5 · Modularidad | `fabrica.js` — línea de ensamble: cada `def` es una máquina; viaja la caja con los argumentos, aparecen las variables locales y sale el `return` | funciones, parámetros, `return`, variables locales, depuración | 48-55 (8) |
| 6 · Proyecto | — | tarjeta "Próximamente" en el mapa | — |

**Los Mundos 3 y 4 tienen 12 niveles en tres bloques** (lo verifica `npm test`): **Aprender** (1-4: fases Explorar, Predecir y Modificar), **Practicar** (5-8: mezclan DEBUG —incluidos bucles infinitos y errores de sangría— y Escribir) y **Dominar** (9-12: Resolver y Libre; los niveles 10, 11 y 12 prueban el programa en 4 a 8 casos distintos).

### Qué hay que hacer para estrenarlo
1. **No hay SQL nuevo** (la base de datos no cambia). `npm install` (ahora incluye `jsdom` para las pruebas) y `npm run dev`.
2. **Solo si ya tenías alumnos con progreso en el Mundo 2 o posterior:** el Mundo 2 se rediseñó (sin robot) y los Mundos 3 y 4 cambiaron de contenido y de numeración (ahora 20-31 y 32-43). Como las fases conservan ids parecidos (`9.1`, `20.3`…), el progreso viejo marcaría fases que ahora son otras. Para empezar limpio desde el Mundo 2, ejecuta en el SQL Editor:
   ```sql
   delete from public.progreso_fases where nivel_id >= 9;
   update public.progreso_jugador set mundo_actual = 2, nivel_actual = 9 where nivel_actual >= 9;
   ```
   (Los alumnos que no pasaron del Mundo 1 no se ven afectados; el historial de `ejecuciones` se conserva.)

### Cómo probar cada cosa
- **Mapa y desbloqueo:** un mundo se abre al completar TODOS los niveles del anterior **incluido su Nivel Jefe** (el Nivel 0 es tutorial y no cuenta); el 1 siempre está abierto. El estado se indica con icono y texto (▶ Disponible, ✔ Completado, 🔒 Bloqueado/Próximamente), no solo con color. Con el **Modo Demo** del panel de admin (`mundos.html?demo=true`) están todos abiertos.
- **Teoría:** al entrar por primera vez a un mundo aparece su bienvenida (se recuerda por usuario y mundo en el navegador). El botón **Conceptos** (juego y mapa) abre el glosario con ilustraciones: variable, algoritmo, operadores, condicional, comparadores/lógica y ciclo.
- **Mundo 3:** escribe `if numero > 21:` + `print("Bust")` en el nivel 1. Tu regla se prueba en **4 mesas**; elige la que quieres ver con los botones de arriba del escenario. Un `print("Bust")` "a ciegas" NO pasa y el juego dice qué mesa falló y por qué.
- **Conceptos:** `conceptos.html` (también el botón **Conceptos** del juego y del menú) explica variables, algoritmo, operadores, condicionales, comparadores y ciclos con dibujos y ejemplos; no necesita sesión.
- **Mundo 4:** `while piso < 5:` con `elevador.subir(1)`; el panel de Estado muestra piso, pasajeros a bordo, entregados y **energía** (cada piso recorrido gasta 1%; sin energía → RUN_012).
- **Mundo 4 (infinito):** `while piso < 5:` con `elevador.subir(1)`. Prueba `while True:` → *RUN_005 Ciclo infinito detectado* (se corta a las 1000 repeticiones; a partir de la 12.ª el elevador deja de animarse para no hacerte esperar).
- **Sangría:** `Tab` inserta 4 espacios, `Shift+Tab` desindenta; errores con sangría explicados (SYN_006 a SYN_014).
- **Límite de iteraciones:** `maxInstrucciones = 1000` en `js/interpreter/interpreter.js` (suma 1 por cada vuelta de `while` o `for`, global entre ciclos).

### Decisiones que tomé (no estaban en la especificación)
- **El Mundo 2 se reescribió entero** (11 niveles, mismos ids y mismos `concepto_evaluado`). Las consultas de estado de Robot1 (`energia`, `posicion`, `mirar`) ya no se enseñan allí: pasan al Laboratorio Libre y su entrada del diccionario se desbloquea al terminar el Mundo 1.
- **"Casos" para validar lógica y ciclos:** una fase puede tener varias mesas/edificios (`casos` en el JSON). El programa se ejecuta con animación en el caso visible y en silencio en los demás; la fase solo se supera si pasa **todos**. Así no se pueden "adivinar" las respuestas. La lógica vive en `js/game/evaluacion.js` y la usan juego y pruebas.
- **Variables de la mesa:** `carta1`, `carta2`…, `total` y, con `mostrarColor`, `color1`, `color2`… (`"roja"`/`"negra"`). En el nivel 20 el total también se llama `numero`, como pedía la especificación.
- **Numeración:** dentro de un mundo los niveles se numeran 1..N (internamente siguen siendo 1..35). El perfil y el panel de admin siguen mostrando el id global.
- **Desbloqueo de mundos:** se abre al completar TODOS los niveles del anterior, jefe incluido (la especificación decía "mundo_id ≤ mundo_actual"; en juego normal equivale, pero esta regla tampoco se salta con datos viejos). `juego.html?mundo=X&nivel=N` abre el nivel N de ese mundo si ya está desbloqueado.
- **`mesa.poner_carta(valor, color)` y `mesa.voltear()`** existen (color `"roja"` o `"negra"`, máximo 6 cartas) pero son **visuales**: no cambian `carta1`, `total` ni el resto de variables, que salen de la mano de cada mesa. Se usan en las fases Libres.
- **El motor sigue siendo el mismo:** en vez de ramificar `ejecutor.js` por mundo, cada mundo es un escenario con la misma interfaz (`escenarios/index.js` elige cuál según `escenario.tipo` del JSON del nivel).
- **Ilustraciones del mapa:** son SVG propios dibujados en código (no hay imágenes externas); cada mundo tiene una composición distinta.
- **Tipografía:** se mantiene Space Grotesk (la propuesta de la especificación) y JetBrains Mono para el código.
- **Movimiento reducido:** si el sistema lo pide, las animaciones se acortan o se omiten (`prefers-reduced-motion`).

### Referencia del lenguaje
`docs/REFERENCIA_LENGUAJE_CQL.md` documenta todo CQL: lexemas, los 35 tokens, gramática, tipos, operadores y precedencia, sentencias, objetos de cada mundo (`robot1`, `mesa`, `elevador`), qué se desbloquea en cada nivel, el catálogo de 48 errores y lo que el lenguaje no tiene. Las tablas de tokens, errores y desbloqueos se generan desde el código: `node herramientas/generar_referencia_cql.mjs`.

### Guía para facilitar
`docs/GUIA_NIVELES_MUNDOS_1_A_5.md` explica, nivel por nivel y fase por fase, qué pide cada una y cómo se pasa (sin código; las soluciones están escondidas como spoiler). Se regenera con `python3 herramientas/generar_guia.py`.

### Pruebas (`npm test`)
`test_cql.mjs` (lenguaje y escenarios: 60), `test_python_compat.mjs` (155 programas comparados con el Python real), `test_niveles.mjs` (176 fases de 56 niveles con su solución de referencia + 116 soluciones tramposas o rotas que deben ser rechazadas, y la estructura por bloques), `test_fabrica.mjs` (visualizador de flujo del Mundo 5: eventos en orden, dibujo en todos los estados y validación del jefe), `test_navegacion.mjs` (desbloqueo, catálogo y glosario), `test_csv.mjs` (exportación), `test_persistencia.mjs`, `test_editor.mjs` y `test_juego_dom.mjs` (31 pruebas), que abre `juego.html` real en jsdom con un Supabase simulado y juega los 5 mundos, el Nivel 0, los jefes, los tours, la transición, el parámetro `?nivel`, el Laboratorio Libre y el modo demo.
Los niveles de los Mundos 2-4 se generan con `python3 herramientas/generar_niveles.py` (edita ahí y vuelve a correr; luego `npm test`).

### Para el Avance 4
Mundo 6 (proyecto): un escenario nuevo en `js/game/escenarios/` + una entrada en `js/game/escenarios/index.js`, su paleta en `js/game/paletas.js`, niveles en `levels/mundo6/` (agrégalos a `herramientas/generar_niveles.py`), y añadirlo a `MUNDOS_ACTIVOS` en `js/landing.js`.

---

## Novedades del Avance 2.3 (cierre del Avance 2)

### Instalar el SQL
Ejecuta `supabase/avance2_3.sql` en el SQL Editor (después de `avance2.sql` y `avance2_2.sql`). Es idempotente. Añade la columna `ejecuciones.concepto_evaluado` y la función `admin_alertas_clase`. **Si lo ejecutas después de actualizar el código no pierdes nada:** mientras falte la columna, las ejecuciones se guardan igual, solo sin concepto.

### Probar la pantalla de transición
1. Entra con un alumno y llega al **Nivel 8** (o usa el Modo Demo del panel de admin, que tiene todos los niveles abiertos).
2. Completa su última fase: en lugar de "Siguiente nivel" aparece una pantalla completa con el relato del Mundo 1, tus estrellas del mundo y el botón **Continuar al siguiente mundo**, que abre el Nivel 9.
3. Haz lo mismo con el **Nivel 19**: relato del Mundo 2 y botón **Entendido** (aún no existe el Mundo 3), con atajo a tu perfil.
Los relatos están en el JSON de los niveles 8 y 19 (`narrativaSiguienteMundo`).

### Acceder al Laboratorio Libre
- Alumno o profesor: menú superior → **Laboratorio Libre** (`juego.html?modo=sandbox`).
- Admin / super_root: panel de admin → **Abrir Laboratorio Libre** (se abre en otra pestaña).
Es una cuadrícula de 10×10 vacía con todas las instrucciones del Avance 2 (incluidas las variables), los 3 paneles en vivo y sin validación, estrellas ni pistas. **No guarda nada**: ni en Supabase ni en localStorage.

### Ver las alertas en el panel del profesor
`Mis clases` → **Ver alumnos**: columna **Estado** con ⚠️ (con tooltip "Este alumno puede necesitar ayuda" y el motivo) o ✅. Un alumno está en riesgo si tiene **más de 10 intentos fallidos en su nivel actual** o **más de 3 días sin actividad**. Los alumnos en riesgo salen primero. Si no has ejecutado `avance2_3.sql`, la tabla funciona igual y avisa que las alertas no están disponibles.

### Editor
`Tab` inserta 4 espacios; con varias líneas seleccionadas las indenta todas; `Shift+Tab` desindenta. Deshacer (Ctrl+Z) funciona. Para no atrapar a quien navega con teclado: `Esc` y luego `Tab` mueve el foco fuera del editor.

### Concepto evaluado
Cada nivel JSON tiene `concepto_evaluado` (p. ej. `variables`, `operadores_aritmeticos`) y cada ejecución lo guarda en `ejecuciones.concepto_evaluado`. El panel de admin → Ejecuciones tiene el filtro **Concepto evaluado** y una columna con el concepto.

### Decisiones respecto a la especificación 2.3
- **Alertas: "errores" = intentos fallidos** (cualquier resultado distinto de `exito`, incluido "objetivo no alcanzado"), contados **en el nivel actual**. El SQL de la especificación contaba solo `error%` de los últimos 7 días en todos los niveles, lo que no coincidía con su propio texto y dejaba pasar a quien fallaba sin que saltara un error de código.
- **Un alumno que nunca jugó** se marca en riesgo pasados 3 días desde su inscripción (con el SQL original quedaba como "al día" para siempre).
- El Laboratorio Libre incluye `asignacion` además de `print` y `entrada`; si no, no se podrían usar variables.
- La función conserva el nombre `admin_alertas_clase`, pero también la puede llamar el profesor dueño de la clase (para cualquier otra persona devuelve cero filas).

---

## Novedades del Avance 2.2 (roles, clases y auditoría)

| Página | Quién entra | Qué hace |
|---|---|---|
| `index.html` | todos | Landing limpia, sin formularios (autores e institución en el pie) |
| `auth.html` | todos | Login / registro (Soy alumno · Soy profesor, código de clase opcional) / recuperar contraseña |
| `juego.html` | alumno, profesor | El juego. Admin y super_root solo entran con `?demo=true` |
| `perfil.html` | alumno, profesor | Progreso, **Mi clase / Unirme a una clase**, **Zona de peligro** (escribir `BORRAR`) |
| `profesor.html` | profesor (y admin) | Crear clases, ver código, ver alumnos con estrellas y último nivel |
| `admin.html` | admin, super_root | Resumen, Usuarios (filtros, búsqueda, **CSV**), Ejecuciones, **Auditoría**, Configuración, botón **Modo Demo** |

### Instalar el SQL (en este orden, en Supabase → SQL Editor)
1. `supabase/avance2.sql` (si aún no lo habías ejecutado).
2. `supabase/avance2_2.sql`. Es idempotente y va en una transacción. **Reemplaza** las políticas "Profesores y admins ven todo…" (ahora un profesor solo ve a sus alumnos) y las funciones `cq_es_admin` (ahora incluye super_root) y `admin_eliminar_usuario`.

### Crear el primer Super Root
Solo desde el SQL Editor (la web no puede crearlo ni modificarlo):
```sql
update public.perfiles set rol = 'super_root'
where user_id = (select id from auth.users where email = 'tu-correo@ejemplo.com');
```
Cierra sesión y entra de nuevo: te lleva a `admin.html`. Un trigger impide que cualquiera (incluidos los admin) cambie o elimine a un super_root desde la API.

### Reglas de roles (las impone la base de datos, no solo la interfaz)
- Solo un **super_root** puede crear/quitar admins o eliminar a un admin. Un admin gestiona alumnos y profesores.
- Nadie cambia su propio rol ni elimina su propia cuenta. Un super_root no se puede resetear, degradar ni eliminar desde la web.
- Cambiar rol, resetear y eliminar pasan por funciones SQL y quedan en `auditoria` (nadie puede escribirla ni borrarla desde la API).

### Probar el flujo de Profesor
1. En `auth.html` → *Crear cuenta* → **Soy profesor** (si Supabase exige confirmar el correo, confirma y entra).
2. Te lleva a `perfil.html`; en el menú abre **Mis clases** → **Crear clase** (nombre y, opcional, dominio permitido).
3. Aparece la tarjeta con el código de 6 caracteres; **Copiar código**.

### Probar el flujo de Alumno
1. Cuenta nueva como **Soy alumno** y pega el código en *Código de clase* (o, ya registrado, en `perfil.html` → *Unirme a una clase*).
2. Vuelve a la cuenta del profesor → **Ver alumnos**: aparece con estrellas y nivel actual.
3. Con un correo de otro dominio y una clase con dominio restringido debe rechazarte.

### Probar la Zona de Peligro
Como alumno con algo de progreso: `perfil.html` → **Borrar todo mi progreso** → escribe `BORRAR`. Se borran fases y ejecuciones y vuelves al nivel 1.

### Probar el Modo Demo
Como admin: botón **Probar el juego (Modo Demo)** en el panel. Abre `juego.html?demo=true` en otra pestaña, con todos los niveles abiertos y el progreso en localStorage (sin tocar la base de datos). Un alumno que escriba `?demo=true` es ignorado: sigue en su cuenta normal.

### Correo institucional
En `.env` pon `VITE_DOMINIO_INSTITUCIONAL=pachuca.tecnm.mx` y el registro solo aceptará ese dominio. **Es una ayuda en el navegador, no una barrera real**: para exigirlo en el servidor hay que usar un Auth Hook de Supabase. Para crear admins/super_root con otro correo, créalos desde Supabase → Authentication → Users → *Add user*. La restricción de dominio de cada **clase** sí se valida en el servidor.
Añade también `http://localhost:5173/auth.html?recuperar=1` a las *Redirect URLs* de Supabase (la recuperación de contraseña ahora vuelve a `auth.html`).

### Decisiones y límites
- **El rol "profesor" lo declara cada persona al registrarse** (la especificación pide ese selector). Un profesor solo ve a los alumnos que se unen a SUS clases, pero si necesitas verificar profesores de verdad, hay que aprobarlos desde el panel (no incluido).
- Crear clase y unirse se hacen con funciones SQL (`crear_clase`, `unirse_a_clase`): no hay INSERT directo, así el código es único y el dominio no se puede saltar.
- Si el código de clase del registro es inválido, la cuenta se crea igual y se avisa; se puede intentar de nuevo desde el perfil.
- Verificado: `supabase/avance2_2.sql` se probó contra PostgreSQL 16 con 62 comprobaciones de roles, RLS y funciones (aislamiento entre alumnos/profesores, candados de super_root, auditoría, registro).

---

## Estructura

```
index.html (landing)  auth.html  mundos.html (mapa)  juego.html  perfil.html  profesor.html  admin.html
css/  styles.css panels.css auth.css landing.css perfil.css admin.css
js/   supabase.js auth.js nav.js landing.js perfil.js admin.js juego.js (antes main.js)
      datos.js util.js
      game/catalogo.js            catálogo de niveles (fases por nivel) para juego, perfil y admin
      persistence/                ProgressRepository, LocalStorage…, SupabaseProgressRepository, progreso.js (lógica pura)
      ui/                         + avisos.js (toasts/modales), vistaProgreso.js, erroresCatalogo.js
supabase/avance2.sql, avance2_2.sql, avance2_3.sql   funciones SQL, roles, clases, auditoría y alertas (en ese orden)
test_cql.mjs  test_niveles.mjs  test_navegacion.mjs  test_persistencia.mjs  test_editor.mjs  test_juego_dom.mjs
```

## 1. Instalar dependencias

```bash
npm install
```
(instala `@supabase/supabase-js` y `vite`.)

## 2. Configurar `.env`

```bash
cp .env.example .env
```
Rellena `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (Supabase → Project Settings → API). **Solo la clave anon/publishable; nunca la `service_role`.** `.env` está en `.gitignore`.

Además, en Supabase → Authentication → URL Configuration, añade a *Redirect URLs* `http://localhost:5173/auth.html?recuperar=1` (y la de tu dominio al publicar) para que funcione "¿Olvidaste tu contraseña?".

## 3. Instalar las funciones SQL del admin (una vez)

Abre `supabase/avance2.sql`, pégalo en **Supabase → SQL Editor** y ejecútalo. Crea `admin_listar_usuarios`, `admin_resumen` y `admin_eliminar_usuario`, todas con comprobación de rol admin. Hacen falta porque el navegador no puede leer emails de otros usuarios, agrupar eficientemente ni borrar de `auth.users`. Sin ellas el panel funciona con datos parciales y avisa, pero **no puede eliminar usuarios**.

## 4. Ejecutar en local

```bash
npm run dev      # http://localhost:5173
npm run build    # sitio estático en dist/ (sube esa carpeta a tu hosting)
npm test         # niveles + persistencia
```

## 5. Probar registro y login

1. Abre la landing → **Empezar a jugar** → *Crear cuenta*.
2. Con confirmación de email activada en Supabase verás "revisa tu correo"; si no, entras directo a `juego.html`.
3. Juega una fase y revisa en Supabase → Table Editor: `progreso_fases`, `progreso_jugador` y `ejecuciones` tienen filas con tu `user_id`.
4. Cierra sesión y entra de nuevo: el progreso se restaura. Con sesión activa, `index.html` te redirige solo.
5. Errores esperados: contraseña errónea → "Email o contraseña incorrectos"; email repetido → "Ya existe una cuenta con ese email".

## 6. Probar el panel de admin

Entra con el usuario admin (redirige a `admin.html`). Prueba: Resumen, filtros de Usuarios, **Ver detalle**, cambiar rol (otro usuario), **Resetear progreso**, **Eliminar** (hay que escribir `ELIMINAR`) y Ejecuciones con filtros y paginación. Un estudiante que abra `admin.html` es devuelto a `juego.html`.

## 7. Probar que RLS funciona

- Con dos cuentas de estudiante, A no debe ver nada de B. En la consola del navegador (sesión de A):
  ```js
  const { supabase } = await import('/js/supabase.js');
  (await supabase.from('progreso_fases').select('user_id')).data  // solo tu user_id
  ```
- Como estudiante, intenta `supabase.rpc('admin_listar_usuarios')`: devuelve lista vacía; `admin_eliminar_usuario` lanza "No autorizado".
- Intenta `supabase.from('perfiles').update({rol:'admin'}).eq('user_id', TU_ID)`: debe fallar o no afectar filas (política corregida).

## 8. Añadir un campo nuevo a `perfiles`

1. `alter table public.perfiles add column telefono text;` en el SQL Editor.
2. `obtenerPerfil()` ya hace `select *`, así que el campo llega en `perfil.telefono`.
3. Muéstralo en `perfil.js` (`pintarDatosUsuario`) y, si lo editas, haz `update` como en el formulario de nombre.
4. Si lo debe rellenar el registro, léelo en `raw_user_meta_data` dentro de `trigger_nuevo_usuario` y pásalo en `options.data` de `registrarUsuario`.

## Decisiones tomadas (no estaban en la especificación)

- **Vite** como herramienta de build: es lo que permite `.env`, `npm install` y empaquetar los niveles (`import.meta.glob`) sin copiar `levels/`.
- **Estrellas y niveles completados no se guardan**: `progreso_fases` no tiene esas columnas, así que se **derivan** de las fases con el catálogo de niveles (misma regla de `stars.js`). Repasar un nivel ya completado no cambia intentos ni pistas, para no perder estrellas.
- **Experiencia** = 100 por nivel completado + 50 por estrella (se recalcula, nunca se duplica).
- **Valores de `ejecuciones.resultado`**: `exito`, `objetivo_no_alcanzado` y `error_lexico|error_sintaxis|error_semantico|error_ejecucion|error_inesperado` (por prefijo del código CQL). Una predicción incorrecta ahora también se registra. Si tu tabla tiene un CHECK sobre `resultado`, ajusta `resultadoDeError()` en `js/persistence/progreso.js`.
- **Sincronización**: lecturas desde memoria; escrituras en una cola persistente (localStorage por usuario) que se envía en segundo plano y se reintenta al volver la red. El progreso de Avance 1 guardado en `codequest:progreso:v2` **no se importa** a las cuentas.
- **Profesor**: aterriza en `perfil.html`; no hay relación profesor–estudiantes en el esquema, así que no tiene panel propio.
- La landing muestra los Mundos 1 a 5 como «Disponible» y el 6 como «Próximamente» (edítalo en `MUNDOS_ACTIVOS` de `js/landing.js`). Completa institución y personas en la sección "Sobre el proyecto" de `index.html`.

## Supuestos sobre tus tablas (verifícalos)

`perfiles.user_id`, `progreso_fases(mundo_id, nivel_id, fase_id texto como "1.1", completada, intentos, pistas_usadas)` y `ejecuciones.created_at` (cambia `COL_FECHA` en `js/datos.js` si se llama distinto). La consulta de verificación está al final de `supabase/avance2.sql`.
