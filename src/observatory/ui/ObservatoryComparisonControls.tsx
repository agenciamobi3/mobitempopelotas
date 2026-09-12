import { Columns2, X } from "lucide-react";

import {
  OBSERVATORY_COMPARISON_LAYER_IDS,
  type ObservatoryComparisonLayerId,
  type ObservatoryComparisonState,
} from "../core/ObservatoryComparison";
import "./ObservatoryComparisonControls.css";

type ObservatoryComparisonControlsProps = {
  comparison: ObservatoryComparisonState;
  timestamps: readonly string[];
  onChange: (comparison: ObservatoryComparisonState) => void;
  onLayerChange: (layerId: ObservatoryComparisonLayerId) => void;
  onClose: () => void;
};

function formatTimestamp(value: string | null) {
  if (!value) return "Aguardando quadros";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Horário indisponível";
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

const layerLabels: Record<ObservatoryComparisonLayerId, string> = {
  radar: "Radar",
  satellite: "Satélite",
};

export function ObservatoryComparisonControls({
  comparison,
  timestamps,
  onChange,
  onLayerChange,
  onClose,
}: ObservatoryComparisonControlsProps) {
  return (
    <section className="observatory-comparison" aria-label="Comparador A/B">
      <div className="observatory-comparison__heading">
        <div>
          <Columns2 aria-hidden="true" size={17} />
          <strong>Comparar A/B</strong>
        </div>
        <button type="button" onClick={onClose} aria-label="Fechar comparador" title="Fechar comparação">
          <X aria-hidden="true" size={16} />
        </button>
      </div>

      <div className="observatory-comparison__fields">
        <label>
          <span>Camada</span>
          <select
            value={comparison.layerId}
            onChange={(event) =>
              onLayerChange(event.currentTarget.value as ObservatoryComparisonLayerId)
            }
          >
            {OBSERVATORY_COMPARISON_LAYER_IDS.map((id) => (
              <option key={id} value={id}>
                {layerLabels[id]}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>A · antes</span>
          <select
            value={comparison.leftAt ?? ""}
            disabled={timestamps.length === 0}
            onChange={(event) =>
              onChange({
                ...comparison,
                leftAt: event.currentTarget.value || null,
              })
            }
          >
            {timestamps.length === 0 ? <option value="">Aguardando dados</option> : null}
            {timestamps.map((timestamp) => (
              <option key={`left-${timestamp}`} value={timestamp}>
                {formatTimestamp(timestamp)}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>B · depois</span>
          <select
            value={comparison.rightAt ?? ""}
            disabled={timestamps.length === 0}
            onChange={(event) =>
              onChange({
                ...comparison,
                rightAt: event.currentTarget.value || null,
              })
            }
          >
            {timestamps.length === 0 ? <option value="">Aguardando dados</option> : null}
            {timestamps.map((timestamp) => (
              <option key={`right-${timestamp}`} value={timestamp}>
                {formatTimestamp(timestamp)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="observatory-comparison__split">
        <span>Divisor</span>
        <input
          type="range"
          min="0.08"
          max="0.92"
          step="0.01"
          value={comparison.splitPosition}
          aria-label="Mover divisor da comparação A/B"
          onChange={(event) =>
            onChange({
              ...comparison,
              splitPosition: Number(event.currentTarget.value),
            })
          }
        />
        <output>{Math.round(comparison.splitPosition * 100)}%</output>
      </label>
    </section>
  );
}
