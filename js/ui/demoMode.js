// demoMode.js
// Modo demo: SOLO para administradores. Se activa abriendo juego.html?demo=true
// con una sesión de admin/super_root (lo decide juego.js, no este módulo).
// En demo todos los niveles quedan desbloqueados y el progreso se guarda en
// localStorage, sin tocar la base de datos real.
//
// (Se eliminó el antiguo diálogo con usuario/contraseña escritos en el código:
// cualquiera podía leerlos en el navegador.)

let activo = false;

export const ModoDemo = {
  activo: () => activo,
  activar() {
    activo = true;
  },
  desactivar() {
    activo = false;
  },
};
