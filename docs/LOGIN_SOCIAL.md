# Login con Google y GitHub — cómo activarlo

El código ya está en el proyecto (botones en `auth.html`, lógica en `js/auth.js`, `js/authPage.js` y `js/oauthUtil.js`). Para que funcione falta **configurar tres cosas fuera del código**: los permisos en Supabase, una "app" en Google y otra en GitHub. No cuesta nada y toma unos 15 minutos.

> Sustituye `TU-PROYECTO` por el identificador de tu proyecto de Supabase (lo ves en su URL: `https://TU-PROYECTO.supabase.co`).

## 0. La dirección de regreso (Supabase)

1. Supabase → **Authentication → URL Configuration**.
2. **Site URL:** la dirección principal de tu sitio (en desarrollo, `http://localhost:5173`).
3. **Redirect URLs → Add URL**, agrega *cada* dirección desde la que se usará el login:
   - `http://localhost:5173/auth.html`
   - `https://tu-dominio-publicado/auth.html` (cuando lo publiques; si va dentro de una carpeta, incluye la carpeta)

Si falta la dirección, Supabase te devuelve a la *Site URL* en vez de a `auth.html` y parecerá que "no pasó nada".

## 1. Google

1. Entra a **Google Cloud Console** (console.cloud.google.com) y crea un proyecto (p. ej. «CodeQuest»).
2. **APIs y servicios → Pantalla de consentimiento de OAuth:** tipo *Externo*, nombre de la app, correo de soporte y de contacto. En *Permisos* basta con `email`, `profile` y `openid`. Mientras la app esté en modo **Pruebas**, solo podrán entrar los correos que agregues en *Usuarios de prueba*; para abrirla a todos pulsa **Publicar app** (con esos permisos básicos no pide verificación).
3. **Credenciales → Crear credenciales → ID de cliente de OAuth → Aplicación web.**
   - **URI de redireccionamiento autorizados:** `https://TU-PROYECTO.supabase.co/auth/v1/callback`  ← debe ser *exactamente* esta (es la de **Supabase**, no la de tu sitio).
4. Copia el **ID de cliente** y el **Secreto de cliente**.
5. Supabase → **Authentication → Providers → Google** → activa **Enable**, pega el *Client ID* y el *Client Secret* → **Save**.

## 2. GitHub

1. GitHub → tu foto → **Settings → Developer settings → OAuth Apps → New OAuth App**.
2. **Application name:** CodeQuest. **Homepage URL:** la dirección de tu sitio. **Authorization callback URL:** `https://TU-PROYECTO.supabase.co/auth/v1/callback`
3. **Register application** → **Generate a new client secret**. Copia el *Client ID* y el *Client Secret* (el secreto solo se muestra una vez).
4. Supabase → **Authentication → Providers → GitHub** → activa **Enable**, pega ambos → **Save**.

## 3. Cómo probarlo (checklist)

- [ ] En `auth.html` aparecen **Continuar con Google** y **Continuar con GitHub**, grandes y arriba de todo (antes del formulario de correo).
- [ ] Al pulsar uno te lleva a la pantalla de autorización del proveedor.
- [ ] Con una cuenta **nueva**: al volver entras a `mundos.html` y en Supabase → *Table Editor* existe su fila en `perfiles` (rol `estudiante`) y en `progreso_jugador` (mundo 1, nivel 1).
- [ ] Con una cuenta **que ya existía**: entra directo, sin filas duplicadas.
- [ ] Una persona **nueva** pulsa Google o GitHub, vuelve y ve la pantalla **«Un último paso»**: elige «Soy alumno» (viene marcado) o «Soy profesor» y pulsa **Continuar**. Un alumno entra a `mundos.html`; un profesor, a `profesor.html` con el saludo «¡Hola Profe! Configura tu primera clase en el panel».
- [ ] Si cierra la pestaña sin contestar «Un último paso», la próxima vez que entre se le vuelve a preguntar.
- [ ] Una cuenta que ya existía entra directo con su rol de siempre y no ve «Un último paso».

## Cómo funciona por dentro

1. El botón llama a `supabase.auth.signInWithOAuth` con el proveedor, los permisos mínimos (Google: `email profile`; GitHub: `read:user user:email`) y como destino `auth.html` (calculado desde la dirección actual, así funciona en `localhost`, en un dominio o dentro de una carpeta).
2. Los mismos dos botones sirven para **entrar y para crear cuenta**: no hay que decidir nada antes de pulsarlos. (El formulario de correo queda debajo, con las pestañas «Ya tengo cuenta» / «Soy nuevo».)
3. Al volver, `authPage.js` detecta la respuesta del proveedor en la URL, limpia los tokens de la barra de direcciones y llama a `completarLoginOAuth()`:
   - comprueba que exista el **perfil** y el **progreso inicial**; si falta alguno lo crea (siempre como `estudiante`; es idempotente: si ya existe, no hace nada);
   - si en `.env` hay `VITE_DOMINIO_INSTITUCIONAL`, rechaza (y cierra la sesión) a quien entre con otro dominio; los administradores quedan exentos;
   - **si es la primera vez** y la persona aún no ha dicho cómo usará CodeQuest, muestra la pantalla **«Un último paso»** (tarjetas «Soy alumno» / «Soy profesor» y, para alumnos, un código de clase opcional). Hasta que pulse **Continuar** no se aplica ningún rol;
   - **si ya tenía cuenta** (ya contestó, se registró con correo, es profesor/administrador o ya jugó) entra directo con el rol que tiene.
4. Al pulsar **Continuar**, `finalizarRegistroOAuth()` guarda la elección en `user_metadata` (`rol_solicitado`, `cq_registro_completo` y, si hay, `codigo_clase`) y llama a `aplicar_registro`. Después redirige según el rol que la cuenta **realmente** tiene: alumno → `mundos.html`, profesor → `profesor.html` (con el saludo «¡Hola Profe! Configura tu primera clase en el panel»), admin → `admin.html`.

### Por qué el rol de profesor no se escribe directo desde el navegador
La política de seguridad de la tabla `perfiles` solo deja al navegador crear su perfil como `estudiante` (así nadie puede hacerse administrador desde la consola). Por eso el rol de profesor viaja como una *solicitud* en `user_metadata` y lo concede el servidor con `aplicar_registro`, una sola vez por cuenta (igual que en el registro con correo). Si el servidor no lo concede (por ejemplo, falta instalar `supabase/avance2_2.sql`), la página lo dice y la cuenta queda como alumno: nunca se muestra como profesor algo que no lo es.

«Un último paso» solo aparece para cuentas nuevas: si alguien ya tenía cuenta y entra con Google/GitHub, conserva el rol que ya tiene guardado.

### Sobre el disparador de la base de datos
Tu proyecto ya tiene el disparador `trigger_nuevo_usuario` sobre `auth.users`. Se ejecuta con **cualquier** alta —también las de Google y GitHub—, así que lo normal es que el perfil **ya exista** cuando la persona vuelve del proveedor. La creación desde el navegador es solo una red de seguridad. Si el disparador te deja el nombre como «sin nombre», la página lo reemplaza por el que da Google/GitHub (solo en cuentas nuevas).

## Cuentas que ya existían (vincular por correo)

Si alguien ya se registró con `ana@correo.com` y contraseña, y luego usa Google con ese mismo correo, Supabase **vincula las dos formas de entrar a la misma cuenta** (lo hace solo cuando el proveedor confirma que el correo es verificado). En ese caso conserva su perfil, su progreso y su rol.

Si no pudo vincularlas, la página muestra: «Ya existe una cuenta con ese correo creada con otro método. Inicia sesión con tu contraseña (o con el proveedor que usaste primero) para vincularlas».

⚠️ Solo activa proveedores que verifiquen el correo (Google y GitHub lo hacen). Si activaras uno que no, alguien podría registrarse con el correo de otra persona y quedar vinculado a su cuenta.

Las cuentas creadas con Google/GitHub **no tienen contraseña**: si luego quieren una, pueden usar «¿Olvidaste tu contraseña?» con su correo.

## Si algo falla

| Lo que ves | Causa probable | Solución |
|---|---|---|
| Google: `redirect_uri_mismatch` | La URI de Google Cloud no es igual a la de Supabase | Debe ser exactamente `https://TU-PROYECTO.supabase.co/auth/v1/callback` |
| Mensaje «El acceso con Google/GitHub aún no está activado» | El proveedor está apagado en Supabase | Authentication → Providers → activar y guardar |
| Vuelves a la página principal en vez de a `auth.html` | `auth.html` no está en *Redirect URLs* | Agregarla en Authentication → URL Configuration (ver sección 0) |
| Google: «Acceso bloqueado: la app no completó la verificación» | La app está en modo *Pruebas* y tu correo no es usuario de prueba | Agrega el correo como usuario de prueba o publica la app |
| GitHub: «no compartió tu correo» | La cuenta no tiene un correo principal verificado | En GitHub → Settings → Emails, verifica un correo principal y desmarca «Keep my email addresses private» o permite el acceso al correo |
| «No encontramos tu perfil» | El disparador o las políticas RLS no permiten crear el perfil | Ejecuta `supabase/avance2_2.sql` (política «Usuarios insertan su propio perfil») y revisa `trigger_nuevo_usuario` |
| «Usa tu correo institucional…» | `VITE_DOMINIO_INSTITUCIONAL` está definido y la cuenta es de otro dominio | Entrar con el correo institucional, o dejar la variable vacía |

> Nota de seguridad: validar el dominio en el navegador es una ayuda, no una barrera (ver `js/config.js`). Para exigirlo de verdad en el servidor haría falta un *Auth Hook* de Supabase.
