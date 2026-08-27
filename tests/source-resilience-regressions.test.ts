import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { selectOfficialSatelliteResult } from "../src/lib/redemet/redemet-satellite-resilient.server.ts";
import type { RedemetImageLayerResponse } from "../src/lib/redemet/redemet.types.ts";

const inmetResilientSource = readFileSync(
  "src/lib/weather/inmet-forecast-resilient.server.ts",
  "utf8",
);
const officialSources = readFileSync("src/lib/weather/official-sources.server.ts", "utf8");
const sourcePolicy = readFileSync("src/lib/weather/source-policy.ts", "utf8");
const satelliteRoute = readFileSync("src/routes/api/redemet/satellite.ts", "utf8");

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

test("previsao municipal INMET tenta endpoint atual antes da rota historica", () => {
  const current = inmetResilientSource.indexOf("/api/forecast/");
  const legacy = inmetResilientSource.indexOf("/previsao/");

  assert.ok(current >= 0);
  assert.ok(legacy > current);
  assert.match(inmetResilientSource, /CURRENT_ENDPOINT_TIMEOUT_MS = 1_200/);
  assert.match(inmetResilientSource, /fetchInmetForecast\(\)/);
  assert.match(officialSources, /fetchResilientInmetForecast/);
  assert.match(officialSources, /OFFICIAL_SOURCE_DEADLINE_MS\.inmetForecast/);
  assert.match(sourcePolicy, /inmetForecast:\s*3_200/);
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

test("falha das duas fontes preserva estado indisponivel e diagnostico", () => {
  const redemet = imageLayer("REDEMET / DECEA", false, "REDEMET indisponível");
  const inmet = imageLayer("INMET", false, "INMET indisponível");
  const selected = selectOfficialSatelliteResult("ir", redemet, inmet);

  assert.equal(selected.available, false);
  assert.match(selected.error ?? "", /REDEMET indisponível/);
  assert.match(selected.error ?? "", /GOES\/INMET: INMET indisponível/);
});
