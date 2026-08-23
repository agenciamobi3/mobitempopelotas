import type { RegionalCityDomain } from "./regional-city-domain";
import {
  getRegionalCityReadiness,
  type RegionalCityReadinessKey,
} from "./regional-city-readiness";

export type RegionalCityExpansionReport = {
  slug: string;
  name: string;
  basicReady: boolean;
  completeReady: boolean;
  missing: RegionalCityReadinessKey[];
};

export function buildRegionalCityExpansionReport(
  cities: readonly RegionalCityDomain[],
): RegionalCityExpansionReport[] {
  return cities.map((city) => {
    const readiness = getRegionalCityReadiness(city);

    return {
      slug: city.slug,
      name: city.name,
      basicReady: readiness.basicReady,
      completeReady: readiness.completeReady,
      missing: readiness.missing,
    };
  });
}
