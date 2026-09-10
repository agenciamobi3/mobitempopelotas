import assert from "node:assert/strict";
import test from "node:test";

import {
  deriveRecentHydrologyMovement,
  MOVEMENT_RATE_EPSILON_CM_PER_HOUR,
  RECENT_MOVEMENT_WINDOW_MS,
  toHydrologyCentimeters,
} from "../src/lib/hydrology/level-movement.ts";

const HOUR_MS = 60 * 60 * 1_000;

function closeTo(actual: number | null, expected: number, tolerance = 1e-9) {
  assert.notEqual(actual, null);
  assert.ok(Math.abs(actual! - expected) <= tolerance, `${actual} should be close to ${expected}`);
}

test("movement helper converts meter series to centimeters consistently", () => {
  assert.equal(toHydrologyCentimeters(1.25, "m"), 125);
  assert.equal(toHydrologyCentimeters(37.5, "cm"), 37.5);
  assert.equal(RECENT_MOVEMENT_WINDOW_MS, 3 * HOUR_MS);
  assert.equal(MOVEMENT_RATE_EPSILON_CM_PER_HOUR, 0.1);
});

test("recent movement uses the latest three-hour window instead of the whole series", () => {
  const result = deriveRecentHydrologyMovement(
    [
      { epoch: 0, level: 0.5 },
      { epoch: HOUR_MS, level: 1 },
      { epoch: 2 * HOUR_MS, level: 1.01 },
      { epoch: 4 * HOUR_MS, level: 1.03 },
    ],
    "m",
  );

  assert.equal(result.direction, "rising");
  assert.equal(result.label, "Subindo");
  assert.equal(result.startEpoch, HOUR_MS);
  assert.equal(result.durationMs, 3 * HOUR_MS);
  closeTo(result.changeCm, 3);
  closeTo(result.rateCmPerHour, 1);
});

test("movement helper sorts input before calculating a falling rate", () => {
  const result = deriveRecentHydrologyMovement(
    [
      { epoch: 2 * HOUR_MS, level: 98 },
      { epoch: 0, level: 100 },
      { epoch: HOUR_MS, level: 99 },
    ],
    "cm",
  );

  assert.equal(result.direction, "falling");
  assert.equal(result.label, "Baixando");
  assert.equal(result.durationMs, 2 * HOUR_MS);
  closeTo(result.changeCm, -2);
  closeTo(result.rateCmPerHour, -1);
});

test("small recent rates remain descriptive as practically stable", () => {
  const result = deriveRecentHydrologyMovement(
    [
      { epoch: 0, level: 100 },
      { epoch: 2 * HOUR_MS, level: 100.15 },
    ],
    "cm",
  );

  assert.equal(result.direction, "stable");
  assert.equal(result.label, "Praticamente estável");
  closeTo(result.changeCm, 0.15);
  closeTo(result.rateCmPerHour, 0.075);
});

test("helper does not invent a three-hour point when the continuous segment is sparse", () => {
  const result = deriveRecentHydrologyMovement(
    [
      { epoch: 0, level: 100 },
      { epoch: 6 * HOUR_MS, level: 106 },
    ],
    "cm",
  );

  assert.equal(result.direction, "rising");
  assert.equal(result.startEpoch, 0);
  assert.equal(result.durationMs, 6 * HOUR_MS);
  closeTo(result.changeCm, 6);
  closeTo(result.rateCmPerHour, 1);
});

test("invalid or duplicate-only input cannot manufacture recent movement", () => {
  const result = deriveRecentHydrologyMovement(
    [
      { epoch: 0, level: 100 },
      { epoch: 0, level: 101 },
      { epoch: Number.NaN, level: 90 },
      { epoch: HOUR_MS, level: Number.NaN },
    ],
    "cm",
  );

  assert.deepEqual(result, {
    direction: "unavailable",
    label: "Sem base suficiente",
    rateCmPerHour: null,
    changeCm: null,
    durationMs: null,
    startEpoch: null,
  });
});
