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

export type RegionalCandidateCoordinates = {
  latitude: number;
  longitude: number;
  reference: "city-seat";
  datum: "SIRGAS 2000";
};

export type RegionalCandidateTechnicalValidation = {
  slug: RegionalCandidate["slug"];
  ibge: RegionalCandidateValidationEvidence;
  coordinates: RegionalCandidateValidationEvidence;
  coordinatesValue?: RegionalCandidateCoordinates;
  weather: RegionalCandidateValidationEvidence;
  hydrology: RegionalCandidateValidationEvidence;
};

const IBGE_CHECKED_AT = "2026-08-23";
const COORDINATES_CHECKED_AT = "2026-08-23";
const WEATHER_CHECKED_AT = "2026-08-23";

const OPEN_METEO_WEATHER_VALIDATION: RegionalCandidateValidationEvidence = {
  status: "validated",
  checkedAt: WEATHER_CHECKED_AT,
  source: "https://api.open-meteo.com/v1/forecast",
  note:
    "Consulta em lote validada com o mesmo contrato da visão regional (cell_selection=land, current + daily): HTTP 200 e payload meteorológico completo para os cinco pontos da primeira onda.",
};

/**
 * Evidências internas da primeira onda de expansão.
 *
 * Identidade municipal (IBGE), coordenadas das sedes e compatibilidade com a
 * fonte meteorológica principal estão validadas para toda a primeira onda.
 * Hydrology continua pendente e deve ser confirmada por fontes realmente
 * aplicáveis a cada município, sem inferência apenas por proximidade.
 */
export const REGIONAL_CANDIDATE_VALIDATIONS: readonly RegionalCandidateTechnicalValidation[] = [
  {
    slug: "guaiba-rs",
    ibge: {
      status: "validated",
      checkedAt: IBGE_CHECKED_AT,
      source: "https://www.ibge.gov.br/cidades-e-estados/rs/guaiba.html",
    },
    coordinates: {
      status: "validated",
      checkedAt: COORDINATES_CHECKED_AT,
      source:
        "https://geoftp.ibge.gov.br/cartas_e_mapas/mapas_municipais/colecao_de_mapas_municipais/2020/RS/guaiba/4309308_MM.pdf",
      note: "Mapa Municipal IBGE, edição 04/2021; coordenadas da sede.",
    },
    coordinatesValue: {
      latitude: -30.11,
      longitude: -51.31,
      reference: "city-seat",
      datum: "SIRGAS 2000",
    },
    weather: OPEN_METEO_WEATHER_VALIDATION,
    hydrology: { status: "pending" },
  },
  {
    slug: "barra-do-ribeiro-rs",
    ibge: {
      status: "validated",
      checkedAt: IBGE_CHECKED_AT,
      source: "https://www.ibge.gov.br/cidades-e-estados/rs/barra-do-ribeiro.html",
    },
    coordinates: {
      status: "validated",
      checkedAt: COORDINATES_CHECKED_AT,
      source:
        "https://geoftp.ibge.gov.br/cartas_e_mapas/mapas_municipais/colecao_de_mapas_municipais/2020/RS/barra_do_ribeiro/4301909_MM.pdf",
      note: "Mapa Municipal IBGE, edição 04/2021; coordenadas da sede.",
    },
    coordinatesValue: {
      latitude: -30.29,
      longitude: -51.3,
      reference: "city-seat",
      datum: "SIRGAS 2000",
    },
    weather: OPEN_METEO_WEATHER_VALIDATION,
    hydrology: { status: "pending" },
  },
  {
    slug: "tapes-rs",
    ibge: {
      status: "validated",
      checkedAt: IBGE_CHECKED_AT,
      source: "https://www.ibge.gov.br/cidades-e-estados/rs/tapes.html",
    },
    coordinates: {
      status: "validated",
      checkedAt: COORDINATES_CHECKED_AT,
      source:
        "https://geoftp.ibge.gov.br/cartas_e_mapas/mapas_municipais/colecao_de_mapas_municipais/2020/RS/tapes/4321105_MM.pdf",
      note: "Mapa Municipal IBGE, edição 04/2021; coordenadas da sede.",
    },
    coordinatesValue: {
      latitude: -30.67,
      longitude: -51.39,
      reference: "city-seat",
      datum: "SIRGAS 2000",
    },
    weather: OPEN_METEO_WEATHER_VALIDATION,
    hydrology: { status: "pending" },
  },
  {
    slug: "arambare-rs",
    ibge: {
      status: "validated",
      checkedAt: IBGE_CHECKED_AT,
      source: "https://www.ibge.gov.br/cidades-e-estados/rs/arambare.html",
    },
    coordinates: {
      status: "validated",
      checkedAt: COORDINATES_CHECKED_AT,
      source:
        "https://geoftp.ibge.gov.br/cartas_e_mapas/mapas_municipais/colecao_de_mapas_municipais/2020/RS/arambare/4300851_MM.pdf",
      note: "Mapa Municipal IBGE, edição 04/2021; coordenadas da sede.",
    },
    coordinatesValue: {
      latitude: -30.91,
      longitude: -51.5,
      reference: "city-seat",
      datum: "SIRGAS 2000",
    },
    weather: OPEN_METEO_WEATHER_VALIDATION,
    hydrology: { status: "pending" },
  },
  {
    slug: "camaqua-rs",
    ibge: {
      status: "validated",
      checkedAt: IBGE_CHECKED_AT,
      source: "https://www.ibge.gov.br/cidades-e-estados/rs/camaqua.html",
    },
    coordinates: {
      status: "validated",
      checkedAt: COORDINATES_CHECKED_AT,
      source:
        "https://geoftp.ibge.gov.br/cartas_e_mapas/mapas_municipais/colecao_de_mapas_municipais/2020/RS/camaqua/4303509_MM.pdf",
      note: "Mapa Municipal IBGE, edição 04/2021; coordenadas da sede.",
    },
    coordinatesValue: {
      latitude: -30.85,
      longitude: -51.81,
      reference: "city-seat",
      datum: "SIRGAS 2000",
    },
    weather: OPEN_METEO_WEATHER_VALIDATION,
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

export function hasValidatedRegionalCandidateCoordinates(
  validation: RegionalCandidateTechnicalValidation | null,
) {
  const value = validation?.coordinatesValue;

  return Boolean(
    validation?.coordinates.status === "validated" &&
      value &&
      Number.isFinite(value.latitude) &&
      Number.isFinite(value.longitude) &&
      value.latitude >= -90 &&
      value.latitude <= 90 &&
      value.longitude >= -180 &&
      value.longitude <= 180 &&
      value.reference === "city-seat" &&
      value.datum === "SIRGAS 2000",
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
      hasValidatedRegionalCandidateCoordinates(validation),
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
