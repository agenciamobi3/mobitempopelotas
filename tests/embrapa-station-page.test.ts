import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { parseEmbrapaObservationHtml } from "../src/lib/weather/embrapa-observation.server.ts";

const ROUTE_FILE = new URL("../src/routes/estacao-embrapa-pelotas.tsx", import.meta.url);

const LIVE_SAMPLE = `
<html>
  <body>
    Dados meteorológicos de Pelotas/RS em tempo real 3:23
    Temperatura do ar 9.7 °C
    Umidade relativa do ar 96 %
    Sensação térmica 9.0 °C
    Ponto de orvalho 9.1 °C
    Pressão atmosférica 1018.2 mb Falling Slowly
    Direção e velocidade do vento SSW 8.0 km/hr
    Nascer e pôr do sol 6:36 - 18:18
    Temperatura mínima 8.9 °C - 1:10
    Temperatura máxima 9.8 °C - 2:29
    Umidade relativa mínima 95 % - 0:00
    Umidade relativa máxima 96 % - 0:27
    Ponto de orvalho mínimo 8.3 °C - 1:05
    Ponto de orvalho máximo 9.4 °C - 2:29
    Velocidade do vento máxima 12.9 km/hr - 2:16
    Chuva diária 0.2 mm
    Chuva mensal 6.0 mm
    Chuva anual 1097.2 mm
    Evapotranspiração diária 0.00 mm
    Evapotranspiração mensal 19.30 mm
    Evapotranspiração anual 642.62 mm
  </body>
</html>`;

test("parser reconhece o formato atual da página da Embrapa", () => {
  const data = parseEmbrapaObservationHtml(LIVE_SAMPLE, "2026-09-09T06:23:00.000Z");

  assert.equal(data.status, "live");
  assert.equal(data.current.temperature, 9.7);
  assert.equal(data.current.humidity, 96);
  assert.equal(data.current.feelsLike, 9);
  assert.equal(data.current.dewPoint, 9.1);
  assert.equal(data.current.pressure, 1018.2);
  assert.equal(data.current.pressureTrend, "caindo lentamente");
  assert.equal(data.current.windDirection, "SSW");
  assert.equal(data.current.windSpeed, 8);
  assert.equal(data.source.observationTime, "3:23");
  assert.equal(data.accumulated.rainDaily, 0.2);
  assert.equal(data.extremes.temperatureMin.value, 8.9);
  assert.equal(data.extremes.temperatureMax.time, "2:29");
});

test("rota da estação não volta a redirecionar para dados e fontes", async () => {
  const route = await readFile(ROUTE_FILE, "utf8");

  assert.doesNotMatch(route, /redirect\s*\(/);
  assert.match(route, /getEmbrapaObservation/);
  assert.match(route, /EmbrapaStationPage/);
  assert.match(route, /\/estacao-embrapa-pelotas/);
});
