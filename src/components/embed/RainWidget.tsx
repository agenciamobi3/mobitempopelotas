import { useRouter } from "@tanstack/react-router";
import { useEffect } from "react";

import type { AggregatedWeatherData } from "@/lib/weather/aggregated-weather.types";
import { isWidgetBlockVisible, type WidgetContentDefinition } from "@/lib/widgets/widget-content";

import styles from "./RainWidget.module.css";

const REFRESH_INTERVAL_MS = 10 * 60 * 1_000;
const DETAILS_URL = "https://tempopelotas.com.br/chuva-em-pelotas";

function formatHour(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(parsed);
}

export function RainWidget({
  data,
  content,
}: {
  data: AggregatedWeatherData;
  content?: WidgetContentDefinition;
}) {
  const router = useRouter();
  const today = data.daily[0] ?? null;
  const hours = data.hourly.slice(0, 6);
  const observationSource = data.sources["defesa-civil-rs"];
  const observedRain =
    data.observation.status === "live" && observationSource.usable
      ? data.observation.rain.h24Mm
      : null;
  const showObserved = content ? isWidgetBlockVisible(content, "observed") : true;
  const showToday = content ? isWidgetBlockVisible(content, "today") : true;
  const showHourly = content ? isWidgetBlockVisible(content, "hourly") : true;

  useEffect(() => {
    const interval = window.setInterval(() => void router.invalidate(), REFRESH_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [router]);

  return (
    <main className={styles.viewport} aria-label="Chuva em Pelotas">
      <section className={styles.widget} aria-live="polite">
        <header className={styles.header}>
          <div>
            <span>Tempo Pelotas</span>
            <strong>Chuva em Pelotas</strong>
          </div>
          <a href={DETAILS_URL} target="_blank" rel="noreferrer">Ver detalhes</a>
        </header>

        {showObserved || showToday ? (
          <div className={styles.summary}>
            {showObserved ? (
              <article>
                <span>Medido nas últimas 24 h · Defesa Civil RS</span>
                <strong>{observedRain === null ? "—" : `${observedRain} mm`}</strong>
                <small>Janela móvel da estação selecionada; não é somada à previsão.</small>
              </article>
            ) : null}
            {showToday ? (
              <article>
                <span>Previsão de hoje</span>
                <strong>{today?.rainChance === null || !today ? "—" : `${today.rainChance}%`}</strong>
                <small>{today ? `${today.precipitationMm} mm previstos no dia` : "Dados em atualização"}</small>
              </article>
            ) : null}
          </div>
        ) : null}

        {showHourly ? (
          <div className={styles.hours} aria-label="Previsão de chuva nas próximas horas">
            {hours.length > 0 ? hours.map((hour) => (
              <article key={hour.timestamp ?? hour.time}>
                <strong>{formatHour(hour.timestamp ?? hour.time)}</strong>
                <span>{hour.precipitationProbability === null ? "—" : `${hour.precipitationProbability}%`}</span>
                <small>{hour.precipitationMm ?? 0} mm</small>
              </article>
            )) : <p>Previsão horária em atualização.</p>}
          </div>
        ) : null}

        <footer>
          <span>Observação e previsão são exibidas separadamente.</span>
          <span>Pelotas, RS</span>
        </footer>
      </section>
    </main>
  );
}
