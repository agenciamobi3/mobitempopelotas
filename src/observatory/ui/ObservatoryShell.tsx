import { lazy, Suspense, useCallback, useMemo, useState } from "react";
import {
  CloudLightning,
  Clock3,
  Globe2,
  Layers3,
  Radar,
  Satellite,
  TriangleAlert,
  Waves,
} from "lucide-react";

import {
  OBSERVATORY_LAYER_DEFINITIONS,
  type ObservatoryLayerId,
} from "../core/ObservatoryLayerCatalog";
import { ObservatoryLayerManager } from "../core/ObservatoryLayerManager";
import type { ObservatoryLayerRuntimeState } from "../core/ObservatoryTypes";
import "./ObservatoryShell.css";

const LazyObservatoryViewer = lazy(() =>
  import("../core/ObservatoryViewer").then((module) => ({
    default: module.ObservatoryViewer,
  })),
);

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

function ViewerLoadingState() {
  return (
    <div className="observatory-shell__viewer-placeholder" role="status" aria-live="polite">
      <Globe2 aria-hidden="true" size={42} />
      <strong>Inicializando Observatório 3D</strong>
      <span>Carregando o motor geoespacial somente para esta sessão PRO.</span>
    </div>
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

  const refreshLayers = useCallback(() => {
    setLayers(manager.list());
  }, [manager]);

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

  const enabledLayers = layers
    .filter((layer) => layer.runtime.enabled)
    .map((layer) => layer.definition.id as ObservatoryLayerId);
  const layerOpacities = Object.fromEntries(
    layers.map((layer) => [layer.definition.id, layer.runtime.opacity]),
  ) as Partial<Record<ObservatoryLayerId, number>>;

  return (
    <main className="observatory-shell" id="conteudo-principal">
      <header className="observatory-shell__header">
        <div>
          <span className="observatory-shell__eyebrow">Tempo Pelotas</span>
          <h1>Observatório</h1>
        </div>
        <span className="observatory-shell__pro">PRO</span>
      </header>

      <div className="observatory-shell__workspace">
        <aside className="observatory-shell__panel" aria-label="Camadas do Observatório">
          <div className="observatory-shell__panel-title">
            <Layers3 aria-hidden="true" size={18} />
            <span>Camadas</span>
          </div>
          <p>
            Ligue apenas o que deseja analisar. Radar, satélite, STSC, alertas e hidrologia usam as
            mesmas fontes oficiais já integradas ao Tempo Pelotas.
          </p>

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
              onLayerRuntimeChange={handleLayerRuntimeChange}
            />
          </Suspense>
        </section>
      </div>

      <footer className="observatory-shell__timeline" aria-label="Área reservada para linha do tempo">
        <Clock3 aria-hidden="true" size={17} />
        <span>Linha do tempo global será ligada aos frames observacionais na próxima etapa.</span>
      </footer>
    </main>
  );
}
