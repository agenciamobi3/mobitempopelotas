import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const route = readFileSync("src/routes/previsao-7-dias-pelotas.tsx", "utf8");
const hero = readFileSync("src/components/weather/SevenDayRetailHero.tsx", "utf8");
const heroStyles = readFileSync("src/components/weather/SevenDayRetailHero.css", "utf8");
const page = readFileSync("src/components/weather/SevenDayForecastPageV2.tsx", "utf8");
const pageStyles = readFileSync("src/components/weather/SevenDayForecastPageV2.css", "utf8");
const shellStyles = readFileSync("src/components/layout/InternalWeatherPageShell.css", "utf8");
const bridge = readFileSync("src/components/weather/ForecastHorizonBridge.tsx", "utf8");

const remValues = [...pageStyles.matchAll(/font-size:\s*(0\.\d+)rem/g)].map((match) =>
  Number(match[1]),
);

test("seven day route keeps one forecast surface without a duplicate editorial explainer", () => {
  assert.match(route, /InternalWeatherPageShell/);
  assert.match(route, /SevenDayRetailHero/);
  assert.match(route, /SevenDayForecastPageV2/);
  assert.match(route, /ForecastHorizonBridge/);
  assert.match(route, /pageClassName="internal-weather-shell--seven-day"/);
  assert.match(route, /hero=\{\(\{ weather: productionWeather, advisoryLevel, officialAlertCount \}\)/);
  assert.match(route, /Veja a previsão de 7 dias em Pelotas/);
  assert.doesNotMatch(route, /EditorialContentSection/);
  assert.doesNotMatch(route, /SEVEN_DAY_PAGE_CONTENT/);
  assert.doesNotMatch(route, /Como interpretar a previsão dos próximos 7 dias/);
  assert.doesNotMatch(route, /createFaqPageJsonLd/);
  assert.doesNotMatch(route, /SevenDayForecastPage\s/);
  assert.doesNotMatch(route, /components\/weather\/ForecastPages/);
});

test("weekly hero stays search-oriented and goes straight to the weekly values", () => {
  assert.match(hero, /weather\.daily\.slice\(0, 7\)/);
  assert.match(hero, /getRetailWeatherPhoto/);
  assert.match(hero, /Previsão de <span>7 dias<\/span> para Pelotas/);
  assert.match(hero, /Temperaturas entre \$\{minimum\}° e \$\{maximum\}°\. Veja chuva e rajadas dia a dia\./);
  assert.match(hero, /Menor mínima/);
  assert.match(hero, /Maior chance de chuva/);
  assert.match(hero, /Rajada mais forte/);
  assert.match(hero, /Temperaturas na semana/);
  assert.match(hero, /Maior volume de chuva/);
  assert.match(hero, /Fonte da previsão/);
  assert.match(hero, /today-retail-hero__current-photo/);
  assert.match(hero, /today-retail-hero__photo-credit/);
  assert.match(hero, /<h1/);
  assert.doesNotMatch(hero, /Próximos 7 dias · Pelotas/);
  assert.doesNotMatch(hero, /Compare mínima e máxima/);
  assert.doesNotMatch(hero, /Confirme novamente os dias mais distantes/);
  assert.doesNotMatch(hero, /Sua semana em Pelotas/);
  assert.doesNotMatch(hero, /weather\.current\.temperature/);
});

test("weekly empty and zero states do not invent weather highlights", () => {
  assert.match(hero, /const hasDailyForecast = days\.length > 0/);
  assert.match(hero, /Previsão semanal em atualização/);
  assert.match(hero, /Dados da semana em atualização/);
  assert.match(hero, /const hasPositiveRainVolume =/);
  assert.match(hero, /Sem volume previsto/);
  assert.match(hero, /const rainChanceDays = days\.filter/);
  assert.match(hero, /const gustDays = days\.filter/);
  assert.match(hero, /Sem rajadas/);
  assert.match(page, /\.filter\(hasPositiveRain\)/);
  assert.match(page, /\.filter\(hasPositiveGust\)/);
  assert.match(page, /Sem chuva prevista nos valores atuais/);
  assert.match(page, /Sem rajadas previstas nos próximos dias/);
  assert.match(page, /if \(day\.windGust <= 0\) return "Sem rajadas"/);
  assert.match(page, /Ainda não há dados suficientes para mostrar os próximos dias/);
});

test("weekly day badges keep only useful status labels", () => {
  assert.match(page, /if \(tone === "high"\) return "Mais chuva\/vento"/);
  assert.match(page, /if \(tone === "attention"\) return "Acompanhar"/);
  assert.match(page, /return null/);
  assert.doesNotMatch(page, /return "Sem destaque"/);
  assert.match(page, /const badge = index === 0 \? "Hoje" : index === 1 \? "Amanhã" : toneLabel\(tone\)/);
  assert.match(page, /\{badge \? <b>\{badge\}<\/b> : null\}/);
});

test("weekly temperature ties remain explicit", () => {
  assert.match(page, /const warmestDays = days\.filter\(\(day\) => day\.max === maximum\)/);
  assert.match(page, /const coldestDays = days\.filter\(\(day\) => day\.min === minimum\)/);
  assert.match(page, /empate em \$\{warmestDays\.length\} dias/);
  assert.match(page, /empate em \$\{coldestDays\.length\} dias/);
});

test("weekly page removes the duplicate summary and uses direct section titles", () => {
  assert.match(page, /weather\.daily\.slice\(0, 7\)/);
  assert.match(page, /InternalPageChapters/);
  assert.match(page, /Previsão dos próximos 7 dias/);
  assert.match(page, /Temperaturas nos próximos 7 dias/);
  assert.match(page, /Chuva e rajadas nos próximos 7 dias/);
  assert.match(page, /INMET e UFPel nos próximos dias/);
  assert.match(page, /rainRanking/);
  assert.match(page, /windRanking/);
  assert.match(page, /--week-low/);
  assert.match(page, /Atualizado em \{formatDateTime\(weather\.source\.fetchedAt\)\} · Fonte principal/);
  assert.doesNotMatch(page, /panorama-da-semana/);
  assert.doesNotMatch(page, /Resumo da semana|Resumo dos próximos 7 dias/);
  assert.doesNotMatch(page, /Previsão diária/);
  assert.doesNotMatch(page, /Temperaturas da semana/);
  assert.doesNotMatch(page, /Outras previsões disponíveis/);
  assert.doesNotMatch(page, /O que INMET e CPPMet\/UFPel publicam/);
  assert.doesNotMatch(page, /Menor chance de chuva e rajadas/);
  assert.doesNotMatch(page, /attentionDay|riskScore|rainSummary|gustSummary/);
  assert.doesNotMatch(page, /<h1/);
  assert.doesNotMatch(page, /ForecastPageHeader/);
  assert.doesNotMatch(page, /forecast-seven-day-list/);
});

test("weekly related links do not add generic labels before the destination", () => {
  assert.match(page, /aria-label="Outras previsões de Pelotas"/);
  assert.match(page, /<strong>Tempo hoje em Pelotas<\/strong>/);
  assert.match(page, /<strong>Tempo amanhã em Pelotas<\/strong>/);
  assert.doesNotMatch(page, /Condição atual e próximas horas/);
  assert.doesNotMatch(page, /Próximo dia em detalhes/);
  assert.doesNotMatch(page, /Chance e volume<\/small>/);
  assert.doesNotMatch(page, /Velocidade e rajadas<\/small>/);
});

test("15-day bridge keeps only the useful horizon warning", () => {
  assert.match(bridge, /Previsão para os próximos 15 dias/);
  assert.match(bridge, /A segunda semana tem mais incerteza/);
  assert.match(bridge, /Ver 15 dias/);
  assert.doesNotMatch(bridge, /Quer olhar mais adiante/);
  assert.doesNotMatch(bridge, /A janela estendida mantém/);
});

test("weekly sections use the current Home rail", () => {
  assert.match(
    shellStyles,
    /--internal-weather-frame-max:\s*var\(--tp-home-container-max, 1440px\)/,
  );
  assert.match(
    shellStyles,
    /--internal-weather-section-padding:\s*clamp\(24px, 3vw, 34px\)/,
  );
  assert.match(
    shellStyles,
    /\.internal-weather-shell--seven-day \.seven-day-retail-hero__inner[\s\S]*width:\s*100%[\s\S]*max-width:\s*none/,
  );
  assert.match(shellStyles, /padding-right:\s*var\(--internal-weather-section-padding\)/);
  assert.match(shellStyles, /padding-left:\s*var\(--internal-weather-section-padding\)/);
  assert.match(
    shellStyles,
    /\.internal-weather-main > \*,[\s\S]*--tp-home-container-max, 1440px/,
  );
});

test("weekly visual system is readable and responsive", () => {
  assert.match(heroStyles, /weekly planning accent/);
  assert.match(heroStyles, /font-size:\s*clamp\(0\.75rem/);
  assert.match(heroStyles, /@media \(max-width: 920px\)/);
  assert.match(heroStyles, /@media \(max-width: 700px\)/);
  assert.match(heroStyles, /@media \(forced-colors: active\)/);
  assert.ok(remValues.every((value) => value >= 0.72), "microtext must stay readable");
  assert.match(pageStyles, /grid-template-columns:\s*repeat\(7, minmax\(0, 1fr\)\)/);
  assert.match(pageStyles, /content-visibility:\s*auto/);
  assert.match(pageStyles, /@media \(max-width: 1280px\)/);
  assert.match(pageStyles, /@media \(max-width: 900px\)/);
  assert.match(pageStyles, /@media \(max-width: 560px\)/);
  assert.match(pageStyles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(pageStyles, /@media \(forced-colors: active\)/);
  assert.match(pageStyles, /:focus-visible/);
});
