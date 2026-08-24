import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluateRegionalCandidateDraftPromotion } from "../src/lib/regional-candidate-promotion";
import { getRegionalCandidateReadiness } from "../src/lib/regional-candidate-readiness";
import { REGIONAL_CANDIDATES } from "../src/lib/regional-candidates";

const arambare = REGIONAL_CANDIDATES.find((item) => item.slug === "arambare-rs");

if (!arambare) {
  throw new Error("Arambaré candidate missing");
}

test("Arambaré hydrology evidence feeds readiness", () => {
  assert.equal(
    getRegionalCandidateReadiness(arambare).hydrologyEvidenceValidated,
    true,
  );
});

test("promotion remains controlled by readiness evidence", () => {
  const result = evaluateRegionalCandidateDraftPromotion(arambare, {
    group: "lagoon",
    descriptor: "Monitoramento meteorológico regional de Arambaré.",
  });

  assert.equal(result.ready, false);
  assert.ok(result.reasons.length > 0);
});
