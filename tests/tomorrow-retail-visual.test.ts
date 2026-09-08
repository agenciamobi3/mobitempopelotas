import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const route = readFileSync("src/routes/tempo-amanha-pelotas.tsx", "utf8");
const hero = readFileSync("src/components/weather/TomorrowRetailHero.tsx", "utf8");
const heroStyles = readFileSync("src/components/weather/TomorrowRetailHero.css", "utf8");
const page = readFileSync("src/components/weather/TomorrowForecastPageV3.tsx", "utf8");
const pageStyles = readFileSync("src/components/weather/TomorrowForecastPageV3.css", "utf8");
const shellStyles = readFileSync("src/components/layout/InternalWeatherPageShell.css", "utf8");
const photoMap = readFileSync(
  "src/components/weather/today-retail-hero-backgrounds.ts",
  "utf8",
);

test("tomorrow route uses the shared shell with a dedicated editorial hero", () => {
  assert.match(route, /InternalWeatherPageShell/);
  assert.match(route, /TomorrowRetailHero/);
  assert.match(route, /TomorrowForecastPageV3/);
  assert.match(route, /pageClassName="internal-weather-shell--tomorrow"/);
  assert.match(route, /hero=\{\(\{ weather: productionWeather, advisoryLevel, officialAlertCount \}\)/);
  assert.match(route, /Veja a previsão do tempo para amanhã em Pelotas/);
  assert.doesNotMatch(route, /TomorrowForecastPageV2/);
  assert.doesNotMatch(route, /showOfficialAlerts=\{false\}/);
  assert.doesNotMatch(route, /EditorialContentSection|como-interpretar-amanha/);
});

test("tomorrow hero uses a clean search-oriented headline and three essential facts", () => {
  assert.match(hero, /weather\.daily\[1\]/);
  assert.match(hero, /Tempo amanhã em Pelotas/);
  assert.match(hero, /Condição prevista/);
  assert.match(hero, /Temperatura/);
  assert.match(hero, /Chuva/);
  assert.match(hero, /Rajadas/);
  assert.match(hero, /Fonte principal:/);
  assert.match(hero, /Sem aviso oficial para Pelotas/);
  assert.match(hero, /tomorrow-retail-hero__summary/);
  assert.match(hero, /tomorrow-retail-hero__facts/);
  assert.match(hero, /<h1/);
  assert.doesNotMatch(hero, /getRetailWeatherPhoto/);
  assert.doesNotMatch(hero, /today-retail-hero__current-photo/);
  assert.doesNotMatch(hero, /today-retail-hero__photo-credit/);
  assert.doesNotMatch(hero, /today-retail-hero__tiles/);
  assert.doesNotMatch(hero, /Ver detalhes de amanhã/);
  assert.doesNotMatch(hero, /organizado para você planejar|o que pode mudar sua rotina/);
  assert.doesNotMatch(hero, /weather\.current\.temperature/);
});

test("tomorrow hero formats the calendar badge from the ISO identity", () => {
  assert.match(hero, /day\.dateIso/);
  assert.match(hero, /new Date\(`\$\{day\.dateIso\}T12:00:00-03:00`\)/);
  assert.doesNotMatch(hero, /day\.date\.slice\(0, 10\)/);
});

test("retail photography remains available to the pages that still use it", () => {
  assert.match(photoMap, /getRetailWeatherPhoto/);
  assert.match(photoMap, /getTodayRetailHeroPhoto = getRetailWeatherPhoto/);
  assert.match(photoMap, /Amanhecer_na_Praia_do_Laranjal/);
  assert.match(photoMap, /Sunset_over_Calm_Lake/);
  assert.match(photoMap, /Heavy_Rain/);
  assert.doesNotMatch(hero, /today-retail-hero-backgrounds/);
});

test("tomorrow content uses direct language without generic section tags", () => {
  assert.match(page, /weather\.daily\[1\]/);
  assert.match(page, /InternalPageChapters/);
  assert.match(page, /Hoje x amanhã/);
  assert.match(page, /O que observar amanhã/);
  assert.match(page, /INMET e UFPel para amanhã/);
  assert.match(page, /Perguntas sobre amanhã/);
  assert.match(page, /Confira amanhã cedo/);
  assert.match(page, /dayWeatherSummary/);
  assert.match(page, /formatPercentDelta/);
  assert.match(page, /Previsão de 15 dias/);

  assert.doesNotMatch(page, /Amanhã em resumo/);
  assert.doesNotMatch(page, /Hoje e amanhã/);
  assert.doesNotMatch(page, /Para organizar o próximo dia/);
  assert.doesNotMatch(page, /Outras previsões disponíveis/);
  assert.doesNotMatch(page, /Respostas rápidas/);
  assert.doesNotMatch(page, /Como o tempo de amanhã deve mudar em relação a hoje/);
  assert.doesNotMatch(page, /Como se preparar para o tempo de amanhã/);
  assert.doesNotMatch(page, /O que INMET e CPPMet\/UFPel publicam para amanhã/);
  assert.doesNotMatch(page, /Dúvidas sobre o tempo de amanhã em Pelotas/);
  assert.doesNotMatch(page, /As respostas usam os dados disponíveis para amanhã/);
  assert.doesNotMatch(page, /Transforme a previsão em decisões simples|contexto complementar|novas rodadas/);
});

test("tomorrow zero states do not invent gusts or erase positive rain volume", () => {
  assert.match(page, /function gustPhrase/);
  assert.match(page, /if \(value <= 0\) return "sem rajadas previstas"/);
  assert.match(page, /function gustTitle/);
  assert.match(page, /if \(value <= 0\) return "Sem rajadas"/);
  assert.match(page, /function formatWindDelta/);
  assert.match(page, /if \(value === 0\) return "Sem mudança"/);
  assert.match(page, /day\.precipitationMm > 0/);
  assert.match(page, /\$\{day\.rainChance\}% de chance e \$\{day\.precipitationMm\} mm previstos/);
  assert.match(page, /tomorrow\.windGust <= 0/);
  assert.match(page, /Sem rajadas previstas\./);
});

test("tomorrow content matches official sources by stable ISO date", () => {
  assert.match(page, /localForecastDateKey/);
  assert.match(page, /day\.dateIso \?\? localForecastDateKey/);
  assert.match(page, /tomorrow\.dateIso \?\? localForecastDateKey\(1\)/);
  assert.match(page, /period\.date\?\.slice\(0, 10\) === tomorrowDate/);
  assert.doesNotMatch(page, /tomorrow\.date\.slice\(0, 10\)/);
  assert.doesNotMatch(page, /day\.date\.slice\(0, 10\)/);
});

test("tomorrow content remains comparative and source-aware", () => {
  assert.match(page, /buildPlanningCards/);
  assert.match(page, /forecastWeekdayKey/);
  assert.match(page, /CPPMet \/ UFPel/);
  assert.match(page, /INMET · \{period\.period\}/);
  assert.match(page, /FAQPage/);
  assert.match(page, /Ainda não há previsão detalhada para amanhã/);
  assert.match(page, /Fonte principal:/);
  assert.doesNotMatch(page, /Nenhum valor foi estimado manualmente/);
  assert.doesNotMatch(page, /<h1/);
  assert.doesNotMatch(page, /daily-hero/);
  assert.doesNotMatch(page, /daily-condition-card/);
});

test("tomorrow sections use the current Home rail", () => {
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
    /\.internal-weather-shell--tomorrow \.tomorrow-retail-hero__inner[\s\S]*width:\s*100%[\s\S]*max-width:\s*none/,
  );
  assert.match(shellStyles, /padding-right:\s*var\(--internal-weather-section-padding\)/);
  assert.match(shellStyles, /padding-left:\s*var\(--internal-weather-section-padding\)/);
  assert.match(
    shellStyles,
    /\.internal-weather-main > \*,[\s\S]*--tp-home-container-max, 1440px/,
  );
});

test("tomorrow visual system follows the clean historical hero language", () => {
  assert.match(heroStyles, /Hero editorial limpo/);
  assert.match(heroStyles, /\.tomorrow-retail-hero::before[\s\S]*radial-gradient[\s\S]*linear-gradient/);
  assert.match(heroStyles, /grid-template-columns:\s*minmax\(0, 1\.08fr\) minmax\(360px, 0\.72fr\)/);
  assert.match(heroStyles, /\.tomorrow-retail-hero__facts article[\s\S]*background:\s*rgb\(255 255 255 \/ 64%\)/);
  assert.match(heroStyles, /\.tomorrow-retail-hero--attention::before/);
  assert.match(heroStyles, /\.tomorrow-retail-hero--warning::before/);
  assert.match(heroStyles, /@media \(max-width: 980px\)/);
  assert.match(heroStyles, /@media \(max-width: 720px\)/);
  assert.match(heroStyles, /@media \(forced-colors: active\)/);
  assert.doesNotMatch(heroStyles, /today-retail-hero__current-photo/);
  assert.doesNotMatch(heroStyles, /tomorrow-retail-hero__tiles/);
  assert.match(pageStyles, /content-visibility:\s*auto/);
  assert.match(pageStyles, /grid-template-columns:\s*repeat\(4, minmax\(0, 1fr\)\)/);
  assert.match(pageStyles, /@media \(max-width: 1120px\)/);
  assert.match(pageStyles, /@media \(max-width: 900px\)/);
  assert.match(pageStyles, /@media \(max-width: 700px\)/);
  assert.match(pageStyles, /@media \(max-width: 460px\)/);
  assert.match(pageStyles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(pageStyles, /@media \(forced-colors: active\)/);
  assert.match(pageStyles, /:focus-visible/);
});
