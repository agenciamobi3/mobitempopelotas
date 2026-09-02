import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const extendedServer = readFileSync("src/lib/weather/extended-forecast.server.ts", "utf8");
const extendedFunctions = readFileSync("src/lib/weather/extended-forecast.functions.ts", "utf8");
const extendedPageLoader = readFileSync(
  "src/lib/weather/extended-forecast-page-loader.ts",
  "utf8",
);
const standardOpenMeteo = readFileSync("src/lib/weather/open-meteo.server.ts", "utf8");
const route = readFileSync("src/routes/previsao-15-dias-pelotas.tsx", "utf8");
const page = readFileSync("src/components/weather/FifteenDayForecastPage.tsx", "utf8");
const hero = readFileSync("src/components/weather/FifteenDayForecastHero.tsx", "utf8");
const sevenDayRoute = readFileSync("src/routes/previsao-7-dias-pelotas.tsx", "utf8");
const publicRoutes = readFileSync("src/lib/public-routes.ts", "utf8");

test("previsão estendida usa consulta diária dedicada sem ampliar o contrato global", () => {
  assert.match(extendedServer, /EXTENDED_FORECAST_DAYS = 15/);
  assert.match(extendedServer, /forecast_days:\s*String\(EXTENDED_FORECAST_DAYS\)/);
  assert.match(extendedServer, /temperature_2m_max/);
  assert.match(extendedServer, /temperature_2m_min/);
  assert.match(extendedServer, /precipitation_probability_max/);
  assert.match(extendedServer, /precipitation_sum/);
  assert.match(extendedServer, /wind_gusts_10m_max/);
  assert.doesNotMatch(extendedServer, /\bhourly:\s*\[/);
  assert.doesNotMatch(extendedServer, /\bcurrent:\s*\[/);
  assert.match(standardOpenMeteo, /forecast_days:\s*"7"/);
  assert.match(standardOpenMeteo, /HOURLY_FORECAST_LIMIT = 24/);
});

test("previsão estendida preserva ausência e diferencia janela parcial", () => {
  assert.match(extendedServer, /status:\s*"unavailable"/);
  assert.match(extendedServer, /complete \? "live" : "partial"/);
  assert.match(extendedServer, /days\.length >= EXTENDED_FORECAST_DAYS/);
  assert.doesNotMatch(extendedServer, /rainChance:\s*.*\?\?\s*0/);
  assert.doesNotMatch(extendedServer, /windGust:\s*.*\?\?\s*0/);
});

test("previsão estendida usa contingência Edge como janela parcial quando a consulta direta falha", () => {
  assert.match(extendedServer, /fetchOpenMeteoPayloadViaEdge/);
  assert.match(extendedServer, /fetchExtendedForecastEdgeFallback/);
  assert.match(extendedServer, /edge\.payload/);
  assert.match(extendedServer, /edge\.fetchedAt/);
  assert.match(extendedServer, /normalizeExtendedForecast\(parsed\.data\)/);
  assert.match(extendedServer, /consulta direta de 15 dias não respondeu/);
  assert.match(extendedServer, /dias preservados pela contingência Open-Meteo/);
  assert.doesNotMatch(extendedServer, /requestedDays:\s*7/);
});

test("função pública da previsão estendida possui cache próprio", () => {
  assert.match(extendedFunctions, /max-age=300, stale-while-revalidate=300/);
  assert.match(extendedFunctions, /fetchPelotasExtendedForecast/);
  assert.match(extendedFunctions, /createUnavailableExtendedForecast/);
});

test("loader público de 15 dias degrada as duas consultas de forma independente e limita a espera SSR", () => {
  assert.match(extendedPageLoader, /PUBLIC_EXTENDED_FORECAST_PAGE_DEADLINE_MS = 2_800/);
  assert.match(extendedPageLoader, /settlePageDependency/);
  assert.match(extendedPageLoader, /Promise\.race/);
  assert.match(extendedPageLoader, /Promise\.allSettled/);
  assert.match(extendedPageLoader, /getWeatherIntelligence\(\)/);
  assert.match(extendedPageLoader, /getPelotasExtendedForecast\(\)/);
  assert.match(extendedPageLoader, /createUnavailableWeatherIntelligence/);
  assert.match(extendedPageLoader, /status:\s*"unavailable"/);
  assert.match(extendedPageLoader, /days:\s*\[\]/);
  assert.match(extendedPageLoader, /requestedDays:\s*15/);
  assert.doesNotMatch(extendedPageLoader, /Promise\.all\(/);
});

test("rota de 15 dias usa loader resiliente e preserva o shell meteorológico", () => {
  assert.match(route, /createFileRoute\("\/previsao-15-dias-pelotas"\)/);
  assert.match(route, /Previsão do tempo em Pelotas para 15 dias/);
  assert.match(route, /loadPublicExtendedForecastPage\(\)/);
  assert.doesNotMatch(route, /Promise\.all\(/);
  assert.doesNotMatch(route, /getWeatherIntelligence\(\)/);
  assert.doesNotMatch(route, /getPelotasExtendedForecast\(\)/);
  assert.match(route, /<InternalWeatherPageShell/);
  assert.match(route, /<FifteenDayForecastHero/);
  assert.match(route, /<FifteenDayForecastPage/);
});

test("página separa horizonte próximo e segunda semana", () => {
  assert.match(page, /days\.slice\(0, 7\)/);
  assert.match(page, /days\.slice\(7, 15\)/);
  assert.match(page, /Dias 1 a 7/);
  assert.match(page, /Dias 8 a 15/);
  assert.match(page, /A confiança não é igual em toda a janela/);
  assert.match(page, /8–15 dias/);
  assert.match(page, /não transforma ausência de dado em zero/);
  assert.match(hero, /A incerteza aumenta com o horizonte/);
});

test("7 dias aponta para 15 dias e sitemap inclui a nova URL", () => {
  assert.match(sevenDayRoute, /<ForecastHorizonBridge \/>/);
  assert.match(publicRoutes, /path:\s*"\/previsao-15-dias-pelotas"/);
  assert.match(publicRoutes, /"\/previsao-15-dias-pelotas", changeFrequency: "daily"/);
});
