import { CloudRain, Droplets } from "lucide-react";
import type { CSSProperties } from "react";

import type { HourlyForecast } from "@/lib/weather/types";

import "./RainHourlyVolumeFallback.css";

const WINDOW_HOURS = 12;
const MEASURABLE_RAIN_MM = 0.1;

type RainVolumeHour = {
  timestamp: string;
  precipitationProbability: number | null;
  precipitationMm: number | null;
};

type RainHourlyVolumeContextProps = {
  hourly: HourlyForecast[];
  forecastFetchedAt: string;
};

function formatHour(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function formatDateTime(value: string) {
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

function formatMm(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  return `${new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: value > 0 && value < 1 ? 1 : 0,
    maximumFractionDigits: 1,
  }).format(value)} mm`;
}

function chanceLabel(value: number | null | undefined) {
  return value === null || value === undefined ? "chance não informada" : `${Math.round(value)}%`;
}

function normalizeHours(hourly: HourlyForecast[]) {
  return hourly.slice(0, WINDOW_HOURS).map<RainVolumeHour>((hour) => ({
    timestamp: hour.timestamp ?? hour.time,
    precipitationProbability: hour.precipitationProbability,
    precipitationMm: hour.precipitationMm ?? null,
  }));
}

function wetHours(hours: RainVolumeHour[]) {
  return hours.filter(
    (hour) => hour.precipitationMm !== null && hour.precipitationMm >= MEASURABLE_RAIN_MM,
  );
}

function peakVolumeHour(hours: RainVolumeHour[]) {
  return hours.reduce<RainVolumeHour | null>((selected, hour) => {
    if (hour.precipitationMm === null) return selected;
    if (!selected || selected.precipitationMm === null) return hour;
    return hour.precipitationMm > selected.precipitationMm ? hour : selected;
  }, null);
}

function UpdateFooter({ forecastFetchedAt }: Pick<RainHourlyVolumeContextProps, "forecastFetchedAt">) {
  return (
    <footer>
      <small>Atualizado em {formatDateTime(forecastFetchedAt)}</small>
    </footer>
  );
}

export function RainHourlyVolumeContext({
  hourly,
  forecastFetchedAt,
}: RainHourlyVolumeContextProps) {
  const hours = normalizeHours(hourly);
  const availableVolumeHours = hours.filter((hour) => hour.precipitationMm !== null);

  if (!hours.length || !availableVolumeHours.length) {
    return (
      <section
        className="rain-hourly-volume-context"
        id="volume-de-chuva-por-hora"
        aria-labelledby="rain-hourly-volume-title"
      >
        <header>
          <div>
            <span>Próximas 12 horas</span>
            <h2 id="rain-hourly-volume-title">Volume previsto</h2>
          </div>
          <p>Milímetros previstos em cada horário.</p>
        </header>

        <div className="rain-hourly-volume-context__state" role="status">
          <CloudRain aria-hidden="true" />
          <div>
            <strong>Volume por hora em atualização</strong>
            <p>
              A chance de chuva pode continuar disponível, mas o volume em milímetros ainda não foi publicado para esta janela.
            </p>
          </div>
        </div>

        <UpdateFooter forecastFetchedAt={forecastFetchedAt} />
      </section>
    );
  }

  const values = availableVolumeHours.map((hour) => hour.precipitationMm as number);
  const hasCompleteVolumeWindow = availableVolumeHours.length === hours.length;
  const total = values.reduce((sum, value) => sum + value, 0);
  const hasPositiveVolume = total > 0;
  const peak = hasPositiveVolume ? peakVolumeHour(availableVolumeHours) : null;
  const wet = wetHours(availableVolumeHours);
  const firstWet = wet[0] ?? null;
  const maximum = Math.max(0.1, ...values);
  const noPositiveVolumeDetail = hasCompleteVolumeWindow
    ? "Sem volume previsto"
    : "Sem volume positivo nos horários informados";

  return (
    <section
      className="rain-hourly-volume-context"
      id="volume-de-chuva-por-hora"
      aria-labelledby="rain-hourly-volume-title"
    >
      <header>
        <div>
          <span>Próximas 12 horas</span>
          <h2 id="rain-hourly-volume-title">Volume previsto</h2>
        </div>
        <p>Milímetros previstos em cada horário.</p>
      </header>

      <dl className="rain-hourly-volume-context__summary" aria-label="Resumo do volume previsto">
        <div>
          <dt><Droplets aria-hidden="true" /> {hasCompleteVolumeWindow ? "Total em 12 h" : "Total parcial"}</dt>
          <dd>{formatMm(total)}</dd>
          {!hasCompleteVolumeWindow ? <small>{availableVolumeHours.length} de {hours.length} horários</small> : null}
        </div>
        <div>
          <dt><CloudRain aria-hidden="true" /> Maior volume em 1 h</dt>
          <dd>{peak ? formatMm(peak.precipitationMm) : "Nenhum"}</dd>
          <small>{peak ? `Por volta de ${formatHour(peak.timestamp)}` : noPositiveVolumeDetail}</small>
        </div>
        <div>
          <dt><Droplets aria-hidden="true" /> Primeiro volume</dt>
          <dd>{firstWet ? formatHour(firstWet.timestamp) : "Nenhum"}</dd>
          {firstWet ? <small>{formatMm(firstWet.precipitationMm)}</small> : null}
        </div>
      </dl>

      <div className="rain-hourly-volume-context__timeline" aria-label="Volume e chance de chuva por hora">
        {hours.map((hour, index) => {
          const volumeKnown = hour.precipitationMm !== null;
          const volume = hour.precipitationMm ?? 0;
          const style = {
            "--rain-hourly-volume": `${Math.max(0, Math.min(100, (volume / maximum) * 100))}%`,
          } as CSSProperties;

          return (
            <article
              className={volumeKnown ? undefined : "is-unknown"}
              key={`${hour.timestamp}-${index}`}
              style={style}
            >
              <header>
                <strong>{formatHour(hour.timestamp)}</strong>
                <span>{chanceLabel(hour.precipitationProbability)}</span>
              </header>
              <div>
                <strong>{formatMm(hour.precipitationMm)}</strong>
                <small>{volumeKnown ? "previsto" : "não informado"}</small>
              </div>
              <i aria-hidden="true"><span /></i>
            </article>
          );
        })}
      </div>

      <UpdateFooter forecastFetchedAt={forecastFetchedAt} />
    </section>
  );
}
