import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CloudRain,
  Droplets,
  Gauge,
  ShieldAlert,
  Umbrella,
  Wind,
  type LucideIcon,
} from "lucide-react";
import type { CSSProperties } from "react";

import { WeatherIcon } from "@/production/components/weather-icon";
import type { DailyForecast, WeatherData, WeatherIconName } from "@/production/lib/weather-data";
import type { AdvisoryLevel } from "@/production/lib/weather-insights";

import { getRetailWeatherPhoto } from "./today-retail-hero-backgrounds";
import "./TodayRetailHero.css";
import "./TodayRetailHeroPhoto.css";
import "./RainRetailHero.css";

type RainRetailHeroProps = {
  weather: WeatherData;
  advisoryLevel: AdvisoryLevel;
  officialAlertCount?: number;
  observedRainDaily?: number | null;
};

type RetailMetric = {
  label: string;
  value: string;
  detail?: string;
  icon: LucideIcon;
};

function rainScore(day: DailyForecast) {
  return (day.rainChance ?? 0) + day.precipitation * 4;
}

function formatChance(value: number | null | undefined) {
  return value === null || value === undefined ? "—" : `${value}%`;
}

function formatMillimeters(value: number | null | undefined) {
  return value === null || value === undefined
    ? "—"
    : `${value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mm`;
}

function formatGust(value: number | null) {
  if (value === null) return "—";
  if (value <= 0) return "Sem rajadas";
  return `${value} km/h`;
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

function choosePhotoIcon(weather: WeatherData): WeatherIconName {
  const peakHour = weather.hourly.slice(0, 12).reduce<(typeof weather.hourly)[number] | null>(
    (selected, hour) =>
      !selected || (hour.precipitation ?? -1) > (selected.precipitation ?? -1) ? hour : selected,
    null,
  );
  const rainiestDay = weather.daily.slice(0, 7).reduce<DailyForecast | null>(
    (selected, day) => (!selected || rainScore(day) > rainScore(selected) ? day : selected),
    null,
  );

  if ((peakHour?.precipitation ?? 0) >= 40 || (rainiestDay?.precipitation ?? 0) >= 2) {
    return peakHour?.icon === "storm" || rainiestDay?.icon === "storm" ? "storm" : "rain";
  }

  return weather.hourly[0]?.icon ?? weather.daily[0]?.icon ?? "cloud";
}

export function RainRetailHero({
  weather,
  advisoryLevel,
  officialAlertCount = 0,
  observedRainDaily = null,
}: RainRetailHeroProps) {
  const hours = weather.hourly.slice(0, 12);
  const days = weather.daily.slice(0, 7);
  const hasHourlyForecast = hours.length > 0;
  const hasDailyForecast = days.length > 0;
  const hasRainData = hasHourlyForecast || hasDailyForecast || observedRainDaily !== null;
  const today = days[0] ?? null;
  const peakCandidate = hours.reduce<(typeof hours)[number] | null>(
    (selected, hour) =>
      !selected || (hour.precipitation ?? -1) > (selected.precipitation ?? -1) ? hour : selected,
    null,
  );
  const highestRainChance = peakCandidate?.precipitation ?? null;
  const hasPositiveRainChance = (highestRainChance ?? 0) > 0;
  const highestVolumeDay = days.reduce<DailyForecast | null>(
    (selected, day) => (!selected || day.precipitation > selected.precipitation ? day : selected),
    null,
  );
  const hasPositiveRainVolume = (highestVolumeDay?.precipitation ?? 0) > 0;
  const wetHours = hours.filter((hour) => (hour.precipitation ?? 0) >= 30).length;
  const totalRain = days.reduce((total, day) => total + day.precipitation, 0);
  const wetGusts = hours
    .filter((hour) => (hour.precipitation ?? 0) >= 30 && hour.windGust !== null)
    .map((hour) => hour.windGust as number);
  const strongestWetGust = wetGusts.length ? Math.max(...wetGusts) : null;
  const iconName = choosePhotoIcon(weather);
  const photo = getRetailWeatherPhoto(iconName, advisoryLevel);
  const photoStyle = {
    "--today-retail-hero-photo": `url("${photo.src}")`,
    "--today-retail-hero-position": photo.position,
  } as CSSProperties;
  const hasAlert = officialAlertCount > 0;
  const metrics: RetailMetric[] = [
    {
      label: "Medido",
      value: observedRainDaily === null ? "Em atualização" : formatMillimeters(observedRainDaily),
      detail: "Embrapa",
      icon: Gauge,
    },
    {
      label: "Hoje previsto",
      value: formatMillimeters(today?.precipitation),
      icon: Droplets,
    },
    {
      label: "7 dias",
      value: hasDailyForecast ? formatMillimeters(totalRain) : "—",
      icon: CloudRain,
    },
  ];

  const description = hasHourlyForecast && hasDailyForecast
    ? `${wetHours} ${wetHours === 1 ? "horário tem" : "horários têm"} 30% ou mais de chance nas próximas 12 horas. Veja o que já choveu e o que ainda está previsto.`
    : hasHourlyForecast
      ? "A chance por horário está disponível. O volume diário ainda está em atualização."
      : hasDailyForecast
        ? "A previsão diária está disponível. A chance por horário ainda está em atualização."
        : observedRainDaily !== null
          ? "A chuva medida está disponível enquanto a previsão é atualizada."
          : "Os dados de chuva estão em atualização.";

  const hourlyChanceLabel = highestRainChance === null
    ? "Chance em atualização"
    : hasPositiveRainChance
      ? "Maior chance nas próximas 12 horas"
      : "Sem chuva destacada nas próximas 12 horas";
  const hourlyChanceDetail = highestRainChance === null
    ? "Horário em atualização"
    : hasPositiveRainChance
      ? timeReference(peakCandidate?.time)
      : "Sem horário de destaque";

  return (
    <section
      className={`today-retail-hero rain-retail-hero today-retail-hero--${advisoryLevel}`}
      aria-labelledby="rain-retail-hero-title"
      data-official-alerts={hasAlert ? "true" : "false"}
      data-weather-photo={iconName}
    >
      <div className="today-retail-hero__inner rain-retail-hero__inner">
        <div className="today-retail-hero__copy rain-retail-hero__copy">
          <h1 id="rain-retail-hero-title">
            Chuva em Pelotas <span>hoje</span>
          </h1>

          <p>{description}</p>

          {hasAlert ? (
            <div className="today-retail-hero__badges" aria-label="Avisos oficiais de chuva">
              <Link className="is-alert" to="/alertas">
                <ShieldAlert aria-hidden="true" /> {alertLabel(officialAlertCount)}
              </Link>
            </div>
          ) : null}

          <div className="today-retail-hero__actions">
            <a className="today-retail-hero__primary" href="#chuva-acumulada">
              Ver medido e previsto <ArrowRight aria-hidden="true" />
            </a>

            {hasHourlyForecast ? (
              <a className="today-retail-hero__secondary" href="#chuva-por-hora">
                Ver próximas horas
              </a>
            ) : (
              <Link className="today-retail-hero__secondary" to="/previsao-7-dias-pelotas">
                Ver 7 dias
              </Link>
            )}
          </div>
        </div>

        <div className="today-retail-hero__showcase rain-retail-hero__showcase">
          <article
            className="today-retail-hero__current rain-retail-hero__current"
            style={photoStyle}
            aria-label={hasRainData ? "Chuva medida e prevista em Pelotas" : "Dados de chuva em atualização em Pelotas"}
          >
            <div
              className="today-retail-hero__current-photo"
              role="img"
              aria-label={hasRainData ? photo.alt : "Imagem ilustrativa da previsão meteorológica de Pelotas"}
            />

            <div className="today-retail-hero__current-content">
              <header>
                <div>
                  <span>Pelotas, RS</span>
                  <small>Chuva</small>
                </div>
                <b><i aria-hidden="true" /> Hoje</b>
              </header>

              <div className="today-retail-hero__current-main">
                <div className="today-retail-hero__weather-icon">
                  <WeatherIcon
                    name={iconName}
                    title={hasPositiveRainChance ? "Condição associada à maior chance de chuva" : "Previsão de chuva em Pelotas"}
                  />
                </div>
                <div>
                  <strong>{formatChance(highestRainChance)}</strong>
                  <span>{hourlyChanceLabel}</span>
                  <small>{hourlyChanceDetail}</small>
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
                        {metric.detail ? <em>{metric.detail}</em> : null}
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

          <div className="today-retail-hero__tiles rain-retail-hero__tiles" aria-label="Destaques da chuva">
            <article className="is-rain">
              <span><CloudRain aria-hidden="true" /> Maior chance</span>
              <strong>{formatChance(highestRainChance)}</strong>
              <small>{hourlyChanceDetail}</small>
            </article>
            <article>
              <span><Umbrella aria-hidden="true" /> Maior volume</span>
              <strong>{hasPositiveRainVolume ? highestVolumeDay?.weekday : hasDailyForecast ? "Sem volume previsto" : "—"}</strong>
              <small>{hasPositiveRainVolume ? formatMillimeters(highestVolumeDay?.precipitation) : hasDailyForecast ? "Próximos 7 dias" : "Em atualização"}</small>
            </article>
            <article className="is-wind">
              <span><Wind aria-hidden="true" /> Rajada com chuva</span>
              <strong>{formatGust(strongestWetGust)}</strong>
            </article>
            <article className="is-sun">
              <span><Gauge aria-hidden="true" /> Fonte</span>
              <strong>{weather.source.forecastName ?? weather.source.name}</strong>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
