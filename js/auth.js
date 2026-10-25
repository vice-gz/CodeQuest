// auth.js
// Autenticación con Supabase Auth + lectura del perfil (rol). Las funciones
// que pueden fallar por culpa del usuario (login, registro, recuperar...)
// devuelven { ok, mensaje } con un texto educativo en español; nunca se
// muestran errores técnicos de Supabase en pantalla.

import { supabase, configuracionValida } from "./supabase.js";
import { validarEmail, esRolAdmin } from "./util.js";
import { correoEsInstitucional, DOMINIO_INSTITUCIONAL } from "./config.js";

export const RUTA_POR_ROL = {
  estudiante: "juego.html",
  profesor: "perfil.html",
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
  window.location.href = RUTA_POR_ROL[p.rol] || "juego.html";
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
