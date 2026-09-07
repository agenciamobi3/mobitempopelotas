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
const pageStyles = readFileSync("src/components/weather/FifteenDayForecastPage.css", "utf8");
const hero = readFileSync("src/components/weather/FifteenDayForecastHero.tsx", "utf8");
const heroStyles = readFileSync("src/components/weather/FifteenDayForecastHero.css", "utf8");
const shellStyles = readFileSync("src/components/layout/InternalWeatherPageShell.css", "utf8");
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

test("rota de 15 dias usa shell retail sem camada editorial duplicada", () => {
  assert.match(route, /createFileRoute\("\/previsao-15-dias-pelotas"\)/);
  assert.match(route, /Previsão do tempo em Pelotas: 10 e 15 dias/);
  assert.match(route, /loadPublicExtendedForecastPage\(\)/);
  assert.match(route, /<InternalWeatherPageShell/);
  assert.match(route, /pageClassName="internal-weather-shell--fifteen-day"/);
  assert.match(route, /<FifteenDayForecastHero/);
  assert.match(route, /<FifteenDayForecastPage/);
  assert.match(route, /createEditorialPageJsonLd/);
  assert.doesNotMatch(route, /EditorialContentSection|createFaqPageJsonLd|FIFTEEN_DAY_PAGE_CONTENT/);
});

test("hero de 15 dias usa a mesma estrutura retail de hoje, amanhã e 7 dias", () => {
  assert.match(hero, /today-retail-hero fifteen-day-retail-hero/);
  assert.match(hero, /today-retail-hero__inner fifteen-day-retail-hero__inner/);
  assert.match(hero, /Previsão de <span>15 dias<\/span> para Pelotas/);
  assert.match(hero, /Temperaturas entre \$\{minimum\}° e \$\{maximum\}°/);
  assert.match(hero, /getRetailWeatherPhoto/);
  assert.match(hero, /today-retail-hero__current-photo/);
  assert.match(hero, /Faixa de temperatura/);
  assert.match(hero, /Maior volume de chuva/);
  assert.match(hero, /Fonte/);
  assert.doesNotMatch(hero, /WeatherSplitHero|weather-split-hero/);
  assert.doesNotMatch(hero, /Previsão estendida · Pelotas/);
  assert.doesNotMatch(hero, /A incerteza aumenta com o horizonte/);

  assert.match(heroStyles, /fifteen-day-retail-hero/);
  assert.match(heroStyles, /radial-gradient/);
  assert.match(heroStyles, /@media \(max-width: 920px\)/);
  assert.match(heroStyles, /@media \(max-width: 700px\)/);
  assert.match(heroStyles, /@media \(forced-colors: active\)/);
});

test("página de 15 dias separa as duas semanas com copy direta", () => {
  assert.match(page, /days\.slice\(0, 7\)/);
  assert.match(page, /days\.slice\(7, 15\)/);
  assert.match(page, /className="fifteen-day-page"/);
  assert.match(page, /Primeiros 7 dias/);
  assert.match(page, /Dias 8 a 15/);
  assert.match(page, /A segunda semana pode mudar mais\. Confira de novo perto da data\./);
  assert.match(page, /Temperaturas nos próximos 15 dias/);
  assert.match(page, /Chuva e rajadas nos próximos 15 dias/);
  assert.match(page, /--fifteen-low/);
  assert.match(page, /--fifteen-span/);
  assert.doesNotMatch(page, /Resumo dos próximos 15 dias/);
  assert.doesNotMatch(page, /Uma janela maior para planejar/);
  assert.doesNotMatch(page, /Como usar a previsão/);
  assert.doesNotMatch(page, /A confiança não é igual em toda a janela/);
  assert.doesNotMatch(page, /Dia \$\{index \+ 1\}/);
});

test("cards de 15 dias preservam ausência e evitam rótulos genéricos", () => {
  assert.match(page, /if \(value === null\) return "Não informada"/);
  assert.match(page, /if \(value <= 0\) return "Sem rajadas"/);
  assert.match(page, /if \(tone === "high"\) return "Mais chuva\/vento"/);
  assert.match(page, /if \(tone === "attention"\) return "Acompanhar"/);
  assert.match(page, /return null/);
  assert.match(page, /Sem chuva prevista nos valores atuais/);
  assert.match(page, /As rajadas ainda não foram informadas/);
  assert.doesNotMatch(page, /Maior valor previsto para o dia/);
  assert.doesNotMatch(page, /Previsão estendida<\/span>/);
});

test("estrutura visual de 15 dias usa superfícies simples e o rail meteorológico atual", () => {
  assert.match(
    shellStyles,
    /\.internal-weather-shell--fifteen-day \.fifteen-day-retail-hero__inner/,
  );
  assert.match(shellStyles, /\.internal-weather-main > \.fifteen-day-page/);
  assert.match(pageStyles, /\.fifteen-day-page/);
  assert.match(pageStyles, /grid-template-columns:\s*repeat\(4, minmax\(0, 1fr\)\)/);
  assert.match(pageStyles, /\.fifteen-day__trend-list/);
  assert.match(pageStyles, /\.fifteen-day__risks-grid/);
  assert.match(pageStyles, /content-visibility:\s*auto/);
  assert.match(pageStyles, /@media \(max-width: 980px\)/);
  assert.match(pageStyles, /@media \(max-width: 560px\)/);
  assert.match(pageStyles, /@media \(forced-colors: active\)/);
  assert.doesNotMatch(pageStyles, /radial-gradient/);
  assert.doesNotMatch(pageStyles, /box-shadow:\s*0\s+14px/);
});

test("7 dias aponta para 15 dias e sitemap inclui a URL estendida", () => {
  assert.match(sevenDayRoute, /<ForecastHorizonBridge \/>/);
  assert.match(publicRoutes, /path:\s*"\/previsao-15-dias-pelotas"/);
  assert.match(publicRoutes, /"\/previsao-15-dias-pelotas", changeFrequency: "daily"/);
});
