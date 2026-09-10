export type HydrologyLevelUnit = "m" | "cm";

export type HydrologyTimedLevelPoint = {
  epoch: number;
  level: number;
};

export type HydrologyRecentMovement = {
  direction: "rising" | "falling" | "stable" | "unavailable";
  label: string;
  rateCmPerHour: number | null;
  changeCm: number | null;
  durationMs: number | null;
  startEpoch: number | null;
};

export const RECENT_MOVEMENT_WINDOW_MS = 3 * 60 * 60 * 1_000;
export const MOVEMENT_RATE_EPSILON_CM_PER_HOUR = 0.1;

export function toHydrologyCentimeters(value: number, unit: HydrologyLevelUnit) {
  return unit === "m" ? value * 100 : value;
}

function normalizeMovementPoints(points: HydrologyTimedLevelPoint[]) {
  const byEpoch = new Map<number, HydrologyTimedLevelPoint>();

  for (const point of points) {
    if (!Number.isFinite(point.epoch) || !Number.isFinite(point.level)) continue;
    byEpoch.set(point.epoch, point);
  }

  return [...byEpoch.values()].sort((left, right) => left.epoch - right.epoch);
}

function unavailableMovement(): HydrologyRecentMovement {
  return {
    direction: "unavailable",
    label: "Sem base suficiente",
    rateCmPerHour: null,
    changeCm: null,
    durationMs: null,
    startEpoch: null,
  };
}

export function deriveRecentHydrologyMovement(
  points: HydrologyTimedLevelPoint[],
  unit: HydrologyLevelUnit,
): HydrologyRecentMovement {
  const valid = normalizeMovementPoints(points);
  if (valid.length < 2) return unavailableMovement();

  const latest = valid.at(-1)!;
  const cutoff = latest.epoch - RECENT_MOVEMENT_WINDOW_MS;
  let startIndex = valid.findIndex((point) => point.epoch >= cutoff);
  if (startIndex < 0) startIndex = 0;
  if (startIndex === valid.length - 1) startIndex = Math.max(0, valid.length - 2);

  const start = valid[startIndex]!;
  const durationMs = latest.epoch - start.epoch;
  if (durationMs <= 0) return unavailableMovement();

  const changeCm = toHydrologyCentimeters(latest.level - start.level, unit);
  const rateCmPerHour = changeCm / (durationMs / (60 * 60 * 1_000));
  if (!Number.isFinite(rateCmPerHour)) return unavailableMovement();

  const direction =
    rateCmPerHour > MOVEMENT_RATE_EPSILON_CM_PER_HOUR
      ? "rising"
      : rateCmPerHour < -MOVEMENT_RATE_EPSILON_CM_PER_HOUR
        ? "falling"
        : "stable";

  return {
    direction,
    label:
      direction === "rising"
        ? "Subindo"
        : direction === "falling"
          ? "Baixando"
          : "Praticamente estável",
    rateCmPerHour,
    changeCm,
    durationMs,
    startEpoch: start.epoch,
  };
}
