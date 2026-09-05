import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const lagoon = readFileSync("src/lib/hydrology/lagoon-network.server.ts", "utf8");
const regionalWater = readFileSync(
  "src/components/hydrology/RegionalWaterNetwork.tsx",
  "utf8",
);
const route = readFileSync("src/routes/situacao-hidrologica-pelotas.tsx", "utf8");
const networkRecovery = readFileSync(
  "src/components/hydrology/useHydrologyNetworkRecovery.ts",
  "utf8",
);
const publicLoader = readFileSync(
  "src/lib/hydrology/public-hydrology-page-loader.ts",
  "utf8",
);

test("audited lagoon thresholds do not preserve the stale Sao Jose do Norte reference", () => {
  assert.match(
    lagoon,
    /id: "sao-jose-do-norte"[\s\S]{0,320}floodLevelCm: 80/,
  );
  assert.doesNotMatch(
    lagoon,
    /id: "sao-jose-do-norte"[\s\S]{0,320}floodLevelCm: 108/,
  );
  assert.match(lagoon, /LAGOON_MONITORING_SOURCE_URL = "https:\/\/monitoramentolagoadospatos\.com\.br\/"/);
});

test("lagoon stations can omit unpublished local thresholds without inventing risk", () => {
  assert.match(lagoon, /floodLevelCm: number \| null/);
  assert.match(lagoon, /may2024MaximumCm: number \| null/);
  assert.match(lagoon, /"unclassified"/);
  assert.match(lagoon, /const hasFloodReference =/);
  assert.match(lagoon, /const risk: LagoonMonitoringRisk = !hasFloodReference/);
  assert.match(lagoon, /distanceToFloodCm = hasFloodReference/);
  assert.match(lagoon, /floodThresholdPercentage = hasFloodReference/);
  assert.match(regionalWater, /Sem cota local publicada/);
  assert.match(regionalWater, /Comparação com cota indisponível/);
  assert.match(regionalWater, /observation\.floodLevelCm === null/);
  assert.match(regionalWater, /observation\.may2024MaximumCm === null/);
});

test("new lagoon stations are not guessed before their public sensor ids are verified", () => {
  assert.doesNotMatch(lagoon, /name: "Tavares"/);
  assert.doesNotMatch(lagoon, /name: "Pelotas"/);
});

test("hydrology route propagates recovered weather into the 24 hour context", () => {
  assert.match(route, /\{\(recoveredWeather\) => \(/);
  assert.match(route, /weather=\{recoveredWeather\}/);
  assert.doesNotMatch(route, /weather=\{data\.weather\}/);
});

test("SACE and Defesa Civil recover independently after an initial deadline fallback", () => {
  assert.match(route, /useHydrologyNetworkRecovery\(data\.sace, data\.defesaCivil\)/);
  assert.match(route, /sace=\{recoveredNetworks\.sace\}/);
  assert.match(route, /data=\{recoveredNetworks\.defesaCivil\}/);

  assert.match(networkRecovery, /getSaceGuaibaData\(\)/);
  assert.match(networkRecovery, /getDefesaCivilHydroData\(\)/);
  assert.match(networkRecovery, /baselineSace\.status !== "unavailable"/);
  assert.match(networkRecovery, /baselineDefesaCivil\.status !== "unavailable"/);
  assert.match(networkRecovery, /canReplaceSace/);
  assert.match(networkRecovery, /canReplaceDefesaCivil/);
  assert.doesNotMatch(networkRecovery, /setInterval\(|setTimeout\(/);
});

test("client hydrology recovery contains synchronous server function failures", () => {
  assert.match(networkRecovery, /function runRecovery<T>\(run: \(\) => Promise<T>\)/);
  assert.match(networkRecovery, /Promise\.resolve\(\)\.then\(run\)/);
  assert.match(networkRecovery, /runRecovery\(\(\) => getSaceGuaibaData\(\)\)/);
  assert.match(networkRecovery, /runRecovery\(\(\) => getDefesaCivilHydroData\(\)\)/);
  assert.doesNotMatch(networkRecovery, /void getSaceGuaibaData\(\)/);
  assert.doesNotMatch(networkRecovery, /void getDefesaCivilHydroData\(\)/);
});

test("public hydrology loader still isolates source failures rather than rejecting the route", () => {
  assert.match(publicLoader, /Promise\.allSettled/);
  assert.match(publicLoader, /settledValueOrFallback/);
  assert.match(publicLoader, /createUnavailableSaceGuaibaData/);
  assert.match(publicLoader, /createUnavailableDefesaCivilHydroData/);
});
