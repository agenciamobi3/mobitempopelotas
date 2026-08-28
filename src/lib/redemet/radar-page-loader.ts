import { createUnavailableWeatherIntelligence } from "@/lib/weather/weather-intelligence-fallback";
import { getWeatherIntelligence } from "@/lib/weather/weather-intelligence.functions";

import { createUnavailableRedemetOverview } from "./redemet-fallback";
import { getRedemetOverview } from "./redemet.functions";

const PUBLIC_RADAR_PAGE_DEADLINE_MS = 4_000;

async function settlePageDependency<T>(
  promise: Promise<T>,
  fallback: () => T,
): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((resolve) => {
        timeout = setTimeout(
          () => resolve(fallback()),
          PUBLIC_RADAR_PAGE_DEADLINE_MS,
        );
      }),
    ]);
  } catch {
    return fallback();
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

export async function loadRadarPageData() {
  const [redemetResult, weatherResult] = await Promise.allSettled([
    settlePageDependency(getRedemetOverview(), createUnavailableRedemetOverview),
    settlePageDependency(
      getWeatherIntelligence(),
      createUnavailableWeatherIntelligence,
    ),
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
