import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const shell = readFileSync("src/components/layout/InternalWeatherPageShell.tsx", "utf8");
const cleanup = readFileSync("src/components/layout/InternalWeatherEditorialCleanup.css", "utf8");

test("internal shell loads editorial cleanup after the clean hero contract", () => {
  assert.match(shell, /InternalWeatherCleanHero\.css/);
  assert.match(shell, /InternalWeatherEditorialCleanup\.css/);
  assert.ok(
    shell.indexOf("InternalWeatherEditorialCleanup.css") >
      shell.indexOf("InternalWeatherCleanHero.css"),
  );
});

test("converted internal pages cannot re-expose legacy chapter indexes", () => {
  for (const selector of [
    "internal-weather-shell--fifteen-day .internal-page-chapters",
    "internal-weather-shell--meteogram .internal-page-chapters",
    "internal-weather-shell--cameras .camera-v2-chapters",
    "internal-weather-shell--climate .climate-chapters",
    "internal-weather-shell--hydrology .hydrology-v2-chapters",
    "internal-weather-shell--frost .frost-v2-chapters",
    "internal-weather-shell--embrapa .embrapa-v2-chapters",
  ]) {
    assert.match(cleanup, new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(cleanup, /display:\s*none\s*!important/);
});

test("primary retail forecast pages stay outside the cleanup barrier", () => {
  assert.doesNotMatch(cleanup, /internal-weather-shell--today/);
  assert.doesNotMatch(cleanup, /internal-weather-shell--tomorrow/);
  assert.doesNotMatch(cleanup, /internal-weather-shell--seven-day/);
});
