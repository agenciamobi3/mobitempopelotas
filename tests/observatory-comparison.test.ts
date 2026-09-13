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
  assert.equal(comparison.opacityMix, 0.5);
  assert.deepEqual(comparisonActiveRasterLayerIds(comparison), ["radar", "satellite"]);
  assert.equal(comparisonSideHasRenderableRaster(comparison.a, "lightning"), false);
});

test("modo opacidade preserva o mesmo A/B e normaliza a mistura", () => {
  const base = scenario({ selectedAt: "2026-09-12T22:00:00Z", radar: true });
  const opacity = createObservatoryComparison({
    a: base,
    b: base,
    mode: "opacity",
    opacityMix: 2,
  });

  assert.equal(opacity.mode, "opacity");
  assert.equal(opacity.opacityMix, 1);
  assert.equal(
    createObservatoryComparison({ a: base, b: base, mode: "opacity", opacityMix: -1 }).opacityMix,
    0,
  );
  assert.equal(
    createObservatoryComparison({ a: base, b: base, mode: "opacity", opacityMix: Number.NaN })
      .opacityMix,
    0.5,
  );
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
  assert.match(runtime, /raiseLayer/);
  assert.match(runtime, /imageryLayers\.raiseToTop\(imageLayer\)/);
  assert.equal((runtime.match(/new CesiumWidget\(/g) ?? []).length, 1);
});

test("runtime mantém a imagem anterior até o novo provider estar pronto", () => {
  assert.match(
    runtime,
    /const generation = nextGeneration\(id\);\s+const provider = await SingleTileImageryProvider\.fromUrl[\s\S]+if \(widget\.isDestroyed\(\) \|\| layerGenerations\.get\(id\) !== generation\) return;\s+detachLayer\(id\);/,
  );
});

test("viewer mantém A e B no mesmo Cesium e reutiliza frames temporais canônicos", () => {
  assert.match(viewer, /compare:\$\{side\}:\$\{id\}/);
  assert.match(viewer, /selectTemporalFrame/);
  assert.match(viewer, /loadObservatoryTemporalLayer/);
  assert.match(viewer, /comparison\.mode === "swipe"/);
  assert.match(viewer, /split:[\s\S]+comparison\.mode === "swipe"[\s\S]+"left"[\s\S]+"right"[\s\S]+"none"/);
  assert.match(viewer, /removeComparisonRasterLayers/);
  assert.doesNotMatch(viewer, /new CesiumWidget/);
});

test("modo opacidade mantém A como base e controla B sem segundo viewer", () => {
  assert.match(
    viewer,
    /comparison\.mode === "opacity" && side === "b"[\s\S]+layerState\.opacity \* comparison\.opacityMix/,
  );
  assert.match(
    viewer,
    /if \(comparison\.mode === "opacity"\) runtime\.raiseLayer\(comparisonLayerId\("b", id\)\)/,
  );
  assert.match(viewer, /comparisonState\.opacityMix/);
});

test("renders A/B iniciam juntos para que gerações antigas sejam invalidadas antes do await", () => {
  assert.match(viewer, /const pendingRenders: Promise<void>\[\] = \[\]/);
  assert.match(viewer, /pendingRenders\.push\(/);
  assert.match(viewer, /await Promise\.all\(pendingRenders\)/);
  assert.doesNotMatch(viewer, /await runtime\.setImageLayer\(targetId/);
});

test("falhas de imagem durante a timeline não ficam sem tratamento", () => {
  assert.match(viewer, /Falha ao atualizar comparação \$\{id\}/);
  assert.match(viewer, /runtime\.removeLayer\(comparisonLayerId\("a", id\)\)/);
  assert.match(viewer, /runtime\.removeLayer\(comparisonLayerId\("b", id\)\)/);
  assert.match(viewer, /status: "degraded"/);
  assert.match(viewer, /Falha ao atualizar quadro temporal \$\{id\}/);
});

test("carga inicial temporal não publica nem limpa estado depois que a timeline avançou", () => {
  assert.match(viewer, /let renderSelectionRevision: number \| null = null/);
  assert.match(viewer, /renderSelectionRevision = timelineSelectionRevisionRef\.current/);
  assert.match(
    viewer,
    /layerRevisionRef\.current !== revision \|\|\s+timelineSelectionRevisionRef\.current !== renderSelectionRevision/,
  );
  assert.match(
    viewer,
    /renderSelectionRevision !== null &&\s+timelineSelectionRevisionRef\.current !== renderSelectionRevision/,
  );
});

test("falha anterior ao fromUrl preserva cache e publica degradação", () => {
  assert.match(viewer, /const loadSelectionRevision = timelineSelectionRevisionRef\.current/);
  assert.match(
    viewer,
    /const hadTemporalCacheAtLoadStart = temporalLayersRef\.current\[id\] !== undefined/,
  );
  assert.match(
    viewer,
    /const selectionChangedSinceLoadStarted =\s+timelineSelectionRevisionRef\.current !== loadSelectionRevision/,
  );
  assert.match(
    viewer,
    /renderSelectionRevision === null &&\s+selectionChangedSinceLoadStarted &&\s+\(hadTemporalCacheAtLoadStart \|\| hasTemporalCache\)/,
  );
  assert.match(viewer, /Falha ao atualizar série temporal \$\{id\}; mantendo cache/);
  assert.match(viewer, /const cachedFrame = cachedResult/);
  assert.match(viewer, /status: "degraded"/);
  assert.match(viewer, /mantendo o último quadro já carregado/);
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
  assert.match(shell, /<div className="observatory-comparison__overlay">/);
  assert.doesNotMatch(shell, /observatory-comparison__overlay" aria-hidden="true"/);
});

test("shell oferece modo opacidade com controle explícito de B sobre A", () => {
  assert.match(shell, /type ObservatoryComparisonMode/);
  assert.match(shell, /\["swipe", "opacity"\] as const/);
  assert.match(shell, /setComparisonMode/);
  assert.match(shell, /setComparisonOpacityMix/);
  assert.match(shell, /Opacidade do lado B sobre o lado A/);
  assert.match(shell, /B sobre A/);
  assert.match(shell, /comparisonState\.mode === "opacity"/);
});

test("comparação nasce de um horário pertencente a radar ou satélite habilitado", () => {
  assert.match(shell, /resolveComparisonSeedTimestamp/);
  assert.match(shell, /for \(const id of \["radar", "satellite"\] as const\)/);
  assert.match(shell, /if \(!enabledLayers\.includes\(id\)\) continue/);
  assert.match(shell, /timelineSources\[id\] \?\? \[\]/);
  assert.match(shell, /const canEnterComparison = comparisonSeedTimelineAt !== null/);
  assert.match(shell, /if \(!comparisonSeedTimelineAt\) return/);
  assert.match(shell, /currentScenario\(comparisonSeedTimelineAt\)/);
  assert.match(shell, /Aguarde radar ou satélite disponibilizar um quadro observacional/);
});

test("comparação não serializa estado ambíguo no compartilhamento normal", () => {
  assert.match(shell, /disabled=\{Boolean\(comparisonState\)\}/);
  assert.match(shell, /typeof window === "undefined" \|\| comparisonState/);
});
