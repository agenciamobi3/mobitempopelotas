import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";

import {
  getWidgetInsightsSnapshot,
  type WidgetInsight,
  type WidgetInsightsSnapshot,
} from "@/lib/widgets/widget-analytics.functions";
import type { ManagedWidget } from "@/lib/widgets/widget.functions";

import "./WidgetInsightsDashboard.css";

type WidgetInsightsDashboardProps = {
  widgets: ManagedWidget[];
};

const NUMBER_FORMATTER = new Intl.NumberFormat("pt-BR");
const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  dateStyle: "short",
  timeStyle: "short",
});

function formatCount(value: number) {
  return NUMBER_FORMATTER.format(Math.max(0, value));
}

function formatSeenAt(value: string | null) {
  if (!value) return "Ainda não detectado";
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return "Horário indisponível";
  return DATE_TIME_FORMATTER.format(new Date(timestamp));
}

function activityLabel(value: string | null) {
  if (!value) return "Aguardando primeira instalação";
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return "Atividade registrada";
  const ageHours = Math.max(0, (Date.now() - timestamp) / 3_600_000);
  if (ageHours <= 24) return "Atividade nas últimas 24 h";
  if (ageHours <= 24 * 7) return "Atividade nos últimos 7 dias";
  return "Sem carregamento recente";
}

function trendLabel(insight: WidgetInsight) {
  if (insight.previous30d === 0) {
    return insight.loads30d > 0 ? "Primeiro período com atividade" : "Sem atividade nos últimos 30 dias";
  }
  const change = insight.change30dPercent ?? 0;
  if (change === 0) return "Mesmo volume do período anterior";
  return `${change > 0 ? "+" : ""}${change}% vs. 30 dias anteriores`;
}

function WidgetActivityBars({ insight }: { insight: WidgetInsight }) {
  const maxLoads = Math.max(1, ...insight.daily14d.map((item) => item.loads));
  const total = insight.daily14d.reduce((sum, item) => sum + item.loads, 0);

  return (
    <div className="widget-insights-card__activity">
      <div>
        <span>Atividade recente</span>
        <strong>{formatCount(total)} carregamentos em 14 dias</strong>
      </div>
      <div
        className="widget-insights-bars"
        role="img"
        aria-label={`Carregamentos do widget nos últimos 14 dias: ${formatCount(total)}`}
      >
        {insight.daily14d.map((item) => {
          const height = item.loads === 0 ? 4 : Math.max(10, Math.round((item.loads / maxLoads) * 100));
          return (
            <span
              key={item.day}
              style={{ height: `${height}%` }}
              title={`${item.day}: ${formatCount(item.loads)} carregamentos`}
              data-empty={item.loads === 0 ? "true" : undefined}
            />
          );
        })}
      </div>
    </div>
  );
}

function WidgetInsightCard({ widget, insight }: { widget: ManagedWidget; insight?: WidgetInsight }) {
  const emptyInsight: WidgetInsight = {
    widgetId: widget.id,
    totalLoads: 0,
    loads7d: 0,
    loads30d: 0,
    previous30d: 0,
    change30dPercent: null,
    sitesCount: 0,
    firstSeenAt: null,
    lastSeenAt: null,
    topSites: [],
    daily14d: [],
  };
  const current = insight ?? emptyInsight;

  return (
    <article className="widget-insights-card">
      <header>
        <div>
          <span>{widget.status === "active" ? "Widget ativo" : "Widget pausado"}</span>
          <h3>{widget.title}</h3>
        </div>
        <small className={current.lastSeenAt ? "is-detected" : undefined}>
          {activityLabel(current.lastSeenAt)}
        </small>
      </header>

      <div className="widget-insights-card__metrics">
        <div>
          <span>Total</span>
          <strong>{formatCount(current.totalLoads)}</strong>
          <small>carregamentos</small>
        </div>
        <div>
          <span>7 dias</span>
          <strong>{formatCount(current.loads7d)}</strong>
          <small>carregamentos</small>
        </div>
        <div>
          <span>30 dias</span>
          <strong>{formatCount(current.loads30d)}</strong>
          <small>{trendLabel(current)}</small>
        </div>
        <div>
          <span>Sites</span>
          <strong>{formatCount(current.sitesCount)}</strong>
          <small>domínios detectados</small>
        </div>
      </div>

      {current.daily14d.length > 0 ? <WidgetActivityBars insight={current} /> : null}

      {current.topSites.length > 0 ? (
        <div className="widget-insights-card__sites">
          <div>
            <span>Onde está carregando</span>
            <small>Última leitura: {formatSeenAt(current.lastSeenAt)}</small>
          </div>
          <ul>
            {current.topSites.map((site) => (
              <li key={site.siteHost}>
                <div>
                  <strong>{site.siteHost}</strong>
                  <small>visto em {formatSeenAt(site.lastSeenAt)}</small>
                </div>
                <span>
                  {formatCount(site.totalLoads)} total · {formatCount(site.loads30d)} em 30 dias
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="widget-insights-card__empty">
          Ainda não detectamos este widget em um site externo. Depois de instalar, abra a página uma
          vez e volte aqui para conferir.
        </p>
      )}
    </article>
  );
}

export function WidgetInsightsDashboard({ widgets }: WidgetInsightsDashboardProps) {
  const loadInsights = useServerFn(getWidgetInsightsSnapshot);
  const [snapshot, setSnapshot] = useState<WidgetInsightsSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    try {
      setSnapshot(await loadInsights());
    } catch {
      setSnapshot({ status: "unavailable" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void loadInsights()
      .then((next) => {
        if (!cancelled) setSnapshot(next);
      })
      .catch(() => {
        if (!cancelled) setSnapshot({ status: "unavailable" });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [loadInsights]);

  const insightsByWidget = useMemo(() => {
    if (!snapshot || snapshot.status !== "authenticated") return new Map<string, WidgetInsight>();
    return new Map(snapshot.widgets.map((insight) => [insight.widgetId, insight]));
  }, [snapshot]);

  if (widgets.length === 0) return null;

  const available = snapshot?.status === "authenticated";
  const summary = available ? snapshot.summary : null;

  return (
    <section className="widget-insights" aria-labelledby="widget-insights-title" aria-busy={loading}>
      <div className="widget-insights__heading">
        <div>
          <span className="eyebrow">Widget Insights</span>
          <h2 id="widget-insights-title">Veja onde seus widgets estão trabalhando</h2>
          <p>
            Acompanhe carregamentos estimados, atividade recente e os domínios onde cada widget foi
            detectado. Estes números representam carregamentos do widget, não visitantes únicos.
          </p>
        </div>
        <button
          className="widget-builder-button is-secondary"
          type="button"
          onClick={refresh}
          disabled={loading}
        >
          {loading ? "Atualizando..." : "Atualizar métricas"}
        </button>
      </div>

      {summary ? (
        <div className="widget-insights__summary">
          <article>
            <span>Total acumulado</span>
            <strong>{formatCount(summary.totalLoads)}</strong>
            <small>carregamentos externos</small>
          </article>
          <article>
            <span>Últimos 7 dias</span>
            <strong>{formatCount(summary.loads7d)}</strong>
            <small>carregamentos</small>
          </article>
          <article>
            <span>Últimos 30 dias</span>
            <strong>{formatCount(summary.loads30d)}</strong>
            <small>{summary.activeWidgets30d} widgets com atividade</small>
          </article>
          <article>
            <span>Sites detectados</span>
            <strong>{formatCount(summary.sitesCount)}</strong>
            <small>último: {formatSeenAt(summary.lastSeenAt)}</small>
          </article>
        </div>
      ) : null}

      {!loading && snapshot?.status === "unavailable" ? (
        <p className="widget-insights__notice" role="status">
          As métricas estão temporariamente indisponíveis. Seus widgets continuam funcionando
          normalmente.
        </p>
      ) : null}

      {!loading && snapshot?.status === "not-entitled" ? (
        <p className="widget-insights__notice" role="status">
          Os insights não estão habilitados para esta camada de acesso.
        </p>
      ) : null}

      {available && summary.totalLoads === 0 ? (
        <div className="widget-insights__first-load">
          <strong>O primeiro carregamento é a confirmação mais simples da instalação.</strong>
          <p>
            Publique o snippet em outro site e abra a página. Quando o widget renderizar, o domínio
            aparecerá aqui automaticamente.
          </p>
        </div>
      ) : null}

      <div className="widget-insights__widgets">
        {widgets.map((widget) => (
          <WidgetInsightCard
            widget={widget}
            insight={insightsByWidget.get(widget.id)}
            key={widget.id}
          />
        ))}
      </div>

      <p className="widget-insights__privacy">
        Métricas com privacidade por padrão: registramos o widget, o domínio e contadores agregados
        por dia. Esta camada não cria cookie de analytics, não identifica visitantes e não armazena
        IP, user-agent ou caminho da página.
      </p>
    </section>
  );
}
