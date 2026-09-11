import { Link } from "@tanstack/react-router";

import type { AccountLiveWeatherSummary } from "@/lib/auth/account-dashboard-live.functions";

import "./AccountLiveOverview.css";

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
}: {
  summary: AccountLiveWeatherSummary | null;
  refreshing: boolean;
}) {
  const loading = summary === null;
  const unavailable = !loading && !summary.available;
  const status = loading ? "loading" : unavailable ? "unavailable" : refreshing ? "loading" : "ready";

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
        <article className="account-live__card is-primary">
          <small>{summary?.currentIsObservation ? "Agora · medição" : "Agora · previsão"}</small>
          <strong>{loading ? "—" : formatTemperature(summary?.currentTemperature)}</strong>
          <span>{loading ? "Consultando as fontes do portal" : summary?.condition}</span>
          <p>
            {loading
              ? ""
              : summary?.observedAt
                ? `Atualizado em ${summary.observedAt}`
                : summary?.source}
          </p>
          <Link to="/tempo-hoje-pelotas">Ver tempo hoje →</Link>
        </article>

        <article className="account-live__card">
          <small>Hoje</small>
          <strong>
            {loading || !summary?.today
              ? "—"
              : `${formatTemperature(summary.today.min)} / ${formatTemperature(summary.today.max)}`}
          </strong>
          <span>
            {loading || !summary?.today
              ? "Mínima e máxima em atualização"
              : `${summary.today.condition} · chuva ${formatPercent(summary.today.rainChance)}`}
          </span>
          <p>
            {loading || !summary?.today
              ? ""
              : `Volume previsto: ${formatMillimeters(summary.today.precipitation)}`}
          </p>
          <Link to="/previsao-7-dias-pelotas">Abrir previsão →</Link>
        </article>

        <article className="account-live__card">
          <small>Próximas horas</small>
          <strong>{loading ? "—" : formatPercent(summary?.rainPeak6h)}</strong>
          <span>Maior chance de chuva nas próximas 6 horas</span>
          <p>
            {loading
              ? ""
              : `${formatMillimeters(summary?.rainVolume6h ?? 0)} previstos · vento até ${formatWind(summary?.windPeak6h)}`}
          </p>
          <Link to="/chuva-em-pelotas">Ver chuva por horário →</Link>
        </article>

        <article className={`account-live__card is-alert${(summary?.officialAlertCount ?? 0) > 0 ? " has-alert" : ""}`}>
          <small>Avisos oficiais</small>
          <strong>{loading ? "—" : summary?.officialAlertCount ?? 0}</strong>
          <span>
            {loading
              ? "Consultando avisos do INMET"
              : (summary?.officialAlertCount ?? 0) === 0
                ? "Nenhum aviso para Pelotas agora"
                : `${summary?.officialAlertCount} aviso${summary?.officialAlertCount === 1 ? "" : "s"} com relevância para Pelotas`}
          </span>
          <p>Validade e orientações permanecem na página oficial de alertas do portal.</p>
          <Link to="/alertas">Ver avisos →</Link>
        </article>
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
