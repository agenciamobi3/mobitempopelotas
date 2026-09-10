import type { AccountEntitlements } from "@/lib/auth/account-access";

export type WidgetType =
  | "nivel-laranjal"
  | "status-tempo-agora"
  | "previsao-7-dias"
  | "chuva-pelotas"
  | "vento-pelotas";
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
    description: "Nível atual, movimento recente e variações da Lagoa dos Patos no Laranjal.",
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
  {
    type: "previsao-7-dias",
    label: "Previsão de 7 dias",
    description: "Mínimas, máximas, chuva e rajadas previstas para a próxima semana em Pelotas.",
    category: "Meteorologia",
    requiredEntitlement: "widgetsSevenDayForecast",
    defaultTitle: "Previsão de 7 dias em Pelotas",
    detailsUrl: "/previsao-7-dias-pelotas",
    initialHeight: 620,
  },
  {
    type: "chuva-pelotas",
    label: "Chuva em Pelotas",
    description: "Chuva observada no dia e previsão de chance e volume nas próximas horas, sem misturar medição com previsão.",
    category: "Meteorologia",
    requiredEntitlement: "widgetsRain",
    defaultTitle: "Chuva em Pelotas",
    detailsUrl: "/chuva-em-pelotas",
    initialHeight: 500,
  },
  {
    type: "vento-pelotas",
    label: "Vento e rajadas",
    description: "Vento observado e tendência de velocidade e rajadas nas próximas horas em Pelotas.",
    category: "Meteorologia",
    requiredEntitlement: "widgetsWind",
    defaultTitle: "Vento e rajadas em Pelotas",
    detailsUrl: "/vento-em-pelotas",
    initialHeight: 480,
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
