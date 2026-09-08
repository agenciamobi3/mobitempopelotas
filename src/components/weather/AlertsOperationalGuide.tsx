import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  MapPin,
  MessageSquareText,
  Radio,
  ShieldAlert,
  Smartphone,
} from "lucide-react";

import {
  DEFESA_CIVIL_GUIDANCE_SOURCE,
  SAFETY_BANNERS,
  type SafetyBanner,
} from "@/production/lib/safety-banners";
import type { WeatherIntelligenceData } from "@/lib/weather/weather-intelligence.types";

import "./AlertsOperationalGuide.css";

const severityGuide = [
  {
    id: "potential",
    label: "Amarelo",
    title: "Perigo potencial",
    description:
      "Leia o aviso, confira a validade e a área citada e reavalie atividades sensíveis ao fenômeno informado.",
  },
  {
    id: "danger",
    label: "Laranja",
    title: "Perigo",
    description:
      "Aumente a atenção e siga as recomendações do aviso oficial, especialmente durante o período de vigência.",
  },
  {
    id: "great-danger",
    label: "Vermelho",
    title: "Grande perigo",
    description:
      "Priorize proteção e siga imediatamente as orientações das autoridades e do aviso oficial publicado.",
  },
] as const;

function channelIcon(id: SafetyBanner["id"]) {
  if (id === "sms") return Smartphone;
  if (id === "whatsapp") return MessageSquareText;
  if (id === "cell-broadcast") return Radio;
  return ShieldAlert;
}

function channelAction(banner: SafetyBanner) {
  if (banner.id === "sms") {
    return { href: "sms:40199", label: "Cadastrar CEP por SMS", external: false };
  }
  if (banner.actionUrl && banner.actionLabel) {
    return { href: banner.actionUrl, label: banner.actionLabel, external: Boolean(banner.external) };
  }
  return null;
}

export function AlertsOperationalGuide({ data }: { data: WeatherIntelligenceData }) {
  const alerts = data.weather.alerts;
  const inmet = data.weather.sources.inmet;
  const directPelotas = alerts.filter((alert) => alert.relevance === "pelotas").length;
  const regional = alerts.filter((alert) => alert.relevance === "regional").length;
  const statewide = alerts.filter((alert) => alert.relevance === "state").length;
  const broaderScope = regional + statewide;

  return (
    <div className="alerts-operational-guide">
      <section
        className="alerts-risk-guide"
        id="guia-pratico-alertas"
        aria-labelledby="alerts-risk-guide-title"
      >
        <header className="alerts-operational-heading">
          <div>
            <span>Leitura rápida</span>
            <h2 id="alerts-risk-guide-title">Cor, validade e abrangência precisam ser lidas juntas</h2>
          </div>
          <p>
            A cor indica o nível de perigo. Para saber se o aviso se aplica a Pelotas agora, confirme
            também o horário de início e término e o território informado pelo INMET.
          </p>
        </header>

        <dl className="alerts-scope-summary" aria-label="Abrangência dos avisos encontrados">
          <div>
            <dt>Pelotas citada diretamente</dt>
            <dd>{inmet.usable ? directPelotas : "—"}</dd>
            <small>{inmet.usable ? "avisos identificados" : "consulta indisponível"}</small>
          </div>
          <div>
            <dt>Regional ou estadual</dt>
            <dd>{inmet.usable ? broaderScope : "—"}</dd>
            <small>{inmet.usable ? "para acompanhamento" : "não confirmado"}</small>
          </div>
          <div className={inmet.usable ? "is-live" : "is-unavailable"}>
            <dt>Fonte oficial</dt>
            <dd>{inmet.usable ? "INMET consultado" : "INMET indisponível"}</dd>
            <small>
              {inmet.usable
                ? "A ausência de aviso não elimina mudanças rápidas no tempo"
                : "Falha de consulta não significa ausência de risco"}
            </small>
          </div>
        </dl>

        <div className="alerts-severity-guide" aria-label="Níveis de perigo do INMET">
          {severityGuide.map((item) => (
            <article className={`is-${item.id}`} key={item.id}>
              <span>{item.label}</span>
              <strong>{item.title}</strong>
              <p>{item.description}</p>
            </article>
          ))}
        </div>

        <p className="alerts-risk-guide__note">
          <AlertTriangle aria-hidden="true" />
          <span>
            Este resumo ajuda a ler a página, mas não substitui as instruções específicas de cada
            aviso. A recomendação publicada pelo órgão responsável prevalece.
          </span>
        </p>
      </section>

      <section
        className="alerts-civil-defense"
        id="canais-defesa-civil"
        aria-labelledby="alerts-civil-defense-title"
      >
        <header className="alerts-operational-heading">
          <div>
            <span>Defesa Civil</span>
            <h2 id="alerts-civil-defense-title">Receba avisos oficiais também fora do portal</h2>
          </div>
          <p>
            Cadastre os canais que fazem sentido para sua rotina. Eles complementam a consulta ao
            Tempo Pelotas e podem continuar úteis quando você não estiver com o site aberto.
          </p>
        </header>

        <div className="alerts-civil-defense__channels">
          {SAFETY_BANNERS.map((banner) => {
            const Icon = channelIcon(banner.id);
            const action = channelAction(banner);

            return (
              <article className={`is-${banner.tone}`} key={banner.id}>
                <div className="alerts-civil-defense__icon">
                  <Icon aria-hidden="true" />
                </div>
                <div>
                  <span>{banner.eyebrow}</span>
                  <h3>{banner.title}</h3>
                  <p>{banner.description}</p>
                </div>
                {action ? (
                  action.external ? (
                    <a href={action.href} target="_blank" rel="noopener noreferrer">
                      {action.label} <ExternalLink aria-hidden="true" />
                    </a>
                  ) : action.href.startsWith("/") ? (
                    <Link to={action.href as "/alertas"}>
                      {action.label} <ArrowRight aria-hidden="true" />
                    </Link>
                  ) : (
                    <a href={action.href}>
                      {action.label} <ArrowRight aria-hidden="true" />
                    </a>
                  )
                ) : (
                  <span className="alerts-civil-defense__passive">Sem cadastro</span>
                )}
              </article>
            );
          })}
        </div>

        <footer className="alerts-civil-defense__source">
          <MapPin aria-hidden="true" />
          <span>
            Orientação preventiva baseada em conteúdo oficial de{" "}
            <a
              href={DEFESA_CIVIL_GUIDANCE_SOURCE.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {DEFESA_CIVIL_GUIDANCE_SOURCE.name} <ExternalLink aria-hidden="true" />
            </a>
            . Avisos ativos devem ser confirmados na publicação original do órgão responsável.
          </span>
        </footer>
      </section>
    </div>
  );
}
