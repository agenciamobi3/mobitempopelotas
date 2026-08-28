import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { regionalCityEditorialProfile } from "../src/lib/regional-city-editorial.ts";
import {
  INDEXABLE_REGIONAL_CITIES,
  isRegionalHomeCity,
} from "../src/lib/regional-cities.ts";

const regionalPageSource = readFileSync(
  "src/components/regional/RegionalCityWeatherPage.tsx",
  "utf8",
);

test("todas as páginas municipais indexáveis possuem perfil editorial específico", () => {
  const municipalCities = INDEXABLE_REGIONAL_CITIES.filter((city) => !isRegionalHomeCity(city));

  assert.equal(municipalCities.length, 23);

  for (const city of municipalCities) {
    const profile = regionalCityEditorialProfile(city);
    assert.ok(profile, `Perfil editorial ausente para ${city.name} (${city.slug})`);
    assert.match(profile.metaDescription, new RegExp(city.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
    assert.ok(profile.heroDescription.length >= 80, `Hero curto demais para ${city.name}`);
    assert.ok(profile.introduction.length >= 120, `Introdução curta demais para ${city.name}`);
    assert.ok(profile.facts.length >= 4, `Poucos fatos editoriais para ${city.name}`);
  }
});

test("perfis municipais não repetem a mesma introdução ou título editorial", () => {
  const profiles = INDEXABLE_REGIONAL_CITIES
    .filter((city) => !isRegionalHomeCity(city))
    .map((city) => ({ city, profile: regionalCityEditorialProfile(city) }));

  const introductions = profiles.map(({ profile }) => profile?.introduction ?? "");
  const sectionTitles = profiles.map(({ profile }) => profile?.sectionTitle ?? "");

  assert.equal(new Set(introductions).size, profiles.length);
  assert.equal(new Set(sectionTitles).size, profiles.length);
});

test("páginas municipais expõem breadcrumb estruturado Home, Região e Município", () => {
  assert.match(regionalPageSource, /createBreadcrumbListJsonLd/);
  assert.match(regionalPageSource, /serializeJsonLd/);
  assert.match(regionalPageSource, /name: "Tempo Pelotas", path: "\/"/);
  assert.match(
    regionalPageSource,
    /name: "Tempo na Região Sul", path: "\/tempo-na-regiao-sul-rs"/,
  );
  assert.match(regionalPageSource, /name: `Tempo em \$\{city\.name\}`, path/);
  assert.match(
    regionalPageSource,
    /dangerouslySetInnerHTML=\{\{ __html: serializeJsonLd\(breadcrumbs\) \}\}/,
  );
});

test("enriquecimento regional continua sem FAQ massificado", () => {
  assert.doesNotMatch(regionalPageSource, /FAQPage|createFaqPageJsonLd|regionalCityFaqs/);
});
