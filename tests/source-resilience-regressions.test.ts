import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { selectOfficialSatelliteResult } from "../src/lib/redemet/redemet-satellite-resilient.server.ts";
import type { RedemetImageLayerResponse } from "../src/lib/redemet/redemet.types.ts";

const inmetResilientSource = readFileSync(
  "src/lib/weather/inmet-forecast-resilient.server.ts",
  "utf8",
);
const inmetSatelliteSource = readFileSync(
  "src/lib/weather/inmet-satellite.server.ts",
  "utf8",
);
const imageProxySource = readFileSync("src/routes/api/redemet/image.ts", "utf8");
const redemetSatelliteSource = readFileSync(
  "src/lib/redemet/redemet-satellite-resilient.server.ts",
  "utf8",
);
const redemetOverviewSource = readFileSync("src/lib/redemet/redemet.functions.ts", "utf8");
const officialSources = readFileSync("src/lib/weather/official-sources.server.ts", "utf8");
const sourcePolicy = readFileSync("src/lib/weather/source-policy.ts", "utf8");
const satelliteRoute = readFileSync("src/routes/api/redemet/satellite.ts", "utf8");
const radarRoute = readFileSync("src/routes/api/redemet/radar.ts", "utf8");
const stormsRoute = readFileSync("src/routes/api/redemet/storms.ts", "utf8");

function imageLayer(
  provider: RedemetImageLayerResponse["provider"],
  available: boolean,
  error: string | null,
): RedemetImageLayerResponse {
  return {
    configured: true,
    available,
    provider,
    product: provider === "INMET" ? "GOES — infravermelho" : "Satélite infravermelho realçado",
    sourceLabel: provider === "INMET" ? "GOES / Região Sul / canal infravermelho" : "Satélite REDEMET",
    frames: available
      ? [
          {
            id: "frame-1",
            label: "18:00",
            observedAt: "2026-08-27T21:00:00.000Z",
            imageUrl: "/api/redemet/image?test=1",
            bounds: { west: -60, south: -36, east: -45, north: -20 },
          },
        ]
      : [],
    currentIndex: 0,
    updatedAt: "2026-08-27T21:00:00.000Z",
    error,
  };
}

test("previsao municipal INMET prioriza endpoint atual sem falso timeout agressivo", () => {
  const current = inmetResilientSource.indexOf("/api/forecast/");
  const legacy = inmetResilientSource.indexOf("/previsao/");

  assert.ok(current >= 0);
  assert.ok(legacy > current);
  assert.match(inmetResilientSource, /CURRENT_ENDPOINT_TIMEOUT_MS = 3_200/);
  assert.match(inmetResilientSource, /LEGACY_ENDPOINT_TIMEOUT_MS = 2_800/);
  assert.match(inmetResilientSource, /LEGACY_START_DELAY_MS = 650/);
  assert.match(inmetResilientSource, /Origin: "https:\/\/previsao\.inmet\.gov\.br"/);
  assert.match(inmetResilientSource, /Referer: `\$\{INMET_FORECAST_APP_URL\}\/`/);
  assert.match(inmetResilientSource, /integração pela rota/);
  assert.match(inmetResilientSource, /setTimeout\(startLegacy, LEGACY_START_DELAY_MS\)/);
  assert.match(officialSources, /fetchResilientInmetForecast/);
  assert.match(officialSources, /OFFICIAL_SOURCE_DEADLINE_MS\.inmetForecast/);
  assert.match(sourcePolicy, /inmetForecast:\s*4_000/);
});

test("satelite INMET diferencia recusada da integracao de indisponibilidade publica", () => {
  assert.match(inmetSatelliteSource, /Origin: "https:\/\/satelite\.inmet\.gov\.br"/);
  assert.match(inmetSatelliteSource, /Referer: OFFICIAL_URL/);
  assert.match(inmetSatelliteSource, /if \(response\.status === 403\)/);
  assert.match(inmetSatelliteSource, /requestJson\(url, false\)/);
  assert.match(inmetSatelliteSource, /não confirma indisponibilidade do portal público do INMET/);
});

test("proxy do satelite INMET aceita contrato JSON base64 sem enfraquecer validacao de imagem", () => {
  assert.match(imageProxySource, /typeof record\?\.base64 === "string"/);
  assert.match(imageProxySource, /Buffer\.from\(encoded, "base64"\)/);
  assert.match(imageProxySource, /detectImageContentType/);
  assert.match(imageProxySource, /MAX_IMAGE_BYTES/);
  assert.match(imageProxySource, /ALLOWED_INMET_HOSTS/);
  assert.match(imageProxySource, /O INMET respondeu sem uma imagem base64 utilizável/);
});

test("satelite REDEMET usa a mesma autenticacao oficial ja adotada por radar e STSC", () => {
  assert.match(redemetSatelliteSource, /url\.searchParams\.set\("api_key", key\)/);
  assert.match(redemetSatelliteSource, /fetchOfficialRedemetSatellite/);
  assert.doesNotMatch(redemetSatelliteSource, /"X-Api-Key"/);
  assert.match(redemetSatelliteSource, /record\.path/);
  assert.match(redemetSatelliteSource, /record\.src/);
});

test("overview usa os adaptadores resilientes e seleciona contingencia sem duplicar semantica", () => {
  assert.match(redemetOverviewSource, /OVERVIEW_LAYER_DEADLINE_MS = 4_500/);
  assert.match(redemetOverviewSource, /fetchOfficialRedemetSatellite\("realcada", IMAGE_FRAME_WINDOW\)/);
  assert.match(redemetOverviewSource, /selectOfficialSatelliteResult/);
  assert.doesNotMatch(redemetOverviewSource, /fetchRedemetSatellite\("realcada"/);
});

test("satelite preserva REDEMET quando a camada pedida esta disponivel", () => {
  const redemet = imageLayer("REDEMET / DECEA", true, null);
  const inmet = imageLayer("INMET", true, null);

  assert.equal(selectOfficialSatelliteResult("realcada", redemet, inmet), redemet);
});

test("realcado e infravermelho usam GOES INMET como contingencia oficial", () => {
  const redemet = imageLayer("REDEMET / DECEA", false, "REDEMET indisponível");
  const inmet = imageLayer("INMET", true, null);

  for (const type of ["realcada", "ir"] as const) {
    const selected = selectOfficialSatelliteResult(type, redemet, inmet);
    assert.equal(selected.available, true);
    assert.equal(selected.provider, "INMET");
    assert.equal(selected.error, null);
    assert.match(selected.product, /contingência oficial/);
    assert.match(selected.sourceLabel, /contingência para satélite/);
  }

  assert.match(satelliteRoute, /fetchResilientSatellite\(type, upstreamFrames\)/);
});

test("canal visivel nunca e substituido silenciosamente por infravermelho", () => {
  const redemet = imageLayer("REDEMET / DECEA", false, "Sem imagem visível");
  const inmet = imageLayer("INMET", true, null);
  const selected = selectOfficialSatelliteResult("vis", redemet, inmet);

  assert.equal(selected, redemet);
  assert.equal(selected.available, false);
  assert.equal(selected.provider, "REDEMET / DECEA");
});

test("falha das duas fontes preserva diagnostico interno para operacao", () => {
  const redemet = imageLayer("REDEMET / DECEA", false, "REDEMET indisponível");
  const inmet = imageLayer("INMET", false, "INMET indisponível");
  const selected = selectOfficialSatelliteResult("ir", redemet, inmet);

  assert.equal(selected.available, false);
  assert.match(selected.error ?? "", /REDEMET indisponível/);
  assert.match(selected.error ?? "", /GOES\/INMET: INMET indisponível/);
});

test("APIs públicas de monitoramento não expõem diagnóstico técnico interno", () => {
  assert.match(satelliteRoute, /sanitizePublicSatellitePayload/);
  assert.match(satelliteRoute, /A fonte oficial de satélite não retornou uma imagem utilizável/);
  assert.match(radarRoute, /A fonte oficial de radar não retornou uma imagem utilizável/);
  assert.match(stormsRoute, /A fonte oficial de trovoadas não retornou uma leitura utilizável/);

  assert.doesNotMatch(satelliteRoute, /Diagnóstico atual/);
  assert.doesNotMatch(radarRoute, /hostsCandidatos/);
  assert.doesNotMatch(stormsRoute, /hostsCandidatos/);
});
