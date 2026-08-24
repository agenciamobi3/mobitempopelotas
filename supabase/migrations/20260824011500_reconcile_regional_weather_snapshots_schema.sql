do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'regional_weather_snapshots'
      and column_name = 'collected_at'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'regional_weather_snapshots'
      and column_name = 'fetched_at'
  ) then
    alter table public.regional_weather_snapshots
      rename column collected_at to fetched_at;
  end if;
end
$$;

alter table public.regional_weather_snapshots
  alter column source set default 'Open-Meteo',
  alter column status set default 'live',
  alter column fetched_at set default now();

create index if not exists regional_weather_snapshots_fetched_at_idx
  on public.regional_weather_snapshots (fetched_at desc);

alter table public.regional_weather_snapshots enable row level security;

comment on table public.regional_weather_snapshots is
  'Snapshots normalizados da visão meteorológica regional para fallback e redução de chamadas externas.';
