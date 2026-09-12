import { getLagoonMonitoringNetwork } from "@/lib/hydrology/lagoon-network.functions";
import { getLaranjalLevelData } from "@/lib/hydrology/laranjal-level.functions";
import { LARANJAL_LATITUDE, LARANJAL_LONGITUDE } from "@/lib/laranjal-weather";
import { getRedemetOverview } from "@/lib/redemet/redemet.functions";
import type {
  RedemetImageLayerResponse,
  RedemetOverview,
  RedemetStormLayerResponse,
} from "@/lib/redemet/redemet.types";
import { REGIONAL_CITIES } from "@/lib/regional-cities";
import { getAggregatedPelotasWeather } from "@/lib/weather/aggregated-weather.functions";
import type { InmetAlertSeverity } from "@/lib/weather/official-sources.types";

import type { ObservatoryLayerStatus } from "../core/ObservatoryTypes";
import type { ObservatoryLayerId } from "../core/ObservatoryLayerCatalog";

export type ObservatoryImageLayerPayload = {
  kind: "image";
  imageUrl: string;
  bounds: {
    west: number;
    south: number;
    east: number;
    north: number;
  };
};

export type ObservatoryPointMarker = {
  id: string;
  latitude: number;
  longitude: number;
  color: string;
  outlineColor?: string;
  pixelSize?: number;
  label: string;
  detail: string | null;
};

export type ObservatoryPointLayerPayload = {
  kind: "points";
  points: ObservatoryPointMarker[];
};

export type ObservatoryLayerLoadResult = {
  id: ObservatoryLayerId;
  status: ObservatoryLayerStatus;
  observedAt: string | null;
  detail: string;
  payload: ObservatoryImageLayerPayload | ObservatoryPointLayerPayload | null;
};

type HydrologyBundle = Awaited<ReturnType<typeof getHydrologyBundle>>;

let redemetPromise: Promise<RedemetOverview> | null = null;
let weatherPromise: ReturnType<typeof getAggregatedPelotasWeather> | null = null;
let hydrologyPromise: Promise<{
  network: Awaited<ReturnType<typeof getLagoonMonitoringNetwork>>;
  laranjal: Awaited<ReturnType<typeof getLaranjalLevelData>>;
}> | null = null;

function cachedRedemet() {
  if (!redemetPromise) {
    redemetPromise = getRedemetOverview().catch((error) => {
      redemetPromise = null;
      throw error;
    });
  }
  return redemetPromise;
}

function cachedWeather() {
  if (!weatherPromise) {
    weatherPromise = getAggregatedPelotasWeather().catch((error) => {
      weatherPromise = null;
      throw error;
    });
  }
  return weatherPromise;
}

function getHydrologyBundle() {
  return Promise.all([getLagoonMonitoringNetwork(), getLaranjalLevelData()]).then(
    ([network, laranjal]) => ({ network, laranjal }),
  );
}

function cachedHydrology(): Promise<HydrologyBundle> {
  if (!hydrologyPromise) {
    hydrologyPromise = getHydrologyBundle().catch((error) => {
      hydrologyPromise = null;
      throw error;
    });
  }
  return hydrologyPromise;
}

function currentImageFrame(layer: RedemetImageLayerResponse) {
  if (!layer.frames.length) return null;
  const requested = Number.isInteger(layer.currentIndex) ? layer.currentIndex : layer.frames.length - 1;
  return layer.frames[Math.min(layer.frames.length - 1, Math.max(0, requested))] ?? layer.frames.at(-1) ?? null;
}

function imageLayerResult(
  id: "radar" | "satellite",
  layer: RedemetImageLayerResponse,
): ObservatoryLayerLoadResult {
  const frame = currentImageFrame(layer);

  if (!frame) {
    return {
      id,
      status: "unavailable",
      observedAt: null,
      detail: layer.error || `${layer.sourceLabel} não possui imagem disponível agora.`,
      payload: null,
    };
  }

  return {
    id,
    status: layer.error ? "degraded" : "current",
    observedAt: frame.observedAt,
    detail: `${layer.sourceLabel} · ${frame.label}`,
    payload: {
      kind: "image",
      imageUrl: frame.imageUrl,
      bounds: frame.bounds,
    },
  };
}

function lightningLayerResult(layer: RedemetStormLayerResponse): ObservatoryLayerLoadResult {
  const frame = layer.frames[layer.currentIndex] ?? layer.frames.at(-1) ?? null;

  if (!frame) {
    return {
      id: "lightning",
      status: layer.error ? "degraded" : "current",
      observedAt: null,
      detail: layer.error || "Nenhuma ocorrência STSC na janela mais recente.",
      payload: { kind: "points", points: [] },
    };
  }

  return {
    id: "lightning",
    status: layer.error ? "degraded" : "current",
    observedAt: frame.observedAt,
    detail: `${frame.points.length} ocorrência${frame.points.length === 1 ? "" : "s"} · ${frame.label}`,
    payload: {
      kind: "points",
      points: frame.points.map((point, index) => ({
        id: `${frame.id}:${index}`,
        latitude: point.latitude,
        longitude: point.longitude,
        color: "#ffd34d",
        outlineColor: "#fff3ad",
        pixelSize: 7,
        label: "Ocorrência STSC",
        detail: frame.observedAt,
      })),
    },
  };
}

function severityRank(severity: InmetAlertSeverity) {
  if (severity === "great-danger") return 3;
  if (severity === "danger") return 2;
  if (severity === "potential") return 1;
  return 0;
}

function alertColor(severity: InmetAlertSeverity) {
  if (severity === "great-danger") return "#dc2626";
  if (severity === "danger") return "#f97316";
  if (severity === "potential") return "#eab308";
  return "#94a3b8";
}

async function alertsLayerResult(): Promise<ObservatoryLayerLoadResult> {
  const weather = await cachedWeather();
  const directAlerts = weather.alerts.filter((alert) => alert.relevance === "pelotas");
  const inmetStatus = weather.sources.inmet.status;

  if (directAlerts.length === 0) {
    return {
      id: "alerts",
      status: inmetStatus === "unavailable" ? "unavailable" : "current",
      observedAt: weather.source.fetchedAt,
      detail:
        inmetStatus === "unavailable"
          ? "A fonte de alertas do INMET está indisponível."
          : "Nenhum aviso do INMET cita Pelotas diretamente agora.",
      payload: { kind: "points", points: [] },
    };
  }

  const highest = [...directAlerts].sort(
    (first, second) => severityRank(second.severity) - severityRank(first.severity),
  )[0];

  return {
    id: "alerts",
    status: inmetStatus === "unavailable" ? "degraded" : "current",
    observedAt: highest?.sentAt ?? weather.source.fetchedAt,
    detail: `${directAlerts.length} aviso${directAlerts.length === 1 ? "" : "s"} citando Pelotas diretamente`,
    payload: {
      kind: "points",
      points: [
        {
          id: "inmet-pelotas",
          latitude: -31.7654,
          longitude: -52.3376,
          color: alertColor(highest?.severity ?? "unknown"),
          outlineColor: "#ffffff",
          pixelSize: 14,
          label: highest?.headline || "Alerta INMET para Pelotas",
          detail: directAlerts.map((alert) => alert.event).join(" · "),
        },
      ],
    },
  };
}

const HYDROLOGY_CITY_SLUG_BY_STATION: Record<string, string> = {
  "furg-ccmar": "rio-grande-rs",
  "sao-lourenco-do-sul": "sao-lourenco-do-sul-rs",
  arambare: "arambare-rs",
  "sao-jose-do-norte": "sao-jose-do-norte-rs",
};

function hydrologyColor(risk: string) {
  if (risk === "flooding") return "#ef4444";
  if (risk === "attention") return "#f59e0b";
  if (risk === "unavailable") return "#64748b";
  return "#22d3ee";
}

async function hydrologyLayerResult(): Promise<ObservatoryLayerLoadResult> {
  const { network, laranjal } = await cachedHydrology();
  const points: ObservatoryPointMarker[] = [];

  if (laranjal.currentLevel !== null) {
    points.push({
      id: "laranjal",
      latitude: LARANJAL_LATITUDE,
      longitude: LARANJAL_LONGITUDE,
      color: laranjal.status === "stale" ? "#f59e0b" : "#22d3ee",
      outlineColor: "#e0f7ff",
      pixelSize: 10,
      label: "Estação Laranjal",
      detail: `${laranjal.currentLevel.toFixed(2)} m · ${laranjal.source.name}`,
    });
  }

  for (const observation of network.observations) {
    if (observation.currentLevelCm === null) continue;
    const citySlug = HYDROLOGY_CITY_SLUG_BY_STATION[observation.station.id];
    const city = citySlug ? REGIONAL_CITIES.find((candidate) => candidate.slug === citySlug) : null;
    if (!city) continue;

    points.push({
      id: observation.station.id,
      latitude: city.latitude,
      longitude: city.longitude,
      color: hydrologyColor(observation.risk),
      outlineColor: "#e0f7ff",
      pixelSize: 9,
      label: observation.station.name,
      detail: `${observation.currentLevelCm.toFixed(1)} cm · ${observation.station.city}`,
    });
  }

  const observedAt = [laranjal.updatedAt, network.latestUpdatedAt]
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1) ?? null;

  const stale = laranjal.status === "stale" || network.status === "stale";
  const degraded =
    laranjal.status === "unavailable" || network.status === "partial" || network.status === "unavailable";

  return {
    id: "hydrology",
    status: points.length === 0 ? "unavailable" : degraded ? "degraded" : stale ? "stale" : "current",
    observedAt,
    detail:
      points.length === 0
        ? "As estações hidrológicas não devolveram leituras utilizáveis."
        : `${points.length} ponto${points.length === 1 ? "" : "s"} com leitura recente`,
    payload: { kind: "points", points },
  };
}

export async function loadObservatoryLayer(id: ObservatoryLayerId): Promise<ObservatoryLayerLoadResult> {
  if (id === "alerts") return alertsLayerResult();
  if (id === "hydrology") return hydrologyLayerResult();

  const redemet = await cachedRedemet();
  if (id === "radar") return imageLayerResult("radar", redemet.radar);
  if (id === "satellite") return imageLayerResult("satellite", redemet.satellite);
  return lightningLayerResult(redemet.storms);
}
