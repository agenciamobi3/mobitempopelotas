import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const route = readFileSync("src/routes/previsao-7-dias-pelotas.tsx", "utf8");
const hero = readFileSync("src/components/weather/SevenDayRetailHero.tsx", "utf8");
const heroStyles = readFileSync("src/components/weather/SevenDayRetailHero.css", "utf8");
const page = readFileSync("src/components/weather/SevenDayForecastPageV2.tsx", "utf8");
const pageStyles = readFileSync("src/components/weather/SevenDayForecastPageV2.css", "utf8");
const editorialRefinement = readFileSync(
  "src/components/weather/SevenDayForecastEditorialRefinement.css",
  "utf8",
);
const shellStyles = readFileSync("src/components/layout/InternalWeatherPageShell.css", "utf8");
const bridge = readFileSync("src/components/weather/ForecastHorizonBridge.tsx", "utf8");

const remValues = [...pageStyles.matchAll(/font-size:\s*(0\.\d+)rem/g)].map((match) =>
  Number(match[1]),
);

test("seven day route keeps one forecast surface with the editorial refinement", () => {
  assert.match(route, /InternalWeatherPageShell/);
  assert.match(route, /SevenDayRetailHero/);
  assert.match(route, /SevenDayForecastPageV2/);
  assert.match(route, /SevenDayForecastEditorialRefinement\.css/);
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

test("weekly hero is editorial, search-oriented and free of the old retail photo panel", () => {
  assert.match(hero, /weather\.daily\.slice\(0, 7\)/);
  assert.match(hero, /Previsão de 7 dias para Pelotas/);
  assert.match(hero, /Temperaturas entre \$\{minimum\}° e \$\{maximum\}°/);
  assert.match(hero, /Tendência da semana/);
  assert.match(hero, /Temperaturas/);
  assert.match(hero, /Chuva/);
  assert.match(hero, /Rajadas/);
  assert.doesNotMatch(hero, /Fonte principal:/);
  assert.doesNotMatch(hero, /sourceName/);
  assert.match(hero, /Sem aviso oficial para Pelotas/);
  assert.match(hero, /seven-day-retail-hero__summary/);
  assert.match(hero, /seven-day-retail-hero__facts/);
  assert.match(hero, /<h1/);
  assert.doesNotMatch(hero, /getRetailWeatherPhoto/);
  assert.doesNotMatch(hero, /today-retail-hero/);
  assert.doesNotMatch(hero, /current-photo/);
  assert.doesNotMatch(hero, /photo-credit/);
  assert.doesNotMatch(hero, /seven-day-retail-hero__tiles/);
  assert.doesNotMatch(hero, /Ver dia a dia|Ver chuva e rajadas/);
  assert.doesNotMatch(hero, /weather\.current\.temperature/);
});

test("weekly empty and zero states do not invent weather highlights", () => {
  assert.match(hero, /const hasDailyForecast = days\.length > 0/);
  assert.match(hero, /Previsão semanal em atualização/);
  assert.match(hero, /const rainyDays = days\.filter/);
  assert.match(hero, /function highestRainChance/);
  assert.match(hero, /function strongestGust/);
  assert.match(hero, /Sem destaque de chuva/);
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

test("weekly page keeps direct section titles and the comparative data", () => {
  assert.match(page, /weather\.daily\.slice\(0, 7\)/);
  assert.match(page, /InternalPageChapters/);
  assert.match(page, /Previsão dos próximos 7 dias/);
  assert.match(page, /Temperaturas nos próximos 7 dias/);
  assert.match(page, /Chuva e rajadas nos próximos 7 dias/);
  assert.match(page, /INMET e UFPel nos próximos dias/);
  assert.match(page, /Instituto Nacional de Meteorologia/);
  assert.match(page, /Centro de Pesquisas e Previsões Meteorológicas da UFPel/);
  assert.match(page, /rainRanking/);
  assert.match(page, /windRanking/);
  assert.match(page, /--week-low/);
  assert.match(page, /Atualizado em \{formatDateTime\(weather\.source\.fetchedAt\)\} · Fonte principal/);
  assert.doesNotMatch(page, /panorama-da-semana/);
  assert.doesNotMatch(page, /Resumo da semana|Resumo dos próximos 7 dias/);
  assert.doesNotMatch(page, /<h1/);
  assert.doesNotMatch(page, /ForecastPageHeader/);
});

test("weekly chapter navigation is reduced to an editorial index", () => {
  assert.match(editorialRefinement, /\.internal-weather-shell--seven-day \.internal-page-chapters/);
  assert.match(editorialRefinement, /border-radius:\s*0/);
  assert.match(editorialRefinement, /background:\s*transparent/);
  assert.match(editorialRefinement, /box-shadow:\s*none/);
  assert.match(
    editorialRefinement,
    /\.internal-page-chapters a > span,[\s\S]*\.internal-page-chapters a > small[\s\S]*display:\s*none/,
  );
  assert.match(editorialRefinement, /overflow-x:\s*auto/);
});

test("weekly content opens the major sections while keeping daily cards comparable", () => {
  assert.match(
    editorialRefinement,
    /\.seven-day-v2-days,[\s\S]*\.seven-day-v2-official[\s\S]*border-radius:\s*0[\s\S]*background:\s*transparent[\s\S]*box-shadow:\s*none/,
  );
  assert.match(editorialRefinement, /\.seven-day-v2-days__grid > article[\s\S]*border-radius:\s*12px/);
  assert.match(
    editorialRefinement,
    /\.seven-day-v2-trend__list article[\s\S]*border-radius:\s*0[\s\S]*background:\s*transparent/,
  );
  assert.match(
    editorialRefinement,
    /\.seven-day-v2-risks__grid,[\s\S]*\.seven-day-v2-official__grid[\s\S]*border-top:[\s\S]*border-bottom:/,
  );
  assert.match(editorialRefinement, /\.seven-day-v2-related a[\s\S]*border-radius:\s*0[\s\S]*background:\s*transparent/);
});

test("weekly related links do not add generic labels before the destination", () => {
  assert.match(page, /aria-label="Outras previsões de Pelotas"/);
  assert.match(page, /<strong>Tempo hoje em Pelotas<\/strong>/);
  assert.match(page, /<strong>Tempo amanhã em Pelotas<\/strong>/);
  assert.doesNotMatch(page, /Condição atual e próximas horas/);
  assert.doesNotMatch(page, /Próximo dia em detalhes/);
});

test("15-day bridge keeps only the useful horizon warning", () => {
  assert.match(bridge, /Previsão para os próximos 15 dias/);
  assert.match(bridge, /A segunda semana tem mais incerteza/);
  assert.match(bridge, /Ver 15 dias/);
  assert.doesNotMatch(bridge, /Quer olhar mais adiante/);
  assert.doesNotMatch(bridge, /A janela estendida mantém/);
});

test("weekly hero owns its rail instead of inheriting the generic shell width", () => {
  assert.match(
    shellStyles,
    /--internal-weather-frame-max:\s*var\(--tp-home-container-max, 1440px\)/,
  );
  assert.doesNotMatch(
    shellStyles,
    /\.internal-weather-shell--seven-day \.seven-day-retail-hero__inner/,
  );
  assert.match(
    heroStyles,
    /\.internal-weather-shell--seven-day \.seven-day-retail-hero__inner[\s\S]*--tp-home-container-max, 1440px[\s\S]*--tp-home-container-gutter, 48px[\s\S]*margin-inline:\s*auto/,
  );
  assert.match(
    editorialRefinement,
    /\.internal-weather-main > \.tp-home-alert[\s\S]*--tp-home-container-max, 1440px/,
  );
});

test("weekly visual system is readable, compact and responsive", () => {
  assert.match(heroStyles, /Hero editorial compacto/);
  assert.match(heroStyles, /\.seven-day-retail-hero::before[\s\S]*radial-gradient[\s\S]*linear-gradient/);
  assert.match(heroStyles, /grid-template-columns:\s*minmax\(0, 0\.9fr\) minmax\(500px, 0\.82fr\)/);
  assert.match(
    heroStyles,
    /\.seven-day-retail-hero__facts[\s\S]*grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\)[\s\S]*border-top:[\s\S]*border-bottom:/,
  );
  assert.match(heroStyles, /@media \(max-width: 1100px\)/);
  assert.match(heroStyles, /@media \(max-width: 720px\)/);
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
