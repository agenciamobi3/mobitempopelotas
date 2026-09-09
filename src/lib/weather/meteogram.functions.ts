import { createServerFn } from "@tanstack/react-start";
import { setResponseHeaders } from "@tanstack/react-start/server";

import { fetchPelotasMeteogram } from "./meteogram.server";

export const getPelotasMeteogram = createServerFn({ method: "GET" }).handler(async () => {
  const data = await fetchPelotasMeteogram();
  const complete = data.status === "live" && data.hours.length >= data.source.forecastHours;
  const usable = data.status === "live" && data.hours.length > 0;

  const headers = complete
    ? {
        "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
        "CDN-Cache-Control": "max-age=300, stale-while-revalidate=900",
      }
    : usable
      ? {
          "Cache-Control": "public, max-age=60, stale-while-revalidate=120",
          "CDN-Cache-Control": "max-age=60, stale-while-revalidate=120",
        }
      : {
          "Cache-Control": "no-store, max-age=0",
          "CDN-Cache-Control": "no-store",
        };

  setResponseHeaders(new Headers(headers));
  return data;
});
