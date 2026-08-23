import { PUBLIC_REGIONAL_CITIES } from "@/lib/regional-cities";
import { getSupabaseServerConfig } from "@/lib/supabase/server-client.server";

import type {
  RegionalCitiesOverview,
  RegionalCityOverviewItem,
  RegionalOverviewItemStatus,
} from "./regional-cities-overview.types";

const SNAPSHOT_TABLE = "regional_weather_snapshots";
const SNAPSHOT_MAX_AGE_MS = 6 * 60 * 60 * 1_000;
const REQUEST_TIMEOUT_MS = 4_000;

type JsonRecord = Record<string, unknown>;

function record(value: unknown): JsonRecord | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : null;
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

function nullableNumber(value: unknown) {
  return value === null || (typeof value === "number" && Number.isFinite(value)) ? value : undefined;
}

function overviewStatus(value: unknown): RegionalOverviewItemStatus | null {
  return value === "live" || value === "partial" || value === "unavailable" ? value : null;
}

function parseItem(value: unknown, index: number): RegionalCityOverviewItem | null {
  const item = record(value);
  const expectedCity = PUBLIC_REGIONAL_CITIES[index];
  const city = record(item?.city);
  if (!item || !expectedCity || city?.slug !== expectedCity.slug) return null;

  const status = overviewStatus(item.status);
  const temperature = nullableNumber(item.temperature);
  const minimum = nullableNumber(item.minimum);
  const maximum = nullableNumber(item.maximum);
  const rainChance = nullableNumber(item.rainChance);
  const windSpeed = nullableNumber(item.windSpeed);
  const condition = stringValue(item.condition);
  const validAt = item.validAt === null ? null : stringValue(item.validAt);

  if (
    !status ||
    temperature === undefined ||
    minimum === undefined ||
    maximum === undefined ||
    rainChance === undefined ||
    windSpeed === undefined ||
    !condition ||
    (item.validAt !== null && !validAt)
  ) {
    return null;
  }

  return {
    city: expectedCity,
    status,
    temperature,
    condition,
    minimum,
    maximum,
    rainChance,
    windSpeed,
    validAt,
  };
}

export function parseRegionalCitiesOverviewSnapshot(value: unknown): RegionalCitiesOverview | null {
  const root = record(value);
  const status = overviewStatus(root?.status);
  const fetchedAt = stringValue(root?.fetchedAt);
  const source = record(root?.source);
  const message = root?.message === null ? null : stringValue(root?.message);
  const items = Array.isArray(root?.items) ? root.items.map(parseItem) : [];

  if (
    !root ||
    !status ||
    !fetchedAt ||
    source?.name !== "Open-Meteo" ||
    (root.message !== null && !message) ||
    items.length !== PUBLIC_REGIONAL_CITIES.length ||
    items.some((item) => item === null)
  ) {
    return null;
  }

  return {
    status,
    fetchedAt,
    items: items as RegionalCityOverviewItem[],
    source: { name: "Open-Meteo" },
    message,
  };
}

function snapshotHeaders(key: string) {
  return {
    Accept: "application/json",
    apikey: key,
    Authorization: `Bearer ${key}`,
  };
}

export async function readRegionalCitiesOverviewSnapshot(): Promise<RegionalCitiesOverview | null> {
  const config = getSupabaseServerConfig();
  if (!config.isPublicConfigured || !config.url || !config.publishableKey) return null;

  try {
    const query = new URLSearchParams({
      select: "payload,fetched_at",
      order: "fetched_at.desc",
      limit: "1",
    });
    const response = await fetch(`${config.url}/rest/v1/${SNAPSHOT_TABLE}?${query.toString()}`, {
      headers: snapshotHeaders(config.publishableKey),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) return null;

    const rows = (await response.json()) as unknown;
    if (!Array.isArray(rows) || rows.length === 0) return null;

    const row = record(rows[0]);
    const fetchedAt = stringValue(row?.fetched_at);
    if (!fetchedAt) return null;

    const age = Date.now() - new Date(fetchedAt).getTime();
    if (!Number.isFinite(age) || age < 0 || age > SNAPSHOT_MAX_AGE_MS) return null;

    return parseRegionalCitiesOverviewSnapshot(row?.payload);
  } catch {
    return null;
  }
}

export async function persistRegionalCitiesOverviewSnapshot(
  overview: RegionalCitiesOverview,
): Promise<void> {
  if (overview.status === "unavailable") return;

  const config = getSupabaseServerConfig();
  if (!config.isAdminConfigured || !config.url || !config.secretKey) return;

  try {
    await fetch(`${config.url}/rest/v1/${SNAPSHOT_TABLE}`, {
      method: "POST",
      headers: {
        ...snapshotHeaders(config.secretKey),
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        source: overview.source.name,
        status: overview.status,
        payload: overview,
        fetched_at: overview.fetchedAt,
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    // Persistência é best-effort: nunca deve derrubar a visão regional.
  }
}
