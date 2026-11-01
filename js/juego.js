// juego.js (antes main.js)
// Orquesta el juego de CodeQuest: 4 mundos, 35 niveles, sistema de fases y
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
import { CQLError } from "./interpreter/errors.js";

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
import { Tour } from "./ui/tour.js";
import { ModoDemo } from "./ui/demoMode.js";
import { abrirGlosario, mostrarBienvenidaMundo } from "./ui/conceptos.js";
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
import { catalogo, obtenerNivel, mundoDeNivel, NIVELES_POR_MUNDO, TOTAL_NIVELES, MAX_ESTRELLAS } from "./game/catalogo.js";

// El repositorio se elige al arrancar: Supabase (normal), localStorage (demo de
// admin) o uno que no guarda nada (Laboratorio Libre, ?modo=sandbox).
let repo = null;
let esSandbox = false;

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
  prediccionEnunciado: document.getElementById("prediccion-enunciado"),
  prediccionOpciones: document.getElementById("prediccion-opciones"),

  btnDiccionario: document.getElementById("btn-diccionario"),
  diccionarioPanel: document.getElementById("diccionario-panel"),
  dicContador: document.getElementById("dic-contador"),
  btnTour: document.getElementById("btn-tour"),
  btnConceptos: document.getElementById("btn-conceptos"),
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
const statePanel = new StatePanel(el.estadoContenido);
const phaseBar = new PhaseBar(el.barraFases);
const diccionario = new Dictionary(el.diccionarioPanel, el.btnDiccionario, el.dicContador);
const tour = new Tour();

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
  nivelActualId = id;
  mundoActualId = mundoDeNivel(id);
  nivelData = await cargarNivel(id);

  const estadoNivel = await repo.obtenerEstadoNivel(mundoActualId, id);
  faseIndice = nivelData.fases.findIndex((f) => !estadoNivel.fases[f.id]?.completada);
  if (faseIndice === -1) faseIndice = 0; // nivel ya completo: se puede repasar desde el inicio

  const ordinal = catalogo.mundos[mundoActualId].niveles.indexOf(id) + 1;
  el.tituloNivel.textContent = `Nivel ${ordinal} — ${nivelData.nombre}`;
  el.etiquetaConcepto.textContent = nivelData.concepto;
  el.textoNarrativa.textContent = nivelData.narrativa || "";
  renderizarEstrellas(el.estrellasNivel, estadoNivel.estrellas);

  await cargarFase(faseIndice);
  await renderSelectorNiveles();
  await actualizarContadorTotal();
  await actualizarDiccionario();
}

// Crea el escenario de la fase (y del caso elegido) sobre el mismo canvas.
function montarEscenario(casoIndice = 0) {
  casoVisual = casoIndice;
  const caso = faseData.casos?.[casoIndice] ?? null;
  escenario = crearEscenario(configDeFase(nivelData, faseData, caso), { canvas: el.lienzo });
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
  faseIndice = indice;
  faseData = nivelData.fases[indice];
  pistaIndiceActual = 0;

  montarEscenario(0);

  el.textoAprende.innerHTML = `<strong>${faseData.titulo}</strong><br>${faseData.enunciado}`;
  renderInstruccionesPermitidas(faseData);

  codeEditor.establecerCodigo(faseData.codigoInicial || "");
  codeEditor.limpiarMarcaError();
  codeEditor.deshabilitar(false);

  outputPanel.mostrarVacio(mensajeSalidaVacia());
  feedback.mostrarInicial(mensajeInicialFase(faseData));

  const estadoNivel = await repo.obtenerEstadoNivel(mundoActualId, nivelActualId);
  const completadas = new Set(
    Object.entries(estadoNivel.fases)
      .filter(([, v]) => v.completada)
      .map(([k]) => k)
  );
  phaseBar.render(nivelData.fases, faseIndice, completadas, (i) => cargarFase(i));

  configurarUIPorTipoFase();
}

function mensajeSalidaVacia() {
  return escenario.tipo === "laboratorio"
    ? "Aquí verás lo que muestre print() y lo que diga Robot1."
    : "Aquí verás lo que muestre print().";
}

function mensajeInicialFase(fase) {
  switch (fase.tipo) {
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
  el.prediccionEnvoltura.classList.toggle("oculto", !esPredecir);
  el.btnEjecutar.classList.toggle("oculto", esPredecir);

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
  entrada: "entrada()",
  if: "if condición:",
  elif: "elif condición:",
  else: "else:",
  while: "while condición:",
  for: "for i in range(n):",
  and: "and",
  or: "or",
  not: "not",
  booleanos: "True / False",
};

function renderInstruccionesPermitidas(fase) {
  const chips = (fase.instruccionesPermitidas || []).map((i) => NOMBRE_CHIP[i] || `${i}()`);
  const objeto = escenario.biblioteca.objeto;
  (fase.metodosPermitidos || []).forEach((m) => {
    const def = escenario.biblioteca.metodos[m];
    chips.push(`${objeto}.${m}()`);
    if (!def) chips.pop();
  });
  el.listaInstrucciones.innerHTML = chips.map((c) => `<span class="chip-instruccion">${c.replace(/</g, "&lt;")}</span>`).join("");
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
    const anteriorCompletado = i === 0 || !!progreso.mundos[mundo.id]?.niveles?.[mundo.niveles[i - 1]]?.completado;
    const desbloqueado = ModoDemo.activo() || anteriorCompletado || completado;

    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "nivel-punto";
    boton.textContent = String(i + 1);
    boton.title = catalogo.niveles[id].nombre;
    boton.setAttribute("aria-label", `Nivel ${i + 1}: ${catalogo.niveles[id].nombre}${completado ? " (completado)" : !desbloqueado ? " (bloqueado)" : ""}`);
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

  const codigo = codeEditor.obtenerCodigo();
  outputPanel.limpiar();
  memoryPanel.limpiar();

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
        onSalida: (s) => outputPanel.agregar(s),
        onAsignacion: (nombre, valor) => memoryPanel.actualizar(nombre, valor),
        onEstado: () => actualizarPanelEstado(),
        // La ejecución se pausa aquí hasta que el estudiante escribe un valor.
        pedirEntrada: () =>
          outputPanel.pedirEntrada({
            etiqueta: faseData.etiquetaEntrada,
            tipo: faseData.entradaTipo || "libre",
          }),
      },
    });
    actualizarPanelEstado();

    await evaluarResultado({ ast, visual, codigo, tiempoMs: tiempo() });
  } catch (error) {
    // El intento se registra solo cuando ya se sabe el resultado.
    await repo.registrarIntentoFase(mundoActualId, nivelActualId, faseData.id, { codigo });
    await manejarError(error, codigo, tiempo());
  } finally {
    enEjecucion = false;
    el.btnEjecutar.disabled = false;
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
    visual: { escenario, salidas: visual.salidas, memoria: visual.memoria },
    casoVisual,
  });

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
  await actualizarDiccionario();

  const todasCompletas = nivelData.fases.every((f) => completadas.has(f.id));

  if (todasCompletas) {
    const soloFasesDelNivel = {};
    nivelData.fases.forEach((f) => {
      if (estadoNivel.fases[f.id]) soloFasesDelNivel[f.id] = estadoNivel.fases[f.id];
    });
    const estrellas = calcularEstrellasNivel(soloFasesDelNivel);
    const siguienteId = nivelActualId + 1;
    const hayNivelSiguiente = siguienteId <= TOTAL_NIVELES;

    await repo.completarNivel(mundoActualId, nivelActualId, {
      estrellas,
      totalNivelesMundo: NIVELES_POR_MUNDO[mundoActualId],
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
    });

    if (cierraMundo) {
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
    });
  }
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
  await cargarFase(faseIndice);
}

async function mostrarPista() {
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
el.btnReiniciar.addEventListener("click", reiniciarFase);
el.btnPista.addEventListener("click", mostrarPista);

el.btnTour.addEventListener("click", () => tour.iniciar());
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
  await actualizarDiccionario();
  marcarInsignia("LABORATORIO LIBRE · sin estrellas ni progreso");
}

window.addEventListener("resize", () => escenario && escenario.ajustarTamano());

// ---------- Arranque ----------

// Dónde retomar: el nivel actual si es de este mundo; si no, el primero pendiente.
function nivelInicial(progreso) {
  const mundo = catalogo.mundos[mundoActualId];
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
  if (Number.isInteger(ordinal) && ordinal >= 1 && ordinal <= delMundo.length) {
    const anteriorHecho = ordinal === 1 || progreso.mundos[mundoActualId]?.niveles?.[delMundo[ordinal - 2]]?.completado === true;
    if (enDemo || anteriorHecho) inicio = delMundo[ordinal - 1];
  }
  await irANivel(inicio);

  // 4) Teoría la primera vez que se entra al mundo y, después, el recorrido por la interfaz.
  await mostrarBienvenidaMundo(mundoActualId, { usuarioId: enDemo ? "demo" : perfil.user_id });
  if (!Tour.yaSeVio()) {
    setTimeout(() => tour.iniciar(), 500);
  }
})().catch((e) => {
  console.error(e);
  const f = document.getElementById("feedback-contenido");
  if (f) f.innerHTML = "<p class=\"feedback-texto\">No se pudo iniciar el juego. Recarga la página.</p>";
});
