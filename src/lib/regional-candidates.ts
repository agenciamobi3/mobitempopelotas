export type RegionalCandidateStatus = "candidate" | "approved" | "rejected";

export type RegionalCandidatePriority = "high" | "medium" | "low";

export type RegionalCandidateReason =
  | "hydrology"
  | "regional_relevance"
  | "population"
  | "seo";

export type RegionalCandidate = {
  slug: string;
  name: string;
  state: "RS";
  /** Código IBGE somente depois de validação explícita da fonte oficial. */
  ibgeCode?: string;
  priority: RegionalCandidatePriority;
  reasons: readonly RegionalCandidateReason[];
  status: RegionalCandidateStatus;
  /** Justificativa interna. Não deve ser usada como conteúdo editorial público. */
  rationale: string;
};

/**
 * Inventário interno de cidades em estudo.
 * Candidatos não pertencem ao inventário público regional e não geram rota,
 * sitemap ou indexação até promoção explícita para RegionalCity.
 */
export const REGIONAL_CANDIDATES: readonly RegionalCandidate[] = [];

export function findRegionalCandidate(slug: string) {
  return REGIONAL_CANDIDATES.find((candidate) => candidate.slug === slug) ?? null;
}

export function isRegionalCandidateApproved(candidate: RegionalCandidate) {
  return candidate.status === "approved";
}
