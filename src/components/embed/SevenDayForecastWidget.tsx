import { useRouter } from "@tanstack/react-router";
import { useEffect } from "react";

import type { AggregatedWeatherData } from "@/lib/weather/aggregated-weather.types";
import type { DailyForecast } from "@/lib/weather/types";
import { isWidgetBlockVisible, type WidgetContentDefinition } from "@/lib/widgets/widget-content";
import { WeatherIcon } from "@/production/components/weather-icon";

import styles from "./SevenDayForecastWidget.module.css";

const REFRESH_INTERVAL_MS = 15 * 60 * 1_000;
const DETAILS_URL = "https://tempopelotas.com.br/previsao-7-dias-pelotas";

function formatRain(day: DailyForecast) {
  const chance = day.rainChance === null ? "chance n/d" : `${day.rainChance}%`;
  return `${chance} · ${day.precipitationMm} mm`;
}

function formatGust(day: DailyForecast) {
  if (day.windGust === null) return "Rajada n/d";
  if (day.windGust <= 0) return "Sem rajada prevista";
  return `Rajada ${day.windGust} km/h`;
}

function formatUpdatedAt(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "atualização recente";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(parsed);
}

export function SevenDayForecastWidget({
  data,
  content,
}: {
  data: AggregatedWeatherData;
  content?: WidgetContentDefinition;
}) {
  const router = useRouter();
  const days = data.daily.slice(0, 7);
  const showRain = content ? isWidgetBlockVisible(content, "rain") : true;
  const showGusts = content ? isWidgetBlockVisible(content, "gusts") : true;
  const showUpdatedAt = content ? isWidgetBlockVisible(content, "updated-at") : true;

  useEffect(() => {
    const interval = window.setInterval(() => {
      void router.invalidate();
    }, REFRESH_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [router]);

  if (days.length === 0) {
    return (
      <main className={styles.viewport} aria-label="Previsão de 7 dias em Pelotas">
        <section className={`${styles.widget} ${styles.unavailable}`} aria-live="polite">
          <div className={styles.heading}>
            <span>Tempo Pelotas</span>
            <strong>Previsão de 7 dias em atualização</strong>
            <p>Os dados da próxima semana não estão disponíveis nesta atualização.</p>
          </div>
          <a href={DETAILS_URL} target="_blank" rel="noreferrer">
            Conferir no Tempo Pelotas
          </a>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.viewport} aria-label="Previsão de 7 dias em Pelotas">
      <section className={styles.widget} aria-live="polite" aria-atomic="true">
        <header className={styles.header}>
          <div>
            <span>Tempo Pelotas</span>
            <strong>Próximos 7 dias</strong>
          </div>
          {showUpdatedAt ? <small>Atualizado {formatUpdatedAt(data.source.fetchedAt)}</small> : null}
        </header>

        <div className={styles.grid}>
          {days.map((day, index) => (
            <article className={index === 0 ? styles.today : undefined} key={`${day.date}-${day.weekday}`}>
              <header>
                <strong>{day.weekday}</strong>
                <span>{index === 0 ? "Hoje" : index === 1 ? "Amanhã" : day.date}</span>
              </header>

              <div className={styles.condition}>
                <WeatherIcon name={day.icon} title={`Condição prevista para ${day.weekday}`} />
                <strong>
                  {day.min}° <span>/</span> {day.max}°
                </strong>
              </div>

              {showRain || showGusts ? (
                <div className={styles.metrics}>
                  {showRain ? <span>Chuva {formatRain(day)}</span> : null}
                  {showGusts ? <span>{formatGust(day)}</span> : null}
                </div>
              ) : null}
            </article>
          ))}
        </div>

        <footer className={styles.footer}>
          <span>Previsão para Pelotas, RS</span>
          <a href={DETAILS_URL} target="_blank" rel="noreferrer">
            Ver detalhes
          </a>
        </footer>
      </section>
    </main>
  );
}
