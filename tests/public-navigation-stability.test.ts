import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const minuteRefresh = readFileSync("src/components/weather/WeatherMinuteRefresh.tsx", "utf8");
const publicWeatherLoader = readFileSync("src/lib/weather/public-weather-page-loader.ts", "utf8");
const publicHydrologyLoader = readFileSync(
  "src/lib/hydrology/public-hydrology-page-loader.ts",
  "utf8",
);
const radarLoader = readFileSync("src/lib/redemet/radar-page-loader.ts", "utf8");
const extendedLoader = readFileSync(
  "src/lib/weather/extended-forecast-page-loader.ts",
  "utf8",
);
const homeRoute = readFileSync("src/routes/index.tsx", "utf8");
const todayRoute = readFileSync("src/routes/tempo-hoje-pelotas.tsx", "utf8");
const tomorrowRoute = readFileSync("src/routes/tempo-amanha-pelotas.tsx", "utf8");
const sevenDayRoute = readFileSync("src/routes/previsao-7-dias-pelotas.tsx", "utf8");
const rootRoute = readFileSync("src/routes/__root.tsx", "utf8");
const runtimeVersionRoute = readFileSync("src/routes/api/runtime-version.ts", "utf8");
const staleClientRecovery = readFileSync("src/lib/stale-client-recovery.ts", "utf8");
const browserRecovery = readFileSync(
  "src/production/lib/weather-intelligence-browser-recovery.ts",
  "utf8",
);
const internalWeatherShell = readFileSync(
  "src/components/layout/InternalWeatherPageShell.tsx",
  "utf8",
);
const navigationGuard = readFileSync(
  "src/components/navigation/PublicDocumentNavigationGuard.tsx",
  "utf8",
);
const publicHeader = readFileSync(
  "src/production/components/home-editorial-header.tsx",
  "utf8",
);
const router = readFileSync("src/router.tsx", "utf8");
const publicStabilitySmoke = readFileSync("scripts/public-stability-smoke.mjs", "utf8");

const P0_RELEASE = "2026-08-29-ana-rhn-contract-v2";

test("portal público não invalida a árvore inteira a cada minuto", () => {
  assert.doesNotMatch(minuteRefresh, /router\.invalidate\(/);
  assert.doesNotMatch(minuteRefresh, /setInterval\(/);
});

test("navegação pública preserva carregamento de documento completo", () => {
  assert.match(navigationGuard, /window\.location\.assign\(destination\.href\)/);
  assert.match(navigationGuard, /document\.addEventListener\("click", handleClick, true\)/);
});

test("menu principal usa anchors nativas e não TanStack Link", () => {
  assert.doesNotMatch(
    publicHeader,
    /import\s*\{[^}]*\bLink\b[^}]*\}\s*from\s*["']@tanstack\/react-router["']/,
  );
  assert.match(
    publicHeader,
    /function Link\(\{ to, params, \.\.\.props \}: PublicHeaderLinkProps\)/,
  );
  assert.match(publicHeader, /return <a \{\.\.\.props\} href=\{href\} \/>/);
});

test("router não dispara loader público por hover ou foco antes do clique", () => {
  assert.match(router, /defaultPreload:\s*false/);
  assert.doesNotMatch(router, /defaultPreload:\s*"intent"/);
  assert.doesNotMatch(router, /defaultPreloadDelay/);
});

test("boundary público recupera apenas falhas transitórias e não mascara exceção real", () => {
  assert.match(staleClientRecovery, /recoverClientNavigationFailure/);
  assert.match(staleClientRecovery, /if \(isStaleClientAssetError\(error\)\)/);
  assert.match(staleClientRecovery, /if \(isTransientClientNavigationError\(error\)\)/);
  assert.match(staleClientRecovery, /return false;/);
  assert.doesNotMatch(staleClientRecovery, /navigateToFreshDocument\(\s*"runtime"\s*\)/);
  assert.match(staleClientRecovery, /sessionStorage/);
  assert.doesNotMatch(staleClientRecovery, /if \(!clientRuntimeReady\) return false/);

  assert.match(rootRoute, /Falha de navegação/);
  assert.match(rootRoute, /Não foi possível concluir esta página/);
  assert.match(rootRoute, /Tentar novamente/);
  assert.doesNotMatch(rootRoute, /Carregando a versão mais recente do Tempo Pelotas/);
});

test("home, hoje, amanhã e 7 dias entregam shell sem fonte externa no loader inicial", () => {
  assert.match(homeRoute, /loader: \(\) => createInitialHomeData\(\)/);
  assert.match(homeRoute, /weather: createUnavailableWeatherIntelligence\(\)/);
  assert.match(homeRoute, /Promise\.resolve\(\{/);
  assert.doesNotMatch(homeRoute, /getWeatherIntelligence/);
  assert.doesNotMatch(homeRoute, /getLaranjalLevelData/);
  assert.doesNotMatch(homeRoute, /getGuaibaObservation/);
  assert.doesNotMatch(homeRoute, /getLagoonMonitoringNetwork/);

  for (const routeSource of [todayRoute, tomorrowRoute, sevenDayRoute]) {
    assert.match(routeSource, /loader: \(\) => createUnavailableWeatherIntelligence\(\)/);
    assert.doesNotMatch(routeSource, /loadPublicWeatherPage/);
    assert.doesNotMatch(routeSource, /getWeatherIntelligence/);
  }
});

test("rotas shell-first recuperam a consolidação do backend e propagam ao conteúdo", () => {
  assert.match(browserRecovery, /getWeatherIntelligence/);
  assert.match(browserRecovery, /hasUsableWeatherIntelligence/);
  assert.match(browserRecovery, /useOpenMeteoIntelligenceRecovery\(serverRecoveredData\)/);
  assert.match(internalWeatherShell, /useWeatherIntelligenceBrowserRecovery\(data\)/);
  assert.match(internalWeatherShell, /typeof children === "function"/);
  assert.match(internalWeatherShell, /children\(recoveredData\)/);

  for (const routeSource of [todayRoute, tomorrowRoute, sevenDayRoute]) {
    assert.match(routeSource, /\{\(recoveredWeather\) => \(/);
    assert.match(routeSource, /data=\{recoveredWeather\}/);
  }
});

test("release publicado pode ser identificado sem depender de integração externa", () => {
  assert.match(rootRoute, new RegExp(P0_RELEASE));
  assert.match(rootRoute, /href="\/api\/runtime-version"/);
  assert.match(rootRoute, /data-tempo-pelotas-runtime-release=\{PUBLIC_RUNTIME_RELEASE\}/);

  assert.match(runtimeVersionRoute, new RegExp(P0_RELEASE));
  assert.match(runtimeVersionRoute, /Cache-Control": "no-store, no-cache, must-revalidate"/);
  assert.match(runtimeVersionRoute, /X-Robots-Tag": "noindex, nofollow"/);
  assert.doesNotMatch(runtimeVersionRoute, /fetch\(/);
});

test("demais loaders resilientes continuam com teto curto de documento", () => {
  assert.match(publicWeatherLoader, /PUBLIC_WEATHER_PAGE_DEADLINE_MS = 2_500/);
  assert.match(publicWeatherLoader, /Promise\.race/);
  assert.match(publicHydrologyLoader, /PUBLIC_HYDROLOGY_PAGE_DEADLINE_MS = 2_500/);
  assert.match(publicHydrologyLoader, /Promise\.race/);
});

test("radar e previsão estendida não seguram a navegação por quatro segundos", () => {
  assert.match(radarLoader, /PUBLIC_RADAR_PAGE_DEADLINE_MS = 2_800/);
  assert.doesNotMatch(radarLoader, /PUBLIC_RADAR_PAGE_DEADLINE_MS = 4_000/);
  assert.match(extendedLoader, /PUBLIC_EXTENDED_FORECAST_PAGE_DEADLINE_MS = 2_800/);
  assert.doesNotMatch(extendedLoader, /PUBLIC_EXTENDED_FORECAST_PAGE_DEADLINE_MS = 4_000/);
});

test("smoke público cobre recuperação, águas, radar e alertas após hidratação", () => {
  for (const path of [
    "/",
    "/tempo-hoje-pelotas",
    "/tempo-amanha-pelotas",
    "/previsao-7-dias-pelotas",
    "/situacao-hidrologica-pelotas",
    "/radar-e-satelite-pelotas",
    "/alertas",
  ]) {
    assert.match(publicStabilitySmoke, new RegExp(path.replaceAll("/", "\\/")));
  }

  assert.match(publicStabilitySmoke, /STABILITY_RECOVERY_WAIT_MS \?\? 7_000/);
  assert.match(publicStabilitySmoke, /Atualizando dados meteorológicos/);
  assert.match(publicStabilitySmoke, /A previsão de hoje está em atualização/);
  assert.match(publicStabilitySmoke, /Diagnóstico atual/);
  assert.match(publicStabilitySmoke, /hostsCandidatos/);
  assert.match(publicStabilitySmoke, /Carregando a versão mais recente do Tempo Pelotas/);
});
