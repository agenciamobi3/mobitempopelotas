import { z } from "zod";

import { FAVORITE_RESOURCE_KEYS, type FavoriteResourceKey } from "./favorite-resources";

export const DASHBOARD_SECTION_IDS = ["live", "favorites", "site"] as const;
export type DashboardSectionId = (typeof DASHBOARD_SECTION_IDS)[number];

export const DASHBOARD_LIVE_CARD_IDS = [
  "weather-now",
  "weather-today",
  "weather-hours",
  "weather-alerts",
] as const;
export type DashboardLiveCardId = (typeof DASHBOARD_LIVE_CARD_IDS)[number];

export const DASHBOARD_CARD_SIZES = ["compact", "medium", "wide"] as const;
export type DashboardCardSize = (typeof DASHBOARD_CARD_SIZES)[number];

export type DashboardLayout = {
  version: 1;
  sections: DashboardSectionId[];
  liveCards: DashboardLiveCardId[];
  favoriteOrder: FavoriteResourceKey[];
  sizes: Record<string, DashboardCardSize>;
};

const DEFAULT_SECTIONS: DashboardSectionId[] = ["live", "favorites", "site"];
const DEFAULT_LIVE_CARDS: DashboardLiveCardId[] = [...DASHBOARD_LIVE_CARD_IDS];
const DEFAULT_FAVORITES: FavoriteResourceKey[] = [...FAVORITE_RESOURCE_KEYS];

export const DEFAULT_DASHBOARD_LAYOUT: DashboardLayout = {
  version: 1,
  sections: DEFAULT_SECTIONS,
  liveCards: DEFAULT_LIVE_CARDS,
  favoriteOrder: DEFAULT_FAVORITES,
  sizes: {},
};

const sectionSchema = z.enum(DASHBOARD_SECTION_IDS);
const liveCardSchema = z.enum(DASHBOARD_LIVE_CARD_IDS);
const favoriteSchema = z.enum(FAVORITE_RESOURCE_KEYS);
const cardSizeSchema = z.enum(DASHBOARD_CARD_SIZES);

const allowedSizeKeys = new Set<string>([
  ...DASHBOARD_LIVE_CARD_IDS,
  ...FAVORITE_RESOURCE_KEYS.map((key) => favoriteCardLayoutKey(key)),
]);

export const dashboardLayoutSchema = z
  .object({
    version: z.literal(1),
    sections: z.array(sectionSchema).max(DASHBOARD_SECTION_IDS.length),
    liveCards: z.array(liveCardSchema).max(DASHBOARD_LIVE_CARD_IDS.length),
    favoriteOrder: z.array(favoriteSchema).max(FAVORITE_RESOURCE_KEYS.length),
    sizes: z.record(cardSizeSchema),
  })
  .strict()
  .superRefine((layout, context) => {
    const groups: Array<[string, readonly string[]]> = [
      ["sections", layout.sections],
      ["liveCards", layout.liveCards],
      ["favoriteOrder", layout.favoriteOrder],
    ];

    for (const [field, values] of groups) {
      if (new Set(values).size !== values.length) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: [field],
          message: "A ordem não pode conter itens duplicados.",
        });
      }
    }

    for (const key of Object.keys(layout.sizes)) {
      if (!allowedSizeKeys.has(key)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["sizes", key],
          message: "Card desconhecido no layout do painel.",
        });
      }
    }
  });

function completeOrder<T extends string>(saved: readonly T[], defaults: readonly T[]) {
  const seen = new Set<T>();
  const result: T[] = [];

  for (const item of [...saved, ...defaults]) {
    if (seen.has(item)) continue;
    seen.add(item);
    result.push(item);
  }

  return result;
}

function defaultDashboardLayout(): DashboardLayout {
  return {
    version: 1,
    sections: [...DEFAULT_SECTIONS],
    liveCards: [...DEFAULT_LIVE_CARDS],
    favoriteOrder: [...DEFAULT_FAVORITES],
    sizes: {},
  };
}

export function normalizeDashboardLayout(value: unknown): DashboardLayout {
  const parsed = dashboardLayoutSchema.safeParse(value);
  if (!parsed.success) return defaultDashboardLayout();

  return {
    version: 1,
    sections: completeOrder(parsed.data.sections, DEFAULT_SECTIONS),
    liveCards: completeOrder(parsed.data.liveCards, DEFAULT_LIVE_CARDS),
    favoriteOrder: completeOrder(parsed.data.favoriteOrder, DEFAULT_FAVORITES),
    sizes: { ...parsed.data.sizes },
  };
}

export function favoriteCardLayoutKey(key: FavoriteResourceKey) {
  return `favorite:${key}`;
}

export function dashboardCardSize(layout: DashboardLayout, key: string): DashboardCardSize {
  return layout.sizes[key] ?? "compact";
}

export function moveDashboardItem<T extends string>(
  order: readonly T[],
  item: T,
  direction: -1 | 1,
) {
  const index = order.indexOf(item);
  if (index < 0) return [...order];
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= order.length) return [...order];

  const next = [...order];
  [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
  return next;
}

export function placeDashboardItem<T extends string>(
  order: readonly T[],
  item: T,
  target: T,
) {
  if (item === target) return [...order];
  const itemIndex = order.indexOf(item);
  const targetIndex = order.indexOf(target);
  if (itemIndex < 0 || targetIndex < 0) return [...order];

  const next = [...order];
  next.splice(itemIndex, 1);
  next.splice(targetIndex, 0, item);
  return next;
}
