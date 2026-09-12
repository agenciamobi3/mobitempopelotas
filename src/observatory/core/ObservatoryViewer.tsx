import { Compass, Crosshair, Minus, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { loadObservatoryLayer } from "../data/observatory-live-layers";
import {
  isObservatoryTemporalLayerId,
  loadObservatoryTemporalLayer,
  selectTemporalFrame,
  temporalTimestamps,
  type ObservatoryTemporalLayerId,
  type ObservatoryTemporalLayerResult,
} from "../data/observatory-temporal-layers";
import type { ObservatoryComparisonState } from "./ObservatoryComparison";
import type { ObservatoryLayerId } from "./ObservatoryLayerCatalog";
import type { ObservatoryCameraState } from "./ObservatoryScenario";
import type { ObservatoryLayerRuntimeState } from "./ObservatoryTypes";
import type { ObservatoryCesiumRuntime } from "./observatory-cesium-runtime";
import { ObservatoryRenderGovernor } from "./ObservatoryRenderGovernor";
import "./ObservatoryViewer.css";

const CESIUM_BASE_URL = "/cesium/";

type ViewerStatus = "loading" | "ready" | "error";
type TerrainStatus = "loading" | "reearth" | "ellipsoid";

type CesiumGlobal = typeof globalThis & {
  CESIUM_BASE_URL?: string;
};

type ObservatoryViewerProps = {
  enabledLayers: readonly ObservatoryLayerId[];
  layerOpacities: Partial<Record<ObservatoryLayerId, number>>;
  selectedTimelineAt: string | null;
  comparison: ObservatoryComparisonState | null;
  cameraRestoreState: ObservatoryCameraState | null;
  onCameraStateChange: (state: ObservatoryCameraState) => void;
  onTimelineSourceChange: (id: ObservatoryTemporalLayerId, timestamps: string[]) => void;
  onLayerRuntimeChange: (
    id: ObservatoryLayerId,
    patch: Partial<ObservatoryLayerRuntimeState>,
  ) => void;
};

type RenderedTemporalState = {
  observedAt: string | null;
  detail: string | null;
};

function describeRuntimeError(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim().slice(0, 220);
  }
  return "Falha não identificada durante a inicialização do motor 3D.";
}

async function renderTemporalFrame(
  runtime: ObservatoryCesiumRuntime,
  id: ObservatoryTemporalLayerId,
  result: ObservatoryTemporalLayerResult,
  selectedAt: string | null,
  opacity: number,
): Promise<RenderedTemporalState | null> {
  const frame = selectTemporalFrame(result, selectedAt);
  if (!frame) {
    runtime.removeLayer(id);
    return null;
  }

  if (frame.payload.kind === "image") {
    await runtime.setImageLayer(id, {
      imageUrl: frame.payload.imageUrl,
      bounds: frame.payload.bounds,
      opacity,
    });
  } else {
    runtime.setPointLayer(id, frame.payload.points);
  }

  return { observedAt: frame.observedAt, detail: frame.detail };
}

async function renderTemporalLayer(
  runtime: ObservatoryCesiumRuntime,
  id: ObservatoryTemporalLayerId,
  result: ObservatoryTemporalLayerResult,
  selectedAt: string | null,
  opacity: number,
  comparison: ObservatoryComparisonState | null,
): Promise<RenderedTemporalState | null> {
  if (comparison?.enabled && comparison.layerId === id) {
    const leftFrame = selectTemporalFrame(result, comparison.leftAt);
    const rightFrame = selectTemporalFrame(result, comparison.rightAt);

    if (
      leftFrame?.payload.kind === "image" &&
      rightFrame?.payload.kind === "image"
    ) {
      await runtime.setImageComparison(id, {
        left: {
          imageUrl: leftFrame.payload.imageUrl,
          bounds: leftFrame.payload.bounds,
          opacity,
        },
        right: {
          imageUrl: rightFrame.payload.imageUrl,
          bounds: rightFrame.payload.bounds,
          opacity,
        },
        splitPosition: comparison.splitPosition,
      });

      return {
        observedAt: rightFrame.observedAt ?? leftFrame.observedAt,
        detail: `Comparação A/B · ${leftFrame.label} ↔ ${rightFrame.label}`,
      };
    }
  }

  return renderTemporalFrame(runtime, id, result, selectedAt, opacity);
}

export function ObservatoryViewer({
  enabledLayers,
  layerOpacities,
  selectedTimelineAt,
  comparison,
  cameraRestoreState,
  onCameraStateChange,
  onTimelineSourceChange,
  onLayerRuntimeChange,
}: ObservatoryViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const runtimeRef = useRef<ObservatoryCesiumRuntime | null>(null);
  const cameraUnsubscribeRef = useRef<(() => void) | null>(null);
  const temporalLayersRef = useRef<
    Partial<Record<ObservatoryTemporalLayerId, ObservatoryTemporalLayerResult>>
  >({});
  const layerRevisionRef = useRef(0);
  const timelineSelectionRevisionRef = useRef(0);
  const layerOpacitiesRef = useRef(layerOpacities);
  const selectedTimelineAtRef = useRef(selectedTimelineAt);
  const comparisonRef = useRef(comparison);
  const onCameraStateChangeRef = useRef(onCameraStateChange);
  layerOpacitiesRef.current = layerOpacities;
  selectedTimelineAtRef.current = selectedTimelineAt;
  comparisonRef.current = comparison;
  onCameraStateChangeRef.current = onCameraStateChange;

  const [status, setStatus] = useState<ViewerStatus>("loading");
  const [terrainStatus, setTerrainStatus] = useState<TerrainStatus>("loading");
  const [runtimeRevision, setRuntimeRevision] = useState(0);
  const [message, setMessage] = useState("Não foi possível iniciar a visualização 3D.");
  const [diagnostic, setDiagnostic] = useState<string | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (container === null) return;
    const viewerContainer: HTMLDivElement = container;

    let cancelled = false;
    let runtime: ObservatoryCesiumRuntime | null = null;
    const renderGovernor = new ObservatoryRenderGovernor();

    async function initialize() {
      try {
        (globalThis as CesiumGlobal).CESIUM_BASE_URL = CESIUM_BASE_URL;

        const { createObservatoryCesiumRuntime } = await import("./observatory-cesium-runtime");
        if (cancelled) return;

        runtime = await createObservatoryCesiumRuntime(viewerContainer);
        if (cancelled) {
          runtime.clearDataLayers();
          if (!runtime.widget.isDestroyed()) runtime.widget.destroy();
          return;
        }

        runtimeRef.current = runtime;
        cameraUnsubscribeRef.current = runtime.subscribeCameraChange((camera) => {
          onCameraStateChangeRef.current(camera);
        });
        onCameraStateChangeRef.current(runtime.getCameraState());
        setTerrainStatus(runtime.terrainStatus);

        renderGovernor.attach({ requestRender: () => runtimeRef.current?.widget.scene.requestRender() });
        renderGovernor.request();

        setStatus("ready");
        setDiagnostic(null);
        setRuntimeRevision((value) => value + 1);
      } catch (error) {
        console.error("[observatory] Falha ao iniciar o runtime Cesium.", error);
        if (!cancelled) {
          setStatus("error");
          setDiagnostic(describeRuntimeError(error));
          setMessage(
            "O globo não conseguiu concluir a inicialização. Tente recarregar a página; se o problema continuar, o diagnóstico abaixo identifica a etapa que falhou.",
          );
        }
      }
    }

    void initialize();

    return () => {
      cancelled = true;
      layerRevisionRef.current += 1;
      timelineSelectionRevisionRef.current += 1;
      cameraUnsubscribeRef.current?.();
      cameraUnsubscribeRef.current = null;
      renderGovernor.destroy();
      runtimeRef.current?.clearDataLayers();
      if (runtime && !runtime.widget.isDestroyed()) runtime.widget.destroy();
      runtimeRef.current = null;
      temporalLayersRef.current = {};
    };
  }, []);

  const enabledKey = [...enabledLayers].sort().join("|");
  const opacityKey = enabledLayers
    .map((id) => `${id}:${layerOpacities[id] ?? 1}`)
    .sort()
    .join("|");
  const comparisonKey = comparison
    ? [comparison.layerId, comparison.leftAt ?? "", comparison.rightAt ?? ""].join("|")
    : "";
  const cameraRestoreKey = cameraRestoreState
    ? [
        cameraRestoreState.longitude,
        cameraRestoreState.latitude,
        cameraRestoreState.height,
        cameraRestoreState.heading,
        cameraRestoreState.pitch,
        cameraRestoreState.roll,
      ].join("|")
    : "";

  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime || status !== "ready" || !cameraRestoreState) return;
    runtime.setCameraState(cameraRestoreState);
    onCameraStateChangeRef.current(runtime.getCameraState());
  }, [cameraRestoreKey, runtimeRevision, status]);

  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime || status !== "ready") return;

    const revision = ++layerRevisionRef.current;
    const enabledSet = new Set(enabledLayers);
    const allLayerIds: ObservatoryLayerId[] = [
      "radar",
      "satellite",
      "lightning",
      "alerts",
      "hydrology",
    ];

    for (const id of allLayerIds) {
      if (enabledSet.has(id)) continue;
      runtime.removeLayer(id);
      if (isObservatoryTemporalLayerId(id)) {
        delete temporalLayersRef.current[id];
        onTimelineSourceChange(id, []);
      }
      onLayerRuntimeChange(id, {
        status: "disabled",
        enabled: false,
        observedAt: null,
        detail: null,
      });
    }

    for (const id of enabledLayers) {
      onLayerRuntimeChange(id, {
        status: "loading",
        enabled: true,
        detail: "Carregando fonte observacional…",
      });

      if (isObservatoryTemporalLayerId(id)) {
        void loadObservatoryTemporalLayer(id)
          .then(async (result) => {
            if (layerRevisionRef.current !== revision || !runtimeRef.current) return;

            temporalLayersRef.current[id] = result;
            onTimelineSourceChange(id, temporalTimestamps(result));

            const rendered = await renderTemporalLayer(
              runtime,
              id,
              result,
              selectedTimelineAtRef.current,
              layerOpacitiesRef.current[id] ?? 0.72,
              comparisonRef.current,
            );
            if (layerRevisionRef.current !== revision) return;

            onLayerRuntimeChange(id, {
              status: result.status,
              enabled: true,
              observedAt: rendered?.observedAt ?? null,
              detail:
                rendered?.detail ??
                result.error ??
                `${result.sourceLabel} sem quadro temporal utilizável.`,
            });
          })
          .catch((error) => {
            if (layerRevisionRef.current !== revision) return;
            console.error(`[observatory] Falha ao carregar série temporal ${id}.`, error);
            delete temporalLayersRef.current[id];
            onTimelineSourceChange(id, []);
            runtime.removeLayer(id);
            onLayerRuntimeChange(id, {
              status: "unavailable",
              enabled: true,
              observedAt: null,
              detail: describeRuntimeError(error),
            });
          });
        continue;
      }

      void loadObservatoryLayer(id)
        .then(async (result) => {
          if (layerRevisionRef.current !== revision || !runtimeRef.current) return;

          if (!result.payload || result.status === "unavailable") {
            runtime.removeLayer(id);
          } else if (result.payload.kind === "image") {
            await runtime.setImageLayer(id, {
              imageUrl: result.payload.imageUrl,
              bounds: result.payload.bounds,
              opacity: layerOpacitiesRef.current[id] ?? 0.72,
            });
          } else {
            runtime.setPointLayer(id, result.payload.points);
          }

          if (layerRevisionRef.current !== revision) return;
          onLayerRuntimeChange(id, {
            status: result.status,
            enabled: true,
            observedAt: result.observedAt,
            detail: result.detail,
          });
        })
        .catch((error) => {
          if (layerRevisionRef.current !== revision) return;
          console.error(`[observatory] Falha ao carregar camada ${id}.`, error);
          runtime.removeLayer(id);
          onLayerRuntimeChange(id, {
            status: "unavailable",
            enabled: true,
            observedAt: null,
            detail: describeRuntimeError(error),
          });
        });
    }
  }, [enabledKey, runtimeRevision, status, onLayerRuntimeChange, onTimelineSourceChange]);

  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime || status !== "ready") return;

    const revision = ++timelineSelectionRevisionRef.current;
    for (const id of enabledLayers) {
      if (!isObservatoryTemporalLayerId(id)) continue;
      const result = temporalLayersRef.current[id];
      if (!result) continue;

      void renderTemporalLayer(
        runtime,
        id,
        result,
        selectedTimelineAt,
        layerOpacitiesRef.current[id] ?? 0.72,
        comparison,
      ).then((rendered) => {
        if (timelineSelectionRevisionRef.current !== revision || !rendered) return;
        onLayerRuntimeChange(id, {
          status: result.status,
          enabled: true,
          observedAt: rendered.observedAt,
          detail: rendered.detail,
        });
      });
    }
  }, [selectedTimelineAt, comparisonKey, enabledKey, runtimeRevision, status, onLayerRuntimeChange]);

  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime || status !== "ready" || !comparison) return;
    runtime.setComparisonSplitPosition(comparison.splitPosition);
  }, [comparison?.splitPosition, runtimeRevision, status]);

  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime || status !== "ready") return;
    for (const id of enabledLayers) {
      runtime.setLayerOpacity(id, layerOpacities[id] ?? 0.72);
    }
  }, [opacityKey, runtimeRevision, status]);

  return (
    <div className="observatory-viewer" data-viewer-status={status} data-terrain={terrainStatus}>
      <div ref={containerRef} className="observatory-viewer__canvas" aria-hidden="true" />
      {status === "ready" && comparison ? (
        <>
          <div className="observatory-viewer__comparison-labels" aria-hidden="true">
            <span>A</span>
            <span>B</span>
          </div>
          <div
            className="observatory-viewer__comparison-divider"
            style={{ left: `${comparison.splitPosition * 100}%` }}
            aria-hidden="true"
          />
        </>
      ) : null}
      {status === "ready" ? (
        <nav className="observatory-viewer__navigation" aria-label="Controles do globo">
          <button
            type="button"
            onClick={() => runtimeRef.current?.zoomIn()}
            aria-label="Aproximar globo"
            title="Aproximar"
          >
            <Plus size={18} strokeWidth={2} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => runtimeRef.current?.zoomOut()}
            aria-label="Afastar globo"
            title="Afastar"
          >
            <Minus size={18} strokeWidth={2} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => runtimeRef.current?.resetView()}
            aria-label="Voltar para a visão regional de Pelotas"
            title="Voltar para Pelotas"
          >
            <Crosshair size={18} strokeWidth={2} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => runtimeRef.current?.resetNorth()}
            aria-label="Orientar o mapa para o norte"
            title="Norte para cima"
          >
            <Compass size={18} strokeWidth={2} aria-hidden="true" />
          </button>
        </nav>
      ) : null}
      {status === "error" ? (
        <div className="observatory-viewer__error">
          <strong>Visualização 3D indisponível</strong>
          <span>{message}</span>
          {diagnostic ? <code>CESIUM_RUNTIME · {diagnostic}</code> : null}
        </div>
      ) : null}
    </div>
  );
}
