import type { RegionalCity } from "./regional-cities";
import type { RegionalCityReadiness } from "./regional-city-readiness";

/**
 * Contrato auxiliar para cidades regionais com maturidade editorial/técnica.
 * Mantém compatibilidade com o inventário existente enquanto o campo readiness
 * é integrado gradualmente ao cadastro principal.
 */
export type RegionalCityWithReadiness = RegionalCity & {
  readiness?: RegionalCityReadiness;
};

export function hasRegionalCityReadiness(
  city: RegionalCityWithReadiness,
): city is RegionalCityWithReadiness & { readiness: RegionalCityReadiness } {
  return Boolean(city.readiness);
}

export function getRegionalCityReadinessKeys(
  city: RegionalCityWithReadiness,
) {
  return Object.entries(city.readiness ?? {})
    .filter(([, value]) => value === true)
    .map(([key]) => key);
}
