// cargando.js
// Indicadores de carga: a veces la latencia de Supabase hace que parezca que el botón no hizo nada. Todos esperan un instante
// antes de aparecer (si todo es rápido, nunca se ven) y se quitan solos al terminar.

/**
 * Línea «CARGANDO…» al estilo retro dentro de un panel (la consola o el panel de retroalimentación).
 * @param {object} o
 * @param {HTMLElement} o.contenedor
 * @param {string} o.texto
 * @param {number} [o.retardoMs]
 */
export function crearIndicadorCarga({ contenedor, texto, retardoMs = 150 }) {
  let temporizador = null;
  let elemento = null;
  return {
    iniciar() {
      this.terminar();
      temporizador = setTimeout(() => {
        temporizador = null;
        elemento = document.createElement("p");
        elemento.className = "indicador-carga";
        elemento.setAttribute("role", "status");
        elemento.innerHTML = '<span class="carga-giro" aria-hidden="true"></span><span class="carga-texto"></span><span class="carga-cursor" aria-hidden="true">▌</span>';
        elemento.querySelector(".carga-texto").textContent = texto;
        contenedor.appendChild(elemento);
      }, retardoMs);
    },
    terminar() {
      if (temporizador) clearTimeout(temporizador);
      temporizador = null;
      elemento?.remove();
      elemento = null;
    },
    get visible() {
      return Boolean(elemento?.isConnected);
    },
  };
}

/**
 * Capa de «CARGANDO…» que cubre el área de juego mientras se prepara un nivel (progreso desde Supabase, escenario, fase).
 * @param {HTMLElement|null} elemento  el <div id="cargando-nivel"> de juego.html
 */
export function crearCargaNivel(elemento) {
  let temporizador = null;
  return {
    /** retardoMs = 0: se muestra ya (primera carga de la página). */
    mostrar(retardoMs = 0) {
      if (!elemento) return;
      if (temporizador) clearTimeout(temporizador);
      const poner = () => {
        temporizador = null;
        elemento.hidden = false;
        elemento.ownerDocument?.body?.setAttribute("aria-busy", "true");
      };
      if (retardoMs > 0) temporizador = setTimeout(poner, retardoMs);
      else poner();
    },
    ocultar() {
      if (!elemento) return;
      if (temporizador) clearTimeout(temporizador);
      temporizador = null;
      elemento.hidden = true;
      elemento.ownerDocument?.body?.removeAttribute("aria-busy");
    },
  };
}
