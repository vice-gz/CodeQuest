// dashboardGraficas.js
// Las tres gráficas del dashboard con Chart.js (cargado por CDN en admin.html: window.Chart).
// crearGraficas() las construye una vez; actualizar() solo cambia los datos (con animación),
// así que al mover el filtro de grupo se redibujan al instante sin parpadeo.

import { nombreError, NOMBRES_ERROR } from "./erroresCatalogo.js";

const COLORES_MUNDO = ["#5eead4", "#ffb84d", "#f87171", "#8ab4ff", "#c4a8ff", "#86efac"];
const COLOR_BARRAS = "#f87171";
const COLOR_LINEA = "#5eead4";

function estilo(variable, respaldo) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  return v || respaldo;
}

function mostrarVacio(canvasId, vacio, mensaje) {
  const canvas = document.getElementById(canvasId);
  const aviso = document.getElementById(`vacia-${canvasId.replace("grafica-", "")}`);
  canvas.classList.toggle("oculto", vacio);
  aviso.classList.toggle("oculto", !vacio);
  if (mensaje) aviso.textContent = mensaje;
}

/**
 * @param {object} Chart  la clase Chart de Chart.js (por defecto window.Chart)
 * @returns {{actualizar: Function, destruir: Function}|null}  null si Chart.js no se pudo cargar
 */
export function crearGraficas(Chart = globalThis.Chart) {
  if (!Chart) return null;

  Chart.defaults.color = estilo("--texto-muted", "#8891b8");
  Chart.defaults.borderColor = estilo("--borde-suave", "#232a4d");
  Chart.defaults.font.family = getComputedStyle(document.body).fontFamily;
  const comunes = { responsive: true, maintainAspectRatio: false };

  const errores = new Chart(document.getElementById("grafica-errores"), {
    type: "bar",
    data: { labels: [], datasets: [{ label: "Veces que ocurrió", data: [], backgroundColor: COLOR_BARRAS, borderRadius: 6 }] },
    options: {
      ...comunes,
      indexAxis: "y",
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { title: (items) => nombreError(items[0].label) } },
      },
      scales: { x: { beginAtZero: true, ticks: { precision: 0 } }, y: { grid: { display: false } } },
    },
  });

  const mundos = new Chart(document.getElementById("grafica-mundos"), {
    type: "doughnut",
    data: { labels: [], datasets: [{ data: [], backgroundColor: COLORES_MUNDO, borderColor: estilo("--bg-elevado", "#12162b"), borderWidth: 3 }] },
    options: {
      ...comunes,
      cutout: "58%",
      plugins: {
        legend: { position: "bottom" },
        tooltip: { callbacks: { label: (c) => ` ${c.label}: ${c.parsed} alumno(s)` } },
      },
    },
  });

  const dias = new Chart(document.getElementById("grafica-dias"), {
    type: "line",
    data: { labels: [], datasets: [{ label: "Ejecuciones", data: [], borderColor: COLOR_LINEA, backgroundColor: "rgba(94, 234, 212, 0.18)", fill: true, tension: 0.3, pointRadius: 4, pointHoverRadius: 6 }] },
    options: {
      ...comunes,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { precision: 0 } }, x: { grid: { display: false } } },
    },
  });

  return {
    /** @param {{errores: {codigo,total}[], mundos: {mundo,nombre,total}[], dias: {etiqueta,total}[]}} d */
    actualizar(d) {
      // --- errores
      errores.data.labels = d.errores.map((e) => e.codigo);
      errores.data.datasets[0].data = d.errores.map((e) => e.total);
      mostrarVacio("grafica-errores", d.errores.length === 0);
      document.getElementById("grafica-errores").setAttribute("aria-label", d.errores.length ? `Errores más frecuentes: ${d.errores.map((e) => `${e.codigo} (${NOMBRES_ERROR[e.codigo] || "error"}) ${e.total}`).join(", ")}` : "Sin errores registrados");
      errores.update();

      // --- mundos
      const totalAlumnos = d.mundos.reduce((s, m) => s + m.total, 0);
      mundos.data.labels = d.mundos.map((m) => `Mundo ${m.mundo} · ${m.nombre}`);
      mundos.data.datasets[0].data = d.mundos.map((m) => m.total);
      mostrarVacio("grafica-mundos", totalAlumnos === 0);
      document.getElementById("grafica-mundos").setAttribute("aria-label", `Alumnos por mundo: ${d.mundos.map((m) => `mundo ${m.mundo}, ${m.total}`).join("; ")}`);
      mundos.update();

      // --- ejecuciones por día
      const totalDias = d.dias.reduce((s, x) => s + x.total, 0);
      dias.data.labels = d.dias.map((x) => x.etiqueta);
      dias.data.datasets[0].data = d.dias.map((x) => x.total);
      mostrarVacio("grafica-dias", totalDias === 0);
      document.getElementById("grafica-dias").setAttribute("aria-label", `Ejecuciones por día: ${d.dias.map((x) => `${x.etiqueta}, ${x.total}`).join("; ")}`);
      dias.update();
    },
    destruir() {
      [errores, mundos, dias].forEach((g) => g.destroy());
    },
  };
}
