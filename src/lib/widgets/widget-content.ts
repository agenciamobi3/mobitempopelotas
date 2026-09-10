import type { Json } from "@/lib/supabase/database.types";

import type { WidgetType } from "./widget-registry";

export const WIDGET_PRESENTATION_KEYS = ["card", "compact", "horizontal"] as const;

export type WidgetPresentation = (typeof WIDGET_PRESENTATION_KEYS)[number];

export type WidgetContentBlockDefinition = {
  key: string;
  label: string;
  description: string;
};

export type WidgetContentDefinition = {
  presentation: WidgetPresentation;
  visibleBlocks: string[];
};

export type WidgetContentCatalog = {
  blocks: readonly WidgetContentBlockDefinition[];
};

const WIDGET_CONTENT_CATALOG: Record<WidgetType, WidgetContentCatalog> = {
  "nivel-laranjal": {
    blocks: [
      {
        key: "movement",
        label: "Movimento recente",
        description: "Mostra se o nível está subindo, baixando ou praticamente estável.",
      },
      {
        key: "chart",
        label: "Gráfico recente",
        description: "Mostra a série temporal real, preservando eventuais lacunas da fonte.",
      },
      {
        key: "updated-at",
        label: "Horário da leitura",
        description: "Exibe quando a leitura mais recente foi atualizada.",
      },
    ],
  },
  "status-tempo-agora": {
    blocks: [
      {
        key: "icon",
        label: "Ícone da condição",
        description: "Exibe o ícone meteorológico correspondente à observação atual.",
      },
      {
        key: "condition",
        label: "Descrição da condição",
        description: "Exibe o texto da condição meteorológica junto da temperatura.",
      },
    ],
  },
  "previsao-7-dias": {
    blocks: [
      {
        key: "rain",
        label: "Chuva prevista",
        description: "Mostra chance e volume previsto de chuva para cada dia.",
      },
      {
        key: "gusts",
        label: "Rajadas",
        description: "Mostra a rajada prevista de cada dia quando disponível.",
      },
      {
        key: "updated-at",
        label: "Horário de atualização",
        description: "Exibe quando a previsão consolidada foi atualizada.",
      },
    ],
  },
  "chuva-pelotas": {
    blocks: [
      {
        key: "observed",
        label: "Chuva observada",
        description: "Mostra a medição das últimas 24 horas sem misturá-la à previsão.",
      },
      {
        key: "today",
        label: "Previsão de hoje",
        description: "Mostra chance e volume previstos para o dia.",
      },
      {
        key: "hourly",
        label: "Próximas horas",
        description: "Mostra chance e volume previstos nas próximas horas.",
      },
    ],
  },
  "vento-pelotas": {
    blocks: [
      {
        key: "current-wind",
        label: "Vento atual",
        description: "Mostra velocidade e direção da leitura atual.",
      },
      {
        key: "current-gust",
        label: "Rajada atual",
        description: "Mostra a rajada atual quando disponível.",
      },
      {
        key: "hourly",
        label: "Próximas horas",
        description: "Mostra vento e rajadas previstos nas próximas horas.",
      },
    ],
  },
};

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function isWidgetPresentation(value: unknown): value is WidgetPresentation {
  return (
    typeof value === "string" &&
    WIDGET_PRESENTATION_KEYS.includes(value as WidgetPresentation)
  );
}

export function getWidgetContentCatalog(type: WidgetType): WidgetContentCatalog {
  return WIDGET_CONTENT_CATALOG[type];
}

export function createDefaultWidgetContent(type: WidgetType): WidgetContentDefinition {
  return {
    presentation: "card",
    visibleBlocks: WIDGET_CONTENT_CATALOG[type].blocks.map((block) => block.key),
  };
}

export function normalizeWidgetContent(
  type: WidgetType,
  config: unknown,
): WidgetContentDefinition {
  const defaults = createDefaultWidgetContent(type);
  const root = isObject(config) ? config : {};
  const raw = isObject(root.content) ? root.content : {};
  const presentation = isWidgetPresentation(raw.presentation)
    ? raw.presentation
    : defaults.presentation;
  const allowed = new Set(WIDGET_CONTENT_CATALOG[type].blocks.map((block) => block.key));
  const requested = Array.isArray(raw.visibleBlocks)
    ? raw.visibleBlocks.filter(
        (block): block is string => typeof block === "string" && allowed.has(block),
      )
    : defaults.visibleBlocks;
  const visibleBlocks = Array.from(new Set(requested));

  return {
    presentation,
    visibleBlocks: visibleBlocks.length > 0 ? visibleBlocks : defaults.visibleBlocks,
  };
}

export function withWidgetContentConfig(
  config: Json,
  type: WidgetType,
  content: WidgetContentDefinition,
): Json {
  const root = isObject(config) ? config : {};
  const normalized = normalizeWidgetContent(type, { content });
  return {
    ...root,
    content: {
      presentation: normalized.presentation,
      visibleBlocks: normalized.visibleBlocks,
    },
  } as Json;
}

export function isWidgetBlockVisible(
  content: WidgetContentDefinition,
  block: string,
): boolean {
  return content.visibleBlocks.includes(block);
}
