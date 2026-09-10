import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const homeForecast = readFileSync(
  "src/production/components/home-forecast-editorial.tsx",
  "utf8",
);
const homeForecastFix = readFileSync(
  "src/production/components/home-forecast-viewport-fix.css",
  "utf8",
);
const homeRadar = readFileSync("src/production/components/home-radar-editorial.tsx", "utf8");
const homeRadarFix = readFileSync(
  "src/production/components/home-radar-unavailable-fix.css",
  "utf8",
);
const regionalPage = readFileSync(
  "src/components/regional/RegionalCityWeatherPage.tsx",
  "utf8",
);
const regionalAlertLayout = readFileSync(
  "src/components/regional/RegionalCityAlertLayout.css",
  "utf8",
);

test("Home keeps the seven hourly cards contained on desktop and intermediate widths", () => {
  assert.match(homeForecast, /import "\.\/home-forecast-viewport-fix\.css"/);
  assert.match(homeForecastFix, /@media \(min-width: 880px\)/);
  assert.match(
    homeForecastFix,
    /grid-template-columns:\s*repeat\(7,\s*minmax\(0,\s*1fr\)\)/,
  );
  assert.match(homeForecastFix, /overflow-x:\s*hidden/);
  assert.match(homeForecastFix, /\.tp-home-forecast-hour\s*\{[\s\S]*min-width:\s*0/);
});

test("Home radar keeps an unavailable REDEMET layer compact and readable", () => {
  assert.match(homeRadar, /import "\.\/home-radar-unavailable-fix\.css"/);
  assert.match(homeRadarFix, /bottom:\s*auto\s*!important/);
  assert.match(homeRadarFix, /right:\s*auto\s*!important/);
  assert.match(homeRadarFix, /height:\s*auto\s*!important/);
  assert.match(homeRadarFix, /min-height:\s*0\s*!important/);
  assert.match(
    homeRadarFix,
    /\.map-radar-unavailable strong\s*\{[\s\S]*color:\s*#173645\s*!important/,
  );
  assert.match(
    homeRadarFix,
    /\.map-radar-unavailable small\s*\{[\s\S]*color:\s*#6d808a\s*!important/,
  );
});

test("Regional INMET alert owns a compact bar outside the Home shell", () => {
  assert.match(regionalPage, /import "\.\/RegionalCityAlertLayout\.css"/);
  assert.match(regionalPage, /regional-city-alert-bar/);
  assert.doesNotMatch(regionalPage, /home-inmet-alerts__/);
  assert.match(
    regionalAlertLayout,
    /\.regional-city-alert-bar\s*\{[\s\S]*grid-template-columns:\s*44px minmax\(0, 1fr\) auto/,
  );
  assert.match(
    regionalAlertLayout,
    /\.regional-city-alert-bar\s*\{[\s\S]*min-height:\s*72px/,
  );
  assert.match(regionalAlertLayout, /\.regional-city-alert-bar__content\s*\{/);
  assert.match(regionalAlertLayout, /\.regional-city-alert-bar__summary\s*\{/);
  assert.match(regionalAlertLayout, /\.regional-city-alert-bar__action\s*\{/);
  assert.match(regionalAlertLayout, /@media \(max-width: 640px\)/);
});
