// viaje.js
// Mundo 1 · Nivel 19 «El Viaje» (combinar todo: / , * y round(x, 2)).
// Una carretera con un auto y sus pasajeros. Los datos del viaje vienen en cada caso (distancia en km, rendimiento en km por
// litro, precio del litro y pasajeros). Conforme el programa calcula, el auto avanza por la carretera: con `litros` se llena el
// indicador de gasolina, con `costo` aparece el ticket de la gasolinera y con `por_persona` cada pasajero recibe su parte.
// Si por_persona tiene más de 2 decimales (centavos de centavo) se marca: hay que redondear con round(x, 2).
//
// config: { tipo: "viaje", variables: { distancia: 240, rendimiento: 12, precio: 24.5, pasajeros: 3 } }

import { EscenarioMinijuego, COLORES, num, mostrar } from "./minijuego.js";
import { rr, texto, FUENTE, FUENTE_MONO, facilitar } from "./dibujo.js";

const PASOS = ["litros", "costo", "por_persona"];
const decimales = (x) => {
  const t = String(x);
  return t.includes(".") && !t.includes("e") ? t.split(".")[1].length : 0;
};

export class EscenarioViaje extends EscenarioMinijuego {
  get tipo() {
    return "viaje";
  }
  get tituloPanel() {
    return "El Viaje · Carretera";
  }
  get textoObserva() {
    return "Ejecuta el código y acompaña al auto en su viaje.";
  }

  modeloPropio() {
    this.avance = 0;
  }

  async alAsignar(nombre) {
    const i = PASOS.indexOf(nombre);
    if (i === -1) return;
    const desde = this.avance;
    const hasta = Math.max(desde, (i + 1) / PASOS.length);
    await this.animar(500, (t) => {
      this.avance = desde + (hasta - desde) * facilitar(t);
    });
  }

  dibujarEscena(ctx, z) {
    // cielo y carretera
    const ry = z.y + z.h * (z.w < 420 ? 0.62 : 0.5); // en celular la carretera baja para que el ticket no tape el auto
    ctx.fillStyle = "#1a2a4a";
    ctx.fillRect(z.x, z.y, z.w, ry - z.y);
    ctx.fillStyle = "#252b3d";
    ctx.fillRect(z.x, ry, z.w, 46);
    ctx.fillStyle = COLORES.amarillo;
    for (let x = z.x + 8; x < z.x + z.w; x += 36) ctx.fillRect(x, ry + 22, 18, 3);
    // meta
    const metaX = z.x + z.w - 30;
    ctx.fillStyle = "#e9eefc";
    ctx.fillRect(metaX, ry - 40, 3, 40);
    ctx.fillStyle = COLORES.verde;
    ctx.fillRect(metaX + 3, ry - 40, 18, 12);
    texto(ctx, `${num(this.vars.distancia) ?? "?"} km`, z.x + z.w / 2, ry + 60, { fuente: `600 12px ${FUENTE_MONO}`, color: COLORES.suave });
    // auto con pasajeros
    const ax = z.x + 14 + (z.w - 110) * this.avance;
    const ay = ry + 4;
    rr(ctx, ax, ay - 26, 78, 26, 8);
    ctx.fillStyle = COLORES.naranja;
    ctx.fill();
    rr(ctx, ax + 14, ay - 42, 46, 18, 6);
    ctx.fillStyle = "#ffc58a";
    ctx.fill();
    const pasajeros = Math.max(0, Math.min(5, Math.floor(num(this.vars.pasajeros) ?? 0)));
    for (let i = 0; i < pasajeros; i++) {
      ctx.beginPath();
      ctx.arc(ax + 22 + i * 9, ay - 33, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = "#2b2140";
      ctx.fill();
    }
    ctx.fillStyle = "#111";
    for (const dx of [16, 62]) {
      ctx.beginPath();
      ctx.arc(ax + dx, ay, 8, 0, Math.PI * 2);
      ctx.fill();
    }

    // indicador de gasolina (litros)
    const litros = num(this.vars.litros);
    texto(ctx, "Gasolina", z.x + 14, z.y + 16, { fuente: `600 12px ${FUENTE}`, color: COLORES.suave, align: "left" });
    rr(ctx, z.x + 14, z.y + 28, 110, 12, 6);
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fill();
    if (litros !== null) {
      rr(ctx, z.x + 14, z.y + 28, 110 * Math.min(1, litros / 40), 12, 6);
      ctx.fillStyle = COLORES.verde;
      ctx.fill();
    }
    texto(ctx, litros === null ? "litros = ?" : `litros = ${mostrar(this.vars.litros)}`, z.x + 14, z.y + 54, { fuente: `600 12px ${FUENTE_MONO}`, color: this.brillo("litros") > 0 ? COLORES.verde : COLORES.texto, align: "left" });

    // ticket (costo y por_persona)
    const tw = Math.min(210, Math.max(180, z.w * 0.42));
    const tx = z.x + z.w - tw - 10;
    const ty = z.y + 8;
    rr(ctx, tx, ty, tw, 76, 8);
    ctx.fillStyle = "#fffdf5";
    ctx.fill();
    texto(ctx, "TICKET", tx + tw / 2, ty + 13, { fuente: `800 11px ${FUENTE}`, color: "#555" });
    const filas = [
      ["precio", this.vars.precio, "$/litro"],
      ["costo", this.vars.costo, "$"],
      ["por_persona", this.vars.por_persona, "$ c/u"],
    ];
    filas.forEach(([nombre, v, unidad], i) => {
      const y = ty + 31 + i * 16;
      const largo = nombre === "por_persona" && num(v) !== null && decimales(v) > 2;
      texto(ctx, nombre, tx + 8, y, { fuente: `600 10px ${FUENTE_MONO}`, color: "#333", align: "left" });
      texto(ctx, v === undefined ? "?" : `${mostrar(v)} ${unidad}`, tx + tw - 8, y, {
        fuente: `700 10px ${FUENTE_MONO}`,
        color: largo ? "#c27c00" : this.brillo(nombre) > 0 ? "#1f8a4c" : "#1f3a6b",
        align: "right",
        maxAncho: tw - 92, // nunca encima del nombre (por_persona es el más largo)
      });
    });
    if (num(this.vars.por_persona) !== null && decimales(this.vars.por_persona) > 2) {
      texto(ctx, "¿centavos de centavo? usa round(x, 2)", tx + tw / 2, ty + 90, { fuente: `600 11px ${FUENTE}`, color: COLORES.amarillo, maxAncho: tw + 20 });
    }
  }
}
