import { createFileRoute } from "@tanstack/react-router";

import { CURRENT_DATA_NO_STORE_HEADERS } from "@/lib/current-data-cache";
import {
  getFreshEmbrapaObservation,
  isPublishableEmbrapaObservation,
} from "@/lib/weather/embrapa-current.server";

const RESPONSE_HEADERS = {
  ...CURRENT_DATA_NO_STORE_HEADERS,
  "Content-Type": "application/json; charset=utf-8",
  "X-Content-Type-Options": "nosniff",
  "X-Robots-Tag": "noindex, follow",
} as const;

async function currentEmbrapaObservation() {
  const observation = await getFreshEmbrapaObservation();
  const publishable = isPublishableEmbrapaObservation(observation);

  return new Response(JSON.stringify(observation), {
    status: publishable ? 200 : 503,
    headers: RESPONSE_HEADERS,
  });
}

export const Route = createFileRoute("/api/weather/embrapa")({
  server: {
    handlers: {
      GET: () => currentEmbrapaObservation(),
    },
  },
});
