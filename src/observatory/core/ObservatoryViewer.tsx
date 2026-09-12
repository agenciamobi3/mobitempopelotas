import { useEffect, useRef, useState } from "react";

import { loadObservatoryLayer } from "../data/observatory-live-layers";
import type { ObservatoryLayerId } from "./ObservatoryLayerCatalog";
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

export function ObservatoryViewer({
  enabledLayers,
  layerOpacities,
  onLayerRuntimeChange,
}: ObservatoryViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const runtimeRef = useRef<ObservatoryCesiumRuntime | null>(null);
  const layerRevisionRef = useRef(0);
  const layerOpacitiesRef = useRef(layerOpacities);
  layerOpacitiesRef.current = layerOpacities;

  const [status, setStatus] = useState<ViewerStatus>("loading");
  const [terrainStatus, setTerrainStatus] = useState<TerrainStatus>("loading");
  const [runtimeRevision, setRuntimeRevision] = useState(0);
  const [message, setMessage] = useState("Inicializando globo 3D…");
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
        setTerrainStatus(runtime.terrainStatus);

        renderGovernor.attach({ requestRender: () => runtimeRef.current?.widget.scene.requestRender() });
        renderGovernor.request();

        setStatus("ready");
        setDiagnostic(null);
        setMessage("Globo regional pronto. Ative as camadas observacionais no painel.");
        setRuntimeRevision((value) => value + 1);
      } catch (error) {
        console.error("[observatory] Falha ao iniciar o runtime Cesium.", error);
        if (!cancelled) {
          setStatus("error");
          setDiagnostic(describeRuntimeError(error));
          setMessage(
            "O motor 3D não conseguiu concluir a inicialização. O diagnóstico abaixo ajuda a identificar a etapa que falhou.",
          );
        }
      }
    }

    void initialize();

    return () => {
      cancelled = true;
      layerRevisionRef.current += 1;
      renderGovernor.destroy();
      runtimeRef.current?.clearDataLayers();
      if (runtime && !runtime.widget.isDestroyed()) runtime.widget.destroy();
      runtimeRef.current = null;
    };
  }, []);

  const enabledKey = [...enabledLayers].sort().join("|");
  const opacityKey = enabledLayers
    .map((id) => `${id}:${layerOpacities[id] ?? 1}`)
    .sort()
    .join("|");

  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime || status !== "ready") return;

    const revision = ++layerRevisionRef.current;
    const enabledSet = new Set(enabledLayers);
    const allLayerIds: ObservatoryLayerId[] = ["radar", "satellite", "lightning", "alerts", "hydrology"];

    for (const id of allLayerIds) {
      if (enabledSet.has(id)) continue;
      runtime.removeLayer(id);
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
  }, [enabledKey, runtimeRevision, status, onLayerRuntimeChange]);

  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime || status !== "ready") return;
    for (const id of enabledLayers) {
      runtime.setLayerOpacity(id, layerOpacities[id] ?? 0.72);
    }
  }, [opacityKey, runtimeRevision, status]);

  const terrainLabel =
    terrainStatus === "reearth"
      ? "Relevo 3D · Re:Earth Terrain"
      : terrainStatus === "ellipsoid"
        ? "Relevo indisponível · elipsoide de contingência"
        : "Carregando relevo…";

  return (
    <div className="observatory-viewer" data-viewer-status={status} data-terrain={terrainStatus}>
      <div ref={containerRef} className="observatory-viewer__canvas" aria-hidden="true" />
      <div className="observatory-viewer__status" role="status" aria-live="polite">
        <span className="observatory-viewer__status-dot" aria-hidden="true" />
        <div>
          <strong>{terrainLabel}</strong>
          <span>{message}</span>
        </div>
      </div>
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
