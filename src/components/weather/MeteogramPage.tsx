"use client";

import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CloudFog,
  CloudRain,
  Eye,
  Navigation,
  Waves,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { MeteogramData, MeteogramHour } from "@/lib/weather/meteogram.server";
import type { WeatherIntelligenceData } from "@/lib/weather/weather-intelligence.types";

import "./MeteogramPage.css";

type ForecastWindow = 24 | 48;
type NumericValue = number | null | undefined;
type ChartSeries = {
  id: string;
  label: string;
  className: string;
  read: (hour: MeteogramHour) => NumericValue;
};

const CHART_WIDTH = 1120;
const CHART_HEIGHT = 290;
const CHART_PADDING = { top: 28, right: 26, bottom: 48, left: 62 } as const;

function formatDateTime(value: string | null | undefined) {
  if (!value) return "horário não informado";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "horário não informado";
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatHour(value: string, includeDate = false) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    ...(includeDate ? { weekday: "short", day: "2-digit" } : {}),
    hour: "2-digit",
    minute: "2-digit",
  })
    .format(date)
    .replace(".", "");
}

function formatNumber(value: NumericValue, unit = "", digits = 0) {
  if (value === null || value === undefined) return "—";
  return `${new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)}${unit}`;
}

function formatRainChance(value: NumericValue) {
  if (value === null || value === undefined) return "Não informada";
  return `${Math.round(value)}%`;
}

function formatGust(value: NumericValue) {
  if (value === null || value === undefined) return "Não informada";
  if (value <= 0) return "Sem rajada prevista";
  return formatNumber(value, " km/h", 1);
}

function directionLabel(degrees: NumericValue) {
  if (degrees === null || degrees === undefined) return "—";
  const labels = ["N", "NNE", "NE", "ENE", "L", "ESE", "SE", "SSE", "S", "SSO", "SO", "OSO", "O", "ONO", "NO", "NNO"];
  const normalized = ((degrees % 360) + 360) % 360;
  return labels[Math.round(normalized / 22.5) % labels.length] ?? "—";
}

function weatherLabel(code: NumericValue, isDay: boolean | null) {
  if (code === null || code === undefined) return "Condição não informada";
  if (code === 0) return isDay === false ? "Noite de céu limpo" : "Céu limpo";
  if (code === 1 || code === 2) return "Parcialmente nublado";
  if (code === 3) return "Céu nublado";
  if (code === 45 || code === 48) return "Neblina";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 86)) return "Chuva";
  if (code >= 95) return "Trovoadas";
  return "Tempo variável";
}

function numericHours(hours: MeteogramHour[], read: (hour: MeteogramHour) => NumericValue) {
  return hours.filter((hour) => read(hour) !== null && read(hour) !== undefined);
}

function maximumHour(hours: MeteogramHour[], read: (hour: MeteogramHour) => NumericValue) {
  return numericHours(hours, read).reduce<MeteogramHour | null>((selected, hour) => {
    if (!selected) return hour;
    return (read(hour) ?? Number.NEGATIVE_INFINITY) > (read(selected) ?? Number.NEGATIVE_INFINITY)
      ? hour
      : selected;
  }, null);
}

function minimumHour(hours: MeteogramHour[], read: (hour: MeteogramHour) => NumericValue) {
  return numericHours(hours, read).reduce<MeteogramHour | null>((selected, hour) => {
    if (!selected) return hour;
    return (read(hour) ?? Number.POSITIVE_INFINITY) < (read(selected) ?? Number.POSITIVE_INFINITY)
      ? hour
      : selected;
  }, null);
}

function positiveMaximumHour(hours: MeteogramHour[], read: (hour: MeteogramHour) => NumericValue) {
  return maximumHour(
    hours.filter((hour) => (read(hour) ?? 0) > 0),
    read,
  );
}

function maximumValue(hours: MeteogramHour[], read: (hour: MeteogramHour) => NumericValue) {
  const values = numericHours(hours, read).map((hour) => read(hour) as number);
  return values.length ? Math.max(...values) : null;
}

function fallbackHours(data: WeatherIntelligenceData): MeteogramHour[] {
  const sourceTime = Date.parse(data.weather.source.fetchedAt);
  return data.weather.hourly.map((hour, index) => ({
    timestamp:
      hour.timestamp ??
      new Date((Number.isFinite(sourceTime) ? sourceTime : Date.now()) + index * 3_600_000).toISOString(),
    temperature: hour.temperature,
    feelsLike: null,
    relativeHumidity: hour.relativeHumidity ?? null,
    dewPoint: hour.dewPoint ?? null,
    precipitationProbability: hour.precipitationProbability,
    precipitationMm: hour.precipitationMm ?? null,
    pressure: hour.pressure ?? null,
    cloudCover: hour.cloudCover ?? null,
    cloudCoverLow: hour.cloudCoverLow ?? null,
    cloudCoverMid: hour.cloudCoverMid ?? null,
    cloudCoverHigh: hour.cloudCoverHigh ?? null,
    visibilityKm: hour.visibilityKm ?? null,
    cape: hour.cape ?? null,
    boundaryLayerHeight: hour.boundaryLayerHeight ?? null,
    windSpeed: hour.windSpeed,
    windGust: hour.windGust,
    windDirectionDegrees: hour.windDirectionDegrees ?? null,
    weatherCode: null,
    isDay: null,
  }));
}

function usableHours(weather: WeatherIntelligenceData, meteogram: MeteogramData) {
  return meteogram.status === "live" && meteogram.hours.length ? meteogram.hours : fallbackHours(weather);
}

function sourceFetchedAt(weather: WeatherIntelligenceData, meteogram: MeteogramData) {
  if (meteogram.status === "live") return meteogram.source.fetchedAt;
  const key = weather.weather.quality.forecastSource;
  return key && weather.weather.sources[key]
    ? weather.weather.sources[key].fetchedAt
    : weather.weather.source.fetchedAt;
}

function lineSegments(
  hours: MeteogramHour[],
  read: (hour: MeteogramHour) => NumericValue,
  minimum: number,
  maximum: number,
) {
  const plotWidth = CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right;
  const plotHeight = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;
  const denominator = Math.max(1, hours.length - 1);
  const range = Math.max(0.1, maximum - minimum);
  const segments: string[] = [];
  let current: string[] = [];

  hours.forEach((hour, index) => {
    const value = read(hour);
    if (value === null || value === undefined) {
      if (current.length) segments.push(current.join(" "));
      current = [];
      return;
    }
    const x = CHART_PADDING.left + (index / denominator) * plotWidth;
    const y = CHART_PADDING.top + ((maximum - value) / range) * plotHeight;
    current.push(`${current.length ? "L" : "M"} ${x.toFixed(2)} ${y.toFixed(2)}`);
  });
  if (current.length) segments.push(current.join(" "));
  return segments;
}

function chartDomain(hours: MeteogramHour[], series: ChartSeries[], fixed?: [number, number]) {
  if (fixed) return fixed;
  const values = series.flatMap((item) =>
    hours
      .map((hour) => item.read(hour))
      .filter((value): value is number => value !== null && value !== undefined),
  );
  if (!values.length) return null;
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const padding = Math.max(1, (maximum - minimum) * 0.12);
  return [minimum - padding, maximum + padding] as [number, number];
}

function MeteogramLineChart({
  id,
  title,
  description,
  hours,
  selectedIndex,
  series,
  fixedDomain,
  axisUnit,
}: {
  id: string;
  title: string;
  description: string;
  hours: MeteogramHour[];
  selectedIndex: number;
  series: ChartSeries[];
  fixedDomain?: [number, number];
  axisUnit: string;
}) {
  const domain = chartDomain(hours, series, fixedDomain);
  if (!domain) {
    return (
      <section className="meteogram-chart-card is-unavailable" id={id}>
        <h3>{title}</h3>
        <p>{description}</p>
        <strong>Dados não informados nesta atualização</strong>
      </section>
    );
  }

  const [minimum, maximum] = domain;
  const plotWidth = CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right;
  const selectedX =
    CHART_PADDING.left +
    (Math.min(selectedIndex, Math.max(0, hours.length - 1)) / Math.max(1, hours.length - 1)) * plotWidth;
  const ticks = Array.from({ length: 5 }, (_, index) => maximum - ((maximum - minimum) * index) / 4);

  return (
    <section className="meteogram-chart-card" id={id} aria-labelledby={`${id}-title`}>
      <header>
        <div>
          <h3 id={`${id}-title`}>{title}</h3>
          <p>{description}</p>
        </div>
        <div className="meteogram-chart-legend" aria-label={`Legenda de ${title}`}>
          {series.map((item) => (
            <span key={item.id} className={item.className}>
              <i aria-hidden="true" /> {item.label}
            </span>
          ))}
        </div>
      </header>

      <div className="meteogram-chart-scroll">
        <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} role="img" aria-label={`${title}. Previsão com ${hours.length} horários.`}>
          {ticks.map((tick, index) => {
            const y =
              CHART_PADDING.top +
              (index / Math.max(1, ticks.length - 1)) * (CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom);
            return (
              <g key={tick}>
                <line className="meteogram-chart-grid" x1={CHART_PADDING.left} y1={y} x2={CHART_WIDTH - CHART_PADDING.right} y2={y} />
                <text className="meteogram-chart-axis" x={CHART_PADDING.left - 10} y={y + 4} textAnchor="end">
                  {formatNumber(tick, axisUnit)}
                </text>
              </g>
            );
          })}

          <line className="meteogram-chart-selected" x1={selectedX} y1={CHART_PADDING.top} x2={selectedX} y2={CHART_HEIGHT - CHART_PADDING.bottom} />

          {series.map((item) =>
            lineSegments(hours, item.read, minimum, maximum).map((path, index) => (
              <path key={`${item.id}-${index}`} className={`meteogram-chart-line ${item.className}`} d={path} />
            )),
          )}

          {hours.map((hour, index) => {
            const shouldLabel = index === 0 || index === hours.length - 1 || index % 3 === 0;
            if (!shouldLabel) return null;
            const x = CHART_PADDING.left + (index / Math.max(1, hours.length - 1)) * plotWidth;
            return (
              <text key={hour.timestamp} className="meteogram-chart-time" x={x} y={CHART_HEIGHT - 17} textAnchor="middle">
                {formatHour(hour.timestamp)}
              </text>
            );
          })}
        </svg>
      </div>
    </section>
  );
}

function PrecipitationVolume({ hours, selectedIndex }: { hours: MeteogramHour[]; selectedIndex: number }) {
  const availableHours = hours.filter((hour) => hour.precipitationMm !== null);
  const values = availableHours.map((hour) => hour.precipitationMm as number);
  const complete = availableHours.length === hours.length;

  if (!availableHours.length) {
    return (
      <section className="meteogram-volume is-unavailable" aria-labelledby="meteogram-volume-title">
        <header>
          <div>
            <h3 id="meteogram-volume-title">Volume de chuva por hora</h3>
            <p>Milímetros previstos por horário.</p>
          </div>
          <span>Volume não informado</span>
        </header>
      </section>
    );
  }

  const maximum = Math.max(0.1, ...values);
  const total = values.reduce((sum, value) => sum + value, 0);

  return (
    <section className="meteogram-volume" aria-labelledby="meteogram-volume-title">
      <header>
        <div>
          <h3 id="meteogram-volume-title">Volume de chuva por hora</h3>
          <p>Milímetros previstos por horário.</p>
        </div>
        <span>
          {complete
            ? `${formatNumber(total, " mm", 1)} no período`
            : `${formatNumber(total, " mm", 1)} em ${availableHours.length} de ${hours.length} horários`}
        </span>
      </header>
      <div className="meteogram-volume-grid">
        {hours.map((hour, index) => {
          const volumeKnown = hour.precipitationMm !== null;
          const height = volumeKnown ? Math.max(0, ((hour.precipitationMm as number) / maximum) * 100) : 0;

          return (
            <article
              key={hour.timestamp}
              className={`${index === selectedIndex ? "is-selected" : ""}${volumeKnown ? "" : " is-unknown"}`.trim()}
            >
              <span style={{ height: `${height}%` }} />
              <strong>{formatNumber(hour.precipitationMm, " mm", 1)}</strong>
              <small>{formatHour(hour.timestamp)}{volumeKnown ? "" : " · não informado"}</small>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function selectedMetric(label: string, value: string, detail?: string) {
  return (
    <article>
      <span>{label}</span>
      <strong>{value}</strong>
      {detail ? <small>{detail}</small> : null}
    </article>
  );
}

function selectedWindDetail(hour: MeteogramHour) {
  const direction = directionLabel(hour.windDirectionDegrees);
  const directionText = direction === "—" ? "Direção não informada" : `De ${direction}`;
  return `${directionText} · Rajada ${formatGust(hour.windGust)}`;
}

function selectedCloudDetail(hour: MeteogramHour) {
  const layers = [
    hour.cloudCoverLow === null ? null : `Baixas ${formatNumber(hour.cloudCoverLow, "%")}`,
    hour.cloudCoverMid === null ? null : `Médias ${formatNumber(hour.cloudCoverMid, "%")}`,
    hour.cloudCoverHigh === null ? null : `Altas ${formatNumber(hour.cloudCoverHigh, "%")}`,
  ].filter((value): value is string => Boolean(value));

  return layers.length ? layers.join(" · ") : undefined;
}

function selectedInstabilityDetail(hour: MeteogramHour) {
  return hour.boundaryLayerHeight === null
    ? undefined
    : `Camada próxima ao solo: ${formatNumber(hour.boundaryLayerHeight, " m")}`;
}

export function MeteogramHero({
  weather,
  meteogram,
}: {
  weather: WeatherIntelligenceData;
  meteogram: MeteogramData;
}) {
  const hours = usableHours(weather, meteogram).slice(0, 24);
  const minimumTemperature = minimumHour(hours, (hour) => hour.temperature);
  const maximumTemperature = maximumHour(hours, (hour) => hour.temperature);
  const maximumRainValue = maximumValue(hours, (hour) => hour.precipitationProbability);
  const maximumRain = positiveMaximumHour(hours, (hour) => hour.precipitationProbability);
  const maximumGustValue = maximumValue(hours, (hour) => hour.windGust);
  const maximumGust = positiveMaximumHour(hours, (hour) => hour.windGust);
  const minimumVisibility = minimumHour(hours, (hour) => hour.visibilityKm);

  return (
    <section className="meteogram-hero" aria-labelledby="meteogram-hero-title">
      <div className="meteogram-hero__content">
        <h1 id="meteogram-hero-title">Meteograma de Pelotas</h1>
        <p>Temperatura, chuva, nuvens, visibilidade, pressão e vento hora a hora nas próximas 24 ou 48 horas.</p>
        <div className="meteogram-hero__actions">
          <a href="#linha-do-tempo-meteograma">Ver por horário <ArrowRight aria-hidden="true" /></a>
          <Link to="/tempo-hoje-pelotas">Tempo de hoje</Link>
        </div>
      </div>

      <div className="meteogram-hero__panel">
        <header>
          <span>Janela analisada</span>
          <strong>Próximas 24 horas</strong>
          <small>Atualizado em {formatDateTime(sourceFetchedAt(weather, meteogram))}</small>
        </header>
        <div>
          <article>
            <span>Temperatura</span>
            <strong>{formatNumber(minimumTemperature?.temperature, " °C")} a {formatNumber(maximumTemperature?.temperature, " °C")}</strong>
          </article>
          <article>
            <span>Chuva</span>
            <strong>{formatRainChance(maximumRainValue)}</strong>
            <small>{maximumRain ? formatHour(maximumRain.timestamp) : maximumRainValue === 0 ? "Sem pico" : "Não informada"}</small>
          </article>
          <article>
            <span>Rajadas</span>
            <strong>{formatGust(maximumGustValue)}</strong>
            <small>{maximumGust ? formatHour(maximumGust.timestamp) : maximumGustValue === 0 ? "Sem pico" : "Não informada"}</small>
          </article>
          <article>
            <span>Visibilidade</span>
            <strong>{formatNumber(minimumVisibility?.visibilityKm, " km", 1)}</strong>
            <small>{minimumVisibility ? formatHour(minimumVisibility.timestamp) : "Não informada"}</small>
          </article>
        </div>
      </div>
    </section>
  );
}

export function MeteogramPage({
  weather,
  meteogram,
}: {
  weather: WeatherIntelligenceData;
  meteogram: MeteogramData;
}) {
  const allHours = useMemo(() => usableHours(weather, meteogram), [weather, meteogram]);
  const maximumWindow: ForecastWindow = allHours.length >= 36 ? 48 : 24;
  const [windowHours, setWindowHours] = useState<ForecastWindow>(24);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const hours = allHours.slice(0, Math.min(windowHours, allHours.length));
  const selected = hours[Math.min(selectedIndex, Math.max(0, hours.length - 1))] ?? null;

  useEffect(() => {
    if (windowHours > maximumWindow) setWindowHours(maximumWindow);
  }, [maximumWindow, windowHours]);

  useEffect(() => {
    if (selectedIndex >= hours.length) setSelectedIndex(Math.max(0, hours.length - 1));
  }, [hours.length, selectedIndex]);

  if (!hours.length) {
    return (
      <section className="meteogram-unavailable">
        <CloudFog aria-hidden="true" />
        <div>
          <h2>A previsão hora a hora está em atualização</h2>
          <p>{meteogram.message ?? weather.weather.message ?? "Nenhuma previsão horária está disponível neste momento."}</p>
          <Link to="/tempo-hoje-pelotas">Ver tempo de hoje</Link>
        </div>
      </section>
    );
  }

  const sourceIsFallback = meteogram.status !== "live";

  return (
    <div className="meteogram-page">
      <section className="meteogram-overview" id="linha-do-tempo-meteograma" aria-labelledby="meteogram-overview-title">
        <header>
          <h2 id="meteogram-overview-title">Previsão por hora</h2>
          <div className="meteogram-window-toggle" aria-label="Período exibido">
            <button type="button" className={windowHours === 24 ? "is-active" : ""} aria-pressed={windowHours === 24} onClick={() => setWindowHours(24)}>24 horas</button>
            <button type="button" className={windowHours === 48 ? "is-active" : ""} aria-pressed={windowHours === 48} disabled={maximumWindow < 48} onClick={() => setWindowHours(48)}>48 horas</button>
          </div>
        </header>

        <div className="meteogram-timeline" role="list" aria-label="Horários da previsão">
          {hours.map((hour, index) => (
            <button
              type="button"
              role="listitem"
              key={hour.timestamp}
              className={index === selectedIndex ? "is-selected" : ""}
              aria-pressed={index === selectedIndex}
              onClick={() => setSelectedIndex(index)}
            >
              <span>{index === 0 ? "Próximo horário" : formatHour(hour.timestamp, true)}</span>
              <strong>{formatNumber(hour.temperature, " °C")}</strong>
              <small>{formatRainChance(hour.precipitationProbability)} chuva · {formatGust(hour.windGust)}</small>
            </button>
          ))}
        </div>

        {selected ? (
          <div className="meteogram-selected">
            <header>
              <div>
                <span>Horário</span>
                <h3>{formatHour(selected.timestamp, true)}</h3>
              </div>
              <strong>{weatherLabel(selected.weatherCode, selected.isDay)}</strong>
            </header>
            <div className="meteogram-selected-grid">
              {selectedMetric("Temperatura", formatNumber(selected.temperature, " °C", 1), selected.feelsLike === null ? "Sensação não informada" : `Sensação ${formatNumber(selected.feelsLike, " °C", 1)}`)}
              {selectedMetric("Chuva", formatRainChance(selected.precipitationProbability), selected.precipitationMm === null ? "Volume não informado" : `${formatNumber(selected.precipitationMm, " mm", 1)} na hora`)}
              {selectedMetric("Umidade", formatNumber(selected.relativeHumidity, "%"), selected.dewPoint === null ? "Ponto de orvalho não informado" : `Ponto de orvalho ${formatNumber(selected.dewPoint, " °C", 1)}`)}
              {selectedMetric("Nuvens", formatNumber(selected.cloudCover, "%"), selectedCloudDetail(selected))}
              {selectedMetric("Vento", formatNumber(selected.windSpeed, " km/h", 1), selectedWindDetail(selected))}
              {selectedMetric("Pressão", formatNumber(selected.pressure, " hPa", 1))}
              {selectedMetric("Visibilidade", formatNumber(selected.visibilityKm, " km", 1))}
              {selectedMetric("Instabilidade", formatNumber(selected.cape, " J/kg"), selectedInstabilityDetail(selected))}
            </div>
          </div>
        ) : null}
      </section>

      <MeteogramLineChart
        id="temperatura-orvalho"
        title="Temperatura, sensação e ponto de orvalho"
        description="Valores previstos por hora."
        hours={hours}
        selectedIndex={selectedIndex}
        axisUnit=" °C"
        series={[
          { id: "temperature", label: "Temperatura", className: "is-temperature", read: (hour) => hour.temperature },
          { id: "feels", label: "Sensação", className: "is-feels-like", read: (hour) => hour.feelsLike },
          { id: "dew", label: "Ponto de orvalho", className: "is-dew-point", read: (hour) => hour.dewPoint },
        ]}
      />

      <MeteogramLineChart
        id="chuva-umidade"
        title="Chance de chuva e umidade"
        description="Valores previstos por hora."
        hours={hours}
        selectedIndex={selectedIndex}
        fixedDomain={[0, 100]}
        axisUnit="%"
        series={[
          { id: "rain", label: "Chance de chuva", className: "is-rain", read: (hour) => hour.precipitationProbability },
          { id: "humidity", label: "Umidade", className: "is-humidity", read: (hour) => hour.relativeHumidity },
        ]}
      />

      <PrecipitationVolume hours={hours} selectedIndex={selectedIndex} />

      <MeteogramLineChart
        id="nuvens-visibilidade"
        title="Nuvens por camada"
        description="Cobertura prevista de nuvens baixas, médias e altas."
        hours={hours}
        selectedIndex={selectedIndex}
        fixedDomain={[0, 100]}
        axisUnit="%"
        series={[
          { id: "low-cloud", label: "Baixas", className: "is-low-cloud", read: (hour) => hour.cloudCoverLow },
          { id: "mid-cloud", label: "Médias", className: "is-mid-cloud", read: (hour) => hour.cloudCoverMid },
          { id: "high-cloud", label: "Altas", className: "is-high-cloud", read: (hour) => hour.cloudCoverHigh },
        ]}
      />

      <MeteogramLineChart
        id="visibilidade-meteograma"
        title="Visibilidade"
        description="Visibilidade prevista por hora."
        hours={hours}
        selectedIndex={selectedIndex}
        fixedDomain={[0, Math.max(10, ...hours.map((hour) => hour.visibilityKm ?? 0))]}
        axisUnit=" km"
        series={[
          { id: "visibility", label: "Visibilidade", className: "is-visibility", read: (hour) => hour.visibilityKm },
        ]}
      />

      <MeteogramLineChart
        id="vento-pressao"
        title="Vento e rajadas"
        description="Velocidade média e rajadas previstas."
        hours={hours}
        selectedIndex={selectedIndex}
        fixedDomain={[0, Math.max(20, ...hours.map((hour) => hour.windGust ?? hour.windSpeed ?? 0))]}
        axisUnit=" km/h"
        series={[
          { id: "wind", label: "Vento", className: "is-wind", read: (hour) => hour.windSpeed },
          { id: "gust", label: "Rajada", className: "is-gust", read: (hour) => hour.windGust },
        ]}
      />

      <MeteogramLineChart
        id="pressao-meteograma"
        title="Pressão"
        description="Pressão ao nível do mar prevista por hora."
        hours={hours}
        selectedIndex={selectedIndex}
        axisUnit=" hPa"
        series={[
          { id: "pressure", label: "Pressão", className: "is-pressure", read: (hour) => hour.pressure },
        ]}
      />

      <footer className="meteogram-footer">
        <div>
          <strong>Atualizado em {formatDateTime(sourceFetchedAt(weather, meteogram))}</strong>
          {sourceIsFallback ? <small>Previsão detalhada indisponível; usando os dados horários disponíveis.</small> : meteogram.message ? <small>{meteogram.message}</small> : null}
        </div>
        <div>
          <span>Medições reais ficam separadas no Tempo de hoje.</span>
          <Link to="/tempo-hoje-pelotas">Tempo de hoje</Link>
          <Link to="/status-dos-dados">Sobre os dados</Link>
        </div>
      </footer>

      <nav className="meteogram-related" aria-label="Outras páginas do tempo em Pelotas">
        <Link to="/tempo-hoje-pelotas"><Waves aria-hidden="true" /><strong>Hoje</strong></Link>
        <Link to="/chuva-em-pelotas"><CloudRain aria-hidden="true" /><strong>Chuva</strong></Link>
        <Link to="/vento-em-pelotas"><Navigation aria-hidden="true" /><strong>Vento</strong></Link>
        <Link to="/radar-e-satelite-pelotas"><Eye aria-hidden="true" /><strong>Radar e satélite</strong></Link>
      </nav>
    </div>
  );
}
