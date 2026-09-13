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

test("weather icons use the self-hosted amCharts artwork for canonical conditions", () => {
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
    assert.match(component, new RegExp(`${JSON.stringify(condition)}|${condition}:`));
  }

  assert.match(component, /AMCHARTS_ICON_ROOT/);
  assert.match(component, /weather-icon__asset/);
});

test("wind keeps the local icon and every weather glyph receives the shared frame", () => {
  assert.match(component, /name === "wind"/);
  assert.match(component, /<WindIcon/);
  assert.match(component, /weather-icon--local/);
  assert.match(component, /`weather-icon--\$\{name\}`/);
});

test("primary weather surfaces use restrained motion while dense lists stay static", () => {
  assert.match(styles, /\.tp-home-hero__condition-icon/);
  assert.match(styles, /\.today-retail-hero__weather-icon/);
  assert.match(styles, /\.tomorrow-retail-hero__weather-icon/);
  assert.match(styles, /\.rain-retail-hero__weather-icon/);
  assert.match(styles, /tp-weather-icon-sun/);
  assert.match(styles, /tp-weather-icon-storm/);
  assert.match(styles, /prefers-reduced-motion: reduce/);
  assert.doesNotMatch(styles, /seven-day-retail-hero__weather-icon/);
});

test("hourly and INMET surfaces normalize icon sizing without adding list animations", () => {
  assert.match(styles, /\.tp-home-forecast-hour__weather \.weather-icon/);
  assert.match(styles, /\.tp-home-inmet \.tp-home-inmet__icon \.weather-icon/);
  assert.match(styles, /\.tp-home-inmet__icon\.is-featured \.weather-icon/);
});

test("INMET reuses the canonical weather icon system and respects day or night context", () => {
  assert.match(inmetPanel, /import \{ WeatherIcon \}/);
  assert.match(inmetPanel, /WeatherIconName/);
  assert.match(inmetPanel, /partly-cloudy-night/);
  assert.match(inmetPanel, /return isNight \? "moon" : "sun"/);
  assert.match(inmetPanel, /<WeatherIcon/);
  assert.doesNotMatch(inmetPanel, /function ForecastIcon/);
});

test("amCharts attribution and license ship with the public assets", () => {
  const license = readFileSync("public/weather-icons/amcharts/LICENSE.txt", "utf8");
  assert.match(component, /Weather icon artwork by amCharts/);
  assert.match(component, /Creative Commons Attribution 4\.0/);
  assert.match(license, /created by amCharts/);
  assert.match(license, /Creative Commons Attribution 4\.0/);
});
