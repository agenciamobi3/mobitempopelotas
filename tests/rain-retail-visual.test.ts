import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const route = readFileSync("src/routes/chuva-em-pelotas.tsx", "utf8");
const hero = readFileSync("src/components/weather/RainRetailHero.tsx", "utf8");
const heroStyles = readFileSync("src/components/weather/RainRetailHero.css", "utf8");
const page = readFileSync("src/components/weather/RainForecastPageV2.tsx", "utf8");
const styles = readFileSync("src/components/weather/RainPageRefinement.css", "utf8");
const accumulation = readFileSync("src/components/weather/RainAccumulationContext.tsx", "utf8");
const hourlyVolume = readFileSync("src/components/weather/RainHourlyVolumeContext.tsx", "utf8");
const shellStyles = readFileSync("src/components/layout/InternalWeatherPageShell.css", "utf8");

test("rain route uses the shared shell without duplicate editorial layers", () => {
  assert.match(route, /InternalWeatherPageShell/);
  assert.match(route, /RainRetailHero/);
  assert.match(route, /RainForecastPageV2/);
  assert.match(route, /RainPageRefinement\.css/);
  assert.match(route, /pageClassName="internal-weather-shell--rain"/);
  assert.match(route, /createEditorialPageJsonLd/);
  assert.match(route, /RAIN_CITATIONS/);
  assert.match(route, /meteogram=\{meteogram\}/);
  assert.doesNotMatch(route, /EditorialContentSection|RAIN_PAGE_CONTENT|createFaqPageJsonLd/);
});

test("rain body owns one current visual hierarchy instead of layered V2 stylesheets", () => {
  assert.match(page, /className="rain-page"/);
  assert.match(page, /RainAccumulationContext/);
  assert.match(page, /RainHourlyVolumeContext/);
  assert.match(page, /rain-page__hourly/);
  assert.match(page, /rain-page__week/);
  assert.match(page, /rain-page__official/);
  assert.match(page, /rain-page__footer/);
  assert.doesNotMatch(page, /InternalPageChapters/);
  assert.doesNotMatch(page, /RainForecastPageV2\.css/);
  assert.doesNotMatch(accumulation, /RainAccumulationContext\.css/);
  assert.doesNotMatch(hourlyVolume, /RainHourlyVolumeContext\.css/);
  assert.doesNotMatch(`${page}\n${styles}`, /rain-v2-/);
});

test("rain hero keeps measured and forecast rain distinct without duplicate tiles", () => {
  assert.match(hero, /Chuva em Pelotas <span>hoje<\/span>/);
  assert.match(hero, /label: "Medido"/);
  assert.match(hero, /label: "Hoje previsto"/);
  assert.match(hero, /label: "7 dias"/);
  assert.match(hero, /Maior chance nas próximas 12 horas/);
  assert.match(hero, /Ver medido e previsto/);
  assert.match(hero, /Ver próximas horas/);
  assert.match(hero, /getRetailWeatherPhoto/);
  assert.match(hero, /today-retail-hero__current-photo/);
  assert.match(hero, /Maior volume/);
  assert.match(hero, /Rajada com chuva/);
  assert.doesNotMatch(hero, /<span><CloudRain aria-hidden="true" \/> Maior chance<\/span>/);
  assert.doesNotMatch(hero, /<span><Gauge aria-hidden="true" \/> Fonte<\/span>/);
});

test("rain zero-volume and zero-chance states do not invent peaks", () => {
  assert.match(hero, /hasPositiveRainVolume/);
  assert.match(hero, /Sem volume previsto/);
  assert.match(page, /hasPositiveRainVolume/);
  assert.match(page, /Sem volume previsto/);
  assert.match(hero, /const hasPositiveRainChance = \(highestRainChance \?\? 0\) > 0/);
  assert.match(hero, /Sem chuva destacada nas próximas 12 horas/);
  assert.match(hero, /Sem horário de destaque/);
});

test("rain page keeps unknown probability separate from published zero", () => {
  assert.match(page, /function formatChance/);
  assert.match(page, /Não informada/);
  assert.match(page, /chanceTone/);
  assert.doesNotMatch(page, /precipitationProbability \?\? 0/);
});

test("rain accumulation keeps measured and forecast values explicit", () => {
  assert.match(accumulation, /Chuva medida e prevista/);
  assert.match(accumulation, /Medido hoje/);
  assert.match(accumulation, /Previsto hoje/);
  assert.match(accumulation, /Medido e previsto não são somados/);
  assert.match(accumulation, /Os períodos podem se sobrepor/);
  assert.match(accumulation, /Chuva medida em 24 horas/);
  assert.match(accumulation, /Cada valor pertence à estação indicada, não à cidade inteira/);
});

test("hourly rain volume stays separate from probability and uses direct copy", () => {
  assert.match(hourlyVolume, /Volume previsto/);
  assert.match(hourlyVolume, /Milímetros previstos em cada horário/);
  assert.match(hourlyVolume, /Total em 12 h/);
  assert.match(hourlyVolume, /Maior volume em 1 h/);
  assert.match(hourlyVolume, /Primeiro volume/);
  assert.match(hourlyVolume, /rain-hourly-volume-context__summary/);
  assert.doesNotMatch(hourlyVolume, /Não é chuva já medida|Previsão em milímetros para as próximas 12 horas/);
});

test("rain visual contract uses current retail composition", () => {
  assert.match(styles, /\.rain-page \{/);
  assert.match(styles, /\.rain-accumulation \{/);
  assert.match(styles, /grid-template-columns: repeat\(4, minmax\(0, 1fr\)\)/);
  assert.match(styles, /\.rain-page__hourly-track/);
  assert.match(styles, /grid-auto-flow: column/);
  assert.match(styles, /\.rain-page__week-grid/);
  assert.match(styles, /grid-template-columns: repeat\(7, minmax\(0, 1fr\)\)/);
  assert.match(styles, /\.rain-page__official \{/);
  assert.match(styles, /background: #071e2f/);
  assert.match(styles, /@media \(max-width: 620px\)/);
  assert.match(styles, /@media \(forced-colors: active\)/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.doesNotMatch(styles, /\.internal-page-chapters/);
  assert.doesNotMatch(styles, /rain-v2-/);
});

test("rain experience keeps the current Home rail and hero", () => {
  assert.match(shellStyles, /--internal-weather-frame-max:\s*var\(--tp-home-container-max, 1440px\)/);
  assert.match(shellStyles, /\.internal-weather-shell--rain \.rain-retail-hero__inner[\s\S]*width:\s*100%[\s\S]*max-width:\s*none/);
  assert.doesNotMatch(heroStyles, /max-width:\s*var\(--internal-weather-frame-max\)/);
});
