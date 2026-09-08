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
const refinementStyles = readFileSync(
  "src/components/weather/FifteenDayForecastEditorialRefinement.css",
  "utf8",
);
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

test("rota de 15 dias usa shell próprio sem camada editorial duplicada", () => {
  assert.match(route, /createFileRoute\("\/previsao-15-dias-pelotas"\)/);
  assert.match(route, /Previsão do tempo em Pelotas: 10 e 15 dias/);
  assert.match(route, /loadPublicExtendedForecastPage\(\)/);
  assert.match(route, /<InternalWeatherPageShell/);
  assert.match(route, /pageClassName="internal-weather-shell--fifteen-day"/);
  assert.match(route, /<FifteenDayForecastHero/);
  assert.match(route, /<FifteenDayForecastPage/);
  assert.match(route, /FifteenDayForecastEditorialRefinement\.css/);
  assert.match(route, /createEditorialPageJsonLd/);
  assert.doesNotMatch(route, /EditorialContentSection|createFaqPageJsonLd|FIFTEEN_DAY_PAGE_CONTENT/);
});

test("hero de 15 dias possui superfície editorial própria sem foto, tiles ou CTAs retail", () => {
  assert.match(hero, /className={`fifteen-day-retail-hero fifteen-day-retail-hero--\$\{advisoryLevel\}`}/);
  assert.match(hero, /className="fifteen-day-retail-hero__inner"/);
  assert.match(hero, /Previsão estendida · Pelotas/);
  assert.match(hero, /Previsão de 15 dias para Pelotas/);
  assert.match(hero, /Temperaturas entre \$\{minimum\}° e \$\{maximum\}°/);
  assert.match(hero, /Janela disponível/);
  assert.match(hero, /fifteen-day-retail-hero__facts/);
  assert.match(hero, /Maior volume/);
  assert.match(hero, /Rajadas/);
  assert.doesNotMatch(hero, /today-retail-hero/);
  assert.doesNotMatch(hero, /getRetailWeatherPhoto|today-retail-hero-backgrounds/);
  assert.doesNotMatch(hero, /current-photo|photo-credit/);
  assert.doesNotMatch(hero, /ArrowRight|today-retail-hero__actions/);

  assert.match(
    heroStyles,
    /\.internal-weather-shell--fifteen-day \.internal-weather-hero-frame[\s\S]*width:\s*100%[\s\S]*border:\s*0/,
  );
  assert.match(
    heroStyles,
    /\.internal-weather-shell--fifteen-day \.fifteen-day-retail-hero__inner[\s\S]*var\(--tp-home-container-max, 1440px\)[\s\S]*margin-inline:\s*auto/,
  );
  assert.match(
    heroStyles,
    /\.fifteen-day-retail-hero__facts[\s\S]*grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\)[\s\S]*border-top:[\s\S]*border-bottom:/,
  );
  assert.match(heroStyles, /@media \(forced-colors: active\)/);
});

test("página de 15 dias apresenta as duas semanas em uma única narrativa", () => {
  assert.match(page, /days\.slice\(0, 7\)/);
  assert.match(page, /days\.slice\(7, 15\)/);
  assert.match(page, /className="fifteen-day-page"/);
  assert.match(page, /className="fifteen-day__forecast"/);
  assert.match(page, /Previsão dos próximos 15 dias/);
  assert.match(page, /Primeira semana/);
  assert.match(page, /Segunda semana/);
  assert.match(page, /Pode mudar mais\. Confira de novo perto da data\./);
  assert.match(page, /className="fifteen-day__grid is-near"/);
  assert.match(page, /className="fifteen-day__grid is-extended"/);
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

test("dias preservam ausência e não inventam rótulos de risco", () => {
  assert.match(page, /if \(value === null\) return "Não informada"/);
  assert.match(page, /if \(value <= 0\) return "Sem rajadas"/);
  assert.match(page, /if \(index === 0\) return "Hoje"/);
  assert.match(page, /if \(index === 1\) return "Amanhã"/);
  assert.match(page, /return null/);
  assert.match(page, /Sem chuva prevista nos valores atuais/);
  assert.match(page, /As rajadas ainda não foram informadas/);
  assert.doesNotMatch(page, /Mais chuva\/vento|Acompanhar/);
  assert.doesNotMatch(page, /tone-high|tone-attention|dayTone/);
});

test("estrutura visual de 15 dias mantém cards só onde a comparação pede e abre os capítulos", () => {
  assert.doesNotMatch(
    shellStyles,
    /\.internal-weather-shell--fifteen-day \.fifteen-day-retail-hero__inner/,
  );
  assert.match(shellStyles, /\.internal-weather-main > \.fifteen-day-page/);
  assert.match(pageStyles, /\.fifteen-day__grid\.is-near[\s\S]*repeat\(7, minmax\(0, 1fr\)\)/);
  assert.match(pageStyles, /\.fifteen-day__grid\.is-extended[\s\S]*repeat\(4, minmax\(0, 1fr\)\)/);
  assert.match(pageStyles, /\.fifteen-day__trend-list/);
  assert.match(pageStyles, /\.fifteen-day__trend-summary/);
  assert.match(refinementStyles, /\.internal-weather-shell--fifteen-day \.fifteen-day__forecast/);
  assert.match(refinementStyles, /border:\s*0/);
  assert.match(refinementStyles, /background:\s*transparent/);
  assert.match(
    refinementStyles,
    /\.internal-weather-shell--fifteen-day \.fifteen-day__risks-grid > article \+ article[\s\S]*border-left/,
  );
  assert.match(refinementStyles, /@media \(max-width: 980px\)/);
  assert.match(refinementStyles, /@media \(max-width: 720px\)/);
  assert.match(refinementStyles, /@media \(forced-colors: active\)/);
  assert.match(pageStyles, /content-visibility:\s*auto/);
});

test("rodapé de 15 dias concentra fonte e navegação sem novos cards", () => {
  assert.match(page, /<footer className="fifteen-day__footer">/);
  assert.match(page, /forecast\.source\.model/);
  assert.match(page, /forecast\.source\.returnedDays/);
  assert.match(page, /to="\/previsao-7-dias-pelotas">7 dias/);
  assert.match(page, /to="\/tempo-amanha-pelotas">Amanhã/);
  assert.match(page, /to="\/chuva-em-pelotas">Chuva/);
  assert.match(page, /to="\/vento-em-pelotas">Vento/);
  assert.doesNotMatch(page, /className="fifteen-day__source"|className="fifteen-day__related"/);
});

test("7 dias aponta para 15 dias e sitemap inclui a URL estendida", () => {
  assert.match(sevenDayRoute, /<ForecastHorizonBridge \/>/);
  assert.match(publicRoutes, /path:\s*"\/previsao-15-dias-pelotas"/);
  assert.match(publicRoutes, /"\/previsao-15-dias-pelotas", changeFrequency: "daily"/);
});
