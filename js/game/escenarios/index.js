// index.js
// Fábrica de escenarios: el campo escenario.tipo del JSON del nivel (o de la fase) decide qué escenario se crea.
// Un mundo puede alternar escenarios entre niveles (el Mundo 1 pasa del robot a la alcancía, el semáforo…).
// Añadir un escenario = añadir una entrada aquí.

import { EscenarioLaboratorio } from "./laboratorio.js";
import { EscenarioDatos } from "./datos.js";
import { EscenarioCartas } from "./cartas.js";
import { EscenarioElevador } from "./elevador.js";
import { EscenarioFabrica } from "./fabrica.js";
import { EscenarioDiagrama } from "./diagrama.js";
import { EscenarioProyecto } from "./proyecto.js";
import { EscenarioExpendedora } from "./expendedora.js";
import { EscenarioPuerta } from "./puerta.js";
import { EscenarioRadar } from "./radar.js";
import { EscenarioNucleo } from "./nucleo.js";
// Minijuegos del Mundo 1 · Fundamentos y Datos (cada nivel elige el suyo con escenario.tipo)
import { EscenarioAlcancia } from "./alcancia.js";
import { EscenarioSemaforo } from "./semaforo.js";
import { EscenarioVasos } from "./vasos.js";
import { EscenarioReceta } from "./receta.js";
import { EscenarioPozo } from "./pozo.js";
import { EscenarioCronometro } from "./cronometro.js";
import { EscenarioBoleta } from "./boleta.js";
import { EscenarioViaje } from "./viaje.js";
import { EscenarioCajaFuerte } from "./cajafuerte.js";

const ESCENARIOS = {
  laboratorio: EscenarioLaboratorio,
  datos: EscenarioDatos,
  cartas: EscenarioCartas,
  elevador: EscenarioElevador,
  fabrica: EscenarioFabrica,
  diagrama: EscenarioDiagrama,
  proyecto: EscenarioProyecto,
  expendedora: EscenarioExpendedora,
  puerta: EscenarioPuerta,
  radar: EscenarioRadar,
  nucleo: EscenarioNucleo,
  alcancia: EscenarioAlcancia,
  semaforo: EscenarioSemaforo,
  vasos: EscenarioVasos,
  receta: EscenarioReceta,
  pozo: EscenarioPozo,
  cronometro: EscenarioCronometro,
  boleta: EscenarioBoleta,
  viaje: EscenarioViaje,
  cajafuerte: EscenarioCajaFuerte,
};

/** Tipos de escenario que existen (las pruebas comprueban que cada nivel use uno de estos). */
export const TIPOS_ESCENARIO = Object.keys(ESCENARIOS);

export function crearEscenario(config = {}, opciones = {}) {
  const Clase = ESCENARIOS[config.tipo || "laboratorio"] || EscenarioLaboratorio;
  return new Clase(config, opciones);
}

/**
 * Escenario de la fase combinando nivel + fase (+ caso). Los campos de un caso
 * (cartas, pasajeros...) sustituyen a los del nivel; `variables` se mezclan.
 */
export function configDeFase(nivel, fase, caso = null) {
  const base = { ...(nivel.escenario || {}), ...(fase.escenario || {}) };
  if (!caso?.escenario) return base;
  return { ...base, ...caso.escenario, variables: { ...(base.variables || {}), ...(caso.escenario.variables || {}) } };
}
