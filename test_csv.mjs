// test_csv.mjs — exportación a CSV para la tesis (js/ui/exportarCsv.js)
// Uso: node test_csv.mjs

import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "fs";
import { agregarErroresPorUsuario, erroresDesdeRpc, construirCsv, celdaCsv, ENCABEZADOS } from "./js/ui/exportarCsv.js";
import { construirCatalogo, calcularResumen } from "./js/persistence/progreso.js";

const niveles = [];
for (const c of readdirSync("levels")) for (const f of readdirSync(`levels/${c}`)) niveles.push(JSON.parse(readFileSync(`levels/${c}/${f}`, "utf8")));
const catalogo = construirCatalogo(niveles);

let n = 0;
const prueba = (nombre, fn) => {
  fn();
  n++;
  console.log(`  ✓ ${nombre}`);
};

const ej = (user_id, resultado, codigo_error = null) => ({ user_id, resultado, codigo_error });

prueba("el CSV incluye las columnas pedidas para la tesis", () => {
  for (const col of ["Nombre del alumno", "Email", "Nivel actual", "Estrellas totales", "Total de errores", "Error más frecuente"]) {
    assert.ok(ENCABEZADOS.includes(col), `falta la columna «${col}»`);
  }
});

prueba("agrega por alumno: total de ejecuciones, errores y error más frecuente", () => {
  const r = agregarErroresPorUsuario([
    ej("a", "exito"),
    ej("a", "error_semantico", "SEM_001"),
    ej("a", "error_semantico", "SEM_001"),
    ej("a", "error_sintaxis", "SYN_006"),
    ej("a", "objetivo_no_alcanzado"),
    ej("b", "exito"),
  ]);
  assert.deepEqual(r.get("a"), { totalEjecuciones: 5, totalErrores: 4, errorMasFrecuente: "SEM_001" });
  assert.deepEqual(r.get("b"), { totalEjecuciones: 1, totalErrores: 0, errorMasFrecuente: null });
});

prueba("en un empate gana el primero por orden alfabético", () => {
  const r = agregarErroresPorUsuario([ej("a", "error", "SYN_002"), ej("a", "error", "SEM_001"), ej("a", "error", "SYN_002"), ej("a", "error", "SEM_001")]);
  assert.equal(r.get("a").errorMasFrecuente, "SEM_001");
});

prueba("una respuesta de la función SQL se convierte al mismo formato", () => {
  const r = erroresDesdeRpc([{ usuario_id: "a", total_ejecuciones: "7", total_errores: 3, error_mas_frecuente: "RUN_005" }]);
  assert.deepEqual(r.get("a"), { totalEjecuciones: 7, totalErrores: 3, errorMasFrecuente: "RUN_005" });
});

prueba("construye filas completas (nivel dentro del mundo, estrellas, errores) y alumnos sin ejecuciones", () => {
  const filasNivel = (id) => catalogo.niveles[id].fases.map((f) => ({ nivel_id: id, fase_id: f.id, completada: true, intentos: 1, pistas_usadas: 0 }));
  const resumenes = new Map([["a", calcularResumen([...filasNivel(1), ...filasNivel(2)], catalogo)]]);
  const usuarios = [
    { id: "a", nombre: "Ana", email: "ana@x.mx", rol: "estudiante", mundo: 2, nivel: 10, experiencia: 600, fechaRegistro: "2026-10-01", ultimaActividad: "2026-10-20" },
    { id: "b", nombre: "Beto", email: "beto@x.mx", rol: "estudiante", mundo: 1, nivel: 1, experiencia: 0, fechaRegistro: "", ultimaActividad: null },
  ];
  const errores = new Map([["a", { totalEjecuciones: 5, totalErrores: 4, errorMasFrecuente: "SEM_001" }]]);
  const lineas = construirCsv({ usuarios, resumenes, errores, catalogo }).split("\r\n");
  assert.equal(lineas.length, 3);
  const col = (linea) => linea.split('","').map((c) => c.replace(/^"|"$/g, ""));
  const cab = col(lineas[0]);
  const ana = Object.fromEntries(cab.map((c, i) => [c, col(lineas[1])[i]]));
  assert.equal(ana["Nombre del alumno"], "Ana");
  assert.equal(ana["Nivel actual"], "2", "el nivel 10 es el 2.º del Mundo 2");
  assert.equal(ana["Nivel (número global)"], "10");
  assert.equal(ana["Estrellas totales"], "6");
  assert.equal(ana["Total de errores"], "4");
  assert.equal(ana["Error más frecuente"], "SEM_001");
  assert.equal(ana["Error más frecuente (descripción)"], "Variable que no existe");
  const beto = Object.fromEntries(cab.map((c, i) => [c, col(lineas[2])[i]]));
  assert.equal(beto["Total de errores"], "0");
  assert.equal(beto["Error más frecuente"], "", "sin errores de código la celda queda vacía");
});

prueba("las celdas se escapan: comillas dobles y fórmulas de Excel", () => {
  assert.equal(celdaCsv('di "hola"'), '"di ""hola"""');
  assert.equal(celdaCsv("=CMD()"), `"'=CMD()"`);
  assert.equal(celdaCsv("@x"), `"'@x"`);
  assert.equal(celdaCsv(null), '""');
  assert.equal(celdaCsv("Ana, de Pachuca"), '"Ana, de Pachuca"');
});

console.log(`\n${n} pruebas correctas.`);
