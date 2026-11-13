// menuUsuario.js
// Navegación dinámica de la página de inicio (index.html).
//   · SIN sesión: se ve «Iniciar sesión» / «Empezar a jugar» (como siempre).
//   · CON sesión: se oculta «Iniciar sesión» y aparece «Hola, <nombre>» con un menú desplegable:
//     Mi perfil · Jugar · Cerrar sesión.
// La lógica de DOM no sabe nada de Supabase: landing.js le inyecta cómo leer la sesión y cómo cerrarla,
// así se puede probar con una sesión de mentira.

const NOMBRE_RESPALDO = "jugador";

/** Mejor nombre disponible: el del perfil, el de la cuenta (Google/GitHub) o la parte local del correo. */
export function nombreParaMostrar({ perfil = null, usuario = null } = {}) {
  const meta = usuario?.user_metadata || {};
  const candidato = perfil?.nombre || meta.nombre || meta.full_name || meta.name || meta.user_name || usuario?.email?.split("@")[0] || "";
  const limpio = String(candidato).trim();
  return limpio || NOMBRE_RESPALDO;
}

/** Primera letra para el avatar. */
export function inicialDe(nombre) {
  const letra = String(nombre || "").trim().charAt(0);
  return (letra || "?").toLocaleUpperCase("es");
}

/**
 * @param {object} o
 * @param {()=>Promise<{user:object}|null>} o.obtenerSesion  devuelve la sesión activa o null
 * @param {()=>Promise<object|null>} [o.obtenerPerfil]       perfil de la tabla `perfiles` (opcional)
 * @param {()=>Promise<void>|void} o.cerrarSesion            cierra la sesión (y recarga la página)
 * @param {Document} [o.documento]
 * @returns {Promise<"sesion"|"invitado">}
 */
export async function iniciarNavInicio({ obtenerSesion, obtenerPerfil = async () => null, cerrarSesion, documento = document }) {
  const raiz = documento.getElementById("nav-auth");
  let sesion = null;
  try {
    sesion = await obtenerSesion();
  } catch {
    sesion = null; // si no se puede leer la sesión, se muestra el estado de invitado
  }

  const mostrar = (estado) => {
    documento.querySelectorAll('[data-auth="invitado"]').forEach((el) => {
      el.hidden = estado === "sesion";
    });
    documento.querySelectorAll('[data-auth="sesion"]').forEach((el) => {
      el.hidden = estado !== "sesion";
    });
    if (raiz) raiz.dataset.estado = estado;
  };

  if (!sesion?.user) {
    mostrar("invitado");
    return "invitado";
  }

  let perfil = null;
  try {
    perfil = await obtenerPerfil();
  } catch {
    perfil = null;
  }
  const nombre = nombreParaMostrar({ perfil, usuario: sesion.user });
  documento.getElementById("menu-usuario-nombre").textContent = nombre;
  documento.getElementById("menu-usuario-avatar").textContent = inicialDe(nombre);
  mostrar("sesion");

  const boton = documento.getElementById("menu-usuario-boton");
  const lista = documento.getElementById("menu-usuario-lista");
  const fijar = (abierto, { devolverFoco = false } = {}) => {
    lista.hidden = !abierto;
    boton.setAttribute("aria-expanded", String(abierto));
    if (abierto) lista.querySelector("a, button")?.focus();
    else if (devolverFoco) boton.focus();
  };
  boton.addEventListener("click", () => fijar(lista.hidden));
  documento.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !lista.hidden) fijar(false, { devolverFoco: true });
  });
  documento.addEventListener("click", (e) => {
    if (!lista.hidden && !e.target.closest(".menu-usuario")) fijar(false);
  });
  documento.getElementById("menu-usuario-salir").addEventListener("click", async (e) => {
    e.currentTarget.disabled = true;
    await cerrarSesion();
  });
  return "sesion";
}
