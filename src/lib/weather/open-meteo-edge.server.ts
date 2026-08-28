import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import {
  createSupabaseAdminClient,
  getSupabaseServerConfig,
} from "@/lib/supabase/server-client.server";

const LOCATION_SLUG = "pelotas-rs";
const PROVIDER_KEY = "open-meteo";
const EDGE_FUNCTION_NAME = "open-meteo-forecast";
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
    current: z.record(z.unknown()),
    hourly: z.object({ time: z.array(z.string()).min(1) }).passthrough(),
    daily: z.object({ time: z.array(z.string()).min(1) }).passthrough(),
  })
  .passthrough();

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

async function readPersistedPayload(
  admin: SupabaseClient<OpenMeteoSettingsDatabase>,
): Promise<OpenMeteoEdgePayload | null> {
  try {
    const signal = AbortSignal.timeout(CACHE_READ_TIMEOUT_MS);
    const { data, error } = await admin
      .from("weather_provider_payload_cache")
      .select("status,payload,fetched_at,last_success_at,error")
      .eq("provider_key", PROVIDER_KEY)
      .abortSignal(signal)
      .maybeSingle();

    if (error || !data || data.status === "unavailable") return null;
    const parsed = forecastPayloadSchema.safeParse(data.payload);
    if (!parsed.success) return null;

    const referenceTime = data.last_success_at ?? data.fetched_at;
    const fresh = data.status === "live" && ageMs(referenceTime) <= CACHE_FRESH_MS;
    return {
      payload: parsed.data,
      fetchedAt: data.fetched_at,
      cacheStatus: fresh ? "fresh" : "stale",
      warning: fresh ? null : data.error ?? "Usando a última previsão válida persistida do Open-Meteo.",
    };
  } catch (error) {
    console.warn("[weather/open-meteo-edge] Cache persistido não respondeu dentro do budget", {
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
  if (!config.isAdminConfigured || !config.url) {
    throw new Error("Supabase administrativo não configurado para a previsão Open-Meteo.");
  }

  const admin = createSupabaseAdminClient() as unknown as SupabaseClient<OpenMeteoSettingsDatabase>;
  const persisted = await readPersistedPayload(admin);
  if (persisted) return persisted;

  return fetchViaEdge(admin, config.url);
}
