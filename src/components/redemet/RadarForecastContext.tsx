import { CloudFog, CloudRain, Eye, Gauge, Wind } from "lucide-react";

import {
  formatRedemetDateTime,
  isUsableRedemetObservedAt,
  redemetFrameDisplayLabel,
} from "@/lib/redemet/redemet-display-time";
import type { RedemetImageLayerResponse } from "@/lib/redemet/redemet.types";
import type { HourlyForecast } from "@/lib/weather/types";
import type { WeatherIntelligenceData } from "@/lib/weather/weather-intelligence.types";

import { RadarMapFrame } from "./RadarMapFrame";
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
          <h2 id="radar-forecast-context-title">Radar e previsão no mesmo horário</h2>
        </div>
        <p>
          A imagem mostra o que o radar recebeu. Ao lado, veja o que a previsão indicava para o horário mais próximo.
        </p>
      </header>

      <div className="radar-forecast-context__comparison">
        <figure className="radar-forecast-context__image">
          <RadarMapFrame
            frame={frame}
            alt={`Imagem do radar REDEMET de ${formatDateTime(frame.observedAt)}`}
          />
          <figcaption>
            <div>
              <small>Imagem do radar</small>
              <strong>{formatDateTime(frame.observedAt)}</strong>
            </div>
            <span>REDEMET/DECEA · {redemetFrameDisplayLabel(frame)}</span>
          </figcaption>
        </figure>

        <div className="radar-forecast-context__forecast">
          <div className="radar-forecast-context__forecast-time">
            <small>Previsão comparada</small>
            <strong>{forecast?.time ?? "Sem horário próximo"}</strong>
            <span>{modelLabel}</span>
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
              Não há uma previsão por hora suficientemente próxima desta coleta para fazer a comparação.
            </div>
          )}
        </div>
      </div>

      <footer>
        Previsão {modelLabel}, atualizada às {formatFetchedAt(sourceHealth?.fetchedAt)}. A imagem do radar continua sendo observação; os números ao lado continuam sendo previsão.
      </footer>
    </section>
  );
}
