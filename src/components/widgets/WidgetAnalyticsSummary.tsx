import type { WidgetAnalyticsSummary as WidgetAnalyticsSummaryData } from "@/lib/widgets/widget-analytics.functions";

import "./WidgetAnalyticsSummary.css";

const numberFormatter = new Intl.NumberFormat("pt-BR");
const percentFormatter = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 1,
});

function formatActivityDay(value: string) {
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

function distributionShare(loads: number, total: number) {
  if (total <= 0 || loads <= 0) return 0;
  return Math.min(100, (loads / total) * 100);
}

export function WidgetAnalyticsSummary({
  summary,
  loaded,
}: {
  summary?: WidgetAnalyticsSummaryData;
  loaded: boolean;
}) {
  const metrics = summary ?? {
    today: 0,
    last7Days: 0,
    last30Days: 0,
    activeHosts30Days: 0,
    topHosts30Days: [],
    otherHosts30Days: 0,
  };

  return (
    <section className="widget-analytics" aria-label="Visualizações do widget">
      <div className="widget-analytics__heading">
        <div>
          <span>Distribuição</span>
          <strong>Visualizações do widget</strong>
        </div>
        <small>{loaded ? "Dados reais" : "Carregando…"}</small>
      </div>

      <dl className="widget-analytics__grid" aria-busy={!loaded}>
        <div>
          <dt>Hoje</dt>
          <dd>{loaded ? numberFormatter.format(metrics.today) : "—"}</dd>
        </div>
        <div>
          <dt>7 dias</dt>
          <dd>{loaded ? numberFormatter.format(metrics.last7Days) : "—"}</dd>
        </div>
        <div>
          <dt>30 dias</dt>
          <dd>{loaded ? numberFormatter.format(metrics.last30Days) : "—"}</dd>
        </div>
        <div>
          <dt>Sites ativos</dt>
          <dd>{loaded ? numberFormatter.format(metrics.activeHosts30Days) : "—"}</dd>
        </div>
      </dl>

      {loaded ? (
        <div className="widget-analytics__distribution">
          <div className="widget-analytics__distribution-heading">
            <div>
              <strong>Sites que distribuem este widget</strong>
              <span>Últimos 30 dias</span>
            </div>
          </div>

          {metrics.topHosts30Days.length > 0 ? (
            <>
              <ol className="widget-analytics__sites">
                {metrics.topHosts30Days.map((site, index) => {
                  const share = distributionShare(site.last30Days, metrics.last30Days);
                  return (
                    <li key={site.host}>
                      <div className="widget-analytics__site-main">
                        <span className="widget-analytics__rank" aria-hidden="true">
                          {index + 1}
                        </span>
                        <div>
                          <strong>{site.host}</strong>
                          <small>Última atividade em {formatActivityDay(site.lastActiveDay)}</small>
                        </div>
                      </div>
                      <div className="widget-analytics__site-metrics">
                        <div>
                          <strong>{numberFormatter.format(site.last30Days)}</strong>
                          <span>{percentFormatter.format(share)}% do período</span>
                        </div>
                        <progress
                          max={Math.max(metrics.last30Days, 1)}
                          value={site.last30Days}
                          aria-label={`${site.host}: ${numberFormatter.format(site.last30Days)} visualizações nos últimos 30 dias`}
                        />
                      </div>
                    </li>
                  );
                })}
              </ol>
              {metrics.otherHosts30Days > 0 ? (
                <p className="widget-analytics__other-sites">
                  + {numberFormatter.format(metrics.otherHosts30Days)} outro
                  {metrics.otherHosts30Days === 1 ? " site ativo" : "s sites ativos"} no período.
                </p>
              ) : null}
            </>
          ) : (
            <p className="widget-analytics__empty-sites">
              Ainda não há visualizações externas registradas para este widget nesta janela.
            </p>
          )}
        </div>
      ) : null}

      <p>
        Conta carregamentos feitos pelo snippet oficial em sites externos. Prévia, edição e abertura
        dentro do Tempo Pelotas não entram nesta métrica.
      </p>
    </section>
  );
}
