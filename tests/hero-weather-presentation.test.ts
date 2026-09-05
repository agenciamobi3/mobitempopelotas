import assert from "node:assert/strict";
import test from "node:test";

import { resolveHeroPhoto } from "../src/production/lib/hero-photo-presentation.ts";
import {
  resolveHeroWeatherIcon,
  weatherConditionLabels,
} from "../src/production/lib/hero-weather-presentation.ts";
import { fallbackWeatherData, type WeatherData } from "../src/production/lib/weather-data.ts";

function weatherWith(overrides: Partial<WeatherData>): WeatherData {
  return {
    ...fallbackWeatherData,
    ...overrides,
  };
}

function weatherWithCondition(condition: string | null): WeatherData {
  return weatherWith({
    current: {
      ...fallbackWeatherData.current,
      available: true,
      condition,
    },
  });
}

function partlyCloudyWeather(cloudCover: number): WeatherData {
  return weatherWith({
    current: {
      ...fallbackWeatherData.current,
      available: true,
      condition: null,
      icon: null,
    },
    hourly: [
      {
        time: "Agora",
        temperature: 17,
        precipitation: 6,
        windSpeed: 6.4,
        windGust: null,
        icon: "partly-cloudy",
        cloudCover,
      },
    ],
  });
}

test("o hero prioriza a previsão horária para representar o período atual", () => {
  const weather = weatherWith({
    hourly: [
      {
        time: "Agora",
        temperature: 16,
        precipitation: 80,
        windSpeed: 12,
        windGust: 30,
        icon: "rain",
      },
    ],
    daily: [
      {
        weekday: "Hoje",
        date: "24/07",
        min: 11,
        max: 18,
        rainChance: 80,
        precipitation: 8,
        windGust: 40,
        icon: "cloud",
      },
    ],
  });

  assert.equal(resolveHeroWeatherIcon(weather, "Céu nublado"), "rain");
  assert.equal(weatherConditionLabels.rain, "Chuva prevista");
});

test("o hero usa a narrativa oficial quando não há grade de previsão", () => {
  assert.equal(
    resolveHeroWeatherIcon(weatherWith({}), "Pancadas de chuva com trovoadas no período"),
    "storm",
  );
  assert.equal(resolveHeroWeatherIcon(weatherWith({}), "Céu parcialmente nublado"), "partly-cloudy");
});

test("o hero nunca inventa céu aberto quando a condição é desconhecida", () => {
  assert.equal(resolveHeroWeatherIcon(weatherWith({}), null), "cloud");
  assert.equal(weatherConditionLabels.moon, "Céu aberto à noite");
});

test("o hero usa o acervo local de Pelotas conforme a condição observada", () => {
  assert.equal(
    resolveHeroPhoto({ weather: weatherWithCondition("Nevoeiro"), icon: "cloud" }).kind,
    "fog",
  );
  assert.equal(
    resolveHeroPhoto({ weather: weatherWithCondition("Chuva com trovoadas"), icon: "storm" }).kind,
    "rain",
  );
  assert.equal(
    resolveHeroPhoto({ weather: weatherWithCondition("Céu limpo"), icon: "sun" }).kind,
    "clear",
  );
  assert.equal(
    resolveHeroPhoto({ weather: weatherWithCondition("Nublado"), icon: "cloud" }).kind,
    "cloudy",
  );
});

test("sol entre nuvens alterna entre os dois registros locais pela cobertura de nuvens", () => {
  const lighter = resolveHeroPhoto({ weather: partlyCloudyWeather(34), icon: "partly-cloudy" });
  const denser = resolveHeroPhoto({ weather: partlyCloudyWeather(68), icon: "partly-cloudy" });

  assert.equal(lighter.kind, "partly-cloudy-light");
  assert.equal(lighter.src, "/weather/hero/pelotas parcialmente nublado centro.jpg");
  assert.equal(denser.kind, "partly-cloudy-dense");
  assert.equal(denser.src, "/weather/hero/pelotas-parcialmente-nublado.avif");
});

test("a narrativa de chuva futura não troca uma foto de sol entre nuvens por chuva", () => {
  const photo = resolveHeroPhoto({
    weather: partlyCloudyWeather(68),
    icon: "partly-cloudy",
    officialSummary: "Parcialmente nublado. Sujeito a pancadas isoladas de chuva fraca.",
  });

  assert.equal(photo.kind, "partly-cloudy-dense");
  assert.equal(photo.src, "/weather/hero/pelotas-parcialmente-nublado.avif");
  assert.notEqual(photo.src, "/weather/hero/pelotas-laranjal-chuva.webp");
});

test("o acervo local substitui créditos e URLs externas no hero estático", () => {
  const photo = resolveHeroPhoto({
    weather: weatherWithCondition("Pancadas de chuva"),
    icon: "rain",
  });

  assert.equal(photo.credit, "Acervo Tempo Pelotas");
  assert.match(photo.src, /^\/weather\/hero\/pelotas-/);
  assert.doesNotMatch(photo.src, /wikimedia|commons/i);
});
