-- Registra a ANA/RHN e a estação LARANJAL no catálogo histórico sem ativar coleta.
-- Nenhuma leitura é ingerida até unidade, referência vertical, timezone e contrato
-- técnico do endpoint serem validados.

insert into public.historical_data_sources (
  source_key,
  name,
  category,
  homepage_url,
  attribution,
  retention_policy_status,
  paid_access_allowed,
  collection_enabled,
  coverage_start,
  collection_start,
  notes
)
values (
  'ana-rhn',
  'ANA / SNIRH / Rede Hidrometeorológica Nacional',
  'hydrology',
  'https://www.snirh.gov.br/hidroweb/',
  'ANA / SNIRH / RHN; preservar entidade operadora da estação quando informada',
  'pending_review',
  false,
  false,
  null,
  now(),
  'Acesso autorizado e estação LARANJAL identificada. Coleta desativada até validar parâmetro, unidade, datum/referência, timezone, contrato técnico e política de uso do endpoint.'
)
on conflict (source_key) do update
set name = excluded.name,
    category = excluded.category,
    homepage_url = excluded.homepage_url,
    attribution = excluded.attribution,
    retention_policy_status = excluded.retention_policy_status,
    paid_access_allowed = false,
    collection_enabled = false,
    notes = excluded.notes,
    updated_at = now();

insert into public.historical_stations (
  station_key,
  source_key,
  name,
  city,
  state,
  station_type,
  active,
  metadata
)
values (
  'ana-rhn-laranjal-87955001',
  'ana-rhn',
  'LARANJAL',
  'Pelotas',
  'RS',
  'hydrometric-station',
  true,
  jsonb_build_object(
    'officialStationCode', '87955001',
    'operator', 'UFPel',
    'subBasin', 'Lagoa dos Patos',
    'sourceReportedStatus', 'Ativo',
    'integrationStatus', 'validation',
    'parameterStatus', 'unconfirmed',
    'unitStatus', 'unconfirmed',
    'verticalReferenceStatus', 'unconfirmed',
    'timezoneStatus', 'unconfirmed',
    'publicMeasurementIngestionEnabled', false,
    'crossValidationOnlyUntilContractClosed', true
  )
)
on conflict (station_key) do update
set source_key = excluded.source_key,
    name = excluded.name,
    city = excluded.city,
    state = excluded.state,
    station_type = excluded.station_type,
    active = excluded.active,
    metadata = excluded.metadata,
    updated_at = now();
