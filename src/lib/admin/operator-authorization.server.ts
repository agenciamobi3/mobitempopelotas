import { getRequest, setResponseHeaders } from "@tanstack/react-start/server";

import { createSupabaseRequestClient } from "@/lib/supabase/request-client.server";
import { getSupabaseServerConfig } from "@/lib/supabase/server-client.server";

export type PortalOperatorAuthorization =
  | { status: "authorized"; userId: string }
  | { status: "unauthenticated" }
  | { status: "forbidden" }
  | { status: "unavailable" };

function operatorEmails() {
  return new Set(
    (process.env.MOBI_PORTAL_ADMIN_EMAILS ?? "")
      .split(/[;,\n]/)
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isPortalOperatorEmail(email: string | null | undefined) {
  const normalizedEmail = email?.trim().toLowerCase();
  if (!normalizedEmail) return false;
  return operatorEmails().has(normalizedEmail);
}

function applyPrivateHeaders(headers: Headers) {
  headers.set("Cache-Control", "private, no-store, max-age=0");
  headers.set("Pragma", "no-cache");
  headers.set("Vary", "Cookie, Authorization");
  setResponseHeaders(headers);
}

export async function authorizePortalOperator(): Promise<PortalOperatorAuthorization> {
  const config = getSupabaseServerConfig();
  if (!config.isPublicConfigured || !config.isAdminConfigured) {
    return { status: "unavailable" };
  }

  const allowlist = operatorEmails();
  if (allowlist.size === 0) {
    return { status: "unavailable" };
  }

  const { client, responseHeaders } = createSupabaseRequestClient(getRequest());
  const {
    data: { user },
    error,
  } = await client.auth.getUser();

  applyPrivateHeaders(responseHeaders);

  if (error || !user) return { status: "unauthenticated" };
  if (!user.email_confirmed_at) return { status: "forbidden" };
  if (!isPortalOperatorEmail(user.email)) return { status: "forbidden" };

  return { status: "authorized", userId: user.id };
}
