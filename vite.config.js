// vite.config.js
// Sitio de varias páginas (landing, juego, perfil, admin). Vite lee las
// variables VITE_* de .env y las expone como import.meta.env.
import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

const pagina = (archivo) => fileURLToPath(new URL(archivo, import.meta.url));

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        index: pagina("./index.html"),
        juego: pagina("./juego.html"),
        perfil: pagina("./perfil.html"),
        auth: pagina("./auth.html"),
        profesor: pagina("./profesor.html"),
        admin: pagina("./admin.html"),
      },
    },
  },
});
