import type { SupabaseClient } from "@supabase/supabase-js";
import { createFileRoute } from "@tanstack/react-router";

import type { FavoriteDatabase, UserFavoriteRow } from "@/lib/auth/favorites.functions";
import { getVerifiedRequestUser } from "@/lib/auth/request-user.server";
import type { ContributionDatabase } from "@/lib/history/contribution-database";
import type { Database } from "@/lib/supabase/database.types";
import {
  createSupabaseAdminClient,
  getSupabaseServerConfig,
} from "@/lib/supabase/server-client.server";

const QUERY_TIMEOUT_MS = 3_500;
const EXPORT_PAGE_SIZE = 500;

type AccountAdminClient = ReturnType<typeof createSupabaseAdminClient>;
type FavoriteExportRow = Pick<UserFavoriteRow, "resource_key" | "resource_type" | "created_at">;

type ConsentExportRow = {
  channel: string;
  granted: boolean;
  source: string;
  policy_version: string;
  created_at: string;
};

type NotificationDeviceExportRow = {
  endpoint: string;
  user_agent: string | null;
  topics: string[];
  created_at: string;
  updated_at: string;
  last_seen_at: string;
};

type WidgetInstallationExportRow = {
  widget_id: string;
  user_id: string;
  site_host: string;
  total_loads: number;
  first_seen_at: string;
  last_seen_at: string;
};

type WidgetUsageDailyExportRow = {
  widget_id: string;
  user_id: string;
  site_host: string;
  day: string;
  loads: number;
  first_seen_at: string;
  last_seen_at: string;
};

type WidgetAnalyticsExportDatabase = Omit<Database, "public"> & {
  public: Omit<Database["public"], "Tables"> & {
    Tables: Database["public"]["Tables"] & {
      widget_installations: {
        Row: WidgetInstallationExportRow;
        Insert: WidgetInstallationExportRow;
        Update: Partial<WidgetInstallationExportRow>;
        Relationships: [];
      };
      widget_usage_daily: {
        Row: WidgetUsageDailyExportRow;
        Insert: WidgetUsageDailyExportRow;
        Update: Partial<WidgetUsageDailyExportRow>;
        Relationships: [];
      };
    };
  };
};

function timeoutSignal() {
  return AbortSignal.timeout(QUERY_TIMEOUT_MS);
}

function jsonHeaders(base = new Headers()) {
  base.set("Cache-Control", "private, no-store, max-age=0");
  base.set("Content-Type", "application/json; charset=utf-8");
  base.set("Pragma", "no-cache");
  base.set("Vary", "Cookie, Authorization");
  base.set("X-Content-Type-Options", "nosniff");
  base.set("X-Robots-Tag", "noindex, nofollow");
  return base;
}

async function loadConsentHistory(admin: AccountAdminClient, userId: string) {
  const records: ConsentExportRow[] = [];
  let idCursor = 0;

  while (true) {
    const { data, error } = await admin
      .from("account_consent_events")
      .select("id,channel,granted,source,policy_version,created_at")
      .eq("user_id", userId)
      .gt("id", idCursor)
      .order("id", { ascending: true })
      .limit(EXPORT_PAGE_SIZE)
      .abortSignal(timeoutSignal());

    if (error) {
      throw new Error(`Falha ao consultar histórico de consentimentos: ${error.message}`);
    }

    const page = data ?? [];
    if (page.length === 0) return records;

    for (const record of page) {
      records.push({
        channel: record.channel,
        granted: record.granted,
        source: record.source,
        policy_version: record.policy_version,
        created_at: record.created_at,
      });
    }

    const nextCursor = page.at(-1)?.id;
    if (typeof nextCursor !== "number" || nextCursor <= idCursor) {
      throw new Error("A paginação do histórico de consentimentos não avançou.");
    }
    idCursor = nextCursor;
  }
}

async function loadNotificationDevices(admin: AccountAdminClient, userId: string) {
  const records: NotificationDeviceExportRow[] = [];
  let endpointCursor: string | null = null;

  while (true) {
    let query = admin
      .from("web_push_subscriptions")
      .select("endpoint,user_agent,topics,created_at,updated_at,last_seen_at")
      .eq("user_id", userId)
      .order("endpoint", { ascending: true })
      .limit(EXPORT_PAGE_SIZE);

    if (endpointCursor) query = query.gt("endpoint", endpointCursor);

    const { data, error } = await query.abortSignal(timeoutSignal());
    if (error) {
      throw new Error(`Falha ao consultar aparelhos de notificação: ${error.message}`);
    }

    const page = data ?? [];
    if (page.length === 0) return records;

    records.push(...page);

    const nextCursor = page.at(-1)?.endpoint;
    if (!nextCursor || nextCursor === endpointCursor) {
      throw new Error("A paginação dos aparelhos de notificação não avançou.");
    }
    endpointCursor = nextCursor;
  }
}

async function loadFavorites(admin: AccountAdminClient, userId: string) {
  const client = admin as unknown as SupabaseClient<FavoriteDatabase>;
  const { data, error } = await client
    .from("user_favorites")
    .select("resource_key,resource_type,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .abortSignal(timeoutSignal());

  if (error) throw new Error(`Falha ao consultar favoritos: ${error.message}`);
  return (data ?? []) as FavoriteExportRow[];
}

async function loadHistoricalContributions(admin: AccountAdminClient, userId: string) {
  const client = admin as unknown as SupabaseClient<ContributionDatabase>;
  const records: ContributionDatabase["public"]["Tables"]["historical_contributions"]["Row"][] = [];
  let offset = 0;

  while (true) {
    const { data, error } = await client
      .from("historical_contributions")
      .select(
        "id,page_path,page_title,event_year,kind,title,description,location_text,date_label,source_url,credit_name,publish_anonymously,attachments,rights_confirmed,publication_authorized,status,moderation_note,created_at,reviewed_at,user_id",
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .range(offset, offset + EXPORT_PAGE_SIZE - 1)
      .abortSignal(timeoutSignal());

    if (error) {
      throw new Error(`Falha ao consultar contribuições históricas: ${error.message}`);
    }

    const page = data ?? [];
    if (page.length === 0) return records;

    records.push(...page);
    if (page.length < EXPORT_PAGE_SIZE) return records;
    offset += page.length;
  }
}

async function loadWidgetInstallations(admin: AccountAdminClient, userId: string) {
  const client = admin as unknown as SupabaseClient<WidgetAnalyticsExportDatabase>;
  const records: WidgetInstallationExportRow[] = [];
  let offset = 0;

  while (true) {
    const { data, error } = await client
      .from("widget_installations")
      .select("widget_id,user_id,site_host,total_loads,first_seen_at,last_seen_at")
      .eq("user_id", userId)
      .order("widget_id", { ascending: true })
      .order("site_host", { ascending: true })
      .range(offset, offset + EXPORT_PAGE_SIZE - 1)
      .abortSignal(timeoutSignal());

    if (error) throw new Error(`Falha ao consultar instalações de widgets: ${error.message}`);
    const page = data ?? [];
    if (page.length === 0) return records;

    records.push(...page);
    if (page.length < EXPORT_PAGE_SIZE) return records;
    offset += page.length;
  }
}

async function loadWidgetDailyUsage(admin: AccountAdminClient, userId: string) {
  const client = admin as unknown as SupabaseClient<WidgetAnalyticsExportDatabase>;
  const records: WidgetUsageDailyExportRow[] = [];
  let offset = 0;

  while (true) {
    const { data, error } = await client
      .from("widget_usage_daily")
      .select("widget_id,user_id,site_host,day,loads,first_seen_at,last_seen_at")
      .eq("user_id", userId)
      .order("day", { ascending: true })
      .order("widget_id", { ascending: true })
      .order("site_host", { ascending: true })
      .range(offset, offset + EXPORT_PAGE_SIZE - 1)
      .abortSignal(timeoutSignal());

    if (error) throw new Error(`Falha ao consultar uso diário de widgets: ${error.message}`);
    const page = data ?? [];
    if (page.length === 0) return records;

    records.push(...page);
    if (page.length < EXPORT_PAGE_SIZE) return records;
    offset += page.length;
  }
}

async function exportAccountData(request: Request) {
  try {
    const account = await getVerifiedRequestUser(request);
    const headers = jsonHeaders(account.responseHeaders);

    if (!account.configured) {
      return new Response(
        JSON.stringify({ success: false, error: "A área de conta não está disponível." }),
        { status: 503, headers },
      );
    }

    if (!account.user) {
      return new Response(JSON.stringify({ success: false, error: "Sessão não autenticada." }), {
        status: 401,
        headers,
      });
    }

    if (!getSupabaseServerConfig().isAdminConfigured) {
      return new Response(
        JSON.stringify({ success: false, error: "A exportação ainda não está disponível." }),
        { status: 503, headers },
      );
    }

    const admin = createSupabaseAdminClient();
    const [
      profileResult,
      preferencesResult,
      accessResult,
      consentHistory,
      notificationDevices,
      favorites,
      historicalContributions,
      widgetInstallations,
      widgetDailyUsage,
    ] = await Promise.all([
      admin
        .from("profiles")
        .select("email,display_name,avatar_url,created_at,updated_at")
        .eq("id", account.user.id)
        .abortSignal(timeoutSignal())
        .maybeSingle(),
      admin
        .from("user_preferences")
        .select(
          "weather_alerts,water_alerts,daily_summary,community_updates,created_at,updated_at",
        )
        .eq("user_id", account.user.id)
        .abortSignal(timeoutSignal())
        .maybeSingle(),
      admin
        .from("account_access")
        .select("tier,status,source,valid_until,created_at,updated_at")
        .eq("user_id", account.user.id)
        .abortSignal(timeoutSignal())
        .maybeSingle(),
      loadConsentHistory(admin, account.user.id),
      loadNotificationDevices(admin, account.user.id),
      loadFavorites(admin, account.user.id),
      loadHistoricalContributions(admin, account.user.id),
      loadWidgetInstallations(admin, account.user.id),
      loadWidgetDailyUsage(admin, account.user.id),
    ]);

    const error = profileResult.error ?? preferencesResult.error ?? accessResult.error;
    if (error) {
      console.error("[account/export] Falha ao consultar dados da conta", {
        code: error.code,
        message: error.message,
      });
      return new Response(
        JSON.stringify({ success: false, error: "Não foi possível preparar a exportação." }),
        { status: 500, headers },
      );
    }

    const exportedAt = new Date();
    const document = {
      export_version: "1.4",
      exported_at: exportedAt.toISOString(),
      portal: "Tempo Pelotas",
      account: {
        provider: "google",
        email: account.user.email ?? null,
        created_at: account.user.created_at,
        last_sign_in_at: account.user.last_sign_in_at ?? null,
        profile: profileResult.data,
        preferences: preferencesResult.data,
        access: accessResult.data,
      },
      favorites,
      consent_history: consentHistory,
      notification_devices: notificationDevices,
      historical_contributions: historicalContributions,
      widget_insights: {
        installations: widgetInstallations,
        daily_usage: widgetDailyUsage,
      },
      security_note:
        "Chaves criptográficas de entrega, credenciais de sessão e o conteúdo binário dos anexos privados não fazem parte desta exportação. Metadados e caminhos dos anexos vinculados às contribuições são incluídos. Widget Insights contém somente domínio e contadores agregados associados aos widgets; não armazenamos visitante, IP, user-agent ou caminho da página nessa camada.",
    };

    const date = exportedAt.toISOString().slice(0, 10);
    headers.set("Content-Disposition", `attachment; filename="tempo-pelotas-dados-${date}.json"`);

    return new Response(`${JSON.stringify(document, null, 2)}\n`, { status: 200, headers });
  } catch (error) {
    console.error("[account/export] Falha inesperada", {
      message: error instanceof Error ? error.message : String(error),
    });
    return new Response(
      JSON.stringify({ success: false, error: "Não foi possível preparar a exportação." }),
      { status: 500, headers: jsonHeaders() },
    );
  }
}

export const Route = createFileRoute("/api/account/export")({
  server: {
    handlers: {
      GET: ({ request }) => exportAccountData(request),
    },
  },
});
