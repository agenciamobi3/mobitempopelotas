import { createServerFn } from "@tanstack/react-start";
import { setResponseHeaders } from "@tanstack/react-start/server";

import { CURRENT_DATA_NO_STORE_HEADERS } from "@/lib/current-data-cache";
import { fetchAnaRhnRegionalInventory } from "./ana-rhn-regional.server";

export const getAnaRhnRegionalInventory = createServerFn({ method: "GET" }).handler(async () => {
  setResponseHeaders(new Headers(CURRENT_DATA_NO_STORE_HEADERS));
  return fetchAnaRhnRegionalInventory();
});
