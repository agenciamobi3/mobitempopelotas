import type { Json } from "@/lib/supabase/database.types";

export const WIDGET_STYLE_PRESET_KEYS = [
  "tempo-dark",
  "clean-light",
  "soft-glass",
  "minimal-neutral",
] as const;

export const WIDGET_DENSITY_KEYS = ["comfortable", "compact"] as const;

export type WidgetStylePreset = (typeof WIDGET_STYLE_PRESET_KEYS)[number];
export type WidgetDensity = (typeof WIDGET_DENSITY_KEYS)[number];

export type WidgetAppearance = {
  preset: WidgetStylePreset;
  accentColor: string;
  radius: number;
  density: WidgetDensity;
};

export type WidgetStylePresetDefinition = {
  key: WidgetStylePreset;
  label: string;
  description: string;
  scheme: "light" | "dark";
  defaultAccentColor: string;
  defaultRadius: number;
  defaultDensity: WidgetDensity;
  preview: {
    background: string;
    surface: string;
    text: string;
    muted: string;
    border: string;
  };
};

export const WIDGET_STYLE_PRESETS: readonly WidgetStylePresetDefinition[] = [
  {
    key: "tempo-dark",
    label: "Tempo Dark",
    description: "Visual escuro e editorial, próximo da identidade atual do Tempo Pelotas.",
    scheme: "dark",
    defaultAccentColor: "#18BDCD",
    defaultRadius: 28,
    defaultDensity: "comfortable",
    preview: {
      background: "linear-gradient(145deg, #071e2f, #123046)",
      surface: "rgba(255,255,255,.08)",
      text: "#ffffff",
      muted: "rgba(255,255,255,.68)",
      border: "rgba(255,255,255,.16)",
    },
  },
  {
    key: "clean-light",
    label: "Claro Editorial",
    description: "Fundo claro, contraste sóbrio e boa integração com sites institucionais.",
    scheme: "light",
    defaultAccentColor: "#087C8A",
    defaultRadius: 22,
    defaultDensity: "comfortable",
    preview: {
      background: "#ffffff",
      surface: "#f5f8f9",
      text: "#071e2f",
      muted: "#607482",
      border: "rgba(7,30,47,.13)",
    },
  },
  {
    key: "soft-glass",
    label: "Glass Suave",
    description: "Superfície translúcida e leve para páginas com fotografia, gradiente ou cor de fundo.",
    scheme: "light",
    defaultAccentColor: "#5E2CED",
    defaultRadius: 30,
    defaultDensity: "comfortable",
    preview: {
      background: "rgba(255,255,255,.84)",
      surface: "rgba(255,255,255,.62)",
      text: "#071e2f",
      muted: "#607482",
      border: "rgba(255,255,255,.72)",
    },
  },
  {
    key: "minimal-neutral",
    label: "Minimal",
    description: "Pouco ornamento, borda discreta e densidade compacta para layouts mais técnicos.",
    scheme: "light",
    defaultAccentColor: "#4D6370",
    defaultRadius: 12,
    defaultDensity: "compact",
    preview: {
      background: "#ffffff",
      surface: "#ffffff",
      text: "#172733",
      muted: "#677782",
      border: "#d8e0e5",
    },
  },
] as const;

export const DEFAULT_WIDGET_APPEARANCE: WidgetAppearance = {
  preset: "tempo-dark",
  accentColor: "#18BDCD",
  radius: 28,
  density: "comfortable",
};

const HEX_COLOR_PATTERN = /^#[0-9A-F]{6}$/i;

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function isWidgetStylePreset(value: unknown): value is WidgetStylePreset {
  return typeof value === "string" && WIDGET_STYLE_PRESET_KEYS.includes(value as WidgetStylePreset);
}

export function isWidgetDensity(value: unknown): value is WidgetDensity {
  return typeof value === "string" && WIDGET_DENSITY_KEYS.includes(value as WidgetDensity);
}

export function getWidgetStylePreset(preset: WidgetStylePreset) {
  return WIDGET_STYLE_PRESETS.find((item) => item.key === preset) ?? WIDGET_STYLE_PRESETS[0];
}

export function createAppearanceFromPreset(preset: WidgetStylePreset): WidgetAppearance {
  const definition = getWidgetStylePreset(preset);
  return {
    preset: definition.key,
    accentColor: definition.defaultAccentColor,
    radius: definition.defaultRadius,
    density: definition.defaultDensity,
  };
}

export function normalizeWidgetAppearance(config: unknown): WidgetAppearance {
  const root = isObject(config) ? config : {};
  const raw = isObject(root.appearance) ? root.appearance : {};
  const preset = isWidgetStylePreset(raw.preset) ? raw.preset : DEFAULT_WIDGET_APPEARANCE.preset;
  const presetDefinition = getWidgetStylePreset(preset);
  const accentColor =
    typeof raw.accentColor === "string" && HEX_COLOR_PATTERN.test(raw.accentColor)
      ? raw.accentColor.toUpperCase()
      : presetDefinition.defaultAccentColor;
  const radius =
    typeof raw.radius === "number" && Number.isInteger(raw.radius)
      ? Math.max(0, Math.min(36, raw.radius))
      : presetDefinition.defaultRadius;
  const density = isWidgetDensity(raw.density) ? raw.density : presetDefinition.defaultDensity;

  return { preset, accentColor, radius, density };
}

export function withWidgetAppearanceConfig(config: Json, appearance: WidgetAppearance): Json {
  const root = isObject(config) ? config : {};
  return {
    ...root,
    appearance: {
      preset: appearance.preset,
      accentColor: appearance.accentColor,
      radius: appearance.radius,
      density: appearance.density,
    },
  } as Json;
}

export function widgetThemeForAppearance(appearance: WidgetAppearance): "light" | "dark" {
  return getWidgetStylePreset(appearance.preset).scheme;
}

export function widgetAppearanceCssVariables(appearance: WidgetAppearance) {
  const preset = getWidgetStylePreset(appearance.preset);
  return {
    "--tp-widget-background": preset.preview.background,
    "--tp-widget-surface": preset.preview.surface,
    "--tp-widget-text": preset.preview.text,
    "--tp-widget-muted": preset.preview.muted,
    "--tp-widget-border": preset.preview.border,
    "--tp-widget-accent": appearance.accentColor,
    "--tp-widget-radius": `${appearance.radius}px`,
    "--tp-widget-gap": appearance.density === "compact" ? "12px" : "18px",
    "--tp-widget-padding": appearance.density === "compact" ? "16px" : "24px",
    "--tp-widget-shadow":
      appearance.preset === "minimal-neutral"
        ? "none"
        : appearance.preset === "soft-glass"
          ? "0 18px 48px rgba(7,30,47,.12)"
          : "0 28px 80px rgba(7,30,47,.2)",
  } as const;
}
