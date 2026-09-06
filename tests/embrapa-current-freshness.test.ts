import assert from "node:assert/strict";
import test from "node:test";

import type { EmbrapaObservation } from "../src/lib/weather/official-sources.types.ts";
import {
  CENTRAL_READING_MAX_AGE_MS,
  getCentralEmbrapaSnapshotAgeMs,
  isCentralEmbrapaSnapshotFresh,
  isPublishableEmbrapaObservation,
} from "../src/lib/weather/embrapa-current.server.ts";

function observation(options: {
  fetchedAt: string;
  observationTime?: string | null;
  temperature?: number | null;
}): EmbrapaObservation {
  const temperature = Object.prototype.hasOwnProperty.call(options, "temperature")
    ? (options.temperature ?? null)
    : 12.8;

  return {
    status: "live",
    current: {
      temperature,
      humidity: 88,
      feelsLike: 12.6,
      dewPoint: 10.8,
      pressure: 1017.1,
      pressureTrend: null,
      windDirection: "L",
      windSpeed: 6.4,
      sunrise: null,
      sunset: null,
    },
    extremes: {
      temperatureMin: { value: null, time: null },
      temperatureMax: { value: null, time: null },
      humidityMin: { value: null, time: null },
      humidityMax: { value: null, time: null },
      windSpeedMax: { value: null, time: null },
    },
    accumulated: { rainDaily: null, rainMonthly: null, rainAnnual: null },
    source: {
      name: "Embrapa Clima Temperado",
      station: "Posto Meteorológico da Sede",
      url: "https://agromet.cpact.embrapa.br/online/Current_Monitor.htm",
      latitude: -31.7,
      longitude: -52.4,
      altitude: 57,
      fetchedAt: options.fetchedAt,
      observationTime: options.observationTime ?? null,
    },
    error: null,
  };
}

test("cache central deixa de ser autoridade depois de 75 segundos", () => {
  const now = new Date("2026-09-06T05:41:02.000Z");
  const recent = observation({ fetchedAt: "2026-09-06T05:40:00.000Z" });
  const stale = observation({ fetchedAt: "2026-09-06T05:39:46.000Z" });

  assert.equal(CENTRAL_READING_MAX_AGE_MS, 75_000);
  assert.equal(getCentralEmbrapaSnapshotAgeMs(recent, now), 62_000);
  assert.equal(isCentralEmbrapaSnapshotFresh(recent, now), true);
  assert.equal(isCentralEmbrapaSnapshotFresh(stale, now), false);
});

test("observação Embrapa com mais de 30 minutos não pode virar Agora", () => {
  const now = new Date("2026-09-06T05:41:00.000Z");
  const fresh = observation({
    fetchedAt: "2026-09-06T05:31:00.000Z",
    observationTime: "2026-09-06T05:30:00.000Z",
  });
  const yesterday = observation({
    fetchedAt: "2026-09-05T11:56:01.812Z",
    observationTime: null,
  });

  assert.equal(isPublishableEmbrapaObservation(fresh, now), true);
  assert.equal(isPublishableEmbrapaObservation(yesterday, now), false);
});

test("temperatura ausente nunca é publicável mesmo com timestamp recente", () => {
  const now = new Date("2026-09-06T05:41:00.000Z");
  const missing = observation({
    fetchedAt: "2026-09-06T05:40:30.000Z",
    temperature: null,
  });

  assert.equal(isPublishableEmbrapaObservation(missing, now), false);
});
