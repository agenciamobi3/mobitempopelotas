import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  createObservatoryComparison,
  normalizeObservatoryComparisonState,
} from "../src/observatory/core/ObservatoryComparison.ts";
import {
  createObservatoryScenario,
  decodeObservatoryScenario,
  encodeObservatoryScenario,
} from "../src/observatory/core/ObservatoryScenario.ts";

const shell = readFileSync("src/observatory/ui/ObservatoryShell.tsx", "utf8");
const controls = readFileSync("src/observatory/ui/ObservatoryComparisonControls.tsx", "utf8");
const viewer = readFileSync("src/observatory/core/ObservatoryViewer.tsx", "utf8");
const runtime = readFileSync("src/observatory/core/observatory-cesium-runtime.ts", "utf8");

test("comparador aceita apenas rasters temporais canônicos e limita o divisor", () => {
  const comparison = createObservatoryComparison({
    layerId: "radar",
    leftAt: "2026-09-12T22:00:00.000Z",
    rightAt: "2026-09-12T22:20:00.000Z",
    splitPosition: 4,
  });

  assert.equal(comparison.layerId, "radar");
  assert.equal(comparison.splitPosition, 0.92);
  assert.equal(
    normalizeObservatoryComparisonState({
      enabled: true,
      layerId: "lightning",
      leftAt: null,
      rightAt: null,
      splitPosition: 0.5,
    }),
    null,
  );
});

test("cenário compartilhado preserva a comparação A/B", () => {
  const comparison = createObservatoryComparison({
    layerId: "satellite",
    leftAt: "2026-09-12T21:40:00.000Z",
    rightAt: "2026-09-12T22:20:00.000Z",
    splitPosition: 0.37,
  });
  const scenario = createObservatoryScenario({
    selectedAt: "2026-09-12T22:20:00.000Z",
    layers: [
      { id: "radar", enabled: false, opacity: 0.72 },
      { id: "satellite", enabled: true, opacity: 0.64 },
    ],
    comparison,
  });

  const decoded = decodeObservatoryScenario(encodeObservatoryScenario(scenario));
  assert.deepEqual(decoded?.comparison, comparison);
});

test("shell abre, restaura, compartilha e fecha o comparador", () => {
  assert.match(shell, /Abrir comparador A\/B do Observatório/);
  assert.match(shell, /<ObservatoryComparisonControls/);
  assert.match(shell, /comparison=\{comparison\}/);
  assert.match(shell, /comparison,\n\s*\}\);/);
  assert.match(shell, /setComparison\(scenario\.comparison\)/);
  assert.match(shell, /onClose=\{\(\) => setComparison\(null\)\}/);
});

test("controles separam A antes, B depois e posição do divisor", () => {
  assert.match(controls, /A · antes/);
  assert.match(controls, /B · depois/);
  assert.match(controls, /Mover divisor da comparação A\/B/);
  assert.match(controls, /OBSERVATORY_COMPARISON_LAYER_IDS/);
});

test("viewer usa splitter nativo do Cesium sem duplicar o globo", () => {
  assert.match(viewer, /runtime\.setImageComparison/);
  assert.match(viewer, /setComparisonSplitPosition/);
  assert.match(viewer, /observatory-viewer__comparison-divider/);
  assert.match(runtime, /SplitDirection\.LEFT/);
  assert.match(runtime, /SplitDirection\.RIGHT/);
  assert.match(runtime, /widget\.scene\.splitPosition/);
});
