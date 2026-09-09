import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  COSTA_DOCE_CITIES,
  costaDoceCoverage,
  costaDoceWeatherPath,
} from "../src/lib/hydrology/costa-doce-cities.ts";

const page = readFileSync("src/components/hydrology/LagoonHydrologyLocalityPage.tsx", "utf8");
const route = readFileSync("src/routes/nivel-da-lagoa-dos-patos/index.tsx", "utf8");

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

const WEATHER_CITIES = [
  "Arroio do Padre",
  "Arroio Grande",
  "Canguçu",
  "Chuí",
  "Cristal",
  "Jaguarão",
  "Morro Redondo",
  "Pelotas",
  "Piratini",
  "Rio Grande",
  "Santa Vitória do Palmar",
  "São José do Norte",
  "São Lourenço do Sul",
  "Turuçu",
];

const WEATHER_MISSING_WITHOUT_LEVEL = [
  "Barra do Ribeiro",
  "Camaquã",
  "Cerro Grande do Sul",
  "Dom Feliciano",
  "Guaíba",
  "Mariana Pimentel",
  "Mostardas",
  "Sertão Santana",
  "Tapes",
  "Tavares",
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

test("cobertura meteorológica usa somente páginas regionais já publicadas", () => {
  const coverage = costaDoceCoverage();
  assert.deepEqual(coverage.withWeather.map((city) => city.name), WEATHER_CITIES);
  assert.equal(coverage.withWeather.length, 14);
  assert.equal(costaDoceWeatherPath(COSTA_DOCE_CITIES.find((city) => city.name === "Pelotas")!), "/tempo-hoje-pelotas");
});

test("dez cidades sem nível ainda precisam de página meteorológica dedicada", () => {
  const coverage = costaDoceCoverage();
  const missing = coverage.weatherMissing
    .filter((city) => city.lagoonLevelPath === null)
    .map((city) => city.name);
  assert.deepEqual(missing, WEATHER_MISSING_WITHOUT_LEVEL);
});

test("índice da Lagoa explica cobertura sem afirmar inexistência de estação", () => {
  assert.match(page, /Costa Doce do Rio Grande do Sul/);
  assert.match(page, /Sem medição integrada/);
  assert.match(page, /Isso não afirma que não existam estações de outros órgãos, rios ou canais/);
  assert.match(page, /Ver nível/);
  assert.match(page, /Ver previsão/);
  assert.match(route, /Costa Doce do RS/);
});
