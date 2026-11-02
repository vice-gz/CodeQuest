// oauthUtil.js
// Funciones PURAS (sin Supabase ni DOM) del acceso con Google y GitHub:
// elegir el nombre de la persona, saber si la cuenta es nueva e interpretar lo que
// devuelve el proveedor en la URL. Están aparte para poder probarlas con Node.

export const PROVEEDORES = {
  // scopes: lo mínimo para obtener correo y nombre
  google: { nombre: "Google", scopes: "email profile" },
  github: { nombre: "GitHub", scopes: "read:user user:email" },
};

const NOMBRES_GENERICOS = new Set(["", "sin nombre", "usuario", "user", "nuevo usuario", "estudiante"]);
const MAX_NOMBRE = 60;

export const esNombreGenerico = (nombre) => NOMBRES_GENERICOS.has(String(nombre || "").trim().toLowerCase());

/** Nombre para el perfil: el que da el proveedor (Google: full_name; GitHub: name o user_name) o, si no hay, el correo sin dominio. */
export function nombreDesdeProveedor(user) {
  const m = user?.user_metadata || {};
  const candidatos = [m.nombre, m.full_name, m.name, m.user_name, m.preferred_username, String(user?.email || "").split("@")[0]];
  const nombre = candidatos.map((c) => String(c || "").trim()).find((c) => c !== "") || "Estudiante";
  return nombre.slice(0, MAX_NOMBRE);
}

/** ¿Es el primer ingreso de esta cuenta? (creada y con primer acceso casi al mismo tiempo) */
export function esUsuarioNuevo(user, ahora = Date.now()) {
  const creada = Date.parse(user?.created_at || "");
  if (Number.isNaN(creada)) return false;
  const ultimo = Date.parse(user?.last_sign_in_at || "");
  if (Number.isNaN(ultimo)) return ahora - creada < 120000;
  return Math.abs(ultimo - creada) < 60000;
}

/** Lo que el proveedor/Supabase dejó en la URL al volver: sesión (hash o ?code=) o error. */
export function leerParametrosOAuth(ubicacion) {
  const busqueda = new URLSearchParams(ubicacion.search || "");
  const hash = new URLSearchParams(String(ubicacion.hash || "").replace(/^#/, ""));
  const campo = (n) => busqueda.get(n) || hash.get(n) || "";
  // ?error=perfil lo pone protegerPagina() cuando falta el perfil: no es un error de OAuth.
  const error = campo("error") === "perfil" ? "" : campo("error");
  return {
    error,
    codigoError: campo("error_code"),
    descripcion: campo("error_description"),
    code: busqueda.get("code") || "",
    accessToken: hash.get("access_token") || "",
    tipo: hash.get("type") || busqueda.get("type") || "",
  };
}

/** ¿Venimos de un proveedor? (y no del enlace de recuperar contraseña) */
export function hayRetornoOAuth(p) {
  if (p.tipo === "recovery") return false;
  return Boolean(p.code || p.accessToken || p.error);
}

/** Mensaje en español para un error de OAuth. `proveedor` es el nombre bonito: «Google», «GitHub». */
export function mensajeErrorOAuth({ error = "", codigoError = "", descripcion = "", mensaje = "", status = 0 } = {}, proveedor = "el proveedor") {
  const texto = `${error} ${codigoError} ${descripcion} ${mensaje}`.toLowerCase().replace(/\+/g, " ");
  if (texto.includes("provider is not enabled") || texto.includes("unsupported provider") || codigoError === "oauth_provider_not_supported" || texto.includes("provider_disabled"))
    return `El acceso con ${proveedor} aún no está activado en este proyecto. Quien administra Supabase debe activarlo en Authentication → Providers`;
  if (texto.includes("error getting user email") || texto.includes("no email") || codigoError === "email_not_found")
    return `${proveedor} no compartió tu correo. Revisa que tu correo principal esté verificado y permitido, o regístrate con tu email y contraseña`;
  if (texto.includes("identity_already_exists") || texto.includes("email_exists") || texto.includes("already registered") || texto.includes("user_already_exists") || texto.includes("already been registered"))
    return "Ya existe una cuenta con ese correo creada con otro método. Inicia sesión con tu contraseña (o con el proveedor que usaste primero) para vincularlas";
  if (texto.includes("provider_email_needs_verification") || texto.includes("needs verification"))
    return "Te enviamos un correo para confirmar que esta cuenta es tuya. Ábrelo y vuelve a intentarlo";
  if (texto.includes("access_denied") || texto.includes("access denied") || texto.includes("user denied"))
    return `Cancelaste el acceso con ${proveedor}. Si quieres entrar, inténtalo de nuevo`;
  if (texto.includes("bad_oauth") || texto.includes("state") || texto.includes("flow_state"))
    return "La respuesta del proveedor no fue válida o caducó. Inténtalo de nuevo";
  if (texto.includes("signup") && texto.includes("disabled")) return "El registro de cuentas nuevas está desactivado por ahora";
  if (status === 429 || texto.includes("rate limit")) return "Demasiados intentos seguidos. Espera unos minutos e inténtalo de nuevo";
  if (texto.includes("failed to fetch") || texto.includes("network") || texto.includes("load failed"))
    return "No se pudo conectar con el servidor. Revisa tu conexión a internet";
  if (texto.includes("server_error") || texto.includes("unexpected_failure") || texto.includes("temporarily_unavailable"))
    return `${proveedor} tuvo un problema. Inténtalo de nuevo en un momento`;
  return `No se pudo completar el acceso con ${proveedor}. Inténtalo de nuevo`;
}

/**
 * ¿Se le debe mostrar a esta persona la pantalla «Un último paso: ¿alumno o profesor?»?
 * Solo a quien entra con Google/GitHub por primera vez y aún no ha dicho cómo usará CodeQuest.
 * @param {object} user     usuario de Supabase (user_metadata)
 * @param {object} perfil   fila de `perfiles`
 * @param {object} [progreso] fila de `progreso_jugador`
 */
export function necesitaCompletarRegistro(user, perfil, progreso = null) {
  const m = user?.user_metadata || {};
  if (m.cq_registro_completo === true) return false; // ya contestó esta pantalla
  if (m.rol_solicitado) return false; // se registró con correo: allí ya eligió su rol
  if (perfil?.rol && perfil.rol !== "estudiante") return false; // profesor o admin: su rol ya está definido
  if ((progreso?.experiencia ?? 0) > 0 || (progreso?.nivel_actual ?? 1) > 1) return false; // ya jugó: no se le pregunta
  return true;
}
