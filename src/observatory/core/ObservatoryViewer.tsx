import { useEffect, useRef, useState } from "react";

import { ObservatoryRenderGovernor } from "./ObservatoryRenderGovernor";
import "./ObservatoryViewer.css";

const CESIUM_BASE_URL = "/cesium/";

type ViewerStatus = "loading" | "ready" | "error";
type TerrainStatus = "loading" | "reearth" | "ellipsoid";

type CesiumGlobal = typeof globalThis & {
  CESIUM_BASE_URL?: string;
};

function describeRuntimeError(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim().slice(0, 220);
  }
  return "Falha não identificada durante a inicialização do motor 3D.";
}

export function ObservatoryViewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<ViewerStatus>("loading");
  const [terrainStatus, setTerrainStatus] = useState<TerrainStatus>("loading");
  const [message, setMessage] = useState("Inicializando globo 3D…");
  const [diagnostic, setDiagnostic] = useState<string | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (container === null) return;
    const viewerContainer: HTMLDivElement = container;

    let cancelled = false;
    let widget: import("cesium").CesiumWidget | null = null;
    const renderGovernor = new ObservatoryRenderGovernor();

    async function initialize() {
      try {
        (globalThis as CesiumGlobal).CESIUM_BASE_URL = CESIUM_BASE_URL;

        const { createObservatoryCesiumRuntime } = await import("./observatory-cesium-runtime");
        if (cancelled) return;

        const runtime = await createObservatoryCesiumRuntime(viewerContainer);
        if (cancelled) {
          if (!runtime.widget.isDestroyed()) runtime.widget.destroy();
          return;
        }

        widget = runtime.widget;
        setTerrainStatus(runtime.terrainStatus);

        renderGovernor.attach({ requestRender: () => widget?.scene.requestRender() });
        renderGovernor.request();

        setStatus("ready");
        setDiagnostic(null);
        setMessage("Globo regional pronto. Camadas meteorológicas entram na próxima fase.");
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
      renderGovernor.destroy();
      if (widget && !widget.isDestroyed()) widget.destroy();
      widget = null;
    };
  }, []);

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
