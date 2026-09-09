import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CloudRain,
  Gauge,
  Info,
  RefreshCw,
  Thermometer,
  TriangleAlert,
  Wind,
} from "lucide-react";
import type { CSSProperties } from "react";

import type { ExtendedForecastData } from "@/lib/weather/extended-forecast.types";
import type { DailyForecast } from "@/lib/weather/types";
import { WeatherIcon } from "@/production/components/weather-icon";

import "./FifteenDayForecastPage.css";

function formatMillimeters(value: number) {
  return `${value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mm`;
}

function formatGust(value: number | null) {
  if (value === null) return "Não informada";
  if (value <= 0) return "Sem rajadas";
  return `${value} km/h`;
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "horário não informado";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

function rainScore(day: DailyForecast) {
  return (day.rainChance ?? 0) + day.precipitationMm * 4;
}

function hasPositiveRain(day: DailyForecast) {
  return (day.rainChance ?? 0) > 0 || day.precipitationMm > 0;
}

function hasPositiveGust(day: DailyForecast) {
  return (day.windGust ?? 0) > 0;
}

function dayBadge(index: number) {
  if (index === 0) return "Hoje";
  if (index === 1) return "Amanhã";
  return null;
}

function DayCard({ day, index }: { day: DailyForecast; index: number }) {
  const badge = dayBadge(index);

  return (
    <article className={`fifteen-day__day${index === 0 ? " is-today" : ""}`}>
      <header>
        <div>
          <strong>{day.weekday}</strong>
          <span>{day.date}</span>
        </div>
        {badge ? <b>{badge}</b> : null}
      </header>

      <div className="fifteen-day__condition">
        <WeatherIcon name={day.icon} title={`Condição prevista para ${day.weekday}`} />
        <strong>
          {day.min}° <span>/</span> {day.max}°
        </strong>
      </div>

      <dl>
        <div>
          <dt><CloudRain aria-hidden="true" /> Chuva</dt>
          <dd>{day.rainChance === null ? "Não informada" : `${day.rainChance}%`}</dd>
          <small>{formatMillimeters(day.precipitationMm)}</small>
        </div>
        <div>
          <dt><Wind aria-hidden="true" /> Rajadas</dt>
          <dd>{formatGust(day.windGust)}</dd>
        </div>
      </dl>
    </article>
  );
}

function ForecastUnavailable() {
  return (
    <section className="fifteen-day__unavailable" aria-labelledby="fifteen-day-unavailable-title">
      <RefreshCw aria-hidden="true" />
      <div>
        <h2 id="fifteen-day-unavailable-title">A previsão de 15 dias está em atualização</h2>
        <p>Ainda não há dias suficientes para mostrar esta previsão.</p>
      </div>
      <Link to="/previsao-7-dias-pelotas">
        Ver previsão de 7 dias <ArrowRight aria-hidden="true" />
      </Link>
    </section>
  );
}

export function FifteenDayForecastPage({ forecast }: { forecast: ExtendedForecastData }) {
  const days = forecast.days.slice(0, 15);
  if (days.length === 0) return <ForecastUnavailable />;

  const nearDays = days.slice(0, 7);
  const extendedDays = days.slice(7, 15);
  const minimum = Math.min(...days.map((day) => day.min));
  const maximum = Math.max(...days.map((day) => day.max));
  const temperatureSpan = Math.max(1, maximum - minimum);
  const warmestDays = days.filter((day) => day.max === maximum);
  const coldestDays = days.filter((day) => day.min === minimum);
  const rainRanking = [...days]
    .filter(hasPositiveRain)
    .sort((a, b) => rainScore(b) - rainScore(a))
    .slice(0, 5);
  const windRanking = [...days]
    .filter(hasPositiveGust)
    .sort((a, b) => (b.windGust ?? 0) - (a.windGust ?? 0))
    .slice(0, 5);
  const hasPublishedGust = days.some((day) => day.windGust !== null);

  return (
    <div className="fifteen-day-page">
      <section
        className="fifteen-day__forecast"
        id="previsao-15-dias-dia-a-dia"
        aria-labelledby="fifteen-day-forecast-title"
      >
        <header className="fifteen-day__section-header">
          <h2 id="fifteen-day-forecast-title">Previsão dos próximos 15 dias</h2>
        </header>

        <div className="fifteen-day__week">
          <header className="fifteen-day__week-header">
            <h3>Primeira semana</h3>
            <Link to="/previsao-7-dias-pelotas">Ver previsão de 7 dias</Link>
          </header>
          <div className="fifteen-day__grid is-near">
            {nearDays.map((day, index) => (
              <DayCard day={day} index={index} key={day.dateIso ?? `${day.weekday}-${day.date}`} />
            ))}
          </div>
        </div>

        <div className="fifteen-day__week is-extended" id="previsao-estendida-8-15">
          <header className="fifteen-day__week-header">
            <div>
              <h3>Segunda semana</h3>
              <p>Pode mudar mais. Confira de novo perto da data.</p>
            </div>
          </header>
          {extendedDays.length > 0 ? (
            <div className="fifteen-day__grid is-extended">
              {extendedDays.map((day, offset) => (
                <DayCard day={day} index={offset + 7} key={day.dateIso ?? `${day.weekday}-${day.date}`} />
              ))}
            </div>
          ) : (
            <div className="fifteen-day__partial">
              <TriangleAlert aria-hidden="true" />
              <p>Os dias 8 a 15 ainda não chegaram nesta atualização.</p>
            </div>
          )}
        </div>
      </section>

      <section className="fifteen-day__trend" id="temperaturas-15-dias" aria-labelledby="fifteen-day-trend-title">
        <header className="fifteen-day__section-header">
          <h2 id="fifteen-day-trend-title">Temperaturas nos próximos 15 dias</h2>
        </header>

        <div className="fifteen-day__trend-list">
          {days.map((day) => {
            const low = ((day.min - minimum) / temperatureSpan) * 100;
            const span = Math.max(4, ((day.max - day.min) / temperatureSpan) * 100);
            const style = {
              "--fifteen-low": `${low}%`,
              "--fifteen-span": `${Math.min(span, 100 - low)}%`,
            } as CSSProperties;

            return (
              <article key={`${day.weekday}-${day.date}-trend`}>
                <strong>{day.weekday}</strong>
                <div>
                  <span>{day.min}°</span>
                  <i style={style} aria-label={`Faixa de ${day.min} a ${day.max} graus`}><b /></i>
                  <span>{day.max}°</span>
                </div>
              </article>
            );
          })}
        </div>

        <dl className="fifteen-day__trend-summary">
          <div>
            <dt><Thermometer aria-hidden="true" /> Maior máxima</dt>
            <dd>
              {warmestDays.length === 1
                ? `${warmestDays[0]?.weekday} · ${maximum}°`
                : `${maximum}° · ${warmestDays.length} dias`}
            </dd>
          </div>
          <div>
            <dt><Thermometer aria-hidden="true" /> Menor mínima</dt>
            <dd>
              {coldestDays.length === 1
                ? `${coldestDays[0]?.weekday} · ${minimum}°`
                : `${minimum}° · ${coldestDays.length} dias`}
            </dd>
          </div>
          <div>
            <dt><Gauge aria-hidden="true" /> Diferença</dt>
            <dd>{maximum - minimum}°</dd>
          </div>
        </dl>
      </section>

      <section className="fifteen-day__risks" id="chuva-vento-15-dias" aria-labelledby="fifteen-day-risks-title">
        <header className="fifteen-day__section-header">
          <h2 id="fifteen-day-risks-title">Chuva e rajadas nos próximos 15 dias</h2>
        </header>

        <div className="fifteen-day__risks-grid">
          <article className="is-rain">
            <div className="fifteen-day__risks-title">
              <CloudRain aria-hidden="true" />
              <strong>Maiores chances e volumes de chuva</strong>
            </div>
            {rainRanking.length ? (
              <ol>
                {rainRanking.map((day) => (
                  <li key={`${day.weekday}-${day.date}-rain`}>
                    <span><strong>{day.weekday}</strong><small>{formatMillimeters(day.precipitationMm)}</small></span>
                    <b>{day.rainChance === null ? "—" : `${day.rainChance}%`}</b>
                  </li>
                ))}
              </ol>
            ) : <p>Sem chuva prevista nos valores atuais.</p>}
            <Link to="/chuva-em-pelotas">Ver chuva em Pelotas <ArrowRight aria-hidden="true" /></Link>
          </article>

          <article className="is-wind">
            <div className="fifteen-day__risks-title">
              <Wind aria-hidden="true" />
              <strong>Rajadas mais fortes</strong>
            </div>
            {windRanking.length ? (
              <ol>
                {windRanking.map((day) => (
                  <li key={`${day.weekday}-${day.date}-wind`}>
                    <span><strong>{day.weekday}</strong></span>
                    <b>{formatGust(day.windGust)}</b>
                  </li>
                ))}
              </ol>
            ) : (
              <p>{hasPublishedGust ? "Sem rajadas previstas nos próximos dias." : "As rajadas ainda não foram informadas."}</p>
            )}
            <Link to="/vento-em-pelotas">Ver vento em Pelotas <ArrowRight aria-hidden="true" /></Link>
          </article>
        </div>
      </section>

      <footer className="fifteen-day__footer">
        <p>
          <Info aria-hidden="true" />
          <span>
            Atualizado em {formatDateTime(forecast.source.fetchedAt)} · {forecast.source.returnedDays} de {forecast.source.requestedDays} dias.
          </span>
        </p>
        <nav aria-label="Outras previsões de Pelotas">
          <Link to="/previsao-7-dias-pelotas">7 dias</Link>
          <Link to="/tempo-amanha-pelotas">Amanhã</Link>
          <Link to="/chuva-em-pelotas">Chuva</Link>
          <Link to="/vento-em-pelotas">Vento</Link>
        </nav>
      </footer>
    </div>
  );
}
