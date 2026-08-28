import { createServerFn } from "@tanstack/react-start";
import { setResponseHeaders } from "@tanstack/react-start/server";

import {
  getDataStatusHistoryFreshness,
  staleHistoryMessage,
} from "./data-status-freshness.server";
import { collectDataStatus } from "./data-status.server";
import { getDataStatusHistory } from "./data-status-storage.server";

export const getDataStatusPageData = createServerFn({ method: "GET" }).handler(async () => {
  setResponseHeaders(
    new Headers({
      "Cache-Control": "public, max-age=60, stale-while-revalidate=60",
      "CDN-Cache-Control": "max-age=60, stale-while-revalidate=120",
    }),
  );

  const [overview, history, freshness] = await Promise.all([
    collectDataStatus(),
    getDataStatusHistory(),
    getDataStatusHistoryFreshness(),
  ]);

  const safeHistory =
    history.available && freshness.stale
      ? {
          ...history,
          available: false as const,
          error: staleHistoryMessage(freshness.latestAt),
        }
      : history;

  return { ...overview, history: safeHistory };
});
