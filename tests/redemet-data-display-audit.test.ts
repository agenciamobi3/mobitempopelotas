import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const overview = readFileSync("src/components/redemet/RedemetOverview.tsx", "utf8");
const derived = readFileSync("src/components/redemet/RedemetDerivedContext.tsx", "utf8");
const recovery = readFileSync("src/production/lib/redemet-browser-recovery.ts", "utf8");
const radar = readFileSync("src/lib/redemet/redemet-radar.server.ts", "utf8");
const radarLoader = readFileSync("src/lib/redemet/radar-page-loader.ts", "utf8");
const redemetFunctions = readFileSync("src/lib/redemet/redemet.functions.ts", "utf8");
const statusProbes = readFileSync(
  "src/lib/status/data-status-redemet-probes.server.ts",
  "utf8",
);
const satellite = readFileSync(
  "src/lib/redemet/redemet-satellite-resilient.server.ts",
  "utf8",
);
const storms = readFileSync("src/lib/redemet/redemet-stsc.server.ts", "utf8");

test("INMET fallback is identified once instead of duplicating the same satellite collection", () => {
  assert.match(overview, /const satelliteUsesInmetFallback = data\.satellite\.provider === "INMET"/);
  assert.match(overview, /Satélite INMET · contingência/);
  assert.match(overview, /!satelliteUsesInmetFallback \? \(/);
  assert.match(overview, /A camada principal usa a contingência oficial do INMET/);
  assert.match(
    overview,
    /satelliteUsesInmetFallback\s*\? \[data\.radar, data\.satellite, data\.storms\]\s*:\s*\[data\.radar, data\.satellite, data\.inmetSatellite, data\.storms\]/,
  );

  assert.match(derived, /const satelliteUsesInmetFallback = data\.satellite\.provider === "INMET"/);
  assert.match(derived, /Satélite INMET · contingência/);
  assert.match(derived, /!satelliteUsesInmetFallback \? \(/);
});

test("missing STSC collection never becomes a fabricated zero-lightning reading", () => {
  assert.match(derived, /const hasUsableFrame = frame !== null/);
  assert.match(derived, /Sem coleta STSC com horário utilizável/);
  assert.match(derived, /Isso não equivale a zero raios na região/);
  assert.match(derived, /data-stsc-frame=\{hasUsableFrame \? "available" : "unavailable"\}/);
  assert.match(derived, /<dd>\{hasUsableFrame \? near : "—"\}<\/dd>/);
  assert.match(derived, /<dd>\{hasUsableFrame \? middle : "—"\}<\/dd>/);
  assert.match(derived, /<dd>\{hasUsableFrame \? regional : "—"\}<\/dd>/);
  assert.match(derived, /Nenhum raio detectado na última coleta recebida/);
});

test("post-hydration recovery covers every collection that can be shown to the visitor", () => {
  assert.match(recovery, /hasFrames\(data\.radar\)/);
  assert.match(recovery, /hasFrames\(data\.satellite\)/);
  assert.match(recovery, /hasFrames\(data\.inmetSatellite\)/);
  assert.match(recovery, /hasFrames\(data\.storms\)/);
  assert.match(recovery, /satélite REDEMET, satélite INMET ou STSC/);
  assert.match(recovery, /mergeRedemetOverview/);
  assert.match(recovery, /if \(recovered\.frames\.length > 0\) return recovered/);
  assert.match(recovery, /if \(baseline\.frames\.length > 0\) return baseline/);
});

test("radar internal budget fits the real recovery and monitoring windows without delaying initial SSR", () => {
  assert.match(radar, /const REQUEST_TIMEOUT_MS = 4_200/);
  assert.match(radar, /abaixo do teto de 4,5 s do overview e de 5 s do probe independente/);
  assert.match(redemetFunctions, /const OVERVIEW_LAYER_DEADLINE_MS = 4_500/);
  assert.match(statusProbes, /const PROBE_DEADLINE_MS = 5_000/);
  assert.match(radarLoader, /const PUBLIC_RADAR_PAGE_DEADLINE_MS = 2_800/);
  assert.match(radar, /AbortSignal\.timeout\(REQUEST_TIMEOUT_MS\)/);
});

test("radar still requires Pelotas coverage and satellite fallback preserves product semantics", () => {
  assert.match(radar, /boundsContainPoint\(frame\.bounds, PELOTAS_COORDINATES\)/);
  assert.match(radar, /const DEFAULT_RADAR_AREA = "sg"/);
  assert.match(radar, /const FALLBACK_RADAR_AREAS = \["sg", "cn"\]/);
  assert.match(radar, /url\.searchParams\.set\("anima", String\(frameCount\)\)/);
  assert.match(radar, /url\.searchParams\.set\("api_key", key\)/);

  assert.match(satellite, /if \(redemet\.available \|\| type === "vis"\) return redemet/);
  assert.match(satellite, /if \(inmet\?\.available\)/);
  assert.match(satellite, /contingência oficial/);
  assert.match(satellite, /O canal Visível não recebe fallback infravermelho/);
});

test("STSC requests a real upstream animation window and keeps valid zero-point frames", () => {
  assert.match(storms, /url\.searchParams\.set\("anima", String\(frameCount\)\)/);
  assert.match(storms, /url\.searchParams\.set\("api_key", key\)/);
  assert.match(storms, /const frames = parseRedemetStscPayload\(payload\)\.slice\(-framesRequested\)/);
  assert.match(storms, /points: parsePoints\(frame\?\.pontos\)/);
  assert.doesNotMatch(storms, /points\.length > 0.*available/s);
});
