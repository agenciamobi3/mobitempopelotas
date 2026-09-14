import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const home = readFileSync("src/production/ProductionHome.tsx", "utf8");

test("home mantém WeatherHero na primeira dobra antes da recuperação meteorológica", () => {
  const heroIndex = home.indexOf("<WeatherHero");
  const weatherGateIndex = home.indexOf("hasUsableWeather && inmetAlerts && summaries");

  assert.ok(heroIndex >= 0, "WeatherHero deve continuar presente na Home");
  assert.ok(weatherGateIndex > heroIndex, "o gate dos blocos dependentes deve ficar abaixo do hero");
  assert.doesNotMatch(home, /WEATHER_RECOVERY_GRACE_MS/);
  assert.doesNotMatch(home, /weatherRecoveryExpired/);
  assert.doesNotMatch(home, /if \(!hasUsableWeather\)\s*\{[\s\S]*return \(/);
  assert.match(home, /Atualizando dados meteorológicos\.\.\./);
  assert.match(home, /A primeira dobra permanece disponível/);
});

test("home adia a descoberta da câmera até existir meteorologia utilizável", () => {
  assert.match(home, /if \(!hasUsableWeather\) \{[\s\S]*setCameraData\(null\);[\s\S]*return;/);
  assert.match(home, /import\("@\/lib\/cameras\/cameras\.functions"\)/);
  assert.match(home, /requestIdleCallback\(discoverCamera/);
  assert.match(home, /\}, \[hasUsableWeather\]\);/);
});

test("recuperações secundárias saem do bundle inicial da Home", () => {
  assert.match(home, /import\("@\/lib\/weather\/weather-intelligence\.functions"\)/);
  assert.match(home, /import\("@\/lib\/hydrology\/guaiba\.functions"\)/);
  assert.match(home, /import\("@\/lib\/hydrology\/lagoon-network\.functions"\)/);
  assert.match(home, /import\("@\/lib\/hydrology\/laranjal-level\.functions"\)/);
  assert.doesNotMatch(home, /import \{ getWeatherIntelligence \} from/);
  assert.doesNotMatch(home, /import \{ getWeatherCameras \} from/);
});

test("blocos abaixo da dobra usam code splitting e Suspense", () => {
  assert.match(home, /const LazyHomeExplorePortal = lazy/);
  assert.match(home, /const LazyHomeDataGuide = lazy/);
  assert.match(home, /const LazyHomeWaterEditorial = lazy/);
  assert.match(home, /const LazyHomeLiveCameraBackground = lazy/);
  assert.match(home, /function DeferredHomeTail\(\)/);
  assert.match(home, /<Suspense fallback=\{null\}>[\s\S]*<LazyHomeExplorePortal \/>[\s\S]*<LazyHomeDataGuide \/>/);
});

test("home continua navegável durante a recuperação", () => {
  assert.match(home, /to="\/situacao-hidrologica-pelotas"/);
  assert.match(home, /to="\/cameras-ao-vivo-pelotas"/);
  assert.match(home, /to="\/status-dos-dados"/);
  assert.match(home, /<SiteFooter source=\{hasUsableWeather \? weather\.source : unavailableSource\} \/>/);
});

test("indisponibilidade operacional da hidrologia não vira console error", () => {
  assert.doesNotMatch(home, /console\.error\("Falha ao recuperar hidrologia da Home/);
  assert.match(home, /setResult\(\{ status: "unavailable" \}\)/);
});
