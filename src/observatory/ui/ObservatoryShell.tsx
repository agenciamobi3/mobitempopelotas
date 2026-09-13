import { Link } from "@tanstack/react-router";
import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
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
import type { ObservatoryTemporalLayerId } from "../data/observatory-temporal-layers";
import "./ObservatoryScenarioControls.css";
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

type ShareState = "idle" | "copied" | "error";

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
  const [initialCameraState, setInitialCameraState] = useState<ObservatoryCameraState | null>(null);
  const [cameraState, setCameraState] = useState<ObservatoryCameraState | null>(null);
  const [playing, setPlaying] = useState(false);
  const [shareState, setShareState] = useState<ShareState>("idle");

  const refreshLayers = useCallback(() => {
    setLayers(manager.list());
  }, [manager]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const scenario = readObservatoryScenarioHash(window.location.hash);
    if (!scenario) return;

    for (const layer of scenario.layers) {
      manager.setEnabled(layer.id, layer.enabled);
      manager.setOpacity(layer.id, layer.opacity);
    }
    refreshLayers();
    setSelectedTimelineAt(scenario.selectedAt);
    setInitialCameraState(scenario.camera);
    setCameraState(scenario.camera);
  }, [manager, refreshLayers]);

  useEffect(() => {
    if (shareState === "idle" || typeof window === "undefined") return;
    const timeout = window.setTimeout(() => setShareState("idle"), 2600);
    return () => window.clearTimeout(timeout);
  }, [shareState]);

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
      setTimelineSources((current) => {
        const next = { ...current };
        if (timestamps.length === 0) delete next[id];
        else next[id] = timestamps;
        return next;
      });
    },
    [],
  );

  const handleCameraStateChange = useCallback((state: ObservatoryCameraState) => {
    setCameraState(state);
  }, []);

  const handleShareScenario = useCallback(async () => {
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
    const url = new URL(window.location.href);
    url.hash = buildObservatoryScenarioHash(scenario);
    window.history.replaceState(window.history.state, "", url.toString());

    try {
      if (!navigator.clipboard?.writeText) throw new Error("clipboard_unavailable");
      await navigator.clipboard.writeText(url.toString());
      setShareState("copied");
    } catch (error) {
      console.warn("[observatory] Não foi possível copiar o link do cenário.", error);
      setShareState("error");
    }
  }, [cameraState, layers, selectedTimelineAt]);

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
    if (timelineTimestamps.length === 0) {
      setPlaying(false);
      return;
    }

    setSelectedTimelineAt((current) =>
      current && timelineTimestamps.includes(current)
        ? current
        : timelineTimestamps.at(-1) ?? null,
    );
  }, [timelineKey]);

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
            data-state={shareState}
            onClick={() => void handleShareScenario()}
            aria-label={
              shareState === "copied"
                ? "Link da visão copiado"
                : shareState === "error"
                  ? "Não foi possível copiar o link da visão"
                  : "Compartilhar esta visão do Observatório"
            }
            title="Copiar link desta visão"
          >
            {shareState === "copied" ? (
              <Check aria-hidden="true" size={17} />
            ) : (
              <Share2 aria-hidden="true" size={17} />
            )}
            <span>
              {shareState === "copied"
                ? "Link copiado"
                : shareState === "error"
                  ? "Copie pela barra"
                  : "Compartilhar visão"}
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
              initialCameraState={initialCameraState}
              onCameraStateChange={handleCameraStateChange}
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
