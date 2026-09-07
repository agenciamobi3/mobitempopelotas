import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Clock3,
  Compass,
  Database,
  Info,
  Navigation,
  TrendingUp,
  Waves,
  Wind,
} from "lucide-react";

import type { WeatherSourceKey } from "@/lib/weather/aggregated-weather.types";
import type { HourlyForecast } from "@/lib/weather/types";
import type { WeatherIntelligenceData } from "@/lib/weather/weather-intelligence.types";
import { useOpenMeteoIntelligenceRecovery } from "@/production/lib/open-meteo-browser-recovery";

import "./WindForecastPageV3.css";

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
  if (value <= 0) return "Sem rajadas";
  return `${number(value)} km/h`;
}

function sourceName(source: WeatherSourceKey | null | undefined) {
  if (source === "embrapa") return "Estação Embrapa";
  if (source === "open-meteo") return "Open-Meteo";
  if (source === "met-norway") return "MET Norway";
  if (source === "inmet") return "INMET";
  if (source === "cppmet") return "CPPMet/UFPel";
  return "Fonte não identificada";
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
    <section className="wind-v3-empty" aria-labelledby="wind-v3-empty-title">
      <Wind aria-hidden="true" />
      <div>
        <h2 id="wind-v3-empty-title">Os dados de vento estão em atualização</h2>
        <p>Ainda não há velocidade ou rajadas suficientes para mostrar esta página.</p>
        <Link to="/tempo-hoje-pelotas">Ver o tempo de hoje</Link>
      </div>
    </section>
  );
}

export function WindForecastPageV3({ data }: { data: WeatherIntelligenceData }) {
  const recovered = useOpenMeteoIntelligenceRecovery(data);
  const weather = recovered.weather;
  const current = weather.current;

  if (!current && weather.hourly.length === 0 && weather.daily.length === 0) return <EmptyWindPage />;

  const hours = weather.hourly.slice(0, 24);
  const days = weather.daily.slice(0, 7);
  const windSource = weather.currentProvenance.windSpeed ?? null;
  const directionSource = weather.currentProvenance.windDirection ?? null;
  const provider = weather.quality.forecastProvider ?? sourceName(weather.quality.forecastSource);
  const publishedGustHours = hours.filter((hour) => hour.windGust !== null);
  const topHours = peakHours(hours);
  const maximumScale = Math.max(1, ...hours.map((hour) => Math.max(hour.windSpeed, hour.windGust ?? 0)));
  const dailyMaximum = Math.max(1, ...days.map((day) => day.windGust ?? 0));

  return (
    <div className="wind-v3-page">
      <nav className="wind-v3-chapters" aria-label="Navegação da página de vento">
        <a href="#procedencia"><strong>Origem</strong><small>Agora e previsão</small></a>
        {hours.length ? (
          <a href="#vento-por-hora"><strong>24 horas</strong><small>Vento e rajadas</small></a>
        ) : (
          <Link to="/previsao-7-dias-pelotas"><strong>7 dias</strong><small>Previsão disponível</small></Link>
        )}
        <a href="#maiores-valores"><strong>Rajadas fortes</strong><small>Maiores valores</small></a>
        <a href="#vento-na-semana"><strong>7 dias</strong><small>Rajadas por dia</small></a>
        <a href="#direcao-do-vento-por-hora"><strong>Direção</strong><small>Previsão por horário</small></a>
      </nav>

      <section className="wind-v3-source" id="procedencia" aria-labelledby="wind-v3-source-title">
        <Database aria-hidden="true" />
        <div>
          <h2 id="wind-v3-source-title">Vento atual e previsão</h2>
          <p>Vento agora: {sourceName(windSource)}. Direção agora: {sourceName(directionSource)}. Próximas horas: {provider}.</p>
        </div>
        <dl>
          <div><dt>Vento atual</dt><dd>{current?.windSpeed === null || current?.windSpeed === undefined ? "—" : `${number(current.windSpeed)} km/h`}</dd></div>
          <div><dt>Direção</dt><dd>{current?.windDirection ?? "Não informada"}</dd></div>
          <div><dt>Horário</dt><dd>{formatDateTime(current?.observedAt)}</dd></div>
        </dl>
      </section>

      {hours.length ? (
        <section className="wind-v3-section" id="vento-por-hora" aria-labelledby="wind-v3-hourly-title">
          <header className="wind-v3-heading">
            <div><h2 id="wind-v3-hourly-title">Vento e rajadas nas próximas 24 horas</h2></div>
          </header>
          <div className="wind-v3-hourly-head" aria-hidden="true">
            <span>Hora</span><span>Vento</span><span>Rajada</span><span>Diferença</span><span>Comparação</span>
          </div>
          <div className="wind-v3-hourly-list">
            {hours.map((hour, index) => {
              const difference = spread(hour);
              return (
                <article key={`${hour.timestamp ?? hour.time}-${index}`}>
                  <time dateTime={hour.timestamp}>{hour.time}</time>
                  <strong>{number(hour.windSpeed)} km/h</strong>
                  <b>{gust(hour.windGust)}</b>
                  <small>{difference === null ? "—" : `+${number(difference)} km/h`}</small>
                  <div className="wind-v3-bars" aria-label={`Vento ${number(hour.windSpeed)} km/h; rajada ${gust(hour.windGust)}`}>
                    <i><span style={{ width: `${Math.max(3, hour.windSpeed / maximumScale * 100)}%` }} /></i>
                    <i><span style={{ width: `${hour.windGust === null || hour.windGust <= 0 ? 0 : Math.max(3, hour.windGust / maximumScale * 100)}%` }} /></i>
                  </div>
                </article>
              );
            })}
          </div>
          <div className="wind-v3-legend"><span><i className="is-speed" />Vento</span><span><i className="is-gust" />Rajada</span></div>
        </section>
      ) : null}

      <section className="wind-v3-section" id="maiores-valores" aria-labelledby="wind-v3-peaks-title">
        <header className="wind-v3-heading"><div><h2 id="wind-v3-peaks-title">Rajadas mais fortes</h2></div></header>
        {topHours.length ? (
          <div className="wind-v3-peaks-grid">
            {topHours.map((hour) => (
              <article key={`${hour.timestamp ?? hour.time}-peak`}>
                <Clock3 aria-hidden="true" />
                <h3>{hour.time}</h3>
                <dl>
                  <div><dt>Vento</dt><dd>{number(hour.windSpeed)} km/h</dd></div>
                  <div><dt>Rajada</dt><dd>{gust(hour.windGust)}</dd></div>
                </dl>
              </article>
            ))}
          </div>
        ) : (
          <p>{publishedGustHours.length ? "Sem rajadas positivas previstas nas próximas 24 horas." : "As rajadas ainda não foram informadas."}</p>
        )}
      </section>

      {days.length ? (
        <section className="wind-v3-section" id="vento-na-semana" aria-labelledby="wind-v3-week-title">
          <header className="wind-v3-heading">
            <div><h2 id="wind-v3-week-title">Rajadas nos próximos 7 dias</h2></div>
            <Link to="/previsao-7-dias-pelotas">Ver previsão de 7 dias</Link>
          </header>
          <div className="wind-v3-week-list">
            {days.map((day) => (
              <article key={`${day.weekday}-${day.date}`}>
                <div><strong>{day.weekday}</strong><span>{day.date}</span></div>
                <Wind aria-hidden="true" />
                <div className="wind-v3-week-track" aria-label={`Rajada prevista de ${gust(day.windGust)}`}>
                  <span style={{ width: `${day.windGust === null || day.windGust <= 0 ? 0 : Math.max(4, day.windGust / dailyMaximum * 100)}%` }} />
                </div>
                <strong>{gust(day.windGust)}</strong>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="wind-v3-interpretation">
        <Navigation aria-hidden="true" />
        <div>
          <h2>O vento varia conforme o local</h2>
          <p>Orla, áreas abertas, pontes, árvores e construções podem alterar o vento sentido no ponto onde você está.</p>
        </div>
        <div>
          <Link to="/radar-e-satelite-pelotas"><Waves aria-hidden="true" /> Radar e satélite</Link>
          <Link to="/alertas"><Compass aria-hidden="true" /> Avisos oficiais</Link>
        </div>
      </section>

      <footer className="wind-v3-note">
        <Info aria-hidden="true" />
        <p>Atualizado em {formatDateTime(weather.source.fetchedAt)} · Vento atual: {sourceName(windSource)} · Direção atual: {sourceName(directionSource)} · Previsão: {provider}.</p>
        <Link to="/metodologia">Metodologia</Link>
      </footer>
    </div>
  );
}
