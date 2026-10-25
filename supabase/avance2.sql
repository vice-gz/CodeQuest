-- ============================================================
-- CodeQuest — Avance 2: funciones de apoyo para el panel de admin
-- Ejecutar UNA vez en Supabase -> SQL Editor. Es idempotente
-- (se puede volver a ejecutar sin romper nada).
--
-- Por qué hace falta: desde el navegador (clave anon + RLS) NO se pueden
--   1) leer los emails de otros usuarios (viven en auth.users),
--   2) hacer conteos/agrupaciones globales eficientes,
--   3) borrar un usuario de auth.users.
-- Estas funciones lo hacen en el servidor y SIEMPRE comprueban que quien
-- las llama sea admin. La service_role key nunca sale de Supabase.
--
-- Supuestos sobre tus tablas (ver el README si alguno no coincide):
--   perfiles(user_id, nombre, rol, avatar_url)
--   progreso_jugador(user_id, mundo_actual, nivel_actual, experiencia, updated_at)
--   progreso_fases(user_id, mundo_id, nivel_id, fase_id, completada, intentos, pistas_usadas)
--   ejecuciones(user_id, mundo_id, nivel_id, fase_id, codigo, resultado, codigo_error,
--               tiempo_ms, intento_numero, pistas_usadas, created_at)
-- ============================================================

-- 1) ¿Quien llama es admin? (security definer evita recursión con RLS)
create or replace function public.cq_es_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.perfiles
    where user_id = auth.uid() and rol::text = 'admin'
  );
$$;

revoke all on function public.cq_es_admin() from public, anon;
grant execute on function public.cq_es_admin() to authenticated;

-- 2) Listado de usuarios con email y última actividad.
--    Para quien no es admin devuelve cero filas.
create or replace function public.admin_listar_usuarios()
returns table (
  usuario_id uuid,
  nombre text,
  email text,
  rol text,
  avatar_url text,
  fecha_registro timestamptz,
  ultimo_acceso timestamptz,
  mundo_actual int,
  nivel_actual int,
  experiencia int,
  ultima_actividad timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.user_id,
    p.nombre::text,
    u.email::text,
    p.rol::text,
    p.avatar_url::text,
    u.created_at,
    u.last_sign_in_at,
    pj.mundo_actual::int,
    pj.nivel_actual::int,
    pj.experiencia::int,
    greatest(
      pj.updated_at,
      (select max(e.created_at) from public.ejecuciones e where e.user_id = p.user_id)
    )
  from public.perfiles p
  join auth.users u on u.id = p.user_id
  left join public.progreso_jugador pj on pj.user_id = p.user_id
  where public.cq_es_admin()
  order by p.nombre;
$$;

revoke all on function public.admin_listar_usuarios() from public, anon;
grant execute on function public.admin_listar_usuarios() to authenticated;

-- 3) Resumen global (devuelve null si quien llama no es admin).
create or replace function public.admin_resumen()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select case when public.cq_es_admin() then
    jsonb_build_object(
      'total_usuarios', (select count(*) from public.perfiles),
      'usuarios_activos_7d', (
        select count(distinct e.user_id) from public.ejecuciones e
        where e.created_at >= now() - interval '7 days'
      ),
      'total_ejecuciones', (select count(*) from public.ejecuciones),
      'errores_por_nivel', coalesce((
        select jsonb_agg(t) from (
          select e.mundo_id, e.nivel_id, count(*) as total
          from public.ejecuciones e
          where e.resultado::text like 'error%'
          group by e.mundo_id, e.nivel_id
          order by total desc
          limit 5
        ) t
      ), '[]'::jsonb),
      'errores_por_codigo', coalesce((
        select jsonb_agg(t) from (
          select e.codigo_error, count(*) as total
          from public.ejecuciones e
          where e.codigo_error is not null
          group by e.codigo_error
          order by total desc
          limit 5
        ) t
      ), '[]'::jsonb)
    )
  else null end;
$$;

revoke all on function public.admin_resumen() from public, anon;
grant execute on function public.admin_resumen() to authenticated;

-- 4) Eliminar un usuario por completo (perfil, progreso, ejecuciones y cuenta).
create or replace function public.admin_eliminar_usuario(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.cq_es_admin() then
    raise exception 'No autorizado' using errcode = '42501';
  end if;
  if p_user_id = auth.uid() then
    raise exception 'No puedes eliminar tu propia cuenta' using errcode = 'P0001';
  end if;

  delete from public.ejecuciones      where user_id = p_user_id;
  delete from public.progreso_fases   where user_id = p_user_id;
  delete from public.progreso_jugador where user_id = p_user_id;
  delete from public.perfiles         where user_id = p_user_id;
  delete from auth.users              where id = p_user_id;
end;
$$;

revoke all on function public.admin_eliminar_usuario(uuid) from public, anon;
grant execute on function public.admin_eliminar_usuario(uuid) to authenticated;

-- 5) Índices para que el panel siga rápido cuando haya muchas ejecuciones.
create index if not exists idx_ejecuciones_user_fecha on public.ejecuciones (user_id, created_at desc);
create index if not exists idx_ejecuciones_fecha on public.ejecuciones (created_at desc);
create index if not exists idx_progreso_fases_user on public.progreso_fases (user_id);

-- ------------------------------------------------------------
-- Verificación rápida (opcional): tus tablas deben tener estas columnas.
-- select table_name, column_name, data_type
-- from information_schema.columns
-- where table_schema = 'public'
--   and table_name in ('perfiles','progreso_jugador','progreso_fases','ejecuciones')
-- order by table_name, ordinal_position;
-- ------------------------------------------------------------
