import assert from "node:assert/strict";
import test from "node:test";

import {
  COSTA_DOCE_PUBLICATION_READINESS,
} from "../src/lib/regional-city-readiness-costa-doce.ts";
import {
  isRegionalCityReadyForBasic,
  isRegionalCityReadyForComplete,
} from "../src/lib/regional-city-readiness.ts";
import {
  INDEXABLE_REGIONAL_CITIES,
  PUBLIC_REGIONAL_CITIES,
  REGIONAL_CITIES,
  regionalCityCoverage,
} from "../src/lib/regional-cities.ts";

const baseCity = REGIONAL_CITIES[0]!;
const promotedCostaDoceSlugs = Object.keys(COSTA_DOCE_PUBLICATION_READINESS);

test("inventário público e indexável inclui as 35 cidades aprovadas", () => {
  assert.equal(REGIONAL_CITIES.length, 35);
  assert.equal(PUBLIC_REGIONAL_CITIES.length, 35);
  assert.equal(INDEXABLE_REGIONAL_CITIES.length, 35);
  assert.equal(REGIONAL_CITIES.filter((city) => regionalCityCoverage(city) === "basic").length, 0);
  assert.equal(promotedCostaDoceSlugs.length, 11);
});

test("as 11 cidades promovidas da Costa Doce satisfazem o gate complete", () => {
  for (const slug of promotedCostaDoceSlugs) {
    const city = REGIONAL_CITIES.find((item) => item.slug === slug);
    const approval = COSTA_DOCE_PUBLICATION_READINESS[slug];
    assert.ok(city, `cidade ausente do registry: ${slug}`);
    assert.ok(approval, `readiness ausente: ${slug}`);
    assert.equal(isRegionalCityReadyForComplete({ ...city, readiness: approval.readiness }), true);
    assert.ok(approval.evidence.length >= 3, `evidência insuficiente: ${slug}`);
    assert.equal(regionalCityCoverage(city), "complete");
  }
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

test("complete exige evidência hidrológica, contexto, conteúdo, SEO e imagens além do basic", () => {
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
        editorialReady: true,
        seoReady: true,
        imageryReady: true,
      },
    }),
    false,
  );
});
