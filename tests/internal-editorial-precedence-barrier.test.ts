import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const barrier = readFileSync(
  "src/production/styles/internal-editorial-precedence-barrier.css",
  "utf8",
);
const productionCss = readFileSync("src/production/production-styles.css", "utf8");
const productionManifest = readFileSync("src/production/production-styles.ts", "utf8");
const cleanHero = readFileSync(
  "src/components/layout/InternalWeatherCleanHero.css",
  "utf8",
);
const todayHeroCss = readFileSync(
  "src/components/weather/TodayEditorialHero.css",
  "utf8",
);
const tomorrowHeroCss = readFileSync(
  "src/components/weather/TomorrowRetailHero.css",
  "utf8",
);
const tomorrowHero = readFileSync(
  "src/components/weather/TomorrowRetailHero.tsx",
  "utf8",
);
const sevenDayHeroCss = readFileSync(
  "src/components/weather/SevenDayRetailHero.css",
  "utf8",
);
const sevenDayHero = readFileSync(
  "src/components/weather/SevenDayRetailHero.tsx",
  "utf8",
);
const fifteenDayHeroCss = readFileSync(
  "src/components/weather/FifteenDayForecastHero.css",
  "utf8",
);
const fifteenDayHero = readFileSync(
  "src/components/weather/FifteenDayForecastHero.tsx",
  "utf8",
);
const rainHeroCss = readFileSync(
  "src/components/weather/RainRetailHero.css",
  "utf8",
);
const rainHero = readFileSync(
  "src/components/weather/RainRetailHero.tsx",
  "utf8",
);
const windHeroCss = readFileSync(
  "src/components/weather/WindRetailHero.css",
  "utf8",
);
const windHero = readFileSync(
  "src/components/weather/WindRetailHero.tsx",
  "utf8",
);

test("precedence barrier stays after stabilization and before usability polish", () => {
  for (const entry of [productionCss, productionManifest]) {
    const stabilization = entry.indexOf("internal-dedicated-page-stabilization.css");
    const barrierIndex = entry.indexOf("internal-editorial-precedence-barrier.css");
    const polish = entry.indexOf("portal-usability-polish.css");

    assert.ok(stabilization >= 0);
    assert.ok(barrierIndex > stabilization);
    assert.ok(polish > barrierIndex);
  }
});

test("converted internal weather bodies cannot be recarded by lazy CSS", () => {
  for (const namespace of [
    "internal-weather-shell--rain",
    "internal-weather-shell--wind",
    "internal-weather-shell--fifteen-day",
    "internal-weather-shell--meteogram",
    "internal-weather-shell--cameras",
    "internal-weather-shell--climate",
    "internal-weather-shell--hydrology",
    "internal-weather-shell--frost",
    "internal-weather-shell--embrapa",
    "internal-weather-shell--history",
  ]) {
    assert.match(barrier, new RegExp(`\\.${namespace}`));
  }

  assert.match(barrier, /border-radius:\s*0 !important/);
  assert.match(barrier, /background-color:\s*transparent !important/);
  assert.match(barrier, /background-image:\s*none !important/);
  assert.match(barrier, /box-shadow:\s*none !important/);
});

test("precedence barrier no longer hides legacy chapter navigation", () => {
  assert.doesNotMatch(barrier, /internal-page-chapters|camera-v2-chapters|climate-chapters|hydrology-v2-chapters|frost-v2-chapters|embrapa-v2-chapters|history-chapters|methodology-chapter-nav/);
});

test("meteorological main heroes are owned by their route stylesheets", () => {
  assert.match(barrier, /Heroes meteorológicos principais agora possuem contratos próprios por rota/);
  assert.doesNotMatch(barrier, /today-retail-hero|rain-retail-hero|wind-retail-hero/);

  assert.match(cleanHero, /internal-weather-shell--meteogram/);
  for (const namespace of ["today", "tomorrow", "seven-day", "fifteen-day", "rain", "wind"]) {
    assert.doesNotMatch(cleanHero, new RegExp(`internal-weather-shell--${namespace}`));
  }

  assert.match(todayHeroCss, /\.internal-weather-shell--today \.today-retail-hero__inner/);
  assert.match(tomorrowHeroCss, /\.internal-weather-shell--tomorrow \.tomorrow-retail-hero__inner/);
  assert.match(sevenDayHeroCss, /\.internal-weather-shell--seven-day \.seven-day-retail-hero__inner/);
  assert.match(fifteenDayHeroCss, /\.internal-weather-shell--fifteen-day \.fifteen-day-retail-hero__inner/);
  assert.match(rainHeroCss, /\.internal-weather-shell--rain \.rain-retail-hero__inner/);
  assert.match(windHeroCss, /\.internal-weather-shell--wind \.wind-retail-hero__inner/);
});

test("dedicated forecast heroes no longer depend on shared photographic retail DOM", () => {
  for (const hero of [tomorrowHero, sevenDayHero, fifteenDayHero, rainHero, windHero]) {
    assert.doesNotMatch(hero, /getRetailWeatherPhoto|today-retail-hero-backgrounds|TodayRetailHeroPhoto\.css/);
  }

  assert.doesNotMatch(rainHero, /today-retail-hero/);
  assert.doesNotMatch(windHero, /today-retail-hero/);
  assert.match(rainHero, /rain-retail-hero__summary/);
  assert.match(rainHero, /rain-retail-hero__facts/);
  assert.match(windHero, /wind-retail-hero__summary/);
  assert.match(windHero, /wind-retail-hero__facts/);
});

test("Today hero uses its dedicated editorial surface", () => {
  assert.match(
    todayHeroCss,
    /\.internal-weather-shell--today \.today-retail-hero::before[\s\S]*?radial-gradient[\s\S]*?linear-gradient/,
  );
  assert.match(todayHeroCss, /\.internal-weather-shell--today \.today-retail-hero__facts article/);
  assert.match(todayHeroCss, /--tp-home-container-max, 1440px/);
});

test("Tomorrow hero uses the clean historical editorial language", () => {
  assert.match(tomorrowHeroCss, /Hero editorial limpo/);
  assert.match(tomorrowHeroCss, /\.tomorrow-retail-hero::before[\s\S]*?radial-gradient[\s\S]*?linear-gradient/);
  assert.match(tomorrowHeroCss, /\.tomorrow-retail-hero__facts article/);
  assert.match(tomorrowHero, /tomorrow-retail-hero__summary/);
  assert.match(tomorrowHero, /Condição prevista/);
  assert.doesNotMatch(tomorrowHeroCss, /tomorrow-retail-hero__tiles/);
});

test("7-day hero keeps the concise weekly editorial hierarchy", () => {
  assert.match(sevenDayHero, /Previsão de 7 dias para Pelotas/);
  assert.match(sevenDayHero, /seven-day-retail-hero__summary/);
  assert.match(sevenDayHero, /seven-day-retail-hero__facts/);
  assert.match(sevenDayHeroCss, /\.seven-day-retail-hero::before[\s\S]*?radial-gradient[\s\S]*?linear-gradient/);
  assert.match(sevenDayHeroCss, /\.seven-day-retail-hero__facts article/);
});

test("15-day hero remains independent from the retired retail precedence", () => {
  assert.match(fifteenDayHeroCss, /Hero editorial compacto da previsão estendida/);
  assert.match(fifteenDayHero, /fifteen-day-retail-hero__summary/);
  assert.doesNotMatch(fifteenDayHero, /today-retail-hero|getRetailWeatherPhoto/);
  assert.match(barrier, /internal-weather-shell--fifteen-day/);
});

test("rain and wind heroes keep their own editorial rails", () => {
  assert.match(rainHeroCss, /--tp-home-container-max, 1440px/);
  assert.match(windHeroCss, /--tp-home-container-max, 1440px/);
  assert.match(rainHeroCss, /\.rain-retail-hero__facts article[\s\S]*box-shadow:\s*none/);
  assert.match(windHeroCss, /\.wind-retail-hero__facts article[\s\S]*box-shadow:\s*none/);
});

test("climate and hydrology custom heroes use the open split surface", () => {
  assert.match(barrier, /\.internal-weather-shell--climate \.climate-hero/);
  assert.match(barrier, /\.internal-weather-shell--hydrology \.hydrology-v2-hero/);
  assert.match(
    barrier,
    /grid-template-columns:\s*minmax\(0, 1\.12fr\) minmax\(320px, 0\.66fr\) !important/,
  );
  assert.match(
    barrier,
    /\.climate-hero__panel,[\s\S]*?\.hydrology-v2-hero__reading[\s\S]*?border-left:\s*1px solid var\(--route-editorial-line\) !important/,
  );
  assert.match(
    barrier,
    /@media \(max-width: 720px\)[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\) !important/,
  );
});

test("status and privacy cannot regain rounded dashboard chrome", () => {
  assert.match(barrier, /\.data-status-shell/);
  assert.match(barrier, /\.privacy-data-shell/);
  assert.match(
    barrier,
    /\.data-status-hero,[\s\S]*?\.privacy-card[\s\S]*?border-radius:\s*0 !important[\s\S]*?background-image:\s*none !important[\s\S]*?box-shadow:\s*none !important/,
  );
  assert.match(barrier, /\.privacy-summary[\s\S]*?background-color:\s*transparent !important/);
});

test("hydrology and radar topic chapters remain open while instruments stay functional", () => {
  assert.match(barrier, /\.hydrology-editorial-route > section/);
  assert.match(barrier, /\.radar-satellite-page > section/);
  assert.match(barrier, /\.redemet-page > section/);
  assert.match(barrier, /border-left:\s*0 !important/);
  assert.match(barrier, /border-radius:\s*0 !important/);

  for (const instrument of ["maplibregl-map", "iframe", "video", "canvas", "svg\\[data-chart\\]"]) {
    assert.match(barrier, new RegExp(instrument));
  }
});
