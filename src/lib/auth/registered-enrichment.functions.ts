import { createServerFn } from "@tanstack/react-start";
import { getRequest, setResponseHeaders } from "@tanstack/react-start/server";

import { createSupabaseRequestClient } from "@/lib/supabase/request-client.server";
import { getSupabaseServerConfig } from "@/lib/supabase/server-client.server";

export type RegisteredEnrichmentAccess =
  | { status: "authenticated" }
  | { status: "unauthenticated" }
  | { status: "unavailable" };

function applyPrivateHeaders(headers = new Headers()) {
  headers.set("Cache-Control", "private, no-store, max-age=0");
  headers.set("Pragma", "no-cache");
  headers.set("Vary", "Cookie, Authorization");
  setResponseHeaders(headers);
}

export const getRegisteredEnrichmentAccess = createServerFn({ method: "GET" }).handler(
  async (): Promise<RegisteredEnrichmentAccess> => {
    const config = getSupabaseServerConfig();
    if (!config.isPublicConfigured) {
      applyPrivateHeaders();
      return { status: "unavailable" };
    }

    const { client, responseHeaders } = createSupabaseRequestClient(getRequest());
    const {
      data: { user },
    } = await client.auth.getUser();

    applyPrivateHeaders(responseHeaders);
    return user ? { status: "authenticated" } : { status: "unauthenticated" };
  },
);
