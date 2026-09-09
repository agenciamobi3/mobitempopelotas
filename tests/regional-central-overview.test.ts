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

test("a Central Regional inclui 35 cidades públicas sem antecipar indexação das 11 novas", () => {
  assert.equal(REGIONAL_CITIES.length, 35);
  assert.equal(PUBLIC_REGIONAL_CITIES.length, 35);
  assert.equal(INDEXABLE_REGIONAL_CITIES.length, 24);
  assert.equal(REGIONAL_CITY_GROUPS.length, 4);
  assert.deepEqual(
    REGIONAL_CITY_GROUPS.map((group) => group.name),
    ["Pelotas e entorno", "Costa Doce", "Fronteira Sul", "Campanha"],
  );
});

test("a Central Regional carrega uma visão resumida server-side com cache e fallback de rota", () => {
  assert.match(route, /getRegionalCitiesOverview/);
  assert.match(route, /try\s*\{/);
  assert.match(route, /return await getRegionalCitiesOverview\(\)/);
  assert.match(route, /catch\s*\{/);
  assert.match(route, /return createRegionalFallback\(\)/);
  assert.match(route, /PUBLIC_REGIONAL_CITIES\.map/);
  assert.match(route, /source:\s*\{ name: "Open-Meteo" \}/);
  assert.match(route, /status:\s*"unavailable"/);
  assert.match(route, /staleTime:\s*5 \* 60 \* 1_000/);
  assert.match(overviewFunctions, /Cache-Control/);
  assert.match(overviewFunctions, /CDN-Cache-Control/);
  assert.match(overviewFunctions, /fetchRegionalCitiesOverview/);
});

test("o resumo regional possui fallback persistente para sobreviver a 429 e reinícios", () => {
  assert.match(overviewServer, /fetchRegionalCitiesOverviewEdgeSnapshot/);
  assert.match(overviewServer, /readRegionalCitiesOverviewSnapshot/);
  assert.match(overviewServer, /persistRegionalCitiesOverviewSnapshot/);
  assert.match(overviewServer, /if \(regionalSnapshot\)/);
  assert.match(overviewServer, /HTTP \$\{response\.status\}/);
  assert.match(overviewServer, /rota de contingência do Supabase/);
  assert.match(overviewSnapshotServer, /REGIONAL_EDGE_FUNCTION = "regional-weather-overview"/);
  assert.match(overviewSnapshotServer, /SNAPSHOT_MAX_AGE_MS = 6 \* 60 \* 60 \* 1_000/);
  assert.match(overviewSnapshotServer, /parseRegionalCitiesOverviewSnapshot/);
  assert.match(overviewSnapshotServer, /city\?\.slug !== expectedCity\.slug/);
  assert.match(overviewSnapshotServer, /config\.isPublicConfigured/);
  assert.match(overviewSnapshotServer, /config\.isAdminConfigured/);
  assert.match(overviewSnapshotServer, /overview\.status === "unavailable"/);
  assert.match(overviewSnapshotMigration, /enable row level security/);
  assert.match(overviewSnapshotMigration, /for select/);
  assert.doesNotMatch(overviewSnapshotMigration, /for insert/);
  assert.match(overviewSnapshotReconciliation, /rename column collected_at to fetched_at/);
});

test("rota Edge regional é fixa, cacheada e rejeita snapshots de inventários antigos", () => {
  assert.match(regionalEdge, /const FRESH_SNAPSHOT_MS = 5 \* 60 \* 1_000/);
  assert.match(regionalEdge, /const STALE_SNAPSHOT_MS = 6 \* 60 \* 60 \* 1_000/);
  assert.match(regionalEdge, /const RETENTION_MS = 24 \* 60 \* 60 \* 1_000/);
  assert.match(regionalEdge, /api\.open-meteo\.com\/v1\/forecast/);
  assert.match(regionalEdge, /cell_selection:\s*"land"/);
  assert.match(regionalEdge, /from\(SNAPSHOT_TABLE\)\.insert/);
  assert.match(regionalEdge, /request\.method !== "GET"/);
  assert.match(regionalEdge, /function snapshotMatchesCurrentCities/);
  assert.match(regionalEdge, /root\.items\.length !== CITIES\.length/);
  assert.match(regionalEdge, /latestMatchesCurrentCities/);
  assert.doesNotMatch(regionalEdge, /request\.json\(/);
  assert.doesNotMatch(regionalEdge, /searchParams\.get/);

  for (const city of PUBLIC_REGIONAL_CITIES) {
    assert.ok(
      regionalEdge.includes(`slug: "${city.slug}"`),
      `Edge regional deve conter ${city.slug}`,
    );
    assert.ok(
      regionalEdge.includes(`latitude: ${city.latitude}`),
      `Edge regional deve conter latitude de ${city.slug}`,
    );
    assert.ok(
      regionalEdge.includes(`longitude: ${city.longitude}`),
      `Edge regional deve conter longitude de ${city.slug}`,
    );
  }
});

test("o resumo das cidades públicas usa uma única consulta Open-Meteo em lote", () => {
  assert.match(overviewServer, /api\.open-meteo\.com\/v1\/forecast/);
  assert.match(
    overviewServer,
    /PUBLIC_REGIONAL_CITIES\.map\(\(city\) => city\.latitude\)\.join\(","\)/,
  );
  assert.match(
    overviewServer,
    /PUBLIC_REGIONAL_CITIES\.map\(\(city\) => city\.longitude\)\.join\(","\)/,
  );
  assert.match(
    overviewServer,
    /PUBLIC_REGIONAL_CITIES\.map\(\(\) => TIMEZONE\)\.join\(","\)/,
  );
  assert.match(overviewServer, /forecast_days:\s*"1"/);
  assert.match(overviewServer, /temperature_2m,weather_code,wind_speed_10m/);
  assert.match(
    overviewServer,
    /temperature_2m_min,temperature_2m_max,precipitation_probability_max/,
  );
  assert.equal((overviewServer.match(/await fetch\(/g) ?? []).length, 1);
  assert.doesNotMatch(overviewServer, /Promise\.all/);
  assert.doesNotMatch(overviewServer, /REGIONAL_CITIES\.map/);
});

test("falha do resumo não derruba a navegação municipal", () => {
  assert.match(overviewServer, /status:\s*"unavailable"/);
  assert.match(overviewServer, /As páginas municipais continuam acessíveis/);
  assert.match(route, /PUBLIC_REGIONAL_CITIES\.map/);
  assert.match(route, /Condição em atualização/);
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

test("busca e filtros regionais atualizam mapa e lista com acessibilidade", () => {
  assert.match(directory, /type="search"/);
  assert.match(directory, /aria-controls="regional-city-map regional-city-results"/);
  assert.match(directory, /role="group" aria-label="Filtrar cidades por região"/);
  assert.match(directory, /aria-pressed=\{activeGroup === group\}/);
  assert.match(directory, /normalize\("NFD"\)/);
  assert.match(directory, /const visibleItems = useMemo/);
  assert.match(directory, /<RegionalCitiesMapDeferred items=\{visibleItems\} \/>/);
  assert.match(directory, /Nenhuma cidade encontrada/);
  assert.match(styles, /\.searchField input:focus-visible/);
  assert.match(styles, /\.filters button\[aria-pressed="true"\]/);
  assert.match(styles, /@media \(max-width: 720px\)/);
  assert.match(styles, /@media \(forced-colors: active\)/);
});

test("mapa regional usa o mesmo dataset resumido sem nova consulta meteorológica", () => {
  assert.match(regionalMap, /type RegionalCityOverviewItem/);
  assert.match(regionalMap, /items: RegionalCityOverviewItem\[\]/);
  assert.match(regionalMap, /tiles\.openfreemap\.org\/styles\/liberty/);
  assert.equal((regionalMap.match(/await import\("maplibre-gl"\)/g) ?? []).length, 1);
  assert.match(regionalMap, /regionalCityPath\(item\.city\)/);
  assert.match(regionalMap, /fitMapToItems\(map, items, true\)/);
  assert.match(regionalMap, /Temperaturas: estimativa Open-Meteo · mapa-base: OpenFreeMap/);
  assert.doesNotMatch(regionalMap, /fetch\s*\(/);
  assert.doesNotMatch(regionalMap, /getRegionalCitiesOverview/);
});

test("bundle do mapa é carregado perto da viewport e respeita economia de dados", () => {
  assert.match(deferredMap, /IntersectionObserver/);
  assert.match(deferredMap, /import\("\.\/RegionalCitiesMap"\)/);
  assert.match(deferredMap, /connection\?\.saveData === true/);
  assert.match(deferredMap, /"80px 0px"/);
  assert.match(deferredMap, /"180px 0px"/);
  assert.match(deferredMap, /if \(saveData\) return "0px"/);
  assert.match(deferredMap, /A lista e os dados das cidades têm prioridade/);
  assert.doesNotMatch(directory, /from "\.\/RegionalCitiesMap"/);
  assert.match(deferredMapStyles, /regional-map-deferred__placeholder/);
});

test("falha do MapLibre oferece fallback navegável por teclado e leitor de tela", () => {
  assert.match(regionalMap, /function FallbackCityNavigation/);
  assert.match(regionalMap, /tabIndex=\{-1\}/);
  assert.match(regionalMap, /aria-labelledby="regional-map-fallback-title"/);
  assert.match(regionalMap, /aria-describedby="regional-map-fallback-description"/);
  assert.match(regionalMap, /aria-label=\{markerLabel\(item\)\}/);
  assert.match(regionalMap, /Use esta lista para abrir as mesmas cidades pelo teclado ou leitor de tela/);
  assert.match(regionalMap, /aria-hidden=\{hasError\}/);
  assert.match(regionalMap, /document\.activeElement/);
  assert.match(regionalMap, /mapContainerRef\.current\?\.contains\(activeElement\)/);
  assert.match(regionalMap, /restoreFallbackFocusRef\.current = true/);
  assert.match(regionalMap, /requestAnimationFrame/);
  assert.match(regionalMap, /fallbackNavigationRef\.current\?\.focus\(\{ preventScroll: true \}\)/);
  assert.match(regionalMapStyles, /\.regional-overview-map__marker:focus-visible/);
  assert.match(fallbackMapStyles, /\.regional-overview-map__fallback:focus-visible/);
  assert.match(fallbackMapStyles, /\.regional-overview-map__fallback a:focus-visible/);
  assert.match(fallbackMapStyles, /@media \(max-width: 560px\)/);
  assert.match(fallbackMapStyles, /@media \(forced-colors: active\)/);
});

test("mapa regional continua responsivo e respeita preferências de movimento", () => {
  assert.match(regionalMapStyles, /\.regional-overview-map__frame/);
  assert.match(regionalMapStyles, /\.regional-overview-map__marker/);
  assert.match(regionalMapStyles, /@media \(max-width: 760px\)/);
  assert.match(regionalMapStyles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(regionalMapStyles, /@media \(forced-colors: active\)/);
});

test("acentos visuais da Central usam hooks estáveis e não posição de seção", () => {
  assert.match(directory, /regional-cities-hero/);
  assert.match(directory, /regional-cities-controls/);
  assert.match(directory, /regional-cities-groups/);
  assert.match(directory, /regional-cities-method/);
  assert.match(accents, /\.regional-cities-groups > article:nth-child\(4\)/);
  assert.doesNotMatch(accents, /> section:nth-child/);
});
