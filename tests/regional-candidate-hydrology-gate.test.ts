import test from "node:test";
import assert from "node:assert/strict";

import {
  evaluateRegionalCandidateDraftPromotion,
} from "../src/lib/regional-candidate-promotion";
import { REGIONAL_CANDIDATES } from "../src/lib/regional-candidates";
import { findRegionalCandidateValidation } from "../src/lib/regional-candidate-validation";

function candidate(slug: string) {
  return REGIONAL_CANDIDATES.find((item) => item.slug === slug)!;
}

test("regional promotion blocks candidates without hydrology evidence", () => {
  const result = evaluateRegionalCandidateDraftPromotion(candidate("guaiba-rs"), {
    group: "metropolitan",
    descriptor: "Condições meteorológicas e contexto regional de Guaíba.",
  });

  assert.equal(result.ready, false);
  assert.equal(result.reasons.includes("hydrology-not-validated"), true);
});

test("Arambaré can pass the hydrology requirement when promoted deliberately", () => {
  const result = evaluateRegionalCandidateDraftPromotion(
    {
      ...candidate("arambare-rs"),
      status: "approved",
    },
    {
      group: "litoral-sul",
      descriptor: "Condições meteorológicas e hidrológicas de Arambaré.",
    },
    findRegionalCandidateValidation("arambare-rs"),
  );

  assert.equal(result.ready, true);
  if (result.ready) {
    assert.equal(result.draft.coverage, "draft");
    assert.equal(result.draft.indexable, false);
  }
});
