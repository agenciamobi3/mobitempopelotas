import { createServerFn } from "@tanstack/react-start";
import { setResponseHeaders } from "@tanstack/react-start/server";

import { fetchEmbrapaObservation } from "./embrapa-observation.server";

export const getEmbrapaObservation = createServerFn({ method: "GET" }).handler(async () => {
  setResponseHeaders(
    new Headers({
      "Cache-Control": "public, max-age=300, stale-while-revalidate=300",
      "CDN-Cache-Control": "max-age=300, stale-while-revalidate=300",
    }),
  );

  return fetchEmbrapaObservation();
});
