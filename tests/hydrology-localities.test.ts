import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  HYDROLOGY_LOCALITIES,
  findHydrologyLocality,
  findHydrologyLocalityByStationId,
  hydrologyLocalityPath,
} from "../src/lib/hydrology/hydrology-localities.ts";
import { PUBLIC_ROUTES } from "../src/lib/public-routes.ts";

const expected = [
  ["rio-grande", "furg-ccmar"],
  ["sao-lourenco-do-sul", "sao-lourenco-do-sul"],
  ["arambare", "arambare"],
  ["sao-jose-do-norte", "sao-jose-do-norte"],
  ["itapua-viamao", "itapua"],
] as const;

test("registry hidrológico publica exatamente as cinco localidades verificadas da rede", () => {
  assert.equal(HYDROLOGY_LOCALITIES.length, expected.length);
  assert.deepEqual(
    HYDROLOGY_LOCALITIES.map((locality) => [locality.slug, locality.stationId]),
    expected,
  );
});

test("cada localidade possui lookup bidirecional e path canônico", () => {
  for (const locality of HYDROLOGY_LOCALITIES) {
    assert.equal(findHydrologyLocality(locality.slug)?.stationId, locality.stationId);
    assert.equal(findHydrologyLocalityByStationId(locality.stationId)?.slug, locality.slug);
    assert.equal(hydrologyLocalityPath(locality), `/nivel-da-lagoa-dos-patos/${locality.slug}`);
  }
  assert.equal(findHydrologyLocality("cidade-inventada"), null);
  assert.equal(findHydrologyLocalityByStationId("sensor-inventado"), null);
});

test("hub e páginas locais estão no inventário público indexável", () => {
  const paths = new Set(PUBLIC_ROUTES.map((route) => route.path));
  assert.ok(paths.has("/nivel-da-lagoa-dos-patos"));
  for (const locality of HYDROLOGY_LOCALITIES) assert.ok(paths.has(hydrologyLocalityPath(locality)));
});

test("rota dinâmica valida slug pelo registry e páginas preservam referências locais", () => {
  const route = readFileSync("src/routes/nivel-da-lagoa-dos-patos/$localitySlug.tsx", "utf8");
  const page = readFileSync("src/components/hydrology/LagoonHydrologyLocalityPage.tsx", "utf8");
  assert.match(route, /findHydrologyLocality\(params\.localitySlug\)/);
  assert.match(route, /throw notFound\(\)/);
  assert.match(page, /não converte uma leitura na outra/);
  assert.match(page, /não soma, subtrai ou converte automaticamente/);
});

test("cidades meteorológicas verificadas recebem associação de águas", () => {
  assert.deepEqual(
    HYDROLOGY_LOCALITIES.filter((locality) => locality.weatherCitySlug).map((locality) => locality.weatherCitySlug),
    ["rio-grande-rs", "sao-lourenco-do-sul-rs", "arambare-rs", "sao-jose-do-norte-rs"],
  );
});

test("cards regionais encaminham apenas estações verificadas e preservam destinos gerais", () => {
  const regional = readFileSync("src/components/hydrology/RegionalWaterNetwork.tsx", "utf8");
  assert.match(regional, /findHydrologyLocalityByStationId\(observation\.station\.id\)/);
  assert.match(regional, /const localPath = locality \? hydrologyLocalityPath\(locality\) : null/);
  assert.match(regional, /localPath \? \(/);
  assert.match(regional, /href=\{localPath\}/);
  assert.match(regional, /to="\/nivel-do-guaiba"/);
  assert.match(regional, /Ver nível e histórico do Guaíba/);
  assert.match(regional, /to="\/nivel-da-lagoa-dos-patos"/);
  assert.match(regional, /Ver panorama da Lagoa/);
});

test("menu Águas e exploração da Home descobrem o panorama da Lagoa", () => {
  const header = readFileSync("src/production/components/home-editorial-header.tsx", "utf8");
  const explore = readFileSync("src/components/weather/HomeExplorePortal.tsx", "utf8");
  assert.match(header, /label: "Nível da Lagoa dos Patos"/);
  assert.match(header, /to: "\/nivel-da-lagoa-dos-patos"/);
  assert.match(header, /Panorama dos cinco pontos locais monitorados/);
  assert.match(explore, /label: "Nível da Lagoa dos Patos"/);
  assert.match(explore, /to: "\/nivel-da-lagoa-dos-patos"/);
});

test("páginas meteorológicas preservam intenção de tempo e carregam águas de forma independente", () => {
  const weatherPage = readFileSync("src/components/regional/RegionalCityWeatherPage.tsx", "utf8");
  const hydrologyModule = readFileSync("src/components/regional/RegionalCityHydrologyLink.tsx", "utf8");
  const editorial = readFileSync("src/lib/regional-city-editorial.ts", "utf8");
  assert.match(weatherPage, /findHydrologyLocalityByWeatherCitySlug\(city\.slug\)/);
  assert.match(weatherPage, /<RegionalCityHydrologyLink citySlug=\{city\.slug\}/);
  assert.match(editorial, /return `Tempo em \$\{city\.name\} hoje: previsão, chuva e vento`/);
  assert.match(hydrologyModule, /useEffect\(\(\) =>/);
  assert.match(hydrologyModule, /getLagoonMonitoringNetwork\(\)/);
  assert.match(hydrologyModule, /Consultando a leitura hidrológica sem bloquear a previsão meteorológica/);
});
