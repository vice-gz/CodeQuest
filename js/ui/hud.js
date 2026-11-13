// hud.js
// Interfaz «de videojuego» de la pantalla del nivel:
//   · MISIÓN de una línea sobre la escena (el texto largo queda en «Más info»).
//   · Progreso del nivel (fases) y LÁMPARAS de casos de prueba (✓ / ✗ con símbolo, no solo color).
//   · Nix en el rincón de la escena: da la pista CORTA con su cara (feliz / preocupado) y un botón «Ver detalle» que abre el
//     panel de retroalimentación completo (que sigue existiendo: ahí están el caso exacto que falló y la explicación).
// Nada de esto cambia la lógica del juego: lee el panel de retroalimentación con un MutationObserver, así no hay que tocar cada
// punto donde se muestra un resultado.

import { pintarNix } from "../game/pixel.js";

const MAX_GLOBO = 150;

/** Recorta en el último espacio antes del límite y añade «…». */
export function recortar(texto, max = MAX_GLOBO) {
  const t = String(texto ?? "").replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const corte = t.slice(0, max - 1);
  const espacio = corte.lastIndexOf(" ");
  return `${(espacio > max * 0.6 ? corte.slice(0, espacio) : corte).replace(/[,;:.\s]+$/, "")}…`;
}

const sinHtml = (s) => String(s ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
const primeraOracion = (s) => {
  const t = sinHtml(s);
  const m = /^(.+?[.!?])(\s|$)/.exec(t);
  return m ? m[1] : t;
};

/**
 * Misión de UNA línea de la fase. Si la fase trae `mision`, se usa tal cual (así los retos con requisitos finos, como «Cambio: X»,
 * no pierden nada). Si no, se deduce: EXPLORAR/PREDECIR usan su título; las demás, la primera oración del enunciado.
 */
export function misionCorta(fase) {
  if (!fase) return "";
  if (fase.mision) return recortar(fase.mision, 180);
  switch (fase.tipo) {
    case "EXPLORAR":
      return recortar(`Ejecuta y observa: ${fase.titulo}`, 120);
    case "PREDECIR":
      return recortar(`Predice qué pasa: ${fase.titulo}`, 120);
    case "ORDENAR":
      return recortar(`Ordena las tarjetas: ${fase.titulo}`, 120);
    default:
      return recortar(primeraOracion(fase.enunciado) || fase.titulo, 180);
  }
}

/** Qué le dice Nix al estudiante según lo que muestra el panel de retroalimentación. null = nada que decir. */
export function resumirFeedback(contenedor) {
  if (!contenedor) return null;
  if (contenedor.querySelector(".indicador-carga")) return null; // «COMPROBANDO…»: todavía no hay resultado nuevo (el contenido es el anterior)
  const c = contenedor.classList;
  const txt = (sel) => sinHtml(contenedor.querySelector(sel)?.textContent || "");
  if (c.contains("feedback-exito")) {
    const consejo = txt(".feedback-consejo").replace(/^💡\s*/, "");
    const titulo = txt(".feedback-encabezado strong") || txt(".feedback-encabezado");
    const cuerpo = txt(".feedback-texto");
    return { estado: "exito", texto: recortar(consejo || [titulo, cuerpo].filter(Boolean).join(" ")) };
  }
  if (c.contains("feedback-pista")) return { estado: "pista", texto: recortar(txt(".feedback-texto")) };
  if (c.contains("feedback-error")) {
    // Qué casos fallaron: «el caso 1» / «los casos 2, 3» (el nombre largo de cada caso queda en el detalle)
    const todos = [...contenedor.querySelectorAll(".feedback-casos li")];
    const malos = todos.map((li, i) => (li.classList.contains("caso-mal") ? i + 1 : null)).filter(Boolean);
    if (malos.length) {
      const cuales = malos.length === 1 ? `el caso ${malos[0]}` : `los casos ${malos.slice(0, 4).join(", ")}${malos.length > 4 ? "…" : ""}`;
      return { estado: "error", texto: recortar(`Todavía no: falló ${cuales}. ${txt(".feedback-texto")}`) };
    }
    const titulo = txt(".feedback-encabezado strong");
    const linea = txt(".feedback-linea");
    const idea = txt(".feedback-sugerencia").replace(/^💡\s*/, "") || txt(".feedback-texto");
    return { estado: "error", texto: recortar([linea && `${linea}:`, titulo, idea && `· ${idea}`].filter(Boolean).join(" ")) };
  }
  return null;
}

const CARA = { exito: "feliz", error: "preocupado", pista: "normal", neutral: "normal" };

export class Hud {
  /**
   * @param {object} r  elementos del DOM
   * @param {object} [o]
   * @param {()=>boolean} [o.esMovil]      true cuando el juego usa pestañas (celular / tablet vertical)
   * @param {()=>void} [o.irAAprende]      cambia a la pestaña Aprende (solo celular)
   */
  constructor(r, { esMovil = () => false, irAAprende = () => {} } = {}) {
    this.r = r;
    this.esMovil = esMovil;
    this.irAAprende = irAAprende;
    this.observador = null;
    r.btnMasInfo?.addEventListener("click", () => this.alternarMasInfo());
    r.btnNixDetalle?.addEventListener("click", () => this.plegarFeedback(false, { desplazar: true }));
    r.btnFeedbackDetalle?.addEventListener("click", () => this.plegarFeedback(this.r.panelFeedback?.dataset.plegado !== "true"));
    this.pintarNix("normal");
  }

  // ---- misión y progreso
  ponerMision(fase) {
    if (this.r.misionTexto) this.r.misionTexto.textContent = misionCorta(fase);
  }

  ponerFases(fases, indice, completadas = new Set()) {
    const cont = this.r.fases;
    if (!cont) return;
    cont.innerHTML = "";
    cont.setAttribute("aria-label", `Fase ${indice + 1} de ${fases.length}`);
    cont.hidden = fases.length < 2;
    fases.forEach((f, i) => {
      const hecha = completadas.has(f.id);
      const punto = document.createElement("span");
      punto.className = "hud-fase";
      punto.dataset.estado = i === indice ? "actual" : hecha ? "hecha" : "pendiente";
      punto.textContent = hecha && i !== indice ? "✓" : i === indice ? "●" : "○";
      punto.title = `Fase ${i + 1}: ${f.titulo}${hecha ? " (hecha)" : ""}`;
      cont.appendChild(punto);
    });
    const texto = document.createElement("span");
    texto.className = "hud-fases-texto";
    texto.textContent = `Fase ${indice + 1}/${fases.length}`;
    cont.appendChild(texto);
  }

  // ---- lámparas de casos
  ponerCasos(casos, activo, alElegir) {
    const cont = this.r.diodos;
    if (!cont) return;
    cont.innerHTML = "";
    cont.hidden = !casos || casos.length < 1;
    this.casos = casos || [];
    (casos || []).forEach((caso, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "hud-diodo";
      b.dataset.estado = "pendiente";
      b.dataset.indice = String(i);
      b.setAttribute("aria-pressed", String(i === activo));
      b.title = caso.etiqueta || `Caso ${i + 1}`;
      b.setAttribute("aria-label", `${caso.etiqueta || `Caso ${i + 1}`}: sin probar`);
      b.innerHTML = '<span class="hud-diodo-simbolo" aria-hidden="true">○</span><span class="hud-diodo-numero" aria-hidden="true"></span>';
      b.querySelector(".hud-diodo-numero").textContent = String(i + 1);
      if (alElegir) b.addEventListener("click", () => alElegir(i));
      cont.appendChild(b);
    });
  }

  marcarActivo(activo) {
    this.r.diodos?.querySelectorAll(".hud-diodo").forEach((b, i) => b.setAttribute("aria-pressed", String(i === activo)));
  }

  /** @param {(boolean|null)[]} resultados */
  marcarCasos(resultados) {
    this.r.diodos?.querySelectorAll(".hud-diodo").forEach((b, i) => {
      const ok = resultados[i];
      const estado = ok === true ? "ok" : ok === false ? "mal" : "pendiente";
      b.dataset.estado = estado;
      b.querySelector(".hud-diodo-simbolo").textContent = ok === true ? "✓" : ok === false ? "✗" : "○";
      const nombre = this.casos?.[i]?.etiqueta || `Caso ${i + 1}`;
      b.setAttribute("aria-label", `${nombre}: ${ok === true ? "correcto" : ok === false ? "falló" : "sin probar"}`);
    });
  }

  reiniciarCasos() {
    this.marcarCasos([]);
  }

  // ---- «Más info»
  alternarMasInfo(abierto) {
    const panel = this.r.masInfo;
    if (this.esMovil()) {
      this.irAAprende(); // en celular el texto largo vive en la pestaña Aprende
      return;
    }
    if (!panel) return;
    const abrir = typeof abierto === "boolean" ? abierto : panel.dataset.abierto !== "true";
    panel.dataset.abierto = String(abrir);
    this.r.btnMasInfo?.setAttribute("aria-expanded", String(abrir));
  }

  /** Abre «Más info» solo la primera vez que la persona entra a un nivel (así lee el contexto sin que estorbe después). */
  abrirSiEsPrimeraVez(clave, almacen = null) {
    let primera = false;
    try {
      const a = almacen ?? (typeof localStorage !== "undefined" ? localStorage : null);
      if (a && a.getItem(clave) !== "1") {
        a.setItem(clave, "1");
        primera = true;
      }
    } catch {
      primera = false;
    }
    if (primera && !this.esMovil()) this.alternarMasInfo(true);
    else if (this.r.masInfo && !this.esMovil()) this.alternarMasInfo(false);
    return primera;
  }

  // ---- Nix
  pintarNix(estado) {
    const canvas = this.r.nixSprite;
    const ctx = canvas?.getContext?.("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pintarNix(ctx, 0, 0, CARA[estado] ?? "normal", 2);
  }

  mostrarGlobo(estado, texto) {
    const g = this.r.globo;
    if (!g) return;
    g.hidden = false;
    g.dataset.estado = estado;
    this.r.globoTexto.textContent = texto;
    this.pintarNix(estado);
  }

  ocultarGlobo() {
    if (this.r.globo) this.r.globo.hidden = true;
  }

  // ---- retroalimentación plegada
  plegarFeedback(plegar, { desplazar = false } = {}) {
    const p = this.r.panelFeedback;
    if (!p) return;
    p.dataset.plegado = String(plegar);
    this.r.btnFeedbackDetalle?.setAttribute("aria-expanded", String(!plegar));
    if (this.r.btnFeedbackDetalle) this.r.btnFeedbackDetalle.textContent = plegar ? "Ver detalle ▾" : "Ocultar detalle ▴";
    if (!plegar && desplazar) p.scrollIntoView?.({ block: "nearest", behavior: "smooth" });
  }

  /** Cada cambio del panel de retroalimentación actualiza a Nix. Las pistas abren el detalle (las pidió la persona). */
  observarFeedback() {
    const cont = this.r.feedbackContenido;
    if (!cont || this.observador || typeof MutationObserver === "undefined") return;
    const actualizar = () => {
      const r = resumirFeedback(cont);
      if (!r) {
        this.ocultarGlobo();
        return;
      }
      this.mostrarGlobo(r.estado, r.texto);
      this.plegarFeedback(r.estado !== "pista");
    };
    this.observador = new MutationObserver(actualizar);
    this.observador.observe(cont, { childList: true, attributes: true, attributeFilter: ["class"] });
  }

  destruir() {
    this.observador?.disconnect();
    this.observador = null;
  }
}
