import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { REGIONAL_CITIES, REGIONAL_CITY_GROUPS } from "../src/lib/regional-cities.ts";

const route = readFileSync("src/routes/tempo-na-regiao-sul-rs.tsx", "utf8");
const directory = readFileSync("src/components/regional/RegionalCitiesDirectory.tsx", "utf8");
const styles = readFileSync("src/components/regional/RegionalCitiesDirectory.module.css", "utf8");
const accents = readFileSync("src/components/regional/RegionalCitiesAccentContract.css", "utf8");
const overviewServer = readFileSync(
  "src/lib/weather/regional-cities-overview.server.ts",
  "utf8",
);
const overviewFunctions = readFileSync(
  "src/lib/weather/regional-cities-overview.functions.ts",
  "utf8",
);

test("a Central Regional permanece limitada às 24 cidades aprovadas nesta etapa", () => {
  assert.equal(REGIONAL_CITIES.length, 24);
  assert.equal(REGIONAL_CITY_GROUPS.length, 4);
  assert.deepEqual(
    REGIONAL_CITY_GROUPS.map((group) => group.name),
    ["Pelotas e entorno", "Costa Doce", "Fronteira Sul", "Campanha"],
  );
});

test("a Central Regional carrega uma visão resumida server-side com cache", () => {
  assert.match(route, /getRegionalCitiesOverview/);
  assert.match(route, /loader:\s*async \(\) => getRegionalCitiesOverview\(\)/);
  assert.match(route, /staleTime:\s*5 \* 60 \* 1_000/);
  assert.match(overviewFunctions, /Cache-Control/);
  assert.match(overviewFunctions, /CDN-Cache-Control/);
  assert.match(overviewFunctions, /fetchRegionalCitiesOverview/);
});

test("o resumo das 24 cidades usa uma única consulta Open-Meteo em lote", () => {
  assert.match(overviewServer, /api\.open-meteo\.com\/v1\/forecast/);
  assert.match(overviewServer, /REGIONAL_CITIES\.map\(\(city\) => city\.latitude\)\.join\(","\)/);
  assert.match(overviewServer, /REGIONAL_CITIES\.map\(\(city\) => city\.longitude\)\.join\(","\)/);
  assert.match(overviewServer, /REGIONAL_CITIES\.map\(\(\) => TIMEZONE\)\.join\(","\)/);
  assert.match(overviewServer, /forecast_days:\s*"1"/);
  assert.match(overviewServer, /temperature_2m,weather_code,wind_speed_10m/);
  assert.match(
    overviewServer,
    /temperature_2m_min,temperature_2m_max,precipitation_probability_max/,
  );
  assert.equal((overviewServer.match(/await fetch\(/g) ?? []).length, 1);
  assert.doesNotMatch(overviewServer, /Promise\.all/);
});

test("falha do resumo não derruba a navegação municipal", () => {
  assert.match(overviewServer, /status:\s*"unavailable"/);
  assert.match(overviewServer, /As páginas municipais continuam acessíveis/);
  assert.match(directory, /data\.message/);
  assert.match(directory, /regionalCityPath\(city\)/);
});

test("a Central diferencia estimativa de modelo de observação", () => {
  assert.match(directory, /Estimativa agora/);
  assert.match(directory, /Estimativa parcial/);
  assert.match(directory, /estimativa de modelo do Open-Meteo, não observação de estação/);
  assert.match(directory, /Alertas oficiais permanecem nas páginas municipais/);
  assert.doesNotMatch(directory, /observação atual/iu);
});

test("busca e filtros regionais são navegáveis e acessíveis", () => {
  assert.match(directory, /type="search"/);
  assert.match(directory, /aria-controls="regional-city-results"/);
  assert.match(directory, /role="group" aria-label="Filtrar cidades por região"/);
  assert.match(directory, /aria-pressed=\{activeGroup === group\}/);
  assert.match(directory, /normalize\("NFD"\)/);
  assert.match(directory, /Nenhuma cidade encontrada/);
  assert.match(styles, /\.searchField input:focus-visible/);
  assert.match(styles, /\.filters button\[aria-pressed="true"\]/);
  assert.match(styles, /@media \(max-width: 720px\)/);
  assert.match(styles, /@media \(forced-colors: active\)/);
});

test("acentos visuais da Central usam hooks estáveis e não posição de seção", () => {
  assert.match(directory, /regional-cities-hero/);
  assert.match(directory, /regional-cities-controls/);
  assert.match(directory, /regional-cities-groups/);
  assert.match(directory, /regional-cities-method/);
  assert.match(accents, /\.regional-cities-groups > article:nth-child\(4\)/);
  assert.doesNotMatch(accents, /> section:nth-child/);
});
