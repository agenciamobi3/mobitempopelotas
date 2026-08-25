import { fetchOpenMeteoPayloadViaEdge } from "./open-meteo-edge.server";
import {
  fetchPelotasWeather as fetchOpenMeteoDirect,
  normalizeOpenMeteoWeather,
} from "./open-meteo.server";
import type { WeatherHomeData } from "./types";

type NormalizedOpenMeteoInput = Parameters<typeof normalizeOpenMeteoWeather>[0];

export async function fetchPelotasWeather(): Promise<WeatherHomeData> {
  const direct = await fetchOpenMeteoDirect();
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
