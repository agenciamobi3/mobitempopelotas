import test from "node:test";
import assert from "node:assert/strict";
import { evaluateRegionalCandidateReadiness } from "../src/lib/regional-candidate-readiness-evaluation";

const arambare = {
  name: "Arambaré",
  slug: "arambare",
  state: "RS" as const,
  status: "approved" as const,
};

const pending = {
  name: "Guaíba",
  slug: "guaiba",
  state: "RS" as const,
  status: "candidate" as const,
};

test("readiness evaluator keeps candidates blocked without direct hydrology evidence", () => {
  const result = evaluateRegionalCandidateReadiness(pending);

  assert.equal(result.draftReady, false);
  assert.equal(result.missing.includes("hydrology-evidence"), true);
});

test("readiness evaluator exposes consolidated evidence state", () => {
  const result = evaluateRegionalCandidateReadiness(arambare);

  assert.equal(result.readiness.hydrologyEvidenceValidated, true);
  assert.equal(result.draftReady, true);
});
