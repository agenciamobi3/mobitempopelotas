import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import {
  createSupabaseAdminClient,
  getSupabaseServerConfig,
} from "@/lib/supabase/server-client.server";

const LOCATION_SLUG = "pelotas-rs";
const PROVIDER_KEY = "open-meteo-extended";
const EDGE_FUNCTION_NAME = "open-meteo-extended-forecast";
const PUBLIC_CACHE_RPC = "get_public_open_meteo_extended_cache_snapshot";
const CACHE_READ_TIMEOUT_MS = 1_200;
const SETTINGS_READ_TIMEOUT_MS = 1_200;
const EDGE_REQUEST_TIMEOUT_MS = 2_200;
const CACHE_FRESH_MS = 4 * 60 * 1_000;

const extendedModelSchema = z.enum(["Open-Meteo Best Match", "NOAA GFS"]);

export type OpenMeteoExtendedModel = z.infer<typeof extendedModelSchema>;

type OpenMeteoExtendedSettingsDatabase = {
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
      weather_provider_payload_cache: {
        Row: {
          provider_key: string;
          status: "live" | "stale" | "unavailable";
          payload: unknown;
          fetched_at: string | null;
          last_attempt_at: string | null;
          last_success_at: string | null;
          error: string | null;
          refresh_started_at: string | null;
          refresh_lease_token: string | null;
          created_at: string;
          updated_at: string;
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

const forecastPayloadSchema = z
  .object({
    daily: z.object({ time: z.array(z.string()).min(1) }).passthrough(),
  })
  .passthrough();

const cachedPayloadSchema = z.object({
  model: extendedModelSchema,
  forecast: forecastPayloadSchema,
});

const publicCacheRowSchema = z.object({
  status: z.enum(["live", "stale", "unavailable"]),
  payload: z.unknown(),
  fetched_at: z.string().nullable(),
  last_success_at: z.string().nullable(),
});

type PersistedCacheRow = z.infer<typeof publicCacheRowSchema>;

const edgeResponseSchema = z.object({
  success: z.literal(true),
  provider: z.literal("open-meteo-extended"),
  cacheStatus: z.enum(["fresh", "shared", "refreshed", "stale"]),
  fetchedAt: z.string().nullable().optional(),
  warning: z.string().nullable().optional(),
  model: extendedModelSchema,
  payload: forecastPayloadSchema,
});

export type OpenMeteoExtendedEdgePayload = {
  payload: unknown;
  fetchedAt: string | null;
  cacheStatus: "fresh" | "shared" | "refreshed" | "stale";
  warning: string | null;
  model: OpenMeteoExtendedModel;
};

function ageMs(value: string | null | undefined) {
  if (!value) return Number.POSITIVE_INFINITY;
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return Number.POSITIVE_INFINITY;
  return Math.max(0, Date.now() - time);
}

function normalizePersistedRow(row: PersistedCacheRow): OpenMeteoExtendedEdgePayload | null {
  const parsedPayload = cachedPayloadSchema.safeParse(row.payload);
  if (!parsedPayload.success) return null;

  const referenceTime = row.last_success_at ?? row.fetched_at;
  if (!referenceTime) return null;

  const fresh = row.status === "live" && ageMs(referenceTime) <= CACHE_FRESH_MS;
  return {
    payload: parsedPayload.data.forecast,
    fetchedAt: row.fetched_at,
    cacheStatus: fresh ? "fresh" : "stale",
    warning: fresh ? null : "Usando a última previsão estendida válida persistida do Open-Meteo.",
    model: parsedPayload.data.model,
  };
}

async function readAdminPersistedPayload(
  admin: SupabaseClient<OpenMeteoExtendedSettingsDatabase>,
): Promise<OpenMeteoExtendedEdgePayload | null> {
  try {
    const { data, error } = await admin
      .from("weather_provider_payload_cache")
      .select("status,payload,fetched_at,last_success_at")
      .eq("provider_key", PROVIDER_KEY)
      .abortSignal(AbortSignal.timeout(CACHE_READ_TIMEOUT_MS))
      .maybeSingle();

    if (error || !data) return null;
    const parsedRow = publicCacheRowSchema.safeParse(data);
    return parsedRow.success ? normalizePersistedRow(parsedRow.data) : null;
  } catch (error) {
    console.warn("[weather/open-meteo-extended-edge] Cache privado não respondeu dentro do budget", {
      message: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

async function readPublicPersistedPayload(
  configUrl: string,
  publishableKey: string,
): Promise<OpenMeteoExtendedEdgePayload | null> {
  try {
    const response = await fetch(`${configUrl}/rest/v1/rpc/${PUBLIC_CACHE_RPC}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        apikey: publishableKey,
      },
      body: "{}",
      signal: AbortSignal.timeout(CACHE_READ_TIMEOUT_MS),
    });

    if (!response.ok) return null;
    const parsedRows = z.array(publicCacheRowSchema).safeParse(await response.json());
    if (!parsedRows.success) return null;
    const row = parsedRows.data[0];
    return row ? normalizePersistedRow(row) : null;
  } catch (error) {
    console.warn("[weather/open-meteo-extended-edge] Snapshot público não respondeu dentro do budget", {
      message: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

async function fetchViaEdge(
  admin: SupabaseClient<OpenMeteoExtendedSettingsDatabase>,
  configUrl: string,
): Promise<OpenMeteoExtendedEdgePayload> {
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
        : `Edge Function Open-Meteo estendida respondeu com status ${response.status}`;
    throw new Error(message);
  }

  const parsed = edgeResponseSchema.safeParse(body);
  if (!parsed.success) {
    throw new Error("A Edge Function Open-Meteo estendida respondeu em formato inválido.");
  }

  return {
    payload: parsed.data.payload,
    fetchedAt: parsed.data.fetchedAt ?? null,
    cacheStatus: parsed.data.cacheStatus,
    warning: parsed.data.warning ?? null,
    model: parsed.data.model,
  };
}

export async function fetchOpenMeteoExtendedPayloadViaEdge(): Promise<OpenMeteoExtendedEdgePayload> {
  const config = getSupabaseServerConfig();
  if (!config.isPublicConfigured || !config.url || !config.publishableKey) {
    throw new Error("Supabase público não configurado para recuperar a previsão estendida persistida.");
  }

  if (config.isAdminConfigured) {
    const admin = createSupabaseAdminClient() as unknown as SupabaseClient<OpenMeteoExtendedSettingsDatabase>;
    const persisted = await readAdminPersistedPayload(admin);
    if (persisted) return persisted;

    return fetchViaEdge(admin, config.url);
  }

  const persisted = await readPublicPersistedPayload(config.url, config.publishableKey);
  if (persisted) return persisted;

  throw new Error(
    "Snapshot público da previsão estendida indisponível e cliente administrativo não configurado para atualizar a contingência.",
  );
}
