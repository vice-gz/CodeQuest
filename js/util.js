// util.js
// Utilidades compartidas. escaparHtml() es la defensa contra XSS: todo texto
// que venga de la base de datos (nombres, códigos, errores) pasa por ella
// antes de entrar en un innerHTML.

export function escaparHtml(valor) {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function validarEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email || "").trim());
}

const FORMATO_FECHA = new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short" });
const FORMATO_DIA = new Intl.DateTimeFormat("es-MX", { dateStyle: "long" });

export function formatearFecha(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : FORMATO_FECHA.format(d);
}

export function formatearDia(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : FORMATO_DIA.format(d);
}

export function fechaRelativa(iso) {
  if (!iso) return "Nunca";
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms)) return "—";
  const min = Math.floor(ms / 60000);
  if (min < 1) return "Hace un momento";
  if (min < 60) return `Hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `Hace ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `Hace ${d} d`;
  return formatearDia(iso);
}

export function debounce(fn, espera = 250) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), espera);
  };
}

export const ROLES = ["estudiante", "profesor", "admin", "super_root"];
export const ETIQUETA_ROL = { estudiante: "Alumno", profesor: "Profesor", admin: "Admin", super_root: "Super Root" };

// admin y super_root usan el panel de administración.
export const esRolAdmin = (rol) => rol === "admin" || rol === "super_root";
