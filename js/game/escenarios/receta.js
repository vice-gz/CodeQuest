// receta.js
// Mundo 1 · Nivel 12 «La Receta» (operadores * y /, y redondear: int(x + 0.5) o round(x)).
// Una tarjeta de receta con sus ingredientes y una mesa con los platos de los invitados. Cada ingrediente es una variable
// (config.ingredientes): cuando el programa calcula la nueva cantidad, el renglón se ilumina y se dibujan los huevos (o las
// tazas) que hacen falta. Si una cantidad que se cuenta por piezas queda con decimales (4.5 huevos) se marca en amarillo:
// no se puede romper medio huevo, hay que redondear.
//
// config: { tipo: "receta", invitadosBase: 4, ingredientes: [{ nombre: "huevos", unidad: "pzas", piezas: true }, ...] }
// Variables útiles: invitados (cuántas personas comen) y factor (invitados / invitadosBase).

import { EscenarioMinijuego, COLORES, num, mostrar } from "./minijuego.js";
import { rr, texto, FUENTE, FUENTE_MONO } from "./dibujo.js";

export class EscenarioReceta extends EscenarioMinijuego {
  get tipo() {
    return "receta";
  }
  get tituloPanel() {
    return "La Receta · Cocina";
  }
  get textoObserva() {
    return "Ejecuta el código y observa cómo cambian las cantidades de la receta.";
  }
  get ingredientes() {
    return this.config.ingredientes || [{ nombre: "huevos", unidad: "pzas", piezas: true }];
  }

  dibujarEscena(ctx, z) {
    const angosto = z.w < 520;
    // --- tarjeta de receta
    const tx = z.x + 14;
    const ty = z.y + 12;
    const tw = angosto ? z.w - 28 : z.w * 0.52;
    const filas = this.ingredientes.length + 2; // invitados, factor y cada ingrediente
    const fila = Math.min(28, (angosto ? z.h * 0.55 : z.h - 28) / (filas + 1.4));
    const th = fila * (filas + 1.4); // + el renglón del título
    rr(ctx, tx, ty, tw, th, 10);
    ctx.fillStyle = "#fff8e7";
    ctx.fill();
    texto(ctx, `Receta para ${this.config.invitadosBase ?? 4} personas`, tx + 12, ty + fila * 0.7, { fuente: `700 13px ${FUENTE}`, color: "#6b3b12", align: "left", maxAncho: tw - 24 });
    const filasDatos = [
      { nombre: "invitados", unidad: "personas" },
      { nombre: "factor", unidad: "veces la receta" },
      ...this.ingredientes,
    ];
    filasDatos.forEach((ing, i) => {
      const y = ty + fila * (i + 1.6);
      const v = this.vars[ing.nombre];
      const b = this.brillo(ing.nombre);
      if (b > 0) {
        rr(ctx, tx + 6, y - fila / 2 + 2, tw - 12, fila - 4, 6);
        ctx.fillStyle = `rgba(56, 249, 151, ${0.25 * b + 0.1})`;
        ctx.fill();
      }
      const n = num(v);
      const conDecimales = ing.piezas && n !== null && !Number.isInteger(n);
      texto(ctx, ing.nombre, tx + 14, y, { fuente: `600 12px ${FUENTE_MONO}`, color: "#4a2a0d", align: "left" });
      texto(ctx, v === undefined ? "?" : `${mostrar(v)} ${ing.unidad || ""}`.trim(), tx + tw - 14, y, {
        fuente: `700 12px ${FUENTE_MONO}`,
        color: conDecimales ? "#c27c00" : v === undefined ? "#a08a70" : "#1f6b3a",
        align: "right",
        maxAncho: tw * 0.55,
      });
      if (conDecimales) texto(ctx, "¿medio?", tx + tw * 0.46, y, { fuente: `700 11px ${FUENTE}`, color: "#c27c00" });
    });

    // --- mesa con platos y huevos
    const mx = angosto ? z.x + 14 : tx + tw + 16;
    const my = angosto ? ty + th + 10 : ty;
    const mw = angosto ? z.w - 28 : z.x + z.w - 14 - mx;
    const mh = angosto ? z.y + z.h - my - 8 : th;
    if (mw < 60 || mh < 40) return;
    rr(ctx, mx, my, mw, mh, 12);
    ctx.fillStyle = "#2b2140";
    ctx.fill();
    // platos arriba (tantos como quepan en las filas disponibles), la etiqueta y los huevos abajo
    const invitados = Math.max(0, Math.min(16, Math.floor(num(this.vars.invitados) ?? 0)));
    const paso = mh < 120 ? 22 : 30;
    const radio = paso * 0.36;
    const porFila = Math.max(1, Math.floor((mw - 16) / paso));
    const filasPlatos = Math.max(1, Math.floor((mh - 58) / paso));
    for (let i = 0; i < Math.min(invitados, porFila * filasPlatos); i++) {
      const px = mx + 10 + paso / 2 + (i % porFila) * paso;
      const py = my + 8 + paso / 2 + Math.floor(i / porFila) * paso;
      ctx.beginPath();
      ctx.arc(px, py, radio, 0, Math.PI * 2);
      ctx.fillStyle = "#e9eefc";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(px, py, radio * 0.55, 0, Math.PI * 2);
      ctx.strokeStyle = "#b8c3e0";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    texto(ctx, invitados ? `${invitados} platos` : "invitados = ?", mx + mw - 10, my + mh - 16, { fuente: `600 12px ${FUENTE}`, color: COLORES.suave, align: "right" });
    // huevos (el primer ingrediente que se cuenta por piezas)
    const pieza = this.ingredientes.find((x) => x.piezas);
    const cuantos = pieza ? num(this.vars[pieza.nombre]) : null;
    if (cuantos !== null) {
      const enteros = Math.max(0, Math.min(14, Math.floor(cuantos)));
      const medio = !Number.isInteger(cuantos);
      for (let i = 0; i < enteros + (medio ? 1 : 0); i++) {
        const ex = mx + 18 + i * 18;
        if (ex > mx + mw - 80) break; // deja lugar a la etiqueta de platos
        ctx.beginPath();
        ctx.ellipse(ex, my + mh - 16, 7, 9, 0, 0, i === enteros ? Math.PI : Math.PI * 2);
        ctx.fillStyle = i === enteros ? COLORES.amarillo : "#fff3d6";
        ctx.fill();
      }
    }
  }
}
