import {
  CloudRain,
  Droplets,
  Gauge,
  ShieldAlert,
  Thermometer,
  Wind,
  type LucideIcon,
} from "lucide-react";

import { WeatherIcon } from "@/production/components/weather-icon";
import {
  resolveHeroWeatherIcon,
  weatherConditionLabels,
} from "@/production/lib/hero-weather-presentation";
import type { WeatherData } from "@/production/lib/weather-data";
import type { AdvisoryLevel } from "@/production/lib/weather-insights";

import "./TodayEditorialHero.css";

type TodayRetailHeroProps = {
  weather: WeatherData;
  advisoryLevel: AdvisoryLevel;
  officialAlertCount?: number;
};

type HeroFact = {
  label: string;
  value: string;
  detail?: string;
  icon: LucideIcon;
};

function formatValue(value: number | null, suffix = "") {
  return value === null ? "—" : `${value}${suffix}`;
}

function formatGust(value: number | null) {
  if (value === null) return "—";
  if (value <= 0) return "Sem rajadas";
  return `${value} km/h`;
}

function formatWind(value: number | null, direction?: string | null) {
  const speed = formatValue(value, " km/h");
  return value !== null && direction ? `${speed} · ${direction}` : speed;
}

function alertLabel(count: number) {
  if (count === 1) return "1 aviso oficial para Pelotas";
  return `${count} avisos oficiais para Pelotas`;
}

function buildObservedFacts(weather: WeatherData): HeroFact[] {
  const current = weather.current;
  return [
    {
      label: "Sensação",
      value: formatValue(current.feelsLike, "°"),
      icon: Thermometer,
    },
    {
      label: "Umidade",
      value: formatValue(current.humidity, "%"),
      icon: Droplets,
    },
    {
      label: "Vento",
      value: formatWind(current.windSpeed, current.windDirection),
      icon: Wind,
    },
  ];
}

function buildForecastFacts(weather: WeatherData): HeroFact[] {
  const nextHour = weather.hourly[0] ?? null;
  if (!nextHour) {
    return [
      { label: "Chuva", value: "—", detail: "Previsão em atualização", icon: CloudRain },
      { label: "Vento", value: "—", detail: "Previsão em atualização", icon: Wind },
      { label: "Rajadas", value: "—", detail: "Previsão em atualização", icon: Gauge },
    ];
  }

  return [
    {
      label: "Chuva",
      value: formatValue(nextHour.precipitation, "%"),
      detail: "Previsão da próxima hora",
      icon: CloudRain,
    },
    {
      label: "Vento",
      value: formatValue(nextHour.windSpeed, " km/h"),
      detail: "Previsão da próxima hora",
      icon: Wind,
    },
    {
      label: "Rajadas",
      value: formatGust(nextHour.windGust),
      detail: "Previsão da próxima hora",
      icon: Gauge,
    },
  ];
}

export function TodayRetailHero({
  weather,
  advisoryLevel,
  officialAlertCount = 0,
}: TodayRetailHeroProps) {
  const current = weather.current;
  const nextHour = weather.hourly[0] ?? null;
  const hasObservedCurrent = current.available && current.source.kind === "observation";
  const hasForecast = nextHour !== null;
  const iconName = hasObservedCurrent
    ? current.icon ?? resolveHeroWeatherIcon(weather)
    : nextHour?.icon ?? resolveHeroWeatherIcon(weather);
  const condition = hasObservedCurrent
    ? current.condition ?? weatherConditionLabels[iconName]
    : hasForecast
      ? weatherConditionLabels[iconName]
      : "Dados meteorológicos em atualização";
  const temperature = hasObservedCurrent ? current.temperature : (nextHour?.temperature ?? null);
  const facts = hasObservedCurrent ? buildObservedFacts(weather) : buildForecastFacts(weather);
  const hasAlert = officialAlertCount > 0;

  return (
    <section
      className={`today-retail-hero today-retail-hero--${advisoryLevel}`}
      aria-labelledby="today-retail-hero-title"
      data-official-alerts={hasAlert ? "true" : "false"}
      data-current-kind={hasObservedCurrent ? "observation" : hasForecast ? "forecast" : "unavailable"}
    >
      <div className="today-retail-hero__inner">
        <div className="today-retail-hero__copy">
          <span className="today-retail-hero__eyebrow">Tempo hoje · Pelotas</span>

          <h1 id="today-retail-hero-title">Tempo hoje em Pelotas</h1>

          <p>
            {hasObservedCurrent
              ? `${condition} agora. A condição atual vem da medição local; máxima, mínima, chuva e os horários seguintes são previsões.`
              : hasForecast
                ? `A medição local está indisponível nesta atualização. A condição abaixo é a previsão da próxima hora e não substitui uma observação atual.`
                : "A medição local e a previsão horária estão em atualização. Nenhum valor demonstrativo é usado enquanto os dados não chegam."}
          </p>

          {hasAlert ? (
            <div className="today-retail-hero__meta" aria-label="Avisos oficiais para hoje">
              <a className="is-alert" href="/alertas">
                <ShieldAlert aria-hidden="true" /> {alertLabel(officialAlertCount)}
              </a>
            </div>
          ) : null}
        </div>

        <div className="today-retail-hero__summary">
          <div className="today-retail-hero__condition">
            <span className="today-retail-hero__weather-icon">
              <WeatherIcon name={iconName} title={condition} />
            </span>
            <div>
              {!hasObservedCurrent ? (
                <small>{hasForecast ? "Previsão da próxima hora" : "Dados em atualização"}</small>
              ) : null}
              <div className="today-retail-hero__temperature-line">
                <strong>{formatValue(temperature, "°")}</strong>
                <span>{condition}</span>
              </div>
            </div>
          </div>

          <div className="today-retail-hero__facts" aria-label={hasObservedCurrent ? "Medições atuais" : "Previsão da próxima hora"}>
            {facts.map((fact) => {
              const Icon = fact.icon;
              return (
                <article key={fact.label}>
                  <span className="today-retail-hero__fact-label">
                    <Icon aria-hidden="true" /> {fact.label}
                  </span>
                  <strong>{fact.value}</strong>
                  {fact.detail ? <small>{fact.detail}</small> : null}
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}