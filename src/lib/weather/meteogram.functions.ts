import { createServerFn } from "@tanstack/react-start";
import { setResponseHeaders } from "@tanstack/react-start/server";

import { fetchPelotasMeteogram } from "./meteogram.server";

export const getPelotasMeteogram = createServerFn({ method: "GET" }).handler(async () => {
  const data = await fetchPelotasMeteogram();

  const headers =
    data.status === "live"
      ? {
          "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
          "CDN-Cache-Control": "max-age=300, stale-while-revalidate=900",
        }
      : data.status === "partial"
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
