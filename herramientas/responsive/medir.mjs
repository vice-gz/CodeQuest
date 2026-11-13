// medir.mjs — comprobación del diseño responsivo en un navegador REAL (Chromium sin pantalla).
// Abre cada página en PC, tablet y celular, y comprueba:
//   · que NO haya scroll horizontal ni elementos que se salgan por la derecha,
//   · el menú hamburguesa en pantallas ≤ 992 px,
//   · el escenario (canvas) ANTES del editor en pantallas ≤ 992 px (y al lado en PC),
//   · el botón Ejecutar táctil (≥ 44 px) y los campos con letra ≥ 16 px en celular
//     (evita el zoom automático de Safari),
//   · que Ejecutar quite el foco del editor en pantalla táctil (se oculta el teclado).
// Además guarda capturas en /tmp/capturas.
//
// Requisitos (no se instalan con el proyecto):  npm i --no-save puppeteer-core @sparticuz/chromium
// Uso:  1) VITE_SUPABASE_URL=http://127.0.0.1:4173 VITE_SUPABASE_ANON_KEY=x npx vite build
//       2) node herramientas/responsive/medir.mjs [--pagina=juego] [--ancho=390] [--detalle]

import { spawn } from "node:child_process";
import { mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const BASE = "http://127.0.0.1:4173";
const argumento = (n) => process.argv.find((a) => a.startsWith(`--${n}=`))?.split("=")[1];
const DETALLE = process.argv.includes("--detalle");
const SOLO_PAGINA = argumento("pagina");
const SOLO_ANCHO = Number(argumento("ancho")) || null;
mkdirSync("/tmp/capturas", { recursive: true });

const VIEWPORTS = [
  { nombre: "pc-1920", ancho: 1920, alto: 1080, movil: false },
  { nombre: "pc-1366", ancho: 1366, alto: 768, movil: false },
  { nombre: "tablet-horizontal-1024", ancho: 1024, alto: 768, movil: true },
  { nombre: "tablet-ipad-820", ancho: 820, alto: 1180, movil: true },
  { nombre: "tablet-768", ancho: 768, alto: 1024, movil: true },
  { nombre: "celular-iphone-390", ancho: 390, alto: 844, movil: true },
  { nombre: "celular-android-360", ancho: 360, alto: 740, movil: true },
  { nombre: "celular-chico-320", ancho: 320, alto: 568, movil: true },
].filter((v) => !SOLO_ANCHO || v.ancho === SOLO_ANCHO);

const ESCENARIOS = [
  { id: "landing", url: "/index.html", rol: null },
  { id: "landing-sesion", url: "/index.html", rol: "estudiante", hasta: 0 },
  { id: "auth", url: "/auth.html", rol: null },
  { id: "conceptos", url: "/conceptos.html?mundo=4", rol: null },
  { id: "mundos", url: "/mundos.html", rol: "estudiante", hasta: 19 },
  { id: "juego-m1", url: "/juego.html?mundo=1", rol: "estudiante", hasta: 0, juego: true },
  { id: "juego-m1-alcancia", url: "/juego.html?mundo=1&nivel=6", rol: "estudiante", hasta: 5, juego: true },
  { id: "juego-m1-semaforo", url: "/juego.html?mundo=1&nivel=8", rol: "estudiante", hasta: 7, juego: true },
  { id: "juego-m2", url: "/juego.html?mundo=2", rol: "estudiante", hasta: 19, juego: true },
  { id: "juego-m3", url: "/juego.html?mundo=3", rol: "estudiante", hasta: 31, juego: true },
  { id: "juego-m4", url: "/juego.html?mundo=4", rol: "estudiante", hasta: 43, juego: true },
  { id: "juego-m5", url: "/juego.html?mundo=5", rol: "estudiante", hasta: 55, juego: true },
  { id: "juego-m5-n2", url: "/juego.html?mundo=5&nivel=2", rol: "estudiante", hasta: 56, juego: true },
  { id: "juego-m5-n3", url: "/juego.html?mundo=5&nivel=3", rol: "estudiante", hasta: 57, juego: true },
  { id: "juego-m5-n4", url: "/juego.html?mundo=5&nivel=4", rol: "estudiante", hasta: 58, juego: true },
  { id: "juego-tour", url: "/juego.html?mundo=1", rol: "estudiante", hasta: 0, juego: true, tour: true },
  { id: "juego-sandbox", url: "/juego.html?modo=sandbox", rol: "estudiante", hasta: 8, juego: true },
  { id: "perfil", url: "/perfil.html", rol: "estudiante", hasta: 25 },
  { id: "profesor", url: "/profesor.html", rol: "profesor", hasta: 8 },
  { id: "admin", url: "/admin.html", rol: "admin", hasta: 8, admin: true },
].filter((e) => !SOLO_PAGINA || e.id.includes(SOLO_PAGINA));

const servidor = spawn("node", [resolve(RAIZ, "herramientas/responsive/servidor.mjs")], { stdio: ["ignore", "pipe", "inherit"] });
await new Promise((ok) => servidor.stdout.on("data", ok));
// Si algo falla, el servidor de pruebas no debe quedarse ocupando el puerto.
process.on("exit", () => servidor.kill());
process.on("uncaughtException", (e) => {
  console.error(e);
  process.exit(1);
});

const sesion = () => {
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const exp = Math.floor(Date.now() / 1000) + 86400 * 30;
  return JSON.stringify({
    access_token: `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ sub: "u1", exp, role: "authenticated" })}.firma`,
    token_type: "bearer", expires_in: 86400 * 30, expires_at: exp, refresh_token: "r",
    user: { id: "u1", aud: "authenticated", email: "ana@pachuca.tecnm.mx", user_metadata: { nombre: "Ana" }, created_at: new Date().toISOString() },
  });
};

const ejecutable = await chromium.executablePath();
const abrirNavegador = () => puppeteer.launch({ args: [...chromium.args, "--no-sandbox", "--disable-dev-shm-usage"], executablePath: ejecutable, headless: "shell" });
let navegador = await abrirNavegador();
const resultados = [];
// Una captura que falla (memoria del navegador) no debe tumbar toda la revisión.
const capturar = async (page, ruta) => {
  try {
    await page.screenshot({ path: ruta, fullPage: true });
  } catch (e) {
    console.warn(`(captura omitida: ${ruta.split("/").pop()})`);
  }
};

// Mide la página ya cargada. Devuelve la lista de problemas encontrados.
async function medir(page, esc, vp) {
  return page.evaluate(
    (esc, vp) => {
      const problemas = [];
      const doc = document.documentElement;
      const ancho = vp.ancho; // NO window.innerWidth: en móvil el navegador lo ensancha si algo desborda
      const visible = (el) => {
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none";
      };
      const dentroDeScroll = (el) => {
        for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
          const o = getComputedStyle(p).overflowX;
          if ((o === "auto" || o === "scroll" || o === "hidden") && p.scrollWidth >= p.clientWidth) return true;
        }
        return false;
      };

      // 1) Sin scroll horizontal
      if (doc.scrollWidth > ancho + 1) problemas.push(`scroll horizontal: la página mide ${doc.scrollWidth}px en una pantalla de ${ancho}px`);
      const culpables = [];
      document.querySelectorAll("body *").forEach((el) => {
        if (!visible(el) || dentroDeScroll(el)) return;
        if (getComputedStyle(el).position === "fixed") return;
        const r = el.getBoundingClientRect();
        if (r.right > ancho + 1 || r.left < -1) culpables.push(`${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""}${el.className && typeof el.className === "string" ? "." + el.className.trim().split(/\s+/).slice(0, 2).join(".") : ""} (${Math.round(r.left)}→${Math.round(r.right)})`);
      });
      if (culpables.length) problemas.push(`se sale de la pantalla: ${culpables.slice(0, 4).join(" | ")}`);

      // 2) Menú hamburguesa (solo páginas con menú de sesión)
      const hamb = document.querySelector(".nav-hamburguesa");
      if (hamb) {
        const hambVisible = visible(hamb);
        if (ancho <= 992 && !hambVisible) problemas.push("en pantallas ≤ 992px el menú debe ser hamburguesa");
        if (ancho > 992 && hambVisible) problemas.push("en PC el menú no debe ser hamburguesa");
      }

      // 3) Campos con letra ≥ 16px en celular (evita el zoom de Safari)
      if (vp.ancho <= 600) {
        document.querySelectorAll("input:not([type=radio]):not([type=checkbox]):not([type=hidden]), textarea, select").forEach((el) => {
          if (visible(el) && parseFloat(getComputedStyle(el).fontSize) < 16) problemas.push(`campo con letra de ${getComputedStyle(el).fontSize} (<16px): ${el.id || el.name || el.type}`);
        });
      }

      // 4) Juego
      if (esc.juego) {
        const q = (s) => document.querySelector(s);
        const mundo = q(".panel-mundo");
        const codigo = q(".panel-codigo");
        const lienzo = q("#lienzo-mundo");
        if (mundo && codigo) {
          const arriba = mundo.getBoundingClientRect().top < codigo.getBoundingClientRect().top - 5;
          // Al lado en cualquier orden (desde v3.1 la escena va a la IZQUIERDA y el código a la derecha): sin solaparse en horizontal.
          const rm = mundo.getBoundingClientRect();
          const rc = codigo.getBoundingClientRect();
          const alLado = Math.abs(rm.left - rc.left) > 100 && (rm.right <= rc.left + 2 || rc.right <= rm.left + 2);
          if (ancho <= 992 && !arriba) problemas.push("en pantallas ≤ 992px el escenario debe ir ANTES del editor");
          if (ancho > 1100 && !alLado) problemas.push("en PC el escenario debe ir al lado del editor");
        }
        if (lienzo && visible(lienzo)) {
          const w = lienzo.getBoundingClientRect().width;
          const pad = mundo.getBoundingClientRect().width;
          const minimo = lienzo.dataset.pixel ? 0.65 : 0.8; // el pixel art con escala entera deja franjas a los lados (a propósito)
          if (w < pad * minimo) problemas.push(`el escenario no ocupa el ancho del panel (${Math.round(w)} de ${Math.round(pad)}px)`);
        }
        const ej = q("#btn-ejecutar");
        if (ej && visible(ej) && vp.movil && ej.getBoundingClientRect().height < 44) problemas.push(`Ejecutar mide ${Math.round(ej.getBoundingClientRect().height)}px de alto (<44px táctil)`);
        const ta = q("#editor-codigo");
        if (ta && visible(ta)) {
          if (ta.getBoundingClientRect().height < 120) problemas.push(`el editor mide solo ${Math.round(ta.getBoundingClientRect().height)}px de alto`);
          if (vp.ancho <= 992) {
            const n = q("#numeros-linea span");
            if (n && Math.abs(parseFloat(getComputedStyle(n).lineHeight) - parseFloat(getComputedStyle(ta).lineHeight)) > 0.6) problemas.push("los números de línea no coinciden con el interlineado del editor");
          }
        }
        if (vp.ancho <= 992) {
          // Barra superior: sin Tour, Mapa ni Conceptos (viven en la hamburguesa)
          for (const sel of ["#btn-tour", "#btn-conceptos", ".boton-mapa"]) {
            const e = q(sel);
            if (e && visible(e)) problemas.push(`${sel} no debe verse en la barra superior de un celular (va en el menú hamburguesa)`);
          }
          const pt = q("#selector-niveles .nivel-punto");
          if (pt && pt.getBoundingClientRect().height > 36) problemas.push(`los botones de nivel miden ${Math.round(pt.getBoundingClientRect().height)}px: deben ser compactos (≤36px)`);
          const tabs = [...document.querySelectorAll("#pestanas-movil [role=tab]")];
          if (tabs.length !== 3 || !visible(q("#pestanas-movil"))) problemas.push("en móvil debe haber 3 pestañas (Jugar, Aprende, Consola)");
          else if (tabs.find((t) => t.getAttribute("aria-selected") === "true")?.dataset.pestana !== "jugar") problemas.push("la pestaña inicial debe ser «Jugar»");
          const eb = q("#btn-ejecutar");
          if (eb && visible(eb) && esc.id !== "juego-sandbox" || (eb && visible(eb))) {
            const cs = getComputedStyle(eb);
            const r = eb.getBoundingClientRect();
            if (cs.position !== "fixed") problemas.push("el botón Ejecutar debe ser flotante (position: fixed) en móvil");
            if (r.bottom > window.innerHeight + 1 || r.bottom < window.innerHeight - 90) problemas.push(`Ejecutar debe quedar al pie de la pantalla (su borde inferior está en ${Math.round(r.bottom)} de ${window.innerHeight}px)`);
            if (r.width < 180 || r.height < 48) problemas.push(`Ejecutar flotante muy pequeño (${Math.round(r.width)}×${Math.round(r.height)}px)`);
          }
        }
        const niveles = q("#selector-niveles");
        if (niveles && vp.ancho <= 992) {
          const cs = getComputedStyle(niveles);
          if (!["auto", "scroll"].includes(cs.overflowX)) problemas.push("la barra de niveles debe poder deslizarse (overflow-x:auto)");
        }
      }
      return problemas;
    },
    esc,
    vp
  );
}

for (const esc of ESCENARIOS) {
  navegador = await abrirNavegador();
  await fetch(`${BASE}/__cfg?rol=${esc.rol || "estudiante"}&hasta=${esc.hasta ?? 0}`);
  for (const vp of VIEWPORTS) {
    const page = await navegador.newPage();
    await page.setViewport({ width: vp.ancho, height: vp.alto, deviceScaleFactor: 1, isMobile: vp.movil, hasTouch: vp.movil });
    const errores = [];
    page.on("pageerror", (e) => errores.push(e.message));
    if (esc.admin) {
      // Chart.js llega por CDN: aquí se sirve la copia local de node_modules (npm i --no-save chart.js@4.4.1).
      await page.setRequestInterception(true);
      page.on("request", (req) => {
        if (req.url().includes("cdn.jsdelivr.net/npm/chart.js")) {
          req.respond({ status: 200, contentType: "application/javascript", body: readFileSync(new URL("../../node_modules/chart.js/dist/chart.umd.js", import.meta.url)) });
        } else req.continue();
      });
    }
    page.on("console", (m) => m.type() === "error" && !/Failed to load resource|ERR_/.test(m.text()) && errores.push(m.text()));
    if (esc.rol) {
      const token = sesion();
      await page.evaluateOnNewDocument((t, bienvenidas, esc) => {
        localStorage.setItem("sb-127-auth-token", t);
        bienvenidas.forEach((m) => localStorage.setItem(`codequest:teoria:u1:${m}`, "1"));
        if (!esc.tour) {
          localStorage.setItem("codequest:tour-visto", "1");
          [2, 3, 4, 5].forEach((m) => localStorage.setItem(`codequest:tour-mundo:u1:${m}`, "1")); // tours de mundo ya vistos
        }
      }, token, [1, 2, 3, 4], esc);
    }
    await page.goto(`${BASE}${esc.url}`, { waitUntil: "networkidle0", timeout: 30000 }).catch(() => {});
    await new Promise((r) => setTimeout(r, 900));
    // El tour de bienvenida cubriría la pantalla: se cierra si aparece.
    if (!esc.tour) await page.evaluate(() => document.querySelector(".tour-overlay")?.remove());

    let problemas = await medir(page, esc, vp);

    // Comportamiento táctil: Ejecutar debe quitar el foco del editor (se oculta el teclado)
    if (esc.juego && vp.movil && esc.id !== "juego-sandbox" && !esc.tour) {
      const resultado = await page.evaluate(async () => {
        const ta = document.getElementById("editor-codigo");
        if (!ta || ta.disabled) return null;
        ta.focus();
        const enfocadoAntes = document.activeElement === ta;
        document.getElementById("btn-ejecutar").click();
        await new Promise((r) => setTimeout(r, 120));
        return { enfocadoAntes, enfocadoDespues: document.activeElement === ta };
      });
      if (resultado && resultado.enfocadoAntes && resultado.enfocadoDespues) problemas.push("al ejecutar, el editor conserva el foco: el teclado del celular taparía el escenario");
    }

    // Pestañas (solo en pantallas de una columna): cada una muestra SUS paneles y oculta los demás.
    if (esc.juego && vp.ancho <= 992 && esc.id !== "juego-tour") {
      const esperado = { jugar: [".panel-mundo", ".panel-codigo"], aprende: [".panel-aprende"], consola: [".panel-salida", ".panel-memoria"] };
      const resultado = await page.evaluate(async (esperado) => {
        const fallos = [];
        const ver = (sel) => { const e = document.querySelector(sel); return !!e && e.getClientRects().length > 0; };
        for (const [pestana, paneles] of Object.entries(esperado)) {
          const boton = document.querySelector(`#pestana-${pestana}`);
          if (!boton) { fallos.push(`no existe la pestaña ${pestana} (¿la página no cargó?)`); continue; }
          boton.click();
          await new Promise((r) => setTimeout(r, 250));
          for (const sel of paneles) if (!ver(sel) && !(esperado.consola.includes(sel) && sel === ".panel-memoria" && false)) fallos.push(`en la pestaña ${pestana} debe verse ${sel}`);
          for (const [otra, ps] of Object.entries(esperado)) if (otra !== pestana) for (const sel of ps) if (ver(sel)) fallos.push(`en la pestaña ${pestana} NO debe verse ${sel}`);
          const ej = document.querySelector("#btn-ejecutar");
          const visibleEj = ej && ej.getClientRects().length > 0 && getComputedStyle(ej).display !== "none";
          if (pestana === "jugar" && !visibleEj && !ej.classList.contains("oculto")) fallos.push("Ejecutar debe verse en la pestaña Jugar");
          if (pestana !== "jugar" && visibleEj) fallos.push(`Ejecutar no debe flotar en la pestaña ${pestana}`);
          if (document.documentElement.scrollWidth > window.innerWidth + 1 && window.innerWidth <= 1000) fallos.push(`la pestaña ${pestana} desborda a lo ancho`);
        }
        document.querySelector("#pestana-jugar")?.click();
        await new Promise((r) => setTimeout(r, 250));
        const lienzo = document.querySelector("#lienzo-mundo");
        const panel = document.querySelector(".panel-mundo");
        if (lienzo && lienzo.getBoundingClientRect().width < panel.getBoundingClientRect().width * (lienzo.dataset.pixel ? 0.65 : 0.8)) fallos.push("al volver a «Jugar» el escenario no recuperó su ancho");
        return fallos;
      }, esperado);
      resultado.forEach((x) => problemas.push(`[pestañas] ${x}`));
      // Al ejecutar desde «Jugar» el resultado aparece en la misma pestaña y Consola recibe un aviso.
    }

    // Ventanas y menús abiertos: tampoco deben desbordar la pantalla.
    const superposiciones = [
      ["menú hamburguesa", () => document.querySelector(".nav-hamburguesa")?.click(), () => document.querySelector(".nav-hamburguesa")?.click()],
      ...(esc.juego && esc.id !== "juego-sandbox"
        ? [
            ["diccionario", () => document.getElementById("btn-diccionario")?.click(), () => document.getElementById("btn-diccionario")?.click()],
            ["glosario", () => document.getElementById("btn-conceptos")?.click(), () => document.querySelector(".modal-glosario [data-cerrar]")?.click()],
          ]
        : []),
    ];
    if (vp.ancho <= 992 && esc.rol && !esc.tour) {
      const menu = await page.evaluate(async () => {
        const h = document.querySelector(".nav-hamburguesa");
        if (!h) return null;
        h.click();
        await new Promise((r) => setTimeout(r, 250));
        const enlaces = [...document.querySelectorAll(".nav-enlaces a")].map((a) => a.getBoundingClientRect());
        const m = document.querySelector(".nav-menu").getBoundingClientRect();
        const fuera = document.querySelector(".nav-principal.nav-abierto") ? true : false;
        const boton = document.querySelector("#btn-cerrar-sesion")?.getBoundingClientRect();
        const r = { abierto: fuera, altos: enlaces.map((x) => Math.round(x.height)), solapes: enlaces.slice(1).some((x, i) => x.top < enlaces[i].bottom - 1), ancho: Math.round(m.width), botonAlto: boton ? Math.round(boton.height) : 0, botonAncho: boton ? Math.round(boton.width) : 0, menuBottom: Math.round(m.bottom), cabeEnPantalla: m.bottom <= window.innerHeight + 1 };
        // Escape cierra
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
        await new Promise((r) => setTimeout(r, 100));
        r.cierraConEscape = !document.querySelector(".nav-principal.nav-abierto");
        h.click();
        await new Promise((r) => setTimeout(r, 150));
        return r;
      });
      if (menu) {
        if (!menu.abierto) problemas.push("[menú] no se abrió");
        if (menu.altos.some((a) => a < 44)) problemas.push(`[menú] filas de ${menu.altos.join("/")}px: deben medir ≥44px`);
        if (menu.solapes) problemas.push("[menú] los enlaces se amontonan (se solapan)");
        if (menu.botonAlto < 44) problemas.push(`[menú] Cerrar sesión mide ${menu.botonAlto}px de alto`);
        if (menu.botonAncho < vp.ancho * 0.6) problemas.push(`[menú] Cerrar sesión es muy angosto (${menu.botonAncho}px)`);
        if (!menu.cabeEnPantalla) problemas.push("[menú] no cabe en la pantalla (debe poder deslizarse o ser más compacto)");
        if (!menu.cierraConEscape) problemas.push("[menú] no se cierra con Escape");
      }
      await capturar(page, `/tmp/capturas/${esc.id}-menu-${vp.nombre}.png`).catch(() => {});
      await page.evaluate(() => document.querySelector(".nav-principal.nav-abierto") && document.querySelector(".nav-hamburguesa").click());
    }

    for (const [nombre, abrir, cerrar] of esc.tour ? [] : superposiciones) {
      const existe = await page.evaluate((f) => { try { return new Function(`return (${f})()`)() !== null; } catch { return false; } }, "() => true");
      if (!existe) continue;
      await page.evaluate(abrir);
      await new Promise((r) => setTimeout(r, 350));
      const abierto = await medir(page, { ...esc, juego: false }, vp);
      abierto.forEach((x) => problemas.push(`[${nombre} abierto] ${x}`));
      if (nombre === "glosario") await capturar(page, `/tmp/capturas/${esc.id}-glosario-${vp.nombre}.png`);
      await page.evaluate(cerrar);
      await new Promise((r) => setTimeout(r, 200));
    }

    if (esc.admin) {
      // Dashboard: Chart.js cargó, las 3 gráficas se dibujaron con tamaño real y el filtro por grupo cambia los KPIs.
      const dash = await page.evaluate(async () => {
        const fallos = [];
        if (!window.Chart) return ["Chart.js no cargó (¿falta npm i --no-save chart.js@4.4.1?)"];
        const kpis = () => Object.fromEntries([...document.querySelectorAll(".kpi-tarjeta")].map((t) => [t.querySelector(".kpi-titulo").textContent, t.querySelector(".kpi-valor").textContent.trim()]));
        for (const id of ["grafica-errores", "grafica-mundos", "grafica-dias"]) {
          const c = document.getElementById(id);
          const r = c.getBoundingClientRect();
          if (!window.Chart.getChart(c)) fallos.push(`${id}: no hay gráfica de Chart.js`);
          if (r.width < 150 || r.height < 150) fallos.push(`${id}: tamaño ${Math.round(r.width)}×${Math.round(r.height)}`);
          if (r.right > window.innerWidth + 1) fallos.push(`${id}: se sale de la pantalla`);
        }
        const antes = kpis();
        if (Object.keys(antes).length !== 4) fallos.push(`debe haber 4 KPIs y hay ${Object.keys(antes).length}`);
        const sel = document.getElementById("filtro-grupos");
        const caja = sel.getBoundingClientRect();
        if (caja.right > window.innerWidth + 1) fallos.push("el selector de grupo se sale de la pantalla");
        sel.value = [...sel.options].find((o) => o.value.startsWith("clase:"))?.value;
        sel.dispatchEvent(new Event("change", { bubbles: true }));
        await new Promise((r) => setTimeout(r, 400));
        const despues = kpis();
        if (despues["Total de alumnos"] !== "3" || antes["Total de alumnos"] === despues["Total de alumnos"]) fallos.push(`el filtro no cambió los KPIs (${antes["Total de alumnos"]} → ${despues["Total de alumnos"]})`);
        return fallos;
      });
      dash.forEach((x) => problemas.push(`[dashboard] ${x}`));
      await new Promise((r) => setTimeout(r, 600));
      await capturar(page, `/tmp/capturas/${esc.id}-dashboard-${vp.nombre}.png`);
      for (const pestana of ["usuarios", "ejecuciones", "auditoria"]) {
        await page.evaluate((p) => document.querySelector(`[data-seccion="${p}"]`)?.click(), pestana);
        await new Promise((r) => setTimeout(r, 700));
        const extra = await medir(page, { ...esc, admin: false }, vp);
        extra.forEach((x) => problemas.push(`[${pestana}] ${x}`));
        await capturar(page, `/tmp/capturas/${esc.id}-${pestana}-${vp.nombre}.png`);
      }
    }
    if (esc.tour) {
      const recorrido = await page.evaluate(async () => {
        const fallos = [];
        const pestanas = new Set();
        const anchoVentana = window.innerWidth;
        const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
        await esperar(700);
        if (!document.querySelector(".tour-overlay")) return ["el tour no apareció"];
        for (let paso = 1; paso < 20 && document.querySelector(".tour-overlay"); paso++) {
          await esperar(1000); // da tiempo al scroll suave
          const vw = window.innerWidth, vh = window.innerHeight;
          const dentro = (r, margen = 1) => r.left >= -margen && r.right <= vw + margen && r.top >= -margen && r.bottom <= vh + margen;
          const q = (s) => document.querySelector(s);
          const controles = q(".tour-controles").getBoundingClientRect();
          const cerrar = q(".tour-cerrar").getBoundingClientRect();
          const globo = q(".tour-globo").getBoundingClientRect();
          const recuadro = q(".tour-recuadro");
          const titulo = q(".tour-titulo").textContent;
          if (!dentro(controles)) fallos.push(`paso ${paso} (${titulo}): los controles no se ven completos`);
          for (const [nombre, sel] of [["Siguiente", ".tour-siguiente"], ["Saltar", ".tour-saltar"]]) {
            const r = q(sel).getBoundingClientRect();
            if (!dentro(r)) fallos.push(`paso ${paso}: el botón ${nombre} está fuera de la pantalla`);
            if (r.height < 44) fallos.push(`paso ${paso}: el botón ${nombre} mide ${Math.round(r.height)}px de alto`);
          }
          if (!dentro(cerrar) || cerrar.right < vw - 40 || cerrar.top > 40) fallos.push(`paso ${paso}: la ✕ de cerrar no está en la esquina superior derecha`);
          if (!dentro(globo)) fallos.push(`paso ${paso} (${titulo}): el globo se sale de la pantalla (${Math.round(globo.top)}→${Math.round(globo.bottom)} de ${vh}px)`);
          if (globo.bottom > controles.top + 2) fallos.push(`paso ${paso} (${titulo}): el globo queda tapado por los controles`);
          if (recuadro.style.display !== "none") {
            const r = recuadro.getBoundingClientRect();
            const visible = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0));
            if (visible < Math.min(r.height, vh * 0.35) - 2) fallos.push(`paso ${paso} (${titulo}): el elemento resaltado casi no se ve`);
            // Visible entre la ✕ (arriba) y los controles (abajo). Un elemento que ya está al inicio o al final
            // de la página no se puede centrar más: basta con que se vea entero.
            const libreArriba = 50, libreAbajo = controles.top;
            const cabe = r.height <= libreAbajo - libreArriba;
            if (cabe && (r.top < libreArriba - 4 || r.bottom > libreAbajo + 4)) fallos.push(`paso ${paso} (${titulo}): el elemento resaltado queda tapado por la ✕ o por los controles (${Math.round(r.top)}→${Math.round(r.bottom)}; scrollY=${Math.round(scrollY)}; pestaña=${document.querySelector('#contenedor-nivel').dataset.pestana}; elemento=${(() => { const e = document.querySelector('.tour-titulo').textContent; return e; })()}; panel=${JSON.stringify((document.querySelector('.panel-mundo')||{getBoundingClientRect:()=>({top:0,bottom:0})}).getBoundingClientRect().top|0)})`);
          }
          pestanas.add(document.querySelector("#contenedor-nivel").dataset.pestana);
          q(".tour-siguiente").click();
        }
        if (document.querySelector(".tour-overlay")) fallos.push("el tour no terminó después de recorrer todos los pasos");
        if (anchoVentana <= 992 && pestanas.size < 3) fallos.push(`en móvil el tour debía pasar por las 3 pestañas y pasó por: ${[...pestanas].join(", ")}`);
        return fallos;
      });
      recorrido.forEach((x) => problemas.push(`[tour] ${x}`));
      // ✕ cierra en cualquier momento
      await page.reload({ waitUntil: "networkidle0" });
      await new Promise((r) => setTimeout(r, 1000));
      const cierra = await page.evaluate(async () => {
        document.querySelector(".tour-siguiente")?.click();
        await new Promise((r) => setTimeout(r, 300));
        document.querySelector(".tour-cerrar")?.click();
        await new Promise((r) => setTimeout(r, 200));
        return !document.querySelector(".tour-overlay");
      });
      if (!cierra) problemas.push("[tour] la ✕ no cerró el tour a mitad de camino");
    }

    problemas.push(...errores.slice(0, 2).map((e) => `error de JavaScript: ${e}`));

    await capturar(page, `/tmp/capturas/${esc.id}-${vp.nombre}.png`);
    resultados.push({ pagina: esc.id, vp: vp.nombre, problemas });
    await page.close().catch(() => {});
  }
  await navegador.close().catch(() => {});
}

await navegador.close().catch(() => {});
servidor.kill();

let fallos = 0;
for (const r of resultados) {
  if (r.problemas.length) fallos += r.problemas.length;
  if (r.problemas.length || DETALLE) console.log(`${r.problemas.length ? "✗" : "✓"} ${r.pagina.padEnd(14)} ${r.vp.padEnd(24)}${r.problemas.length ? "\n    - " + r.problemas.join("\n    - ") : ""}`);
}
console.log(`\n${resultados.length} combinaciones página × pantalla revisadas · ${fallos} problema(s)`);
process.exit(fallos ? 1 : 0);
