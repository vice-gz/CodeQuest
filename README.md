# CodeQuest: Aprende Programando — Avance 2.3

Avance 1 (juego, intérprete CQL, Mundos 1-2) + **landing, autenticación, persistencia en Supabase, perfil y panel de administrador**. No se implementan los Mundos 3-6. La documentación del Avance 1 está en `docs/README_avance1.md`.

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

### Qué hacer en el Avance 3 (Mundos 3 y 4)
Los comentarios `AVANCE 3` al inicio de `js/interpreter/parser.js`, `validator.js` y `lexer.js` listan el trabajo exacto. Resumen:
1. **Lexer:** tokens `IF, ELSE, ELIF, WHILE, FOR, DEF, RETURN, IGUAL, DISTINTO, MENOR, MAYOR, MENOR_IGUAL, MAYOR_IGUAL, AND, OR, NOT, DOS_PUNTOS, INDENTACION` (y dejar de ignorar la sangría).
2. **Parser:** nodos `If/While/For/Def/Return`, bloques por indentación y expresiones con precedencia lógica.
3. **Validator:** condiciones, alcance de variables, funciones del estudiante y `return` solo dentro de `def`.
4. **Niveles:** crear los JSON de los Mundos 3 y 4 con `concepto_evaluado`, añadir sus nombres en `construirCatalogo` (`js/persistence/progreso.js`) y la narrativa de transición del último nivel del Mundo 3.
5. Poner nombres reales a los Mundos 3-6 de la landing (`js/landing.js`).

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
index.html (landing)  auth.html (login/registro)  juego.html  perfil.html  profesor.html  admin.html
css/  styles.css panels.css auth.css landing.css perfil.css admin.css
js/   supabase.js auth.js nav.js landing.js perfil.js admin.js juego.js (antes main.js)
      datos.js util.js
      game/catalogo.js            catálogo de niveles (fases por nivel) para juego, perfil y admin
      persistence/                ProgressRepository, LocalStorage…, SupabaseProgressRepository, progreso.js (lógica pura)
      ui/                         + avisos.js (toasts/modales), vistaProgreso.js, erroresCatalogo.js
supabase/avance2.sql, avance2_2.sql, avance2_3.sql   funciones SQL, roles, clases, auditoría y alertas (en ese orden)
test_niveles.mjs  test_persistencia.mjs  test_editor.mjs
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
- Los Mundos 3-6 de la landing aparecen como "Próximamente" sin nombre (edítalos en `js/landing.js`). Completa institución y personas en la sección "Sobre el proyecto" de `index.html`.

## Supuestos sobre tus tablas (verifícalos)

`perfiles.user_id`, `progreso_fases(mundo_id, nivel_id, fase_id texto como "1.1", completada, intentos, pistas_usadas)` y `ejecuciones.created_at` (cambia `COL_FECHA` en `js/datos.js` si se llama distinto). La consulta de verificación está al final de `supabase/avance2.sql`.
