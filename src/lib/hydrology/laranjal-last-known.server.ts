import type { SupabaseClient } from "@supabase/supabase-js";

import {
  createSupabaseAdminClient,
  getSupabaseServerConfig,
} from "@/lib/supabase/server-client.server";
import {
  createLaranjalLevelDataFromSeries,
  type LaranjalLevelData,
  type LaranjalLevelPoint,
} from "./laranjal-level.server";

const SOURCE_KEY = "labhidrosens-ufpel";
const STATION_KEY = "labhidrosens-laranjal";
const VARIABLE_KEY = "water_level";
const ARCHIVE_LIMIT = 300;

type HistoricalRow = {
  source_key: string;
  station_key: string;
  variable_key: string;
  data_class: "observation" | "forecast" | "reanalysis" | "derived";
  observed_at: string;
  value_numeric: number | null;
  unit: string;
};

type LaranjalArchiveDatabase = {
  public: {
    Tables: {
      historical_measurements: {
        Row: HistoricalRow;
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

function archiveClient() {
  return createSupabaseAdminClient() as unknown as SupabaseClient<LaranjalArchiveDatabase>;
}

function archivedPoints(rows: HistoricalRow[]): LaranjalLevelPoint[] {
  const seen = new Map<number, LaranjalLevelPoint>();

  for (const row of rows) {
    if (row.unit !== "m" || row.value_numeric === null || !Number.isFinite(row.value_numeric)) {
      continue;
    }

    const epoch = Date.parse(row.observed_at);
    if (!Number.isFinite(epoch)) continue;

    seen.set(epoch, {
      timestamp: new Date(epoch).toISOString(),
      level: row.value_numeric,
    });
  }

  const points = [...seen.values()].sort(
    (first, second) => Date.parse(first.timestamp) - Date.parse(second.timestamp),
  );
  const latest = points.at(-1);
  if (!latest) return [];

  const windowStart = Date.parse(latest.timestamp) - 24 * 60 * 60 * 1_000;
  return points.filter((point) => Date.parse(point.timestamp) >= windowStart);
}

/**
 * Recupera somente medições já arquivadas da própria Estação Laranjal.
 * É um last-known de proveniência idêntica, não uma régua alternativa.
 */
export async function fetchLastKnownLaranjalLevelData(): Promise<LaranjalLevelData | null> {
  if (!getSupabaseServerConfig().isAdminConfigured) return null;

  try {
    const { data, error } = await archiveClient()
      .from("historical_measurements")
      .select("observed_at,value_numeric,unit")
      .eq("source_key", SOURCE_KEY)
      .eq("station_key", STATION_KEY)
      .eq("variable_key", VARIABLE_KEY)
      .eq("data_class", "observation")
      .not("value_numeric", "is", null)
      .order("observed_at", { ascending: false })
      .limit(ARCHIVE_LIMIT);

    if (error) {
      throw new Error(`Falha ao consultar o last-known do Laranjal: ${error.message}`);
    }

    const points = archivedPoints((data ?? []) as HistoricalRow[]);
    if (points.length === 0) return null;

    return createLaranjalLevelDataFromSeries(points, new Date(), {
      forceStale: true,
      error:
        "A Estação Laranjal está sem nova leitura no momento da visita. Exibindo a última medição válida arquivada pelo Tempo Pelotas.",
    });
  } catch (error) {
    console.warn("[hydrology/laranjal] Last-known arquivado indisponível", {
      message: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}
