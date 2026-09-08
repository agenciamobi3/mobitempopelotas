import { Link } from "@tanstack/react-router";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  ExternalLink,
  Gauge,
  Minus,
  ThermometerSun,
  Waves,
  Wind,
} from "lucide-react";

import type { LaranjalLevelData } from "@/lib/hydrology/laranjal-level.server";
import type { CurrentWeatherObservation } from "@/lib/weather/current-observation.types";

import "./HomeLocalMonitoring.css";

function formatNumber(value: number | null, maximumFractionDigits = 1) {
  if (value === null) return "—";

  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits,
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
  }).format(value);
}

function formatDateTime(value: string | null) {
  if (!value) return "Horário indisponível";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function observationStatus(observation: CurrentWeatherObservation) {
  if (observation.status === "unavailable") {
    return { label: "Temporariamente indisponível", className: "is-unavailable" };
  }
  return { label: "Dados atualizados", className: "is-live" };
}

function waterStatus(laranjal: LaranjalLevelData) {
  if (laranjal.status === "unavailable") {
    return { label: "Temporariamente indisponível", className: "is-unavailable" };
  }

  if (laranjal.status === "stale") {
    return { label: "Última leitura atrasada", className: "is-stale" };
  }

  return { label: "Dados atualizados", className: "is-live" };
}

function trendReading(value: number | null) {
  if (value === null) {
    return { label: "Sem tendência calculada", className: "is-unknown", icon: Minus };
  }
  if (Math.abs(value) < 0.1) {
    return { label: "Nível praticamente estável", className: "is-stable", icon: Minus };
  }
  if (value > 0) {
    return {
      label: `Subindo ${formatNumber(value)} cm por hora`,
      className: "is-rising",
      icon: ArrowUp,
    };
  }
  return {
    label: `Baixando ${formatNumber(Math.abs(value))} cm por hora`,
    className: "is-falling",
    icon: ArrowDown,
  };
}

export function HomeLocalMonitoring({
  observation,
  laranjal,
}: {
  observation: CurrentWeatherObservation;
  laranjal: LaranjalLevelData;
}) {
  const observationState = observationStatus(observation);
  const waterState = waterStatus(laranjal);
  const trend = trendReading(laranjal.trendCmPerHour);
  const TrendIcon = trend.icon;
  const observationAvailable = observation.status === "live";
  const waterAvailable = laranjal.status !== "unavailable" && laranjal.currentLevel !== null;
  const distance = observation.station.distanceFromPelotasKm;

  return (
    <section className="home-local-monitoring" aria-labelledby="home-local-monitoring-title">
      <header className="home-local-monitoring-heading">
        <div>
          <span>Monitoramento local</span>
          <h2 id="home-local-monitoring-title">O que está sendo medido em Pelotas agora</h2>
        </div>
        <p>
          O “Agora” meteorológico aceita somente estações da Rede de Monitoramento
          Hidrometeorológico da Defesa Civil RS confirmadas em Pelotas, com leitura de até 30 minutos.
          A previsão permanece em uma série separada.
        </p>
      </header>

      <div className="home-local-monitoring-grid">
        <article className="home-observation-panel" id="observacao-rede-rs">
          <div className="home-monitoring-panel-topline">
            <div>
              <ThermometerSun aria-hidden="true" />
              <span>Defesa Civil RS</span>
            </div>
            <small className={observationState.className}>
              <i aria-hidden="true" />
              {observationState.label}
            </small>
          </div>

          <div className="home-monitoring-panel-copy">
            <span>Rede de Monitoramento Hidrometeorológico</span>
            <h3>Condições registradas agora</h3>
            <p>
              Cada valor pertence ao ponto de medição indicado. Entre as estações confirmadas em
              Pelotas, o portal usa uma leitura recente e nunca transforma previsão em observação.
            </p>
          </div>

          {observationAvailable ? (
            <>
              <div className="home-observation-reading">
                <div>
                  <small>
                    {observation.station.name}
                    {observation.station.code ? ` · ${observation.station.code}` : ""}
                    {distance === null ? "" : ` · ${Math.round(distance)} km de Pelotas`}
                  </small>
                  <strong>{formatNumber(observation.current.temperature)}°</strong>
                  <span>
                    {observation.current.feelsLike === null
                      ? "Sensação não informada"
                      : `Sensação de ${formatNumber(observation.current.feelsLike)} °C`}
                  </span>
                </div>
                <Gauge aria-hidden="true" />
              </div>

              <dl className="home-observation-metrics">
                <div>
                  <dt>Umidade</dt>
                  <dd>{formatNumber(observation.current.humidity, 0)}%</dd>
                </div>
                <div>
                  <dt>Vento médio</dt>
                  <dd>{formatNumber(observation.current.windSpeed)} km/h</dd>
                </div>
                <div>
                  <dt>Chuva em 24 h</dt>
                  <dd>{formatNumber(observation.rain.h24Mm)} mm</dd>
                </div>
                <div>
                  <dt>Rajada medida</dt>
                  <dd>{formatNumber(observation.current.windGust)} km/h</dd>
                </div>
              </dl>

              <p className="home-monitoring-observation-time">
                Leitura de {formatDateTime(observation.source.observedAt)}. O acumulado de 24 h é uma
                janela móvel e não representa necessariamente a chuva desde 0h.
              </p>
            </>
          ) : (
            <div className="home-monitoring-unavailable">
              <strong>Nenhuma estação meteorológica confirmada em Pelotas entregou leitura recente nesta consulta.</strong>
              <p>A previsão continua disponível, mas nenhum valor de modelo é exibido como “Agora”.</p>
            </div>
          )}

          <footer className="home-monitoring-panel-footer">
            <Link to="/situacao-hidrologica-pelotas">
              Ver rede de monitoramento
              <ArrowRight aria-hidden="true" />
            </Link>
            <a href={observation.source.url} target="_blank" rel="noreferrer">
              Mapa oficial da rede
              <ExternalLink aria-hidden="true" />
            </a>
          </footer>
        </article>

        <article className="home-water-panel" id="situacao-das-aguas">
          <div className="home-monitoring-panel-topline">
            <div>
              <Waves aria-hidden="true" />
              <span>Lagoa dos Patos</span>
            </div>
            <small className={waterState.className}>
              <i aria-hidden="true" />
              {waterState.label}
            </small>
          </div>

          <div className="home-monitoring-panel-copy">
            <span>Praia do Laranjal</span>
            <h3>Acompanhe o nível da água no ponto local</h3>
            <p>
              A telemetria pública ajuda a observar subida, queda ou estabilidade sem criar uma cota
              de risco própria para o portal.
            </p>
          </div>

          {waterAvailable ? (
            <>
              <div className="home-water-reading">
                <div>
                  <small>{laranjal.source.station}</small>
                  <strong>{formatNumber(laranjal.currentLevel, 2)}</strong>
                  <span>metros</span>
                </div>
                <Waves aria-hidden="true" />
              </div>

              <div className={`home-water-trend ${trend.className}`}>
                <TrendIcon aria-hidden="true" />
                <span>{trend.label}</span>
              </div>

              <dl className="home-water-metrics">
                <div>
                  <dt>Mudança em 1 hora</dt>
                  <dd>{formatNumber(laranjal.change1hCm)} cm</dd>
                </div>
                <div>
                  <dt>Mudança em 6 horas</dt>
                  <dd>{formatNumber(laranjal.change6hCm)} cm</dd>
                </div>
                <div>
                  <dt>Mudança em 24 horas</dt>
                  <dd>{formatNumber(laranjal.change24hCm)} cm</dd>
                </div>
                <div>
                  <dt>Última leitura</dt>
                  <dd>{formatDateTime(laranjal.updatedAt)}</dd>
                </div>
              </dl>
            </>
          ) : (
            <div className="home-monitoring-unavailable">
              <strong>A leitura do Laranjal está temporariamente indisponível.</strong>
              <p>Nenhum valor estimado é exibido quando a telemetria pública não responde.</p>
            </div>
          )}

          <footer className="home-monitoring-panel-footer">
            <Link to="/nivel-da-lagoa-dos-patos-laranjal">
              Ver nível e histórico do Laranjal
              <ArrowRight aria-hidden="true" />
            </Link>
            <a href={laranjal.source.url} target="_blank" rel="noreferrer">
              Painel da fonte
              <ExternalLink aria-hidden="true" />
            </a>
          </footer>
        </article>
      </div>

      <div className="home-local-monitoring-actions">
        <Link to="/situacao-hidrologica-pelotas">
          Ver a situação completa das águas
          <ArrowRight aria-hidden="true" />
        </Link>
        <span>
          <Wind aria-hidden="true" />
          Cada fonte mantém seu próprio ponto de medição e horário de atualização.
        </span>
      </div>
    </section>
  );
}
