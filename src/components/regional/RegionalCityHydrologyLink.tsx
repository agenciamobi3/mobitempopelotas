"use client";

import { useEffect, useState } from "react";
import { ArrowDown, ArrowRight, ArrowUp, Minus, Waves } from "lucide-react";

import {
  findHydrologyLocalityByWeatherCitySlug,
  hydrologyLocalityPath,
} from "@/lib/hydrology/hydrology-localities";
import { deriveRecentHydrologySeriesMovement, type HydrologyRecentMovement } from "@/lib/hydrology/level-movement";
import { getLagoonMonitoringNetwork } from "@/lib/hydrology/lagoon-network.functions";
import type { LagoonMonitoringObservation } from "@/lib/hydrology/lagoon-network.server";

import "./RegionalCityHydrologyLink.css";

function formatNumber(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 1,
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
  }).format(value);
}

function formatDateTime(value: string | null) {
  if (!value) return "Horário indisponível";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Horário indisponível";
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function Trend({ movement }: { movement: HydrologyRecentMovement | null }) {
  if (!movement || movement.rateCmPerHour === null) {
    return <span className="regional-city-water__trend"><Minus aria-hidden="true" /> Movimento recente indisponível</span>;
  }
  if (movement.direction === "stable") {
    return <span className="regional-city-water__trend"><Minus aria-hidden="true" /> Praticamente estável</span>;
  }
  if (movement.direction === "rising") {
    return <span className="regional-city-water__trend is-rising"><ArrowUp aria-hidden="true" /> Subindo {formatNumber(Math.abs(movement.rateCmPerHour))} cm/h</span>;
  }
  return <span className="regional-city-water__trend is-falling"><ArrowDown aria-hidden="true" /> Baixando {formatNumber(Math.abs(movement.rateCmPerHour))} cm/h</span>;
}

export function RegionalCityHydrologyLink({ citySlug }: { citySlug: string }) {
  const locality = findHydrologyLocalityByWeatherCitySlug(citySlug);
  const [observation, setObservation] = useState<LagoonMonitoringObservation | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "unavailable">("loading");

  useEffect(() => {
    if (!locality) return;
    let active = true;

    void getLagoonMonitoringNetwork()
      .then((network) => {
        if (!active) return;
        setObservation(network.observations.find((item) => item.station.id === locality.stationId) ?? null);
        setStatus("ready");
      })
      .catch(() => {
        if (active) setStatus("unavailable");
      });

    return () => { active = false; };
  }, [locality]);

  if (!locality) return null;
  const path = hydrologyLocalityPath(locality);
  const available = observation?.currentLevelCm !== null && observation?.currentLevelCm !== undefined;
  const movement = observation
    ? deriveRecentHydrologySeriesMovement(
        observation.series.map((point) => ({ timestamp: point.timestamp, level: point.levelCm })),
        "cm",
      )
    : null;

  return (
    <section id="aguas" className="regional-city-water" aria-labelledby="regional-city-water-title">
      <header><div><span>Águas em {locality.name}</span><h2 id="regional-city-water-title">Nível local da Lagoa dos Patos</h2></div><Waves aria-hidden="true" /></header>
      {status === "loading" ? <p className="regional-city-water__loading">Consultando a leitura hidrológica sem bloquear a previsão meteorológica…</p> : null}
      {status === "ready" && available ? <div className="regional-city-water__reading"><div><strong>{formatNumber(observation!.currentLevelCm)}</strong><span>cm</span><small>Atualizado: {formatDateTime(observation!.updatedAt)}</small></div><Trend movement={movement} /></div> : null}
      {status !== "loading" && !available ? <p className="regional-city-water__unavailable">A leitura local não ficou disponível nesta consulta. A página dedicada mantém o estado da fonte e o histórico recebido.</p> : null}
      <a href={path}>Ver nível, movimento e histórico da água <ArrowRight aria-hidden="true" /></a>
    </section>
  );
}
