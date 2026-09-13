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
import {
  comparisonActiveRasterLayerIds,
  getComparisonLayerState,
  type ObservatoryComparisonRasterLayerId,
  type ObservatoryComparisonState,
} from "./ObservatoryComparison";
import type { ObservatoryLayerId } from "./ObservatoryLayerCatalog";
import type { ObservatoryCameraState } from "./ObservatoryScenario";
import type { ObservatoryLayerRuntimeState } from "./ObservatoryTypes";
import type { ObservatoryCesiumRuntime } from "./observatory-cesium-runtime";
import { ObservatoryRenderGovernor } from "./ObservatoryRenderGovernor";
import "./ObservatoryViewer.css";

const CESIUM_BASE_URL = "/cesium/";
const COMPARISON_SIDES = ["a", "b"] as const;

type ViewerStatus = "loading" | "ready" | "error";
type TerrainStatus = "loading" | "reearth" | "ellipsoid";

type CesiumGlobal = typeof globalThis & {
  CESIUM_BASE_URL?: string;
};

type ObservatoryViewerProps = {
  enabledLayers: readonly ObservatoryLayerId[];
  layerOpacities: Partial<Record<ObservatoryLayerId, number>>;
  selectedTimelineAt: string | null;
  comparisonState: ObservatoryComparisonState | null;
  cameraRestoreState: ObservatoryCameraState | null;
  onCameraStateChange: (state: ObservatoryCameraState) => void;
  onTimelineSourceChange: (id: ObservatoryTemporalLayerId, timestamps: string[]) => void;
  onLayerRuntimeChange: (
    id: ObservatoryLayerId,
    patch: Partial<ObservatoryLayerRuntimeState>,
  ) => void;
};

function describeRuntimeError(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim().slice(0, 220);
  }
  return "Falha não identificada durante a inicialização do motor 3D.";
}

function comparisonLayerId(side: "a" | "b", id: ObservatoryComparisonRasterLayerId) {
  return `compare:${side}:${id}`;
}

function removeComparisonRasterLayers(runtime: ObservatoryCesiumRuntime) {
  for (const id of ["radar", "satellite"] as const) {
    for (const side of COMPARISON_SIDES) runtime.removeLayer(comparisonLayerId(side, id));
  }
}

async function renderTemporalFrame(
  runtime: ObservatoryCesiumRuntime,
  id: ObservatoryTemporalLayerId,
  result: ObservatoryTemporalLayerResult,
  selectedAt: string | null,
  opacity: number,
) {
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

  return frame;
}

async function renderComparisonRaster(
  runtime: ObservatoryCesiumRuntime,
  id: ObservatoryComparisonRasterLayerId,
  result: ObservatoryTemporalLayerResult,
  comparison: ObservatoryComparisonState,
) {
  runtime.removeLayer(id);
  runtime.setSplitPosition(comparison.splitPosition);

  const rendered: Partial<Record<"a" | "b", ReturnType<typeof selectTemporalFrame>>> = {};

  for (const side of COMPARISON_SIDES) {
    const sideState = comparison[side];
    const layerState = getComparisonLayerState(sideState, id);
    const targetId = comparisonLayerId(side, id);

    if (!layerState?.enabled) {
      runtime.removeLayer(targetId);
      rendered[side] = null;
      continue;
    }

    const frame = selectTemporalFrame(result, sideState.selectedAt);
    if (!frame || frame.payload.kind !== "image") {
      runtime.removeLayer(targetId);
      rendered[side] = frame;
      continue;
    }

    await runtime.setImageLayer(targetId, {
      imageUrl: frame.payload.imageUrl,
      bounds: frame.payload.bounds,
      opacity: layerState.opacity,
      split: side === "a" ? "left" : "right",
    });
    rendered[side] = frame;
  }

  return rendered;
}

export function ObservatoryViewer({
  enabledLayers,
  layerOpacities,
  selectedTimelineAt,
  comparisonState,
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
  const comparisonStateRef = useRef(comparisonState);
  const onCameraStateChangeRef = useRef(onCameraStateChange);
  layerOpacitiesRef.current = layerOpacities;
  selectedTimelineAtRef.current = selectedTimelineAt;
  comparisonStateRef.current = comparisonState;
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
  const comparisonRasterIds = comparisonState
    ? comparisonActiveRasterLayerIds(comparisonState)
    : [];
  const effectiveLayerIds = comparisonState ? comparisonRasterIds : enabledLayers;
  const effectiveLayerKey = [...effectiveLayerIds].sort().join("|");
  const comparisonModeKey = comparisonState ? "comparison" : "normal";
  const comparisonContentKey = comparisonState
    ? [
        comparisonState.a.selectedAt ?? "",
        comparisonState.b.selectedAt ?? "",
        ...comparisonRasterIds.flatMap((id) => {
          const a = getComparisonLayerState(comparisonState.a, id);
          const b = getComparisonLayerState(comparisonState.b, id);
          return [
            `${id}:a:${a?.enabled ? 1 : 0}:${a?.opacity ?? 1}`,
            `${id}:b:${b?.enabled ? 1 : 0}:${b?.opacity ?? 1}`,
          ];
        }),
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
    const effectiveSet = new Set<ObservatoryLayerId>(effectiveLayerIds);
    const allLayerIds: ObservatoryLayerId[] = [
      "radar",
      "satellite",
      "lightning",
      "alerts",
      "hydrology",
    ];

    if (comparisonStateRef.current) {
      for (const id of allLayerIds) runtime.removeLayer(id);
    } else {
      removeComparisonRasterLayers(runtime);
    }

    for (const id of allLayerIds) {
      if (effectiveSet.has(id)) continue;
      runtime.removeLayer(id);
      if (id === "radar" || id === "satellite") {
        runtime.removeLayer(comparisonLayerId("a", id));
        runtime.removeLayer(comparisonLayerId("b", id));
      }
      if (isObservatoryTemporalLayerId(id)) {
        delete temporalLayersRef.current[id];
        onTimelineSourceChange(id, []);
      }
      if (!comparisonStateRef.current) {
        onLayerRuntimeChange(id, {
          status: "disabled",
          enabled: false,
          observedAt: null,
          detail: null,
        });
      }
    }

    for (const id of effectiveLayerIds) {
      onLayerRuntimeChange(id, {
        status: "loading",
        enabled: true,
        detail: comparisonStateRef.current
          ? "Preparando comparação A/B…"
          : "Carregando fonte observacional…",
      });

      if (isObservatoryTemporalLayerId(id)) {
        void loadObservatoryTemporalLayer(id)
          .then(async (result) => {
            if (layerRevisionRef.current !== revision || !runtimeRef.current) return;

            temporalLayersRef.current[id] = result;
            onTimelineSourceChange(id, temporalTimestamps(result));

            const comparison = comparisonStateRef.current;
            if (comparison && (id === "radar" || id === "satellite")) {
              const rendered = await renderComparisonRaster(runtime, id, result, comparison);
              if (layerRevisionRef.current !== revision) return;
              const frame = rendered.b ?? rendered.a ?? null;
              onLayerRuntimeChange(id, {
                status: result.status,
                enabled: true,
                observedAt: frame?.observedAt ?? null,
                detail:
                  frame?.detail ??
                  result.error ??
                  `${result.sourceLabel} sem quadro temporal utilizável.`,
              });
              return;
            }

            const frame = await renderTemporalFrame(
              runtime,
              id,
              result,
              selectedTimelineAtRef.current,
              layerOpacitiesRef.current[id] ?? 0.72,
            );
            if (layerRevisionRef.current !== revision) return;

            onLayerRuntimeChange(id, {
              status: result.status,
              enabled: true,
              observedAt: frame?.observedAt ?? null,
              detail:
                frame?.detail ?? result.error ?? `${result.sourceLabel} sem quadro temporal utilizável.`,
            });
          })
          .catch((error) => {
            if (layerRevisionRef.current !== revision) return;
            console.error(`[observatory] Falha ao carregar série temporal ${id}.`, error);
            delete temporalLayersRef.current[id];
            onTimelineSourceChange(id, []);
            runtime.removeLayer(id);
            if (id === "radar" || id === "satellite") {
              runtime.removeLayer(comparisonLayerId("a", id));
              runtime.removeLayer(comparisonLayerId("b", id));
            }
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
  }, [
    effectiveLayerKey,
    comparisonModeKey,
    runtimeRevision,
    status,
    onLayerRuntimeChange,
    onTimelineSourceChange,
  ]);

  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime || status !== "ready") return;

    const comparison = comparisonStateRef.current;
    if (comparison) {
      const revision = ++timelineSelectionRevisionRef.current;
      for (const id of comparisonActiveRasterLayerIds(comparison)) {
        const result = temporalLayersRef.current[id];
        if (!result) continue;
        void renderComparisonRaster(runtime, id, result, comparison).then((rendered) => {
          if (timelineSelectionRevisionRef.current !== revision) return;
          const frame = rendered.b ?? rendered.a ?? null;
          if (!frame) return;
          onLayerRuntimeChange(id, {
            status: result.status,
            enabled: true,
            observedAt: frame.observedAt,
            detail: frame.detail,
          });
        });
      }
      return;
    }

    if (!selectedTimelineAt) return;
    const revision = ++timelineSelectionRevisionRef.current;
    for (const id of enabledLayers) {
      if (!isObservatoryTemporalLayerId(id)) continue;
      const result = temporalLayersRef.current[id];
      if (!result) continue;

      void renderTemporalFrame(
        runtime,
        id,
        result,
        selectedTimelineAt,
        layerOpacitiesRef.current[id] ?? 0.72,
      ).then((frame) => {
        if (timelineSelectionRevisionRef.current !== revision || !frame) return;
        onLayerRuntimeChange(id, {
          status: result.status,
          enabled: true,
          observedAt: frame.observedAt,
          detail: frame.detail,
        });
      });
    }
  }, [
    selectedTimelineAt,
    comparisonContentKey,
    enabledKey,
    runtimeRevision,
    status,
    onLayerRuntimeChange,
  ]);

  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime || status !== "ready" || !comparisonState) return;
    runtime.setSplitPosition(comparisonState.splitPosition);
  }, [comparisonState?.splitPosition, runtimeRevision, status]);

  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime || status !== "ready" || comparisonState) return;
    for (const id of enabledLayers) {
      runtime.setLayerOpacity(id, layerOpacities[id] ?? 0.72);
    }
  }, [opacityKey, comparisonModeKey, runtimeRevision, status]);

  return (
    <div className="observatory-viewer" data-viewer-status={status} data-terrain={terrainStatus}>
      <div ref={containerRef} className="observatory-viewer__canvas" aria-hidden="true" />
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
