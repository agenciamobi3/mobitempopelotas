import { Link } from "@tanstack/react-router";
import {
  Clock3,
  CloudRain,
  Droplets,
  ExternalLink,
  Gauge,
  MapPin,
  RadioTower,
  Thermometer,
  Wind,
} from "lucide-react";

import { regionalDefesaCivilDedicatedPageByStationCode } from "@/lib/hydrology/defesa-civil-regional-pages";
import type {
  DefesaCivilHydroData,
  DefesaCivilHydroStation,
  DefesaCivilReadingFreshness,
  DefesaCivilStationClassification,
} from "@/lib/hydrology/defesa-civil-rs.server";

import { DefesaCivilHydroMap } from "./DefesaCivilHydroMap";
import { HydrologyMapDeferred } from "./HydrologyMapDeferred";
import "./DefesaCivilHydroNetwork.css";
import "./DefesaCivilHydroInventory.css";
import "./DefesaCivilHydroDedicatedLinks.css";

function formatNumber(value: number | null, digits = 1) {
  if (value === null || !Number.isFinite(value)) return "—";
  const maximumFractionDigits = Math.max(0, digits);
  const minimumFractionDigits = Number.isInteger(value) ? 0 : Math.min(1, maximumFractionDigits);
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits,
    minimumFractionDigits,
  }).format(value);
}

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

function ageLabel(value: number | null) {
  if (value === null) return "idade não informada";
  if (value < 1) return "menos de 1 min";
  if (value < 60) return `${Math.round(value)} min`;
  const hours = Math.floor(value / 60);
  const minutes = Math.round(value % 60);
  if (hours < 24) return minutes ? `${hours} h ${minutes} min` : `${hours} h`;
  const days = Math.floor(hours / 24);
  return `${days} d`;
}

function freshnessCopy(value: DefesaCivilReadingFreshness) {
  if (value === "recent") return { label: "Leitura recente", className: "is-recent" };
  if (value === "delayed") return { label: "Leitura atrasada", className: "is-delayed" };
  if (value === "old") return { label: "Leitura antiga", className: "is-old" };
  return { label: "Horário não informado", className: "is-unknown" };
}

function classificationCopy(value: DefesaCivilStationClassification) {
  if (value === "HYDROLOGY") return { label: "Hidrológica", className: "is-hydrology" };
  if (value === "METEOROLOGY") return { label: "Meteorológica", className: "is-meteorology" };
  if (value === "BOTH") return { label: "Hidro + meteo", className: "is-both" };
  return { label: "Capacidade não identificada", className: "is-unknown" };
}

function hasValue(values: Array<number | null>) {
  return values.some((value) => value !== null);
}

function capabilityLabels(station: DefesaCivilHydroStation) {
  const labels: string[] = [];
  if (station.capabilities.riverLevel) labels.push("nível");
  if (station.capabilities.rain) labels.push("chuva");
  if (station.capabilities.temperature) labels.push("temperatura");
  if (station.capabilities.humidity) labels.push("umidade");
  if (station.capabilities.pressure) labels.push("pressão");
  if (station.capabilities.wind) labels.push("vento");
  return labels;
}

function StationCard({ station }: { station: DefesaCivilHydroStation }) {
  const freshness = freshnessCopy(station.freshness);
  const classification = classificationCopy(station.classification);
  const capabilities = capabilityLabels(station);
  const dedicatedPage = regionalDefesaCivilDedicatedPageByStationCode(station.code);
  const hasHydrology = station.capabilities.riverLevel;
  const hasWeather =
    station.capabilities.rain ||
    station.capabilities.temperature ||
    station.capabilities.humidity ||
    station.capabilities.pressure ||
    station.capabilities.wind ||
    hasValue([
      station.rain.h1Mm,
      station.rain.h24Mm,
      station.weather.temperatureC,
      station.weather.humidityPct,
      station.weather.windAverageKmh,
    ]);

  return (
    <article className="defesa-civil-hydro__station">
      <header>
        <div>
          <div className="defesa-civil-hydro__station-badges">
            <span className={`defesa-civil-hydro__freshness ${freshness.className}`}>
              <i aria-hidden="true" />
              {freshness.label}
            </span>
            <span className={`defesa-civil-hydro__classification ${classification.className}`}>
              {classification.label}
            </span>
          </div>
          <h3>{station.name}</h3>
          <p>
            {station.code}
            {station.basin ? ` · ${station.basin}` : ""}
          </p>
        </div>
        <span className="defesa-civil-hydro__distance">
          <MapPin aria-hidden="true" />
          {formatNumber(station.distanceFromPelotasKm, 0)} km de Pelotas
        </span>
      </header>

      {capabilities.length > 0 ? (
        <p className="defesa-civil-hydro__capabilities">
          Sensores/campos informados pela rede: {capabilities.join(" · ")}.
        </p>
      ) : null}

      <div className="defesa-civil-hydro__station-time">
        <Clock3 aria-hidden="true" />
        <span>
          <strong>{formatDateTime(station.observedAt)}</strong>
          <small>{ageLabel(station.ageMinutes)} desde a leitura</small>
        </span>
      </div>

      {hasHydrology ? (
        <dl className="defesa-civil-hydro__metrics">
          <div>
            <dt>
              <Gauge aria-hidden="true" /> Nível
            </dt>
            <dd>
              {station.river.levelM === null ? "—" : `${formatNumber(station.river.levelM, 2)} m`}
            </dd>
            <small>{station.river.name ?? "Rio não informado"}</small>
          </div>
          <div>
            <dt>
              <CloudRain aria-hidden="true" /> Chuva 1 h
            </dt>
            <dd>{station.rain.h1Mm === null ? "—" : `${formatNumber(station.rain.h1Mm)} mm`}</dd>
            <small>acumulado da estação</small>
          </div>
          <div>
            <dt>
              <Droplets aria-hidden="true" /> Chuva 24 h
            </dt>
            <dd>{station.rain.h24Mm === null ? "—" : `${formatNumber(station.rain.h24Mm)} mm`}</dd>
            <small>acumulado da estação</small>
          </div>
        </dl>
      ) : null}

      {hasWeather ? (
        <dl className="defesa-civil-hydro__weather-metrics">
          <div>
            <dt>
              <Thermometer aria-hidden="true" /> Temperatura
            </dt>
            <dd>
              {station.weather.temperatureC === null
                ? "—"
                : `${formatNumber(station.weather.temperatureC)} °C`}
            </dd>
          </div>
          <div>
            <dt>
              <Droplets aria-hidden="true" /> Umidade
            </dt>
            <dd>
              {station.weather.humidityPct === null
                ? "—"
                : `${formatNumber(station.weather.humidityPct, 0)}%`}
            </dd>
          </div>
          <div>
            <dt>
              <Wind aria-hidden="true" /> Vento
            </dt>
            <dd>
              {station.weather.windAverageKmh === null
                ? "—"
                : `${formatNumber(station.weather.windAverageKmh)} km/h`}
            </dd>
          </div>
        </dl>
      ) : null}

      {!hasHydrology && !hasWeather ? (
        <p className="defesa-civil-hydro__empty-reading">
          A estação foi identificada pela rede, mas não trouxe uma das variáveis exibidas neste
          recorte.
        </p>
      ) : null}

      {dedicatedPage ? (
        <Link className="defesa-civil-hydro__dedicated-page-link" to={dedicatedPage.path}>
          <span>{dedicatedPage.label}</span>
          <span aria-hidden="true">→</span>
        </Link>
      ) : null}
    </article>
  );
}

export function DefesaCivilHydroNetwork({ data }: { data: DefesaCivilHydroData }) {
  if (data.status === "disabled") return null;

  const available = data.status === "live" && data.stations.length > 0;

  return (
    <section
      className={`defesa-civil-hydro is-${data.status}`}
      id="rede-defesa-civil-rs"
      aria-labelledby="defesa-civil-hydro-title"
    >
      <header className="defesa-civil-hydro__heading">
        <div>
          <span className="defesa-civil-hydro__eyebrow">
            <RadioTower aria-hidden="true" /> Rede oficial · Defesa Civil RS
          </span>
          <h2 id="defesa-civil-hydro-title">Monitoramento hidrometeorológico da Zona Sul</h2>
        </div>
        <p>
          Leituras oficiais da Rede de Monitoramento Hidrometeorológico da Defesa Civil RS. O Tempo
          Pelotas organiza e ajuda a disseminar informações de órgãos públicos e fontes confiáveis,
          preservando estação, horário, unidade e origem sem transformar essas medições em alerta ou
          previsão de cheia.
        </p>
      </header>

      <div className="defesa-civil-hydro__notice" role="status">
        <div>
          <strong>
            {available
              ? "Dados da rede disponíveis"
              : "Integração temporariamente sem leituras regionais"}
          </strong>
          <span>
            {data.error ??
              "As estações são selecionadas por proximidade geográfica de Pelotas e apresentadas sem reclassificação de risco."}
          </span>
        </div>
        <small>Consulta do portal: {formatDateTime(data.source.fetchedAt)}</small>
      </div>

      {available ? (
        <>
          <dl
            className="defesa-civil-hydro__summary"
            aria-label="Resumo da rede hidrometeorológica"
          >
            <div>
              <dt>Estações no recorte</dt>
              <dd>{data.regionalStationCount}</dd>
              <small>até 320 km de Pelotas</small>
            </div>
            <div>
              <dt>Leituras recentes</dt>
              <dd>{data.recentStationCount}</dd>
              <small>até 30 min na consulta</small>
            </div>
            <div>
              <dt>Última observação</dt>
              <dd>{formatDateTime(data.latestObservationAt)}</dd>
              <small>horário da estação</small>
            </div>
            <div>
              <dt>Rede consultada</dt>
              <dd>{data.statewideStationCount || "—"}</dd>
              <small>registros retornados para RS</small>
            </div>
          </dl>

          <div className="defesa-civil-hydro__inventory" aria-label="Inventário regional por capacidade">
            <span>
              <strong>{data.inventory.HYDROLOGY}</strong> hidrológicas
            </span>
            <span>
              <strong>{data.inventory.METEOROLOGY}</strong> meteorológicas
            </span>
            <span>
              <strong>{data.inventory.BOTH}</strong> mistas
            </span>
            {data.inventory.UNKNOWN > 0 ? (
              <span>
                <strong>{data.inventory.UNKNOWN}</strong> sem capacidade identificada
              </span>
            ) : null}
            <small>
              Classificação automática baseada nas capacidades e variáveis que a própria API informa
              para cada estação; não representa risco, prioridade ou estado operacional oficial.
            </small>
          </div>

          <div className="defesa-civil-hydro__map-block">
            <div className="defesa-civil-hydro__map-copy">
              <span>Distribuição das estações</span>
              <strong>Onde a rede está medindo perto de Pelotas</strong>
              <p>
                A posição ajuda a entender de qual ponto vem cada observação. Valores de nível de
                estações diferentes não compartilham necessariamente a mesma referência vertical.
              </p>
              <div
                className="defesa-civil-hydro__legend"
                aria-label="Legenda de recência das leituras"
              >
                <span className="is-recent">
                  <i aria-hidden="true" /> até 30 min
                </span>
                <span className="is-delayed">
                  <i aria-hidden="true" /> 30 min a 3 h
                </span>
                <span className="is-old">
                  <i aria-hidden="true" /> mais de 3 h
                </span>
              </div>
            </div>
            <HydrologyMapDeferred
              label="Mapa da Rede da Defesa Civil RS"
              title="Carregue o mapa somente quando precisar explorar as estações."
              description="As leituras e os cartões das estações têm prioridade e continuam visíveis sem iniciar o MapLibre automaticamente."
              fallbackDescription="As leituras oficiais e a lista de estações continuam disponíveis nesta página."
            >
              <DefesaCivilHydroMap stations={data.stations} />
            </HydrologyMapDeferred>
          </div>

          <div className="defesa-civil-hydro__stations-heading">
            <div>
              <span>Leituras por estação</span>
              <h3>Primeiro a localização; depois, o valor.</h3>
            </div>
            <p>
              A recência é calculada pelo Tempo Pelotas somente para informar a idade da observação.
              Ela não representa estado operacional, nível de atenção ou classificação oficial de
              risco. A classificação hidro/meteo informa apenas quais grupos de dados a estação
              disponibiliza.
            </p>
          </div>
          <div className="defesa-civil-hydro__stations">
            {data.stations.slice(0, 18).map((station) => (
              <StationCard key={station.code} station={station} />
            ))}
          </div>
        </>
      ) : null}

      <footer className="defesa-civil-hydro__source">
        <div>
          <strong>Fonte oficial e créditos</strong>
          <p>
            Rede de Monitoramento Hidrometeorológico da Defesa Civil RS · Casa Militar do Estado do
            Rio Grande do Sul. Dados disponibilizados pela Defesa Civil RS através da MKS. O Tempo
            Pelotas atua como interface independente de consulta e disseminação, preserva a origem
            das leituras e não substitui os canais oficiais de alerta e orientação da Defesa Civil.
          </p>
        </div>
        <div>
          <a href={data.source.mapUrl} target="_blank" rel="noreferrer">
            Abrir mapa oficial <ExternalLink aria-hidden="true" />
          </a>
          <a href={data.source.documentationUrl} target="_blank" rel="noreferrer">
            Documentação da API <ExternalLink aria-hidden="true" />
          </a>
        </div>
      </footer>
    </section>
  );
}
