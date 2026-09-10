export type HydrologyLevelSeriesInputPoint = {
  timestamp: string;
  level: number;
};

export type HydrologyNormalizedLevelPoint = HydrologyLevelSeriesInputPoint & {
  epoch: number;
};

export type HydrologyGapPolicy = {
  multiplier?: number;
  minimumGapMs?: number;
  minimumPoints?: number;
};

export const DEFAULT_HYDROLOGY_GAP_MULTIPLIER = 2.5;

export function normalizeHydrologyLevelSeries<T extends HydrologyLevelSeriesInputPoint>(
  points: T[],
): Array<T & { epoch: number }> {
  const byTimestamp = new Map<number, T & { epoch: number }>();

  for (const point of points) {
    const epoch = new Date(point.timestamp).getTime();
    if (!Number.isFinite(point.level) || !Number.isFinite(epoch)) continue;
    byTimestamp.set(epoch, { ...point, epoch });
  }

  return [...byTimestamp.values()].sort((left, right) => left.epoch - right.epoch);
}

function median(values: number[]) {
  if (values.length === 0) return null;
  const ordered = [...values].sort((left, right) => left - right);
  const middle = Math.floor(ordered.length / 2);
  if (ordered.length % 2 === 1) return ordered[middle] ?? null;
  const left = ordered[middle - 1];
  const right = ordered[middle];
  return left === undefined || right === undefined ? null : (left + right) / 2;
}

export function hydrologyGapThresholdMs(
  points: Array<{ epoch: number }>,
  policy: HydrologyGapPolicy = {},
) {
  const multiplier = policy.multiplier ?? DEFAULT_HYDROLOGY_GAP_MULTIPLIER;
  const minimumGapMs = Math.max(0, policy.minimumGapMs ?? 0);
  const minimumPoints = Math.max(2, policy.minimumPoints ?? 2);

  if (points.length < minimumPoints) return Number.POSITIVE_INFINITY;

  const intervals = points
    .slice(1)
    .map((point, index) => point.epoch - points[index]!.epoch)
    .filter((interval) => Number.isFinite(interval) && interval > 0);
  const typicalInterval = median(intervals);
  if (typicalInterval === null) return Number.POSITIVE_INFINITY;

  return Math.max(typicalInterval * multiplier, minimumGapMs);
}

export function splitHydrologySeriesOnGaps<T extends { epoch: number }>(
  points: T[],
  thresholdMs: number,
) {
  if (points.length === 0) return [] as T[][];

  const segments: T[][] = [[points[0]!]];
  for (let index = 1; index < points.length; index += 1) {
    const point = points[index]!;
    const previous = points[index - 1]!;
    if (point.epoch - previous.epoch > thresholdMs) {
      segments.push([point]);
    } else {
      segments.at(-1)!.push(point);
    }
  }

  return segments;
}
