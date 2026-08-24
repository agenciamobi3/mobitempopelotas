import { hasDirectHydrologyEvidence } from "./regional-candidate-hydrology";
import type { RegionalCandidate } from "./regional-candidates";
import type { RegionalCityReadiness } from "./regional-city-readiness";

/**
 * Builds readiness evidence from validated candidate registries.
 * This intentionally does not infer evidence from proximity or manual flags.
 */
export function getRegionalCandidateReadiness(
  candidate: RegionalCandidate,
): RegionalCityReadiness {
  return {
    hydrologyEvidenceValidated: hasDirectHydrologyEvidence(candidate.slug),
  };
}
