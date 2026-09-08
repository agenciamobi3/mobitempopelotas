import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const shell = readFileSync("src/components/layout/InternalWeatherPageShell.tsx", "utf8");
const cleanup = readFileSync("src/components/layout/InternalWeatherEditorialCleanup.css", "utf8");
const fifteenDay = readFileSync("src/components/weather/FifteenDayForecastPage.tsx", "utf8");
const meteogram = readFileSync("src/components/weather/MeteogramPage.tsx", "utf8");
const history = readFileSync("src/components/history/WeatherHistoryPage.tsx", "utf8");
const methodology = readFileSync("src/components/methodology/MethodologyPage.tsx", "utf8");
const regional = readFileSync("src/components/regional/RegionalCityWeatherPage.tsx", "utf8");

test("internal shell loads editorial cleanup after the clean hero contract", () => {
  assert.match(shell, /InternalWeatherCleanHero\.css/);
  assert.match(shell, /InternalWeatherEditorialCleanup\.css/);
  assert.ok(
    shell.indexOf("InternalWeatherEditorialCleanup.css") >
      shell.indexOf("InternalWeatherCleanHero.css"),
  );
});

test("editorial cleanup no longer depends on hidden chapter markup", () => {
  assert.doesNotMatch(cleanup, /internal-page-chapters|camera-v2-chapters|climate-chapters|hydrology-v2-chapters|frost-v2-chapters|embrapa-v2-chapters|history-chapters|methodology-chapter-nav/);
});

test("converted pages removed their hidden chapter navigation from JSX", () => {
  assert.doesNotMatch(fifteenDay, /InternalPageChapters|const chapters/);
  assert.doesNotMatch(meteogram, /InternalPageChapters|const chapters/);
  assert.doesNotMatch(history, /history-chapters/);
  assert.doesNotMatch(methodology, /methodology-chapter-nav/);
  assert.doesNotMatch(regional, /InternalPageChapters|regionalSections|pageSections/);
});

test("primary retail forecast pages stay outside the cleanup barrier", () => {
  assert.doesNotMatch(cleanup, /internal-weather-shell--today/);
  assert.doesNotMatch(cleanup, /internal-weather-shell--tomorrow/);
  assert.doesNotMatch(cleanup, /internal-weather-shell--seven-day/);
});
