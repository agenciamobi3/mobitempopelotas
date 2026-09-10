import { Activity, ArrowDownRight, ArrowUpRight, Clock3, ExternalLink, Waves } from "lucide-react";
import { useEffect, useId, useRef } from "react";

import {
  deriveRecentHydrologyMovement,
  type HydrologyRecentMovement,
} from "@/lib/hydrology/level-movement";
import type { LaranjalLevelData } from "@/lib/hydrology/laranjal-level.server";

import styles from "./LaranjalLevelEmbed.module.css";

const CHART_WIDTH = 640;
const CHART_HEIGHT = 210;
const CHART_PADDING = { top: 26, right: 22, bottom: 42, left: 48 } as const;
const GAP_MULTIPLIER = 2.5;

type NormalizedSeriesPoint = LaranjalLevelData["series"][number] & {
  epoch: number;
};

type ChartCoordinate = NormalizedSeriesPoint & {
  x: number;
  y: number;
};

function formatDateTime(value: string | null) {
  if (!value) return "Horário indisponível";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Horário indisponível";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

function formatLevel(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDelta(first: number, latest: number) {
  const deltaCm = (latest - first) * 100;
  const normalized = Math.abs(deltaCm) < 0.05 ? 0 : deltaCm;
  const prefix = normalized > 0 ? "+" : "";
  return `${prefix}${new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 1,
  }).format(normalized)} cm`;
}

function formatMovementRate(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 1,
  }).format(Math.abs(value));
}

function formatChartTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

function normalizeSeries(points: LaranjalLevelData["series"]) {
  const byTimestamp = new Map<number, NormalizedSeriesPoint>();

  for (const point of points) {
    const epoch = new Date(point.timestamp).getTime();
    if (!Number.isFinite(point.level) || !Number.isFinite(epoch)) continue;
    byTimestamp.set(epoch, { ...point, epoch });
  }

  return [...byTimestamp.values()].sort((left, right) => left.epoch - right.epoch);
}

function median(values: number[]) {
  if (values.length === 0) return null;
  const ordered = [...values].sort((left, right) => left - right);
  const middle = Math.floor(ordered.length / 2);
  if (ordered.length % 2 === 1) return ordered[middle] ?? null;
  const left = ordered[middle - 1];
  const right = ordered[middle];
  return left === undefined || right === undefined ? null : (left + right) / 2;
}

function gapThreshold(points: NormalizedSeriesPoint[]) {
  if (points.length < 3) return Number.POSITIVE_INFINITY;
  const intervals = points
    .slice(1)
    .map((point, index) => point.epoch - points[index]!.epoch)
    .filter((interval) => interval > 0);
  const typicalInterval = median(intervals);
  if (typicalInterval === null) return Number.POSITIVE_INFINITY;
  return Math.max(typicalInterval * GAP_MULTIPLIER, 60 * 60 * 1_000);
}

function splitOnGaps<T extends { epoch: number }>(points: T[], threshold: number) {
  if (points.length === 0) return [] as T[][];
  const segments: T[][] = [[points[0]!]];

  for (let index = 1; index < points.length; index += 1) {
    const point = points[index]!;
    const previous = points[index - 1]!;
    if (point.epoch - previous.epoch > threshold) {
      segments.push([point]);
    } else {
      segments.at(-1)!.push(point);
    }
  }

  return segments;
}

function movementFromSeries(points: LaranjalLevelData["series"]) {
  const normalized = normalizeSeries(points);
  const latestSegment = splitOnGaps(normalized, gapThreshold(normalized)).at(-1) ?? [];
  return deriveRecentHydrologyMovement(latestSegment, "m");
}

function movementPresentation(movement: HydrologyRecentMovement) {
  if (movement.direction === "unavailable" || movement.rateCmPerHour === null) {
    return { label: "Tendência recente indisponível", className: styles.neutral, Icon: Activity };
  }

  const rate = formatMovementRate(movement.rateCmPerHour);
  if (movement.direction === "rising") {
    return {
      label: `Subindo ${rate} cm/h`,
      className: styles.rising,
      Icon: ArrowUpRight,
    };
  }
  if (movement.direction === "falling") {
    return {
      label: `Baixando ${rate} cm/h`,
      className: styles.falling,
      Icon: ArrowDownRight,
    };
  }
  return {
    label: `Praticamente estável · ${rate} cm/h`,
    className: styles.neutral,
    Icon: Activity,
  };
}

function MiniChart({ data }: { data: LaranjalLevelData }) {
  const gradientId = `embed-laranjal-area-${useId().replace(/:/g, "")}`;
  const points = normalizeSeries(data.series);

  if (points.length < 2) {
    return (
      <div className={styles.chartUnavailable} role="status">
        <Activity aria-hidden="true" />
        <div>
          <strong>Histórico recente indisponível</strong>
          <span>A fonte não forneceu uma série suficiente para desenhar uma curva real.</span>
        </div>
      </div>
    );
  }

  const values = points.map((point) => point.level);
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const minimumIndex = values.indexOf(minimum);
  const maximumIndex = values.indexOf(maximum);
  const first = points[0]!;
  const latest = points.at(-1)!;
  const firstEpoch = first.epoch;
  const latestEpoch = latest.epoch;
  const timeRange = Math.max(1, latestEpoch - firstEpoch);
  const rawRange = Math.max(0.02, maximum - minimum);
  const domainPadding = Math.max(0.012, rawRange * 0.18);
  const domainMinimum = minimum - domainPadding;
  const domainMaximum = maximum + domainPadding;
  const domainRange = domainMaximum - domainMinimum;
  const plotWidth = CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right;
  const plotHeight = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;
  const xForEpoch = (epoch: number) =>
    CHART_PADDING.left + ((epoch - firstEpoch) / timeRange) * plotWidth;
  const yForLevel = (level: number) =>
    CHART_PADDING.top + ((domainMaximum - level) / domainRange) * plotHeight;
  const coordinates: ChartCoordinate[] = points.map((point) => ({
    ...point,
    x: xForEpoch(point.epoch),
    y: yForLevel(point.level),
  }));
  const segments = splitOnGaps(coordinates, gapThreshold(points));
  const hasGaps = segments.length > 1;
  const baseline = CHART_PADDING.top + plotHeight;
  const yTicks = Array.from({ length: 4 }, (_, index) => {
    const ratio = index / 3;
    return {
      value: domainMaximum - ratio * domainRange,
      y: CHART_PADDING.top + ratio * plotHeight,
    };
  });
  const middleIndex = Math.floor((coordinates.length - 1) / 2);
  const xTicks = [coordinates[0]!, coordinates[middleIndex]!, coordinates.at(-1)!].filter(
    (point, index, array) => array.findIndex((candidate) => candidate.epoch === point.epoch) === index,
  );
  const minimumCoordinate = coordinates[minimumIndex]!;
  const maximumCoordinate = coordinates[maximumIndex]!;
  const latestCoordinate = coordinates.at(-1)!;

  return (
    <section className={styles.chart} aria-label="Resumo e evolução recente do nível">
      <div className={styles.chartSummary} aria-label="Resumo das últimas medições">
        <article>
          <span>Variação</span>
          <strong>{formatDelta(first.level, latest.level)}</strong>
          <small>Na janela exibida</small>
        </article>
        <article>
          <span>Mínimo</span>
          <strong>{formatLevel(minimum)} m</strong>
          <small>{formatChartTime(points[minimumIndex]!.timestamp)}</small>
        </article>
        <article>
          <span>Máximo</span>
          <strong>{formatLevel(maximum)} m</strong>
          <small>{formatChartTime(points[maximumIndex]!.timestamp)}</small>
        </article>
        <article>
          <span>Medições</span>
          <strong>{points.length}</strong>
          <small>Pontos válidos</small>
        </article>
      </div>

      <div
        className={styles.chartViewport}
        role="region"
        tabIndex={0}
        aria-label={`Evolução recente do nível da Lagoa dos Patos em ${data.source.location}`}
      >
        <svg
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          role="img"
          aria-label={`Série de nível de ${formatLevel(minimum)} a ${formatLevel(maximum)} metros, com leitura mais recente de ${formatLevel(latest.level)} metros`}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" />
              <stop offset="60%" stopColor="currentColor" stopOpacity="0.11" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0.015" />
            </linearGradient>
          </defs>

          {yTicks.map((tick, index) => (
            <g className={styles.chartGrid} key={`y-${index}`}>
              <line
                x1={CHART_PADDING.left}
                x2={CHART_WIDTH - CHART_PADDING.right}
                y1={tick.y}
                y2={tick.y}
              />
              <text x={CHART_PADDING.left - 8} y={tick.y + 3} textAnchor="end">
                {formatLevel(tick.value)}
              </text>
            </g>
          ))}

          {xTicks.map((point) => (
            <g className={`${styles.chartGrid} ${styles.chartGridVertical}`} key={`x-${point.epoch}`}>
              <line
                x1={point.x}
                x2={point.x}
                y1={CHART_PADDING.top}
                y2={baseline}
              />
              <text x={point.x} y={CHART_HEIGHT - 13} textAnchor="middle">
                {formatChartTime(point.timestamp)}
              </text>
            </g>
          ))}

          {segments.map((segment, index) => {
            if (segment.length < 2) return null;
            const line = segment.map((point) => `${point.x},${point.y}`).join(" ");
            const area = [
              `M ${segment[0]!.x} ${baseline}`,
              ...segment.map((point) => `L ${point.x} ${point.y}`),
              `L ${segment.at(-1)!.x} ${baseline}`,
              "Z",
            ].join(" ");
            return (
              <g key={`segment-${index}`}>
                <path className={styles.chartArea} d={area} fill={`url(#${gradientId})`} />
                <polyline
                  className={styles.chartLine}
                  points={line}
                  fill="none"
                  vectorEffect="non-scaling-stroke"
                />
              </g>
            );
          })}

          {coordinates.map((point, index) => (
            <circle
              className={styles.chartHitPoint}
              cx={point.x}
              cy={point.y}
              r="9"
              key={`${point.epoch}-${index}`}
            >
              <title>{`${formatLevel(point.level)} m em ${formatChartTime(point.timestamp)}`}</title>
            </circle>
          ))}

          {minimumIndex !== maximumIndex && minimumIndex !== coordinates.length - 1 ? (
            <g className={`${styles.chartMarker} ${styles.chartMarkerMinimum}`}>
              <circle cx={minimumCoordinate.x} cy={minimumCoordinate.y} r="4.5" />
              <text
                x={minimumCoordinate.x}
                y={Math.min(baseline - 8, minimumCoordinate.y + 18)}
                textAnchor="middle"
              >
                mín
              </text>
            </g>
          ) : null}

          {minimumIndex !== maximumIndex && maximumIndex !== coordinates.length - 1 ? (
            <g className={`${styles.chartMarker} ${styles.chartMarkerMaximum}`}>
              <circle cx={maximumCoordinate.x} cy={maximumCoordinate.y} r="4.5" />
              <text
                x={maximumCoordinate.x}
                y={Math.max(CHART_PADDING.top + 12, maximumCoordinate.y - 9)}
                textAnchor="middle"
              >
                máx
              </text>
            </g>
          ) : null}

          <line
            className={styles.chartLatestGuide}
            x1={CHART_PADDING.left}
            x2={latestCoordinate.x}
            y1={latestCoordinate.y}
            y2={latestCoordinate.y}
          />
          <g className={`${styles.chartMarker} ${styles.chartMarkerLatest}`}>
            <circle
              className={styles.chartLatestHalo}
              cx={latestCoordinate.x}
              cy={latestCoordinate.y}
              r="10"
            />
            <circle cx={latestCoordinate.x} cy={latestCoordinate.y} r="5" />
            <text
              x={latestCoordinate.x - 8}
              y={Math.max(CHART_PADDING.top + 13, latestCoordinate.y - 11)}
              textAnchor="end"
            >
              {formatLevel(latest.level)} m
            </text>
          </g>
        </svg>
      </div>

      <div className={styles.chartTimeline}>
        <span>Início · {formatChartTime(first.timestamp)}</span>
        <strong>{formatLevel(minimum)} a {formatLevel(maximum)} m</strong>
        <span>Mais recente · {formatChartTime(latest.timestamp)}</span>
      </div>
      {hasGaps ? (
        <p className={styles.chartNote}>Há lacunas na fonte. O gráfico não liga períodos sem observação.</p>
      ) : null}
    </section>
  );
}

function parentMessageOrigin() {
  try {
    return document.referrer ? new URL(document.referrer).origin : "*";
  } catch {
    return "*";
  }
}

export function LaranjalLevelEmbed({ data }: { data: LaranjalLevelData }) {
  const rootRef = useRef<HTMLElement>(null);
  const movement = movementFromSeries(data.series);
  const trend = movementPresentation(movement);
  const TrendIcon = trend.Icon;
  const live = data.status === "live";
  const contingency = data.source.role === "contingency";
  const locationLabel = contingency ? "Pelotas / RS" : "Praia do Laranjal · Pelotas/RS";

  useEffect(() => {
    const root = rootRef.current;
    if (!root || window.parent === window) return;

    const targetOrigin = parentMessageOrigin();
    const report = () => {
      window.parent.postMessage(
        {
          type: "tempo-pelotas:widget-resize",
          widget: "nivel-laranjal",
          height: Math.ceil(root.getBoundingClientRect().height + 2),
        },
        targetOrigin,
      );
    };

    report();
    const observer = new ResizeObserver(report);
    observer.observe(root);
    window.addEventListener("load", report, { once: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("load", report);
    };
  }, []);

  return (
    <main ref={rootRef} className={styles.viewport}>
      <article className={styles.card} aria-labelledby="embed-laranjal-title">
        <div className={styles.brandLine} aria-hidden="true" />
        <header className={styles.header}>
          <div className={styles.identity}>
            <span className={styles.icon}>
              <Waves aria-hidden="true" />
            </span>
            <div>
              <span className={styles.kicker}>
                {data.source.station} · {locationLabel}
              </span>
              <h1 id="embed-laranjal-title">Nível da Lagoa dos Patos</h1>
            </div>
          </div>
          <span className={`${styles.status} ${live ? styles.live : styles.stale}`}>
            <i aria-hidden="true" />{" "}
            {live ? "Atualizada" : data.status === "stale" ? "Última leitura" : "Indisponível"}
          </span>
        </header>

        <section className={styles.reading} aria-label="Leitura atual">
          <div className={styles.value}>
            <strong>
              {data.currentLevel === null ? "—" : data.currentLevel.toFixed(2).replace(".", ",")}
            </strong>
            <span>m</span>
          </div>
          <div className={`${styles.trend} ${trend.className}`}>
            <TrendIcon aria-hidden="true" />
            <span>{trend.label}</span>
          </div>
        </section>

        <MiniChart data={data} />

        <footer className={styles.footer}>
          <div>
            <Clock3 aria-hidden="true" />
            <span>Atualizado em {formatDateTime(data.updatedAt)}</span>
          </div>
          <a
            href="https://tempopelotas.com.br/nivel-da-lagoa-dos-patos-laranjal"
            target="_blank"
            rel="noopener noreferrer"
          >
            Ver detalhes <ExternalLink aria-hidden="true" />
          </a>
        </footer>

        <p className={styles.source}>
          Fonte: {data.source.name}
          {data.source.reference ? ` · ${data.source.reference}` : ""} · Apresentação: Tempo Pelotas
        </p>
      </article>
    </main>
  );
}
