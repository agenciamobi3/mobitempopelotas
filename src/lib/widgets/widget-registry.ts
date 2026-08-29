import type { AccountEntitlements } from "@/lib/auth/account-access";

export type WidgetType = "nivel-laranjal" | "status-tempo-agora";
export type WidgetTheme = "auto" | "light" | "dark";

export type WidgetDefinition = {
  type: WidgetType;
  label: string;
  description: string;
  category: "Hidrologia" | "Meteorologia";
  requiredEntitlement: keyof AccountEntitlements;
  defaultTitle: string;
  detailsUrl: string;
  initialHeight: number;
};

export const WIDGET_REGISTRY: readonly WidgetDefinition[] = [
  {
    type: "nivel-laranjal",
    label: "Nível do Laranjal",
    description: "Nível atual, tendência e variações recentes da Lagoa dos Patos no Laranjal.",
    category: "Hidrologia",
    requiredEntitlement: "widgetsLaranjal",
    defaultTitle: "Nível da Lagoa dos Patos — Laranjal",
    detailsUrl: "/nivel-da-lagoa-dos-patos-laranjal",
    initialHeight: 430,
  },
  {
    type: "status-tempo-agora",
    label: "Tempo agora em Pelotas",
    description: "Temperatura observada e condição meteorológica atual em um bloco compacto.",
    category: "Meteorologia",
    requiredEntitlement: "widgetsCurrentWeather",
    defaultTitle: "Tempo agora em Pelotas",
    detailsUrl: "/tempo-hoje-pelotas",
    initialHeight: 260,
  },
] as const;

export function isWidgetType(value: string): value is WidgetType {
  return WIDGET_REGISTRY.some((definition) => definition.type === value);
}

export function getWidgetDefinition(type: WidgetType) {
  return WIDGET_REGISTRY.find((definition) => definition.type === type) ?? null;
}

export function canUseWidgetType(entitlements: AccountEntitlements, type: WidgetType) {
  const definition = getWidgetDefinition(type);
  if (!definition) return false;
  return entitlements.widgetsAccess && entitlements[definition.requiredEntitlement] === true;
}
