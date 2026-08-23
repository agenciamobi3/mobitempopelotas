import type { RegionalCity } from "./regional-cities";
import type { RegionalCityReadiness } from "./regional-city-readiness";

/**
 * Contrato de domínio para evolução gradual do inventário regional.
 * Mantém compatibilidade com cidades existentes enquanto readiness é adotado.
 */
export type RegionalCityDomain = RegionalCity & {
  readiness?: RegionalCityReadiness;
};

export function withRegionalCityReadiness(
  city: RegionalCity,
  readiness?: RegionalCityReadiness,
): RegionalCityDomain {
  return {
    ...city,
    readiness,
  };
}

export function hasRegionalCityReadiness(
  city: RegionalCityDomain,
): city is RegionalCityDomain & { readiness: RegionalCityReadiness } {
  return Boolean(city.readiness);
}
