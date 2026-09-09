import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const route = readFileSync("src/routes/tempo-amanha-pelotas.tsx", "utf8");
const hero = readFileSync("src/components/weather/TomorrowRetailHero.tsx", "utf8");
const heroStyles = readFileSync("src/components/weather/TomorrowRetailHero.css", "utf8");
const page = readFileSync("src/components/weather/TomorrowForecastPageV3.tsx", "utf8");
const pageStyles = readFileSync("src/components/weather/TomorrowForecastPageV3.css", "utf8");
const editorialRefinement = readFileSync(
  "src/components/weather/TomorrowForecastEditorialRefinement.css",
  "utf8",
);
const shellStyles = readFileSync("src/components/layout/InternalWeatherPageShell.css", "utf8");

test("tomorrow route uses the shared shell with a dedicated editorial hero", () => {
  assert.match(route, /InternalWeatherPageShell/);
  assert.match(route, /TomorrowRetailHero/);
  assert.match(route, /TomorrowForecastPageV3/);
  assert.match(route, /TomorrowForecastEditorialRefinement\.css/);
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
  assert.doesNotMatch(hero, /Fonte principal:/);
  assert.doesNotMatch(hero, /sourceName = weather\.source/);
  assert.match(hero, /Sem aviso oficial para Pelotas/);
  assert.match(hero, /tomorrow-retail-hero__summary/);
  assert.match(hero, /tomorrow-retail-hero__facts/);
  assert.match(hero, /<h1/);
  assert.doesNotMatch(hero, /getRetailWeatherPhoto|today-retail-hero-backgrounds/);
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

test("tomorrow chapter navigation is visually reduced to an editorial index", () => {
  assert.match(editorialRefinement, /\.internal-weather-shell--tomorrow \.internal-page-chapters/);
  assert.match(editorialRefinement, /border-radius:\s*0/);
  assert.match(editorialRefinement, /background:\s*transparent/);
  assert.match(editorialRefinement, /box-shadow:\s*none/);
  assert.match(
    editorialRefinement,
    /\.internal-page-chapters a > span,[\s\S]*\.internal-page-chapters a > small[\s\S]*display:\s*none/,
  );
  assert.match(editorialRefinement, /overflow-x:\s*auto/);
  assert.match(editorialRefinement, /@media \(max-width: 760px\)/);
});

test("tomorrow overview repeats facts as a flat reading strip instead of cards", () => {
  assert.match(
    editorialRefinement,
    /\.internal-weather-shell--tomorrow \.tomorrow-v3-overview__cards[\s\S]*border-top:[\s\S]*border-bottom:/,
  );
  assert.match(
    editorialRefinement,
    /\.tomorrow-v3-overview__cards article,[\s\S]*\.tomorrow-v3-overview__cards article\.is-caution[\s\S]*border-radius:\s*0[\s\S]*background:\s*transparent[\s\S]*box-shadow:\s*none/,
  );
  assert.match(
    editorialRefinement,
    /@media \(max-width: 760px\)[\s\S]*\.tomorrow-v3-overview__cards[\s\S]*grid-template-columns:\s*1fr/,
  );
});

test("tomorrow first fold keeps the official alert on the same compact rail", () => {
  assert.match(
    editorialRefinement,
    /\.internal-weather-shell--tomorrow \.internal-weather-main \{[\s\S]*padding-top:\s*clamp\(12px, 1\.5vw, 18px\)/,
  );
  assert.match(
    editorialRefinement,
    /\.internal-weather-main > \.tp-home-alert[\s\S]*--tp-home-container-max, 1440px[\s\S]*--tp-home-container-gutter, 48px[\s\S]*margin:\s*0 auto[\s\S]*padding:\s*14px 0 15px/,
  );
  assert.match(
    editorialRefinement,
    /@media \(max-width: 1240px\)[\s\S]*\.internal-weather-main > \.tp-home-alert[\s\S]*--tp-home-container-compact-max, 1180px/,
  );
  assert.match(
    editorialRefinement,
    /@media \(max-width: 760px\)[\s\S]*\.internal-weather-main > \.tp-home-alert[\s\S]*--tp-home-container-mobile-gutter, 20px/,
  );
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

test("tomorrow normalizes abbreviated weekdays before matching CPPMet textual forecast", () => {
  assert.match(page, /dom:\s*"domingo"/);
  assert.match(page, /seg:\s*"segunda"/);
  assert.match(page, /ter:\s*"terca"/);
  assert.match(page, /qua:\s*"quarta"/);
  assert.match(page, /qui:\s*"quinta"/);
  assert.match(page, /sex:\s*"sexta"/);
  assert.match(page, /sab:\s*"sabado"/);
  assert.match(page, /aliases\[normalized\] \?\? normalized/);
});

test("tomorrow official context is only public when real source content exists", () => {
  assert.match(page, /const hasOfficialContext = inmetPeriods\.length > 0 \|\| Boolean\(cppmetContext\)/);
  assert.match(page, /buildChapters\(hasOfficialContext\)/);
  assert.match(page, /\{hasOfficialContext \? \([\s\S]*id="contexto-oficial-amanha"/);
  assert.doesNotMatch(page, /Sem previsão específica do INMET ou da UFPel para amanhã/);
  assert.doesNotMatch(page, /A previsão principal acima continua disponível/);
  assert.doesNotMatch(page, /to="\/status-dos-dados">Dados e fontes/);
});

test("tomorrow content remains comparative and source-aware", () => {
  assert.match(page, /buildPlanningCards/);
  assert.match(page, /forecastWeekdayKey/);
  assert.match(page, /CPPMet \/ UFPel/);
  assert.match(page, /INMET · \{period\.period\}/);
  assert.match(page, /FAQPage/);
  assert.match(page, /Ainda não há previsão detalhada para amanhã/);
  assert.doesNotMatch(page, /Fonte principal:/);
  assert.doesNotMatch(page, /Nenhum valor foi estimado manualmente/);
  assert.doesNotMatch(page, /<h1/);
  assert.doesNotMatch(page, /daily-hero/);
  assert.doesNotMatch(page, /daily-condition-card/);
});

test("tomorrow hero owns its container rail without a generic shell override", () => {
  assert.match(
    shellStyles,
    /--internal-weather-frame-max:\s*var\(--tp-home-container-max, 1440px\)/,
  );
  assert.doesNotMatch(
    shellStyles,
    /\.internal-weather-shell--tomorrow \.tomorrow-retail-hero__inner/,
  );
  assert.match(
    heroStyles,
    /\.internal-weather-shell--tomorrow \.tomorrow-retail-hero__inner[\s\S]*--tp-home-container-max, 1440px[\s\S]*--tp-home-container-gutter, 48px[\s\S]*margin-inline:\s*auto/,
  );
  assert.match(
    shellStyles,
    /\.internal-weather-main > \*,[\s\S]*--tp-home-container-max, 1440px/,
  );
});

test("tomorrow visual system follows the compact historical hero language", () => {
  assert.match(heroStyles, /Hero editorial compacto/);
  assert.match(heroStyles, /\.tomorrow-retail-hero::before[\s\S]*radial-gradient[\s\S]*linear-gradient/);
  assert.match(heroStyles, /grid-template-columns:\s*minmax\(0, 0\.92fr\) minmax\(460px, 0\.78fr\)/);
  assert.match(
    heroStyles,
    /\.tomorrow-retail-hero__facts \{[\s\S]*grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\)[\s\S]*border-top:[\s\S]*border-bottom:/,
  );
  assert.match(
    heroStyles,
    /\.tomorrow-retail-hero__facts article \{[\s\S]*border-radius:\s*0[\s\S]*background:\s*transparent[\s\S]*box-shadow:\s*none/,
  );
  assert.match(heroStyles, /\.tomorrow-retail-hero--attention::before/);
  assert.match(heroStyles, /\.tomorrow-retail-hero--warning::before/);
  assert.match(heroStyles, /@media \(max-width: 1100px\)/);
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
