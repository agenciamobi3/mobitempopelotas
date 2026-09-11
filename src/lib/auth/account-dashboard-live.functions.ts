import type { SupabaseClient } from "@supabase/supabase-js";
import { createServerFn } from "@tanstack/react-start";
import { getRequest, setResponseHeaders } from "@tanstack/react-start/server";

import { isFavoriteResourceKey, type FavoriteResourceKey } from "@/lib/auth/favorite-resources";
import type { FavoriteDatabase } from "@/lib/auth/favorites.functions";
import { fetchDefesaCivilHydroData, type DefesaCivilHydroStation } from "@/lib/hydrology/defesa-civil-rs.server";
import { fetchGuaibaObservation } from "@/lib/hydrology/guaiba.server";
import { fetchSelectedLaranjalLevelData } from "@/lib/hydrology/laranjal-level-source.server";
import { createSupabaseRequestClient } from "@/lib/supabase/request-client.server";
import { getSupabaseServerConfig } from "@/lib/supabase/server-client.server";
import { fetchAggregatedPelotasWeather } from "@/lib/weather/aggregated-weather.server";
import { toProductionAlerts, toProductionWeatherData } from "@/production/adapters/home";
import { weatherConditionLabels } from "@/production/lib/hero-weather-presentation";

export type AccountDashboardLiveStatus = "live" | "stale" | "unavailable";

export type AccountLiveWeatherSummary = {
  available: boolean;
  currentIsObservation: boolean;
  currentTemperature: number | null;
  condition: string;
  observedAt: string | null;
  source: string;
  today: {
    min: number;
    max: number;
    rainChance: number | null;
    precipitation: number;
    condition: string;
  } | null;
  rainPeak6h: number | null;
  rainVolume6h: number;
  windPeak6h: number | null;
  officialAlertCount: number;
};

export type FavoriteLiveCard = {
  status: AccountDashboardLiveStatus;
  badge: string;
  primary: string;
  secondary: string;
  detail: string | null;
  updatedAt: string | null;
  source: string | null;
};

export type AccountDashboardLiveSnapshot = {
  status: "authenticated" | "unauthenticated" | "unavailable";
  favoriteKeys: FavoriteResourceKey[];
  favoritesStorageReady: boolean;
  weather: AccountLiveWeatherSummary;
  favorites: Partial<Record<FavoriteResourceKey, FavoriteLiveCard>>;
};

const EMPTY_WEATHER: AccountLiveWeatherSummary = {
  available: false,
  currentIsObservation: false,
  currentTemperature: null,
  condition: "Dados em atualização",
  observedAt: null,
  source: "Tempo Pelotas",
  today: null,
  rainPeak6h: null,
  rainVolume6h: 0,
  windPeak6h: null,
  officialAlertCount: 0,
};

function applyPrivateHeaders(headers = new Headers()) {
  headers.set("Cache-Control", "private, no-store, max-age=0");
  headers.set("Pragma", "no-cache");
  headers.set("Vary", "Cookie, Authorization");
  setResponseHeaders(headers);
}

function formatNumber(value: number, digits = 2) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

function formatLevel(value: number | null) {
  return value === null || !Number.isFinite(value) ? "Leitura indisponível" : `${formatNumber(value)} m`;
}

function formatSignedCentimeters(value: number | null) {
  if (value === null || !Number.isFinite(value)) return null;
  const signal = value > 0 ? "+" : "";
  return `${signal}${formatNumber(value, 1)} cm`;
}

function formatRain(value: number | null) {
  return value === null || !Number.isFinite(value) ? null : `${formatNumber(value, 1)} mm`;
}

function levelStatus(value: "live" | "stale" | "unavailable") {
  if (value === "live") return { status: "live" as const, badge: "Leitura atual" };
  if (value === "stale") return { status: "stale" as const, badge: "Leitura atrasada" };
  return { status: "unavailable" as const, badge: "Leitura indisponível" };
}

function defesaStationStatus(station: DefesaCivilHydroStation | null) {
  if (!station || station.river.levelM === null) {
    return { status: "unavailable" as const, badge: "Leitura indisponível" };
  }
  if (station.freshness === "recent") return { status: "live" as const, badge: "Leitura recente" };
  if (station.freshness === "delayed" || station.freshness === "old") {
    return { status: "stale" as const, badge: "Leitura atrasada" };
  }
  return { status: "unavailable" as const, badge: "Horário não informado" };
}

function buildWeatherSummary(
  data: Awaited<ReturnType<typeof fetchAggregatedPelotasWeather>> | null,
): AccountLiveWeatherSummary {
  if (!data) return EMPTY_WEATHER;

  const weather = toProductionWeatherData(data);
  const alerts = toProductionAlerts(data);
  const today = weather.daily[0] ?? null;
  const nextHours = weather.hourly.slice(0, 6);
  const firstHour = nextHours[0] ?? null;
  const currentTemperature = weather.current.available
    ? weather.current.temperature
    : firstHour?.temperature ?? null;
  const currentIcon = weather.current.icon ?? firstHour?.icon ?? today?.icon ?? null;
  const rainPeak6h = nextHours.reduce<number | null>((highest, hour) => {
    if (hour.precipitation === null) return highest;
    return highest === null ? hour.precipitation : Math.max(highest, hour.precipitation);
  }, null);
  const rainVolume6h = nextHours.reduce(
    (total, hour) => total + (hour.precipitationMm ?? 0),
    0,
  );
  const windPeak6h = nextHours.reduce<number | null>((highest, hour) => {
    const value = hour.windGust ?? hour.windSpeed;
    return highest === null ? value : Math.max(highest, value);
  }, null);

  return {
    available: weather.current.available || weather.hourly.length > 0 || weather.daily.length > 0,
    currentIsObservation: weather.current.available,
    currentTemperature,
    condition: currentIcon ? weatherConditionLabels[currentIcon] : "Dados em atualização",
    observedAt: weather.current.updatedAt,
    source: weather.current.source.name,
    today: today
      ? {
          min: today.min,
          max: today.max,
          rainChance: today.rainChance,
          precipitation: today.precipitation,
          condition: weatherConditionLabels[today.icon],
        }
      : null,
    rainPeak6h,
    rainVolume6h,
    windPeak6h,
    officialAlertCount: alerts.alerts.filter((alert) => alert.relevance === "pelotas").length,
  };
}

function forecastFavorite(weather: AccountLiveWeatherSummary): FavoriteLiveCard {
  if (!weather.today) {
    return {
      status: "unavailable",
      badge: "Previsão indisponível",
      primary: "Sem previsão agora",
      secondary: "A previsão de 7 dias não respondeu nesta consulta.",
      detail: null,
      updatedAt: null,
      source: null,
    };
  }

  const rainChance =
    weather.today.rainChance === null ? "chance de chuva não informada" : `chuva ${Math.round(weather.today.rainChance)}%`;
  return {
    status: "live",
    badge: "Previsão atual",
    primary: `${Math.round(weather.today.min)}° / ${Math.round(weather.today.max)}°`,
    secondary: `${weather.today.condition} · ${rainChance}`,
    detail: `${formatNumber(weather.today.precipitation, 1)} mm previstos hoje`,
    updatedAt: null,
    source: "MOBI Tempo Pelotas",
  };
}

function laranjalFavorite(
  data: Awaited<ReturnType<typeof fetchSelectedLaranjalLevelData>> | null,
): FavoriteLiveCard {
  if (!data) {
    return {
      status: "unavailable",
      badge: "Leitura indisponível",
      primary: "Sem leitura agora",
      secondary: "A estação do Laranjal não respondeu nesta consulta.",
      detail: null,
      updatedAt: null,
      source: null,
    };
  }

  const status = levelStatus(data.status);
  const trend = formatSignedCentimeters(data.trendCmPerHour);
  const change6h = formatSignedCentimeters(data.change6hCm);
  return {
    ...status,
    primary: formatLevel(data.currentLevel),
    secondary: trend ? `Tendência recente ${trend}/h` : "Tendência recente não disponível",
    detail: change6h ? `Variação em 6 horas: ${change6h}` : data.source.station,
    updatedAt: data.updatedAt,
    source: data.source.name,
  };
}

function guaibaFavorite(
  data: Awaited<ReturnType<typeof fetchGuaibaObservation>> | null,
): FavoriteLiveCard {
  if (!data) {
    return {
      status: "unavailable",
      badge: "Leitura indisponível",
      primary: "Sem leitura agora",
      secondary: "As referências monitoradas do Guaíba não responderam nesta consulta.",
      detail: null,
      updatedAt: null,
      source: null,
    };
  }

  const status = levelStatus(data.status);
  const variation24h = formatSignedCentimeters(data.variation24hCm);
  const trend = formatSignedCentimeters(data.trendCmPerHour);
  return {
    ...status,
    primary: formatLevel(data.currentLevel),
    secondary: variation24h ? `Variação em 24 horas: ${variation24h}` : "Variação de 24 horas não disponível",
    detail: trend ? `Tendência recente ${trend}/h · ${data.station}` : data.station,
    updatedAt: data.updatedAt,
    source: data.source.name,
  };
}

function defesaStationFavorite(
  station: DefesaCivilHydroStation | null,
  source: string | null,
): FavoriteLiveCard {
  const status = defesaStationStatus(station);
  if (!station) {
    return {
      ...status,
      primary: "Sem leitura agora",
      secondary: "A estação não respondeu nesta consulta.",
      detail: null,
      updatedAt: null,
      source,
    };
  }

  const rain24h = formatRain(station.rain.h24Mm);
  return {
    ...status,
    primary: formatLevel(station.river.levelM),
    secondary: station.river.trend
      ? `Tendência da fonte: ${station.river.trend}`
      : "Tendência não informada pela fonte",
    detail: rain24h ? `Chuva em 24 horas: ${rain24h} · estação ${station.code}` : `Estação ${station.code}`,
    updatedAt: station.observedAt,
    source,
  };
}

function regionalWatersFavorite(
  data: Awaited<ReturnType<typeof fetchDefesaCivilHydroData>> | null,
): FavoriteLiveCard {
  if (!data || data.status === "disabled" || data.status === "unavailable") {
    return {
      status: "unavailable",
      badge: "Rede indisponível",
      primary: "Sem resumo agora",
      secondary: "A rede regional não respondeu nesta consulta.",
      detail: null,
      updatedAt: null,
      source: data?.source.name ?? null,
    };
  }

  return {
    status: data.status === "live" ? "live" : "stale",
    badge: data.status === "live" ? "Rede atual" : "Rede parcial",
    primary: `${data.recentStationCount} leituras recentes`,
    secondary: `${data.regionalStationCount} estações regionais nesta consulta`,
    detail: "Cada régua continua sendo interpretada na própria referência.",
    updatedAt: data.latestObservationAt,
    source: data.source.name,
  };
}

async function settleWithin<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T | null> {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      promise.catch((error) => {
        console.warn(`[account/live] ${label} indisponível`, {
          message: error instanceof Error ? error.message : String(error),
        });
        return null;
      }),
      new Promise<null>((resolve) => {
        timeout = setTimeout(() => {
          console.warn(`[account/live] ${label} excedeu o prazo`, { timeoutMs });
          resolve(null);
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

export const getAccountDashboardLiveSnapshot = createServerFn({ method: "GET" }).handler(
  async (): Promise<AccountDashboardLiveSnapshot> => {
    const config = getSupabaseServerConfig();
    if (!config.isPublicConfigured) {
      applyPrivateHeaders();
      return {
        status: "unavailable",
        favoriteKeys: [],
        favoritesStorageReady: false,
        weather: EMPTY_WEATHER,
        favorites: {},
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
        favoriteKeys: [],
        favoritesStorageReady: true,
        weather: EMPTY_WEATHER,
        favorites: {},
      };
    }

    const favoriteClient = client as unknown as SupabaseClient<FavoriteDatabase>;
    const favoriteResult = await favoriteClient
      .from("user_favorites")
      .select("resource_key")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    const favoriteKeys = favoriteResult.error
      ? []
      : (favoriteResult.data ?? []).flatMap((row) =>
          isFavoriteResourceKey(row.resource_key) ? [row.resource_key] : [],
        );

    if (favoriteResult.error) {
      console.warn("[account/live] Não foi possível ler favoritos para o snapshot vivo", {
        code: favoriteResult.error.code,
        message: favoriteResult.error.message,
      });
    }

    const needsLaranjal = favoriteKeys.includes("laranjal-level");
    const needsGuaiba = favoriteKeys.includes("guaiba-level");
    const needsDefesaCivil = favoriteKeys.some((key) =>
      key === "regional-waters" || key === "sao-goncalo-level" || key === "jaguarao-level",
    );

    const [weatherData, laranjalData, guaibaData, defesaCivilData] = await Promise.all([
      settleWithin(fetchAggregatedPelotasWeather(), 5_000, "meteorologia"),
      needsLaranjal
        ? settleWithin(fetchSelectedLaranjalLevelData({ deadlineMs: 1_800 }), 2_600, "Laranjal")
        : Promise.resolve(null),
      needsGuaiba
        ? settleWithin(fetchGuaibaObservation(), 4_500, "Guaíba")
        : Promise.resolve(null),
      needsDefesaCivil
        ? settleWithin(
            fetchDefesaCivilHydroData({
              enabled: process.env.DEFESA_CIVIL_HYDRO_ENABLED?.trim().toLowerCase() !== "false",
            }),
            4_500,
            "Defesa Civil RS",
          )
        : Promise.resolve(null),
    ]);

    const weather = buildWeatherSummary(weatherData);
    const favorites: Partial<Record<FavoriteResourceKey, FavoriteLiveCard>> = {};

    if (favoriteKeys.includes("forecast-7-days")) {
      favorites["forecast-7-days"] = forecastFavorite(weather);
    }
    if (favoriteKeys.includes("laranjal-level")) {
      favorites["laranjal-level"] = laranjalFavorite(laranjalData);
    }
    if (favoriteKeys.includes("guaiba-level")) {
      favorites["guaiba-level"] = guaibaFavorite(guaibaData);
    }
    if (favoriteKeys.includes("regional-waters")) {
      favorites["regional-waters"] = regionalWatersFavorite(defesaCivilData);
    }
    if (favoriteKeys.includes("sao-goncalo-level")) {
      favorites["sao-goncalo-level"] = defesaStationFavorite(
        defesaCivilData?.stations.find((station) => station.code === "DCRS-00063") ?? null,
        defesaCivilData?.source.name ?? null,
      );
    }
    if (favoriteKeys.includes("jaguarao-level")) {
      favorites["jaguarao-level"] = defesaStationFavorite(
        defesaCivilData?.stations.find((station) => station.code === "DCRS-00115") ?? null,
        defesaCivilData?.source.name ?? null,
      );
    }

    applyPrivateHeaders(responseHeaders);
    return {
      status: "authenticated",
      favoriteKeys,
      favoritesStorageReady: !favoriteResult.error,
      weather,
      favorites,
    };
  },
);
