// dictionary.js
// Diccionario de instrucciones: una referencia de consulta que se va
// desbloqueando conforme el estudiante COMPLETA la fase donde cada
// instrucción se enseña.
//
// Diferencia con las pistas: el diccionario nunca dice cómo resolver la
// fase actual. Describe qué hace una instrucción y su forma general
// (robot1.girar(direccion)), no la línea concreta que falta. Por eso una
// fase de corregir sintaxis no se arruina: el diccionario dice que print
// muestra un texto entre comillas, pero no muestra el código corregido.

// Catálogo completo. `desbloqueaEn` es el id de la fase que la enseña.
export const CATALOGO = [
  {
    id: "print",
    firma: 'print(valor)',
    categoria: "Salida",
    descripcion: "Muestra un valor en el panel de Salida. El texto va entre comillas.",
    desbloqueaEn: "1.1",
  },
  {
    id: "avanzar",
    firma: "robot1.avanzar(n)",
    categoria: "Movimiento",
    descripcion: "Robot1 avanza n casillas en la dirección a la que mira.",
    desbloqueaEn: "2.1",
  },
  {
    id: "hablar",
    firma: 'robot1.hablar("texto")',
    categoria: "Salida",
    descripcion:
      "Robot1 dice un texto: aparece una burbuja en el mundo 2D y una línea en Salida. No es lo mismo que print().",
    desbloqueaEn: "3.1",
  },
  {
    id: "girar",
    firma: 'robot1.girar(direccion)',
    categoria: "Movimiento",
    descripcion:
      'Cambia hacia dónde mira Robot1. Direcciones válidas: "norte", "sur", "este", "oeste".',
    desbloqueaEn: "3.3",
  },
  {
    id: "retroceder",
    firma: "robot1.retroceder(n)",
    categoria: "Movimiento",
    descripcion:
      "Robot1 retrocede n casillas sin cambiar la dirección a la que mira.",
    desbloqueaEn: "4.1",
  },
  {
    id: "entrada",
    firma: "input()",
    categoria: "Entrada",
    descripcion:
      'Pausa el programa y pide un dato a quien está jugando. Como en Python, input() SIEMPRE devuelve texto, aunque se escriba un número: si lo necesitas como número, conviértelo con int() o float(). Puede llevar un mensaje: input("¿Cuántos pisos?").',
    desbloqueaEn: "6.1",
  },
  {
    id: "int",
    firma: "int(valor)",
    categoria: "Conversión",
    descripcion:
      'Convierte un valor en número entero: int("12") vale 12 y int(3.9) vale 3. Si el texto no parece un número entero (int("hola"), int("3.5")) da un ValueError. Lo típico: int(input()).',
    desbloqueaEn: "6.3",
  },
  {
    id: "float",
    firma: "float(valor)",
    categoria: "Conversión",
    descripcion: 'Convierte un valor en número decimal: float("3.5") vale 3.5 y float(3) vale 3.0. Si el texto no parece un número, da un ValueError.',
    desbloqueaEn: "14.4",
  },
  {
    id: "str",
    firma: "str(valor)",
    categoria: "Conversión",
    descripcion: 'Convierte un valor en texto: str(5) vale "5". Sirve para unir números con textos: "Total: " + str(5).',
    desbloqueaEn: "16.4",
  },
  {
    id: "recoger",
    firma: "robot1.recoger()",
    categoria: "Objetos",
    descripcion: "Recoge el objeto que haya en la casilla donde está Robot1.",
    desbloqueaEn: "8.1",
  },
  {
    id: "asignacion",
    firma: "nombre = valor",
    categoria: "Variables",
    descripcion:
      "Guarda un valor con un nombre para reutilizarlo después. Aparece en el panel de Memoria.",
    desbloqueaEn: "9.1",
  },
  {
    id: "operadores",
    firma: "+  -  *  /  **",
    categoria: "Operadores",
    descripcion:
      "Operaciones aritméticas. Primero se resuelve ** (potencia), después * y /, y al final + y -, igual que en matemáticas. Ojo: / SIEMPRE da un decimal (10 / 2 vale 5.0).",
    desbloqueaEn: "12.2",
  },
  {
    id: "modulo",
    firma: "a // b   a % b",
    categoria: "Operadores",
    descripcion: "a // b es la división entera (solo la parte entera: 17 // 4 vale 4). a % b devuelve el residuo (17 % 5 vale 2).",
    desbloqueaEn: "13.1",
  },
  {
    id: "energia",
    firma: "robot1.energia()",
    categoria: "Estado",
    descripcion: "Devuelve la energía que le queda a Robot1. Pruébala en el Laboratorio Libre.",
    desbloqueaEn: "8.3",
  },
  {
    id: "posicion",
    firma: "robot1.posicion()",
    categoria: "Estado",
    descripcion: "Devuelve la posición actual de Robot1 como (columna,fila). Pruébala en el Laboratorio Libre.",
    desbloqueaEn: "8.3",
  },
  {
    id: "mirar",
    firma: "robot1.mirar()",
    categoria: "Estado",
    descripcion: "Devuelve la dirección hacia la que mira Robot1. Pruébala en el Laboratorio Libre.",
    desbloqueaEn: "8.3",
  },
  // ----- Mundo 3: decisiones -----
  {
    id: "if",
    firma: "if condición:",
    categoria: "Decisiones",
    descripcion: "Ejecuta las líneas con sangría solo si la condición es verdadera (True). Si es falsa, las salta.",
    desbloqueaEn: "20.1",
  },
  {
    id: "else",
    firma: "else:",
    categoria: "Decisiones",
    descripcion: "El camino alternativo de un if: se ejecuta cuando la condición del if es falsa.",
    desbloqueaEn: "21.1",
  },
  {
    id: "comparadores",
    firma: "==  !=  <  >  <=  >=",
    categoria: "Decisiones",
    descripcion: "Comparan dos valores y dan True o False. Ojo: un solo = guarda un valor; dos == preguntan si son iguales.",
    desbloqueaEn: "22.1",
  },
  {
    id: "and_or",
    firma: "a and b   a or b",
    categoria: "Decisiones",
    descripcion: "and es verdadero si AMBAS condiciones lo son; or, si al menos UNA lo es.",
    desbloqueaEn: "24.1",
  },
  {
    id: "not_booleanos",
    firma: "not x   True   False",
    categoria: "Decisiones",
    descripcion: "True y False son valores lógicos que se pueden guardar en variables. not invierte uno: not True es False.",
    desbloqueaEn: "25.1",
  },
  {
    id: "elif",
    firma: "elif condición:",
    categoria: "Decisiones",
    descripcion: "Añade otra pregunta a un if. Se evalúan en orden y solo se ejecuta la primera rama verdadera.",
    desbloqueaEn: "26.1",
  },
  {
    id: "mesa_poner_carta",
    firma: "mesa.poner_carta(valor, color)",
    categoria: "Decisiones",
    descripcion: 'Pone una carta nueva en la mesa; color es "roja" o "negra". Es solo visual: no cambia total ni carta1. Pruébala en la Mesa libre.',
    desbloqueaEn: "28.3",
  },
  {
    id: "mesa_voltear",
    firma: "mesa.voltear()",
    categoria: "Decisiones",
    descripcion: "Voltea las cartas de la mesa: las que están boca abajo se muestran y, si ya están todas visibles, las vuelve a tapar.",
    desbloqueaEn: "28.3",
  },
  // ----- Mundo 4: ciclos y elevador -----
  {
    id: "while",
    firma: "while condición:",
    categoria: "Ciclos",
    descripcion: "Repite sus líneas con sangría MIENTRAS la condición sea verdadera. Dentro hay que cambiar algo, o no termina.",
    desbloqueaEn: "32.1",
  },
  {
    id: "for",
    firma: "for i in range(n):",
    categoria: "Ciclos",
    descripcion: "Repite n veces. range(n) cuenta de 0 a n-1; range(a, b) de a a b-1; range(a, b, paso) salta de paso en paso.",
    desbloqueaEn: "33.1",
  },
  {
    id: "elevador_subir",
    firma: "elevador.subir(n)",
    categoria: "Elevador",
    descripcion: "Sube el elevador n pisos. Si se sale del edificio (pisos 1 a 5) da error.",
    desbloqueaEn: "32.1",
  },
  {
    id: "elevador_bajar",
    firma: "elevador.bajar(n)",
    categoria: "Elevador",
    descripcion: "Baja el elevador n pisos. El piso 1 es la planta baja.",
    desbloqueaEn: "34.1",
  },
  {
    id: "elevador_piso",
    firma: "elevador.piso()",
    categoria: "Elevador",
    descripcion: "Devuelve el piso donde está el elevador. Sirve para las condiciones de un while.",
    desbloqueaEn: "36.2",
  },
  {
    id: "elevador_recoger",
    firma: "elevador.recoger()",
    categoria: "Elevador",
    descripcion: "Sube a la cabina a los pasajeros que esperan en este piso (caben 4). Con elevador.hayPasajero() se sabe si hay alguien.",
    desbloqueaEn: "37.1",
  },
  {
    id: "elevador_soltar",
    firma: "elevador.soltar()",
    categoria: "Elevador",
    descripcion: "Baja de la cabina a todos los pasajeros. En la planta baja quedan entregados.",
    desbloqueaEn: "37.2",
  },
  {
    id: "elevador_llevando",
    firma: "elevador.llevando()",
    categoria: "Elevador",
    descripcion: "Devuelve cuántos pasajeros van en la cabina (personas, no pisos).",
    desbloqueaEn: "40.2",
  },
];

export class Dictionary {
  /**
   * @param {HTMLElement} contenedor - panel donde se dibuja
   * @param {HTMLElement} boton - botón que lo abre/cierra
   * @param {HTMLElement} contadorEl - indicador "n/total"
   */
  constructor(contenedor, boton, contadorEl) {
    this.contenedor = contenedor;
    this.boton = boton;
    this.contadorEl = contadorEl;
    this.desbloqueadas = new Set();
    this.abierto = false;

    this.boton.addEventListener("click", () => this.alternar());
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.abierto) this.cerrar();
    });
  }

  /**
   * Recalcula qué entradas están desbloqueadas a partir del progreso.
   * @param {Set<string>} fasesCompletadas - ids de fase ya superadas
   * @param {boolean} todoDesbloqueado - modo demo: se muestra todo
   */
  actualizar(fasesCompletadas, todoDesbloqueado = false) {
    this.desbloqueadas = new Set(
      CATALOGO.filter(
        (e) => todoDesbloqueado || fasesCompletadas.has(e.desbloqueaEn)
      ).map((e) => e.id)
    );
    this.contadorEl.textContent = `${this.desbloqueadas.size}/${CATALOGO.length}`;
    if (this.abierto) this.render();
  }

  alternar() {
    if (this.abierto) this.cerrar();
    else this.abrir();
  }

  abrir() {
    this.abierto = true;
    this.contenedor.classList.remove("oculto");
    this.boton.setAttribute("aria-expanded", "true");
    this.render();
  }

  cerrar() {
    this.abierto = false;
    this.contenedor.classList.add("oculto");
    this.boton.setAttribute("aria-expanded", "false");
  }

  render() {
    const porCategoria = new Map();
    CATALOGO.forEach((entrada) => {
      if (!this.desbloqueadas.has(entrada.id)) return;
      if (!porCategoria.has(entrada.categoria)) porCategoria.set(entrada.categoria, []);
      porCategoria.get(entrada.categoria).push(entrada);
    });

    const pendientes = CATALOGO.length - this.desbloqueadas.size;

    if (this.desbloqueadas.size === 0) {
      this.contenedor.innerHTML = `
        <div class="dic-encabezado">
          <h2>Diccionario</h2>
          <button type="button" class="dic-cerrar" aria-label="Cerrar">✕</button>
        </div>
        <p class="panel-vacio">Todavía no has aprendido ninguna instrucción. Se irán guardando aquí conforme completes las fases.</p>`;
      this.contenedor.querySelector(".dic-cerrar").addEventListener("click", () => this.cerrar());
      return;
    }

    let html = `
      <div class="dic-encabezado">
        <h2>Diccionario</h2>
        <button type="button" class="dic-cerrar" aria-label="Cerrar">✕</button>
      </div>
      <p class="dic-intro">Instrucciones que ya aprendiste. Puedes consultarlas cuando quieras.</p>`;

    for (const [categoria, entradas] of porCategoria) {
      html += `<h3 class="dic-categoria">${categoria}</h3><div class="dic-lista">`;
      entradas.forEach((e) => {
        html += `
          <article class="dic-entrada">
            <code class="dic-firma"></code>
            <p class="dic-descripcion"></p>
          </article>`;
      });
      html += `</div>`;
    }

    if (pendientes > 0) {
      html += `<p class="dic-pendientes">${pendientes} instrucción(es) más se desbloquearán conforme avances.</p>`;
    }

    this.contenedor.innerHTML = html;

    // El texto se inserta como textContent, no como HTML.
    const firmas = this.contenedor.querySelectorAll(".dic-firma");
    const descripciones = this.contenedor.querySelectorAll(".dic-descripcion");
    const planas = [...porCategoria.values()].flat();
    planas.forEach((e, i) => {
      firmas[i].textContent = e.firma;
      descripciones[i].textContent = e.descripcion;
    });

    this.contenedor.querySelector(".dic-cerrar").addEventListener("click", () => this.cerrar());
  }
}
