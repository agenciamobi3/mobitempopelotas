import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const probes = readFileSync(
  "src/lib/status/data-status-redemet-probes.server.ts",
  "utf8",
);
const satellite = readFileSync(
  "src/lib/redemet/redemet-satellite-resilient.server.ts",
  "utf8",
);
const statusFunctions = readFileSync("src/lib/status/data-status.functions.ts", "utf8");
const statusCron = readFileSync("src/routes/api/cron/data-status.ts", "utf8");

test("status mede Radar, satélite REDEMET, STSC e GOES/INMET por adapters próprios", () => {
  assert.match(probes, /fetchRedemetRadarResilient/);
  assert.match(probes, /fetchOfficialRedemetSatellite/);
  assert.match(probes, /fetchRedemetStorms/);
  assert.match(probes, /fetchInmetSatellite/);
  assert.match(probes, /fetchOfficialRedemetSatellite\("realcada", SATELLITE_FRAMES\)/);
  assert.doesNotMatch(probes, /getRedemetOverview/);
  assert.doesNotMatch(probes, /selectOfficialSatelliteResult/);
});

test("cada probe mantém timeout operacional próprio e preserva motivo sanitizado", () => {
  assert.match(probes, /PROBE_DEADLINE_MS = 5_000/);
  assert.match(probes, /Promise\.race/);
  assert.match(probes, /layer\.error \|\|/);
  assert.match(probes, /timeout desta integração, não indisponibilidade global da fonte oficial/);
  assert.match(probes, /frameDetail/);
  assert.match(probes, /quadros utilizáveis/);
});

test("satélite REDEMET diagnostica estrutura sem registrar URL autenticada", () => {
  assert.match(satellite, /sanitizedPayloadDiagnostic/);
  assert.match(satellite, /collectCandidateImageHosts/);
  assert.match(satellite, /hostsCandidatos=/);
  assert.match(satellite, /chavesRaiz=/);
  assert.match(satellite, /chavesData=/);
  assert.match(satellite, /imagensAceitas=/);
  assert.doesNotMatch(satellite, /console\.(?:log|warn|error)\([^\n]*api_key/);
});

test("overview público e cron persistente usam o mesmo wrapper independente", () => {
  assert.match(statusFunctions, /collectDataStatusWithIndependentRedemet/);
  assert.doesNotMatch(statusFunctions, /collectDataStatus\(\)/);
  assert.match(statusCron, /collectDataStatusWithIndependentRedemet/);
  assert.doesNotMatch(statusCron, /const overview = await collectDataStatus\(\)/);
});

test("wrapper substitui somente os quatro serviços de radar e satélite e recalcula overall", () => {
  for (const id of [
    "redemet-radar",
    "redemet-satellite",
    "redemet-stsc",
    "inmet-satellite",
  ]) {
    assert.match(probes, new RegExp(`"${id}"`));
  }
  assert.match(probes, /REDEMET_SERVICE_IDS/);
  assert.match(probes, /overallState\(services\)/);
});
