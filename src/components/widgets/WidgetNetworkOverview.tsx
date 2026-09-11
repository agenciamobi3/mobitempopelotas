import type {
  WidgetNetworkAnalyticsSummary,
  WidgetNetworkWidgetSummary,
} from "@/lib/widgets/widget-analytics.functions";
import type { ManagedWidget } from "@/lib/widgets/widget.functions";

import "./WidgetNetworkOverview.css";

const numberFormatter = new Intl.NumberFormat("pt-BR");
const percentFormatter = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

function formatActivityDay(value: string) {
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

function share(value: number, total: number) {
  if (value <= 0 || total <= 0) return 0;
  return Math.min(100, (value / total) * 100);
}

function widgetLabel(widget: WidgetNetworkWidgetSummary, widgets: ManagedWidget[]) {
  return widgets.find((item) => item.id === widget.widgetId)?.title ?? "Widget sem título";
}

export function WidgetNetworkOverview({
  summary,
  widgets,
  loaded,
}: {
  summary: WidgetNetworkAnalyticsSummary;
  widgets: ManagedWidget[];
  loaded: boolean;
}) {
  return (
    <section className="widget-network" aria-labelledby="widget-network-title">
      <div className="widget-network__heading">
        <div>
          <span className="eyebrow">Rede de distribuição</span>
          <h2 id="widget-network-title">Onde os widgets do Tempo Pelotas estão circulando</h2>
          <p>
            Visão consolidada dos últimos 30 dias. “Sites parceiros” aqui significa domínios externos
            que carregaram ao menos um dos seus widgets no período.
          </p>
        </div>
        <span className="widget-network__status">{loaded ? "Dados reais" : "Carregando…"}</span>
      </div>

      <div className="widget-network__metrics" aria-busy={!loaded}>
        <article>
          <span>Visualizações</span>
          <strong>{loaded ? numberFormatter.format(summary.last30Days) : "—"}</strong>
          <small>carregamentos externos em 30 dias</small>
        </article>
        <article>
          <span>Sites parceiros</span>
          <strong>{loaded ? numberFormatter.format(summary.activeHosts30Days) : "—"}</strong>
          <small>domínios distribuidores únicos</small>
        </article>
        <article>
          <span>Widgets distribuídos</span>
          <strong>{loaded ? numberFormatter.format(summary.activeWidgets30Days) : "—"}</strong>
          <small>com uso externo no período</small>
        </article>
      </div>

      {loaded ? (
        <div className="widget-network__rankings">
          <section aria-labelledby="widget-network-sites-title">
            <div className="widget-network__ranking-heading">
              <div>
                <span>Alcance</span>
                <h3 id="widget-network-sites-title">Principais domínios</h3>
              </div>
              <small>30 dias</small>
            </div>

            {summary.topHosts30Days.length > 0 ? (
              <>
                <ol className="widget-network__ranking-list">
                  {summary.topHosts30Days.map((site, index) => {
                    const siteShare = share(site.last30Days, summary.last30Days);
                    return (
                      <li key={site.host}>
                        <span className="widget-network__rank" aria-hidden="true">
                          {index + 1}
                        </span>
                        <div className="widget-network__ranking-copy">
                          <strong>{site.host}</strong>
                          <small>Última atividade em {formatActivityDay(site.lastActiveDay)}</small>
                        </div>
                        <div className="widget-network__ranking-value">
                          <strong>{numberFormatter.format(site.last30Days)}</strong>
                          <span>{percentFormatter.format(siteShare)}%</span>
                        </div>
                        <progress
                          max={Math.max(summary.last30Days, 1)}
                          value={site.last30Days}
                          aria-label={`${site.host}: ${numberFormatter.format(site.last30Days)} visualizações nos últimos 30 dias`}
                        />
                      </li>
                    );
                  })}
                </ol>
                {summary.otherHosts30Days > 0 ? (
                  <p className="widget-network__more">
                    + {numberFormatter.format(summary.otherHosts30Days)} outro
                    {summary.otherHosts30Days === 1 ? " domínio ativo" : "s domínios ativos"} na rede.
                  </p>
                ) : null}
              </>
            ) : (
              <p className="widget-network__empty">Ainda não há domínios externos registrados.</p>
            )}
          </section>

          <section aria-labelledby="widget-network-widgets-title">
            <div className="widget-network__ranking-heading">
              <div>
                <span>Desempenho</span>
                <h3 id="widget-network-widgets-title">Widgets mais vistos</h3>
              </div>
              <small>30 dias</small>
            </div>

            {summary.topWidgets30Days.length > 0 ? (
              <ol className="widget-network__ranking-list">
                {summary.topWidgets30Days.map((widget, index) => {
                  const widgetShare = share(widget.last30Days, summary.last30Days);
                  return (
                    <li key={widget.widgetId}>
                      <span className="widget-network__rank" aria-hidden="true">
                        {index + 1}
                      </span>
                      <div className="widget-network__ranking-copy">
                        <strong>{widgetLabel(widget, widgets)}</strong>
                        <small>
                          {numberFormatter.format(widget.activeHosts30Days)} site
                          {widget.activeHosts30Days === 1 ? " ativo" : "s ativos"} · última atividade em{" "}
                          {formatActivityDay(widget.lastActiveDay)}
                        </small>
                      </div>
                      <div className="widget-network__ranking-value">
                        <strong>{numberFormatter.format(widget.last30Days)}</strong>
                        <span>{percentFormatter.format(widgetShare)}%</span>
                      </div>
                      <progress
                        max={Math.max(summary.last30Days, 1)}
                        value={widget.last30Days}
                        aria-label={`${widgetLabel(widget, widgets)}: ${numberFormatter.format(widget.last30Days)} visualizações nos últimos 30 dias`}
                      />
                    </li>
                  );
                })}
              </ol>
            ) : (
              <p className="widget-network__empty">Nenhum widget teve uso externo nesta janela.</p>
            )}
          </section>
        </div>
      ) : null}
    </section>
  );
}
