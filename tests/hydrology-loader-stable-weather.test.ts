import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const route = readFileSync("src/routes/situacao-hidrologica-pelotas.tsx", "utf8");
const shell = readFileSync("src/components/layout/InternalWeatherPageShell.tsx", "utf8");

test("hydrology overview does not replace weather after hydration", () => {
  assert.match(route, /recoverWeatherAfterHydration=\{false\}/);
  assert.match(shell, /recoverWeatherAfterHydration\?: boolean/);
  assert.match(shell, /props\.recoverWeatherAfterHydration === false/);
  assert.match(shell, /resolvedData=\{props\.data\}/);
  assert.match(shell, /RecoveringInternalWeatherPageShell/);
  assert.match(shell, /useWeatherIntelligenceBrowserRecovery\(props\.data\)/);
});
