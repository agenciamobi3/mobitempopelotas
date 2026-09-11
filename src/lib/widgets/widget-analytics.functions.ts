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

const SAO_PAULO_TIME_ZONE = "America/Sao_Paulo";
const DAY_MS = 24 * 60 * 60 * 1_000;

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

type WidgetUsageDailyRow = {
  widget_id: string;
  user_id: string;
  site_host: string;
  day: string;
  loads: number | string;
  first_seen_at: string;
  last_seen_at: string;
};

type WidgetAnalyticsDatabase = Omit<Database, "public"> & {
  public: Omit<Database["public"], "Tables" | "Functions"> & {
    Tables: Database["public"]["Tables"] & {
      widget_usage_daily: {
        Row: WidgetUsageDailyRow;
        Insert: WidgetUsageDailyRow;
        Update: Partial<WidgetUsageDailyRow>;
        Relationships: [];
      };
    };
    Functions: Database["public"]["Functions"] & {
      record_widget_load: {
        Args: { p_token: string; p_site_host: string };
        Returns: boolean;
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

function privateNoStoreHeaders(headers = new Headers()) {
  headers.set("Cache-Control", "private, no-store, max-age=0");
  headers.set("Pragma", "no-cache");
  headers.set("Vary", "Cookie, Authorization");
  setResponseHeaders(headers);
}

function safeCount(value: number | string) {
  const count = Number(value);
  return Number.isFinite(count) && count > 0 ? Math.trunc(count) : 0;
}

function saoPauloDateKey(daysAgo: number) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: SAO_PAULO_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(Date.now() - daysAgo * DAY_MS));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export const recordWidgetImpression = createServerFn({ method: "POST" })
  .validator(widgetImpressionSchema)
  .handler(async ({ data }) => {
    const config = getSupabaseServerConfig();
    if (!config.isAdminConfigured) return { ok: false as const, code: "unavailable" as const };

    const client = createSupabaseAdminClient() as unknown as SupabaseClient<WidgetAnalyticsDatabase>;
    const { error } = await client.rpc("record_widget_load", {
      p_token: data.token,
      p_site_host: data.host,
    });

    if (error) {
      console.warn("[widgets] Não foi possível registrar visualização", {
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
      privateNoStoreHeaders(responseHeaders);
      return {};
    }

    const today = saoPauloDateKey(0);
    const sevenDaysAgo = saoPauloDateKey(6);
    const thirtyDaysAgo = saoPauloDateKey(29);
    const analyticsClient = client as unknown as SupabaseClient<WidgetAnalyticsDatabase>;
    const { data, error } = await analyticsClient
      .from("widget_usage_daily")
      .select("widget_id,site_host,day,loads")
      .eq("user_id", user.id)
      .gte("day", thirtyDaysAgo);

    privateNoStoreHeaders(responseHeaders);

    if (error) {
      console.warn("[widgets] Não foi possível carregar analytics dos widgets", {
        code: error.code,
        message: error.message,
      });
      return {};
    }

    const snapshot: WidgetAnalyticsSnapshot = {};
    const hosts = new Map<string, Set<string>>();

    for (const row of data ?? []) {
      const summary = snapshot[row.widget_id] ?? {
        today: 0,
        last7Days: 0,
        last30Days: 0,
        activeHosts30Days: 0,
      };
      const loads = safeCount(row.loads);

      summary.last30Days += loads;
      if (row.day >= sevenDaysAgo) summary.last7Days += loads;
      if (row.day === today) summary.today += loads;
      snapshot[row.widget_id] = summary;

      const widgetHosts = hosts.get(row.widget_id) ?? new Set<string>();
      widgetHosts.add(row.site_host);
      hosts.set(row.widget_id, widgetHosts);
    }

    for (const [widgetId, widgetHosts] of hosts) {
      const summary = snapshot[widgetId];
      if (summary) summary.activeHosts30Days = widgetHosts.size;
    }

    return snapshot;
  },
);
