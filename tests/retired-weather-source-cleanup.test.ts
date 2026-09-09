import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(
  "supabase/migrations/20260908060000_retire_embrapa_collector.sql",
  "utf8",
);
const currentObservation = readFileSync(
  "src/lib/weather/defesa-civil-current.server.ts",
  "utf8",
);
const stationPage = readFileSync("src/routes/estacao-embrapa-pelotas.tsx", "utf8");
const stationReader = readFileSync(
  "src/lib/weather/embrapa-observation.server.ts",
  "utf8",
);

test("migration encerra o scheduler e remove a credencial da fonte aposentada", () => {
  assert.match(migration, /tempo-pelotas-embrapa-every-minute/);
  assert.match(migration, /cron\.unschedule/);
  assert.match(migration, /DELETE FROM public\.weather_collector_settings/i);
  assert.match(migration, /embrapa-cpact-sede-pelotas/);
  assert.match(migration, /DROP FUNCTION IF EXISTS public\.invoke_embrapa_collector\(\)/i);
  assert.match(migration, /DROP FUNCTION IF EXISTS public\.get_embrapa_health_snapshot\(\)/i);
});

test("migration preserva arquivo histórico e remove apenas automação específica", () => {
  assert.doesNotMatch(migration, /DELETE FROM public\.weather_station_observations/i);
  assert.doesNotMatch(migration, /DROP TABLE.*weather_station_observations/i);
  assert.match(migration, /DROP FUNCTION IF EXISTS public\.mirror_embrapa_daily_extremes\(\)/i);
});

test("Agora é restrito às estações confirmadas de Pelotas", () => {
  assert.match(currentObservation, /DCRS-00039/);
  assert.match(currentObservation, /DCRS-00062/);
  assert.match(currentObservation, /PELOTAS_CURRENT_STATION_CODE_SET\.has\(station\.code\)/);
  assert.match(currentObservation, /CURRENT_MAX_AGE_MINUTES = 30/);
});

test("página da Embrapa pode voltar sem reativar o coletor aposentado", () => {
  assert.doesNotMatch(stationPage, /redirect\s*\(/);
  assert.match(stationPage, /getEmbrapaObservation/);
  assert.match(stationPage, /indexable: false/);
  assert.match(stationReader, /Current_Monitor\.htm/);
  assert.match(stationReader, /AbortSignal\.timeout/);
  assert.doesNotMatch(stationReader, /weather_collector_settings|invoke_embrapa_collector/);
});
