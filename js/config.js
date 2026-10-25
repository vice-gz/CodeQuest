// config.js
// Ajustes de la instalación, leídos de .env (ver .env.example).
// OJO: validar el dominio aquí es una ayuda para el usuario, no una barrera de
// seguridad (cualquiera puede llamar a la API de Supabase directamente).
// Para exigirlo de verdad en el servidor hay que usar un Auth Hook de Supabase.

// Ej.: "pachuca.tecnm.mx". Vacío = se aceptan correos de cualquier dominio.
export const DOMINIO_INSTITUCIONAL = String(import.meta.env.VITE_DOMINIO_INSTITUCIONAL || "")
  .trim()
  .toLowerCase()
  .replace(/^@/, "");

export function correoEsInstitucional(email) {
  if (!DOMINIO_INSTITUCIONAL) return true;
  const dominio = String(email || "").trim().toLowerCase().split("@")[1] || "";
  return dominio === DOMINIO_INSTITUCIONAL || dominio.endsWith(`.${DOMINIO_INSTITUCIONAL}`);
}
