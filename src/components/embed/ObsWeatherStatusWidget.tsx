import { useRouter } from "@tanstack/react-router";
import { useEffect } from "react";

import type { ObsWeatherStatusData } from "@/lib/weather/obs-weather-status.functions";
import { isWidgetBlockVisible, type WidgetContentDefinition } from "@/lib/widgets/widget-content";
import { WeatherIcon } from "@/production/components/weather-icon";

import styles from "./ObsWeatherStatusWidget.module.css";

const REFRESH_INTERVAL_MS = 5 * 60 * 1_000;

export function ObsWeatherStatusWidget({
  data,
  content,
}: {
  data: ObsWeatherStatusData;
  content?: WidgetContentDefinition;
}) {
  const router = useRouter();
  const live = data.status === "live";
  const showIcon = content ? isWidgetBlockVisible(content, "icon") : true;
  const showCondition = content ? isWidgetBlockVisible(content, "condition") : true;

  useEffect(() => {
    const interval = window.setInterval(() => {
      void router.invalidate();
    }, REFRESH_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [router]);

  return (
    <main className={styles.viewport} aria-label="Status do tempo agora em Pelotas">
      <section
        className={`${styles.widget} ${live ? styles.live : styles.unavailable}`}
        aria-live="polite"
        aria-atomic="true"
      >
        {showIcon ? (
          <div className={styles.icon}>
            <WeatherIcon name={data.icon} title={`Condição atual: ${data.condition}`} />
          </div>
        ) : null}

        <div className={styles.reading}>
          {showCondition ? <span className={styles.condition}>{data.condition}</span> : null}
          <strong className={styles.temperature}>
            {data.temperature === null ? "—" : data.temperature}
            <small>°C</small>
          </strong>
        </div>
      </section>
    </main>
  );
}
