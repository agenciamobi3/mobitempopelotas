import type { SupabaseClient } from "@supabase/supabase-js";

import {
  createSupabaseAdminClient,
  getSupabaseServerConfig,
} from "@/lib/supabase/server-client.server";

const DATA_STATUS_MAX_HISTORY_AGE_MS = 30 * 60 * 1_000;

type FreshnessDatabase = {
  public: {
    Tables: {
      data_source_status_checks: {
        Row: { checked_at: string };
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

function freshnessClient() {
  return createSupabaseAdminClient() as unknown as SupabaseClient<FreshnessDatabase>;
}

export async function getDataStatusHistoryFreshness(now = new Date()) {
  if (!getSupabaseServerConfig().isAdminConfigured) {
    return { stale: true, latestAt: null as string | null };
  }

  try {
    const { data, error } = await freshnessClient()
      .from("data_source_status_checks")
      .select("checked_at")
      .order("checked_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    const latestAt = data?.checked_at ?? null;
    if (!latestAt) return { stale: true, latestAt };

    const latestTime = new Date(latestAt).getTime();
    const stale =
      !Number.isFinite(latestTime) || now.getTime() - latestTime > DATA_STATUS_MAX_HISTORY_AGE_MS;

    return { stale, latestAt };
  } catch (error) {
    console.error("[data-status] Não foi possível verificar a atualidade do histórico", {
      message: error instanceof Error ? error.message : String(error),
    });
    return { stale: true, latestAt: null as string | null };
  }
}

export function staleHistoryMessage(latestAt: string | null) {
  if (!latestAt) {
    return "O monitor histórico está sem uma amostra recente. O estado atual das fontes acima continua sendo consultado separadamente.";
  }

  const formatted = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(latestAt));

  return `O monitor histórico está atrasado; a última amostra persistida é de ${formatted}. O estado atual das fontes acima continua sendo consultado separadamente.`;
}
