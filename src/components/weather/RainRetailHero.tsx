import { Link } from "@tanstack/react-router";
import {
  CalendarRange,
  CloudRain,
  Droplets,
  Gauge,
  ShieldAlert,
} from "lucide-react";

import { WeatherIcon } from "@/production/components/weather-icon";
import type { DailyForecast, WeatherData } from "@/production/lib/weather-data";
import type { AdvisoryLevel } from "@/production/lib/weather-insights";

import "./RainRetailHero.css";

type RainRetailHeroProps = {
  weather: WeatherData;
  advisoryLevel: AdvisoryLevel;
  officialAlertCount?: number;
  observedRain24h?: number | null;
};

function formatChance(value: number | null | undefined) {
  return value === null || value === undefined ? "—" : `${value}%`;
}

function formatMillimeters(value: number | null | undefined) {
  return value === null || value === undefined
    ? "—"
    : `${value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mm`;
}

function timeReference(value: string | null | undefined) {
  if (!value) return "Horário em atualização";
  const normalized = value.trim().toLocaleLowerCase("pt-BR");
  if (normalized === "agora") return "Agora";
  if (normalized === "próxima hora") return "Na próxima hora";
  return `Por volta de ${value}`;
}

function alertLabel(count: number) {
  return count === 1 ? "1 aviso oficial" : `${count} avisos oficiais`;
}

function highestVolumeDay(days: DailyForecast[]) {
  if (!days.length) return null;
  return days.reduce((selected, day) =>
    day.precipitation > selected.precipitation ? day : selected,
  );
}

export function RainRetailHero({
  weather,
  advisoryLevel,
  officialAlertCount = 0,
  observedRain24h = null,
}: RainRetailHeroProps) {
  const hours = weather.hourly.slice(0, 12);
  const days = weather.daily.slice(0, 7);
  const hasHourlyForecast = hours.length > 0;
  const hasDailyForecast = days.length > 0;
  const today = days[0] ?? null;
  const peakCandidate = hours.reduce<(typeof hours)[number] | null>(
    (selected, hour) =>
      !selected || (hour.precipitation ?? -1) > (selected.precipitation ?? -1)
        ? hour
        : selected,
    null,
  );
  const highestRainChance = peakCandidate?.precipitation ?? null;
  const hasPositiveRainChance = (highestRainChance ?? 0) > 0;
  const wetHours = hours.filter((hour) => (hour.precipitation ?? 0) >= 30).length;
  const totalRain = days.reduce((total, day) => total + day.precipitation, 0);
  const wettestDay = highestVolumeDay(days);
  const iconName = peakCandidate?.icon ?? today?.icon ?? "cloud";
  const hasAlert = officialAlertCount > 0;

  const description = hasHourlyForecast && hasDailyForecast
    ? `${wetHours} ${wetHours === 1 ? "horário tem" : "horários têm"} 30% ou mais de chance nas próximas 12 horas. Compare a chuva medida nas últimas 24 horas com o volume que ainda está previsto.`
    : hasHourlyForecast
      ? "A chance de chuva por horário está disponível. O volume diário previsto ainda está em atualização."
      : hasDailyForecast
        ? "A previsão diária de chuva está disponível. A chance por horário ainda está em atualização."
        : observedRain24h !== null
          ? "A chuva medida nas últimas 24 horas está disponível enquanto a previsão é atualizada."
          : "Os dados de chuva estão em atualização.";

  const chanceLabel = highestRainChance === null
    ? "Chance em atualização"
    : hasPositiveRainChance
      ? "Maior chance nas próximas 12 horas"
      : "Sem chuva destacada nas próximas 12 horas";
  const chanceDetail = highestRainChance === null
    ? "Horário em atualização"
    : hasPositiveRainChance
      ? timeReference(peakCandidate?.time)
      : "Sem horário de destaque";

  return (
    <section
      className={`rain-retail-hero rain-retail-hero--${advisoryLevel}`}
      aria-labelledby="rain-retail-hero-title"
      data-official-alerts={hasAlert ? "true" : "false"}
    >
      <div className="rain-retail-hero__inner">
        <div className="rain-retail-hero__copy">
          <span className="rain-retail-hero__eyebrow">
            <CloudRain aria-hidden="true" /> Chuva e precipitação · Pelotas
          </span>

          <h1 id="rain-retail-hero-title">Chuva em Pelotas hoje</h1>
          <p>{description}</p>

          <div className="rain-retail-hero__meta" aria-label="Disponibilidade dos dados de chuva">
            <span>
              <CalendarRange aria-hidden="true" /> {hours.length} horários · {days.length} dias
            </span>
            {hasAlert ? (
              <Link className="is-alert" to="/alertas">
                <ShieldAlert aria-hidden="true" /> {alertLabel(officialAlertCount)}
              </Link>
            ) : null}
          </div>
        </div>

        <div className="rain-retail-hero__summary">
          <div className="rain-retail-hero__condition">
            <span className="rain-retail-hero__weather-icon">
              <WeatherIcon name={iconName} title={chanceLabel} />
            </span>
            <div>
              <small>{chanceLabel}</small>
              <strong>{formatChance(highestRainChance)}</strong>
              <span>{chanceDetail}</span>
            </div>
          </div>

          <div className="rain-retail-hero__facts" aria-label="Resumo da chuva em Pelotas">
            <article>
              <span className="rain-retail-hero__fact-label">
                <Gauge aria-hidden="true" /> Medido em 24 h
              </span>
              <strong>{observedRain24h === null ? "—" : formatMillimeters(observedRain24h)}</strong>
              <small>
                {observedRain24h === null
                  ? "Medição em atualização"
                  : "Defesa Civil RS · janela móvel"}
              </small>
            </article>

            <article>
              <span className="rain-retail-hero__fact-label">
                <Droplets aria-hidden="true" /> Hoje previsto
              </span>
              <strong>{formatMillimeters(today?.precipitation)}</strong>
              <small>Volume previsto para hoje</small>
            </article>

            <article>
              <span className="rain-retail-hero__fact-label">
                <CloudRain aria-hidden="true" /> Próximos 7 dias
              </span>
              <strong>{hasDailyForecast ? formatMillimeters(totalRain) : "—"}</strong>
              <small>
                {!hasDailyForecast
                  ? "Previsão em atualização"
                  : !wettestDay || wettestDay.precipitation <= 0
                    ? "Sem volume acumulado previsto"
                    : `Maior volume em ${wettestDay.weekday}: ${formatMillimeters(wettestDay.precipitation)}`}
              </small>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
