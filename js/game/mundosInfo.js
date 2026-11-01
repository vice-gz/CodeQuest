// mundosInfo.js
// Datos de presentación de los 6 mundos de CodeQuest (mapa y landing).
// El contenido jugable (niveles) sale de levels/; aquí solo hay texto.
// Los mundos 5 y 6 aún no tienen niveles: se muestran como "Próximamente".

export const MUNDOS_INFO = [
  {
    id: 1,
    nombre: "Despertar",
    lugar: "Laboratorio tecnológico",
    resumen: "Robot1 despierta y aprende sus primeras instrucciones: avanzar, hablar, girar y recoger.",
    aprenderas: ["Instrucciones y orden", "Salida con print()", "Errores y cómo leerlos"],
  },
  {
    id: 2,
    nombre: "Memoria",
    lugar: "Centro de Recuperación de datos",
    resumen: "Robot1 perdió la memoria. Recupera módulos guardando datos en variables y calculando con ellos.",
    aprenderas: ["Variables y tipos de dato", "Operadores + - * / %", "Entrada con entrada()"],
  },
  {
    id: 3,
    nombre: "Lógica",
    lugar: "Sala de Estrategia",
    resumen: "Una mesa de cartas holográfica enseña a decidir: if, elif, else y combinar preguntas.",
    aprenderas: ["if / elif / else", "Comparadores", "and, or y not"],
  },
  {
    id: 4,
    nombre: "Automatización",
    lugar: "Complejo industrial",
    resumen: "Un elevador que debe repetirse solo: aprende a automatizar con while y for.",
    aprenderas: ["Ciclo while", "Ciclo for con range()", "Contadores"],
  },
  {
    id: 5,
    nombre: "Programador",
    lugar: "Taller de diagnóstico",
    resumen: "Sistemas averiados, terminales y errores visuales: aprende a depurar como un programador.",
    aprenderas: ["Depuración", "Leer errores", "Probar programas"],
  },
  {
    id: 6,
    nombre: "Proyecto",
    lugar: "Laboratorio de creación",
    resumen: "Planos holográficos y herramientas para construir tu propia solución de principio a fin.",
    aprenderas: ["Diseñar una solución", "Combinar todo lo aprendido", "Tu proyecto final"],
  },
];

export const MUNDO_INFO_POR_ID = Object.fromEntries(MUNDOS_INFO.map((m) => [m.id, m]));
