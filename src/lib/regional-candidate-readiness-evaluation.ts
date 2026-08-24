import { getRegionalCandidateReadiness } from "./regional-candidate-readiness";
import type { RegionalCandidate } from "./regional-candidates";

export type RegionalCandidateReadinessStage =
  | "candidate"
  | "draft"
  | "basic"
  | "complete";

export type RegionalCandidateReadinessEvaluation = {
  readiness: ReturnType<typeof getRegionalCandidateReadiness>;
  draftReady: boolean;
  basicReady: boolean;
  completeReady: boolean;
  missing: string[];
};

/**
 * Centralizes maturity evaluation without promoting or publishing a city.
 */
export function evaluateRegionalCandidateReadiness(
  candidate: RegionalCandidate,
): RegionalCandidateReadinessEvaluation {
  const readiness = getRegionalCandidateReadiness(candidate);
  const missing: string[] = [];

  if (!readiness.hydrologyEvidenceValidated) {
    missing.push("hydrology-evidence");
  }

  const draftReady = missing.length === 0;

  return {
    readiness,
    draftReady,
    basicReady: false,
    completeReady: false,
    missing,
  };
}
