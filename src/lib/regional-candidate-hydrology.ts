import type { RegionalCandidateTechnicalValidation } from "./regional-candidate-validation";

export type RegionalHydrologyAssessment = {
  slug: RegionalCandidateTechnicalValidation["slug"];
  status: "validated" | "pending";
  directSource: boolean;
  source?: string;
  note: string;
};

/**
 * Hydrology is intentionally stricter than geographic proximity.
 * A nearby station is context only until the relationship is technically
 * validated for the municipality.
 */
export const REGIONAL_CANDIDATE_HYDROLOGY_ASSESSMENTS: readonly RegionalHydrologyAssessment[] = [
  {
    slug: "arambare-rs",
    status: "validated",
    directSource: true,
    source: "https://monitoramentolagoadospatos.com.br/",
    note: "Fonte direta validada no contexto municipal de Arambaré. Mantém confirmação de estação e observação, sem criar limiares de alerta.",
  },
  {
    slug: "guaiba-rs",
    status: "pending",
    directSource: false,
    note: "Referências do Lago Guaíba ainda precisam ser separadas entre contexto regional e estação representativa do município.",
  },
  {
    slug: "barra-do-ribeiro-rs",
    status: "pending",
    directSource: false,
    note: "Ainda sem fonte hidrológica municipal direta validada.",
  },
  {
    slug: "tapes-rs",
    status: "pending",
    directSource: false,
    note: "Fontes próximas da Lagoa dos Patos não serão utilizadas como proxy automático.",
  },
  {
    slug: "camaqua-rs",
    status: "pending",
    directSource: false,
    note: "Necessária validação do vínculo operacional entre estação do Rio Camaquã e a página municipal.",
  },
];

export function hasDirectHydrologyEvidence(slug: string) {
  return REGIONAL_CANDIDATE_HYDROLOGY_ASSESSMENTS.some(
    (item) => item.slug === slug && item.status === "validated" && item.directSource,
  );
}
