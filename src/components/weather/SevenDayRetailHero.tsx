import { Link } from "@tanstack/react-router";
import {
  CalendarRange,
  CloudRain,
  ShieldAlert,
  Thermometer,
  Wind,
} from "lucide-react";

import { WeatherIcon } from "@/production/components/weather-icon";
import { weatherConditionLabels } from "@/production/lib/hero-weather-presentation";
import type { DailyForecast, WeatherData, WeatherIconName } from "@/production/lib/weather-data";
import type { AdvisoryLevel } from "@/production/lib/weather-insights";

import "./SevenDayRetailHero.css";

type SevenDayRetailHeroProps = {
  weather: WeatherData;
  advisoryLevel: AdvisoryLevel;
  officialAlertCount?: number;
};

function alertLabel(count: number) {
  if (count === 1) return "1 aviso oficial para Pelotas";
  return `${count} avisos oficiais para Pelotas`;
}

function rainScore(day: DailyForecast) {
  return (day.rainChance ?? 0) + day.precipitation * 4;
}

function riskScore(day: DailyForecast) {
  return rainScore(day) + (day.windGust ?? 0) * 0.7;
}

function chooseWeekIcon(days: DailyForecast[]): WeatherIconName {
  if (days.length === 0) return "cloud";

  const highlighted = days.reduce((current, day) =>
    riskScore(day) > riskScore(current) ? day : current,
  );

  if ((highlighted.rainChance ?? 0) >= 50 || highlighted.precipitation >= 5) {
    return highlighted.icon === "storm" ? "storm" : "rain";
  }

  return days[0]?.icon ?? "cloud";
}

function strongestGust(days: DailyForecast[]) {
  const available = days.filter((day) => day.windGust !== null);
  if (!available.length) return null;
  return available.reduce((current, day) =>
    (day.windGust ?? -1) > (current.windGust ?? -1) ? day : current,
  );
}

function highestRainChance(days: DailyForecast[]) {
  const available = days.filter((day) => day.rainChance !== null);
  if (!available.length) return null;
  return available.reduce((current, day) =>
    (day.rainChance ?? -1) > (current.rainChance ?? -1) ? day : current,
  );
}

export function SevenDayRetailHero({
  weather,
  advisoryLevel,
  officialAlertCount = 0,
}: SevenDayRetailHeroProps) {
  const days = weather.daily.slice(0, 7);
  const hasDailyForecast = days.length > 0;
  const hasAlert = officialAlertCount > 0;
  const minimum = hasDailyForecast ? Math.min(...days.map((day) => day.min)) : null;
  const maximum = hasDailyForecast ? Math.max(...days.map((day) => day.max)) : null;
  const rainiest = highestRainChance(days);
  const windiest = strongestGust(days);
  const rainyDays = days.filter(
    (day) => (day.rainChance ?? 0) >= 30 || day.precipitation >= 1,
  ).length;
  const iconName = chooseWeekIcon(days);
  const condition = hasDailyForecast
    ? weatherConditionLabels[iconName]
    : "Previsão semanal em atualização";

  return (
    <section
      className={`seven-day-retail-hero seven-day-retail-hero--${advisoryLevel}`}
      aria-labelledby="seven-day-retail-hero-title"
      data-official-alerts={hasAlert ? "true" : "false"}
    >
      <div className="seven-day-retail-hero__inner">
        <div className="seven-day-retail-hero__copy">
          <span className="seven-day-retail-hero__eyebrow">
            <CalendarRange aria-hidden="true" /> Previsão de 7 dias · Pelotas
          </span>

          <h1 id="seven-day-retail-hero-title">Previsão de 7 dias para Pelotas</h1>

          <p>
            {hasDailyForecast
              ? `Temperaturas entre ${minimum}° e ${maximum}°. Compare chuva, vento e a tendência de cada dia da semana.`
              : "A previsão dos próximos 7 dias está em atualização."}
          </p>

          <div className="seven-day-retail-hero__meta" aria-label="Situação da previsão semanal">
            <span>
              <CalendarRange aria-hidden="true" /> {days.length} {days.length === 1 ? "dia disponível" : "dias disponíveis"}
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

        <div className="seven-day-retail-hero__summary">
          <div className="seven-day-retail-hero__condition">
            <span className="seven-day-retail-hero__weather-icon">
              <WeatherIcon name={iconName} title={condition} />
            </span>
            <div>
              <small>Tendência da semana</small>
              <strong>{condition}</strong>
            </div>
          </div>

          <div className="seven-day-retail-hero__facts" aria-label="Destaques dos próximos sete dias">
            <article>
              <span className="seven-day-retail-hero__fact-label">
                <Thermometer aria-hidden="true" /> Temperaturas
              </span>
              <strong>{minimum === null || maximum === null ? "—" : `${minimum}° a ${maximum}°`}</strong>
              <small>Faixa prevista nos próximos dias</small>
            </article>

            <article>
              <span className="seven-day-retail-hero__fact-label">
                <CloudRain aria-hidden="true" /> Chuva
              </span>
              <strong>{rainiest?.rainChance === null || !rainiest ? "—" : `${rainiest.rainChance}%`}</strong>
              <small>
                {!rainiest
                  ? "Chance não informada"
                  : rainyDays === 0
                    ? "Sem destaque de chuva"
                    : `${rainiest.weekday} · ${rainiest.precipitation} mm`}
              </small>
            </article>

            <article>
              <span className="seven-day-retail-hero__fact-label">
                <Wind aria-hidden="true" /> Rajadas
              </span>
              <strong>
                {!windiest
                  ? "—"
                  : (windiest.windGust ?? 0) > 0
                    ? `${windiest.windGust} km/h`
                    : "Sem rajadas"}
              </strong>
              <small>
                {!windiest
                  ? "Não informadas"
                  : (windiest.windGust ?? 0) > 0
                    ? windiest.weekday
                    : "Nos próximos dias"}
              </small>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
