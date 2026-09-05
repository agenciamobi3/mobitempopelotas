import { useEffect, useState } from "react";

import { getWeatherIntelligence } from "@/lib/weather/weather-intelligence.functions";
import type { WeatherIntelligenceData } from "@/lib/weather/weather-intelligence.types";
import { useOpenMeteoIntelligenceRecovery } from "./open-meteo-browser-recovery";

export function hasUsableWeatherIntelligence(data: WeatherIntelligenceData) {
  return Boolean(
    data.weather.current !== null || data.weather.hourly.length > 0 || data.weather.daily.length > 0,
  );
}

function runServerRecovery<T>(run: () => Promise<T>) {
  return Promise.resolve().then(run);
}

/**
 * Mantém o documento shell-first, mas depois da hidratação pede ao backend a
 * consolidação meteorológica completa. Isso permite aproveitar a contingência
 * MET Norway e as demais fontes server-side antes de depender da recuperação
 * direta do Open-Meteo no navegador.
 */
export function useWeatherIntelligenceBrowserRecovery(baseline: WeatherIntelligenceData) {
  const [serverRecoveredData, setServerRecoveredData] = useState(baseline);

  useEffect(() => {
    let active = true;
    setServerRecoveredData(baseline);

    if (hasUsableWeatherIntelligence(baseline)) {
      return () => {
        active = false;
      };
    }

    void runServerRecovery(() => getWeatherIntelligence())
      .then((nextData) => {
        if (!active || !hasUsableWeatherIntelligence(nextData)) return;
        setServerRecoveredData(nextData);
      })
      .catch(() => {
        // Falha síncrona ou assíncrona da server function não derruba o documento;
        // o hook Open-Meteo abaixo continua sendo a contingência client-side.
      });

    return () => {
      active = false;
    };
  }, [baseline]);

  return useOpenMeteoIntelligenceRecovery(serverRecoveredData);
}
