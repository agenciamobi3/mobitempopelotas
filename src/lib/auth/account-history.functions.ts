import type { SupabaseClient } from "@supabase/supabase-js";
import { createServerFn } from "@tanstack/react-start";
import { getRequest, setResponseHeaders } from "@tanstack/react-start/server";
import { z } from "zod";

import { resolveAccountAccess } from "@/lib/auth/account-access";
import {
  ACCOUNT_HISTORY_DATASETS,
  ACCOUNT_HISTORY_DATASET_KEYS,
  sampleAccountHistoryPoints,
  type AccountHistoryDataset,
  type AccountHistoryDatasetKey,
  type AccountHistoryPeriod,
  type AccountHistoryPoint,
} from "@/lib/auth/account-history";
import { createSupabaseRequestClient } from "@/lib/supabase/request-client.server";
import {
  createSupabaseAdminClient,
  getSupabaseServerConfig,
} from "@/lib/supabase/server-client.server";

const PAGE_SIZE = 1_000;
const MAX_PAGES = 20;

const inputSchema = z.object({
  dataset: z.enum(ACCOUNT_HISTORY_DATASET_KEYS),
  days: z.union([z.literal(7), z.literal(30), z.literal(60)]),
});

type HistoricalMeasurementRow = {
  observed_at: string;
  value_numeric: number | null;
  unit: string;
  quality_flag: string;
};

type AccountHistoryDatabase = {
  public: {
    Tables: {
      historical_measurements: {
        Row: HistoricalMeasurementRow & {
          id: number;
          source_key: string;
          station_key: string;
          variable_key: string;
          data_class: "observation" | "forecast" | "reanalysis" | "derived";
          value_text: string | null;
          source_record_id: string | null;
          metadata: Record<string, unknown>;
          ingested_at: string;
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

export type AccountHistorySnapshot =
  | {
      status: "unauthenticated";
      dataset: AccountHistoryDataset;
      requestedDays: AccountHistoryPeriod;
      effectiveDays: AccountHistoryPeriod;
    }
  | {
      status: "unavailable";
      dataset: AccountHistoryDataset;
      requestedDays: AccountHistoryPeriod;
      effectiveDays: AccountHistoryPeriod;
      message: string;
    }
  | {
      status: "authenticated";
      dataset: AccountHistoryDataset;
      requestedDays: AccountHistoryPeriod;
      effectiveDays: AccountHistoryPeriod;
      points: AccountHistoryPoint[];
      loadedCount: number;
      sampledCount: number;
      coverageStart: string | null;
      coverageEnd: string | null;
      truncated: boolean;
    };

function applyPrivateHeaders(headers = new Headers()) {
  headers.set("Cache-Control", "private, no-store, max-age=0");
  headers.set("Pragma", "no-cache");
  headers.set("Vary", "Cookie, Authorization");
  setResponseHeaders(headers);
}

function clampPeriod(requested: AccountHistoryPeriod, allowedDays: number | null) {
  if (allowedDays === null) return requested;
  const effective = Math.min(requested, allowedDays);
  if (effective >= 60) return 60;
  if (effective >= 30) return 30;
  return 7;
}

async function loadHistoricalRows(
  client: SupabaseClient<AccountHistoryDatabase>,
  dataset: AccountHistoryDataset,
  since: string,
) {
  const rows: HistoricalMeasurementRow[] = [];
  let truncated = false;

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await client
      .from("historical_measurements")
      .select("observed_at,value_numeric,unit,quality_flag")
      .eq("source_key", dataset.sourceKey)
      .eq("station_key", dataset.stationKey)
      .eq("variable_key", "water_level")
      .eq("data_class", "observation")
      .gte("observed_at", since)
      .order("observed_at", { ascending: false })
      .range(from, to);

    if (error) throw new Error(error.message);

    const pageRows = data ?? [];
    rows.push(...pageRows);
    if (pageRows.length < PAGE_SIZE) {
      rows.sort((first, second) => Date.parse(first.observed_at) - Date.parse(second.observed_at));
      return { rows, truncated };
    }
  }

  truncated = true;
  rows.sort((first, second) => Date.parse(first.observed_at) - Date.parse(second.observed_at));
  return { rows, truncated };
}

export const getAccountHistorySeries = createServerFn({ method: "GET" })
  .validator(inputSchema)
  .handler(async ({ data }): Promise<AccountHistorySnapshot> => {
    const dataset = ACCOUNT_HISTORY_DATASETS[data.dataset as AccountHistoryDatasetKey];
    const config = getSupabaseServerConfig();

    if (!config.isPublicConfigured) {
      applyPrivateHeaders();
      return {
        status: "unavailable",
        dataset,
        requestedDays: data.days,
        effectiveDays: data.days,
        message: "A conta não conseguiu acessar o arquivo histórico nesta execução.",
      };
    }

    const { client, responseHeaders } = createSupabaseRequestClient(getRequest());
    const {
      data: { user },
    } = await client.auth.getUser();

    if (!user) {
      applyPrivateHeaders(responseHeaders);
      return {
        status: "unauthenticated",
        dataset,
        requestedDays: data.days,
        effectiveDays: data.days,
      };
    }

    const accessResult = await client
      .from("account_access")
      .select("tier,status,source,valid_until")
      .eq("user_id", user.id)
      .maybeSingle();

    if (accessResult.error) {
      applyPrivateHeaders(responseHeaders);
      return {
        status: "unavailable",
        dataset,
        requestedDays: data.days,
        effectiveDays: data.days,
        message: "Não foi possível confirmar o acesso da conta ao histórico.",
      };
    }

    const access = resolveAccountAccess(
      accessResult.data
        ? {
            tier: accessResult.data.tier,
            status: accessResult.data.status,
            source: accessResult.data.source,
            validUntil: accessResult.data.valid_until,
          }
        : null,
    );
    const effectiveDays = clampPeriod(data.days, access.entitlements.historyAccessDays);

    if (!config.isAdminConfigured) {
      applyPrivateHeaders(responseHeaders);
      return {
        status: "unavailable",
        dataset,
        requestedDays: data.days,
        effectiveDays,
        message: "O arquivo histórico está temporariamente indisponível no servidor.",
      };
    }

    try {
      const since = new Date(Date.now() - effectiveDays * 24 * 60 * 60 * 1_000).toISOString();
      const historyClient = createSupabaseAdminClient() as unknown as SupabaseClient<AccountHistoryDatabase>;
      const { rows, truncated } = await loadHistoricalRows(historyClient, dataset, since);
      const points = rows.flatMap((row) => {
        if (
          row.unit !== dataset.unit ||
          row.value_numeric === null ||
          !Number.isFinite(row.value_numeric)
        ) {
          return [];
        }
        return [{ timestamp: row.observed_at, level: row.value_numeric } satisfies AccountHistoryPoint];
      });
      const sampled = sampleAccountHistoryPoints(points);

      applyPrivateHeaders(responseHeaders);
      return {
        status: "authenticated",
        dataset,
        requestedDays: data.days,
        effectiveDays,
        points: sampled,
        loadedCount: points.length,
        sampledCount: sampled.length,
        coverageStart: points[0]?.timestamp ?? null,
        coverageEnd: points.at(-1)?.timestamp ?? null,
        truncated,
      };
    } catch (error) {
      console.warn("[account/history] Falha ao consultar arquivo histórico", {
        dataset: dataset.key,
        message: error instanceof Error ? error.message : String(error),
      });
      applyPrivateHeaders(responseHeaders);
      return {
        status: "unavailable",
        dataset,
        requestedDays: data.days,
        effectiveDays,
        message: "O arquivo histórico não respondeu nesta consulta. Tente novamente em instantes.",
      };
    }
  });
