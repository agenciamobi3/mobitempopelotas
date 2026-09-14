import { Link } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  CloudRain,
  ExternalLink,
  Gauge,
  MapPinned,
  Navigation,
  RadioTower,
  ShieldAlert,
  TrendingDown,
  TrendingUp,
  Waves,
  Wind,
} from "lucide-react";

import type { GuaibaObservationData } from "@/lib/hydrology/guaiba.server";
import type { LagoonMonitoringNetworkData } from "@/lib/hydrology/lagoon-network.server";
import {
  deriveRecentHydrologySeriesMovement,
  type HydrologyRecentMovement,
} from "@/lib/hydrology/level-movement";
import type { LaranjalLevelData } from "@/lib/hydrology/laranjal-level.server";
import type { SaceGuaibaData } from "@/lib/hydrology/sace-guaiba.server";
import { ORGANIZATION_JSON_LD_ID, absoluteUrl } from "@/lib/site-config";
import type { WeatherIntelligenceData } from "@/lib/weather/weather-intelligence.types";

import { HydrologyLevelChart } from "./HydrologyLevelChart";
import { RegionalWaterNetwork } from "./RegionalWaterNetwork";
import { SaceGuaibaContext } from "./SaceGuaibaContext";
import "./HydrologyOverviewV2.css";

type HydrologyOverviewProps = {
  weather: WeatherIntelligenceData;
  level: LaranjalLevelData;
  guaiba: GuaibaObservationData;
  lagoon: LagoonMonitoringNetworkData;
  sace: SaceGuaibaData;
};

function formatDateTime(value: string | null | undefined) {
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

function formatNumber(value: number | null | undefined, digits = 1) {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: digits,
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
  }).format(value);
}

function formatSigned(value: number | null | undefined, unit: string, digits = 1) {
  if (value === null || value === undefined) return "—";
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${formatNumber(value, digits)} ${unit}`;
}

function lagoonAvailabilityLabel(lagoon: LagoonMonitoringNetworkData) {
  if (lagoon.status === "unavailable") return "Sem dados";
  return `${lagoon.available}/${lagoon.total}`;
}

function saceAvailabilityLabel(sace: SaceGuaibaData) {
  if (sace.status === "unavailable") return "Sem dados";
  return `${sace.counts.transmitting}/${sace.counts.total}`;
}

function saceAvailabilityDetail(sace: SaceGuaibaData) {
  if (sace.status === "unavailable") return "Integração sem resposta nesta atualização";
  return `${sace.counts.aboveNormal} em categoria diferente de Normal`;
}

function movementState(movement: HydrologyRecentMovement) {
  if (movement.rateCmPerHour === null) {
    return { label: "Movimento recente indisponível", className: "is-unknown", icon: Activity };
  }
  if (movement.direction === "rising") {
    return {
      label: `Subindo ${formatNumber(Math.abs(movement.rateCmPerHour))} cm/h`,
      className: "is-rising",
      icon: TrendingUp,
    };
  }
  if (movement.direction === "falling") {
    return {
      label: `Baixando ${formatNumber(Math.abs(movement.rateCmPerHour))} cm/h`,
      className: "is-falling",
      icon: TrendingDown,
    };
  }
  return { label: "Praticamente estável", className: "is-stable", icon: Activity };
}

function statusCopy(level: LaranjalLevelData) {
  if (level.status === "live") {
    return { label: "Leitura atualizada", icon: CheckCircle2 };
  }
  if (level.status === "stale") {
    return { label: "Última leitura conhecida", icon: Clock3 };
  }
  return { label: "Leitura indisponível", icon: AlertTriangle };
}

function completeHourlyValues(
  values: Array<number | null | undefined>,
  expectedLength: number,
) {
  const valid = values.filter(
    (value): value is number => value !== null && value !== undefined && Number.isFinite(value),
  );
  return values.length === expectedLength && valid.length === expectedLength ? valid : null;
}

function forecastHydrologyContext(weather: WeatherIntelligenceData) {
  const hourly = weather.weather.hourly.slice(0, 24);
  if (hourly.length < 24) {
    return {
      precipitationTotal: null,
      maximumRainChance: null,
      maximumGust: null,
    };
  }

  const precipitation = completeHourlyValues(
    hourly.map((item) => item.precipitationMm),
    24,
  );
  const probabilities = completeHourlyValues(
    hourly.map((item) => item.precipitationProbability),
    24,
  );
  const gusts = completeHourlyValues(
    hourly.map((item) => item.windGust),
    24,
  );

  return {
    precipitationTotal: precipitation
      ? precipitation.reduce((total, value) => total + value, 0)
      : null,
    maximumRainChance: probabilities ? Math.max(...probabilities) : null,
    maximumGust: gusts ? Math.max(...gusts) : null,
  };
}

function observedHydrologyContext(weather: WeatherIntelligenceData) {
  const current = weather.weather.current;
  const currentSource = weather.weather.quality.currentSource;
  const currentIsObserved =
    current !== null && (currentSource === "embrapa" || currentSource === "defesa-civil-rs");
  const defesaCivil = weather.weather.observation;
  const defesaCivilHealth = weather.weather.sources["defesa-civil-rs"];

  return {
    rain1hMm:
      defesaCivil.status === "live" && defesaCivilHealth.usable ? defesaCivil.rain.h1Mm : null,
    windSpeedKmh: currentIsObserved ? current.windSpeed : null,
    windDirection: currentIsObserved ? current.windDirection : null,
  };
}

export function HydrologyOverviewHero({
  level,
  lagoon,
  sace,
}: Pick<HydrologyOverviewProps, "level" | "lagoon" | "sace">) {
  const status = statusCopy(level);
  const StatusIcon = status.icon;
  const movement = movementState(deriveRecentHydrologySeriesMovement(level.series, "m"));
  const TrendIcon = movement.icon;

  return (
    <section className="hydrology-v2-hero" aria-labelledby="hydrology-v2-hero-title">
      <div className="hydrology-v2-hero__content">
        <span className="hydrology-v2-eyebrow">Níveis da água em Pelotas e na região</span>
        <h1 id="hydrology-v2-hero-title">Situação das águas no Laranjal e na Lagoa dos Patos.</h1>
        <p>
          Comece pela medição local no Laranjal e depois compare a situação em outros pontos. Cada
          estação usa sua própria referência, por isso os níveis não devem ser tratados como uma única
          régua.
        </p>
        <div className="hydrology-v2-hero__actions">
          <a href="#leitura-local">
            Ver nível no Laranjal <ArrowRight aria-hidden="true" />
          </a>
          <Link to="/nivel-da-lagoa-dos-patos-laranjal">Abrir página da estação</Link>
        </div>
      </div>

      <aside
        className={`hydrology-v2-hero__reading is-${level.status}`}
        aria-label="Resumo da Estação Laranjal"
        role="status"
      >
        <header>
          <span>
            <StatusIcon aria-hidden="true" />
            {status.label}
          </span>
          <small>{formatDateTime(level.updatedAt)}</small>
        </header>
        <div className="hydrology-v2-hero__level">
          <span>Estação Laranjal</span>
          <strong>{level.currentLevel === null ? "—" : formatNumber(level.currentLevel, 2)}</strong>
          <small>m na referência da estação</small>
        </div>
        <div className={`hydrology-v2-hero__trend ${movement.className}`}>
          <TrendIcon aria-hidden="true" />
          <span>
            <small>Movimento recente</small>
            <strong>{movement.label}</strong>
          </span>
        </div>
        <dl>
          <div>
            <dt>Pontos da Lagoa disponíveis</dt>
            <dd>{lagoonAvailabilityLabel(lagoon)}</dd>
          </div>
          <div>
            <dt>Estações do SACE disponíveis</dt>
            <dd>{saceAvailabilityLabel(sace)}</dd>
          </div>
        </dl>
        <footer>Referência local · não é cota oficial de inundação</footer>
      </aside>
    </section>
  );
}

export function HydrologyOverviewV2({
  weather,
  level,
  guaiba,
  lagoon,
  sace,
}: HydrologyOverviewProps) {
  const movement = movementState(deriveRecentHydrologySeriesMovement(level.series, "m"));
  const TrendIcon = movement.icon;
  const forecast = forecastHydrologyContext(weather);
  const observed = observedHydrologyContext(weather);

  const datasetSchema = level.currentLevel !== null
    ? {
        "@context": "https://schema.org",
        "@type": "Dataset",
        name: "Medições de nível em Pelotas e na Lagoa dos Patos",
        description:
          "Leitura local da Estação Laranjal e informações de outros pontos do Guaíba, Lagoa dos Patos e SACE Guaíba.",
        spatialCoverage: [
          { "@type": "Place", name: "Praia do Laranjal, Pelotas" },
          { "@type": "Place", name: "Lagoa dos Patos, Rio Grande do Sul" },
          { "@type": "Place", name: "Bacia do Guaíba, Rio Grande do Sul" },
        ],
        dateModified: level.source.fetchedAt,
        isBasedOn: [level.source.url, lagoon.source.url, sace.source.url],
        creator: [
          {
            "@type": "Organization",
            name: level.source.name,
            url: level.source.url,
          },
          {
            "@type": "Organization",
            name: lagoon.source.organizations,
            url: lagoon.source.url,
          },
          {
            "@type": "Organization",
            name: sace.source.name,
            url: sace.source.url,
          },
        ],
        publisher: { "@id": ORGANIZATION_JSON_LD_ID },
        license: {
          "@type": "CreativeWork",
          name: "Termos e licenças das fontes do Tempo Pelotas",
          url: absoluteUrl("/status-dos-dados"),
          description:
            "Dados e produtos de terceiros permanecem sujeitos às licenças e aos termos das fontes originais. O Tempo Pelotas organiza e publica esta consolidação sem relicenciar conteúdo de terceiros.",
        },
        isAccessibleForFree: true,
      }
    : null;

  return (
    <div className="hydrology-v2-page">
      {datasetSchema ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(datasetSchema).replace(/</g, "\\u003c"),
          }}
        />
      ) : null}

      <nav className="hydrology-v2-chapters" aria-label="Seções da situação das águas">
        <a href="#leitura-local">
          <span>01</span>
          <strong>Laranjal</strong>
          <small>Nível e movimento recente</small>
        </a>
        <a href="#rede-regional">
          <span>02</span>
          <strong>Lagoa</strong>
          <small>Outros pontos de medição</small>
        </a>
        <a href="#bacia-do-guaiba">
          <span>03</span>
          <strong>Rios e Guaíba</strong>
          <small>Estações do SACE</small>
        </a>
        <a href="#contexto-meteorologico">
          <span>04</span>
          <strong>Chuva e vento</strong>
          <small>Observação e previsão</small>
        </a>
      </nav>

      <section
        className="hydrology-v2-local"
        id="leitura-local"
        aria-labelledby="hydrology-v2-local-title"
      >
        <header className="hydrology-v2-section-heading">
          <div>
            <span className="hydrology-v2-eyebrow">Estação Laranjal</span>
            <h2 id="hydrology-v2-local-title">Como o nível mudou recentemente</h2>
          </div>
          <p>
            A estação mede a distância até a água e aplica a referência própria do equipamento. O valor
            não deve ser comparado diretamente com números absolutos de outras estações.
          </p>
        </header>

        {level.currentLevel !== null ? (
          <>
            <div className="hydrology-v2-local-reading">
              <article>
                <Waves aria-hidden="true" />
                <span>{level.status === "stale" ? "Último nível conhecido" : "Nível mais recente"}</span>
                <strong>{formatNumber(level.currentLevel, 2)} m</strong>
                <small>Na referência da Estação Laranjal</small>
              </article>
              <article className={movement.className}>
                <TrendIcon aria-hidden="true" />
                <span>Movimento recente</span>
                <strong>{movement.label}</strong>
                <small>Calculado com o último trecho contínuo das medições válidas</small>
              </article>
            </div>

            <HydrologyLevelChart
              points={level.series}
              unit="m"
              status={level.status}
              ariaLabel={
                level.status === "stale"
                  ? "Evolução nas 24 horas anteriores à última leitura conhecida"
                  : "Evolução do nível nas últimas 24 horas"
              }
              eyebrow="Série recente"
              windowLabel={level.status === "stale" ? "24 horas anteriores à última leitura" : "Últimas 24 horas"}
              latestLabel={level.status === "stale" ? "Última leitura conhecida" : "Leitura mais recente"}
              emptyMessage="Não há medições suficientes para mostrar a evolução recente."
            />

            <div className="hydrology-v2-local-metrics">
              <article>
                <span>Variação em 1 hora</span>
                <strong>{formatSigned(level.change1hCm, "cm")}</strong>
              </article>
              <article>
                <span>Variação em 6 horas</span>
                <strong>{formatSigned(level.change6hCm, "cm")}</strong>
              </article>
              <article>
                <span>Variação em 24 horas</span>
                <strong>{formatSigned(level.change24hCm, "cm")}</strong>
              </article>
              <article>
                <span>Menor nível do período</span>
                <strong>
                  {level.periodMinimum === null ? "—" : `${formatNumber(level.periodMinimum, 2)} m`}
                </strong>
              </article>
              <article>
                <span>Nível médio do período</span>
                <strong>
                  {level.periodAverage === null ? "—" : `${formatNumber(level.periodAverage, 2)} m`}
                </strong>
              </article>
              <article>
                <span>Maior nível do período</span>
                <strong>
                  {level.periodMaximum === null ? "—" : `${formatNumber(level.periodMaximum, 2)} m`}
                </strong>
              </article>
            </div>
          </>
        ) : (
          <div className="hydrology-v2-unavailable">
            <AlertTriangle aria-hidden="true" />
            <div>
              <strong>Sem leitura local válida</strong>
              <p>A ausência da estação não é substituída por uma estimativa de nível.</p>
            </div>
          </div>
        )}

        <div className="hydrology-v2-reference-warning">
          <ShieldAlert aria-hidden="true" />
          <div>
            <p>
              <strong>Este valor não é uma classificação de risco.</strong> A Estação Laranjal não usa
              as cotas de Atenção, Alerta ou Inundação de outras estações. Confira o horário e o movimento
              recente.
            </p>
            <a href={level.source.url} target="_blank" rel="noopener noreferrer">
              Abrir painel da estação <ExternalLink aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>

      <div id="rede-regional" className="hydrology-v2-regional-anchor">
        <RegionalWaterNetwork guaiba={guaiba} lagoon={lagoon} variant="full" />
      </div>

      <SaceGuaibaContext data={sace} />

      <section
        className="hydrology-v2-weather"
        id="contexto-meteorologico"
        aria-labelledby="hydrology-v2-weather-title"
      >
        <header className="hydrology-v2-section-heading">
          <div>
            <span className="hydrology-v2-eyebrow">Condição observada e previsão · 24 horas</span>
            <h2 id="hydrology-v2-weather-title">Chuva e vento podem influenciar a água na Lagoa</h2>
          </div>
          <p>
            A chuva e o vento observados ficam separados da previsão das próximas 24 horas. Esses dados
            ajudam a entender o cenário, mas não calculam sozinhos quanto o nível do Laranjal vai subir
            ou baixar.
          </p>
        </header>

        <div className="hydrology-v2-weather-observed" aria-label="Condição meteorológica observada">
          <article>
            <CloudRain aria-hidden="true" />
            <span>Chuva observada · 1 h</span>
            <strong>
              {observed.rain1hMm === null ? "—" : `${formatNumber(observed.rain1hMm)} mm`}
            </strong>
            <small>Acumulado medido na última hora disponível</small>
          </article>
          <article>
            <Wind aria-hidden="true" />
            <span>Vento agora</span>
            <strong>
              {observed.windSpeedKmh === null || observed.windSpeedKmh === undefined
                ? "—"
                : `${formatNumber(observed.windSpeedKmh)} km/h`}
            </strong>
            <small>Direção {observed.windDirection ?? "não informada"}</small>
          </article>
        </div>

        <div className="hydrology-v2-weather-grid" aria-label="Previsão meteorológica para 24 horas">
          <article>
            <CloudRain aria-hidden="true" />
            <span>Chuva prevista</span>
            <strong>
              {forecast.precipitationTotal === null
                ? "—"
                : `${formatNumber(forecast.precipitationTotal)} mm`}
            </strong>
            <small>Total somente quando as 24 horas estão completas</small>
          </article>
          <article>
            <Gauge aria-hidden="true" />
            <span>Maior chance de chuva</span>
            <strong>
              {forecast.maximumRainChance === null
                ? "—"
                : `${formatNumber(forecast.maximumRainChance, 0)}%`}
            </strong>
            <small>Maior valor da janela completa de 24 horas</small>
          </article>
          <article>
            <Navigation aria-hidden="true" />
            <span>Maior rajada prevista</span>
            <strong>
              {forecast.maximumGust === null ? "—" : `${formatNumber(forecast.maximumGust)} km/h`}
            </strong>
            <small>Maior valor da janela completa de 24 horas</small>
          </article>
        </div>
      </section>

      <section className="hydrology-v2-network-summary" aria-labelledby="hydrology-v2-network-title">
        <header className="hydrology-v2-section-heading">
          <div>
            <span className="hydrology-v2-eyebrow">Dados disponíveis agora</span>
            <h2 id="hydrology-v2-network-title">Cada estação deve ser lida na sua própria referência</h2>
          </div>
          <p>
            A página não transforma automaticamente níveis e categorias entre estações diferentes. O
            Laranjal, os pontos da Lagoa, o Guaíba e o SACE permanecem identificados separadamente.
          </p>
        </header>
        <div>
          <article>
            <Waves aria-hidden="true" />
            <span>Estação Laranjal</span>
            <strong>
              {level.status === "live"
                ? "Atualizada"
                : level.status === "stale"
                  ? "Atrasada"
                  : "Indisponível"}
            </strong>
          </article>
          <article>
            <MapPinned aria-hidden="true" />
            <span>Pontos da Lagoa</span>
            <strong>{lagoonAvailabilityLabel(lagoon)}</strong>
            <small>
              {lagoon.status === "unavailable"
                ? "Integração sem resposta nesta atualização"
                : "Com leitura disponível agora"}
            </small>
          </article>
          <article>
            <Activity aria-hidden="true" />
            <span>Guaíba</span>
            <strong>
              {guaiba.status === "live"
                ? "Atualizado"
                : guaiba.status === "stale"
                  ? "Atrasado"
                  : "Indisponível"}
            </strong>
            <small>{guaiba.station}</small>
          </article>
          <article>
            <RadioTower aria-hidden="true" />
            <span>Estações do SACE</span>
            <strong>{saceAvailabilityLabel(sace)}</strong>
            <small>{saceAvailabilityDetail(sace)}</small>
          </article>
        </div>
      </section>

      <section className="hydrology-v2-safety" aria-labelledby="hydrology-v2-safety-title">
        <AlertTriangle aria-hidden="true" />
        <div>
          <span className="hydrology-v2-eyebrow">Antes de tomar decisões</span>
          <h2 id="hydrology-v2-safety-title">Uma leitura isolada não define segurança</h2>
          <p>
            Confira horário, movimento recente e alertas oficiais. Em emergência, siga a Defesa Civil e
            as autoridades locais. Uma estação sem transmissão não deve ser interpretada como nível
            normal.
          </p>
        </div>
        <Link to="/alertas">
          Ver alertas oficiais <ArrowRight aria-hidden="true" />
        </Link>
      </section>

      <section
        className="hydrology-v2-actions"
        aria-label="Outras páginas relacionadas à situação das águas"
      >
        <div>
          <span className="hydrology-v2-eyebrow">Veja os detalhes de cada fonte</span>
          <h2>Consulte as medições na referência de cada estação</h2>
        </div>
        <div>
          <a href={level.source.url} target="_blank" rel="noopener noreferrer">
            Estação Laranjal <ExternalLink aria-hidden="true" />
          </a>
          <Link to="/nivel-da-lagoa-dos-patos-laranjal">
            Detalhes do Laranjal <ArrowRight aria-hidden="true" />
          </Link>
          <Link to="/tempo-hoje-pelotas">Tempo em Pelotas</Link>
          <Link to="/status-dos-dados">Dados e fontes</Link>
        </div>
      </section>
    </div>
  );
}