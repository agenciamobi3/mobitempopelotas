import { Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Clock3,
  ExternalLink,
  Gauge,
  Info,
  MapPin,
  Waves,
} from "lucide-react";

import type {
  GuaibaObservationData,
  GuaibaReferenceObservation,
} from "@/lib/hydrology/guaiba.server";

import { HydrologyLevelChart } from "./HydrologyLevelChart";
import "./GuaibaLevelPage.css";

function formatDateTime(value: string | null) {
  if (!value) return "Horário não informado";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Horário inválido";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

function formatAge(value: number | null) {
  if (value === null) return "idade não informada";
  if (value < 1) return "menos de 1 min";
  if (value < 60) return `${value} min`;
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return minutes === 0 ? `${hours} h` : `${hours} h ${minutes} min`;
}

function formatSigned(value: number | null, suffix: string) {
  if (value === null) return "—";
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}${suffix}`;
}

function trendLabel(value: number | null) {
  if (value === null) return "Tendência indisponível";
  if (value > 0.25) return "Subindo";
  if (value < -0.25) return "Baixando";
  return "Pouca mudança";
}

function statusLabel(status: GuaibaObservationData["status"]) {
  if (status === "live") return "Leitura atualizada";
  if (status === "stale") return "Última leitura atrasada";
  return "Leitura indisponível";
}

function ReferenceCard({ reference }: { reference: GuaibaReferenceObservation }) {
  return (
    <article className={`guaiba-reference-card is-${reference.status}`}>
      <div className="guaiba-reference-card__heading">
        <div>
          <span>{reference.label}</span>
          <strong>{reference.station}</strong>
        </div>
        <MapPin aria-hidden="true" />
      </div>
      <div className="guaiba-reference-card__value">
        {reference.currentLevel === null ? "—" : reference.currentLevel.toFixed(2)}
        {reference.currentLevel === null ? null : <span>m</span>}
      </div>
      <dl>
        <div>
          <dt>Tendência</dt>
          <dd>{trendLabel(reference.trendCmPerHour)}</dd>
        </div>
        <div>
          <dt>Variação 24 h</dt>
          <dd>{formatSigned(reference.variation24hCm, " cm")}</dd>
        </div>
        <div>
          <dt>Referência local</dt>
          <dd>{reference.floodReference.toFixed(2)} m</dd>
        </div>
        <div>
          <dt>Última leitura</dt>
          <dd>{formatDateTime(reference.updatedAt)}</dd>
        </div>
      </dl>
      <p>
        Fonte: {reference.source.name}. A referência pertence a esta régua e não deve ser transferida
        para outra estação.
      </p>
    </article>
  );
}

export function GuaibaLevelPage({ data }: { data: GuaibaObservationData }) {
  const TrendIcon =
    data.trendCmPerHour !== null && data.trendCmPerHour > 0.25
      ? ArrowUpRight
      : data.trendCmPerHour !== null && data.trendCmPerHour < -0.25
        ? ArrowDownRight
        : Activity;
  const references = data.references ?? [];

  return (
    <div className="guaiba-page">
      <section className="guaiba-hero" aria-labelledby="guaiba-page-title">
        <div className="guaiba-hero__copy">
          <p className="guaiba-kicker">Guaíba · monitoramento regional</p>
          <h1 id="guaiba-page-title">Nível do Guaíba hoje</h1>
          <p>
            Acompanhe a leitura mais recente disponível, o horário, a tendência e a variação nas
            últimas 24 horas. O Guaíba é apresentado aqui como parte do sistema hidrológico regional
            que se conecta à Lagoa dos Patos.
          </p>
          <div className={`guaiba-status is-${data.status}`}>
            <Clock3 aria-hidden="true" />
            <div>
              <strong>{statusLabel(data.status)}</strong>
              <span>
                {data.updatedAt
                  ? `${formatDateTime(data.updatedAt)} · ${formatAge(data.ageMinutes)}`
                  : data.error || "A fonte não informou uma leitura válida."}
              </span>
            </div>
          </div>
        </div>

        <div className="guaiba-hero__reading">
          <div className="guaiba-level">
            <Waves aria-hidden="true" />
            <strong>{data.currentLevel === null ? "—" : data.currentLevel.toFixed(2)}</strong>
            {data.currentLevel === null ? null : <span>m</span>}
          </div>
          <p>{data.station}</p>
          <small>{data.location}</small>
          <div className="guaiba-trend">
            <TrendIcon aria-hidden="true" />
            <div>
              <span>{trendLabel(data.trendCmPerHour)}</span>
              <strong>{formatSigned(data.trendCmPerHour, " cm/h")}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="guaiba-metrics" aria-label="Resumo do nível do Guaíba">
        <article>
          <span>Variação em 24 h</span>
          <strong>{formatSigned(data.variation24hCm, " cm")}</strong>
        </article>
        <article>
          <span>Menor nível da janela</span>
          <strong>{data.periodMinimum === null ? "—" : `${data.periodMinimum.toFixed(2)} m`}</strong>
        </article>
        <article>
          <span>Nível médio da janela</span>
          <strong>{data.periodAverage === null ? "—" : `${data.periodAverage.toFixed(2)} m`}</strong>
        </article>
        <article>
          <span>Maior nível da janela</span>
          <strong>{data.periodMaximum === null ? "—" : `${data.periodMaximum.toFixed(2)} m`}</strong>
        </article>
      </section>

      <section className="guaiba-panel" aria-labelledby="guaiba-evolution-title">
        <div className="guaiba-section-heading">
          <div>
            <p className="guaiba-kicker">Evolução recente</p>
            <h2 id="guaiba-evolution-title">Como o nível variou na referência selecionada</h2>
          </div>
          <Gauge aria-hidden="true" />
        </div>
        <HydrologyLevelChart
          points={data.series}
          unit="m"
          status={data.status}
          ariaLabel="Evolução recente do nível do Guaíba na referência selecionada"
          eyebrow="Série recente"
          windowLabel="Nível observado na referência selecionada"
          latestLabel={data.status === "stale" ? "Última leitura conhecida" : "Leitura mais recente"}
          emptyMessage="A fonte não devolveu pontos suficientes para desenhar a evolução recente do Guaíba."
          references={[
            {
              label: "Referência local publicada",
              value: data.floodReference,
              tone: "reference",
            },
          ]}
        />
        <p className="guaiba-note">
          O gráfico usa apenas os pontos devolvidos pela fonte para a estação selecionada. Uma leitura
          isolada não deve ser convertida em diagnóstico de risco para Pelotas ou para outra régua.
        </p>
      </section>

      {references.length > 0 ? (
        <section className="guaiba-panel" aria-labelledby="guaiba-references-title">
          <div className="guaiba-section-heading">
            <div>
              <p className="guaiba-kicker">Réguas de Porto Alegre</p>
              <h2 id="guaiba-references-title">Cais Mauá e Gasômetro mantêm referências próprias</h2>
            </div>
            <Info aria-hidden="true" />
          </div>
          <div className="guaiba-reference-grid">
            {references.map((reference) => (
              <ReferenceCard reference={reference} key={reference.id} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="guaiba-panel guaiba-source" aria-labelledby="guaiba-source-title">
        <div>
          <p className="guaiba-kicker">Fonte da leitura selecionada</p>
          <h2 id="guaiba-source-title">{data.source.name}</h2>
          <p>
            Instituição de origem informada: {data.source.originalInstitutions}. O Tempo Pelotas
            preserva a estação, o horário e a referência publicados pela fonte.
          </p>
        </div>
        <div className="guaiba-source__links">
          <a href={data.source.url} target="_blank" rel="noreferrer">
            Abrir fonte <ExternalLink aria-hidden="true" />
          </a>
          <a href={data.source.methodologyUrl} target="_blank" rel="noreferrer">
            Ver metodologia <ExternalLink aria-hidden="true" />
          </a>
        </div>
      </section>

      <nav className="guaiba-related" aria-label="Continue acompanhando a situação das águas">
        <Link to="/situacao-hidrologica-pelotas">Situação das águas em Pelotas</Link>
        <Link to="/nivel-da-lagoa-dos-patos-laranjal">Nível da Lagoa no Laranjal</Link>
        <Link to="/enchente-2024-pelotas-laranjal">Enchente de 2024</Link>
        <Link to="/alertas">Alertas oficiais</Link>
      </nav>
    </div>
  );
}
