import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const route = readFileSync("src/routes/vento-em-pelotas.tsx", "utf8");
const hero = readFileSync("src/components/weather/WindRetailHero.tsx", "utf8");
const heroStyles = readFileSync("src/components/weather/WindRetailHero.css", "utf8");
const page = readFileSync("src/components/weather/WindForecastPageV3.tsx", "utf8");
const styles = readFileSync("src/components/weather/WindPageRefinement.css", "utf8");
const direction = readFileSync("src/components/weather/WindDirectionContext.tsx", "utf8");
const directionStyles = readFileSync("src/components/weather/WindDirectionContext.css", "utf8");
const shellStyles = readFileSync("src/components/layout/InternalWeatherPageShell.css", "utf8");

const windSource = `${route}\n${page}\n${direction}`;

test("wind route uses its dedicated editorial hero and one recovered forecast contract", () => {
  assert.match(route, /WindRetailHero/);
  assert.match(route, /WindPageRefinement\.css/);
  assert.match(route, /pageClassName="internal-weather-shell--wind"/);
  assert.match(route, /loadPublicWeatherPage/);
  assert.doesNotMatch(route, /loadPublicWeatherWithMeteogram|WindNavigationAvailability\.css/);
  assert.match(route, /staleTime: 5 \* 60 \* 1_000/);
});

test("wind hero distinguishes observed current wind from next-hour forecast", () => {
  assert.match(hero, /const hasCurrentObservation =/);
  assert.match(hero, /current\.available/);
  assert.match(hero, /current\.source\.kind === "observation"/);
  assert.match(hero, /current\.windSpeed !== null/);
  assert.match(hero, /Vento medido agora/);
  assert.match(hero, /Previsão da próxima hora/);
  assert.match(hero, /A medição atual do vento está indisponível/);
  assert.match(hero, /current\.source\.name/);
  assert.doesNotMatch(hero, /getRetailWeatherPhoto|today-retail-hero-backgrounds|TodayRetailHeroPhoto\.css/);
  assert.doesNotMatch(hero, /today-retail-hero/);
});

test("wind hero preserves gust absence and keeps the useful 24h and 7d facts", () => {
  assert.match(hero, /function formatGust/);
  assert.match(hero, /if \(value <= 0\) return "Sem rajadas"/);
  assert.match(hero, /const hasGustForecast = hours\.some\(\(hour\) => hour\.windGust !== null\)/);
  assert.match(hero, /Maior rajada 24 h/);
  assert.match(hero, /Média prevista 24 h/);
  assert.match(hero, /Maior rajada em 7 dias/);
  assert.match(hero, /Rajadas não informadas/);
  assert.doesNotMatch(hero, /windGust \?\? .*windSpeed/);
});

test("wind hero owns the Home rail and no longer uses photographic cards", () => {
  assert.match(
    heroStyles,
    /\.internal-weather-shell--wind \.wind-retail-hero__inner[\s\S]*--tp-home-container-max, 1440px[\s\S]*--tp-home-container-gutter, 48px/,
  );
  assert.match(heroStyles, /\.wind-retail-hero__facts[\s\S]*repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(heroStyles, /\.wind-retail-hero__facts article[\s\S]*box-shadow:\s*none/);
  assert.match(heroStyles, /@media \(max-width: 1100px\)/);
  assert.match(heroStyles, /@media \(max-width: 720px\)/);
  assert.match(heroStyles, /@media \(forced-colors: active\)/);
  assert.doesNotMatch(heroStyles, /today-retail-hero__current-photo|photo-credit/);
  assert.doesNotMatch(shellStyles, /\.internal-weather-shell--wind \.wind-retail-hero__inner/);
});

test("wind body is editorial instead of the old chapter dashboard", () => {
  assert.match(page, /className="wind-page"/);
  assert.match(page, /wind-page__provenance/);
  assert.match(page, /wind-page__hourly-track/);
  assert.match(page, /wind-page__peak-list/);
  assert.match(page, /wind-page__week-grid/);
  assert.match(page, /wind-page__interpretation/);
  assert.match(page, /wind-page__footer/);
  assert.doesNotMatch(page, /wind-v3-chapters|wind-v3-source|wind-v3-section|wind-v3-hourly-list/);
  assert.doesNotMatch(page, /WindForecastPageV3\.css/);
});

test("wind page keeps field-level provenance visible without repeating a dashboard summary", () => {
  assert.match(page, /currentProvenance\.windSpeed/);
  assert.match(page, /currentProvenance\.windDirection/);
  assert.match(page, /sourceName\(windSource\)/);
  assert.match(page, /sourceName\(directionSource\)/);
  assert.match(page, /Origem dos dados/);
  assert.match(page, /O vento atual e a direção observada podem ter origens diferentes/);
  assert.match(page, /Horário do vento atual/);
  assert.match(page, /Última atualização/);
  assert.doesNotMatch(page, /quality\.currentSource/);
});

test("wind page expands the primary hourly series to 24 hours", () => {
  assert.match(page, /weather\.hourly\.slice\(0, 24\)/);
  assert.match(page, /Próximas 24 horas/);
  assert.match(page, /Vento e rajadas por horário/);
  assert.match(page, /hour\.windSpeed/);
  assert.match(page, /hour\.windGust/);
  assert.match(page, /A diferença mostra quanto a rajada supera o vento naquele horário/);
  assert.doesNotMatch(page, /slice\(0, 12\)/);
});

test("peak rankings use only positive published gusts", () => {
  assert.match(page, /function peakHours/);
  assert.match(page, /\.filter\(\(hour\) => \(hour\.windGust \?\? 0\) > 0\)/);
  assert.match(page, /\.sort\(\(a, b\) => \(b\.windGust \?\? 0\) - \(a\.windGust \?\? 0\)\)/);
  assert.match(page, /As rajadas mais fortes das próximas 24 horas/);
  assert.match(page, /Velocidade sustentada não substitui rajada/);
  assert.match(page, /Não há rajadas positivas previstas para as próximas 24 horas/);
  assert.match(page, /Sem rajada prevista/);
});

test("wind weekly view keeps seven days without another card dashboard", () => {
  assert.match(page, /weather\.daily\.slice\(0, 7\)/);
  assert.match(page, /Próximos 7 dias/);
  assert.match(page, /Rajadas nos próximos 7 dias/);
  assert.match(page, /Rajada mais forte prevista em cada dia/);
  assert.match(page, /wind-page__week-grid/);
  assert.doesNotMatch(page, /wind-v3-week-list/);
});

test("future direction stays a model forecast and remains visible while updating", () => {
  assert.match(direction, /windDirectionDegrees/);
  assert.match(direction, /dado de modelo/);
  assert.match(direction, /separada da direção observada pela estação/);
  assert.match(direction, /Direção por hora em atualização/);
  assert.match(route, /hourly=\{recoveredWeather\.weather\.hourly\}/);
  assert.doesNotMatch(route, /meteogram/);
});

test("wind empty state never inserts manual values", () => {
  assert.match(page, /Os dados de vento estão em atualização/);
  assert.match(page, /Nenhuma velocidade, direção ou rajada foi preenchida manualmente/);
  assert.match(page, /!current && weather\.hourly\.length === 0 && weather\.daily\.length === 0/);
});

test("wind body follows the open editorial visual contract", () => {
  assert.match(styles, /\.internal-weather-shell--wind \.wind-page \{/);
  assert.match(styles, /\.wind-page__provenance/);
  assert.match(styles, /border-top: 1px solid/);
  assert.match(styles, /\.wind-page__hourly-track/);
  assert.match(styles, /grid-auto-flow: column/);
  assert.match(styles, /\.wind-page__week-grid/);
  assert.match(styles, /grid-template-columns: repeat\(7, minmax\(0, 1fr\)\)/);
  assert.match(styles, /@media \(max-width: 620px\)/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(styles, /@media \(forced-colors: active\)/);
  assert.match(styles, /:focus-visible/);
  assert.doesNotMatch(styles, /box-shadow: 0 18px|radial-gradient|linear-gradient|!important/);
});

test("direction detail remains a separate readable forecast layer", () => {
  assert.match(directionStyles, /\.internal-weather-shell--wind \.wind-direction-context \{/);
  assert.match(directionStyles, /background:\s*#fff/);
  assert.match(directionStyles, /\.wind-direction-context__summary article/);
  assert.match(directionStyles, /\.wind-direction-context__timeline > article/);
  assert.match(directionStyles, /@media \(max-width: 520px\)/);
  assert.doesNotMatch(windSource, /procedência campo a campo|vento consolidado/i);
});
