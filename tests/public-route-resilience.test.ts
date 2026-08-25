import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { createUnavailableWeatherIntelligence } from "../src/lib/weather/weather-intelligence-fallback.ts";

const weatherFunctions = readFileSync(
  "src/lib/weather/weather-intelligence.functions.ts",
  "utf8",
);
const staleClientRecovery = readFileSync("src/lib/stale-client-recovery.ts", "utf8");
const rootRoute = readFileSync("src/routes/__root.tsx", "utf8");

test("fallback meteorologico final preserva o contrato sem inventar valores", () => {
  const fallback = createUnavailableWeatherIntelligence();

  assert.equal(fallback.weather.status, "unavailable");
  assert.equal(fallback.weather.current, null);
  assert.deepEqual(fallback.weather.hourly, []);
  assert.deepEqual(fallback.weather.daily, []);
  assert.deepEqual(fallback.weather.alerts, []);
  assert.deepEqual(fallback.weather.inmetForecast, []);
  assert.deepEqual(fallback.weather.officialForecast, []);
  assert.equal(fallback.weather.quality.score, 0);
  assert.equal(fallback.weather.quality.confidence, "low");
  assert.equal(fallback.intelligence.origin, "deterministic");
  assert.equal(fallback.intelligence.geminiStatus, "unavailable");

  for (const source of Object.values(fallback.weather.sources)) {
    assert.equal(source.status, "unavailable");
    assert.equal(source.usable, false);
  }
});

test("server fn meteorologica possui ultima barreira contra excecoes inesperadas", () => {
  assert.match(weatherFunctions, /try\s*\{/);
  assert.match(weatherFunctions, /await fetchWeatherIntelligence\(\)/);
  assert.match(weatherFunctions, /catch \(error\)/);
  assert.match(weatherFunctions, /return createUnavailableWeatherIntelligence\(\)/);
});

test("cliente recupera uma unica vez bundles antigos depois de deploy", () => {
  assert.match(staleClientRecovery, /vite:preloadError/);
  assert.match(staleClientRecovery, /failed to fetch dynamically imported module/i);
  assert.match(staleClientRecovery, /chunkloaderror/i);
  assert.match(staleClientRecovery, /sessionStorage/);
  assert.match(staleClientRecovery, /RECOVERY_WINDOW_MS = 60_000/);
  assert.match(staleClientRecovery, /window\.location\.reload\(\)/);

  assert.match(rootRoute, /installVitePreloadRecovery/);
  assert.match(rootRoute, /recoverStaleClientAssets\(error\)/);
});
