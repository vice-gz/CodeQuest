// juego.js (antes main.js)
// Orquesta el juego de CodeQuest: 5 mundos, 59 niveles (con Nivel 0 y jefes), sistema de fases y
// 3 paneles en vivo. Ciclo por fase: código -> Lexer -> Parser -> Validator ->
// Interpreter (async) -> ESCENARIO DEL MUNDO (laboratorio, memoria, mesa de
// cartas o elevador) -> paneles en vivo -> retroalimentación -> progreso.
// Cada mundo tiene su propio escenario (js/game/escenarios/); este archivo solo
// habla con la interfaz común de escenarios, no con Robot1 directamente.
// Se abre con juego.html?mundo=N (desde el mapa de mundos). Otros modos:
//   ?modo=sandbox  Laboratorio Libre (no guarda nada)
//   ?demo=true     Solo admins: todo desbloqueado y progreso en localStorage

import { Lexer } from "./interpreter/lexer.js";
import { Parser } from "./interpreter/parser.js";
import { Validator } from "./interpreter/validator.js";
import { CQLError, Errores } from "./interpreter/errors.js";

import { crearEscenario, configDeFase } from "./game/escenarios/index.js";
import { ejecutarPrograma, evaluarFase } from "./game/evaluacion.js";
import { aplicarTema } from "./game/paletas.js";
import { mundoAbierto } from "./game/desbloqueo.js";

import { CodeEditor } from "./ui/codeEditor.js";
import { Feedback } from "./ui/feedback.js";
import { OutputPanel } from "./ui/outputPanel.js";
import { MemoryPanel } from "./ui/memoryPanel.js";
import { StatePanel } from "./ui/statePanel.js";
import { PhaseBar } from "./ui/phases.js";
import { renderizarEstrellas, calcularEstrellasNivel } from "./ui/stars.js";

import { Dictionary } from "./ui/dictionary.js";
import { Tour, PASOS_NIVEL_0 } from "./ui/tour.js";
import { ModoDemo } from "./ui/demoMode.js";
import { abrirGlosario, mostrarBienvenidaMundo, CONCEPTOS } from "./ui/conceptos.js";
import {
  configurarPestanas,
  seguirTeclado,
  marcarEdicion,
  configurarAvisoOrientacion,
  configurarBarraSimbolos,
  prepararEjecucion,
  mostrarResultado,
} from "./ui/movil.js";
import { esRolAdmin } from "./util.js";

import { SupabaseProgressRepository } from "./persistence/SupabaseProgressRepository.js";
import { LocalStorageProgressRepository } from "./persistence/LocalStorageProgressRepository.js";
import { NoopProgressRepository } from "./persistence/NoopProgressRepository.js";
import { NIVEL_SANDBOX } from "./game/sandbox.js";
import { mostrarTransicionMundo } from "./ui/transicionMundo.js";
import { resultadoDeError, RESULTADO_EXITO, RESULTADO_OBJETIVO_NO_ALCANZADO } from "./persistence/progreso.js";

import { supabase } from "./supabase.js";
import { protegerPagina } from "./auth.js";
import { renderizarNav } from "./nav.js";
import { PanelTarjetas } from "./ui/tarjetas.js";
import { PASOS_MUNDO, tourDeMundoVisto, marcarTourDeMundoVisto } from "./ui/toursMundo.js";
import { mensajeEficiencia } from "./game/eficiencia.js";
import { Hud } from "./ui/hud.js";
import { PLANTILLAS, plantillaMetodo, insertarEnEditor } from "./ui/chipsInsercion.js";
import { ContadorLineas } from "./ui/contadorLineas.js";
import { listarRequisitos } from "./game/requisitos.js";
import { MODOS_ANIMACION, leerModo, guardarModo, aplicarModo } from "./game/rendimiento.js";
import { crearAutoguardado, leerBorrador } from "./game/autoguardado.js";
import { registrarLineas, totalLineasEscritas } from "./game/lineasEscritas.js";
import { crearIndicadorCarga, crearCargaNivel } from "./ui/cargando.js";
import { mostrarPantallaFinal } from "./ui/pantallaFinal.js";
import { evaluarEleccion } from "./game/ordenar.js";
import { catalogo, obtenerNivel, mundoDeNivel, TOTAL_NIVELES, MAX_ESTRELLAS, ordinalDeNivel, nivelPorOrdinal, siguienteNivel, REQUERIDOS_POR_MUNDO } from "./game/catalogo.js";

// El repositorio se elige al arrancar: Supabase (normal), localStorage (demo de
// admin) o uno que no guarda nada (Laboratorio Libre, ?modo=sandbox).
let repo = null;
let esSandbox = false;
let usuarioActual = "anon"; // para el autoguardado y el conteo de líneas (se fija al iniciar sesión)

// Todas las ejecuciones guardan el concepto que evalúa el nivel (concepto_evaluado).
function guardarEjecucion(datos) {
  return repo.guardarEjecucion({ ...datos, conceptoEvaluado: nivelData?.concepto_evaluado ?? null });
}

// Aviso discreto cuando no hay conexión con Supabase o algo no se pudo guardar.
function mostrarEstadoRed({ conectado, pendientes, falloPermanente }) {
  const aviso = document.getElementById("aviso-red");
  if (!aviso) return;
  if (falloPermanente) {
    aviso.textContent = "No se pudo guardar una parte de tu progreso. Avisa a tu profesor o administrador.";
    aviso.classList.remove("oculto");
    return;
  }
  if (!conectado) {
    aviso.textContent =
      "Sin conexión con el servidor. Puedes seguir jugando: tu progreso se guarda en este dispositivo y se enviará cuando vuelva la conexión.";
    aviso.classList.remove("oculto");
  } else if (pendientes === 0) {
    aviso.classList.add("oculto");
  }
}

// ---------- Elementos del DOM ----------
const el = {
  selectorNiveles: document.getElementById("selector-niveles"),
  totalEstrellas: document.getElementById("total-estrellas"),
  totalEstrellasMax: document.getElementById("total-estrellas-max"),

  barraFases: document.getElementById("barra-fases"),
  tituloNivel: document.getElementById("titulo-nivel"),
  etiquetaConcepto: document.getElementById("etiqueta-concepto"),
  textoNarrativa: document.getElementById("texto-narrativa"),
  textoAprende: document.getElementById("texto-aprende"),
  listaInstrucciones: document.getElementById("lista-instrucciones"),
  etiquetaObjetivo: document.getElementById("etiqueta-objetivo"),

  lienzo: document.getElementById("lienzo-mundo"),

  salidaContenido: document.getElementById("salida-contenido"),
  memoriaContenido: document.getElementById("memoria-contenido"),
  estadoContenido: document.getElementById("estado-contenido"),

  numerosLinea: document.getElementById("numeros-linea"),
  editorTextarea: document.getElementById("editor-codigo"),
  btnEjecutar: document.getElementById("btn-ejecutar"),
  btnReiniciar: document.getElementById("btn-reiniciar"),
  btnPista: document.getElementById("btn-pista"),

  prediccionEnvoltura: document.getElementById("prediccion-envoltura"),
  tarjetasEnvoltura: document.getElementById("tarjetas-envoltura"),
  lenguajeTag: document.getElementById("lenguaje-tag"),
  tituloCodigo: document.getElementById("titulo-codigo"),
  prediccionEnunciado: document.getElementById("prediccion-enunciado"),
  prediccionOpciones: document.getElementById("prediccion-opciones"),

  btnDiccionario: document.getElementById("btn-diccionario"),
  diccionarioPanel: document.getElementById("diccionario-panel"),
  dicContador: document.getElementById("dic-contador"),
  btnTour: document.getElementById("btn-tour"),
  btnConceptos: document.getElementById("btn-conceptos"),
  panelMundo: document.querySelector(".panel-mundo"),
  panelFeedback: document.querySelector(".panel-feedback"),
  barraSimbolos: document.getElementById("barra-simbolos"),
  avisoOrientacion: document.getElementById("aviso-orientacion"),
  avisoOrientacionCerrar: document.getElementById("aviso-orientacion-cerrar"),
  btnMapa: document.getElementById("btn-mapa"),
  selectorCasos: document.getElementById("selector-casos"),
  tituloMundo: document.getElementById("titulo-mundo"),
  tituloEstado: document.getElementById("titulo-estado"),
  panelEstado: document.querySelector(".panel-estado"),
  accionesBarra: document.querySelector(".acciones-barra"),

  estrellasNivel: document.getElementById("estrellas-nivel"),
  feedbackContenido: document.getElementById("feedback-contenido"),
};

el.totalEstrellasMax.textContent = String(MAX_ESTRELLAS);

const codeEditor = new CodeEditor({ textareaEl: el.editorTextarea, lineNumbersEl: el.numerosLinea });
const feedback = new Feedback(el.feedbackContenido);
const outputPanel = new OutputPanel(el.salidaContenido);
const memoryPanel = new MemoryPanel(el.memoriaContenido);
const panelTarjetas = new PanelTarjetas({
  envoltura: document.getElementById("tarjetas-envoltura"),
  banco: document.getElementById("tarjetas-banco"),
  diagrama: document.getElementById("tarjetas-diagrama"),
  btnReiniciar: document.getElementById("btn-tarjetas-reiniciar"),
});
let ordenElegido = []; // Nivel 0: ids de las tarjetas ya aceptadas
const statePanel = new StatePanel(el.estadoContenido);

// 3.2 · Feedback de carga (consola, comprobación del resultado y capa de «CARGANDO...» del nivel)
const cargaNivel = crearCargaNivel(document.getElementById("cargando-nivel"));
const indicadorEjecucion = crearIndicadorCarga({ contenedor: el.salidaContenido, texto: "EJECUTANDO...", retardoMs: 150 });
const indicadorComprobacion = crearIndicadorCarga({ contenedor: el.feedbackContenido, texto: "COMPROBANDO TU RESULTADO...", retardoMs: 250 });

// 3.3 · Autoguardado del código en localStorage (se recupera tras recargar la página con F5)
const fasePideCodigo = (f) => Boolean(f) && !["PREDECIR", "ORDENAR"].includes(f.tipo);
const autoguardado = crearAutoguardado({
  usuarioId: () => usuarioActual,
  faseId: () => (esSandbox || !fasePideCodigo(faseData) ? null : faseData.id),
  codigoInicial: () => faseData?.codigoInicial || "",
  obtenerCodigo: () => codeEditor.obtenerCodigo(),
});
const contador = new ContadorLineas(document.getElementById("contador-lineas"));
// Límite recomendado: el de la fase o, si no, el del nivel (`max_lineas_recomendadas` en el JSON). Sin límite solo cuenta.
const limiteDeLineas = () => faseData?.max_lineas_recomendadas ?? nivelData?.max_lineas_recomendadas ?? null;
function actualizarContador() {
  contador.ocultar(!fasePideCodigo(faseData));
  contador.actualizar(codeEditor.obtenerCodigo(), limiteDeLineas());
}
el.editorTextarea.addEventListener("input", () => {
  autoguardado.programar();
  actualizarContador();
});
window.addEventListener("pagehide", () => {
  autoguardado.guardarAhora();
  escenario?.destruir?.();
});
document.addEventListener("visibilitychange", () => document.visibilityState === "hidden" && autoguardado.guardarAhora());
const phaseBar = new PhaseBar(el.barraFases);

// Interfaz «de videojuego»: misión de una línea, progreso, lámparas de casos y Nix con su globo (ver ui/hud.js).
const porId = (id) => document.getElementById(id);
const hud = new Hud(
  {
    misionTexto: porId("hud-mision-texto"),
    fases: porId("hud-fases"),
    diodos: porId("hud-diodos"),
    btnMasInfo: porId("btn-mas-info"),
    masInfo: porId("mas-info"),
    globo: porId("nix-globo"),
    globoTexto: porId("nix-texto"),
    btnNixDetalle: porId("btn-nix-detalle"),
    nixSprite: porId("nix-sprite"),
    panelFeedback: document.querySelector(".panel-feedback"),
    btnFeedbackDetalle: porId("btn-feedback-detalle"),
    feedbackContenido: el.feedbackContenido,
  },
  {
    esMovil: () => typeof window.matchMedia === "function" && window.matchMedia("(max-width: 992px)").matches,
    irAAprende: () => pestanas.seleccionar("aprende", { subir: false }),
  }
);
hud.observarFeedback();
let hudCasosFase = null; // fase para la que ya están dibujadas las lámparas de casos
let hudNivel = null; // nivel para el que ya se decidió si «Más info» se abre
const diccionario = new Dictionary(el.diccionarioPanel, el.btnDiccionario, el.dicContador);
// El tour cambia de pestaña (Jugar / Aprende / Consola) cuando el elemento que explica está en otra.
const tour = new Tour({ alNecesitarPestana: (pestana) => pestanas.seleccionar(pestana, { subir: false }) });
const tourNivel0 = new Tour({
  alNecesitarPestana: (pestana) => pestanas.seleccionar(pestana, { subir: false }),
  pasos: PASOS_NIVEL_0,
  alTerminar: () => Tour.marcarVistoNivel0(),
});
let arranqueListo = false;

let nivelActualId = 1;
let nivelData = null;
let faseIndice = 0;
let faseData = null;
let mundoActualId = 1;

let escenario = null; // escenario del mundo actual (js/game/escenarios/)
let casoVisual = 0; // caso (mesa, edificio...) que se ve con animación
let enDemo = false;
let pistaIndiceActual = 0;
let enEjecucion = false;

// ---------- Carga de niveles ----------

async function cargarNivel(id) {
  // Los niveles vienen empaquetados en el catálogo (game/catalogo.js).
  const nivel = obtenerNivel(id);
  if (!nivel) throw new Error(`No se pudo cargar el nivel ${id}`);
  return nivel;
}

const urlJuego = (mundo) => `juego.html?mundo=${mundo}${enDemo ? "&demo=true" : ""}`;
const urlMapa = () => `mundos.html${enDemo ? "?demo=true" : ""}`;

async function irANivel(id) {
  cargaNivel.mostrar(150); // si preparar el nivel tarda (red lenta), se ve «CARGANDO...»; si es rápido, no aparece
  try {
    await prepararNivel(id);
    if (arranqueListo && !esSandbox) {
      if (id === 0 && !Tour.yaSeVioNivel0()) {
        setTimeout(() => tourNivel0.iniciar(), 450);
      } else if (id >= 1 && !Tour.yaSeVio()) {
        setTimeout(() => tour.iniciar(), 450);
      }
    }
  } finally {
    cargaNivel.ocultar();
  }
}

async function prepararNivel(id) {
  nivelActualId = id;
  mundoActualId = mundoDeNivel(id);
  nivelData = await cargarNivel(id);

  const estadoNivel = await repo.obtenerEstadoNivel(mundoActualId, id);
  faseIndice = nivelData.fases.findIndex((f) => !estadoNivel.fases[f.id]?.completada);
  if (faseIndice === -1) faseIndice = 0; // nivel ya completo: se puede repasar desde el inicio

  const ordinal = ordinalDeNivel(id); // el Nivel 0 es 0; los ids no son consecutivos
  el.tituloNivel.textContent = `${nivelData.jefe ? "👑 Nivel Jefe" : `Nivel ${ordinal}`} — ${nivelData.nombre}`;
  el.etiquetaConcepto.textContent = nivelData.concepto;
  el.textoNarrativa.textContent = nivelData.narrativa || "";
  renderizarEstrellas(el.estrellasNivel, estadoNivel.estrellas);

  await cargarFase(faseIndice);
  pestanas.seleccionar("jugar", { subir: false }); // en celular cada nivel empieza en «Jugar»
  await renderSelectorNiveles();
  await actualizarContadorTotal();
  await actualizarDiccionario();
}

// Crea el escenario de la fase (y del caso elegido) sobre el mismo canvas.
function montarEscenario(casoIndice = 0) {
  casoVisual = casoIndice;
  const caso = faseData.casos?.[casoIndice] ?? null;
  // Cada escenario anterior dejaba su animación de reposo viva sobre el mismo canvas: se detiene antes de crear el siguiente.
  escenario?.destruir?.();
  escenario = crearEscenario(configDeFase(nivelData, faseData, caso), { canvas: el.lienzo });
  document.body.dataset.escenario = escenario.tipo; // el Mundo 1 alterna escenarios: el CSS de la consola de datos sigue al escenario, no al mundo
  escenario.ajustarTamano();

  el.tituloMundo.textContent = escenario.tituloPanel;
  el.etiquetaObjetivo.textContent = escenario.etiquetaObjetivo || "";
  el.lienzo.setAttribute("aria-label", `Escenario: ${escenario.tituloPanel}`);
  el.tituloEstado.textContent = escenario.tituloEstado || "";
  el.panelEstado.classList.toggle("oculto", !escenario.tituloEstado);

  actualizarPanelEstado();
  memoryPanel.limpiar();
  // Lo que el escenario ya define (carta1, total...) aparece en Memoria desde el inicio.
  Object.entries(escenario.variablesIniciales).forEach(([nombre, valor]) => memoryPanel.actualizar(nombre, valor));
  renderSelectorCasos();
}

function actualizarPanelEstado() {
  if (escenario.tituloEstado) statePanel.mostrarFilas(escenario.filasEstado());
}

function renderSelectorCasos() {
  const casos = faseData.casos || [];
  // Las lámparas del HUD (una por caso) sustituyen visualmente a los botones de caso; se crean una vez por fase.
  if (hudCasosFase !== faseData.id) {
    hud.ponerCasos(casos, casoVisual, (i) => cambiarCaso(i));
    hudCasosFase = faseData.id;
  } else hud.marcarActivo(casoVisual);
  el.selectorCasos.classList.toggle("oculto", casos.length < 2);
  el.selectorCasos.innerHTML = "";
  if (casos.length < 2) return;
  casos.forEach((caso, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "caso-boton";
    b.textContent = caso.etiqueta || `Caso ${i + 1}`;
    b.setAttribute("aria-pressed", String(i === casoVisual));
    if (i === casoVisual) b.classList.add("activo");
    b.addEventListener("click", () => cambiarCaso(i));
    el.selectorCasos.appendChild(b);
  });
}

// Cambiar de mesa/edificio NO borra el código del estudiante.
function cambiarCaso(i) {
  if (enEjecucion || i === casoVisual) return;
  outputPanel.mostrarVacio(mensajeSalidaVacia());
  montarEscenario(i);
  feedback.mostrarInicial(`${faseData.casos[i].etiqueta || `Caso ${i + 1}`}: ${mensajeInicialFase(faseData)}`);
}

async function cargarFase(indice) {
  autoguardado.guardarAhora(); // lo que se estaba escribiendo en la fase anterior no se pierde al cambiar de fase
  faseIndice = indice;
  faseData = nivelData.fases[indice];
  pistaIndiceActual = 0;
  hudCasosFase = null;
  hud.ponerMision(faseData);
  hud.ocultarGlobo();
  hud.plegarFeedback(true);
  if (hudNivel !== nivelActualId) {
    hudNivel = nivelActualId;
    hud.abrirSiEsPrimeraVez(`codequest:masinfo:${usuarioActual}:${nivelActualId}`);
  }

  montarEscenario(0);

  el.textoAprende.innerHTML = `<strong>${faseData.titulo}</strong><br>${faseData.enunciado}`;
  renderInstruccionesPermitidas(faseData);

  codeEditor.establecerCodigo(faseData.codigoInicial || "");
  codeEditor.limpiarMarcaError();
  codeEditor.deshabilitar(false);

  outputPanel.mostrarVacio(mensajeSalidaVacia());
  feedback.mostrarInicial(mensajeInicialFase(faseData));

  // 3.3 · ¿Había código escrito antes de recargar? Se recupera (y se avisa).
  if (!esSandbox && fasePideCodigo(faseData)) {
    const borrador = leerBorrador(usuarioActual, faseData.id);
    if (borrador !== null && borrador !== (faseData.codigoInicial || "")) {
      codeEditor.establecerCodigo(borrador);
      feedback.mostrarInicial("Recuperamos el código que tenías escrito antes de salir de la página. Puedes seguir desde ahí o presionar Reiniciar para empezar de cero.");
    }
  }

  actualizarContador();
  el.listaInstrucciones.querySelectorAll(".chip-insertable").forEach((b) => {
    b.disabled = el.editorTextarea.disabled; // sin editor (predecir, ordenar) no hay dónde insertar
  });

  const estadoNivel = await repo.obtenerEstadoNivel(mundoActualId, nivelActualId);
  const completadas = new Set(
    Object.entries(estadoNivel.fases)
      .filter(([, v]) => v.completada)
      .map(([k]) => k)
  );
  phaseBar.render(nivelData.fases, faseIndice, completadas, (i) => cargarFase(i));
  hud.ponerFases(nivelData.fases, faseIndice, completadas);

  configurarUIPorTipoFase();
}

function mensajeSalidaVacia() {
  return escenario.tipo === "laboratorio"
    ? "Aquí verás lo que muestre print() y lo que diga Robot1."
    : "Aquí verás lo que muestre print().";
}

function mensajeInicialFase(fase) {
  switch (fase.tipo) {
    case "ORDENAR":
      return "Elige las tarjetas en el orden correcto: cada una se ejecuta en cuanto la eliges.";
    case "PREDECIR":
      return "Lee el código, piensa qué va a pasar y elige tu predicción.";
    case "EXPLORAR":
      return escenario.textoObserva;
    case "DEBUG":
      return "Este código tiene un error. Corrígelo y ejecútalo.";
    default:
      return `Escribe tu código y presiona ▶ Ejecutar para ver qué hace ${escenario.textoProtagonista}.`;
  }
}

function configurarUIPorTipoFase() {
  const esPredecir = faseData.tipo === "PREDECIR";
  const esOrdenar = faseData.tipo === "ORDENAR";
  el.prediccionEnvoltura.classList.toggle("oculto", !esPredecir);
  el.btnEjecutar.classList.toggle("oculto", esPredecir);
  el.barraSimbolos?.classList.toggle("oculto", esPredecir || esOrdenar);

  // Nivel 0 (diagramas de flujo): sin editor ni consola; en su lugar, tarjetas para ordenar.
  document.body.classList.toggle("modo-ordenar", esOrdenar);
  el.tarjetasEnvoltura.classList.toggle("oculto", !esOrdenar);
  document.querySelector(".editor-envoltura")?.classList.toggle("oculto", esOrdenar);
  document.querySelector(".acciones-codigo")?.classList.toggle("oculto", esOrdenar);
  el.lenguajeTag.classList.toggle("oculto", esOrdenar);
  el.tituloCodigo.textContent = esOrdenar ? "Tu algoritmo" : "Código";
  if (esOrdenar) montarTarjetas();
  requestAnimationFrame(() => escenario?.ajustarTamano());
  // Nivel Jefe: sin botón de pistas.
  el.btnPista.classList.toggle("oculto", faseData.sinPistas === true);

  if (esPredecir) {
    codeEditor.deshabilitar(true);
    el.prediccionEnunciado.textContent = faseData.enunciado;
    el.prediccionOpciones.innerHTML = "";
    (faseData.opciones || []).forEach((op) => {
      const boton = document.createElement("button");
      boton.type = "button";
      boton.className = "opcion-prediccion";
      boton.textContent = op.texto;
      boton.addEventListener("click", () => evaluarPrediccion(op.id, boton));
      el.prediccionOpciones.appendChild(boton);
    });
  }
}

const NOMBRE_CHIP = {
  asignacion: "variable = valor",
  print: "print()",
  input: "input()",
  int: "int()",
  float: "float()",
  str: "str()",
  if: "if condición:",
  elif: "elif condición:",
  else: "else:",
  while: "while condición:",
  for: "for i in range(n):",
  and: "and",
  or: "or",
  not: "not",
  booleanos: "True / False",
  def: "def nombre(parámetros):",
  return: "return valor",
  round: "round()",
};

function renderInstruccionesPermitidas(fase) {
  // Cada instrucción es un BOTÓN que inserta su sintaxis de Python en el editor, donde esté el cursor.
  const objeto = escenario.biblioteca.objeto;
  const botones = (fase.instruccionesPermitidas || []).map((i) => ({ etiqueta: NOMBRE_CHIP[i] || `${i}()`, clave: i, metodo: "" }));
  (fase.metodosPermitidos || []).forEach((m) => {
    if (escenario.biblioteca.metodos[m]) botones.push({ etiqueta: `${objeto}.${m}()`, clave: "", metodo: m });
  });
  el.listaInstrucciones.innerHTML = botones
    .map(
      (b) =>
        `<button type="button" class="chip-instruccion chip-insertable" data-clave="${b.clave}" data-metodo="${b.metodo}" title="Insertar en el editor" aria-label="Insertar ${b.etiqueta.replace(/"/g, "")} en el editor">${b.etiqueta.replace(/</g, "&lt;")}</button>`
    )
    .join("");
}

// Clic en una instrucción disponible → se escribe en el editor (en celular, además, se pasa a la pestaña Jugar donde está el editor).
el.listaInstrucciones.addEventListener("click", (e) => {
  const boton = e.target.closest(".chip-insertable");
  if (!boton || el.editorTextarea.disabled) return;
  const plantilla = boton.dataset.metodo ? plantillaMetodo(escenario.biblioteca.objeto, boton.dataset.metodo) : PLANTILLAS[boton.dataset.clave];
  if (!plantilla) return;
  if (insertarEnEditor(codeEditor, plantilla) && hud.esMovil()) {
    pestanas.seleccionar("jugar", { subir: false });
    codeEditor.textarea.focus();
  }
});

// ¿Ya jugó (superó) algún nivel que no sea de tutorial? Entonces el Nivel 0 no le estorba.
function hayProgresoReal(progreso) {
  return Object.values(progreso.mundos).some((m) => Object.entries(m.niveles || {}).some(([id, n]) => n.completado && !catalogo.niveles[id]?.tutorial));
}

// Un nivel se abre al completar el anterior del mundo. El Nivel 0 (tutorial) se da por hecho si la persona ya jugó
// otros niveles (así nadie con progreso previo se queda bloqueado).
function nivelAbierto(progreso, mundo, indice) {
  if (indice === 0) return true;
  const previoId = mundo.niveles[indice - 1];
  if (progreso.mundos[mundo.id]?.niveles?.[previoId]?.completado) return true;
  return catalogo.niveles[previoId]?.tutorial === true && hayProgresoReal(progreso);
}

// Solo los niveles del mundo actual: el primero está abierto y cada uno se
// desbloquea al completar el anterior.
async function renderSelectorNiveles() {
  const progreso = await repo.obtenerProgreso();
  el.selectorNiveles.innerHTML = "";
  const mundo = catalogo.mundos[mundoActualId];
  if (!mundo) return;

  const etiqueta = document.createElement("span");
  etiqueta.className = "separador-mundo";
  etiqueta.textContent = `M${mundo.id} · ${mundo.nombre}`;
  el.selectorNiveles.appendChild(etiqueta);

  mundo.niveles.forEach((id, i) => {
    const estado = progreso.mundos[mundo.id]?.niveles?.[id];
    const completado = !!estado?.completado;
    const desbloqueado = ModoDemo.activo() || nivelAbierto(progreso, mundo, i) || completado;
    const ordinal = ordinalDeNivel(id);
    const esJefe = catalogo.niveles[id].jefe === true;

    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "nivel-punto";
    if (esJefe) boton.classList.add("nivel-jefe");
    boton.textContent = esJefe ? "👑" : String(ordinal);
    boton.title = esJefe ? `Nivel Jefe: ${catalogo.niveles[id].nombre}` : catalogo.niveles[id].nombre;
    boton.setAttribute("aria-label", `${esJefe ? "Nivel Jefe" : `Nivel ${ordinal}`}: ${catalogo.niveles[id].nombre}${completado ? " (completado)" : !desbloqueado ? " (bloqueado)" : ""}`);
    if (id === nivelActualId) boton.classList.add("activo");
    if (completado) boton.classList.add("completado");
    if (!desbloqueado) {
      boton.classList.add("bloqueado");
      boton.disabled = true;
    } else {
      boton.addEventListener("click", () => irANivel(id));
    }
    el.selectorNiveles.appendChild(boton);
  });
}

// Ids de todas las fases superadas en todos los niveles: es lo que decide
// qué entradas del diccionario están desbloqueadas.
async function fasesCompletadasGlobales() {
  const progreso = await repo.obtenerProgreso();
  const ids = new Set();
  Object.values(progreso.mundos).forEach((mundo) => {
    Object.values(mundo.niveles || {}).forEach((nivel) => {
      Object.entries(nivel.fases || {}).forEach(([faseId, estado]) => {
        if (estado.completada) ids.add(faseId);
      });
    });
  });
  return ids;
}

async function actualizarDiccionario() {
  // En el Laboratorio Libre todas las instrucciones están disponibles.
  diccionario.actualizar(await fasesCompletadasGlobales(), ModoDemo.activo() || esSandbox);
}

async function actualizarContadorTotal() {
  const progreso = await repo.obtenerProgreso();
  let total = 0;
  Object.values(progreso.mundos).forEach((mundo) => {
    Object.values(mundo.niveles).forEach((nivel) => {
      total += nivel.estrellas || 0;
    });
  });
  el.totalEstrellas.textContent = String(total);
}

// ---------- Nivel 0: ordenar tarjetas (diagramas de flujo) ----------

function montarTarjetas() {
  ordenElegido = [];
  panelTarjetas.bloquear(false);
  panelTarjetas.mostrar(faseData, {
    alElegir: elegirTarjeta,
    alReiniciar: () => {
      if (enEjecucion) return;
      ordenElegido = [];
      panelTarjetas.reiniciar();
      escenario.reiniciar();
      feedback.mostrarInicial(mensajeInicialFase(faseData));
    },
  });
}

async function elegirTarjeta(id) {
  if (enEjecucion) return;
  enEjecucion = true;
  panelTarjetas.bloquear(true);
  const tarjeta = faseData.tarjetas.find((t) => t.id === id);
  const eleccion = evaluarEleccion(faseData.ordenCorrecto, ordenElegido, id);
  try {
    if (eleccion.ok) {
      ordenElegido.push(id);
      panelTarjetas.agregarAlDiagrama(id);
      await escenario.ejecutarPaso(tarjeta.accion);
      if (eleccion.completo) {
        await completarFaseActual(`orden:${ordenElegido.join(">")}`);
      } else {
        feedback.mostrarInicial("¡Bien! Sigue con la siguiente tarjeta.");
      }
    } else {
      // Esa tarjeta no tocaba todavía: el robot choca, cuenta como intento y se empieza de nuevo.
      const codigo = `orden:${[...ordenElegido, id].join(">")}`;
      panelTarjetas.marcarError(id);
      await escenario.chocar(tarjeta.accion);
      await repo.registrarIntentoFase(mundoActualId, nivelActualId, faseData.id, { codigo });
      await guardarEjecucion({ mundoId: mundoActualId, nivelId: nivelActualId, faseId: faseData.id, codigo, resultado: RESULTADO_OBJETIVO_NO_ALCANZADO });
      feedback.mostrarObjetivoNoAlcanzado(faseData.mensajeNoLogrado || "Esa tarjeta no iba todavía: ¡Robot1 chocó! Piensa qué tiene que pasar primero e inténtalo de nuevo.");
      ordenElegido = [];
      panelTarjetas.reiniciar();
      escenario.reiniciar();
    }
  } finally {
    enEjecucion = false;
    panelTarjetas.bloquear(false);
    mostrarResultado(el.panelFeedback);
  }
}

// ---------- Predicción ----------

async function evaluarPrediccion(opcionId, botonClic) {
  const codigo = faseData.codigoInicial || "";
  const correcta = opcionId === faseData.respuestaCorrecta;

  el.prediccionOpciones.querySelectorAll(".opcion-prediccion").forEach((b) => {
    b.classList.remove("opcion-correcta", "opcion-incorrecta");
  });
  botonClic.classList.add(correcta ? "opcion-correcta" : "opcion-incorrecta");

  if (correcta) {
    await completarFaseActual(codigo);
  } else {
    // Cada opción distinta cuenta como un intento.
    await repo.registrarIntentoFase(mundoActualId, nivelActualId, faseData.id, { codigo: opcionId });
    await guardarEjecucion({
      mundoId: mundoActualId,
      nivelId: nivelActualId,
      faseId: faseData.id,
      codigo: `prediccion:${opcionId}`,
      resultado: RESULTADO_OBJETIVO_NO_ALCANZADO,
    });
    feedback.mostrarObjetivoNoAlcanzado(
      faseData.mensajeNoLogrado || "Esa no era la predicción correcta. Vuelve a intentarlo."
    );
  }
}

// ---------- Pipeline de ejecución ----------

async function ejecutarCodigo() {
  if (enEjecucion) return;
  enEjecucion = true;
  el.btnEjecutar.disabled = true;
  codeEditor.limpiarMarcaError();
  // En el celular: se oculta el teclado y la vista sube al escenario para ver la animación.
  prepararEjecucion({ editor: codeEditor, panelEscenario: el.panelMundo });

  const codigo = codeEditor.obtenerCodigo();
  outputPanel.limpiar();
  memoryPanel.limpiar();
  hud.reiniciarCasos();
  hud.ocultarGlobo(); // Nix no debe seguir con el mensaje de la ejecución anterior mientras la escena anima esta
  el.btnEjecutar.classList.add("cargando");
  el.btnEjecutar.setAttribute("aria-busy", "true");
  const entradasDelCaso = !faseData.entradasInteractivas && Array.isArray(faseData.casos?.[casoVisual]?.entradas) && faseData.casos[casoVisual].entradas.length ? [...faseData.casos[casoVisual].entradas] : null;
  indicadorEjecucion.iniciar(); // «EJECUTANDO...» si tarda; se quita con la primera salida

  const inicio = performance.now();
  const tiempo = () => Math.round(performance.now() - inicio);

  try {
    const ast = new Parser(new Lexer(codigo).tokenizar()).parsear();
    new Validator(faseData, {
      biblioteca: escenario.biblioteca,
      variablesIniciales: Object.keys(escenario.variablesIniciales),
    }).validar(ast);

    escenario.reiniciar();
    actualizarPanelEstado();
    await escenario.prepararEjecucion(); // p. ej. las cartas se voltean

    const visual = await ejecutarPrograma({
      ast,
      escenario,
      callbacks: {
        onSalida: (s) => {
          indicadorEjecucion.terminar();
          outputPanel.agregar(s);
        },
        // `variablesOcultas`: datos del escenario que el juego esconde a propósito (el número secreto de la adivinanza).
        onAsignacion: (nombre, valor) => !faseData.variablesOcultas?.includes(nombre) && memoryPanel.actualizar(nombre, valor),
        onEstado: () => actualizarPanelEstado(),
        // Niveles con CASOS que traen sus entradas (jefes, proyectos): la ejecución usa las del caso elegido con las lámparas, igual que
        // la evaluación. Antes había que teclearlas a mano y, si el alumno ponía otros números, el caso 1 fallaba aunque su programa
        // estuviera bien. En los demás niveles la ejecución se pausa aquí hasta que el estudiante escribe un valor.
        pedirEntrada: entradasDelCaso
          ? async () => {
              indicadorEjecucion.terminar();
              if (!entradasDelCaso.length) throw Errores.sinValoresDeEntrada();
              return String(entradasDelCaso.shift());
            }
          : (opciones) => indicadorEjecucion.terminar() || outputPanel.pedirEntrada({ etiqueta: opciones?.etiqueta || faseData.etiquetaEntrada }),
      },
    });
    actualizarPanelEstado();
    indicadorEjecucion.terminar();
    indicadorComprobacion.iniciar(); // la comprobación guarda en Supabase: si tarda, se ve «COMPROBANDO...»

    await evaluarResultado({ ast, visual, codigo, tiempoMs: tiempo() });
  } catch (error) {
    // El intento se registra solo cuando ya se sabe el resultado.
    await repo.registrarIntentoFase(mundoActualId, nivelActualId, faseData.id, { codigo });
    await manejarError(error, codigo, tiempo());
  } finally {
    enEjecucion = false;
    indicadorEjecucion.terminar();
    indicadorComprobacion.terminar();
    el.btnEjecutar.classList.remove("cargando");
    el.btnEjecutar.removeAttribute("aria-busy");
    el.btnEjecutar.disabled = false;
    pestanas.marcarNuevo("consola"); // punto en «Consola» si la salida quedó en otra pestaña
    mostrarResultado(el.panelFeedback);
  }
}

async function evaluarResultado({ ast, visual, codigo, tiempoMs }) {
  if (esSandbox) {
    // Laboratorio Libre: sin validación, sin estrellas, sin guardar nada.
    feedback.mostrarInicial("Programa ejecutado. Cambia el código y vuelve a ejecutar para seguir experimentando.");
    return;
  }

  // La lógica de validación vive en game/evaluacion.js (la misma que prueban los tests).
  const evaluacion = await evaluarFase({
    nivel: nivelData,
    fase: faseData,
    codigo,
    ast,
    visual: { escenario, salidas: visual.salidas, memoria: visual.memoria, llamadas: visual.llamadas, funciones: visual.funciones },
    // En las fases que se JUEGAN a mano (el radar de adivinanza) lo que el estudiante tecleó no se compara con ningún caso: los casos se prueban todos en silencio.
    casoVisual: faseData.entradasInteractivas ? -1 : casoVisual,
  });
  // El núcleo del proyecto libre sincroniza sus módulos y, si todo cumple, se activa: se ESPERA para que se vea antes de la pantalla final.
  await escenario.marcarRequisitos?.(listarRequisitos(faseData, codigo));
  if (evaluacion.casos?.length) {
    const resultados = evaluacion.casos.map((c) => c.ok);
    hud.marcarCasos(resultados); // lámparas del HUD (✓ / ✗)
    escenario.marcarCasos?.(resultados); // y, si la escena las tiene (la máquina expendedora), también ahí
  }

  if (evaluacion.exito) {
    await completarFaseActual(codigo, tiempoMs);
    return;
  }

  await repo.registrarIntentoFase(mundoActualId, nivelActualId, faseData.id, { codigo });
  await guardarEjecucion({
    mundoId: mundoActualId,
    nivelId: nivelActualId,
    faseId: faseData.id,
    codigo,
    resultado: RESULTADO_OBJETIVO_NO_ALCANZADO,
    tiempoMs,
  });
  feedback.mostrarObjetivoNoAlcanzado(
    faseData.mensajeNoLogrado || "Todavía no se cumple el objetivo de esta fase. Revisa tu código e inténtalo de nuevo.",
    evaluacion.casos
  );
}

async function completarFaseActual(codigo, tiempoMs) {
  autoguardado.descartar(); // 3.3 · la fase se completó: el borrador ya no hace falta
  if (!esSandbox) registrarLineas(usuarioActual, faseData.id, faseData.tipo, codigo); // para la pantalla final
  const estadoPrevio = await repo.obtenerEstadoNivel(mundoActualId, nivelActualId);
  const yaCompletada = estadoPrevio.fases[faseData.id]?.completada === true;

  // Repetir una fase ya superada no debe volver a contarla ni ensuciar
  // el cálculo de estrellas: solo se registra la primera vez.
  if (!yaCompletada) {
    await repo.registrarIntentoFase(mundoActualId, nivelActualId, faseData.id, { codigo });
    await repo.completarFase(mundoActualId, nivelActualId, faseData.id);
  }

  await guardarEjecucion({
    mundoId: mundoActualId,
    nivelId: nivelActualId,
    faseId: faseData.id,
    codigo,
    resultado: RESULTADO_EXITO,
    tiempoMs,
  });

  const esUltimaFase = faseIndice === nivelData.fases.length - 1;
  const estadoNivel = await repo.obtenerEstadoNivel(mundoActualId, nivelActualId);
  const completadas = new Set(
    Object.entries(estadoNivel.fases)
      .filter(([, v]) => v.completada)
      .map(([k]) => k)
  );
  phaseBar.render(nivelData.fases, faseIndice, completadas, (i) => cargarFase(i));
  hud.ponerFases(nivelData.fases, faseIndice, completadas);
  await actualizarDiccionario();

  const todasCompletas = nivelData.fases.every((f) => completadas.has(f.id));

  // Reto de optimización (Niveles Jefe): solo un mensaje motivacional, no quita estrellas ni bloquea el avance.
  const consejo = mensajeEficiencia(codigo, nivelData.max_lineas_recomendadas);

  if (todasCompletas) {
    const soloFasesDelNivel = {};
    nivelData.fases.forEach((f) => {
      if (estadoNivel.fases[f.id]) soloFasesDelNivel[f.id] = estadoNivel.fases[f.id];
    });
    const estrellas = calcularEstrellasNivel(soloFasesDelNivel);
    const siguienteId = siguienteNivel(nivelActualId); // los ids no son consecutivos: se pregunta al catálogo
    const hayNivelSiguiente = siguienteId !== null;

    await repo.completarNivel(mundoActualId, nivelActualId, {
      estrellas,
      nivelesRequeridos: REQUERIDOS_POR_MUNDO[mundoActualId],
      siguienteMundo: hayNivelSiguiente ? mundoDeNivel(siguienteId) : mundoActualId,
      siguienteNivel: hayNivelSiguiente ? siguienteId : nivelActualId,
    });
    renderizarEstrellas(el.estrellasNivel, estrellas);
    await renderSelectorNiveles();
    await actualizarContadorTotal();
    await actualizarDiccionario();

    const botones = [{ texto: "Repetir nivel", tipo: "secundario", onClick: () => cargarFase(0) }];

    // ¿Es el último nivel del mundo? Entonces NO se salta al siguiente nivel:
    // primero va la pantalla de transición narrativa.
    const nivelesDelMundo = catalogo.mundos[mundoActualId].niveles;
    const cierraMundo = nivelesDelMundo[nivelesDelMundo.length - 1] === nivelActualId;
    const mundoSiguiente = catalogo.mundos[mundoActualId + 1] || null;

    if (!cierraMundo && hayNivelSiguiente) {
      botones.push({ texto: "Siguiente nivel", tipo: "primario", onClick: () => irANivel(siguienteId) });
    }

    feedback.mostrarResultadoNivel({
      estrellas,
      mensaje: cierraMundo
        ? `Completaste el Mundo ${mundoActualId}: ${catalogo.mundos[mundoActualId].nombre}.`
        : hayNivelSiguiente
          ? "Desbloqueaste el siguiente nivel."
          : "¡Completaste todos los mundos disponibles de CodeQuest!",
      botones,
      consejo,
    });

    if (cierraMundo && !mundoSiguiente) {
      await mostrarFinDelJuego(); // 3.4 · último nivel del último mundo: pantalla final de CodeQuest
    } else if (cierraMundo) {
      const mundoProgreso = (await repo.obtenerProgreso()).mundos[mundoActualId];
      const estrellasMundo = Object.values(mundoProgreso?.niveles || {}).reduce((t, n) => t + (n.estrellas || 0), 0);
      const resultado = await mostrarTransicionMundo({
        mundoCompletado: mundoActualId,
        nombreMundo: catalogo.mundos[mundoActualId].nombre,
        estrellas: estrellasMundo,
        estrellasMax: nivelesDelMundo.length * 3,
        narrativa:
          nivelData.narrativaSiguienteMundo ||
          `¡Completaste el Mundo ${mundoActualId}! Pronto habrá más retos para Robot1.`,
        nombreSiguiente: mundoSiguiente ? mundoSiguiente.nombre : null,
        enlacePerfil: ModoDemo.activo() ? null : "perfil.html",
        consejo,
      });
      // Cambiar de mundo = cargar su página: nuevo escenario, nueva paleta y su bienvenida.
      if (resultado === "continuar") window.location.href = urlJuego(mundoSiguiente.id);
    }
  } else {
    const botones = [
      {
        texto: "Seguir jugando",
        tipo: "secundario",
        onClick: () => feedback.mostrarInicial(mensajeInicialFase(faseData)),
      },
    ];
    if (!esUltimaFase) {
      botones.push({
        texto: "Siguiente fase",
        tipo: "primario",
        onClick: () => cargarFase(faseIndice + 1),
      });
    } else {
      // Última fase superada pero quedan fases anteriores pendientes.
      const pendiente = nivelData.fases.findIndex((f) => !completadas.has(f.id));
      if (pendiente !== -1) {
        botones.push({
          texto: "Ir a la fase pendiente",
          tipo: "primario",
          onClick: () => cargarFase(pendiente),
        });
      }
    }
    feedback.mostrarResultadoFase({
      mensaje: faseData.retroalimentacion || "¡Bien hecho!",
      botones,
      consejo,
    });
  }
}

// 3.4 · Pantalla final: estrellas totales y líneas de código escritas.
async function mostrarFinDelJuego() {
  const progreso = await repo.obtenerProgreso();
  let estrellas = 0;
  Object.values(progreso.mundos).forEach((mundo) => {
    Object.values(mundo.niveles).forEach((nivel) => {
      estrellas += nivel.estrellas || 0;
    });
  });
  await mostrarPantallaFinal({
    estrellas,
    estrellasMax: MAX_ESTRELLAS,
    lineas: totalLineasEscritas(usuarioActual),
    nombre: progreso.jugador?.nombre || null,
    urlMapa: urlMapa(),
    urlPerfil: enDemo ? null : "perfil.html",
  });
}

async function manejarError(error, codigo, tiempoMs) {
  if (error instanceof CQLError) {
    // Algunas fases EXPLORAR existen justamente para que el estudiante lea
    // un error. En ellas, provocar el error ES cumplir el objetivo.
    const v = faseData.validacion || {};
    if (v.tipo === "error_esperado" && (!v.codigoError || v.codigoError === error.codigo)) {
      feedback.mostrarError(error);
      codeEditor.marcarLineaError(error.linea);
      await completarFaseActual(codigo, tiempoMs);
      return;
    }

    feedback.mostrarError(error);
    codeEditor.marcarLineaError(error.linea);
    await guardarEjecucion({
      mundoId: mundoActualId,
      nivelId: nivelActualId,
      faseId: faseData.id,
      codigo,
      resultado: resultadoDeError(error.codigo),
      codigoError: error.codigo,
      tiempoMs,
    });
  } else {
    console.error(error);
    await guardarEjecucion({
      mundoId: mundoActualId,
      nivelId: nivelActualId,
      faseId: faseData.id,
      codigo,
      resultado: resultadoDeError("ERR_INESPERADO"),
      codigoError: "ERR_INESPERADO",
      tiempoMs,
    });
    feedback.mostrarError({
      codigo: "ERR_INESPERADO",
      mensaje: "Ocurrió un error inesperado al ejecutar tu código.",
      educativo: "Esto no debería pasar — puede ser un error interno de CodeQuest.",
      sugerencia: "Intenta reiniciar la fase. Si el problema continúa, revisa tu código línea por línea.",
    });
  }
}

// ---------- Reiniciar / pistas ----------

async function reiniciarFase() {
  autoguardado.descartar(); // Reiniciar = empezar de cero: se borra el borrador
  await cargarFase(faseIndice);
}

async function mostrarPista() {
  if (faseData.sinPistas === true) return; // Nivel Jefe: sin ayudas
  const pistas = faseData.pistas || [];
  if (pistas.length === 0) {
    feedback.mostrarInicial("Esta fase no tiene pistas: confía en lo que aprendiste.");
    return;
  }
  pistaIndiceActual = Math.min(pistaIndiceActual + 1, pistas.length);
  feedback.mostrarPista(pistas[pistaIndiceActual - 1], pistaIndiceActual);
  await repo.registrarIntentoFase(mundoActualId, nivelActualId, faseData.id, { pistasUsadas: pistaIndiceActual });
}

// ---------- Eventos ----------

el.btnEjecutar.addEventListener("click", ejecutarCodigo);

// Atajo Ctrl+Enter / Cmd+Enter dentro del editor: no hace nada si el botón no está disponible.
codeEditor.alAtajoEjecutar = () => {
  if (el.btnEjecutar.classList.contains("oculto") || el.btnEjecutar.disabled) return;
  ejecutarCodigo();
};
const etiquetaAtajo = document.getElementById("atajo-ejecutar");
if (etiquetaAtajo && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent || "")) etiquetaAtajo.textContent = "⌘+Enter";

// La barra de acciones del código se queda pegada justo debajo de las barras fijas
// (menú + niveles); su altura cambia en pantallas pequeñas, por eso se mide.
function ajustarOffsetSticky() {
  // Solo cuentan las barras que de verdad están pegadas (en celular ya no lo están).
  const alto = (sel) => {
    const e = document.querySelector(sel);
    return e && getComputedStyle(e).position === "sticky" ? e.offsetHeight : 0;
  };
  document.documentElement.style.setProperty("--offset-sticky", `${alto(".nav-principal") + alto(".barra-superior")}px`);
}
ajustarOffsetSticky();
window.addEventListener("resize", ajustarOffsetSticky);

// Interfaz para pantallas chicas y táctiles (acordeones, símbolos, aviso de giro...).
// Pestañas Jugar / Aprende / Consola (celular y tablet vertical). El canvas se reajusta al volver a Jugar.
const pestanas = configurarPestanas({
  contenedor: document.getElementById("contenedor-nivel"),
  barra: document.getElementById("pestanas-movil"),
  alCambiar: (pestana, cambio) => {
    if (cambio && pestana === "jugar") requestAnimationFrame(() => escenario?.ajustarTamano());
  },
});
seguirTeclado();
marcarEdicion(codeEditor.textarea);
configurarAvisoOrientacion(el.avisoOrientacion, el.avisoOrientacionCerrar);
configurarBarraSimbolos(el.barraSimbolos, codeEditor);
el.btnReiniciar.addEventListener("click", reiniciarFase);
el.btnPista.addEventListener("click", mostrarPista);

el.btnTour.addEventListener("click", () => {
  if (nivelActualId === 0 || faseData?.tipo === "ORDENAR") tourNivel0.iniciar();
  else tour.iniciar();
});
el.btnConceptos.addEventListener("click", () => abrirGlosario(mundoActualId || 1));

function marcarInsignia(texto) {
  if (el.accionesBarra.querySelector(".insignia-demo")) return;
  const insignia = document.createElement("span");
  insignia.className = "insignia-demo";
  insignia.textContent = texto;
  el.accionesBarra.prepend(insignia);
}

// Laboratorio Libre (?modo=sandbox): una sola fase LIBRE en 10×10, sin
// validación, sin estrellas y con un repositorio que no guarda nada.
async function iniciarSandbox() {
  nivelActualId = 0;
  mundoActualId = 0;
  nivelData = NIVEL_SANDBOX;
  el.tituloNivel.textContent = nivelData.nombre;
  el.etiquetaConcepto.textContent = nivelData.concepto;
  el.textoNarrativa.textContent = nivelData.narrativa;
  await cargarFase(0);
  const params = new URLSearchParams(window.location.search);
  const conceptoId = params.get("concepto");
  if (conceptoId) {
    const concepto = CONCEPTOS.find((c) => c.id === conceptoId);
    if (concepto?.ejemplo) {
      codeEditor.establecerCodigo(concepto.ejemplo);
      el.etiquetaConcepto.textContent = concepto.titulo;
      feedback.mostrarInicial(`Concepto cargado: ${concepto.titulo}. Presiona ▶ Ejecutar para probar el ejemplo o modifícalo libremente.`);
    }
  }
  await actualizarDiccionario();
  marcarInsignia("LABORATORIO LIBRE · sin estrellas ni progreso");
}

window.addEventListener("resize", () => escenario && escenario.ajustarTamano());

// El dpr también cambia al hacer zoom o al mover la ventana a otra pantalla, sin que haya «resize»: se vuelve a ajustar el tablero.
// Botón «Animaciones»: auto (el juego se adapta a la computadora) → completas → ligeras (sin animación en reposo ni resplandores).
const ETIQUETA_ANIMACION = { auto: "Auto", completas: "Completas", ligeras: "Ligeras" };
function pintarBotonAnimaciones() {
  const modo = leerModo();
  const boton = document.getElementById("btn-animaciones");
  if (!boton) return;
  document.getElementById("animaciones-etiqueta").textContent = ETIQUETA_ANIMACION[modo];
  boton.setAttribute("aria-label", `Animaciones: ${ETIQUETA_ANIMACION[modo].toLowerCase()}. Pulsa para cambiar`);
}
aplicarModo();
pintarBotonAnimaciones();
document.getElementById("btn-animaciones")?.addEventListener("click", () => {
  guardarModo(MODOS_ANIMACION[(MODOS_ANIMACION.indexOf(leerModo()) + 1) % MODOS_ANIMACION.length]);
  pintarBotonAnimaciones();
});

function vigilarDensidadDePantalla() {
  if (typeof window.matchMedia !== "function") return;
  const consulta = window.matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`);
  consulta.addEventListener?.(
    "change",
    () => {
      escenario?.ajustarTamano();
      vigilarDensidadDePantalla(); // la consulta depende del dpr de ese momento: se crea otra
    },
    { once: true }
  );
}
vigilarDensidadDePantalla();

// ---------- Arranque ----------

// Dónde retomar: el nivel actual si es de este mundo; si no, el primero pendiente.
function nivelInicial(progreso) {
  const mundo = catalogo.mundos[mundoActualId];
  // Quien llega por primera vez empieza en el Nivel 0 (tutorial de algoritmos), no en el 1.
  const primero = mundo.niveles[0];
  if (catalogo.niveles[primero]?.tutorial && !progreso.mundos[mundo.id]?.niveles?.[primero]?.completado && !hayProgresoReal(progreso)) return primero;
  if (mundo.niveles.includes(progreso.jugador.nivelActual)) return progreso.jugador.nivelActual;
  const pendiente = mundo.niveles.find((id) => !progreso.mundos[mundo.id]?.niveles?.[id]?.completado);
  return pendiente ?? mundo.niveles[0];
}

(async function iniciar() {
  // 1) Sesión: sin usuario autenticado se vuelve a la página de acceso.
  const perfil = await protegerPagina();
  if (!perfil) return;
  await renderizarNav("nav", perfil);

  // Modo demo (?demo=true): solo admins. Usa localStorage y desbloquea todo.
  // Un admin sin ?demo=true no juega con su cuenta: vuelve al panel.
  const params = new URLSearchParams(window.location.search);
  esSandbox = params.get("modo") === "sandbox";
  const pideDemo = params.get("demo") === "true";
  if (esRolAdmin(perfil.rol) && !pideDemo && !esSandbox) {
    window.location.href = "admin.html";
    return;
  }

  // Laboratorio Libre: lo puede abrir cualquier rol; nunca guarda nada.
  if (esSandbox) {
    document.body.classList.add("modo-sandbox");
    aplicarTema(1);
    repo = new NoopProgressRepository();
    await iniciarSandbox();
    return;
  }
  enDemo = pideDemo && esRolAdmin(perfil.rol);

  // 2) Progreso: Supabase (o su copia local si no hay conexión) o localStorage en demo.
  if (enDemo) {
    ModoDemo.activar();
    repo = new LocalStorageProgressRepository("codequest:demo:v1");
  } else {
    repo = new SupabaseProgressRepository({ supabase, catalogo, alCambiarEstado: mostrarEstadoRed });
  }
  usuarioActual = enDemo ? "demo" : perfil.user_id;
  const progreso = await repo.cargarProgreso();
  if (!progreso) {
    window.location.href = "auth.html";
    return;
  }

  // 3) Mundo pedido (?mundo=N): debe existir y estar desbloqueado.
  const mundoPedido = Number(params.get("mundo"));
  if (!catalogo.mundos[mundoPedido] || (!enDemo && !mundoAbierto(mundoPedido, catalogo, (id) => progreso.mundos[id]?.completado === true))) {
    window.location.href = urlMapa();
    return;
  }
  mundoActualId = mundoPedido;
  aplicarTema(mundoActualId);
  el.btnMapa.href = urlMapa();
  if (enDemo) marcarInsignia("DEMO · no se guarda en la base de datos");

  // ?nivel=N (1..n dentro del mundo) abre ese nivel si ya está desbloqueado.
  let inicio = nivelInicial(progreso);
  const ordinal = Number(params.get("nivel"));
  const delMundo = catalogo.mundos[mundoActualId].niveles;
  const pedido = params.get("nivel") !== null && Number.isInteger(ordinal) ? nivelPorOrdinal(mundoActualId, ordinal) : null;
  if (pedido !== null) {
    if (enDemo || nivelAbierto(progreso, catalogo.mundos[mundoActualId], delMundo.indexOf(pedido))) inicio = pedido;
  }
  await irANivel(inicio);

  // 4) Teoría la primera vez que se entra al mundo y, después, el recorrido por la interfaz.
  const usuarioTour = enDemo ? "demo" : perfil.user_id;
  await mostrarBienvenidaMundo(mundoActualId, { usuarioId: usuarioTour });
  arranqueListo = true;
  if (nivelActualId === 0 || faseData?.tipo === "ORDENAR") {
    if (!Tour.yaSeVioNivel0()) {
      setTimeout(() => tourNivel0.iniciar(), 500);
    }
  } else if (!Tour.yaSeVio()) {
    setTimeout(() => tour.iniciar(), 500);
  } else if (!esSandbox && PASOS_MUNDO[mundoActualId] && !tourDeMundoVisto(usuarioTour, mundoActualId)) {
    // Primera vez en un mundo nuevo (2, 3, 4 o 5): el tour presenta su escenario.
    const mundoDelTour = mundoActualId;
    const tourMundo = new Tour({
      alNecesitarPestana: (pestana) => pestanas.seleccionar(pestana, { subir: false }),
      pasos: PASOS_MUNDO[mundoDelTour],
      alTerminar: () => marcarTourDeMundoVisto(usuarioTour, mundoDelTour),
    });
    setTimeout(() => tourMundo.iniciar(), 500);
  }
})().catch((e) => {
  console.error(e);
  const f = document.getElementById("feedback-contenido");
  if (f) f.innerHTML = "<p class=\"feedback-texto\">No se pudo iniciar el juego. Recarga la página.</p>";
}).finally(() => cargaNivel.ocultar()); // la capa «CARGANDO...» nunca se queda pegada (ni por un error ni al abrir el Laboratorio Libre)
