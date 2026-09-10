import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const editorialHero = readFileSync("src/components/hydrology/HydrologyEditorialHero.tsx", "utf8");
const hydrologyPages = readFileSync("src/components/hydrology/HydrologyPages.tsx", "utf8");
const overview = readFileSync("src/components/hydrology/HydrologyOverviewV2.tsx", "utf8");
const guaibaPage = readFileSync("src/components/hydrology/GuaibaLevelPage.tsx", "utf8");
const regionalNetwork = readFileSync("src/components/hydrology/RegionalWaterNetwork.tsx", "utf8");
const localMonitoring = readFileSync("src/components/weather/HomeLocalMonitoring.tsx", "utf8");
const regionalCity = readFileSync("src/components/regional/RegionalCityHydrologyLink.tsx", "utf8");
const homeWater = readFileSync("src/production/components/home-water-editorial.tsx", "utf8");
const defesaCivilPage = readFileSync(
  "src/components/hydrology/DefesaCivilStationHydrologyPage.tsx",
  "utf8",
);
const defesaCivilRegional = readFileSync(
  "src/components/regional/RegionalCityDefesaCivil.tsx",
  "utf8",
);
const guaibaServer = readFileSync("src/lib/hydrology/guaiba.server.ts", "utf8");
const laranjalServer = readFileSync("src/lib/hydrology/laranjal-level.server.ts", "utf8");
const lagoonServer = readFileSync("src/lib/hydrology/lagoon-network.server.ts", "utf8");

const seriesDerivedSurfaces = [
  ["hero editorial do Laranjal", editorialHero],
  ["página detalhada do Laranjal", hydrologyPages],
  ["visão integrada de hidrologia", overview],
  ["página do Guaíba", guaibaPage],
  ["rede regional", regionalNetwork],
  ["monitoramento local", localMonitoring],
  ["bloco hidrológico das páginas regionais", regionalCity],
  ["águas da Home", homeWater],
] as const;

test("superfícies com série usam o contrato compartilhado de movimento recente", () => {
  for (const [name, source] of seriesDerivedSurfaces) {
    assert.match(
      source,
      /deriveRecentHydrologySeriesMovement/,
      `${name} deve derivar movimento a partir da série contínua`,
    );
  }

  assert.match(editorialHero, /deriveRecentHydrologySeriesMovement\(level\.series, "m"\)/);
  assert.match(hydrologyPages, /deriveRecentHydrologySeriesMovement\(level\.series, "m"\)/);
  assert.match(overview, /deriveRecentHydrologySeriesMovement\(level\.series, "m"\)/);
  assert.match(guaibaPage, /deriveRecentHydrologySeriesMovement\(data\.series, "m"\)/);
  assert.match(localMonitoring, /deriveRecentHydrologySeriesMovement\(laranjal\.series, "m"\)/);
  assert.match(regionalNetwork, /observation\.series\.map/);
  assert.match(regionalCity, /observation\.series\.map/);
  assert.match(homeWater, /station\.series\.map/);
});

test("superfícies ativas não apresentam trendCmPerHour como relógio visual concorrente", () => {
  assert.doesNotMatch(editorialHero, /level\.trendCmPerHour/);
  assert.doesNotMatch(hydrologyPages, /level\.trendCmPerHour/);
  assert.doesNotMatch(overview, /level\.trendCmPerHour/);
  assert.doesNotMatch(guaibaPage, /data\.trendCmPerHour|reference\.trendCmPerHour/);
  assert.doesNotMatch(regionalNetwork, /data\.trendCmPerHour|observation\.trendCmPerHour/);
  assert.doesNotMatch(localMonitoring, /laranjal\.trendCmPerHour/);
  assert.doesNotMatch(regionalCity, /observation!?\.trendCmPerHour/);
  assert.doesNotMatch(homeWater, /trendLabel\([^)]*trendCmPerHour/);
  assert.doesNotMatch(homeWater, /movementLabel\([^)]*trendCmPerHour/);
});

test("cards do Guaíba sem série própria mostram janela explícita em vez de tendência derivada incompatível", () => {
  assert.match(guaibaPage, /Variação 24 h/);
  assert.match(guaibaPage, /movimento recente é mostrado apenas quando existe uma série contínua/);
  assert.match(homeWater, /Variação em 24 h: \{variation\}/);
  assert.match(homeWater, /mostramos a variação explícita de 24 h em vez de uma segunda tendência/);
});

test("tendência textual publicada pela Defesa Civil continua identificada como informação da fonte", () => {
  assert.match(defesaCivilPage, /station\.river\.trend/);
  assert.match(defesaCivilPage, /Tendência da fonte:/);
  assert.match(defesaCivilRegional, /station\.river\.trend/);
  assert.match(defesaCivilRegional, /Tendência informada pela fonte:/);
  assert.doesNotMatch(defesaCivilPage, /deriveRecentHydrologySeriesMovement/);
  assert.doesNotMatch(defesaCivilRegional, /deriveRecentHydrologySeriesMovement/);
});

test("camada de dados mantém trendCmPerHour apenas como campo derivado/backward-compatible", () => {
  assert.match(laranjalServer, /trendCmPerHour:/);
  assert.match(lagoonServer, /trendCmPerHour:/);
  assert.match(guaibaServer, /trendCmPerHour:/);
  assert.match(guaibaServer, /calculateRate/);
  assert.match(laranjalServer, /O cálculo de tendência é reutilizado por fontes distintas/);
});
