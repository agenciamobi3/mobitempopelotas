import { describe, expect, it } from "vitest";

import {
  isRegionalCityReadyForBasic,
  isRegionalCityReadyForComplete,
  getRegionalCityReadiness,
} from "../src/lib/regional-city-readiness";

import type { RegionalCity } from "../src/lib/regional-cities";

function cityWithReadiness(
  readiness: NonNullable<RegionalCity["readiness"]>,
): RegionalCity {
  return {
    slug: "cidade-teste-rs",
    name: "Cidade Teste",
    state: "RS",
    ibgeCode: "0000000",
    latitude: -31,
    longitude: -52,
    group: "Pelotas e entorno",
    descriptor: "cidade de teste",
    coverage: "complete",
    readiness,
  };
}

describe("regional city readiness", () => {
  it("does not allow basic without technical validation", () => {
    const result = cityWithReadiness({
      ibgeValidated: true,
    });

    expect(isRegionalCityReadyForBasic(result)).toBe(false);
  });

  it("allows basic after minimum data validation", () => {
    const result = cityWithReadiness({
      ibgeValidated: true,
      coordinatesValidated: true,
      weatherValidated: true,
    });

    expect(isRegionalCityReadyForBasic(result)).toBe(true);
  });

  it("requires editorial and SEO maturity for complete", () => {
    const result = cityWithReadiness({
      ibgeValidated: true,
      coordinatesValidated: true,
      weatherValidated: true,
      editorialReady: true,
      seoReady: true,
      imageryReady: true,
    });

    expect(isRegionalCityReadyForComplete(result)).toBe(true);
  });

  it("reports missing readiness requirements", () => {
    const report = getRegionalCityReadiness(cityWithReadiness({
      ibgeValidated: true,
    }));

    expect(report.readyForBasic).toBe(false);
    expect(report.missingForBasic.length).toBeGreaterThan(0);
  });
});
