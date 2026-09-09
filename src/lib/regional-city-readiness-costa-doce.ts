import type { RegionalCityReadiness } from "./regional-city-readiness";

export type CostaDocePublicationReadiness = {
  readiness: RegionalCityReadiness;
  evidence: readonly string[];
};

const COMPLETE: RegionalCityReadiness = {
  ibgeValidated: true,
  coordinatesValidated: true,
  weatherValidated: true,
  alertsValidated: true,
  hydrologicalContextValidated: true,
  hydrologyEvidenceValidated: true,
  editorialReady: true,
  seoReady: true,
  imageryReady: true,
};

function approved(...evidence: string[]): CostaDocePublicationReadiness {
  return { readiness: { ...COMPLETE }, evidence };
}

/**
 * Evidência de publicação das 11 cidades adicionadas à expansão Costa Doce em 09/09/2026.
 *
 * `hydrologyEvidenceValidated` significa que qualquer contexto de água usado no texto foi
 * revisado e permanece separado de medição hidrológica. Não significa que a cidade possua
 * estação de nível integrada ao Tempo Pelotas.
 *
 * `imageryReady` significa que a página está apta ao contrato visual regional atual, que é
 * orientado por dados e não exige fotografia municipal específica para indexação.
 */
export const COSTA_DOCE_PUBLICATION_READINESS: Readonly<
  Record<string, CostaDocePublicationReadiness>
> = {
  "arambare-rs": approved(
    "Código municipal conferido no IBGE.",
    "Previsão regional respondeu live no snapshot de produção de 09/09/2026.",
    "Página possui conteúdo editorial próprio e ligação hidrológica separada com a estação de Arambaré.",
  ),
  "barra-do-ribeiro-rs": approved(
    "Código municipal conferido no IBGE.",
    "Previsão regional respondeu live no snapshot de produção de 09/09/2026.",
    "Contexto junto ao Guaíba revisado sem transformar previsão meteorológica em nível da água.",
  ),
  "camaqua-rs": approved(
    "Código municipal conferido no IBGE.",
    "Previsão regional respondeu live no snapshot de produção de 09/09/2026.",
    "Contexto da bacia do rio Camaquã revisado e separado de qualquer medição hidrológica.",
  ),
  "cerro-grande-do-sul-rs": approved(
    "Código municipal conferido no IBGE.",
    "Previsão regional respondeu live no snapshot de produção de 09/09/2026.",
    "Inserção na bacia do rio Camaquã revisada em fonte pública estadual; sem alegação de nível local.",
  ),
  "dom-feliciano-rs": approved(
    "Código municipal conferido no IBGE.",
    "Previsão regional respondeu live no snapshot de produção de 09/09/2026.",
    "Inserção na bacia do rio Camaquã revisada em fonte pública estadual; precipitação continua separada de hidrologia.",
  ),
  "guaiba-rs": approved(
    "Código municipal conferido no IBGE.",
    "Previsão regional respondeu live no snapshot de produção de 09/09/2026.",
    "Contexto da margem oeste do Guaíba revisado; página meteorológica não reutiliza leitura de nível.",
  ),
  "mariana-pimentel-rs": approved(
    "Código municipal conferido no IBGE.",
    "Previsão regional respondeu live no snapshot de produção de 09/09/2026.",
    "Conteúdo local revisado sem atribuir estação hidrológica ou nível inexistente no portal.",
  ),
  "mostardas-rs": approved(
    "Código municipal conferido no IBGE.",
    "Previsão regional respondeu live no snapshot de produção de 09/09/2026.",
    "Contexto costeiro revisado e tratado como referência geográfica, não como observação uniforme do município.",
  ),
  "sertao-santana-rs": approved(
    "Código municipal conferido no IBGE.",
    "Previsão regional respondeu live no snapshot de produção de 09/09/2026.",
    "Conteúdo local revisado sem associação artificial a estação de nível.",
  ),
  "tapes-rs": approved(
    "Código municipal conferido no IBGE.",
    "Previsão regional respondeu live no snapshot de produção de 09/09/2026.",
    "Relação com a Lagoa dos Patos revisada; previsão meteorológica permanece distinta de nível da água.",
  ),
  "tavares-rs": approved(
    "Código municipal conferido no IBGE.",
    "Previsão regional respondeu live no snapshot de produção de 09/09/2026.",
    "Contexto costeiro e lagunar revisado sem inferir uma única condição para toda a extensão municipal.",
  ),
};

export function costaDocePublicationReadiness(slug: string) {
  return COSTA_DOCE_PUBLICATION_READINESS[slug] ?? null;
}
