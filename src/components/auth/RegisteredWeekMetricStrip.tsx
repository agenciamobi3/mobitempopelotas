import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";

import {
  getRegisteredEnrichmentAccess,
  type RegisteredEnrichmentAccess,
} from "@/lib/auth/registered-enrichment.functions";
import type { WeatherIntelligenceData } from "@/lib/weather/weather-intelligence.types";

import "./RegisteredWeekMetricStrip.css";

type Day = WeatherIntelligenceData["weather"]["daily"][number];

type WeekMetric = {
  label: string;
  value: string;
  detail: string;
};

function finite(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function formatNumber(value: number, digits = 1) {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function dayLabel(day: Day | undefined) {
  if (!day) return "dia não informado";
  return `${day.weekday} · ${day.date}`;
}

function maxDay(
  days: readonly Day[],
  value: (day: Day) => number | null | undefined,
): { day: Day; value: number } | null {
  let result: { day: Day; value: number } | null = null;

  for (const day of days) {
    const current = value(day);
    if (!finite(current)) continue;
    if (!result || current > result.value) result = { day, value: current };
  }

  return result;
}

function minDay(
  days: readonly Day[],
  value: (day: Day) => number | null | undefined,
): { day: Day; value: number } | null {
  let result: { day: Day; value: number } | null = null;

  for (const day of days) {
    const current = value(day);
    if (!finite(current)) continue;
    if (!result || current < result.value) result = { day, value: current };
  }

  return result;
}

function buildWeekMetrics(data: WeatherIntelligenceData): WeekMetric[] {
  const days = data.weather.daily.slice(0, 7);
  const hottest = maxDay(days, (day) => day.max);
  const coldest = minDay(days, (day) => day.min);
  const gust = maxDay(days, (day) => day.windGust);
  const totalRain = days.reduce(
    (total, day) => total + (finite(day.precipitationMm) ? day.precipitationMm : 0),
    0,
  );
  const rainyDays = days.filter(
    (day) => day.precipitationMm > 0.1 || (finite(day.rainChance) && day.rainChance >= 50),
  ).length;

  return [
    {
      label: "Chuva prevista · 7 dias",
      value: `${formatNumber(totalRain)} mm`,
      detail: `${rainyDays} dia${rainyDays === 1 ? "" : "s"} com volume previsto ou chance de chuva ≥ 50%.`,
    },
    {
      label: "Maior máxima",
      value: hottest ? `${Math.round(hottest.value)}°C` : "—",
      detail: hottest ? dayLabel(hottest.day) : "Sem máxima disponível.",
    },
    {
      label: "Menor mínima",
      value: coldest ? `${Math.round(coldest.value)}°C` : "—",
      detail: coldest ? dayLabel(coldest.day) : "Sem mínima disponível.",
    },
    {
      label: "Rajada mais forte",
      value: gust ? `${Math.round(gust.value)} km/h` : "—",
      detail: gust ? dayLabel(gust.day) : "Sem rajada diária disponível.",
    },
  ];
}

export function RegisteredWeekMetricStrip({ data }: { data: WeatherIntelligenceData }) {
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

  const metrics = useMemo(() => buildWeekMetrics(data), [data]);

  if (!access || access.status !== "authenticated") return null;

  return (
    <section className="registered-week-metrics" aria-label="Dados consolidados da previsão de 7 dias">
      <div className="registered-week-metrics__grid">
        {metrics.map((metric) => (
          <article key={metric.label}>
            <small>{metric.label}</small>
            <strong>{metric.value}</strong>
            <p>{metric.detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
