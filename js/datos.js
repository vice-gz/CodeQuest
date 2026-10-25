// datos.js
// Consultas a Supabase compartidas por perfil.html y admin.html.
// La seguridad no depende de este archivo: las políticas RLS deciden qué
// filas puede ver cada rol (un estudiante solo ve las suyas, un admin todas).

import { supabase } from "./supabase.js";

// Nombre de la columna de fecha de la tabla `ejecuciones`.
export const COL_FECHA = "created_at";

// PostgREST devuelve como máximo 1000 filas por petición: se pide por páginas.
export async function traerTodo(construirConsulta, tamano = 1000) {
  const filas = [];
  for (let desde = 0; ; desde += tamano) {
    const { data, error } = await construirConsulta().range(desde, desde + tamano - 1);
    if (error) throw error;
    filas.push(...data);
    if (data.length < tamano) break;
  }
  return filas;
}

export async function cargarJugador(userId) {
  const { data, error } = await supabase.from("progreso_jugador").select("*").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  return data;
}

export function cargarFases(userId) {
  return traerTodo(() =>
    supabase
      .from("progreso_fases")
      .select("*")
      .eq("user_id", userId)
      .order("nivel_id")
      .order("fase_id")
  );
}

export async function cargarUltimasEjecuciones(userId, limite = 10) {
  const { data, error } = await supabase
    .from("ejecuciones")
    .select("*")
    .eq("user_id", userId)
    .order(COL_FECHA, { ascending: false })
    .limit(limite);
  if (error) throw error;
  return data;
}

// Solo los códigos de error del usuario, para contar los más frecuentes.
export function cargarCodigosError(userId) {
  return traerTodo(() =>
    supabase
      .from("ejecuciones")
      .select("codigo_error")
      .eq("user_id", userId)
      .not("codigo_error", "is", null)
      .order(COL_FECHA, { ascending: false })
  );
}
