import { Link } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  ExternalLink,
  Minus,
  Waves,
} from "lucide-react";

import {
  findHydrologyLocalityByStationId,
  hydrologyLocalityPath,
} from "@/lib/hydrology/hydrology-localities";
import {
  deriveRecentHydrologySeriesMovement,
  type HydrologyRecentMovement,
} from "@/lib/hydrology/level-movement";
import type { GuaibaObservationData } from "@/lib/hydrology/guaiba.server";
import type {
  LagoonMonitoringNetworkData,
  LagoonMonitoringObservation,
} from "@/lib/hydrology/lagoon-network.server";

import "./RegionalWaterNetwork.css";

type RegionalWaterNetworkProps = {
  guaiba: GuaibaObservationData;
  lagoon: LagoonMonitoringNetworkData;
  variant?: "home" | "full";
};

function formatNumber(value: number | null, maximumFractionDigits = 1) {
  if (value === null) return "—";

  const safeMaximumFractionDigits = Math.max(0, maximumFractionDigits);
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: safeMaximumFractionDigits,
    minimumFractionDigits: value % 1 === 0 ? 0 : Math.min(1, safeMaximumFractionDigits),
  }).format(value);
}

function formatDateTime(value: string | null) {
  if (!value) return "Horário indisponível";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Horário indisponível";

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function movementState(movement: HydrologyRecentMovement) {
  if (movement.rateCmPerHour === null) {
    return { label: "Movimento recente indisponível", className: "is-unknown", icon: Minus };
  }

  if (movement.direction === "stable") {
    return { label: "Praticamente estável", className: "is-stable", icon: Minus };
  }

  if (movement.direction === "rising") {
    return {
      label: `Subindo ${formatNumber(Math.abs(movement.rateCmPerHour))} cm/h`,
      className: "is-rising",
      icon: ArrowUp,
    };
  }

  return {
    label: `Baixando ${formatNumber(Math.abs(movement.rateCmPerHour))} cm/h`,
    className: "is-falling",
    icon: ArrowDown,
  };
}

function stationMovement(observation: LagoonMonitoringObservation) {
  return deriveRecentHydrologySeriesMovement(
    observation.series.map((point) => ({ timestamp: point.timestamp, level: point.levelCm })),
    "cm",
  );
}

function stationStatus(observation: LagoonMonitoringObservation) {
  if (observation.status === "unavailable") {
    return { label: "Indisponível", className: "is-unavailable" };
  }
  if (observation.status === "stale") {
    return { label: "Leitura atrasada", className: "is-stale" };
  }
  if (observation.risk === "unclassified") {
    return { label: "Sem cota local publicada", className: "is-unavailable" };
  }
  if (observation.risk === "flooding") {
    return { label: "Acima da cota local", className: "is-flooding" };
  }
  if (observation.risk === "attention") {
    return { label: "Próximo da cota local", className: "is-attention" };
  }
  return { label: "Abaixo da cota local", className: "is-live" };
}

function distanceLabel(observation: LagoonMonitoringObservation) {
  if (observation.floodLevelCm === null) return "Comparação com cota indisponível";
  if (observation.distanceToFloodCm === null) return "Sem comparação com a cota local";
  if (observation.distanceToFloodCm > 0) {
    return `${formatNumber(observation.distanceToFloodCm)} cm abaixo da cota local`;
  }
  if (observation.distanceToFloodCm < 0) {
    return `${formatNumber(Math.abs(observation.distanceToFloodCm))} cm acima da cota local`;
  }
  return "Na cota de inundação local";
}

function GuaibaPanel({ data, full }: { data: GuaibaObservationData; full: boolean }) {
  const available = data.status !== "unavailable" && data.currentLevel !== null;
  const movement = movementState(deriveRecentHydrologySeriesMovement(data.series, "m"));
  const TrendIcon = movement.icon;

  return (
    <article className={`regional-water-guaiba is-${data.status}`}>
      <header>
        <div>
          <span>Uma das entradas da Lagoa dos Patos</span>
          <h3>Nível do Guaíba</h3>
          <p>
            {data.location} · {data.station}
          </p>
        </div>
        <small>
          <i aria-hidden="true" />
          {data.status === "live"
            ? "Atualizado"
            : data.status === "stale"
              ? "Leitura atrasada"
              : "Indisponível"}
        </small>
      </header>

      {available ? (
        <>
          <div className="regional-water-guaiba-reading">
            <div>
              <strong>{formatNumber(data.currentLevel, 2)}</strong>
              <span>m</span>
            </div>
            <div className={`regional-water-trend ${movement.className}`}>
              <TrendIcon aria-hidden="true" />
              <span>{movement.label}</span>
            </div>
          </div>

          <p className="regional-water-updated">Atualizado em {formatDateTime(data.updatedAt)}</p>

          {data.distanceToFloodReference !== null ? (
            <p className="regional-water-reference">
              {data.distanceToFloodReference >= 0
                ? `${formatNumber(data.distanceToFloodReference, 2)} m abaixo da marca de inundação usada em Porto Alegre.`
                : `${formatNumber(Math.abs(data.distanceToFloodReference), 2)} m acima da marca de inundação usada em Porto Alegre.`}
            </p>
          ) : null}

          <dl>
            <div>
              <dt>Variação em 24 horas</dt>
              <dd>{formatNumber(data.variation24hCm)} cm</dd>
            </div>
            <div>
              <dt>Marca de referência</dt>
              <dd>{formatNumber(data.floodReference, 2)} m</dd>
            </div>
            {full ? (
              <>
                <div>
                  <dt>Mínima do período</dt>
                  <dd>{formatNumber(data.periodMinimum, 2)} m</dd>
                </div>
                <div>
                  <dt>Máxima do período</dt>
                  <dd>{formatNumber(data.periodMaximum, 2)} m</dd>
                </div>
              </>
            ) : null}
          </dl>
        </>
      ) : (
        <div className="regional-water-unavailable" role="status">
          <AlertTriangle aria-hidden="true" />
          <div>
            <strong>Nível do Guaíba temporariamente indisponível</strong>
            <p>{data.error}</p>
          </div>
        </div>
      )}

      <footer>
        <Link to="/nivel-do-guaiba">
          Ver nível e histórico do Guaíba <ArrowRight aria-hidden="true" />
        </Link>
        <a href={data.source.url} target="_blank" rel="noreferrer">
          Abrir fonte original <ExternalLink aria-hidden="true" />
        </a>
      </footer>
    </article>
  );
}

export function RegionalWaterNetwork({
  guaiba,
  lagoon,
  variant = "home",
}: RegionalWaterNetworkProps) {
  const full = variant === "full";
  const hasLagoonObservations = lagoon.observations.length > 0;
  const lagoonHeading =
    lagoon.status === "unavailable"
      ? "Dados temporariamente indisponíveis nesta consulta"
      : `${lagoon.available}/${lagoon.total} estações com leitura nesta consulta`;
  const lagoonFooter = lagoon.latestUpdatedAt
    ? `Última leitura regional: ${formatDateTime(lagoon.latestUpdatedAt)}`
    : `Consulta do portal: ${formatDateTime(lagoon.source.fetchedAt)}`;

  return (
    <section
      className={`regional-water-network regional-water-network-${variant}`}
      aria-labelledby={`regional-water-title-${variant}`}
    >
      <header className="regional-water-heading">
        <div>
          <span>Contexto regional das águas</span>
          <h2 id={`regional-water-title-${variant}`}>Do Guaíba à Lagoa dos Patos</h2>
        </div>
        <p>
          Acompanhe pontos entre o norte e o sul da lagoa. Cada régua possui referência própria e
          não deve ser comparada diretamente com outra estação.
        </p>
      </header>

      <div className="regional-water-layout">
        <GuaibaPanel data={guaiba} full={full} />

        <div
          className={`regional-water-lagoon is-${lagoon.status}${hasLagoonObservations ? "" : " is-empty"}`}
          style={hasLagoonObservations ? undefined : { alignSelf: "start" }}
        >
          <div className="regional-water-lagoon-heading">
            <div>
              <span>FURG & Portos RS</span>
              <h3>Rede da Lagoa dos Patos</h3>
              <p>{lagoonHeading}</p>
            </div>
            <Waves aria-hidden="true" />
          </div>

          {hasLagoonObservations ? (
            <div className="regional-water-stations">
              {lagoon.observations.map((observation) => {
                const available = observation.currentLevelCm !== null;
                const status = stationStatus(observation);
                const movement = movementState(stationMovement(observation));
                const TrendIcon = movement.icon;
                const progress =
                  observation.floodThresholdPercentage === null
                    ? null
                    : Math.max(0, Math.min(observation.floodThresholdPercentage, 100));
                const locality = findHydrologyLocalityByStationId(observation.station.id);
                const localPath = locality ? hydrologyLocalityPath(locality) : null;
                const cardContent = (
                  <>
                    <header>
                      <div>
                        <small>{observation.station.city}</small>
                        <h4>{observation.station.name}</h4>
                      </div>
                      <span>{status.label}</span>
                    </header>

                    {available ? (
                      <>
                        <div className="regional-water-station-reading">
                          <strong>{formatNumber(observation.currentLevelCm)}</strong>
                          <span>cm</span>
                        </div>
                        <div className={`regional-water-trend ${movement.className}`}>
                          <TrendIcon aria-hidden="true" />
                          <span>{movement.label}</span>
                        </div>
                        <p>{distanceLabel(observation)}</p>
                        {progress !== null ? (
                          <div
                            className="regional-water-progress"
                            aria-label={`${formatNumber(observation.floodThresholdPercentage)}% da cota local`}
                          >
                            <span style={{ width: `${progress}%` }} />
                          </div>
                        ) : null}
                        <dl>
                          <div>
                            <dt>Cota local</dt>
                            <dd>
                              {observation.floodLevelCm === null
                                ? "Não publicada"
                                : `${formatNumber(observation.floodLevelCm)} cm`}
                            </dd>
                          </div>
                          <div>
                            <dt>Variação 24h</dt>
                            <dd>{formatNumber(observation.change24hCm)} cm</dd>
                          </div>
                          {full ? (
                            <div>
                              <dt>Máxima mai/2024</dt>
                              <dd>
                                {observation.may2024MaximumCm === null
                                  ? "—"
                                  : `${formatNumber(observation.may2024MaximumCm)} cm`}
                              </dd>
                            </div>
                          ) : null}
                        </dl>
                        {full ? (
                          <p className="regional-water-role">{observation.station.role}</p>
                        ) : null}
                      </>
                    ) : (
                      <div className="regional-water-unavailable" role="status">
                        <Activity aria-hidden="true" />
                        <div>
                          <strong>Leitura indisponível</strong>
                          <p>{observation.error}</p>
                        </div>
                      </div>
                    )}

                    <footer>
                      <small>{formatDateTime(observation.updatedAt)}</small>
                      {localPath ? (
                        <span className="regional-water-station-action">
                          Ver detalhes <ArrowRight aria-hidden="true" />
                        </span>
                      ) : null}
                    </footer>
                  </>
                );
                const cardClassName = `regional-water-station ${status.className}${localPath ? " is-link" : ""}`;

                return localPath ? (
                  <a
                    className={cardClassName}
                    href={localPath}
                    aria-label={`Ver nível, movimento e histórico da água em ${locality!.name}`}
                    key={observation.station.id}
                    style={{ color: "inherit", textDecoration: "none" }}
                  >
                    {cardContent}
                  </a>
                ) : (
                  <article className={cardClassName} key={observation.station.id}>
                    {cardContent}
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="regional-water-unavailable" role="status" style={{ margin: "1rem" }}>
              <Activity aria-hidden="true" />
              <div>
                <strong>Rede da Lagoa sem leituras nesta atualização</strong>
                <p>
                  A integração do Tempo Pelotas não recebeu leituras válidas nesta consulta. Isso não
                  significa que a rede original esteja sem medições; consulte a fonte oficial para o
                  estado mais recente.
                </p>
              </div>
            </div>
          )}

          <footer className="regional-water-lagoon-footer">
            <span>{lagoonFooter}</span>
            <Link to="/nivel-da-lagoa-dos-patos">
              Ver panorama da Lagoa <ArrowRight aria-hidden="true" />
            </Link>
            <a href={lagoon.source.url} target="_blank" rel="noreferrer">
              Abrir rede original <ExternalLink aria-hidden="true" />
            </a>
          </footer>
        </div>
      </div>

      <div className="regional-water-note">
        <AlertTriangle aria-hidden="true" />
        <p>
          O Guaíba ajuda a compreender o cenário regional, mas não determina sozinho o nível em
          Pelotas. Vento, chuva, Canal São Gonçalo e a saída oceânica também influenciam a Lagoa dos
          Patos. Confirme situações de risco com a Defesa Civil e órgãos oficiais.
        </p>
      </div>

      {variant === "home" ? (
        <div className="regional-water-action">
          <Link to="/situacao-hidrologica-pelotas">
            Ver situação completa das águas <ArrowRight aria-hidden="true" />
          </Link>
        </div>
      ) : null}
    </section>
  );
}
