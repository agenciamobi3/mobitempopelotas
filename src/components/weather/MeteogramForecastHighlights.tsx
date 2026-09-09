import type { MeteogramData, MeteogramHour } from "@/lib/weather/meteogram.server";

import "./MeteogramForecastHighlights.css";

type NumericValue = number | null | undefined;

function formatNumber(value: NumericValue, unit = "", digits = 0) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "Não informado";
  return `${new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)}${unit}`;
}

function formatLocalHour(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value);
  if (!match) return "horário não informado";
  return `${match[3]}/${match[2]}, ${match[4]}:${match[5]}`;
}

function values(hours: MeteogramHour[], read: (hour: MeteogramHour) => NumericValue) {
  return hours
    .map((hour) => ({ hour, value: read(hour) }))
    .filter((item): item is { hour: MeteogramHour; value: number } =>
      item.value !== null && item.value !== undefined && Number.isFinite(item.value),
    );
}

function extreme(
  hours: MeteogramHour[],
  read: (hour: MeteogramHour) => NumericValue,
  mode: "min" | "max",
) {
  const available = values(hours, read);
  if (!available.length) return null;
  return available.reduce((selected, item) =>
    mode === "max"
      ? item.value > selected.value
        ? item
        : selected
      : item.value < selected.value
        ? item
        : selected,
  );
}

function pressureTrend(hours: MeteogramHour[]) {
  const available = values(hours, (hour) => hour.pressure);
  if (available.length < 2) return null;

  const first = available[0];
  const last = available[available.length - 1];
  const delta = last.value - first.value;
  const label = delta > 1 ? "Subindo" : delta < -1 ? "Caindo" : "Pouca variação";

  return {
    label,
    detail: `${formatNumber(first.value, " hPa", 1)} → ${formatNumber(last.value, " hPa", 1)}`,
  };
}

function rainTotal(hours: MeteogramHour[]) {
  const available = values(hours, (hour) => hour.precipitationMm);
  if (!available.length) return null;
  const total = available.reduce((sum, item) => sum + item.value, 0);

  return {
    value: formatNumber(total, " mm", 1),
    detail:
      available.length === hours.length
        ? "Soma dos horários previstos"
        : `${available.length} de ${hours.length} horários com volume informado`,
  };
}

function Highlight({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <article>
      <span>{label}</span>
      <strong>{value}</strong>
      {detail ? <small>{detail}</small> : null}
    </article>
  );
}

export function MeteogramForecastHighlights({ meteogram }: { meteogram: MeteogramData }) {
  if (meteogram.status !== "live" || meteogram.hours.length === 0) return null;

  const hours = meteogram.hours.slice(0, meteogram.source.forecastHours);
  const minimumTemperature = extreme(hours, (hour) => hour.temperature, "min");
  const maximumTemperature = extreme(hours, (hour) => hour.temperature, "max");
  const rain = rainTotal(hours);
  const maximumRainChance = extreme(hours, (hour) => hour.precipitationProbability, "max");
  const maximumGust = extreme(hours, (hour) => hour.windGust, "max");
  const minimumVisibility = extreme(hours, (hour) => hour.visibilityKm, "min");
  const maximumCape = extreme(hours, (hour) => hour.cape, "max");
  const pressure = pressureTrend(hours);
  const windowLabel = hours.length >= 48 ? "48 horas" : `${hours.length} horas disponíveis`;

  return (
    <section className="meteogram-forecast-highlights" aria-labelledby="meteogram-forecast-highlights-title">
      <header>
        <div>
          <span>Resumo horário</span>
          <h2 id="meteogram-forecast-highlights-title">Destaques das próximas {windowLabel}</h2>
        </div>
        {meteogram.message ? <small>{meteogram.message}</small> : null}
      </header>

      <div className="meteogram-forecast-highlights__grid">
        <Highlight
          label="Temperatura"
          value={
            minimumTemperature && maximumTemperature
              ? `${formatNumber(minimumTemperature.value, "°C")} a ${formatNumber(maximumTemperature.value, "°C")}`
              : "Não informada"
          }
          detail={
            minimumTemperature && maximumTemperature
              ? `Mín. ${formatLocalHour(minimumTemperature.hour.timestamp)} · Máx. ${formatLocalHour(maximumTemperature.hour.timestamp)}`
              : undefined
          }
        />
        <Highlight
          label="Chuva prevista"
          value={rain?.value ?? "Não informada"}
          detail={rain?.detail}
        />
        <Highlight
          label="Maior chance de chuva"
          value={maximumRainChance ? formatNumber(maximumRainChance.value, "%") : "Não informada"}
          detail={maximumRainChance ? formatLocalHour(maximumRainChance.hour.timestamp) : undefined}
        />
        <Highlight
          label="Maior rajada"
          value={maximumGust ? formatNumber(maximumGust.value, " km/h", 1) : "Não informada"}
          detail={maximumGust ? formatLocalHour(maximumGust.hour.timestamp) : undefined}
        />
        <Highlight
          label="Menor visibilidade"
          value={minimumVisibility ? formatNumber(minimumVisibility.value, " km", 1) : "Não informada"}
          detail={minimumVisibility ? formatLocalHour(minimumVisibility.hour.timestamp) : undefined}
        />
        <Highlight
          label="Pressão"
          value={pressure?.label ?? "Não informada"}
          detail={pressure?.detail}
        />
        <Highlight
          label="Maior CAPE"
          value={maximumCape ? formatNumber(maximumCape.value, " J/kg") : "Não informado"}
          detail={maximumCape ? formatLocalHour(maximumCape.hour.timestamp) : undefined}
        />
      </div>
    </section>
  );
}
