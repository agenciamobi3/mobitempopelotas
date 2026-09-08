-- A integração operacional da Embrapa foi aposentada em favor da observação local
-- da Rede de Monitoramento Hidrometeorológico da Defesa Civil RS.
--
-- Esta migration não apaga o histórico meteorológico já armazenado. Ela remove
-- somente agendamento, credencial, RPCs e automações específicas que poderiam
-- continuar chamando o endpoint aposentado após o deploy do novo runtime.

DO $$
DECLARE
  existing_job record;
BEGIN
  IF to_regclass('cron.job') IS NOT NULL THEN
    FOR existing_job IN
      SELECT jobid
      FROM cron.job
      WHERE jobname IN (
        'tempo-pelotas-embrapa-every-minute',
        'tempo-pelotas-embrapa-collector'
      )
    LOOP
      PERFORM cron.unschedule(existing_job.jobid);
    END LOOP;
  END IF;
END;
$$;

-- Remove a credencial privada e impede qualquer reativação acidental pelo scheduler antigo.
DELETE FROM public.weather_collector_settings
WHERE station_id = 'embrapa-cpact-sede-pelotas';

-- Mantém o snapshot final apenas como registro histórico do estado da integração,
-- sem lease em aberto e sem sugerir que a estação continua operacional.
UPDATE public.weather_station_current
SET
  status = 'unavailable',
  error = 'Integração Embrapa aposentada pelo Tempo Pelotas em 08/09/2026.',
  refresh_started_at = NULL,
  refresh_lease_token = NULL,
  updated_at = now()
WHERE station_id = 'embrapa-cpact-sede-pelotas';

-- Fecha incidentes operacionais antigos sem apagar o histórico de alertas.
UPDATE public.weather_data_alerts
SET
  status = 'resolved',
  resolved_at = COALESCE(resolved_at, now()),
  updated_at = now(),
  message = CASE
    WHEN status = 'open'
      THEN message || ' Integração aposentada; nenhuma nova coleta será executada.'
    ELSE message
  END
WHERE station_id = 'embrapa-cpact-sede-pelotas'
  AND status = 'open';

-- O espelhamento diário era exclusivo da antiga estação Embrapa. O arquivo já
-- persistido continua intacto; apenas novas execuções deixam de existir.
DROP TRIGGER IF EXISTS trg_weather_station_observations_archive_daily_extremes
  ON public.weather_station_observations;
DROP FUNCTION IF EXISTS public.mirror_embrapa_daily_extremes();

DROP FUNCTION IF EXISTS public.invoke_embrapa_collector();
DROP FUNCTION IF EXISTS public.get_embrapa_health_snapshot();
