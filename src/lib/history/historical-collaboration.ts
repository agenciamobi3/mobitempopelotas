export const HISTORICAL_COLLABORATION_CONTEXTS = {
  "/enchente-1941-pelotas": {
    pagePath: "/enchente-1941-pelotas",
    pageTitle: "Enchente de 1941 em Pelotas",
    eventYear: 1941,
  },
  "/enchente-2001-pelotas": {
    pagePath: "/enchente-2001-pelotas",
    pageTitle: "Enchente de 2001 em Pelotas e no Laranjal",
    eventYear: 2001,
  },
  "/enchente-2015-pelotas": {
    pagePath: "/enchente-2015-pelotas",
    pageTitle: "Enchente de 2015 em Pelotas",
    eventYear: 2015,
  },
  "/enchente-2024-pelotas-laranjal": {
    pagePath: "/enchente-2024-pelotas-laranjal",
    pageTitle: "Enchente de 2024 em Pelotas e no Laranjal",
    eventYear: 2024,
  },
} as const;

export type HistoricalCollaborationPath = keyof typeof HISTORICAL_COLLABORATION_CONTEXTS;
export type HistoricalCollaborationContext =
  (typeof HISTORICAL_COLLABORATION_CONTEXTS)[HistoricalCollaborationPath];

export const HISTORICAL_COLLABORATION_ORDER: readonly HistoricalCollaborationContext[] = [
  HISTORICAL_COLLABORATION_CONTEXTS["/enchente-1941-pelotas"],
  HISTORICAL_COLLABORATION_CONTEXTS["/enchente-2001-pelotas"],
  HISTORICAL_COLLABORATION_CONTEXTS["/enchente-2015-pelotas"],
  HISTORICAL_COLLABORATION_CONTEXTS["/enchente-2024-pelotas-laranjal"],
];

export function isHistoricalCollaborationPath(value: string): value is HistoricalCollaborationPath {
  return Object.prototype.hasOwnProperty.call(HISTORICAL_COLLABORATION_CONTEXTS, value);
}

export function getHistoricalCollaborationContext(value: string | null | undefined) {
  if (!value || !isHistoricalCollaborationPath(value)) return null;
  return HISTORICAL_COLLABORATION_CONTEXTS[value];
}

export function contributionPath(context: HistoricalCollaborationContext) {
  return `/contribuir?pagina=${encodeURIComponent(context.pagePath)}`;
}
