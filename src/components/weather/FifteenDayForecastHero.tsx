import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, CalendarDays, CloudRain } from "lucide-react";

import type { ExtendedForecastData } from "@/lib/weather/extended-forecast.types";
import type { DailyForecast } from "@/lib/weather/types";
import type { AdvisoryLevel } from "@/production/lib/weather-insights";

import { WeatherSplitHero, type WeatherSplitHeroTone } from "./WeatherSplitHero";

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "horário não informado";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

function formatMillimeters(value: number) {
  return `${value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mm`;
}

function formatGust(value: number | null) {
  if (value === null) return "Não informada";
  if (value <= 0) return "Sem rajada prevista";
  return `${value} km/h`;
}

function toneFromAdvisory(level: AdvisoryLevel, hasDays: boolean): WeatherSplitHeroTone {
  if (!hasDays) return "unknown";
  if (level === "warning") return "strong";
  if (level === "attention") return "elevated";
  return "moderate";
}

function rainScore(day: DailyForecast) {
  return (day.rainChance ?? 0) + day.precipitationMm * 4;
}

export function FifteenDayForecastHero({
  forecast,
  advisoryLevel,
}: {
  forecast: ExtendedForecastData;
  advisoryLevel: AdvisoryLevel;
}) {
  const days = forecast.days.slice(0, 15);
  const hasDays = days.length > 0;
  const minimum = hasDays ? Math.min(...days.map((day) => day.min)) : null;
  const maximum = hasDays ? Math.max(...days.map((day) => day.max)) : null;
  const rainyDays = days.filter(
    (day) => (day.rainChance ?? 0) >= 30 || day.precipitationMm >= 1,
  );
  const strongestGust = days.reduce<number | null>((highest, day) => {
    if (day.windGust === null) return highest;
    return highest === null ? day.windGust : Math.max(highest, day.windGust);
  }, null);
  const rainiestDay = days.reduce<DailyForecast | null>(
    (selected, day) => (!selected || rainScore(day) > rainScore(selected) ? day : selected),
    null,
  );
  const hasRainSignal = Boolean(
    rainiestDay && ((rainiestDay.rainChance ?? 0) > 0 || rainiestDay.precipitationMm > 0),
  );
  const lastDay = days.at(-1) ?? null;

  return (
    <WeatherSplitHero
      className="fifteen-day-forecast-hero"
      titleId="fifteen-day-forecast-hero-title"
      back={
        <Link className="weather-split-hero__back" to="/previsao-7-dias-pelotas">
          <ArrowLeft aria-hidden="true" /> Previsão de 7 dias
        </Link>
      }
      eyebrow="Previsão estendida · Pelotas"
      title="Previsão do tempo em Pelotas para os próximos 15 dias"
      description="Compare mínima, máxima, chuva e rajadas dia a dia. Os dias mais distantes servem para planejamento e devem ser confirmados novamente conforme a data se aproxima."
      actions={
        <>
          <a href="#previsao-15-dias-dia-a-dia">
            Ver os 15 dias <ArrowRight aria-hidden="true" />
          </a>
          <Link to="/tempo-hoje-pelotas">Ver previsão de hoje</Link>
        </>
      }
      tone={toneFromAdvisory(advisoryLevel, hasDays)}
      badgeIcon={<CalendarDays aria-hidden="true" />}
      badgeLabel={forecast.status === "live" ? "Janela completa disponível" : forecast.status === "partial" ? "Janela parcial disponível" : "Previsão em atualização"}
      updatedLabel={formatDateTime(forecast.source.fetchedAt)}
      currentLabel="Horizonte disponível"
      currentValue={hasDays ? `${days.length} dias` : "—"}
      currentDetail={lastDay ? `De hoje até ${lastDay.date}` : "Dias ainda não disponíveis"}
      highlightIcon={<CloudRain aria-hidden="true" />}
      highlightLabel="Maior sinal de chuva na janela"
      highlightValue={hasRainSignal && rainiestDay ? rainiestDay.weekday : "Sem destaque"}
      highlightDetail={
        hasRainSignal && rainiestDay
          ? `${rainiestDay.rainChance === null ? "chance não informada" : `${rainiestDay.rainChance}% de chance`} · ${formatMillimeters(rainiestDay.precipitationMm)}`
          : "Nenhum dia tem volume ou chance positiva nesta atualização"
      }
      facts={[
        { label: "Menor mínima", value: minimum === null ? "—" : `${minimum}°` },
        { label: "Maior máxima", value: maximum === null ? "—" : `${maximum}°` },
        { label: "Dias com sinal de chuva", value: hasDays ? `${rainyDays.length} de ${days.length}` : "—" },
        { label: "Rajada mais forte", value: formatGust(strongestGust) },
      ]}
      footer="A previsão diária vem do Open-Meteo Best Match. A incerteza aumenta com o horizonte; alertas oficiais não são projetados automaticamente para os 15 dias."
    />
  );
}
