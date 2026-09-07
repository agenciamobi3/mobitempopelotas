"use client";

import { Link } from "@tanstack/react-router";
import { CloudRain, Droplets, Gauge, MapPin, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

import { getDefesaCivilHydroData } from "@/lib/hydrology/defesa-civil-rs.functions";
import type { WeatherIntelligenceData } from "@/lib/weather/weather-intelligence.types";

import "./RainAccumulationContext.css";

type RegionalRainData = Awaited<ReturnType<typeof getDefesaCivilHydroData>>;
type RegionalRainStation = RegionalRainData["stations"][number];

type RegionalRainState =
  | { status: "loading"; data: null }
  | { status: "ready"; data: RegionalRainData }
  | { status: "error"; data: null };

function formatMillimeters(value: number | null | undefined) {
  return value === null || value === undefined || !Number.isFinite(value)
    ? "Não informado"
    : `${value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mm`;
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "horário não informado";
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

function freshnessLabel(station: RegionalRainStation) {
  if (station.freshness === "recent") return "Leitura recente";
  if (station.freshness === "delayed") return "Leitura com atraso";
  return "Leitura antiga";
}

function RegionalRainfallObservations() {
  const [state, setState] = useState<RegionalRainState>({ status: "loading", data: null });

  useEffect(() => {
    let active = true;

    void getDefesaCivilHydroData()
      .then((data) => {
        if (active) setState({ status: "ready", data });
      })
      .catch(() => {
        if (active) setState({ status: "error", data: null });
      });

    return () => {
      active = false;
    };
  }, []);

  if (state.status === "loading") {
    return (
      <div className="rain-accumulation__regional-state" role="status">
        <RefreshCw aria-hidden="true" />
        <span>Carregando chuva das estações regionais…</span>
      </div>
    );
  }

  if (state.status === "error" || state.data.status === "unavailable") {
    return (
      <div className="rain-accumulation__regional-state" role="status">
        <CloudRain aria-hidden="true" />
        <span>Os acumulados regionais da Defesa Civil RS estão indisponíveis agora.</span>
      </div>
    );
  }

  if (state.data.status === "disabled") return null;

  const stations = state.data.stations
    .filter(
      (station) =>
        station.capabilities.rain &&
        station.rain.h24Mm !== null &&
        (station.freshness === "recent" || station.freshness === "delayed"),
    )
    .slice(0, 4);

  if (!stations.length) {
    return (
      <div className="rain-accumulation__regional-state" role="status">
        <CloudRain aria-hidden="true" />
        <span>Não há acumulado recente de 24 horas nas estações regionais disponíveis.</span>
      </div>
    );
  }

  return (
    <div className="rain-accumulation__regional">
      <header>
        <div>
          <h3>Chuva em 24 horas nas estações próximas</h3>
        </div>
        <a href={state.data.source.mapUrl} target="_blank" rel="noopener noreferrer">
          Mapa da Defesa Civil RS
        </a>
      </header>

      <div className="rain-accumulation__regional-grid">
        {stations.map((station) => (
          <article key={station.code}>
            <div className="rain-accumulation__station-heading">
              <MapPin aria-hidden="true" />
              <div>
                <strong>{station.name}</strong>
                <small>{Math.round(station.distanceFromPelotasKm)} km de Pelotas</small>
              </div>
            </div>
            <dl>
              <div><dt>24 h</dt><dd>{formatMillimeters(station.rain.h24Mm)}</dd></div>
              <div><dt>6 h</dt><dd>{formatMillimeters(station.rain.h6Mm)}</dd></div>
              <div><dt>1 h</dt><dd>{formatMillimeters(station.rain.h1Mm)}</dd></div>
            </dl>
            <small>{freshnessLabel(station)} · {formatDateTime(station.observedAt)}</small>
          </article>
        ))}
      </div>

      <p className="rain-accumulation__regional-note">
        Cada valor pertence à estação indicada. Não representa automaticamente toda Pelotas.
      </p>
    </div>
  );
}

export function RainAccumulationContext({ data }: { data: WeatherIntelligenceData }) {
  const weather = data.weather;
  const observation = weather.observation;
  const embrapaHealth = weather.sources.embrapa.status;
  const observationIsCurrent =
    observation.status !== "unavailable" &&
    (embrapaHealth === "live" || embrapaHealth === "partial");
  const observationHasKnownValue = observation.accumulated.rainDaily !== null;
  const today = weather.daily[0] ?? null;
  const forecastDays = weather.daily.slice(0, 7);
  const forecastSevenDays = forecastDays.length
    ? forecastDays.reduce((total, day) => total + day.precipitationMm, 0)
    : null;
  const observationTime = observation.source.observationTime ?? observation.source.fetchedAt;

  return (
    <section
      className="rain-accumulation"
      id="chuva-acumulada"
      aria-labelledby="rain-accumulation-title"
    >
      <header className="rain-accumulation__heading">
        <div>
          <h2 id="rain-accumulation-title">Chuva medida e prevista</h2>
        </div>
        <p>Os valores medidos e previstos ficam separados porque podem cobrir horas em comum.</p>
      </header>

      <div className="rain-accumulation__summary">
        <article className="is-observed">
          <Droplets aria-hidden="true" />
          <span>{observationIsCurrent ? "Chuva medida hoje" : "Último acumulado diário"}</span>
          <strong>{formatMillimeters(observation.accumulated.rainDaily)}</strong>
          <small>
            {observationHasKnownValue
              ? `${observation.source.station} · ${formatDateTime(observationTime)}`
              : "Sem acumulado diário disponível nesta leitura."}
          </small>
        </article>

        <article className="is-observed">
          <Gauge aria-hidden="true" />
          <span>Chuva medida no mês</span>
          <strong>{formatMillimeters(observation.accumulated.rainMonthly)}</strong>
          <small>Embrapa Clima Temperado</small>
        </article>

        <article className="is-forecast">
          <CloudRain aria-hidden="true" />
          <span>Previsto para hoje</span>
          <strong>{formatMillimeters(today?.precipitationMm)}</strong>
          <small>Previsão, não medição</small>
        </article>

        <article className="is-forecast">
          <CloudRain aria-hidden="true" />
          <span>Previsto em 7 dias</span>
          <strong>{formatMillimeters(forecastSevenDays)}</strong>
          <small>{forecastDays.length ? `${forecastDays.length} dias disponíveis` : "Em atualização"}</small>
        </article>
      </div>

      <div className="rain-accumulation__rule">
        <strong>Não some os dois valores.</strong>
        <p>A chuva medida e a prevista podem incluir parte do mesmo período.</p>
        <Link to="/metodologia">Ver metodologia</Link>
      </div>

      <RegionalRainfallObservations />
    </section>
  );
}
