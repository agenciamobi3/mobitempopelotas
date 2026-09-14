import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const enrichment = readFileSync(
  "src/components/auth/RegisteredMeteogramEnrichment.tsx",
  "utf8",
);
const route = readFileSync("src/routes/meteograma-pelotas.tsx", "utf8");

test("leitura inteligente reaproveita a previsão horária recuperada quando o meteograma dedicado falha", () => {
  assert.match(enrichment, /function fallbackHours\(weather: WeatherIntelligenceData\)/);
  assert.match(enrichment, /weather\.weather\.hourly\.map/);
  assert.match(
    enrichment,
    /meteogram\.status === "live"[\s\S]*meteogram\.hours\.slice\(0, 48\)[\s\S]*fallbackHours\(weather\)\.slice\(0, 48\)/,
  );
  assert.match(enrichment, /const unavailable = summary\.hours\.length === 0/);
  assert.doesNotMatch(enrichment, /meteogram\.status === "unavailable" \|\| summary\.hours\.length === 0/);
  assert.match(
    route,
    /<RegisteredMeteogramEnrichment meteogram=\{meteogram\} weather=\{recoveredWeather\} \/>/,
  );
});
