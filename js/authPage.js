// authPage.js
// Página de acceso: login, registro (alumno o profesor, con código de clase
// opcional), recuperación de contraseña y redirección si ya hay sesión.

import { supabase, configuracionValida } from "./supabase.js";
import {
  iniciarSesion,
  registrarUsuario,
  recuperarContrasena,
  cambiarContrasena,
  validarRegistro,
  obtenerUsuarioActual,
  obtenerPerfil,
  redirigirSegunRol,
} from "./auth.js";
import { DOMINIO_INSTITUCIONAL } from "./config.js";
import { validarEmail } from "./util.js";

const $ = (id) => document.getElementById(id);
const el = {
  mensaje: $("auth-mensaje"),
  pestanaLogin: $("pestana-login"),
  pestanaRegistro: $("pestana-registro"),
  login: $("panel-login"),
  registro: $("panel-registro"),
  recuperar: $("panel-recuperar"),
  nueva: $("panel-nueva"),
};

if (DOMINIO_INSTITUCIONAL) {
  $("ayuda-dominio").textContent = `(correo institucional @${DOMINIO_INSTITUCIONAL})`;
}

// ---------- Mensajes y estados ----------

function mostrarMensaje(texto, tipo = "error") {
  el.mensaje.textContent = texto;
  el.mensaje.className = `mensaje-form ${tipo === "ok" ? "mensaje-ok" : "mensaje-error"}`;
}

function limpiarMensaje() {
  el.mensaje.className = "mensaje-form oculto";
  el.mensaje.textContent = "";
}

function ocupado(boton, estaOcupado, textoOcupado) {
  if (estaOcupado) {
    boton.dataset.texto = boton.textContent;
    boton.textContent = textoOcupado;
  } else if (boton.dataset.texto) {
    boton.textContent = boton.dataset.texto;
  }
  boton.disabled = estaOcupado;
}

// ---------- Pestañas ----------

function mostrarPanel(cual) {
  limpiarMensaje();
  const enLogin = cual === "login";
  const enRegistro = cual === "registro";
  el.login.classList.toggle("oculto", !enLogin);
  el.registro.classList.toggle("oculto", !enRegistro);
  el.recuperar.classList.toggle("oculto", cual !== "recuperar");
  el.nueva.classList.toggle("oculto", cual !== "nueva");

  document.querySelector(".auth-pestanas").classList.toggle("oculto", !(enLogin || enRegistro));
  el.pestanaLogin.classList.toggle("activa", enLogin);
  el.pestanaRegistro.classList.toggle("activa", enRegistro);
  el.pestanaLogin.setAttribute("aria-selected", String(enLogin));
  el.pestanaRegistro.setAttribute("aria-selected", String(enRegistro));
}

el.pestanaLogin.addEventListener("click", () => mostrarPanel("login"));
el.pestanaRegistro.addEventListener("click", () => mostrarPanel("registro"));
$("btn-olvide").addEventListener("click", () => {
  mostrarPanel("recuperar");
  $("recuperar-email").value = $("login-email").value;
  $("recuperar-email").focus();
});
$("btn-volver-login").addEventListener("click", () => mostrarPanel("login"));

// El código de clase solo aplica a alumnos.
const rolElegido = () => el.registro.querySelector('input[name="rol"]:checked').value;
el.registro.querySelectorAll('input[name="rol"]').forEach((r) =>
  r.addEventListener("change", () => $("campo-codigo").classList.toggle("oculto", rolElegido() !== "estudiante"))
);

// ---------- Login ----------

el.login.addEventListener("submit", async (e) => {
  e.preventDefault();
  limpiarMensaje();
  const email = $("login-email").value.trim();
  const password = $("login-password").value;
  if (!validarEmail(email)) return mostrarMensaje("Escribe un email válido");
  if (!password) return mostrarMensaje("Escribe tu contraseña");

  const boton = $("btn-login");
  ocupado(boton, true, "Entrando…");
  const r = await iniciarSesion(email, password);
  if (!r.ok) {
    ocupado(boton, false);
    return mostrarMensaje(r.mensaje);
  }
  await redirigirSegunRol(r.perfil);
});

// ---------- Registro ----------

el.registro.addEventListener("submit", async (e) => {
  e.preventDefault();
  limpiarMensaje();
  const datos = {
    rol: rolElegido(),
    nombre: $("registro-nombre").value,
    email: $("registro-email").value,
    password: $("registro-password").value,
    confirmacion: $("registro-confirmacion").value,
  };
  const problema = validarRegistro(datos);
  if (problema) return mostrarMensaje(problema);

  const boton = $("btn-registro");
  ocupado(boton, true, "Creando cuenta…");
  const r = await registrarUsuario(datos.nombre, datos.email, datos.password, {
    rol: datos.rol,
    codigoClase: datos.rol === "estudiante" ? $("registro-codigo").value : "",
  });
  if (!r.ok) {
    ocupado(boton, false);
    return mostrarMensaje(r.mensaje);
  }

  if (r.requiereConfirmacion) {
    // Supabase exige confirmar el email: el rol y el código se aplican al primer ingreso.
    ocupado(boton, false);
    mostrarPanel("login");
    $("login-email").value = datos.email.trim();
    return mostrarMensaje("Cuenta creada. Revisa tu correo y confirma tu email para poder entrar.", "ok");
  }

  if (r.aviso) {
    // La cuenta existe, pero el código de clase no sirvió: se explica antes de continuar.
    mostrarMensaje(`Tu cuenta se creó, pero no pudimos unirte a la clase: ${r.aviso} Puedes intentarlo de nuevo desde tu perfil.`, "ok");
    return setTimeout(() => redirigirSegunRol(), 3500);
  }
  await redirigirSegunRol();
});

// ---------- Recuperar contraseña ----------

el.recuperar.addEventListener("submit", async (e) => {
  e.preventDefault();
  limpiarMensaje();
  const boton = $("btn-recuperar");
  ocupado(boton, true, "Enviando…");
  const r = await recuperarContrasena($("recuperar-email").value);
  ocupado(boton, false);
  if (!r.ok) return mostrarMensaje(r.mensaje);
  mostrarMensaje("Si ese email tiene una cuenta, te enviamos un enlace para cambiar la contraseña.", "ok");
});

// ---------- Nueva contraseña (tras abrir el enlace del correo) ----------

el.nueva.addEventListener("submit", async (e) => {
  e.preventDefault();
  limpiarMensaje();
  const nueva = $("nueva-password").value;
  if (nueva.length < 8) return mostrarMensaje("La contraseña debe tener al menos 8 caracteres");
  if (nueva !== $("nueva-confirmacion").value) return mostrarMensaje("La contraseña y su confirmación no coinciden");

  const boton = $("btn-nueva");
  ocupado(boton, true, "Guardando…");
  const r = await cambiarContrasena(nueva);
  if (!r.ok) {
    ocupado(boton, false);
    return mostrarMensaje(r.mensaje);
  }
  mostrarMensaje("Contraseña actualizada. Te llevamos al juego…", "ok");
  setTimeout(() => redirigirSegunRol(), 900);
});

// ---------- Arranque ----------

(async function iniciar() {
  if (!configuracionValida) {
    mostrarMensaje("Falta configurar Supabase (.env). Revisa el README.");
    return;
  }

  const params = new URLSearchParams(window.location.search);
  if (params.get("error") === "perfil") mostrarMensaje("No encontramos tu perfil. Contacta al administrador.");
  if (params.get("modo") === "registro" || window.location.hash === "#registro") mostrarPanel("registro");

  // Llegada desde el enlace de recuperación: no redirigir, pedir la nueva contraseña.
  const enRecuperacion = params.get("recuperar") === "1" || window.location.hash.includes("type=recovery");
  if (enRecuperacion) {
    supabase.auth.onAuthStateChange((evento) => {
      if (evento === "PASSWORD_RECOVERY" || evento === "SIGNED_IN") mostrarPanel("nueva");
    });
    if (await obtenerUsuarioActual()) mostrarPanel("nueva");
    else mostrarMensaje("Abriendo el enlace de recuperación…", "ok");
    return;
  }

  // Sesión ya activa: ir directo a la página que corresponde al rol.
  if ((await obtenerUsuarioActual()) && (await obtenerPerfil({ forzar: true }))) {
    await redirigirSegunRol();
  }
})();
