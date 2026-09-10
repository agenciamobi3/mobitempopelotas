import { Link } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Clock3,
  Minus,
  Waves,
} from "lucide-react";

import {
  COSTA_DOCE_CITIES,
  costaDoceCoverage,
  costaDoceWeatherPath,
} from "@/lib/hydrology/costa-doce-cities";
import {
  HYDROLOGY_LOCALITIES,
  hydrologyLocalityPath,
  hydrologyLocalityWeatherPath,
  type HydrologyLocality,
} from "@/lib/hydrology/hydrology-localities";
import type {
  LagoonMonitoringNetworkData,
  LagoonMonitoringObservation,
} from "@/lib/hydrology/lagoon-network.server";

import { HydrologyLevelChart } from "./HydrologyLevelChart";
import { LagoonNetworkLevelExplorer } from "./LagoonNetworkLevelExplorer";
import "./LagoonHydrologyLocalityPage.css";

function formatNumber(value: number | null, maximumFractionDigits = 1) {
  if (value === null || !Number.isFinite(value)) return "—";
  const minimumFractionDigits = value % 1 === 0 ? 0 : Math.min(1, maximumFractionDigits);
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits,
    minimumFractionDigits,
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

function latestObservationTime(network: LagoonMonitoringNetworkData) {
  return network.observations.reduce<string | null>((latest, observation) => {
    if (!observation.updatedAt) return latest;
    const candidate = new Date(observation.updatedAt).getTime();
    if (!Number.isFinite(candidate)) return latest;
    if (!latest) return observation.updatedAt;
    const current = new Date(latest).getTime();
    return !Number.isFinite(current) || candidate > current ? observation.updatedAt : latest;
  }, null);
}

function trendState(value: number | null) {
  if (value === null || !Number.isFinite(value)) return { label: "Tendência indisponível", className: "is-unknown", icon: Minus };
  if (Math.abs(value) < 0.1) return { label: "Estável", className: "is-stable", icon: Minus };
  if (value > 0) return { label: `Subindo ${formatNumber(value)} cm/h`, className: "is-rising", icon: ArrowUp };
  return { label: `Baixando ${formatNumber(Math.abs(value))} cm/h`, className: "is-falling", icon: ArrowDown };
}

function statusLabel(observation: LagoonMonitoringObservation | null) {
  if (!observation || observation.status === "unavailable") return { label: "Indisponível", className: "is-unavailable" };
  if (observation.status === "stale") return { label: "Leitura atrasada", className: "is-stale" };
  if (observation.risk === "flooding") return { label: "Acima da cota local", className: "is-flooding" };
  if (observation.risk === "attention") return { label: "Próximo da cota local", className: "is-attention" };
  if (observation.risk === "unclassified") return { label: "Sem cota local publicada", className: "is-unclassified" };
  return { label: "Leitura atualizada", className: "is-live" };
}

function distanceLabel(observation: LagoonMonitoringObservation) {
  if (observation.floodLevelCm === null) return "Não há cota local publicada para comparação automática.";
  if (observation.distanceToFloodCm === null) return "A distância até a cota local não pôde ser calculada nesta atualização.";
  if (observation.distanceToFloodCm > 0) return `${formatNumber(observation.distanceToFloodCm)} cm abaixo da cota local publicada.`;
  if (observation.distanceToFloodCm < 0) return `${formatNumber(Math.abs(observation.distanceToFloodCm))} cm acima da cota local publicada.`;
  return "Na cota local publicada para a estação.";
}

function LocalityMetric({ label, value, suffix = "cm" }: { label: string; value: number | null; suffix?: string }) {
  return <div className="lagoon-locality-metric"><dt>{label}</dt><dd>{value === null ? "—" : `${formatNumber(value)}${suffix ? ` ${suffix}` : ""}`}</dd></div>;
}

export function LagoonHydrologyNetworkIndex({ network }: { network: LagoonMonitoringNetworkData }) {
  const costaDoce = costaDoceCoverage();
  const latestUpdatedAt = latestObservationTime(network);

  return (
    <div className="lagoon-locality-page">
      <section className="lagoon-locality-hero lagoon-network-index-hero">
        <div className="lagoon-network-index-hero__copy">
          <span className="lagoon-locality-eyebrow">Níveis da água · Lagoa dos Patos</span>
          <h1>Nível da Lagoa dos Patos hoje</h1>
          <p>
            A Lagoa dos Patos não possui um único número válido para toda a sua extensão. Compare cada ponto pela sua própria referência e acompanhe a mudança ao longo do tempo.
          </p>
          <div className="lagoon-network-index-hero__meta" aria-label="Cobertura do monitoramento">
            <span><Waves aria-hidden="true" /> {network.total} pontos monitorados</span>
            <span>{COSTA_DOCE_CITIES.length} cidades da Costa Doce</span>
          </div>
        </div>

        <div className="lagoon-network-index-hero__summary" aria-label="Resumo da rede da Lagoa dos Patos">
          <div className="lagoon-network-index-hero__condition">
            <span className="lagoon-network-index-hero__icon"><Waves aria-hidden="true" /></span>
            <div>
              <small>Situação da rede</small>
              <strong>
                {network.status === "unavailable"
                  ? "Consulta em atualização"
                  : `${network.available} de ${network.total} com leitura`}
              </strong>
              <span>{latestUpdatedAt ? `Atualizado ${formatDateTime(latestUpdatedAt)}` : "Horário em atualização"}</span>
            </div>
          </div>

          <div className="lagoon-network-index-hero__facts">
            <article>
              <small>Leituras</small>
              <strong>{network.available}/{network.total}</strong>
              <span>Pontos disponíveis agora</span>
            </article>
            <article>
              <small>Costa Doce</small>
              <strong>{COSTA_DOCE_CITIES.length}</strong>
              <span>Cidades conectadas</span>
            </article>
            <article>
              <small>Referência</small>
              <strong>Local</strong>
              <span>Cada estação mantém sua régua</span>
            </article>
          </div>
        </div>
      </section>

      <LagoonNetworkLevelExplorer network={network} />

      <section className="lagoon-network-localities" aria-labelledby="lagoon-network-localities-title">
        <header>
          <div><span className="lagoon-locality-eyebrow">Pontos monitorados</span><h2 id="lagoon-network-localities-title">Consulte o nível em cada localidade</h2></div>
          <p>{network.status === "unavailable" ? "A rede não respondeu nesta consulta. As páginas locais continuam disponíveis com o estado da fonte." : `${network.available}/${network.total} estações com leitura nesta consulta.`}</p>
        </header>
        <div className="lagoon-network-locality-grid">
          {HYDROLOGY_LOCALITIES.map((locality) => {
            const observation = network.observations.find((item) => item.station.id === locality.stationId) ?? null;
            const trend = trendState(observation?.trendCmPerHour ?? null);
            const TrendIcon = trend.icon;
            return (
              <a className={`lagoon-network-locality-card ${statusLabel(observation).className}`} href={hydrologyLocalityPath(locality)} key={locality.slug}>
                <div className="lagoon-network-locality-card__top"><div><small>{locality.cityLabel}</small><h3>{locality.name}</h3></div><Waves aria-hidden="true" /></div>
                {observation?.currentLevelCm !== null && observation?.currentLevelCm !== undefined ? (
                  <div className="lagoon-network-locality-card__reading"><strong>{formatNumber(observation.currentLevelCm)}</strong><span>cm</span></div>
                ) : <strong className="lagoon-network-locality-card__unavailable">Sem leitura disponível</strong>}
                <div className={`lagoon-locality-trend ${trend.className}`}><TrendIcon aria-hidden="true" /><span>{trend.label}</span></div>
                <small>Atualizado: {formatDateTime(observation?.updatedAt ?? null)}</small>
                <span className="lagoon-network-locality-card__action">Ver nível, tendência e histórico <ArrowRight aria-hidden="true" /></span>
              </a>
            );
          })}
        </div>
      </section>

      <section className="lagoon-costa-doce" aria-labelledby="lagoon-costa-doce-title">
        <header>
          <div>
            <span className="lagoon-locality-eyebrow">Costa Doce do Rio Grande do Sul</span>
            <h2 id="lagoon-costa-doce-title">Água e tempo nas cidades da Costa Doce</h2>
          </div>
          <p>
            {costaDoce.withLagoonLevel.length} cidades possuem medição de nível integrada ao Tempo Pelotas e {costaDoce.withWeather.length} já possuem acompanhamento meteorológico publicado.
          </p>
        </header>
        <div className="lagoon-costa-doce__grid">
          {COSTA_DOCE_CITIES.map((city) => {
            const weatherPath = costaDoceWeatherPath(city);
            return (
              <article className="lagoon-costa-doce__city" key={city.slug}>
                <h3>{city.name}</h3>
                <div>
                  {city.lagoonLevelPath ? <a href={city.lagoonLevelPath}>Ver nível <ArrowRight aria-hidden="true" /></a> : null}
                  {weatherPath ? <a href={weatherPath}>Ver previsão <ArrowRight aria-hidden="true" /></a> : null}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="lagoon-locality-explainer">
        <div><span className="lagoon-locality-eyebrow">Como interpretar</span><h2>Uma estação não substitui as outras</h2></div>
        <p>Cada ponto possui localização e referência próprias. Por isso, o portal não soma, subtrai ou converte automaticamente as leituras entre cidades. A sequência de medições no mesmo ponto é mais útil para acompanhar a mudança local.</p>
      </section>

      <nav className="lagoon-locality-related" aria-label="Outros acompanhamentos das águas">
        <a href="/situacao-hidrologica-pelotas">Situação das águas em Pelotas <ArrowRight aria-hidden="true" /></a>
        <a href="/nivel-da-lagoa-dos-patos-laranjal">Nível no Laranjal <ArrowRight aria-hidden="true" /></a>
        <a href="/nivel-do-guaiba">Nível do Guaíba <ArrowRight aria-hidden="true" /></a>
      </nav>

      <footer className="lagoon-locality-source">Fonte: {network.source.name} · {network.source.organizations}. Referencial informado pela fonte: {network.source.reference}. Consulta do portal: {formatDateTime(network.source.fetchedAt)}.</footer>
    </div>
  );
}

export function LagoonHydrologyLocalityPage({ locality, network, observation }: { locality: HydrologyLocality; network: LagoonMonitoringNetworkData; observation: LagoonMonitoringObservation | null }) {
  const status = statusLabel(observation);
  const trend = trendState(observation?.trendCmPerHour ?? null);
  const TrendIcon = trend.icon;
  const weatherPath = hydrologyLocalityWeatherPath(locality);
  const chartPoints = (observation?.series ?? []).map((point) => ({
    timestamp: point.timestamp,
    level: point.levelCm,
  }));
  const chartReferences = [
    ...(observation?.floodLevelCm !== null && observation?.floodLevelCm !== undefined
      ? [{ label: "Cota local publicada", value: observation.floodLevelCm, tone: "attention" as const }]
      : []),
    ...(observation?.may2024MaximumCm !== null && observation?.may2024MaximumCm !== undefined
      ? [{ label: "Máxima de maio de 2024", value: observation.may2024MaximumCm, tone: "reference" as const }]
      : []),
  ];

  return (
    <div className="lagoon-locality-page">
      <section className={`lagoon-locality-hero ${status.className}`}>
        <span className="lagoon-locality-eyebrow">{locality.cityLabel} · {locality.stationName}</span>
        <h1>{locality.heading}</h1>
        <p>{locality.introduction}</p>
      </section>

      <section className={`lagoon-locality-reading ${status.className}`} aria-labelledby="lagoon-locality-current-title">
        <header><div><span className="lagoon-locality-eyebrow">Leitura atual</span><h2 id="lagoon-locality-current-title">Situação na estação</h2></div><span className="lagoon-locality-status">{status.label}</span></header>
        {observation && observation.currentLevelCm !== null ? (
          <div className="lagoon-locality-reading__layout">
            <div className="lagoon-locality-reading__value"><strong>{formatNumber(observation.currentLevelCm)}</strong><span>cm</span><small><Clock3 aria-hidden="true" /> {formatDateTime(observation.updatedAt)}</small></div>
            <div className={`lagoon-locality-trend lagoon-locality-reading__trend ${trend.className}`}><TrendIcon aria-hidden="true" /><strong>{trend.label}</strong><span>{distanceLabel(observation)}</span></div>
          </div>
        ) : (
          <div className="lagoon-locality-unavailable"><AlertTriangle aria-hidden="true" /><div><strong>Leitura temporariamente indisponível</strong><p>{observation?.error ?? network.error ?? "A rede não forneceu uma leitura válida para esta estação nesta atualização."}</p></div></div>
        )}
      </section>

      <section className="lagoon-locality-metrics" aria-labelledby="lagoon-locality-metrics-title">
        <header><span className="lagoon-locality-eyebrow">Variações e referências</span><h2 id="lagoon-locality-metrics-title">Como o nível mudou recentemente</h2></header>
        <dl>
          <LocalityMetric label="Mudança em 1 hora" value={observation?.change1hCm ?? null} />
          <LocalityMetric label="Mudança em 6 horas" value={observation?.change6hCm ?? null} />
          <LocalityMetric label="Mudança em 24 horas" value={observation?.change24hCm ?? null} />
          <LocalityMetric label="Mínima do período" value={observation?.periodMinimumCm ?? null} />
          <LocalityMetric label="Máxima do período" value={observation?.periodMaximumCm ?? null} />
          <LocalityMetric label="Cota local publicada" value={observation?.floodLevelCm ?? null} />
          <LocalityMetric label="Máxima de maio de 2024" value={observation?.may2024MaximumCm ?? null} />
          <LocalityMetric label="Distância até a cota local" value={observation?.distanceToFloodCm ?? null} />
        </dl>
      </section>

      <section className="lagoon-locality-series" aria-labelledby="lagoon-locality-series-title">
        <header><div><span className="lagoon-locality-eyebrow">Série recente</span><h2 id="lagoon-locality-series-title">Evolução das leituras disponíveis</h2></div><p>A série mostra medições recentes recebidas da mesma estação. Lacunas da fonte não são interpoladas pelo portal.</p></header>
        <HydrologyLevelChart
          points={chartPoints}
          unit="cm"
          status={observation?.status ?? "unavailable"}
          ariaLabel={`Evolução recente do nível em ${locality.name}`}
          eyebrow="Série recente"
          windowLabel={`Evolução em ${locality.stationName}`}
          latestLabel={observation?.status === "stale" ? "Última leitura conhecida" : "Leitura mais recente"}
          emptyMessage="A fonte não disponibilizou pontos suficientes para desenhar a série nesta atualização."
          references={chartReferences}
        />
      </section>

      <section className="lagoon-locality-explainer">
        <div><span className="lagoon-locality-eyebrow">Referência da estação</span><h2>Não transforme uma régua local em comparação automática</h2></div>
        <p>Os valores desta página pertencem à estação {locality.stationName}, em {locality.cityLabel}. Mesmo quando duas cidades acompanham o mesmo sistema lagunar, o Tempo Pelotas não converte uma leitura na outra. Uma cota publicada para este ponto também é uma referência local e não uma declaração de inundação para toda a cidade.</p>
      </section>

      <nav className="lagoon-locality-related" aria-label="Navegação relacionada">
        <a href="/nivel-da-lagoa-dos-patos">Ver todos os pontos da Lagoa <ArrowRight aria-hidden="true" /></a>
        <a href="/situacao-hidrologica-pelotas">Situação integrada das águas <ArrowRight aria-hidden="true" /></a>
        {weatherPath ? <a href={weatherPath}>Previsão do tempo em {locality.name} <ArrowRight aria-hidden="true" /></a> : null}
      </nav>

      <footer className="lagoon-locality-source">Fonte: {network.source.name} · {network.source.organizations}. Referencial informado pela fonte: {network.source.reference}. Última consulta do portal: {formatDateTime(network.source.fetchedAt)}.</footer>
    </div>
  );
}
