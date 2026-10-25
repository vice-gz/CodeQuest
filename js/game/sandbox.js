// sandbox.js
// Configuración del "Laboratorio Libre": un nivel sintético de una sola fase
// (LIBRE) en una cuadrícula de 10×10 sin objetivos ni obstáculos, con TODAS
// las instrucciones del Avance 2 desbloqueadas y sin validación. juego.js lo
// usa con ?modo=sandbox junto con un repositorio que no guarda nada.
//
// Nota: la especificación lista instruccionesPermitidas = ["print", "entrada"];
// aquí se añade "asignacion" para que también se puedan usar variables
// (Mundo 2), que es parte de "todas las del Avance 2".

export const INSTRUCCIONES_SANDBOX = ["print", "entrada", "asignacion"];
export const METODOS_SANDBOX = [
  "avanzar",
  "retroceder",
  "girar",
  "hablar",
  "recoger",
  "soltar",
  "mirar",
  "posicion",
  "energia",
];

export const NIVEL_SANDBOX = {
  id: 0,
  mundo: 0,
  nombre: "Laboratorio Libre",
  concepto: "práctica libre",
  concepto_evaluado: "laboratorio_libre",
  narrativa:
    "Un laboratorio vacío solo para ti. Prueba lo que quieras: aquí no hay metas, estrellas ni errores que cuenten.",
  escenario: {
    tipo: "laboratorio",
    ancho: 10,
    alto: 10,
    robotPosicion: [0, 0],
    robotDireccion: "este",
  },
  fases: [
    {
      id: "L.1",
      tipo: "LIBRE",
      titulo: "Experimenta con Robot1",
      enunciado:
        "Escribe cualquier programa y presiona ▶ Ejecutar. Puedes mover a Robot1 por la cuadrícula de 10×10, usar variables, pedir datos con entrada() y mostrar resultados con print(). Nada de esto se guarda.",
      codigoInicial: "",
      instruccionesPermitidas: INSTRUCCIONES_SANDBOX,
      metodosPermitidos: METODOS_SANDBOX,
      validacion: null,
      pistas: [],
      entradaTipo: "libre",
    },
  ],
};
