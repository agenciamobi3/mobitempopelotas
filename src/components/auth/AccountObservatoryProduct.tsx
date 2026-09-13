import { Link } from "@tanstack/react-router";
import { Globe2 } from "lucide-react";

import type { ObservatoryAccessSnapshot } from "@/observatory/data/observatory-access.functions";

function accessLabel(access: ObservatoryAccessSnapshot) {
  if (access.status === "authenticated" && access.allowed) return "Incluído na conta";
  if (access.status === "authenticated") return "Acesso pausado";
  return "Acesso em verificação";
}

export function AccountObservatoryProduct({ access }: { access: ObservatoryAccessSnapshot }) {
  const allowed = access.status === "authenticated" && access.allowed;

  return (
    <article
      className={`account-tool-card account-tool-card--observatory${allowed ? " is-unlocked" : ""}`}
      aria-labelledby="account-observatory-product-title"
    >
      <div className="account-tool-card__topline">
        <span className="account-tool-card__icon" aria-hidden="true">
          <Globe2 size={20} />
        </span>
        <span className={`account-tool-card__status${allowed ? " is-unlocked" : ""}`}>
          {accessLabel(access)}
        </span>
      </div>

      <div className="account-tool-card__body">
        <span className="eyebrow">Novo recurso</span>
        <h3 id="account-observatory-product-title">Observatório Tempo Pelotas</h3>
        <p>
          Explore tempo e hidrologia em um globo 3D, combine camadas, percorra a linha do tempo e
          compartilhe o cenário exato da sua análise.
        </p>

        <div className="account-tool-card__features" aria-label="Recursos do Observatório">
          <span>Globo 3D</span>
          <span>Radar e satélite</span>
          <span>Raios e alertas</span>
          <span>Hidrologia</span>
          <span>Linha do tempo</span>
        </div>
      </div>

      <div className="account-tool-card__footer">
        <small>
          {allowed
            ? "Disponível para sua conta cadastrada."
            : "O acesso da conta precisa estar ativo para abrir a ferramenta."}
        </small>
        <Link to="/observatorio">
          {allowed ? "Abrir Observatório →" : "Verificar acesso →"}
        </Link>
      </div>
    </article>
  );
}
