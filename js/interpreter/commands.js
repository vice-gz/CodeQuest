// commands.js
// Comandos atómicos que el intérprete emite (Documento 3, sección 4.3),
// ampliados para el rediseño del robot: GIRAR reemplaza a
// GIRAR_DERECHA/GIRAR_IZQUIERDA, se agregan ENTRADA, RECOGER y SOLTAR.
// SALUDAR fue eliminado (no aporta valor pedagógico).

export const TipoComando = {
  PRINT: "PRINT",
  ENTRADA: "ENTRADA",
  HABLAR: "HABLAR",
  AVANZAR: "AVANZAR",
  RETROCEDER: "RETROCEDER",
  GIRAR: "GIRAR",
  RECOGER: "RECOGER",
  SOLTAR: "SOLTAR",
};

export const Comandos = {
  print: (valor) => ({ tipo: TipoComando.PRINT, valor }),
  entrada: (valor) => ({ tipo: TipoComando.ENTRADA, valor }),
  hablar: (texto) => ({ tipo: TipoComando.HABLAR, texto }),
  avanzar: (n) => ({ tipo: TipoComando.AVANZAR, n }),
  retroceder: (n) => ({ tipo: TipoComando.RETROCEDER, n }),
  girar: (direccion) => ({ tipo: TipoComando.GIRAR, direccion }),
  recoger: () => ({ tipo: TipoComando.RECOGER }),
  soltar: () => ({ tipo: TipoComando.SOLTAR }),
};
