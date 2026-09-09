import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  COSTA_DOCE_CITIES,
  costaDoceCoverage,
  costaDoceWeatherPath,
} from "../src/lib/hydrology/costa-doce-cities.ts";
import {
  findRegionalCity,
  isRegionalCityIndexable,
  regionalCityCoverage,
} from "../src/lib/regional-cities.ts";

const page = readFileSync("src/components/hydrology/LagoonHydrologyLocalityPage.tsx", "utf8");
const route = readFileSync("src/routes/nivel-da-lagoa-dos-patos/index.tsx", "utf8");
const editorial = readFileSync("src/lib/regional-city-editorial-costa-doce.ts", "utf8");

const EXPECTED_CITIES = [
  "Arambaré",
  "Arroio do Padre",
  "Arroio Grande",
  "Barra do Ribeiro",
  "Camaquã",
  "Canguçu",
  "Cerro Grande do Sul",
  "Chuí",
  "Cristal",
  "Dom Feliciano",
  "Guaíba",
  "Jaguarão",
  "Mariana Pimentel",
  "Morro Redondo",
  "Mostardas",
  "Pelotas",
  "Piratini",
  "Rio Grande",
  "Santa Vitória do Palmar",
  "São José do Norte",
  "São Lourenço do Sul",
  "Sertão Santana",
  "Tapes",
  "Tavares",
  "Turuçu",
];

const LEVEL_CITIES = [
  "Arambaré",
  "Pelotas",
  "Rio Grande",
  "São José do Norte",
  "São Lourenço do Sul",
];

const NEW_BASIC_WEATHER_SLUGS = [
  "arambare-rs",
  "barra-do-ribeiro-rs",
  "camaqua-rs",
  "cerro-grande-do-sul-rs",
  "dom-feliciano-rs",
  "guaiba-rs",
  "mariana-pimentel-rs",
  "mostardas-rs",
  "sertao-santana-rs",
  "tapes-rs",
  "tavares-rs",
];

test("Costa Doce mantém as 25 cidades do recorte regional", () => {
  assert.equal(COSTA_DOCE_CITIES.length, 25);
  assert.deepEqual(COSTA_DOCE_CITIES.map((city) => city.name), EXPECTED_CITIES);
});

test("somente medições de nível já integradas recebem link hidrológico", () => {
  const coverage = costaDoceCoverage();
  assert.deepEqual(coverage.withLagoonLevel.map((city) => city.name), LEVEL_CITIES);
  assert.equal(coverage.withLagoonLevel.length, 5);
});

test("todas as 25 cidades da Costa Doce possuem destino meteorológico", () => {
  const coverage = costaDoceCoverage();
  assert.deepEqual(coverage.withWeather.map((city) => city.name), EXPECTED_CITIES);
  assert.equal(coverage.withWeather.length, 25);
  assert.equal(coverage.weatherMissing.length, 0);
  assert.equal(
    costaDoceWeatherPath(COSTA_DOCE_CITIES.find((city) => city.name === "Pelotas")!),
    "/tempo-hoje-pelotas",
  );
});

test("as 11 novas páginas permanecem basic e noindex até o gate completo", () => {
  for (const slug of NEW_BASIC_WEATHER_SLUGS) {
    const city = findRegionalCity(slug);
    assert.ok(city, `${slug} deve estar no inventário regional`);
    assert.equal(regionalCityCoverage(city), "basic");
    assert.equal(isRegionalCityIndexable(city), false);
    assert.match(editorial, new RegExp(`"${slug}"`));
  }
});

test("índice da Lagoa explica cobertura sem afirmar inexistência de estação", () => {
  assert.match(page, /Costa Doce do Rio Grande do Sul/);
  assert.match(page, /Sem medição integrada/);
  assert.match(page, /Isso não afirma que não existam estações de outros órgãos, rios ou canais/);
  assert.match(page, /Ver nível/);
  assert.match(page, /Ver previsão/);
  assert.match(route, /Costa Doce do RS/);
});
