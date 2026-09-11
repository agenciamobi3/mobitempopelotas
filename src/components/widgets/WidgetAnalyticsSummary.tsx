import type { WidgetAnalyticsSummary as WidgetAnalyticsSummaryData } from "@/lib/widgets/widget-analytics.functions";

import "./WidgetAnalyticsSummary.css";

const numberFormatter = new Intl.NumberFormat("pt-BR");

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

      <p>
        Conta carregamentos feitos pelo snippet oficial em sites externos. Prévia, edição e abertura
        dentro do Tempo Pelotas não entram nesta métrica.
      </p>
    </section>
  );
}
