"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Clock3, ExternalLink, Gauge, RadioTower, Waves } from "lucide-react";

import {
  regionalDefesaCivilDedicatedPage,
  regionalDefesaCivilStationCodes,
} from "@/lib/hydrology/defesa-civil-regional-pages";

import "./RegionalCityDefesaCivil.css";

type ReadingFreshness = "recent" | "delayed" | "old" | "unknown";

type RegionalDefesaCivilStation = {
  code: string;
  name: string;
  basin: string | null;
  observedAt: string | null;
  freshness: ReadingFreshness;
  capabilities: {
    riverLevel: boolean;
    rain: boolean;
    pressure: boolean;
    humidity: boolean;
    wind: boolean;
    temperature: boolean;
  };
  river: {
    name: string | null;
    levelM: number | null;
    trend: string | null;
  };
};

type RegionalDefesaCivilPayload = {
  status: "disabled" | "live" | "partial" | "unavailable";
  fetchedAt: string;
  source: {
    name: string;
    mapUrl: string;
    documentationUrl: string;
  };
  stations: RegionalDefesaCivilStation[];
  error: string | null;
};

function formatLevel(value: number | null) {
  if (value === null || !Number.isFinite(value)) return null;
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDateTime(value: string | null) {
  if (!value) return "Horário não informado";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Horário não informado";
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function freshnessLabel(value: ReadingFreshness) {
  if (value === "recent") return "Leitura recente";
  if (value === "delayed") return "Leitura atrasada";
  if (value === "old") return "Leitura antiga";
  return "Horário não informado";
}

function capabilitySummary(station: RegionalDefesaCivilStation) {
  const labels: string[] = [];
  if (station.capabilities.riverLevel) labels.push("nível");
  if (station.capabilities.rain) labels.push("chuva");
  if (station.capabilities.temperature) labels.push("temperatura");
  if (station.capabilities.humidity) labels.push("umidade");
  if (station.capabilities.pressure) labels.push("pressão");
  if (station.capabilities.wind) labels.push("vento");
  return labels.join(" · ") || "capacidade não informada";
}

function isPayload(value: unknown): value is RegionalDefesaCivilPayload {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<RegionalDefesaCivilPayload>;
  return Array.isArray(candidate.stations) && !!candidate.source && typeof candidate.source === "object";
}

function StationReading({ station }: { station: RegionalDefesaCivilStation }) {
  const level = formatLevel(station.river.levelM);

  return (
    <article className="regional-defesa-civil__station">
      <header>
        <div>
          <span>{station.code}</span>
          <h3>{station.name}</h3>
          <p>{station.basin ?? "Bacia não informada"}</p>
        </div>
        <strong className={`is-${station.freshness}`}>{freshnessLabel(station.freshness)}</strong>
      </header>

      <div className="regional-defesa-civil__reading">
        <div className="regional-defesa-civil__level">
          <Gauge aria-hidden="true" />
          <span>
            <small>Nível informado pela estação</small>
            <strong>{level === null ? "Não informado" : `${level} m`}</strong>
            <em>{station.river.name ?? "Corpo hídrico não informado"}</em>
          </span>
        </div>
        <div className="regional-defesa-civil__time">
          <Clock3 aria-hidden="true" />
          <span>
            <small>Horário da leitura</small>
            <strong>{formatDateTime(station.observedAt)}</strong>
          </span>
        </div>
      </div>

      {station.river.trend ? (
        <p className="regional-defesa-civil__trend">
          <Waves aria-hidden="true" />
          <span><strong>Tendência informada pela fonte:</strong> {station.river.trend}</span>
        </p>
      ) : null}

      <p className="regional-defesa-civil__capabilities">
        Dados declarados pela estação: {capabilitySummary(station)}.
      </p>
    </article>
  );
}

export function RegionalCityDefesaCivil({
  citySlug,
  cityName,
}: {
  citySlug: string;
  cityName: string;
}) {
  const stationCodes = useMemo(() => regionalDefesaCivilStationCodes(citySlug), [citySlug]);
  const dedicatedPage = useMemo(() => regionalDefesaCivilDedicatedPage(citySlug), [citySlug]);
  const [payload, setPayload] = useState<RegionalDefesaCivilPayload | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "unavailable">("loading");

  useEffect(() => {
    if (!stationCodes) return;
    const controller = new AbortController();

    void fetch("/api/defesa-civil/stations", {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const value: unknown = await response.json();
        if (!isPayload(value)) throw new Error("Payload inesperado da Defesa Civil RS");
        return value;
      })
      .then((value) => {
        if (controller.signal.aborted) return;
        setPayload(value);
        setStatus("ready");
      })
      .catch(() => {
        if (!controller.signal.aborted) setStatus("unavailable");
      });

    return () => controller.abort();
  }, [stationCodes]);

  if (!stationCodes) return null;

  const stations = payload?.stations.filter((station) => stationCodes.includes(station.code)) ?? [];
  const missingCount = stationCodes.length - stations.length;

  return (
    <section
      id="defesa-civil-rs"
      className="regional-defesa-civil"
      aria-labelledby="regional-defesa-civil-title"
    >
      <header className="regional-defesa-civil__heading">
        <div>
          <span><RadioTower aria-hidden="true" /> Rede oficial · Defesa Civil RS</span>
          <h2 id="regional-defesa-civil-title">Monitoramento da Defesa Civil em {cityName}</h2>
        </div>
        <p>
          Este módulo consulta a rede hidrometeorológica separadamente da previsão do tempo. As
          leituras abaixo pertencem às estações indicadas pela fonte oficial e não alteram a previsão
          meteorológica desta página.
        </p>
      </header>

      {status === "loading" ? (
        <p className="regional-defesa-civil__state">
          Consultando as estações da Defesa Civil RS sem bloquear a previsão meteorológica…
        </p>
      ) : null}

      {status === "unavailable" ? (
        <p className="regional-defesa-civil__state is-unavailable">
          A consulta da rede oficial não ficou disponível agora. Nenhum valor ausente é tratado como
          zero ou como condição normal.
        </p>
      ) : null}

      {status === "ready" && stations.length === 0 ? (
        <p className="regional-defesa-civil__state is-unavailable">
          As estações esperadas para {cityName} não apareceram nesta consulta. O Tempo Pelotas não
          substitui esse vazio por uma estação vizinha.
        </p>
      ) : null}

      {stations.length > 0 ? (
        <div className="regional-defesa-civil__stations">
          {stations.map((station) => <StationReading station={station} key={station.code} />)}
        </div>
      ) : null}

      {status === "ready" && missingCount > 0 && stations.length > 0 ? (
        <p className="regional-defesa-civil__partial">
          {missingCount === 1 ? "Uma estação esperada" : `${missingCount} estações esperadas`} não
          apareceu nesta atualização e não foi substituída automaticamente.
        </p>
      ) : null}

      <div className="regional-defesa-civil__reference-note">
        <strong>Como interpretar o nível</strong>
        <p>
          É o nível informado pela estação, em metros, na referência própria deste ponto. O Tempo
          Pelotas ainda não usa esse valor como cota de inundação local, não compara réguas de estações
          diferentes e não converte a tendência da fonte em classificação de risco.
        </p>
      </div>

      {dedicatedPage ? (
        <a className="regional-defesa-civil__dedicated-link" href={dedicatedPage.path}>
          {dedicatedPage.label} <ArrowRight aria-hidden="true" />
        </a>
      ) : null}

      {payload ? (
        <footer>
          <span>Fonte: {payload.source.name}</span>
          <div>
            <a href={payload.source.mapUrl} target="_blank" rel="noopener noreferrer">
              Mapa oficial <ExternalLink aria-hidden="true" />
            </a>
            <a href={payload.source.documentationUrl} target="_blank" rel="noopener noreferrer">
              Documentação oficial <ExternalLink aria-hidden="true" />
            </a>
          </div>
        </footer>
      ) : null}
    </section>
  );
}
