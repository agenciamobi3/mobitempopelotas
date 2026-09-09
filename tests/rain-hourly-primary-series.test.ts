import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const rainRoute = readFileSync("src/routes/chuva-em-pelotas.tsx", "utf8");
const rainPage = readFileSync("src/components/weather/RainForecastPageV2.tsx", "utf8");
const rainVolume = readFileSync(
  "src/components/weather/RainHourlyVolumeContext.tsx",
  "utf8",
);
const fallbackStyles = readFileSync(
  "src/components/weather/RainHourlyVolumeFallback.css",
  "utf8",
);
const weatherTypes = readFileSync("src/lib/weather/types.ts", "utf8");

 test("página de chuva usa a série horária principal para chance e volume", () => {
  assert.match(weatherTypes, /precipitationMm\?: number \| null/);
  assert.match(rainRoute, /loadPublicWeatherPage/);
  assert.doesNotMatch(rainRoute, /loadPublicWeatherWithMeteogram|getPelotasMeteogram/);
  assert.match(rainRoute, /<RainForecastPageV2 data=\{recoveredWeather\} \/>/);
  assert.match(rainPage, /hourly=\{weather\.hourly\}/);
  assert.match(rainVolume, /hour\.precipitationMm \?\? null/);
  assert.match(rainVolume, /hour\.precipitationProbability/);
});

test("volume por hora acompanha a recuperação hidratada da previsão", () => {
  assert.match(rainPage, /const recoveredData = useOpenMeteoIntelligenceRecovery\(data\)/);
  assert.match(rainPage, /const weather = recoveredData\.weather/);
  assert.match(rainPage, /<RainHourlyVolumeContext[\s\S]*?hourly=\{weather\.hourly\}/);
  assert.doesNotMatch(rainVolume, /MeteogramData|getPelotasMeteogram/);
});

test("volume horário nunca desaparece silenciosamente quando mm ainda não chegou", () => {
  assert.match(rainVolume, /if \(!hours\.length \|\| !availableVolumeHours\.length\)/);
  assert.match(rainVolume, /rain-hourly-volume-context__state/);
  assert.match(rainVolume, /Volume por hora em atualização/);
  assert.match(rainVolume, /o volume em milímetros ainda não foi publicado/);
  assert.match(fallbackStyles, /\.rain-hourly-volume-context__state/);
  assert.match(fallbackStyles, /border:\s*1px dashed/);
});

test("volume conhecido mantém distinção entre janela completa, parcial, zero e desconhecida", () => {
  assert.match(rainVolume, /const availableVolumeHours = hours\.filter\(\(hour\) => hour\.precipitationMm !== null\)/);
  assert.match(rainVolume, /const hasCompleteVolumeWindow = availableVolumeHours\.length === hours\.length/);
  assert.match(rainVolume, /Total parcial/);
  assert.match(rainVolume, /Sem volume previsto/);
  assert.match(rainVolume, /chance não informada/);
  assert.match(rainVolume, /className=\{volumeKnown \? undefined : "is-unknown"\}/);
});

test("página mantém horário de atualização sem repetir provedor visualmente", () => {
  assert.match(rainVolume, /Atualizado em \{formatDateTime\(forecastFetchedAt\)\}/);
  assert.doesNotMatch(rainVolume, /forecastProvider|Database/);
  assert.match(rainPage, /Atualizado em \{formatFetchedAt\(weather\.source\.fetchedAt\)\}\.<\/span>/);
  assert.doesNotMatch(rainPage, /forecastProvider=\{weather\.quality\.forecastProvider\}/);
  assert.doesNotMatch(rainPage, /Atualizado em \{formatFetchedAt\(weather\.source\.fetchedAt\)\} ·/);
});
