import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const overview = readFileSync("src/components/hydrology/HydrologyOverviewV2.tsx", "utf8");
const regional = readFileSync("src/components/hydrology/RegionalWaterNetwork.tsx", "utf8");
const sace = readFileSync("src/components/hydrology/SaceGuaibaContext.tsx", "utf8");

test("hydrology overview never renders unavailable regional integrations as zero-like counts", () => {
  assert.match(overview, /function lagoonAvailabilityLabel/);
  assert.match(overview, /lagoon\.status === "unavailable"\) return "Sem dados"/);
  assert.match(overview, /function saceAvailabilityLabel/);
  assert.match(overview, /sace\.status === "unavailable"\) return "Sem dados"/);
  assert.match(overview, /lagoonAvailabilityLabel\(lagoon\)/);
  assert.match(overview, /saceAvailabilityLabel\(sace\)/);
  assert.match(overview, /Consulta do portal/);
  assert.doesNotMatch(overview, /<dd>\{lagoon\.available\}\/\{lagoon\.total\}<\/dd>/);
  assert.doesNotMatch(
    overview,
    /<dd>\{sace\.counts\.transmitting\}\/\{sace\.counts\.total\}<\/dd>/,
  );
});

test("empty lagoon network renders an explicit compact unavailable state", () => {
  assert.match(regional, /const hasLagoonObservations = lagoon\.observations\.length > 0/);
  assert.match(regional, /Dados temporariamente indisponíveis nesta consulta/);
  assert.match(regional, /Rede da Lagoa sem leituras nesta atualização/);
  assert.match(regional, /Isso não\s+significa que a rede original esteja sem medições/);
  assert.match(regional, /alignSelf: "start"/);
  assert.match(regional, /Consulta do portal:/);
  assert.match(regional, /lagoon\.source\.fetchedAt/);
});

test("SACE unavailable state keeps all summary counts unknown rather than zero", () => {
  assert.match(sace, /function displayCount/);
  assert.match(sace, /data\.status === "unavailable" \? "—" : value/);
  assert.match(sace, /displayCount\(data, data\.counts\.total\)/);
  assert.match(sace, /displayCount\(data, data\.counts\.transmitting\)/);
  assert.match(sace, /displayCount\(data, data\.counts\.aboveNormal\)/);
  assert.match(sace, /displayCount\(data, data\.counts\.withoutTransmission\)/);
  assert.doesNotMatch(sace, /<strong>\{data\.counts\.aboveNormal\}<\/strong>/);
  assert.doesNotMatch(sace, /<strong>\{data\.counts\.withoutTransmission\}<\/strong>/);
});
