import type { SupabaseClient } from "@supabase/supabase-js";
import { createServerFn } from "@tanstack/react-start";
import { getRequest, setResponseHeaders } from "@tanstack/react-start/server";
import { z } from "zod";

import { resolveAccountAccess } from "@/lib/auth/account-access";
import type { Database } from "@/lib/supabase/database.types";
import { createSupabaseRequestClient } from "@/lib/supabase/request-client.server";
import {
  createSupabaseAdminClient,
  getSupabaseServerConfig,
} from "@/lib/supabase/server-client.server";

const SITE_HOST_PATTERN = /^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/;
const SAO_PAULO_TIME_ZONE = "America/Sao_Paulo";
const widgetTokenSchema = z.string().uuid();

type WidgetInstallationRow = {
  widget_id: string;
  user_id: string;
  site_host: string;
  total_loads: number | string;
  first_seen_at: string;
  last_seen_at: string;
};

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
      widget_installations: {
        Row: WidgetInstallationRow;
        Insert: WidgetInstallationRow;
        Update: Partial<WidgetInstallationRow>;
        Relationships: [];
      };
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

export type WidgetInsightDay = {
  day: string;
  loads: number;
};

export type WidgetSiteInsight = {
  siteHost: string;
  totalLoads: number;
  loads30d: number;
  firstSeenAt: string;
  lastSeenAt: string;
};

export type WidgetInsight = {
  widgetId: string;
  totalLoads: number;
  loads7d: number;
  loads30d: number;
  previous30d: number;
  change30dPercent: number | null;
  sitesCount: number;
  firstSeenAt: string | null;
  lastSeenAt: string | null;
  topSites: WidgetSiteInsight[];
  daily14d: WidgetInsightDay[];
};

export type WidgetInsightsSnapshot =
  | { status: "unavailable" }
  | { status: "unauthenticated" }
  | { status: "not-entitled" }
  | {
      status: "authenticated";
      summary: {
        totalLoads: number;
        loads7d: number;
        loads30d: number;
        sitesCount: number;
        activeWidgets30d: number;
        lastSeenAt: string | null;
      };
      widgets: WidgetInsight[];
    };

function applyPrivateHeaders(headers: Headers) {
  headers.set("Cache-Control", "private, no-store, max-age=0");
  headers.set("Pragma", "no-cache");
  headers.set("Vary", "Cookie, Authorization");
  setResponseHeaders(headers);
}

function normalizeSiteHost(value: string) {
  let host = value.trim().toLowerCase();
  if (host.startsWith("www.")) host = host.slice(4);
  if (host.endsWith(".")) host = host.slice(0, -1);
  if (!host || host.length > 253 || !SITE_HOST_PATTERN.test(host)) return null;
  if (host === "tempopelotas.com.br" || host.endsWith(".tempopelotas.com.br")) return null;
  return host;
}

function siteHostFromOrigin(origin: string | null) {
  if (!origin) return null;
  try {
    const url = new URL(origin);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return normalizeSiteHost(url.hostname);
  } catch {
    return null;
  }
}

function toCount(value: number | string | null | undefined) {
  const count = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(count) && count > 0 ? Math.floor(count) : 0;
}

function saoPauloDay(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: SAO_PAULO_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function shiftDay(day: string, offset: number) {
  const date = new Date(`${day}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}

function maxTimestamp(values: Array<string | null | undefined>) {
  return values.reduce<string | null>((latest, value) => {
    if (!value) return latest;
    if (!latest) return value;
    return Date.parse(value) > Date.parse(latest) ? value : latest;
  }, null);
}

function minTimestamp(values: Array<string | null | undefined>) {
  return values.reduce<string | null>((earliest, value) => {
    if (!value) return earliest;
    if (!earliest) return value;
    return Date.parse(value) < Date.parse(earliest) ? value : earliest;
  }, null);
}

async function loadWidgetAnalyticsAccess(
  client: ReturnType<typeof createSupabaseRequestClient>["client"],
  userId: string,
) {
  let result = await client
    .from("account_access")
    .select("tier,status,source,valid_until")
    .eq("user_id", userId)
    .maybeSingle();

  if (!result.error && !result.data) {
    const repair = await client.rpc("ensure_current_user_account_foundation");
    if (!repair.error) {
      result = await client
        .from("account_access")
        .select("tier,status,source,valid_until")
        .eq("user_id", userId)
        .maybeSingle();
    }
  }

  const row = result.data;
  return resolveAccountAccess(
    row
      ? {
          tier: row.tier,
          status: row.status,
          source: row.source,
          validUntil: row.valid_until,
        }
      : null,
  );
}

function buildWidgetInsight(
  widgetId: string,
  installations: WidgetInstallationRow[],
  daily: WidgetUsageDailyRow[],
  today: string,
): WidgetInsight {
  const start7d = shiftDay(today, -6);
  const start30d = shiftDay(today, -29);
  const previous30dStart = shiftDay(today, -59);
  const previous30dEnd = shiftDay(today, -30);
  const start14d = shiftDay(today, -13);

  const widgetInstallations = installations.filter((row) => row.widget_id === widgetId);
  const widgetDaily = daily.filter((row) => row.widget_id === widgetId);
  const loadsForRange = (start: string, end: string) =>
    widgetDaily.reduce(
      (total, row) => (row.day >= start && row.day <= end ? total + toCount(row.loads) : total),
      0,
    );

  const loads7d = loadsForRange(start7d, today);
  const loads30d = loadsForRange(start30d, today);
  const previous30d = loadsForRange(previous30dStart, previous30dEnd);
  const change30dPercent =
    previous30d > 0 ? Math.round(((loads30d - previous30d) / previous30d) * 100) : null;

  const dailyByDay = new Map<string, number>();
  for (const row of widgetDaily) {
    if (row.day < start14d || row.day > today) continue;
    dailyByDay.set(row.day, (dailyByDay.get(row.day) ?? 0) + toCount(row.loads));
  }

  const daily14d: WidgetInsightDay[] = Array.from({ length: 14 }, (_, index) => {
    const day = shiftDay(start14d, index);
    return { day, loads: dailyByDay.get(day) ?? 0 };
  });

  const loads30dByHost = new Map<string, number>();
  for (const row of widgetDaily) {
    if (row.day < start30d || row.day > today) continue;
    loads30dByHost.set(
      row.site_host,
      (loads30dByHost.get(row.site_host) ?? 0) + toCount(row.loads),
    );
  }

  const topSites = widgetInstallations
    .map<WidgetSiteInsight>((row) => ({
      siteHost: row.site_host,
      totalLoads: toCount(row.total_loads),
      loads30d: loads30dByHost.get(row.site_host) ?? 0,
      firstSeenAt: row.first_seen_at,
      lastSeenAt: row.last_seen_at,
    }))
    .sort((left, right) => right.totalLoads - left.totalLoads || right.loads30d - left.loads30d)
    .slice(0, 5);

  return {
    widgetId,
    totalLoads: widgetInstallations.reduce((total, row) => total + toCount(row.total_loads), 0),
    loads7d,
    loads30d,
    previous30d,
    change30dPercent,
    sitesCount: widgetInstallations.length,
    firstSeenAt: minTimestamp(widgetInstallations.map((row) => row.first_seen_at)),
    lastSeenAt: maxTimestamp(widgetInstallations.map((row) => row.last_seen_at)),
    topSites,
    daily14d,
  };
}

export async function recordWidgetLoadFromOrigin(token: string, origin: string | null) {
  const parsedToken = widgetTokenSchema.safeParse(token.trim());
  if (!parsedToken.success) return { ok: false as const, code: "invalid_token" as const };

  const siteHost = siteHostFromOrigin(origin);
  if (!siteHost) return { ok: false as const, code: "invalid_origin" as const };

  const config = getSupabaseServerConfig();
  if (!config.isAdminConfigured) return { ok: false as const, code: "unavailable" as const };

  const client = createSupabaseAdminClient() as unknown as SupabaseClient<WidgetAnalyticsDatabase>;
  const { data: recorded, error } = await client.rpc("record_widget_load", {
    p_token: parsedToken.data,
    p_site_host: siteHost,
  });

  if (error) {
    console.warn("[widgets] Não foi possível registrar carregamento agregado", {
      code: error.code,
      message: error.message,
    });
    return { ok: false as const, code: "storage" as const };
  }

  return recorded
    ? { ok: true as const }
    : { ok: false as const, code: "ignored" as const };
}

export const getWidgetInsightsSnapshot = createServerFn({ method: "GET" }).handler(
  async (): Promise<WidgetInsightsSnapshot> => {
    const config = getSupabaseServerConfig();
    if (!config.isPublicConfigured) {
      applyPrivateHeaders(new Headers());
      return { status: "unavailable" };
    }

    const { client, responseHeaders } = createSupabaseRequestClient(getRequest());
    const {
      data: { user },
    } = await client.auth.getUser();

    if (!user) {
      applyPrivateHeaders(responseHeaders);
      return { status: "unauthenticated" };
    }

    const access = await loadWidgetAnalyticsAccess(client, user.id);
    if (!access.entitlements.widgetsAnalytics) {
      applyPrivateHeaders(responseHeaders);
      return { status: "not-entitled" };
    }

    const analyticsClient = client as unknown as SupabaseClient<WidgetAnalyticsDatabase>;
    const today = saoPauloDay();
    const start60d = shiftDay(today, -59);

    const [installationsResult, dailyResult] = await Promise.all([
      analyticsClient
        .from("widget_installations")
        .select("widget_id,user_id,site_host,total_loads,first_seen_at,last_seen_at")
        .eq("user_id", user.id),
      analyticsClient
        .from("widget_usage_daily")
        .select("widget_id,user_id,site_host,day,loads,first_seen_at,last_seen_at")
        .eq("user_id", user.id)
        .gte("day", start60d)
        .lte("day", today),
    ]);

    applyPrivateHeaders(responseHeaders);

    if (installationsResult.error || dailyResult.error) {
      console.error("[widgets] Falha ao carregar insights agregados", {
        installations: installationsResult.error?.code ?? null,
        daily: dailyResult.error?.code ?? null,
      });
      return { status: "unavailable" };
    }

    const installations = installationsResult.data ?? [];
    const daily = dailyResult.data ?? [];
    const widgetIds = Array.from(
      new Set([...installations.map((row) => row.widget_id), ...daily.map((row) => row.widget_id)]),
    );
    const widgets = widgetIds.map((widgetId) =>
      buildWidgetInsight(widgetId, installations, daily, today),
    );
    const start7d = shiftDay(today, -6);
    const start30d = shiftDay(today, -29);
    const loads7d = daily.reduce(
      (total, row) => (row.day >= start7d ? total + toCount(row.loads) : total),
      0,
    );
    const loads30d = daily.reduce(
      (total, row) => (row.day >= start30d ? total + toCount(row.loads) : total),
      0,
    );
    const sitesCount = new Set(installations.map((row) => row.site_host)).size;
    const activeWidgets30d = new Set(
      daily.filter((row) => row.day >= start30d).map((row) => row.widget_id),
    ).size;

    return {
      status: "authenticated",
      summary: {
        totalLoads: installations.reduce((total, row) => total + toCount(row.total_loads), 0),
        loads7d,
        loads30d,
        sitesCount,
        activeWidgets30d,
        lastSeenAt: maxTimestamp(installations.map((row) => row.last_seen_at)),
      },
      widgets,
    };
  },
);
