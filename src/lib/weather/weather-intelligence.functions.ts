import { createServerFn } from "@tanstack/react-start";
import { setResponseHeaders } from "@tanstack/react-start/server";

import { CURRENT_DATA_NO_STORE_HEADERS } from "@/lib/current-data-cache";
import { createUnavailableWeatherIntelligence } from "./weather-intelligence-fallback";
import { fetchWeatherIntelligence } from "./weather-intelligence.server";
import type { WeatherIntelligenceData } from "./weather-intelligence.types";

const WEATHER_INTELLIGENCE_DEADLINE_MS = 5_000;

async function fetchWeatherIntelligenceWithinDeadline(): Promise<WeatherIntelligenceData> {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      fetchWeatherIntelligence(),
      new Promise<WeatherIntelligenceData>((resolve) => {
        timeout = setTimeout(() => {
          console.warn("[weather/intelligence] Prazo máximo da consolidação atingido", {
            deadlineMs: WEATHER_INTELLIGENCE_DEADLINE_MS,
          });
          resolve(createUnavailableWeatherIntelligence());
        }, WEATHER_INTELLIGENCE_DEADLINE_MS);
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

export const getWeatherIntelligence = createServerFn({ method: "GET" }).handler(async () => {
  setResponseHeaders(new Headers(CURRENT_DATA_NO_STORE_HEADERS));

  try {
    return await fetchWeatherIntelligenceWithinDeadline();
  } catch (error) {
    console.error("[weather/intelligence] Falha final da consolidação meteorológica", {
      message: error instanceof Error ? error.message : String(error),
    });
    return createUnavailableWeatherIntelligence();
  }
});
