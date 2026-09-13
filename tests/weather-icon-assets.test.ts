import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const component = readFileSync("src/production/components/weather-icon.tsx", "utf8");
const styles = readFileSync("src/production/components/weather-icon.css", "utf8");
const inmetPanel = readFileSync(
  "src/production/components/inmet-official-forecast-panel.tsx",
  "utf8",
);

const selectedAssets = [
  "day",
  "night",
  "cloudy-day-2",
  "cloudy-night-2",
  "cloudy",
  "rainy-5",
  "thunder",
] as const;

test("weather icons keep the licensed amCharts source assets and render inline artwork", () => {
  for (const asset of selectedAssets) {
    assert.equal(existsSync(`public/weather-icons/amcharts/${asset}.svg`), true);
  }

  for (const condition of [
    "sun",
    "moon",
    "partly-cloudy",
    "partly-cloudy-night",
    "cloud",
    "rain",
    "storm",
  ]) {
    assert.match(component, new RegExp(`${JSON.stringify(condition)}|name === "${condition}"`));
  }

  assert.match(component, /weather-icon__sun-rays/);
  assert.match(component, /weather-icon__cloud--front/);
  assert.match(component, /weather-icon__rain-drop/);
  assert.match(component, /weather-icon__lightning/);
  assert.doesNotMatch(component, /<image/);
});

test("wind keeps the local icon and every weather glyph receives the shared frame", () => {
  assert.match(component, /name === "wind"/);
  assert.match(component, /<WindIcon/);
  assert.match(component, /weather-icon--local/);
  assert.match(component, /`weather-icon--\$\{name\}`/);
});

test("inline weather artwork has visible condition-aware motion", () => {
  assert.match(styles, /\.weather-icon__artwork/);
  assert.match(styles, /\.weather-icon__sun-rays/);
  assert.match(styles, /\.weather-icon__sun-core/);
  assert.match(styles, /\.weather-icon__moon-body/);
  assert.match(styles, /\.weather-icon__cloud--front/);
  assert.match(styles, /\.weather-icon__rain-drop/);
  assert.match(styles, /\.weather-icon__lightning/);
  assert.match(styles, /\.weather-icon__wind-lines/);
  assert.match(styles, /tp-weather-breathe/);
  assert.match(styles, /tp-weather-sun-spin/);
  assert.match(styles, /tp-weather-rain-drop/);
  assert.match(styles, /tp-weather-lightning/);
  assert.match(styles, /prefers-reduced-motion: reduce/);
});

test("hourly, INMET and internal forecasts use the enlarged icon policy", () => {
  assert.match(styles, /\.tp-home-forecast-hour__weather \.weather-icon/);
  assert.match(styles, /\.tp-home-inmet \.tp-home-inmet__icon \.weather-icon/);
  assert.match(styles, /\.tp-home-trend-day__condition \.weather-icon/);
  assert.match(styles, /\.seven-day-v2-days__condition \.weather-icon/);
  assert.match(styles, /\.fifteen-day__condition \.weather-icon/);
  assert.match(styles, /width: 62px !important/);
  assert.match(styles, /width: 60px !important/);
});

test("INMET reuses the canonical weather icon system and respects day or night context", () => {
  assert.match(inmetPanel, /import \{ WeatherIcon \}/);
  assert.match(inmetPanel, /WeatherIconName/);
  assert.match(inmetPanel, /partly-cloudy-night/);
  assert.match(inmetPanel, /return isNight \? "moon" : "sun"/);
  assert.match(inmetPanel, /<WeatherIcon/);
  assert.doesNotMatch(inmetPanel, /function ForecastIcon/);
});

test("amCharts attribution and license ship with the weather icon system", () => {
  const license = readFileSync("public/weather-icons/amcharts/LICENSE.txt", "utf8");
  assert.match(component, /derived from amCharts/);
  assert.match(component, /Creative Commons Attribution 4\.0/);
  assert.match(license, /created by amCharts/);
  assert.match(license, /Creative Commons Attribution 4\.0/);
});
