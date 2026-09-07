import assert from "node:assert/strict";
import test from "node:test";

import {
  CIEX_FURG_PELOTAS_CONFIG,
  normalizeCiexFurgPelotasLevel,
  parseCiexFurgSourceTimestamp,
} from "../src/lib/hydrology/ciex-furg-pelotas.server.ts";
import { selectLaranjalLevelSource } from "../src/lib/hydrology/laranjal-level-selector.ts";
import {
  createLaranjalLevelDataFromSeries,
  type LaranjalLevelData,
} from "../src/lib/hydrology/laranjal-level.server.ts";

function unavailable(source: "labhidrosens" | "ciex-furg"): LaranjalLevelData {
  return {
    status: "unavailable",
    currentLevel: null,
    updatedAt: null,
    ageMinutes: null,
    trendCmPerHour: null,
    change1hCm: null,
    change6hCm: null,
    change24hCm: null,
    periodAverage: null,
    periodMinimum: null,
    periodMaximum: null,
    series: [],
    source: {
      key: source,
      role: source === "labhidrosens" ? "primary" : "contingency",
      name: source,
      station: source,
      location: "Pelotas / RS",
      reference: source,
      url: "https://example.test/",
      fetchedAt: "2026-09-06T18:15:00.000Z",
    },
    error: "indisponível",
  };
}

test("adapter CIEX/FURG normaliza sensor_7 de cm para m sem trocar o referencial", () => {
  const data = normalizeCiexFurgPelotasLevel(
    {
      dado: {
        data_hora: "2026-09-06T15:00:00.000Z",
        valor: 45.7,
        sensor_id: "sensor_7",
      },
    },
    [
      { data: "2026-09-06T13:00:00.000Z", valor: 41 },
      { data: "2026-09-06T14:00:00.000Z", valor: 43 },
      { data: "2026-09-06T15:00:00.000Z", valor: 45.7 },
    ],
    new Date("2026-09-06T18:15:00.000Z"),
  );

  assert.equal(parseCiexFurgSourceTimestamp("2026-09-06T15:00:00.000Z")?.toISOString(), "2026-09-06T18:00:00.000Z");
  assert.equal(data.status, "live");
  assert.equal(data.currentLevel, 0.457);
  assert.equal(data.updatedAt, "2026-09-06T18:00:00.000Z");
  assert.equal(data.ageMinutes, 15);
  assert.equal(data.change1hCm, 2.7);
  assert.equal(data.source.key, "ciex-furg");
  assert.equal(data.source.role, "contingency");
  assert.match(data.source.reference ?? "", /Marégrafo de Imbituba/);
  assert.equal(CIEX_FURG_PELOTAS_CONFIG.inputUnit, "cm");
  assert.equal(CIEX_FURG_PELOTAS_CONFIG.publicUnit, "m");
});

test("seletor mantém Lab live como primário e usa CIEX/FURG quando Lab deixa de estar live", () => {
  const liveLab = createLaranjalLevelDataFromSeries(
    [{ timestamp: "2026-09-06T18:10:00.000Z", level: 0.9 }],
    new Date("2026-09-06T18:15:00.000Z"),
  );
  const staleLab = createLaranjalLevelDataFromSeries(
    [{ timestamp: "2026-09-06T15:00:00.000Z", level: 0.9 }],
    new Date("2026-09-06T18:15:00.000Z"),
    { forceStale: true },
  );
  const ciexFurg = normalizeCiexFurgPelotasLevel(
    {
      dado: {
        data_hora: "2026-09-06T15:00:00.000Z",
        valor: 45.7,
        sensor_id: "sensor_7",
      },
    },
    [],
    new Date("2026-09-06T18:15:00.000Z"),
  );

  assert.equal(
    selectLaranjalLevelSource({ lab: liveLab, ciexFurg, lastKnownLab: staleLab }).source.key,
    "labhidrosens",
  );
  assert.equal(
    selectLaranjalLevelSource({ lab: staleLab, ciexFurg, lastKnownLab: staleLab }).source.key,
    "ciex-furg",
  );
});

test("se as duas fontes atuais falham, seletor preserva last-known do próprio Lab", () => {
  const lastKnownLab = createLaranjalLevelDataFromSeries(
    [{ timestamp: "2026-09-06T12:00:00.000Z", level: 0.88 }],
    new Date("2026-09-06T18:15:00.000Z"),
    { forceStale: true },
  );

  const selected = selectLaranjalLevelSource({
    lab: unavailable("labhidrosens"),
    ciexFurg: unavailable("ciex-furg"),
    lastKnownLab,
  });

  assert.equal(selected.source.key, "labhidrosens");
  assert.equal(selected.status, "stale");
  assert.equal(selected.currentLevel, 0.88);
});
