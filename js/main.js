// main.js
// Orquesta CodeQuest Avance 1 (Mundos 1-2, 19 niveles, sistema de fases,
// 3 paneles en vivo). Ciclo por fase: Obtener código -> Lexer -> Parser ->
// Validator -> Interpreter (async, guiado por el motor) -> Robot1/Mundo ->
// Paneles en vivo -> Retroalimentación inline -> Progreso -> Estrellas.

import { Lexer } from "./interpreter/lexer.js";
import { Parser } from "./interpreter/parser.js";
import { Validator } from "./interpreter/validator.js";
import { Interpreter } from "./interpreter/interpreter.js";
import { CQLError } from "./interpreter/errors.js";

import { World } from "./game/world.js";
import { Robot1 } from "./game/robot1.js";
import { Scene } from "./game/scene.js";
import { crearMotor, snapshotEstado } from "./game/ejecutor.js";

import { CodeEditor } from "./ui/codeEditor.js";
import { Feedback } from "./ui/feedback.js";
import { OutputPanel } from "./ui/outputPanel.js";
import { MemoryPanel } from "./ui/memoryPanel.js";
import { StatePanel } from "./ui/statePanel.js";
import { PhaseBar } from "./ui/phases.js";
import { renderizarEstrellas, calcularEstrellasNivel } from "./ui/stars.js";

import { LocalStorageProgressRepository } from "./persistence/LocalStorageProgressRepository.js";

const NIVELES_POR_MUNDO = { 1: 8, 2: 11 };
const TOTAL_NIVELES = 19;
const MAX_ESTRELLAS = TOTAL_NIVELES * 3;

function mundoDeNivel(id) {
  return id <= NIVELES_POR_MUNDO[1] ? 1 : 2;
}

const repo = new LocalStorageProgressRepository();

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

let nivelActualId = 1;
let nivelData = null;
let faseIndice = 0;
let faseData = null;
let mundoActualId = 1;

let world = null;
let robot1 = null;
let scene = null;
let pistaIndiceActual = 0;
let enEjecucion = false;

// ---------- Carga de niveles ----------

async function cargarNivel(id) {
  const mundo = mundoDeNivel(id);
  const res = await fetch(`levels/mundo${mundo}/level${id}.json`);
  if (!res.ok) throw new Error(`No se pudo cargar el nivel ${id}`);
  return res.json();
}

function escenarioDeFase(fase) {
  return { ...nivelData.escenario, ...(fase.escenario || {}) };
}

async function irANivel(id) {
  nivelActualId = id;
  mundoActualId = mundoDeNivel(id);
  nivelData = await cargarNivel(id);

  const estadoNivel = repo.obtenerEstadoNivel(mundoActualId, id);
  faseIndice = nivelData.fases.findIndex((f) => !estadoNivel.fases[f.id]?.completada);
  if (faseIndice === -1) faseIndice = 0; // nivel ya completo: se puede repasar desde el inicio

  el.tituloNivel.textContent = `Nivel ${id} — ${nivelData.nombre}`;
  el.etiquetaConcepto.textContent = nivelData.concepto;
  el.textoNarrativa.textContent = nivelData.narrativa || "";
  renderizarEstrellas(el.estrellasNivel, estadoNivel.estrellas);

  await cargarFase(faseIndice);
  renderSelectorNiveles();
  actualizarContadorTotal();
}

async function cargarFase(indice) {
  faseIndice = indice;
  faseData = nivelData.fases[indice];
  pistaIndiceActual = 0;

  const escenario = escenarioDeFase(faseData);
  world = new World(escenario);
  robot1 = new Robot1({
    posicion: escenario.robotPosicion || [0, 0],
    direccion: escenario.robotDireccion || "este",
    energiaInicial: escenario.energiaInicial ?? 100,
    costoEnergiaPorCasilla: escenario.costoEnergiaPorCasilla ?? 1,
  });

  if (!scene) {
    scene = new Scene(el.lienzo, world, robot1);
  } else {
    scene.reiniciar(world, robot1);
  }
  scene.ajustarTamano();

  el.etiquetaObjetivo.textContent = escenario.objetivoPosicion
    ? `Objetivo: (${escenario.objetivoPosicion[0]}, ${escenario.objetivoPosicion[1]})`
    : "";

  el.textoAprende.innerHTML = `<strong>${faseData.titulo}</strong><br>${faseData.enunciado}`;
  renderInstruccionesPermitidas(faseData);

  codeEditor.establecerCodigo(faseData.codigoInicial || "");
  codeEditor.limpiarMarcaError();
  codeEditor.deshabilitar(false);

  outputPanel.mostrarVacio();
  memoryPanel.limpiar();
  statePanel.actualizar(snapshotEstado(robot1));
  feedback.mostrarInicial(mensajeInicialFase(faseData));

  const estadoNivel = repo.obtenerEstadoNivel(mundoActualId, nivelActualId);
  const completadas = new Set(
    Object.entries(estadoNivel.fases)
      .filter(([, v]) => v.completada)
      .map(([k]) => k)
  );
  phaseBar.render(nivelData.fases, faseIndice, completadas, (i) => cargarFase(i));

  configurarUIPorTipoFase();
}

function mensajeInicialFase(fase) {
  switch (fase.tipo) {
    case "PREDECIR":
      return "Lee el código, piensa qué va a pasar y elige tu predicción.";
    case "EXPLORAR":
      return "Ejecuta el código y observa qué hace Robot1.";
    case "DEBUG":
      return "Este código tiene un error. Corrígelo y ejecútalo.";
    default:
      return "Escribe tu código y presiona ▶ Ejecutar para ver qué hace Robot1.";
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

function renderInstruccionesPermitidas(fase) {
  const chips = [];
  (fase.instruccionesPermitidas || []).forEach((i) => {
    if (i === "asignacion") chips.push("variable = valor");
    else chips.push(`${i}()`);
  });
  (fase.metodosPermitidos || []).forEach((m) => {
    chips.push(`robot1.${m}()`);
  });
  el.listaInstrucciones.innerHTML = chips
    .map((c) => `<span class="chip-instruccion">${c}</span>`)
    .join("");
}

function renderSelectorNiveles() {
  const progreso = repo.cargarProgreso();
  el.selectorNiveles.innerHTML = "";
  let mundoAnterior = null;

  for (let id = 1; id <= TOTAL_NIVELES; id++) {
    const mundo = mundoDeNivel(id);
    if (mundo !== mundoAnterior) {
      const etiqueta = document.createElement("span");
      etiqueta.className = "separador-mundo";
      etiqueta.textContent = `M${mundo}`;
      el.selectorNiveles.appendChild(etiqueta);
      mundoAnterior = mundo;
    }

    const estadoNivelMundo = progreso.mundos[mundo]?.niveles?.[id];
    const completado = !!estadoNivelMundo?.completado;
    const nivelAnteriorId = id - 1;
    const mundoAnterior2 = nivelAnteriorId >= 1 ? mundoDeNivel(nivelAnteriorId) : null;
    const anteriorCompletado =
      nivelAnteriorId < 1 || !!progreso.mundos[mundoAnterior2]?.niveles?.[nivelAnteriorId]?.completado;
    const desbloqueado = id === 1 || anteriorCompletado || completado;

    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "nivel-punto";
    boton.textContent = String(id);
    if (id === nivelActualId) boton.classList.add("activo");
    if (completado) boton.classList.add("completado");
    if (!desbloqueado) {
      boton.classList.add("bloqueado");
      boton.disabled = true;
    } else {
      boton.addEventListener("click", () => irANivel(id));
    }
    el.selectorNiveles.appendChild(boton);
  }
}

function actualizarContadorTotal() {
  const progreso = repo.cargarProgreso();
  let total = 0;
  Object.values(progreso.mundos).forEach((mundo) => {
    Object.values(mundo.niveles).forEach((nivel) => {
      total += nivel.estrellas || 0;
    });
  });
  el.totalEstrellas.textContent = String(total);
}

// ---------- Predicción ----------

function evaluarPrediccion(opcionId, botonClic) {
  repo.registrarIntentoFase(mundoActualId, nivelActualId, faseData.id, {});
  const correcta = opcionId === faseData.respuestaCorrecta;

  el.prediccionOpciones.querySelectorAll(".opcion-prediccion").forEach((b) => {
    b.classList.remove("opcion-correcta", "opcion-incorrecta");
  });
  botonClic.classList.add(correcta ? "opcion-correcta" : "opcion-incorrecta");

  if (correcta) {
    completarFaseActual();
  } else {
    feedback.mostrarObjetivoNoAlcanzado("Esa no era la predicción correcta. Vuelve a intentarlo.");
  }
}

// ---------- Pipeline de ejecución ----------

async function ejecutarCodigo() {
  if (enEjecucion) return;
  enEjecucion = true;
  el.btnEjecutar.disabled = true;
  codeEditor.limpiarMarcaError();

  const codigo = codeEditor.obtenerCodigo();
  repo.registrarIntentoFase(mundoActualId, nivelActualId, faseData.id, {});

  outputPanel.limpiar();
  memoryPanel.limpiar();

  const salidas = [];

  try {
    const tokens = new Lexer(codigo).tokenizar();
    const ast = new Parser(tokens).parsear();
    new Validator(faseData).validar(ast);

    scene.reiniciar(world, robot1);
    robot1.reiniciar();
    world.reiniciar();
    scene.render();

    const motor = crearMotor({
      scene,
      world,
      robot1,
      entradasSimuladas: faseData.entradasSimuladas || [],
      callbacks: {
        onSalida: (s) => {
          salidas.push(s);
          outputPanel.agregar(s);
        },
        onAsignacion: (nombre, valor) => memoryPanel.actualizar(nombre, valor),
        onEstado: (estado) => statePanel.actualizar(estado),
      },
    });

    const interprete = new Interpreter(motor);
    await interprete.ejecutar(ast);
    statePanel.actualizar(snapshotEstado(robot1));

    evaluarResultado(salidas, codigo);
  } catch (error) {
    manejarError(error, codigo);
  } finally {
    enEjecucion = false;
    el.btnEjecutar.disabled = false;
  }
}

function evaluarResultado(salidas, codigo) {
  const validacion = faseData.validacion || { tipo: "ejecutado" };
  let exito = false;

  if (validacion.tipo === "ejecutado") {
    exito = true;
  } else if (validacion.tipo === "output") {
    exito = salidas.some((s) => String(s.valor) === String(validacion.valorEsperado));
  } else if (validacion.tipo === "posicion") {
    const [gx, gy] = validacion.valorEsperado;
    const [x, y] = robot1.posicion();
    exito = x === gx && y === gy;
  } else if (validacion.tipo === "estado") {
    const [x, y] = robot1.posicion();
    exito = true;
    if (validacion.posicionEsperada) {
      exito = exito && x === validacion.posicionEsperada[0] && y === validacion.posicionEsperada[1];
    }
    if (validacion.direccionEsperada) {
      exito = exito && robot1.direccion === validacion.direccionEsperada;
    }
    if (validacion.energiaMinima !== undefined) {
      exito = exito && robot1.energia >= validacion.energiaMinima;
    }
  }

  if (exito) {
    completarFaseActual();
  } else {
    repo.guardarEjecucion({
      mundoId: mundoActualId,
      nivelId: nivelActualId,
      faseId: faseData.id,
      codigo,
      resultado: "objetivo_no_alcanzado",
    });
    feedback.mostrarObjetivoNoAlcanzado(
      faseData.mensajeNoLogrado || "Robot1 todavía no cumple el objetivo de esta fase. Revisa tu código e inténtalo de nuevo."
    );
  }
}

function completarFaseActual() {
  repo.completarFase(mundoActualId, nivelActualId, faseData.id);

  const esUltimaFase = faseIndice === nivelData.fases.length - 1;
  const estadoNivel = repo.obtenerEstadoNivel(mundoActualId, nivelActualId);
  const completadas = new Set(
    Object.entries(estadoNivel.fases)
      .filter(([, v]) => v.completada)
      .map(([k]) => k)
  );
  phaseBar.render(nivelData.fases, faseIndice, completadas, (i) => cargarFase(i));

  const todasCompletas = nivelData.fases.every((f) => completadas.has(f.id));

  if (todasCompletas) {
    const estrellas = calcularEstrellasNivel(estadoNivel.fases);
    const siguienteId = nivelActualId + 1;
    const hayMundoSiguiente = siguienteId <= TOTAL_NIVELES;
    repo.completarNivel(mundoActualId, nivelActualId, {
      estrellas,
      siguienteMundo: hayMundoSiguiente ? mundoDeNivel(siguienteId) : mundoActualId,
      siguienteNivel: hayMundoSiguiente ? siguienteId : nivelActualId,
    });
    renderizarEstrellas(el.estrellasNivel, estrellas);
    renderSelectorNiveles();
    actualizarContadorTotal();

    const botones = [
      { texto: "Repetir nivel", tipo: "secundario", onClick: () => cargarFase(0) },
    ];
    if (hayMundoSiguiente) {
      botones.push({
        texto: "Siguiente nivel",
        tipo: "primario",
        onClick: () => irANivel(siguienteId),
      });
    }

    feedback.mostrarResultadoNivel({
      estrellas,
      mensaje:
        siguienteId > TOTAL_NIVELES
          ? "¡Completaste los Mundos 1 y 2 de CodeQuest!"
          : "Desbloqueaste el siguiente nivel.",
      botones,
    });
  } else {
    const botones = [
      { texto: "Seguir jugando", tipo: "secundario", onClick: () => feedback.mostrarInicial(mensajeInicialFase(faseData)) },
      { texto: "Siguiente fase", tipo: "primario", onClick: () => cargarFase(faseIndice + 1) },
    ];
    feedback.mostrarResultadoFase({
      mensaje: faseData.retroalimentacion || "¡Bien hecho!",
      botones,
    });
  }
}

function manejarError(error, codigo) {
  if (error instanceof CQLError) {
    feedback.mostrarError(error);
    codeEditor.marcarLineaError(error.linea);
    repo.guardarEjecucion({
      mundoId: mundoActualId,
      nivelId: nivelActualId,
      faseId: faseData.id,
      codigo,
      resultado: "error",
      codigoError: error.codigo,
    });
  } else {
    console.error(error);
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

function mostrarPista() {
  const pistas = faseData.pistas || [];
  if (pistas.length === 0) {
    feedback.mostrarInicial("Esta fase no tiene pistas: confía en lo que aprendiste.");
    return;
  }
  pistaIndiceActual = Math.min(pistaIndiceActual + 1, pistas.length);
  feedback.mostrarPista(pistas[pistaIndiceActual - 1], pistaIndiceActual);
  repo.registrarIntentoFase(mundoActualId, nivelActualId, faseData.id, { pistasUsadas: pistaIndiceActual });
}

// ---------- Eventos ----------

el.btnEjecutar.addEventListener("click", ejecutarCodigo);
el.btnReiniciar.addEventListener("click", reiniciarFase);
el.btnPista.addEventListener("click", mostrarPista);

window.addEventListener("resize", () => scene && scene.ajustarTamano());

// ---------- Arranque ----------

(async function iniciar() {
  const progreso = repo.cargarProgreso();
  const inicio = Math.min(Math.max(progreso.jugador.nivelActual || 1, 1), TOTAL_NIVELES);
  await irANivel(inicio);
})();
