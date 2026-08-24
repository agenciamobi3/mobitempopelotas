import { REGIONAL_CANDIDATES } from "./regional-candidates";
import { evaluateRegionalCandidateReadiness } from "./regional-candidate-readiness-evaluation";

export type RegionalCandidateReadinessReportItem = {
  slug: string;
  name: string;
  draftReady: boolean;
  basicReady: boolean;
  completeReady: boolean;
  missing: readonly string[];
};

export function generateRegionalCandidateReadinessReport(): readonly RegionalCandidateReadinessReportItem[] {
  return REGIONAL_CANDIDATES.map((candidate) => {
    const evaluation = evaluateRegionalCandidateReadiness(candidate);

    return {
      slug: candidate.slug,
      name: candidate.name,
      draftReady: evaluation.draftReady,
      basicReady: evaluation.basicReady,
      completeReady: evaluation.completeReady,
      missing: evaluation.missing,
    };
  });
}
