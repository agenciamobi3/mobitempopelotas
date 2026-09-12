export const OBSERVATORY_COMPARISON_LAYER_IDS = ["radar", "satellite"] as const;
export type ObservatoryComparisonLayerId = (typeof OBSERVATORY_COMPARISON_LAYER_IDS)[number];

export type ObservatoryComparisonState = {
  enabled: true;
  layerId: ObservatoryComparisonLayerId;
  leftAt: string | null;
  rightAt: string | null;
  splitPosition: number;
};

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function normalizeTimestamp(value: unknown) {
  if (typeof value !== "string") return null;
  const time = Date.parse(value);
  if (!Number.isFinite(time)) return null;
  return new Date(time).toISOString();
}

export function isObservatoryComparisonLayerId(
  value: string,
): value is ObservatoryComparisonLayerId {
  return (OBSERVATORY_COMPARISON_LAYER_IDS as readonly string[]).includes(value);
}

export function normalizeObservatoryComparisonState(
  value: unknown,
): ObservatoryComparisonState | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<ObservatoryComparisonState>;
  if (candidate.enabled !== true) return null;
  if (typeof candidate.layerId !== "string" || !isObservatoryComparisonLayerId(candidate.layerId)) {
    return null;
  }

  const splitPosition =
    typeof candidate.splitPosition === "number" && Number.isFinite(candidate.splitPosition)
      ? clamp(candidate.splitPosition, 0.08, 0.92)
      : 0.5;

  return {
    enabled: true,
    layerId: candidate.layerId,
    leftAt: normalizeTimestamp(candidate.leftAt),
    rightAt: normalizeTimestamp(candidate.rightAt),
    splitPosition: Math.round(splitPosition * 1000) / 1000,
  };
}

export function createObservatoryComparison(input: {
  layerId: ObservatoryComparisonLayerId;
  leftAt?: string | null;
  rightAt?: string | null;
  splitPosition?: number;
}): ObservatoryComparisonState {
  return (
    normalizeObservatoryComparisonState({
      enabled: true,
      layerId: input.layerId,
      leftAt: input.leftAt ?? null,
      rightAt: input.rightAt ?? null,
      splitPosition: input.splitPosition ?? 0.5,
    }) ?? {
      enabled: true,
      layerId: input.layerId,
      leftAt: null,
      rightAt: null,
      splitPosition: 0.5,
    }
  );
}
