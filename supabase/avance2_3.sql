-- ============================================================
-- CodeQuest — Avance 2.3: concepto evaluado y alertas tempranas.
-- Ejecutar en Supabase -> SQL Editor DESPUÉS de avance2.sql y avance2_2.sql.
-- Es idempotente y va en una transacción.
-- ============================================================

begin;

-- 1) Concepto que evalúa el nivel donde ocurrió cada ejecución.
alter table public.ejecuciones add column if not exists concepto_evaluado text;
create index if not exists idx_ejecuciones_concepto on public.ejecuciones (concepto_evaluado);

-- 2) Alertas tempranas para una clase.
--    Un alumno está "en riesgo" si cumple CUALQUIERA de estas condiciones:
--      * más de 10 intentos fallidos en su NIVEL ACTUAL (cualquier resultado distinto de 'exito':
--        errores de código y también "objetivo no alcanzado"),
--      * más de 3 días sin actividad. Si todavía no ha jugado nunca, los días se
--        cuentan desde que se inscribió (así quien nunca empezó también se detecta).
--    Puede llamarla el profesor dueño de la clase o un admin; para cualquier
--    otra persona devuelve cero filas.
create or replace function public.admin_alertas_clase(p_clase_id uuid)
returns table (
  estudiante_id uuid,
  nombre text,
  nivel_actual int,
  errores_nivel_actual int,
  dias_inactivo int,
  en_riesgo boolean,
  motivo text
)
language sql stable security definer set search_path = public as $$
  with alumnos as (
    select i.estudiante_id,
           p.nombre::text as nombre,
           i.created_at as inscrito_en,
           coalesce(pj.nivel_actual, 1)::int as nivel_actual
    from public.inscripciones i
    join public.clases c on c.id = i.clase_id
    join public.perfiles p on p.user_id = i.estudiante_id
    left join public.progreso_jugador pj on pj.user_id = i.estudiante_id
    where i.clase_id = p_clase_id
      and (c.profesor_id = auth.uid() or public.cq_es_admin())
  ),
  metricas as (
    select a.estudiante_id,
           a.nombre,
           a.nivel_actual,
           (select count(*) from public.ejecuciones e
             where e.user_id = a.estudiante_id
               and e.nivel_id::text = a.nivel_actual::text
               and e.resultado::text <> 'exito')::int as errores,
           greatest(0, floor(extract(epoch from (
             now() - coalesce(
               (select max(e.created_at) from public.ejecuciones e where e.user_id = a.estudiante_id),
               a.inscrito_en
             )
           )) / 86400))::int as dias
    from alumnos a
  )
  select m.estudiante_id,
         m.nombre,
         m.nivel_actual,
         m.errores,
         m.dias,
         (m.errores > 10 or m.dias > 3),
         case
           when m.errores > 10 and m.dias > 3 then 'Más de 10 intentos fallidos en el nivel actual y más de 3 días sin actividad'
           when m.errores > 10 then 'Más de 10 intentos fallidos en el nivel actual'
           when m.dias > 3 then 'Más de 3 días sin actividad'
           else null
         end
  from metricas m
  order by (m.errores > 10 or m.dias > 3) desc, m.nombre;
$$;

revoke all on function public.admin_alertas_clase(uuid) from public, anon;
grant execute on function public.admin_alertas_clase(uuid) to authenticated;

commit;
