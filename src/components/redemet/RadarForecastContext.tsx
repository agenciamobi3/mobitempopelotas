import { Droplets, Gauge, Info, Wind } from "lucide-react";

import {
  formatRedemetDateTime,
  isUsableRedemetObservedAt,
  redemetFrameDisplayLabel,
} from "@/lib/redemet/redemet-display-time";
import type { RedemetImageLayerResponse } from "@/lib/redemet/redemet.types";
import type { InmetForecastPeriod } from "@/lib/weather/official-sources.types";
import type { WeatherIntelligenceData } from "@/lib/weather/weather-intelligence.types";

import { RadarMapFrame } from "./RadarMapFrame";
import "./RadarForecastContext.css";

function parseObservedTime(value: string | null | undefined) {
  if (!value || !isUsableRedemetObservedAt(value)) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateTime(value: string | null | undefined) {
  return formatRedemetDateTime(value ?? null);
}

function normalizedToken(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function frameReference(value: string | null | undefined) {
  const observed = parseObservedTime(value);
  if (!observed) return null;

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(observed);

  const part = (type: "year" | "month" | "day" | "hour") =>
    parts.find((item) => item.type === type)?.value ?? "";

  const year = part("year");
  const month = part("month");
  const day = part("day");
  const hour = Number(part("hour"));
  if (!year || !month || !day || !Number.isFinite(hour)) return null;

  return {
    date: `${year}-${month}-${day}`,
    period:
      hour < 6 ? "madrugada" : hour < 12 ? "manha" : hour < 18 ? "tarde" : "noite",
  };
}

function selectInmetPeriod(periods: InmetForecastPeriod[], observedAt: string | null) {
  const reference = frameReference(observedAt);
  if (!reference) return null;

  const sameDate = periods.filter((period) => period.date === reference.date);
  if (!sameDate.length) return null;

  return (
    sameDate.find((period) => normalizedToken(period.period) === reference.period) ??
    sameDate.find((period) =>
      ["diainteiro", "previsaodiaria"].includes(normalizedToken(period.period)),
    ) ??
    sameDate[0] ??
    null
  );
}

function formatForecastDate(value: string | null) {
  if (!value) return "Data não informada";
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(Date.UTC(year, month - 1, day, 12)));
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(value);
}

function formatRange(
  minimum: number | null | undefined,
  maximum: number | null | undefined,
  suffix: string,
) {
  if (minimum === null || minimum === undefined) {
    return maximum === null || maximum === undefined
      ? "Não informada"
      : `Até ${formatNumber(maximum)}${suffix}`;
  }
  if (maximum === null || maximum === undefined) {
    return `A partir de ${formatNumber(minimum)}${suffix}`;
  }
  return `${formatNumber(minimum)}${suffix} a ${formatNumber(maximum)}${suffix}`;
}

function windLabel(period: InmetForecastPeriod) {
  const values = [period.windDirection, period.windIntensity].filter(
    (value): value is string => Boolean(value),
  );
  return values.length ? values.join(" · ") : "Não informado";
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

  const inmetPeriod = selectInmetPeriod(weather.weather.inmetForecast, frame.observedAt);

  return (
    <section className="radar-forecast-context" aria-labelledby="radar-forecast-context-title">
      <header>
        <div>
          <span>Compare com a previsão</span>
          <h2 id="radar-forecast-context-title">Radar e previsão oficial do período</h2>
        </div>
        <p>
          A imagem mostra o radar recebido. Ao lado, a previsão do INMET para o mesmo período do dia, quando disponível.
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
            <small>Previsão oficial do INMET</small>
            <strong>{inmetPeriod?.period ?? "Em atualização"}</strong>
            <span>
              {inmetPeriod
                ? formatForecastDate(inmetPeriod.date)
                : "Sem período correspondente nesta coleta"}
            </span>
          </div>

          {inmetPeriod ? (
            <div className="radar-forecast-context__metrics">
              <article className="is-summary">
                <Info aria-hidden="true" />
                <span>
                  <small>Condição prevista</small>
                  <strong>{inmetPeriod.summary}</strong>
                </span>
              </article>
              <article>
                <Gauge aria-hidden="true" />
                <span>
                  <small>Temperatura</small>
                  <strong>{formatRange(inmetPeriod.minimum, inmetPeriod.maximum, " °C")}</strong>
                </span>
              </article>
              <article>
                <Droplets aria-hidden="true" />
                <span>
                  <small>Umidade</small>
                  <strong>{formatRange(inmetPeriod.humidityMinimum, inmetPeriod.humidityMaximum, "%")}</strong>
                </span>
              </article>
              <article>
                <Wind aria-hidden="true" />
                <span>
                  <small>Vento</small>
                  <strong>{windLabel(inmetPeriod)}</strong>
                </span>
              </article>
            </div>
          ) : (
            <div className="radar-forecast-context__unavailable">
              O INMET não publicou um período correspondente a esta coleta do radar nesta atualização.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
