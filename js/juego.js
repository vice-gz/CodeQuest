// juego.js (antes main.js)
// Orquesta el juego de CodeQuest (Mundos 1-2, 19 niveles, sistema de fases,
// 3 paneles en vivo). Ciclo por fase: Obtener código -> Lexer -> Parser ->
// Validator -> Interpreter (async, guiado por el motor) -> Robot1/Mundo ->
// Paneles en vivo -> Retroalimentación inline -> Progreso -> Estrellas.
// Avance 2: requiere sesión y guarda el progreso en Supabase
// (SupabaseProgressRepository) en lugar de solo localStorage.

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

import { Dictionary } from "./ui/dictionary.js";
import { Tour } from "./ui/tour.js";
import { ModoDemo } from "./ui/demoMode.js";
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

let world = null;
let robot1 = null;
let scene = null;
let pistaIndiceActual = 0;
let enEjecucion = false;

// ---------- Carga de niveles ----------

async function cargarNivel(id) {
  // Los niveles vienen empaquetados en el catálogo (game/catalogo.js).
  const nivel = obtenerNivel(id);
  if (!nivel) throw new Error(`No se pudo cargar el nivel ${id}`);
  return nivel;
}

function escenarioDeFase(fase) {
  return { ...nivelData.escenario, ...(fase.escenario || {}) };
}

async function irANivel(id) {
  nivelActualId = id;
  mundoActualId = mundoDeNivel(id);
  nivelData = await cargarNivel(id);

  const estadoNivel = await repo.obtenerEstadoNivel(mundoActualId, id);
  faseIndice = nivelData.fases.findIndex((f) => !estadoNivel.fases[f.id]?.completada);
  if (faseIndice === -1) faseIndice = 0; // nivel ya completo: se puede repasar desde el inicio

  el.tituloNivel.textContent = `Nivel ${id} — ${nivelData.nombre}`;
  el.etiquetaConcepto.textContent = nivelData.concepto;
  el.textoNarrativa.textContent = nivelData.narrativa || "";
  renderizarEstrellas(el.estrellasNivel, estadoNivel.estrellas);

  await cargarFase(faseIndice);
  await renderSelectorNiveles();
  await actualizarContadorTotal();
  await actualizarDiccionario();
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
    energiaMaxima: escenario.energiaMaxima ?? null,
    costoEnergiaPorCasilla: escenario.costoEnergiaPorCasilla ?? 1,
  });

  const mostrarRobot = escenario.mostrarRobot !== false;
  if (!scene) {
    scene = new Scene(el.lienzo, world, robot1);
  }
  scene.reiniciar(world, robot1, { mostrarRobot });
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
  statePanel.actualizar(snapshotEstado(robot1), { mostrarEnergia: escenario.mostrarEnergia !== false });
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

async function renderSelectorNiveles() {
  const progreso = await repo.obtenerProgreso();
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
    const desbloqueado = ModoDemo.activo() || id === 1 || anteriorCompletado || completado;

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

  const salidas = [];
  const inicio = performance.now();

  try {
    const tokens = new Lexer(codigo).tokenizar();
    const ast = new Parser(tokens).parsear();
    new Validator(faseData).validar(ast);

    robot1.reiniciar();
    world.reiniciar();
    scene.reiniciar(world, robot1, { mostrarRobot: mostrarRobotEnFase() });
    scene.render();
    statePanel.actualizar(snapshotEstado(robot1), { mostrarEnergia: mostrarEnergiaEnNivel() });

    const motor = crearMotor({
      scene,
      world,
      robot1,
      callbacks: {
        onSalida: (s) => {
          salidas.push(s);
          outputPanel.agregar(s);
        },
        onAsignacion: (nombre, valor) => memoryPanel.actualizar(nombre, valor),
        onEstado: (estado) =>
          statePanel.actualizar(estado, { mostrarEnergia: mostrarEnergiaEnNivel() }),
        // La ejecución se pausa aquí hasta que el estudiante escribe un valor.
        pedirEntrada: () =>
          outputPanel.pedirEntrada({
            etiqueta: faseData.etiquetaEntrada,
            tipo: faseData.entradaTipo || "libre",
          }),
      },
    });

    const interprete = new Interpreter(motor);
    await interprete.ejecutar(ast);
    statePanel.actualizar(snapshotEstado(robot1), { mostrarEnergia: mostrarEnergiaEnNivel() });

    await evaluarResultado(salidas, codigo, Math.round(performance.now() - inicio));
  } catch (error) {
    // El intento se registra solo cuando ya se sabe el resultado.
    await repo.registrarIntentoFase(mundoActualId, nivelActualId, faseData.id, { codigo });
    await manejarError(error, codigo, Math.round(performance.now() - inicio));
  } finally {
    enEjecucion = false;
    el.btnEjecutar.disabled = false;
  }
}

function mostrarRobotEnFase() {
  const escenario = { ...nivelData.escenario, ...(faseData.escenario || {}) };
  return escenario.mostrarRobot !== false;
}

function mostrarEnergiaEnNivel() {
  const escenario = { ...nivelData.escenario, ...(faseData.escenario || {}) };
  return escenario.mostrarEnergia !== false;
}

// Quita comentarios y textos entre comillas antes de inspeccionar el código
// fuente, para que un número dentro de un texto no cuente como literal.
function codigoSinTextos(codigo) {
  return codigo
    .replace(/#.*$/gm, "")
    .replace(/"[^"]*"/g, '""')
    .replace(/'[^']*'/g, "''");
}

async function evaluarResultado(salidas, codigo, tiempoMs) {
  if (esSandbox) {
    // Laboratorio Libre: sin validación, sin estrellas, sin guardar nada.
    feedback.mostrarInicial("Programa ejecutado. Cambia el código y vuelve a ejecutar para seguir experimentando.");
    return;
  }
  const validacion = faseData.validacion || { tipo: "ejecutado" };
  const fuente = codigoSinTextos(codigo);
  const [x, y] = robot1.posicion();
  let exito = false;

  const cumplePosicion = (esperada) => x === esperada[0] && y === esperada[1];
  const salidaIncluye = (v) => salidas.some((s) => String(s.valor).includes(String(v)));
  const salidaExacta = (v) => salidas.some((s) => String(s.valor) === String(v));

  switch (validacion.tipo) {
    case "ejecutado":
    case "codigo_sin_error":
      // Llegar hasta aquí ya significa que el código corrió sin lanzar error.
      exito = true;
      break;

    case "output":
    case "output_exacto":
      exito = salidaExacta(validacion.valorEsperado);
      break;

    case "output_contiene":
      exito = salidaIncluye(validacion.valor ?? validacion.valorEsperado);
      break;

    case "output_con_variable":
      exito =
        salidaExacta(validacion.valorEsperado) &&
        new RegExp(`\\b${validacion.variableRequerida}\\s*=`).test(fuente);
      break;

    case "posicion":
      exito = cumplePosicion(validacion.valorEsperado);
      break;

    case "posicion_con_operacion":
      exito =
        cumplePosicion(validacion.valorEsperado) &&
        fuente.includes(validacion.operadorRequerido);
      break;

    case "posicion_con_variable":
      exito =
        cumplePosicion(validacion.valorEsperado) &&
        new RegExp(`\\b${validacion.variableRequerida}\\s*=`).test(fuente);
      break;

    case "posicion_sin_numero_literal":
      // El destino debe calcularse, no escribirse a mano.
      exito =
        cumplePosicion(validacion.valorEsperado) &&
        !new RegExp(`\\b${validacion.numeroProhibido}\\b`).test(fuente);
      break;

    case "objetivos":
      // Todos los objetivos del escenario deben haberse pisado.
      exito = world.objetivos.every((o) => robot1.objetivosAlcanzados.includes(`${o[0]},${o[1]}`));
      break;

    case "estado":
    case "estado_variable": {
      exito = true;
      if (validacion.posicionEsperada) exito = exito && cumplePosicion(validacion.posicionEsperada);
      if (validacion.direccionEsperada) exito = exito && robot1.direccion === validacion.direccionEsperada;
      if (validacion.energiaMinima !== undefined) exito = exito && robot1.energia >= validacion.energiaMinima;
      if (validacion.outputContiene) exito = exito && salidaIncluye(validacion.outputContiene);
      if (validacion.outputEsperado) exito = exito && salidaExacta(validacion.outputEsperado);
      if (validacion.todosLosObjetivos) {
        exito =
          exito &&
          world.objetivos.every((o) => robot1.objetivosAlcanzados.includes(`${o[0]},${o[1]}`));
      }
      if (validacion.operadorRequerido) exito = exito && fuente.includes(validacion.operadorRequerido);
      if (validacion.variableRequerida) {
        exito = exito && new RegExp(`\\b${validacion.variableRequerida}\\s*=`).test(fuente);
      }
      break;
    }

    default:
      exito = false;
      break;
  }

  if (exito) {
    await completarFaseActual(codigo, tiempoMs);
  } else {
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
      faseData.mensajeNoLogrado ||
        "Robot1 todavía no cumple el objetivo de esta fase. Revisa tu código e inténtalo de nuevo."
    );
  }
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
          : "¡Completaste los Mundos 1 y 2 de CodeQuest!",
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
      if (resultado === "continuar") await irANivel(mundoSiguiente.niveles[0]);
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

window.addEventListener("resize", () => scene && scene.ajustarTamano());

// ---------- Arranque ----------

(async function iniciar() {
  // 1) Sesión: sin usuario autenticado se vuelve a la landing.
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
    repo = new NoopProgressRepository();
    await iniciarSandbox();
    return;
  }
  const enDemo = pideDemo && esRolAdmin(perfil.rol);

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

  const inicio = Math.min(Math.max(progreso.jugador.nivelActual || 1, 1), TOTAL_NIVELES);
  if (enDemo) marcarInsignia("DEMO · no se guarda en la base de datos");
  await irANivel(inicio);

  // La primera vez, el tour explica para qué sirve cada área.
  if (!Tour.yaSeVio()) {
    setTimeout(() => tour.iniciar(), 500);
  }
})().catch((e) => {
  console.error(e);
  const f = document.getElementById("feedback-contenido");
  if (f) f.innerHTML = "<p class=\"feedback-texto\">No se pudo iniciar el juego. Recarga la página.</p>";
});
