import { getRegionalCityReadiness } from "./regional-city-readiness";
import type { RegionalCity } from "./regional-cities";

export type RegionalCityExpansionReport = {
  slug: string;
  name: string;
  basicReady: boolean;
  completeReady: boolean;
  missing: string[];
};

export function buildRegionalCityExpansionReport(
  cities: (RegionalCity & { readiness?: Record<string, boolean> })[],
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
