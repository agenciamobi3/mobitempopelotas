import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.110.8";

const PROVIDER_KEY = "open-meteo-extended";
const LOCATION_SLUG = "pelotas-rs";
const BEST_MATCH_ENDPOINT = "https://api.open-meteo.com/v1/forecast";
const GFS_ENDPOINT = "https://api.open-meteo.com/v1/gfs";
const FORECAST_DAYS = 15;
const FRESH_SECONDS = 240;
const STALE_LEASE_SECONDS = 45;
const TIMEOUT_MS = 12_000;

type ExtendedModel = "Open-Meteo Best Match" | "NOAA GFS";

type CachedExtendedPayload = {
  model: ExtendedModel;
  forecast: Record<string, unknown>;
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function constantTimeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasNumberSeries(value: unknown, expectedLength: number) {
  return Array.isArray(value) && value.length === expectedLength;
}

function hasExtendedForecastPayload(value: unknown) {
  if (!isRecord(value) || !isRecord(value.daily)) return false;
  const time = value.daily.time;
  if (!Array.isArray(time) || time.length === 0) return false;

  return (
    hasNumberSeries(value.daily.weather_code, time.length) &&
    hasNumberSeries(value.daily.temperature_2m_max, time.length) &&
    hasNumberSeries(value.daily.temperature_2m_min, time.length) &&
    hasNumberSeries(value.daily.precipitation_probability_max, time.length) &&
    hasNumberSeries(value.daily.precipitation_sum, time.length) &&
    hasNumberSeries(value.daily.wind_gusts_10m_max, time.length)
  );
}

function parseCachedExtendedPayload(value: unknown): CachedExtendedPayload | null {
  if (!isRecord(value)) return null;
  if (value.model !== "Open-Meteo Best Match" && value.model !== "NOAA GFS") return null;
  if (!hasExtendedForecastPayload(value.forecast)) return null;
  return {
    model: value.model,
    forecast: value.forecast as Record<string, unknown>,
  };
}

function ageSeconds(value: string | null | undefined) {
  if (!value) return Number.POSITIVE_INFINITY;
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return Number.POSITIVE_INFINITY;
  return Math.max(0, (Date.now() - timestamp) / 1_000);
}

function buildUrl(endpoint: string) {
  const params = new URLSearchParams({
    latitude: "-31.7654",
    longitude: "-52.3376",
    timezone: "America/Sao_Paulo",
    forecast_days: String(FORECAST_DAYS),
    temperature_unit: "celsius",
    wind_speed_unit: "kmh",
    precipitation_unit: "mm",
    timeformat: "iso8601",
    cell_selection: "land",
    daily: [
      "weather_code",
      "temperature_2m_max",
      "temperature_2m_min",
      "precipitation_probability_max",
      "precipitation_sum",
      "wind_gusts_10m_max",
    ].join(","),
  });
  return `${endpoint}?${params.toString()}`;
}

async function fetchCandidate(endpoint: string, model: ExtendedModel) {
  const response = await fetch(buildUrl(endpoint), {
    headers: {
      Accept: "application/json",
      "User-Agent": "MOBI-Tempo-Pelotas-Supabase/2.0",
    },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`${model} respondeu com status ${response.status}`);
  }

  const payload: unknown = await response.json();
  if (!hasExtendedForecastPayload(payload)) {
    throw new Error(`${model} respondeu sem a série diária estendida esperada.`);
  }

  return {
    model,
    forecast: payload as Record<string, unknown>,
  } satisfies CachedExtendedPayload;
}

async function fetchExtendedForecastPayload() {
  const candidates = [
    { endpoint: BEST_MATCH_ENDPOINT, model: "Open-Meteo Best Match" as const },
    { endpoint: GFS_ENDPOINT, model: "NOAA GFS" as const },
  ];
  let lastError = "Previsão estendida Open-Meteo indisponível";

  for (const candidate of candidates) {
    try {
      return await fetchCandidate(candidate.endpoint, candidate.model);
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      console.warn("[open-meteo-extended-forecast] Candidato indisponível", {
        model: candidate.model,
        message: lastError,
      });
    }
  }

  throw new Error(lastError);
}

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return json({ success: false, error: "Método não permitido." }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return json({ success: false, error: "Ambiente do Supabase incompleto." }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const receivedToken = request.headers.get("x-collector-token")?.trim() ?? "";
  const { data: settings, error: settingsError } = await supabase
    .from("weather_forecast_accuracy_settings")
    .select("collector_token,enabled")
    .eq("location_slug", LOCATION_SLUG)
    .maybeSingle();

  if (
    settingsError ||
    !settings?.enabled ||
    !receivedToken ||
    !constantTimeEqual(receivedToken, settings.collector_token)
  ) {
    return json({ success: false, error: "Não autorizado." }, 401);
  }

  const readCache = async () => {
    const { data, error } = await supabase
      .from("weather_provider_payload_cache")
      .select("payload,fetched_at,last_success_at,status,error")
      .eq("provider_key", PROVIDER_KEY)
      .maybeSingle();
    if (error) throw new Error(`Falha ao consultar cache meteorológico estendido: ${error.message}`);
    return data;
  };

  try {
    const cached = await readCache();
    const parsedCached = cached ? parseCachedExtendedPayload(cached.payload) : null;
    if (
      cached &&
      parsedCached &&
      ageSeconds(cached.last_success_at ?? cached.fetched_at) <= FRESH_SECONDS
    ) {
      return json({
        success: true,
        provider: PROVIDER_KEY,
        cacheStatus: "fresh",
        fetchedAt: cached.fetched_at,
        model: parsedCached.model,
        payload: parsedCached.forecast,
      });
    }

    const leaseToken = crypto.randomUUID();
    const { data: claimed, error: claimError } = await supabase.rpc(
      "claim_weather_provider_refresh",
      {
        p_provider_key: PROVIDER_KEY,
        p_lease_token: leaseToken,
        p_fresh_seconds: FRESH_SECONDS,
        p_stale_lease_seconds: STALE_LEASE_SECONDS,
      },
    );
    if (claimError) throw new Error(`Falha ao reservar atualização estendida: ${claimError.message}`);

    if (claimed !== true) {
      await new Promise((resolve) => setTimeout(resolve, 700));
      const shared = await readCache();
      const parsedShared = shared ? parseCachedExtendedPayload(shared.payload) : null;
      if (shared && parsedShared) {
        return json({
          success: true,
          provider: PROVIDER_KEY,
          cacheStatus:
            ageSeconds(shared.last_success_at ?? shared.fetched_at) <= FRESH_SECONDS
              ? "shared"
              : "stale",
          fetchedAt: shared.fetched_at,
          warning: shared.error,
          model: parsedShared.model,
          payload: parsedShared.forecast,
        });
      }
      return json(
        { success: false, error: "A previsão estendida está sendo atualizada e ainda não possui cache válido." },
        503,
      );
    }

    try {
      const next = await fetchExtendedForecastPayload();
      const fetchedAt = new Date().toISOString();
      const { error: updateError } = await supabase
        .from("weather_provider_payload_cache")
        .update({
          status: "live",
          payload: next,
          fetched_at: fetchedAt,
          last_success_at: fetchedAt,
          error: null,
          refresh_started_at: null,
          refresh_lease_token: null,
        })
        .eq("provider_key", PROVIDER_KEY)
        .eq("refresh_lease_token", leaseToken);
      if (updateError) throw new Error(`Falha ao persistir previsão estendida: ${updateError.message}`);

      return json({
        success: true,
        provider: PROVIDER_KEY,
        cacheStatus: "refreshed",
        fetchedAt,
        model: next.model,
        payload: next.forecast,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await supabase
        .from("weather_provider_payload_cache")
        .update({
          status: parsedCached ? "stale" : "unavailable",
          error: message,
          refresh_started_at: null,
          refresh_lease_token: null,
        })
        .eq("provider_key", PROVIDER_KEY)
        .eq("refresh_lease_token", leaseToken);

      if (cached && parsedCached) {
        return json({
          success: true,
          provider: PROVIDER_KEY,
          cacheStatus: "stale",
          fetchedAt: cached.fetched_at,
          warning: message,
          model: parsedCached.model,
          payload: parsedCached.forecast,
        });
      }
      throw error;
    }
  } catch (error) {
    console.error("[open-meteo-extended-forecast] Falha", error);
    return json(
      {
        success: false,
        provider: PROVIDER_KEY,
        error: error instanceof Error ? error.message : String(error),
      },
      502,
    );
  }
});
