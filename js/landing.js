// landing.js
// Página de inicio: solo contenido (mundos y año del pie). El acceso
// (login / registro) vive en auth.html.

import { escaparHtml } from "./util.js";

// Mundos 1 y 2 están activos; del 3 al 6 solo se anuncian.
const MUNDOS = [
  { id: 1, nombre: "Despertar", activo: true, texto: "Tus primeros programas: Robot1 despierta, habla y se mueve. Aprendes qué es una instrucción y una salida." },
  { id: 2, nombre: "Memoria", activo: true, texto: "Robot1 aprende a recordar: variables, valores y operaciones para calcular el camino." },
  { id: 3, nombre: "Próximamente", activo: false, texto: "Este mundo llegará en un próximo avance." },
  { id: 4, nombre: "Próximamente", activo: false, texto: "Este mundo llegará en un próximo avance." },
  { id: 5, nombre: "Próximamente", activo: false, texto: "Este mundo llegará en un próximo avance." },
  { id: 6, nombre: "Próximamente", activo: false, texto: "Este mundo llegará en un próximo avance." },
];

document.getElementById("anio").textContent = String(new Date().getFullYear());
document.getElementById("rejilla-mundos").innerHTML = MUNDOS.map(
  (m) => `
  <article class="mundo-tarjeta ${m.activo ? "mundo-activo" : "mundo-bloqueado"}">
    <span class="mundo-numero">Mundo ${m.id}</span>
    <h3>${escaparHtml(m.nombre)}</h3>
    <p>${escaparHtml(m.texto)}</p>
    <span class="etiqueta-estado ${m.activo ? "etiqueta-ok" : ""}">${m.activo ? "Disponible" : "Próximamente"}</span>
  </article>`
).join("");
