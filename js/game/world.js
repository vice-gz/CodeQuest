// world.js
// Escenario 2D del laboratorio: cuadrícula, límites, objetivo, obstáculos
// y objetos recolectables (Documento 1, sección 4; prompt de cambios,
// sección 6 — robot1.recoger()/soltar()).

export class World {
  constructor(escenario = {}) {
    this.tipo = escenario.tipo || "laboratorio";
    this.ancho = escenario.ancho ?? 6;
    this.alto = escenario.alto ?? 1;
    this.objetivoPosicion = escenario.objetivoPosicion ?? null;
    this.obstaculos = escenario.obstaculos || [];
    // objetos: [{ posicion: [x,y], tipo: "llave" }]
    this.objetosIniciales = escenario.objetos || [];
    this.objetos = this.objetosIniciales.map((o) => ({ ...o }));
  }

  reiniciar() {
    this.objetos = this.objetosIniciales.map((o) => ({ ...o }));
  }

  dentroDeLimites(x, y) {
    return x >= 0 && x < this.ancho && y >= 0 && y < this.alto;
  }

  hayObstaculoEn(x, y) {
    return this.obstaculos.some((o) => o[0] === x && o[1] === y);
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

  enObjetivo(x, y) {
    if (!this.objetivoPosicion) return false;
    return x === this.objetivoPosicion[0] && y === this.objetivoPosicion[1];
  }
}
