update public.historical_stations
set metadata = metadata || jsonb_build_object(
  'publicMeasurementIngestionEnabled', false,
  'collectionStrategy', 'readiness-cross-check-only',
  'ingestionDeferredByProductPolicy', true,
  'activationRequiresExplicitProductDecision', true,
  'coveredByExistingSourceCount', 2,
  'crossValidationOnlyUntilContractClosed', false,
  'collectionDeferredReason', 'O Laranjal já é coberto por duas fontes de coleta do projeto; ANA/RHN permanece como readiness/cross-check nesta fase, mesmo após eventual confirmação da referência vertical.'
)
where station_key = 'ana-rhn-laranjal-87955001'
  and source_key = 'ana-rhn';

update public.historical_data_sources
set collection_enabled = false,
    notes = concat_ws(
      ' ',
      nullif(notes, ''),
      'Decisão de produto em 29/08/2026: ANA/RHN permanece somente como readiness/cross-check, sem ingestão planejada nesta fase, porque o Laranjal já é coberto por duas fontes de coleta do projeto. Eventual confirmação da referência vertical não habilita coleta automaticamente; ativação futura exige decisão explícita.'
    )
where source_key = 'ana-rhn';
