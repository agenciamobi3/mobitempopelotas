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

const WIDTH = 1040;
const HEIGHT = 390;
const PADDING = { top: 38, right: 38, bottom: 58, left: 72 } as const;

function normalizePoints(points: HydrologyLevelChartPoint[]) {
  const byTimestamp = new Map<number, HydrologyLevelChartPoint>();

  for (const point of points) {
    const timestamp = new Date(point.timestamp).getTime();
    if (!Number.isFinite(point.level) || !Number.isFinite(timestamp)) continue;
    byTimestamp.set(timestamp, point);
  }

  return [...byTimestamp.entries()]
    .sort(([left], [right]) => left - right)
    .map(([, point]) => point);
}

function formatLevel(value: number, unit: "m" | "cm") {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: unit === "m" ? 2 : value % 1 === 0 ? 0 : 1,
    maximumFractionDigits: unit === "m" ? 2 : 1,
  }).format(value);
}

function formatDelta(first: number, last: number, unit: "m" | "cm") {
  const delta = last - first;
  const normalized = unit === "m" ? delta * 100 : delta;
  const rounded = Math.abs(normalized) < 0.05 ? 0 : normalized;
  const prefix = rounded > 0 ? "+" : "";
  return `${prefix}${new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 1,
  }).format(rounded)} cm`;
}

function formatTime(value: string, withDate: boolean) {
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
  const xForIndex = (index: number) =>
    hasSeries
      ? PADDING.left + (index / (valid.length - 1)) * plotWidth
      : PADDING.left + plotWidth * 0.72;
  const yForValue = (value: number) =>
    PADDING.top + ((domainMaximum - value) / domainRange) * plotHeight;
  const coordinates = valid.map((point, index) => ({
    ...point,
    x: xForIndex(index),
    y: yForValue(point.level),
  }));
  const line = coordinates.map((point) => `${point.x},${point.y}`).join(" ");
  const area = hasSeries
    ? [
        `M ${coordinates[0]!.x} ${PADDING.top + plotHeight}`,
        ...coordinates.map((point) => `L ${point.x} ${point.y}`),
        `L ${coordinates.at(-1)!.x} ${PADDING.top + plotHeight}`,
        "Z",
      ].join(" ")
    : "";
  const yTicks = Array.from({ length: 5 }, (_, index) => {
    const ratio = index / 4;
    const value = domainMaximum - ratio * domainRange;
    return { value, y: PADDING.top + ratio * plotHeight };
  });
  const xTickIndexes = hasSeries
    ? Array.from(
        new Set([
          0,
          Math.round((valid.length - 1) / 3),
          Math.round(((valid.length - 1) * 2) / 3),
          valid.length - 1,
        ]),
      )
    : [0];
  const firstEpoch = new Date(first.timestamp).getTime();
  const latestEpoch = new Date(latest.timestamp).getTime();
  const withDate = latestEpoch - firstEpoch > 36 * 60 * 60 * 1000;
  const validReferences = references.filter((reference) => Number.isFinite(reference.value));
  const referenceIsVisible = (reference: HydrologyLevelChartReference) =>
    reference.value >= domainMinimum && reference.value <= domainMaximum;
  const visibleReferences = validReferences.filter(referenceIsVisible);
  const latestCoordinate = coordinates.at(-1)!;
  const minimumCoordinate = coordinates[minimumIndex]!;
  const maximumCoordinate = coordinates[maximumIndex]!;

  return (
    <figure
      className={`hydrology-rich-chart is-${status}${hasSeries ? " has-series" : " is-single"}${
        className ? ` ${className}` : ""
      }`}
    >
      <figcaption className="hydrology-rich-chart__header">
        <div>
          <span>{eyebrow}</span>
          <strong>{windowLabel}</strong>
        </div>
        <small>{hasSeries ? `${valid.length} medições válidas` : "1 leitura disponível"}</small>
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

      <div
        className="hydrology-rich-chart__plot"
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

          {xTickIndexes.map((index) => {
            const coordinate = coordinates[index] ?? coordinates[0]!;
            return (
              <g
                className="hydrology-rich-chart__grid hydrology-rich-chart__grid--vertical"
                key={`x-${index}`}
              >
                <line
                  x1={coordinate.x}
                  x2={coordinate.x}
                  y1={PADDING.top}
                  y2={PADDING.top + plotHeight}
                />
                <text x={coordinate.x} y={HEIGHT - 22} textAnchor="middle">
                  {formatTime(coordinate.timestamp, withDate)}
                </text>
              </g>
            );
          })}

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

          {hasSeries ? (
            <path className="hydrology-rich-chart__area" d={area} fill={`url(#${gradientId})`} />
          ) : null}

          <line
            className="hydrology-rich-chart__latest-guide"
            x1={PADDING.left}
            x2={latestCoordinate.x}
            y1={latestCoordinate.y}
            y2={latestCoordinate.y}
          />

          {hasSeries ? (
            <polyline
              className="hydrology-rich-chart__line"
              points={line}
              fill="none"
              vectorEffect="non-scaling-stroke"
            />
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
