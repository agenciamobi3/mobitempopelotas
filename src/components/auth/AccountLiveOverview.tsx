import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import { getWeatherIntelligence } from "@/lib/weather/weather-intelligence.functions";
import { toProductionAlerts, toProductionWeatherData } from "@/production/adapters/home";
import { weatherConditionLabels } from "@/production/lib/hero-weather-presentation";
import { fallbackWeatherData, type WeatherData } from "@/production/lib/weather-data";

import "./AccountLiveOverview.css";

type LiveStatus = "loading" | "ready" | "unavailable";

type LiveSnapshot = {
  weather: WeatherData;
  officialAlertCount: number;
};

const EMPTY_SNAPSHOT: LiveSnapshot = {
  weather: fallbackWeatherData,
  officialAlertCount: 0,
};

function formatTemperature(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? `${Math.round(value)}°` : "—";
}

function formatPercent(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? `${Math.round(value)}%` : "—";
}

function formatMillimeters(value: number) {
  return `${value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mm`;
}

function formatWind(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? `${Math.round(value)} km/h` : "—";
}

export function AccountLiveOverview() {
  const [status, setStatus] = useState<LiveStatus>("loading");
  const [snapshot, setSnapshot] = useState<LiveSnapshot>(EMPTY_SNAPSHOT);

  useEffect(() => {
    let active = true;

    void getWeatherIntelligence()
      .then((data) => {
        if (!active) return;
        const weather = toProductionWeatherData(data.weather);
        const alerts = toProductionAlerts(data.weather);
        const hasWeather =
          weather.current.available || weather.hourly.length > 0 || weather.daily.length > 0;

        setSnapshot({
          weather,
          officialAlertCount: alerts.alerts.filter((alert) => alert.relevance === "pelotas").length,
        });
        setStatus(hasWeather || alerts.alerts.length > 0 ? "ready" : "unavailable");
      })
      .catch(() => {
        if (!active) return;
        setStatus("unavailable");
      });

    return () => {
      active = false;
    };
  }, []);

  const summary = useMemo(() => {
    const weather = snapshot.weather;
    const today = weather.daily[0] ?? null;
    const nextHours = weather.hourly.slice(0, 6);
    const firstHour = nextHours[0] ?? null;
    const currentTemperature = weather.current.available
      ? weather.current.temperature
      : firstHour?.temperature ?? null;
    const currentIcon = weather.current.icon ?? firstHour?.icon ?? today?.icon ?? null;
    const condition = currentIcon ? weatherConditionLabels[currentIcon] : "Dados em atualização";
    const rainPeak = nextHours.reduce<number | null>((highest, hour) => {
      if (hour.precipitation === null) return highest;
      return highest === null ? hour.precipitation : Math.max(highest, hour.precipitation);
    }, null);
    const rainVolume = nextHours.reduce(
      (total, hour) => total + (hour.precipitationMm ?? 0),
      0,
    );
    const windPeak = nextHours.reduce<number | null>((highest, hour) => {
      const value = hour.windGust ?? hour.windSpeed;
      return highest === null ? value : Math.max(highest, value);
    }, null);

    return {
      currentTemperature,
      condition,
      today,
      rainPeak,
      rainVolume,
      windPeak,
      observedAt: weather.current.updatedAt,
      currentSource: weather.current.source.name,
    };
  }, [snapshot]);

  const loading = status === "loading";

  return (
    <section className="account-live" aria-labelledby="account-live-title">
      <div className="account-live__heading">
        <div>
          <span className="eyebrow">Para mim · Free</span>
          <h2 id="account-live-title">Seu Tempo Pelotas, já resumido</h2>
          <p>
            Um retrato rápido de Pelotas usando a mesma consolidação meteorológica das páginas
            públicas. Entre, confira o que importa e aprofunde só quando precisar.
          </p>
        </div>
        <span className={`account-live__status is-${status}`}>
          {loading ? "Atualizando" : status === "ready" ? "Dados atuais" : "Dados indisponíveis"}
        </span>
      </div>

      <div className="account-live__grid" aria-busy={loading}>
        <article className="account-live__card is-primary">
          <small>{snapshot.weather.current.available ? "Agora · medição" : "Agora · previsão"}</small>
          <strong>{loading ? "—" : formatTemperature(summary.currentTemperature)}</strong>
          <span>{loading ? "Consultando as fontes do portal" : summary.condition}</span>
          <p>
            {loading
              ? ""
              : summary.observedAt
                ? `Atualizado em ${summary.observedAt}`
                : summary.currentSource}
          </p>
          <Link to="/tempo-hoje-pelotas">Ver tempo hoje →</Link>
        </article>

        <article className="account-live__card">
          <small>Hoje</small>
          <strong>
            {loading || !summary.today
              ? "—"
              : `${formatTemperature(summary.today.min)} / ${formatTemperature(summary.today.max)}`}
          </strong>
          <span>
            {loading || !summary.today
              ? "Mínima e máxima em atualização"
              : `${weatherConditionLabels[summary.today.icon]} · chuva ${formatPercent(summary.today.rainChance)}`}
          </span>
          <p>
            {loading || !summary.today
              ? ""
              : `Volume previsto: ${formatMillimeters(summary.today.precipitation)}`}
          </p>
          <Link to="/previsao-7-dias-pelotas">Abrir previsão →</Link>
        </article>

        <article className="account-live__card">
          <small>Próximas horas</small>
          <strong>{loading ? "—" : formatPercent(summary.rainPeak)}</strong>
          <span>Maior chance de chuva nas próximas 6 horas</span>
          <p>
            {loading
              ? ""
              : `${formatMillimeters(summary.rainVolume)} previstos · vento até ${formatWind(summary.windPeak)}`}
          </p>
          <Link to="/chuva-em-pelotas">Ver chuva por horário →</Link>
        </article>

        <article className={`account-live__card is-alert${snapshot.officialAlertCount > 0 ? " has-alert" : ""}`}>
          <small>Avisos oficiais</small>
          <strong>{loading ? "—" : snapshot.officialAlertCount}</strong>
          <span>
            {loading
              ? "Consultando avisos do INMET"
              : snapshot.officialAlertCount === 0
                ? "Nenhum aviso para Pelotas agora"
                : `${snapshot.officialAlertCount} aviso${snapshot.officialAlertCount === 1 ? "" : "s"} com relevância para Pelotas`}
          </span>
          <p>Validade e orientações permanecem na página oficial de alertas do portal.</p>
          <Link to="/alertas">Ver avisos →</Link>
        </article>
      </div>

      {status === "unavailable" ? (
        <p className="account-live__notice" role="status">
          O resumo não conseguiu recuperar dados atuais agora. As páginas públicas continuam
          disponíveis e nenhuma informação demonstrativa foi exibida no lugar dos dados reais.
        </p>
      ) : null}
    </section>
  );
}
