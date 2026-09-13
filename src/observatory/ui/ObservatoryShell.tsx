import { Link } from "@tanstack/react-router";
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CloudLightning,
  Globe2,
  House,
  LayoutDashboard,
  LogOut,
  Pause,
  Play,
  Radar,
  Radio,
  Satellite,
  Settings,
  Share2,
  TriangleAlert,
  UserRound,
  Waves,
} from "lucide-react";

import {
  OBSERVATORY_LAYER_DEFINITIONS,
  OBSERVATORY_LAYER_IDS,
  type ObservatoryLayerId,
} from "../core/ObservatoryLayerCatalog";
import { ObservatoryLayerManager } from "../core/ObservatoryLayerManager";
import {
  buildObservatoryScenarioHash,
  createObservatoryScenario,
  readObservatoryScenarioHash,
  type ObservatoryCameraState,
} from "../core/ObservatoryScenario";
import type { ObservatoryLayerRuntimeState } from "../core/ObservatoryTypes";
import {
  isObservatoryTemporalLayerId,
  type ObservatoryTemporalLayerId,
} from "../data/observatory-temporal-layers";
import "./ObservatoryShell.css";
import "./ObservatoryTimeline.css";

const LazyObservatoryViewer = lazy(() =>
  import("../core/ObservatoryViewer").then((module) => ({
    default: module.ObservatoryViewer,
  })),
);

const TIMELINE_PLAYBACK_INTERVAL_MS = 900;

const layerIcons = {
  radar: Radar,
  satellite: Satellite,
  lightning: CloudLightning,
  alerts: TriangleAlert,
  hydrology: Waves,
} satisfies Record<ObservatoryLayerId, typeof Radar>;

const statusLabels: Record<ObservatoryLayerRuntimeState["status"], string> = {
  loading: "Carregando",
  current: "Atual",
  stale: "Atrasado",
  degraded: "Parcial",
  unavailable: "Indisponível",
  disabled: "Desligado",
  review: "Revisão",
};

function formatTimelineTimestamp(value: string | null) {
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

function nearestTimelineTimestamp(timestamps: readonly string[], requestedAt: string) {
  const requested = Date.parse(requestedAt);
  if (!Number.isFinite(requested) || timestamps.length === 0) return timestamps.at(-1) ?? null;

  let nearest = timestamps[0] ?? null;
  let nearestDistance = nearest ? Math.abs(Date.parse(nearest) - requested) : Number.POSITIVE_INFINITY;
  for (const timestamp of timestamps.slice(1)) {
    const distance = Math.abs(Date.parse(timestamp) - requested);
    if (distance < nearestDistance) {
      nearest = timestamp;
      nearestDistance = distance;
    }
  }
  return nearest;
}

async function copyScenarioLink(value: string) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return;
    } catch {
      // Fallback para ambientes sem permissão de Clipboard API.
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  if (!copied) throw new Error("Não foi possível copiar o link do cenário.");
}

function ViewerLoadingState() {
  return (
    <div className="observatory-shell__viewer-placeholder" role="status" aria-live="polite">
      <Globe2 aria-hidden="true" size={42} />
      <strong>Preparando o Observatório</strong>
      <span>Carregando o globo e as ferramentas de visualização.</span>
    </div>
  );
}

function ObservatoryAccountMenu() {
  return (
    <details className="observatory-shell__account-menu">
      <summary aria-label="Abrir menu da minha conta">
        <UserRound aria-hidden="true" size={18} />
        <span>Meu painel</span>
        <ChevronDown className="observatory-shell__account-chevron" aria-hidden="true" size={15} />
      </summary>
      <div className="observatory-shell__account-popover">
        <Link to="/painel">
          <LayoutDashboard aria-hidden="true" size={16} />
          <span>Meu painel</span>
        </Link>
        <Link to="/conta" search={{ erro: undefined, next: "/conta" }}>
          <Settings aria-hidden="true" size={16} />
          <span>Minha conta</span>
        </Link>
        <Link to="/">
          <House aria-hidden="true" size={16} />
          <span>Portal público</span>
        </Link>
        <form action="/auth/signout" method="post">
          <button type="submit">
            <LogOut aria-hidden="true" size={16} />
            <span>Sair</span>
          </button>
        </form>
      </div>
    </details>
  );
}

export function ObservatoryShell() {
  const manager = useMemo(() => {
    const instance = new ObservatoryLayerManager();
    for (const definition of OBSERVATORY_LAYER_DEFINITIONS) instance.register(definition);
    instance.setOpacity("radar", 0.72);
    instance.setOpacity("satellite", 0.64);
    return instance;
  }, []);
  const [layers, setLayers] = useState(() => manager.list());
  const [timelineSources, setTimelineSources] = useState<
    Partial<Record<ObservatoryTemporalLayerId, string[]>>
  >({});
  const [selectedTimelineAt, setSelectedTimelineAt] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [cameraState, setCameraState] = useState<ObservatoryCameraState | null>(null);
  const [cameraRestoreState, setCameraRestoreState] = useState<ObservatoryCameraState | null>(null);
  const [shareFeedback, setShareFeedback] = useState<"idle" | "copied" | "error">("idle");
  const [timelineSettlementRevision, setTimelineSettlementRevision] = useState(0);
  const scenarioAppliedRef = useRef(false);
  const requestedTimelineAtRef = useRef<string | null>(null);
  const expectedScenarioTimelineLayersRef = useRef<Set<ObservatoryTemporalLayerId>>(new Set());
  const settledScenarioTimelineLayersRef = useRef<Set<ObservatoryTemporalLayerId>>(new Set());

  const refreshLayers = useCallback(() => {
    setLayers(manager.list());
  }, [manager]);

  useEffect(() => {
    if (scenarioAppliedRef.current || typeof window === "undefined") return;
    scenarioAppliedRef.current = true;

    const scenario = readObservatoryScenarioHash(window.location.hash);
    if (!scenario) return;

    const scenarioLayers = new Map(scenario.layers.map((layer) => [layer.id, layer]));
    for (const id of OBSERVATORY_LAYER_IDS) {
      const layer = scenarioLayers.get(id);
      manager.setEnabled(id, layer?.enabled ?? false);
      manager.setOpacity(id, layer?.opacity ?? 1);
    }
    refreshLayers();

    const expectedTemporalLayers = scenario.layers
      .filter((layer) => layer.enabled && isObservatoryTemporalLayerId(layer.id))
      .map((layer) => layer.id as ObservatoryTemporalLayerId);
    expectedScenarioTimelineLayersRef.current = new Set(expectedTemporalLayers);
    settledScenarioTimelineLayersRef.current = new Set();
    requestedTimelineAtRef.current =
      expectedTemporalLayers.length > 0 ? scenario.selectedAt : null;
    if (scenario.selectedAt) setSelectedTimelineAt(scenario.selectedAt);
    if (scenario.camera) setCameraRestoreState(scenario.camera);
  }, [manager, refreshLayers]);

  useEffect(() => {
    if (shareFeedback === "idle") return;
    const timeout = window.setTimeout(() => setShareFeedback("idle"), 2200);
    return () => window.clearTimeout(timeout);
  }, [shareFeedback]);

  const toggleLayer = useCallback(
    (id: ObservatoryLayerId) => {
      const current = manager.get(id);
      if (!current) return;
      manager.setEnabled(id, !current.runtime.enabled);
      refreshLayers();
    },
    [manager, refreshLayers],
  );

  const changeOpacity = useCallback(
    (id: ObservatoryLayerId, opacity: number) => {
      manager.setOpacity(id, opacity);
      refreshLayers();
    },
    [manager, refreshLayers],
  );

  const handleLayerRuntimeChange = useCallback(
    (id: ObservatoryLayerId, patch: Partial<ObservatoryLayerRuntimeState>) => {
      manager.updateRuntime(id, patch);
      refreshLayers();
    },
    [manager, refreshLayers],
  );

  const handleTimelineSourceChange = useCallback(
    (id: ObservatoryTemporalLayerId, timestamps: string[]) => {
      if (expectedScenarioTimelineLayersRef.current.has(id)) {
        settledScenarioTimelineLayersRef.current.add(id);
        setTimelineSettlementRevision((value) => value + 1);
      }
      setTimelineSources((current) => {
        const next = { ...current };
        if (timestamps.length === 0) delete next[id];
        else next[id] = timestamps;
        return next;
      });
    },
    [],
  );

  const enabledLayers = layers
    .filter((layer) => layer.runtime.enabled)
    .map((layer) => layer.definition.id as ObservatoryLayerId);
  const layerOpacities = Object.fromEntries(
    layers.map((layer) => [layer.definition.id, layer.runtime.opacity]),
  ) as Partial<Record<ObservatoryLayerId, number>>;

  const timelineTimestamps = useMemo(() => {
    const unique = new Set<string>();
    for (const timestamps of Object.values(timelineSources)) {
      for (const timestamp of timestamps ?? []) {
        if (Number.isFinite(Date.parse(timestamp))) unique.add(timestamp);
      }
    }
    return [...unique].sort((first, second) => Date.parse(first) - Date.parse(second));
  }, [timelineSources]);
  const timelineKey = timelineTimestamps.join("|");

  useEffect(() => {
    const requested = requestedTimelineAtRef.current;
    const expected = expectedScenarioTimelineLayersRef.current;
    const settled = settledScenarioTimelineLayersRef.current;
    const allExpectedSettled = [...expected].every((id) => settled.has(id));

    if (timelineTimestamps.length === 0) {
      setPlaying(false);
      if (requested && allExpectedSettled) {
        requestedTimelineAtRef.current = null;
        setSelectedTimelineAt(null);
      } else if (!requested) {
        setSelectedTimelineAt(null);
      }
      return;
    }

    if (requested && !allExpectedSettled) return;

    setSelectedTimelineAt((current) => {
      if (requested) {
        requestedTimelineAtRef.current = null;
        return nearestTimelineTimestamp(timelineTimestamps, requested);
      }
      if (current && timelineTimestamps.includes(current)) return current;
      if (current && Number.isFinite(Date.parse(current))) {
        return nearestTimelineTimestamp(timelineTimestamps, current);
      }
      return timelineTimestamps.at(-1) ?? null;
    });
  }, [timelineKey, timelineSettlementRevision]);

  useEffect(() => {
    if (!playing || timelineTimestamps.length < 2) return;

    const interval = window.setInterval(() => {
      setSelectedTimelineAt((current) => {
        const currentIndex = current ? timelineTimestamps.indexOf(current) : -1;
        const nextIndex =
          currentIndex < 0 || currentIndex >= timelineTimestamps.length - 1
            ? 0
            : currentIndex + 1;
        return timelineTimestamps[nextIndex] ?? timelineTimestamps.at(-1) ?? null;
      });
    }, TIMELINE_PLAYBACK_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [playing, timelineKey]);

  const selectedTimelineIndex = Math.max(
    0,
    selectedTimelineAt
      ? timelineTimestamps.indexOf(selectedTimelineAt)
      : timelineTimestamps.length - 1,
  );
  const latestTimelineAt = timelineTimestamps.at(-1) ?? null;
  const isTimelineLive = Boolean(
    selectedTimelineAt && latestTimelineAt && selectedTimelineAt === latestTimelineAt,
  );

  const stepTimeline = useCallback(
    (direction: -1 | 1) => {
      if (timelineTimestamps.length === 0) return;
      setPlaying(false);
      setSelectedTimelineAt((current) => {
        const index = current ? timelineTimestamps.indexOf(current) : timelineTimestamps.length - 1;
        const baseIndex = index < 0 ? timelineTimestamps.length - 1 : index;
        const nextIndex = Math.min(
          timelineTimestamps.length - 1,
          Math.max(0, baseIndex + direction),
        );
        return timelineTimestamps[nextIndex] ?? current;
      });
    },
    [timelineKey],
  );

  const shareScenario = useCallback(async () => {
    if (typeof window === "undefined") return;

    const scenario = createObservatoryScenario({
      selectedAt: selectedTimelineAt,
      layers: layers.map((layer) => ({
        id: layer.definition.id as ObservatoryLayerId,
        enabled: layer.runtime.enabled,
        opacity: layer.runtime.opacity,
      })),
      camera: cameraState,
    });
    const url = `${window.location.origin}${window.location.pathname}${window.location.search}${buildObservatoryScenarioHash(scenario)}`;

    try {
      await copyScenarioLink(url);
      setShareFeedback("copied");
    } catch (error) {
      console.warn("[observatory] Não foi possível copiar o cenário.", error);
      setShareFeedback("error");
    }
  }, [layers, selectedTimelineAt, cameraState]);

  return (
    <main className="observatory-shell" id="conteudo-principal">
      <header className="observatory-shell__header">
        <div className="observatory-shell__identity">
          <Link className="observatory-shell__brand" to="/" aria-label="Ir para o Tempo Pelotas">
            <img
              src="/brand/tempo-pelotas-header.svg"
              alt="Tempo Pelotas"
              width={11349}
              height={1552}
            />
          </Link>
          <h1>Observatório</h1>
        </div>
        <div className="observatory-shell__header-actions">
          <button
            type="button"
            className="observatory-shell__share"
            onClick={() => void shareScenario()}
            aria-label="Compartilhar cenário atual do Observatório"
            title="Copiar link deste cenário"
          >
            {shareFeedback === "copied" ? (
              <Check aria-hidden="true" size={17} />
            ) : (
              <Share2 aria-hidden="true" size={17} />
            )}
            <span>
              {shareFeedback === "copied"
                ? "Link copiado"
                : shareFeedback === "error"
                  ? "Tente novamente"
                  : "Compartilhar"}
            </span>
          </button>
          <ObservatoryAccountMenu />
        </div>
      </header>

      <div className="observatory-shell__workspace">
        <aside className="observatory-shell__panel" aria-label="Camadas do Observatório">
          <div className="observatory-shell__panel-title">
            <span>Camadas</span>
          </div>
          <p>Ative apenas o que deseja visualizar no Globo. Radar, satélite, raios, alertas e hidrologia.</p>

          <div className="observatory-shell__layer-list">
            {layers.map((layer) => {
              const id = layer.definition.id as ObservatoryLayerId;
              const Icon = layerIcons[id];
              const imageLayer = id === "radar" || id === "satellite";

              return (
                <div
                  key={id}
                  className={`observatory-shell__layer${layer.runtime.enabled ? " is-enabled" : ""}`}
                  data-status={layer.runtime.status}
                >
                  <button
                    type="button"
                    className="observatory-shell__layer-toggle"
                    aria-pressed={layer.runtime.enabled}
                    onClick={() => toggleLayer(id)}
                  >
                    <span className="observatory-shell__layer-icon">
                      <Icon aria-hidden="true" size={17} />
                    </span>
                    <span className="observatory-shell__layer-copy">
                      <strong>{layer.definition.label}</strong>
                      <small>OBSERVADO · {layer.definition.attribution}</small>
                    </span>
                    <span className="observatory-shell__layer-state">
                      {statusLabels[layer.runtime.status]}
                    </span>
                  </button>

                  {layer.runtime.enabled && layer.runtime.detail ? (
                    <div className="observatory-shell__layer-detail">{layer.runtime.detail}</div>
                  ) : null}

                  {imageLayer && layer.runtime.enabled ? (
                    <label className="observatory-shell__opacity">
                      <span>Opacidade</span>
                      <input
                        type="range"
                        min="0.2"
                        max="1"
                        step="0.05"
                        value={layer.runtime.opacity}
                        onChange={(event) => changeOpacity(id, Number(event.currentTarget.value))}
                      />
                      <output>{Math.round(layer.runtime.opacity * 100)}%</output>
                    </label>
                  ) : null}
                </div>
              );
            })}
          </div>
        </aside>

        <section className="observatory-shell__viewer" aria-label="Área 3D do Observatório">
          <Suspense fallback={<ViewerLoadingState />}>
            <LazyObservatoryViewer
              enabledLayers={enabledLayers}
              layerOpacities={layerOpacities}
              selectedTimelineAt={selectedTimelineAt}
              cameraRestoreState={cameraRestoreState}
              onCameraStateChange={setCameraState}
              onTimelineSourceChange={handleTimelineSourceChange}
              onLayerRuntimeChange={handleLayerRuntimeChange}
            />
          </Suspense>
        </section>
      </div>

      <footer className="observatory-shell__timeline" aria-label="Linha do tempo observacional">
        {timelineTimestamps.length > 0 ? (
          <>
            <div className="observatory-shell__timeline-controls">
              <button
                type="button"
                onClick={() => stepTimeline(-1)}
                disabled={selectedTimelineIndex <= 0}
                aria-label="Quadro observacional anterior"
                title="Anterior"
              >
                <ChevronLeft aria-hidden="true" size={18} />
              </button>
              <button
                type="button"
                className="observatory-shell__timeline-play"
                onClick={() => setPlaying((current) => !current)}
                disabled={timelineTimestamps.length < 2}
                aria-label={playing ? "Pausar animação" : "Reproduzir animação"}
                title={playing ? "Pausar" : "Reproduzir"}
              >
                {playing ? (
                  <Pause aria-hidden="true" size={17} />
                ) : (
                  <Play aria-hidden="true" size={17} />
                )}
              </button>
              <button
                type="button"
                onClick={() => stepTimeline(1)}
                disabled={selectedTimelineIndex >= timelineTimestamps.length - 1}
                aria-label="Próximo quadro observacional"
                title="Próximo"
              >
                <ChevronRight aria-hidden="true" size={18} />
              </button>
            </div>

            <div className="observatory-shell__timeline-track">
              <div className="observatory-shell__timeline-meta">
                <strong>{formatTimelineTimestamp(selectedTimelineAt)}</strong>
                <span>
                  {selectedTimelineIndex + 1} / {timelineTimestamps.length} quadros sincronizados
                </span>
              </div>
              <input
                type="range"
                min="0"
                max={Math.max(0, timelineTimestamps.length - 1)}
                step="1"
                value={selectedTimelineIndex}
                aria-label="Escolher horário global do Observatório"
                onChange={(event) => {
                  setPlaying(false);
                  setSelectedTimelineAt(
                    timelineTimestamps[Number(event.currentTarget.value)] ?? null,
                  );
                }}
              />
              <div className="observatory-shell__timeline-range" aria-hidden="true">
                <span>{formatTimelineTimestamp(timelineTimestamps[0] ?? null)}</span>
                <span>{formatTimelineTimestamp(latestTimelineAt)}</span>
              </div>
            </div>

            <button
              type="button"
              className={`observatory-shell__live${isTimelineLive ? " is-live" : ""}`}
              onClick={() => {
                setPlaying(false);
                setSelectedTimelineAt(latestTimelineAt);
              }}
              disabled={!latestTimelineAt}
            >
              <Radio aria-hidden="true" size={15} />
              <span>{isTimelineLive ? "Atual" : "Ir para agora"}</span>
            </button>
          </>
        ) : (
          <div className="observatory-shell__timeline-empty">
            <Radio aria-hidden="true" size={16} />
            <span>Carregando os quadros observacionais das camadas temporais ativas…</span>
          </div>
        )}
      </footer>
    </main>
  );
}
