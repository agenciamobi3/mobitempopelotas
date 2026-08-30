import type { SupabaseClient } from "@supabase/supabase-js";

import {
  createSupabaseAdminClient,
  getSupabaseServerConfig,
} from "@/lib/supabase/server-client.server";

const PROVIDER_KEY = "open-meteo";
const MAX_CONTINGENCY_AGE_MS = 30 * 60 * 1_000;

type CacheRow = {
  provider_key: string;
  status: "live" | "stale" | "unavailable";
  payload: unknown;
  fetched_at: string | null;
  last_success_at: string | null;
};

type CacheDatabase = {
  public: {
    Tables: {
      weather_provider_payload_cache: {
        Row: CacheRow;
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

export type OpenMeteoContingencyStatus = {
  available: boolean;
  fetchedAt: string | null;
  lastSuccessAt: string | null;
  ageMinutes: number | null;
};

function hasUsableForecastPayload(payload: unknown) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return false;
  const record = payload as Record<string, unknown>;
  const daily = record.daily;
  if (!daily || typeof daily !== "object" || Array.isArray(daily)) return false;
  const time = (daily as Record<string, unknown>).time;
  return Array.isArray(time) && time.some((value) => typeof value === "string" && value.length > 0);
}

function ageMinutes(value: string | null, now: Date) {
  if (!value) return null;
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return null;
  return Math.max(0, Math.round(((now.getTime() - timestamp) / 60_000) * 10) / 10);
}

export async function getOpenMeteoContingencyStatus(
  now = new Date(),
): Promise<OpenMeteoContingencyStatus> {
  if (!getSupabaseServerConfig().isAdminConfigured) {
    return { available: false, fetchedAt: null, lastSuccessAt: null, ageMinutes: null };
  }

  try {
    const client = createSupabaseAdminClient() as unknown as SupabaseClient<CacheDatabase>;
    const { data, error } = await client
      .from("weather_provider_payload_cache")
      .select("status,payload,fetched_at,last_success_at")
      .eq("provider_key", PROVIDER_KEY)
      .maybeSingle();

    if (error || !data) {
      return { available: false, fetchedAt: null, lastSuccessAt: null, ageMinutes: null };
    }

    const referenceTime = data.last_success_at ?? data.fetched_at;
    const referenceTimestamp = referenceTime ? new Date(referenceTime).getTime() : Number.NaN;
    const ageMs = Number.isFinite(referenceTimestamp)
      ? Math.max(0, now.getTime() - referenceTimestamp)
      : Number.POSITIVE_INFINITY;
    const available = hasUsableForecastPayload(data.payload) && ageMs <= MAX_CONTINGENCY_AGE_MS;

    return {
      available,
      fetchedAt: data.fetched_at,
      lastSuccessAt: data.last_success_at,
      ageMinutes: ageMinutes(referenceTime, now),
    };
  } catch {
    return { available: false, fetchedAt: null, lastSuccessAt: null, ageMinutes: null };
  }
}
