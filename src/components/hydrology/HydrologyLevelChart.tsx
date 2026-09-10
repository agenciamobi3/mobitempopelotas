import { Activity } from "lucide-react";
import { useId } from "react";

import "./HydrologyLevelChart.css";

export type HydrologyLevelChartPoint = {
  timestamp: string;
  level: number;
};

export type HydrologyLevelChartReference = {
  label: string;
  value: number;
  tone?: "reference" | "attention" | "warning" | "danger";
};

type HydrologyLevelChartProps = {
  points: HydrologyLevelChartPoint[];
  unit?: "m" | "cm";
  ariaLabel: string;
  status?: "live" | "stale" | "unavailable";
  eyebrow?: string;
  windowLabel?: string;
  latestLabel?: string;
  singlePointMessage?: string;
  emptyMessage?: string;
  references?: HydrologyLevelChartReference[];
  className?: string;
};

type NormalizedPoint = HydrologyLevelChartPoint & {
  epoch: number;
};

type ChartCoordinate = NormalizedPoint & {
  x: number;
  y: number;
};

type RecentMovement = {
  direction: "rising" | "falling" | "stable" | "unavailable";
  label: string;
  rateCmPerHour: number | null;
  changeCm: number | null;
  durationMs: number | null;
  startEpoch: number | null;
};

const WIDTH = 1040;
const HEIGHT = 390;
const PADDING = { top: 38, right: 38, bottom: 58, left: 72 } as const;
const GAP_MULTIPLIER = 2.5;
const RECENT_MOVEMENT_WINDOW_MS = 3 * 60 * 60 * 1_000;
const MOVEMENT_RATE_EPSILON_CM_PER_HOUR = 0.1;

function normalizePoints(points: HydrologyLevelChartPoint[]): NormalizedPoint[] {
  const byTimestamp = new Map<number, NormalizedPoint>();

  for (const point of points) {
    const epoch = new Date(point.timestamp).getTime();
    if (!Number.isFinite(point.level) || !Number.isFinite(epoch)) continue;
    byTimestamp.set(epoch, { ...point, epoch });
  }

  return [...byTimestamp.values()].sort((left, right) => left.epoch - right.epoch);
}

function median(values: number[]) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[middle] ?? null;
  const left = sorted[middle - 1];
  const right = sorted[middle];
  return left === undefined || right === undefined ? null : (left + right) / 2;
}

function gapThreshold(points: NormalizedPoint[]) {
  const intervals = points
    .slice(1)
    .map((point, index) => point.epoch - points[index]!.epoch)
    .filter((interval) => interval > 0);
  const typicalInterval = median(intervals);
  return typicalInterval === null ? Number.POSITIVE_INFINITY : typicalInterval * GAP_MULTIPLIER;
}

function splitCoordinatesOnGaps(coordinates: ChartCoordinate[], thresholdMs: number) {
  if (coordinates.length === 0) return [] as ChartCoordinate[][];

  const segments: ChartCoordinate[][] = [[coordinates[0]!]];
  for (let index = 1; index < coordinates.length; index += 1) {
    const point = coordinates[index]!;
    const previous = coordinates[index - 1]!;
    if (point.epoch - previous.epoch > thresholdMs) {
      segments.push([point]);
    } else {
      segments.at(-1)!.push(point);
    }
  }
  return segments;
}

function toCentimeters(value: number, unit: "m" | "cm") {
  return unit === "m" ? value * 100 : value;
}

function formatCentimeters(value: number, signed = false) {
  const normalized = Math.abs(value) < 0.05 ? 0 : value;
  const prefix = signed && normalized > 0 ? "+" : "";
  return `${prefix}${new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 1,
  }).format(normalized)} cm`;
}

function formatRate(value: number) {
  return `${formatCentimeters(value, true)}/h`;
}

function formatDuration(durationMs: number) {
  const minutes = Math.max(1, Math.round(durationMs / 60_000));
  if (minutes < 60) return `${minutes} min`;
  return `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(minutes / 60)} h`;
}

function movementSymbol(direction: RecentMovement["direction"]) {
  if (direction === "rising") return "↑";
  if (direction === "falling") return "↓";
  if (direction === "stable") return "→";
  return "·";
}

function recentMovement(points: NormalizedPoint[], unit: "m" | "cm"): RecentMovement {
  if (points.length < 2) {
    return {
      direction: "unavailable",
      label: "Sem base suficiente",
      rateCmPerHour: null,
      changeCm: null,
      durationMs: null,
      startEpoch: null,
    };
  }

  const latest = points.at(-1)!;
  const cutoff = latest.epoch - RECENT_MOVEMENT_WINDOW_MS;
  let startIndex = points.findIndex((point) => point.epoch >= cutoff);
  if (startIndex < 0) startIndex = 0;
  if (startIndex === points.length - 1) startIndex = Math.max(0, points.length - 2);

  const start = points[startIndex]!;
  const durationMs = latest.epoch - start.epoch;
  if (durationMs <= 0) {
    return {
      direction: "unavailable",
      label: "Sem base suficiente",
      rateCmPerHour: null,
      changeCm: null,
      durationMs: null,
      startEpoch: null,
    };
  }

  const changeCm = toCentimeters(latest.level - start.level, unit);
  const rateCmPerHour = changeCm / (durationMs / (60 * 60 * 1_000));
  if (!Number.isFinite(rateCmPerHour)) {
    return {
      direction: "unavailable",
      label: "Sem base suficiente",
      rateCmPerHour: null,
      changeCm: null,
      durationMs: null,
      startEpoch: null,
    };
  }

  const direction =
    rateCmPerHour > MOVEMENT_RATE_EPSILON_CM_PER_HOUR
      ? "rising"
      : rateCmPerHour < -MOVEMENT_RATE_EPSILON_CM_PER_HOUR
        ? "falling"
        : "stable";

  return {
    direction,
    label:
      direction === "rising"
        ? "Subindo"
        : direction === "falling"
          ? "Baixando"
          : "Praticamente estável",
    rateCmPerHour,
    changeCm,
    durationMs,
    startEpoch: start.epoch,
  };
}

function formatLevel(value: number, unit: "m" | "cm") {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: unit === "m" ? 2 : value % 1 === 0 ? 0 : 1,
    maximumFractionDigits: unit === "m" ? 2 : 1,
  }).format(value);
}

function formatDelta(first: number, last: number, unit: "m" | "cm") {
  return formatCentimeters(toCentimeters(last - first, unit), true);
}

function formatTime(value: string | number, withDate: boolean) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    ...(withDate ? { day: "2-digit", month: "2-digit" } : {}),
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function markerLabel(prefix: string, value: number, unit: "m" | "cm") {
  return `${prefix} ${formatLevel(value, unit)} ${unit}`;
}

function areaPath(segment: ChartCoordinate[], baselineY: number) {
  if (segment.length < 2) return null;
  return [
    `M ${segment[0]!.x} ${baselineY}`,
    ...segment.map((point) => `L ${point.x} ${point.y}`),
    `L ${segment.at(-1)!.x} ${baselineY}`,
    "Z",
  ].join(" ");
}

export function HydrologyLevelChart({
  points,
  unit = "m",
  ariaLabel,
  status = "live",
  eyebrow = "Série observada",
  windowLabel = "Evolução na janela disponível",
  latestLabel = "Leitura mais recente",
  singlePointMessage =
    "A fonte forneceu apenas a leitura mais recente nesta consulta. O portal não inventa pontos intermediários para formar uma tendência.",
  emptyMessage = "Não há medições suficientes para desenhar o gráfico nesta atualização.",
  references = [],
  className = "",
}: HydrologyLevelChartProps) {
  const gradientId = `hydrology-level-area-${useId().replace(/:/g, "")}`;
  const valid = normalizePoints(points);
  const hasSeries = valid.length >= 2;
  const hasPoint = valid.length >= 1;

  if (!hasPoint) {
    return (
      <div
        className={`hydrology-rich-chart is-${status} is-empty${className ? ` ${className}` : ""}`}
      >
        <div className="hydrology-rich-chart__empty" role="status">
          <Activity aria-hidden="true" />
          <div>
            <strong>Histórico indisponível</strong>
            <span>{emptyMessage}</span>
          </div>
        </div>
      </div>
    );
  }

  const values = valid.map((point) => point.level);
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const first = valid[0]!;
  const latest = valid.at(-1)!;
  const latestIndex = valid.length - 1;
  const minimumIndex = values.indexOf(minimum);
  const maximumIndex = values.indexOf(maximum);
  const rawRange = Math.max(maximum - minimum, unit === "m" ? 0.02 : 2);
  const domainPadding = Math.max(rawRange * 0.16, unit === "m" ? 0.015 : 1.5);
  const domainMinimum = minimum - domainPadding;
  const domainMaximum = maximum + domainPadding;
  const domainRange = domainMaximum - domainMinimum;
  const plotWidth = WIDTH - PADDING.left - PADDING.right;
  const plotHeight = HEIGHT - PADDING.top - PADDING.bottom;
  const firstEpoch = first.epoch;
  const latestEpoch = latest.epoch;
  const timeRange = Math.max(1, latestEpoch - firstEpoch);
  const xForEpoch = (epoch: number) =>
    hasSeries
      ? PADDING.left + ((epoch - firstEpoch) / timeRange) * plotWidth
      : PADDING.left + plotWidth * 0.72;
  const yForValue = (value: number) =>
    PADDING.top + ((domainMaximum - value) / domainRange) * plotHeight;
  const coordinates: ChartCoordinate[] = valid.map((point) => ({
    ...point,
    x: xForEpoch(point.epoch),
    y: yForValue(point.level),
  }));
  const thresholdMs = gapThreshold(valid);
  const segments = splitCoordinatesOnGaps(coordinates, thresholdMs);
  const hasGaps = segments.length > 1;
  const latestSegment = segments.at(-1) ?? [];
  const movement = recentMovement(latestSegment, unit);
  const movementStartEpoch = movement.startEpoch;
  const recentCoordinates =
    movementStartEpoch === null
      ? []
      : latestSegment.filter((point) => point.epoch >= movementStartEpoch);
  const amplitudeCm = hasSeries ? toCentimeters(maximum - minimum, unit) : null;
  const yTicks = Array.from({ length: 5 }, (_, index) => {
    const ratio = index / 4;
    const value = domainMaximum - ratio * domainRange;
    return { value, y: PADDING.top + ratio * plotHeight };
  });
  const xTicks = hasSeries
    ? Array.from({ length: 4 }, (_, index) => {
        const ratio = index / 3;
        const epoch = firstEpoch + ratio * timeRange;
        return {
          epoch,
          x: PADDING.left + ratio * plotWidth,
        };
      })
    : [{ epoch: firstEpoch, x: xForEpoch(firstEpoch) }];
  const withDate = latestEpoch - firstEpoch > 36 * 60 * 60 * 1000;
  const validReferences = references.filter((reference) => Number.isFinite(reference.value));
  const referenceIsVisible = (reference: HydrologyLevelChartReference) =>
    reference.value >= domainMinimum && reference.value <= domainMaximum;
  const visibleReferences = validReferences.filter(referenceIsVisible);
  const latestCoordinate = coordinates.at(-1)!;
  const minimumCoordinate = coordinates[minimumIndex]!;
  const maximumCoordinate = coordinates[maximumIndex]!;
  const baselineY = PADDING.top + plotHeight;

  return (
    <figure
      className={`hydrology-rich-chart is-${status}${hasSeries ? " has-series" : " is-single"}${
        hasGaps ? " has-gaps" : ""
      }${className ? ` ${className}` : ""}`}
    >
      <figcaption className="hydrology-rich-chart__header">
        <div>
          <span>{eyebrow}</span>
          <strong>{windowLabel}</strong>
        </div>
        <small>
          {hasSeries
            ? `${valid.length} medições válidas${hasGaps ? " · série com lacunas" : ""}`
            : "1 leitura disponível"}
        </small>
      </figcaption>

      <div className="hydrology-rich-chart__summary" aria-label="Resumo do gráfico de nível">
        <article>
          <span>{latestLabel}</span>
          <strong>
            {formatLevel(latest.level, unit)} {unit}
          </strong>
          <small>{formatTime(latest.timestamp, true)}</small>
        </article>
        <article>
          <span>Variação na janela</span>
          <strong>{hasSeries ? formatDelta(first.level, latest.level, unit) : "—"}</strong>
          <small>{hasSeries ? "Do primeiro ao último ponto" : "Histórico não fornecido"}</small>
        </article>
        <article>
          <span>Mínimo observado</span>
          <strong>{hasSeries ? `${formatLevel(minimum, unit)} ${unit}` : "—"}</strong>
          <small>{hasSeries ? formatTime(valid[minimumIndex]!.timestamp, true) : "Sem série"}</small>
        </article>
        <article>
          <span>Máximo observado</span>
          <strong>{hasSeries ? `${formatLevel(maximum, unit)} ${unit}` : "—"}</strong>
          <small>{hasSeries ? formatTime(valid[maximumIndex]!.timestamp, true) : "Sem série"}</small>
        </article>
      </div>

      {hasSeries ? (
        <div
          className="hydrology-rich-chart__motion"
          aria-label="Leituras matemáticas derivadas da série observada"
        >
          <article className={`is-${movement.direction}`}>
            <span>Movimento recente</span>
            <strong>
              <b aria-hidden="true">{movementSymbol(movement.direction)}</b>
              {movement.label}
            </strong>
            <small>
              {movement.durationMs === null
                ? "Sem dois pontos contínuos suficientes"
                : `Últimas ${formatDuration(movement.durationMs)} do trecho contínuo`}
            </small>
          </article>
          <article className={`is-${movement.direction}`}>
            <span>Ritmo recente</span>
            <strong>
              {movement.rateCmPerHour === null ? "—" : formatRate(movement.rateCmPerHour)}
            </strong>
            <small>
              {movement.changeCm === null
                ? "Não calculado"
                : `${formatCentimeters(movement.changeCm, true)} no período usado`}
            </small>
          </article>
          <article>
            <span>Amplitude observada</span>
            <strong>{amplitudeCm === null ? "—" : formatCentimeters(amplitudeCm)}</strong>
            <small>Diferença entre o máximo e o mínimo da janela</small>
          </article>
        </div>
      ) : null}

      <div
        className="hydrology-rich-chart__plot"
        role="region"
        tabIndex={0}
        aria-label={`${ariaLabel}. Área rolável horizontalmente quando necessário.`}
      >
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={ariaLabel}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" />
              <stop offset="58%" stopColor="currentColor" stopOpacity="0.11" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0.015" />
            </linearGradient>
          </defs>

          {yTicks.map((tick, index) => (
            <g className="hydrology-rich-chart__grid" key={`y-${index}`}>
              <line x1={PADDING.left} x2={WIDTH - PADDING.right} y1={tick.y} y2={tick.y} />
              <text x={PADDING.left - 12} y={tick.y + 4} textAnchor="end">
                {formatLevel(tick.value, unit)}
              </text>
            </g>
          ))}

          {xTicks.map((tick, index) => (
            <g
              className="hydrology-rich-chart__grid hydrology-rich-chart__grid--vertical"
              key={`x-${index}`}
            >
              <line x1={tick.x} x2={tick.x} y1={PADDING.top} y2={baselineY} />
              <text x={tick.x} y={HEIGHT - 22} textAnchor="middle">
                {formatTime(tick.epoch, withDate)}
              </text>
            </g>
          ))}

          {visibleReferences.map((reference) => {
            const y = yForValue(reference.value);
            return (
              <g
                className={`hydrology-rich-chart__reference is-${reference.tone ?? "reference"}`}
                key={`${reference.label}-${reference.value}`}
              >
                <line x1={PADDING.left} x2={WIDTH - PADDING.right} y1={y} y2={y} />
                <text x={WIDTH - PADDING.right} y={y - 7} textAnchor="end">
                  {reference.label} · {formatLevel(reference.value, unit)} {unit}
                </text>
              </g>
            );
          })}

          {hasSeries
            ? segments.map((segment, index) => {
                const path = areaPath(segment, baselineY);
                return path ? (
                  <path
                    className="hydrology-rich-chart__area"
                    d={path}
                    fill={`url(#${gradientId})`}
                    key={`area-${index}`}
                  />
                ) : null;
              })
            : null}

          <line
            className="hydrology-rich-chart__latest-guide"
            x1={PADDING.left}
            x2={latestCoordinate.x}
            y1={latestCoordinate.y}
            y2={latestCoordinate.y}
          />

          {hasSeries
            ? segments.map((segment, index) =>
                segment.length >= 2 ? (
                  <polyline
                    className="hydrology-rich-chart__line"
                    points={segment.map((point) => `${point.x},${point.y}`).join(" ")}
                    fill="none"
                    vectorEffect="non-scaling-stroke"
                    key={`line-${index}`}
                  />
                ) : null,
              )
            : null}

          {recentCoordinates.length >= 2 && movement.rateCmPerHour !== null ? (
            <polyline
              className={`hydrology-rich-chart__recent-line is-${movement.direction}`}
              points={recentCoordinates.map((point) => `${point.x},${point.y}`).join(" ")}
              fill="none"
              vectorEffect="non-scaling-stroke"
            >
              <title>{`${movement.label}: ${formatRate(movement.rateCmPerHour)} nas últimas ${formatDuration(movement.durationMs!)}`}</title>
            </polyline>
          ) : null}

          {hasSeries
            ? coordinates.map((point, index) => (
                <circle
                  className="hydrology-rich-chart__hit-point"
                  cx={point.x}
                  cy={point.y}
                  r="10"
                  key={`${point.timestamp}-${index}`}
                >
                  <title>{`${formatLevel(point.level, unit)} ${unit} em ${formatTime(point.timestamp, true)}`}</title>
                </circle>
              ))
            : null}

          {hasSeries && minimumIndex !== maximumIndex && minimumIndex !== latestIndex ? (
            <g className="hydrology-rich-chart__marker is-minimum">
              <circle cx={minimumCoordinate.x} cy={minimumCoordinate.y} r="6" />
              <text
                x={minimumCoordinate.x}
                y={Math.min(HEIGHT - PADDING.bottom - 12, minimumCoordinate.y + 26)}
                textAnchor="middle"
              >
                {markerLabel("mín", minimum, unit)}
              </text>
              <title>{`Mínimo: ${formatLevel(minimum, unit)} ${unit} em ${formatTime(valid[minimumIndex]!.timestamp, true)}`}</title>
            </g>
          ) : null}

          {hasSeries && minimumIndex !== maximumIndex && maximumIndex !== latestIndex ? (
            <g className="hydrology-rich-chart__marker is-maximum">
              <circle cx={maximumCoordinate.x} cy={maximumCoordinate.y} r="6" />
              <text
                x={maximumCoordinate.x}
                y={Math.max(PADDING.top + 18, maximumCoordinate.y - 14)}
                textAnchor="middle"
              >
                {markerLabel("máx", maximum, unit)}
              </text>
              <title>{`Máximo: ${formatLevel(maximum, unit)} ${unit} em ${formatTime(valid[maximumIndex]!.timestamp, true)}`}</title>
            </g>
          ) : null}

          <g className="hydrology-rich-chart__marker is-latest">
            <circle
              className="hydrology-rich-chart__latest-halo"
              cx={latestCoordinate.x}
              cy={latestCoordinate.y}
              r="12"
            />
            <circle cx={latestCoordinate.x} cy={latestCoordinate.y} r="6" />
            <text
              x={latestCoordinate.x - 10}
              y={Math.max(PADDING.top + 18, latestCoordinate.y - 15)}
              textAnchor="end"
            >
              {formatLevel(latest.level, unit)} {unit}
            </text>
            <title>{`${latestLabel}: ${formatLevel(latest.level, unit)} ${unit} em ${formatTime(latest.timestamp, true)}`}</title>
          </g>
        </svg>
      </div>

      {hasGaps ? (
        <p className="hydrology-rich-chart__gap-note">
          A linha é interrompida onde existe uma lacuna relevante entre medições. O portal não liga
          artificialmente períodos sem observação.
        </p>
      ) : null}

      {validReferences.length > 0 ? (
        <div className="hydrology-rich-chart__references" aria-label="Referências desta régua">
          <span>Referências desta régua</span>
          <div>
            {validReferences.map((reference) => {
              const outsideScale = !referenceIsVisible(reference);
              return (
                <article
                  className={`is-${reference.tone ?? "reference"}${outsideScale ? " is-outside" : ""}`}
                  key={`${reference.label}-${reference.value}`}
                >
                  <strong>{reference.label}</strong>
                  <b>
                    {formatLevel(reference.value, unit)} {unit}
                  </b>
                  <small>{outsideScale ? "Fora da escala atual" : "Visível no gráfico"}</small>
                </article>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="hydrology-rich-chart__footer">
        <span>{hasSeries ? formatTime(first.timestamp, true) : "Histórico não disponível"}</span>
        <strong>
          {hasSeries
            ? `${formatLevel(minimum, unit)} a ${formatLevel(maximum, unit)} ${unit}`
            : `${formatLevel(latest.level, unit)} ${unit}`}
        </strong>
        <span>{formatTime(latest.timestamp, true)}</span>
      </div>

      {!hasSeries ? <p className="hydrology-rich-chart__single-note">{singlePointMessage}</p> : null}
    </figure>
  );
}
