import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const statusTypes = readFileSync("src/lib/status/data-status.types.ts", "utf8");
const statusServer = readFileSync("src/lib/status/data-status.server.ts", "utf8");
const statusRoute = readFileSync("src/routes/status-dos-dados.tsx", "utf8");
const anaServer = readFileSync("src/lib/hydrology/ana-rhn-public.server.ts", "utf8");

const DATA_CONDITION_SERVICE_IDS = [
  "embrapa-current",
  "laranjal-level",
  "guaiba-level",
  "lagoon-regional-network",
  "defesa-civil-rs-hydromet",
  "ana-rhn",
] as const;

function windowAfter(source: string, marker: string, size = 2_200) {
  const index = source.indexOf(marker);
  assert.notEqual(index, -1, `marcador ausente: ${marker}`);
  return source.slice(index, index + size);
}

test("ServiceStatus supports an optional data condition separate from integration state", () => {
  assert.match(statusTypes, /state: ServiceState;/);
  assert.match(statusTypes, /detail: string;/);
  assert.match(statusTypes, /dataCondition\?: string;/);
});

test("dataCondition is implemented only for the six scoped services", () => {
  for (const id of DATA_CONDITION_SERVICE_IDS) {
    const window = windowAfter(statusServer, `\"${id}\"`);
    assert.match(window, /dataCondition/);
  }

  const weatherService = statusServer.match(
    /function weatherService[\s\S]*?\n}\n\nfunction applyMaintenanceWindows/,
  )?.[0];
  assert.ok(weatherService);
  assert.doesNotMatch(weatherService, /dataCondition/);

  for (const id of [
    "weather-open-meteo",
    "weather-met-norway",
    "weather-inmet",
    "weather-cppmet",
  ]) {
    const window = windowAfter(statusServer, `\"${id}\"`, 700);
    assert.doesNotMatch(window, /dataCondition/);
  }
});

test("status page renders data condition only when the service supplies it", () => {
  assert.match(statusRoute, /service\.dataCondition \? \(/);
  assert.match(statusRoute, /Condição do dado:/);
  assert.match(statusRoute, /\{service\.dataCondition\}/);
  assert.match(statusRoute, /showDetail/);
});

test("Embrapa condition follows freshness required by the Agora module", () => {
  const embrapaWindow = windowAfter(statusServer, 'if (embrapaResult.status === "fulfilled")', 4_000);
  assert.match(embrapaWindow, /normalizeEmbrapaObservedAt/);
  assert.match(embrapaWindow, /OBSERVATION_MAX_AGE_MINUTES/);
  assert.match(embrapaWindow, /data\.current\.temperature !== null/);
  assert.match(embrapaWindow, /elegível para o módulo Embrapa do Agora/);
});

test("Lagoa regional derives data condition from observation statuses", () => {
  const lagoonWindow = windowAfter(statusServer, 'if (lagoonResult.status === "fulfilled")', 3_400);
  assert.match(lagoonWindow, /data\.observations\.filter/);
  assert.match(lagoonWindow, /observation\.status === "live"/);
  assert.match(lagoonWindow, /observation\.status === "stale"/);
  assert.match(lagoonWindow, /observation\.status === "unavailable"/);
  assert.match(lagoonWindow, /liveCount/);
  assert.match(lagoonWindow, /staleCount/);
  assert.match(lagoonWindow, /unavailableCount/);
  assert.doesNotMatch(lagoonWindow, /observation\.risk/);
});

test("Defesa Civil condition follows the current eligible Pelotas station", () => {
  const defesaWindow = windowAfter(statusServer, 'if (defesaCivilResult.status === "fulfilled")', 3_400);
  assert.match(defesaWindow, /selectDefesaCivilCurrentStation\(data\.stations\)/);
  assert.match(defesaWindow, /currentStation/);
  assert.match(defesaWindow, /Leitura recente elegível para o módulo Defesa Civil do Agora em Pelotas/);
  assert.match(defesaWindow, /Nenhuma estação elegível de Pelotas tem leitura recente/);
});

test("ANA condition keeps the vertical-reference gate closed and ignores source QC as a public quality seal", () => {
  const anaWindow = windowAfter(statusServer, 'if (anaRhnResult.status === "fulfilled")', 3_300);
  assert.match(anaWindow, /snapshot\.publishableMeasurement === false/);
  assert.match(anaWindow, /snapshot\.verticalReference === null/);
  assert.match(anaWindow, /snapshot\.rawValue !== null/);
  assert.match(anaWindow, /snapshot\.rawObservedAt !== null/);
  assert.match(anaWindow, /referência vertical específica permanece não confirmada/);
  assert.doesNotMatch(anaWindow, /sourceDataStatus/);

  assert.match(anaServer, /publishableMeasurement: false/);
  assert.match(anaServer, /verticalReference: null/);
});