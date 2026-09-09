import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.110.8";

const ENDPOINT = "https://api.open-meteo.com/v1/forecast";
const SNAPSHOT_TABLE = "regional_weather_snapshots";
const FRESH_SNAPSHOT_MS = 5 * 60 * 1_000;
const STALE_SNAPSHOT_MS = 6 * 60 * 60 * 1_000;
const RETENTION_MS = 24 * 60 * 60 * 1_000;
const REQUEST_TIMEOUT_MS = 20_000;
const TIMEZONE = "America/Sao_Paulo";

const CITIES = [
  { slug: "pelotas-rs", latitude: -31.7654, longitude: -52.3376 },
  { slug: "capao-do-leao-rs", latitude: -31.7565, longitude: -52.4889 },
  { slug: "cangucu-rs", latitude: -31.395, longitude: -52.6756 },
  { slug: "morro-redondo-rs", latitude: -31.5887, longitude: -52.6265 },
  { slug: "turucu-rs", latitude: -31.4173, longitude: -52.1706 },
  { slug: "arroio-do-padre-rs", latitude: -31.4389, longitude: -52.4247 },
  { slug: "pedro-osorio-rs", latitude: -31.8642, longitude: -52.8184 },
  { slug: "cerrito-rs", latitude: -31.8418, longitude: -52.8003 },
  { slug: "piratini-rs", latitude: -31.4472, longitude: -53.1042 },
  { slug: "rio-grande-rs", latitude: -32.035, longitude: -52.0986 },
  { slug: "sao-jose-do-norte-rs", latitude: -32.0151, longitude: -52.0417 },
  { slug: "sao-lourenco-do-sul-rs", latitude: -31.365, longitude: -51.9787 },
  { slug: "cristal-rs", latitude: -31.0046, longitude: -52.0504 },
  { slug: "arambare-rs", latitude: -30.91464, longitude: -51.50059 },
  { slug: "barra-do-ribeiro-rs", latitude: -30.291, longitude: -51.301 },
  { slug: "camaqua-rs", latitude: -30.85103, longitude: -51.81257 },
  { slug: "cerro-grande-do-sul-rs", latitude: -30.6, longitude: -51.75 },
  { slug: "dom-feliciano-rs", latitude: -30.70444, longitude: -52.11 },
  { slug: "guaiba-rs", latitude: -30.11055, longitude: -51.31756 },
  { slug: "mariana-pimentel-rs", latitude: -30.35455, longitude: -51.58146 },
  { slug: "mostardas-rs", latitude: -31.10467, longitude: -50.92183 },
  { slug: "sertao-santana-rs", latitude: -30.45927, longitude: -51.60368 },
  { slug: "tapes-rs", latitude: -30.673, longitude: -51.396 },
  { slug: "tavares-rs", latitude: -31.28769, longitude: -51.08923 },
  { slug: "jaguarao-rs", latitude: -32.5667, longitude: -53.3758 },
  { slug: "arroio-grande-rs", latitude: -32.2376, longitude: -53.0862 },
  { slug: "herval-rs", latitude: -32.0236, longitude: -53.3958 },
  { slug: "santa-vitoria-do-palmar-rs", latitude: -33.5189, longitude: -53.3681 },
  { slug: "chui-rs", latitude: -33.6911, longitude: -53.4567 },
  { slug: "pinheiro-machado-rs", latitude: -31.5783, longitude: -53.3811 },
  { slug: "pedras-altas-rs", latitude: -31.7326, longitude: -53.5819 },
  { slug: "bage-rs", latitude: -31.33, longitude: -54.1069 },
  { slug: "candiota-rs", latitude: -31.5583, longitude: -53.6725 },
  { slug: "acegua-rs", latitude: -31.864, longitude: -54.1636 },
  { slug: "dom-pedrito-rs", latitude: -30.9828, longitude: -54.6734 },
] as const;

type JsonRecord = Record<string, unknown>;
type OverviewStatus = "live" | "partial" | "unavailable";

type Overview = {
  status: OverviewStatus;
  fetchedAt: string;
  items: Array<{
    city: { slug: string };
    status: OverviewStatus;
    temperature: number | null;
    condition: string;
    minimum: number | null;
    maximum: number | null;
    rainChance: number | null;
    windSpeed: number | null;
    validAt: string | null;
  }>;
  source: { name: "Open-Meteo" };
  message: string | null;
};

function record(value: unknown): JsonRecord | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : null;
}

function numberValue(value: unknown) {
  if (value === null || value === undefined || typeof value === "boolean") return null;
  if (typeof value === "string" && !value.trim()) return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function rounded(value: number | null) {
  return value === null ? null : Math.round(value);
}

function numberArray(value: unknown): Array<number | null> {
  return Array.isArray(value) ? value.map(numberValue) : [];
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

function weatherLabel(code: number | null) {
  if (code === 0) return "Céu limpo";
  if (code === 1 || code === 2) return "Parcialmente nublado";
  if (code === 3) return "Céu nublado";
  if (code === 45 || code === 48) return "Neblina";
  if (code !== null && code >= 51 && code <= 86) return "Chuva";
  if (code !== null && code >= 95) return "Temporal";
  return "Condição em atualização";
}

function itemStatus(values: Array<number | null>): OverviewStatus {
  const available = values.filter((value) => value !== null).length;
  if (available === 0) return "unavailable";
  return available === values.length ? "live" : "partial";
}

function buildUrl() {
  const params = new URLSearchParams({
    latitude: CITIES.map((city) => city.latitude).join(","),
    longitude: CITIES.map((city) => city.longitude).join(","),
    timezone: CITIES.map(() => TIMEZONE).join(","),
    forecast_days: "1",
    temperature_unit: "celsius",
    wind_speed_unit: "kmh",
    precipitation_unit: "mm",
    timeformat: "iso8601",
    cell_selection: "land",
    current: "temperature_2m,weather_code,wind_speed_10m",
    daily: "temperature_2m_min,temperature_2m_max,precipitation_probability_max",
  });

  return `${ENDPOINT}?${params.toString()}`;
}

function normalize(payload: unknown, fetchedAt: string): Overview {
  const responses = Array.isArray(payload) ? payload : [payload];
  if (responses.length !== CITIES.length) {
    throw new Error(`Open-Meteo retornou ${responses.length} localidades; esperado: ${CITIES.length}.`);
  }

  const items = CITIES.map((city, index) => {
    const root = record(responses[index]);
    const current = root ? record(root.current) : null;
    const daily = root ? record(root.daily) : null;
    const temperature = rounded(numberValue(current?.temperature_2m));
    const minimum = rounded(numberArray(daily?.temperature_2m_min)[0] ?? null);
    const maximum = rounded(numberArray(daily?.temperature_2m_max)[0] ?? null);
    const rainChance = rounded(numberArray(daily?.precipitation_probability_max)[0] ?? null);
    const windSpeed = rounded(numberValue(current?.wind_speed_10m));

    return {
      city: { slug: city.slug },
      status: itemStatus([temperature, minimum, maximum, rainChance, windSpeed]),
      temperature,
      condition: weatherLabel(numberValue(current?.weather_code)),
      minimum,
      maximum,
      rainChance,
      windSpeed,
      validAt: stringValue(current?.time),
    };
  });

  const available = items.filter((item) => item.status !== "unavailable").length;
  const status: OverviewStatus =
    available === 0
      ? "unavailable"
      : items.every((item) => item.status === "live")
        ? "live"
        : "partial";

  return {
    status,
    fetchedAt,
    items,
    source: { name: "Open-Meteo" },
    message: null,
  };
}

function json(body: unknown, status = 200, cacheSeconds = 0) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": cacheSeconds > 0 ? `public, max-age=${cacheSeconds}` : "no-store",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "content-type",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function ageMs(value: string | null | undefined) {
  if (!value) return Number.POSITIVE_INFINITY;
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return Number.POSITIVE_INFINITY;
  return Math.max(0, Date.now() - timestamp);
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return json({ ok: true }, 200, 300);
  if (request.method !== "GET") return json({ error: "Método não permitido." }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return json({ error: "Ambiente do Supabase incompleto." }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: latest } = await supabase
    .from(SNAPSHOT_TABLE)
    .select("payload,fetched_at")
    .order("fetched_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latest?.payload && ageMs(latest.fetched_at) <= FRESH_SNAPSHOT_MS) {
    return json(latest.payload, 200, 120);
  }

  try {
    const response = await fetch(buildUrl(), {
      headers: {
        Accept: "application/json",
        "User-Agent": "MOBI-Tempo-Pelotas-Regional/1.0",
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new Error(`Open-Meteo respondeu com status ${response.status}`);
    }

    const fetchedAt = new Date().toISOString();
    const overview = normalize(await response.json(), fetchedAt);
    if (overview.status === "unavailable") {
      throw new Error("Open-Meteo respondeu sem dados regionais utilizáveis.");
    }

    const { error: insertError } = await supabase.from(SNAPSHOT_TABLE).insert({
      source: overview.source.name,
      status: overview.status,
      payload: overview,
      fetched_at: overview.fetchedAt,
    });
    if (insertError) {
      throw new Error(`Falha ao persistir snapshot regional: ${insertError.message}`);
    }

    const retentionBoundary = new Date(Date.now() - RETENTION_MS).toISOString();
    void supabase.from(SNAPSHOT_TABLE).delete().lt("fetched_at", retentionBoundary);

    return json(overview, 200, 120);
  } catch (error) {
    if (latest?.payload && ageMs(latest.fetched_at) <= STALE_SNAPSHOT_MS) {
      return json(latest.payload, 200, 60);
    }

    console.error("[regional-weather-overview] Falha", error);
    return json(
      {
        error: error instanceof Error ? error.message : String(error),
      },
      502,
    );
  }
});
