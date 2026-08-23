create table if not exists public.regional_weather_snapshots (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'Open-Meteo',
  status text not null default 'live',
  payload jsonb not null,
  fetched_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists regional_weather_snapshots_fetched_at_idx
  on public.regional_weather_snapshots (fetched_at desc);

alter table public.regional_weather_snapshots enable row level security;

create policy "regional weather snapshots are publicly readable"
  on public.regional_weather_snapshots
  for select
  using (true);

comment on table public.regional_weather_snapshots is 'Snapshots normalizados da visão meteorológica regional para fallback e redução de chamadas externas.';
