import { describe, expect, it } from "node:test";

import { buildRegionalCandidateReadiness } from "../src/lib/regional-candidate-readiness";
import { hasDirectHydrologyEvidence } from "../src/lib/regional-candidate-hydrology";

describe("regional candidate readiness integration", () => {
  it("propagates direct hydrology evidence for validated candidates", () => {
    const readiness = buildRegionalCandidateReadiness("arambare-rs");

    expect(hasDirectHydrologyEvidence("arambare-rs")).toBe(true);
    expect(readiness.hydrologyEvidenceValidated).toBe(true);
  });

  it("does not promote geographic context as hydrology evidence", () => {
    const readiness = buildRegionalCandidateReadiness("guaiba-rs");

    expect(hasDirectHydrologyEvidence("guaiba-rs")).toBe(false);
    expect(readiness.hydrologyEvidenceValidated).toBe(false);
  });
});
