import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const todayRoute = readFileSync("src/routes/tempo-hoje-pelotas.tsx", "utf8");
const tomorrowRoute = readFileSync("src/routes/tempo-amanha-pelotas.tsx", "utf8");
const sevenDayRoute = readFileSync("src/routes/previsao-7-dias-pelotas.tsx", "utf8");
const rainRoute = readFileSync("src/routes/chuva-em-pelotas.tsx", "utf8");
const windRoute = readFileSync("src/routes/vento-em-pelotas.tsx", "utf8");
const todayComponent = readFileSync("src/components/weather/TodayForecastPageV5.tsx", "utf8");
const todayEditorialStyles = readFileSync(
  "src/components/weather/TodayForecastEditorialRefinement.css",
  "utf8",
);
const todayRetailHero = readFileSync("src/components/weather/TodayRetailHero.tsx", "utf8");
const todayHeroStyles = readFileSync("src/components/weather/TodayEditorialHero.css", "utf8");
const internalShell = readFileSync("src/components/layout/InternalWeatherPageShell.tsx", "utf8");
const internalShellStyles = readFileSync("src/components/layout/InternalWeatherPageShell.css", "utf8");
const homeForecastStory = readFileSync("src/components/weather/HomeForecastStory.tsx", "utf8");
const todayResources = readFileSync("src/components/weather/TodayWeatherResources.tsx", "utf8");
const todayResourceStyles = readFileSync("src/components/weather/TodayWeatherResources.css", "utf8");
const internalWidgets = readFileSync("src/components/weather/InternalWeatherWidgets.tsx", "utf8");
const internalWidgetStyles = readFileSync("src/components/weather/InternalWeatherWidgets.css", "utf8");
const siteLayout = readFileSync("src/components/layout/SiteLayout.tsx", "utf8");

test("today forecast delegates the complete page frame to the shared internal weather shell", () => {
  assert.match(todayRoute, /InternalWeatherPageShell/);
  assert.match(todayRoute, /TodayRetailHero/);
  assert.match(todayRoute, /TodayForecastPageV5/);
  assert.match(todayRoute, /TodayForecastEditorialRefinement\.css/);
  assert.match(todayRoute, /EditorialContentSection/);
  assert.doesNotMatch(todayRoute, /WeatherHero/);
  assert.doesNotMatch(todayRoute, /SiteHeader/);
  assert.doesNotMatch(todayRoute, /SiteFooter/);
});

test("internal weather pages own one shell without duplicated global chrome", () => {
  const routes = [todayRoute, tomorrowRoute, sevenDayRoute, rainRoute, windRoute];
  for (const route of routes) {
    assert.match(route, /InternalWeatherPageShell/);
    assert.match(route, /pageClassName="internal-weather-shell--/);
  }

  for (const pathname of [
    "/tempo-hoje-pelotas",
    "/tempo-amanha-pelotas",
    "/previsao-7-dias-pelotas",
    "/chuva-em-pelotas",
    "/vento-em-pelotas",
  ]) {
    assert.match(siteLayout, new RegExp(`"${pathname.replaceAll("/", "\\/")}"`));
  }
});

test("today hero owns the Home rail without the generic shell override", () => {
  assert.match(internalShell, /data-internal-weather-style="home-editorial"/);
  assert.match(internalShellStyles, /A Home é a fonte da geometria/);
  assert.doesNotMatch(
    internalShellStyles,
    /\.internal-weather-shell--today \.today-retail-hero__inner/,
  );
  assert.match(
    todayHeroStyles,
    /\.internal-weather-shell--today \.today-retail-hero__inner[\s\S]*var\(--tp-home-container-max, 1440px\)[\s\S]*margin-inline:\s*auto/,
  );
  assert.match(
    todayHeroStyles,
    /\.internal-weather-shell--today \.internal-weather-hero-frame[\s\S]*width:\s*100%[\s\S]*border:\s*0/,
  );
  assert.match(todayHeroStyles, /var\(--tp-home-container-compact-max, 1180px\)/);
  assert.match(todayHeroStyles, /var\(--tp-home-container-mobile-gutter, 20px\)/);
});

test("today hero depends only on its route-scoped editorial stylesheet", () => {
  assert.match(todayRetailHero, /import "\.\/TodayEditorialHero\.css"/);
  assert.doesNotMatch(todayRetailHero, /TodayRetailHero\.css|TodayRetailHeroPhoto\.css|TodayRetailHeroRefinement\.css/);
  assert.match(todayHeroStyles, /Prefixado pela rota/);
  assert.match(todayHeroStyles, /\.internal-weather-shell--today \.today-retail-hero/);
  assert.doesNotMatch(todayHeroStyles, /^\.today-retail-hero \{/m);
});

test("today hero separates current observation from the next-hour forecast", () => {
  assert.match(todayRetailHero, /current\.source\.kind === "observation"/);
  assert.match(todayRetailHero, /data-current-kind=\{hasObservedCurrent \? "observation"/);
  assert.match(todayRetailHero, /Leitura atual/);
  assert.match(todayRetailHero, /Previsão da próxima hora/);
  assert.match(todayRetailHero, /não substitui uma observação atual/);
  assert.match(todayRetailHero, /current\.source\.observedAt/);
  assert.match(todayRetailHero, /Fonte: \{sourceName\}/);
  assert.match(todayRetailHero, /buildObservedFacts/);
  assert.match(todayRetailHero, /buildForecastFacts/);
  assert.match(todayRetailHero, /formatWind\(current\.windSpeed, current\.windDirection\)/);
  assert.match(todayRetailHero, /formatGust\(nextHour\.windGust\)/);
  assert.doesNotMatch(todayRetailHero, /currentIsObserved/);
});

test("today hero is editorial and no longer uses photography, tiles or hero CTAs", () => {
  assert.match(todayRetailHero, /Tempo hoje · Pelotas/);
  assert.match(todayRetailHero, /Tempo hoje em Pelotas/);
  assert.match(todayRetailHero, /today-retail-hero__summary/);
  assert.match(todayRetailHero, /today-retail-hero__facts/);
  assert.match(todayRetailHero, /Sem aviso oficial listado para Pelotas/);
  assert.doesNotMatch(todayRetailHero, /getTodayRetailHeroPhoto/);
  assert.doesNotMatch(todayRetailHero, /today-retail-hero-backgrounds/);
  assert.doesNotMatch(todayRetailHero, /today-retail-hero__current-photo/);
  assert.doesNotMatch(todayRetailHero, /today-retail-hero__photo-credit/);
  assert.doesNotMatch(todayRetailHero, /today-retail-hero__tiles/);
  assert.doesNotMatch(todayRetailHero, /today-retail-hero__actions/);
  assert.doesNotMatch(todayRetailHero, /ArrowRight/);
});

test("today hero uses a compact flat fact strip and accessible breakpoints", () => {
  assert.match(
    todayHeroStyles,
    /\.internal-weather-shell--today \.today-retail-hero__facts[\s\S]*grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\)[\s\S]*border-top:[\s\S]*border-bottom:/,
  );
  assert.match(todayHeroStyles, /@media \(max-width: 1240px\)/);
  assert.match(todayHeroStyles, /@media \(max-width: 1100px\)/);
  assert.match(todayHeroStyles, /@media \(max-width: 720px\)/);
  assert.match(todayHeroStyles, /@media \(forced-colors: active\)/);
  assert.match(todayHeroStyles, /:focus-visible/);
});

test("internal today page keeps one h1 and reuses the current forecast widgets", () => {
  assert.doesNotMatch(todayComponent, /TodayRetailHero/);
  assert.doesNotMatch(todayComponent, /<h1/);
  assert.match(todayComponent, /InternalForecastStory/);
  assert.match(todayComponent, /TodayWeatherResources/);
  assert.match(todayComponent, /InternalObservationWidget/);
  assert.match(todayComponent, /TodayAtmosphericSignals/);
  assert.match(todayComponent, /InternalPracticalSummary/);
});

test("today chapter navigation stays visitor-focused and becomes a light editorial strip", () => {
  for (const label of [
    "Próximas horas",
    "Melhor período",
    "Condição atual",
    "Neblina e nuvens",
    "Para sua rotina",
    "Entenda os dados",
  ]) {
    assert.match(todayComponent, new RegExp(label));
  }
  assert.match(todayEditorialStyles, /\.internal-weather-shell--today \.internal-page-chapters/);
  assert.match(todayEditorialStyles, /border-bottom: 1px solid/);
  assert.match(todayEditorialStyles, /\.internal-page-chapters span,[\s\S]*display:\s*none/);
  assert.match(todayEditorialStyles, /@media \(max-width: 720px\)/);
});

test("today body opens the major chapters while preserving comparison structures", () => {
  for (const selector of [
    "internal-forecast-widget",
    "today-resources",
    "internal-observation-widget",
    "today-atmosphere",
    "internal-practical-widget",
    "editorial-answer-section",
  ]) {
    assert.match(todayEditorialStyles, new RegExp(selector));
  }
  assert.match(todayEditorialStyles, /border:\s*0/);
  assert.match(todayEditorialStyles, /background:\s*transparent/);
  assert.match(todayEditorialStyles, /today-resources__periods/);
  assert.match(todayEditorialStyles, /today-atmosphere__clouds/);
  assert.match(todayEditorialStyles, /internal-practical-widget__cards/);
  assert.match(internalWidgetStyles, /content-visibility:\s*auto/);
  assert.match(todayResourceStyles, /content-visibility:\s*auto/);
});

test("current observation widget discloses Defesa Civil provenance field by field", () => {
  assert.match(internalWidgets, /weather\.currentProvenance\.temperature === "defesa-civil-rs"/);
  assert.match(internalWidgets, /Medição da Rede Defesa Civil RS/);
  for (const field of ["humidity", "windSpeed", "pressure", "sunset"]) {
    assert.match(internalWidgets, new RegExp(`currentProvenance\\.${field}`));
  }
  assert.match(internalWidgets, /formatWind\(current\.windSpeed, current\.windDirection\)/);
  assert.match(internalWidgets, /Atualizado em/);
  assert.doesNotMatch(internalWidgets, /Medição da Estação Embrapa/);
});

test("today route metadata no longer advertises the retired Embrapa observation", () => {
  assert.match(todayRoute, /Medição meteorológica da Defesa Civil RS em Pelotas/);
  assert.doesNotMatch(todayRoute, /Medição meteorológica da Embrapa em Pelotas/);
  assert.match(todayRoute, /previsão da próxima hora continua identificada separadamente/);
});

test("today hourly story and planning resources keep real forecast data and specialized links", () => {
  assert.match(internalWidgets, /HomeForecastStory/);
  assert.match(internalWidgets, /daily:\s*data\.weather\.daily\.slice\(0, 1\)/);
  assert.match(homeForecastStory, /Previsão por hora em \$\{locationName\}/);
  assert.match(todayResources, /const visibleHours = hours\.slice\(0, 12\)/);
  assert.match(todayResources, /precipitationProbability/);
  assert.match(todayResources, /hour\.windGust \?\? hour\.windSpeed/);
  assert.match(todayResources, /to: "\/chuva-em-pelotas"/);
  assert.match(todayResources, /to: "\/vento-em-pelotas"/);
  assert.match(todayResources, /to: "\/radar-e-satelite-pelotas"/);
  assert.match(todayResources, /to: "\/alertas"/);
});

test("today editorial answer remains at the end and separates observation from forecast", () => {
  assert.match(todayRoute, /O que foi medido e o que é previsão nesta página/);
  assert.match(todayRoute, /A temperatura mostrada agora foi medida/);
  assert.match(todayRoute, /Chance de chuva e volume previsto são a mesma coisa/);
  assert.match(todayRoute, /createFaqPageJsonLd\(PAGE_PATH, TODAY_PAGE_CONTENT\.faqs\)/);
  assert.match(todayRoute, /<TodayForecastPageV5 data=\{recoveredWeather\} \/>[\s\S]*<EditorialContentSection/);
});
