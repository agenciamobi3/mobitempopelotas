import { REGIONAL_CANDIDATES } from "./regional-candidates";
import { evaluateRegionalCandidateReadiness } from "./regional-candidate-readiness-evaluation";

export type RegionalExpansionAction =
  | "validate-hydrology"
  | "validate-technical-evidence"
  | "prepare-draft"
  | "continue-readiness";

export type RegionalExpansionStatusItem = {
  slug: string;
  name: string;
  draftReady: boolean;
  basicReady: boolean;
  completeReady: boolean;
  blockers: readonly string[];
  nextAction: RegionalExpansionAction;
};

function resolveNextAction(
  blockers: readonly string[],
): RegionalExpansionAction {
  if (blockers.includes("hydrology-evidence")) {
    return "validate-hydrology";
  }

  if (blockers.length > 0) {
    return "validate-technical-evidence";
  }

  return "prepare-draft";
}

export function generateRegionalExpansionStatusReport(): readonly RegionalExpansionStatusItem[] {
  return REGIONAL_CANDIDATES.map((candidate) => {
    const evaluation = evaluateRegionalCandidateReadiness(candidate);

    return {
      slug: candidate.slug,
      name: candidate.name,
      draftReady: evaluation.draftReady,
      basicReady: evaluation.basicReady,
      completeReady: evaluation.completeReady,
      blockers: evaluation.missing,
      nextAction: resolveNextAction(evaluation.missing),
    };
  });
}
