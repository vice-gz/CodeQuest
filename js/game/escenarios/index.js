// index.js
// Fábrica de escenarios: el tipo de mundo (campo escenario.tipo del JSON del
// nivel) decide qué escenario se crea. Añadir un mundo = añadir una entrada aquí.

import { EscenarioLaboratorio } from "./laboratorio.js";
import { EscenarioDatos } from "./datos.js";
import { EscenarioCartas } from "./cartas.js";
import { EscenarioElevador } from "./elevador.js";

const ESCENARIOS = {
  laboratorio: EscenarioLaboratorio,
  datos: EscenarioDatos,
  cartas: EscenarioCartas,
  elevador: EscenarioElevador,
};

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
