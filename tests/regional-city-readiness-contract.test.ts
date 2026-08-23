import { describe, expect, it } from "vitest";
import {
  isRegionalCityReadyForBasic,
  isRegionalCityReadyForComplete,
} from "../src/lib/regional-city-readiness";
import { PUBLIC_REGIONAL_CITIES, INDEXABLE_REGIONAL_CITIES } from "../src/lib/regional-cities";

describe("regional city readiness contract", () => {
  it("keeps the current regional inventory public and indexable", () => {
    expect(PUBLIC_REGIONAL_CITIES).toHaveLength(24);
    expect(INDEXABLE_REGIONAL_CITIES).toHaveLength(24);
  });

  it("does not consider incomplete cities ready", () => {
    expect(
      isRegionalCityReadyForBasic({
        readiness: {},
      }),
    ).toBe(false);
  });

  it("allows complete readiness only after editorial and SEO validation", () => {
    expect(
      isRegionalCityReadyForComplete({
        readiness: {
          ibgeValidated: true,
          coordinatesValidated: true,
          weatherValidated: true,
          editorialReady: true,
          seoReady: true,
          imageryReady: true,
        },
      }),
    ).toBe(true);
  });
});
