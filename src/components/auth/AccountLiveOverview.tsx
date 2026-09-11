import { Link } from "@tanstack/react-router";
import { useState, type DragEvent, type ReactNode } from "react";

import { DashboardItemControls } from "@/components/auth/DashboardPersonalization";
import type { AccountLiveWeatherSummary } from "@/lib/auth/account-dashboard-live.functions";
import {
  dashboardCardSize,
  moveDashboardItem,
  placeDashboardItem,
  type DashboardLayout,
  type DashboardLiveCardId,
} from "@/lib/auth/dashboard-layout";

import "./AccountLiveOverview.css";

const LIVE_CARD_LABELS: Record<DashboardLiveCardId, string> = {
  "weather-now": "Tempo agora",
  "weather-today": "Resumo de hoje",
  "weather-hours": "Próximas horas",
  "weather-alerts": "Avisos oficiais",
};

function formatTemperature(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? `${Math.round(value)}°` : "—";
}

function formatPercent(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? `${Math.round(value)}%` : "—";
}

function formatMillimeters(value: number) {
  return `${value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mm`;
}

function formatWind(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? `${Math.round(value)} km/h` : "—";
}

export function AccountLiveOverview({
  summary,
  refreshing,
  failed,
  layout,
  customizing,
  onLayoutChange,
}: {
  summary: AccountLiveWeatherSummary | null;
  refreshing: boolean;
  failed: boolean;
  layout: DashboardLayout;
  customizing: boolean;
  onLayoutChange: (layout: DashboardLayout) => void;
}) {
  const [draggedCard, setDraggedCard] = useState<DashboardLiveCardId | null>(null);
  const loading = summary === null && !failed;
  const unavailable = failed || (!loading && !summary?.available);
  const status = loading || refreshing ? "loading" : unavailable ? "unavailable" : "ready";

  function changeCardOrder(card: DashboardLiveCardId, direction: -1 | 1) {
    onLayoutChange({
      ...layout,
      liveCards: moveDashboardItem(layout.liveCards, card, direction),
    });
  }

  function resizeCard(card: DashboardLiveCardId, size: "compact" | "medium" | "wide") {
    onLayoutChange({
      ...layout,
      sizes: { ...layout.sizes, [card]: size },
    });
  }

  function startCardDrag(event: DragEvent<HTMLButtonElement>, card: DashboardLiveCardId) {
    setDraggedCard(card);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", card);
  }

  function dropCard(target: DashboardLiveCardId) {
    if (!draggedCard) return;
    onLayoutChange({
      ...layout,
      liveCards: placeDashboardItem(layout.liveCards, draggedCard, target),
    });
    setDraggedCard(null);
  }

  function cardBody(card: DashboardLiveCardId): ReactNode {
    if (card === "weather-now") {
      return (
        <>
          <small>{summary?.currentIsObservation ? "Agora · medição" : "Agora · previsão"}</small>
          <strong>{loading || unavailable ? "—" : formatTemperature(summary?.currentTemperature)}</strong>
          <span>
            {loading
              ? "Consultando as fontes do portal"
              : unavailable
                ? "Dados atuais indisponíveis"
                : summary?.condition}
          </span>
          <p>
            {loading || unavailable
              ? ""
              : summary?.observedAt
                ? `Atualizado em ${summary.observedAt}`
                : summary?.source}
          </p>
          <Link to="/tempo-hoje-pelotas">Ver tempo hoje →</Link>
        </>
      );
    }

    if (card === "weather-today") {
      return (
        <>
          <small>Hoje</small>
          <strong>
            {loading || unavailable || !summary?.today
              ? "—"
              : `${formatTemperature(summary.today.min)} / ${formatTemperature(summary.today.max)}`}
          </strong>
          <span>
            {loading
              ? "Mínima e máxima em atualização"
              : unavailable || !summary?.today
                ? "Previsão indisponível nesta consulta"
                : `${summary.today.condition} · chuva ${formatPercent(summary.today.rainChance)}`}
          </span>
          <p>
            {loading || unavailable || !summary?.today
              ? ""
              : `Volume previsto: ${formatMillimeters(summary.today.precipitation)}`}
          </p>
          <Link to="/previsao-7-dias-pelotas">Abrir previsão →</Link>
        </>
      );
    }

    if (card === "weather-hours") {
      return (
        <>
          <small>Próximas horas</small>
          <strong>{loading || unavailable ? "—" : formatPercent(summary?.rainPeak6h)}</strong>
          <span>Maior chance de chuva nas próximas 6 horas</span>
          <p>
            {loading || unavailable
              ? ""
              : `${formatMillimeters(summary?.rainVolume6h ?? 0)} previstos · vento até ${formatWind(summary?.windPeak6h)}`}
          </p>
          <Link to="/chuva-em-pelotas">Ver chuva por horário →</Link>
        </>
      );
    }

    return (
      <>
        <small>Avisos oficiais</small>
        <strong>{loading || unavailable ? "—" : summary?.officialAlertCount ?? 0}</strong>
        <span>
          {loading
            ? "Consultando avisos do INMET"
            : unavailable
              ? "Avisos indisponíveis nesta consulta"
              : (summary?.officialAlertCount ?? 0) === 0
                ? "Nenhum aviso para Pelotas agora"
                : `${summary?.officialAlertCount} aviso${summary?.officialAlertCount === 1 ? "" : "s"} com relevância para Pelotas`}
        </span>
        <p>Validade e orientações permanecem na página oficial de alertas do portal.</p>
        <Link to="/alertas">Ver avisos →</Link>
      </>
    );
  }

  return (
    <section className="account-live" aria-labelledby="account-live-title">
      <div className="account-live__heading">
        <div>
          <span className="eyebrow">Para mim · Free</span>
          <h2 id="account-live-title">Seu Tempo Pelotas, já resumido</h2>
          <p>
            Um retrato rápido de Pelotas usando a mesma consolidação meteorológica das páginas
            públicas. Entre, confira o que importa e aprofunde só quando precisar.
          </p>
        </div>
        <span className={`account-live__status is-${status}`}>
          {loading || refreshing ? "Atualizando" : unavailable ? "Dados indisponíveis" : "Dados atuais"}
        </span>
      </div>

      <div className="account-live__grid" aria-busy={loading || refreshing}>
        {layout.liveCards.map((card, index) => {
          const size = dashboardCardSize(layout, card);
          const isAlert = card === "weather-alerts";
          return (
            <div
              key={card}
              className={`dashboard-card-edit-shell dashboard-card-size-${size}${customizing ? " is-editing" : ""}`}
              onDragOver={customizing ? (event) => event.preventDefault() : undefined}
              onDrop={customizing ? () => dropCard(card) : undefined}
            >
              {customizing ? (
                <DashboardItemControls
                  label={LIVE_CARD_LABELS[card]}
                  size={size}
                  canMoveUp={index > 0}
                  canMoveDown={index < layout.liveCards.length - 1}
                  onMoveUp={() => changeCardOrder(card, -1)}
                  onMoveDown={() => changeCardOrder(card, 1)}
                  onSizeChange={(nextSize) => resizeCard(card, nextSize)}
                  onDragStart={(event) => startCardDrag(event, card)}
                />
              ) : null}
              <article
                className={`account-live__card${card === "weather-now" ? " is-primary" : ""}${isAlert ? " is-alert" : ""}${isAlert && (summary?.officialAlertCount ?? 0) > 0 ? " has-alert" : ""}`}
              >
                {cardBody(card)}
              </article>
            </div>
          );
        })}
      </div>

      {unavailable ? (
        <p className="account-live__notice" role="status">
          O resumo não conseguiu recuperar dados atuais agora. As páginas públicas continuam
          disponíveis e nenhuma informação demonstrativa foi exibida no lugar dos dados reais.
        </p>
      ) : null}
    </section>
  );
}
