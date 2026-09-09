import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const extendedServer = readFileSync("src/lib/weather/extended-forecast.server.ts", "utf8");
const extendedTypes = readFileSync("src/lib/weather/extended-forecast.types.ts", "utf8");
const extendedEdgeClient = readFileSync(
  "src/lib/weather/open-meteo-extended-edge.server.ts",
  "utf8",
);
const extendedEdgeFunction = readFileSync(
  "supabase/functions/open-meteo-extended-forecast/index.ts",
  "utf8",
);
const extendedCacheMigration = readFileSync(
  "supabase/migrations/20260909192047_add_open_meteo_extended_cache.sql",
  "utf8",
);

test("previsão de 15 dias possui Best Match, NOAA GFS e cache Edge estendido", () => {
  assert.match(extendedServer, /GFS_FORECAST_ENDPOINT = "https:\/\/api\.open-meteo\.com\/v1\/gfs"/);
  assert.match(extendedServer, /model: "Open-Meteo Best Match"/);
  assert.match(extendedServer, /model: "NOAA GFS"/);
  assert.match(extendedServer, /fetchOpenMeteoExtendedPayloadViaEdge/);
  assert.match(extendedServer, /fetchExtendedForecastEdgeFallback\(\)/);
  assert.match(extendedServer, /fetchLegacySevenDayEdgeFallback\(\)/);
  assert.match(extendedServer, /preferBroaderForecast/);
  assert.match(extendedServer, /Promise\.all\(\[/);
  assert.match(extendedServer, /candidate\.days\.length > selected\.days\.length/);
});

test("cache estendido começa em paralelo aos upstreams diretos para preservar o budget", () => {
  assert.match(extendedServer, /TOTAL_FETCH_BUDGET_MS = 2_550/);
  assert.match(extendedServer, /EXTENDED_EDGE_MAX_WAIT_MS = 900/);
  assert.match(
    extendedServer,
    /const extendedEdgePromise = fetchExtendedForecastEdgeFallback\(\);[\s\S]*const \[bestMatch, gfs\] = await Promise\.all\(\[/,
  );
  assert.match(
    extendedServer,
    /const extendedEdge = await settleWithin\([\s\S]*extendedEdgePromise,[\s\S]*remainingBudget\(startedAt, EXTENDED_EDGE_MAX_WAIT_MS\)/,
  );
});

test("consulta estendida continua diária e não amplia o payload compartilhado", () => {
  assert.match(extendedServer, /EXTENDED_FORECAST_DAYS = 15/);
  assert.match(extendedServer, /forecast_days:\s*String\(EXTENDED_FORECAST_DAYS\)/);
  assert.match(extendedServer, /temperature_2m_max/);
  assert.match(extendedServer, /temperature_2m_min/);
  assert.match(extendedServer, /precipitation_probability_max/);
  assert.match(extendedServer, /precipitation_sum/);
  assert.match(extendedServer, /wind_gusts_10m_max/);
  assert.doesNotMatch(extendedServer, /\bhourly:\s*\[/);
  assert.doesNotMatch(extendedServer, /\bcurrent:\s*\[/);
});

test("Edge estendido compara Best Match e GFS e persiste a janela mais ampla", () => {
  assert.match(extendedEdgeFunction, /PROVIDER_KEY = "open-meteo-extended"/);
  assert.match(extendedEdgeFunction, /FORECAST_DAYS = 15/);
  assert.match(extendedEdgeFunction, /BEST_MATCH_ENDPOINT = "https:\/\/api\.open-meteo\.com\/v1\/forecast"/);
  assert.match(extendedEdgeFunction, /GFS_ENDPOINT = "https:\/\/api\.open-meteo\.com\/v1\/gfs"/);
  assert.match(extendedEdgeFunction, /forecast_days:\s*String\(FORECAST_DAYS\)/);
  assert.match(extendedEdgeFunction, /daily:\s*\[/);
  assert.doesNotMatch(extendedEdgeFunction, /\bcurrent:\s*\[/);
  assert.doesNotMatch(extendedEdgeFunction, /\bhourly:\s*\[/);
  assert.match(extendedEdgeFunction, /const attempts = await Promise\.all\(/);
  assert.match(extendedEdgeFunction, /candidates\.map\(async \(candidate\)/);
  assert.match(extendedEdgeFunction, /function forecastDayCount/);
  assert.match(
    extendedEdgeFunction,
    /forecastDayCount\(attempt\.payload\) > forecastDayCount\(selected\)/,
  );

  const bestMatchIndex = extendedEdgeFunction.indexOf('model: "Open-Meteo Best Match" as const');
  const gfsIndex = extendedEdgeFunction.indexOf('model: "NOAA GFS" as const');
  assert.ok(bestMatchIndex >= 0 && gfsIndex > bestMatchIndex);
  assert.match(extendedEdgeFunction, /payload:\s*next/);
});

test("cache estendido usa provider próprio sem abrir a tabela privada", () => {
  assert.match(extendedCacheMigration, /'open-meteo', 'open-meteo-extended'/);
  assert.match(extendedCacheMigration, /values \('open-meteo-extended'\)/);
  assert.match(extendedCacheMigration, /get_public_open_meteo_extended_cache_snapshot/);
  assert.match(extendedCacheMigration, /security definer/);
  assert.match(extendedCacheMigration, /set search_path = public, pg_temp/);
  assert.match(extendedCacheMigration, /where cache\.provider_key = 'open-meteo-extended'/);
  assert.match(extendedCacheMigration, /revoke all on function/);
  assert.match(extendedCacheMigration, /to anon, authenticated, service_role/);

  assert.match(extendedEdgeClient, /PROVIDER_KEY = "open-meteo-extended"/);
  assert.match(extendedEdgeClient, /EDGE_FUNCTION_NAME = "open-meteo-extended-forecast"/);
  assert.match(extendedEdgeClient, /PUBLIC_CACHE_RPC = "get_public_open_meteo_extended_cache_snapshot"/);
  assert.match(extendedEdgeClient, /readAdminPersistedPayload/);
  assert.match(extendedEdgeClient, /readPublicPersistedPayload/);
});

test("proveniência interna distingue Best Match, GFS e contingência legada", () => {
  assert.match(extendedTypes, /"Open-Meteo Best Match"/);
  assert.match(extendedTypes, /"NOAA GFS"/);
  assert.match(extendedTypes, /"Open-Meteo 7-day Cache"/);
  assert.match(extendedTypes, /requestedDays: 15/);
  assert.match(extendedServer, /model: "Open-Meteo 7-day Cache"/);
  assert.match(extendedServer, /returnedDays/);
  assert.doesNotMatch(extendedServer, /requestedDays:\s*7/);
});
