import assert from "node:assert/strict";
import test from "node:test";
import { hasDirectHydrologyEvidence } from "../src/lib/regional-candidate-hydrology";
import { evaluateRegionalCandidateDraftPromotion } from "../src/lib/regional-candidate-promotion";

const baseCandidate = {
  name: "Arambaré",
  slug: "arambare-rs",
  state: "RS" as const,
  ibgeCode: "4300851",
  priority: "high" as const,
  reason: ["hydrology" as const],
  status: "approved" as const,
};

test("direct hydrology evidence exists only for validated candidates", () => {
  assert.equal(hasDirectHydrologyEvidence("arambare-rs"), true);
  assert.equal(hasDirectHydrologyEvidence("guaiba-rs"), false);
});

test("candidate without direct hydrology evidence cannot become draft", () => {
  const result = evaluateRegionalCandidateDraftPromotion(
    {
      ...baseCandidate,
      slug: "guaiba-rs",
      name: "Guaíba",
    },
    {
      group: "laguna-dos-patos",
      descriptor: "Condição meteorológica regional de Guaíba.",
    },
    {
      slug: "guaiba-rs",
      ibge: "validated",
      coordinates: "validated",
      weather: "validated",
      hydrology: "pending",
      coordinatesValue: {
        latitude: -30.11,
        longitude: -51.31,
        reference: "city-seat",
        datum: "SIRGAS 2000",
      },
    },
  );

  assert.equal(result.ready, false);
  assert.equal(result.reasons.includes("hydrology-not-validated"), true);
});
