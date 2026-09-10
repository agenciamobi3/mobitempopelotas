import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_HYDROLOGY_GAP_MULTIPLIER,
  hydrologyGapThresholdMs,
  normalizeHydrologyLevelSeries,
  splitHydrologySeriesOnGaps,
} from "../src/lib/hydrology/level-series.ts";

const MINUTE_MS = 60 * 1_000;
const HOUR_MS = 60 * MINUTE_MS;

test("level series normalization sorts, deduplicates and drops invalid points", () => {
  const normalized = normalizeHydrologyLevelSeries([
    { timestamp: "2026-09-10T03:00:00.000Z", level: 1.2, tag: "last" },
    { timestamp: "invalid", level: 9, tag: "invalid-time" },
    { timestamp: "2026-09-10T01:00:00.000Z", level: 1, tag: "first" },
    { timestamp: "2026-09-10T03:00:00.000Z", level: 1.3, tag: "duplicate-wins" },
    { timestamp: "2026-09-10T02:00:00.000Z", level: Number.NaN, tag: "invalid-level" },
  ]);

  assert.equal(normalized.length, 2);
  assert.equal(normalized[0]?.tag, "first");
  assert.equal(normalized[1]?.tag, "duplicate-wins");
  assert.ok((normalized[0]?.epoch ?? 0) < (normalized[1]?.epoch ?? 0));
});

test("default gap policy preserves the shared chart behavior", () => {
  const threshold = hydrologyGapThresholdMs([
    { epoch: 0 },
    { epoch: 6 * HOUR_MS },
  ]);

  assert.equal(DEFAULT_HYDROLOGY_GAP_MULTIPLIER, 2.5);
  assert.equal(threshold, 15 * HOUR_MS);
});

test("embed gap policy keeps its one-hour floor and minimum sample requirement", () => {
  const twoPointThreshold = hydrologyGapThresholdMs(
    [{ epoch: 0 }, { epoch: 4 * HOUR_MS }],
    { multiplier: 2.5, minimumGapMs: HOUR_MS, minimumPoints: 3 },
  );
  assert.equal(twoPointThreshold, Number.POSITIVE_INFINITY);

  const threshold = hydrologyGapThresholdMs(
    [
      { epoch: 0 },
      { epoch: 10 * MINUTE_MS },
      { epoch: 20 * MINUTE_MS },
      { epoch: 200 * MINUTE_MS },
    ],
    { multiplier: 2.5, minimumGapMs: HOUR_MS, minimumPoints: 3 },
  );
  assert.equal(threshold, HOUR_MS);
});

test("series splitting leaves observations on each side of a real gap disconnected", () => {
  const points = [
    { epoch: 0, level: 100 },
    { epoch: 10 * MINUTE_MS, level: 101 },
    { epoch: 20 * MINUTE_MS, level: 102 },
    { epoch: 200 * MINUTE_MS, level: 103 },
  ];
  const threshold = hydrologyGapThresholdMs(points, {
    multiplier: 2.5,
    minimumGapMs: HOUR_MS,
    minimumPoints: 3,
  });
  const segments = splitHydrologySeriesOnGaps(points, threshold);

  assert.equal(segments.length, 2);
  assert.deepEqual(
    segments.map((segment) => segment.map((point) => point.level)),
    [[100, 101, 102], [103]],
  );
});
