import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(
  "supabase/migrations/20260906065500_embrapa_collector_adaptive_backoff.sql",
  "utf8",
);
const originalCentralization = readFileSync(
  "supabase/migrations/20260729013000_centralize_embrapa_observations.sql",
  "utf8",
);

test("coletor Embrapa mantém cron por minuto e aplica backoff adaptativo por falhas", () => {
  assert.match(originalCentralization, /tempo-pelotas-embrapa-every-minute/);
  assert.match(originalCentralization, /'\* \* \* \* \*'/);
  assert.match(migration, /create or replace function public\.invoke_embrapa_collector\(\)/);
  assert.match(migration, /consecutive_failures/);
  assert.match(migration, />= 3 then interval '2 minutes'/);
  assert.match(migration, />= 10 then interval '5 minutes'/);
  assert.match(migration, />= 60 then interval '10 minutes'/);
  assert.match(migration, /last_attempt_at > now\(\) - minimum_interval/);
  assert.match(migration, /return null;/);
});

test("backoff não troca a fonte nem afrouxa a autenticação do coletor", () => {
  assert.match(migration, /weather_collector_settings/);
  assert.match(migration, /station_id = 'embrapa-cpact-sede-pelotas'/);
  assert.match(migration, /X-Collector-Token/);
  assert.match(migration, /Supabase-Cron\/Tempo-Pelotas/);
  assert.match(migration, /revoke execute on function public\.invoke_embrapa_collector\(\) from public, anon, authenticated/);
  assert.match(migration, /grant execute on function public\.invoke_embrapa_collector\(\) to service_role/);
  assert.doesNotMatch(migration, /open-meteo|met norway|inmet/i);
});
