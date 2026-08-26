import { createServerFn } from "@tanstack/react-start";
import { setResponseHeaders } from "@tanstack/react-start/server";

import {
  createUnavailableExtendedForecast,
  fetchPelotasExtendedForecast,
} from "./extended-forecast.server";

export const getPelotasExtendedForecast = createServerFn({ method: "GET" }).handler(async () => {
  setResponseHeaders(
    new Headers({
      "Cache-Control": "public, max-age=300, stale-while-revalidate=300",
      "CDN-Cache-Control": "max-age=300, stale-while-revalidate=300",
    }),
  );

  try {
    return await fetchPelotasExtendedForecast();
  } catch (error) {
    console.error("[weather/extended-forecast] Falha final do contrato público", {
      message: error instanceof Error ? error.message : String(error),
    });
    return createUnavailableExtendedForecast(
      "A previsão de 15 dias está temporariamente indisponível.",
    );
  }
});
