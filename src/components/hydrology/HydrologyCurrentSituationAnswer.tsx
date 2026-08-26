import { Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowRight, CheckCircle2, Clock3, RadioTower, Waves } from "lucide-react";

import type { LagoonMonitoringNetworkData } from "@/lib/hydrology/lagoon-network.server";
import type { LaranjalLevelData } from "@/lib/hydrology/laranjal-level.server";
import type { SaceGuaibaData } from "@/lib/hydrology/sace-guaiba.server";

import "./HydrologyCurrentSituationAnswer.css";

function formatDateTime(value: string | null) {
  if (!value) return "horário não informado";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "horário não informado";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

function localReadingCopy(level: LaranjalLevelData) {
  if (level.status === "live") {
    return {
      icon: CheckCircle2,
      label: "Laranjal com leitura atualizada",
      detail: `Última medição válida em ${formatDateTime(level.updatedAt)}.`,
      className: "is-live",
    };
  }

  if (level.status === "stale") {
    return {
      icon: Clock3,
      label: "Laranjal com leitura atrasada",
      detail: `Última leitura conhecida em ${formatDateTime(level.updatedAt)}; ela não é tratada como nível atual.`,
      className: "is-stale",
    };
  }

  return {
    icon: AlertTriangle,
    label: "Laranjal sem leitura atual",
    detail: "A ausência de transmissão não é interpretada como nível normal.",
    className: "is-unavailable",
  };
}

export function HydrologyCurrentSituationAnswer({
  level,
  lagoon,
  sace,
}: {
  level: LaranjalLevelData;
  lagoon: LagoonMonitoringNetworkData;
  sace: SaceGuaibaData;
}) {
  const local = localReadingCopy(level);
  const LocalIcon = local.icon;
  const saceAvailable = sace.status !== "unavailable";
  const lagoonAvailable = lagoon.status !== "unavailable";

  return (
    <section className="hydrology-current-answer" aria-labelledby="hydrology-current-answer-title">
      <div className="hydrology-current-answer__copy">
        <span className="hydrology-current-answer__eyebrow">Resposta rápida · situação de hoje</span>
        <h2 id="hydrology-current-answer-title">Há enchente em Pelotas hoje?</h2>
        <p>
          O Tempo Pelotas não confirma enchente ou risco para a cidade a partir de uma única régua.
          Esta página reúne as leituras mais recentes disponíveis e as classificações publicadas pelas
          próprias redes para ajudar a acompanhar a situação. Para decisões de segurança, consulte os
          comunicados da Defesa Civil e das autoridades locais.
        </p>
        <div className="hydrology-current-answer__actions">
          <Link to="/alertas">
            Ver alertas oficiais <ArrowRight aria-hidden="true" />
          </Link>
          <Link to="/nivel-da-lagoa-dos-patos-laranjal">Ver nível do Laranjal</Link>
        </div>
      </div>

      <div className="hydrology-current-answer__signals" aria-label="Sinais disponíveis nesta atualização">
        <article className={local.className}>
          <LocalIcon aria-hidden="true" />
          <div>
            <strong>{local.label}</strong>
            <span>{local.detail}</span>
          </div>
        </article>

        <article className={lagoonAvailable ? "is-live" : "is-unavailable"}>
          <Waves aria-hidden="true" />
          <div>
            <strong>
              {lagoonAvailable
                ? `${lagoon.available} de ${lagoon.total} pontos da Lagoa com leitura`
                : "Rede da Lagoa indisponível"}
            </strong>
            <span>
              Cada ponto usa sua própria referência; os valores não são somados nem convertidos em risco para Pelotas.
            </span>
          </div>
        </article>

        <article className={saceAvailable ? "is-live" : "is-unavailable"}>
          <RadioTower aria-hidden="true" />
          <div>
            <strong>
              {saceAvailable
                ? `${sace.counts.transmitting} de ${sace.counts.total} estações do SACE transmitindo`
                : "SACE Guaíba indisponível"}
            </strong>
            <span>
              {saceAvailable
                ? `${sace.counts.aboveNormal} estação${sace.counts.aboveNormal === 1 ? "" : "ões"} acima de Normal segundo a classificação de cada estação; isso não é convertido em risco automático para Pelotas.`
                : "Sem dados válidos do SACE, a página não presume normalidade ou segurança."}
            </span>
          </div>
        </article>
      </div>
    </section>
  );
}
