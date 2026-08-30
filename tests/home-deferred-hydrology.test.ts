import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const route = readFileSync("src/routes/index.tsx", "utf8");
const home = readFileSync("src/production/ProductionHome.tsx", "utf8");
const styles = readFileSync("src/production/styles/home-water-deferred.css", "utf8");

test("home não consulta meteorologia ou hidrologia externa no loader inicial", () => {
  assert.match(route, /loader: \(\) => createInitialHomeData\(\)/);
  assert.match(route, /weather: createUnavailableWeatherIntelligence\(\)/);
  assert.match(route, /Promise\.resolve\(\{/);
  assert.match(route, /status: "unavailable" as const/);
  assert.doesNotMatch(route, /getWeatherIntelligence/);
  assert.doesNotMatch(route, /getLaranjalLevelData/);
  assert.doesNotMatch(route, /getGuaibaObservation/);
  assert.doesNotMatch(route, /getLagoonMonitoringNetwork/);
  assert.doesNotMatch(route, /Promise\.race/);
});

test("home recupera meteorologia consolidada no navegador antes da contingência direta", () => {
  assert.match(home, /import \{ getWeatherIntelligence \}/);
  assert.match(home, /void getWeatherIntelligence\(\)/);
  assert.match(home, /hasUsableWeatherIntelligence\(nextData\)/);
  assert.match(home, /useOpenMeteoIntelligenceRecovery\(serverRecoveredData\)/);
});

test("home mantém fallback meteorológico auditável para recuperação no navegador", () => {
  assert.match(route, /createUnavailableWeatherIntelligence/);
  assert.match(home, /useOpenMeteoIntelligenceRecovery\(serverRecoveredData\)/);
  assert.match(home, /Dados meteorológicos temporariamente indisponíveis/);
  assert.match(home, /O portal continuará consultando automaticamente as fontes meteorológicas/);
});

test("home mantém a seção de águas isolada e recupera dados reais após hidratação", () => {
  assert.match(home, /import \{ Await, Link \} from "@tanstack\/react-router"/);
  assert.match(home, /<Suspense fallback=\{<HomeWaterLoading \/>\}>/);
  assert.match(home, /<Await promise=\{hydrology\}>/);
  assert.match(home, /<DeferredHomeWater hydrology=\{hydrology\} \/>/);
  assert.match(home, /result\.status === "ready"/);
  assert.match(home, /<HomeWaterClientRecovery \/>/);
  assert.match(home, /getLaranjalLevelData\(\)/);
  assert.match(home, /getGuaibaObservation\(\)/);
  assert.match(home, /getLagoonMonitoringNetwork\(\)/);
  assert.match(home, /Promise\.all\(\[/);
  assert.match(home, /Dados hidrológicos temporariamente indisponíveis/);
});

test("estado de águas continua acessível e motion-safe", () => {
  assert.match(home, /aria-live="polite"/);
  assert.match(home, /aria-busy="true"/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(styles, /@media \(forced-colors: active\)/);
  assert.doesNotMatch(styles, /!important/);
});
