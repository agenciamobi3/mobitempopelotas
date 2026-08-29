import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const contingency = readFileSync(
  "src/lib/status/open-meteo-contingency-status.server.ts",
  "utf8",
);
const monitor = readFileSync("src/lib/status/data-status.server.ts", "utf8");

test("contingência do monitor usa apenas last-good recente e utilizável", () => {
  assert.match(contingency, /MAX_CONTINGENCY_AGE_MS = 30 \* 60 \* 1_000/);
  assert.match(contingency, /weather_provider_payload_cache/);
  assert.match(contingency, /provider_key/);
  assert.match(contingency, /const time = \(daily as Record<string, unknown>\)\.time/);
  assert.match(contingency, /Array\.isArray\(time\)/);
  assert.match(contingency, /hasUsableForecastPayload\(data\.payload\)/);
  assert.match(contingency, /ageMs <= MAX_CONTINGENCY_AGE_MS/);
  assert.doesNotMatch(contingency, /collector_token/);
  assert.doesNotMatch(contingency, /refresh_lease_token/);
  assert.doesNotMatch(contingency, /secretKey/);
});

test("monitor não chama contingência recente de offline", () => {
  assert.match(monitor, /getOpenMeteoContingencyStatus/);
  assert.match(monitor, /openMeteo\.source\.isFallback\s*\?\s*"partial"\s*:\s*"operational"/s);
  assert.match(monitor, /openMeteoContingency\?\.available\s*\?\s*"partial"\s*:\s*"offline"/s);
  assert.match(
    monitor,
    /A origem direta falhou nesta verificação, mas existe last-good persistido utilizável/,
  );
  assert.match(
    monitor,
    /A origem direta não respondeu normalmente; a previsão está sendo servida pela contingência Open-Meteo/,
  );
});
