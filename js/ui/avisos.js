// avisos.js
// Notificaciones (toasts) y diálogos de confirmación sin librerías.
// Todo el texto se inserta con textContent: no hay riesgo de XSS.

function contenedorToasts() {
  let c = document.getElementById("toasts");
  if (!c) {
    c = document.createElement("div");
    c.id = "toasts";
    c.className = "toasts";
    c.setAttribute("aria-live", "polite");
    document.body.appendChild(c);
  }
  return c;
}

export function notificar(mensaje, tipo = "exito", duracionMs = 4000) {
  const t = document.createElement("div");
  t.className = `toast toast-${tipo}`;
  t.textContent = mensaje;
  contenedorToasts().appendChild(t);
  setTimeout(() => t.remove(), duracionMs);
}

/**
 * Diálogo de confirmación.
 * @param {object} o
 * @param {string} o.titulo
 * @param {string[]} [o.lineas]         texto plano, una línea por elemento
 * @param {string[]} [o.consecuencias]  lista con viñetas
 * @param {string} [o.palabraClave]     si existe, hay que escribirla exacta
 * @param {string} [o.etiquetaOk]
 * @param {boolean} [o.peligro]
 * @returns {Promise<boolean>}
 */
export function confirmar({
  titulo,
  lineas = [],
  consecuencias = [],
  palabraClave = null,
  etiquetaOk = "Confirmar",
  peligro = false,
}) {
  return new Promise((resolve) => {
    const fondo = document.createElement("div");
    fondo.className = "modal-fondo";
    const caja = document.createElement("div");
    caja.className = "modal";
    caja.setAttribute("role", "dialog");
    caja.setAttribute("aria-modal", "true");

    const h = document.createElement("h2");
    h.textContent = titulo;
    caja.appendChild(h);

    lineas.forEach((l) => {
      const p = document.createElement("p");
      p.textContent = l;
      caja.appendChild(p);
    });

    if (consecuencias.length) {
      const ul = document.createElement("ul");
      consecuencias.forEach((c) => {
        const li = document.createElement("li");
        li.textContent = c;
        ul.appendChild(li);
      });
      caja.appendChild(ul);
    }

    let entrada = null;
    if (palabraClave) {
      const etiqueta = document.createElement("label");
      etiqueta.className = "modal-etiqueta";
      etiqueta.textContent = `Escribe "${palabraClave}" para confirmar:`;
      entrada = document.createElement("input");
      entrada.type = "text";
      entrada.className = "campo";
      entrada.autocomplete = "off";
      etiqueta.appendChild(entrada);
      caja.appendChild(etiqueta);
    }

    const acciones = document.createElement("div");
    acciones.className = "modal-acciones";
    const cancelar = document.createElement("button");
    cancelar.type = "button";
    cancelar.className = "boton boton-secundario";
    cancelar.textContent = "Cancelar";
    const ok = document.createElement("button");
    ok.type = "button";
    ok.className = `boton ${peligro ? "boton-peligro" : "boton-primario"}`;
    ok.textContent = etiquetaOk;
    ok.disabled = Boolean(palabraClave);
    acciones.append(cancelar, ok);
    caja.appendChild(acciones);

    fondo.appendChild(caja);
    document.body.appendChild(fondo);

    const cerrar = (resultado) => {
      document.removeEventListener("keydown", alTeclear);
      fondo.remove();
      resolve(resultado);
    };
    const alTeclear = (e) => {
      if (e.key === "Escape") cerrar(false);
    };
    document.addEventListener("keydown", alTeclear);

    if (entrada) {
      // Solo se habilita con la palabra exacta (mayúsculas incluidas).
      entrada.addEventListener("input", () => {
        ok.disabled = entrada.value !== palabraClave;
      });
      entrada.focus();
    } else {
      ok.focus();
    }
    cancelar.addEventListener("click", () => cerrar(false));
    fondo.addEventListener("click", (e) => {
      if (e.target === fondo) cerrar(false);
    });
    ok.addEventListener("click", () => {
      if (palabraClave && entrada.value !== palabraClave) return;
      cerrar(true);
    });
  });
}

/**
 * Diálogo con campos de texto. Devuelve { [id]: valor } o null si se cancela.
 * @param {object} o
 * @param {string} o.titulo
 * @param {Array<{id:string, etiqueta:string, placeholder?:string, requerido?:boolean, maxLength?:number, ayuda?:string}>} o.campos
 * @param {string} [o.etiquetaOk]
 */
export function pedirDatos({ titulo, campos, etiquetaOk = "Guardar" }) {
  return new Promise((resolve) => {
    const fondo = document.createElement("div");
    fondo.className = "modal-fondo";
    const caja = document.createElement("form");
    caja.className = "modal";
    caja.setAttribute("role", "dialog");
    caja.setAttribute("aria-modal", "true");
    caja.noValidate = true;

    const h = document.createElement("h2");
    h.textContent = titulo;
    caja.appendChild(h);

    const entradas = {};
    campos.forEach((c) => {
      const etiqueta = document.createElement("label");
      etiqueta.className = "modal-etiqueta";
      etiqueta.textContent = c.etiqueta;
      const input = document.createElement("input");
      input.type = "text";
      input.className = "campo";
      input.autocomplete = "off";
      if (c.placeholder) input.placeholder = c.placeholder;
      if (c.maxLength) input.maxLength = c.maxLength;
      etiqueta.appendChild(input);
      if (c.ayuda) {
        const a = document.createElement("small");
        a.className = "texto-vacio";
        a.textContent = c.ayuda;
        etiqueta.appendChild(a);
      }
      caja.appendChild(etiqueta);
      entradas[c.id] = input;
    });

    const error = document.createElement("p");
    error.className = "mensaje-form mensaje-error oculto";
    caja.appendChild(error);

    const acciones = document.createElement("div");
    acciones.className = "modal-acciones";
    const cancelar = document.createElement("button");
    cancelar.type = "button";
    cancelar.className = "boton boton-secundario";
    cancelar.textContent = "Cancelar";
    const ok = document.createElement("button");
    ok.type = "submit";
    ok.className = "boton boton-primario";
    ok.textContent = etiquetaOk;
    acciones.append(cancelar, ok);
    caja.appendChild(acciones);

    fondo.appendChild(caja);
    document.body.appendChild(fondo);

    const cerrar = (valor) => {
      document.removeEventListener("keydown", alTeclear);
      fondo.remove();
      resolve(valor);
    };
    const alTeclear = (e) => {
      if (e.key === "Escape") cerrar(null);
    };
    document.addEventListener("keydown", alTeclear);

    caja.addEventListener("submit", (e) => {
      e.preventDefault();
      const valores = {};
      for (const c of campos) {
        valores[c.id] = entradas[c.id].value.trim();
        if (c.requerido && !valores[c.id]) {
          error.textContent = `Completa: ${c.etiqueta}`;
          error.classList.remove("oculto");
          entradas[c.id].focus();
          return;
        }
      }
      cerrar(valores);
    });
    cancelar.addEventListener("click", () => cerrar(null));
    fondo.addEventListener("click", (e) => {
      if (e.target === fondo) cerrar(null);
    });
    entradas[campos[0].id].focus();
  });
}
