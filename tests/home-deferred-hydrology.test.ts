import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const route = readFileSync("src/routes/index.tsx", "utf8");
const home = readFileSync("src/production/ProductionHome.tsx", "utf8");
const styles = readFileSync("src/production/styles/home-water-deferred.css", "utf8");

test("home starts hydrology in parallel without awaiting it before critical weather", () => {
  const hydrologyStart = route.indexOf("const hydrology: Promise<HomeHydrologyResult> = Promise.all");
  const weatherAwait = route.indexOf("const weather = await getWeatherIntelligence()");
  assert.ok(hydrologyStart >= 0, "Home deve iniciar o carregamento hidrológico.");
  assert.ok(weatherAwait > hydrologyStart, "Hidrologia deve iniciar antes da espera meteorológica.");
  assert.doesNotMatch(route, /const \[weather, laranjal, guaiba, lagoon\] = await Promise\.all/);
  assert.match(route, /return \{ weather, hydrology \}/);
});

test("home resolves deferred hydrology only at the water section", () => {
  assert.match(home, /import \{ Await, Link \} from "@tanstack\/react-router"/);
  assert.match(home, /<Suspense fallback=\{<HomeWaterLoading \/>\}>/);
  assert.match(home, /<Await promise=\{hydrology\}>/);
  assert.match(home, /<DeferredHomeWater hydrology=\{hydrology\} \/>/);
  assert.match(home, /Atualizando níveis e medições\.\.\./);
});

test("unexpected hydrology rejection stays local and never replaces the weather home", () => {
  assert.match(route, /\.catch\(\(\) => \(\{ status: "unavailable" as const \}\)\)/);
  assert.match(home, /result\.status === "ready"/);
  assert.match(home, /<HomeWaterUnavailable \/>/);
  assert.match(home, /Dados hidrológicos temporariamente indisponíveis/);
  assert.match(home, /to="\/situacao-hidrologica-pelotas"/);
});

test("deferred water state remains accessible and motion-safe", () => {
  assert.match(home, /aria-live="polite"/);
  assert.match(home, /aria-busy="true"/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(styles, /@media \(forced-colors: active\)/);
  assert.doesNotMatch(styles, /!important/);
});
