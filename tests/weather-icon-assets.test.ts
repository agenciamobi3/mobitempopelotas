import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const component = readFileSync("src/production/components/weather-icon.tsx", "utf8");
const styles = readFileSync("src/production/components/weather-icon.css", "utf8");

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

test("wind keeps the local icon and primary weather surfaces use restrained motion", () => {
  assert.match(component, /name === "wind"/);
  assert.match(component, /<WindIcon/);
  assert.match(styles, /\.tp-home-hero__condition-icon/);
  assert.match(styles, /\.today-retail-hero__weather-icon/);
  assert.match(styles, /\.tomorrow-retail-hero__weather-icon/);
  assert.match(styles, /\.rain-retail-hero__weather-icon/);
  assert.match(styles, /tp-weather-icon-sun/);
  assert.match(styles, /tp-weather-icon-storm/);
  assert.match(styles, /prefers-reduced-motion: reduce/);
  assert.doesNotMatch(styles, /seven-day-retail-hero__weather-icon/);
});

test("amCharts attribution and license ship with the public assets", () => {
  const license = readFileSync("public/weather-icons/amcharts/LICENSE.txt", "utf8");
  assert.match(component, /Weather icon artwork by amCharts/);
  assert.match(component, /Creative Commons Attribution 4\.0/);
  assert.match(license, /created by amCharts/);
  assert.match(license, /Creative Commons Attribution 4\.0/);
});
