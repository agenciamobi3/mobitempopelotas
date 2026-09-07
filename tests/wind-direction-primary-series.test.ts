import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const route = readFileSync("src/routes/vento-em-pelotas.tsx", "utf8");
const direction = readFileSync("src/components/weather/WindDirectionContext.tsx", "utf8");
const fallbackStyles = readFileSync("src/components/weather/WindDirectionFallback.css", "utf8");

test("wind route does not duplicate the hourly forecast dependency", () => {
  assert.match(route, /loadPublicWeatherPage/);
  assert.doesNotMatch(route, /loadPublicWeatherWithMeteogram|getPelotasMeteogram|meteogram/);
  assert.match(route, /hourly=\{recoveredWeather\.weather\.hourly\}/);
  assert.match(route, /forecastProvider=\{recoveredWeather\.weather\.quality\.forecastProvider\}/);
});

test("hourly direction reads the recovered primary series", () => {
  assert.match(direction, /import type \{ HourlyForecast \}/);
  assert.match(direction, /function normalizeHours\(hourly: HourlyForecast\[\]\)/);
  assert.match(direction, /hour\.windDirectionDegrees \?\? null/);
  assert.doesNotMatch(direction, /MeteogramData|MeteogramHour/);
});

test("missing direction remains visible as an explicit state", () => {
  assert.match(direction, /if \(!hours\.length \|\| !withDirection\.length\)/);
  assert.match(direction, /Direção por hora em atualização/);
  assert.match(direction, /A velocidade e as rajadas podem continuar disponíveis/);
  assert.match(direction, /id="direcao-do-vento-por-hora"/);
  assert.doesNotMatch(direction, /return null/);
  assert.match(fallbackStyles, /wind-direction-context__state/);
});

test("direction semantics keep observation and forecast separate", () => {
  assert.match(direction, /dado de modelo/);
  assert.match(direction, /separada da direção observada pela estação/);
  assert.match(direction, /A direção meteorológica indica de onde o vento vem/);
});
