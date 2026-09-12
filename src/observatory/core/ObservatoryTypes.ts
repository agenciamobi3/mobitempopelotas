import type { AccountEntitlements } from "@/lib/auth/account-access";

export type ObservatoryLayerCategory =
  | "weather"
  | "satellite"
  | "hydrology"
  | "alerts"
  | "environment"
  | "visual";

export type ObservatoryLayerClassification =
  | "observed"
  | "forecast"
  | "derived"
  | "visual";

export type ObservatoryLayerStatus =
  | "loading"
  | "current"
  | "stale"
  | "degraded"
  | "unavailable"
  | "disabled"
  | "review";

export type ObservatoryLayerDefinition = {
  id: string;
  label: string;
  category: ObservatoryLayerCategory;
  classification: ObservatoryLayerClassification;
  temporal: boolean;
  defaultEnabled: boolean;
  requiredEntitlement?: keyof AccountEntitlements;
  attribution: string;
  sourcePolicyId: string;
};

export type ObservatoryLayerRuntimeState = {
  status: ObservatoryLayerStatus;
  enabled: boolean;
  observedAt: string | null;
  detail: string | null;
  opacity: number;
};

export type ObservatoryLayerSnapshot = {
  definition: ObservatoryLayerDefinition;
  runtime: ObservatoryLayerRuntimeState;
};
