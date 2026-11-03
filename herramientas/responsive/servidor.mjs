// servidor.mjs — banco de pruebas del diseño responsivo.
// Sirve la carpeta dist/ (la app REAL compilada con Vite) y simula la API de Supabase
// (REST + Auth) con datos de ejemplo, para poder abrir cualquier página en un
// navegador real sin tocar tu proyecto de Supabase.
//
//   VITE_SUPABASE_URL=http://127.0.0.1:4173 VITE_SUPABASE_ANON_KEY=x npx vite build
//   node herramientas/responsive/servidor.mjs        (puerto 4173)
//
// El escenario (rol y progreso) se cambia con:  GET /__cfg?rol=estudiante&hasta=20

import http from "node:http";
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const DIST = join(RAIZ, "dist");
const PUERTO = Number(process.env.PUERTO || 4173);

const niveles = [];
for (const c of readdirSync(join(RAIZ, "levels"))) for (const f of readdirSync(join(RAIZ, "levels", c))) niveles.push(JSON.parse(readFileSync(join(RAIZ, "levels", c, f), "utf8")));
niveles.sort((a, b) => a.id - b.id);

let cfg = { rol: "estudiante", hasta: 8 }; // "hasta" = último nivel completado

const ahora = Date.now();
const iso = (diasAtras) => new Date(ahora - diasAtras * 86400000).toISOString();

function datos() {
  // «hasta» = niveles con id <= hasta; además se da por superado el Nivel Jefe de un mundo cuando ya están todos sus demás niveles.
  const base = niveles.filter((n) => n.id <= cfg.hasta);
  const hechos = new Set(base.map((n) => n.id));
  const jefes = niveles.filter((n) => n.jefe && niveles.filter((o) => o.mundo === n.mundo && !o.jefe && !o.tutorial).every((o) => hechos.has(o.id)));
  const completados = [...base, ...jefes.filter((j) => !hechos.has(j.id))];
  const fases = completados.flatMap((n) =>
    n.fases.map((f) => ({ id: `${n.id}-${f.id}`, user_id: "u1", mundo_id: n.mundo, nivel_id: n.id, fase_id: f.id, completada: true, intentos: 1, pistas_usadas: 0 }))
  );
  const actual = niveles.find((n) => n.id === cfg.hasta + 1) || niveles.at(-1);
  const otros = ["Beto Ruiz", "Carla Mendoza", "Diego Salas", "Elena Ortiz", "Fer Luna", "Gabriela Soto"].map((nombre, i) => ({
    user_id: `u${i + 2}`, nombre, rol: "estudiante", created_at: iso(30 - i),
  }));
  return {
    perfiles: [{ user_id: "u1", nombre: cfg.rol === "estudiante" ? "Ana Pérez" : "Prof. Laura Hernández con un nombre muy largo", rol: cfg.rol, created_at: iso(40) }, ...otros],
    progreso_jugador: [{ user_id: "u1", mundo_actual: actual.mundo, nivel_actual: actual.id, experiencia: cfg.hasta * 150, updated_at: iso(1) }],
    progreso_fases: fases,
    ejecuciones: Array.from({ length: 24 }, (_, i) => ({
      id: i + 1, user_id: i % 3 ? "u1" : "u2", mundo_id: 3, nivel_id: 20, fase_id: "20.3", codigo: "if numero > 21:\n    print(\"Bust\")",
      resultado: i % 4 === 0 ? "exito" : i % 4 === 1 ? "error_semantico" : "objetivo_no_alcanzado",
      codigo_error: i % 4 === 1 ? "SEM_001" : null, tiempo_ms: 100 + i * 7, intento_numero: i + 1, pistas_usadas: 0, concepto_evaluado: "condicional_if", created_at: iso(i / 3),
    })),
    clases: [
      { id: "c1", profesor_id: "u1", nombre: "Programación 1 · Grupo A con un nombre bastante largo para probar", codigo_acceso: "K7P3XQ", dominio_permitido: "pachuca.tecnm.mx", created_at: iso(10) },
      { id: "c2", profesor_id: "u1", nombre: "Taller", codigo_acceso: "M2N8ZB", dominio_permitido: null, created_at: iso(5) },
    ],
    inscripciones: [{ clase_id: "c1" }, { clase_id: "c1" }, { clase_id: "c2" }],
  };
}

function rpc(nombre) {
  const d = datos();
  switch (nombre) {
    case "admin_listar_usuarios":
      return d.perfiles.map((p, i) => ({
        usuario_id: p.user_id, nombre: p.nombre, email: `${p.nombre.split(" ")[0].toLowerCase()}@pachuca.tecnm.mx`, rol: p.rol, avatar_url: null,
        fecha_registro: p.created_at, ultimo_acceso: iso(i), mundo_actual: 1 + (i % 4), nivel_actual: 1 + i * 3, experiencia: i * 200, ultima_actividad: iso(i * 2),
      }));
    case "admin_resumen":
      return {
        total_usuarios: d.perfiles.length, usuarios_activos_7d: 4, total_ejecuciones: 240,
        errores_por_nivel: [{ mundo_id: 3, nivel_id: 22, total: 14 }, { mundo_id: 2, nivel_id: 11, total: 9 }],
        errores_por_codigo: [{ codigo_error: "SEM_001", total: 31 }, { codigo_error: "SYN_006", total: 12 }],
      };
    case "admin_errores_por_usuario":
      return d.perfiles.map((p, i) => ({ usuario_id: p.user_id, total_ejecuciones: 10 + i, total_errores: 4 + i, error_mas_frecuente: "SEM_001" }));
    case "admin_grupos":
      return [
        { clase_id: "c1", nombre: "Programación 1 · Grupo A con un nombre bastante largo para probar", codigo_acceso: "K7P3XQ", profesor_nombre: "Laura Hernández", alumnos: 3 },
        { clase_id: "c2", nombre: "Taller", codigo_acceso: "M2N8ZB", profesor_nombre: "Laura Hernández", alumnos: 1 },
      ];
    case "admin_inscripciones":
      return [{ clase_id: "c1", estudiante_id: "u2" }, { clase_id: "c1", estudiante_id: "u3" }, { clase_id: "c1", estudiante_id: "u4" }, { clase_id: "c2", estudiante_id: "u5" }];
    case "admin_dashboard_datos": {
      const dia = (k) => new Date(Date.now() - k * 86400000).toISOString().slice(0, 10);
      const ids = ["u2", "u3", "u4", "u5", "u6", "u7"];
      return {
        usuarios: ids.map((id, i) => ({ usuario_id: id, total: 20 + i * 7, exitos: 8 + i * 3 })),
        errores: ids.flatMap((id, i) => [{ usuario_id: id, codigo_error: ["SEM_001", "SYN_006", "RUN_005", "SYN_001", "SEM_007", "RUN_015"][i], total: 12 - i * 2 }, { usuario_id: id, codigo_error: "SEM_001", total: 3 + i }]),
        dias: ids.flatMap((id, i) => [0, 1, 2, 3, 4, 5, 6].map((k) => ({ usuario_id: id, dia: dia(k), total: ((i + k * 3) % 5) + 1 }))),
      };
    }
    case "admin_auditoria":
      return [{ id: 1, fecha: iso(1), admin_nombre: "Admin", admin_email: "a@x.mx", accion: "cambiar_rol", objetivo_id: "u2", detalles: { nombre: "Beto Ruiz", rol_anterior: "estudiante", rol_nuevo: "profesor" } }];
    case "mis_clases":
      return [{ clase_id: "c1", nombre: "Programación 1 · Grupo A", profesor_nombre: "Laura Hernández", inscrito_en: iso(3) }];
    case "profesor_alumnos_clase":
      return d.perfiles.slice(1).map((p, i) => ({ estudiante_id: p.user_id, nombre: p.nombre, email: `${p.nombre.split(" ")[0].toLowerCase()}@pachuca.tecnm.mx`, mundo_actual: 1 + (i % 3), nivel_actual: 2 + i, experiencia: i * 100, ultima_actividad: iso(i), inscrito_en: iso(9) }));
    case "admin_alertas_clase":
      return d.perfiles.slice(1).map((p, i) => ({ estudiante_id: p.user_id, nombre: p.nombre, nivel_actual: 2 + i, errores_nivel_actual: i * 4, dias_inactivo: i, en_riesgo: i % 3 === 0, motivo: i % 3 === 0 ? "Más de 3 días sin actividad" : null }));
    default:
      return [];
  }
}

function filtrar(filas, params) {
  let r = filas;
  for (const [k, v] of params) {
    if (["select", "order", "limit", "offset"].includes(k)) continue;
    const m = /^(not\.)?(eq|neq|in|gte|lte|gt|lt|is|like)\.(.*)$/.exec(v);
    if (!m) continue;
    const [, no, op, val] = m;
    r = r.filter((f) => {
      const x = f[k];
      let ok = true;
      if (op === "eq") ok = String(x) === val;
      else if (op === "neq") ok = String(x) !== val;
      else if (op === "in") ok = val.replace(/^\(|\)$/g, "").split(",").includes(String(x));
      else if (op === "is") ok = val === "null" ? x == null : x != null;
      else if (op === "like") ok = new RegExp(`^${val.replace(/%/g, ".*")}$`).test(String(x));
      else if (op === "gte") ok = String(x) >= val;
      else if (op === "lte") ok = String(x) <= val;
      return no ? !ok : ok;
    });
  }
  return r;
}

const TIPOS = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml" };

http
  .createServer((req, res) => {
    const url = new URL(req.url, `http://127.0.0.1:${PUERTO}`);
    const json = (cuerpo, estado = 200, extra = {}) => {
      res.writeHead(estado, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", ...extra });
      res.end(JSON.stringify(cuerpo));
    };
    if (url.pathname === "/__cfg") {
      cfg = { ...cfg, ...Object.fromEntries([...url.searchParams].map(([k, v]) => [k, /^\d+$/.test(v) ? Number(v) : v])) };
      return json(cfg);
    }
    if (url.pathname.startsWith("/auth/v1/user")) return json({ id: "u1", email: "ana@pachuca.tecnm.mx", user_metadata: { nombre: "Ana" }, created_at: iso(40) });
    if (url.pathname.startsWith("/auth/v1/")) return json({});
    if (url.pathname.startsWith("/rest/v1/rpc/")) {
      let cuerpo = "";
      req.on("data", (c) => (cuerpo += c));
      return req.on("end", () => json(rpc(url.pathname.split("/").pop())));
    }
    if (url.pathname.startsWith("/rest/v1/")) {
      if (req.method === "OPTIONS") return json({});
      const tabla = url.pathname.split("/").pop();
      if (req.method !== "GET" && req.method !== "HEAD") return json([], 200);
      const filas = filtrar(datos()[tabla] || [], url.searchParams);
      const limite = Number(url.searchParams.get("limit")) || filas.length;
      return json(req.method === "HEAD" ? [] : filas.slice(0, limite), 200, { "Content-Range": `0-${Math.max(filas.length - 1, 0)}/${filas.length}` });
    }
    let ruta = join(DIST, url.pathname === "/" ? "index.html" : url.pathname);
    if (!existsSync(ruta) || statSync(ruta).isDirectory()) ruta = join(DIST, "index.html");
    res.writeHead(200, { "Content-Type": TIPOS[extname(ruta)] || "application/octet-stream" });
    res.end(readFileSync(ruta));
  })
  .listen(PUERTO, "127.0.0.1", () => console.log(`Banco de pruebas en http://127.0.0.1:${PUERTO}`));
