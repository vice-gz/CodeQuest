// auth.js
// Autenticación con Supabase Auth + lectura del perfil (rol). Las funciones
// que pueden fallar por culpa del usuario (login, registro, recuperar...)
// devuelven { ok, mensaje } con un texto educativo en español; nunca se
// muestran errores técnicos de Supabase en pantalla.

import { supabase, configuracionValida } from "./supabase.js";
import { validarEmail, esRolAdmin } from "./util.js";
import { correoEsInstitucional, DOMINIO_INSTITUCIONAL } from "./config.js";
import { PROVEEDORES, nombreDesdeProveedor, esUsuarioNuevo, esNombreGenerico, mensajeErrorOAuth, necesitaCompletarRegistro } from "./oauthUtil.js";

export const RUTA_POR_ROL = {
  estudiante: "mundos.html",
  profesor: "profesor.html", // «Mis clases»: ahí crea sus clases y ve a sus alumnos
  admin: "admin.html",
  super_root: "admin.html",
};

const MIN_PASSWORD = 8;
let perfilEnMemoria = null;

// ---------- Mensajes de error educativos ----------

// Los errores que lanzan nuestras funciones SQL (errcode P0001) ya vienen
// redactados en español para el usuario: se muestran tal cual.
export function mensajeRpc(error, porDefecto = "Algo salió mal. Inténtalo de nuevo en un momento") {
  if (error?.code === "P0001" && error.message) return error.message;
  if (error?.code === "42501") return "No tienes permiso para hacer esto";
  if (/could not find the function/i.test(error?.message || "")) {
    return "Falta instalar las funciones SQL del Avance 2.2 en Supabase (supabase/avance2_2.sql)";
  }
  return porDefecto;
}

export function traducirError(error) {
  console.error("Supabase auth:", error);
  if (error?.status === 429) return "Demasiados intentos seguidos. Espera unos minutos e inténtalo de nuevo";
  const texto = String(error?.message || error || "").toLowerCase();
  const codigo = String(error?.code || "").toLowerCase();

  if (codigo === "email_address_invalid" || texto.includes("is invalid"))
    return "Ese email no es válido. Usa uno real";
  if (texto.includes("invalid login credentials")) return "Email o contraseña incorrectos";
  if (texto.includes("email not confirmed")) return "Debes confirmar tu email antes de entrar";
  if (texto.includes("user already registered") || codigo === "user_already_exists")
    return "Ya existe una cuenta con ese email";
  if (texto.includes("password should be at least") || codigo === "weak_password")
    return "La contraseña debe tener al menos 8 caracteres";
  if (texto.includes("same password") || codigo === "same_password")
    return "La nueva contraseña debe ser distinta de la actual";
  if (texto.includes("rate limit") || texto.includes("too many") || codigo.includes("rate_limit"))
    return "Demasiados intentos seguidos. Espera unos minutos e inténtalo de nuevo";
  if (texto.includes("unable to validate email") || texto.includes("invalid email"))
    return "El email no parece válido";
  if (texto.includes("signup") && texto.includes("disabled"))
    return "El registro de cuentas nuevas está desactivado por ahora";
  if (texto.includes("failed to fetch") || texto.includes("network") || texto.includes("load failed"))
    return "No se pudo conectar con el servidor. Revisa tu conexión a internet";
  if (texto.includes("session") && (texto.includes("missing") || texto.includes("expired")))
    return "Tu sesión terminó. Inicia sesión de nuevo";
  return "Algo salió mal. Inténtalo de nuevo en un momento";
}

// ---------- Validaciones de cliente ----------

export function validarRegistro({ nombre, email, password, confirmacion, rol }) {
  if (rol && !["estudiante", "profesor"].includes(rol)) return "Elige si eres alumno o profesor";
  if (!String(nombre || "").trim()) return "Escribe tu nombre";
  if (String(nombre).trim().length > 60) return "El nombre es demasiado largo (máximo 60 caracteres)";
  if (!validarEmail(email)) return "Escribe un email válido";
  if (!correoEsInstitucional(email)) return `Usa tu correo institucional (@${DOMINIO_INSTITUCIONAL})`;
  if (String(password || "").length < MIN_PASSWORD) return "La contraseña debe tener al menos 8 caracteres";
  if (password !== confirmacion) return "La contraseña y su confirmación no coinciden";
  return null;
}

// ---------- Sesión y perfil ----------

export async function obtenerUsuarioActual() {
  try {
    const { data } = await supabase.auth.getSession();
    return data?.session?.user ?? null;
  } catch {
    return null;
  }
}

export async function obtenerPerfil({ forzar = false } = {}) {
  if (perfilEnMemoria && !forzar) return perfilEnMemoria;
  const user = await obtenerUsuarioActual();
  if (!user) return null;

  const { data, error } = await supabase
    .from("perfiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("No se pudo leer el perfil:", error);
    return null;
  }
  perfilEnMemoria = { ...data, email: user.email, fechaRegistro: user.created_at };
  return perfilEnMemoria;
}

export async function esAdmin() {
  const perfil = await obtenerPerfil();
  return esRolAdmin(perfil?.rol);
}

// Aplica el rol pedido y el código de clase del registro (una sola vez por
// cuenta; después no hace nada). Si las funciones SQL aún no están instaladas,
// se ignora y la cuenta sigue como alumno.
export async function aplicarRegistro() {
  try {
    const { data, error } = await supabase.rpc("aplicar_registro");
    if (error) {
      console.warn("aplicar_registro:", error.message);
      return { aviso: null };
    }
    perfilEnMemoria = null;
    return { aviso: data?.aviso || null, clase: data?.clase || null };
  } catch {
    return { aviso: null };
  }
}

export async function registrarUsuario(nombre, email, password, { rol = "estudiante", codigoClase = "" } = {}) {
  try {
    // El rol pedido y el código de clase viajan en user_metadata; el servidor
    // los aplica (aplicar_registro) y decide si son válidos.
    const metadatos = { nombre: String(nombre).trim(), rol_solicitado: rol };
    const codigo = String(codigoClase || "").trim();
    if (codigo) metadatos.codigo_clase = codigo;

    const { data, error } = await supabase.auth.signUp({
      email: String(email).trim(),
      password,
      options: { data: metadatos },
    });
    if (error) return { ok: false, mensaje: traducirError(error) };

    // Con confirmación por email activada, un email repetido no da error:
    // devuelve un usuario sin identidades.
    if (Array.isArray(data.user?.identities) && data.user.identities.length === 0) {
      return { ok: false, mensaje: "Ya existe una cuenta con ese email" };
    }
    // Si el proyecto exige confirmar el email, aún no hay sesión.
    if (!data.session) return { ok: true, requiereConfirmacion: true };

    const registro = await aplicarRegistro();
    return { ok: true, requiereConfirmacion: false, ...registro };
  } catch (e) {
    return { ok: false, mensaje: traducirError(e) };
  }
}

// ---------- Acceso con Google y GitHub (OAuth 2.0 vía Supabase Auth) ----------
// Flujo (el mismo botón sirve para entrar y para crear cuenta):
//   1. iniciarSesionOAuth() manda a la persona al proveedor.
//   2. Al volver a auth.html, completarLoginOAuth() comprueba el perfil. Si es su PRIMERA vez
//      devuelve necesitaOnboarding: la página muestra «Un último paso: ¿alumno o profesor?».
//   3. finalizarRegistroOAuth() guarda esa elección (el servidor decide si concede el rol de
//      profesor con aplicar_registro) y la persona entra.
// Si ya tenía cuenta, entra directo con el rol que ya tiene: no se le pregunta nada.
//
// OJO con el perfil: en tu proyecto el disparador trigger_nuevo_usuario (sobre auth.users)
// se ejecuta con CUALQUIER alta, también las de Google y GitHub, así que normalmente el
// perfil ya existe al volver. Aun así aquí se comprueba y, si por algo faltara, se crea
// (como estudiante): es idempotente y tolera que otra parte ya lo haya creado.

const CLAVE_PROVEEDOR_PENDIENTE = "codequest:oauth-proveedor";
const CLAVE_BIENVENIDA_PROFE = "codequest:bienvenida-profe";

/** Qué proveedor se eligió (solo para decir «Entrando con Google…» al volver). */
export function leerProveedorPendiente() {
  try {
    return sessionStorage.getItem(CLAVE_PROVEEDOR_PENDIENTE) || "";
  } catch {
    return "";
  }
}

export function limpiarProveedorPendiente() {
  try {
    sessionStorage.removeItem(CLAVE_PROVEEDOR_PENDIENTE);
  } catch {
    /* nada */
  }
}

/** Lleva a la persona a Google o GitHub. */
export async function iniciarSesionOAuth(proveedor) {
  const definicion = PROVEEDORES[proveedor];
  if (!definicion) return { ok: false, mensaje: "Ese proveedor no está disponible" };
  try {
    try {
      sessionStorage.setItem(CLAVE_PROVEEDOR_PENDIENTE, proveedor);
    } catch {
      /* sin sessionStorage: solo se pierde el nombre en el mensaje */
    }
    // Esta URL debe estar en Supabase -> Authentication -> URL Configuration -> Redirect URLs.
    const redirectTo = new URL("auth.html", window.location.href).href;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: proveedor,
      options: { scopes: definicion.scopes, redirectTo },
    });
    if (error) {
      limpiarProveedorPendiente();
      console.error("OAuth:", error);
      return { ok: false, mensaje: mensajeErrorOAuth({ mensaje: error.message, codigoError: error.code, status: error.status }, definicion.nombre) };
    }
    return { ok: true }; // el navegador se va al proveedor
  } catch (e) {
    limpiarProveedorPendiente();
    console.error("OAuth:", e);
    return { ok: false, mensaje: mensajeErrorOAuth({ mensaje: String(e?.message || e) }, definicion.nombre) };
  }
}

async function leerFilaPropia(tabla, userId) {
  const { data, error } = await supabase.from(tabla).select("*").eq("user_id", userId).maybeSingle();
  if (error) console.error(`No se pudo leer ${tabla}:`, error);
  return data || null;
}

/** Garantiza perfil (estudiante) y progreso inicial de una cuenta de OAuth. Devuelve { perfil, progreso } (perfil null si falló). */
async function asegurarPerfilOAuth(user, nuevo) {
  let perfil = await leerFilaPropia("perfiles", user.id);

  if (!perfil) {
    const { error } = await supabase.from("perfiles").insert({ user_id: user.id, nombre: nombreDesdeProveedor(user), rol: "estudiante" });
    // 23505 = ya existe (el disparador de la base de datos se adelantó): no es un problema.
    if (error && error.code !== "23505") {
      console.error("No se pudo crear el perfil:", error);
      return { perfil: null, progreso: null };
    }
    perfil = await leerFilaPropia("perfiles", user.id);
  }

  let progreso = await leerFilaPropia("progreso_jugador", user.id);
  if (!progreso) {
    const inicial = { user_id: user.id, mundo_actual: 1, nivel_actual: 1, experiencia: 0 };
    const { error } = await supabase.from("progreso_jugador").insert(inicial);
    if (error && error.code !== "23505") console.warn("No se pudo crear el progreso inicial:", error.message);
    progreso = inicial;
  }

  // Cuenta nueva con un nombre genérico: se usa el que da Google/GitHub (después se puede editar en el perfil).
  if (perfil && nuevo && esNombreGenerico(perfil.nombre)) {
    const nombre = nombreDesdeProveedor(user);
    const { error } = await supabase.from("perfiles").update({ nombre }).eq("user_id", user.id);
    if (!error) perfil = { ...perfil, nombre };
  }
  return { perfil, progreso };
}

/**
 * Se llama al volver de Google/GitHub (la sesión ya la dejó puesta supabase-js).
 * Devuelve { ok:false, mensaje } o { ok:true, perfil, necesitaOnboarding, ... }.
 * Si necesitaOnboarding es true NO se ha aplicado nada todavía: la página pregunta
 * alumno/profesor y llama a finalizarRegistroOAuth().
 */
export async function completarLoginOAuth() {
  const nombreProveedor = PROVEEDORES[leerProveedorPendiente()]?.nombre || "tu cuenta";
  try {
    const user = await obtenerUsuarioActual();
    if (!user) return { ok: false, mensaje: "No se pudo completar el acceso. Inténtalo de nuevo" };
    const nuevo = esUsuarioNuevo(user);

    const { perfil: perfilInicial, progreso } = await asegurarPerfilOAuth(user, nuevo);
    let perfil = perfilInicial;
    if (!perfil) {
      await supabase.auth.signOut();
      limpiarProveedorPendiente();
      return { ok: false, mensaje: "No encontramos tu perfil. Contacta al administrador" };
    }

    // Correo institucional (ayuda para el usuario, no una barrera de seguridad: ver config.js).
    if (!esRolAdmin(perfil.rol) && !correoEsInstitucional(user.email)) {
      await supabase.auth.signOut();
      limpiarProveedorPendiente();
      perfilEnMemoria = null;
      return {
        ok: false,
        mensaje: user.email
          ? `Usa tu correo institucional (@${DOMINIO_INSTITUCIONAL}). Entraste con ${user.email}`
          : `${nombreProveedor} no compartió un correo. Se necesita tu correo institucional (@${DOMINIO_INSTITUCIONAL})`,
      };
    }

    limpiarProveedorPendiente();

    // Primera vez y todavía no dijo cómo usará CodeQuest: la página se lo pregunta.
    if (necesitaCompletarRegistro(user, perfil, progreso)) {
      perfilEnMemoria = null;
      return { ok: true, necesitaOnboarding: true, perfil: { ...perfil, email: user.email }, nuevo };
    }

    const registro = await aplicarRegistro();
    perfil = await obtenerPerfil({ forzar: true });
    return { ok: true, necesitaOnboarding: false, perfil, nuevo, aviso: registro.aviso || null };
  } catch (e) {
    console.error("OAuth:", e);
    return { ok: false, mensaje: mensajeErrorOAuth({ mensaje: String(e?.message || e) }, nombreProveedor) };
  }
}

/**
 * Último paso de una cuenta nueva de Google/GitHub: guarda si es alumno o profesor (y el código
 * de clase de un alumno). El rol de profesor lo concede el SERVIDOR (aplicar_registro), una sola
 * vez por cuenta: el navegador no puede escribirlo directo en `perfiles`.
 */
export async function finalizarRegistroOAuth({ rol = "estudiante", codigoClase = "" } = {}) {
  try {
    const user = await obtenerUsuarioActual();
    if (!user) return { ok: false, mensaje: "Tu sesión terminó. Inicia sesión de nuevo" };

    const pedido = rol === "profesor" ? "profesor" : "estudiante"; // lo que no sea profesor es alumno
    const datos = { rol_solicitado: pedido, cq_registro_completo: true };
    const codigo = String(codigoClase || "").trim();
    if (pedido === "estudiante" && codigo) datos.codigo_clase = codigo;

    const { error } = await supabase.auth.updateUser({ data: datos });
    if (error) return { ok: false, mensaje: traducirError(error) };

    const registro = await aplicarRegistro();
    const perfil = await obtenerPerfil({ forzar: true });
    if (!perfil) return { ok: false, mensaje: "No encontramos tu perfil. Contacta al administrador" };

    // Si pidió ser profesor y el servidor no lo concedió, se le dice la verdad.
    const rolNoAplicado = pedido === "profesor" && perfil.rol !== "profesor";
    if (perfil.rol === "profesor") {
      try {
        localStorage.setItem(CLAVE_BIENVENIDA_PROFE, "1"); // profesor.js muestra el saludo una vez
      } catch {
        /* nada */
      }
    }
    return { ok: true, perfil, aviso: registro.aviso || null, rolNoAplicado };
  } catch (e) {
    console.error("OAuth:", e);
    return { ok: false, mensaje: traducirError(e) };
  }
}

export async function iniciarSesion(email, password) {
  try {
    const { error } = await supabase.auth.signInWithPassword({ email: String(email).trim(), password });
    if (error) return { ok: false, mensaje: traducirError(error) };

    perfilEnMemoria = null;
    await aplicarRegistro(); // cuentas confirmadas por correo: se aplica en el primer ingreso
    const perfil = await obtenerPerfil({ forzar: true });
    if (!perfil) {
      await supabase.auth.signOut();
      return { ok: false, mensaje: "No encontramos tu perfil. Contacta al administrador" };
    }
    return { ok: true, perfil };
  } catch (e) {
    return { ok: false, mensaje: traducirError(e) };
  }
}

export async function cerrarSesion() {
  try {
    await supabase.auth.signOut();
  } catch (e) {
    console.error("Error al cerrar sesión", e);
  }
  perfilEnMemoria = null;
  window.location.href = "index.html";
}

export async function recuperarContrasena(email) {
  if (!validarEmail(email)) return { ok: false, mensaje: "Escribe un email válido" };
  try {
    // La URL debe estar en Supabase -> Authentication -> URL Configuration -> Redirect URLs.
    const redirectTo = new URL("auth.html?recuperar=1", window.location.href).href;
    const { error } = await supabase.auth.resetPasswordForEmail(String(email).trim(), { redirectTo });
    if (error) return { ok: false, mensaje: traducirError(error) };
    return { ok: true };
  } catch (e) {
    return { ok: false, mensaje: traducirError(e) };
  }
}

export async function cambiarContrasena(nuevaPassword) {
  if (String(nuevaPassword || "").length < MIN_PASSWORD) {
    return { ok: false, mensaje: "La contraseña debe tener al menos 8 caracteres" };
  }
  try {
    const { error } = await supabase.auth.updateUser({ password: nuevaPassword });
    if (error) return { ok: false, mensaje: traducirError(error) };
    return { ok: true };
  } catch (e) {
    return { ok: false, mensaje: traducirError(e) };
  }
}

export async function redirigirSegunRol(perfil = null) {
  const p = perfil || (await obtenerPerfil({ forzar: true }));
  if (!p) return false;
  window.location.href = RUTA_POR_ROL[p.rol] || "mundos.html";
  return true;
}

// ---------- Protección de páginas ----------

export async function protegerPagina(
  rolesPermitidos = ["estudiante", "profesor", "admin", "super_root"],
  { rutaSiNoPermitido = null } = {}
) {
  if (!configuracionValida) {
    document.body.innerHTML =
      '<p style="padding:2rem;font-family:sans-serif">Falta configurar Supabase: copia <code>.env.example</code> a <code>.env</code>, rellena las claves y reinicia el servidor.</p>';
    return null;
  }

  const user = await obtenerUsuarioActual();
  if (!user) {
    window.location.href = "auth.html";
    return null;
  }

  const perfil = await obtenerPerfil({ forzar: true });
  if (!perfil) {
    await supabase.auth.signOut();
    window.location.href = "auth.html?error=perfil";
    return null;
  }

  if (!rolesPermitidos.includes(perfil.rol)) {
    window.location.href = rutaSiNoPermitido || RUTA_POR_ROL[perfil.rol] || "auth.html";
    return null;
  }

  // Si la sesión se cierra en otra pestaña o expira, volver a la landing.
  supabase.auth.onAuthStateChange((evento) => {
    if (evento === "SIGNED_OUT") window.location.href = "auth.html";
  });

  return perfil;
}

// Comprobación extra para operaciones sensibles del panel admin: no se fía
// del perfil guardado en memoria, vuelve a preguntar al servidor.
export async function exigirAdmin() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) throw new Error("Tu sesión terminó. Inicia sesión de nuevo");
  const perfil = await obtenerPerfil({ forzar: true });
  if (!esRolAdmin(perfil?.rol)) throw new Error("Esta acción solo puede hacerla un administrador");
  return perfil;
}

export function actualizarNombreEnMemoria(nombre) {
  if (perfilEnMemoria) perfilEnMemoria = { ...perfilEnMemoria, nombre };
}
