import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const overview = readFileSync("src/components/redemet/RedemetOverview.tsx", "utf8");
const derived = readFileSync("src/components/redemet/RedemetDerivedContext.tsx", "utf8");
const stormMap = readFileSync("src/components/redemet/StormMapFrame.tsx", "utf8");
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

test("INMET fallback stays identified without a permanent empty complementary panel", () => {
  assert.match(overview, /const satelliteUsesInmetFallback = selectedSatellite\.provider === "INMET"/);
  assert.match(overview, /Satélite INMET · contingência/);
  assert.match(overview, /const secondarySatelliteType: RedemetSatelliteType = selectedSatelliteType === "ir" \? "realcada" : "ir"/);
  assert.match(overview, /secondaryRaw\.provider === "REDEMET \/ DECEA"/);
  assert.match(overview, /Satélite REDEMET · \$\{secondaryProduct\.label\}/);
  assert.doesNotMatch(overview, /title="Satélite INMET"/);
  assert.doesNotMatch(overview, /GOES infravermelho complementar/);

  assert.match(derived, /Satélite INMET · contingência/);
  assert.match(derived, /Satélite REDEMET · Realçado/);
  assert.doesNotMatch(derived, /CollectionRow icon=\{Satellite\} label="Satélite INMET" layer=\{data\.inmetSatellite\}/);
});

test("dedicated page exposes realçado, infravermelho and visível without fabricating browser timestamps", () => {
  assert.match(overview, /RedemetSatelliteType/);
  assert.match(overview, /type: "realcada"/);
  assert.match(overview, /type: "ir"/);
  assert.match(overview, /type: "vis"/);
  assert.match(overview, /useState<RedemetSatelliteType>\("realcada"\)/);
  assert.match(overview, /\{ realcada: data\.satellite \}/);
  assert.match(overview, /selectedSatelliteType === "realcada"\s*\? data\.satellite/);
  assert.match(overview, /fetch\(`\/api\/redemet\/satellite\?type=\$\{type\}&frames=4`/);
  assert.match(overview, /const controller = new AbortController\(\)/);
  assert.match(overview, /fetchSatelliteProduct\(type, controller\.signal\)/);
  assert.match(
    overview,
    /return \(\) => \{\s*active = false;\s*controller\.abort\(\);\s*\}/,
  );
  assert.match(overview, /updatedAt: ""/);
  assert.doesNotMatch(overview, /new Date\(\)/);
  assert.match(overview, /aria-pressed=\{selectedSatelliteType === product\.type\}/);
  assert.match(overview, /Produto de satélite REDEMET/);
  assert.match(
    overview,
    /Use a sequência para comparar contrastes e temperaturas de topo de nuvem\./,
  );
});

test("visible satellite has an explicit daylight pause and a separate future-window formatter", () => {
  assert.match(overview, /availabilityReason === "daylight"/);
  assert.match(overview, /Aguardando luz solar/);
  assert.match(overview, /Canal Visível aguardando luz solar/);
  assert.match(overview, /O canal Visível usa luz solar refletida/);
  assert.match(overview, /nextExpectedAt/);
  assert.match(overview, /Próxima janela estimada/);
  assert.match(overview, /formatExpectedSatelliteDateTime/);
  assert.match(overview, /Date\.parse\(value\)/);
  assert.match(overview, /timeZone: "America\/Sao_Paulo"/);
  assert.match(overview, /O canal Visível depende de luz solar e volta a produzir imagem útil durante o dia/);

  assert.match(satellite, /if \(redemet\.available \|\| type === "vis"\) return redemet/);
  assert.match(satellite, /O canal Visível não recebe fallback infravermelho/);
});

test("STSC player changes a real regional map and keeps valid zero-point frames", () => {
  assert.match(overview, /import \{ StormMapFrame \} from "\.\/StormMapFrame"/);
  assert.match(overview, /<StormMapFrame frame=\{selected\} \/>/);
  assert.match(stormMap, /stormGeoJson\(frame\.points\)/);
  assert.match(stormMap, /source\?\.setData\(stormGeoJson\(frame\.points\)\)/);
  assert.match(stormMap, /Pelotas/);
  assert.match(stormMap, /Nenhum raio detectado nesta coleta/);

  assert.match(derived, /const hasUsableFrame = frame !== null/);
  assert.match(derived, /Sem coleta STSC com horário utilizável/);
  assert.match(derived, /<dd>\{hasUsableFrame \? near : "—"\}<\/dd>/);
  assert.match(derived, /<dd>\{hasUsableFrame \? middle : "—"\}<\/dd>/);
  assert.match(derived, /<dd>\{hasUsableFrame \? regional : "—"\}<\/dd>/);
  assert.match(derived, /Nenhum raio detectado na última coleta recebida/);
});

test("post-hydration recovery still covers upstream collections used by the page", () => {
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
