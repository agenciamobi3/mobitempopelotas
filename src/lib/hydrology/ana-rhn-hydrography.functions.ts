import { createServerFn } from "@tanstack/react-start";
import { setResponseHeaders } from "@tanstack/react-start/server";

import { CURRENT_DATA_NO_STORE_HEADERS } from "@/lib/current-data-cache";
import { fetchAnaRhnRegionalHydrography } from "./ana-rhn-hydrography.server";

export const getAnaRhnRegionalHydrography = createServerFn({ method: "GET" }).handler(async () => {
  setResponseHeaders(new Headers(CURRENT_DATA_NO_STORE_HEADERS));
  return fetchAnaRhnRegionalHydrography();
});
