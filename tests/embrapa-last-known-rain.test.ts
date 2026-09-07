import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const currentGate = readFileSync("src/lib/weather/embrapa-current.server.ts", "utf8");
const aggregatedWeather = readFileSync("src/lib/weather/aggregated-weather.server.ts", "utf8");
const rainAccumulation = readFileSync(
  "src/components/weather/RainAccumulationContext.tsx",
  "utf8",
);
const publicRoute = readFileSync("src/routes/api/weather/embrapa.ts", "utf8");

test("snapshot central atrasado continua disponível como último valor conhecido", () => {
  assert.match(currentGate, /isCentralEmbrapaSnapshotFresh\(central\)/);
  assert.match(currentGate, /if \(central\.status !== "unavailable"\) return central/);
  assert.match(currentGate, /return fetchEmbrapaObservation\(\)/);
});

test("snapshot antigo nunca volta a representar o agora", () => {
  assert.match(
    aggregatedWeather,
    /status:\s*embrapaIsStale \? "stale" : observation\.status/,
  );
  assert.match(aggregatedWeather, /deriveEmbrapaCurrent\(observation, observationAgeMinutes\)/);
  assert.match(
    aggregatedWeather,
    /const normalizedCurrentSource:[\s\S]*?embrapaUsable[\s\S]*?\? "embrapa"[\s\S]*?: null/,
  );
  assert.match(publicRoute, /status:\s*publishable \? 200 : 503/);
});

test("página de chuva diferencia leitura atual de último acumulado conhecido", () => {
  assert.match(
    rainAccumulation,
    /observationIsCurrent \? "Medido hoje" : "Último acumulado diário"/,
  );
  assert.match(rainAccumulation, /observationHasKnownValue/);
  assert.match(rainAccumulation, /formatDateTime\(observationTime\)/);
  assert.match(rainAccumulation, /observation\.accumulated\.rainMonthly/);
});
