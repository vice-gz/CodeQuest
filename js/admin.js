// admin.js
// Panel de administración. Solo entran admin y super_root (protegerPagina) y cada
// operación sensible vuelve a comprobarlo contra el servidor (exigirAdmin).
// Aun así, quien manda es la base de datos: las políticas RLS y las
// funciones SQL de supabase/avance2.sql rechazan a quien no sea admin.

import { supabase, HOST_SUPABASE } from "./supabase.js";
import { protegerPagina, exigirAdmin, mensajeRpc } from "./auth.js";
import { renderizarNav } from "./nav.js";
import { catalogo } from "./game/catalogo.js";
import { calcularResumen, agruparFilasPorUsuario } from "./persistence/progreso.js";
import { traerTodo, cargarJugador, cargarFases, cargarUltimasEjecuciones, cargarCodigosError, COL_FECHA } from "./datos.js";
import {
  renderResumen as renderResumenProgreso,
  renderMundos,
  renderTablaNiveles,
  renderGraficos,
  renderEjecuciones,
} from "./ui/vistaProgreso.js";
import {
  FILTRO_TODOS,
  FILTRO_SIN_GRUPO,
  DIAS_GRAFICA,
  construirMembresias,
  valorFiltroClase,
  claseDeFiltro,
  usuariosDelFiltro,
  alumnosDelFiltro,
  calcularKpis,
  topErrores,
  alumnosPorMundo,
  ejecucionesPorDia,
  diaLocal,
  agregarEjecuciones,
} from "./ui/dashboardDatos.js";
import { crearGraficas } from "./ui/dashboardGraficas.js";
import { nombreError, NOMBRES_ERROR } from "./ui/erroresCatalogo.js";
import { notificar, confirmar } from "./ui/avisos.js";
import { construirCsv, agregarErroresPorUsuario, erroresDesdeRpc } from "./ui/exportarCsv.js";
import { escaparHtml, formatearFecha, formatearDia, fechaRelativa, ETIQUETA_ROL } from "./util.js";

const $ = (id) => document.getElementById(id);
const DIAS_ACTIVO = 7;
const LIMITE_IDS_FILTRO = 150;

let yo = null; // perfil del admin conectado
let usuarios = []; // [{id, nombre, email, rol, ...}]
let resumenes = new Map(); // userId -> resumen de progreso
let funcionesSql = { listar: true };
// Dashboard y filtro por grupo (supabase/avance3_3.sql)
let grupos = []; // [{id, nombre, codigo, profesor, alumnos}]
let membresias = construirMembresias([]);
let gruposDisponibles = false; // ¿están instaladas admin_grupos / admin_inscripciones?
let datosDash = { usuarios: [], errores: [], dias: [] }; // resumen de ejecuciones (ver dashboardDatos.js)
let dashDesdeSql = false; // true = lo calculó la base de datos
let filtro = FILTRO_TODOS; // «todos» | «sin_grupo» | «clase:<id>»
let seccionActual = "resumen";
let graficas = null; // las 3 gráficas de Chart.js (null si Chart.js no cargó)
const zonaHoraria = () => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
let detalleAbiertoId = null;
let paginaEjecuciones = 0;

const tamanoPagina = () => Number(localStorage.getItem("codequest:admin:tamano")) || 25;
const nombrePorId = () => new Map(usuarios.map((u) => [u.id, u.nombre]));

// ---------- Reglas de quién puede tocar a quién (las impone también el servidor) ----------
const soyElSuperRoot = () => yo.rol === "super_root";

function motivoBloqueo(u) {
  if (u.rol === "super_root") return "Un Super Root no puede ser modificado desde aquí.";
  if (u.id === yo.user_id) return "No puedes modificar tu propia cuenta desde aquí.";
  if (u.rol === "admin" && !soyElSuperRoot()) return "Solo un Super Root puede modificar a otro administrador.";
  return "";
}

function opcionesRol(u) {
  const roles = ["estudiante", "profesor"];
  if (soyElSuperRoot()) roles.push("admin");
  if (!roles.includes(u.rol)) roles.push(u.rol); // p. ej. super_root: se muestra, pero bloqueado
  return roles
    .map((r) => `<option value="${r}"${r === u.rol ? " selected" : ""}>${escaparHtml(ETIQUETA_ROL[r] || r)}</option>`)
    .join("");
}

function mostrarAviso(texto) {
  const a = $("admin-aviso");
  a.textContent = texto;
  a.classList.toggle("oculto", !texto);
}

const funcionFaltante = (e) =>
  e && (e.code === "PGRST202" || e.code === "42883" || /could not find the function|does not exist/i.test(e.message || ""));

// ---------- Carga de datos ----------

async function cargarUsuarios() {
  const { data, error } = await supabase.rpc("admin_listar_usuarios");
  if (!error) {
    funcionesSql.listar = true;
    return data.map((r) => ({
      id: r.usuario_id,
      nombre: r.nombre,
      email: r.email,
      rol: r.rol,
      fechaRegistro: r.fecha_registro,
      ultimoAcceso: r.ultimo_acceso,
      mundo: r.mundo_actual ?? 1,
      nivel: r.nivel_actual ?? 1,
      experiencia: r.experiencia ?? 0,
      ultimaActividad: r.ultima_actividad,
    }));
  }
  if (!funcionFaltante(error)) throw error;

  // Sin la función SQL: se lee lo que permite RLS (sin emails).
  funcionesSql.listar = false;
  const [perfiles, jugadores] = await Promise.all([
    traerTodo(() => supabase.from("perfiles").select("*").order("user_id")),
    traerTodo(() => supabase.from("progreso_jugador").select("*").order("user_id")),
  ]);
  const jug = new Map(jugadores.map((j) => [j.user_id, j]));
  return perfiles.map((p) => ({
    id: p.user_id,
    nombre: p.nombre,
    email: "—",
    rol: p.rol,
    fechaRegistro: p.created_at || null,
    ultimoAcceso: null,
    mundo: jug.get(p.user_id)?.mundo_actual ?? 1,
    nivel: jug.get(p.user_id)?.nivel_actual ?? 1,
    experiencia: jug.get(p.user_id)?.experiencia ?? 0,
    ultimaActividad: jug.get(p.user_id)?.updated_at || null,
  }));
}

async function cargarResumenResumenes() {
  const filas = await traerTodo(() =>
    supabase.from("progreso_fases").select("*").order("user_id").order("nivel_id").order("fase_id")
  );
  const porUsuario = agruparFilasPorUsuario(filas);
  resumenes = new Map();
  usuarios.forEach((u) => resumenes.set(u.id, calcularResumen(porUsuario.get(u.id) || [], catalogo)));
}

// ---------- Grupos y datos del dashboard ----------

async function cargarGrupos() {
  try {
    const [g, inscripciones] = await Promise.all([
      supabase.rpc("admin_grupos"),
      // Más de 1000 filas llegan por páginas (límite de Supabase por consulta).
      traerTodo(() => supabase.rpc("admin_inscripciones")),
    ]);
    if (g.error) throw g.error;
    gruposDisponibles = true;
    grupos = g.data.map((r) => ({ id: r.clase_id, nombre: r.nombre, codigo: r.codigo_acceso, profesor: r.profesor_nombre, alumnos: r.alumnos }));
    membresias = construirMembresias(inscripciones);
  } catch (e) {
    gruposDisponibles = false;
    grupos = [];
    membresias = construirMembresias([]);
    if (!funcionFaltante(e)) console.warn("No se pudieron cargar los grupos:", e.message || e);
  }
}

async function cargarDatosDashboard() {
  const zona = zonaHoraria();
  try {
    const { data, error } = await supabase.rpc("admin_dashboard_datos", { p_dias: DIAS_GRAFICA, p_zona: zona });
    if (!error && data) {
      dashDesdeSql = true;
      datosDash = data;
      return;
    }
    if (error && !funcionFaltante(error)) throw error;
    // Sin la función SQL: mismo resumen, calculado aquí con las filas de ejecuciones (más lento).
    dashDesdeSql = false;
    const filas = await traerTodo(() => supabase.from("ejecuciones").select("user_id,resultado,codigo_error,created_at").order(COL_FECHA));
    datosDash = agregarEjecuciones(filas, { dias: DIAS_GRAFICA, zona });
  } catch (e) {
    console.error(e);
    datosDash = { usuarios: [], errores: [], dias: [] };
    $("graficas-aviso").textContent = "No se pudo cargar el resumen de ejecuciones. Revisa tu conexión y los permisos.";
    $("graficas-aviso").classList.remove("oculto");
  }
}

// ---------- Filtro por grupo ----------

/** Usuarios (tablas y CSV) y alumnos (KPIs y gráficas) que entran en el filtro actual. */
const alcance = () => ({
  usuarios: usuariosDelFiltro(usuarios, filtro, membresias),
  alumnos: alumnosDelFiltro(usuarios, filtro, membresias),
});

const grupoActual = () => grupos.find((g) => g.id === claseDeFiltro(filtro)) || null;

function nombreDelFiltro() {
  if (filtro === FILTRO_SIN_GRUPO) return "Sin grupo asignado";
  return grupoActual()?.nombre || "Todos los usuarios";
}

const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;

function pintarFiltro() {
  const sel = $("filtro-grupos");
  const opciones = [
    '<option value="todos">Todos los usuarios</option>',
    `<option value="sin_grupo"${gruposDisponibles ? "" : " disabled"}>Sin grupo asignado</option>`,
  ];
  if (grupos.length) {
    opciones.push(
      `<optgroup label="Grupos">${grupos
        .map((g) => `<option value="${escaparHtml(valorFiltroClase(g.id))}">${escaparHtml(g.nombre)} (${plural(g.alumnos, "alumno", "alumnos")})</option>`)
        .join("")}</optgroup>`
    );
  }
  sel.innerHTML = opciones.join("");
  // Se conserva la elección si el grupo todavía existe (p. ej. tras «Recargar datos»).
  const sigue = [...sel.options].some((o) => o.value === filtro && !o.disabled);
  filtro = sigue ? filtro : FILTRO_TODOS;
  sel.value = filtro;
}

function pintarDetalleFiltro() {
  const { usuarios: lista, alumnos } = alcance();
  const g = grupoActual();
  let texto;
  if (filtro === FILTRO_SIN_GRUPO) texto = `Alumnos que no están inscritos en ninguna clase: ${alumnos.length}.`;
  else if (g) texto = `Profesor: ${g.profesor || "—"} · código ${g.codigo} · ${plural(alumnos.length, "alumno", "alumnos")}.`;
  else texto = `Cuentan ${plural(alumnos.length, "alumno", "alumnos")} (${lista.length} cuentas; profesores y administradores no entran en los KPIs ni en las gráficas).`;
  if (!gruposDisponibles) texto += " Para filtrar por grupo ejecuta supabase/avance3_3.sql en Supabase.";
  $("filtro-detalle").textContent = texto;
  $("exportar-detalle").textContent = `Se exportarán ${plural(lista.length, "usuario", "usuarios")} de: ${nombreDelFiltro()}.`;
}

// ---------- Dashboard (KPIs + gráficas) ----------

function kpi(titulo, valor, detalle) {
  return `<div class="kpi-tarjeta"><span class="kpi-titulo">${escaparHtml(titulo)}</span><span class="kpi-valor">${valor}</span><span class="kpi-detalle">${escaparHtml(detalle)}</span></div>`;
}

const numero = (n, decimales = 0) => Number(n).toLocaleString("es-MX", { maximumFractionDigits: decimales, minimumFractionDigits: decimales });

function pintarDashboard() {
  const { alumnos } = alcance();
  const k = calcularKpis(alumnos, resumenes, datosDash);
  const maxEstrellas = catalogo.totalNiveles * 3;

  $("kpis").innerHTML =
    kpi("Total de alumnos", numero(k.alumnos), nombreDelFiltro()) +
    kpi("Estrellas promedio", `<span class="texto-ambar">★</span> ${numero(k.estrellasPromedio, 1)}`, `por alumno, de ${maxEstrellas} posibles`) +
    kpi("Ejecuciones totales", numero(k.ejecuciones), "veces que se ejecutó código") +
    kpi("Tasa de éxito", k.tasaExito === null ? "—" : `${numero(k.tasaExito, 1)}%`, k.tasaExito === null ? "aún sin ejecuciones" : `${numero(k.exitos)} de ${numero(k.ejecuciones)} ejecuciones lograron el objetivo`);

  graficas?.actualizar({
    errores: topErrores(alumnos, datosDash, 5),
    mundos: alumnosPorMundo(alumnos, Object.values(catalogo.mundos).map((m) => m.id)).map((m) => ({ ...m, nombre: catalogo.mundos[m.mundo].nombre })),
    dias: ejecucionesPorDia(alumnos, datosDash, diaLocal(Date.now(), zonaHoraria()), DIAS_GRAFICA),
  });
}

/** Cambió el filtro: se actualiza TODO (KPIs, gráficas, tablas, selector de ejecuciones y exportación). */
function aplicarFiltro() {
  pintarDetalleFiltro();
  pintarDashboard();
  pintarUsuarios();
  poblarSelectoresEjecuciones();
  paginaEjecuciones = 0;
  if (seccionActual === "ejecuciones") cargarEjecuciones();
}

$("filtro-grupos").addEventListener("change", (e) => {
  filtro = e.target.value;
  aplicarFiltro();
});

function mostrarAvisosSql() {
  const avisos = [];
  if (!funcionesSql.listar) avisos.push("Faltan las funciones SQL del Avance 2 (supabase/avance2.sql): sin ellas no se muestran los emails.");
  if (!gruposDisponibles || !dashDesdeSql) avisos.push("Para filtrar por grupo y acelerar el dashboard ejecuta supabase/avance3_3.sql en Supabase.");
  mostrarAviso(avisos.join(" "));
}

// ---------- Listado de usuarios ----------

function usuariosFiltrados() {
  const q = $("f-busqueda").value.trim().toLowerCase();
  const rol = $("f-rol").value;
  const mundo = $("f-mundo").value;
  const act = $("f-actividad").value;
  const limite = Date.now() - DIAS_ACTIVO * 86400000;

  return alcance().usuarios.filter((u) => {
    if (q && !`${u.nombre} ${u.email}`.toLowerCase().includes(q)) return false;
    if (rol && u.rol !== rol) return false;
    if (mundo && String(u.mundo) !== mundo) return false;
    const reciente = u.ultimaActividad && new Date(u.ultimaActividad).getTime() >= limite;
    if (act === "7" && !reciente) return false;
    if (act === "0" && reciente) return false;
    return true;
  });
}

function pintarUsuarios() {
  const lista = usuariosFiltrados();
  const total = alcance().usuarios.length;
  $("usuarios-conteo").textContent = `${lista.length} de ${total} usuarios${filtro === FILTRO_TODOS ? "" : ` · ${nombreDelFiltro()}`}`;
  if (!lista.length) {
    $("tabla-usuarios").innerHTML = '<p class="texto-vacio">No hay usuarios con esos filtros.</p>';
    return;
  }
  const filas = lista
    .map((u) => {
      const esYo = u.id === yo.user_id;
      const estrellas = resumenes.get(u.id)?.totales.estrellas ?? 0;
      const motivo = motivoBloqueo(u);
      const bloq = motivo ? " disabled" : "";
      return `<tr data-id="${escaparHtml(u.id)}">
        <td>${escaparHtml(u.nombre)}${esYo ? ' <span class="etiqueta-estado">tú</span>' : ""}</td>
        <td>${escaparHtml(u.email)}</td>
        <td><span class="etiqueta-estado">${escaparHtml(ETIQUETA_ROL[u.rol] || u.rol)}</span></td>
        <td>${escaparHtml(u.mundo)}</td>
        <td>${escaparHtml(u.nivel)}</td>
        <td class="texto-ambar">★ ${estrellas}</td>
        <td title="${escaparHtml(formatearFecha(u.ultimaActividad))}">${escaparHtml(fechaRelativa(u.ultimaActividad))}</td>
        <td><div class="celda-acciones" title="${escaparHtml(motivo)}">
          <button class="boton boton-secundario boton-chico" data-accion="detalle" type="button">Ver detalle</button>
          <select class="campo" data-accion="rol" aria-label="Cambiar rol de ${escaparHtml(u.nombre)}"${bloq}>${opcionesRol(u)}</select>
          <button class="boton boton-peligro boton-chico" data-accion="eliminar" type="button"${bloq}>Eliminar</button>
        </div></td>
      </tr>`;
    })
    .join("");

  $("tabla-usuarios").innerHTML = `<div class="tabla-envoltura"><table class="tabla">
    <thead><tr><th>Nombre</th><th>Email</th><th>Rol</th><th>Mundo</th><th>Nivel</th><th>Estrellas</th><th>Última actividad</th><th>Acciones</th></tr></thead>
    <tbody>${filas}</tbody></table></div>`;
}

function prepararFiltroMundos() {
  const sel = $("f-mundo");
  Object.values(catalogo.mundos).forEach((m) => {
    const o = document.createElement("option");
    o.value = String(m.id);
    o.textContent = `Mundo ${m.id} · ${m.nombre}`;
    sel.appendChild(o);
  });
}

$("tabla-usuarios").addEventListener("click", (e) => {
  const boton = e.target.closest("button[data-accion]");
  if (!boton) return;
  const fila = boton.closest("tr");
  const u = usuarios.find((x) => x.id === fila.dataset.id);
  if (!u) return;
  if (boton.dataset.accion === "detalle") abrirDetalle(u.id);
  if (boton.dataset.accion === "eliminar") eliminarUsuario(u);
});

$("tabla-usuarios").addEventListener("change", (e) => {
  if (e.target.dataset.accion !== "rol") return;
  const u = usuarios.find((x) => x.id === e.target.closest("tr").dataset.id);
  if (u) cambiarRol(u, e.target.value);
});

["f-busqueda", "f-rol", "f-mundo", "f-actividad"].forEach((id) =>
  $(id).addEventListener(id === "f-busqueda" ? "input" : "change", pintarUsuarios)
);

// ---------- Acciones sobre usuarios ----------

async function cambiarRol(u, nuevoRol) {
  if (nuevoRol === u.rol) return pintarUsuarios();
  const motivo = motivoBloqueo(u);
  if (motivo) {
    notificar(motivo, "error");
    return pintarUsuarios();
  }
  const ok = await confirmar({
    titulo: "Cambiar rol",
    lineas: [`¿Cambiar el rol de ${u.nombre} de "${ETIQUETA_ROL[u.rol] || u.rol}" a "${ETIQUETA_ROL[nuevoRol] || nuevoRol}"?`],
    etiquetaOk: "Cambiar rol",
  });
  if (!ok) return pintarUsuarios();

  try {
    await exigirAdmin();
    // Función del servidor: valida las reglas de rol y deja registro en auditoría.
    const { error } = await supabase.rpc("admin_cambiar_rol", { p_user_id: u.id, p_rol: nuevoRol });
    if (error) throw error;
    u.rol = nuevoRol;
    notificar(`Rol de ${u.nombre} cambiado a ${ETIQUETA_ROL[nuevoRol] || nuevoRol}`);
  } catch (e) {
    console.error(e);
    notificar(e.code ? mensajeRpc(e, "No se pudo cambiar el rol") : e.message, "error");
  }
  pintarUsuarios();
  if (detalleAbiertoId === u.id) abrirDetalle(u.id);
}

async function resetearProgreso(u) {
  const motivo = motivoBloqueo(u);
  if (motivo) return notificar(motivo, "error");
  const ok = await confirmar({
    titulo: "Resetear progreso",
    lineas: [`¿Resetear el progreso de ${u.nombre}?`],
    consecuencias: [
      "Se borrarán sus fases completadas",
      "Volverá al mundo 1, nivel 1, con 0 de experiencia",
      "Su historial de ejecuciones se conserva",
    ],
    etiquetaOk: "Resetear",
    peligro: true,
  });
  if (!ok) return;

  try {
    await exigirAdmin();
    const { error } = await supabase.rpc("admin_resetear_progreso", { p_user_id: u.id });
    if (error) throw error;

    Object.assign(u, { mundo: 1, nivel: 1, experiencia: 0 });
    resumenes.set(u.id, calcularResumen([], catalogo));
    notificar(`Progreso de ${u.nombre} reiniciado`);
    pintarUsuarios();
    if (detalleAbiertoId === u.id) abrirDetalle(u.id);
    refrescarResumen();
  } catch (e) {
    console.error(e);
    notificar(e.code ? mensajeRpc(e, "No se pudo resetear el progreso") : e.message, "error");
  }
}

async function eliminarUsuario(u) {
  const motivo = motivoBloqueo(u);
  if (motivo) return notificar(motivo, "error");
  const ok = await confirmar({
    titulo: `¿Estás seguro de que quieres eliminar a ${u.nombre}?`,
    lineas: ["Esta acción:"],
    consecuencias: [
      "Borrará su perfil",
      "Borrará todo su progreso",
      "Borrará todas sus ejecuciones",
      ...(u.rol === "profesor" ? ["Borrará las clases que creó"] : []),
      "Es irreversible",
    ],
    palabraClave: "ELIMINAR",
    etiquetaOk: "Eliminar",
    peligro: true,
  });
  if (!ok) return;

  try {
    await exigirAdmin();
    const { error } = await supabase.rpc("admin_eliminar_usuario", { p_user_id: u.id });
    if (error) {
      if (funcionFaltante(error)) {
        return notificar("Falta ejecutar supabase/avance2.sql en tu proyecto para poder eliminar usuarios", "error", 7000);
      }
      throw error;
    }
    cargarAuditoriaSiVisible();
    usuarios = usuarios.filter((x) => x.id !== u.id);
    resumenes.delete(u.id);
    notificar(`Usuario ${u.nombre} eliminado`);
    if (detalleAbiertoId === u.id) cerrarDetalle();
    pintarUsuarios();
    poblarSelectoresEjecuciones();
    refrescarResumen();
  } catch (e) {
    console.error(e);
    notificar(e.code ? mensajeRpc(e, "No se pudo eliminar al usuario") : e.message, "error");
  }
}

// ---------- Detalle de usuario ----------

function cerrarDetalle() {
  detalleAbiertoId = null;
  $("vista-detalle").classList.add("oculto");
  $("vista-lista").classList.remove("oculto");
}

async function abrirDetalle(id) {
  const u = usuarios.find((x) => x.id === id);
  if (!u) return;
  detalleAbiertoId = id;
  $("vista-lista").classList.add("oculto");
  const cont = $("vista-detalle");
  cont.classList.remove("oculto");
  cont.innerHTML = '<p class="texto-vacio">Cargando…</p>';

  try {
    const [jugador, filas, ejecuciones, errores] = await Promise.all([
      cargarJugador(id),
      cargarFases(id),
      cargarUltimasEjecuciones(id, 20),
      cargarCodigosError(id),
    ]);
    if (detalleAbiertoId !== id) return; // el admin cambió de vista mientras cargaba
    const resumen = calcularResumen(filas, catalogo);
    const motivo = motivoBloqueo(u);
    const bloq = motivo ? " disabled" : "";

    cont.innerHTML = `
      <div class="detalle-cabecera">
        <h2>${escaparHtml(u.nombre)}</h2>
        <div class="detalle-acciones" title="${escaparHtml(motivo)}">
          <button class="boton boton-secundario" type="button" id="d-volver">← Volver al listado</button>
          <select class="campo" id="d-rol" aria-label="Cambiar rol"${bloq}>${opcionesRol(u)}</select>
          <button class="boton boton-secundario" type="button" id="d-reset"${bloq}>Resetear progreso</button>
          <button class="boton boton-peligro" type="button" id="d-eliminar"${bloq}>Eliminar usuario</button>
        </div>
      </div>
      <section class="panel"><div class="panel-encabezado"><h2>Datos del usuario</h2></div>
        <dl class="datos-usuario">
          <div><dt>Email</dt><dd>${escaparHtml(u.email)}</dd></div>
          <div><dt>Rol</dt><dd><span class="etiqueta-estado">${escaparHtml(ETIQUETA_ROL[u.rol] || u.rol)}</span></dd></div>
          <div><dt>Registro</dt><dd>${escaparHtml(formatearDia(u.fechaRegistro))}</dd></div>
          <div><dt>Última actividad</dt><dd>${escaparHtml(formatearFecha(u.ultimaActividad))}</dd></div>
        </dl></section>
      <section class="panel detalle-bloque"><div class="panel-encabezado"><h2>Progreso</h2></div>
        <div id="d-general"></div><div class="mundos-progreso" id="d-mundos"></div><div class="graficos" id="d-graficos"></div></section>
      <section class="panel"><div class="panel-encabezado"><h2>Progreso por nivel</h2></div><div id="d-niveles"></div></section>
      <section class="panel"><div class="panel-encabezado"><h2>Últimas 20 ejecuciones</h2></div><div id="d-ejecuciones"></div></section>`;

    renderResumenProgreso($("d-general"), resumen, jugador);
    renderMundos($("d-mundos"), resumen);
    renderGraficos($("d-graficos"), resumen, contarErrores(errores, 5));
    renderTablaNiveles($("d-niveles"), resumen);
    renderEjecuciones($("d-ejecuciones"), ejecuciones);

    $("d-volver").addEventListener("click", cerrarDetalle);
    $("d-rol").addEventListener("change", (e) => cambiarRol(u, e.target.value));
    $("d-reset").addEventListener("click", () => resetearProgreso(u));
    $("d-eliminar").addEventListener("click", () => eliminarUsuario(u));
  } catch (e) {
    console.error(e);
    cont.innerHTML = '<p class="mensaje-form mensaje-error">No se pudo cargar el detalle del usuario.</p><button class="boton boton-secundario" type="button" id="d-volver">← Volver</button>';
    $("d-volver").addEventListener("click", cerrarDetalle);
  }
}

// ---------- Listado de ejecuciones ----------

function llenarSelect(sel, valores, etiquetaFn) {
  const actual = sel.value;
  const primera = sel.options[0];
  sel.innerHTML = "";
  sel.appendChild(primera);
  valores.forEach((v) => {
    const o = document.createElement("option");
    o.value = String(v.valor);
    o.textContent = v.texto;
    sel.appendChild(o);
  });
  if ([...sel.options].some((o) => o.value === actual)) sel.value = actual;
}

function poblarSelectoresEjecuciones() {
  llenarSelect($("e-usuario"), alcance().usuarios.map((u) => ({ valor: u.id, texto: `${u.nombre}${u.email !== "—" ? ` (${u.email})` : ""}` })));
  llenarSelect($("e-mundo"), Object.values(catalogo.mundos).map((m) => ({ valor: m.id, texto: `Mundo ${m.id} · ${m.nombre}` })));
  llenarSelect($("e-codigo"), Object.keys(NOMBRES_ERROR).map((c) => ({ valor: c, texto: nombreError(c) })));
  const conceptos = [...new Set(Object.values(catalogo.niveles).map((n) => n.concepto_evaluado).filter(Boolean))];
  llenarSelect($("e-concepto"), conceptos.map((c) => ({ valor: c, texto: c.replace(/_/g, " ") })));
  actualizarNivelesYFases();
}

function actualizarNivelesYFases() {
  const mundo = $("e-mundo").value;
  const niveles = Object.values(catalogo.niveles)
    .filter((n) => !mundo || String(n.mundo) === mundo)
    .sort((a, b) => a.id - b.id);
  llenarSelect($("e-nivel"), niveles.map((n) => ({ valor: n.id, texto: `Nivel ${n.id} · ${n.nombre}` })));
  const nivel = $("e-nivel").value;
  const fases = niveles.filter((n) => !nivel || String(n.id) === nivel).flatMap((n) => n.fases.map((f) => f.id));
  llenarSelect($("e-fase"), fases.map((f) => ({ valor: f, texto: `Fase ${f}` })));
}

async function cargarEjecuciones() {
  const cont = $("tabla-ejecuciones");
  const tam = tamanoPagina();
  const desde = paginaEjecuciones * tam;

  // Con un grupo seleccionado, solo las ejecuciones de esos alumnos.
  const idsGrupo = filtro === FILTRO_TODOS ? null : alcance().usuarios.map((u) => u.id);
  if (idsGrupo && !idsGrupo.length) {
    cont.innerHTML = '<p class="texto-vacio">No hay alumnos en este grupo, así que no hay ejecuciones.</p>';
    $("paginacion-ejecuciones").innerHTML = "";
    return;
  }
  const demasiados = idsGrupo && idsGrupo.length > LIMITE_IDS_FILTRO; // la dirección de la consulta tendría que llevar cientos de ids
  let q = supabase.from("ejecuciones").select("*", { count: "exact" });
  if (idsGrupo && !demasiados) q = q.in("user_id", idsGrupo);
  const f = {
    user_id: $("e-usuario").value,
    mundo_id: $("e-mundo").value,
    nivel_id: $("e-nivel").value,
    fase_id: $("e-fase").value,
    codigo_error: $("e-codigo").value,
    concepto_evaluado: $("e-concepto").value,
  };
  Object.entries(f).forEach(([col, val]) => {
    if (val) q = q.eq(col, val);
  });
  const res = $("e-resultado").value;
  if (res === "error") q = q.like("resultado", "error%");
  else if (res) q = q.eq("resultado", res);

  const { data, error, count } = await q.order(COL_FECHA, { ascending: false }).range(desde, desde + tam - 1);
  if (error) {
    console.error(error);
    const sinColumna = f.concepto_evaluado && /concepto_evaluado/.test(error.message || "");
    cont.innerHTML = `<p class="mensaje-form mensaje-error">${
      sinColumna
        ? "Falta la columna concepto_evaluado: ejecuta supabase/avance2_3.sql en Supabase."
        : "No se pudieron cargar las ejecuciones."
    }</p>`;
    return;
  }
  renderEjecuciones(cont, data, { nombres: nombrePorId(), mostrarConcepto: true });
  if (demasiados) {
    cont.insertAdjacentHTML("afterbegin", `<p class="mensaje-form mensaje-error">Este grupo tiene más de ${LIMITE_IDS_FILTRO} alumnos: la tabla muestra las ejecuciones de todos los usuarios.</p>`);
  }

  const paginas = Math.max(1, Math.ceil((count || 0) / tam));
  $("paginacion-ejecuciones").innerHTML = `
    <button class="boton boton-secundario boton-chico" type="button" id="p-ant"${paginaEjecuciones === 0 ? " disabled" : ""}>← Anterior</button>
    <span>Página ${paginaEjecuciones + 1} de ${paginas} · ${count ?? 0} ejecuciones</span>
    <button class="boton boton-secundario boton-chico" type="button" id="p-sig"${paginaEjecuciones + 1 >= paginas ? " disabled" : ""}>Siguiente →</button>`;
  $("p-ant").addEventListener("click", () => { paginaEjecuciones -= 1; cargarEjecuciones(); });
  $("p-sig").addEventListener("click", () => { paginaEjecuciones += 1; cargarEjecuciones(); });
}

["e-usuario", "e-mundo", "e-nivel", "e-fase", "e-resultado", "e-codigo", "e-concepto"].forEach((id) =>
  $(id).addEventListener("change", () => {
    if (id === "e-mundo" || id === "e-nivel") {
      if (id === "e-mundo") $("e-nivel").value = "";
      actualizarNivelesYFases();
    }
    paginaEjecuciones = 0;
    cargarEjecuciones();
  })
);

// ---------- Exportar a CSV ----------

// Total de errores y error más frecuente por alumno: lo calcula la base de datos
// (admin_errores_por_usuario); si esa función aún no está instalada, se agrupa aquí
// leyendo las ejecuciones.
async function cargarErroresPorUsuario() {
  const { data, error } = await supabase.rpc("admin_errores_por_usuario");
  if (!error) return erroresDesdeRpc(data);
  if (!funcionFaltante(error)) throw error;
  const filas = await traerTodo(() => supabase.from("ejecuciones").select("user_id,resultado,codigo_error").order(COL_FECHA));
  return agregarErroresPorUsuario(filas);
}

const aSlug = (t) =>
  String(t)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

async function exportarCsv() {
  const boton = $("btn-exportar");
  // SOLO los usuarios del filtro seleccionado (no todo el sistema).
  const lista = alcance().usuarios;
  if (!lista.length) return notificar("No hay usuarios en este grupo para exportar", "error");
  boton.disabled = true;
  try {
    await exigirAdmin();
    const errores = await cargarErroresPorUsuario();
    const csv = construirCsv({ usuarios: lista, resumenes, errores, catalogo, etiquetaRol: (r) => ETIQUETA_ROL[r] || r });
    // BOM al inicio: así Excel abre bien los acentos.
    const blob = new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" });
    const enlace = document.createElement("a");
    enlace.href = URL.createObjectURL(blob);
    enlace.download = `codequest-${filtro === FILTRO_TODOS ? "todos" : aSlug(nombreDelFiltro())}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    setTimeout(() => URL.revokeObjectURL(enlace.href), 1000);
    notificar(`Exportados ${plural(lista.length, "usuario", "usuarios")} (${nombreDelFiltro()})`);
  } catch (e) {
    console.error(e);
    notificar("No se pudo preparar la exportación. Revisa tu conexión e inténtalo de nuevo.", "error");
  } finally {
    boton.disabled = false;
  }
}

$("btn-exportar").addEventListener("click", exportarCsv);

// ---------- Modo demo ----------

$("btn-laboratorio").addEventListener("click", () => {
  window.open("juego.html?modo=sandbox", "_blank", "noopener");
});

$("btn-demo").addEventListener("click", () => {
  // Nueva pestaña: el juego en modo demo usa localStorage y no toca la base de datos.
  window.open("mundos.html?demo=true", "_blank", "noopener");
});

// ---------- Auditoría ----------

const ETIQUETA_ACCION = {
  eliminar_usuario: "Eliminó un usuario",
  cambiar_rol: "Cambió un rol",
  resetear_progreso: "Reseteó progreso",
};

function describirObjetivo(a) {
  const d = a.detalles || {};
  const quien = d.nombre ? `${d.nombre}${d.email ? ` (${d.email})` : ""}` : a.objetivo_id || "—";
  if (a.accion === "cambiar_rol") return `${quien}: ${d.rol_anterior || "?"} → ${d.rol_nuevo || "?"}`;
  if (a.accion === "eliminar_usuario") return `${quien} · rol ${d.rol_objetivo || "?"}`;
  return quien;
}

async function cargarAuditoria() {
  const cont = $("tabla-auditoria");
  cont.innerHTML = '<p class="texto-vacio">Cargando…</p>';
  const { data, error } = await supabase.rpc("admin_auditoria", { p_limite: 50 });
  if (error) {
    console.error(error);
    cont.innerHTML = `<p class="mensaje-form mensaje-error">${escaparHtml(mensajeRpc(error, "No se pudo cargar la auditoría."))}</p>`;
    return;
  }
  if (!data.length) {
    cont.innerHTML = '<p class="texto-vacio">Todavía no hay acciones registradas.</p>';
    return;
  }
  cont.innerHTML = `<div class="tabla-envoltura"><table class="tabla">
    <thead><tr><th>Fecha</th><th>Administrador</th><th>Acción</th><th>Objetivo</th></tr></thead>
    <tbody>${data
      .map(
        (a) => `<tr>
        <td>${escaparHtml(formatearFecha(a.fecha))}</td>
        <td>${escaparHtml(a.admin_nombre || "—")}<br /><small class="texto-vacio">${escaparHtml(a.admin_email || "")}</small></td>
        <td><span class="etiqueta-estado ${a.accion === "eliminar_usuario" ? "etiqueta-error" : "etiqueta-aviso"}">${escaparHtml(ETIQUETA_ACCION[a.accion] || a.accion)}</span></td>
        <td>${escaparHtml(describirObjetivo(a))}</td>
      </tr>`
      )
      .join("")}</tbody></table></div>`;
}

function cargarAuditoriaSiVisible() {
  if (!$("seccion-auditoria").classList.contains("oculto")) cargarAuditoria();
}

$("btn-recargar-auditoria").addEventListener("click", cargarAuditoria);

// ---------- Configuración ----------

function pintarConfig() {
  $("c-tamano").value = String(tamanoPagina());
  $("config-estado").innerHTML = `<dl class="estado-lista">
    <dt>Proyecto Supabase</dt><dd class="mono">${escaparHtml(HOST_SUPABASE)}</dd>
    <dt>Administrador</dt><dd>${escaparHtml(yo.nombre)} (${escaparHtml(yo.email)})</dd>
    <dt>Niveles en el catálogo</dt><dd>${catalogo.totalNiveles} en ${Object.keys(catalogo.mundos).length} mundos</dd>
    <dt>Función admin_listar_usuarios</dt><dd>${funcionesSql.listar ? '<span class="etiqueta-estado etiqueta-ok">Instalada</span>' : '<span class="etiqueta-estado etiqueta-error">Falta</span>'}</dd>
    <dt>Funciones del dashboard (avance3_3.sql)</dt><dd>${gruposDisponibles && dashDesdeSql ? '<span class="etiqueta-estado etiqueta-ok">Instaladas</span>' : '<span class="etiqueta-estado etiqueta-error">Faltan</span>'}</dd>
  </dl>`;
}

$("c-tamano").addEventListener("change", (e) => {
  localStorage.setItem("codequest:admin:tamano", e.target.value);
  paginaEjecuciones = 0;
  notificar("Preferencia guardada");
});

$("btn-recargar").addEventListener("click", () => recargarTodo(true));

// ---------- Pestañas y arranque ----------

function irASeccion(nombre) {
  seccionActual = nombre;
  // El filtro por grupo solo aplica a Resumen, Usuarios y Ejecuciones.
  $("admin-filtro").classList.toggle("oculto", nombre === "auditoria" || nombre === "config");
  document.querySelectorAll(".admin-pestana").forEach((b) => {
    const activa = b.dataset.seccion === nombre;
    b.classList.toggle("activa", activa);
    b.setAttribute("aria-selected", String(activa));
  });
  ["resumen", "usuarios", "ejecuciones", "auditoria", "config"].forEach((s) =>
    $(`seccion-${s}`).classList.toggle("oculto", s !== nombre)
  );
  if (nombre === "ejecuciones") cargarEjecuciones();
  if (nombre === "auditoria") cargarAuditoria();
  if (nombre === "config") pintarConfig();
}

document.querySelectorAll(".admin-pestana").forEach((b) => b.addEventListener("click", () => irASeccion(b.dataset.seccion)));

async function refrescarResumen() {
  try {
    await Promise.all([cargarGrupos(), cargarDatosDashboard()]);
    pintarFiltro();
    pintarDetalleFiltro();
    pintarDashboard();
  } catch (e) {
    console.error(e);
  }
}

async function recargarTodo(avisar = false) {
  try {
    usuarios = await cargarUsuarios();
    await cargarResumenResumenes();
    if (graficas) $("graficas-aviso").classList.add("oculto"); // si Chart.js no cargó, ese aviso se queda
    await Promise.all([cargarGrupos(), cargarDatosDashboard()]);
    pintarFiltro();
    pintarDetalleFiltro();
    pintarDashboard();
    pintarUsuarios();
    poblarSelectoresEjecuciones();
    pintarConfig();
    mostrarAvisosSql();
    if (avisar) notificar("Datos actualizados");
  } catch (e) {
    console.error(e);
    $("kpis").innerHTML = '<p class="mensaje-form mensaje-error">No se pudieron cargar los datos. Revisa tu conexión y los permisos RLS.</p>';
  }
}

(async function iniciar() {
  // Si un estudiante o profesor llega aquí, vuelve al mapa de mundos (sección 8.9).
  yo = await protegerPagina(["admin", "super_root"], { rutaSiNoPermitido: "mundos.html" });
  if (!yo) return;
  await renderizarNav("nav", yo);
  prepararFiltroMundos();
  // Chart.js llega por CDN: si no hay internet, el panel sigue funcionando sin las gráficas.
  graficas = crearGraficas();
  if (!graficas) {
    $("graficas-aviso").textContent = "No se pudieron cargar las gráficas (Chart.js se descarga de internet). Los números y las tablas siguen funcionando.";
    $("graficas-aviso").classList.remove("oculto");
  }
  await recargarTodo();
})();
