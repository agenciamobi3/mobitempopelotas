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
  assert.match(home, /useEffect\(\(\) => \{[\s\S]*if \(!hasUsableWeather\) \{[\s\S]*setCameraData\(null\);[\s\S]*return;[\s\S]*getWeatherCameras\(\)/);
  assert.match(home, /\}, \[hasUsableWeather\]\);/);
});

test("home continua navegável durante a recuperação", () => {
  assert.match(home, /<HomeExplorePortal \/>/);
  assert.match(home, /<HomeDataGuide \/>/);
  assert.match(home, /<SiteFooter source=\{hasUsableWeather \? weather\.source : unavailableSource\} \/>/);
});

test("indisponibilidade operacional da hidrologia não vira console error", () => {
  assert.doesNotMatch(home, /console\.error\("Falha ao recuperar hidrologia da Home/);
  assert.match(home, /setResult\(\{ status: "unavailable" \}\)/);
});
