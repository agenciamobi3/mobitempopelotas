import { fetchOpenMeteoPayloadViaEdge } from "./open-meteo-edge.server";
import {
  createOpenMeteoForecastUrl,
  normalizeOpenMeteoWeather,
} from "./open-meteo.server";
import type { WeatherHomeData } from "./types";

const DIRECT_REQUEST_TIMEOUT_MS = 1_800;
const OPEN_METEO_URL = "https://open-meteo.com/";

type NormalizedOpenMeteoInput = Parameters<typeof normalizeOpenMeteoWeather>[0];

function unavailableDirectWeather(message: string): WeatherHomeData {
  return {
    status: "unavailable",
    current: null,
    hourly: [],
    daily: [],
    source: {
      name: "Open-Meteo",
      url: OPEN_METEO_URL,
      kind: "forecast",
      key: "open-meteo",
      fetchedAt: new Date().toISOString(),
      isFallback: true,
      model: "Open-Meteo Best Match",
      modelRun: null,
      temporalResolutionMinutes: 60,
    },
    message,
  };
}

async function fetchOpenMeteoDirectFast(): Promise<WeatherHomeData> {
  try {
    const response = await fetch(createOpenMeteoForecastUrl(), {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "User-Agent": "MOBI-Tempo-Pelotas/2.0 (+https://tempopelotas.com.br)",
      },
      signal: AbortSignal.timeout(DIRECT_REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new Error(`Open-Meteo respondeu com status ${response.status}`);
    }

    return normalizeOpenMeteoWeather((await response.json()) as NormalizedOpenMeteoInput);
  } catch (error) {
    console.warn("[weather/open-meteo-resilient] Origem direta indisponível", {
      message: error instanceof Error ? error.message : String(error),
    });
    return unavailableDirectWeather("A previsão do Open-Meteo está temporariamente indisponível.");
  }
}

export async function fetchPelotasWeather(): Promise<WeatherHomeData> {
  const direct = await fetchOpenMeteoDirectFast();
  if (direct.status !== "unavailable") return direct;

  try {
    const edge = await fetchOpenMeteoPayloadViaEdge();
    const normalized = normalizeOpenMeteoWeather(edge.payload as NormalizedOpenMeteoInput);

    return {
      ...normalized,
      source: {
        ...normalized.source,
        fetchedAt: edge.fetchedAt ?? normalized.source.fetchedAt,
        isFallback: true,
      },
      message:
        edge.cacheStatus === "stale"
          ? edge.warning ?? "A última previsão válida do Open-Meteo foi preservada durante uma atualização."
          : normalized.message,
    };
  } catch (error) {
    console.warn("[weather/open-meteo-resilient] Origem direta e contingência Edge indisponíveis", {
      message: error instanceof Error ? error.message : String(error),
    });
    return direct;
  }
}
