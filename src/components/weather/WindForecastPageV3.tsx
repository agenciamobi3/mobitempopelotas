import { Link } from "@tanstack/react-router";
import { Clock3, Info, Navigation, Waves, Wind } from "lucide-react";

import type { HourlyForecast } from "@/lib/weather/types";
import type { WeatherIntelligenceData } from "@/lib/weather/weather-intelligence.types";

function formatDateTime(value: string | null | undefined) {
  if (!value) return "Horário não informado";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Horário não informado";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

function number(value: number | null | undefined, digits = 0) {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: digits }).format(value);
}

function gust(value: number | null | undefined) {
  if (value === null || value === undefined) return "Não informada";
  if (value <= 0) return "Sem rajada prevista";
  return `${number(value)} km/h`;
}

function currentWind(value: number | null | undefined) {
  return value === null || value === undefined ? "Não informado" : `${number(value)} km/h`;
}

function currentDirection(value: string | null | undefined) {
  return value?.trim() ? value : "Não informada";
}

function spread(hour: HourlyForecast | null) {
  if (!hour || hour.windGust === null || hour.windGust <= 0) return null;
  return Math.max(0, hour.windGust - hour.windSpeed);
}

function peakHours(hours: HourlyForecast[]) {
  return hours
    .filter((hour) => (hour.windGust ?? 0) > 0)
    .sort((a, b) => (b.windGust ?? 0) - (a.windGust ?? 0))
    .slice(0, 3);
}

function EmptyWindPage() {
  return (
    <section className="wind-page__empty" aria-labelledby="wind-page-empty-title">
      <Wind aria-hidden="true" />
      <div>
        <h2 id="wind-page-empty-title">Os dados de vento estão em atualização</h2>
        <p>Nenhuma velocidade, direção ou rajada foi preenchida manualmente enquanto a previsão é recuperada.</p>
        <Link to="/tempo-hoje-pelotas">Ver o tempo de hoje</Link>
      </div>
    </section>
  );
}

export function WindForecastPageV3({ data }: { data: WeatherIntelligenceData }) {
  const weather = data.weather;
  const current = weather.current;

  if (!current && weather.hourly.length === 0 && weather.daily.length === 0) return <EmptyWindPage />;

  const hours = weather.hourly.slice(0, 24);
  const days = weather.daily.slice(0, 7);
  const topHours = peakHours(hours);
  const maximum = topHours[0]?.windGust ?? null;
  const maximumScale = Math.max(1, ...hours.map((hour) => Math.max(hour.windSpeed, hour.windGust ?? 0)));
  const dailyMaximum = Math.max(1, ...days.map((day) => day.windGust ?? 0));
  const maximumSummary = maximum !== null
    ? `Rajadas de até ${number(maximum)} km/h nas próximas 24h.`
    : hours.some((hour) => hour.windGust !== null)
      ? "Sem rajadas positivas previstas nas próximas 24h."
      : "As rajadas ainda não foram informadas para as próximas 24h.";

  return (
    <div className="wind-page">
      <section className="wind-page__provenance" id="procedencia" aria-labelledby="wind-page-provenance-title">
        <div>
          <span>Dados atuais</span>
          <h2 id="wind-page-provenance-title">Vento atual e previsão</h2>
        </div>
        <dl style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
          <div><dt>Vento agora</dt><dd>{currentWind(current?.windSpeed)}</dd></div>
          <div><dt>Direção agora</dt><dd>{currentDirection(current?.windDirection)}</dd></div>
          <div><dt>Horário do vento atual</dt><dd>{formatDateTime(current?.observedAt)}</dd></div>
        </dl>
      </section>

      {hours.length ? (
        <section className="wind-page__hourly" id="vento-por-hora" aria-labelledby="wind-page-hourly-title">
          <header className="wind-page__heading">
            <div>
              <span>Próximas 24 horas</span>
              <h2 id="wind-page-hourly-title">Vento e rajadas por horário</h2>
            </div>
            <p>{maximumSummary} A diferença mostra quanto a rajada supera o vento naquele horário.</p>
          </header>

          <div className="wind-page__hourly-track" aria-label="Vento e rajadas previstos por horário">
            {hours.map((hour, index) => {
              const difference = spread(hour);
              const speedWidth = Math.max(3, (hour.windSpeed / maximumScale) * 100);
              const gustWidth = hour.windGust === null || hour.windGust <= 0
                ? 0
                : Math.max(3, (hour.windGust / maximumScale) * 100);

              return (
                <article className={index === 0 ? "is-current" : undefined} key={`${hour.timestamp ?? hour.time}-${index}`}>
                  <header>
                    <strong>{hour.time}</strong>
                    {index === 0 ? <b>Agora</b> : null}
                  </header>
                  <dl>
                    <div><dt>Vento</dt><dd>{number(hour.windSpeed)} km/h</dd></div>
                    <div><dt>Rajada</dt><dd>{gust(hour.windGust)}</dd></div>
                  </dl>
                  <div className="wind-page__bars" aria-label={`Vento ${number(hour.windSpeed)} km/h; rajada ${gust(hour.windGust)}`}>
                    <i><span style={{ width: `${speedWidth}%` }} /></i>
                    <i className="is-gust"><span style={{ width: `${gustWidth}%` }} /></i>
                  </div>
                  <small>{difference === null ? "Diferença não calculável" : `Rajada +${number(difference)} km/h`}</small>
                </article>
              );
            })}
          </div>

          <div className="wind-page__legend" aria-label="Legenda das barras">
            <span><i />Vento</span>
            <span><i className="is-gust" />Rajada</span>
          </div>
        </section>
      ) : null}

      <section className="wind-page__peaks" id="maiores-valores" aria-labelledby="wind-page-peaks-title">
        <header className="wind-page__heading">
          <div>
            <span>Maiores valores</span>
            <h2 id="wind-page-peaks-title">As rajadas mais fortes das próximas 24 horas</h2>
          </div>
          <p>Velocidade sustentada não substitui rajada. O ranking usa somente rajadas positivas publicadas.</p>
        </header>

        {topHours.length ? (
          <ol className="wind-page__peak-list">
            {topHours.map((hour, index) => (
              <li key={`${hour.timestamp ?? hour.time}-peak`}>
                <span>{index + 1}</span>
                <Clock3 aria-hidden="true" />
                <div><strong>{hour.time}</strong><small>Vento {number(hour.windSpeed)} km/h</small></div>
                <b>{gust(hour.windGust)}</b>
              </li>
            ))}
          </ol>
        ) : (
          <div className="wind-page__state" role="status">
            <Wind aria-hidden="true" />
            <p>{hours.some((hour) => hour.windGust !== null) ? "Não há rajadas positivas previstas para as próximas 24 horas." : "As rajadas ainda não foram informadas para este período."}</p>
          </div>
        )}
      </section>

      {days.length ? (
        <section className="wind-page__week" id="vento-na-semana" aria-labelledby="wind-page-week-title">
          <header className="wind-page__heading">
            <div>
              <span>Próximos 7 dias</span>
              <h2 id="wind-page-week-title">Rajadas nos próximos 7 dias</h2>
            </div>
            <p>Rajada mais forte prevista em cada dia.</p>
          </header>

          <div className="wind-page__week-grid">
            {days.map((day, index) => {
              const width = day.windGust === null || day.windGust <= 0
                ? 0
                : Math.max(4, (day.windGust / dailyMaximum) * 100);
              return (
                <article className={index === 0 ? "is-today" : undefined} key={`${day.weekday}-${day.date}`}>
                  <header><strong>{day.weekday}</strong><span>{day.date}</span></header>
                  <Wind aria-hidden="true" />
                  <div className="wind-page__week-track" aria-hidden="true"><span style={{ width: `${width}%` }} /></div>
                  <strong>{gust(day.windGust)}</strong>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

      <aside className="wind-page__interpretation">
        <Navigation aria-hidden="true" />
        <div>
          <h2>O vento varia conforme o local</h2>
          <p>Orla, áreas abertas, pontes, árvores e construções podem alterar o vento sentido no ponto onde você está.</p>
        </div>
        <nav aria-label="Outras informações relacionadas ao vento">
          <Link to="/radar-e-satelite-pelotas"><Waves aria-hidden="true" /> Radar e satélite</Link>
          <Link to="/alertas"><Wind aria-hidden="true" /> Avisos oficiais</Link>
        </nav>
      </aside>

      <footer className="wind-page__footer">
        <Info aria-hidden="true" />
        <p>Última atualização: {formatDateTime(weather.source.fetchedAt)}.</p>
        <Link to="/status-dos-dados">Dados e fontes</Link>
      </footer>
    </div>
  );
}
