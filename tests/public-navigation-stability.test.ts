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
const navigationGuard = readFileSync(
  "src/components/navigation/PublicDocumentNavigationGuard.tsx",
  "utf8",
);
const router = readFileSync("src/router.tsx", "utf8");

test("portal público não invalida a árvore inteira a cada minuto", () => {
  assert.doesNotMatch(minuteRefresh, /router\.invalidate\(/);
  assert.doesNotMatch(minuteRefresh, /setInterval\(/);
});

test("navegação pública preserva carregamento de documento completo", () => {
  assert.match(navigationGuard, /window\.location\.assign\(destination\.href\)/);
  assert.match(navigationGuard, /document\.addEventListener\("click", handleClick, true\)/);
});

test("router não dispara loader público por hover ou foco antes do clique", () => {
  assert.match(router, /defaultPreload:\s*false/);
  assert.doesNotMatch(router, /defaultPreload:\s*"intent"/);
  assert.doesNotMatch(router, /defaultPreloadDelay/);
});

test("loaders meteorológicos e hidrológicos possuem teto curto de documento", () => {
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

test("home possui deadline próprio e hidrologia continua diferida", () => {
  assert.match(homeRoute, /HOME_WEATHER_DEADLINE_MS = 2_500/);
  assert.match(homeRoute, /HOME_HYDROLOGY_DEADLINE_MS = 3_500/);
  assert.match(homeRoute, /hydrology: Promise<HomeHydrologyResult>/);
  assert.match(homeRoute, /settleWithin\(/);
});
