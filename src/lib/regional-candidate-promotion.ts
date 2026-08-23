import {
  REGIONAL_CITIES,
  type RegionalCity,
  type RegionalCityGroup,
} from "./regional-cities";
import {
  findRegionalCandidateValidation,
  hasValidatedRegionalCandidateCoordinates,
  isRegionalCandidateIdentityValidated,
  type RegionalCandidateTechnicalValidation,
} from "./regional-candidate-validation";
import type { RegionalCandidate } from "./regional-candidates";

export type RegionalCandidateDraftPromotionReason =
  | "not-approved"
  | "identity-not-validated"
  | "coordinates-not-validated"
  | "slug-conflict"
  | "ibge-conflict"
  | "descriptor-empty";

export type RegionalCandidateDraftInput = {
  group: RegionalCityGroup;
  /**
   * Texto editorial público da futura cidade. A rationale do candidato é
   * deliberadamente ignorada para não vazar justificativa interna.
   */
  descriptor: string;
};

export type RegionalCandidateDraftPromotionResult =
  | {
      ready: true;
      draft: RegionalCity;
      reasons: readonly [];
    }
  | {
      ready: false;
      draft: null;
      reasons: readonly RegionalCandidateDraftPromotionReason[];
    };

function hasSlugConflict(candidate: RegionalCandidate) {
  return REGIONAL_CITIES.some((city) => city.slug === candidate.slug);
}

function hasIbgeConflict(candidate: RegionalCandidate) {
  return Boolean(
    candidate.ibgeCode &&
      REGIONAL_CITIES.some((city) => city.ibgeCode === candidate.ibgeCode),
  );
}

/**
 * Avalia a passagem candidate -> draft sem alterar REGIONAL_CITIES.
 *
 * A promoção é intencionalmente um processo de duas etapas: primeiro este
 * builder produz um RegionalCity com coverage="draft" e indexable=false;
 * somente depois uma alteração explícita do inventário pode cadastrá-lo.
 */
export function evaluateRegionalCandidateDraftPromotion(
  candidate: RegionalCandidate,
  input: RegionalCandidateDraftInput,
  validation: RegionalCandidateTechnicalValidation | null =
    findRegionalCandidateValidation(candidate.slug),
): RegionalCandidateDraftPromotionResult {
  const reasons: RegionalCandidateDraftPromotionReason[] = [];

  if (candidate.status !== "approved") {
    reasons.push("not-approved");
  }

  if (!isRegionalCandidateIdentityValidated(candidate, validation)) {
    reasons.push("identity-not-validated");
  }

  if (!hasValidatedRegionalCandidateCoordinates(validation)) {
    reasons.push("coordinates-not-validated");
  }

  if (hasSlugConflict(candidate)) {
    reasons.push("slug-conflict");
  }

  if (hasIbgeConflict(candidate)) {
    reasons.push("ibge-conflict");
  }

  const descriptor = input.descriptor.trim();
  if (!descriptor) {
    reasons.push("descriptor-empty");
  }

  if (reasons.length > 0 || !candidate.ibgeCode || !validation?.coordinatesValue) {
    return {
      ready: false,
      draft: null,
      reasons,
    };
  }

  return {
    ready: true,
    reasons: [],
    draft: {
      slug: candidate.slug,
      name: candidate.name,
      state: candidate.state,
      ibgeCode: candidate.ibgeCode,
      latitude: validation.coordinatesValue.latitude,
      longitude: validation.coordinatesValue.longitude,
      group: input.group,
      descriptor,
      coverage: "draft",
      indexable: false,
    },
  };
}
