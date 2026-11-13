// test_inicio.mjs — navegación dinámica de la página de inicio (index.html):
// sin sesión «Iniciar sesión»; con sesión «Hola, nombre» + menú (Mi perfil · Jugar · Cerrar sesión).
// Usa el index.html real en jsdom y una sesión de mentira inyectada en js/ui/menuUsuario.js.
// Uso: node test_inicio.mjs

import assert from "node:assert/strict";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";
import { JSDOM } from "jsdom";
import { build } from "esbuild";

const raiz = path.dirname(fileURLToPath(import.meta.url));
const HTML = readFileSync(path.join(raiz, "index.html"), "utf8").replace(/<script[^>]*src="js\/landing.js"[^>]*><\/script>/, "");
const salida = await build({
  entryPoints: [path.join(raiz, "js/ui/menuUsuario.js")],
  bundle: true, write: false, format: "iife", globalName: "Menu", platform: "browser", logLevel: "silent",
});
const BUNDLE = salida.outputFiles[0].text;

let n = 0;
const prueba = async (nombre, fn) => {
  await fn();
  n++;
  console.log(`  ✓ ${nombre}`);
};

async function abrir({ sesion = null, perfil = null, falla = false } = {}) {
  const dom = new JSDOM(HTML, { url: "http://localhost/index.html", runScripts: "outside-only", pretendToBeVisual: true });
  const w = dom.window;
  w.eval(BUNDLE);
  const cierres = [];
  const estado = await w.Menu.iniciarNavInicio({
    obtenerSesion: async () => {
      if (falla) throw new Error("sin red");
      return sesion;
    },
    obtenerPerfil: async () => perfil,
    cerrarSesion: async () => {
      cierres.push(1);
    },
    documento: w.document,
  });
  const $ = (id) => w.document.getElementById(id);
  const visible = (el) => !el.hidden && !el.closest("[hidden]");
  return { w, $, estado, cierres, visible, doc: w.document };
}

console.log("Inicio: sin sesión");
await prueba("SIN sesión: se ve «Iniciar sesión» y no el saludo", async () => {
  const p = await abrir();
  assert.equal(p.estado, "invitado");
  assert.equal(p.$("nav-auth").dataset.estado, "invitado");
  const entrar = p.doc.querySelector('.nav-auth [data-auth="invitado"]');
  assert.ok(entrar && p.visible(entrar) && /Iniciar sesión/.test(entrar.textContent));
  assert.equal(entrar.getAttribute("href"), "auth.html");
  assert.ok(!p.visible(p.doc.querySelector(".menu-usuario")));
  // los botones del cuerpo también están como siempre
  const invitados = [...p.doc.querySelectorAll('main [data-auth="invitado"]')];
  assert.equal(invitados.length, 4);
  assert.ok(invitados.every(p.visible));
  assert.ok([...p.doc.querySelectorAll('main [data-auth="sesion"]')].every((e) => !p.visible(e)));
});
await prueba("si la sesión no se puede leer (error de red) se muestra el estado de invitado", async () => {
  const p = await abrir({ falla: true });
  assert.equal(p.estado, "invitado");
  assert.ok(p.visible(p.doc.querySelector('.nav-auth [data-auth="invitado"]')));
});

console.log("Inicio: con sesión");
const SESION = { user: { id: "u1", email: "ana.perez@escuela.mx", user_metadata: { full_name: "Ana Pérez (Google)" } } };
await prueba("CON sesión: se oculta «Iniciar sesión» y aparece «Hola, <nombre del perfil>»", async () => {
  const p = await abrir({ sesion: SESION, perfil: { nombre: "Ana Pérez" } });
  assert.equal(p.estado, "sesion");
  assert.equal(p.$("nav-auth").dataset.estado, "sesion");
  assert.ok(!p.visible(p.doc.querySelector('.nav-auth [data-auth="invitado"]')), "«Iniciar sesión» oculto");
  assert.ok(p.visible(p.doc.querySelector(".menu-usuario")));
  assert.match(p.doc.querySelector(".menu-usuario-saludo").textContent.replace(/\s+/g, " "), /Hola, Ana Pérez/);
  assert.equal(p.$("menu-usuario-avatar").textContent, "A");
  // los botones de registro del cuerpo se reemplazan por «Continuar jugando»
  assert.ok([...p.doc.querySelectorAll('main [data-auth="invitado"]')].every((e) => !p.visible(e)));
  const seguir = [...p.doc.querySelectorAll('main [data-auth="sesion"]')];
  assert.equal(seguir.length, 2);
  assert.ok(seguir.every((e) => p.visible(e) && e.getAttribute("href") === "mundos.html"));
});
await prueba("el nombre cae a los datos de la cuenta (Google/GitHub) o al correo si no hay perfil", async () => {
  assert.match((await abrir({ sesion: SESION })).doc.querySelector(".menu-usuario-saludo").textContent, /Hola, Ana Pérez \(Google\)/);
  const soloCorreo = await abrir({ sesion: { user: { id: "u2", email: "luis@x.mx", user_metadata: {} } } });
  assert.match(soloCorreo.doc.querySelector(".menu-usuario-saludo").textContent, /Hola, luis/);
  const nada = await abrir({ sesion: { user: { id: "u3" } } });
  assert.match(nada.doc.querySelector(".menu-usuario-saludo").textContent, /Hola, jugador/);
  // un nombre con HTML se muestra como texto, nunca como marcado
  const malo = await abrir({ sesion: SESION, perfil: { nombre: "<img src=x onerror=alert(1)>" } });
  assert.equal(malo.doc.querySelector("#menu-usuario-nombre img"), null);
  assert.equal(malo.$("menu-usuario-nombre").textContent, "<img src=x onerror=alert(1)>");
});
await prueba("el menú se abre al hacer clic en el nombre, con Mi perfil · Jugar · Cerrar sesión", async () => {
  const p = await abrir({ sesion: SESION, perfil: { nombre: "Ana" } });
  const boton = p.$("menu-usuario-boton");
  const lista = p.$("menu-usuario-lista");
  assert.ok(lista.hidden);
  assert.equal(boton.getAttribute("aria-expanded"), "false");
  boton.click();
  assert.ok(!lista.hidden);
  assert.equal(boton.getAttribute("aria-expanded"), "true");
  const items = [...lista.querySelectorAll('[role="menuitem"]')];
  assert.deepEqual(items.map((i) => i.textContent.trim()), ["Mi perfil", "Jugar", "Cerrar sesión"]);
  assert.equal(items[0].getAttribute("href"), "perfil.html");
  assert.equal(items[1].getAttribute("href"), "mundos.html");
  boton.click();
  assert.ok(lista.hidden, "otro clic lo cierra");
});
await prueba("el menú se cierra con Escape y al hacer clic fuera", async () => {
  const p = await abrir({ sesion: SESION, perfil: { nombre: "Ana" } });
  const lista = p.$("menu-usuario-lista");
  p.$("menu-usuario-boton").click();
  p.doc.dispatchEvent(new p.w.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  assert.ok(lista.hidden);
  p.$("menu-usuario-boton").click();
  p.doc.querySelector("h1").click();
  assert.ok(lista.hidden);
  p.$("menu-usuario-boton").click();
  lista.querySelector("a").click(); // un clic dentro del menú no lo cierra solo (la navegación lo hace)
  assert.ok(!lista.hidden);
});
await prueba("«Cerrar sesión» ejecuta el cierre de sesión una vez (la página se recarga como invitado)", async () => {
  const p = await abrir({ sesion: SESION, perfil: { nombre: "Ana" } });
  p.$("menu-usuario-boton").click();
  p.$("menu-usuario-salir").click();
  p.$("menu-usuario-salir").click(); // un doble clic no cierra dos veces
  await new Promise((r) => setTimeout(r, 20));
  assert.equal(p.cierres.length, 1);
});

console.log(`\n${n} pruebas correctas.`);
process.exit(0);
