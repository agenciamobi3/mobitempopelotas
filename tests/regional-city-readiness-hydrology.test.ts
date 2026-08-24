import test from "node:test";
import assert from "node:assert/strict";
import {
  getRegionalCityReadiness,
  isRegionalCityReadyForComplete,
} from "../src/lib/regional-city-readiness";

test("complete readiness requires hydrology evidence", () => {
  const city = {
    readiness: {
      ibgeValidated: true,
      coordinatesValidated: true,
      weatherValidated: true,
      hydrologicalContextValidated: true,
      editorialReady: true,
      seoReady: true,
      imageryReady: true,
    },
  };

  assert.equal(isRegionalCityReadyForComplete(city as never), false);

  const result = getRegionalCityReadiness(city as never);
  assert.ok(result.missing.includes("hydrologyEvidenceValidated"));
});

test("complete readiness accepts direct hydrology evidence", () => {
  const city = {
    readiness: {
      ibgeValidated: true,
      coordinatesValidated: true,
      weatherValidated: true,
      hydrologicalContextValidated: true,
      hydrologyEvidenceValidated: true,
      editorialReady: true,
      seoReady: true,
      imageryReady: true,
    },
  };

  assert.equal(isRegionalCityReadyForComplete(city as never), true);
});
