import type {
  AggregatedWeatherData,
  WeatherSourceHealth,
  WeatherSourceKey,
} from "./aggregated-weather.types";
import type { CurrentWeatherObservation } from "./current-observation.types";
import type { WeatherIntelligenceData } from "./weather-intelligence.types";

const DEFESA_CIVIL_MAP_URL = "https://redehidrometeorologica.defesacivil.rs.gov.br/Mapa";
const DEFESA_CIVIL_DOCS_URL = "https://sistemas.defesacivil.rs.gov.br/api-redehidrometeorologica";

function unavailableObservation(fetchedAt: string): CurrentWeatherObservation {
  return {
    status: "unavailable",
    station: {
      code: null,
      name: "Estação meteorológica recente não disponível",
      basin: null,
      region: null,
      latitude: null,
      longitude: null,
      altitudeM: null,
      distanceFromPelotasKm: null,
    },
    current: {
      temperature: null,
      feelsLike: null,
      humidity: null,
      dewPoint: null,
      pressure: null,
      windSpeed: null,
      windGust: null,
      windDirection: null,
      windDirectionDegrees: null,
    },
    rain: { h1Mm: null, h3Mm: null, h6Mm: null, h12Mm: null, h24Mm: null },
    source: {
      name: "Defesa Civil RS — Rede de Monitoramento Hidrometeorológico",
      url: DEFESA_CIVIL_MAP_URL,
      documentationUrl: DEFESA_CIVIL_DOCS_URL,
      fetchedAt,
      observedAt: null,
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
    "defesa-civil-rs": unavailableSource("defesa-civil-rs", "observation", fetchedAt),
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
      degradedSources: ["defesa-civil-rs", "inmet", "cppmet", "open-meteo", "met-norway"],
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
