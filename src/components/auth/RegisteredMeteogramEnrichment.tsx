import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";

import {
  getRegisteredEnrichmentAccess,
  type RegisteredEnrichmentAccess,
} from "@/lib/auth/registered-enrichment.functions";
import type { MeteogramData, MeteogramHour } from "@/lib/weather/meteogram.server";
import type { WeatherIntelligenceData } from "@/lib/weather/weather-intelligence.types";

import "./RegisteredWeatherEnrichment.css";

function finite(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function formatNumber(value: number, digits = 1) {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function hourLabel(hour: MeteogramHour | undefined) {
  if (!hour) return "horário não informado";
  const date = new Date(hour.timestamp);
  if (Number.isNaN(date.getTime())) return hour.timestamp;
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function sumRain(hours: readonly MeteogramHour[]) {
  return hours.reduce(
    (total, hour) => total + (finite(hour.precipitationMm) ? hour.precipitationMm : 0),
    0,
  );
}

function maxHour(
  hours: readonly MeteogramHour[],
  value: (hour: MeteogramHour) => number | null | undefined,
) {
  let result: { hour: MeteogramHour; value: number } | null = null;
  for (const hour of hours) {
    const current = value(hour);
    if (!finite(current)) continue;
    if (!result || current > result.value) result = { hour, value: current };
  }
  return result;
}

function minHour(
  hours: readonly MeteogramHour[],
  value: (hour: MeteogramHour) => number | null | undefined,
) {
  let result: { hour: MeteogramHour; value: number } | null = null;
  for (const hour of hours) {
    const current = value(hour);
    if (!finite(current)) continue;
    if (!result || current < result.value) result = { hour, value: current };
  }
  return result;
}

function pressureRange(hours: readonly MeteogramHour[]) {
  const values = hours.flatMap((hour) => (finite(hour.pressure) ? [hour.pressure] : []));
  if (values.length === 0) return null;
  return { minimum: Math.min(...values), maximum: Math.max(...values) };
}

function fallbackHours(weather: WeatherIntelligenceData): MeteogramHour[] {
  const sourceTime = Date.parse(weather.weather.source.fetchedAt);

  return weather.weather.hourly.map((hour, index) => ({
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

export function RegisteredMeteogramEnrichment({
  meteogram,
  weather,
}: {
  meteogram: MeteogramData;
  weather: WeatherIntelligenceData;
}) {
  const loadAccess = useServerFn(getRegisteredEnrichmentAccess);
  const [access, setAccess] = useState<RegisteredEnrichmentAccess | null>(null);

  useEffect(() => {
    let active = true;
    void loadAccess()
      .then((result) => {
        if (active) setAccess(result);
      })
      .catch(() => {
        if (active) setAccess({ status: "unavailable" });
      });
    return () => {
      active = false;
    };
  }, [loadAccess]);

  const summary = useMemo(() => {
    const hours =
      meteogram.status === "live" && meteogram.hours.length > 0
        ? meteogram.hours.slice(0, 48)
        : fallbackHours(weather).slice(0, 48);
    const next12 = hours.slice(0, 12);
    const next24 = hours.slice(0, 24);
    const visibility = minHour(hours, (hour) => hour.visibilityKm);
    const cape = maxHour(hours, (hour) => hour.cape);
    const gust = maxHour(hours, (hour) => hour.windGust ?? hour.windSpeed);
    const saturation = minHour(hours, (hour) =>
      finite(hour.temperature) && finite(hour.dewPoint)
        ? Math.abs(hour.temperature - hour.dewPoint)
        : null,
    );
    return {
      hours,
      rain12: sumRain(next12),
      rain24: sumRain(next24),
      rain48: sumRain(hours),
      visibility,
      cape,
      gust,
      saturation,
      pressure: pressureRange(hours),
    };
  }, [meteogram.hours, meteogram.status, weather]);

  if (!access || access.status === "unavailable") return null;

  if (access.status === "unauthenticated") {
    return (
      <aside className="registered-enrichment registered-enrichment--teaser" aria-label="Leitura técnica gratuita do meteograma">
        <div>
          <span className="eyebrow">Conta Free</span>
          <strong>Transforme as 48 horas do meteograma em uma leitura resumida.</strong>
          <p>
            O meteograma completo continua público. A conta gratuita acrescenta acumulados, extremos e contexto
            técnico usando exatamente os horários já carregados nesta página.
          </p>
        </div>
        <Link to="/conta" search={{ erro: undefined, next: "/meteograma-pelotas" }}>
          Entrar gratuitamente
        </Link>
      </aside>
    );
  }

  const unavailable = summary.hours.length === 0;

  return (
    <section className="registered-enrichment" aria-labelledby="registered-meteogram">
      <div className="registered-enrichment__heading">
        <div>
          <span className="eyebrow">Leitura Inteligente</span>
          <h2 id="registered-meteogram">Os principais extremos das próximas 48 horas</h2>
          <p>
            O objetivo não é substituir o gráfico hora a hora, mas destacar as janelas e extremos que merecem
            uma segunda olhada.
          </p>
        </div>
        <span className="registered-enrichment__badge">Free</span>
      </div>

      {unavailable ? (
        <p className="registered-enrichment__footnote">
          Ainda não há horários utilizáveis para montar esta leitura nesta atualização.
        </p>
      ) : (
        <>
          <div className="registered-enrichment__metrics">
            <article>
              <small>Chuva · 12h / 24h / 48h</small>
              <strong>{formatNumber(summary.rain24)} mm · 24h</strong>
              <p>{formatNumber(summary.rain12)} mm em 12h · {formatNumber(summary.rain48)} mm em toda a janela disponível.</p>
            </article>
            <article>
              <small>Menor visibilidade</small>
              <strong>{summary.visibility ? `${formatNumber(summary.visibility.value)} km` : "—"}</strong>
              <p>{summary.visibility ? `Prevista perto de ${hourLabel(summary.visibility.hour)}.` : "Visibilidade não disponível."}</p>
            </article>
            <article>
              <small>Maior CAPE</small>
              <strong>{summary.cape ? `${Math.round(summary.cape.value)} J/kg` : "—"}</strong>
              <p>{summary.cape ? `Maior valor previsto perto de ${hourLabel(summary.cape.hour)}.` : "CAPE não disponível."}</p>
            </article>
            <article>
              <small>Maior rajada</small>
              <strong>{summary.gust ? `${Math.round(summary.gust.value)} km/h` : "—"}</strong>
              <p>{summary.gust ? `Pico previsto perto de ${hourLabel(summary.gust.hour)}.` : "Rajada não disponível."}</p>
            </article>
          </div>

          <div className="registered-enrichment__trace">
            <article>
              <small>Temperatura × ponto de orvalho</small>
              <strong>{summary.saturation ? `${formatNumber(summary.saturation.value)}°C` : "—"}</strong>
              <p>
                {summary.saturation
                  ? `Menor diferença perto de ${hourLabel(summary.saturation.hour)}; proximidade indica ar mais próximo da saturação, não confirmação de neblina.`
                  : "Ponto de orvalho insuficiente para esta síntese."}
              </p>
            </article>
            <article>
              <small>Faixa de pressão</small>
              <strong>{summary.pressure ? `${formatNumber(summary.pressure.minimum, 0)}–${formatNumber(summary.pressure.maximum, 0)} hPa` : "—"}</strong>
              <p>Extremos encontrados somente entre os horários efetivamente retornados nesta atualização.</p>
            </article>
          </div>
        </>
      )}
    </section>
  );
}
