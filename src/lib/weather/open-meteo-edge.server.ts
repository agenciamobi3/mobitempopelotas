import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import {
  createSupabaseAdminClient,
  getSupabaseServerConfig,
} from "@/lib/supabase/server-client.server";

const LOCATION_SLUG = "pelotas-rs";
const EDGE_FUNCTION_NAME = "open-meteo-forecast";
const PUBLIC_CACHE_RPC = "get_public_open_meteo_cache_snapshot";
const CACHE_READ_TIMEOUT_MS = 1_200;
const SETTINGS_READ_TIMEOUT_MS = 1_200;
const EDGE_REQUEST_TIMEOUT_MS = 1_600;
const CACHE_FRESH_MS = 4 * 60 * 1_000;

type OpenMeteoSettingsDatabase = {
  public: {
    Tables: {
      weather_forecast_accuracy_settings: {
        Row: {
          location_slug: string;
          endpoint: string;
          collector_token: string;
          enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          location_slug: string;
          endpoint: string;
          collector_token?: string;
          enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          location_slug?: string;
          endpoint?: string;
          collector_token?: string;
          enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

const forecastPayloadSchema = z
  .object({
    current: z.record(z.unknown()),
    hourly: z.object({ time: z.array(z.string()).min(1) }).passthrough(),
    daily: z.object({ time: z.array(z.string()).min(1) }).passthrough(),
  })
  .passthrough();

const publicCacheRowSchema = z.object({
  status: z.enum(["live", "stale", "unavailable"]),
  payload: z.unknown(),
  fetched_at: z.string().nullable(),
  last_success_at: z.string().nullable(),
});

const edgeResponseSchema = z.object({
  success: z.literal(true),
  provider: z.literal("open-meteo"),
  cacheStatus: z.enum(["fresh", "shared", "refreshed", "stale"]),
  fetchedAt: z.string().nullable().optional(),
  warning: z.string().nullable().optional(),
  payload: z.unknown(),
});

export type OpenMeteoEdgePayload = {
  payload: unknown;
  fetchedAt: string | null;
  cacheStatus: "fresh" | "shared" | "refreshed" | "stale";
  warning: string | null;
};

function ageMs(value: string | null | undefined) {
  if (!value) return Number.POSITIVE_INFINITY;
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return Number.POSITIVE_INFINITY;
  return Math.max(0, Date.now() - time);
}

async function readPublicPersistedPayload(
  configUrl: string,
  publishableKey: string,
): Promise<OpenMeteoEdgePayload | null> {
  try {
    const response = await fetch(`${configUrl}/rest/v1/rpc/${PUBLIC_CACHE_RPC}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        apikey: publishableKey,
        Authorization: `Bearer ${publishableKey}`,
      },
      body: "{}",
      signal: AbortSignal.timeout(CACHE_READ_TIMEOUT_MS),
    });

    if (!response.ok) return null;
    const parsedRows = z.array(publicCacheRowSchema).safeParse(await response.json());
    if (!parsedRows.success) return null;
    const row = parsedRows.data[0];
    if (!row) return null;

    const parsedPayload = forecastPayloadSchema.safeParse(row.payload);
    if (!parsedPayload.success) return null;

    const referenceTime = row.last_success_at ?? row.fetched_at;
    if (!referenceTime) return null;

    const fresh = row.status === "live" && ageMs(referenceTime) <= CACHE_FRESH_MS;
    return {
      payload: parsedPayload.data,
      fetchedAt: row.fetched_at,
      cacheStatus: fresh ? "fresh" : "stale",
      warning: fresh ? null : "Usando a última previsão válida persistida do Open-Meteo.",
    };
  } catch (error) {
    console.warn("[weather/open-meteo-edge] Snapshot público persistido não respondeu dentro do budget", {
      message: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

async function fetchViaEdge(
  admin: SupabaseClient<OpenMeteoSettingsDatabase>,
  configUrl: string,
): Promise<OpenMeteoEdgePayload> {
  const settingsSignal = AbortSignal.timeout(SETTINGS_READ_TIMEOUT_MS);
  const { data: settings, error: settingsError } = await admin
    .from("weather_forecast_accuracy_settings")
    .select("collector_token,enabled")
    .eq("location_slug", LOCATION_SLUG)
    .abortSignal(settingsSignal)
    .maybeSingle();

  if (settingsError || !settings?.enabled) {
    throw new Error(settingsError?.message ?? "Coletor meteorológico desativado.");
  }

  const response = await fetch(`${configUrl}/functions/v1/${EDGE_FUNCTION_NAME}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Collector-Token": settings.collector_token,
    },
    body: "{}",
    signal: AbortSignal.timeout(EDGE_REQUEST_TIMEOUT_MS),
  });

  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      body && typeof body === "object" && "error" in body && typeof body.error === "string"
        ? body.error
        : `Edge Function Open-Meteo respondeu com status ${response.status}`;
    throw new Error(message);
  }

  const parsed = edgeResponseSchema.safeParse(body);
  if (!parsed.success) {
    throw new Error("A Edge Function Open-Meteo respondeu em formato inválido.");
  }

  return {
    payload: parsed.data.payload,
    fetchedAt: parsed.data.fetchedAt ?? null,
    cacheStatus: parsed.data.cacheStatus,
    warning: parsed.data.warning ?? null,
  };
}

export async function fetchOpenMeteoPayloadViaEdge(): Promise<OpenMeteoEdgePayload> {
  const config = getSupabaseServerConfig();
  if (!config.isPublicConfigured || !config.url || !config.publishableKey) {
    throw new Error("Supabase público não configurado para recuperar a previsão persistida do Open-Meteo.");
  }

  // O last-good é previsão pública e não deve depender do service_role. A RPC
  // expõe somente payload + timestamps do Open-Meteo; tabela, tokens e leases
  // continuam privados. Isso evita falso offline quando uma instância não possui
  // a configuração administrativa, preservando o timestamp real da última previsão.
  const persisted = await readPublicPersistedPayload(config.url, config.publishableKey);
  if (persisted) return persisted;

  if (!config.isAdminConfigured) {
    throw new Error(
      "Snapshot público Open-Meteo indisponível e cliente administrativo não configurado para atualizar a contingência.",
    );
  }

  const admin = createSupabaseAdminClient() as unknown as SupabaseClient<OpenMeteoSettingsDatabase>;
  return fetchViaEdge(admin, config.url);
}
