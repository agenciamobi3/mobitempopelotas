import { Clock3, CloudRain, ExternalLink, Gauge, RadioTower, Waves } from "lucide-react";

import type {
  DefesaCivilHydroData,
  DefesaCivilHydroStation,
  DefesaCivilReadingFreshness,
} from "@/lib/hydrology/defesa-civil-rs.server";

import { HydrologyLevelChart } from "./HydrologyLevelChart";
import "./DefesaCivilStationHydrologyPage.css";

export type DefesaCivilStationPageConfig = {
  stationCode: string;
  eyebrow: string;
  heading: string;
  introduction: string;
  waterBodyLabel: string;
  locationLabel: string;
  weatherPath: string;
  weatherLabel: string;
  siblingPath?: string;
  siblingLabel?: string;
};

function formatNumber(value: number | null, digits = 2) {
  if (value === null || !Number.isFinite(value)) return null;
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

function formatDateTime(value: string | null) {
  if (!value) return "Horário não informado";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Horário não informado";
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function freshnessCopy(value: DefesaCivilReadingFreshness) {
  if (value === "recent") return { label: "Leitura recente", className: "is-recent" };
  if (value === "delayed") return { label: "Leitura atrasada", className: "is-delayed" };
  if (value === "old") return { label: "Leitura antiga", className: "is-old" };
  return { label: "Horário não informado", className: "is-unknown" };
}

function chartStatus(value: DefesaCivilReadingFreshness) {
  if (value === "recent") return "live" as const;
  if (value === "unknown") return "unavailable" as const;
  return "stale" as const;
}

function StationMetrics({ station, waterBodyLabel }: { station: DefesaCivilHydroStation; waterBodyLabel: string }) {
  const freshness = freshnessCopy(station.freshness);
  const level = formatNumber(station.river.levelM);
  const rain1h = formatNumber(station.rain.h1Mm, 1);
  const rain24h = formatNumber(station.rain.h24Mm, 1);

  return (
    <>
      <div className="defesa-civil-station-page__status-row">
        <span className={`defesa-civil-station-page__freshness ${freshness.className}`}>
          <i aria-hidden="true" /> {freshness.label}
        </span>
        <span>Estação {station.code}</span>
      </div>

      <div className="defesa-civil-station-page__primary-reading">
        <div>
          <Gauge aria-hidden="true" />
          <span>
            <small>Nível da estação</small>
            <strong>{level === null ? "Não informado" : `${level} m`}</strong>
            <em>{station.river.name ?? waterBodyLabel}</em>
          </span>
        </div>
        <div>
          <Clock3 aria-hidden="true" />
          <span>
            <small>Horário</small>
            <strong>{formatDateTime(station.observedAt)}</strong>
            <em>{station.basin ?? "Bacia não informada"}</em>
          </span>
        </div>
      </div>

      {station.river.trend ? (
        <p className="defesa-civil-station-page__trend">
          <Waves aria-hidden="true" />
          <span>
            <strong>Tendência da fonte:</strong> {station.river.trend}
          </span>
        </p>
      ) : null}

      {station.capabilities.rain || rain1h !== null || rain24h !== null ? (
        <dl className="defesa-civil-station-page__rain">
          <div>
            <dt><CloudRain aria-hidden="true" /> Chuva em 1 hora</dt>
            <dd>{rain1h === null ? "—" : `${rain1h} mm`}</dd>
          </div>
          <div>
            <dt><CloudRain aria-hidden="true" /> Chuva em 24 horas</dt>
            <dd>{rain24h === null ? "—" : `${rain24h} mm`}</dd>
          </div>
        </dl>
      ) : null}
    </>
  );
}

export function DefesaCivilStationHydrologyPage({
  data,
  config,
}: {
  data: DefesaCivilHydroData;
  config: DefesaCivilStationPageConfig;
}) {
  const station = data.stations.find((item) => item.code === config.stationCode) ?? null;
  const available = data.status !== "disabled" && data.status !== "unavailable" && station !== null;

  return (
    <article className="defesa-civil-station-page">
      <section className="defesa-civil-station-page__hero" aria-labelledby="defesa-civil-station-page-title">
        <div className="defesa-civil-station-page__hero-copy">
          <span className="defesa-civil-station-page__eyebrow">
            <RadioTower aria-hidden="true" /> {config.eyebrow}
          </span>
          <h1 id="defesa-civil-station-page-title">{config.heading}</h1>
          <p>{config.introduction}</p>
        </div>
        <aside>
          <small>Ponto monitorado</small>
          <strong>{station?.name ?? config.locationLabel}</strong>
          <span>{station?.basin ?? config.waterBodyLabel}</span>
        </aside>
      </section>

      <section className="defesa-civil-station-page__live" aria-labelledby="defesa-civil-live-title">
        <header>
          <div>
            <span>Última leitura</span>
            <h2 id="defesa-civil-live-title">Medição recebida da estação</h2>
          </div>
          <small>Consulta: {formatDateTime(data.source.fetchedAt)}</small>
        </header>

        {available && station ? (
          <>
            <StationMetrics station={station} waterBodyLabel={config.waterBodyLabel} />
            <HydrologyLevelChart
              points={
                station.river.levelM !== null
                  ? [{ timestamp: station.observedAt ?? data.source.fetchedAt, level: station.river.levelM }]
                  : []
              }
              unit="m"
              status={chartStatus(station.freshness)}
              ariaLabel={`Leitura de nível da estação ${station.code} em ${config.locationLabel}`}
              eyebrow="Leitura da régua"
              windowLabel="Histórico disponível nesta consulta"
              latestLabel="Leitura recebida"
              singlePointMessage="A Rede de Monitoramento Hidrometeorológico da Defesa Civil RS forneceu apenas a leitura mais recente desta estação nesta consulta. O Tempo Pelotas não cria pontos intermediários nem desenha uma tendência sem série histórica."
              emptyMessage="A fonte não forneceu uma leitura de nível válida para esta estação nesta consulta."
            />
          </>
        ) : (
          <div className="defesa-civil-station-page__unavailable" role="status">
            <strong>Leitura não disponível agora</strong>
            <p>
              Não recebemos uma medição válida desta estação nesta consulta. O portal não troca a ausência
              por zero nem usa uma estação vizinha como se fosse o mesmo ponto.
            </p>
          </div>
        )}
      </section>

      <section className="defesa-civil-station-page__interpretation" aria-labelledby="defesa-civil-reference-title">
        <div>
          <span>Como ler este número</span>
          <h2 id="defesa-civil-reference-title">Compare esta régua apenas com a própria série</h2>
        </div>
        <p>
          O nível é exibido em metros porque essa é a unidade informada pela fonte. Isso não transforma o
          valor, sozinho, em cota de atenção ou inundação. Réguas de outros pontos podem usar referências
          diferentes, por isso o portal não faz conversões automáticas entre elas.
        </p>
      </section>

      <nav className="defesa-civil-station-page__links" aria-label="Informações relacionadas">
        <a href={config.weatherPath}>Previsão do tempo em {config.weatherLabel}</a>
        <a href="/situacao-hidrologica-pelotas">Situação das águas na região</a>
        <a href="/alertas">Alertas oficiais</a>
        {config.siblingPath && config.siblingLabel ? <a href={config.siblingPath}>{config.siblingLabel}</a> : null}
      </nav>

      <footer className="defesa-civil-station-page__source">
        <div>
          <strong>Fonte</strong>
          <p>
            {data.source.name}. O Tempo Pelotas mantém a identificação da estação, o horário e a unidade
            recebidos da fonte. Em situação de risco, consulte também os canais oficiais da Defesa Civil.
          </p>
        </div>
        <div>
          <a href={data.source.mapUrl} target="_blank" rel="noopener noreferrer">
            Mapa oficial <ExternalLink aria-hidden="true" />
          </a>
          <a href={data.source.documentationUrl} target="_blank" rel="noopener noreferrer">
            Sobre os dados <ExternalLink aria-hidden="true" />
          </a>
        </div>
      </footer>
    </article>
  );
}
