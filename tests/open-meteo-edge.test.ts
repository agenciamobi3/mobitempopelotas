import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(
  "supabase/migrations/20260729071500_create_open_meteo_payload_cache.sql",
  "utf8",
);
const publicSnapshotMigration = readFileSync(
  "supabase/migrations/20260829050000_public_open_meteo_cache_snapshot.sql",
  "utf8",
);
const edgeFunction = readFileSync("supabase/functions/open-meteo-forecast/index.ts", "utf8");
const edgeClient = readFileSync("src/lib/weather/open-meteo-edge.server.ts", "utf8");
const resilient = readFileSync("src/lib/weather/open-meteo-resilient.server.ts", "utf8");
const baseline = readFileSync("src/lib/weather/weather-baseline.server.ts", "utf8");
const publicFunction = readFileSync("src/lib/weather/weather.functions.ts", "utf8");


test("cache completo do Open-Meteo é privado e controla concorrência", () => {
  assert.match(migration, /create table if not exists public\.weather_provider_payload_cache/);
  assert.match(migration, /payload jsonb not null default '\{\}'::jsonb/);
  assert.match(migration, /alter table public\.weather_provider_payload_cache enable row level security/);
  assert.match(migration, /for all to service_role/);
  assert.match(
    migration,
    /revoke all on table public\.weather_provider_payload_cache from public, anon, authenticated/,
  );
  assert.match(migration, /create or replace function public\.claim_weather_provider_refresh/);
  assert.match(migration, /refresh_lease_token = p_lease_token/);
  assert.match(migration, /last_success_at < now\(\) - make_interval/);
  assert.match(
    migration,
    /grant execute on function public\.claim_weather_provider_refresh\(text, uuid, integer, integer\)\s+to\s+service_role/,
  );
});


test("snapshot público expõe somente last-good meteorológico sem abrir a tabela privada", () => {
  assert.match(publicSnapshotMigration, /get_public_open_meteo_cache_snapshot/);
  assert.match(publicSnapshotMigration, /security definer/);
  assert.match(publicSnapshotMigration, /set search_path = public, pg_temp/);
  assert.match(publicSnapshotMigration, /where cache\.provider_key = 'open-meteo'/);
  assert.match(publicSnapshotMigration, /cache\.payload <> '\{\}'::jsonb/);
  assert.match(publicSnapshotMigration, /grant execute[^;]+to anon, authenticated, service_role/s);
  assert.doesNotMatch(publicSnapshotMigration, /collector_token/);
  assert.doesNotMatch(publicSnapshotMigration, /refresh_lease_token/);
  assert.doesNotMatch(publicSnapshotMigration, /last_attempt_at/);
  assert.doesNotMatch(publicSnapshotMigration, /weather_forecast_accuracy_settings/);
});


test("Edge Function exige token e preserva último payload válido", () => {
  assert.match(edgeFunction, /constantTimeEqual/);
  assert.match(edgeFunction, /x-collector-token/);
  assert.match(edgeFunction, /weather_forecast_accuracy_settings/);
  assert.match(edgeFunction, /claim_weather_provider_refresh/);
  assert.match(edgeFunction, /cacheStatus: "fresh"/);
  assert.match(edgeFunction, /\?\s*"shared"\s*:\s*"stale"/);
  assert.match(edgeFunction, /cacheStatus: "stale"/);
  assert.match(edgeFunction, /cacheStatus: "refreshed"/);
  assert.match(edgeFunction, /hasForecastPayload\(cached\.payload\)/);
  assert.match(edgeFunction, /status: cached && hasForecastPayload\(cached\.payload\) \? "stale" : "unavailable"/);
  assert.match(edgeFunction, /forecast_days: "7"/);
  assert.match(edgeFunction, /precipitation_probability/);
  assert.match(edgeFunction, /wind_gusts_10m/);
  assert.doesNotMatch(edgeFunction, /Access-Control-Allow-Origin/);
});


test("cliente server-only prefere last-good privado e usa snapshot público sem service role", () => {
  assert.match(edgeClient, /PROVIDER_KEY = "open-meteo"/);
  assert.match(edgeClient, /PUBLIC_CACHE_RPC = "get_public_open_meteo_cache_snapshot"/);
  assert.match(edgeClient, /readAdminPersistedPayload/);
  assert.match(edgeClient, /readPublicPersistedPayload/);
  assert.match(edgeClient, /normalizePersistedRow/);
  assert.match(edgeClient, /CACHE_READ_TIMEOUT_MS = 1_200/);
  assert.match(edgeClient, /SETTINGS_READ_TIMEOUT_MS = 1_200/);
  assert.match(edgeClient, /EDGE_REQUEST_TIMEOUT_MS = 2_200/);
  assert.match(edgeClient, /apikey: publishableKey/);
  assert.doesNotMatch(edgeClient, /Authorization: `Bearer \$\{publishableKey\}`/);
  assert.match(edgeClient, /createSupabaseAdminClient/);
  assert.match(edgeClient, /weather_provider_payload_cache/);
  assert.match(edgeClient, /weather_forecast_accuracy_settings/);
  assert.match(edgeClient, /"X-Collector-Token": settings\.collector_token/);
  assert.doesNotMatch(edgeClient, /export const collectorToken/);
});


test("admin lê last-good antes de tentar refresh Edge", () => {
  const fallbackFlow = edgeClient.slice(
    edgeClient.indexOf("export async function fetchOpenMeteoPayloadViaEdge"),
  );
  const adminIndex = fallbackFlow.indexOf("createSupabaseAdminClient");
  const cacheIndex = fallbackFlow.indexOf("readAdminPersistedPayload(admin)");
  const edgeIndex = fallbackFlow.indexOf("fetchViaEdge(admin, config.url)");
  const publicIndex = fallbackFlow.indexOf("readPublicPersistedPayload");

  assert.ok(adminIndex >= 0 && cacheIndex > adminIndex && edgeIndex > cacheIndex);
  assert.ok(publicIndex > edgeIndex);
  assert.match(fallbackFlow, /if \(persisted\) return persisted/);
});


test("last-good válido continua utilizável quando a última tentativa marcou indisponibilidade", () => {
  assert.match(edgeClient, /row\.status === "live" && ageMs\(referenceTime\) <= CACHE_FRESH_MS/);
  assert.match(edgeClient, /cacheStatus: fresh \? "fresh" : "stale"/);
  assert.doesNotMatch(edgeClient, /row\.status === "unavailable"\) return null/);
  assert.match(edgeClient, /Usando a última previsão válida persistida do Open-Meteo/);
});


test("agregação prioriza origem direta e usa contingência persistida somente após falha", () => {
  const publicFlow = resilient.slice(
    resilient.indexOf("export async function fetchPelotasWeather"),
  );
  const directIndex = publicFlow.indexOf("fetchOpenMeteoDirect()");
  const edgeIndex = publicFlow.indexOf("fetchOpenMeteoPayloadViaEdge()");

  assert.ok(directIndex >= 0 && edgeIndex > directIndex);
  assert.match(publicFlow, /if \(direct\.status !== "unavailable"\) return direct/);
  assert.match(publicFlow, /edge\.cacheStatus === "stale"/);
  assert.match(publicFlow, /return direct;/);
  assert.match(
    baseline,
    /from "\.\/open-meteo-resilient\.server"/,
  );
  assert.doesNotMatch(baseline, /from "\.\/open-meteo\.server"/);
  assert.match(publicFunction, /from "\.\/open-meteo-resilient\.server"/);
});
