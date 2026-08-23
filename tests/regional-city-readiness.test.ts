import assert from "node:assert/strict";
import test from "node:test";

import {
  getRegionalCityReadiness,
  isRegionalCityReadyForBasic,
  isRegionalCityReadyForComplete,
  type RegionalCityReadiness,
} from "../src/lib/regional-city-readiness.ts";
import type { RegionalCityDomain } from "../src/lib/regional-city-domain.ts";

function cityWithReadiness(
  readiness: RegionalCityReadiness,
): RegionalCityDomain {
  return {
    slug: "cidade-teste-rs",
    name: "Cidade Teste",
    state: "RS",
    ibgeCode: "0000000",
    latitude: -31,
    longitude: -52,
    group: "Pelotas e entorno",
    descriptor: "cidade de teste",
    coverage: "draft",
    readiness,
  };
}

test("não permite basic sem validação técnica mínima", () => {
  const result = cityWithReadiness({
    ibgeValidated: true,
  });

  assert.equal(isRegionalCityReadyForBasic(result), false);
});

test("permite basic após IBGE, coordenadas e meteorologia validados", () => {
  const result = cityWithReadiness({
    ibgeValidated: true,
    coordinatesValidated: true,
    weatherValidated: true,
  });

  assert.equal(isRegionalCityReadyForBasic(result), true);
});

test("complete exige maturidade técnica, hidrológica, editorial, SEO e visual", () => {
  const result = cityWithReadiness({
    ibgeValidated: true,
    coordinatesValidated: true,
    weatherValidated: true,
    hydrologicalContextValidated: true,
    editorialReady: true,
    seoReady: true,
    imageryReady: true,
  });

  assert.equal(isRegionalCityReadyForComplete(result), true);
});

test("relatório informa requisitos faltantes para complete", () => {
  const report = getRegionalCityReadiness(
    cityWithReadiness({
      ibgeValidated: true,
    }),
  );

  assert.equal(report.basicReady, false);
  assert.equal(report.completeReady, false);
  assert.ok(report.missing.includes("coordinatesValidated"));
  assert.ok(report.missing.includes("weatherValidated"));
  assert.ok(report.missing.includes("hydrologicalContextValidated"));
});
