import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  CloudSun,
  Database,
  ExternalLink,
  FileCheck2,
  Gauge,
  Info,
  Radar,
  Radio,
  RefreshCw,
  Scale,
  ShieldCheck,
  Waves,
  type LucideIcon,
} from "lucide-react";

import type { GuaibaObservationData } from "@/lib/hydrology/guaiba.server";
import type { LagoonMonitoringNetworkData } from "@/lib/hydrology/lagoon-network.server";
import type { LaranjalLevelData } from "@/lib/hydrology/laranjal-level.server";
import type { RedemetOverview } from "@/lib/redemet/redemet.types";
import type { WeatherSourceHealthStatus } from "@/lib/weather/aggregated-weather.types";
import type { WeatherIntelligenceData } from "@/lib/weather/weather-intelligence.types";

import "./MethodologyPage.css";
import "./MethodologyPageRefinement.css";

type MethodologyPageProps = {
  weather: WeatherIntelligenceData;
  level: LaranjalLevelData;
  redemet: RedemetOverview;
  guaiba: GuaibaObservationData;
  lagoon: LagoonMonitoringNetworkData;
};

type SourceDisplayStatus =
  | WeatherSourceHealthStatus
  | LaranjalLevelData["status"]
  | GuaibaObservationData["status"]
  | LagoonMonitoringNetworkData["status"];
type SourceCategory = "meteorology" | "hydrology";

type SourceCard = {
  id: string;
  category: SourceCategory;
  name: string;
  organization: string;
  role: string;
  description: string;
  detail: string | null;
  status: SourceDisplayStatus;
  fetchedAt: string;
  url: string;
  icon: LucideIcon;
};

const confidenceLabels = {
  high: "Boa confiança",
  medium: "Confiança moderada",
  low: "Baixa confiança",
} as const;

const statusLabels: Record<SourceDisplayStatus, string> = {
  live: "Disponível",
  partial: "Alguns dados",
  stale: "Leitura atrasada",
  unavailable: "Indisponível",
};

const validationRules = [
  {
    icon: FileCheck2,
    title: "Observação e previsão são séries diferentes",
    description:
      "O Agora só usa uma estação meteorológica recente da rede estadual. Modelos de previsão não preenchem uma observação ausente.",
  },
  {
    icon: Clock3,
    title: "Dados antigos não aparecem como atuais",
    description:
      "Para o Agora, a estação precisa ter leitura recente. Leituras atrasadas permanecem identificadas em contextos próprios.",
  },
  {
    icon: Scale,
    title: "Cada medição pertence ao seu ponto",
    description:
      "Temperatura, vento, chuva e nível representam a estação indicada, não uma interpolação automática de toda a cidade.",
  },
  {
    icon: ShieldCheck,
    title: "Valores ausentes não viram zero",
    description:
      "Rajada, chuva, pressão ou qualquer outro valor não publicado permanece indisponível.",
  },
  {
    icon: AlertTriangle,
    title: "Alertas oficiais não são inventados",
    description:
      "Os avisos vêm do INMET. O Tempo Pelotas não cria níveis de risco, áreas atingidas ou instruções de emergência.",
  },
  {
    icon: RefreshCw,
    title: "Falhas das fontes ficam visíveis",
    description:
      "Quando uma fonte não responde, o portal informa a indisponibilidade ou usa apenas uma contingência semanticamente compatível.",
  },
] as const;

function formatDateTime(value: string | null) {
  if (!value) return "Horário não informado";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Horário não informado";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

function latestTimestamp(values: Array<string | null | undefined>) {
  const timestamps = values
    .map((value) => (value ? new Date(value).getTime() : Number.NaN))
    .filter(Number.isFinite);
  return timestamps.length ? new Date(Math.max(...timestamps)).toISOString() : null;
}

function redemetSourceCard(redemet: RedemetOverview): SourceCard {
  const products = [redemet.radar, redemet.satellite, redemet.inmetSatellite, redemet.storms];
  const configured = products.filter((source) => source.configured).length;
  const available = products.filter((source) => source.available).length;
  const fetchedAt = latestTimestamp(products.map((source) => source.updatedAt)) ?? new Date().toISOString();
  const status: SourceDisplayStatus =
    available === products.length ? "live" : available > 0 ? "partial" : "unavailable";

  return {
    id: "redemet",
    category: "meteorology",
    name: "Radar, satélites e trovoadas",
    organization: "REDEMET / DECEA e INMET",
    role: "Monitoramento remoto da região",
    description:
      available > 0
        ? `${available} de ${products.length} produtos estão disponíveis. Radar e satélite ajudam a acompanhar sistemas meteorológicos, mas não substituem a estação usada no Agora.`
        : "Nenhuma imagem ou ocorrência pôde ser exibida nesta atualização. O portal não cria imagens quando a fonte não responde.",
    detail:
      configured === products.length
        ? "Todos os serviços esperados foram reconhecidos."
        : `${configured} de ${products.length} serviços foram reconhecidos no servidor.`,
    status,
    fetchedAt,
    url: "https://redemet.decea.mil.br/",
    icon: Radar,
  };
}

function createSourceCards(props: MethodologyPageProps): SourceCard[] {
  const { weather, level, redemet, guaiba, lagoon } = props;
  const sourceHealth = weather.weather.sources;
  const observation = weather.weather.observation;
  const observationHealth = sourceHealth["defesa-civil-rs"];
  const forecastSource = weather.weather.quality.forecastSource ?? "open-meteo";
  const forecastHealth = sourceHealth[forecastSource];
  const usesMetNorway = forecastSource === "met-norway";
  const forecastProvider =
    weather.weather.quality.forecastProvider ?? (usesMetNorway ? "MET Norway" : "Open-Meteo");
  const stationDetail = observation.station.code
    ? `${observation.station.name} · ${observation.station.code}`
    : observation.station.name;

  return [
    {
      id: "defesa-civil-rs",
      category: "meteorology",
      name: "Rede de Monitoramento Hidrometeorológico",
      organization: "Defesa Civil RS / Casa Militar",
      role: "Fonte do Agora meteorológico",
      description:
        "O portal seleciona a estação meteorológica recente e mais próxima de Pelotas com temperatura utilizável. Temperatura, sensação, umidade, pressão, vento, rajada e chuva são mantidos como medições do ponto indicado.",
      detail:
        observation.status === "live"
          ? `Estação atual: ${stationDetail}${observation.station.distanceFromPelotasKm === null ? "" : ` · ${Math.round(observation.station.distanceFromPelotasKm)} km de Pelotas`}.`
          : observation.error,
      status: observationHealth.status,
      fetchedAt: observationHealth.fetchedAt,
      url: observation.source.url,
      icon: Gauge,
    },
    {
      id: "inmet",
      category: "meteorology",
      name: "Previsão e avisos oficiais",
      organization: "INMET",
      role: "Previsão municipal e alertas",
      description:
        "O INMET complementa o portal com avisos oficiais, previsão municipal e metadados de estação. Esses dados não substituem a observação atual da rede estadual.",
      detail: sourceHealth.inmet.reason,
      status: sourceHealth.inmet.status,
      fetchedAt: sourceHealth.inmet.fetchedAt,
      url: "https://portal.inmet.gov.br/",
      icon: AlertTriangle,
    },
    {
      id: "cppmet",
      category: "meteorology",
      name: "Previsão regional da UFPel",
      organization: "CPPMet / UFPel",
      role: "Contexto meteorológico regional",
      description:
        "Condição prevista, temperaturas e textos publicados pelo Centro de Pesquisas e Previsões Meteorológicas da UFPel.",
      detail: sourceHealth.cppmet.reason,
      status: sourceHealth.cppmet.status,
      fetchedAt: sourceHealth.cppmet.fetchedAt,
      url: "https://wp.ufpel.edu.br/cppmet/",
      icon: Radio,
    },
    redemetSourceCard(redemet),
    {
      id: "forecast",
      category: "meteorology",
      name: "Previsão detalhada por hora e por dia",
      organization: forecastProvider,
      role: usesMetNorway ? "Contingência de previsão" : "Previsão detalhada principal",
      description: usesMetNorway
        ? "O MET Norway é usado quando a previsão principal não entrega dados utilizáveis. Ele continua sendo previsão, nunca uma medição atual."
        : "O Open-Meteo fornece previsão detalhada de temperatura, chuva e vento. Esses valores são estimativas de modelo, não medições atuais.",
      detail: forecastHealth.reason,
      status: forecastHealth.status,
      fetchedAt: forecastHealth.fetchedAt,
      url: usesMetNorway
        ? "https://api.met.no/weatherapi/locationforecast/2.0/documentation"
        : "https://open-meteo.com/",
      icon: CloudSun,
    },
    {
      id: "laranjal",
      category: "hydrology",
      name: "Estação Laranjal",
      organization: level.source.name,
      role: "Medição local da Lagoa dos Patos",
      description:
        "Medição do nível na Praia do Laranjal, com última leitura, evolução recente e aviso quando o dado está atrasado.",
      detail: level.error,
      status: level.status,
      fetchedAt: level.source.fetchedAt,
      url: level.source.url,
      icon: Waves,
    },
    {
      id: "guaiba",
      category: "hydrology",
      name: guaiba.station,
      organization: guaiba.source.name,
      role: "Nível do Guaíba em Porto Alegre",
      description:
        "Leitura usada para acompanhar a situação regional. O nível do Guaíba não determina sozinho o nível observado em Pelotas.",
      detail: guaiba.error ?? `Estação usada nesta atualização: ${guaiba.station}.`,
      status: guaiba.status,
      fetchedAt: guaiba.source.fetchedAt,
      url: guaiba.source.url,
      icon: Gauge,
    },
    {
      id: "lagoon-network",
      category: "hydrology",
      name: "Pontos da Lagoa dos Patos",
      organization: lagoon.source.organizations,
      role: "Medições em diferentes partes da Lagoa",
      description: `${lagoon.available} de ${lagoon.total} estações têm leitura disponível. A rede acompanha diferentes pontos do sistema lagunar.`,
      detail: lagoon.error ?? lagoon.source.reference,
      status: lagoon.status,
      fetchedAt: lagoon.source.fetchedAt,
      url: lagoon.source.url,
      icon: Database,
    },
  ];
}

function StatusIcon({ status }: { status: SourceDisplayStatus }) {
  if (status === "live") return <CheckCircle2 aria-hidden="true" />;
  if (status === "stale" || status === "partial") return <Clock3 aria-hidden="true" />;
  return <Info aria-hidden="true" />;
}

function SourceCardItem({ source }: { source: SourceCard }) {
  const Icon = source.icon;
  return (
    <article className="methodology-source-card" data-category={source.category}>
      <div className="methodology-source-topline">
        <span className="methodology-source-icon"><Icon aria-hidden="true" /></span>
        <span className={`methodology-source-status methodology-source-status-${source.status}`}>
          <StatusIcon status={source.status} /> {statusLabels[source.status]}
        </span>
      </div>
      <p>{source.organization}</p>
      <h3>{source.name}</h3>
      <span className="methodology-source-role">{source.role}</span>
      <div className="methodology-source-description">{source.description}</div>
      {source.detail ? <div className="methodology-source-detail">{source.detail}</div> : null}
      <small>Atualizada em {formatDateTime(source.fetchedAt)}</small>
      <a href={source.url} target="_blank" rel="noopener noreferrer">
        Abrir página original <ExternalLink aria-hidden="true" />
      </a>
    </article>
  );
}

export function MethodologyPage(props: MethodologyPageProps) {
  const cards = createSourceCards(props);
  const meteorologyCards = cards.filter((source) => source.category === "meteorology");
  const hydrologyCards = cards.filter((source) => source.category === "hydrology");
  const operationalSources = cards.filter((source) => source.status === "live").length;
  const degradedSources = cards.filter(
    (source) => source.status === "partial" || source.status === "stale",
  ).length;
  const unavailableSources = cards.filter((source) => source.status === "unavailable").length;
  const confidence = confidenceLabels[props.weather.weather.quality.confidence];
  const updatedAt = latestTimestamp([
    props.weather.intelligence.generatedAt,
    ...cards.map((source) => source.fetchedAt),
  ]);

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Como os dados do Tempo Pelotas funcionam",
    description:
      "Origem dos dados meteorológicos e hidrológicos, regras de verificação, contingências e limites do Tempo Pelotas.",
    inLanguage: "pt-BR",
    dateModified: updatedAt,
    publisher: { "@type": "Organization", name: "Tempo Pelotas" },
  };

  return (
    <div className="methodology-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema).replace(/</g, "\\u003c") }}
      />

      <header className="methodology-hero">
        <div className="methodology-hero-copy">
          <Link className="methodology-back-link" to="/">
            <ArrowLeft aria-hidden="true" /> Tempo agora
          </Link>
          <p className="methodology-kicker">Como os dados funcionam</p>
          <h1>De onde vêm as informações do Tempo Pelotas</h1>
          <p className="methodology-lead">
            O Agora meteorológico usa a Rede de Monitoramento Hidrometeorológico da Defesa Civil RS.
            Previsão, alertas, radar e hidrologia permanecem identificados como camadas diferentes.
          </p>
        </div>
        <aside className="methodology-hero-status" aria-label="Estado das fontes">
          <div><strong>{operationalSources}</strong><span>fontes disponíveis</span></div>
          <div><strong>{degradedSources}</strong><span>com restrição</span></div>
          <div><strong>{unavailableSources}</strong><span>indisponíveis</span></div>
          <p>{confidence}</p>
          <small>Última composição: {formatDateTime(updatedAt)}</small>
        </aside>
      </header>

      <section className="methodology-explainer" aria-labelledby="methodology-principle-title">
        <div>
          <span>Regra central</span>
          <h2 id="methodology-principle-title">Medição é medição. Previsão é previsão.</h2>
        </div>
        <p>
          Quando não há uma estação meteorológica recente da rede estadual, o portal prefere mostrar
          o Agora como indisponível em vez de preencher a lacuna com uma estimativa de modelo.
        </p>
      </section>

      <section className="methodology-sources" aria-labelledby="methodology-meteorology-title">
        <header className="methodology-section-heading">
          <span>Meteorologia</span>
          <h2 id="methodology-meteorology-title">Observação, previsão, alertas e monitoramento</h2>
        </header>
        <div className="methodology-source-grid">
          {meteorologyCards.map((source) => <SourceCardItem key={source.id} source={source} />)}
        </div>
      </section>

      <section className="methodology-sources" aria-labelledby="methodology-hydrology-title">
        <header className="methodology-section-heading">
          <span>Hidrologia</span>
          <h2 id="methodology-hydrology-title">Níveis e pontos do sistema lagunar</h2>
        </header>
        <div className="methodology-source-grid">
          {hydrologyCards.map((source) => <SourceCardItem key={source.id} source={source} />)}
        </div>
      </section>

      <section className="methodology-rules" aria-labelledby="methodology-rules-title">
        <header className="methodology-section-heading">
          <span>Validação</span>
          <h2 id="methodology-rules-title">Regras usadas antes de mostrar um dado</h2>
        </header>
        <div className="methodology-rules-grid">
          {validationRules.map((rule) => {
            const Icon = rule.icon;
            return (
              <article key={rule.title}>
                <Icon aria-hidden="true" />
                <h3>{rule.title}</h3>
                <p>{rule.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="methodology-closing" aria-labelledby="methodology-closing-title">
        <Info aria-hidden="true" />
        <div>
          <h2 id="methodology-closing-title">Fonte visível antes da interpretação</h2>
          <p>
            Em situações de risco, consulte os avisos e orientações dos órgãos responsáveis. O Tempo
            Pelotas organiza e contextualiza dados públicos, mas não substitui a autoridade oficial.
          </p>
          <Link to="/alertas">Ver alertas oficiais</Link>
        </div>
      </section>
    </div>
  );
}
