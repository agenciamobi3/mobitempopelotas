"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { GeoJSONSource, Map as MapLibreMap, Marker as MapLibreMarker } from "maplibre-gl";
import type {
  RedemetImageLayerResponse,
  RedemetSatelliteType,
  RedemetStormLayerResponse,
} from "@/production/lib/redemet-types";
import type { RegionalWeather, WeatherIconName } from "@/production/lib/weather-data";
import styles from "./weather-map.module.css";

const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";
const PELOTAS_CENTER: [number, number] = [-52.3376, -31.7654];
const SANTIAGO_CENTER: [number, number] = [-54.930257, -29.225213];
const IMAGE_SOURCE_ID = "redemet-image-source";
const IMAGE_LAYER_ID = "redemet-image-layer";
const STORMS_SOURCE_ID = "redemet-storms-source";
const STORMS_GLOW_LAYER_ID = "redemet-storms-glow";
const STORMS_LAYER_ID = "redemet-storms-points";
const REFRESH_INTERVAL = 5 * 60 * 1_000;

const conditionLabels: Record<WeatherIconName, string> = {
  sun: "Céu limpo",
  moon: "Noite de céu limpo",
  "partly-cloudy": "Sol entre nuvens",
  "partly-cloudy-night": "Noite parcialmente nublada",
  cloud: "Céu nublado",
  rain: "Chuva",
  storm: "Temporal",
  wind: "Vento",
};

type MapMode = "satellite" | "radar" | "storms";
type ImageRenderState = "idle" | "loading" | "ready" | "error";
type ActiveLayer =
  | { kind: "image"; data: RedemetImageLayerResponse }
  | { kind: "storms"; data: RedemetStormLayerResponse };

type WeatherMapProps = {
  regionalWeather: RegionalWeather[];
};

const SATELLITE_OPTIONS: Array<{ value: RedemetSatelliteType; label: string }> = [
  { value: "realcada", label: "Realçado" },
  { value: "ir", label: "Infravermelho" },
  { value: "vis", label: "Visível" },
];

function formatUpdatedAt(value: string | null | undefined) {
  if (!value) return "Horário indisponível";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Horário indisponível";

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function formatExpectedTime(value: string | null | undefined) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function createLocationMarker(label: string, detail: string, variant: "pelotas" | "radar") {
  const element = document.createElement("div");
  element.className = `${styles.locationMarker} ${styles[variant]}`;
  element.setAttribute("role", "img");
  element.setAttribute("aria-label", `${label}: ${detail}`);

  const strong = document.createElement("strong");
  strong.textContent = label;

  const span = document.createElement("span");
  span.textContent = detail;

  element.append(strong, span);
  return element;
}

function PlayIcon({ playing }: { playing: boolean }) {
  return playing ? (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 6v12M16 6v12" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m8 5 11 7-11 7V5Z" />
    </svg>
  );
}

function removeOperationalLayers(map: MapLibreMap) {
  for (const layerId of [IMAGE_LAYER_ID, STORMS_LAYER_ID, STORMS_GLOW_LAYER_ID]) {
    if (map.getLayer(layerId)) map.removeLayer(layerId);
  }

  for (const sourceId of [IMAGE_SOURCE_ID, STORMS_SOURCE_ID]) {
    if (map.getSource(sourceId)) map.removeSource(sourceId);
  }
}

function firstLabelLayer(map: MapLibreMap) {
  return (map.getStyle().layers ?? []).find((layer) => layer.type === "symbol")?.id;
}

async function fetchVerifiedImageObjectUrl(imageUrl: string, signal: AbortSignal) {
  const response = await fetch(imageUrl, {
    headers: { Accept: "image/png,image/webp,image/jpeg,image/gif;q=0.8" },
    signal,
  });

  if (!response.ok) {
    throw new Error(`Imagem meteorológica respondeu com status ${response.status}`);
  }

  const contentType =
    response.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase() ?? "";
  if (!contentType.startsWith("image/")) {
    throw new Error("A resposta da camada meteorológica não é uma imagem válida.");
  }

  const blob = await response.blob();
  if (blob.size === 0) throw new Error("A camada meteorológica retornou uma imagem vazia.");

  const objectUrl = URL.createObjectURL(blob);

  try {
    await new Promise<void>((resolve, reject) => {
      const image = new Image();

      const cleanup = () => {
        signal.removeEventListener("abort", handleAbort);
        image.onload = null;
        image.onerror = null;
      };
      const handleAbort = () => {
        cleanup();
        reject(new DOMException("Operação cancelada", "AbortError"));
      };

      image.onload = () => {
        cleanup();
        resolve();
      };
      image.onerror = () => {
        cleanup();
        reject(new Error("O navegador não conseguiu decodificar a imagem meteorológica."));
      };
      signal.addEventListener("abort", handleAbort, { once: true });
      image.src = objectUrl;
    });

    return objectUrl;
  } catch (error) {
    URL.revokeObjectURL(objectUrl);
    throw error;
  }
}

export function WeatherMap({ regionalWeather }: WeatherMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<MapLibreMarker[]>([]);
  const initializingRef = useRef(false);
  const opacityRef = useRef(78);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasMapError, setHasMapError] = useState(false);
  const [mode, setMode] = useState<MapMode>("satellite");
  const [satelliteType, setSatelliteType] = useState<RedemetSatelliteType>("realcada");
  const [activeLayer, setActiveLayer] = useState<ActiveLayer | null>(null);
  const [loadingLayer, setLoadingLayer] = useState(true);
  const [imageRenderState, setImageRenderState] = useState<ImageRenderState>("idle");
  const [imageRenderError, setImageRenderError] = useState<string | null>(null);
  const [renderedImageFrameId, setRenderedImageFrameId] = useState<string | null>(null);
  const [selectedFrameIndex, setSelectedFrameIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [opacity, setOpacity] = useState(78);

  const frames = activeLayer?.data.frames ?? [];
  const selectedFrame = frames[selectedFrameIndex] ?? null;
  const metadataAvailable = Boolean(activeLayer?.data.available && selectedFrame);
  const selectedImageFrameId =
    activeLayer?.kind === "image" && selectedFrame ? selectedFrame.id : null;
  const imageLayerFailed = Boolean(
    metadataAvailable && activeLayer?.kind === "image" && imageRenderState === "error",
  );
  const operationalLayerReady = Boolean(
    metadataAvailable &&
      (activeLayer?.kind === "storms" ||
        (activeLayer?.kind === "image" &&
          imageRenderState === "ready" &&
          renderedImageFrameId === selectedImageFrameId)),
  );
  const hasUnavailableLayer = Boolean(
    !loadingLayer && activeLayer && (!activeLayer.data.available || imageLayerFailed),
  );
  const visibleDaylightPause = Boolean(
    mode === "satellite" &&
      satelliteType === "vis" &&
      activeLayer?.kind === "image" &&
      activeLayer.data.availabilityReason === "daylight" &&
      !activeLayer.data.available,
  );
  const nextVisibleTime =
    visibleDaylightPause && activeLayer?.kind === "image"
      ? formatExpectedTime(activeLayer.data.nextExpectedAt)
      : null;

  const layerEndpoint = useMemo(() => {
    if (mode === "satellite") {
      return `/api/redemet/satellite?type=${satelliteType}&frames=10`;
    }
    if (mode === "radar") return "/api/redemet/radar?frames=10";
    return "/api/redemet/storms?frames=20";
  }, [mode, satelliteType]);

  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    let cancelled = false;
    let observer: IntersectionObserver | null = null;

    const initializeMap = async () => {
      if (mapRef.current || initializingRef.current || cancelled) return;
      initializingRef.current = true;

      try {
        const maplibregl = await import("maplibre-gl");
        if (cancelled || !mapContainerRef.current) return;

        const map = new maplibregl.Map({
          container: mapContainerRef.current,
          style: MAP_STYLE,
          center: PELOTAS_CENTER,
          zoom: 4.4,
          minZoom: 4,
          maxZoom: 13,
          cooperativeGestures: true,
        });

        mapRef.current = map;
        map.dragRotate.disable();
        map.touchZoomRotate.disableRotation();
        map.addControl(
          new maplibregl.NavigationControl({
            showCompass: false,
            visualizePitch: false,
          }),
          "bottom-right",
        );
        map.addControl(new maplibregl.FullscreenControl(), "bottom-right");

        markersRef.current = [
          new maplibregl.Marker({
            element: createLocationMarker("Pelotas", "Centro do monitoramento", "pelotas"),
            anchor: "bottom",
          })
            .setLngLat(PELOTAS_CENTER)
            .addTo(map),
          new maplibregl.Marker({
            element: createLocationMarker("Santiago", "Radar meteorológico", "radar"),
            anchor: "bottom",
          })
            .setLngLat(SANTIAGO_CENTER)
            .addTo(map),
        ];

        map.once("load", () => {
          if (!cancelled) setIsLoaded(true);
        });
      } catch (error) {
        console.error("Falha ao inicializar o mapa REDEMET:", error);
        if (!cancelled) setHasMapError(true);
      } finally {
        initializingRef.current = false;
      }
    };

    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            void initializeMap();
            observer?.disconnect();
          }
        },
        { rootMargin: "280px" },
      );
      observer.observe(container);
    } else {
      void initializeMap();
    }

    return () => {
      cancelled = true;
      observer?.disconnect();
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const radarMarker = markersRef.current[1];
    if (!radarMarker) return;

    const element = radarMarker.getElement();
    const hidden = mode !== "radar";
    element.hidden = hidden;
    element.setAttribute("aria-hidden", hidden ? "true" : "false");
  }, [isLoaded, mode]);

  useEffect(() => {
    if (!isLoaded) return;

    let cancelled = false;

    const loadLayer = async (background = false) => {
      if (!background) {
        setLoadingLayer(true);
        setPlaying(false);
        setImageRenderState("idle");
        setImageRenderError(null);
        setRenderedImageFrameId(null);
      }

      try {
        const response = await fetch(layerEndpoint, {
          headers: { Accept: "application/json" },
        });

        if (!response.ok) {
          throw new Error(`Camada REDEMET respondeu com status ${response.status}`);
        }

        const payload = (await response.json()) as
          | RedemetImageLayerResponse
          | RedemetStormLayerResponse;

        if (cancelled) return;

        const nextLayer: ActiveLayer =
          mode === "storms"
            ? { kind: "storms", data: payload as RedemetStormLayerResponse }
            : { kind: "image", data: payload as RedemetImageLayerResponse };

        setActiveLayer(nextLayer);
        setSelectedFrameIndex(nextLayer.data.currentIndex);
      } catch (error) {
        console.error("Falha ao carregar camada REDEMET:", error);

        if (!cancelled) {
          const errorMessage = "Não foi possível consultar a REDEMET neste momento.";
          const base = {
            configured: true,
            available: false,
            provider: "REDEMET / DECEA" as const,
            sourceLabel: "REDEMET / DECEA",
            frames: [],
            currentIndex: 0,
            updatedAt: new Date().toISOString(),
            error: errorMessage,
          };

          setActiveLayer(
            mode === "storms"
              ? {
                  kind: "storms",
                  data: {
                    ...base,
                    product: "STSC — ocorrências de trovoada",
                  },
                }
              : {
                  kind: "image",
                  data: {
                    ...base,
                    product:
                      mode === "radar"
                        ? "Radar meteorológico de Santiago"
                        : "Satélite meteorológico",
                  },
                },
          );
          setSelectedFrameIndex(0);
        }
      } finally {
        if (!cancelled && !background) setLoadingLayer(false);
      }
    };

    void loadLayer();
    const interval = window.setInterval(() => void loadLayer(true), REFRESH_INTERVAL);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [isLoaded, layerEndpoint, mode]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isLoaded || !map.isStyleLoaded()) return;

    let cancelled = false;
    let objectUrl: string | null = null;
    const controller = new AbortController();

    removeOperationalLayers(map);
    setImageRenderError(null);
    setRenderedImageFrameId(null);

    if (!activeLayer?.data.available || !selectedFrame) {
      setImageRenderState("idle");
      return () => controller.abort();
    }

    const beforeLayerId = firstLabelLayer(map);

    if (activeLayer.kind === "image") {
      const frame = selectedFrame as RedemetImageLayerResponse["frames"][number];
      const { west, south, east, north } = frame.bounds;
      setImageRenderState("loading");

      const loadVerifiedImageLayer = async () => {
        try {
          objectUrl = await fetchVerifiedImageObjectUrl(frame.imageUrl, controller.signal);
          if (cancelled || !mapRef.current || mapRef.current !== map) return;

          map.addSource(IMAGE_SOURCE_ID, {
            type: "image",
            url: objectUrl,
            coordinates: [
              [west, north],
              [east, north],
              [east, south],
              [west, south],
            ],
          });
          map.addLayer(
            {
              id: IMAGE_LAYER_ID,
              type: "raster",
              source: IMAGE_SOURCE_ID,
              paint: {
                "raster-opacity": opacityRef.current / 100,
                "raster-fade-duration": 120,
              },
            },
            beforeLayerId,
          );
          setRenderedImageFrameId(frame.id);
          setImageRenderState("ready");
        } catch (error) {
          if (cancelled || controller.signal.aborted) return;

          const message =
            error instanceof Error
              ? error.message
              : "A imagem meteorológica não pôde ser carregada no navegador.";
          console.error("Falha ao renderizar imagem REDEMET:", error);
          setRenderedImageFrameId(null);
          setImageRenderState("error");
          setImageRenderError(message);
        }
      };

      void loadVerifiedImageLayer();

      return () => {
        cancelled = true;
        controller.abort();
        removeOperationalLayers(map);
        if (objectUrl) URL.revokeObjectURL(objectUrl);
      };
    }

    setImageRenderState("idle");
    const frame = selectedFrame as RedemetStormLayerResponse["frames"][number];
    const featureCollection = {
      type: "FeatureCollection" as const,
      features: frame.points.map((point, index) => ({
        type: "Feature" as const,
        id: index,
        properties: {},
        geometry: {
          type: "Point" as const,
          coordinates: [point.longitude, point.latitude],
        },
      })),
    };

    map.addSource(STORMS_SOURCE_ID, {
      type: "geojson",
      data: featureCollection,
    });
    map.addLayer(
      {
        id: STORMS_GLOW_LAYER_ID,
        type: "circle",
        source: STORMS_SOURCE_ID,
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 5, 7, 10, 15],
          "circle-color": "#F27035",
          "circle-opacity": 0.2,
          "circle-blur": 0.45,
        },
      },
      beforeLayerId,
    );
    map.addLayer(
      {
        id: STORMS_LAYER_ID,
        type: "circle",
        source: STORMS_SOURCE_ID,
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 5, 3.5, 10, 7],
          "circle-color": "#F27035",
          "circle-opacity": 0.92,
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 1.4,
        },
      },
      beforeLayerId,
    );

    return () => {
      cancelled = true;
      controller.abort();
      removeOperationalLayers(map);
    };
  }, [activeLayer, isLoaded, selectedFrame]);

  useEffect(() => {
    opacityRef.current = opacity;
    const map = mapRef.current;
    if (!map?.getLayer(IMAGE_LAYER_ID)) return;
    map.setPaintProperty(IMAGE_LAYER_ID, "raster-opacity", opacity / 100);
  }, [opacity]);

  useEffect(() => {
    if (!playing || frames.length < 2 || !operationalLayerReady) return;

    const interval = window.setInterval(() => {
      setSelectedFrameIndex((current) => (current >= frames.length - 1 ? 0 : current + 1));
    }, 900);

    return () => window.clearInterval(interval);
  }, [frames.length, operationalLayerReady, playing]);

  useEffect(() => {
    if (mode !== "storms" || activeLayer?.kind !== "storms") return;

    const map = mapRef.current;
    const source = map?.getSource(STORMS_SOURCE_ID) as GeoJSONSource | undefined;
    if (!source || !selectedFrame) return;

    const frame = selectedFrame as RedemetStormLayerResponse["frames"][number];
    source.setData({
      type: "FeatureCollection",
      features: frame.points.map((point, index) => ({
        type: "Feature",
        id: index,
        properties: {},
        geometry: {
          type: "Point",
          coordinates: [point.longitude, point.latitude],
        },
      })),
    });
  }, [activeLayer, mode, selectedFrame]);

  const centerOnPelotas = () => {
    mapRef.current?.easeTo({ center: PELOTAS_CENTER, zoom: 8.2, duration: 700 });
  };

  const selectMode = (nextMode: MapMode) => {
    setMode(nextMode);
    setPlaying(false);
    setActiveLayer(null);
    setSelectedFrameIndex(0);
    setImageRenderState("idle");
    setImageRenderError(null);
    setRenderedImageFrameId(null);
  };

  const sourceDescription = activeLayer?.data.sourceLabel ?? "REDEMET / DECEA";
  const selectedStormCount =
    activeLayer?.kind === "storms" && selectedFrame
      ? (selectedFrame as RedemetStormLayerResponse["frames"][number]).points.length
      : null;
  const imageLayerLabel = mode === "radar" ? "radar" : "satélite";
  const sourceStatusLabel =
    loadingLayer || !activeLayer
      ? "Consultando REDEMET"
      : activeLayer.kind === "image" &&
          metadataAvailable &&
          !imageLayerFailed &&
          !operationalLayerReady
        ? `Carregando imagem de ${imageLayerLabel}`
        : operationalLayerReady
          ? activeLayer.kind === "image"
            ? mode === "radar"
              ? "Radar carregado"
              : "Imagem carregada"
            : "Dados atualizados"
          : visibleDaylightPause
            ? "Aguardando luz solar"
            : imageLayerFailed
              ? "Imagem indisponível"
              : "Camada indisponível";
  const unavailableMessage = imageLayerFailed
    ? imageRenderError ??
      "O frame foi encontrado, mas a imagem meteorológica não pôde ser carregada no navegador."
    : activeLayer?.data.error;
  const imageFailureTitle =
    mode === "radar" ? "Imagem do radar não carregou" : "Imagem de satélite não carregou";

  return (
    <section className="map-panel" id="regiao" aria-labelledby="map-title">
      <div className="map-panel-heading">
        <div>
          <span className="eyebrow">REDEMET / DECEA</span>
          <h2 id="map-title">Monitoramento meteorológico regional</h2>
        </div>
        <button
          className="map-control"
          type="button"
          aria-label="Voltar o mapa para Pelotas"
          onClick={centerOnPelotas}
          disabled={!isLoaded}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm9 3h-2.07A7 7 0 0 0 13 5.07V3h-2v2.07A7 7 0 0 0 5.07 11H3v2h2.07A7 7 0 0 0 11 18.93V21h2v-2.07A7 7 0 0 0 18.93 13H21v-2Z"
              fill="currentColor"
            />
          </svg>
        </button>
      </div>

      <div
        className={`map-canvas map-canvas--interactive map-canvas--${mode}${hasUnavailableLayer ? " has-layer-notice" : ""} ${styles.canvas}`}
        aria-label="Mapa meteorológico oficial da REDEMET para Pelotas e região"
      >
        <div ref={mapContainerRef} className="regional-map-engine" />

        <div className="map-layer-switcher" aria-label="Escolha a camada meteorológica">
          <button
            type="button"
            className={mode === "satellite" ? "is-active" : undefined}
            aria-pressed={mode === "satellite"}
            onClick={() => selectMode("satellite")}
            disabled={!isLoaded}
          >
            Satélite
          </button>
          <button
            type="button"
            className={mode === "radar" ? "is-active" : undefined}
            aria-pressed={mode === "radar"}
            onClick={() => selectMode("radar")}
            disabled={!isLoaded}
          >
            Radar
          </button>
          <button
            type="button"
            className={mode === "storms" ? "is-active" : undefined}
            aria-pressed={mode === "storms"}
            onClick={() => selectMode("storms")}
            disabled={!isLoaded}
          >
            Trovoadas
          </button>
        </div>

        {mode === "satellite" ? (
          <div className={styles.satelliteSwitcher} aria-label="Tipo de imagem de satélite">
            {SATELLITE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={satelliteType === option.value ? styles.active : undefined}
                aria-pressed={satelliteType === option.value}
                onClick={() => {
                  setSatelliteType(option.value);
                  setPlaying(false);
                  setActiveLayer(null);
                  setImageRenderState("idle");
                  setImageRenderError(null);
                  setRenderedImageFrameId(null);
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        ) : null}

        <div className={styles.sourceBadge} aria-live="polite">
          <span
            className={
              operationalLayerReady
                ? styles.liveDot
                : imageLayerFailed
                  ? styles.errorDot
                  : styles.neutralDot
            }
            aria-hidden="true"
          />
          <div>
            <strong>{sourceStatusLabel}</strong>
            <small>{sourceDescription}</small>
          </div>
        </div>

        <div
          className={`map-loading ${isLoaded ? "is-hidden" : ""} ${hasMapError ? "has-error" : ""}`}
          role="status"
          aria-live="polite"
        >
          <span aria-hidden="true" />
          <strong>
            {hasMapError
              ? "Mapa temporariamente indisponível"
              : "Carregando monitoramento regional"}
          </strong>
          <small>
            {hasMapError
              ? "As demais informações do portal continuam disponíveis."
              : "O mapa aparecerá em alguns instantes."}
          </small>
        </div>

        {metadataAvailable && activeLayer && selectedFrame ? (
          <div className={`radar-player ${styles.player}`} aria-label="Controles da camada REDEMET">
            <div className="radar-player-topline">
              <button
                className="radar-play-button"
                type="button"
                onClick={() => setPlaying((current) => !current)}
                aria-label={playing ? "Pausar animação" : "Reproduzir animação"}
              >
                <PlayIcon playing={playing} />
              </button>
              <div className="radar-frame-status" aria-live="polite">
                <span>
                  {mode === "radar"
                    ? "Radar de Santiago"
                    : mode === "satellite"
                      ? "Imagem de satélite"
                      : `${selectedStormCount ?? 0} ocorrências no quadro`}
                </span>
                <strong>{selectedFrame.label}</strong>
              </div>
              {activeLayer.kind === "image" ? (
                <label className="radar-opacity-control">
                  <span>Opacidade</span>
                  <input
                    type="range"
                    min="30"
                    max="100"
                    step="5"
                    value={opacity}
                    onChange={(event) => setOpacity(Number(event.target.value))}
                  />
                </label>
              ) : (
                <div className={styles.stormCounter}>
                  <strong>{selectedStormCount ?? 0}</strong>
                  <span>pontos detectados</span>
                </div>
              )}
            </div>

            <input
              className="radar-timeline"
              type="range"
              min="0"
              max={Math.max(0, frames.length - 1)}
              step="1"
              value={selectedFrameIndex}
              aria-label="Escolher o horário da camada meteorológica"
              onChange={(event) => {
                setPlaying(false);
                setSelectedFrameIndex(Number(event.target.value));
              }}
            />

            <div className="radar-time-range" aria-hidden="true">
              <span>{frames[0]?.label}</span>
              <span>Sequência observada</span>
              <span>{frames.at(-1)?.label}</span>
            </div>

            {mode === "radar" ? (
              <div className="radar-intensity-legend">
                <span>Eco mais fraco</span>
                <i aria-hidden="true" />
                <span>Eco mais intenso</span>
              </div>
            ) : mode === "storms" ? (
              <p className={styles.monitoringNote}>
                Pontos indicam ocorrências detectadas pelo produto STSC. Não substituem alertas
                oficiais.
              </p>
            ) : null}

            {activeLayer.kind === "image" && operationalLayerReady ? (
              <small className={styles.renderStatus}>
                Imagem carregada no navegador. A ausência de cores no quadro não substitui a
                observação meteorológica nem os avisos oficiais.
              </small>
            ) : null}

            <small className="radar-provider-note">
              {activeLayer.data.product} · {activeLayer.data.provider} · atualização{" "}
              {formatUpdatedAt(activeLayer.data.updatedAt)}
            </small>
          </div>
        ) : null}

        {hasUnavailableLayer && activeLayer ? (
          <div
            className={`map-radar-unavailable${visibleDaylightPause ? " is-daylight" : ""}`}
            role="status"
          >
            <strong>
              {visibleDaylightPause
                ? "Canal visível depende de luz solar"
                : imageLayerFailed
                  ? imageFailureTitle
                  : "Camada temporariamente indisponível"}
            </strong>
            <span>{unavailableMessage}</span>
            {imageLayerFailed ? (
              <small>
                A metadata do quadro foi recebida, mas o raster não foi validado no navegador. O
                mapa-base continua disponível.
              </small>
            ) : null}
            {visibleDaylightPause && nextVisibleTime ? (
              <small>Próxima imagem útil esperada: por volta de {nextVisibleTime}.</small>
            ) : null}
          </div>
        ) : null}
      </div>

      <p className={styles.disclaimer}>
        As camadas mostram produtos meteorológicos oficiais para monitoramento. Consulte os avisos
        do INMET, da Defesa Civil e das autoridades locais em situações de risco.
      </p>

      <ul className="regional-weather-accessible">
        {regionalWeather.map((item) => (
          <li key={item.city}>
            {item.city}: {item.temperature} graus, {conditionLabels[item.condition]}.
          </li>
        ))}
      </ul>
    </section>
  );
}
