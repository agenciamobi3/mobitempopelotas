create or replace function public.get_public_open_meteo_cache_snapshot()
returns table (
  status text,
  payload jsonb,
  fetched_at timestamptz,
  last_success_at timestamptz
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    cache.status::text,
    cache.payload,
    cache.fetched_at,
    cache.last_success_at
  from public.weather_provider_payload_cache as cache
  where cache.provider_key = 'open-meteo'
    and cache.payload is not null
    and cache.payload <> '{}'::jsonb
    and coalesce(cache.last_success_at, cache.fetched_at) is not null
  limit 1;
$$;

revoke all on function public.get_public_open_meteo_cache_snapshot() from public;
grant execute on function public.get_public_open_meteo_cache_snapshot() to anon, authenticated, service_role;

comment on function public.get_public_open_meteo_cache_snapshot() is
  'Retorna somente o último payload meteorológico público persistido do Open-Meteo e seus timestamps. Não expõe token, lease, configurações de coleta ou outros provedores.';
