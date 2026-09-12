import type {
  ObservatoryLayerDefinition,
  ObservatoryLayerRuntimeState,
  ObservatoryLayerSnapshot,
} from "./ObservatoryTypes";

function clampOpacity(value: number) {
  if (!Number.isFinite(value)) return 1;
  return Math.min(1, Math.max(0, value));
}

function initialRuntime(definition: ObservatoryLayerDefinition): ObservatoryLayerRuntimeState {
  return {
    status: definition.defaultEnabled ? "loading" : "disabled",
    enabled: definition.defaultEnabled,
    observedAt: null,
    detail: null,
    opacity: 1,
  };
}

export class ObservatoryLayerManager {
  private readonly layers = new Map<string, ObservatoryLayerSnapshot>();

  register(definition: ObservatoryLayerDefinition) {
    if (this.layers.has(definition.id)) {
      throw new Error(`Observatory layer already registered: ${definition.id}`);
    }

    this.layers.set(definition.id, {
      definition: { ...definition },
      runtime: initialRuntime(definition),
    });

    return this.get(definition.id);
  }

  get(id: string) {
    const layer = this.layers.get(id);
    if (!layer) return null;
    return {
      definition: { ...layer.definition },
      runtime: { ...layer.runtime },
    } satisfies ObservatoryLayerSnapshot;
  }

  list() {
    return [...this.layers.values()].map((layer) => ({
      definition: { ...layer.definition },
      runtime: { ...layer.runtime },
    } satisfies ObservatoryLayerSnapshot));
  }

  setEnabled(id: string, enabled: boolean) {
    const layer = this.requireLayer(id);
    layer.runtime.enabled = enabled;
    layer.runtime.status = enabled ? "loading" : "disabled";
    layer.runtime.detail = null;
    if (!enabled) layer.runtime.observedAt = null;
    return this.get(id);
  }

  setOpacity(id: string, opacity: number) {
    const layer = this.requireLayer(id);
    layer.runtime.opacity = clampOpacity(opacity);
    return this.get(id);
  }

  updateRuntime(id: string, patch: Partial<ObservatoryLayerRuntimeState>) {
    const layer = this.requireLayer(id);
    layer.runtime = {
      ...layer.runtime,
      ...patch,
      opacity: patch.opacity === undefined ? layer.runtime.opacity : clampOpacity(patch.opacity),
    };
    return this.get(id);
  }

  clear() {
    this.layers.clear();
  }

  private requireLayer(id: string) {
    const layer = this.layers.get(id);
    if (!layer) throw new Error(`Unknown observatory layer: ${id}`);
    return layer;
  }
}
