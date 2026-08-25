import { createServerFn } from "@tanstack/react-start";
import { setResponseHeaders } from "@tanstack/react-start/server";

import { createUnavailableWeatherIntelligence } from "./weather-intelligence-fallback";
import { fetchWeatherIntelligence } from "./weather-intelligence.server";

export const getWeatherIntelligence = createServerFn({ method: "GET" }).handler(async () => {
  setResponseHeaders(
    new Headers({
      "Cache-Control": "public, max-age=45, stale-while-revalidate=15",
      "CDN-Cache-Control": "max-age=45, stale-while-revalidate=15",
    }),
  );

  try {
    return await fetchWeatherIntelligence();
  } catch (error) {
    console.error("[weather/intelligence] Falha final da consolidação meteorológica", {
      message: error instanceof Error ? error.message : String(error),
    });
    return createUnavailableWeatherIntelligence();
  }
});
