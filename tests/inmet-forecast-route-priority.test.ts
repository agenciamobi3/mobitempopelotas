import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync("src/lib/weather/inmet-forecast-resilient.server.ts", "utf8");

test("previsão INMET prioriza a rota que respondeu com payload válido em produção", () => {
  assert.match(
    source,
    /STABLE_FORECAST_URL = `https:\/\/apiprevmet3\.inmet\.gov\.br\/previsao\/\$\{PELOTAS_IBGE_CODE\}`/,
  );
  assert.match(
    source,
    /ALTERNATE_FORECAST_URL = `https:\/\/apiprevmet3\.inmet\.gov\.br\/api\/forecast\/\$\{PELOTAS_IBGE_CODE\}`/,
  );
  assert.match(source, /fetchForecastEndpoint\(stableAttempt, stableController\.signal\)/);
  assert.match(source, /setTimeout\(startAlternate, ALTERNATE_START_DELAY_MS\)/);
  assert.match(source, /ALTERNATE_START_DELAY_MS = 900/);
});

test("rota alternativa 404 não recebe budget maior que a rota funcional", () => {
  assert.match(source, /STABLE_ENDPOINT_TIMEOUT_MS = 2_800/);
  assert.match(source, /ALTERNATE_ENDPOINT_TIMEOUT_MS = 2_400/);
  assert.match(source, /404 E_ROUTE_NOT_FOUND/);
  assert.doesNotMatch(source, /LEGACY_START_DELAY_MS/);
});
