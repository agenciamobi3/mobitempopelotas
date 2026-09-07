import { CloudFog, CloudRain, Eye, Gauge, Wind } from "lucide-react";

import {
  formatRedemetDateTime,
  isUsableRedemetObservedAt,
  redemetFrameDisplayLabel,
} from "@/lib/redemet/redemet-display-time";
import type { RedemetImageLayerResponse } from "@/lib/redemet/redemet.types";
import type { HourlyForecast } from "@/lib/weather/types";
import type { WeatherIntelligenceData } from "@/lib/weather/weather-intelligence.types";

import "./RadarForecastContext.css";

function parseObservedTime(value: string | null | undefined) {
  if (!value || !isUsableRedemetObservedAt(value)) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseForecastTime(value: string | null | undefined) {
  if (!value) return null;
  const hasZone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value);
  const normalized = hasZone
    ? value
    : `${value.length === 16 ? `${value}:00` : value}-03:00`;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateTime(value: string | null | undefined) {
  return formatRedemetDateTime(value ?? null);
}

function formatFetchedAt(value: string | null | undefined) {
  if (!value) return "horário não informado";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "horário não informado";
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function nearestForecastHour(hours: HourlyForecast[], observedAt: string | null) {
  const observed = parseObservedTime(observedAt);
  if (!observed) return null;

  const selected = hours.reduce<{ hour: HourlyForecast; difference: number } | null>(
    (nearest, hour) => {
      const forecast = parseForecastTime(hour.timestamp);
      if (!forecast) return nearest;
      const difference = Math.abs(forecast.getTime() - observed.getTime());
      return !nearest || difference < nearest.difference ? { hour, difference } : nearest;
    },
    null,
  );

  if (!selected || selected.difference > 3 * 60 * 60 * 1_000) return null;
  return selected.hour;
}

function formatValue(value: number | null | undefined, suffix: string, digits = 0) {
  if (value === null || value === undefined) return "Não informado";
  return `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: digits }).format(value)}${suffix}`;
}

export function RadarForecastContext({
  radar,
  weather,
}: {
  radar: RedemetImageLayerResponse;
  weather: WeatherIntelligenceData;
}) {
  const frame = radar.frames[radar.currentIndex] ?? radar.frames.at(-1) ?? null;
  if (!frame) return null;

  const forecast = nearestForecastHour(weather.weather.hourly, frame.observedAt);
  const forecastSource = weather.weather.quality.forecastSource;
  const sourceHealth = forecastSource ? weather.weather.sources[forecastSource] : null;
  const modelLabel =
    forecastSource === "open-meteo"
      ? "Open-Meteo Best Match"
      : weather.weather.quality.forecastProvider ?? "Modelo não informado";

  return (
    <section className="radar-forecast-context" aria-labelledby="radar-forecast-context-title">
      <header>
        <div>
          <span>Compare com a previsão</span>
          <h2 id="radar-forecast-context-title">O que estava previsto perto do horário desta imagem</h2>
        </div>
        <p>
          A imagem é uma observação recebida da REDEMET. Os números abaixo vêm da previsão por hora mais próxima e não foram medidos pelo radar.
        </p>
      </header>

      <div className="radar-forecast-context__times">
        <article>
          <small>Imagem do radar</small>
          <strong>{formatDateTime(frame.observedAt)}</strong>
          <span>REDEMET/DECEA · {redemetFrameDisplayLabel(frame)}</span>
        </article>
        <article>
          <small>Previsão comparada</small>
          <strong>{forecast?.time ?? "Sem horário próximo"}</strong>
          <span>{modelLabel}</span>
        </article>
      </div>

      {forecast ? (
        <div className="radar-forecast-context__metrics">
          <article>
            <Gauge aria-hidden="true" />
            <span><small>Temperatura</small><strong>{formatValue(forecast.temperature, " °C")}</strong></span>
          </article>
          <article>
            <CloudRain aria-hidden="true" />
            <span><small>Chance de chuva</small><strong>{formatValue(forecast.precipitationProbability, "%")}</strong></span>
          </article>
          <article>
            <Wind aria-hidden="true" />
            <span><small>Rajada</small><strong>{formatValue(forecast.windGust, " km/h")}</strong></span>
          </article>
          <article>
            <CloudFog aria-hidden="true" />
            <span><small>Nuvens baixas</small><strong>{formatValue(forecast.cloudCoverLow, "%")}</strong></span>
          </article>
          <article>
            <Eye aria-hidden="true" />
            <span><small>Visibilidade</small><strong>{formatValue(forecast.visibilityKm, " km", 1)}</strong></span>
          </article>
        </div>
      ) : (
        <div className="radar-forecast-context__unavailable">
          Não há uma previsão por hora suficientemente próxima desta coleta para fazer uma comparação segura.
        </div>
      )}

      <footer>
        Previsão {modelLabel}, atualizada às {formatFetchedAt(sourceHealth?.fetchedAt)}. A sequência de imagens mostra o passado recente e não indica sozinha o que acontecerá depois.
      </footer>
    </section>
  );
}
