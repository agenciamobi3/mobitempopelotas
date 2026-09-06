import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  INDEXABLE_REGIONAL_CITIES,
  PUBLIC_REGIONAL_CITIES,
  REGIONAL_CITIES,
  REGIONAL_CITY_GROUPS,
} from "../src/lib/regional-cities.ts";

const route = readFileSync("src/routes/tempo-na-regiao-sul-rs.tsx", "utf8");
const directory = readFileSync("src/components/regional/RegionalCitiesDirectory.tsx", "utf8");
const styles = readFileSync("src/components/regional/RegionalCitiesDirectory.module.css", "utf8");
const accents = readFileSync("src/components/regional/RegionalCitiesAccentContract.css", "utf8");
const regionalMap = readFileSync("src/components/regional/RegionalCitiesMap.tsx", "utf8");
const regionalMapStyles = readFileSync("src/components/regional/RegionalCitiesMap.css", "utf8");
const deferredMap = readFileSync("src/components/regional/RegionalCitiesMapDeferred.tsx", "utf8");
const deferredMapStyles = readFileSync(
  "src/components/regional/RegionalCitiesMapDeferred.css",
  "utf8",
);
const fallbackMapStyles = readFileSync(
  "src/components/regional/RegionalCitiesMapFallback.css",
  "utf8",
);
const overviewServer = readFileSync(
  "src/lib/weather/regional-cities-overview.server.ts",
  "utf8",
);
const overviewSnapshotServer = readFileSync(
  "src/lib/weather/regional-cities-overview-snapshot.server.ts",
  "utf8",
);
const regionalEdge = readFileSync(
  "supabase/functions/regional-weather-overview/index.ts",
  "utf8",
);
const overviewFunctions = readFileSync(
  "src/lib/weather/regional-cities-overview.functions.ts",
  "utf8",
);
const overviewSnapshotMigration = readFileSync(
  "supabase/migrations/20260823193000_create_regional_weather_snapshots.sql",
  "utf8",
);
const overviewSnapshotReconciliation = readFileSync(
  "supabase/migrations/20260824011500_reconcile_regional_weather_snapshots_schema.sql",
  "utf8",
);

function hasStandaloneRegionalCitiesMap(source: string) {
  return /(^|[^A-Z_])REGIONAL_CITIES\.map/.test(source);
}

test("a Central Regional permanece limitada às 24 cidades aprovadas nesta etapa", () => {
  assert.equal(REGIONAL_CITIES.length, 24);
  assert.equal(PUBLIC_REGIONAL_CITIES.length, 24);
  assert.equal(INDEXABLE_REGIONAL_CITIES.length, 24);
  assert.equal(REGIONAL_CITY_GROUPS.length, 4);
  assert.deepEqual(
    REGIONAL_CITY_GROUPS.map((group) => group.name),
    ["Pelotas e entorno", "Costa Doce", "Fronteira Sul", "Campanha"],
  );
});

test("a Central Regional carrega resumo server-side com cache e fallback navegável", () => {
  assert.match(route, /getRegionalCitiesOverview/);
  assert.match(route, /return await getRegionalCitiesOverview\(\)/);
  assert.match(route, /return createRegionalFallback\(\)/);
  assert.match(route, /PUBLIC_REGIONAL_CITIES\.map/);
  assert.match(route, /status:\s*"unavailable"/);
  assert.match(route, /staleTime:\s*5 \* 60 \* 1_000/);
  assert.match(overviewFunctions, /Cache-Control/);
  assert.match(overviewFunctions, /CDN-Cache-Control/);
});

test("o resumo regional possui fallback persistente para sobreviver a 429 e reinícios", () => {
  assert.match(overviewServer, /fetchRegionalCitiesOverviewEdgeSnapshot/);
  assert.match(overviewServer, /readRegionalCitiesOverviewSnapshot/);
  assert.match(overviewServer, /persistRegionalCitiesOverviewSnapshot/);
  assert.match(overviewSnapshotServer, /REGIONAL_EDGE_FUNCTION = "regional-weather-overview"/);
  assert.match(overviewSnapshotServer, /SNAPSHOT_MAX_AGE_MS = 6 \* 60 \* 60 \* 1_000/);
  assert.match(overviewSnapshotServer, /parseRegionalCitiesOverviewSnapshot/);
  assert.match(overviewSnapshotMigration, /enable row level security/);
  assert.match(overviewSnapshotMigration, /for select/);
  assert.doesNotMatch(overviewSnapshotMigration, /for insert/);
  assert.match(overviewSnapshotReconciliation, /rename column collected_at to fetched_at/);
});

test("rota Edge regional é fixa, cacheada e não funciona como proxy arbitrário", () => {
  assert.match(regionalEdge, /const FRESH_SNAPSHOT_MS = 5 \* 60 \* 1_000/);
  assert.match(regionalEdge, /const STALE_SNAPSHOT_MS = 6 \* 60 \* 60 \* 1_000/);
  assert.match(regionalEdge, /api\.open-meteo\.com\/v1\/forecast/);
  assert.match(regionalEdge, /cell_selection:\s*"land"/);
  assert.match(regionalEdge, /request\.method !== "GET"/);
  assert.doesNotMatch(regionalEdge, /request\.json\(/);
  assert.doesNotMatch(regionalEdge, /searchParams\.get/);

  for (const city of PUBLIC_REGIONAL_CITIES) {
    assert.ok(regionalEdge.includes(`slug: "${city.slug}"`));
    assert.ok(regionalEdge.includes(`latitude: ${city.latitude}`));
    assert.ok(regionalEdge.includes(`longitude: ${city.longitude}`));
  }
});

test("o resumo das cidades públicas usa uma única consulta Open-Meteo em lote", () => {
  assert.match(overviewServer, /PUBLIC_REGIONAL_CITIES\.map\(\(city\) => city\.latitude\)\.join\(","\)/);
  assert.match(overviewServer, /PUBLIC_REGIONAL_CITIES\.map\(\(city\) => city\.longitude\)\.join\(","\)/);
  assert.match(overviewServer, /forecast_days:\s*"1"/);
  assert.equal((overviewServer.match(/await fetch\(/g) ?? []).length, 1);
  assert.equal(hasStandaloneRegionalCitiesMap(overviewServer), false);
});

test("a Central diferencia estimativa de modelo de observação e mantém navegação municipal", () => {
  assert.match(directory, /Estimativa agora/);
  assert.match(directory, /Estimativa parcial/);
  assert.match(directory, /estimativa de modelo do Open-Meteo, não observação de\s+estação/);
  assert.match(directory, /Alertas oficiais permanecem nas páginas municipais/);
  assert.match(directory, /regionalCityPath\(city\)/);
  assert.doesNotMatch(directory, /observação atual/iu);
});

test("busca e filtros atualizam o mesmo dataset usado pelo mapa e pela lista", () => {
  assert.match(directory, /type="search"/);
  assert.match(directory, /aria-controls="regional-city-map regional-city-results"/);
  assert.match(directory, /aria-pressed=\{activeGroup === group\}/);
  assert.match(directory, /const visibleItems = useMemo/);
  assert.match(directory, /<RegionalCitiesMapDeferred items=\{visibleItems\} \/>/);
  assert.match(styles, /\.searchField input:focus-visible/);
  assert.match(styles, /@media \(forced-colors: active\)/);
});

test("mapa regional tipa o mesmo resumo e não faz nova consulta meteorológica", () => {
  assert.match(regionalMap, /import type \{ RegionalCityOverviewItem \}/);
  assert.match(regionalMap, /items:\s*RegionalCityOverviewItem\[\]/);
  assert.match(regionalMap, /tiles\.openfreemap\.org\/styles\/liberty/);
  assert.match(regionalMap, /await import\("maplibre-gl"\)/);
  assert.match(regionalMap, /regionalCityPath\(item\.city\)/);
  assert.match(regionalMap, /fitMapToItems\(map, items, true\)/);
  assert.doesNotMatch(regionalMap, /fetch\s*\(/);
  assert.doesNotMatch(regionalMap, /getRegionalCitiesOverview/);
});

test("MapLibre só é montado perto da viewport e respeita economia de dados", () => {
  assert.match(deferredMap, /IntersectionObserver/);
  assert.match(deferredMap, /connection\?\.saveData === true/);
  assert.match(deferredMap, /"80px 0px"/);
  assert.match(deferredMap, /"180px 0px"/);
  assert.match(deferredMap, /if \(saveData\) return "0px"/);
  assert.match(deferredMap, /shouldRenderMap \? \(/);
  assert.match(deferredMap, /<RegionalCitiesMap items=\{items\} \/>/);
  assert.match(regionalMap, /await import\("maplibre-gl"\)/);
  assert.match(deferredMapStyles, /regional-map-deferred__placeholder/);
});

test("falha do MapLibre oferece fallback navegável por teclado e leitor de tela", () => {
  assert.match(regionalMap, /function FallbackCityNavigation/);
  assert.match(regionalMap, /tabIndex=\{-1\}/);
  assert.match(regionalMap, /aria-labelledby="regional-map-fallback-title"/);
  assert.match(regionalMap, /requestAnimationFrame/);
  assert.match(regionalMapStyles, /\.regional-overview-map__marker:focus-visible/);
  assert.match(fallbackMapStyles, /\.regional-overview-map__fallback:focus-visible/);
  assert.match(fallbackMapStyles, /@media \(forced-colors: active\)/);
});

test("acentos visuais usam hooks estáveis e não posição genérica de seção", () => {
  assert.match(directory, /regional-cities-hero/);
  assert.match(directory, /regional-cities-controls/);
  assert.match(directory, /regional-cities-groups/);
  assert.match(directory, /regional-cities-method/);
  assert.match(accents, /\.regional-cities-groups > article:nth-child\(4\)/);
  assert.doesNotMatch(accents, /> section:nth-child/);
});
