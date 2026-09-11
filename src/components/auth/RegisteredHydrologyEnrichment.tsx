import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";

import {
  getRegisteredEnrichmentAccess,
  type RegisteredEnrichmentAccess,
} from "@/lib/auth/registered-enrichment.functions";
import type {
  DefesaCivilHydroData,
  DefesaCivilHydroStation,
} from "@/lib/hydrology/defesa-civil-rs.server";

import "./RegisteredWeatherEnrichment.css";

type HydrologyPath = "/nivel-do-canal-sao-goncalo" | "/nivel-do-rio-jaguarao";

function finite(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function formatNumber(value: number, digits = 1) {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function formatObservedAt(value: string | null) {
  if (!value) return "Horário não informado";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function freshnessLabel(station: DefesaCivilHydroStation) {
  if (station.freshness === "recent") return "Leitura recente";
  if (station.freshness === "delayed") return "Leitura atrasada";
  if (station.freshness === "old") return "Leitura antiga";
  return "Horário não informado";
}

function nearbyStations(data: DefesaCivilHydroData, station: DefesaCivilHydroStation) {
  return data.stations
    .filter((candidate) => candidate.code !== station.code && candidate.capabilities.riverLevel)
    .sort((a, b) => a.distanceFromPelotasKm - b.distanceFromPelotasKm)
    .slice(0, 4);
}

function RainCard({ station }: { station: DefesaCivilHydroStation }) {
  const values = [
    ["1h", station.rain.h1Mm],
    ["6h", station.rain.h6Mm],
    ["12h", station.rain.h12Mm],
    ["24h", station.rain.h24Mm],
    ["72h", station.rain.h72Mm],
    ["7 dias", station.rain.h168Mm],
  ] as const;

  return (
    <article>
      <small>Chuva na própria estação</small>
      <strong>{finite(station.rain.h24Mm) ? `${formatNumber(station.rain.h24Mm)} mm · 24h` : "Sem acumulado de 24h"}</strong>
      <p>
        {values
          .filter((entry): entry is readonly [string, number] => finite(entry[1]))
          .map(([label, value]) => `${label}: ${formatNumber(value)} mm`)
          .join(" · ") || "A fonte não entregou acumulados utilizáveis nesta consulta."}
      </p>
    </article>
  );
}

export function RegisteredHydrologyEnrichment({
  data,
  stationCode,
  pagePath,
}: {
  data: DefesaCivilHydroData;
  stationCode: string;
  pagePath: HydrologyPath;
}) {
  const loadAccess = useServerFn(getRegisteredEnrichmentAccess);
  const [access, setAccess] = useState<RegisteredEnrichmentAccess | null>(null);

  useEffect(() => {
    let active = true;
    void loadAccess()
      .then((result) => {
        if (active) setAccess(result);
      })
      .catch(() => {
        if (active) setAccess({ status: "unavailable" });
      });
    return () => {
      active = false;
    };
  }, [loadAccess]);

  const station = useMemo(
    () => data.stations.find((candidate) => candidate.code === stationCode) ?? null,
    [data.stations, stationCode],
  );
  const nearby = useMemo(
    () => (station ? nearbyStations(data, station) : []),
    [data, station],
  );

  if (!access || access.status === "unavailable") return null;

  if (access.status === "unauthenticated") {
    return (
      <aside className="registered-enrichment registered-enrichment--teaser" aria-label="Contexto hidrológico gratuito da conta">
        <div>
          <span className="eyebrow">Conta Free</span>
          <strong>Usuários cadastrados recebem mais contexto da mesma rede hidrológica.</strong>
          <p>
            A leitura principal continua pública. A conta gratuita acrescenta freshness, acumulados de chuva,
            capacidade da estação e contexto regional sem transformar cotas diferentes em uma comparação enganosa.
          </p>
        </div>
        <Link to="/conta" search={{ erro: undefined, next: pagePath }}>
          Entrar gratuitamente
        </Link>
      </aside>
    );
  }

  if (!station) {
    return (
      <section className="registered-enrichment" aria-label="Contexto hidrológico da conta Free">
        <span className="eyebrow">Leitura avançada · Conta Free</span>
        <h2>Contexto regional temporariamente indisponível</h2>
        <p className="registered-enrichment__footnote">
          A página pública permanece válida. O bloco adicional não encontrou esta estação no inventário regional da consulta atual.
        </p>
      </section>
    );
  }

  const capabilityCount = Object.values(station.capabilities).filter(Boolean).length;

  return (
    <section className="registered-enrichment" aria-labelledby={`registered-hydro-${station.code}`}>
      <div className="registered-enrichment__heading">
        <div>
          <span className="eyebrow">Leitura avançada · Conta Free</span>
          <h2 id={`registered-hydro-${station.code}`}>Mais contexto da estação e da rede</h2>
          <p>
            O nível público continua sendo o dado central. Aqui a conta Free acrescenta contexto operacional
            da própria estação e da rede oficial, sem converter réguas diferentes para uma falsa escala comum.
          </p>
        </div>
        <span className="registered-enrichment__badge">Free</span>
      </div>

      <div className="registered-enrichment__metrics">
        <article>
          <small>Freshness da leitura</small>
          <strong>{freshnessLabel(station)}</strong>
          <p>
            {finite(station.ageMinutes) ? `${Math.round(station.ageMinutes)} min desde a observação · ` : ""}
            {formatObservedAt(station.observedAt)}.
          </p>
        </article>
        <RainCard station={station} />
        <article>
          <small>Capacidades desta estação</small>
          <strong>{capabilityCount} conjuntos</strong>
          <p>
            {[
              station.capabilities.riverLevel ? "nível" : null,
              station.capabilities.rain ? "chuva" : null,
              station.capabilities.temperature ? "temperatura" : null,
              station.capabilities.humidity ? "umidade" : null,
              station.capabilities.pressure ? "pressão" : null,
              station.capabilities.wind ? "vento" : null,
            ].filter(Boolean).join(" · ") || "Sem capacidades adicionais informadas."}
          </p>
        </article>
        <article>
          <small>Rede regional nesta consulta</small>
          <strong>{data.recentStationCount}/{data.regionalStationCount} recentes</strong>
          <p>{data.statewideStationCount} estações recebidas no inventário estadual da fonte.</p>
        </article>
      </div>

      {nearby.length > 0 ? (
        <div className="registered-enrichment__context">
          <div>
            <strong>Outras réguas da rede</strong>
            <ul>
              {nearby.map((candidate) => (
                <li key={candidate.code}>
                  {candidate.name} · {candidate.code} · {formatNumber(candidate.distanceFromPelotasKm, 0)} km de Pelotas · {freshnessLabel(candidate)}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <strong>Como interpretar</strong>
            <ul>
              <li>As estações aparecem para contexto de rede, não para comparar diretamente suas cotas.</li>
              <li>Nível, datum, localização e referência física continuam próprios de cada régua.</li>
              <li>Chuva acumulada pertence à estação indicada e não representa automaticamente toda a bacia.</li>
            </ul>
          </div>
        </div>
      ) : null}

      <p className="registered-enrichment__footnote">
        Fonte: {data.source.name}. O login organiza e aprofunda a leitura gratuita; não cria uma cobrança sobre os dados da rede.
      </p>
    </section>
  );
}
