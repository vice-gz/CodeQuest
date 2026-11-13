// mundosInfo.js
// Datos de presentación de los 5 mundos de CodeQuest (mapa y landing).
// El contenido jugable (niveles) sale de levels/; aquí solo hay texto.

export const MUNDOS_INFO = [
  {
    id: 1,
    nombre: "Fundamentos y Datos",
    lugar: "Laboratorio y pueblo",
    resumen: "Robot1 despierta, aprende sus primeras instrucciones y sale al pueblo a resolver problemas reales con datos: una alcancía, un semáforo, una receta, un pozo…",
    aprenderas: ["Instrucciones, print() y errores", "Variables, reasignación (+=) e input()", "Operadores, // y %, int() y round()", "Primeras decisiones (if, and, or) y el ciclo while"],
  },
  {
    id: 2,
    nombre: "Lógica",
    lugar: "Sala de Estrategia",
    resumen: "Una mesa de cartas holográfica enseña a decidir: if, elif, else y combinar preguntas.",
    aprenderas: ["if / elif / else", "Comparadores", "and, or y not"],
  },
  {
    id: 3,
    nombre: "Automatización",
    lugar: "Complejo industrial",
    resumen: "Un elevador que debe repetirse solo: aprende a automatizar con while y for.",
    aprenderas: ["Ciclo while", "Ciclo for con range()", "Contadores"],
  },
  {
    id: 4,
    nombre: "Modularidad",
    lugar: "Fábrica de robots",
    resumen: "En la fábrica se construyen máquinas que hacen tareas repetitivas: aprende a crear tus propias funciones.",
    aprenderas: ["Definir y llamar funciones con def", "Parámetros y return", "Variables locales, encadenar y depurar", "Jefe: El Gran Ensamblaje"],
  },
  {
    id: 5,
    nombre: "Proyecto",
    lugar: "Laboratorio de creación",
    resumen: "Planos holográficos y herramientas para construir tu propia solución de principio a fin.",
    aprenderas: ["Máquina expendedora y validador de contraseñas", "Juego de adivinanza con ciclos", "Tu proyecto libre final"],
  },
];

export const MUNDO_INFO_POR_ID = Object.fromEntries(MUNDOS_INFO.map((m) => [m.id, m]));
