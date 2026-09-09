import { Link } from "@tanstack/react-router";
import {
  CalendarDays,
  CloudRain,
  ShieldAlert,
  Thermometer,
  Wind,
} from "lucide-react";

import { WeatherIcon } from "@/production/components/weather-icon";
import { weatherConditionLabels } from "@/production/lib/hero-weather-presentation";
import type { DailyForecast, WeatherData, WeatherIconName } from "@/production/lib/weather-data";
import type { AdvisoryLevel } from "@/production/lib/weather-insights";

import "./TomorrowRetailHero.css";

type TomorrowRetailHeroProps = {
  weather: WeatherData;
  advisoryLevel: AdvisoryLevel;
  officialAlertCount?: number;
};

function formatValue(value: number | null | undefined, suffix = "") {
  return value === null || value === undefined ? "—" : `${value}${suffix}`;
}

function formatGust(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  if (value <= 0) return "Sem rajadas";
  return `${value} km/h`;
}

function formatTomorrowDate(day: DailyForecast | null) {
  if (!day) return "Data em atualização";
  if (!day.dateIso) return `${day.weekday} · ${day.date}`;

  const parsed = new Date(`${day.dateIso}T12:00:00-03:00`);
  if (Number.isNaN(parsed.getTime())) return `${day.weekday} · ${day.date}`;

  const label = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    timeZone: "America/Sao_Paulo",
  }).format(parsed);

  return label.charAt(0).toUpperCase() + label.slice(1);
}

function alertLabel(count: number) {
  if (count === 1) return "1 aviso oficial para Pelotas";
  return `${count} avisos oficiais para Pelotas`;
}

function rainDetail(day: DailyForecast | null) {
  if (!day) return "Previsão em atualização";
  const chance = day.rainChance === null ? "Chance não informada" : `${day.rainChance}% de chance`;
  return `${chance} · ${formatValue(day.precipitation, " mm")}`;
}

export function TomorrowRetailHero({
  weather,
  advisoryLevel,
  officialAlertCount = 0,
}: TomorrowRetailHeroProps) {
  const tomorrow = weather.daily[1] ?? null;
  const iconName: WeatherIconName = tomorrow?.icon ?? "cloud";
  const condition = tomorrow ? weatherConditionLabels[iconName] : "Previsão em atualização";
  const hasAlert = officialAlertCount > 0;
  const amplitude = tomorrow ? Math.max(0, tomorrow.max - tomorrow.min) : null;

  return (
    <section
      className={`tomorrow-retail-hero tomorrow-retail-hero--${advisoryLevel}`}
      aria-labelledby="tomorrow-retail-hero-title"
      data-official-alerts={hasAlert ? "true" : "false"}
    >
      <div className="tomorrow-retail-hero__inner">
        <div className="tomorrow-retail-hero__copy">
          <span className="tomorrow-retail-hero__eyebrow">
            <CalendarDays aria-hidden="true" /> Tempo amanhã · Pelotas
          </span>

          <h1 id="tomorrow-retail-hero-title">Tempo amanhã em Pelotas</h1>

          <p>
            {tomorrow
              ? `${condition}. Mínima de ${tomorrow.min}° e máxima de ${tomorrow.max}°. Confira chuva, vento e os detalhes previstos para o próximo dia.`
              : "A previsão detalhada de amanhã ainda está sendo atualizada."}
          </p>

          <div className="tomorrow-retail-hero__meta" aria-label="Informações da previsão de amanhã">
            <span>
              <CalendarDays aria-hidden="true" /> {formatTomorrowDate(tomorrow)}
            </span>
            {hasAlert ? (
              <Link className="is-alert" to="/alertas">
                <ShieldAlert aria-hidden="true" /> {alertLabel(officialAlertCount)}
              </Link>
            ) : (
              <span className="is-stable">Sem aviso oficial para Pelotas</span>
            )}
          </div>
        </div>

        <div className="tomorrow-retail-hero__summary" aria-label="Resumo da previsão para amanhã">
          <div className="tomorrow-retail-hero__condition">
            <span className="tomorrow-retail-hero__weather-icon" aria-hidden="true">
              <WeatherIcon name={iconName} title={`Condição prevista para amanhã: ${condition}`} />
            </span>
            <div>
              <small>Condição prevista</small>
              <strong>{condition}</strong>
            </div>
          </div>

          <div className="tomorrow-retail-hero__facts">
            <article>
              <div className="tomorrow-retail-hero__fact-label">
                <Thermometer aria-hidden="true" />
                <span>Temperatura</span>
              </div>
              <strong>
                {formatValue(tomorrow?.min, "°")} a {formatValue(tomorrow?.max, "°")}
              </strong>
              <small>
                {amplitude === null ? "Variação em atualização" : `Variação de ${amplitude}° no dia`}
              </small>
            </article>

            <article>
              <div className="tomorrow-retail-hero__fact-label">
                <CloudRain aria-hidden="true" />
                <span>Chuva</span>
              </div>
              <strong>{formatValue(tomorrow?.rainChance, "%")}</strong>
              <small>{rainDetail(tomorrow)}</small>
            </article>

            <article>
              <div className="tomorrow-retail-hero__fact-label">
                <Wind aria-hidden="true" />
                <span>Rajadas</span>
              </div>
              <strong>{formatGust(tomorrow?.windGust)}</strong>
              <small>Maior rajada prevista para o dia</small>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
