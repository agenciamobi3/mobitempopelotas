import { Link } from "@tanstack/react-router";
import {
  CalendarRange,
  Compass,
  Gauge,
  ShieldAlert,
  TrendingUp,
  Wind,
} from "lucide-react";

import type { WeatherData } from "@/production/lib/weather-data";
import type { AdvisoryLevel } from "@/production/lib/weather-insights";

import "./WindRetailHero.css";

function formatSpeed(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  return `${Math.round(value)} km/h`;
}

function formatGust(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  if (value <= 0) return "Sem rajadas";
  return `${Math.round(value)} km/h`;
}

function alertLabel(count: number) {
  return count === 1 ? "1 aviso oficial" : `${count} avisos oficiais`;
}

export function WindRetailHero({
  weather,
  advisoryLevel,
  officialAlertCount = 0,
}: {
  weather: WeatherData;
  advisoryLevel: AdvisoryLevel;
  officialAlertCount?: number;
}) {
  const hours = weather.hourly.slice(0, 24);
  const days = weather.daily.slice(0, 7);
  const current = weather.current;
  const hasCurrentObservation =
    current.available &&
    current.source.kind === "observation" &&
    current.windSpeed !== null;
  const nextHour = hours[0] ?? null;
  const positiveGustHours = hours.filter((hour) => (hour.windGust ?? 0) > 0);
  const peak = positiveGustHours.reduce<(typeof hours)[number] | null>(
    (selected, hour) =>
      !selected || (hour.windGust ?? -1) > (selected.windGust ?? -1) ? hour : selected,
    null,
  );
  const hasGustForecast = hours.some((hour) => hour.windGust !== null);
  const maximumGust = peak?.windGust ?? (hasGustForecast ? 0 : null);
  const averageSpeed = hours.length
    ? hours.reduce((total, hour) => total + hour.windSpeed, 0) / hours.length
    : null;
  const weeklyGusts = days
    .map((day) => day.windGust)
    .filter((value): value is number => value !== null && value > 0);
  const weeklyMaximum = weeklyGusts.length ? Math.max(...weeklyGusts) : null;
  const hasAlert = officialAlertCount > 0;

  const description = hasCurrentObservation
    ? `Vento medido agora em ${formatSpeed(current.windSpeed)}${current.windDirection ? ` de ${current.windDirection}` : ""}. ${maximumGust === null ? "As rajadas previstas ainda não foram informadas." : maximumGust > 0 ? `A previsão indica rajadas de até ${formatGust(maximumGust)} nas próximas 24 horas.` : "A previsão não indica rajadas positivas nas próximas 24 horas."}`
    : nextHour
      ? `A medição atual do vento está indisponível. A previsão da próxima hora indica ${formatSpeed(nextHour.windSpeed)}${maximumGust === null ? "." : maximumGust > 0 ? `, com rajadas de até ${formatGust(maximumGust)} nas próximas 24 horas.` : ", sem rajadas positivas previstas nas próximas 24 horas."}`
      : "Os dados de vento estão em atualização.";

  const primaryLabel = hasCurrentObservation
    ? "Vento medido agora"
    : nextHour
      ? "Previsão da próxima hora"
      : "Vento em atualização";
  const primaryValue = hasCurrentObservation
    ? formatSpeed(current.windSpeed)
    : nextHour
      ? formatSpeed(nextHour.windSpeed)
      : "—";
  const primaryDetail = hasCurrentObservation
    ? `${current.windDirection ? `Direção ${current.windDirection}` : "Direção não informada"} · ${current.source.name}`
    : nextHour
      ? `${nextHour.time}${nextHour.windGust === null ? " · rajada não informada" : ` · ${formatGust(nextHour.windGust)}`}`
      : "Fonte em atualização";

  return (
    <section
      className={`wind-retail-hero wind-retail-hero--${advisoryLevel}`}
      aria-labelledby="wind-retail-hero-title"
      data-official-alerts={hasAlert ? "true" : "false"}
    >
      <div className="wind-retail-hero__inner">
        <div className="wind-retail-hero__copy">
          <span className="wind-retail-hero__eyebrow">
            <Wind aria-hidden="true" /> Vento e rajadas · Pelotas
          </span>

          <h1 id="wind-retail-hero-title">Vento em Pelotas hoje</h1>
          <p>{description}</p>

          <div className="wind-retail-hero__meta" aria-label="Disponibilidade dos dados de vento">
            <span>
              <CalendarRange aria-hidden="true" /> {hours.length} horas · {days.length} dias
            </span>
            {hasAlert ? (
              <Link className="is-alert" to="/alertas">
                <ShieldAlert aria-hidden="true" /> {alertLabel(officialAlertCount)}
              </Link>
            ) : null}
          </div>
        </div>

        <div className="wind-retail-hero__summary">
          <div className="wind-retail-hero__condition">
            <span className="wind-retail-hero__weather-icon">
              <Wind aria-hidden="true" />
            </span>
            <div>
              <small>{primaryLabel}</small>
              <strong>{primaryValue}</strong>
              <span>{primaryDetail}</span>
            </div>
          </div>

          <div className="wind-retail-hero__facts" aria-label="Resumo do vento em Pelotas">
            <article>
              <span className="wind-retail-hero__fact-label">
                <TrendingUp aria-hidden="true" /> Maior rajada 24 h
              </span>
              <strong>{formatGust(maximumGust)}</strong>
              <small>
                {maximumGust === null
                  ? "Rajadas não informadas"
                  : maximumGust <= 0
                    ? "Sem rajada positiva prevista"
                    : peak
                      ? `Por volta de ${peak.time}`
                      : "Horário em atualização"}
              </small>
            </article>

            <article>
              <span className="wind-retail-hero__fact-label">
                <Gauge aria-hidden="true" /> Média prevista 24 h
              </span>
              <strong>{averageSpeed === null ? "—" : formatSpeed(averageSpeed)}</strong>
              <small>Média das velocidades horárias disponíveis</small>
            </article>

            <article>
              <span className="wind-retail-hero__fact-label">
                <Compass aria-hidden="true" /> Maior rajada em 7 dias
              </span>
              <strong>{formatGust(weeklyMaximum)}</strong>
              <small>{days.length ? "Previsão diária" : "Previsão em atualização"}</small>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
