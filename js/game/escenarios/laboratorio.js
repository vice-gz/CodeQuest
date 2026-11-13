// laboratorio.js
// Mundo 1 (Despertar) y Laboratorio Libre: cuadrícula 2D con Robot1.
// Envuelve las clases del Avance 1 (World, Robot1, Scene, crearMotor) para que
// cumplan el contrato común de escenarios.

import { EscenarioBase } from "./base.js";
import { World } from "../world.js";
import { Robot1 } from "../robot1.js";
import { Scene } from "../scene.js";
import { crearMotor, snapshotEstado } from "../ejecutor.js";
import { BIBLIOTECA_ROBOT } from "../../interpreter/bibliotecas.js";

// Sin canvas (pruebas, casos silenciosos): no dibuja y resuelve las animaciones al instante.
export class EscenaNula {
  constructor(world, robot1) {
    this.world = world;
    this.robot1 = robot1;
    this.visualX = robot1.x;
    this.visualY = robot1.y;
  }
  reiniciar(world, robot1) {
    this.world = world;
    this.robot1 = robot1;
    this.visualX = robot1.x;
    this.visualY = robot1.y;
  }
  render() {}
  ajustarTamano() {}
  async moverAnimado() {}
}

export class EscenarioLaboratorio extends EscenarioBase {
  constructor(config, opciones) {
    super(config, opciones);
    this.world = new World(config);
    this.robot1 = new Robot1({
      posicion: config.robotPosicion || [0, 0],
      direccion: config.robotDireccion || "este",
      energiaInicial: config.energiaInicial ?? 100,
      energiaMaxima: config.energiaMaxima ?? null,
      costoEnergiaPorCasilla: config.costoEnergiaPorCasilla ?? 1,
    });
    this.scene = this.crearEscena();
    this.mostrarRobot = config.mostrarRobot !== false;
    this.mostrarEnergia = config.mostrarEnergia !== false;
    this.scene.reiniciar(this.world, this.robot1, { mostrarRobot: this.mostrarRobot });
  }

  /** La vista del mundo. Los escenarios que heredan (p. ej. la fábrica) la sustituyen por la suya. */
  destruir() {
    super.destruir();
    this.scene?.destruir?.(); // la escena del Mundo 1 tiene su propio dibujo de reposo
  }

  crearEscena() {
    return this.canvas ? new Scene(this.canvas, this.world, this.robot1) : new EscenaNula(this.world, this.robot1);
  }

  get tipo() {
    return "laboratorio";
  }
  get biblioteca() {
    return BIBLIOTECA_ROBOT;
  }
  get tituloPanel() {
    return "Mundo 2D · Laboratorio";
  }
  get tituloEstado() {
    return "Estado de Robot1";
  }
  get textoObserva() {
    return "Ejecuta el código y observa qué hace Robot1.";
  }
  get textoProtagonista() {
    return "Robot1";
  }
  get etiquetaObjetivo() {
    const o = this.config.objetivoPosicion;
    return o ? `Objetivo: (${o[0]}, ${o[1]})` : "";
  }

  reiniciar() {
    this.robot1.reiniciar();
    this.world.reiniciar();
    this.scene.reiniciar(this.world, this.robot1, { mostrarRobot: this.mostrarRobot });
    this.scene.render();
  }
  render() {
    this.scene.render();
  }
  ajustarTamano() {
    this.scene.ajustarTamano();
  }
  crearMotor(callbacks) {
    return crearMotor({ scene: this.scene, world: this.world, robot1: this.robot1, callbacks });
  }
  snapshot() {
    return snapshotEstado(this.robot1);
  }
  filasEstado() {
    const [x, y] = this.robot1.posicion();
    const filas = [
      { etiqueta: "Posición", valor: `(${x}, ${y})` },
      { etiqueta: "Dirección", valor: this.robot1.direccion },
    ];
    if (this.mostrarEnergia) filas.push({ etiqueta: "Energía", valor: `${this.robot1.energia}%` });
    return filas;
  }

  evaluar(v, ctx, h) {
    const r = this.robot1;
    const [x, y] = r.posicion();
    const pos = (e) => x === e[0] && y === e[1];
    const todosObjetivos = () => this.world.objetivos.every((o) => r.objetivosAlcanzados.includes(`${o[0]},${o[1]}`));

    switch (v.tipo) {
      case "posicion":
        return pos(v.valorEsperado);
      case "posicion_con_operacion":
        return pos(v.valorEsperado) && h.fuente.includes(v.operadorRequerido);
      case "posicion_con_variable":
        return pos(v.valorEsperado) && h.tieneVar(v.variableRequerida);
      case "posicion_sin_numero_literal":
        return pos(v.valorEsperado) && !new RegExp(`\\b${v.numeroProhibido}\\b`).test(h.fuente);
      case "objetivos":
        return todosObjetivos();
      case "estado":
      case "estado_variable": {
        let ok = true;
        if (v.posicionEsperada) ok = ok && pos(v.posicionEsperada);
        if (v.direccionEsperada) ok = ok && r.direccion === v.direccionEsperada;
        if (v.energiaMinima !== undefined) ok = ok && r.energia >= v.energiaMinima;
        if (v.outputContiene) ok = ok && h.inc(v.outputContiene);
        if (v.outputEsperado) ok = ok && h.exact(v.outputEsperado);
        if (v.todosLosObjetivos) ok = ok && todosObjetivos();
        if (v.operadorRequerido) ok = ok && h.fuente.includes(v.operadorRequerido);
        if (v.variableRequerida) ok = ok && h.tieneVar(v.variableRequerida);
        return ok;
      }
      default:
        return undefined;
    }
  }
}
