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

import "./TodayRetailHero.css";

type TodayRetailHeroProps = {
  weather: WeatherData;
  advisoryLevel: AdvisoryLevel;
  officialAlertCount?: number;
};

type HeroFact = {
  label: string;
  value: string;
  detail: string;
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

function extractClock(value: string | null | undefined) {
  if (!value) return null;
  const matches = value.match(/\b(?:[01]?\d|2[0-3]):[0-5]\d\b/g);
  return matches?.[0] ?? null;
}

function updateLabel(weather: WeatherData) {
  const updateValue = weather.current.observedAt ?? weather.current.updatedAt ?? weather.source.name;
  const clock = extractClock(updateValue);
  if (clock) return `Leitura das ${clock}`;
  return weather.current.available ? "Leitura recente" : "Medição local indisponível";
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
      detail: "Medição atual",
      icon: Thermometer,
    },
    {
      label: "Umidade",
      value: formatValue(current.humidity, "%"),
      detail: "Medição atual",
      icon: Droplets,
    },
    {
      label: "Vento",
      value: formatWind(current.windSpeed, current.windDirection),
      detail: "Medição atual",
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
  const sourceName = hasObservedCurrent
    ? current.source.name
    : weather.source.forecastName ?? weather.source.name;

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

          <div className="today-retail-hero__meta" aria-label="Situação dos dados de hoje">
            <span>{updateLabel(weather)}</span>
            {hasAlert ? (
              <a className="is-alert" href="/alertas">
                <ShieldAlert aria-hidden="true" /> {alertLabel(officialAlertCount)}
              </a>
            ) : (
              <span className="is-stable">Sem aviso oficial listado para Pelotas</span>
            )}
          </div>
        </div>

        <div className="today-retail-hero__summary">
          <div className="today-retail-hero__condition">
            <span className="today-retail-hero__weather-icon">
              <WeatherIcon name={iconName} title={condition} />
            </span>
            <div>
              <small>{hasObservedCurrent ? "Leitura atual" : hasForecast ? "Previsão da próxima hora" : "Dados atuais"}</small>
              <div className="today-retail-hero__temperature-line">
                <strong>{formatValue(temperature, "°")}</strong>
                <span>{condition}</span>
              </div>
              <em>Fonte: {sourceName}</em>
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
                  <small>{fact.detail}</small>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
