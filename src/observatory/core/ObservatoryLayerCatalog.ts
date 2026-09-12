import type { ObservatoryLayerDefinition } from "./ObservatoryTypes";

export const OBSERVATORY_LAYER_IDS = [
  "radar",
  "satellite",
  "lightning",
  "alerts",
  "hydrology",
] as const;

export type ObservatoryLayerId = (typeof OBSERVATORY_LAYER_IDS)[number];

export const OBSERVATORY_LAYER_DEFINITIONS: readonly ObservatoryLayerDefinition[] = [
  {
    id: "radar",
    label: "Radar REDEMET",
    category: "weather",
    classification: "observed",
    temporal: true,
    defaultEnabled: true,
    requiredEntitlement: "observatoryAccess",
    attribution: "REDEMET / DECEA",
    sourcePolicyId: "redemet-radar",
  },
  {
    id: "satellite",
    label: "Satélite",
    category: "satellite",
    classification: "observed",
    temporal: true,
    defaultEnabled: false,
    requiredEntitlement: "observatoryAccess",
    attribution: "REDEMET / DECEA · INMET em contingência",
    sourcePolicyId: "redemet-satellite",
  },
  {
    id: "lightning",
    label: "Raios / STSC",
    category: "weather",
    classification: "observed",
    temporal: true,
    defaultEnabled: false,
    requiredEntitlement: "observatoryAccess",
    attribution: "REDEMET / DECEA",
    sourcePolicyId: "redemet-stsc",
  },
  {
    id: "alerts",
    label: "Alertas INMET",
    category: "alerts",
    classification: "observed",
    temporal: true,
    defaultEnabled: false,
    requiredEntitlement: "observatoryAccess",
    attribution: "INMET",
    sourcePolicyId: "inmet-alerts",
  },
  {
    id: "hydrology",
    label: "Hidrologia",
    category: "hydrology",
    classification: "observed",
    temporal: true,
    defaultEnabled: false,
    requiredEntitlement: "observatoryAccess",
    attribution: "LabHidroSens / UFPel · FURG & Portos RS",
    sourcePolicyId: "hydrology-live-network",
  },
] as const;

export function isObservatoryLayerId(value: string): value is ObservatoryLayerId {
  return (OBSERVATORY_LAYER_IDS as readonly string[]).includes(value);
}
