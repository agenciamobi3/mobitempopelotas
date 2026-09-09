import { createServerFn } from "@tanstack/react-start";
import { setResponseHeaders } from "@tanstack/react-start/server";

import {
  createUnavailableExtendedForecast,
  fetchPelotasExtendedForecast,
} from "./extended-forecast.server";
import type { ExtendedForecastData } from "./extended-forecast.types";

function setExtendedForecastCacheHeaders(status: ExtendedForecastData["status"]) {
  if (status === "live") {
    setResponseHeaders(
      new Headers({
        "Cache-Control": "public, max-age=300, stale-while-revalidate=300",
        "CDN-Cache-Control": "max-age=300, stale-while-revalidate=300",
      }),
    );
    return;
  }

  if (status === "partial") {
    setResponseHeaders(
      new Headers({
        "Cache-Control": "public, max-age=60, stale-while-revalidate=120",
        "CDN-Cache-Control": "max-age=60, stale-while-revalidate=120",
      }),
    );
    return;
  }

  setResponseHeaders(
    new Headers({
      "Cache-Control": "no-store, max-age=0",
      "CDN-Cache-Control": "no-store, max-age=0",
    }),
  );
}

export const getPelotasExtendedForecast = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const forecast = await fetchPelotasExtendedForecast();
    setExtendedForecastCacheHeaders(forecast.status);
    return forecast;
  } catch (error) {
    console.error("[weather/extended-forecast] Falha final do contrato público", {
      message: error instanceof Error ? error.message : String(error),
    });
    const unavailable = createUnavailableExtendedForecast(
      "A previsão de 15 dias está temporariamente indisponível.",
    );
    setExtendedForecastCacheHeaders(unavailable.status);
    return unavailable;
  }
});
