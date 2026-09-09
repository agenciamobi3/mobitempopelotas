import assert from "node:assert/strict";
import test from "node:test";

import type { AggregatedWeatherData } from "../src/lib/weather/aggregated-weather.types.ts";
import { toProductionWeatherData } from "../src/production/adapters/home.ts";

function makeWeather(withTemperatureDiscrepancy: boolean): AggregatedWeatherData {
  return {
    status: "live",
    current: {
      city: "Pelotas",
      state: "RS",
      temperature: 11,
      feelsLike: 10,
      condition: null,
      humidity: 94,
      pressure: 1020,
      windSpeed: 9,
      windGust: null,
      windDirection: "SE",
      visibilityKm: null,
      sunrise: null,
      sunset: null,
      observedAt: "2026-09-09T03:21:00-03:00",
      icon: null,
    },
    currentProvenance: { temperature: "defesa-civil-rs" },
    hourly: [
      {
        time: "Agora",
        timestamp: "2026-09-09T04:00:00-03:00",
        temperature: 7,
        precipitationProbability: 0,
        precipitationMm: 0,
        windSpeed: 8,
        windGust: null,
        windDirectionDegrees: 120,
        icon: "cloud",
      },
    ],
    daily: [],
    observation: {
      status: "live",
      station: {
        code: "Z3",
        name: "Pelotas - Colônia Z3",
        basin: null,
        region: null,
        latitude: null,
        longitude: null,
        altitudeM: null,
        distanceFromPelotasKm: null,
      },
      current: {
        temperature: 11,
        feelsLike: 10,
        humidity: 94,
        dewPoint: null,
        pressure: 1020,
        windSpeed: 9,
        windGust: null,
        windDirection: "SE",
        windDirectionDegrees: 120,
      },
      rain: { h1Mm: 0, h3Mm: 0, h6Mm: 0, h12Mm: 0, h24Mm: 0 },
      source: {
        name: "Defesa Civil RS — Rede de Monitoramento Hidrometeorológico",
        url: "https://redehidrometeorologica.defesacivil.rs.gov.br/Mapa",
        documentationUrl: "https://redehidrometeorologica.defesacivil.rs.gov.br/Mapa",
        fetchedAt: "2026-09-09T06:21:00.000Z",
        observedAt: "2026-09-09T03:21:00-03:00",
      },
      error: null,
    },
    alerts: [],
    inmetForecast: [],
    inmetStation: null,
    officialForecast: [],
    sources: {} as AggregatedWeatherData["sources"],
    quality: {
      score: 86,
      confidence: "high",
      currentSource: "defesa-civil-rs",
      forecastSource: "open-meteo",
      forecastProvider: "Open-Meteo",
      degradedSources: [],
      observationAgeMinutes: 0,
      discrepancies: withTemperatureDiscrepancy
        ? [
            {
              scope: "current",
              field: "temperature",
              severity: "notice",
              referenceSource: "open-meteo",
              comparisonSource: "defesa-civil-rs",
              referenceValue: 7,
              comparisonValue: 11,
              difference: 4,
              unit: "°C",
              day: null,
            },
          ]
        : [],
      notes: [],
    },
    source: {
      name: "MOBI Tempo Pelotas",
      kind: "aggregated",
      fetchedAt: "2026-09-09T06:21:00.000Z",
    },
    message: null,
  };
}

test("hero não publica observação quando há discrepância de temperatura atual", () => {
  const result = toProductionWeatherData(makeWeather(true));

  assert.equal(result.current.available, false);
  assert.equal(result.current.temperature, null);
  assert.equal(result.current.source.kind, "unavailable");
  assert.equal(result.hourly[0]?.time, "Próxima hora");
});

test("hero mantém observação quando a temperatura atual não tem discrepância", () => {
  const result = toProductionWeatherData(makeWeather(false));

  assert.equal(result.current.available, true);
  assert.equal(result.current.temperature, 11);
  assert.equal(result.current.source.kind, "observation");
});
