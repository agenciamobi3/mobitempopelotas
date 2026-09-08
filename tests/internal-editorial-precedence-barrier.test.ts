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
const todayHeroRefinement = readFileSync(
  "src/components/weather/TodayRetailHeroRefinement.css",
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

test("converted internal weather pages cannot be recarded by lazy CSS", () => {
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

test("rain, wind and 15-day reuse the retail DOM but keep the clean hero", () => {
  for (const namespace of [
    "internal-weather-shell--rain",
    "internal-weather-shell--wind",
    "internal-weather-shell--fifteen-day",
  ]) {
    assert.match(cleanHero, new RegExp(`\\.${namespace}`));
    assert.match(barrier, new RegExp(`\\.${namespace}`));
  }

  assert.match(
    cleanHero,
    /\.today-retail-hero[\s\S]*?background:\s*#f5f8f8 !important[\s\S]*?background-image:\s*none !important/,
  );
  assert.match(
    barrier,
    /:is\(\.today-retail-hero, \.rain-retail-hero\)[\s\S]*?border-radius:\s*0 !important[\s\S]*?background-image:\s*none !important/,
  );
});

test("Today hero remains a deliberate retail chromatic surface", () => {
  assert.match(
    todayHeroRefinement,
    /\.internal-weather-shell--today \.today-retail-hero[\s\S]*?radial-gradient[\s\S]*?linear-gradient/,
  );
  assert.match(todayHeroRefinement, /\.today-retail-hero__current[\s\S]*?min-height:\s*21rem/);
  assert.match(todayHeroRefinement, /\.today-retail-hero__tiles article\.is-rain/);
  assert.match(todayHeroRefinement, /\.today-retail-hero__tiles article\.is-wind/);
  assert.match(todayHeroRefinement, /\.today-retail-hero__tiles article\.is-sun/);
});

test("Tomorrow hero uses the clean historical editorial language", () => {
  assert.match(tomorrowHeroCss, /Hero editorial limpo/);
  assert.match(tomorrowHeroCss, /\.tomorrow-retail-hero::before[\s\S]*?radial-gradient[\s\S]*?linear-gradient/);
  assert.match(tomorrowHeroCss, /\.tomorrow-retail-hero__facts article/);
  assert.match(tomorrowHero, /tomorrow-retail-hero__summary/);
  assert.match(tomorrowHero, /Condição prevista/);
  assert.doesNotMatch(tomorrowHeroCss, /tomorrow-retail-hero__tiles/);
  assert.doesNotMatch(tomorrowHero, /getRetailWeatherPhoto/);
});

test("7-day hero keeps concise weekly retail hierarchy", () => {
  assert.match(sevenDayHero, /Previsão de <span>7 dias<\/span> para Pelotas/);
  assert.match(sevenDayHero, /className="is-maximum"/);
  assert.match(sevenDayHero, /className="is-cold"/);
  assert.match(sevenDayHeroCss, /\.seven-day-retail-hero[\s\S]*?radial-gradient[\s\S]*?linear-gradient/);
  assert.match(sevenDayHeroCss, /\.seven-day-retail-hero__tiles article\.is-source/);
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
