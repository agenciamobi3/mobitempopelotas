import { createServerFn } from "@tanstack/react-start";
import { setResponseHeaders } from "@tanstack/react-start/server";

import { CURRENT_DATA_NO_STORE_HEADERS } from "@/lib/current-data-cache";
import {
  getDataStatusHistoryFreshness,
  staleHistoryMessage,
} from "./data-status-freshness.server";
import { collectDataStatusWithIndependentRedemet } from "./data-status-redemet-probes.server";
import { getDataStatusHistory } from "./data-status-storage.server";

export const getDataStatusPageData = createServerFn({ method: "GET" }).handler(async () => {
  setResponseHeaders(new Headers(CURRENT_DATA_NO_STORE_HEADERS));

  const [overview, history, freshness] = await Promise.all([
    collectDataStatusWithIndependentRedemet(),
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
