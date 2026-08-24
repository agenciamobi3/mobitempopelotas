import assert from "node:assert/strict";
import test from "node:test";

import { evaluateRegionalCandidateDraftPromotion } from "../src/lib/regional-candidate-promotion";

test("regional candidate promotion consumes consolidated readiness", () => {
  const result = evaluateRegionalCandidateDraftPromotion(
    {
      name: "Arambaré",
      slug: "arambare-rs",
      state: "RS",
      ibgeCode: "4300851",
      priority: "high",
      reason: ["hydrology", "regional_relevance"],
      status: "approved",
    },
    {
      group: "lagoa-dos-patos",
      descriptor: "Monitoramento meteorológico regional de Arambaré.",
    },
  );

  assert.equal(result.ready, true);
  if (result.ready) {
    assert.equal(result.draft.coverage, "draft");
    assert.equal(result.draft.indexable, false);
  }
});
