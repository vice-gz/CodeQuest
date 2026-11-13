// chipsInsercion.js
// Botones de inserción rápida: cada instrucción disponible del panel «Aprende» es un botón que escribe su sintaxis de Python en el
// editor, en la posición del cursor. El marcador «|» de cada plantilla indica dónde queda el cursor después de insertar.
//   print  →  print(|)        if  →  if |:  (con el cuerpo ya sangrado)        and  →  « and »
// La lógica (calcularInsercion) es pura —recibe el texto y la selección y devuelve qué insertar y dónde dejar el cursor—, así se
// prueba sin navegador.

// expresion: true  → se inserta «en línea» (int(), and, True…); false → es una sentencia: si el cursor ya está después de texto,
//                    se abre una línea nueva con la misma sangría.
export const PLANTILLAS = {
  asignacion: { plantilla: "variable = |", expresion: false },
  print: { plantilla: "print(|)", expresion: false },
  input: { plantilla: "input(|)", expresion: true },
  int: { plantilla: "int(|)", expresion: true },
  float: { plantilla: "float(|)", expresion: true },
  str: { plantilla: "str(|)", expresion: true },
  round: { plantilla: "round(|)", expresion: true },
  if: { plantilla: "if |:\n    ", expresion: false },
  elif: { plantilla: "elif |:\n    ", expresion: false },
  else: { plantilla: "else:\n    |", expresion: false },
  while: { plantilla: "while |:\n    ", expresion: false },
  for: { plantilla: "for i in range(|):\n    ", expresion: false },
  and: { plantilla: " and ", expresion: true },
  or: { plantilla: " or ", expresion: true },
  not: { plantilla: "not ", expresion: true },
  booleanos: { plantilla: "True", expresion: true },
  def: { plantilla: "def nombre(|):\n    ", expresion: false },
  return: { plantilla: "return |", expresion: false },
};

/** Plantilla de un método de un objeto del escenario: robot1.avanzar(|) */
export const plantillaMetodo = (objeto, metodo) => ({ plantilla: `${objeto}.${metodo}(|)`, expresion: false });

/**
 * @param {string} valor      texto actual del editor
 * @param {number} inicio     inicio de la selección
 * @param {number} fin        fin de la selección
 * @param {{plantilla:string, expresion:boolean}} p
 * @returns {{texto:string, atras:number}} qué insertar y cuántos caracteres hay que retroceder el cursor
 */
export function calcularInsercion(valor, inicio, fin, p) {
  const antes = valor.slice(0, inicio);
  const despues = valor.slice(fin);
  const linea = antes.slice(antes.lastIndexOf("\n") + 1);
  const sangria = /^[ \t]*/.exec(linea)[0];
  const hayTextoAntes = linea.trim() !== "";

  let plantilla = p.plantilla;
  if (p.expresion) {
    // «and»/«or»: sin espacios dobles si ya hay uno al lado
    if (plantilla.startsWith(" ") && /\s$/.test(antes)) plantilla = plantilla.slice(1);
    if (plantilla.endsWith(" ") && /^\s/.test(despues)) plantilla = plantilla.slice(0, -1);
  }
  const marca = plantilla.indexOf("|");
  const a = marca === -1 ? plantilla : plantilla.slice(0, marca);
  const b = marca === -1 ? "" : plantilla.slice(marca + 1);
  // las líneas siguientes (el cuerpo del bloque) heredan la sangría de la línea donde se inserta
  const conSangria = (t) => t.replace(/\n/g, `\n${sangria}`);
  const prefijo = !p.expresion && hayTextoAntes ? `\n${sangria}` : "";
  const parteA = prefijo + conSangria(a);
  const parteB = conSangria(b);
  return { texto: parteA + parteB, atras: parteB.length };
}

/** Inserta una plantilla en el editor (CodeEditor) donde esté el cursor y avisa del cambio. */
export function insertarEnEditor(editor, plantilla) {
  const ta = editor.textarea;
  if (!ta || ta.disabled) return false;
  const { texto, atras } = calcularInsercion(ta.value, ta.selectionStart, ta.selectionEnd, plantilla);
  editor.insertarTexto(texto, atras);
  ta.dispatchEvent(new Event("input", { bubbles: true })); // contador de líneas, autoguardado…
  return true;
}
