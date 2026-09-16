// robot1.js
// Lógica visual de Robot1: posición 2D, dirección cardinal, energía e
// inventario simple (Documento 2, sección 5.3; prompt de cambios, sección 6).

import { vectorDireccion, normalizarDireccion } from "./movimiento.js";

export class Robot1 {
  constructor({
    posicion = [0, 0],
    direccion = "este",
    energiaInicial = 100,
    energiaMaxima = null,
    costoEnergiaPorCasilla = 1,
  } = {}) {
    this.posicionInicial = [...posicion];
    this.direccionInicial = normalizarDireccion(direccion);
    this.energiaInicial = energiaInicial;
    // Tope al recargar. Por defecto es la energía inicial, pero un nivel
    // puede declarar un máximo mayor para que las recargas sumen de verdad.
    this.energiaMaxima = energiaMaxima ?? energiaInicial;
    this.costoEnergiaPorCasilla = costoEnergiaPorCasilla;
    this.reiniciar();
  }

  reiniciar() {
    this.x = this.posicionInicial[0];
    this.y = this.posicionInicial[1];
    this.direccion = this.direccionInicial;
    this.energia = this.energiaInicial;
    this.inventario = [];
    this.objetivosAlcanzados = [];
    this.mensaje = null; // burbuja de diálogo activa
  }

  posicion() {
    return [this.x, this.y];
  }

  avanzar(n) {
    const [vx, vy] = vectorDireccion(this.direccion);
    this.x += vx * n;
    this.y += vy * n;
    this.gastarEnergia(n);
  }

  retroceder(n) {
    const [vx, vy] = vectorDireccion(this.direccion);
    this.x -= vx * n;
    this.y -= vy * n;
    this.gastarEnergia(n);
  }

  girar(direccion) {
    this.direccion = normalizarDireccion(direccion);
  }

  recargar(cantidad) {
    this.energia = Math.min(this.energiaMaxima, this.energia + cantidad);
  }

  marcarObjetivo(posicion) {
    const clave = `${posicion[0]},${posicion[1]}`;
    if (!this.objetivosAlcanzados.includes(clave)) {
      this.objetivosAlcanzados.push(clave);
    }
  }

  gastarEnergia(pasos) {
    this.energia = Math.max(0, this.energia - pasos * this.costoEnergiaPorCasilla);
  }

  hablar(texto) {
    this.mensaje = texto;
  }

  recoger(tipoObjeto) {
    if (tipoObjeto) this.inventario.push(tipoObjeto);
  }

  soltar() {
    return this.inventario.pop();
  }
}
