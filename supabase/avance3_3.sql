-- ============================================================
-- CodeQuest — Avance 3.3: dashboard del administrador (gráficas y filtro por grupo).
-- Ejecutar en Supabase -> SQL Editor DESPUÉS de avance2.sql, avance2_2.sql y avance2_3.sql.
-- Es idempotente (se puede volver a ejecutar).
--
-- Un administrador NO puede leer las tablas clases / inscripciones directamente (RLS: solo el
-- profesor dueño y los propios alumnos), así que el filtro por grupo necesita estas funciones.
-- Las tres devuelven datos únicamente a un admin o super_root (a cualquier otro, cero filas).
--
--   admin_grupos()          · una fila por clase: nombre, código, profesor y nº de alumnos
--   admin_inscripciones()   · pares (clase, alumno): para saber quién está en cada grupo
--                             y, por exclusión, quién está «sin grupo»
--   admin_dashboard_datos() · resumen compacto de TODAS las ejecuciones (por alumno, por
--                             código de error y por día en la zona horaria de quien mira)
-- Si no las instalas, el panel sigue funcionando pero sin filtro por grupo.
-- ============================================================

create or replace function public.admin_grupos()
returns table (
  clase_id uuid,
  nombre text,
  codigo_acceso text,
  profesor_nombre text,
  alumnos int
)
language sql stable security definer set search_path = public as $$
  select c.id,
         c.nombre::text,
         c.codigo_acceso::text,
         p.nombre::text,
         (select count(*)::int from public.inscripciones i where i.clase_id = c.id)
  from public.clases c
  left join public.perfiles p on p.user_id = c.profesor_id
  where public.cq_es_admin()
  order by c.nombre, c.id;
$$;

create or replace function public.admin_inscripciones()
returns table (
  clase_id uuid,
  estudiante_id uuid
)
language sql stable security definer set search_path = public as $$
  select i.clase_id, i.estudiante_id
  from public.inscripciones i
  where public.cq_es_admin();
$$;

-- p_dias: cuántos días hacia atrás cuenta la serie por día (incluye hoy).
-- p_zona: zona horaria IANA de quien mira el panel (ej. 'America/Mexico_City'), para que
--         «hoy» y los cortes de día coincidan con su calendario.
create or replace function public.admin_dashboard_datos(p_dias int default 7, p_zona text default 'UTC')
returns jsonb
language sql stable security definer set search_path = public as $$
  with ej as (
    select e.user_id,
           e.resultado::text as resultado,
           e.codigo_error::text as codigo_error,
           (e.created_at at time zone p_zona)::date as dia
    from public.ejecuciones e
    where public.cq_es_admin()
  ),
  por_usuario as (
    select user_id,
           count(*)::int as total,
           (count(*) filter (where resultado = 'exito'))::int as exitos
    from ej group by user_id
  ),
  por_error as (
    select user_id, codigo_error, count(*)::int as total
    from ej where codigo_error is not null
    group by user_id, codigo_error
  ),
  por_dia as (
    select user_id, dia, count(*)::int as total
    from ej
    where dia >= ((now() at time zone p_zona)::date - (greatest(p_dias, 1) - 1))
    group by user_id, dia
  )
  select jsonb_build_object(
    'usuarios', coalesce((select jsonb_agg(jsonb_build_object('usuario_id', user_id, 'total', total, 'exitos', exitos) order by user_id) from por_usuario), '[]'::jsonb),
    'errores',  coalesce((select jsonb_agg(jsonb_build_object('usuario_id', user_id, 'codigo_error', codigo_error, 'total', total) order by user_id, codigo_error) from por_error), '[]'::jsonb),
    'dias',     coalesce((select jsonb_agg(jsonb_build_object('usuario_id', user_id, 'dia', dia, 'total', total) order by user_id, dia) from por_dia), '[]'::jsonb)
  );
$$;

revoke all on function public.admin_grupos() from public, anon;
revoke all on function public.admin_inscripciones() from public, anon;
revoke all on function public.admin_dashboard_datos(int, text) from public, anon;
grant execute on function public.admin_grupos() to authenticated;
grant execute on function public.admin_inscripciones() to authenticated;
grant execute on function public.admin_dashboard_datos(int, text) to authenticated;
