// ejecutor.js
// El "motor" que conecta al Intérprete con el mundo real (Robot1 + World +
// Scene). Cada acción del robot se anima y, al terminar, el estado real
// del robot queda actualizado — por eso robot1.posicion()/mirar()/energia()
// dentro del código del estudiante siempre leen el estado verdadero, sin
// necesitar un robot "simulado" aparte (evita duplicar la lógica de
// movimiento en dos lugares).
//
// También es el punto donde se notifica a los paneles en vivo (Salida,
// Memoria, Estado) mientras el código se ejecuta — Documento de cambios,
// sección 8.

import { Errores } from "../interpreter/errors.js";
import { vectorDireccion } from "./movimiento.js";

function esperar(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function snapshotEstado(robot1) {
  return {
    posicion: robot1.posicion(),
    direccion: robot1.direccion,
    energia: robot1.energia,
    inventario: [...robot1.inventario],
  };
}

/**
 * @param {object} opciones
 * @param {import("./scene.js").Scene} opciones.scene
 * @param {import("./world.js").World} opciones.world
 * @param {import("./robot1.js").Robot1} opciones.robot1
 * @param {object} [opciones.callbacks]
 * @param {Array} [opciones.entradasSimuladas] - cola de valores que devuelve entrada()
 */
export function crearMotor({ scene, world, robot1, callbacks = {}, entradasSimuladas = [] }) {
  const colaEntradas = [...entradasSimuladas];
  const notificarEstado = () => callbacks.onEstado?.(snapshotEstado(robot1));

  // El validador detecta un literal de texto en avanzar("tres"), pero no
  // una variable que contiene texto (pasos = "3"). Ese caso solo se puede
  // ver en tiempo de ejecución, cuando la variable ya tiene un valor.
  function exigirNumero(metodo, valor) {
    if (typeof valor !== "number" || Number.isNaN(valor)) {
      throw Errores.accionNecesitaNumero(metodo, null);
    }
    return valor;
  }

  async function moverA(destino) {
    const [dx, dy] = destino;
    if (!world.dentroDeLimites(dx, dy)) {
      throw Errores.saleDelLaboratorio();
    }
    if (world.hayObstaculoEn(dx, dy)) {
      throw Errores.choqueConObstaculo();
    }
    await scene.moverAnimado(dx, dy);
  }

  return {
    async print(valor) {
      callbacks.onSalida?.({ tipo: "PRINT", valor });
      await esperar(150);
    },

    async entrada() {
      if (colaEntradas.length === 0) {
        throw Errores.entradaNoDisponible();
      }
      const valor = colaEntradas.shift();
      callbacks.onSalida?.({ tipo: "ENTRADA", valor });
      await esperar(150);
      return valor;
    },

    async asignacion(nombre, valor) {
      callbacks.onAsignacion?.(nombre, valor);
    },

    async hablar(texto) {
      robot1.hablar(texto);
      scene.render();
      callbacks.onSalida?.({ tipo: "HABLAR", valor: texto });
      await esperar(900);
      robot1.mensaje = null;
      scene.render();
    },

    async avanzar(n) {
      exigirNumero("avanzar", n);
      const [vx, vy] = vectorDireccion(robot1.direccion);
      const destino = [robot1.x + vx * n, robot1.y + vy * n];
      await moverA(destino);
      robot1.avanzar(n);
      notificarEstado();
    },

    async retroceder(n) {
      exigirNumero("retroceder", n);
      const [vx, vy] = vectorDireccion(robot1.direccion);
      const destino = [robot1.x - vx * n, robot1.y - vy * n];
      await moverA(destino);
      robot1.retroceder(n);
      notificarEstado();
    },

    async girar(direccion) {
      robot1.girar(direccion);
      scene.render();
      notificarEstado();
      await esperar(200);
    },

    async recoger() {
      const objeto = world.quitarObjetoEn(robot1.x, robot1.y);
      robot1.recoger(objeto?.tipo);
      scene.render();
      notificarEstado();
      await esperar(200);
    },

    async soltar() {
      const tipo = robot1.soltar();
      if (tipo) {
        world.objetos.push({ posicion: [robot1.x, robot1.y], tipo });
      }
      scene.render();
      notificarEstado();
      await esperar(200);
    },

    async mirar() {
      return robot1.direccion;
    },

    async posicion() {
      const [x, y] = robot1.posicion();
      return `(${x},${y})`;
    },

    async energia() {
      return robot1.energia;
    },
  };
}
