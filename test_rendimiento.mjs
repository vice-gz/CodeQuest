// test_rendimiento.mjs — el control de animaciones en reposo (js/game/rendimiento.js) y la caché de capas estáticas.
// Comprueba lo que hacía lenta la página: bucles que se acumulaban y dibujaban a todo ritmo sin que nadie los viera.
// Uso: node test_rendimiento.mjs

import assert from "node:assert/strict";
import { crearBucleReposo, leerModo, guardarModo, aplicarModo, calidad, brilloCalidad, escucharModo, EVENTO_MODO } from "./js/game/rendimiento.js";
import { conBrillo, capaCacheada } from "./js/game/escenarios/dibujo.js";
import { EscenarioDatos } from "./js/game/escenarios/datos.js";

let n = 0;
const prueba = async (nombre, fn) => {
  calidad.bajo = false;
  await fn();
  n++;
  console.log(`  ✓ ${nombre}`);
};

// ---- reloj y requestAnimationFrame de mentira
function entornoFalso({ oculto = false } = {}) {
  const e = { t: 0, cola: new Map(), sig: 1, oculto, oyentes: {}, costoDibujo: 0 };
  e.raf = (cb) => {
    const id = e.sig++;
    e.cola.set(id, cb);
    return id;
  };
  e.caf = (id) => e.cola.delete(id);
  e.ahora = () => e.t;
  e.doc = {
    get hidden() {
      return e.oculto;
    },
    addEventListener: (t, f) => (e.oyentes[t] ??= new Set()).add(f),
    removeEventListener: (t, f) => e.oyentes[t]?.delete(f),
  };
  e.emitir = (t) => [...(e.oyentes[t] ?? [])].forEach((f) => f());
  /** Avanza `ms` de reloj con una pantalla de 60 Hz. */
  e.correr = (ms) => {
    const fin = e.t + ms;
    while (e.t < fin) {
      e.t += 1000 / 60;
      const pendientes = [...e.cola.entries()];
      e.cola.clear();
      for (const [, cb] of pendientes) cb(e.t);
    }
  };
  e.IO = class {
    constructor(cb) {
      e.io = this;
      this.cb = cb;
    }
    observe() {}
    disconnect() {
      e.io = null;
    }
    emitir(visible) {
      this.cb([{ isIntersecting: visible }]);
    }
  };
  return e;
}
const canvasFalso = () => ({ isConnected: true });
const crear = (e, extra = {}) => {
  const cuenta = { dibujos: 0 };
  const canvas = extra.canvas ?? canvasFalso();
  const bucle = crearBucleReposo({
    canvas,
    dibujar: () => {
      cuenta.dibujos++;
      e.t += e.costoDibujo; // el dibujo «cuesta» tiempo de reloj
    },
    ocupado: extra.ocupado,
    modo: extra.modo ?? (() => "auto"),
    entorno: { raf: e.raf, caf: e.caf, ahora: e.ahora, doc: e.doc, IO: e.IO },
  });
  return { bucle, cuenta, canvas };
};

console.log("Bucle de reposo");
await prueba("limita los cuadros por segundo del reposo (auto: 24; completas: 30) aunque la pantalla vaya a 60 Hz", async () => {
  const e = entornoFalso();
  const a = crear(e);
  a.bucle.iniciar();
  e.correr(2000);
  assert.ok(a.cuenta.dibujos >= 36 && a.cuenta.dibujos <= 50, `auto ≈ 20-24/s (una pantalla de 60 Hz solo da cuadros en pasos de 16,7 ms): ${a.cuenta.dibujos / 2}/s`);
  a.bucle.detener();
  const e2 = entornoFalso();
  const b = crear(e2, { modo: () => "completas" });
  b.bucle.iniciar();
  e2.correr(2000);
  assert.ok(b.cuenta.dibujos >= 56 && b.cuenta.dibujos <= 62, `completas ≈ 30/s: ${b.cuenta.dibujos / 2}/s`);
});
await prueba("modo «ligeras»: no hay animación en reposo (ni siquiera se pide un cuadro)", async () => {
  const e = entornoFalso();
  const a = crear(e, { modo: () => "ligeras" });
  a.bucle.iniciar();
  e.correr(1000);
  assert.equal(a.cuenta.dibujos, 0);
  assert.equal(e.cola.size, 0);
});
await prueba("se detiene con la pestaña oculta y vuelve cuando se ve (sin pedir cuadros mientras tanto)", async () => {
  const e = entornoFalso();
  const a = crear(e);
  a.bucle.iniciar();
  e.correr(500);
  const antes = a.cuenta.dibujos;
  e.oculto = true;
  e.emitir("visibilitychange");
  e.correr(1000);
  assert.ok(a.cuenta.dibujos - antes <= 1, "oculta: no dibuja");
  assert.equal(e.cola.size, 0, "oculta: ni siquiera queda un cuadro pedido");
  e.oculto = false;
  e.emitir("visibilitychange");
  e.correr(500);
  assert.ok(a.cuenta.dibujos - antes >= 8, "al volver, retoma");
});
await prueba("se detiene cuando el canvas sale de pantalla (IntersectionObserver) y vuelve al entrar", async () => {
  const e = entornoFalso();
  const a = crear(e);
  a.bucle.iniciar();
  e.correr(300);
  e.io.emitir(false);
  const antes = a.cuenta.dibujos;
  e.correr(1000);
  assert.ok(a.cuenta.dibujos - antes <= 1);
  assert.equal(e.cola.size, 0);
  e.io.emitir(true);
  e.correr(500);
  assert.ok(a.cuenta.dibujos - antes >= 8);
});
await prueba("no dibuja el reposo mientras una animación de ejecución ya está dibujando cada cuadro", async () => {
  const e = entornoFalso();
  let ocupado = true;
  const a = crear(e, { ocupado: () => ocupado });
  a.bucle.iniciar();
  e.correr(1000);
  assert.equal(a.cuenta.dibujos, 0);
  ocupado = false;
  e.correr(500);
  assert.ok(a.cuenta.dibujos > 5);
});
await prueba("detener() cancela el cuadro pendiente, suelta los oyentes y no queda nada vivo; iniciar dos veces no duplica", async () => {
  const e = entornoFalso();
  const a = crear(e);
  a.bucle.iniciar();
  a.bucle.iniciar();
  e.correr(200);
  assert.equal(e.cola.size, 1, "un solo cuadro pedido, aunque se haya iniciado dos veces");
  a.bucle.detener();
  assert.equal(e.cola.size, 0);
  assert.equal(e.oyentes.visibilitychange.size, 0);
  assert.equal(e.io, null, "el observador se desconecta");
  const antes = a.cuenta.dibujos;
  e.correr(500);
  assert.equal(a.cuenta.dibujos, antes);
  assert.equal(a.bucle.activo, false);
});
await prueba("si el canvas ya no está en la página el bucle se apaga solo", async () => {
  const e = entornoFalso();
  const a = crear(e);
  a.bucle.iniciar();
  e.correr(200);
  a.canvas.isConnected = false;
  e.correr(300);
  assert.equal(a.bucle.activo, false);
  assert.equal(e.cola.size, 0);
});

console.log("Adaptación automática");
await prueba("auto: si dibujar tarda demasiado baja los cuadros (24 → 15 → 8) y apaga los resplandores", async () => {
  const e = entornoFalso();
  e.costoDibujo = 20; // un equipo lento: 20 ms por dibujo
  const a = crear(e);
  assert.equal(a.bucle.fps, 24);
  a.bucle.iniciar();
  e.correr(6000);
  assert.equal(a.bucle.fps, 8, "bajó hasta el mínimo");
  assert.equal(calidad.bajo, true, "sin resplandores");
  assert.equal(brilloCalidad(18), 0);
});
await prueba("auto: si todo va sobrado vuelve a subir y reactiva los resplandores", async () => {
  const e = entornoFalso();
  e.costoDibujo = 20;
  const a = crear(e);
  a.bucle.iniciar();
  e.correr(4000);
  assert.ok(a.bucle.nivel > 0);
  e.costoDibujo = 0.5;
  e.correr(20000);
  assert.equal(a.bucle.nivel, 0);
  assert.equal(calidad.bajo, false);
  assert.equal(brilloCalidad(18), 18);
});
await prueba("en modo completas NO se adapta (el estudiante pidió todos los efectos)", async () => {
  const e = entornoFalso();
  e.costoDibujo = 30;
  const a = crear(e, { modo: () => "completas" });
  a.bucle.iniciar();
  e.correr(3000);
  assert.equal(a.bucle.fps, 30);
  assert.equal(calidad.bajo, false);
});

console.log("Modo elegido por la persona");
const almacenFalso = () => {
  const m = new Map();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)) };
};
await prueba("el modo se guarda, se lee y los valores raros caen a «auto»", async () => {
  globalThis.window = { dispatchEvent() {}, addEventListener() {}, removeEventListener() {} };
  const a = almacenFalso();
  assert.equal(leerModo(a), "auto");
  guardarModo("ligeras", a);
  assert.equal(leerModo(a), "ligeras");
  assert.equal(calidad.bajo, true, "«ligeras» apaga los resplandores");
  guardarModo("completas", a);
  assert.equal(calidad.bajo, false);
  a.setItem("codequest:animaciones", "raro");
  assert.equal(leerModo(a), "auto");
  guardarModo("inexistente", a);
  assert.equal(leerModo(a), "auto");
  aplicarModo("ligeras");
  assert.equal(calidad.bajo, true);
  delete globalThis.window;
});
await prueba("escucharModo avisa de los cambios y devuelve cómo dejar de escuchar", async () => {
  const oyentes = new Set();
  globalThis.window = { addEventListener: (t, f) => t === EVENTO_MODO && oyentes.add(f), removeEventListener: (t, f) => oyentes.delete(f) };
  let avisos = 0;
  const parar = escucharModo(() => avisos++);
  [...oyentes].forEach((f) => f());
  assert.equal(avisos, 1);
  parar();
  assert.equal(oyentes.size, 0);
  delete globalThis.window;
  assert.doesNotThrow(() => escucharModo(() => {})(), "sin window no falla");
});

console.log("Resplandores y capas en caché");
await prueba("conBrillo dibuja el resplandor en calidad alta y lo omite en calidad baja", async () => {
  const mk = () => ({ props: {}, save() {}, restore() {}, set shadowBlur(v) { this.props.blur = v; }, set shadowColor(v) { this.props.color = v; } });
  const a = mk();
  conBrillo(a, "#0ff", 20, () => {});
  assert.equal(a.props.blur, 20);
  calidad.bajo = true;
  const b = mk();
  let dibujo = 0;
  conBrillo(b, "#0ff", 20, () => dibujo++);
  assert.equal(b.props.blur, undefined, "sin shadowBlur");
  assert.equal(dibujo, 1, "pero la forma se dibuja igual");
});
await prueba("capaCacheada pinta UNA vez y luego solo copia; se rehace si cambia el tamaño o la variante", async () => {
  let creados = 0;
  const lienzos = [];
  globalThis.window = { devicePixelRatio: 2 };
  globalThis.document = {
    createElement: () => {
      creados++;
      const c = { width: 0, height: 0, getContext: () => ({ setTransform() {} }) };
      lienzos.push(c);
      return c;
    },
  };
  let copias = 0;
  const ctx = { drawImage: () => copias++ };
  const duenio = {};
  let pintados = 0;
  const pintar = () => pintados++;
  for (let i = 0; i < 100; i++) capaCacheada(duenio, "fondo", ctx, 400, 300, "a", pintar);
  assert.equal(pintados, 1, "100 cuadros, un solo pintado");
  assert.equal(copias, 100);
  assert.deepEqual([lienzos[0].width, lienzos[0].height], [800, 600], "la caché guarda píxeles físicos (dpr 2)");
  capaCacheada(duenio, "fondo", ctx, 500, 300, "a", pintar);
  assert.equal(pintados, 2, "otro tamaño: se rehace");
  capaCacheada(duenio, "fondo", ctx, 500, 300, "b", pintar);
  assert.equal(pintados, 3, "otra variante: se rehace");
  capaCacheada(duenio, "fondo", ctx, 500, 300, "b", pintar);
  assert.equal(pintados, 3);
  // sin canvas auxiliar (pruebas / navegador raro): se pinta directo y sigue funcionando
  globalThis.document = { createElement: () => ({ getContext: () => null }) };
  const otro = {};
  let directo = 0;
  capaCacheada(otro, "fondo", { drawImage() { throw new Error("no debe copiar"); } }, 400, 300, "a", () => directo++);
  capaCacheada(otro, "fondo", { drawImage() { throw new Error("no debe copiar"); } }, 400, 300, "a", () => directo++);
  assert.equal(directo, 2);
  delete globalThis.document;
  delete globalThis.window;
});

console.log("Ciclo de vida de los escenarios");
await prueba("cada escenario nuevo deja UN solo bucle vivo si se destruye el anterior (antes se acumulaban)", async () => {
  const e = entornoFalso();
  globalThis.requestAnimationFrame = e.raf;
  globalThis.cancelAnimationFrame = e.caf;
  globalThis.performance = { now: () => e.t };
  globalThis.window = { devicePixelRatio: 1, innerHeight: 800, addEventListener() {}, removeEventListener() {}, matchMedia: () => ({ matches: false }) };
  const ctx = new Proxy({}, { get: (o, k) => (k === "measureText" ? () => ({ width: 5 }) : k === "createLinearGradient" || k === "createRadialGradient" ? () => ({ addColorStop() {} }) : () => {}), set: () => true });
  const canvas = { getContext: () => ctx, width: 600, height: 400, isConnected: true, style: {}, parentElement: { clientWidth: 600 } };
  // como hacía juego.js ANTES: crear el siguiente sin destruir el anterior → los bucles se acumulan
  const sinDestruir = [];
  for (let i = 0; i < 5; i++) sinDestruir.push(new EscenarioDatos({ tipo: "datos" }, { canvas }));
  e.correr(100);
  assert.equal(e.cola.size, 5, "sin destruir, 5 escenarios = 5 bucles vivos (el bug)");
  sinDestruir.forEach((s) => s.destruir());
  assert.equal(e.cola.size, 0, "destruir() los detiene todos");
  // como hace juego.js AHORA
  let actual = null;
  for (let i = 0; i < 5; i++) {
    actual?.destruir();
    actual = new EscenarioDatos({ tipo: "datos" }, { canvas });
  }
  e.correr(100);
  assert.equal(e.cola.size, 1, "destruyendo el anterior queda UN solo bucle");
  actual.destruir();
  assert.equal(e.cola.size, 0);
  assert.equal(actual.destruido, true);
  delete globalThis.requestAnimationFrame;
  delete globalThis.cancelAnimationFrame;
  delete globalThis.performance;
  delete globalThis.window;
});

console.log(`\n${n} pruebas correctas.`);
process.exit(0);
