-- ============================================================
-- CodeQuest — Avance 3.1: datos para la tesis (exportación a CSV).
-- Ejecutar en Supabase -> SQL Editor DESPUÉS de avance2.sql, avance2_2.sql y
-- avance2_3.sql. Es idempotente.
--
-- admin_errores_por_usuario(): por cada usuario devuelve
--   total_ejecuciones  · cuántas veces ejecutó código
--   total_errores      · ejecuciones fallidas (resultado distinto de 'exito':
--                        errores de código y también "objetivo no alcanzado")
--   error_mas_frecuente· el codigo_error más repetido (empate: el primero por
--                        orden alfabético; null si nunca tuvo un error de código)
-- Solo devuelve filas a un admin o super_root (para cualquier otro, cero filas).
-- Si no la instalas, el panel hace el mismo cálculo en el navegador (más lento).
-- ============================================================

create or replace function public.admin_errores_por_usuario()
returns table (
  usuario_id uuid,
  total_ejecuciones int,
  total_errores int,
  error_mas_frecuente text
)
language sql stable security definer set search_path = public as $$
  with base as (
    select e.user_id,
           count(*)::int as total,
           (count(*) filter (where e.resultado::text <> 'exito'))::int as fallidas
    from public.ejecuciones e
    group by e.user_id
  ),
  frecuentes as (
    select e.user_id,
           e.codigo_error,
           row_number() over (partition by e.user_id order by count(*) desc, e.codigo_error) as posicion
    from public.ejecuciones e
    where e.codigo_error is not null
    group by e.user_id, e.codigo_error
  )
  select b.user_id, b.total, b.fallidas, f.codigo_error::text
  from base b
  left join frecuentes f on f.user_id = b.user_id and f.posicion = 1
  where public.cq_es_admin();
$$;

revoke all on function public.admin_errores_por_usuario() from public, anon;
grant execute on function public.admin_errores_por_usuario() to authenticated;
