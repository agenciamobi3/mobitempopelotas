import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  createObservatoryScenario,
  buildObservatoryScenarioHash,
  readObservatoryScenarioHash,
} from "../src/observatory/core/ObservatoryScenario.ts";
import {
  OBSERVATORY_TEMPORAL_LAYER_IDS,
  selectTemporalFrame,
  temporalTimestamps,
  type ObservatoryTemporalLayerResult,
} from "../src/observatory/data/observatory-temporal-layers.ts";

const shell = readFileSync("src/observatory/ui/ObservatoryShell.tsx", "utf8");
const viewer = readFileSync("src/observatory/core/ObservatoryViewer.tsx", "utf8");
const temporalSource = readFileSync(
  "src/observatory/data/observatory-temporal-layers.ts",
  "utf8",
);

function frame(id: string, observedAt: string | null) {
  return {
    id,
    label: id,
    observedAt,
    detail: id,
    payload: {
      kind: "image" as const,
      imageUrl: `/frame/${id}.png`,
      bounds: { west: -55, south: -34, east: -50, north: -28 },
    },
  };
}

const temporalLayer: ObservatoryTemporalLayerResult = {
  id: "radar",
  status: "current",
  sourceLabel: "REDEMET / DECEA",
  product: "Radar meteorológico",
  updatedAt: "2026-09-12T22:20:00.000Z",
  currentIndex: 2,
  error: null,
  frames: [
    frame("19:00", "2026-09-12T22:00:00.000Z"),
    frame("19:10", "2026-09-12T22:10:00.000Z"),
    frame("19:20", "2026-09-12T22:20:00.000Z"),
  ],
};

test("timeline reutiliza as três séries temporais observacionais existentes", () => {
  assert.deepEqual(OBSERVATORY_TEMPORAL_LAYER_IDS, ["radar", "satellite", "lightning"]);
  assert.doesNotMatch(temporalSource, /"alerts"|"hydrology"/);
  assert.match(temporalSource, /\/api\/redemet\/radar\?frames=8/);
  assert.match(temporalSource, /\/api\/redemet\/satellite\?type=realcada&frames=8/);
  assert.match(temporalSource, /\/api\/redemet\/storms\?frames=12/);
  assert.doesNotMatch(temporalSource, /createServerFn/);
});

test("seleção temporal nunca usa quadro futuro quando existe observação anterior", () => {
  const selected = selectTemporalFrame(temporalLayer, "2026-09-12T22:15:00.000Z");
  assert.equal(selected?.id, "19:10");
});

test("sem horário explícito, timeline respeita currentIndex canônico da fonte", () => {
  const selected = selectTemporalFrame(temporalLayer, null);
  assert.equal(selected?.id, "19:20");
});

test("timestamps globais descartam valores ausentes ou inválidos", () => {
  const result: ObservatoryTemporalLayerResult = {
    ...temporalLayer,
    frames: [
      frame("válido", "2026-09-12T22:00:00.000Z"),
      frame("sem horário", null),
      frame("inválido", "não-é-data"),
    ],
  };

  assert.deepEqual(temporalTimestamps(result), ["2026-09-12T22:00:00.000Z"]);
});

test("shell mantém o ritmo do player meteorológico existente e expõe controles globais", () => {
  assert.match(shell, /TIMELINE_PLAYBACK_INTERVAL_MS = 900/);
  assert.match(shell, /selectedTimelineAt/);
  assert.match(shell, /onTimelineSourceChange/);
  assert.match(shell, /Escolher horário global do Observatório/);
  assert.match(shell, /Ir para agora/);
  assert.match(shell, /Reproduzir animação/);
});

test("viewer troca frames temporais em memória sem recarregar camada a cada movimento do slider", () => {
  assert.match(viewer, /temporalLayersRef/);
  assert.match(viewer, /selectTemporalFrame/);
  assert.match(viewer, /renderTemporalFrame/);
  assert.match(viewer, /selectedTimelineAt/);
  assert.match(viewer, /loadObservatoryTemporalLayer/);
});

test("cenário compartilhável preserva horário, camadas, opacidade e câmera", () => {
  const scenario = createObservatoryScenario({
    selectedAt: "2026-09-12T22:10:00.000Z",
    layers: [
      { id: "radar", enabled: true, opacity: 0.72 },
      { id: "satellite", enabled: true, opacity: 0.64 },
      { id: "lightning", enabled: false, opacity: 1 },
      { id: "alerts", enabled: true, opacity: 1 },
      { id: "hydrology", enabled: false, opacity: 1 },
    ],
    camera: {
      longitude: -52.3421,
      latitude: -31.7719,
      height: 487321,
      heading: 12.5,
      pitch: -67.25,
      roll: 0,
    },
  });

  const restored = readObservatoryScenarioHash(buildObservatoryScenarioHash(scenario));
  assert.ok(restored);
  assert.equal(restored.selectedAt, "2026-09-12T22:10:00.000Z");
  assert.deepEqual(
    restored.layers.map(({ id, enabled, opacity }) => [id, enabled, opacity]),
    scenario.layers.map(({ id, enabled, opacity }) => [id, enabled, opacity]),
  );
  assert.deepEqual(restored.camera, scenario.camera);
});
