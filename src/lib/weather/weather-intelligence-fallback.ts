import type {
  AggregatedWeatherData,
  WeatherSourceHealth,
  WeatherSourceKey,
} from "./aggregated-weather.types";
import type { EmbrapaObservation } from "./official-sources.types";
import type { WeatherIntelligenceData } from "./weather-intelligence.types";

const EMBRAPA_URL = "https://agromet.cpact.embrapa.br/online/Current_Monitor.htm";

function emptyTimedObservation() {
  return { value: null, time: null };
}

function unavailableObservation(fetchedAt: string): EmbrapaObservation {
  return {
    status: "unavailable",
    current: {
      temperature: null,
      humidity: null,
      feelsLike: null,
      dewPoint: null,
      pressure: null,
      pressureTrend: null,
      windDirection: null,
      windSpeed: null,
      sunrise: null,
      sunset: null,
    },
    extremes: {
      temperatureMin: emptyTimedObservation(),
      temperatureMax: emptyTimedObservation(),
      humidityMin: emptyTimedObservation(),
      humidityMax: emptyTimedObservation(),
      dewPointMin: emptyTimedObservation(),
      dewPointMax: emptyTimedObservation(),
      windSpeedMax: emptyTimedObservation(),
    },
    accumulated: {
      rainDaily: null,
      rainMonthly: null,
      rainAnnual: null,
      evapotranspirationDaily: null,
      evapotranspirationMonthly: null,
      evapotranspirationAnnual: null,
    },
    source: {
      name: "Embrapa Clima Temperado",
      station: "Posto Meteorológico da Sede",
      url: EMBRAPA_URL,
      latitude: -31.7,
      longitude: -52.4,
      altitude: 57,
      fetchedAt,
      observationTime: null,
    },
    error: "Leitura temporariamente indisponível.",
  };
}

function unavailableSource(
  source: WeatherSourceKey,
  role: WeatherSourceHealth["role"],
  fetchedAt: string,
): WeatherSourceHealth {
  return {
    source,
    status: "unavailable",
    role,
    fetchedAt,
    usable: false,
    reason: "Fonte temporariamente indisponível.",
  };
}

export function createUnavailableWeatherIntelligence(): WeatherIntelligenceData {
  const fetchedAt = new Date().toISOString();
  const sources: Record<WeatherSourceKey, WeatherSourceHealth> = {
    "open-meteo": unavailableSource("open-meteo", "forecast", fetchedAt),
    "met-norway": unavailableSource("met-norway", "forecast", fetchedAt),
    embrapa: unavailableSource("embrapa", "observation", fetchedAt),
    inmet: unavailableSource("inmet", "official", fetchedAt),
    cppmet: unavailableSource("cppmet", "forecast-context", fetchedAt),
  };
  const weather: AggregatedWeatherData = {
    status: "unavailable",
    current: null,
    currentProvenance: {},
    hourly: [],
    daily: [],
    observation: unavailableObservation(fetchedAt),
    alerts: [],
    inmetForecast: [],
    inmetStation: null,
    officialForecast: [],
    sources,
    quality: {
      score: 0,
      confidence: "low",
      currentSource: null,
      forecastSource: null,
      forecastProvider: null,
      degradedSources: ["embrapa", "inmet", "cppmet", "open-meteo", "met-norway"],
      observationAgeMinutes: null,
      discrepancies: [],
      notes: [
        "A consolidação meteorológica falhou de forma inesperada; a interface foi preservada sem inserir valores demonstrativos.",
      ],
    },
    source: {
      name: "MOBI Tempo Pelotas",
      kind: "aggregated",
      fetchedAt,
    },
    message:
      "Os dados meteorológicos estão temporariamente indisponíveis. A página permanece acessível e pode ser atualizada novamente em alguns instantes.",
  };

  return {
    weather,
    brief: {
      headline: "Dados meteorológicos temporariamente indisponíveis",
      summary:
        "As fontes não forneceram dados suficientes para montar a leitura meteorológica neste momento.",
      highlights: [],
      cautions: ["Consulte novamente em alguns instantes e priorize avisos oficiais quando necessário."],
    },
    intelligence: {
      origin: "deterministic",
      geminiStatus: "unavailable",
      model: null,
      generatedAt: fetchedAt,
      error: "Falha inesperada na consolidação meteorológica.",
    },
  };
}
