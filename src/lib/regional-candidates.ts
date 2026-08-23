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
 *
 * Primeira onda: continuidade de estudo do eixo Guaíba/Lagoa dos Patos em
 * direção à Zona Sul. Os códigos IBGE abaixo foram conferidos no portal
 * Cidades e Estados do IBGE em 2026-08-23; isso não promove nenhuma cidade.
 */
export const REGIONAL_CANDIDATES: readonly RegionalCandidate[] = [
  {
    slug: "guaiba-rs",
    name: "Guaíba",
    state: "RS",
    ibgeCode: "4309308",
    priority: "high",
    reasons: ["hydrology", "regional_relevance", "population", "seo"],
    status: "candidate",
    rationale:
      "Avaliar como ponto de continuidade hidroclimática entre a Região Metropolitana e a cobertura regional ao sul.",
  },
  {
    slug: "barra-do-ribeiro-rs",
    name: "Barra do Ribeiro",
    state: "RS",
    ibgeCode: "4301909",
    priority: "high",
    reasons: ["hydrology", "regional_relevance", "seo"],
    status: "candidate",
    rationale:
      "Avaliar para preencher a continuidade territorial e hidrológica no percurso entre Guaíba e a Costa Doce.",
  },
  {
    slug: "tapes-rs",
    name: "Tapes",
    state: "RS",
    ibgeCode: "4321105",
    priority: "medium",
    reasons: ["hydrology", "regional_relevance", "seo"],
    status: "candidate",
    rationale:
      "Avaliar como expansão da cobertura da Costa Doce antes das cidades já publicadas mais ao sul.",
  },
  {
    slug: "arambare-rs",
    name: "Arambaré",
    state: "RS",
    ibgeCode: "4300851",
    priority: "medium",
    reasons: ["hydrology", "regional_relevance", "seo"],
    status: "candidate",
    rationale:
      "Avaliar como complemento territorial da Costa Doce e da leitura regional da Lagoa dos Patos.",
  },
  {
    slug: "camaqua-rs",
    name: "Camaquã",
    state: "RS",
    ibgeCode: "4303509",
    priority: "high",
    reasons: ["hydrology", "regional_relevance", "population", "seo"],
    status: "candidate",
    rationale:
      "Avaliar como polo regional intermediário entre a porção central da Costa Doce e a Zona Sul já atendida.",
  },
];

export function findRegionalCandidate(slug: string) {
  return REGIONAL_CANDIDATES.find((candidate) => candidate.slug === slug) ?? null;
}

export function isRegionalCandidateApproved(candidate: RegionalCandidate) {
  return candidate.status === "approved";
}
