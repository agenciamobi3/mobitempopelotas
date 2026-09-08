import { createServerFn } from "@tanstack/react-start";
import { setResponseHeaders } from "@tanstack/react-start/server";

import { CURRENT_DATA_NO_STORE_HEADERS } from "@/lib/current-data-cache";
import { fetchAnaRhnHistoricalConsistency } from "./ana-rhn-consistency.server";

export const getAnaRhnHistoricalConsistency = createServerFn({ method: "GET" }).handler(async () => {
  setResponseHeaders(new Headers(CURRENT_DATA_NO_STORE_HEADERS));
  return fetchAnaRhnHistoricalConsistency();
});
