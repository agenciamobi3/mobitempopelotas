import { describe, expect, it } from "node:test";
import { getRegionalCandidateReadiness } from "../src/lib/regional-candidate-readiness";

const arambare = {
  slug: "arambare-rs",
  name: "Arambaré",
  state: "RS" as const,
  priority: "high" as const,
  reason: ["hydrology"] as const,
  status: "candidate" as const,
};

const guaiba = {
  slug: "guaiba-rs",
  name: "Guaíba",
  state: "RS" as const,
  priority: "high" as const,
  reason: ["hydrology"] as const,
  status: "candidate" as const,
};

describe("regional candidate readiness adapter", () => {
  it("maps direct hydrology evidence", () => {
    expect(getRegionalCandidateReadiness(arambare).hydrologyEvidenceValidated).toBe(true);
  });

  it("does not infer evidence from regional context", () => {
    expect(getRegionalCandidateReadiness(guaiba).hydrologyEvidenceValidated).toBe(false);
  });
});
