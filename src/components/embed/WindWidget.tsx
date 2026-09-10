import { useRouter } from "@tanstack/react-router";
import { useEffect } from "react";

import type { AggregatedWeatherData } from "@/lib/weather/aggregated-weather.types";
import { isWidgetBlockVisible, type WidgetContentDefinition } from "@/lib/widgets/widget-content";

import styles from "./WindWidget.module.css";

const REFRESH_INTERVAL_MS = 10 * 60 * 1_000;
const DETAILS_URL = "https://tempopelotas.com.br/vento-em-pelotas";

function formatHour(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(parsed);
}

export function WindWidget({
  data,
  content,
}: {
  data: AggregatedWeatherData;
  content?: WidgetContentDefinition;
}) {
  const router = useRouter();
  const hours = data.hourly.slice(0, 6);
  const current = data.current;
  const showCurrentWind = content ? isWidgetBlockVisible(content, "current-wind") : true;
  const showCurrentGust = content ? isWidgetBlockVisible(content, "current-gust") : true;
  const showHourly = content ? isWidgetBlockVisible(content, "hourly") : true;

  useEffect(() => {
    const interval = window.setInterval(() => void router.invalidate(), REFRESH_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [router]);

  return (
    <main className={styles.viewport} aria-label="Vento e rajadas em Pelotas">
      <section className={styles.widget} aria-live="polite">
        <header className={styles.header}>
          <div>
            <span>Tempo Pelotas</span>
            <strong>Vento e rajadas</strong>
          </div>
          <a href={DETAILS_URL} target="_blank" rel="noreferrer">Ver detalhes</a>
        </header>

        {showCurrentWind || showCurrentGust ? (
          <div className={styles.current}>
            {showCurrentWind ? (
              <article>
                <span>Vento atual</span>
                <strong>{current?.windSpeed === null || !current ? "—" : `${current.windSpeed} km/h`}</strong>
                <small>{current?.windDirection ? `Direção ${current.windDirection}` : "Direção em atualização"}</small>
              </article>
            ) : null}
            {showCurrentGust ? (
              <article>
                <span>Rajada atual</span>
                <strong>{current?.windGust === null || !current ? "—" : `${current.windGust} km/h`}</strong>
                <small>Leitura consolidada do Tempo Pelotas.</small>
              </article>
            ) : null}
          </div>
        ) : null}

        {showHourly ? (
          <div className={styles.hours} aria-label="Vento previsto nas próximas horas">
            {hours.length > 0 ? hours.map((hour) => (
              <article key={hour.timestamp ?? hour.time}>
                <strong>{formatHour(hour.timestamp ?? hour.time)}</strong>
                <span>{hour.windSpeed} km/h</span>
                <small>{hour.windGust === null ? "Rajada —" : `Rajada ${hour.windGust}`}</small>
              </article>
            )) : <p>Previsão horária de vento em atualização.</p>}
          </div>
        ) : null}

        <footer>
          <span>Velocidade e rajadas podem variar entre bairros.</span>
          <span>Pelotas, RS</span>
        </footer>
      </section>
    </main>
  );
}
