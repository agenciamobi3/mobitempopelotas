import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  INDEXABLE_REGIONAL_CITIES,
  PUBLIC_REGIONAL_CITIES,
  REGIONAL_CITIES,
  isRegionalCityIndexable,
  isRegionalCityPublic,
  regionalCityCoverage,
  type RegionalCity,
} from "../src/lib/regional-cities.ts";

const publicRoutesSource = readFileSync("src/lib/public-routes.ts", "utf8");
const overviewSource = readFileSync(
  "src/lib/weather/regional-cities-overview.server.ts",
  "utf8",
);
const regionalWeatherFnSource = readFileSync(
  "src/lib/weather/regional-city-weather.functions.ts",
  "utf8",
);
const regionalRouteSource = readFileSync("src/routes/tempo-em/$citySlug.tsx", "utf8");
const pageMetaSource = readFileSync("src/lib/page-meta.ts", "utf8");

const baseCity = REGIONAL_CITIES[0]!;

function candidate(
  slug: string,
  overrides: Partial<Pick<RegionalCity, "coverage" | "indexable">>,
): RegionalCity {
  return { ...baseCity, slug, name: `Teste ${slug}`, ...overrides };
}

test("inventário regional publica e indexa as 35 cidades aprovadas", () => {
  const complete = REGIONAL_CITIES.filter((city) => regionalCityCoverage(city) === "complete");
  const basic = REGIONAL_CITIES.filter((city) => regionalCityCoverage(city) === "basic");

  assert.equal(REGIONAL_CITIES.length, 35);
  assert.equal(PUBLIC_REGIONAL_CITIES.length, 35);
  assert.equal(INDEXABLE_REGIONAL_CITIES.length, 35);
  assert.equal(complete.length, 35);
  assert.equal(basic.length, 0);

  for (const city of complete) {
    assert.equal(isRegionalCityPublic(city), true);
    assert.equal(isRegionalCityIndexable(city), true);
  }
});

test("draft fica fora da superfície pública e da indexação", () => {
  const city = candidate("cidade-draft-rs", { coverage: "draft" });
  assert.equal(isRegionalCityPublic(city), false);
  assert.equal(isRegionalCityIndexable(city), false);
});

test("basic pode ser público sem ser indexável", () => {
  const city = candidate("cidade-basic-rs", { coverage: "basic" });
  assert.equal(isRegionalCityPublic(city), true);
  assert.equal(isRegionalCityIndexable(city), false);
});

test("complete pode ser retirado explicitamente da indexação", () => {
  const city = candidate("cidade-complete-noindex-rs", {
    coverage: "complete",
    indexable: false,
  });
  assert.equal(isRegionalCityPublic(city), true);
  assert.equal(isRegionalCityIndexable(city), false);
});

test("somente cidades indexáveis alimentam sitemap e rotas públicas SEO", () => {
  assert.match(publicRoutesSource, /INDEXABLE_REGIONAL_CITIES/);
  assert.doesNotMatch(
    publicRoutesSource,
    /\.\.\.REGIONAL_CITIES\.filter\(\(city\) => city\.slug !== "pelotas-rs"\)/,
  );
});

test("Central Regional consulta apenas cidades públicas", () => {
  assert.match(overviewSource, /PUBLIC_REGIONAL_CITIES/);
  assert.match(overviewSource, /PUBLIC_REGIONAL_CITIES\.map\(\(city\) => city\.latitude\)/);
  assert.match(overviewSource, /PUBLIC_REGIONAL_CITIES\.map\(\(city\) => city\.longitude\)/);
  assert.doesNotMatch(overviewSource, /REGIONAL_CITIES\.map/);
});

test("draft não passa pela rota nem pelo server function regional", () => {
  assert.match(regionalRouteSource, /findPublicRegionalCity\(params\.citySlug\)/);
  assert.match(regionalRouteSource, /throw notFound\(\)/);
  assert.match(regionalWeatherFnSource, /findPublicRegionalCity\(data\.slug\)/);
  assert.match(regionalWeatherFnSource, /Cache-Control/);
  assert.match(regionalWeatherFnSource, /private, no-store, max-age=0/);
});

test("cidade basic recebe noindex enquanto complete mantém indexação padrão", () => {
  assert.match(regionalRouteSource, /indexable: isRegionalCityIndexable\(city\)/);
  assert.match(pageMetaSource, /indexable\?: boolean/);
  assert.match(pageMetaSource, /options\.indexable === false/);
  assert.match(pageMetaSource, /noindex, follow/);
  assert.match(pageMetaSource, /index, follow/);
});
