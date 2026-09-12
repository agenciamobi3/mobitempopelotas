import { createServerFn } from "@tanstack/react-start";
import { getRequest, setResponseHeaders } from "@tanstack/react-start/server";

import {
  resolveAccountAccess,
  type EffectiveAccountAccess,
} from "@/lib/auth/account-access";
import { createSupabaseRequestClient } from "@/lib/supabase/request-client.server";
import { getSupabaseServerConfig } from "@/lib/supabase/server-client.server";

const OBSERVATORY_ROBOTS_POLICY = "noindex, nofollow, noarchive, nosnippet, noimageindex";

export type ObservatoryAccessSnapshot =
  | { status: "unavailable" }
  | { status: "unauthenticated" }
  | {
      status: "authenticated";
      allowed: boolean;
      access: EffectiveAccountAccess;
    };

function applyObservatoryPrivateHeaders(headers: Headers) {
  headers.set("Cache-Control", "private, no-store, max-age=0");
  headers.set("CDN-Cache-Control", "no-store");
  headers.set("Pragma", "no-cache");
  headers.set("Vary", "Cookie, Authorization");
  headers.set("X-Robots-Tag", OBSERVATORY_ROBOTS_POLICY);
  setResponseHeaders(headers);
}

async function loadAccountAccess(client: ReturnType<typeof createSupabaseRequestClient>["client"], userId: string) {
  return client
    .from("account_access")
    .select("tier,status,source,valid_until")
    .eq("user_id", userId)
    .maybeSingle();
}

export const getObservatoryAccess = createServerFn({ method: "GET" }).handler(
  async (): Promise<ObservatoryAccessSnapshot> => {
    const config = getSupabaseServerConfig();
    if (!config.isPublicConfigured) {
      applyObservatoryPrivateHeaders(new Headers());
      return { status: "unavailable" };
    }

    const { client, responseHeaders } = createSupabaseRequestClient(getRequest());
    const {
      data: { user },
    } = await client.auth.getUser();

    if (!user) {
      applyObservatoryPrivateHeaders(responseHeaders);
      return { status: "unauthenticated" };
    }

    let accessResult = await loadAccountAccess(client, user.id);

    if (!accessResult.error && !accessResult.data) {
      const { error: repairError } = await client.rpc("ensure_current_user_account_foundation");
      if (repairError) {
        console.error("[observatory] Falha ao reparar fundação da conta", {
          code: repairError.code,
          message: repairError.message,
        });
      } else {
        accessResult = await loadAccountAccess(client, user.id);
      }
    }

    if (accessResult.error || !accessResult.data) {
      console.error("[observatory] Falha ao resolver acesso", {
        message: accessResult.error?.message,
        code: accessResult.error?.code,
      });
      applyObservatoryPrivateHeaders(responseHeaders);
      return { status: "unavailable" };
    }

    const access = resolveAccountAccess({
      tier: accessResult.data.tier,
      status: accessResult.data.status,
      source: accessResult.data.source,
      validUntil: accessResult.data.valid_until,
    });

    applyObservatoryPrivateHeaders(responseHeaders);

    return {
      status: "authenticated",
      allowed: access.entitlements.observatoryAccess,
      access,
    };
  },
);
