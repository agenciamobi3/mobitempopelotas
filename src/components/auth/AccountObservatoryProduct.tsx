import { Link } from "@tanstack/react-router";

import type { ObservatoryAccessSnapshot } from "@/observatory/data/observatory-access.functions";

function accessLabel(access: ObservatoryAccessSnapshot) {
  if (access.status === "authenticated" && access.allowed) return "Disponível na sua conta";
  if (access.status === "authenticated") return "Produto PRO";
  return "Acesso em verificação";
}

export function AccountObservatoryProduct({ access }: { access: ObservatoryAccessSnapshot }) {
  const allowed = access.status === "authenticated" && access.allowed;

  return (
    <section
      className={`account-observatory-product${allowed ? " is-unlocked" : ""}`}
      aria-labelledby="account-observatory-product-title"
    >
      <div className="account-observatory-product__content">
        <div className="account-observatory-product__topline">
          <span className="eyebrow">Novo produto</span>
          <span className={`account-observatory-product__status${allowed ? " is-unlocked" : ""}`}>
            {accessLabel(access)}
          </span>
        </div>

        <h2 id="account-observatory-product-title">Observatório Tempo Pelotas</h2>
        <p>
          Explore o tempo e a hidrologia em uma experiência geoespacial 3D. Combine camadas,
          navegue pela linha do tempo e compartilhe exatamente o cenário que está analisando.
        </p>

        <div className="account-observatory-product__features" aria-label="Recursos do Observatório">
          <span>Globo 3D</span>
          <span>Radar e satélite</span>
          <span>Raios e alertas</span>
          <span>Hidrologia</span>
          <span>Linha do tempo</span>
          <span>Cenários compartilháveis</span>
        </div>
      </div>

      <div className="account-observatory-product__action">
        <small>{allowed ? "Seu acesso está liberado" : "Disponível para contas PRO"}</small>
        <strong>{allowed ? "Entre no Observatório" : "Conheça a experiência PRO"}</strong>
        <p>
          {allowed
            ? "Abra a ferramenta com as capacidades vinculadas à sua conta."
            : "Sua conta Free continua com todos os recursos públicos. O Observatório adiciona a camada avançada de exploração."}
        </p>
        <Link to="/observatorio">
          {allowed ? "Abrir Observatório →" : "Ver Observatório PRO →"}
        </Link>
      </div>
    </section>
  );
}
