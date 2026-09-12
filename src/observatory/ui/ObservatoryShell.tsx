import { Clock3, Globe2, Layers3 } from "lucide-react";

import "./ObservatoryShell.css";

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
            O registro de camadas já está preparado. Radar, satélite, raios, alertas e hidrologia
            entram somente na próxima fase.
          </p>
          <div className="observatory-shell__empty-layer">Nenhuma camada meteorológica ativa</div>
        </aside>

        <section className="observatory-shell__viewer" aria-label="Área 3D do Observatório">
          <div className="observatory-shell__viewer-placeholder">
            <Globe2 aria-hidden="true" size={42} />
            <strong>Fundação 3D em implantação</strong>
            <span>
              O acesso PRO, o shell e os contratos internos já estão ativos. O runtime Cesium será
              conectado após a instalação versionada dos assets e lockfiles.
            </span>
          </div>
        </section>
      </div>

      <footer className="observatory-shell__timeline" aria-label="Área reservada para linha do tempo">
        <Clock3 aria-hidden="true" size={17} />
        <span>Linha do tempo global entra após as primeiras camadas observacionais.</span>
      </footer>
    </main>
  );
}
