// conceptosPagina.js
// Página estática del glosario (conceptos.html): las mismas entradas y dibujos
// que el botón "Conceptos" del juego (ui/conceptos.js), a página completa. No
// necesita sesión. El contenido es texto fijo del proyecto, no datos de usuarios.

import { GLOSARIO, VISUALES } from "./ui/conceptos.js";
import { escaparHtml } from "./util.js";

document.getElementById("indice").innerHTML = GLOSARIO.map((g) => `<a href="#${g.id}">${escaparHtml(g.titulo)}</a>`).join("");

document.getElementById("entradas").innerHTML = GLOSARIO.map(
  (g) => `<article class="concepto-tarjeta" id="${g.id}">
    <h2>${escaparHtml(g.titulo)}</h2>
    <div class="teoria-visual">${VISUALES[g.visual]}</div>
    <p>${escaparHtml(g.resumen)}</p>
    <pre class="teoria-codigo"><code>${escaparHtml(g.ejemplo)}</code></pre>
  </article>`
).join("");
