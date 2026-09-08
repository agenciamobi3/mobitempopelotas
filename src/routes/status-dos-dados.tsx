import { createFileRoute } from "@tanstack/react-router";

import { createPageHead } from "@/lib/page-meta";
import { getDataStatusPageData } from "@/lib/status/data-status.functions";
import type {
  DataStatusPageData,
  ServiceCategory,
  ServiceState,
} from "@/lib/status/data-status.types";
import { createEditorialPageJsonLd } from "@/lib/structured-data";
import { SiteFooter } from "@/production/components/site-footer";
import { SiteHeader } from "@/production/components/site-header";
import type { WeatherData } from "@/production/lib/weather-data";

import "./status-dos-dados.css";
import "./status-dos-dados-history.css";

const PAGE_TITLE = "Dados e fontes do Tempo Pelotas";
const PAGE_DESCRIPTION =
  "Veja de onde vêm os dados publicados pelo Tempo Pelotas, quais informações cada fonte fornece, o estado atual das integrações e o histórico de disponibilidade.";
const PAGE_PATH = "/status-dos-dados";

const SOURCE_USAGE: Record<string, string> = {
  "defesa-civil-rs-hydromet":
    "Temperatura, sensação térmica, umidade, pressão, vento, rajadas, chuva e níveis da rede estadual. O Agora meteorológico só pode usar estações elegíveis de Pelotas com leitura recente.",
  "weather-open-meteo":
    "Previsão horária e diária de temperatura, chuva, umidade, vento, rajadas, pressão, nuvens e outras variáveis de modelo.",
  "weather-met-norway":
    "Contingência da previsão numérica quando a fonte principal não entrega uma série utilizável.",
  "weather-inmet":
    "Previsão municipal e avisos meteorológicos oficiais para Pelotas.",
  "weather-cppmet":
    "Previsões e informações meteorológicas regionais publicadas pelo CPPMet/UFPel.",
  "redemet-radar":
    "Imagens de radar meteorológico usadas no acompanhamento de chuva e sistemas próximos à região.",
  "redemet-satellite":
    "Imagens de satélite recebidas da REDEMET/DECEA.",
  "redemet-stsc":
    "Registros de trovoadas do produto STSC da REDEMET/DECEA.",
  "inmet-satellite":
    "Imagem meteorológica de satélite do INMET quando o acesso técnico está disponível.",
  "laranjal-level":
    "Nível da Lagoa dos Patos no ponto monitorado no Laranjal, com horário e tendência quando disponíveis.",
  "guaiba-level":
    "Leitura do nível do Guaíba usada como referência regional, sem substituir medições da Lagoa dos Patos em Pelotas.",
  "lagoon-regional-network":
    "Leituras de diferentes pontos da Lagoa dos Patos para acompanhamento regional do sistema lagunar.",
  "ana-rhn":
    "Fonte mantida para validação e cruzamento. Não compõe as leituras públicas atuais do Laranjal.",
};

const OPERATIONAL_DETAILS = new Set([
  "defesa-civil-rs-hydromet",
  "lagoon-regional-network",
]);

function labelForState(state: ServiceState) {
  if (state === "operational") return "Ativo";
  if (state === "partial") return "Atualização parcial";
  if (state === "maintenance") return "Manutenção";
  if (state === "implementation") return "Em implantação";
  return "Offline";
}

function categoryId(category: ServiceCategory) {
  if (category === "Meteorologia e avisos") return "status-meteorologia";
  if (category === "Radar e satélite") return "status-radar-satelite";
  return "status-hidrologia";
}

function formatCheckedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "horário indisponível";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

function formatAvailability(value: number | null) {
  if (value === null) return "—";
  return `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(value)}%`;
}

function formatDuration(start: string, end: string) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return "duração indisponível";
  }

  const minutes = Math.max(0, Math.round((endDate.getTime() - startDate.getTime()) / 60_000));
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours < 24) return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;

  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
}

export const Route = createFileRoute("/status-dos-dados")({
  head: () =>
    createPageHead(PAGE_TITLE, PAGE_DESCRIPTION, PAGE_PATH, [
      createEditorialPageJsonLd({
        name: PAGE_TITLE,
        description: PAGE_DESCRIPTION,
        path: PAGE_PATH,
        breadcrumbs: [
          { name: "Início", path: "/" },
          { name: "Dados e fontes", path: PAGE_PATH },
        ],
        about: [
          "Fontes de dados do Tempo Pelotas",
          "Status das integrações meteorológicas e hidrológicas",
          "Histórico de disponibilidade das fontes",
        ],
      }),
    ]),
  loader: () => getDataStatusPageData(),
  staleTime: 60 * 1_000,
  component: DataStatusPage,
});

function DataStatusPage() {
  const data = Route.useLoaderData() as DataStatusPageData;
  const categories: ServiceCategory[] = ["Meteorologia e avisos", "Radar e satélite", "Hidrologia"];
  const counts = {
    operational: data.services.filter((service) => service.state === "operational").length,
    partial: data.services.filter((service) => service.state === "partial").length,
    maintenance: data.services.filter((service) => service.state === "maintenance").length,
    offline: data.services.filter((service) => service.state === "offline").length,
    implementation: data.services.filter((service) => service.state === "implementation").length,
  };
  const overallLabel =
    data.overall === "operational"
      ? "Fontes operando normalmente"
      : data.overall === "offline"
        ? "Fontes essenciais indisponíveis"
        : "Algumas fontes estão com atualização parcial";

  const footerSource = {
    name: "Tempo Pelotas — dados e fontes",
    url: PAGE_PATH,
    isFallback: data.overall !== "operational",
    observationName: "Status das fontes",
    observationUrl: PAGE_PATH,
    forecastName: "Status das integrações",
    forecastUrl: PAGE_PATH,
  } satisfies WeatherData["source"];

  return (
    <div className="site-shell site-shell--home-editorial data-status-shell">
      <SiteHeader advisoryLevel="normal" />

      <main className="data-status-page" id="conteudo-principal" tabIndex={-1}>
        <header className="data-status-hero">
          <div>
            <h1>Dados e fontes do Tempo Pelotas</h1>
            <p>
              Veja o que cada fonte fornece ao portal, se ela está respondendo agora e quando foi
              verificada pela última vez.
            </p>
          </div>

          <aside className={`data-status-overview is-${data.overall}`} aria-label="Estado geral dos dados">
            <span aria-hidden="true" />
            <div>
              <small>Verificação atual</small>
              <strong>{overallLabel}</strong>
              <p>{formatCheckedAt(data.checkedAt)}</p>
            </div>
          </aside>
        </header>

        <section className="data-status-summary" aria-label="Resumo da disponibilidade">
          <div><strong>{counts.operational}</strong><span>Ativos</span></div>
          <div><strong>{counts.partial}</strong><span>Atualização parcial</span></div>
          <div><strong>{counts.maintenance}</strong><span>Em manutenção</span></div>
          <div><strong>{counts.offline}</strong><span>Offline</span></div>
          <div><strong>{counts.implementation}</strong><span>Em implantação</span></div>
        </section>

        <div className="data-status-groups">
          {categories.map((category) => {
            const headingId = categoryId(category);
            const categoryServices = data.services.filter((service) => service.category === category);
            return (
              <section className="data-status-group" key={category} aria-labelledby={headingId}>
                <header><h2 id={headingId}>{category}</h2><strong>{categoryServices.length} fontes</strong></header>
                <div className="data-status-services">
                  {categoryServices.map((service) => {
                    const usage = SOURCE_USAGE[service.id] ?? service.name;
                    const showDetail = service.state !== "operational" || OPERATIONAL_DETAILS.has(service.id);
                    return (
                      <article className={`data-status-service is-${service.state}`} key={service.id}>
                        <div className="data-status-service__heading">
                          <span className="data-status-service__dot" aria-hidden="true" />
                          <div><p>{service.provider}</p><h3>{service.name}</h3></div>
                          <strong>{labelForState(service.state)}</strong>
                        </div>
                        <p className="data-status-service__usage">{usage}</p>
                        {showDetail ? <p className="data-status-service__detail">{service.detail}</p> : null}
                        <footer>
                          <span>Verificado em {formatCheckedAt(service.checkedAt)}</span>
                          {service.sourceUrl ? <a href={service.sourceUrl} target="_blank" rel="noopener noreferrer">Abrir fonte</a> : null}
                        </footer>
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        <section className="data-status-explainer" aria-labelledby="data-status-explainer-title">
          <div><h2 id="data-status-explainer-title">Critérios de publicação</h2></div>
          <div>
            <p><strong>Agora:</strong> usa somente medição recente de estações elegíveis da Defesa Civil RS em Pelotas. Se nenhuma leitura estiver recente, a condição atual fica indisponível.</p>
            <p><strong>Previsão:</strong> Open-Meteo fornece a série horária e diária. MET Norway é contingência. Valores previstos nunca são apresentados como medição.</p>
            <p><strong>Previsão oficial e alertas:</strong> vêm do INMET. O Tempo Pelotas não cria alertas, níveis de risco ou áreas atingidas.</p>
            <p><strong>Radar e satélite:</strong> mostram os quadros recebidos das fontes identificadas, mantendo o horário disponível da coleta.</p>
            <p><strong>Hidrologia:</strong> cada nível pertence à estação e à referência informada pela fonte. Cotas de referências diferentes não são convertidas ou comparadas como equivalentes.</p>
          </div>
        </section>

        <section className="data-status-history" aria-labelledby="data-status-history-title">
          <header className="data-status-history__header">
            <div><h2 id="data-status-history-title">Incidentes e disponibilidade</h2></div>
            <p>O histórico registra verificações automáticas e o momento em que uma alteração foi detectada pelo monitor.</p>
          </header>

          {data.history.available ? (
            <>
              <div className="data-status-availability-summary" aria-label="Disponibilidade recente">
                <article><span>Últimas 24 horas</span><strong>{formatAvailability(data.history.summary24h.availabilityPercent)}</strong><p>{data.history.summary24h.measuredChecks} verificações válidas</p></article>
                <article><span>Até 7 dias</span><strong>{formatAvailability(data.history.summary7d.availabilityPercent)}</strong><p>{data.history.summary7d.measuredChecks} verificações válidas</p></article>
                <article><span>Incidentes em andamento</span><strong>{data.history.incidents.filter((incident) => incident.status === "open").length}</strong><p>{data.history.startedAt ? `Histórico desde ${formatCheckedAt(data.history.startedAt)}` : "Aguardando a primeira amostra"}</p></article>
              </div>

              {data.history.maintenance.length > 0 ? (
                <section className="data-status-maintenance" aria-labelledby="data-status-maintenance-title">
                  <header><h3 id="data-status-maintenance-title">Manutenções programadas</h3><span>{data.history.maintenance.length} janela(s)</span></header>
                  <div>{data.history.maintenance.map((maintenance) => <article key={maintenance.id}><strong>{maintenance.title}</strong><p>{maintenance.message}</p><span>{formatCheckedAt(maintenance.startsAt)} → {formatCheckedAt(maintenance.endsAt)}</span></article>)}</div>
                </section>
              ) : null}

              <section className="data-status-incidents" aria-labelledby="data-status-incidents-title">
                <header><div><h3 id="data-status-incidents-title">Incidentes recentes</h3><p>Falhas, atrasos relevantes e restabelecimentos registrados pelo monitor.</p></div></header>
                {data.history.incidents.length > 0 ? (
                  <div className="data-status-incident-list">
                    {data.history.incidents.map((incident) => {
                      const incidentEnd = incident.resolvedAt ?? incident.lastSeenAt;
                      return (
                        <article className={`data-status-incident is-${incident.status} is-${incident.worstState}`} key={incident.id}>
                          <span className="data-status-incident__marker" aria-hidden="true" />
                          <div className="data-status-incident__content">
                            <div className="data-status-incident__heading"><div><span>{incident.provider}</span><h4>{incident.title}</h4></div><strong>{incident.status === "open" ? "Em andamento" : "Resolvido"}</strong></div>
                            <p>{incident.detail}</p>
                            <dl>
                              <div><dt>Detectado</dt><dd>{formatCheckedAt(incident.openedAt)}</dd></div>
                              <div><dt>{incident.status === "open" ? "Última confirmação" : "Restabelecido"}</dt><dd>{formatCheckedAt(incidentEnd)}</dd></div>
                              <div><dt>Duração monitorada</dt><dd>{formatDuration(incident.openedAt, incidentEnd)}</dd></div>
                              <div><dt>Pior estado</dt><dd>{labelForState(incident.worstState)}</dd></div>
                            </dl>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : <div className="data-status-history-empty"><strong>Nenhum incidente registrado até agora.</strong><p>O histórico será preenchido quando o monitor detectar uma alteração.</p></div>}
              </section>

              {data.history.availability7d.length > 0 ? (
                <section className="data-status-availability" aria-labelledby="data-status-availability-title">
                  <header><h3 id="data-status-availability-title">Disponibilidade por fonte</h3><span>Até 7 dias</span></header>
                  <div className="data-status-availability__table" role="table" aria-label="Disponibilidade por fonte">
                    <div className="data-status-availability__row data-status-availability__row--header" role="row"><span role="columnheader">Fonte</span><span role="columnheader">Disponibilidade</span><span role="columnheader">Parcial</span><span role="columnheader">Offline</span></div>
                    {data.history.availability7d.map((service) => <div className="data-status-availability__row" role="row" key={service.serviceId}><span role="cell"><strong>{service.serviceName}</strong><small>{service.provider}</small></span><span role="cell">{formatAvailability(service.availabilityPercent)}</span><span role="cell">{service.partialChecks}</span><span role="cell">{service.offlineChecks}</span></div>)}
                  </div>
                </section>
              ) : null}
            </>
          ) : <div className="data-status-history-empty"><strong>Histórico indisponível.</strong><p>{data.history.error ?? "Ainda não há verificações persistidas para exibir."}</p></div>}
        </section>
      </main>

      <SiteFooter source={footerSource} />
    </div>
  );
}
