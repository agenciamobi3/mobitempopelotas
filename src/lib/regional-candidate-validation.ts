import {
  REGIONAL_CANDIDATES,
  type RegionalCandidate,
} from "./regional-candidates";

export type RegionalCandidateValidationStatus =
  | "pending"
  | "validated"
  | "blocked";

export type RegionalCandidateValidationEvidence = {
  status: RegionalCandidateValidationStatus;
  checkedAt?: string;
  source?: string;
  note?: string;
};

export type RegionalCandidateTechnicalValidation = {
  slug: RegionalCandidate["slug"];
  ibge: RegionalCandidateValidationEvidence;
  coordinates: RegionalCandidateValidationEvidence;
  weather: RegionalCandidateValidationEvidence;
  hydrology: RegionalCandidateValidationEvidence;
};

const IBGE_CHECKED_AT = "2026-08-23";

/**
 * Evidências internas da primeira onda de expansão.
 *
 * Nesta etapa somente a identidade municipal (IBGE) foi validada. Coordenadas,
 * cobertura meteorológica e contexto hidrológico permanecem pendentes e não
 * devem ser inferidos a partir do nome da cidade ou da proximidade geográfica.
 */
export const REGIONAL_CANDIDATE_VALIDATIONS: readonly RegionalCandidateTechnicalValidation[] = [
  {
    slug: "guaiba-rs",
    ibge: {
      status: "validated",
      checkedAt: IBGE_CHECKED_AT,
      source: "https://www.ibge.gov.br/cidades-e-estados/rs/guaiba.html",
    },
    coordinates: { status: "pending" },
    weather: { status: "pending" },
    hydrology: { status: "pending" },
  },
  {
    slug: "barra-do-ribeiro-rs",
    ibge: {
      status: "validated",
      checkedAt: IBGE_CHECKED_AT,
      source: "https://www.ibge.gov.br/cidades-e-estados/rs/barra-do-ribeiro.html",
    },
    coordinates: { status: "pending" },
    weather: { status: "pending" },
    hydrology: { status: "pending" },
  },
  {
    slug: "tapes-rs",
    ibge: {
      status: "validated",
      checkedAt: IBGE_CHECKED_AT,
      source: "https://www.ibge.gov.br/cidades-e-estados/rs/tapes.html",
    },
    coordinates: { status: "pending" },
    weather: { status: "pending" },
    hydrology: { status: "pending" },
  },
  {
    slug: "arambare-rs",
    ibge: {
      status: "validated",
      checkedAt: IBGE_CHECKED_AT,
      source: "https://www.ibge.gov.br/cidades-e-estados/rs/arambare.html",
    },
    coordinates: { status: "pending" },
    weather: { status: "pending" },
    hydrology: { status: "pending" },
  },
  {
    slug: "camaqua-rs",
    ibge: {
      status: "validated",
      checkedAt: IBGE_CHECKED_AT,
      source: "https://www.ibge.gov.br/cidades-e-estados/rs/camaqua.html",
    },
    coordinates: { status: "pending" },
    weather: { status: "pending" },
    hydrology: { status: "pending" },
  },
];

export function findRegionalCandidateValidation(slug: string) {
  return (
    REGIONAL_CANDIDATE_VALIDATIONS.find((validation) => validation.slug === slug) ??
    null
  );
}

export function isRegionalCandidateIdentityValidated(
  candidate: RegionalCandidate,
  validation = findRegionalCandidateValidation(candidate.slug),
) {
  return Boolean(
    candidate.ibgeCode &&
      /^\d{7}$/.test(candidate.ibgeCode) &&
      validation?.ibge.status === "validated",
  );
}

/**
 * Gate mínimo para levar um candidato ao cadastro técnico como draft.
 * Draft continua sem superfície pública. Weather e hydrology são avaliados
 * depois, antes de qualquer promoção para basic/complete.
 */
export function isRegionalCandidateReadyForDraft(
  candidate: RegionalCandidate,
  validation = findRegionalCandidateValidation(candidate.slug),
) {
  return Boolean(
    candidate.status === "approved" &&
      isRegionalCandidateIdentityValidated(candidate, validation) &&
      validation?.coordinates.status === "validated",
  );
}

export function regionalCandidateValidationCoverage() {
  const candidateSlugs = new Set(REGIONAL_CANDIDATES.map((candidate) => candidate.slug));
  const validationSlugs = new Set(
    REGIONAL_CANDIDATE_VALIDATIONS.map((validation) => validation.slug),
  );

  return {
    missingValidations: REGIONAL_CANDIDATES.filter(
      (candidate) => !validationSlugs.has(candidate.slug),
    ).map((candidate) => candidate.slug),
    orphanValidations: REGIONAL_CANDIDATE_VALIDATIONS.filter(
      (validation) => !candidateSlugs.has(validation.slug),
    ).map((validation) => validation.slug),
  };
}
