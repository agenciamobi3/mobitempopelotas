import {
  hydrologyGapThresholdMs,
  normalizeHydrologyLevelSeries,
  splitHydrologySeriesOnGaps,
} from "../hydrology/level-series.ts";

export const ACCOUNT_HISTORY_PERIODS = [7, 30, 60] as const;
export type AccountHistoryPeriod = (typeof ACCOUNT_HISTORY_PERIODS)[number];

export const ACCOUNT_HISTORY_DATASET_KEYS = [
  "laranjal",
  "rio-grande",
  "sao-lourenco",
  "arambare",
  "sao-jose-do-norte",
  "itapua",
  "guaiba-gasometro",
  "guaiba-cais-maua",
] as const;

export type AccountHistoryDatasetKey = (typeof ACCOUNT_HISTORY_DATASET_KEYS)[number];

export type AccountHistoryDataset = {
  key: AccountHistoryDatasetKey;
  label: string;
  context: string;
  sourceKey: string;
  stationKey: string;
  unit: "m" | "cm";
  publicPath: string;
};

export type AccountHistoryPoint = {
  timestamp: string;
  level: number;
};

export const ACCOUNT_HISTORY_DATASETS: Record<AccountHistoryDatasetKey, AccountHistoryDataset> = {
  laranjal: {
    key: "laranjal",
    label: "Lagoa no Laranjal",
    context: "Praia do Laranjal · Pelotas",
    sourceKey: "labhidrosens-ufpel",
    stationKey: "labhidrosens-laranjal",
    unit: "m",
    publicPath: "/nivel-da-lagoa-dos-patos-laranjal",
  },
  "rio-grande": {
    key: "rio-grande",
    label: "Lagoa em Rio Grande",
    context: "FURG CCMAR · Rio Grande",
    sourceKey: "lagoa-monitoramento",
    stationKey: "lagoon-furg-ccmar",
    unit: "cm",
    publicPath: "/nivel-da-lagoa-dos-patos/rio-grande",
  },
  "sao-lourenco": {
    key: "sao-lourenco",
    label: "Lagoa em São Lourenço do Sul",
    context: "São Lourenço do Sul",
    sourceKey: "lagoa-monitoramento",
    stationKey: "lagoon-sao-lourenco-do-sul",
    unit: "cm",
    publicPath: "/nivel-da-lagoa-dos-patos/sao-lourenco-do-sul",
  },
  arambare: {
    key: "arambare",
    label: "Lagoa em Arambaré",
    context: "Arambaré",
    sourceKey: "lagoa-monitoramento",
    stationKey: "lagoon-arambare",
    unit: "cm",
    publicPath: "/nivel-da-lagoa-dos-patos/arambare",
  },
  "sao-jose-do-norte": {
    key: "sao-jose-do-norte",
    label: "Lagoa em São José do Norte",
    context: "São José do Norte",
    sourceKey: "lagoa-monitoramento",
    stationKey: "lagoon-sao-jose-do-norte",
    unit: "cm",
    publicPath: "/nivel-da-lagoa-dos-patos/sao-jose-do-norte",
  },
  itapua: {
    key: "itapua",
    label: "Lagoa em Itapuã",
    context: "Itapuã · Viamão",
    sourceKey: "lagoa-monitoramento",
    stationKey: "lagoon-itapua",
    unit: "cm",
    publicPath: "/nivel-da-lagoa-dos-patos/itapua-viamao",
  },
  "guaiba-gasometro": {
    key: "guaiba-gasometro",
    label: "Guaíba no Gasômetro",
    context: "Usina do Gasômetro · Porto Alegre",
    sourceKey: "nivel-guaiba",
    stationKey: "guaiba-gasometro",
    unit: "m",
    publicPath: "/nivel-do-guaiba",
  },
  "guaiba-cais-maua": {
    key: "guaiba-cais-maua",
    label: "Guaíba no Cais Mauá",
    context: "Cais Mauá · Porto Alegre",
    sourceKey: "metsul-tidesat",
    stationKey: "guaiba-cais-maua",
    unit: "m",
    publicPath: "/nivel-do-guaiba",
  },
};

type IndexedHistoryPoint = AccountHistoryPoint & {
  epoch: number;
  sourceIndex: number;
};

function fallbackEvenSample(
  points: readonly AccountHistoryPoint[],
  target: number,
): AccountHistoryPoint[] {
  const lastIndex = points.length - 1;
  return Array.from({ length: target }, (_, index) => {
    const sourceIndex = Math.round((index * lastIndex) / Math.max(1, target - 1));
    return points[sourceIndex]!;
  }).filter((point, index, sampled) => index === 0 || point.timestamp !== sampled[index - 1]?.timestamp);
}

export function sampleAccountHistoryPoints(
  points: readonly AccountHistoryPoint[],
  maxPoints = 320,
): AccountHistoryPoint[] {
  const target = Math.max(2, Math.floor(maxPoints));
  if (points.length <= target) return [...points];
  if (target < 6) return fallbackEvenSample(points, target);

  const normalized = normalizeHydrologyLevelSeries(
    points.map((point, sourceIndex) => ({ ...point, sourceIndex })),
  ) as IndexedHistoryPoint[];
  if (normalized.length <= target) {
    return normalized.map((point) => points[point.sourceIndex]!);
  }

  const selected = new Set<number>();
  const first = normalized[0]!;
  const latest = normalized.at(-1)!;
  let minimum = first;
  let maximum = first;

  for (const point of normalized) {
    if (point.level < minimum.level) minimum = point;
    if (point.level > maximum.level) maximum = point;
  }

  for (const point of [first, minimum, maximum, latest]) {
    selected.add(point.sourceIndex);
  }

  const gapThreshold = hydrologyGapThresholdMs(normalized);
  const segments = splitHydrologySeriesOnGaps(normalized, gapThreshold);
  const gapBoundaryPointBudget = Math.max(0, Math.floor(target * 0.1));
  const gapBoundaryIndices = segments
    .slice(0, -1)
    .flatMap((segment, index) => [
      segment.at(-1)?.sourceIndex,
      segments[index + 1]?.[0]?.sourceIndex,
    ])
    .filter((index): index is number => index !== undefined);

  for (const sourceIndex of gapBoundaryIndices.slice(-gapBoundaryPointBudget)) {
    if (selected.size >= target) break;
    selected.add(sourceIndex);
  }

  const recentTailCount = Math.max(2, Math.floor(target * 0.6));
  const recentStart = Math.max(0, normalized.length - recentTailCount);
  for (let index = recentStart; index < normalized.length && selected.size < target; index += 1) {
    selected.add(normalized[index]!.sourceIndex);
  }

  const remaining = target - selected.size;
  if (remaining > 0) {
    for (let slot = 1; slot <= remaining && selected.size < target; slot += 1) {
      const normalizedIndex = Math.round((slot * (normalized.length - 1)) / (remaining + 1));
      selected.add(normalized[normalizedIndex]!.sourceIndex);
    }
  }

  if (selected.size < target) {
    for (const point of normalized) {
      if (selected.size >= target) break;
      selected.add(point.sourceIndex);
    }
  }

  return normalized
    .filter((point) => selected.has(point.sourceIndex))
    .map((point) => points[point.sourceIndex]!);
}
