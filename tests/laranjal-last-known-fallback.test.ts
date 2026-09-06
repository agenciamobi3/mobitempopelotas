import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { createLaranjalLevelDataFromSeries } from "../src/lib/hydrology/laranjal-level.server.ts";

const functionsSource = readFileSync(
  "src/lib/hydrology/laranjal-level.functions.ts",
  "utf8",
);
const sourceResolver = readFileSync(
  "src/lib/hydrology/laranjal-level-source.server.ts",
  "utf8",
);
const selectorSource = readFileSync(
  "src/lib/hydrology/laranjal-level-selector.ts",
  "utf8",
);
const archiveSource = readFileSync(
  "src/lib/hydrology/laranjal-last-known.server.ts",
  "utf8",
);
const refreshSource = readFileSync(
  "src/components/hydrology/useLaranjalLevelRefresh.ts",
  "utf8",
);
const heroSource = readFileSync(
  "src/components/hydrology/HydrologyEditorialHero.tsx",
  "utf8",
);

test("last-known preserva valor e horário reais da Estação Laranjal", () => {
  const data = createLaranjalLevelDataFromSeries(
    [
      { timestamp: "2026-09-05T21:51:22.968Z", level: 0.94 },
      { timestamp: "2026-09-06T00:51:22.968Z", level: 0.9 },
      { timestamp: "2026-09-06T03:51:22.968Z", level: 0.86 },
    ],
    new Date("2026-09-06T06:02:00.000Z"),
    {
      forceStale: true,
      error: "Sem nova leitura no momento da visita.",
    },
  );

  assert.equal(data.status, "stale");
  assert.equal(data.currentLevel, 0.86);
  assert.equal(data.updatedAt, "2026-09-06T03:51:22.968Z");
  assert.equal(data.ageMinutes, 131);
  assert.equal(data.change6hCm, -8);
  assert.equal(data.trendCmPerHour, -1.3);
  assert.match(data.error ?? "", /momento da visita/);
});

test("fallback arquivado continua usando somente histórico da própria Estação Laranjal", () => {
  assert.match(archiveSource, /SOURCE_KEY = "labhidrosens-ufpel"/);
  assert.match(archiveSource, /STATION_KEY = "labhidrosens-laranjal"/);
  assert.match(archiveSource, /VARIABLE_KEY = "water_level"/);
  assert.match(archiveSource, /data_class", "observation"/);
  assert.match(archiveSource, /forceStale: true/);
  assert.doesNotMatch(archiveSource, /ana-rhn-laranjal-87955001/);
});

test("consulta pública resolve Lab, CIEX/FURG e last-known sem misturar séries", () => {
  assert.match(functionsSource, /PUBLIC_LARANJAL_SOURCE_DEADLINE_MS = 1_800/);
  assert.match(functionsSource, /fetchSelectedLaranjalLevelData/);
  assert.match(sourceResolver, /Promise\.all/);
  assert.match(sourceResolver, /fetchLaranjalLevelData/);
  assert.match(sourceResolver, /fetchCiexFurgPelotasLevelData/);
  assert.match(sourceResolver, /fetchLastKnownLaranjalLevelData/);
  assert.match(selectorSource, /if \(lab\.status === "live"\) return lab/);
  assert.match(selectorSource, /if \(ciexFurg\.status !== "unavailable"\) return ciexFurg/);
  assert.match(selectorSource, /if \(lab\.status === "stale"\) return lab/);
  assert.match(selectorSource, /return lastKnownLab \?\? lab/);
});

test("refresh do Laranjal é local, a cada minuto, e nunca regride a medição visível", () => {
  assert.match(refreshSource, /LARANJAL_REFRESH_INTERVAL_MS = 60_000/);
  assert.match(refreshSource, /window\.setInterval/);
  assert.match(refreshSource, /visibilitychange/);
  assert.match(refreshSource, /return nextTime >= currentTime/);
  assert.match(refreshSource, /current\.currentLevel === null/);
  assert.doesNotMatch(refreshSource, /router\.invalidate/);
});

test("Hero diferencia leitura atual, alternativa e última medição disponível", () => {
  assert.match(heroSource, /"Sem nova leitura"/);
  assert.match(heroSource, /"Leitura alternativa atualizada"/);
  assert.match(heroSource, /"Até a última medição"/);
  assert.match(heroSource, /"Última medição: "/);
});
