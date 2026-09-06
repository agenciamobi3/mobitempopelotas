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

function partlyCloudyWeather(
  cloudCover: number,
  timestamp = "2026-09-06T09:00:00-03:00",
  icon: "partly-cloudy" | "partly-cloudy-night" = "partly-cloudy",
): WeatherData {
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
        timestamp,
        temperature: 17,
        precipitation: 6,
        windSpeed: 6.4,
        windGust: null,
        icon,
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

test("sol entre nuvens preserva a divisão de 50% nos slots do acervo anterior", () => {
  const lighter = resolveHeroPhoto({ weather: partlyCloudyWeather(34), icon: "partly-cloudy" });
  const denser = resolveHeroPhoto({ weather: partlyCloudyWeather(68), icon: "partly-cloudy" });

  assert.equal(lighter.kind, "partly-cloudy-light");
  assert.equal(lighter.src, "/weather/hero/pelotas parcialmente nublado centro.jpg");
  assert.equal(denser.kind, "partly-cloudy-dense");
  assert.equal(denser.src, "/weather/hero/pelotas-parcialmente-nublado.avif");
});

test("a nova foto diurna entra na rotação sem apagar a semântica de cobertura", () => {
  const lighter = resolveHeroPhoto({
    weather: partlyCloudyWeather(34, "2026-09-06T10:00:00-03:00"),
    icon: "partly-cloudy",
  });
  const denser = resolveHeroPhoto({
    weather: partlyCloudyWeather(68, "2026-09-06T10:00:00-03:00"),
    icon: "partly-cloudy",
  });

  assert.equal(lighter.kind, "partly-cloudy-light");
  assert.equal(denser.kind, "partly-cloudy-dense");
  assert.equal(lighter.src, "/weather/hero/pelotas-dia-parcialmente-bulado.png");
  assert.equal(denser.src, "/weather/hero/pelotas-dia-parcialmente-bulado.png");
});

test("poucas nuvens no fim de tarde alternam entre os três registros diurnos", () => {
  const at16 = resolveHeroPhoto({
    weather: partlyCloudyWeather(34, "2026-09-06T16:00:00-03:00"),
    icon: "partly-cloudy",
  });
  const at17 = resolveHeroPhoto({
    weather: partlyCloudyWeather(34, "2026-09-06T17:00:00-03:00"),
    icon: "partly-cloudy",
  });
  const at18 = resolveHeroPhoto({
    weather: partlyCloudyWeather(34, "2026-09-06T18:00:00-03:00"),
    icon: "partly-cloudy",
  });
  const denseAt17 = resolveHeroPhoto({
    weather: partlyCloudyWeather(68, "2026-09-06T17:00:00-03:00"),
    icon: "partly-cloudy",
  });

  assert.equal(at16.src, "/weather/hero/pelotas parcialmente nublado centro.jpg");
  assert.equal(at17.src, "/weather/hero/pelotas-fim-de-tarde-poucas-nuvens.png");
  assert.equal(at18.src, "/weather/hero/pelotas-dia-parcialmente-bulado.png");
  assert.equal(denseAt17.src, "/weather/hero/pelotas-parcialmente-nublado.avif");
});

test("a foto de madrugada só entra na rotação noturna durante a madrugada", () => {
  const madrugada = resolveHeroPhoto({
    weather: partlyCloudyWeather(68, "2026-09-06T04:00:00-03:00", "partly-cloudy-night"),
    icon: "partly-cloudy-night",
  });
  const noite = resolveHeroPhoto({
    weather: partlyCloudyWeather(68, "2026-09-06T20:00:00-03:00", "partly-cloudy-night"),
    icon: "partly-cloudy-night",
  });

  assert.equal(madrugada.src, "/weather/hero/pelotas-madrugada-parcialmente-nublado.png");
  assert.equal(noite.src, "/weather/hero/pelotas-parcialmente-nublado.avif");
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
