// ejecutor.js
// Motor que conecta al Intérprete con el mundo real (Robot1 + World + Scene).
//
// Fuente de verdad única: la posición lógica vive SOLO en robot1.x/y, y el
// motor la escribe él mismo después de la animación. La escena solo guarda
// una posición visual interpolada. Antes esto estaba duplicado (la escena
// animaba y además robot1.avanzar() volvía a mover), lo que aplicaba el
// movimiento dos veces ante ciertos flujos.
//
// También es el punto donde se notifica a los paneles en vivo (Salida,
// Memoria, Estado) mientras el código se ejecuta — documento de cambios §8.

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
    objetivosAlcanzados: [...robot1.objetivosAlcanzados],
  };
}

/**
 * @param {object} opciones
 * @param {import("./scene.js").Scene} opciones.scene
 * @param {import("./world.js").World} opciones.world
 * @param {import("./robot1.js").Robot1} opciones.robot1
 * @param {object} [opciones.callbacks] - onSalida, onAsignacion, onEstado,
 *   onEntradaPendiente, pedirEntrada
 */
export function crearMotor({ scene, world, robot1, callbacks = {} }) {
  const notificarEstado = () => callbacks.onEstado?.(snapshotEstado(robot1));

  // Devuelve la posición visual al estado lógico real (tras un error a
  // media animación, por ejemplo) para que lo dibujado no mienta.
  function sincronizarVisual() {
    scene.visualX = robot1.x;
    scene.visualY = robot1.y;
    scene.render();
  }

  // El validador detecta un literal de texto en avanzar("tres"), pero no una
  // variable que contiene texto (pasos = "3"). Ese caso solo se puede ver en
  // tiempo de ejecución, cuando la variable ya tiene un valor.
  function exigirNumero(metodo, valor) {
    if (typeof valor !== "number" || Number.isNaN(valor)) {
      throw Errores.accionNecesitaNumero(metodo, null);
    }
    return valor;
  }

  // Al pisar una casilla: recoge recargas de energía y marca objetivos.
  function alPisar() {
    const recarga = world.consumirRecargaEn(robot1.x, robot1.y);
    if (recarga) {
      robot1.recargar(recarga.cantidad);
      callbacks.onSalida?.({ tipo: "SISTEMA", valor: `Recarga: +${recarga.cantidad} de energía` });
    }
    if (world.esObjetivo(robot1.x, robot1.y)) {
      robot1.marcarObjetivo([robot1.x, robot1.y]);
    }
  }

  // Robot1 recorre las casillas una por una: así un obstáculo a mitad de
  // camino lo detiene, y las recargas y objetivos intermedios se activan
  // al pisarlos (antes avanzar(6) saltaba de (0,0) a (6,0) sin ver nada).
  async function desplazar(metodo, n, signo) {
    exigirNumero(metodo, n);
    const [vx, vy] = vectorDireccion(robot1.direccion);
    const pasos = Math.abs(n);
    const sentido = n < 0 ? -signo : signo;

    // Duración por casilla: recorridos largos no deben eternizarse.
    const duracion = Math.max(110, Math.min(360, 700 / Math.max(1, pasos)));

    for (let i = 0; i < pasos; i++) {
      const px = robot1.x + sentido * vx;
      const py = robot1.y + sentido * vy;

      if (!world.dentroDeLimites(px, py)) {
        sincronizarVisual();
        throw Errores.saleDelLaboratorio();
      }
      if (world.hayObstaculoEn(px, py)) {
        sincronizarVisual();
        throw Errores.choqueConObstaculo();
      }

      // eslint-disable-next-line no-await-in-loop
      await scene.moverAnimado(px, py, duracion);
      robot1.x = px;
      robot1.y = py;
      robot1.gastarEnergia(1);
      alPisar();
      notificarEstado();
    }
  }

  return {
    async print(valor) {
      callbacks.onSalida?.({ tipo: "PRINT", valor });
      await esperar(150);
    },

    async entrada() {
      // entrada() siempre le pregunta al estudiante. No se rellena con
      // valores guardados en el nivel: el sentido de la instrucción es que
      // el dato venga de fuera del programa, escrito por la persona.
      if (typeof callbacks.pedirEntrada !== "function") {
        throw Errores.entradaNoDisponible();
      }
      callbacks.onEntradaPendiente?.();
      const valor = await callbacks.pedirEntrada();
      callbacks.onSalida?.({ tipo: "ENTRADA", valor });
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
      await desplazar("avanzar", n, 1);
    },

    async retroceder(n) {
      await desplazar("retroceder", n, -1);
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
