import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const apiRoute = readFileSync("src/routes/api/weather/hourly-precipitation.ts", "utf8");
const forecastStory = readFileSync("src/components/weather/HomeForecastStory.tsx", "utf8");
const homeEditorialForecast = readFileSync(
  "src/production/components/home-forecast-editorial.tsx",
  "utf8",
);
const rainRoute = readFileSync("src/routes/chuva-em-pelotas.tsx", "utf8");
const rainPage = readFileSync("src/components/weather/RainForecastPageV2.tsx", "utf8");
const rainAccumulation = readFileSync(
  "src/components/weather/RainAccumulationContext.tsx",
  "utf8",
);
const rainHero = readFileSync("src/components/weather/RainRetailHero.tsx", "utf8");
const alertsRoute = readFileSync("src/routes/alertas.tsx", "utf8");

test("hourly precipitation API requests millimetres rather than deriving volume from probability", () => {
  assert.match(apiRoute, /hourly:\s*"precipitation"/);
  assert.match(apiRoute, /precipitation_unit:\s*"mm"/);
  assert.match(apiRoute, /precipitationMm/);
  assert.doesNotMatch(apiRoute, /precipitation_probability/);
});

test("hourly cards render the volume already attached to their own forecast hour", () => {
  assert.match(forecastStory, /hourlyVolumeLabel\(hour\.precipitationMm\)/);
  assert.match(forecastStory, /Volume indisponível/);
  assert.match(forecastStory, /mm previstos/);
  assert.doesNotMatch(forecastStory, /HourlyRainVolume/);
  assert.doesNotMatch(forecastStory, /\/api\/weather\/hourly-precipitation/);
});

test("production home keeps chance and hourly millimetres in the same compact rain reading", () => {
  assert.match(
    homeEditorialForecast,
    /hourlyRainReading\(hour\.precipitation, hour\.precipitationMm\)/,
  );
  assert.match(homeEditorialForecast, /secondary: `chance · \$\{volume\}`/);
  assert.match(homeEditorialForecast, /secondary: "volume previsto"/);
  assert.match(homeEditorialForecast, /secondary: "chuva em atualização"/);
  assert.doesNotMatch(homeEditorialForecast, /\/api\/weather\/hourly-precipitation/);
});

test("rain probability remains visible separately from hourly volume", () => {
  assert.match(forecastStory, /<strong>\{rain\.chance\}%<\/strong>/);
  assert.match(forecastStory, /style=\{\{ width: `\$\{rain\.chance\}%` \}\}/);
});

test("página de chuva separa acumulado observado de volume previsto", () => {
  assert.match(rainPage, /<RainAccumulationContext data=\{recoveredData\} \/>/);
  assert.match(rainRoute, /observedRainDaily=\{getObservedRainDaily\(recoveredWeather\)\}/);
  assert.match(rainHero, /Chuva em Pelotas <span>hoje<\/span>/);
  assert.match(rainAccumulation, /observation\.accumulated\.rainDaily/);
  assert.match(rainAccumulation, /observation\.accumulated\.rainMonthly/);
  assert.match(rainAccumulation, /Previsto em 7 dias/);
  assert.match(rainAccumulation, /Medido e previsto não são somados/);
  assert.match(rainAccumulation, /Os períodos podem se sobrepor/);
  assert.match(rainPage, /hourly=\{weather\.hourly\}/);
});

test("acumulados da Defesa Civil são enriquecimento progressivo, não bloqueio do loader", () => {
  assert.match(rainAccumulation, /getDefesaCivilHydroData/);
  assert.match(rainAccumulation, /useEffect/);
  assert.match(rainAccumulation, /station\.rain\.h24Mm/);
  assert.match(rainAccumulation, /station\.freshness === "recent"/);
  assert.match(rainAccumulation, /station\.freshness === "delayed"/);
  assert.doesNotMatch(rainRoute, /getDefesaCivilHydroData/);
});

test("alertas orientam o visitante para acumulado sem confundir aviso com medição", () => {
  assert.match(alertsRoute, /Um alerta de chuva não informa quanto já choveu/);
  assert.match(alertsRoute, /Chuva acumulada e por horário em Pelotas/);
});
