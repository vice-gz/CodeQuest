// demoMode.js
// Modo demo para revisar el juego sin jugarlo entero.
//
// AVISO: esto NO es un sistema de autenticación. Las credenciales están
// escritas en el código del navegador y cualquiera puede leerlas; solo
// sirve para que el docente o el equipo abran cualquier nivel al probar.
// Cuando exista backend (Documento 2, §8), el login real vivirá allí.

const CLAVE = "codequest:modo-demo";
const USUARIO = "admin";
const PASSWORD = "123";

export const ModoDemo = {
  activo() {
    try {
      return sessionStorage.getItem(CLAVE) === "1";
    } catch {
      return false;
    }
  },

  activar() {
    try {
      sessionStorage.setItem(CLAVE, "1");
    } catch {
      /* sin sessionStorage el modo dura solo lo que dure la página */
    }
  },

  desactivar() {
    try {
      sessionStorage.removeItem(CLAVE);
    } catch {
      /* ignorado */
    }
  },

  credencialesValidas(usuario, password) {
    return usuario === USUARIO && password === PASSWORD;
  },
};

/**
 * Muestra el diálogo de acceso al modo demo.
 * @param {() => void} alActivar - se llama si las credenciales son correctas
 */
export function abrirDialogoDemo(alActivar) {
  const previo = document.querySelector(".demo-overlay");
  if (previo) previo.remove();

  const overlay = document.createElement("div");
  overlay.className = "demo-overlay";
  overlay.innerHTML = `
    <div class="demo-tarjeta" role="dialog" aria-label="Modo demo">
      <h2>Modo demo</h2>
      <p class="demo-nota">Desbloquea todos los niveles para revisarlos, sin borrar tu progreso.</p>
      <label class="demo-campo">
        <span>Usuario</span>
        <input type="text" class="demo-usuario" autocomplete="off" />
      </label>
      <label class="demo-campo">
        <span>Contraseña</span>
        <input type="password" class="demo-password" autocomplete="off" />
      </label>
      <p class="demo-error" hidden>Usuario o contraseña incorrectos.</p>
      <div class="demo-botones">
        <button type="button" class="boton boton-secundario demo-cancelar">Cancelar</button>
        <button type="button" class="boton boton-primario demo-entrar">Entrar</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  const usuario = overlay.querySelector(".demo-usuario");
  const password = overlay.querySelector(".demo-password");
  const error = overlay.querySelector(".demo-error");
  usuario.focus();

  const cerrar = () => overlay.remove();

  const intentar = () => {
    if (ModoDemo.credencialesValidas(usuario.value.trim(), password.value)) {
      ModoDemo.activar();
      cerrar();
      alActivar();
    } else {
      error.hidden = false;
      password.value = "";
      password.focus();
    }
  };

  overlay.querySelector(".demo-entrar").addEventListener("click", intentar);
  overlay.querySelector(".demo-cancelar").addEventListener("click", cerrar);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) cerrar();
  });
  [usuario, password].forEach((campo) => {
    campo.addEventListener("keydown", (e) => {
      error.hidden = true;
      if (e.key === "Enter") intentar();
      if (e.key === "Escape") cerrar();
    });
  });
}
