-- Backoff adaptativo para o coletor central da Embrapa.
-- O cron permanece a cada minuto; esta função evita chamadas redundantes quando
-- a integração acumula falhas de transporte e volta automaticamente à cadência
-- normal depois do primeiro sucesso.

create or replace function public.invoke_embrapa_collector()
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  collector public.weather_collector_settings%rowtype;
  current_state record;
  request_id bigint;
  minimum_interval interval := interval '0 seconds';
begin
  select *
  into collector
  from public.weather_collector_settings
  where station_id = 'embrapa-cpact-sede-pelotas'
    and enabled = true;

  if not found then
    return null;
  end if;

  select
    consecutive_failures,
    last_attempt_at
  into current_state
  from public.weather_station_current
  where station_id = collector.station_id;

  if found then
    minimum_interval := case
      when coalesce(current_state.consecutive_failures, 0) >= 60 then interval '10 minutes'
      when coalesce(current_state.consecutive_failures, 0) >= 10 then interval '5 minutes'
      when coalesce(current_state.consecutive_failures, 0) >= 3 then interval '2 minutes'
      else interval '0 seconds'
    end;

    if minimum_interval > interval '0 seconds'
      and current_state.last_attempt_at is not null
      and current_state.last_attempt_at > now() - minimum_interval
    then
      return null;
    end if;
  end if;

  select net.http_post(
    url := collector.endpoint,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-Collector-Token', collector.collector_token,
      'User-Agent', 'Supabase-Cron/Tempo-Pelotas'
    ),
    body := jsonb_build_object('stationId', collector.station_id),
    timeout_milliseconds := 50000
  )
  into request_id;

  return request_id;
end;
$$;

revoke execute on function public.invoke_embrapa_collector() from public, anon, authenticated;
grant execute on function public.invoke_embrapa_collector() to service_role;
