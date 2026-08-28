import { createUnavailableWeatherIntelligence } from "@/lib/weather/weather-intelligence-fallback";
import { getWeatherIntelligence } from "@/lib/weather/weather-intelligence.functions";

import { createUnavailableRedemetOverview } from "./redemet-fallback";
import { getRedemetOverview } from "./redemet.functions";

export async function loadRadarPageData() {
  const [redemetResult, weatherResult] = await Promise.allSettled([
    getRedemetOverview(),
    getWeatherIntelligence(),
  ]);

  return {
    redemet:
      redemetResult.status === "fulfilled"
        ? redemetResult.value
        : createUnavailableRedemetOverview(),
    weather:
      weatherResult.status === "fulfilled"
        ? weatherResult.value
        : createUnavailableWeatherIntelligence(),
  };
}
