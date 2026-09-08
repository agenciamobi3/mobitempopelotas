import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const css = readFileSync("src/components/weather/TodayEditorialHero.css", "utf8");

test("Today editorial hero cannot leak into other route hero classes", () => {
  assert.match(css, /Prefixado pela rota/);
  assert.doesNotMatch(css, /(^|\n)\s*\.today-retail-hero\s*\{/m);
  assert.match(css, /\.internal-weather-shell--today \.today-retail-hero__inner/);
  assert.match(css, /\.internal-weather-shell--today \.today-retail-hero__facts/);
  assert.doesNotMatch(css, /internal-weather-shell--tomorrow|internal-weather-shell--rain|internal-weather-shell--wind/);
});

test("Today editorial hero keeps readable narrow-screen hierarchy", () => {
  assert.match(css, /@media \(max-width: 1100px\)/);
  assert.match(css, /@media \(max-width: 720px\)/);
  assert.match(
    css,
    /@media \(max-width: 720px\)[\s\S]*\.today-retail-hero__facts[\s\S]*grid-template-columns:\s*1fr/,
  );
  assert.match(css, /var\(--tp-home-container-mobile-gutter, 20px\)/);
  assert.match(css, /@media \(forced-colors: active\)/);
  assert.doesNotMatch(css, /font-size:\s*0\.(?:4\d|5[0-7])rem/);
});
