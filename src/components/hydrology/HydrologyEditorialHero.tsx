import { Link } from "@tanstack/react-router";
import { Activity, ArrowLeft, ArrowRight, Clock3, ExternalLink, Gauge, Waves } from "lucide-react";

import {
  deriveRecentHydrologySeriesMovement,
  type HydrologyRecentMovement,
} from "@/lib/hydrology/level-movement";
import type { LaranjalLevelData } from "@/lib/hydrology/laranjal-level.server";

import "./HydrologyEditorialHero.css";

function formatDateTime(value: string | null) {
  if (!value) return "Horário não informado";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Horário não informado";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

function movementLabel(movement: HydrologyRecentMovement) {
  if (movement.rateCmPerHour === null) return "Movimento recente indisponível";
  const rate = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(
    Math.abs(movement.rateCmPerHour),
  );
  return movement.direction === "stable"
    ? `Praticamente estável · ${rate} cm/h`
    : `${movement.label} ${rate} cm/h`;
}

function changeLabel(value: number | null) {
  if (value === null) return "—";
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${value.toFixed(1).replace(".", ",")} cm`;
}

export function HydrologyEditorialHero({
  level,
  variant,
}: {
  level: LaranjalLevelData;
  variant: "overview" | "detail";
}) {
  const overview = variant === "overview";
  const stale = level.status === "stale";
  const contingency = level.source.role === "contingency";
  const movement = deriveRecentHydrologySeriesMovement(level.series, "m");
  const statusLabel =
    level.status === "live"
      ? contingency
        ? "Leitura alternativa atualizada"
        : "Leitura atualizada"
      : stale
        ? contingency
          ? "Leitura alternativa sem nova leitura"
          : "Sem nova leitura"
        : "Leitura indisponível";

  return (
    <header className={`hydrology-editorial-hero hydrology-editorial-hero-${variant}`}>
      <div className="hydrology-editorial-copy">
        <Link className="hydrology-editorial-back" to={overview ? "/" : "/situacao-hidrologica-pelotas"}>
          <ArrowLeft aria-hidden="true" /> {overview ? "Visão geral" : "Situação das águas"}
        </Link>
        <span className="hydrology-editorial-eyebrow">
          {overview
            ? "Águas e segurança em Pelotas"
            : contingency
              ? "Medição local · CIEX/FURG"
              : "Medição local · Estação Laranjal"}
        </span>
        <h1>
          {overview
            ? "Acompanhe as águas que influenciam Pelotas."
            : "Nível da Lagoa dos Patos hoje no Laranjal."}
        </h1>
        <p>
          {overview
            ? "Comece pela leitura local disponível, observe a mudança recente e compare o contexto com outros pontos da Lagoa e do Guaíba sem misturar referências verticais."
            : contingency
              ? "A Estação Laranjal não está entregando uma leitura atualizada neste momento. O portal usa temporariamente o sensor Pelotas da rede CIEX/FURG, mantendo fonte, horário e referência vertical identificados."
              : "Veja a última leitura disponível da Estação Laranjal, o horário da medição, o movimento recente calculado a partir da série e a variação do nível nas últimas 24 horas."}
        </p>

        <div className="hydrology-editorial-points" aria-label="Informações principais">
          <span>Última leitura com horário e estado de atualização</span>
          <span>Movimento recente e variações de 1 h, 6 h e 24 h</span>
        </div>

        <div className="hydrology-editorial-actions">
          <a href="#hydrology-level-title">
            Ver nível e histórico <ArrowRight aria-hidden="true" />
          </a>
          {overview ? (
            <Link to="/nivel-da-lagoa-dos-patos-laranjal">Abrir página do nível local</Link>
          ) : (
            <a href={level.source.url} target="_blank" rel="noopener noreferrer">
              Abrir fonte da medição <ExternalLink aria-hidden="true" />
            </a>
          )}
        </div>
      </div>

      <div className="hydrology-editorial-media">
        <div className="hydrology-editorial-watermark" aria-hidden="true">
          <Waves />
        </div>
        <article
          className="hydrology-editorial-card"
          aria-label={`Resumo da leitura de ${level.source.station}`}
        >
          <div className="hydrology-editorial-card-line" aria-hidden="true" />
          <header>
            <div>
              <strong>{level.source.station}</strong>
              <small>{level.source.location} · {level.source.name}</small>
            </div>
            <span className={`hydrology-editorial-status is-${level.status}`}>
              <i aria-hidden="true" /> {statusLabel}
            </span>
          </header>

          <div className="hydrology-editorial-value">
            <Waves aria-hidden="true" />
            <strong>{level.currentLevel === null ? "—" : level.currentLevel.toFixed(2).replace(".", ",")}</strong>
            <span>m</span>
          </div>

          <div className="hydrology-editorial-trend">
            <Activity aria-hidden="true" />
            <div>
              <span>{stale ? "Até a última medição" : "Movimento recente"}</span>
              <strong>{movementLabel(movement)}</strong>
            </div>
          </div>

          <dl>
            <div><dt>1 hora</dt><dd>{changeLabel(level.change1hCm)}</dd></div>
            <div><dt>6 horas</dt><dd>{changeLabel(level.change6hCm)}</dd></div>
            <div><dt>24 horas</dt><dd>{changeLabel(level.change24hCm)}</dd></div>
          </dl>

          <footer>
            <Clock3 aria-hidden="true" />
            <span>{stale ? "Última medição: " : "Leitura de "}{formatDateTime(level.updatedAt)}</span>
          </footer>
        </article>

        <div className="hydrology-editorial-caption">
          <Gauge aria-hidden="true" />
          <span>
            {level.source.reference ?? "Referência própria da Estação Laranjal"} · não é cota oficial
            de inundação
          </span>
        </div>
      </div>
    </header>
  );
}
