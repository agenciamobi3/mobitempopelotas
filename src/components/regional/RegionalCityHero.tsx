import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, CloudRain } from "lucide-react";

import { WeatherSplitHero, type WeatherSplitHeroTone } from "@/components/weather/WeatherSplitHero";
import { selectPriorityRegionalAlert } from "@/lib/weather/regional-alert-priority";
import type { RegionalCityWeatherData } from "@/lib/weather/regional-city-weather.types";
import { WeatherIcon } from "@/production/components/weather-icon";

import "./RegionalCityHero.css";
import { formatRegionalDateTime, formatRegionalHour } from "./regional-time-format";
import { regionalWeatherIcon } from "./regional-weather-presentation";

const regionalNumberFormat = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 1,
});

function metric(value: number | null, suffix = "") {
  return value === null || !Number.isFinite(value)
    ? "—"
    : `${regionalNumberFormat.format(value)}${suffix}`;
}

function gustMetric(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "Não informada";
  if (value <= 0) return "Sem rajadas";
  return `${regionalNumberFormat.format(value)} km/h`;
}

function windMetric(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "Não informado";
  if (value <= 0) return "Calmo";
  return `${regionalNumberFormat.format(value)} km/h`;
}

function maximum(values: Array<number | null>) {
  const usable = values.filter((value): value is number => value !== null && Number.isFinite(value));
  return usable.length > 0 ? Math.max(...usable) : null;
}

function sentenceCondition(value: string) {
  const normalized = value.trim();
  if (!normalized) return "condição em atualização";
  return normalized.charAt(0).toLocaleLowerCase("pt-BR") + normalized.slice(1);
}

function heroTone(data: RegionalCityWeatherData): WeatherSplitHeroTone {
  const alert = selectPriorityRegionalAlert(data.alerts.items);
  const rain = maximum(data.hourly.slice(0, 24).map((hour) => hour.rainChance));
  const gust = maximum(data.hourly.slice(0, 24).map((hour) => hour.windGust));

  if (alert?.severity === "great-danger" || alert?.severity === "danger") return "strong";
  if (alert?.severity === "potential") return "elevated";
  if ((rain ?? 0) >= 80 || (gust ?? 0) >= 70) return "strong";
  if ((rain ?? 0) >= 50 || (gust ?? 0) >= 50) return "elevated";
  if (!data.current && data.daily.length === 0) return "unknown";
  return "moderate";
}

export function RegionalCityHero({ data }: { data: RegionalCityWeatherData }) {
  const city = data.city;
  const current = data.current;
  const today = data.daily[0] ?? null;
  const hasHourlyForecast = Boolean(today && data.hourly.length > 0);
  const hasDailyTrend = data.daily.length > 1;
  const priorityAlert = selectPriorityRegionalAlert(data.alerts.items);
  const condition = current?.condition ?? "Condição em atualização";
  const peakRainCandidate = data.hourly.slice(0, 24).reduce<(typeof data.hourly)[number] | null>(
    (selected, hour) => {
      if (hour.rainChance === null) return selected;
      if (!selected || (hour.rainChance ?? -1) > (selected.rainChance ?? -1)) return hour;
      return selected;
    },
    null,
  );
  const highestRainChance = peakRainCandidate?.rainChance ?? null;
  const hasPositiveRainChance = (highestRainChance ?? 0) > 0;
  const peakRain = hasPositiveRainChance ? peakRainCandidate : null;
  const strongestGust = maximum(data.hourly.slice(0, 24).map((hour) => hour.windGust));
  const currentIcon = regionalWeatherIcon(condition, current?.observedAt ?? null);

  const currentCopy = current
    ? current.temperature === null
      ? `Agora em ${city.name}, ${sentenceCondition(condition)}.`
      : `Agora em ${city.name}, ${sentenceCondition(condition)}, com ${metric(current.temperature, "°")}.`
    : `A condição atual de ${city.name} está sendo atualizada.`;
  const rangeCopy = today
    ? `Hoje, a previsão vai de ${metric(today.minimum, "°")} a ${metric(today.maximum, "°")}.`
    : "A faixa de temperatura de hoje ainda está sendo atualizada.";
  const rainCopy =
    highestRainChance === null
      ? "A chance de chuva nas próximas horas ainda está sendo atualizada."
      : highestRainChance <= 0
        ? "Não há destaque de chuva nas próximas 24 horas."
        : `A maior chance de chuva nas próximas 24 horas chega a ${metric(highestRainChance, "%")}${
            peakRain ? ` por volta de ${formatRegionalHour(peakRain.time)}` : ""
          }.`;
  const description = `${currentCopy} ${rangeCopy} ${rainCopy}`;

  const peakRainDetail =
    highestRainChance === null
      ? "Janela horária em atualização"
      : hasPositiveRainChance && peakRain
        ? `${formatRegionalHour(peakRain.time)}${
            peakRain.precipitationMm === null
              ? ""
              : ` · ${metric(peakRain.precipitationMm, " mm")}`
          }`
        : "Sem horário de chuva em destaque";
  const currentDetail = current
    ? current.feelsLike === null
      ? condition
      : `${condition} · sensação de ${metric(current.feelsLike, "°")}`
    : "Estimativa atual em atualização";

  const primaryAction = hasHourlyForecast ? (
    <a href="#previsao-hoje">
      Próximas horas <ArrowRight aria-hidden="true" />
    </a>
  ) : hasDailyTrend ? (
    <a href="#tendencia">
      Próximos dias <ArrowRight aria-hidden="true" />
    </a>
  ) : (
    <Link to="/tempo-na-regiao-sul-rs">
      Central regional <ArrowRight aria-hidden="true" />
    </Link>
  );

  return (
    <WeatherSplitHero
      className="regional-city-split-hero"
      titleId="regional-city-hero-title"
      back={
        <Link className="weather-split-hero__back" to="/tempo-na-regiao-sul-rs">
          <ArrowLeft aria-hidden="true" /> Tempo na Região Sul
        </Link>
      }
      eyebrow={`Agora e próximos dias · ${city.group}`}
      title={`Tempo em ${city.name}`}
      description={description}
      actions={
        <>
          {primaryAction}
          <a href="#avisos-municipais">Avisos oficiais</a>
        </>
      }
      tone={heroTone(data)}
      badgeIcon={<WeatherIcon name={currentIcon} title={`Condição estimada: ${condition}`} />}
      badgeLabel={priorityAlert ? `Aviso oficial para ${city.name}` : condition}
      updatedLabel={formatRegionalDateTime(data.source.fetchedAt)}
      currentLabel={current ? `Agora em ${city.name}` : "Condição atual"}
      currentValue={metric(current?.temperature ?? null, "°")}
      currentDetail={currentDetail}
      highlightIcon={<CloudRain aria-hidden="true" />}
      highlightLabel="Chuva nas próximas 24 horas"
      highlightValue={metric(highestRainChance, "%")}
      highlightDetail={peakRainDetail}
      facts={[
        {
          label: "Sensação térmica",
          value: metric(current?.feelsLike ?? null, "°"),
        },
        {
          label: "Mínima / máxima hoje",
          value: today
            ? `${metric(today.minimum, "°")} / ${metric(today.maximum, "°")}`
            : "Não informada",
        },
        {
          label: "Vento agora",
          value: windMetric(current?.windSpeed ?? null),
        },
        {
          label: "Rajada mais forte",
          value: gustMetric(strongestGust),
        },
      ]}
      footer="Previsão para as coordenadas centrais do município. Em situação de risco, siga os avisos oficiais."
    />
  );
}
