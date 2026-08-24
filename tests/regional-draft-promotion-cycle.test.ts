import test from "node:test";
import assert from "node:assert/strict";

import { evaluateRegionalCandidateDraftPromotion } from "../src/lib/regional-candidate-promotion";

test("draft promotion keeps promoted city out of public index surface", () => {
  const result = evaluateRegionalCandidateDraftPromotion(
    {
      name: "Arambaré",
      slug: "arambare",
      state: "RS",
      ibgeCode: "4300851",
      priority: "high",
      reason: ["hydrology", "regional_relevance"],
      status: "approved",
    },
    {
      group: "lagoon",
      descriptor: "Monitoramento meteorológico regional de Arambaré.",
    },
    {
      candidateSlug: "arambare",
      identityValidated: true,
      coordinatesValidated: true,
      coordinatesValue: {
        latitude: -30.91,
        longitude: -51.5,
      },
    },
  );

  assert.equal(result.ready, false);
  assert.ok(result.reasons.includes("hydrology-not-validated"));
});
