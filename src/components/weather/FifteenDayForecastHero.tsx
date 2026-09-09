import {
  CalendarRange,
  CloudRain,
  Thermometer,
  Wind,
} from "lucide-react";

import type { ExtendedForecastData } from "@/lib/weather/extended-forecast.types";
import type { DailyForecast } from "@/lib/weather/types";
import type { AdvisoryLevel } from "@/production/lib/weather-insights";

import "./FifteenDayForecastHero.css";

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

function strongestGustDay(days: DailyForecast[]) {
  const informed = days.filter((day) => day.windGust !== null);
  if (!informed.length) return null;
  return informed.reduce((selected, day) =>
    (day.windGust ?? -1) > (selected.windGust ?? -1) ? day : selected,
  );
}

function wettestDay(days: DailyForecast[]) {
  if (!days.length) return null;
  return days.reduce((selected, day) =>
    day.precipitationMm > selected.precipitationMm ? day : selected,
  );
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
  const wettest = wettestDay(days);
  const windiest = strongestGustDay(days);
  const lastDay = days.at(-1) ?? null;

  return (
    <section
      className={`fifteen-day-retail-hero fifteen-day-retail-hero--${advisoryLevel}`}
      aria-labelledby="fifteen-day-retail-hero-title"
    >
      <div className="fifteen-day-retail-hero__inner">
        <div className="fifteen-day-retail-hero__copy">
          <span className="fifteen-day-retail-hero__eyebrow">
            <CalendarRange aria-hidden="true" /> Previsão estendida · Pelotas
          </span>

          <h1 id="fifteen-day-retail-hero-title">Previsão de 15 dias para Pelotas</h1>

          <p>
            {hasDays
              ? `Temperaturas entre ${minimum}° e ${maximum}°. Consulte chuva, rajadas e a faixa térmica de cada dia. A segunda semana pode mudar mais conforme a data se aproxima.`
              : "A previsão estendida está em atualização. A previsão de 7 dias continua disponível enquanto a janela maior é carregada."}
          </p>

          <div className="fifteen-day-retail-hero__meta" aria-label="Situação da previsão estendida">
            <span>
              <CalendarRange aria-hidden="true" /> {days.length} de 15 dias disponíveis
            </span>
            {lastDay ? <span>Até {lastDay.date}</span> : null}
            {forecast.status === "partial" ? <span>Janela parcial nesta atualização</span> : null}
          </div>
        </div>

        <div className="fifteen-day-retail-hero__summary">
          <div className="fifteen-day-retail-hero__window">
            <span className="fifteen-day-retail-hero__window-icon">
              <CalendarRange aria-hidden="true" />
            </span>
            <div>
              <small>Janela disponível</small>
              <strong>{hasDays ? `${days.length} dias de previsão` : "Em atualização"}</strong>
              <span>Atualizado em {formatDateTime(forecast.source.fetchedAt)}</span>
            </div>
          </div>

          <div className="fifteen-day-retail-hero__facts" aria-label="Destaques da previsão de 15 dias">
            <article>
              <span className="fifteen-day-retail-hero__fact-label">
                <Thermometer aria-hidden="true" /> Temperaturas
              </span>
              <strong>{minimum === null || maximum === null ? "—" : `${minimum}° a ${maximum}°`}</strong>
              <small>Faixa prevista na janela disponível</small>
            </article>

            <article>
              <span className="fifteen-day-retail-hero__fact-label">
                <CloudRain aria-hidden="true" /> Maior volume
              </span>
              <strong>
                {!wettest || wettest.precipitationMm <= 0
                  ? "Sem volume"
                  : formatMillimeters(wettest.precipitationMm)}
              </strong>
              <small>
                {!wettest || wettest.precipitationMm <= 0
                  ? "Nos dias disponíveis"
                  : `${wettest.weekday}${wettest.rainChance === null ? "" : ` · ${wettest.rainChance}%`}`}
              </small>
            </article>

            <article>
              <span className="fifteen-day-retail-hero__fact-label">
                <Wind aria-hidden="true" /> Rajadas
              </span>
              <strong>
                {!windiest
                  ? "—"
                  : (windiest.windGust ?? 0) > 0
                    ? `${windiest.windGust} km/h`
                    : "Sem rajadas"}
              </strong>
              <small>
                {!windiest
                  ? "Não informadas"
                  : (windiest.windGust ?? 0) > 0
                    ? windiest.weekday
                    : "Nos dias disponíveis"}
              </small>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
