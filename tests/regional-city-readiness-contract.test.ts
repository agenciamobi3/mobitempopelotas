import assert from "node:assert/strict";
import test from "node:test";

import {
  isRegionalCityReadyForBasic,
  isRegionalCityReadyForComplete,
} from "../src/lib/regional-city-readiness.ts";
import {
  INDEXABLE_REGIONAL_CITIES,
  PUBLIC_REGIONAL_CITIES,
  REGIONAL_CITIES,
} from "../src/lib/regional-cities.ts";

const baseCity = REGIONAL_CITIES[0]!;

test("mantém o inventário regional atual público e indexável", () => {
  assert.equal(PUBLIC_REGIONAL_CITIES.length, 24);
  assert.equal(INDEXABLE_REGIONAL_CITIES.length, 24);
});

test("não considera cidade incompleta pronta para basic", () => {
  assert.equal(
    isRegionalCityReadyForBasic({
      ...baseCity,
      readiness: {},
    }),
    false,
  );
});

test("basic exige IBGE, coordenadas e meteorologia validados", () => {
  assert.equal(
    isRegionalCityReadyForBasic({
      ...baseCity,
      readiness: {
        ibgeValidated: true,
        coordinatesValidated: true,
        weatherValidated: true,
      },
    }),
    true,
  );
});

test("complete exige contexto e evidência hidrológica, conteúdo, SEO e imagens além do basic", () => {
  assert.equal(
    isRegionalCityReadyForComplete({
      ...baseCity,
      readiness: {
        ibgeValidated: true,
        coordinatesValidated: true,
        weatherValidated: true,
        hydrologicalContextValidated: true,
        hydrologyEvidenceValidated: true,
        editorialReady: true,
        seoReady: true,
        imageryReady: true,
      },
    }),
    true,
  );

  assert.equal(
    isRegionalCityReadyForComplete({
      ...baseCity,
      readiness: {
        ibgeValidated: true,
        coordinatesValidated: true,
        weatherValidated: true,
        hydrologicalContextValidated: true,
        editorialReady: true,
        seoReady: true,
        imageryReady: true,
      },
    }),
    false,
    "contexto hidrológico sem evidência validada não deve liberar coverage complete",
  );
});
