create extension if not exists pgcrypto with schema extensions;
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

create table if not exists public.data_source_status_monitor_settings (
  monitor_key text primary key,
  endpoint text not null,
  collector_token text not null default encode(extensions.gen_random_bytes(32), 'hex'),
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint data_source_status_monitor_settings_key_check
    check (monitor_key ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint data_source_status_monitor_settings_endpoint_check
    check (endpoint ~ '^https://'),
  constraint data_source_status_monitor_settings_token_check
    check (length(collector_token) >= 32)
);

comment on table public.data_source_status_monitor_settings is
  'Configuração privada do monitor de fontes disparado por Supabase pg_cron/pg_net.';

alter table public.data_source_status_monitor_settings enable row level security;
revoke all on table public.data_source_status_monitor_settings from public, anon, authenticated;
grant select, insert, update, delete on table public.data_source_status_monitor_settings to service_role;

create policy "data source status monitor settings private"
on public.data_source_status_monitor_settings
for all
to anon, authenticated
using (false)
with check (false);

drop trigger if exists data_source_status_monitor_settings_set_updated_at
  on public.data_source_status_monitor_settings;
create trigger data_source_status_monitor_settings_set_updated_at
before update on public.data_source_status_monitor_settings
for each row execute function public.set_data_source_status_updated_at();

insert into public.data_source_status_monitor_settings (monitor_key, endpoint, enabled)
values ('primary', 'https://tempopelotas.com.br/api/cron/data-status', true)
on conflict (monitor_key) do update
set endpoint = excluded.endpoint,
    enabled = excluded.enabled,
    updated_at = now();

-- A coleta anterior dependia exclusivamente do GitHub Actions e parou em
-- 23/08/2026. Um incidente que ficou aberto durante essa lacuna não pode ser
-- interpretado como indisponibilidade contínua. Encerramos a série no último
-- instante realmente observado; uma nova amostra degradada abrirá novo período.
update public.data_source_incidents
set status = 'resolved',
    resolved_at = last_seen_at,
    updated_at = now(),
    detail = detail || ' Histórico encerrado no último instante observado porque houve uma lacuna no monitoramento automático; a continuidade após esse horário não foi presumida.'
where status = 'open'
  and last_seen_at < now() - interval '30 minutes';

create or replace function public.invoke_data_source_status_monitor()
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  settings public.data_source_status_monitor_settings%rowtype;
  request_id bigint;
begin
  select *
    into settings
  from public.data_source_status_monitor_settings
  where monitor_key = 'primary'
    and enabled = true;

  if not found then
    return null;
  end if;

  select net.http_post(
    url := settings.endpoint,
    headers := jsonb_build_object(
      'Accept', 'application/json',
      'Content-Type', 'application/json',
      'X-Collector-Token', settings.collector_token,
      'User-Agent', 'Supabase-Cron/Tempo-Pelotas-Data-Status'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 90000
  ) into request_id;

  return request_id;
end;
$$;

revoke all on function public.invoke_data_source_status_monitor() from public, anon, authenticated;
grant execute on function public.invoke_data_source_status_monitor() to service_role;

-- O banco passa a ser o agendador primário. GitHub OIDC permanece aceito pelo
-- endpoint para smoke/manual e contingência, mas não é necessário para o cron.
do $$
declare
  existing_job_id bigint;
begin
  select jobid
    into existing_job_id
  from cron.job
  where jobname = 'tempo-pelotas-data-status-monitor'
  limit 1;

  if existing_job_id is not null then
    perform cron.unschedule(existing_job_id);
  end if;

  perform cron.schedule(
    'tempo-pelotas-data-status-monitor',
    '*/10 * * * *',
    'select public.invoke_data_source_status_monitor()'
  );
end;
$$;
