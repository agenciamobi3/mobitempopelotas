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

export function sampleAccountHistoryPoints(
  points: readonly AccountHistoryPoint[],
  maxPoints = 320,
): AccountHistoryPoint[] {
  if (points.length <= maxPoints) return [...points];

  const target = Math.max(2, Math.floor(maxPoints));
  const lastIndex = points.length - 1;
  const sampled = Array.from({ length: target }, (_, index) => {
    const sourceIndex = Math.round((index * lastIndex) / (target - 1));
    return points[sourceIndex]!;
  });

  return sampled.filter(
    (point, index) => index === 0 || point.timestamp !== sampled[index - 1]?.timestamp,
  );
}
