import {
  createObservatoryScenario,
  type ObservatoryScenarioLayerState,
  type ObservatoryScenarioState,
} from "./ObservatoryScenario";
import type { ObservatoryLayerId } from "./ObservatoryLayerCatalog";

export const OBSERVATORY_COMPARISON_VERSION = 1 as const;
export const OBSERVATORY_COMPARISON_RASTER_LAYER_IDS = ["radar", "satellite"] as const;
export type ObservatoryComparisonRasterLayerId =
  (typeof OBSERVATORY_COMPARISON_RASTER_LAYER_IDS)[number];
export type ObservatoryComparisonMode = "swipe";
export type ObservatoryComparisonSideId = "a" | "b";

export type ObservatoryComparisonSide = {
  selectedAt: string | null;
  layers: ObservatoryScenarioLayerState[];
};

export type ObservatoryComparisonState = {
  version: typeof OBSERVATORY_COMPARISON_VERSION;
  mode: ObservatoryComparisonMode;
  splitPosition: number;
  a: ObservatoryComparisonSide;
  b: ObservatoryComparisonSide;
};

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function normalizeSplitPosition(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0.5;
  return Math.round(clamp(value, 0.1, 0.9) * 1000) / 1000;
}

function comparisonSideFromScenario(scenario: ObservatoryScenarioState): ObservatoryComparisonSide {
  const normalized = createObservatoryScenario(scenario);
  return {
    selectedAt: normalized.selectedAt,
    layers: normalized.layers,
  };
}

export function createObservatoryComparison(input: {
  a: ObservatoryScenarioState;
  b: ObservatoryScenarioState;
  splitPosition?: number;
}): ObservatoryComparisonState {
  return {
    version: OBSERVATORY_COMPARISON_VERSION,
    mode: "swipe",
    splitPosition: normalizeSplitPosition(input.splitPosition),
    a: comparisonSideFromScenario(input.a),
    b: comparisonSideFromScenario(input.b),
  };
}

export function isObservatoryComparisonRasterLayerId(
  id: ObservatoryLayerId,
): id is ObservatoryComparisonRasterLayerId {
  return (OBSERVATORY_COMPARISON_RASTER_LAYER_IDS as readonly string[]).includes(id);
}

export function getComparisonLayerState(
  side: ObservatoryComparisonSide,
  id: ObservatoryLayerId,
): ObservatoryScenarioLayerState | null {
  return side.layers.find((layer) => layer.id === id) ?? null;
}

export function comparisonSideHasRenderableRaster(
  side: ObservatoryComparisonSide,
  id: ObservatoryLayerId,
) {
  if (!isObservatoryComparisonRasterLayerId(id)) return false;
  return Boolean(getComparisonLayerState(side, id)?.enabled);
}

export function comparisonActiveRasterLayerIds(state: ObservatoryComparisonState) {
  return OBSERVATORY_COMPARISON_RASTER_LAYER_IDS.filter(
    (id) => comparisonSideHasRenderableRaster(state.a, id) || comparisonSideHasRenderableRaster(state.b, id),
  );
}
