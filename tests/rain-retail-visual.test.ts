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
  assert.doesNotMatch(route, /showOfficialAlerts=\{false\}/);
});

test("rain hero keeps measured and forecast rain distinct with concise copy", () => {
  assert.match(hero, /Chuva em Pelotas hoje/);
  assert.match(hero, /Medido hoje/);
  assert.match(hero, /Previsto hoje/);
  assert.match(hero, /Previsto em 7 dias/);
  assert.match(hero, /Maior chance nas próximas 12 horas/);
  assert.match(hero, /Ver acumulado/);
  assert.match(hero, /Ver por horário/);
  assert.match(hero, /getRetailWeatherPhoto/);
  assert.match(hero, /today-retail-hero__current-photo/);
  assert.doesNotMatch(hero, /today-retail-hero__eyebrow/);
  assert.doesNotMatch(hero, /Sem aviso oficial de chuva listado para Pelotas/);
  assert.doesNotMatch(hero, /Não somado ao observado/);
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
  assert.match(page, /const knownChanceHours = hours\.filter\(\(hour\) => hour\.precipitationProbability !== null\)/);
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

test("rain planning only highlights windows when there is real contrast", () => {
  assert.match(page, /const bestCandidates = windows\.filter\(\(window\) => window\.averageChance !== null\)/);
  assert.match(page, /const hasBestContrast = bestKeys\.size > 1/);
  assert.match(page, /const bestWindow = hasBestContrast \? bestCandidate : null/);
  assert.match(page, /const hasAttentionContrast =/);
  assert.match(page, /Math\.max\(\.\.\.attentionChances\) > Math\.min\(\.\.\.attentionChances\)/);
  assert.match(page, /const attentionWindow = hasAttentionContrast \? attentionCandidate : null/);
  assert.match(page, /Sem período de destaque/);
  assert.match(page, /className=\{bestWindow \? "is-best" : undefined\}/);
  assert.match(page, /className=\{attentionWindow \? "is-attention" : undefined\}/);
});

test("rain page follows a direct sequence without a repeated overview section", () => {
  assert.match(page, /InternalPageChapters/);
  assert.match(page, /Chance de chuva nas próximas 12 horas/);
  assert.match(page, /Chuva nos próximos 7 dias/);
  assert.match(page, /Menor e maior chance nas próximas 12 horas/);
  assert.match(page, /INMET para Pelotas/);
  assert.match(page, /Menor chance/);
  assert.match(page, /Maior chance/);
  assert.match(page, /Horários com 30% ou mais/);
  assert.match(page, /Nenhum aviso ativo/);
  assert.doesNotMatch(page, /rain-v2-overview/);
  assert.doesNotMatch(page, /Chuva em resumo|Chuva por horário|Horários para planejar|O que o INMET publica/);
  assert.doesNotMatch(page, />Previsão<\/b>/);
  assert.doesNotMatch(page, /Nenhum valor foi estimado manualmente/);
});

test("rain accumulation keeps the necessary observed-versus-forecast warning concise", () => {
  assert.match(accumulation, /Chuva medida e prevista/);
  assert.match(accumulation, /Chuva medida hoje/);
  assert.match(accumulation, /Previsto para hoje/);
  assert.match(accumulation, /Não some os dois valores/);
  assert.match(accumulation, /podem incluir parte do mesmo período/);
  assert.match(accumulation, /Chuva em 24 horas nas estações próximas/);
  assert.match(accumulation, /Cada valor pertence à estação indicada/);
  assert.doesNotMatch(accumulation, /respondem a perguntas diferentes/);
  assert.doesNotMatch(accumulation, /a soma criaria um total enganoso/);
});

test("hourly rain volume states forecast status once instead of explaining every metric", () => {
  assert.match(hourlyVolume, /Volume de chuva por hora/);
  assert.match(hourlyVolume, /Milímetros previstos nas próximas 12 horas\. Não é chuva já medida/);
  assert.match(hourlyVolume, /Total em 12 h/);
  assert.match(hourlyVolume, /Maior volume em 1 h/);
  assert.match(hourlyVolume, /Horas com 0,1 mm ou mais/);
  assert.match(hourlyVolume, /Primeiro volume/);
  assert.doesNotMatch(hourlyVolume, /Além da chance percentual/);
  assert.doesNotMatch(hourlyVolume, /grandezas diferentes e podem mudar/);
});

test("rain experience uses the current Home rail", () => {
  assert.match(shellStyles, /--internal-weather-frame-max:\s*var\(--tp-home-container-max, 1440px\)/);
  assert.match(shellStyles, /--internal-weather-section-padding:\s*clamp\(24px, 3vw, 34px\)/);
  assert.match(shellStyles, /\.internal-weather-shell--rain \.rain-retail-hero__inner[\s\S]*width:\s*100%[\s\S]*max-width:\s*none/);
  assert.doesNotMatch(heroStyles, /max-width:\s*var\(--internal-weather-frame-max\)/);
});

test("rain page refinement removes decorative body chrome without flattening functional charts", () => {
  assert.match(refinement, /grid-template-columns:\s*repeat\(6, minmax\(0, 1fr\)\)/);
  assert.match(refinement, /\.rain-v2-page \.eyebrow/);
  assert.match(refinement, /\.rain-accumulation \.eyebrow/);
  assert.match(refinement, /box-shadow:\s*none/);
  assert.match(refinement, /\.rain-hourly-volume-context/);
  assert.doesNotMatch(refinement, /rain-v2-overview/);
  assert.doesNotMatch(refinement, /radial-gradient/);
  assert.match(refinement, /@media \(forced-colors: active\)/);

  assert.match(pageStyles, /grid-template-columns:\s*repeat\(12, minmax\(0, 1fr\)\)/);
  assert.match(pageStyles, /grid-template-columns:\s*repeat\(7, minmax\(0, 1fr\)\)/);
  assert.match(pageStyles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(pageStyles, /:focus-visible/);
});

test("hourly rain volume keeps functional precipitation bars", () => {
  assert.match(hourlyVolumeStyles, /\.internal-weather-shell--rain \.rain-hourly-volume-context \{/);
  assert.match(hourlyVolumeStyles, /box-shadow:\s*none/);
  assert.doesNotMatch(hourlyVolumeStyles, /radial-gradient/);
  assert.match(hourlyVolumeStyles, /gradiente abaixo é funcional/);
  assert.match(hourlyVolumeStyles, /linear-gradient\(90deg, #18bdcd, #5e2ced\)/);
});
