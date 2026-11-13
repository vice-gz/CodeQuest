// autoguardado.js
// Prevención de pérdida de datos: el código que el estudiante va escribiendo se guarda en localStorage (por persona y por fase)
// y se recupera si recarga la página (F5) o cierra la pestaña sin querer. Se borra al completar la fase o al reiniciarla.
// Es solo un borrador local: no toca la base de datos ni el progreso.

const MAX_CARACTERES = 20000; // un borrador más grande que esto no es un programa del juego: no se guarda

export const claveBorrador = (usuarioId, faseId) => `codequest:codigo:${usuarioId}:${faseId}`;

function almacenamiento(almacen) {
  if (almacen) return almacen;
  try {
    return typeof localStorage !== "undefined" ? localStorage : null;
  } catch {
    return null; // modo privado / almacenamiento bloqueado
  }
}

/** Guarda el borrador. Si el código está vacío o es igual al de partida, no hay nada que recuperar: se borra. */
export function guardarBorrador(usuarioId, faseId, codigo, codigoInicial = "", almacen = null) {
  const a = almacenamiento(almacen);
  if (!a || !usuarioId || !faseId) return false;
  try {
    const texto = String(codigo ?? "");
    if (texto.trim() === "" || texto === String(codigoInicial ?? "") || texto.length > MAX_CARACTERES) {
      a.removeItem(claveBorrador(usuarioId, faseId));
      return false;
    }
    a.setItem(claveBorrador(usuarioId, faseId), texto);
    return true;
  } catch {
    return false; // sin espacio o sin permiso: el juego sigue funcionando sin autoguardado
  }
}

/** @returns {string|null} el borrador, o null si no hay */
export function leerBorrador(usuarioId, faseId, almacen = null) {
  const a = almacenamiento(almacen);
  if (!a || !usuarioId || !faseId) return null;
  try {
    return a.getItem(claveBorrador(usuarioId, faseId));
  } catch {
    return null;
  }
}

export function borrarBorrador(usuarioId, faseId, almacen = null) {
  const a = almacenamiento(almacen);
  if (!a || !usuarioId || !faseId) return;
  try {
    a.removeItem(claveBorrador(usuarioId, faseId));
  } catch {
    /* nada que borrar */
  }
}

/**
 * Autoguardado con espera (no se escribe en cada tecla). Los datos de «dónde estoy» se piden por funciones porque cambian
 * (otra fase, otro usuario) sin que haya que volver a crear el autoguardado.
 * @param {object} o
 * @param {()=>string} o.usuarioId
 * @param {()=>string|null} o.faseId           null/"" = no hay nada que guardar (p. ej. una fase sin editor)
 * @param {()=>string} o.codigoInicial
 * @param {()=>string} o.obtenerCodigo
 * @param {number} [o.retardoMs]
 * @param {Storage|null} [o.almacen]
 */
export function crearAutoguardado({ usuarioId, faseId, codigoInicial, obtenerCodigo, retardoMs = 500, almacen = null }) {
  let temporizador = null;
  let pendiente = false;

  const guardarAhora = () => {
    if (temporizador) clearTimeout(temporizador);
    temporizador = null;
    if (!pendiente) return;
    pendiente = false;
    const fase = faseId();
    if (fase) guardarBorrador(usuarioId(), fase, obtenerCodigo(), codigoInicial(), almacen);
  };

  return {
    /** Hubo un cambio en el editor: se guardará cuando deje de teclear. */
    programar() {
      if (!faseId()) return;
      pendiente = true;
      if (temporizador) clearTimeout(temporizador);
      temporizador = setTimeout(guardarAhora, retardoMs);
    },
    /** Guarda ya (al cambiar de fase, al cerrar o recargar la página). */
    guardarAhora,
    /** La fase se completó o se reinició: se borra el borrador y se cancela lo que estuviera pendiente. */
    descartar() {
      if (temporizador) clearTimeout(temporizador);
      temporizador = null;
      pendiente = false;
      const fase = faseId();
      if (fase) borrarBorrador(usuarioId(), fase, almacen);
    },
  };
}
