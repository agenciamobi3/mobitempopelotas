import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const shell = readFileSync("src/components/layout/InternalWeatherPageShell.tsx", "utf8");
const cleanup = readFileSync("src/components/layout/InternalWeatherEditorialCleanup.css", "utf8");
const fifteenDay = readFileSync("src/components/weather/FifteenDayForecastPage.tsx", "utf8");
const regional = readFileSync("src/components/regional/RegionalCityWeatherPage.tsx", "utf8");

test("internal shell loads editorial cleanup after the clean hero contract", () => {
  assert.match(shell, /InternalWeatherCleanHero\.css/);
  assert.match(shell, /InternalWeatherEditorialCleanup\.css/);
  assert.ok(
    shell.indexOf("InternalWeatherEditorialCleanup.css") >
      shell.indexOf("InternalWeatherCleanHero.css"),
  );
});

test("only Meteogram still needs a visual guard for legacy chapter markup", () => {
  assert.match(cleanup, /internal-weather-shell--meteogram \.internal-page-chapters/);
  assert.match(cleanup, /display:\s*none\s*!important/);
  for (const removedSelector of [
    "internal-weather-shell--fifteen-day .internal-page-chapters",
    "camera-v2-chapters",
    "climate-chapters",
    "hydrology-v2-chapters",
    "frost-v2-chapters",
    "embrapa-v2-chapters",
  ]) {
    assert.doesNotMatch(cleanup, new RegExp(removedSelector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("15-day and municipal pages removed the hidden chapter component from JSX", () => {
  assert.doesNotMatch(fifteenDay, /InternalPageChapters|const chapters/);
  assert.doesNotMatch(regional, /InternalPageChapters|regionalSections|pageSections/);
});

test("primary retail forecast pages stay outside the cleanup barrier", () => {
  assert.doesNotMatch(cleanup, /internal-weather-shell--today/);
  assert.doesNotMatch(cleanup, /internal-weather-shell--tomorrow/);
  assert.doesNotMatch(cleanup, /internal-weather-shell--seven-day/);
});
