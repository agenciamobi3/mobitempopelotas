import { useRouter } from "@tanstack/react-router";
import { useEffect } from "react";

import type { AggregatedWeatherData } from "@/lib/weather/aggregated-weather.types";

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

export function RainWidget({ data }: { data: AggregatedWeatherData }) {
  const router = useRouter();
  const today = data.daily[0] ?? null;
  const hours = data.hourly.slice(0, 6);
  const embrapaStatus = data.sources.embrapa.status;
  const observedRain =
    data.observation.status !== "unavailable" &&
    (embrapaStatus === "live" || embrapaStatus === "partial")
      ? data.observation.accumulated.rainDaily
      : null;

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

        <div className={styles.summary}>
          <article>
            <span>Medido hoje · Embrapa</span>
            <strong>{observedRain === null ? "—" : `${observedRain} mm`}</strong>
            <small>Chuva observada na estação; não é somada à previsão.</small>
          </article>
          <article>
            <span>Previsão de hoje</span>
            <strong>{today?.rainChance === null || !today ? "—" : `${today.rainChance}%`}</strong>
            <small>{today ? `${today.precipitationMm} mm previstos no dia` : "Dados em atualização"}</small>
          </article>
        </div>

        <div className={styles.hours} aria-label="Previsão de chuva nas próximas horas">
          {hours.length > 0 ? hours.map((hour) => (
            <article key={hour.timestamp ?? hour.time}>
              <strong>{formatHour(hour.timestamp ?? hour.time)}</strong>
              <span>{hour.precipitationProbability === null ? "—" : `${hour.precipitationProbability}%`}</span>
              <small>{hour.precipitationMm ?? 0} mm</small>
            </article>
          )) : <p>Previsão horária em atualização.</p>}
        </div>

        <footer>
          <span>Observação e previsão são exibidas separadamente.</span>
          <span>Pelotas, RS</span>
        </footer>
      </section>
    </main>
  );
}
