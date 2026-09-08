import assert from "node:assert/strict";
import test from "node:test";

import {
  OFFICIAL_SOURCE_DEADLINE_MS,
  WEATHER_SOURCE_REQUEST_TIMEOUT_MS,
} from "../src/lib/weather/source-policy.ts";

test("o orquestrador respeita o timeout interno das fontes oficiais ativas", () => {
  for (const source of ["inmet", "cppmet"] as const) {
    assert.ok(
      OFFICIAL_SOURCE_DEADLINE_MS[source] > WEATHER_SOURCE_REQUEST_TIMEOUT_MS[source],
      `${source} não pode ser interrompida antes do próprio timeout`,
    );
  }
});

test("fontes aposentadas não permanecem na política de request", () => {
  assert.equal("embrapa" in WEATHER_SOURCE_REQUEST_TIMEOUT_MS, false);
  assert.equal("embrapa" in OFFICIAL_SOURCE_DEADLINE_MS, false);
});
