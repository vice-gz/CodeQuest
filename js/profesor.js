// profesor.js
// Página del profesor: crear clases, ver su código y el progreso de sus
// alumnos. Solo ve a quienes están inscritos en SUS clases (RLS + funciones SQL).

import { supabase } from "./supabase.js";
import { protegerPagina, mensajeRpc } from "./auth.js";
import { renderizarNav } from "./nav.js";
import { catalogo } from "./game/catalogo.js";
import { calcularResumen, agruparFilasPorUsuario } from "./persistence/progreso.js";
import { traerTodo } from "./datos.js";
import { notificar, confirmar, pedirDatos } from "./ui/avisos.js";
import { escaparHtml, formatearFecha, fechaRelativa } from "./util.js";

const $ = (id) => document.getElementById(id);
let yo = null;
let clases = [];

function mostrarError(texto) {
  const e = $("profesor-error");
  e.textContent = texto;
  e.classList.toggle("oculto", !texto);
}

// ---------- Lista de clases ----------

async function cargarClases() {
  const { data, error } = await supabase
    .from("clases")
    .select("*")
    .eq("profesor_id", yo.user_id)
    .order("created_at", { ascending: false });
  if (error) {
    console.error(error);
    mostrarError("No se pudieron cargar tus clases. Revisa tu conexión y que el SQL del Avance 2.2 esté instalado.");
    $("rejilla-clases").innerHTML = "";
    return;
  }
  clases = data;

  // Cuántos alumnos tiene cada clase.
  const conteo = {};
  if (clases.length) {
    const { data: insc } = await supabase
      .from("inscripciones")
      .select("clase_id")
      .in("clase_id", clases.map((c) => c.id));
    (insc || []).forEach((i) => (conteo[i.clase_id] = (conteo[i.clase_id] || 0) + 1));
  }
  pintarClases(conteo);
}

function pintarClases(conteo) {
  const cont = $("rejilla-clases");
  if (!clases.length) {
    cont.innerHTML = '<p class="texto-vacio">Aún no has creado ninguna clase. Pulsa “Crear clase” para empezar.</p>';
    return;
  }
  cont.innerHTML = clases
    .map(
      (c) => `<article class="tarjeta-clase" data-id="${escaparHtml(c.id)}">
      <h3>${escaparHtml(c.nombre)}</h3>
      <p class="codigo-clase" aria-label="Código de acceso">${escaparHtml(c.codigo_acceso)}</p>
      <p class="texto-vacio">${conteo[c.id] || 0} alumno(s)${c.dominio_permitido ? ` · solo @${escaparHtml(c.dominio_permitido)}` : ""}</p>
      <div class="celda-acciones">
        <button class="boton boton-primario boton-chico" type="button" data-accion="ver">Ver alumnos</button>
        <button class="boton boton-secundario boton-chico" type="button" data-accion="copiar">Copiar código</button>
      </div>
    </article>`
    )
    .join("");
}

$("rejilla-clases").addEventListener("click", async (e) => {
  const boton = e.target.closest("button[data-accion]");
  if (!boton) return;
  const clase = clases.find((c) => c.id === boton.closest("[data-id]").dataset.id);
  if (!clase) return;
  if (boton.dataset.accion === "ver") abrirClase(clase);
  if (boton.dataset.accion === "copiar") copiarCodigo(clase);
});

async function copiarCodigo(clase) {
  try {
    await navigator.clipboard.writeText(clase.codigo_acceso);
    notificar(`Código ${clase.codigo_acceso} copiado`);
  } catch {
    notificar(`Código: ${clase.codigo_acceso}`);
  }
}

// ---------- Crear clase ----------

$("btn-crear-clase").addEventListener("click", async () => {
  const datos = await pedirDatos({
    titulo: "Crear clase",
    etiquetaOk: "Crear clase",
    campos: [
      { id: "nombre", etiqueta: "Nombre de la clase", placeholder: "Ej. Programación 1 · Grupo A", requerido: true, maxLength: 80 },
      {
        id: "dominio",
        etiqueta: "Dominio de correo permitido (opcional)",
        placeholder: "pachuca.tecnm.mx",
        ayuda: "Si lo escribes, solo podrán unirse alumnos con correo de ese dominio.",
        maxLength: 80,
      },
    ],
  });
  if (!datos) return;

  const { data, error } = await supabase.rpc("crear_clase", { p_nombre: datos.nombre, p_dominio: datos.dominio || null });
  if (error) return notificar(mensajeRpc(error, "No se pudo crear la clase"), "error");
  notificar(`Clase creada. Código: ${data.codigo_acceso}`, "exito", 7000);
  await cargarClases();
});

// ---------- Detalle de clase ----------

function volverALista() {
  $("vista-clase").classList.add("oculto");
  $("vista-clases").classList.remove("oculto");
}

async function abrirClase(clase) {
  $("vista-clases").classList.add("oculto");
  const cont = $("vista-clase");
  cont.classList.remove("oculto");
  cont.innerHTML = '<p class="texto-vacio">Cargando…</p>';

  const { data: alumnos, error } = await supabase.rpc("profesor_alumnos_clase", { p_clase_id: clase.id });
  if (error) {
    cont.innerHTML = `<p class="mensaje-form mensaje-error">${escaparHtml(mensajeRpc(error, "No se pudo cargar la clase."))}</p>
      <button class="boton boton-secundario" type="button" id="c-volver">← Volver</button>`;
    $("c-volver").addEventListener("click", volverALista);
    return;
  }

  // Estrellas por alumno, calculadas con el catálogo de niveles.
  let estrellas = new Map();
  if (alumnos.length) {
    try {
      const ids = alumnos.map((a) => a.estudiante_id);
      const filas = await traerTodo(() =>
        supabase.from("progreso_fases").select("*").in("user_id", ids).order("user_id").order("nivel_id").order("fase_id")
      );
      const porUsuario = agruparFilasPorUsuario(filas);
      ids.forEach((id) => estrellas.set(id, calcularResumen(porUsuario.get(id) || [], catalogo).totales.estrellas));
    } catch (e) {
      console.error(e);
    }
  }

  // Alertas tempranas: más de 10 intentos fallidos en el nivel actual o más de
  // 3 días sin actividad. Si la función SQL aún no está instalada, se omite.
  const alertas = new Map();
  let alertasDisponibles = true;
  if (alumnos.length) {
    const { data: lista, error: errAlertas } = await supabase.rpc("admin_alertas_clase", { p_clase_id: clase.id });
    if (errAlertas) {
      console.warn("admin_alertas_clase:", errAlertas.message);
      alertasDisponibles = false;
    } else {
      lista.forEach((a) => alertas.set(a.estudiante_id, a));
    }
  }
  // Los alumnos en riesgo van primero.
  const enRiesgo = (a) => alertas.get(a.estudiante_id)?.en_riesgo === true;
  alumnos.sort((a, b) => Number(enRiesgo(b)) - Number(enRiesgo(a)));
  const totalRiesgo = alumnos.filter(enRiesgo).length;

  const celdaEstado = (a) => {
    const al = alertas.get(a.estudiante_id);
    if (!al) return '<td class="estado-alumno">—</td>';
    if (al.en_riesgo) {
      const motivo = `Este alumno puede necesitar ayuda. ${al.motivo || ""}`.trim();
      return `<td class="estado-alumno estado-riesgo" title="${escaparHtml(motivo)}"><span role="img" aria-label="${escaparHtml(motivo)}">⚠️</span>
        <small>${escaparHtml(al.motivo || "")}</small></td>`;
    }
    return '<td class="estado-alumno estado-ok" title="Al día"><span role="img" aria-label="Al día">✅</span></td>';
  };

  const filasHtml = alumnos
    .map(
      (a) => `<tr${enRiesgo(a) ? ' class="fila-riesgo"' : ""}>
      ${alertasDisponibles ? celdaEstado(a) : ""}
      <td>${escaparHtml(a.nombre)}</td>
      <td>${escaparHtml(a.email)}</td>
      <td class="texto-ambar">${estrellas.has(a.estudiante_id) ? `★ ${estrellas.get(a.estudiante_id)}` : "—"}</td>
      <td>Mundo ${escaparHtml(a.mundo_actual ?? 1)} · Nivel ${escaparHtml(a.nivel_actual ?? 1)}</td>
      <td title="${escaparHtml(formatearFecha(a.ultima_actividad))}">${escaparHtml(fechaRelativa(a.ultima_actividad))}</td>
    </tr>`
    )
    .join("");

  cont.innerHTML = `
    <div class="profesor-cabecera">
      <div>
        <h1 class="pagina-titulo">${escaparHtml(clase.nombre)}</h1>
        <p class="texto-vacio">Código de acceso: <span class="codigo-clase codigo-inline">${escaparHtml(clase.codigo_acceso)}</span>
          ${clase.dominio_permitido ? ` · solo @${escaparHtml(clase.dominio_permitido)}` : ""}</p>
      </div>
      <div class="celda-acciones">
        <button class="boton boton-secundario" type="button" id="c-volver">← Mis clases</button>
        <button class="boton boton-secundario" type="button" id="c-copiar">Copiar código</button>
        <button class="boton boton-peligro" type="button" id="c-eliminar">Eliminar clase</button>
      </div>
    </div>
    <section class="panel">
      <div class="panel-encabezado"><h2>Alumnos inscritos (${alumnos.length})</h2></div>
      ${
        alumnos.length
          ? `${
              alertasDisponibles
                ? `<p class="${totalRiesgo ? "mensaje-form mensaje-error" : "texto-vacio"}" role="status">${
                    totalRiesgo
                      ? `⚠️ ${totalRiesgo} alumno(s) pueden necesitar ayuda (más de 10 intentos fallidos en su nivel actual o más de 3 días sin actividad).`
                      : "✅ Todos los alumnos van al día."
                  }</p>`
                : '<p class="texto-vacio">Las alertas no están disponibles: falta ejecutar supabase/avance2_3.sql en Supabase.</p>'
            }
          <div class="tabla-envoltura"><table class="tabla">
          <thead><tr>${alertasDisponibles ? "<th>Estado</th>" : ""}<th>Nombre</th><th>Email</th><th>Estrellas</th><th>Último nivel alcanzado</th><th>Última actividad</th></tr></thead>
          <tbody>${filasHtml}</tbody></table></div>`
          : '<p class="texto-vacio">Todavía no hay alumnos en esta clase. Comparte el código para que se unan.</p>'
      }
    </section>`;

  $("c-volver").addEventListener("click", () => {
    volverALista();
    cargarClases();
  });
  $("c-copiar").addEventListener("click", () => copiarCodigo(clase));
  $("c-eliminar").addEventListener("click", () => eliminarClase(clase));
}

async function eliminarClase(clase) {
  const ok = await confirmar({
    titulo: `Eliminar la clase "${clase.nombre}"`,
    lineas: ["Los alumnos dejarán de pertenecer a la clase. Su progreso NO se borra."],
    palabraClave: "ELIMINAR",
    etiquetaOk: "Eliminar clase",
    peligro: true,
  });
  if (!ok) return;
  const { data, error } = await supabase.from("clases").delete().eq("id", clase.id).select();
  if (error || !data?.length) return notificar("No se pudo eliminar la clase", "error");
  notificar("Clase eliminada");
  volverALista();
  cargarClases();
}

// ---------- Arranque ----------

(async function iniciar() {
  yo = await protegerPagina(["profesor", "admin", "super_root"], { rutaSiNoPermitido: "juego.html" });
  if (!yo) return;
  await renderizarNav("nav", yo);
  await cargarClases();
})();
