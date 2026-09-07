import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CalendarRange,
  CloudRain,
  Gauge,
  Thermometer,
  Wind,
  type LucideIcon,
} from "lucide-react";
import type { CSSProperties } from "react";

import type { ExtendedForecastData } from "@/lib/weather/extended-forecast.types";
import type { DailyForecast } from "@/lib/weather/types";
import type { AdvisoryLevel } from "@/production/lib/weather-insights";

import { getRetailWeatherPhoto } from "./today-retail-hero-backgrounds";
import "./TodayRetailHero.css";
import "./TodayRetailHeroPhoto.css";
import "./FifteenDayForecastHero.css";

type RetailMetric = {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
};

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

function formatMillimeters(value: number) {
  return `${value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mm`;
}

function formatGust(value: number | null) {
  if (value === null) return "—";
  if (value <= 0) return "Sem rajadas";
  return `${value} km/h`;
}

function rainScore(day: DailyForecast) {
  return (day.rainChance ?? 0) + day.precipitationMm * 4;
}

function highestRainChance(days: DailyForecast[]) {
  const informed = days.filter((day) => day.rainChance !== null);
  if (informed.length === 0) return null;
  return informed.reduce((selected, day) =>
    (day.rainChance ?? -1) > (selected.rainChance ?? -1) ? day : selected,
  );
}

function strongestGustDay(days: DailyForecast[]) {
  const informed = days.filter((day) => day.windGust !== null);
  if (informed.length === 0) return null;
  return informed.reduce((selected, day) =>
    (day.windGust ?? -1) > (selected.windGust ?? -1) ? day : selected,
  );
}

function buildMetrics(days: DailyForecast[], updatedAt: string): RetailMetric[] {
  const rainiest = highestRainChance(days);
  const windiest = strongestGustDay(days);

  return [
    {
      label: "Chuva",
      value: rainiest?.rainChance === null || !rainiest ? "—" : `${rainiest.rainChance}%`,
      detail: rainiest?.weekday ?? "não informada",
      icon: CloudRain,
    },
    {
      label: "Rajadas",
      value: formatGust(windiest?.windGust ?? null),
      detail: windiest?.weekday ?? "não informadas",
      icon: Wind,
    },
    {
      label: "Atualizado",
      value: formatDateTime(updatedAt),
      detail: "Open-Meteo",
      icon: Gauge,
    },
  ];
}

export function FifteenDayForecastHero({
  forecast,
  advisoryLevel,
}: {
  forecast: ExtendedForecastData;
  advisoryLevel: AdvisoryLevel;
}) {
  const days = forecast.days.slice(0, 15);
  const hasDays = days.length > 0;
  const minimum = hasDays ? Math.min(...days.map((day) => day.min)) : null;
  const maximum = hasDays ? Math.max(...days.map((day) => day.max)) : null;
  const warmest = hasDays
    ? days.reduce((selected, day) => (day.max > selected.max ? day : selected))
    : null;
  const coldest = hasDays
    ? days.reduce((selected, day) => (day.min < selected.min ? day : selected))
    : null;
  const wettest = hasDays
    ? days.reduce((selected, day) =>
        rainScore(day) > rainScore(selected) ? day : selected,
      )
    : null;
  const lastDay = days.at(-1) ?? null;
  const rainyDays = days.filter(
    (day) => (day.rainChance ?? 0) >= 30 || day.precipitationMm >= 1,
  ).length;
  const iconName = days[0]?.icon ?? "cloud";
  const photo = getRetailWeatherPhoto(iconName, advisoryLevel);
  const photoStyle = {
    "--today-retail-hero-photo": `url("${photo.src}")`,
    "--today-retail-hero-position": photo.position,
  } as CSSProperties;
  const metrics = buildMetrics(days, forecast.source.fetchedAt);

  return (
    <section
      className={`today-retail-hero fifteen-day-retail-hero today-retail-hero--${advisoryLevel}`}
      aria-labelledby="fifteen-day-retail-hero-title"
      data-weather-photo={iconName}
    >
      <div className="today-retail-hero__inner fifteen-day-retail-hero__inner">
        <div className="today-retail-hero__copy fifteen-day-retail-hero__copy">
          <h1 id="fifteen-day-retail-hero-title">
            Previsão de <span>15 dias</span> para Pelotas
          </h1>

          <p>
            {hasDays
              ? `Temperaturas entre ${minimum}° e ${maximum}°. Veja chuva e rajadas dia a dia. A segunda semana pode mudar mais.`
              : "A previsão estendida está em atualização. Veja a previsão de 7 dias enquanto os próximos dias são carregados."}
          </p>

          <div className="today-retail-hero__badges" aria-label="Situação da previsão estendida">
            <span>{hasDays ? `${days.length} de 15 dias disponíveis` : "Previsão em atualização"}</span>
            {forecast.status === "partial" ? <span>Janela parcial</span> : null}
          </div>

          <div className="today-retail-hero__actions">
            {hasDays ? (
              <>
                <a className="today-retail-hero__primary" href="#previsao-15-dias-dia-a-dia">
                  Ver dia a dia <ArrowRight aria-hidden="true" />
                </a>
                <Link className="today-retail-hero__secondary" to="/previsao-7-dias-pelotas">
                  Ver 7 dias
                </Link>
              </>
            ) : (
              <Link className="today-retail-hero__primary" to="/previsao-7-dias-pelotas">
                Ver previsão de 7 dias <ArrowRight aria-hidden="true" />
              </Link>
            )}
          </div>
        </div>

        <div className="today-retail-hero__showcase fifteen-day-retail-hero__showcase">
          <article
            className="today-retail-hero__current fifteen-day-retail-hero__current"
            style={photoStyle}
            aria-label="Resumo da previsão dos próximos 15 dias em Pelotas"
          >
            <div
              className="today-retail-hero__current-photo"
              role="img"
              aria-label={photo.alt}
            />

            <div className="today-retail-hero__current-content">
              <header>
                <div>
                  <span>Pelotas, RS</span>
                  <small>Previsão estendida</small>
                </div>
                <b>
                  <i aria-hidden="true" /> {hasDays ? `${days.length} dias` : "Atualizando"}
                </b>
              </header>

              <div className="today-retail-hero__current-main">
                <div className="today-retail-hero__weather-icon">
                  <CalendarRange aria-hidden="true" />
                </div>
                <div>
                  <strong>{minimum === null || maximum === null ? "—" : `${minimum}°–${maximum}°`}</strong>
                  <span>Faixa de temperatura</span>
                  <small>
                    {lastDay
                      ? `Até ${lastDay.date} · ${rainyDays} ${rainyDays === 1 ? "dia" : "dias"} com sinal de chuva`
                      : "Dias ainda não disponíveis"}
                  </small>
                </div>
              </div>

              <div className="today-retail-hero__current-metrics">
                {metrics.map((metric) => {
                  const Icon = metric.icon;
                  return (
                    <div key={metric.label}>
                      <Icon aria-hidden="true" />
                      <span>
                        <small>{metric.label}</small>
                        <strong>{metric.value}</strong>
                        <em>{metric.detail}</em>
                      </span>
                    </div>
                  );
                })}
              </div>

              <a
                className="today-retail-hero__photo-credit"
                href={photo.sourceHref}
                target="_blank"
                rel="noreferrer"
              >
                Foto: {photo.credit}
              </a>
            </div>
          </article>

          <div className="today-retail-hero__tiles fifteen-day-retail-hero__tiles" aria-label="Destaques dos próximos 15 dias">
            <article className="is-maximum">
              <span><Thermometer aria-hidden="true" /> Maior máxima</span>
              <strong>{warmest ? `${warmest.max}°` : "—"}</strong>
              <small>{warmest?.weekday ?? "Em atualização"}</small>
            </article>

            <article className="is-rain">
              <span><CloudRain aria-hidden="true" /> Maior volume de chuva</span>
              <strong>{wettest && wettest.precipitationMm > 0 ? formatMillimeters(wettest.precipitationMm) : "Sem volume"}</strong>
              <small>{wettest && wettest.precipitationMm > 0 ? wettest.weekday : "nos dias disponíveis"}</small>
            </article>

            <article className="is-cold">
              <span><Thermometer aria-hidden="true" /> Menor mínima</span>
              <strong>{coldest ? `${coldest.min}°` : "—"}</strong>
              <small>{coldest?.weekday ?? "Em atualização"}</small>
            </article>

            <article className="is-source">
              <span><Gauge aria-hidden="true" /> Fonte</span>
              <strong>{forecast.source.model}</strong>
              <small>{forecast.source.returnedDays} de {forecast.source.requestedDays} dias</small>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
