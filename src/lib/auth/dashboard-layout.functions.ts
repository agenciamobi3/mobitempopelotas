import type { SupabaseClient } from "@supabase/supabase-js";
import { createServerFn } from "@tanstack/react-start";
import { getRequest, setResponseHeaders } from "@tanstack/react-start/server";

import {
  dashboardLayoutSchema,
  normalizeDashboardLayout,
  type DashboardLayout,
} from "@/lib/auth/dashboard-layout";
import type { Database, Json } from "@/lib/supabase/database.types";
import { createSupabaseRequestClient } from "@/lib/supabase/request-client.server";
import { getSupabaseServerConfig } from "@/lib/supabase/server-client.server";

export type DashboardPreferencesDatabase = Omit<Database, "public"> & {
  public: Omit<Database["public"], "Tables"> & {
    Tables: Omit<Database["public"]["Tables"], "user_preferences"> & {
      user_preferences: {
        Row: Database["public"]["Tables"]["user_preferences"]["Row"] & {
          dashboard_layout: Json;
        };
        Insert: Database["public"]["Tables"]["user_preferences"]["Insert"] & {
          dashboard_layout?: Json;
        };
        Update: Database["public"]["Tables"]["user_preferences"]["Update"] & {
          dashboard_layout?: Json;
        };
        Relationships: [];
      };
    };
  };
};

function applyPrivateHeaders(headers = new Headers()) {
  headers.set("Cache-Control", "private, no-store, max-age=0");
  headers.set("Pragma", "no-cache");
  headers.set("Vary", "Cookie, Authorization");
  setResponseHeaders(headers);
}

function persistLayout(
  client: SupabaseClient<DashboardPreferencesDatabase>,
  userId: string,
  layout: DashboardLayout,
) {
  return client
    .from("user_preferences")
    .update({
      dashboard_layout: layout as unknown as Json,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .select("dashboard_layout")
    .maybeSingle();
}

export const saveAccountDashboardLayout = createServerFn({ method: "POST" })
  .validator(dashboardLayoutSchema)
  .handler(async ({ data }) => {
    const config = getSupabaseServerConfig();
    if (!config.isPublicConfigured) {
      applyPrivateHeaders();
      return { ok: false as const, code: "unavailable" as const };
    }

    const { client, responseHeaders } = createSupabaseRequestClient(getRequest());
    const {
      data: { user },
    } = await client.auth.getUser();

    if (!user) {
      applyPrivateHeaders(responseHeaders);
      return { ok: false as const, code: "unauthenticated" as const };
    }

    const dashboardClient = client as unknown as SupabaseClient<DashboardPreferencesDatabase>;
    const layout = normalizeDashboardLayout(data) satisfies DashboardLayout;
    let result = await persistLayout(dashboardClient, user.id, layout);

    if (!result.error && !result.data) {
      const repair = await client.rpc("ensure_current_user_account_foundation");
      if (!repair.error) {
        result = await persistLayout(dashboardClient, user.id, layout);
      } else {
        console.error("[account/layout] Falha ao reparar preferências antes de salvar layout", {
          code: repair.error.code,
          message: repair.error.message,
        });
      }
    }

    applyPrivateHeaders(responseHeaders);

    if (result.error || !result.data) {
      console.error("[account/layout] Falha ao salvar layout do painel", {
        code: result.error?.code,
        message: result.error?.message ?? "Nenhuma linha de preferências foi atualizada.",
      });
      return { ok: false as const, code: "storage" as const };
    }

    return { ok: true as const, layout: normalizeDashboardLayout(result.data.dashboard_layout) };
  });
