import { ArrowRight, Clock3, Minus, TrendingDown, TrendingUp, Waves } from "lucide-react";
import { useState } from "react";

import {
  HYDROLOGY_LOCALITIES,
  hydrologyLocalityPath,
} from "@/lib/hydrology/hydrology-localities";
import type {
  LagoonMonitoringNetworkData,
  LagoonMonitoringObservation,
} from "@/lib/hydrology/lagoon-network.server";
import {
  deriveRecentHydrologySeriesMovement,
  type HydrologyRecentMovement,
} from "@/lib/hydrology/level-movement";

import {
  HydrologyLevelChart,
  type HydrologyLevelChartReference,
} from "./HydrologyLevelChart";
import "./LagoonNetworkLevelExplorer.css";

function formatNumber(value: number | null, maximumFractionDigits = 1) {
  if (value === null || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits,
    minimumFractionDigits: value % 1 === 0 ? 0 : Math.min(1, maximumFractionDigits),
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

function movementState(movement: HydrologyRecentMovement | null) {
  if (!movement || movement.rateCmPerHour === null) {
    return { label: "Movimento recente indisponível", className: "is-unknown", icon: Minus };
  }
  if (movement.direction === "stable") {
    return { label: "Praticamente estável", className: "is-stable", icon: Minus };
  }
  if (movement.direction === "rising") {
    return {
      label: `Subindo ${formatNumber(Math.abs(movement.rateCmPerHour))} cm/h`,
      className: "is-rising",
      icon: TrendingUp,
    };
  }
  return {
    label: `Baixando ${formatNumber(Math.abs(movement.rateCmPerHour))} cm/h`,
    className: "is-falling",
    icon: TrendingDown,
  };
}

function observationMovement(observation: LagoonMonitoringObservation | null) {
  if (!observation) return null;
  return deriveRecentHydrologySeriesMovement(
    observation.series.map((point) => ({ timestamp: point.timestamp, level: point.levelCm })),
    "cm",
  );
}

function statusLabel(observation: LagoonMonitoringObservation | null) {
  if (!observation || observation.status === "unavailable") return "Sem leitura";
  if (observation.status === "stale") return "Leitura atrasada";
  return "Atualizada";
}

function currentLevelLabel(observation: LagoonMonitoringObservation | null) {
  return observation?.currentLevelCm === null || observation?.currentLevelCm === undefined
    ? "—"
    : `${formatNumber(observation.currentLevelCm)} cm`;
}

function selectorReadingLabel(observation: LagoonMonitoringObservation | null) {
  if (observation?.currentLevelCm === null || observation?.currentLevelCm === undefined) {
    return "Sem leitura";
  }
  return `${formatNumber(observation.currentLevelCm)} cm · ${statusLabel(observation)}`;
}

function chartReferences(observation: LagoonMonitoringObservation | null) {
  if (!observation) return [];

  const references: HydrologyLevelChartReference[] = [];
  if (observation.floodLevelCm !== null) {
    references.push({
      label: "Cota local publicada",
      value: observation.floodLevelCm,
      tone: "attention",
    });
  }
  if (observation.may2024MaximumCm !== null) {
    references.push({
      label: "Máxima de maio de 2024",
      value: observation.may2024MaximumCm,
      tone: "reference",
    });
  }
  return references;
}

function chartPoints(observation: LagoonMonitoringObservation | null) {
  if (!observation) return [];
  if (observation.series.length > 0) {
    return observation.series.map((point) => ({
      timestamp: point.timestamp,
      level: point.levelCm,
    }));
  }
  if (observation.currentLevelCm !== null && observation.updatedAt) {
    return [{ timestamp: observation.updatedAt, level: observation.currentLevelCm }];
  }
  return [];
}

export function LagoonNetworkLevelExplorer({ network }: { network: LagoonMonitoringNetworkData }) {
  const stations = HYDROLOGY_LOCALITIES.map((locality) => ({
    locality,
    observation:
      network.observations.find((item) => item.station.id === locality.stationId) ?? null,
  }));
  const initialStationId =
    stations.find((item) => (item.observation?.series.length ?? 0) >= 2)?.locality.stationId ??
    stations.find(
      (item) =>
        item.observation?.currentLevelCm !== null &&
        item.observation?.currentLevelCm !== undefined,
    )?.locality.stationId ??
    stations[0]?.locality.stationId ??
    "";
  const [selectedStationId, setSelectedStationId] = useState(initialStationId);
  const selected =
    stations.find((item) => item.locality.stationId === selectedStationId) ?? stations[0] ?? null;
  const observation = selected?.observation ?? null;
  const locality = selected?.locality ?? null;
  const movement = movementState(observationMovement(observation));
  const MovementIcon = movement.icon;
  const points = chartPoints(observation);
  const references = chartReferences(observation);

  return (
    <section
      className="lagoon-network-level-explorer"
      aria-labelledby="lagoon-network-level-explorer-title"
    >
      <header className="lagoon-network-level-explorer__heading">
        <div>
          <span className="lagoon-locality-eyebrow">Séries de nível por estação</span>
          <h2 id="lagoon-network-level-explorer-title">Veja como o nível mudou em cada ponto</h2>
        </div>
        <p>
          Selecione uma estação para abrir a série recente na referência daquela régua. Os valores
          entre cidades não são convertidos nem somados entre si.
        </p>
      </header>

      <div
        className="lagoon-network-level-explorer__stations"
        role="group"
        aria-label="Selecionar estação da Lagoa dos Patos"
      >
        {stations.map(({ locality: itemLocality, observation: itemObservation }) => {
          const selectedNow = itemLocality.stationId === locality?.stationId;
          return (
            <button
              type="button"
              className={selectedNow ? "is-selected" : undefined}
              aria-pressed={selectedNow}
              onClick={() => setSelectedStationId(itemLocality.stationId)}
              key={itemLocality.stationId}
            >
              <span>{itemLocality.cityLabel}</span>
              <strong>{itemLocality.name}</strong>
              <small>{selectorReadingLabel(itemObservation)}</small>
            </button>
          );
        })}
      </div>

      {locality ? (
        <div className="lagoon-network-level-explorer__selected">
          <div className="lagoon-network-level-explorer__context">
            <div>
              <span>{locality.cityLabel}</span>
              <h3>{locality.stationName}</h3>
              <p>{observation?.station.role ?? "Ponto de monitoramento da Lagoa dos Patos."}</p>
            </div>
            <div className="lagoon-network-level-explorer__reading">
              <Waves aria-hidden="true" />
              <span>
                <small>{statusLabel(observation)}</small>
                <strong>{currentLevelLabel(observation)}</strong>
              </span>
            </div>
            <div className={`lagoon-network-level-explorer__trend ${movement.className}`}>
              <MovementIcon aria-hidden="true" />
              <span>
                <small>Movimento recente</small>
                <strong>{movement.label}</strong>
              </span>
            </div>
            <div className="lagoon-network-level-explorer__updated">
              <Clock3 aria-hidden="true" />
              <span>{formatDateTime(observation?.updatedAt ?? null)}</span>
            </div>
            <a href={hydrologyLocalityPath(locality)}>
              Abrir página da estação <ArrowRight aria-hidden="true" />
            </a>
          </div>

          <HydrologyLevelChart
            points={points}
            unit="cm"
            status={observation?.status ?? "unavailable"}
            ariaLabel={`Evolução recente do nível em ${locality.name}`}
            eyebrow="Série selecionada"
            windowLabel={`${locality.name} · ${locality.stationName}`}
            latestLabel={observation?.status === "stale" ? "Última leitura conhecida" : "Leitura mais recente"}
            singlePointMessage="A estação forneceu apenas a leitura atual nesta consulta. O portal não cria uma curva sem histórico real."
            emptyMessage="A estação selecionada não forneceu medições suficientes para desenhar a série nesta atualização."
            references={references}
          />
        </div>
      ) : (
        <div className="lagoon-network-level-explorer__empty" role="status">
          Nenhuma estação da Lagoa dos Patos está disponível nesta configuração.
        </div>
      )}

      <p className="lagoon-network-level-explorer__note">
        Cada estação possui localização, equipamento e referência próprios. O movimento recente usa
        somente o último trecho contínuo da série selecionada; trocar de estação troca também a régua
        interpretada pelo gráfico.
      </p>
    </section>
  );
}
