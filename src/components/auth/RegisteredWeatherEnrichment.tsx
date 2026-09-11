import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";

import {
  getRegisteredEnrichmentAccess,
  type RegisteredEnrichmentAccess,
} from "@/lib/auth/registered-enrichment.functions";
import type { WeatherDataSourceKey } from "@/lib/weather/aggregated-weather.types";
import type { WeatherIntelligenceData } from "@/lib/weather/weather-intelligence.types";

import "./RegisteredWeatherEnrichment.css";

type EnrichmentVariant = "today" | "rain" | "wind" | "week";
type EnrichmentPath =
  | "/tempo-hoje-pelotas"
  | "/chuva-em-pelotas"
  | "/vento-em-pelotas"
  | "/previsao-7-dias-pelotas";

type Metric = {
  label: string;
  value: string;
  detail: string;
};

type Hour = WeatherIntelligenceData["weather"]["hourly"][number];
type Day = WeatherIntelligenceData["weather"]["daily"][number];

const SOURCE_LABELS: Record<WeatherDataSourceKey, string> = {
  embrapa: "Embrapa",
  "defesa-civil-rs": "Defesa Civil RS",
  inmet: "INMET",
  cppmet: "CPPMet/UFPel",
  "open-meteo": "Open-Meteo",
  "met-norway": "MET Norway",
};

const CONFIDENCE_LABELS = {
  high: "Alta",
  medium: "Moderada",
  low: "Baixa",
} as const;

function finite(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function formatNumber(value: number, digits = 1) {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function hourLabel(hour: Hour | undefined) {
  if (!hour) return "horário não informado";
  if (hour.timestamp) {
    const date = new Date(hour.timestamp);
    if (!Number.isNaN(date.getTime())) {
      return new Intl.DateTimeFormat("pt-BR", {
        timeZone: "America/Sao_Paulo",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
    }
  }
  return hour.time;
}

function dayLabel(day: Day | undefined) {
  if (!day) return "dia não informado";
  return `${day.weekday} · ${day.date}`;
}

function maxHour(
  hours: readonly Hour[],
  value: (hour: Hour) => number | null | undefined,
): { hour: Hour; value: number } | null {
  let result: { hour: Hour; value: number } | null = null;
  for (const hour of hours) {
    const current = value(hour);
    if (!finite(current)) continue;
    if (!result || current > result.value) result = { hour, value: current };
  }
  return result;
}

function minHour(
  hours: readonly Hour[],
  value: (hour: Hour) => number | null | undefined,
): { hour: Hour; value: number } | null {
  let result: { hour: Hour; value: number } | null = null;
  for (const hour of hours) {
    const current = value(hour);
    if (!finite(current)) continue;
    if (!result || current < result.value) result = { hour, value: current };
  }
  return result;
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

function precipitationSum(hours: readonly Hour[]) {
  return hours.reduce((total, hour) => total + (finite(hour.precipitationMm) ? hour.precipitationMm : 0), 0);
}

function todayMetrics(data: WeatherIntelligenceData): Metric[] {
  const next6 = data.weather.hourly.slice(0, 6);
  const next12 = data.weather.hourly.slice(0, 12);
  const visibility = minHour(next6, (hour) => hour.visibilityKm);
  const lowClouds = maxHour(next6, (hour) => hour.cloudCoverLow);
  const cape = maxHour(next12, (hour) => hour.cape);
  const saturation = minHour(next6, (hour) =>
    finite(hour.dewPoint) ? Math.abs(hour.temperature - hour.dewPoint) : null,
  );

  return [
    {
      label: "Visibilidade mínima · 6h",
      value: visibility ? `${formatNumber(visibility.value)} km` : "—",
      detail: visibility ? `Menor valor previsto perto de ${hourLabel(visibility.hour)}.` : "Sem leitura horária disponível.",
    },
    {
      label: "Nuvens baixas · 6h",
      value: lowClouds ? `${Math.round(lowClouds.value)}%` : "—",
      detail: lowClouds ? `Maior cobertura prevista perto de ${hourLabel(lowClouds.hour)}.` : "Sem camada baixa disponível.",
    },
    {
      label: "Instabilidade · 12h",
      value: cape ? `${Math.round(cape.value)} J/kg` : "—",
      detail: cape ? `Maior CAPE previsto perto de ${hourLabel(cape.hour)}.` : "CAPE não disponível nesta consulta.",
    },
    {
      label: "Temperatura × orvalho · 6h",
      value: saturation ? `${formatNumber(saturation.value)}°C` : "—",
      detail: saturation
        ? `Menor diferença prevista perto de ${hourLabel(saturation.hour)}; quanto menor, mais próximo o ar está da saturação.`
        : "Ponto de orvalho não disponível nesta consulta.",
    },
  ];
}

function rainMetrics(data: WeatherIntelligenceData): Metric[] {
  const next6 = data.weather.hourly.slice(0, 6);
  const next12 = data.weather.hourly.slice(0, 12);
  const next24 = data.weather.hourly.slice(0, 24);
  const peakChance = maxHour(next24, (hour) => hour.precipitationProbability);
  const peakVolume = maxHour(next24, (hour) => hour.precipitationMm);

  return [
    {
      label: "Acumulado previsto · 6h",
      value: `${formatNumber(precipitationSum(next6))} mm`,
      detail: "Soma dos volumes horários disponíveis na previsão.",
    },
    {
      label: "Acumulado previsto · 12h",
      value: `${formatNumber(precipitationSum(next12))} mm`,
      detail: "Janela intermediária para acompanhar mudança de cenário ao longo do dia.",
    },
    {
      label: "Acumulado previsto · 24h",
      value: `${formatNumber(precipitationSum(next24))} mm`,
      detail: "Não é chuva já medida; é a soma da previsão horária das próximas 24 horas.",
    },
    {
      label: "Pico horário previsto",
      value: peakVolume ? `${formatNumber(peakVolume.value)} mm` : "—",
      detail: peakVolume
        ? `${hourLabel(peakVolume.hour)}${peakChance ? ` · maior chance chega a ${Math.round(peakChance.value)}% perto de ${hourLabel(peakChance.hour)}` : ""}.`
        : "Sem volume horário disponível.",
    },
  ];
}

function windMetrics(data: WeatherIntelligenceData): Metric[] {
  const next6 = data.weather.hourly.slice(0, 6);
  const next12 = data.weather.hourly.slice(0, 12);
  const next24 = data.weather.hourly.slice(0, 24);
  const gust6 = maxHour(next6, (hour) => hour.windGust ?? hour.windSpeed);
  const gust12 = maxHour(next12, (hour) => hour.windGust ?? hour.windSpeed);
  const gust24 = maxHour(next24, (hour) => hour.windGust ?? hour.windSpeed);
  const sustained24 = maxHour(next24, (hour) => hour.windSpeed);
  const strongerHours = next24.filter((hour) => (hour.windGust ?? hour.windSpeed) >= 50).length;

  return [
    {
      label: "Maior rajada · 6h",
      value: gust6 ? `${Math.round(gust6.value)} km/h` : "—",
      detail: gust6 ? `Pico previsto perto de ${hourLabel(gust6.hour)}.` : "Sem rajada disponível.",
    },
    {
      label: "Maior rajada · 12h",
      value: gust12 ? `${Math.round(gust12.value)} km/h` : "—",
      detail: gust12 ? `Pico previsto perto de ${hourLabel(gust12.hour)}.` : "Sem rajada disponível.",
    },
    {
      label: "Maior rajada · 24h",
      value: gust24 ? `${Math.round(gust24.value)} km/h` : "—",
      detail: gust24
        ? `Pico perto de ${hourLabel(gust24.hour)}${finite(gust24.hour.windDirectionDegrees) ? ` · direção ${Math.round(gust24.hour.windDirectionDegrees)}°` : ""}.`
        : "Sem rajada disponível.",
    },
    {
      label: "Vento mais forte · 24h",
      value: sustained24 ? `${Math.round(sustained24.value)} km/h` : "—",
      detail: sustained24
        ? `${hourLabel(sustained24.hour)} · ${strongerHours} hora${strongerHours === 1 ? "" : "s"} com rajada prevista ≥ 50 km/h.`
        : "Sem vento horário disponível.",
    },
  ];
}

function weekMetrics(data: WeatherIntelligenceData): Metric[] {
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

function variantMetrics(variant: EnrichmentVariant, data: WeatherIntelligenceData) {
  if (variant === "rain") return rainMetrics(data);
  if (variant === "wind") return windMetrics(data);
  if (variant === "week") return weekMetrics(data);
  return todayMetrics(data);
}

function sourceLabel(source: WeatherDataSourceKey | null | undefined) {
  return source ? SOURCE_LABELS[source] : "Não informado";
}

function discrepancyText(data: WeatherIntelligenceData) {
  return data.weather.quality.discrepancies.slice(0, 3).map((item) => {
    const day = item.day ? ` em ${item.day}` : "";
    return `${sourceLabel(item.referenceSource)} e ${sourceLabel(item.comparisonSource)} diferem ${formatNumber(item.difference)} ${item.unit}${day}.`;
  });
}

export function RegisteredWeatherEnrichment({
  data,
  variant,
  pagePath,
}: {
  data: WeatherIntelligenceData;
  variant: EnrichmentVariant;
  pagePath: EnrichmentPath;
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

  const metrics = useMemo(() => variantMetrics(variant, data), [data, variant]);
  const discrepancies = useMemo(() => discrepancyText(data), [data]);

  if (!access || access.status === "unavailable") return null;

  if (access.status === "unauthenticated") {
    return (
      <aside className="registered-enrichment registered-enrichment--teaser" aria-label="Recursos gratuitos da conta">
        <div>
          <span className="eyebrow">Conta Free</span>
          <strong>Há uma leitura mais detalhada disponível para usuários cadastrados.</strong>
          <p>
            A informação pública desta página continua aberta. Ao entrar gratuitamente, você também vê
            sínteses avançadas, qualidade da consolidação e rastreabilidade das fontes usadas nesta leitura.
          </p>
        </div>
        <Link to="/conta" search={{ erro: undefined, next: pagePath }}>
          Entrar gratuitamente
        </Link>
      </aside>
    );
  }

  const quality = data.weather.quality;
  const notes = quality.notes.slice(0, 3);
  const degraded = quality.degradedSources.map(sourceLabel);

  return (
    <section className="registered-enrichment" aria-labelledby={`registered-enrichment-${variant}`}>
      <div className="registered-enrichment__heading">
        <div>
          <span className="eyebrow">Leitura avançada · Conta Free</span>
          <h2 id={`registered-enrichment-${variant}`}>Mais contexto sobre os mesmos dados</h2>
          <p>
            Esta camada não vende nem substitui a informação pública. Ela reorganiza campos já consolidados
            pelo Tempo Pelotas e mostra mais contexto para quem usa uma conta gratuita.
          </p>
        </div>
        <span className="registered-enrichment__badge">Free</span>
      </div>

      <div className="registered-enrichment__metrics">
        {metrics.map((metric) => (
          <article key={metric.label}>
            <small>{metric.label}</small>
            <strong>{metric.value}</strong>
            <p>{metric.detail}</p>
          </article>
        ))}
      </div>

      <div className="registered-enrichment__trace">
        <article>
          <small>Qualidade da consolidação</small>
          <strong>{CONFIDENCE_LABELS[quality.confidence]} · {quality.score}/100</strong>
          <p>
            Observação: {sourceLabel(quality.currentSource)}
            {finite(quality.observationAgeMinutes) ? ` · ${Math.round(quality.observationAgeMinutes)} min de idade` : ""}.
          </p>
        </article>
        <article>
          <small>Previsão usada</small>
          <strong>{quality.forecastProvider ?? sourceLabel(quality.forecastSource)}</strong>
          <p>
            {degraded.length > 0
              ? `Fontes degradadas ou indisponíveis nesta consolidação: ${degraded.join(", ")}.`
              : "Nenhuma fonte marcada como degradada nesta consolidação."}
          </p>
        </article>
      </div>

      {discrepancies.length > 0 || notes.length > 0 ? (
        <div className="registered-enrichment__context">
          {discrepancies.length > 0 ? (
            <div>
              <strong>Diferenças entre fontes</strong>
              <ul>
                {discrepancies.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
          ) : null}
          {notes.length > 0 ? (
            <div>
              <strong>Contexto da coleta</strong>
              <ul>
                {notes.map((note) => <li key={note}>{note}</li>)}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}

      <p className="registered-enrichment__footnote">
        Valores derivados continuam sujeitos às limitações, horários e referências das fontes originais.
        O login organiza a experiência; não transforma dados públicos em conteúdo pago.
      </p>
    </section>
  );
}
