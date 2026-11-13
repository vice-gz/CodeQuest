// puerta.js
// Mundo 6 · Nivel 2 «El validador de contraseñas»: una compuerta de seguridad en pixel art.
// El sistema ya midió la clave y deja tres datos en la memoria (contrasena, longitud, tiene_numero): la escena los MUESTRA como
// instrumentos (pantallita con la clave, barra de LEDs con la marca en el 8, detector de números). Lo que el estudiante programa es
// la DECISIÓN: dos relés (largo y número) alimentan una compuerta lógica Y, y solo si los dos cierran el circuito se abre la puerta.
//   · print("Contraseña segura") → los cerrojos se retiran y la puerta sube.
//   · print("Contraseña débil")  → luz roja, los cerrojos vibran y la puerta sigue cerrada.
//   · Después de cualquier resultado, los relés muestran su estado REAL (verde/rojo): así se ve por qué la clave pasó o no.
// Esta escena no pide teclear nada: se ven los casos con las lámparas de abajo.

import { EscenarioPixel, LW, LH, limitar } from "./pixelBase.js";
import { PAL, px, escribir, pintarNix, linea } from "../pixel.js";

const MARCO = { x: 44, y: 10, w: 74, h: 86 }; // hueco de la puerta

export class EscenarioPuerta extends EscenarioPixel {
  constructor(config, opciones) {
    super(config, opciones);
    this.iniciarReposo();
  }

  get tipo() {
    return "puerta";
  }
  get tituloPanel() {
    return "Taller de proyectos · Compuerta de seguridad";
  }
  get textoObserva() {
    return "Ejecuta tu programa: si la clave pasa, los dos relés cierran el circuito y la puerta se abre.";
  }

  // datos que dejó el sistema (vienen de los casos: escenario.variables)
  get clave() {
    return String(this.config.variables?.contrasena ?? "");
  }
  get longitud() {
    return Number(this.config.variables?.longitud ?? this.clave.length) || 0;
  }
  get tieneNumero() {
    return Boolean(this.config.variables?.tiene_numero);
  }

  reiniciarModelo() {
    super.reiniciarModelo();
    this.puerta = 0; // 0 cerrada … 1 abierta
    this.cerrojo = 0; // 0 echado … 1 retirado
    this.rele1 = null; // largo > 8
    this.rele2 = null; // tiene número
    this.acceso = null; // true abierto, false denegado
    this.alarma = 0;
    this.vibra = 0;
  }

  snapshot() {
    return { longitud: this.longitud, tieneNumero: this.tieneNumero };
  }

  async alImprimir(texto) {
    this.lcd = texto;
    if (/segura/i.test(texto) && !/d[eé]bil/i.test(texto)) await this.abrir();
    else if (/d[eé]bil/i.test(texto)) await this.denegar();
    else await this.esperar(160);
  }

  mostrarReles() {
    this.rele1 = this.longitud > 8;
    this.rele2 = this.tieneNumero;
  }

  async abrir() {
    this.mostrarReles();
    this.acceso = true;
    this.nix = "feliz";
    await this.animar(300, (t) => {
      this.cerrojo = t;
    });
    await this.animar(700, (t) => {
      this.puerta = t;
    });
  }

  async denegar() {
    this.mostrarReles();
    this.acceso = false;
    this.nix = "preocupado";
    for (let i = 0; i < 3; i++) {
      this.alarma = 1;
      this.vibra = 1;
      await this.esperar(120);
      this.render();
      this.alarma = 0;
      this.vibra = 0;
      await this.esperar(90);
      this.render();
    }
  }

  // ---------------------------------------------------------------- arte
  pintarEstatico(c) {
    // pared de ladrillo y piso
    px(c, 0, 0, LW, 96, "#2b2f4a");
    for (let y = 0, fila = 0; y < 96; y += 8, fila++) {
      px(c, 0, y, LW, 1, "#232640");
      for (let x = fila % 2 ? 0 : 8; x < LW; x += 16) px(c, x, y, 1, 8, "#232640");
    }
    px(c, 0, 96, LW, 16, PAL.pizarra);
    px(c, 0, 96, LW, 1, PAL.negro);
    for (let x = 4; x < LW; x += 18) px(c, x, 97, 1, 15, "#2a3150");

    // marco de la compuerta
    px(c, MARCO.x - 3, MARCO.y - 3, MARCO.w + 6, MARCO.h + 6, PAL.negro);
    px(c, MARCO.x - 2, MARCO.y - 2, MARCO.w + 4, MARCO.h + 4, PAL.grisOscuro);
    px(c, MARCO.x, MARCO.y, MARCO.w, MARCO.h, "#10162b");

    // panel de instrumentos
    px(c, 126, 8, 70, 90, PAL.negro);
    px(c, 127, 9, 68, 88, PAL.pizarra);
    escribir(c, "CLAVE", 131, 12, PAL.amarillo);
    px(c, 130, 19, 61, 10, PAL.negro);
    escribir(c, "LARGO", 131, 32, PAL.cian);
    px(c, 130, 38, 62, 10, PAL.negro);
    for (let i = 0; i < 12; i++) px(c, 132 + i * 5, 40, 4, 6, "#1d2238");
    px(c, 132 + 8 * 5 - 1, 36, 1, 14, PAL.blanco); // la marca: hay que PASAR el 8
    escribir(c, "MAS DE 8", 131, 51, PAL.gris);
    escribir(c, "NUMERO", 131, 59, PAL.cian);
    px(c, 130, 65, 30, 11, PAL.negro);
    px(c, 131, 66, 28, 9, "#10162b");

    // circuito: relé 1 y relé 2 → compuerta Y → luz de acceso
    escribir(c, "R1", 131, 80, PAL.gris);
    escribir(c, "R2", 131, 89, PAL.gris);
    px(c, 154, 79, 14, 15, PAL.vino);
    px(c, 154, 79, 14, 1, PAL.negro);
    escribir(c, "Y", 159, 84, PAL.amarillo);
  }

  pintarDinamico(c, ahora) {
    // detrás de la puerta: se ve luz cuando se abre
    if (this.puerta > 0) {
      px(c, MARCO.x, MARCO.y, MARCO.w, MARCO.h, "#0f3b2a");
      for (let i = 0; i < 6; i++) px(c, MARCO.x + 8 + i * 11, MARCO.y, 4, MARCO.h, "rgba(167,240,112,0.18)");
      px(c, MARCO.x, MARCO.y + MARCO.h - 8, MARCO.w, 8, "#1c5a3e");
    }

    // hoja de la puerta (sube hacia el techo)
    const desplaza = -Math.round(MARCO.h * this.puerta);
    c.save();
    c.beginPath();
    c.rect(MARCO.x, MARCO.y, MARCO.w, MARCO.h);
    c.clip();
    px(c, MARCO.x, MARCO.y + desplaza, MARCO.w, MARCO.h, "#6c7f9e");
    px(c, MARCO.x, MARCO.y + desplaza, MARCO.w, 2, "#8da0bf");
    for (let j = 0; j < 5; j++) {
      px(c, MARCO.x + 3, MARCO.y + desplaza + 8 + j * 16, MARCO.w - 6, 1, "#4d5d7a");
      for (const x of [MARCO.x + 5, MARCO.x + MARCO.w - 7]) px(c, x, MARCO.y + desplaza + 4 + j * 16, 2, 2, "#2d3850");
    }
    // rueda de la cerradura
    const cx = MARCO.x + MARCO.w / 2;
    const cy = MARCO.y + 43 + desplaza;
    px(c, cx - 8, cy - 8, 16, 16, "#4d5d7a");
    px(c, cx - 6, cy - 6, 12, 12, PAL.gris);
    px(c, cx - 1, cy - 7, 2, 14, "#4d5d7a");
    px(c, cx - 7, cy - 1, 14, 2, "#4d5d7a");
    px(c, cx - 2, cy - 2, 4, 4, PAL.amarillo);
    c.restore();

    // cerrojos (se retiran hacia los lados; vibran si se deniega)
    const temblor = this.vibra ? (Math.floor(ahora / 40) % 2 ? 1 : -1) : 0;
    // Los cerrojos se «recogen» hacia sus soportes (se acortan) en vez de salir volando sobre el panel de instrumentos.
    const largo = Math.round(24 - 20 * this.cerrojo);
    const colorCerrojo = this.acceso === false ? PAL.rojo : this.acceso === true ? PAL.verde : PAL.amarillo;
    const izq = MARCO.x - 6 + temblor; // anclado a la pared de la izquierda
    const der = MARCO.x + MARCO.w + 6 + temblor; // anclado al panel de la derecha (borde en 124)
    px(c, izq, 50, largo, 7, colorCerrojo);
    px(c, izq, 50, largo, 1, PAL.blanco);
    px(c, der - largo, 50, largo, 7, colorCerrojo);
    px(c, der - largo, 50, largo, 1, PAL.blanco);

    // pantallita de la clave
    const texto = this.lcd && !/segura|d[eé]bil/i.test(this.lcd) ? this.lcd : this.clave || "????";
    this.pintarLcd(c, 131, 20, 59, texto.slice(0, 40), PAL.verdeClaro, ahora);

    // barra de LEDs del largo (los 8 primeros ámbar, del 9.º en adelante verdes) + el número
    const lon = limitar(this.longitud, 0, 12);
    for (let i = 0; i < 12; i++) {
      const encendido = i < lon;
      px(c, 132 + i * 5, 40, 4, 6, encendido ? (i < 8 ? PAL.amarillo : PAL.verdeClaro) : "#1d2238");
    }
    escribir(c, String(this.longitud), 178, 32, PAL.blanco);

    // detector de números
    escribir(c, "123", 134, 68, this.tieneNumero ? PAL.verdeClaro : PAL.grisOscuro);
    escribir(c, this.tieneNumero ? "SI" : "NO", 149, 68, this.tieneNumero ? PAL.verdeClaro : PAL.naranja);

    // relés y compuerta Y: se iluminan con el estado REAL cuando ya hubo un resultado
    const colorRele = (r) => (r === null ? PAL.pizarra : r ? PAL.verde : PAL.rojo);
    px(c, 142, 79, 6, 6, PAL.negro);
    px(c, 143, 80, 4, 4, colorRele(this.rele1));
    px(c, 142, 88, 6, 6, PAL.negro);
    px(c, 143, 89, 4, 4, colorRele(this.rele2));
    const hilo = (ok) => (ok === null ? "#3d456a" : ok ? PAL.verdeClaro : PAL.rojo);
    linea(c, 148, 82, 153, 82, hilo(this.rele1));
    linea(c, 148, 91, 153, 91, hilo(this.rele2));
    const ambos = this.rele1 === null ? null : this.rele1 && this.rele2;
    linea(c, 168, 86, 173, 86, hilo(ambos));

    // luz de acceso
    const luz = this.acceso === null ? (Math.floor(ahora / 500) % 2 ? PAL.amarillo : PAL.pizarra) : this.acceso ? PAL.verdeClaro : this.alarma ? PAL.blanco : PAL.rojo;
    px(c, 174, 81, 12, 12, PAL.negro);
    px(c, 175, 82, 10, 10, luz);
    escribir(c, this.acceso === true ? "OK" : this.acceso === false ? "NO" : "", 177, 85, PAL.negro);

    // lámparas de los casos (bajo la puerta) y Nix
    this.pintarCasos(c, 52, 101, 12);
    const sube = Math.round(Math.sin(ahora / 420));
    const cara = this.nix === "normal" && ahora % 3300 < 140 ? "parpadeo" : this.nix;
    pintarNix(c, 6, 62 + sube, cara, 2);
  }
}
