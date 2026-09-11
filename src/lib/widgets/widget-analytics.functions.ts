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
const TOP_DISTRIBUTION_HOSTS = 5;
const TOP_DISTRIBUTION_WIDGETS = 5;

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

export type WidgetAnalyticsHostSummary = {
  host: string;
  last30Days: number;
  lastActiveDay: string;
};

export type WidgetAnalyticsSummary = {
  today: number;
  last7Days: number;
  last30Days: number;
  activeHosts30Days: number;
  topHosts30Days: WidgetAnalyticsHostSummary[];
  otherHosts30Days: number;
};

export type WidgetAnalyticsSnapshot = Record<string, WidgetAnalyticsSummary>;

export type WidgetNetworkWidgetSummary = {
  widgetId: string;
  last30Days: number;
  activeHosts30Days: number;
  lastActiveDay: string;
};

export type WidgetNetworkAnalyticsSummary = {
  last30Days: number;
  activeHosts30Days: number;
  activeWidgets30Days: number;
  topHosts30Days: WidgetAnalyticsHostSummary[];
  otherHosts30Days: number;
  topWidgets30Days: WidgetNetworkWidgetSummary[];
};

export type WidgetAnalyticsPayload = {
  widgets: WidgetAnalyticsSnapshot;
  network: WidgetNetworkAnalyticsSummary;
};

type HostAccumulator = Omit<WidgetAnalyticsHostSummary, "host">;

const EMPTY_NETWORK_ANALYTICS: WidgetNetworkAnalyticsSummary = {
  last30Days: 0,
  activeHosts30Days: 0,
  activeWidgets30Days: 0,
  topHosts30Days: [],
  otherHosts30Days: 0,
  topWidgets30Days: [],
};

function emptyAnalyticsPayload(): WidgetAnalyticsPayload {
  return {
    widgets: {},
    network: { ...EMPTY_NETWORK_ANALYTICS },
  };
}

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

function rankHosts(hosts: Map<string, HostAccumulator>) {
  return Array.from(hosts.entries())
    .map(([host, stats]) => ({ host, ...stats }))
    .sort(
      (left, right) =>
        right.last30Days - left.last30Days ||
        right.lastActiveDay.localeCompare(left.lastActiveDay) ||
        left.host.localeCompare(right.host),
    );
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
  async (): Promise<WidgetAnalyticsPayload> => {
    const config = getSupabaseServerConfig();
    if (!config.isPublicConfigured) {
      privateNoStoreHeaders();
      return emptyAnalyticsPayload();
    }

    const { client, responseHeaders } = createSupabaseRequestClient(getRequest());
    const {
      data: { user },
    } = await client.auth.getUser();

    if (!user) {
      privateNoStoreHeaders(responseHeaders);
      return emptyAnalyticsPayload();
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
      return emptyAnalyticsPayload();
    }

    const snapshot: WidgetAnalyticsSnapshot = {};
    const hostsByWidget = new Map<string, Map<string, HostAccumulator>>();
    const networkHosts = new Map<string, HostAccumulator>();
    const widgetLastActiveDay = new Map<string, string>();
    let networkLast30Days = 0;

    for (const row of data ?? []) {
      const summary = snapshot[row.widget_id] ?? {
        today: 0,
        last7Days: 0,
        last30Days: 0,
        activeHosts30Days: 0,
        topHosts30Days: [],
        otherHosts30Days: 0,
      };
      const loads = safeCount(row.loads);

      summary.last30Days += loads;
      if (row.day >= sevenDaysAgo) summary.last7Days += loads;
      if (row.day === today) summary.today += loads;
      snapshot[row.widget_id] = summary;
      networkLast30Days += loads;

      const widgetHosts = hostsByWidget.get(row.widget_id) ?? new Map<string, HostAccumulator>();
      const hostSummary = widgetHosts.get(row.site_host) ?? {
        last30Days: 0,
        lastActiveDay: row.day,
      };
      hostSummary.last30Days += loads;
      if (row.day > hostSummary.lastActiveDay) hostSummary.lastActiveDay = row.day;
      widgetHosts.set(row.site_host, hostSummary);
      hostsByWidget.set(row.widget_id, widgetHosts);

      const networkHostSummary = networkHosts.get(row.site_host) ?? {
        last30Days: 0,
        lastActiveDay: row.day,
      };
      networkHostSummary.last30Days += loads;
      if (row.day > networkHostSummary.lastActiveDay) networkHostSummary.lastActiveDay = row.day;
      networkHosts.set(row.site_host, networkHostSummary);

      const lastActiveDay = widgetLastActiveDay.get(row.widget_id);
      if (!lastActiveDay || row.day > lastActiveDay) widgetLastActiveDay.set(row.widget_id, row.day);
    }

    for (const [widgetId, widgetHosts] of hostsByWidget) {
      const summary = snapshot[widgetId];
      if (!summary) continue;

      const rankedHosts = rankHosts(widgetHosts);
      summary.activeHosts30Days = rankedHosts.length;
      summary.topHosts30Days = rankedHosts.slice(0, TOP_DISTRIBUTION_HOSTS);
      summary.otherHosts30Days = Math.max(
        0,
        rankedHosts.length - summary.topHosts30Days.length,
      );
    }

    const rankedNetworkHosts = rankHosts(networkHosts);
    const rankedWidgets = Object.entries(snapshot)
      .map(([widgetId, summary]) => ({
        widgetId,
        last30Days: summary.last30Days,
        activeHosts30Days: summary.activeHosts30Days,
        lastActiveDay: widgetLastActiveDay.get(widgetId) ?? thirtyDaysAgo,
      }))
      .filter((widget) => widget.last30Days > 0)
      .sort(
        (left, right) =>
          right.last30Days - left.last30Days ||
          right.activeHosts30Days - left.activeHosts30Days ||
          right.lastActiveDay.localeCompare(left.lastActiveDay) ||
          left.widgetId.localeCompare(right.widgetId),
      );

    return {
      widgets: snapshot,
      network: {
        last30Days: networkLast30Days,
        activeHosts30Days: rankedNetworkHosts.length,
        activeWidgets30Days: rankedWidgets.length,
        topHosts30Days: rankedNetworkHosts.slice(0, TOP_DISTRIBUTION_HOSTS),
        otherHosts30Days: Math.max(
          0,
          rankedNetworkHosts.length - Math.min(rankedNetworkHosts.length, TOP_DISTRIBUTION_HOSTS),
        ),
        topWidgets30Days: rankedWidgets.slice(0, TOP_DISTRIBUTION_WIDGETS),
      },
    };
  },
);
