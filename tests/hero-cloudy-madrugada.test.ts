import assert from "node:assert/strict";
import test from "node:test";

import { resolveHeroPhoto } from "../src/production/lib/hero-photo-presentation.ts";
import { fallbackWeatherData, type WeatherData } from "../src/production/lib/weather-data.ts";

function cloudyWeatherAt(timestamp: string): WeatherData {
  return {
    ...fallbackWeatherData,
    current: {
      ...fallbackWeatherData.current,
      available: true,
      condition: "Céu nublado",
      icon: "cloud",
      updatedAt: timestamp,
    },
    hourly: [
      {
        time: "Agora",
        timestamp,
        temperature: 11,
        precipitation: 4,
        windSpeed: 9,
        windGust: null,
        icon: "cloud",
        cloudCover: 100,
      },
    ],
  };
}

test("céu nublado na madrugada usa a foto noite/madrugada", () => {
  const photo = resolveHeroPhoto({
    weather: cloudyWeatherAt("2026-09-09T03:30:00-03:00"),
    icon: "cloud",
  });

  assert.equal(photo.kind, "cloudy");
  assert.equal(photo.src, "/weather/hero/pelotas-noite-madrugada-nublado.png");
});

test("céu nublado à noite usa a mesma foto noturna", () => {
  const photo = resolveHeroPhoto({
    weather: cloudyWeatherAt("2026-09-09T21:00:00-03:00"),
    icon: "cloud",
  });

  assert.equal(photo.kind, "cloudy");
  assert.equal(photo.src, "/weather/hero/pelotas-noite-madrugada-nublado.png");
});

test("céu nublado durante o dia não usa a foto noturna", () => {
  const photo = resolveHeroPhoto({
    weather: cloudyWeatherAt("2026-09-09T09:00:00-03:00"),
    icon: "cloud",
  });

  assert.equal(photo.kind, "cloudy");
  assert.notEqual(photo.src, "/weather/hero/pelotas-noite-madrugada-nublado.png");
});
