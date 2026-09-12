import { lazy, Suspense } from "react";
import { Clock3, Globe2, Layers3 } from "lucide-react";

import "./ObservatoryShell.css";

const LazyObservatoryViewer = lazy(() =>
  import("../core/ObservatoryViewer").then((module) => ({
    default: module.ObservatoryViewer,
  })),
);

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
            O globo e o relevo formam a base do Observatório. Radar, satélite, raios, alertas e
            hidrologia entram somente na próxima fase.
          </p>
          <div className="observatory-shell__empty-layer">Nenhuma camada meteorológica ativa</div>
        </aside>

        <section className="observatory-shell__viewer" aria-label="Área 3D do Observatório">
          <Suspense fallback={<ViewerLoadingState />}>
            <LazyObservatoryViewer />
          </Suspense>
        </section>
      </div>

      <footer className="observatory-shell__timeline" aria-label="Área reservada para linha do tempo">
        <Clock3 aria-hidden="true" size={17} />
        <span>Linha do tempo global entra após as primeiras camadas observacionais.</span>
      </footer>
    </main>
  );
}
