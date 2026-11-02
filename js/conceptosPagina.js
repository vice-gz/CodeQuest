// conceptosPagina.js
// Página del glosario (conceptos.html). Muestra SOLO los conceptos de los
// mundos que el estudiante ya pudo ver, para no revelar lo que viene:
//   1) ?mundo=N en la URL manda (así lo abre el botón Conceptos del juego);
//   2) si hay sesión de alumno, se usa su progreso en Supabase (el mundo más
//      alto que tiene abierto);
//   3) profesores y administradores ven todos los mundos;
//   4) sin sesión, el Mundo 1.
// No necesita sesión para abrirse.

import { configuracionValida } from "./supabase.js";
import { obtenerPerfil } from "./auth.js";
import { catalogo } from "./game/catalogo.js";
import { estadoDelMundo } from "./game/desbloqueo.js";
import { calcularResumen } from "./persistence/progreso.js";
import { cargarFases } from "./datos.js";
import { montarGlosario } from "./ui/conceptos.js";

const MUNDOS = Object.keys(catalogo.mundos).map(Number);
const ULTIMO = Math.max(...MUNDOS);

async function mundoDelJugador() {
  const param = Number(new URLSearchParams(window.location.search).get("mundo"));
  if (Number.isInteger(param) && param >= 1 && param <= ULTIMO) return { mundo: param, origen: "url" };
  if (!configuracionValida) return { mundo: 1, origen: "anonimo" };
  try {
    const perfil = await obtenerPerfil();
    if (!perfil) return { mundo: 1, origen: "anonimo" };
    if (perfil.rol !== "estudiante") return { mundo: ULTIMO, origen: "docente" };
    const resumen = calcularResumen(await cargarFases(perfil.user_id), catalogo);
    const abierto = (id) => ["disponible", "completado"].includes(estadoDelMundo(id, catalogo, (m) => resumen.mundos[m]?.completado === true));
    return { mundo: Math.max(1, ...MUNDOS.filter(abierto)), origen: "progreso" };
  } catch (e) {
    console.warn("No se pudo leer el progreso para el glosario:", e);
    return { mundo: 1, origen: "anonimo" };
  }
}

const TEXTO_ALCANCE = {
  url: (m) => `Mostrando los conceptos hasta el Mundo ${m}.`,
  progreso: (m) => `Según tu progreso, ya puedes ver los conceptos hasta el Mundo ${m}. Los demás aparecerán cuando llegues a esos mundos.`,
  docente: (m) => `Vista completa para docentes: conceptos de los ${m} mundos.`,
  anonimo: () => "Inicia sesión para ver los conceptos de los mundos que vayas desbloqueando. Mientras tanto, estos son los del Mundo 1.",
};

(async function iniciar() {
  const { mundo, origen } = await mundoDelJugador();
  document.getElementById("alcance").textContent = TEXTO_ALCANCE[origen](mundo);
  montarGlosario(document.getElementById("glosario"), mundo);
})();
