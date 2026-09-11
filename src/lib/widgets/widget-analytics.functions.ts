import type { SupabaseClient } from "@supabase/supabase-js";
import { createServerFn } from "@tanstack/react-start";
import { getRequest, setResponseHeaders } from "@tanstack/react-start/server";
import { z } from "zod";

import type { Database } from "@/lib/supabase/database.types";
import { createSupabaseRequestClient } from "@/lib/supabase/request-client.server";
import {
  createSupabaseAdminClient,
  getSupabaseServerConfig,
} from "@/lib/supabase/server-client.server";

const widgetImpressionSchema = z.object({
  token: z.string().uuid(),
  host: z
    .string()
    .trim()
    .toLowerCase()
    .min(1)
    .max(253)
    .regex(/^[a-z0-9](?:[a-z0-9.-]{0,251}[a-z0-9])?$/),
});

type WidgetAnalyticsRow = {
  widget_id: string;
  impressions_today: number | string;
  impressions_7d: number | string;
  impressions_30d: number | string;
  active_hosts_30d: number | string;
};

type WidgetAnalyticsDatabase = Omit<Database, "public"> & {
  public: Omit<Database["public"], "Functions"> & {
    Functions: Database["public"]["Functions"] & {
      record_widget_impression: {
        Args: { p_token: string; p_host: string };
        Returns: boolean;
      };
      get_user_widget_analytics: {
        Args: Record<PropertyKey, never>;
        Returns: WidgetAnalyticsRow[];
      };
    };
  };
};

export type WidgetAnalyticsSummary = {
  today: number;
  last7Days: number;
  last30Days: number;
  activeHosts30Days: number;
};

export type WidgetAnalyticsSnapshot = Record<string, WidgetAnalyticsSummary>;

function privateNoStoreHeaders() {
  const headers = new Headers();
  headers.set("Cache-Control", "private, no-store, max-age=0");
  headers.set("Pragma", "no-cache");
  headers.set("Vary", "Cookie, Authorization");
  setResponseHeaders(headers);
}

function safeCount(value: number | string) {
  const count = Number(value);
  return Number.isFinite(count) && count > 0 ? Math.trunc(count) : 0;
}

export const recordWidgetImpression = createServerFn({ method: "POST" })
  .validator(widgetImpressionSchema)
  .handler(async ({ data }) => {
    const config = getSupabaseServerConfig();
    if (!config.isAdminConfigured) return { ok: false as const, code: "unavailable" as const };

    const client = createSupabaseAdminClient() as unknown as SupabaseClient<WidgetAnalyticsDatabase>;
    const { error } = await client.rpc("record_widget_impression", {
      p_token: data.token,
      p_host: data.host,
    });

    if (error) {
      console.warn("[widgets] Não foi possível registrar impressão", {
        code: error.code,
        message: error.message,
      });
      return { ok: false as const, code: "storage" as const };
    }

    return { ok: true as const };
  });

export const getWidgetAnalyticsSnapshot = createServerFn({ method: "GET" }).handler(
  async (): Promise<WidgetAnalyticsSnapshot> => {
    const config = getSupabaseServerConfig();
    if (!config.isPublicConfigured) {
      privateNoStoreHeaders();
      return {};
    }

    const { client, responseHeaders } = createSupabaseRequestClient(getRequest());
    const {
      data: { user },
    } = await client.auth.getUser();

    if (!user) {
      privateNoStoreHeaders();
      return {};
    }

    const analyticsClient = client as unknown as SupabaseClient<WidgetAnalyticsDatabase>;
    const { data, error } = await analyticsClient.rpc("get_user_widget_analytics", {});

    responseHeaders.set("Cache-Control", "private, no-store, max-age=0");
    responseHeaders.set("Pragma", "no-cache");
    responseHeaders.set("Vary", "Cookie, Authorization");
    setResponseHeaders(responseHeaders);

    if (error) {
      console.warn("[widgets] Não foi possível carregar analytics dos widgets", {
        code: error.code,
        message: error.message,
      });
      return {};
    }

    return Object.fromEntries(
      (data ?? []).map((row) => [
        row.widget_id,
        {
          today: safeCount(row.impressions_today),
          last7Days: safeCount(row.impressions_7d),
          last30Days: safeCount(row.impressions_30d),
          activeHosts30Days: safeCount(row.active_hosts_30d),
        },
      ]),
    );
  },
);
