// erroresCatalogo.js
// Nombres legibles de los códigos de error de CQL (ver interpreter/errors.js)
// para mostrarlos en perfil y panel de admin.

export const NOMBRES_ERROR = {
  LEX_001: "Carácter no reconocido",
  LEX_002: "Texto sin cerrar",
  SYN_001: "Falta paréntesis de cierre",
  SYN_002: "Falta paréntesis de apertura",
  SYN_003: "Se esperaba = en la asignación",
  SYN_004: "Instrucción incompleta",
  SYN_005: "Falta el valor tras =",
  SEM_001: "Variable que no existe",
  SEM_002: "Método de Robot1 que no existe",
  SEM_003: "Función que no existe",
  SEM_004: "Se esperaba un número",
  SEM_005: "print() sin valor",
  SEM_006: "División entre cero",
  SEM_007: "Instrucción no permitida en este nivel",
  SEM_008: "Uso incorrecto de valores",
  SEM_009: "Se usó algo que no devuelve valor",
  RUN_001: "Robot1 salió del laboratorio",
  RUN_002: "Robot1 no llegó al objetivo",
  RUN_003: "Robot1 chocó con un obstáculo",
  RUN_004: "Sin valores de entrada",
  ERR_INESPERADO: "Error interno inesperado",
};

export function nombreError(codigo) {
  return NOMBRES_ERROR[codigo] ? `${codigo} · ${NOMBRES_ERROR[codigo]}` : String(codigo);
}
