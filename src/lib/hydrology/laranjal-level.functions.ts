import { createServerFn } from "@tanstack/react-start";
import { setResponseHeaders } from "@tanstack/react-start/server";

import { CURRENT_DATA_NO_STORE_HEADERS } from "@/lib/current-data-cache";
import { fetchLastKnownLaranjalLevelData } from "./laranjal-last-known.server";
import { fetchLaranjalLevelData } from "./laranjal-level.server";

const PUBLIC_LARANJAL_SOURCE_DEADLINE_MS = 1_800;

export const getLaranjalLevelData = createServerFn({ method: "GET" }).handler(async () => {
  setResponseHeaders(new Headers(CURRENT_DATA_NO_STORE_HEADERS));

  const [current, lastKnown] = await Promise.all([
    fetchLaranjalLevelData({ deadlineMs: PUBLIC_LARANJAL_SOURCE_DEADLINE_MS }),
    fetchLastKnownLaranjalLevelData(),
  ]);

  if (current.status !== "unavailable") return current;
  return lastKnown ?? current;
});
