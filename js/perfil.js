// perfil.js
// Pantalla de perfil: el usuario ve su propio progreso. Las consultas
// filtran por user_id y además las políticas RLS impiden leer datos ajenos.

import { supabase } from "./supabase.js";
import { protegerPagina, cerrarSesion, cambiarContrasena, obtenerPerfil, actualizarNombreEnMemoria, mensajeRpc } from "./auth.js";
import { renderizarNav } from "./nav.js";
import { catalogo } from "./game/catalogo.js";
import { calcularResumen, contarErrores } from "./persistence/progreso.js";
import { cargarJugador, cargarFases, cargarUltimasEjecuciones, cargarCodigosError } from "./datos.js";
import { renderResumen, renderMundos, renderTablaNiveles, renderGraficos, renderEjecuciones } from "./ui/vistaProgreso.js";
import { notificar, confirmar } from "./ui/avisos.js";
import { escaparHtml, formatearDia, esRolAdmin, ETIQUETA_ROL } from "./util.js";

const $ = (id) => document.getElementById(id);

function pintarDatosUsuario(perfil) {
  const fila = (t, v) => `<div><dt>${escaparHtml(t)}</dt><dd>${v}</dd></div>`;
  $("datos-usuario").innerHTML =
    fila("Nombre", escaparHtml(perfil.nombre)) +
    fila("Email", escaparHtml(perfil.email)) +
    fila("Rol", `<span class="etiqueta-estado">${escaparHtml(ETIQUETA_ROL[perfil.rol] || perfil.rol)}</span>`) +
    fila("Fecha de registro", escaparHtml(formatearDia(perfil.fechaRegistro)));
  $("campo-nombre").value = perfil.nombre || "";
}

async function cargarProgreso(perfil) {
  try {
    const [jugador, filas, ejecuciones, errores] = await Promise.all([
      cargarJugador(perfil.user_id),
      cargarFases(perfil.user_id),
      cargarUltimasEjecuciones(perfil.user_id, 10),
      cargarCodigosError(perfil.user_id),
    ]);
    const resumen = calcularResumen(filas, catalogo);
    renderResumen($("progreso-general"), resumen, jugador);
    renderMundos($("progreso-mundos"), resumen);
    renderGraficos($("graficos"), resumen, contarErrores(errores, 5));
    renderTablaNiveles($("progreso-niveles"), resumen);
    renderEjecuciones($("ultimas-ejecuciones"), ejecuciones);
  } catch (e) {
    console.error(e);
    const caja = $("perfil-error");
    caja.textContent = "No se pudo cargar tu progreso. Revisa tu conexión e inténtalo de nuevo.";
    caja.classList.remove("oculto");
    $("progreso-general").innerHTML = '<p class="texto-vacio">Sin datos.</p>';
  }
}

// ---------- Acciones ----------

$("form-nombre").addEventListener("submit", async (e) => {
  e.preventDefault();
  const nombre = $("campo-nombre").value.trim();
  if (!nombre) return notificar("Escribe un nombre", "error");
  if (nombre.length > 60) return notificar("El nombre es demasiado largo (máximo 60 caracteres)", "error");

  const boton = $("btn-nombre");
  boton.disabled = true;
  const perfil = await obtenerPerfil();
  const { data, error } = await supabase
    .from("perfiles")
    .update({ nombre })
    .eq("user_id", perfil.user_id)
    .select();
  boton.disabled = false;

  // Con RLS, un UPDATE bloqueado no da error: simplemente no toca filas.
  if (error || !data?.length) {
    console.error(error);
    return notificar("No se pudo cambiar el nombre. Inténtalo de nuevo", "error");
  }
  actualizarNombreEnMemoria(nombre);
  const nuevo = await obtenerPerfil();
  pintarDatosUsuario(nuevo);
  await renderizarNav("nav", nuevo);
  notificar("Nombre actualizado");
});

$("form-password").addEventListener("submit", async (e) => {
  e.preventDefault();
  const nueva = $("campo-password").value;
  if (nueva.length < 8) return notificar("La contraseña debe tener al menos 8 caracteres", "error");
  if (nueva !== $("campo-confirmacion").value) return notificar("La contraseña y su confirmación no coinciden", "error");

  const boton = $("btn-password");
  boton.disabled = true;
  const r = await cambiarContrasena(nueva);
  boton.disabled = false;
  if (!r.ok) return notificar(r.mensaje, "error");
  $("form-password").reset();
  notificar("Contraseña actualizada");
});

$("btn-salir").addEventListener("click", cerrarSesion);

// ---------- Clases (alumnos) ----------

async function cargarClases() {
  const cont = $("lista-clases");
  const { data, error } = await supabase.rpc("mis_clases");
  if (error) {
    cont.innerHTML = `<p class="texto-vacio">${escaparHtml(mensajeRpc(error, "No se pudieron cargar tus clases."))}</p>`;
    return;
  }
  if (!data.length) {
    cont.innerHTML = '<p class="texto-vacio">Todavía no estás en ninguna clase. Pide el código a tu profesor.</p>';
    return;
  }
  cont.innerHTML = `<ul class="lista-clases">${data
    .map(
      (c) => `<li>
      <span><strong>${escaparHtml(c.nombre)}</strong><br /><small class="texto-vacio">Profesor: ${escaparHtml(c.profesor_nombre || "—")}</small></span>
      <button class="boton boton-secundario boton-chico" type="button" data-salir="${escaparHtml(c.clase_id)}">Salir</button>
    </li>`
    )
    .join("")}</ul>`;
}

$("lista-clases").addEventListener("click", async (e) => {
  const id = e.target.closest("[data-salir]")?.dataset.salir;
  if (!id) return;
  const ok = await confirmar({ titulo: "Salir de la clase", lineas: ["Tu profesor dejará de ver tu progreso."], etiquetaOk: "Salir" });
  if (!ok) return;
  const { error } = await supabase.rpc("salir_de_clase", { p_clase_id: id });
  if (error) return notificar(mensajeRpc(error), "error");
  notificar("Saliste de la clase");
  cargarClases();
});

$("form-unirme").addEventListener("submit", async (e) => {
  e.preventDefault();
  const codigo = $("campo-codigo").value.trim();
  if (!codigo) return notificar("Escribe el código de clase", "error");
  const boton = $("btn-unirme");
  boton.disabled = true;
  const { data, error } = await supabase.rpc("unirse_a_clase", { p_codigo: codigo });
  boton.disabled = false;
  if (error) return notificar(mensajeRpc(error), "error");
  $("campo-codigo").value = "";
  notificar(`Te uniste a "${data.nombre}"`);
  cargarClases();
});

// ---------- Zona de peligro ----------

$("btn-borrar-progreso").addEventListener("click", async () => {
  const ok = await confirmar({
    titulo: "Borrar mi progreso",
    lineas: ["Esta acción eliminará todas tus estrellas, niveles y ejecuciones. No se puede deshacer."],
    palabraClave: "BORRAR",
    etiquetaOk: "Borrar todo mi progreso",
    peligro: true,
  });
  if (!ok) return;

  const perfil = await obtenerPerfil();
  const boton = $("btn-borrar-progreso");
  boton.disabled = true;
  const { error } = await supabase.rpc("alumno_borrar_progreso");
  if (error) {
    boton.disabled = false;
    return notificar(mensajeRpc(error, "No se pudo borrar tu progreso"), "error");
  }
  // Limpiar también la copia local y la cola de envíos pendientes de este
  // navegador; si no, el juego volvería a subir el progreso viejo.
  try {
    localStorage.removeItem(`codequest:progreso:v2:${perfil.user_id}`);
    localStorage.removeItem(`codequest:pendientes:v1:${perfil.user_id}`);
  } catch {
    /* sin localStorage no hay nada que limpiar */
  }
  notificar("Progreso borrado");
  setTimeout(() => window.location.reload(), 900);
});

// ---------- Arranque ----------

(async function iniciar() {
  const perfil = await protegerPagina();
  if (!perfil) return;
  await renderizarNav("nav", perfil);
  pintarDatosUsuario(perfil);

  // Admin y super_root no juegan con su cuenta: sin zona de peligro.
  if (esRolAdmin(perfil.rol)) $("zona-peligro").classList.add("oculto");
  if (perfil.rol === "estudiante") {
    $("seccion-clases").classList.remove("oculto");
    cargarClases();
  }
  await cargarProgreso(perfil);
})();
