update public.historical_stations
set metadata = metadata || jsonb_build_object(
  'unitStatus', 'confirmed',
  'unit', 'cm',
  'timezoneStatus', 'confirmed',
  'timezone', 'America/Sao_Paulo',
  'verticalReferenceStatus', 'unconfirmed',
  'publicMeasurementIngestionEnabled', false,
  'crossValidationOnlyUntilContractClosed', true,
  'unitEvidence', 'HidroWebService 20.02.2026 documenta Cota_Adotada em cm; valor 116.00 confirmado para a estação 87955001 no serviço hidrometeorológico oficial de diagnóstico.',
  'timezoneEvidence', 'Na estação 87955001, DataHora 2026-08-28 13:22:00 corresponde ao mesmo Nivel 116.00 cujo ArcGIS público registra Data_ult_dado 2026-08-28T16:22:00Z, compatível com America/Sao_Paulo (UTC-03:00).'
)
where station_key = 'ana-rhn-laranjal-87955001'
  and source_key = 'ana-rhn';

update public.historical_data_sources
set notes = concat_ws(
  ' ',
  nullif(notes, ''),
  'Unidade de cota/nível confirmada como cm e timezone da estação LARANJAL confirmado como America/Sao_Paulo por evidência cruzada oficial. Referência vertical continua pendente; coleta e publicação seguem desativadas.'
)
where source_key = 'ana-rhn';
