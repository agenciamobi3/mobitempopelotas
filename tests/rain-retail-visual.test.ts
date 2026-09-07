import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const route = readFileSync("src/routes/chuva-em-pelotas.tsx", "utf8");
const hero = readFileSync("src/components/weather/RainRetailHero.tsx", "utf8");
const heroStyles = readFileSync("src/components/weather/RainRetailHero.css", "utf8");
const page = readFileSync("src/components/weather/RainForecastPageV2.tsx", "utf8");
const pageStyles = readFileSync("src/components/weather/RainForecastPageV2.css", "utf8");
const refinement = readFileSync("src/components/weather/RainPageRefinement.css", "utf8");
const accumulation = readFileSync("src/components/weather/RainAccumulationContext.tsx", "utf8");
const hourlyVolume = readFileSync("src/components/weather/RainHourlyVolumeContext.tsx", "utf8");
const hourlyVolumeStyles = readFileSync("src/components/weather/RainHourlyVolumeContext.css", "utf8");
const shellStyles = readFileSync("src/components/layout/InternalWeatherPageShell.css", "utf8");

test("rain route uses the shared shell without a duplicate editorial FAQ layer", () => {
  assert.match(route, /InternalWeatherPageShell/);
  assert.match(route, /RainRetailHero/);
  assert.match(route, /RainForecastPageV2/);
  assert.match(route, /RainAccumulationContext/);
  assert.match(route, /RainHourlyVolumeContext/);
  assert.match(route, /RainPageRefinement\.css/);
  assert.match(route, /pageClassName="internal-weather-shell--rain"/);
  assert.match(route, /createEditorialPageJsonLd/);
  assert.match(route, /RAIN_CITATIONS/);
  assert.doesNotMatch(route, /EditorialContentSection|RAIN_PAGE_CONTENT|createFaqPageJsonLd/);
});

test("rain hero keeps measured and forecast rain distinct with direct copy", () => {
  assert.match(hero, /Chuva em Pelotas <span>hoje<\/span>/);
  assert.match(hero, /label: "Medido"/);
  assert.match(hero, /label: "Hoje previsto"/);
  assert.match(hero, /label: "7 dias"/);
  assert.match(hero, /Maior chance nas próximas 12 horas/);
  assert.match(hero, /Ver medido e previsto/);
  assert.match(hero, /Ver próximas horas/);
  assert.match(hero, /getRetailWeatherPhoto/);
  assert.match(hero, /today-retail-hero__current-photo/);
  assert.doesNotMatch(hero, /today-retail-hero__eyebrow/);
  assert.doesNotMatch(hero, /acumulado, chance e previsão\.<\/span>/);
});

test("rain zero-volume state does not invent a rainiest day", () => {
  assert.match(hero, /hasPositiveRainVolume/);
  assert.match(hero, /Sem volume previsto/);
  assert.match(page, /hasPositiveRainVolume/);
  assert.match(page, /Sem volume previsto/);
});

test("rain zero-chance state keeps zero percent without inventing a peak hour", () => {
  assert.match(hero, /const highestRainChance = peakCandidate\?\.precipitation \?\? null/);
  assert.match(hero, /const hasPositiveRainChance = \(highestRainChance \?\? 0\) > 0/);
  assert.match(hero, /Sem chuva destacada nas próximas 12 horas/);
  assert.match(hero, /Sem horário de destaque/);
  assert.match(hero, /formatChance\(highestRainChance\)/);
});

test("rain page keeps unknown probability separate from a published zero", () => {
  assert.match(page, /function formatChance/);
  assert.match(page, /Não informada/);
  assert.match(page, /chanceTone/);
  assert.doesNotMatch(page, /precipitationProbability \?\? 0/);
});

test("rain volume ranking remains dimensional", () => {
  assert.match(page, /day\.precipitationMm !== selected\.precipitationMm/);
  assert.match(page, /day\.precipitationMm > selected\.precipitationMm/);
  assert.match(page, /rainScore\(day\) > rainScore\(selected\)/);
});

test("rain page removes the duplicated planning layer", () => {
  assert.match(page, /InternalPageChapters/);
  assert.match(page, /Chance de chuva nas próximas 12 horas/);
  assert.match(page, /Chuva nos próximos 7 dias/);
  assert.match(page, /INMET para Pelotas/);
  assert.match(page, /rain-v2-week__summary/);
  assert.match(page, /rain-v2-official__list/);
  assert.match(page, /rain-v2-footer/);
  assert.match(page, /Nenhum aviso ativo/);
  assert.doesNotMatch(page, /rain-v2-planning|planejamento-da-chuva/);
  assert.doesNotMatch(page, /Menor e maior chance nas próximas 12 horas/);
  assert.doesNotMatch(page, /Menor chance|Maior chance|Horários com 30% ou mais/);
  assert.doesNotMatch(page, /buildWindows|WindowSummary/);
});

test("rain accumulation keeps only the necessary measured-versus-forecast warning", () => {
  assert.match(accumulation, /Chuva medida e prevista/);
  assert.match(accumulation, /Medido hoje/);
  assert.match(accumulation, /Previsto hoje/);
  assert.match(accumulation, /Medido e previsto não são somados/);
  assert.match(accumulation, /Os períodos podem se sobrepor/);
  assert.match(accumulation, /Chuva em 24 horas nas estações próximas/);
  assert.match(accumulation, /Cada valor pertence à estação indicada, não à cidade inteira/);
  assert.doesNotMatch(accumulation, /Os valores medidos e previstos ficam separados porque/);
  assert.doesNotMatch(accumulation, /Previsão, não medição/);
});

test("hourly rain volume uses a compact summary", () => {
  assert.match(hourlyVolume, /Volume de chuva por hora/);
  assert.match(hourlyVolume, /Previsão em milímetros para as próximas 12 horas/);
  assert.match(hourlyVolume, /Total em 12 h/);
  assert.match(hourlyVolume, /Maior volume em 1 h/);
  assert.match(hourlyVolume, /Primeiro volume/);
  assert.doesNotMatch(hourlyVolume, /Horas com 0,1 mm ou mais/);
  assert.doesNotMatch(hourlyVolume, /Não é chuva já medida/);
  assert.match(hourlyVolume, /<dl className="rain-hourly-volume-context__summary"/);
});

test("rain experience uses the current Home rail", () => {
  assert.match(shellStyles, /--internal-weather-frame-max:\s*var\(--tp-home-container-max, 1440px\)/);
  assert.match(shellStyles, /--internal-weather-section-padding:\s*clamp\(24px, 3vw, 34px\)/);
  assert.match(shellStyles, /\.internal-weather-shell--rain \.rain-retail-hero__inner[\s\S]*width:\s*100%[\s\S]*max-width:\s*none/);
  assert.doesNotMatch(heroStyles, /max-width:\s*var\(--internal-weather-frame-max\)/);
});

test("rain page refinement removes decorative body chrome and card-heavy summaries", () => {
  assert.match(refinement, /grid-template-columns:\s*repeat\(5, minmax\(0, 1fr\)\)/);
  assert.match(refinement, /\.rain-v2-page \.eyebrow/);
  assert.match(refinement, /box-shadow:\s*none/);
  assert.match(refinement, /\.rain-v2-week__summary/);
  assert.match(refinement, /\.rain-v2-official__list/);
  assert.match(refinement, /\.rain-v2-footer/);
  assert.doesNotMatch(refinement, /rain-v2-planning/);
  assert.doesNotMatch(refinement, /radial-gradient/);
  assert.match(refinement, /@media \(forced-colors: active\)/);

  assert.match(pageStyles, /grid-template-columns:\s*repeat\(12, minmax\(0, 1fr\)\)/);
  assert.match(pageStyles, /grid-template-columns:\s*repeat\(7, minmax\(0, 1fr\)\)/);
  assert.match(pageStyles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(pageStyles, /:focus-visible/);
});

test("hourly rain volume keeps functional precipitation bars while flattening summary cards", () => {
  assert.match(hourlyVolumeStyles, /\.internal-weather-shell--rain \.rain-hourly-volume-context \{/);
  assert.match(hourlyVolumeStyles, /grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(hourlyVolumeStyles, /\.rain-hourly-volume-context__summary > div/);
  assert.match(hourlyVolumeStyles, /box-shadow:\s*none/);
  assert.doesNotMatch(hourlyVolumeStyles, /radial-gradient/);
  assert.match(hourlyVolumeStyles, /Gradiente funcional/);
  assert.match(hourlyVolumeStyles, /linear-gradient\(90deg, #18bdcd, #5e2ced\)/);
});
