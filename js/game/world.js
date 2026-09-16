// world.js
// Escenario 2D del laboratorio: cuadrícula, límites, objetivos (uno o
// varios), obstáculos, objetos recolectables y recargas de energía.

export class World {
  constructor(escenario = {}) {
    this.tipo = escenario.tipo || "laboratorio";
    this.ancho = escenario.ancho ?? 6;
    this.alto = escenario.alto ?? 1;

    // Un nivel puede declarar un objetivo único (objetivoPosicion) o varios
    // (objetivosPosicion). Internamente siempre se maneja como lista.
    if (Array.isArray(escenario.objetivosPosicion)) {
      this.objetivos = escenario.objetivosPosicion.map((p) => [...p]);
    } else if (escenario.objetivoPosicion) {
      this.objetivos = [[...escenario.objetivoPosicion]];
    } else {
      this.objetivos = [];
    }

    this.obstaculos = (escenario.obstaculos || []).map((o) => [...o]);
    this.objetosIniciales = escenario.objetos || [];
    this.recargasIniciales = escenario.recargas || [];
    this.reiniciar();
  }

  reiniciar() {
    this.objetos = this.objetosIniciales.map((o) => ({ ...o, posicion: [...o.posicion] }));
    this.recargas = this.recargasIniciales.map((r) => ({ ...r, posicion: [...r.posicion] }));
  }

  // Compatibilidad: el objetivo "principal" es el primero declarado.
  get objetivoPosicion() {
    return this.objetivos[0] || null;
  }

  dentroDeLimites(x, y) {
    return x >= 0 && x < this.ancho && y >= 0 && y < this.alto;
  }

  hayObstaculoEn(x, y) {
    return this.obstaculos.some((o) => o[0] === x && o[1] === y);
  }

  esObjetivo(x, y) {
    return this.objetivos.some((o) => o[0] === x && o[1] === y);
  }

  enObjetivo(x, y) {
    return this.esObjetivo(x, y);
  }

  objetoEn(x, y) {
    return this.objetos.find((o) => o.posicion[0] === x && o.posicion[1] === y);
  }

  quitarObjetoEn(x, y) {
    const objeto = this.objetoEn(x, y);
    if (objeto) {
      this.objetos = this.objetos.filter((o) => o !== objeto);
    }
    return objeto;
  }

  consumirRecargaEn(x, y) {
    const recarga = this.recargas.find((r) => r.posicion[0] === x && r.posicion[1] === y);
    if (!recarga) return null;
    this.recargas = this.recargas.filter((r) => r !== recarga);
    return recarga;
  }
}
