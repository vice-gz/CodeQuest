// test_auth_oauth.mjs — acceso con Google y GitHub (OAuth).
//  1) funciones puras de js/oauthUtil.js
//  2) la página auth.html REAL (js/authPage.js + js/auth.js) en jsdom, con un Supabase simulado:
//     botones, llamada a signInWithOAuth, vuelta del proveedor con usuario nuevo / existente,
//     rol de profesor elegido en «Crear cuenta», correo institucional, errores del proveedor.
// Uso: node test_auth_oauth.mjs

import assert from "node:assert/strict";
import { readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { build } from "esbuild";
import { JSDOM, VirtualConsole } from "jsdom";
import { nombreDesdeProveedor, esUsuarioNuevo, esNombreGenerico, leerParametrosOAuth, hayRetornoOAuth, mensajeErrorOAuth, necesitaCompletarRegistro, PROVEEDORES } from "./js/oauthUtil.js";

const RAIZ = dirname(fileURLToPath(import.meta.url));
// Los objetos creados dentro de jsdom son de otro "mundo" de JavaScript: se comparan como datos planos.
const plano = (x) => JSON.parse(JSON.stringify(x));
let n = 0;
const prueba = async (nombre, fn) => {
  await fn();
  n++;
  console.log(`  ✓ ${nombre}`);
};

// ============================================================== 1) funciones puras
console.log("Funciones puras");
await prueba("el nombre sale del proveedor: Google (full_name), GitHub (name / user_name) o el correo", () => {
  assert.equal(nombreDesdeProveedor({ user_metadata: { full_name: "Ana Pérez" }, email: "a@x.mx" }), "Ana Pérez");
  assert.equal(nombreDesdeProveedor({ user_metadata: { name: "Beto", user_name: "beto99" } }), "Beto");
  assert.equal(nombreDesdeProveedor({ user_metadata: { user_name: "carla-dev" } }), "carla-dev");
  assert.equal(nombreDesdeProveedor({ user_metadata: {}, email: "diego.salas@pachuca.tecnm.mx" }), "diego.salas");
  assert.equal(nombreDesdeProveedor({ user_metadata: {} }), "Estudiante");
  assert.equal(nombreDesdeProveedor({ user_metadata: { full_name: "x".repeat(100) } }).length, 60);
  assert.equal(nombreDesdeProveedor({ user_metadata: { nombre: "Nombre del registro", full_name: "Otro" } }), "Nombre del registro");
});
await prueba("cuenta nueva = creada y con primer ingreso casi al mismo tiempo", () => {
  const ahora = Date.parse("2026-11-02T12:00:00Z");
  assert.equal(esUsuarioNuevo({ created_at: "2026-11-02T11:59:58Z", last_sign_in_at: "2026-11-02T11:59:58Z" }, ahora), true);
  assert.equal(esUsuarioNuevo({ created_at: "2026-09-01T10:00:00Z", last_sign_in_at: "2026-11-02T11:59:58Z" }, ahora), false);
  assert.equal(esUsuarioNuevo({ created_at: "2026-11-02T11:59:00Z" }, ahora), true);
  assert.equal(esUsuarioNuevo({}, ahora), false);
});
await prueba("nombres genéricos que se pueden reemplazar", () => {
  for (const g of ["", "sin nombre", "Usuario", "  "]) assert.equal(esNombreGenerico(g), true, g);
  assert.equal(esNombreGenerico("Ana"), false);
});
await prueba("se lee lo que deja el proveedor en la URL (hash implícito, ?code= y errores) y se ignora ?error=perfil", () => {
  const leer = (search, hash) => leerParametrosOAuth({ search, hash });
  assert.equal(hayRetornoOAuth(leer("", "#access_token=abc&refresh_token=r&token_type=bearer")), true);
  assert.equal(hayRetornoOAuth(leer("?code=xyz", "")), true);
  assert.equal(hayRetornoOAuth(leer("", "#error=access_denied&error_code=oauth&error_description=denied")), true);
  assert.equal(hayRetornoOAuth(leer("", "#access_token=abc&type=recovery")), false, "el enlace de recuperar contraseña no es OAuth");
  assert.equal(hayRetornoOAuth(leer("?error=perfil", "")), false, "?error=perfil lo pone protegerPagina");
  assert.equal(hayRetornoOAuth(leer("", "")), false);
  assert.equal(leer("?error=server_error&error_description=Algo+fall%C3%B3", "").descripcion, "Algo falló");
});
await prueba("los errores del proveedor se explican en español", () => {
  const m = (o, p = "Google") => mensajeErrorOAuth(o, p);
  assert.match(m({ error: "access_denied" }), /Cancelaste el acceso con Google/);
  assert.match(m({ descripcion: "Error getting user email from external provider" }, "GitHub"), /GitHub no compartió tu correo/);
  assert.match(m({ codigoError: "identity_already_exists" }), /Ya existe una cuenta con ese correo/);
  assert.match(m({ mensaje: "User already registered" }), /Ya existe una cuenta con ese correo/);
  assert.match(m({ mensaje: "Unsupported provider: provider is not enabled" }), /aún no está activado.*Authentication → Providers/);
  assert.match(m({ codigoError: "provider_email_needs_verification" }), /Te enviamos un correo/);
  assert.match(m({ error: "server_error" }), /tuvo un problema/);
  assert.match(m({ mensaje: "Failed to fetch" }), /Revisa tu conexión/);
  assert.match(m({ error: "otra_cosa" }, "GitHub"), /No se pudo completar el acceso con GitHub/);
  assert.equal(PROVEEDORES.google.nombre, "Google");
  assert.ok(PROVEEDORES.github.scopes.includes("user:email"));
});

await prueba("¿se pregunta alumno/profesor? solo a quien entra por primera vez y aún no lo ha dicho", () => {
  const nuevo = { user_metadata: { full_name: "Ana" } };
  const estudiante = { rol: "estudiante" };
  assert.equal(necesitaCompletarRegistro(nuevo, estudiante, { experiencia: 0, nivel_actual: 1 }), true);
  assert.equal(necesitaCompletarRegistro(nuevo, estudiante, null), true);
  assert.equal(necesitaCompletarRegistro({ user_metadata: { cq_registro_completo: true } }, estudiante, null), false, "ya contestó");
  assert.equal(necesitaCompletarRegistro({ user_metadata: { rol_solicitado: "estudiante" } }, estudiante, null), false, "se registró con correo: ya eligió");
  assert.equal(necesitaCompletarRegistro(nuevo, { rol: "profesor" }, null), false);
  assert.equal(necesitaCompletarRegistro(nuevo, { rol: "admin" }, null), false);
  assert.equal(necesitaCompletarRegistro(nuevo, estudiante, { experiencia: 250, nivel_actual: 3 }), false, "ya jugó");
  assert.equal(necesitaCompletarRegistro(nuevo, estudiante, { experiencia: 0, nivel_actual: 4 }), false);
});

// ============================================================== 2) auth.html en jsdom
console.log("Página de acceso (auth.html)");
const STUB_SUPABASE = `export const supabase = globalThis.__supabase; export const configuracionValida = true; export const HOST_SUPABASE = "test";`;
async function empaquetar(dominio) {
  const r = await build({
    entryPoints: [resolve(RAIZ, "js/authPage.js")],
    bundle: true,
    format: "iife",
    platform: "browser",
    write: false,
    logLevel: "silent",
    define: { "import.meta.env.VITE_DOMINIO_INSTITUCIONAL": JSON.stringify(dominio) },
    plugins: [
      {
        name: "stubs",
        setup(b) {
          b.onResolve({ filter: /(^|\/)supabase\.js$/ }, () => ({ path: "supabase", namespace: "stub" }));
          b.onLoad({ filter: /.*/, namespace: "stub" }, () => ({ contents: STUB_SUPABASE, loader: "js", resolveDir: RAIZ }));
          b.onLoad({ filter: /js\/.*\.js$/, namespace: "file" }, (a) => ({
            contents: readFileSync(a.path, "utf8").replace(/window\.location\.href = ([^;]+);/g, "globalThis.__ir($1);"),
            loader: "js",
            resolveDir: dirname(a.path),
          }));
        },
      },
    ],
  });
  return r.outputFiles[0].text;
}
const BUNDLE = await empaquetar("");
const BUNDLE_INSTITUCIONAL = await empaquetar("pachuca.tecnm.mx");
const HTML = readFileSync(resolve(RAIZ, "auth.html"), "utf8").replace(/<script[\s\S]*?<\/script>/g, "").replace(/<link[^>]*>/g, "");

class SupabaseFalso {
  constructor({ usuario = null, perfiles = [], progreso = [], errorOAuth = null, errorInsertPerfil = null, perfilTrasError = false, aplicar = { rol: "estudiante", aplicado: true } } = {}) {
    this.usuario = usuario;
    this.tablas = { perfiles: [...perfiles], progreso_jugador: [...progreso] };
    this.errorOAuth = errorOAuth;
    this.errorInsertPerfil = errorInsertPerfil;
    this.perfilTrasError = perfilTrasError;
    this.aplicar = aplicar;
    this.oauth = [];
    this.insertados = [];
    this.actualizados = [];
    this.metadatos = [];
    this.rpcs = [];
    this.cerroSesion = false;
    const yo = this;
    this.auth = {
      signInWithOAuth: async (o) => (yo.oauth.push(o), { data: {}, error: yo.errorOAuth }),
      getSession: async () => ({ data: { session: yo.usuario && !yo.cerroSesion ? { user: yo.usuario } : null } }),
      getUser: async () => ({ data: { user: yo.usuario }, error: null }),
      signOut: async () => ((yo.cerroSesion = true), { error: null }),
      updateUser: async (p) => (yo.metadatos.push(p), { data: {}, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    };
  }
  from(tabla) {
    const yo = this;
    const q = { filtros: [], op: "select", payload: null };
    const filas = () => yo.tablas[tabla].filter((f) => q.filtros.every(([k, v]) => f[k] === v));
    const api = {
      select: () => api,
      eq: (k, v) => (q.filtros.push([k, v]), api),
      maybeSingle: async () => ({ data: filas()[0] ?? null, error: null }),
      insert: async (fila) => {
        yo.insertados.push({ tabla, fila });
        if (tabla === "perfiles" && yo.errorInsertPerfil) {
          if (yo.perfilTrasError) yo.tablas.perfiles.push({ ...fila, nombre: "sin nombre" }); // el disparador de la BD lo creó justo antes
          return { error: yo.errorInsertPerfil };
        }
        yo.tablas[tabla].push({ ...fila });
        return { error: null };
      },
      update: (cambios) => {
        q.op = "update";
        q.payload = cambios;
        return { eq: async (k, v) => ((yo.actualizados.push({ tabla, cambios, k, v }), yo.tablas[tabla].filter((f) => f[k] === v).forEach((f) => Object.assign(f, cambios))), { error: null }) };
      },
    };
    return api;
  }
  async rpc(nombre) {
    this.rpcs.push(nombre);
    // Como aplicar_registro: si en user_metadata se pidió «profesor», el servidor lo concede (salvo que se simule lo contrario).
    const pedido = this.metadatos.at(-1)?.data?.rol_solicitado;
    if (pedido === "profesor" && this.concederProfesor !== false) {
      this.tablas.perfiles.filter((f) => f.user_id === this.usuario?.id).forEach((f) => (f.rol = "profesor"));
    }
    return { data: this.aplicar, error: null };
  }
}

async function abrir({ url = "auth.html", bd = new SupabaseFalso(), bundle = BUNDLE, proveedor = null }) {
  const errores = [];
  const consola = new VirtualConsole();
  consola.on("jsdomError", (e) => errores.push(e.message));
  const dom = new JSDOM(HTML, { url: `http://localhost/${url}`, runScripts: "outside-only", pretendToBeVisual: true, virtualConsole: consola });
  const w = dom.window;
  const redirecciones = [];
  w.__supabase = bd;
  w.__ir = (u) => redirecciones.push(u);
  w.console.error = () => {};
  if (proveedor) w.sessionStorage.setItem("codequest:oauth-proveedor", proveedor);
  w.eval(bundle);
  const esperar = async (cond, ms = 2500) => {
    const fin = Date.now() + ms;
    while (Date.now() < fin) {
      if (cond()) return true;
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, 15));
    }
    return false;
  };
  const $ = (id) => w.document.getElementById(id);
  return { w, bd, redirecciones, errores, esperar, $, mensaje: () => $("auth-mensaje").textContent.trim() };
}
const usuarioNuevo = (extra = {}) => ({
  id: "u-nuevo",
  email: "ana@pachuca.tecnm.mx",
  created_at: new Date().toISOString(),
  last_sign_in_at: new Date().toISOString(),
  user_metadata: { full_name: "Ana Pérez" },
  ...extra,
});
const usuarioViejo = (extra = {}) => ({
  id: "u-viejo",
  email: "beto@pachuca.tecnm.mx",
  created_at: "2026-08-01T10:00:00Z",
  last_sign_in_at: new Date().toISOString(),
  user_metadata: { full_name: "Beto Ruiz" },
  ...extra,
});

const nuevoSinJugar = (extra = {}) => usuarioNuevo(extra);
const bdNuevo = (opciones = {}) =>
  new SupabaseFalso({ usuario: nuevoSinJugar(), perfiles: [{ user_id: "u-nuevo", nombre: "sin nombre", rol: "estudiante" }], progreso: [{ user_id: "u-nuevo", experiencia: 0, nivel_actual: 1 }], ...opciones });
const visible = (j, id) => !j.$(id).classList.contains("oculto");

await prueba("PANTALLA: Google y GitHub van ARRIBA (antes de las pestañas y de los formularios), solo una vez y con palabras sencillas", async () => {
  const j = await abrir({});
  const doc = j.w.document;
  const botones = [...doc.querySelectorAll(".boton-social")];
  assert.deepEqual(botones.map((b) => b.dataset.proveedor), ["google", "github"]);
  assert.deepEqual(botones.map((b) => b.textContent.replace(/\s+/g, " ").trim()), ["Continuar con Google", "Continuar con GitHub"]);
  assert.ok(botones.every((b) => b.querySelector("svg")), "cada botón lleva su icono");
  assert.ok(botones.every((b) => !b.closest("form")), "están fuera de los formularios de correo");
  const orden = (a, b) => a.compareDocumentPosition(b) & 4; // 4 = «b viene después de a»
  assert.ok(orden(botones[1], j.$("pestana-login")), "los botones van antes que las pestañas");
  assert.ok(orden(botones[1], j.$("panel-login")));
  assert.match(doc.querySelector("h1").textContent, /Entra a CodeQuest/);
  assert.match(doc.querySelector(".auth-separador").textContent, /o con tu correo/);
  assert.deepEqual([j.$("pestana-login").textContent, j.$("pestana-registro").textContent], ["Ya tengo cuenta", "Soy nuevo"]);
  assert.equal(doc.querySelector('input[name="rol-social"]'), null, "ya no hay que elegir el rol antes de entrar");
  j.w.close();
});

await prueba("al pulsar un botón se llama a signInWithOAuth con el proveedor, sus permisos y vuelta a auth.html", async () => {
  const j = await abrir({ url: "sub/carpeta/auth.html" });
  j.w.document.querySelector(".boton-google").click();
  await j.esperar(() => j.bd.oauth.length === 1);
  const o = j.bd.oauth[0];
  assert.equal(o.provider, "google");
  assert.match(o.options.scopes, /email/);
  assert.equal(o.options.redirectTo, "http://localhost/sub/carpeta/auth.html", "respeta la carpeta donde está publicado el sitio");
  assert.equal(j.w.document.querySelector(".boton-github").disabled, true, "los botones se bloquean mientras el navegador se va al proveedor");
  assert.equal(j.w.sessionStorage.getItem("codequest:oauth-proveedor"), "google");
  j.w.close();
  const k = await abrir({});
  k.w.document.querySelector(".boton-github").click();
  await k.esperar(() => k.bd.oauth.length === 1);
  assert.equal(k.bd.oauth[0].provider, "github");
  assert.match(k.bd.oauth[0].options.scopes, /user:email/);
  k.w.close();
});

await prueba("si el proveedor no está activado en Supabase se avisa con un mensaje claro y los botones se pueden volver a usar", async () => {
  const bd = new SupabaseFalso({ errorOAuth: { message: "Unsupported provider: provider is not enabled", code: "validation_failed", status: 400 } });
  const j = await abrir({ bd });
  j.w.document.querySelector(".boton-google").click();
  await j.esperar(() => /aún no/.test(j.mensaje()));
  assert.match(j.mensaje(), /El acceso con Google aún no está activado.*Authentication → Providers/);
  assert.equal(j.w.document.querySelector(".boton-social").disabled, false);
  assert.equal(j.w.sessionStorage.getItem("codequest:oauth-proveedor"), null);
  j.w.close();
});

await prueba("PRIMERA VEZ: al volver aparece «Un último paso» (no se entra todavía) y todavía no se aplica ningún rol", async () => {
  const bd = bdNuevo();
  const j = await abrir({ url: "auth.html#access_token=abc", bd, proveedor: "google" });
  await j.esperar(() => visible(j, "panel-bienvenida"));
  assert.ok(visible(j, "panel-bienvenida"));
  assert.match(j.$("bienvenida-titulo").textContent, /¡Hola, Ana!/, "saluda por su nombre (el de Google)");
  assert.match(j.$("panel-bienvenida").textContent, /Un último paso/);
  assert.ok(!visible(j, "bloque-social") && !visible(j, "panel-login") && !visible(j, "panel-registro"), "se esconde todo lo demás");
  const radios = [...j.w.document.querySelectorAll('input[name="rol-bienvenida"]')];
  assert.deepEqual(radios.map((r) => [r.value, r.checked]), [["estudiante", true], ["profesor", false]], "alumno viene marcado: basta pulsar Continuar");
  assert.equal(j.w.document.querySelectorAll("#panel-bienvenida svg.icono-rol").length, 2, "tarjetas con icono (birrete y pizarrón)");
  assert.ok(visible(j, "campo-codigo-bienvenida"));
  assert.deepEqual(plano(j.redirecciones), []);
  assert.deepEqual(plano(bd.rpcs), [], "no se consume el registro hasta que conteste");
  assert.deepEqual(plano(bd.metadatos), []);
  assert.equal(j.w.location.hash, "", "los tokens se quitan de la barra de direcciones");
  j.w.close();
});

await prueba("ALUMNO: un solo clic en Continuar → queda registrado como alumno y entra al juego", async () => {
  const bd = bdNuevo();
  const j = await abrir({ url: "auth.html#access_token=abc", bd, proveedor: "github" });
  await j.esperar(() => visible(j, "panel-bienvenida"));
  j.$("btn-bienvenida").click();
  await j.esperar(() => j.redirecciones.length > 0);
  assert.deepEqual(plano(bd.metadatos), [{ data: { rol_solicitado: "estudiante", cq_registro_completo: true } }]);
  assert.deepEqual(plano(bd.rpcs), ["aplicar_registro"]);
  assert.deepEqual(plano(j.redirecciones), ["mundos.html"]);
  assert.equal(j.w.localStorage.getItem("codequest:bienvenida-profe"), null);
  assert.equal(bd.tablas.perfiles[0].rol, "estudiante");
  j.w.close();
});

await prueba("ALUMNO con código de clase: se guarda el código y, si no sirve, se avisa sin bloquear la cuenta", async () => {
  const bd = bdNuevo({ aplicar: { rol: "estudiante", aplicado: true, aviso: "Ese código de clase no existe." } });
  const j = await abrir({ url: "auth.html#access_token=abc", bd, proveedor: "google" });
  await j.esperar(() => visible(j, "panel-bienvenida"));
  j.$("bienvenida-codigo").value = "zzz999";
  j.$("btn-bienvenida").click();
  await j.esperar(() => /no pudimos unirte/.test(j.mensaje()));
  assert.deepEqual(plano(bd.metadatos), [{ data: { rol_solicitado: "estudiante", cq_registro_completo: true, codigo_clase: "zzz999" } }]);
  assert.match(j.mensaje(), /Ese código de clase no existe/);
  j.w.close();
});

await prueba("PROFESOR: al elegirlo se oculta el código de clase; el servidor concede el rol; llega a profesor.html con saludo", async () => {
  const bd = bdNuevo();
  const j = await abrir({ url: "auth.html#access_token=abc", bd, proveedor: "google" });
  await j.esperar(() => visible(j, "panel-bienvenida"));
  j.$("bienvenida-codigo").value = "no-aplica";
  j.w.document.querySelector('input[name="rol-bienvenida"][value="profesor"]').click();
  assert.ok(!visible(j, "campo-codigo-bienvenida"), "un profesor no usa código de clase");
  j.$("btn-bienvenida").click();
  await j.esperar(() => j.redirecciones.length > 0);
  assert.deepEqual(plano(bd.metadatos), [{ data: { rol_solicitado: "profesor", cq_registro_completo: true } }]);
  assert.equal(bd.tablas.perfiles[0].rol, "profesor");
  assert.deepEqual(plano(j.redirecciones), ["profesor.html"]);
  assert.equal(j.w.localStorage.getItem("codequest:bienvenida-profe"), "1");
  j.w.close();
});

await prueba("si pidió ser profesor y el servidor NO lo concede, se le dice la verdad (entra como alumno, sin saludo de profe)", async () => {
  const bd = bdNuevo();
  bd.concederProfesor = false;
  const j = await abrir({ url: "auth.html#access_token=abc", bd, proveedor: "github" });
  await j.esperar(() => visible(j, "panel-bienvenida"));
  j.w.document.querySelector('input[name="rol-bienvenida"][value="profesor"]').click();
  j.$("btn-bienvenida").click();
  await j.esperar(() => /rol de profesor/.test(j.mensaje()));
  assert.match(j.mensaje(), /Tu cuenta se creó como alumno porque no se pudo activar el rol de profesor/);
  assert.equal(j.w.localStorage.getItem("codequest:bienvenida-profe"), null);
  assert.deepEqual(plano(j.redirecciones), [], "primero se lee el aviso");
  await j.esperar(() => j.redirecciones.length > 0, 5000);
  assert.deepEqual(plano(j.redirecciones), ["mundos.html"]);
  j.w.close();
});

await prueba("si cierra la pestaña sin contestar, la próxima vez que entre se le vuelve a preguntar (y nada quedó a medias)", async () => {
  const bd = bdNuevo();
  const j = await abrir({ url: "auth.html#access_token=abc", bd, proveedor: "google" });
  await j.esperar(() => visible(j, "panel-bienvenida"));
  j.w.close(); // se fue sin pulsar Continuar
  assert.deepEqual(plano(bd.rpcs), []);
  const k = await abrir({ url: "auth.html#access_token=def", bd, proveedor: "google" });
  await k.esperar(() => visible(k, "panel-bienvenida"));
  assert.ok(visible(k, "panel-bienvenida"));
  assert.equal(bd.insertados.length, 0, "no se duplicó nada");
  k.w.close();
});

await prueba("PRIMERA VEZ sin perfil (no hay disparador): se crea el perfil como estudiante y su progreso, y luego se pregunta", async () => {
  const bd = new SupabaseFalso({ usuario: usuarioNuevo() });
  const j = await abrir({ url: "auth.html?code=xyz", bd, proveedor: "github" });
  await j.esperar(() => visible(j, "panel-bienvenida"));
  assert.deepEqual(plano(bd.insertados.find((i) => i.tabla === "perfiles").fila), { user_id: "u-nuevo", nombre: "Ana Pérez", rol: "estudiante" });
  assert.deepEqual(plano(bd.insertados.find((i) => i.tabla === "progreso_jugador").fila), { user_id: "u-nuevo", mundo_actual: 1, nivel_actual: 1, experiencia: 0 });
  assert.equal(bd.insertados.length, 2);
  j.w.close();
});

await prueba("carrera con el disparador de la base de datos: si el insert dice «ya existe» (23505) no falla; otro error cierra la sesión con aviso", async () => {
  const bd = new SupabaseFalso({ usuario: usuarioNuevo(), errorInsertPerfil: { code: "23505", message: "duplicate key" }, perfilTrasError: true });
  const j = await abrir({ url: "auth.html?code=xyz", bd, proveedor: "google" });
  await j.esperar(() => visible(j, "panel-bienvenida"));
  assert.ok(visible(j, "panel-bienvenida"));
  assert.equal(j.errores.length, 0);
  const mal = new SupabaseFalso({ usuario: usuarioNuevo(), errorInsertPerfil: { code: "42501", message: "rls" } });
  const k = await abrir({ url: "auth.html?code=xyz", bd: mal, proveedor: "google" });
  await k.esperar(() => /No encontramos tu perfil/.test(k.mensaje()));
  assert.match(k.mensaje(), /No encontramos tu perfil/);
  assert.equal(mal.cerroSesion, true);
  assert.deepEqual(plano(k.redirecciones), []);
  j.w.close();
  k.w.close();
});

await prueba("CUENTA QUE YA EXISTÍA: entra directo con su rol de siempre (no se le pregunta nada ni se escribe nada)", async () => {
  const casos = [
    ["alumno que ya contestó", usuarioViejo({ user_metadata: { full_name: "Beto", cq_registro_completo: true } }), { rol: "estudiante" }, { experiencia: 0 }, "mundos.html"],
    ["alumno que ya jugó", usuarioViejo(), { rol: "estudiante" }, { experiencia: 450, nivel_actual: 4 }, "mundos.html"],
    ["se había registrado con correo y ahora usa Google (vinculada)", usuarioViejo({ user_metadata: { rol_solicitado: "estudiante" } }), { rol: "estudiante" }, { experiencia: 0 }, "mundos.html"],
    ["profesor", usuarioViejo(), { rol: "profesor" }, { experiencia: 0 }, "profesor.html"],
    ["administrador", usuarioViejo(), { rol: "admin" }, { experiencia: 0 }, "admin.html"],
  ];
  for (const [nombre, usuario, perfil, progreso, destino] of casos) {
    const bd = new SupabaseFalso({ usuario, perfiles: [{ user_id: "u-viejo", nombre: "Beto R.", ...perfil }], progreso: [{ user_id: "u-viejo", nivel_actual: 1, ...progreso }] });
    const j = await abrir({ url: "auth.html#access_token=abc", bd, proveedor: "google" });
    await j.esperar(() => j.redirecciones.length > 0);
    assert.deepEqual(plano(j.redirecciones), [destino], nombre);
    assert.ok(!visible(j, "panel-bienvenida"), nombre);
    assert.equal(bd.insertados.length, 0, nombre);
    assert.equal(bd.actualizados.length, 0, `${nombre}: no pisa su nombre`);
    assert.equal(bd.metadatos.length, 0, `${nombre}: no pide ningún rol nuevo`);
    j.w.close();
  }
});

await prueba("CORREO INSTITUCIONAL: se revisa ANTES de preguntar el rol; otro dominio se rechaza y se cierra la sesión (administradores exentos)", async () => {
  const bd = bdNuevo();
  bd.usuario = nuevoSinJugar({ email: "ana@gmail.com" });
  const j = await abrir({ url: "auth.html#access_token=abc", bd, bundle: BUNDLE_INSTITUCIONAL, proveedor: "google" });
  await j.esperar(() => /institucional/.test(j.mensaje()));
  assert.match(j.mensaje(), /Usa tu correo institucional \(@pachuca\.tecnm\.mx\)\. Entraste con ana@gmail\.com/);
  assert.equal(bd.cerroSesion, true);
  assert.ok(!visible(j, "panel-bienvenida"));
  assert.deepEqual(plano(j.redirecciones), []);
  j.w.close();
  const adm = new SupabaseFalso({ usuario: usuarioViejo({ email: "admin@gmail.com" }), perfiles: [{ user_id: "u-viejo", nombre: "Admin", rol: "admin" }], progreso: [{ user_id: "u-viejo" }] });
  const k = await abrir({ url: "auth.html#access_token=abc", bd: adm, bundle: BUNDLE_INSTITUCIONAL });
  await k.esperar(() => k.redirecciones.length > 0);
  assert.deepEqual(plano(k.redirecciones), ["admin.html"]);
  k.w.close();
  const bien = bdNuevo();
  bien.usuario = nuevoSinJugar({ email: "ana@pachuca.tecnm.mx" });
  const m = await abrir({ url: "auth.html#access_token=abc", bd: bien, bundle: BUNDLE_INSTITUCIONAL });
  await m.esperar(() => visible(m, "panel-bienvenida"));
  assert.ok(visible(m, "panel-bienvenida"));
  m.w.close();
});

await prueba("ERRORES DEL PROVEEDOR en la URL: se muestran en español, no se entra y se limpia la dirección", async () => {
  const casos = [
    ["#error=access_denied&error_code=access_denied&error_description=The+user+denied", /Cancelaste el acceso/],
    ["#error=server_error&error_code=unexpected_failure&error_description=Error+getting+user+email+from+external+provider", /no compartió tu correo/],
    ["?error=invalid_request&error_code=identity_already_exists&error_description=Identity+is+already+linked", /Ya existe una cuenta con ese correo/],
  ];
  for (const [fragmento, esperado] of casos) {
    const bd = new SupabaseFalso({ usuario: usuarioViejo(), perfiles: [{ user_id: "u-viejo", nombre: "B", rol: "estudiante" }] });
    const j = await abrir({ url: `auth.html${fragmento}`, bd, proveedor: "github" });
    await j.esperar(() => j.mensaje() !== "");
    assert.match(j.mensaje(), esperado);
    assert.deepEqual(plano(j.redirecciones), [], "con error no se redirige");
    assert.equal(j.w.location.hash + j.w.location.search, "");
    j.w.close();
  }
});

await prueba("lo existente sigue igual: ?error=perfil, sesión activa y los formularios de correo (con sus tarjetas alumno/profesor)", async () => {
  const j = await abrir({ url: "auth.html?error=perfil" });
  await j.esperar(() => j.mensaje() !== "");
  assert.match(j.mensaje(), /No encontramos tu perfil/);
  assert.deepEqual([...j.w.document.querySelectorAll("#panel-registro .opcion-rol")].map((o) => o.querySelector("strong").textContent), ["Soy alumno", "Soy profesor"]);
  j.w.close();
  const bd = new SupabaseFalso({ usuario: usuarioViejo(), perfiles: [{ user_id: "u-viejo", nombre: "B", rol: "estudiante" }] });
  const k = await abrir({ bd });
  await k.esperar(() => k.redirecciones.length > 0);
  assert.deepEqual(plano(k.redirecciones), ["mundos.html"]);
  assert.equal(bd.insertados.length, 0);
  k.w.close();
});

console.log(`\n${n} pruebas correctas.`);
process.exit(0);
