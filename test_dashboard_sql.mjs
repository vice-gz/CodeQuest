// test_dashboard_sql.mjs — las funciones SQL del dashboard (supabase/avance3_3.sql) contra un
// PostgreSQL REAL temporal, comparadas con el cálculo en JavaScript (agregarEjecuciones).
// Se omite si no hay PostgreSQL instalado. Uso: node test_dashboard_sql.mjs

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { agregarEjecuciones } from "./js/ui/dashboardDatos.js";

const BIN = ["/usr/lib/postgresql/16/bin", "/usr/lib/postgresql/15/bin", "/usr/lib/postgresql/14/bin"].find((d) => existsSync(join(d, "initdb")));
if (!BIN) {
  console.log("PostgreSQL no está instalado: prueba omitida.");
  process.exit(0);
}
const DIR = mkdtempSync(join(tmpdir(), "pgcq-"));
const PUERTO = "54339";
// PostgreSQL no arranca como root: si el script corre como root, el servidor lo lanza el usuario «postgres».
const COMO_ROOT = typeof process.getuid === "function" && process.getuid() === 0;
if (COMO_ROOT) execFileSync("chown", ["-R", "postgres", DIR]);
const run = (cmd, args, opciones = {}) =>
  COMO_ROOT
    ? execFileSync("runuser", ["-u", "postgres", "--", join(BIN, cmd), ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], ...opciones })
    : execFileSync(join(BIN, cmd), args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], ...opciones });
const psql = (sql, { admin = true } = {}) =>
  execFileSync(join(BIN, "psql"), ["-h", DIR, "-p", PUERTO, "-U", "postgres", "-d", "postgres", "-At", "-v", "ON_ERROR_STOP=1", "-c", `${admin ? "set cq.admin='1'; " : "set cq.admin='0'; "}${sql}`], { encoding: "utf8" })
    .trim()
    .split("\n")
    .pop(); // psql imprime también «SET» del primer comando: el resultado es la última línea
const psqlArchivo = (archivo) => execFileSync(join(BIN, "psql"), ["-h", DIR, "-p", PUERTO, "-U", "postgres", "-d", "postgres", "-q", "-v", "ON_ERROR_STOP=1", "-f", archivo], { encoding: "utf8" });

let n = 0;
const prueba = (nombre, fn) => {
  fn();
  n++;
  console.log(`  ✓ ${nombre}`);
};

try {
  run("initdb", ["-D", join(DIR, "datos"), "-U", "postgres", "--auth=trust", "-E", "UTF8"]);
  run("pg_ctl", ["-D", join(DIR, "datos"), "-o", `-p ${PUERTO} -k ${DIR} -c listen_addresses=''`, "-w", "-l", join(DIR, "log"), "start"]);

  // Esquema mínimo (lo que usan las funciones) + roles de Supabase
  psqlArchivo(
    (() => {
      const f = join(DIR, "esquema.sql");
      writeFileSync(
        f,
        `create role authenticated; create role anon;
         create table perfiles (user_id uuid primary key, nombre text, rol text);
         create table clases (id uuid primary key, profesor_id uuid, nombre text, codigo_acceso text, dominio_permitido text);
         create table inscripciones (clase_id uuid, estudiante_id uuid, primary key (clase_id, estudiante_id));
         create table ejecuciones (id bigserial primary key, user_id uuid, resultado text, codigo_error text, created_at timestamptz);
         create function public.cq_es_admin() returns boolean language sql stable as $$ select current_setting('cq.admin', true) = '1' $$;`
      );
      return f;
    })()
  );
  psqlArchivo("supabase/avance3_3.sql");
  psqlArchivo("supabase/avance3_3.sql"); // idempotente: se puede ejecutar dos veces

  // ---- datos de prueba reproducibles
  let semilla = 12345;
  const azar = () => ((semilla = (semilla * 1103515245 + 12345) % 2147483648) / 2147483648);
  const uuid = (k) => `00000000-0000-4000-8000-${String(k).padStart(12, "0")}`;
  const alumnos = Array.from({ length: 30 }, (_, i) => uuid(i + 1));
  const profe = uuid(900);
  const claseA = uuid(501);
  const claseB = uuid(502);
  const CODIGOS = ["SYN_001", "SYN_006", "SEM_001", "SEM_007", "RUN_005", "RUN_015", null, null];
  const filas = [];
  const ahoraDb = psql("select (extract(epoch from now()) * 1000)::bigint");
  for (let i = 0; i < 700; i++) {
    const user = alumnos[Math.floor(azar() * alumnos.length)];
    const hace = Math.floor(azar() * 11 * 86400000) + Math.floor(azar() * 3600000); // últimos ~11 días
    const exito = azar() < 0.4;
    filas.push({ user_id: user, resultado: exito ? "exito" : azar() < 0.5 ? "error_sintaxis" : "objetivo_no_alcanzado", codigo_error: exito ? null : CODIGOS[Math.floor(azar() * CODIGOS.length)], created_at: new Date(Number(ahoraDb) - hace).toISOString() });
  }
  // casos de borde: justo antes y después de medianoche en Ciudad de México (06:00 UTC)
  filas.push({ user_id: alumnos[0], resultado: "exito", codigo_error: null, created_at: new Date(Number(ahoraDb) - 3 * 86400000).toISOString().slice(0, 10) + "T05:59:59.000Z" });
  filas.push({ user_id: alumnos[0], resultado: "exito", codigo_error: null, created_at: new Date(Number(ahoraDb) - 3 * 86400000).toISOString().slice(0, 10) + "T06:00:00.000Z" });
  const q = (v) => (v === null ? "null" : `'${v}'`);
  const sql = [
    `insert into perfiles values ${alumnos.map((a, i) => `('${a}','Alumno ${i + 1}','estudiante')`).join(",")}, ('${profe}','Profe Ana','profesor');`,
    `insert into clases values ('${claseA}','${profe}','ISC-1A','AAA111',null), ('${claseB}','${profe}','ISC-1B','BBB222','pachuca.tecnm.mx');`,
    `insert into inscripciones values ${alumnos.slice(0, 12).map((a) => `('${claseA}','${a}')`).join(",")}, ${alumnos.slice(12, 20).map((a) => `('${claseB}','${a}')`).join(",")};`,
    `insert into ejecuciones (user_id,resultado,codigo_error,created_at) values ${filas.map((f) => `('${f.user_id}','${f.resultado}',${q(f.codigo_error)},'${f.created_at}')`).join(",")};`,
  ].join("\n");
  const archivoDatos = join(DIR, "datos.sql");
  writeFileSync(archivoDatos, sql);
  psqlArchivo(archivoDatos);

  const normaliza = (o) => ({
    usuarios: [...o.usuarios].sort((a, b) => a.usuario_id.localeCompare(b.usuario_id)),
    errores: [...o.errores].sort((a, b) => a.usuario_id.localeCompare(b.usuario_id) || a.codigo_error.localeCompare(b.codigo_error)),
    dias: [...o.dias].sort((a, b) => a.usuario_id.localeCompare(b.usuario_id) || a.dia.localeCompare(b.dia)),
  });

  console.log("Funciones SQL del dashboard (PostgreSQL real)");
  for (const zona of ["UTC", "America/Mexico_City", "Pacific/Auckland"]) {
    prueba(`admin_dashboard_datos() da lo mismo que el cálculo en JavaScript (zona ${zona})`, () => {
      const ahora = psql("select (extract(epoch from now()) * 1000)::bigint");
      const deSql = JSON.parse(psql(`select public.admin_dashboard_datos(7, '${zona}')`));
      const deJs = agregarEjecuciones(filas, { dias: 7, zona, ahora: Number(ahora) });
      assert.deepEqual(normaliza(deSql), normaliza(deJs));
      assert.ok(deSql.usuarios.length > 20 && deSql.errores.length > 10 && deSql.dias.length > 10, "hay datos de verdad en las tres listas");
    });
  }
  prueba("la zona horaria cambia en qué día cae la ejecución de la medianoche de México", () => {
    const utc = JSON.parse(psql(`select public.admin_dashboard_datos(30, 'UTC')`));
    const mx = JSON.parse(psql(`select public.admin_dashboard_datos(30, 'America/Mexico_City')`));
    const cuenta = (r) => r.dias.filter((d) => d.usuario_id === alumnos[0]).map((d) => `${d.dia}:${d.total}`).join(",");
    assert.notEqual(cuenta(utc), cuenta(mx));
  });
  prueba("p_dias recorta la serie por día pero no los totales", () => {
    const uno = JSON.parse(psql(`select public.admin_dashboard_datos(1, 'UTC')`));
    const siete = JSON.parse(psql(`select public.admin_dashboard_datos(7, 'UTC')`));
    assert.ok(uno.dias.length < siete.dias.length);
    assert.deepEqual(uno.usuarios, siete.usuarios);
    assert.ok(uno.dias.every((d) => d.dia === uno.dias[0].dia));
  });
  prueba("admin_grupos() lista las clases con su profesor y su número de alumnos", () => {
    const g = JSON.parse(psql(`select jsonb_agg(g order by g.nombre) from public.admin_grupos() g`));
    assert.deepEqual(g.map((x) => [x.nombre, x.codigo_acceso, x.profesor_nombre, x.alumnos]), [["ISC-1A", "AAA111", "Profe Ana", 12], ["ISC-1B", "BBB222", "Profe Ana", 8]]);
  });
  prueba("admin_inscripciones() devuelve los 20 pares clase/alumno", () => {
    assert.equal(psql(`select count(*) from public.admin_inscripciones()`), "20");
  });
  prueba("SEGURIDAD: quien no es administrador no recibe nada de las tres funciones", () => {
    assert.equal(psql(`select count(*) from public.admin_grupos()`, { admin: false }), "0");
    assert.equal(psql(`select count(*) from public.admin_inscripciones()`, { admin: false }), "0");
    assert.deepEqual(JSON.parse(psql(`select public.admin_dashboard_datos(7, 'UTC')`, { admin: false })), { usuarios: [], errores: [], dias: [] });
  });
  prueba("sin ejecuciones devuelve listas vacías (no null)", () => {
    psql("delete from ejecuciones");
    assert.deepEqual(JSON.parse(psql(`select public.admin_dashboard_datos(7, 'UTC')`)), { usuarios: [], errores: [], dias: [] });
  });
  console.log(`\n${n} pruebas correctas.`);
} finally {
  try {
    run("pg_ctl", ["-D", join(DIR, "datos"), "-m", "immediate", "stop"]);
  } catch {
    /* ya estaba detenido */
  }
  rmSync(DIR, { recursive: true, force: true });
}
