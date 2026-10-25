// admin.js
// Panel de administración. Solo entran admin y super_root (protegerPagina) y cada
// operación sensible vuelve a comprobarlo contra el servidor (exigirAdmin).
// Aun así, quien manda es la base de datos: las políticas RLS y las
// funciones SQL de supabase/avance2.sql rechazan a quien no sea admin.

import { supabase, HOST_SUPABASE } from "./supabase.js";
import { protegerPagina, exigirAdmin, mensajeRpc } from "./auth.js";
import { renderizarNav } from "./nav.js";
import { catalogo } from "./game/catalogo.js";
import { calcularResumen, agruparFilasPorUsuario, contarErrores } from "./persistence/progreso.js";
import { traerTodo, cargarJugador, cargarFases, cargarUltimasEjecuciones, cargarCodigosError, COL_FECHA } from "./datos.js";
import {
  renderResumen as renderResumenProgreso,
  renderMundos,
  renderTablaNiveles,
  renderGraficos,
  renderEjecuciones,
  renderBarras,
} from "./ui/vistaProgreso.js";
import { nombreError, NOMBRES_ERROR } from "./ui/erroresCatalogo.js";
import { notificar, confirmar } from "./ui/avisos.js";
import { escaparHtml, formatearFecha, formatearDia, fechaRelativa, ETIQUETA_ROL } from "./util.js";

const $ = (id) => document.getElementById(id);
const DIAS_ACTIVO = 7;

let yo = null; // perfil del admin conectado
let usuarios = []; // [{id, nombre, email, rol, ...}]
let resumenes = new Map(); // userId -> resumen de progreso
let funcionesSql = { listar: true, resumen: true };
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

async function cargarResumenServidor() {
  const { data, error } = await supabase.rpc("admin_resumen");
  if (!error && data) {
    funcionesSql.resumen = true;
    return { ...data, aproximado: false };
  }
  if (error && !funcionFaltante(error)) throw error;

  // Alternativa aproximada con consultas normales (máx. 1000 filas por consulta).
  funcionesSql.resumen = false;
  const desde = new Date(Date.now() - DIAS_ACTIVO * 86400000).toISOString();
  const [total, recientes, errores] = await Promise.all([
    supabase.from("ejecuciones").select("*", { count: "exact", head: true }),
    supabase.from("ejecuciones").select("user_id").gte(COL_FECHA, desde).limit(1000),
    supabase.from("ejecuciones").select("mundo_id,nivel_id,codigo_error,resultado").like("resultado", "error%").limit(1000),
  ]);
  const porNivel = {};
  (errores.data || []).forEach((e) => {
    const k = `${e.mundo_id}|${e.nivel_id}`;
    porNivel[k] = (porNivel[k] || 0) + 1;
  });
  return {
    aproximado: true,
    total_usuarios: usuarios.length,
    usuarios_activos_7d: new Set((recientes.data || []).map((r) => r.user_id)).size,
    total_ejecuciones: total.count ?? 0,
    errores_por_nivel: Object.entries(porNivel)
      .map(([k, n]) => ({ mundo_id: Number(k.split("|")[0]), nivel_id: Number(k.split("|")[1]), total: n }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5),
    errores_por_codigo: contarErrores(errores.data || [], 5).map((e) => ({ codigo_error: e.codigo, total: e.total })),
  };
}

// ---------- Resumen general ----------

function tarjeta(titulo, valor, detalle = "") {
  return `<div class="dato-tarjeta"><span class="dato-titulo">${escaparHtml(titulo)}</span>
    <span class="dato-valor">${valor}</span>${detalle ? `<span class="dato-detalle">${escaparHtml(detalle)}</span>` : ""}</div>`;
}

function pintarResumen(r) {
  const totalEstrellas = [...resumenes.values()].reduce((s, x) => s + x.totales.estrellas, 0);

  // Nivel más completado: cuántos usuarios lo terminaron.
  const completados = {};
  resumenes.forEach((res) =>
    Object.values(res.niveles).forEach((n) => {
      if (n.completado) completados[n.id] = (completados[n.id] || 0) + 1;
    })
  );
  const topNivel = Object.entries(completados).sort((a, b) => b[1] - a[1])[0];
  const nivelMas = topNivel ? catalogo.niveles[topNivel[0]] : null;

  const peorNivel = r.errores_por_nivel?.[0];
  const peorCodigo = r.errores_por_codigo?.[0];

  $("resumen-tarjetas").innerHTML =
    tarjeta("Usuarios registrados", r.total_usuarios) +
    tarjeta("Usuarios activos", r.usuarios_activos_7d, `últimos ${DIAS_ACTIVO} días`) +
    tarjeta("Ejecuciones", r.total_ejecuciones) +
    tarjeta("Estrellas ganadas", `<span class="texto-ambar">★</span> ${totalEstrellas}`, "entre todos los usuarios") +
    tarjeta("Nivel más completado", nivelMas ? `Nivel ${nivelMas.id}` : "—", nivelMas ? `${nivelMas.nombre} · ${topNivel[1]} usuario(s)` : "Nadie ha completado niveles") +
    tarjeta("Nivel con más errores", peorNivel ? `Nivel ${peorNivel.nivel_id}` : "—", peorNivel ? `${peorNivel.total} errores` : "Sin errores") +
    tarjeta("Concepto con más errores", peorCodigo ? escaparHtml(peorCodigo.codigo_error) : "—", peorCodigo ? `${NOMBRES_ERROR[peorCodigo.codigo_error] || ""} · ${peorCodigo.total}` : "Sin errores");

  $("resumen-graficos").innerHTML =
    renderBarras(
      "Niveles con más errores (top 5)",
      (r.errores_por_nivel || []).map((e) => ({ etiqueta: `Nivel ${e.nivel_id}`, valor: e.total })),
      { vacio: "Sin errores registrados." }
    ) +
    renderBarras(
      "Errores más comunes (top 5)",
      (r.errores_por_codigo || []).map((e) => ({ etiqueta: nombreError(e.codigo_error), valor: e.total })),
      { vacio: "Sin errores registrados." }
    );

  const avisos = [];
  if (!funcionesSql.listar || !funcionesSql.resumen) {
    avisos.push("Faltan las funciones SQL del Avance 2 (supabase/avance2.sql): sin ellas no se muestran los emails y las estadísticas son aproximadas.");
  }
  mostrarAviso(avisos.join(" "));
}

// ---------- Listado de usuarios ----------

function usuariosFiltrados() {
  const q = $("f-busqueda").value.trim().toLowerCase();
  const rol = $("f-rol").value;
  const mundo = $("f-mundo").value;
  const act = $("f-actividad").value;
  const limite = Date.now() - DIAS_ACTIVO * 86400000;

  return usuarios.filter((u) => {
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
  $("usuarios-conteo").textContent = `${lista.length} de ${usuarios.length} usuarios`;
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
  llenarSelect($("e-usuario"), usuarios.map((u) => ({ valor: u.id, texto: `${u.nombre}${u.email !== "—" ? ` (${u.email})` : ""}` })));
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

  let q = supabase.from("ejecuciones").select("*", { count: "exact" });
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

// Evita la "inyección de fórmulas": Excel ejecuta celdas que empiezan con = + - @.
function celdaCsv(valor) {
  let t = String(valor ?? "");
  if (/^[=+\-@\t\r]/.test(t)) t = `'${t}`;
  return `"${t.replace(/"/g, '""')}"`;
}

function exportarCsv() {
  const encabezado = [
    "Nombre", "Email", "Rol", "Mundo actual", "Nivel actual", "Experiencia", "Estrellas",
    "Niveles completados", "Fases completadas", "Fecha de registro", "Última actividad",
  ];
  const filas = usuarios.map((u) => {
    const t = resumenes.get(u.id)?.totales;
    return [
      u.nombre, u.email, ETIQUETA_ROL[u.rol] || u.rol, u.mundo, u.nivel, u.experiencia,
      t?.estrellas ?? 0, t?.nivelesCompletados ?? 0, t?.fasesCompletadas ?? 0,
      u.fechaRegistro || "", u.ultimaActividad || "",
    ];
  });
  const csv = [encabezado, ...filas].map((f) => f.map(celdaCsv).join(",")).join("\r\n");
  // BOM al inicio: así Excel abre bien los acentos.
  const blob = new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" });
  const enlace = document.createElement("a");
  enlace.href = URL.createObjectURL(blob);
  enlace.download = `codequest-usuarios-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  setTimeout(() => URL.revokeObjectURL(enlace.href), 1000);
  notificar(`Exportados ${usuarios.length} usuarios`);
}

$("btn-exportar").addEventListener("click", exportarCsv);

// ---------- Modo demo ----------

$("btn-laboratorio").addEventListener("click", () => {
  window.open("juego.html?modo=sandbox", "_blank", "noopener");
});

$("btn-demo").addEventListener("click", () => {
  // Nueva pestaña: el juego en modo demo usa localStorage y no toca la base de datos.
  window.open("juego.html?demo=true", "_blank", "noopener");
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
    <dt>Función admin_resumen</dt><dd>${funcionesSql.resumen ? '<span class="etiqueta-estado etiqueta-ok">Instalada</span>' : '<span class="etiqueta-estado etiqueta-error">Falta</span>'}</dd>
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

let ultimoResumenServidor = null;
async function refrescarResumen() {
  try {
    ultimoResumenServidor = await cargarResumenServidor();
    pintarResumen(ultimoResumenServidor);
  } catch (e) {
    console.error(e);
  }
}

async function recargarTodo(avisar = false) {
  try {
    usuarios = await cargarUsuarios();
    await cargarResumenResumenes();
    ultimoResumenServidor = await cargarResumenServidor();
    pintarResumen(ultimoResumenServidor);
    pintarUsuarios();
    poblarSelectoresEjecuciones();
    pintarConfig();
    if (avisar) notificar("Datos actualizados");
  } catch (e) {
    console.error(e);
    $("resumen-tarjetas").innerHTML = '<p class="mensaje-form mensaje-error">No se pudieron cargar los datos. Revisa tu conexión y los permisos RLS.</p>';
  }
}

(async function iniciar() {
  // Si un estudiante o profesor llega aquí, vuelve a juego.html (sección 8.9).
  yo = await protegerPagina(["admin", "super_root"], { rutaSiNoPermitido: "juego.html" });
  if (!yo) return;
  await renderizarNav("nav", yo);
  prepararFiltroMundos();
  await recargarTodo();
})();
