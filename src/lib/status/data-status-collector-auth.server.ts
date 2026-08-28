import { timingSafeEqual } from "node:crypto";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  createSupabaseAdminClient,
  getSupabaseServerConfig,
} from "@/lib/supabase/server-client.server";

const MONITOR_KEY = "primary";

type DataStatusMonitorDatabase = {
  public: {
    Tables: {
      data_source_status_monitor_settings: {
        Row: {
          monitor_key: string;
          collector_token: string;
          enabled: boolean;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

function monitorClient() {
  return createSupabaseAdminClient() as unknown as SupabaseClient<DataStatusMonitorDatabase>;
}

function safeTokenEqual(received: string, expected: string) {
  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);
  return (
    receivedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(receivedBuffer, expectedBuffer)
  );
}

/**
 * Autoriza somente o token privado usado pelo pg_cron/pg_net do Supabase.
 *
 * O token nasce no banco, nunca é enviado ao navegador e não precisa ser
 * duplicado como secret do GitHub ou do runtime. O endpoint continua aceitando
 * CRON_SECRET e GitHub OIDC como caminhos operacionais separados.
 */
export async function authorizeDataStatusCollectorToken(request: Request) {
  const receivedToken = request.headers.get("x-collector-token")?.trim();
  if (!receivedToken || !getSupabaseServerConfig().isAdminConfigured) return false;

  try {
    const { data, error } = await monitorClient()
      .from("data_source_status_monitor_settings")
      .select("collector_token,enabled")
      .eq("monitor_key", MONITOR_KEY)
      .maybeSingle();

    return Boolean(
      !error &&
        data?.enabled &&
        data.collector_token &&
        safeTokenEqual(receivedToken, data.collector_token),
    );
  } catch (error) {
    console.error("[data-status/cron] Falha ao validar token do coletor Supabase", {
      message: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}
