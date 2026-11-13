// rendimiento.js
// Control de las animaciones «en reposo» de los escenarios (flotar, ondas, partículas…) para que el juego no se ponga lento.
//
// Qué hace:
//   · Un SOLO bucle por escenario, que se detiene con destruir() (antes cada nivel/fase dejaba un bucle vivo sobre el mismo canvas:
//     tras unos niveles había decenas dibujando a la vez y la página se arrastraba).
//   · Limita los cuadros por segundo del reposo (el movimiento de ejecución sigue a todo ritmo).
//   · Se detiene sola cuando la pestaña está oculta o el canvas no se ve (otra pestaña del celular, fuera de la pantalla).
//   · Modo «auto»: si dibujar tarda demasiado (computadoras o celulares modestos) baja los cuadros y apaga los resplandores
//     (shadowBlur es lo más caro de Canvas 2D); si todo va sobrado, vuelve a subir.
//   · Modo «ligeras»: sin animación en reposo (solo se dibuja cuando pasa algo) y sin resplandores.
//   · Modo «completas»: 30 cuadros por segundo con todos los efectos.
// El estudiante lo elige con el botón «Animaciones» de la barra del juego; se recuerda en localStorage.

export const MODOS_ANIMACION = ["auto", "completas", "ligeras"];
const CLAVE_MODO = "codequest:animaciones";
export const EVENTO_MODO = "codequest:animaciones";

/** Calidad de dibujo compartida: los helpers de resplandor la consultan en cada cuadro. */
export const calidad = { bajo: false };

/** Desenfoque de un resplandor: 0 cuando la calidad es baja. */
export const brilloCalidad = (px) => (calidad.bajo ? 0 : px);

export function leerModo(almacen = null) {
  try {
    const a = almacen ?? (typeof localStorage !== "undefined" ? localStorage : null);
    const valor = a?.getItem(CLAVE_MODO);
    return MODOS_ANIMACION.includes(valor) ? valor : "auto";
  } catch {
    return "auto";
  }
}

export function guardarModo(modo, almacen = null) {
  if (!MODOS_ANIMACION.includes(modo)) return;
  try {
    (almacen ?? localStorage).setItem(CLAVE_MODO, modo);
  } catch {
    /* sin almacenamiento: el modo vale solo para esta visita */
  }
  aplicarModo(modo);
  if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") window.dispatchEvent(new Event(EVENTO_MODO));
}

/** Escucha los cambios de modo (botón «Animaciones»). Devuelve la función que deja de escuchar. */
export function escucharModo(fn) {
  if (typeof window === "undefined" || typeof window.addEventListener !== "function") return () => {};
  window.addEventListener(EVENTO_MODO, fn);
  return () => window.removeEventListener?.(EVENTO_MODO, fn);
}

/** «ligeras» apaga los resplandores desde el primer cuadro; en «completas» siempre están; «auto» lo decide el medidor. */
export function aplicarModo(modo = leerModo()) {
  if (modo === "ligeras") calidad.bajo = true;
  else if (modo === "completas") calidad.bajo = false;
}

/** Cuadros por segundo del reposo en cada modo (auto va de mayor a menor según la carga). */
const NIVELES_FPS = { auto: [24, 15, 8], completas: [30], ligeras: [] };
const UMBRAL_LENTO_MS = 9; // un dibujo de reposo que tarda más que esto (promedio) hace bajar los cuadros
const UMBRAL_SOBRADO_MS = 3; // y uno que tarda menos que esto permite volver a subirlos

/**
 * @param {object} o
 * @param {HTMLCanvasElement} o.canvas
 * @param {()=>void} o.dibujar          dibuja un cuadro de reposo
 * @param {()=>boolean} [o.ocupado]     true mientras una animación de ejecución ya está dibujando cada cuadro
 * @param {()=>string} [o.modo]
 * @param {object} [o.entorno]          para pruebas: { raf, caf, ahora, doc, IO }
 */
export function crearBucleReposo({ canvas, dibujar, ocupado = () => false, modo = () => leerModo(), entorno = {} }) {
  const raf = entorno.raf ?? (typeof requestAnimationFrame === "function" ? requestAnimationFrame.bind(globalThis) : null);
  const caf = entorno.caf ?? (typeof cancelAnimationFrame === "function" ? cancelAnimationFrame.bind(globalThis) : () => {});
  const ahora = entorno.ahora ?? (() => (typeof performance !== "undefined" ? performance.now() : Date.now()));
  const doc = entorno.doc ?? (typeof document !== "undefined" ? document : null);
  const IO = entorno.IO ?? (typeof IntersectionObserver !== "undefined" ? IntersectionObserver : null);

  let corriendo = false;
  let id = null;
  let ultimoCuadro = -Infinity;
  let canvasVisible = true;
  let observador = null;
  let nivel = 0;
  let promedioMs = 0;
  let cuadrosEnNivel = 0;
  let cuadrosTotales = 0;

  const niveles = () => NIVELES_FPS[modo()] ?? NIVELES_FPS.auto;
  const fpsActual = () => {
    const n = niveles();
    return n.length ? n[Math.min(nivel, n.length - 1)] : 0;
  };

  const debeCorrer = () => corriendo && Boolean(raf) && fpsActual() > 0 && !(doc && doc.hidden) && canvasVisible && canvas?.isConnected !== false;

  function programar() {
    if (id !== null || !debeCorrer()) return;
    id = raf(cuadro);
  }

  function medir(ms) {
    if (modo() !== "auto") return;
    promedioMs = cuadrosTotales === 0 ? ms : promedioMs * 0.85 + ms * 0.15;
    cuadrosTotales++;
    cuadrosEnNivel++;
    const n = niveles();
    if (promedioMs > UMBRAL_LENTO_MS && nivel < n.length - 1 && cuadrosEnNivel >= 5) {
      nivel++;
      calidad.bajo = true; // sin resplandores: es lo que más cuesta
      cuadrosEnNivel = 0;
    } else if (promedioMs < UMBRAL_SOBRADO_MS && nivel > 0 && cuadrosEnNivel >= 90) {
      nivel--;
      if (nivel === 0) calidad.bajo = false;
      cuadrosEnNivel = 0;
    }
  }

  function cuadro(t) {
    id = null;
    if (!corriendo) return;
    if (canvas && canvas.isConnected === false) {
      detener(); // el canvas ya no está en la página: nadie vería este bucle
      return;
    }
    if (!debeCorrer()) return; // en pausa: se retomará solo (visibilidad, intersección o cambio de modo)
    const intervalo = 1000 / fpsActual();
    if (t - ultimoCuadro >= intervalo - 2 && !ocupado()) {
      ultimoCuadro = t;
      const inicio = ahora();
      dibujar();
      medir(ahora() - inicio);
    }
    programar();
  }

  const alCambiarVisibilidad = () => programar();

  function iniciar() {
    if (corriendo) {
      programar(); // por si el modo cambió (de «ligeras» a otro)
      return;
    }
    corriendo = true;
    doc?.addEventListener("visibilitychange", alCambiarVisibilidad);
    if (IO && canvas) {
      observador = new IO((entradas) => {
        canvasVisible = entradas.at(-1)?.isIntersecting !== false;
        programar();
      });
      observador.observe(canvas);
    }
    programar();
  }

  function detener() {
    corriendo = false;
    if (id !== null) caf(id);
    id = null;
    doc?.removeEventListener("visibilitychange", alCambiarVisibilidad);
    observador?.disconnect();
    observador = null;
  }

  return {
    iniciar,
    detener,
    /** Para reaccionar al cambio de modo: reinicia el medidor y retoma o pausa el bucle. */
    reconfigurar() {
      nivel = 0;
      promedioMs = 0;
      cuadrosEnNivel = 0;
      cuadrosTotales = 0;
      if (!corriendo) return;
      if (fpsActual() === 0 && id !== null) {
        caf(id);
        id = null;
      } else programar();
    },
    get activo() {
      return corriendo;
    },
    get enEspera() {
      return id !== null;
    },
    get fps() {
      return fpsActual();
    },
    get nivel() {
      return nivel;
    },
  };
}
