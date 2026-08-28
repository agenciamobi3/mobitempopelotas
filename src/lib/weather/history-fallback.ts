import type { WeatherHistoryData } from "./history.types";

export function createUnavailableWeatherHistory(
  message = "O histórico meteorológico está temporariamente indisponível.",
): WeatherHistoryData {
  return {
    status: "unavailable",
    days: [],
    summary: null,
    source: {
      name: "Open-Meteo / NASA POWER",
      url: "https://open-meteo.com/",
      fetchedAt: new Date().toISOString(),
      periodStart: null,
      periodEnd: null,
    },
    error: message,
  };
}
