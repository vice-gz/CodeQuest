// bibliotecas.js
// Qué objetos y métodos existen en cada mundo. El validador usa la biblioteca
// del escenario para decir "este método no existe / no devuelve valor / necesita
// un número" con el nombre correcto (robot1.avanzar, elevador.subir...).
//   numerico: el primer argumento debe ser un número
//   retorna:  el método devuelve un valor y se puede usar dentro de una expresión

export const BIBLIOTECA_ROBOT = {
  objeto: "robot1",
  nombreParaMensajes: "Robot1",
  metodos: {
    hablar: {},
    avanzar: { numerico: true },
    retroceder: { numerico: true },
    girar: {},
    mirar: { retorna: true },
    posicion: { retorna: true },
    energia: { retorna: true },
    recoger: {},
    soltar: {},
  },
};

export const BIBLIOTECA_ELEVADOR = {
  objeto: "elevador",
  nombreParaMensajes: "El elevador",
  metodos: {
    subir: { numerico: true },
    bajar: { numerico: true },
    recoger: {},
    soltar: {},
    piso: { retorna: true },
    hayPasajero: { retorna: true },
    llevando: { retorna: true },
  },
};

// Mundo 3 (Cartas): la mesa permite poner y voltear cartas (las nuevas cartas son
// visuales: no cambian las variables carta1..., total).
export const BIBLIOTECA_MESA = {
  objeto: "mesa",
  nombreParaMensajes: "La mesa",
  metodos: {
    poner_carta: { numerico: true },
    voltear: {},
  },
};

// Mundo 2 (Datos): no hay objetos con métodos.
export const BIBLIOTECA_SIN_OBJETOS = {
  objeto: null,
  nombreParaMensajes: "",
  metodos: {},
};
