// Mide cuánto trabaja la página de juego «en reposo»: cuántas veces por segundo se dibuja el canvas y cuánto tiempo de CPU consume.
import { spawn } from "node:child_process";
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";
const etiqueta = process.argv[2] || "medicion";
const srv = spawn("node", ["herramientas/responsive/servidor.mjs"], { stdio: ["ignore", "pipe", "inherit"] });
process.on("exit", () => srv.kill());
await new Promise((ok) => srv.stdout.on("data", ok));
await fetch("http://127.0.0.1:4173/__cfg?rol=admin&hasta=0");
const b = await puppeteer.launch({ args: [...chromium.args, "--no-sandbox"], executablePath: await chromium.executablePath(), headless: "shell" });
const exp = Math.floor(Date.now() / 1000) + 99999;
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const token = JSON.stringify({ access_token: `${b64({alg:"HS256"})}.${b64({sub:"u1",exp})}.f`, token_type: "bearer", expires_in: 99999, expires_at: exp, refresh_token: "r", user: { id: "u1", aud: "authenticated", email: "a@x.mx", user_metadata: {}, created_at: "2026-01-01" } });
const resultados = [];
const SOLO = process.argv[3] ? process.argv[3].split(",").map(Number) : [1, 2, 5, 6];
for (const [mundo, nivel] of SOLO.map((m) => [m, 1])) {
  try {
  const p = await b.newPage();
  p.setDefaultTimeout(25000);
  await p.setViewport({ width: 1280, height: 800 });
  await p.setRequestInterception(true);
  p.on("request", (r) => (r.url().startsWith("http://127.0.0.1") || r.url().startsWith("data:") ? r.continue() : r.abort()));
  await p.evaluateOnNewDocument((t) => {
    localStorage.clear(); localStorage.setItem("sb-127-auth-token", t); localStorage.setItem("codequest:tour-visto", "1");
    ["demo","u1"].forEach((u) => [1,2,3,4,5,6].forEach((m) => { localStorage.setItem(`codequest:teoria:${u}:${m}`, "1"); localStorage.setItem(`codequest:tour-mundo:${u}:${m}`, "1"); }));
    window.__raf = { n: 0, ms: 0, dibujos: 0 };
    const limpiar = CanvasRenderingContext2D.prototype.clearRect;
    CanvasRenderingContext2D.prototype.clearRect = function (...a) { window.__raf.dibujos++; return limpiar.apply(this, a); }; // cada render() empieza con un clearRect
    const orig = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = (cb) => orig((t) => { const s = performance.now(); cb(t); window.__raf.ms += performance.now() - s; window.__raf.n++; });
  }, token);
  await p.goto(`http://127.0.0.1:4173/juego.html?mundo=${mundo}&nivel=${nivel}&demo=true`, { waitUntil: "domcontentloaded" });
  await new Promise((r) => setTimeout(r, 2500)); // el juego termina de arrancar
  const medir = async (seg) => {
    await p.evaluate(() => { window.__raf.n = 0; window.__raf.ms = 0; window.__raf.dibujos = 0; });
    await new Promise((r) => setTimeout(r, seg * 1000));
    const r = await p.evaluate(() => window.__raf);
    return { fps: +(r.dibujos / seg).toFixed(1), cpuMsPorSeg: +(r.ms / seg).toFixed(1) };
  };
  p.on("pageerror", (e) => console.log("  pageerror:", e.message.slice(0, 160)));
  const reposo = await medir(4);
  // cambiar de fase/reiniciar 6 veces (cada vez se crea un escenario nuevo sobre el mismo canvas)
  for (let i = 0; i < 6; i++) { await p.evaluate(() => document.getElementById("btn-reiniciar").click()); await new Promise((r) => setTimeout(r, 250)); }
  const tras6 = await medir(4);
  resultados.push({ mundo, reposo, trasReiniciar6: tras6 });
  await p.close();
  } catch (e) { console.log(`Mundo ${mundo}: ERROR ${String(e.message).slice(0, 120)}`); }
}
console.log(`== ${etiqueta}`);
for (const r of resultados) console.log(`Mundo ${r.mundo}: reposo ${r.reposo.fps} dibujos/s · ${r.reposo.cpuMsPorSeg} ms de CPU por seg | tras 6 reinicios ${r.trasReiniciar6.fps} dibujos/s · ${r.trasReiniciar6.cpuMsPorSeg} ms/seg`);
await b.close(); srv.kill();
