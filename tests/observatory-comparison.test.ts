import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  OBSERVATORY_COMPARISON_RASTER_LAYER_IDS,
  comparisonActiveRasterLayerIds,
  comparisonSideHasRenderableRaster,
  createObservatoryComparison,
  getComparisonLayerState,
} from "../src/observatory/core/ObservatoryComparison.ts";
import { createObservatoryScenario } from "../src/observatory/core/ObservatoryScenario.ts";

const shell = readFileSync("src/observatory/ui/ObservatoryShell.tsx", "utf8");
const viewer = readFileSync("src/observatory/core/ObservatoryViewer.tsx", "utf8");
const runtime = readFileSync("src/observatory/core/observatory-cesium-runtime.ts", "utf8");

function scenario(input: {
  selectedAt: string;
  radar?: boolean;
  satellite?: boolean;
}) {
  return createObservatoryScenario({
    selectedAt: input.selectedAt,
    layers: [
      { id: "radar", enabled: input.radar ?? false, opacity: 0.72 },
      { id: "satellite", enabled: input.satellite ?? false, opacity: 0.64 },
      { id: "lightning", enabled: true, opacity: 1 },
      { id: "alerts", enabled: false, opacity: 1 },
      { id: "hydrology", enabled: false, opacity: 1 },
    ],
    camera: {
      longitude: -52.34,
      latitude: -31.77,
      height: 450000,
      heading: 0,
      pitch: -82,
      roll: 0,
    },
  });
}

test("comparador A/B nasce em swipe e limita a primeira fase a raster", () => {
  assert.deepEqual(OBSERVATORY_COMPARISON_RASTER_LAYER_IDS, ["radar", "satellite"]);

  const comparison = createObservatoryComparison({
    a: scenario({ selectedAt: "2026-09-12T22:00:00Z", radar: true }),
    b: scenario({ selectedAt: "2026-09-12T23:00:00Z", satellite: true }),
  });

  assert.equal(comparison.mode, "swipe");
  assert.equal(comparison.splitPosition, 0.5);
  assert.deepEqual(comparisonActiveRasterLayerIds(comparison), ["radar", "satellite"]);
  assert.equal(comparisonSideHasRenderableRaster(comparison.a, "lightning"), false);
});

test("cada lado preserva horário e estado das camadas sem duplicar câmera", () => {
  const comparison = createObservatoryComparison({
    a: scenario({ selectedAt: "2026-09-12T22:00:00Z", radar: true }),
    b: scenario({ selectedAt: "2026-09-12T23:00:00Z", satellite: true }),
  });

  assert.equal(comparison.a.selectedAt, "2026-09-12T22:00:00.000Z");
  assert.equal(comparison.b.selectedAt, "2026-09-12T23:00:00.000Z");
  assert.equal(getComparisonLayerState(comparison.a, "radar")?.enabled, true);
  assert.equal(getComparisonLayerState(comparison.b, "satellite")?.enabled, true);
  assert.equal("camera" in comparison.a, false);
  assert.equal("camera" in comparison.b, false);
});

test("posição da cortina é normalizada para manter ambos os lados utilizáveis", () => {
  const base = scenario({ selectedAt: "2026-09-12T22:00:00Z", radar: true });

  assert.equal(createObservatoryComparison({ a: base, b: base, splitPosition: -1 }).splitPosition, 0.1);
  assert.equal(createObservatoryComparison({ a: base, b: base, splitPosition: 2 }).splitPosition, 0.9);
  assert.equal(createObservatoryComparison({ a: base, b: base, splitPosition: Number.NaN }).splitPosition, 0.5);
});

test("runtime usa split nativo do Cesium e continua com um único widget", () => {
  assert.match(runtime, /SplitDirection/);
  assert.match(runtime, /layer\.splitDirection = splitDirection\(input\.split\)/);
  assert.match(runtime, /widget\.scene\.splitPosition/);
  assert.match(runtime, /setSplitPosition/);
  assert.equal((runtime.match(/new CesiumWidget\(/g) ?? []).length, 1);
});

test("viewer mantém A e B no mesmo Cesium e reutiliza frames temporais canônicos", () => {
  assert.match(viewer, /compare:\$\{side\}:\$\{id\}/);
  assert.match(viewer, /selectTemporalFrame/);
  assert.match(viewer, /loadObservatoryTemporalLayer/);
  assert.match(viewer, /split: side === "a" \? "left" : "right"/);
  assert.match(viewer, /removeComparisonRasterLayers/);
  assert.doesNotMatch(viewer, /new CesiumWidget/);
});

test("shell oferece comparação, lados independentes, troca e cortina acessível", () => {
  assert.match(shell, /createObservatoryComparison/);
  assert.match(shell, /Sair da comparação/);
  assert.match(shell, /Trocar A ↔ B/);
  assert.match(shell, /comparisonSide/);
  assert.match(shell, /Posição da divisão entre A e B/);
  assert.match(shell, /setPointerCapture/);
  assert.match(shell, /ArrowLeft/);
  assert.match(shell, /ArrowRight/);
  assert.match(shell, /comparisonState=\{comparisonState\}/);
});

test("comparação não serializa estado ambíguo no compartilhamento normal", () => {
  assert.match(shell, /disabled=\{Boolean\(comparisonState\)\}/);
  assert.match(shell, /typeof window === "undefined" \|\| comparisonState/);
});
