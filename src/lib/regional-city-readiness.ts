import type { RegionalCity } from "./regional-cities";

export type RegionalCityReadinessKey =
  | "ibgeValidated"
  | "coordinatesValidated"
  | "weatherValidated"
  | "alertsValidated"
  | "hydrologicalContextValidated"
  | "editorialReady"
  | "seoReady"
  | "imageryReady"
  | "faqReady";

export type RegionalCityReadiness = Partial<
  Record<RegionalCityReadinessKey, boolean>
>;

const BASIC_REQUIREMENTS: RegionalCityReadinessKey[] = [
  "ibgeValidated",
  "coordinatesValidated",
  "weatherValidated",
];

const COMPLETE_REQUIREMENTS: RegionalCityReadinessKey[] = [
  ...BASIC_REQUIREMENTS,
  "hydrologicalContextValidated",
  "editorialReady",
  "seoReady",
  "imageryReady",
];

function hasRequirements(
  readiness: RegionalCityReadiness | undefined,
  requirements: RegionalCityReadinessKey[],
) {
  return requirements.every((key) => readiness?.[key] === true);
}

export function isRegionalCityReadyForBasic(city: RegionalCity) {
  return hasRequirements(city.readiness, BASIC_REQUIREMENTS);
}

export function isRegionalCityReadyForComplete(city: RegionalCity) {
  return hasRequirements(city.readiness, COMPLETE_REQUIREMENTS);
}

export function getRegionalCityReadiness(city: RegionalCity) {
  const missing = COMPLETE_REQUIREMENTS.filter(
    (key) => city.readiness?.[key] !== true,
  );

  return {
    basicReady: isRegionalCityReadyForBasic(city),
    completeReady: missing.length === 0,
    missing,
  };
}
