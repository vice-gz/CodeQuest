// verificar_archivos.mjs — comprueba que TODOS los archivos que se importan existen.
// Sirve cuando se aplican zips de «solo cambios»: si falta un archivo NUEVO, Vite dice «Failed to resolve import …» y esta
// herramienta lista exactamente cuáles faltan y quién los importa.
// Uso (desde la carpeta del proyecto):  node herramientas/verificar_archivos.mjs

import { readdirSync, readFileSync, existsSync, statSync } from "node:fs";
import path from "node:path";

const RAIZ = process.cwd();
const IGNORAR = new Set(["node_modules", "dist", ".git"]);
const faltan = [];
let revisados = 0;

function recorrer(dir) {
  for (const nombre of readdirSync(dir)) {
    if (IGNORAR.has(nombre)) continue;
    const ruta = path.join(dir, nombre);
    if (statSync(ruta).isDirectory()) recorrer(ruta);
    else if (/\.(js|mjs)$/.test(nombre)) revisar(ruta);
    else if (/\.html$/.test(nombre)) revisarHtml(ruta);
  }
}

const resolver = (desde, destino) => path.resolve(path.dirname(desde), destino);

function revisar(archivo) {
  revisados++;
  const codigo = readFileSync(archivo, "utf8");
  const re = /(?:import\s+(?:[^'"()]*?\s+from\s+)?|import\(\s*|export\s+[^'"]*?\s+from\s+)["'](\.{1,2}\/[^"']+)["']/g;
  for (const m of codigo.matchAll(re)) {
    const destino = resolver(archivo, m[1]);
    if (!existsSync(destino)) faltan.push({ falta: path.relative(RAIZ, destino), importadoPor: path.relative(RAIZ, archivo) });
  }
}

function revisarHtml(archivo) {
  revisados++;
  const html = readFileSync(archivo, "utf8");
  for (const m of html.matchAll(/(?:src|href)=["'](?!https?:|data:|#|mailto:)([^"'?#]+)["']/g)) {
    const destino = path.resolve(path.dirname(archivo), m[1]);
    if (!existsSync(destino)) faltan.push({ falta: path.relative(RAIZ, destino), importadoPor: path.relative(RAIZ, archivo) });
  }
}

recorrer(RAIZ);
if (faltan.length) {
  console.log(`✗ Faltan ${new Set(faltan.map((f) => f.falta)).size} archivo(s):\n`);
  for (const f of faltan) console.log(`  - ${f.falta}\n      (lo importa ${f.importadoPor})`);
  console.log("\nCopia esos archivos desde el zip de cambios (los archivos NUEVOS también hay que copiarlos, no solo sobrescribir los existentes).");
  process.exit(1);
}
console.log(`✓ Todos los archivos importados existen (${revisados} archivos revisados).`);
