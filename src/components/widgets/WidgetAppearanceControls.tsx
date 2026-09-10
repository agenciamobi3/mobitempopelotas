import type { CSSProperties } from "react";

import {
  createAppearanceFromPreset,
  getWidgetStylePreset,
  WIDGET_STYLE_PRESETS,
  type WidgetAppearance,
  type WidgetDensity,
  type WidgetStylePreset,
} from "@/lib/widgets/widget-appearance";

function previewStyle(appearance: WidgetAppearance): CSSProperties {
  const preset = getWidgetStylePreset(appearance.preset);
  return {
    background: preset.preview.background,
    borderColor: preset.preview.border,
    borderRadius: `${appearance.radius}px`,
    color: preset.preview.text,
    "--widget-style-preview-accent": appearance.accentColor,
    "--widget-style-preview-surface": preset.preview.surface,
    "--widget-style-preview-muted": preset.preview.muted,
  } as CSSProperties;
}

function presetSwatchStyle(preset: WidgetStylePreset): CSSProperties {
  const definition = getWidgetStylePreset(preset);
  return {
    background: definition.preview.background,
    borderColor: definition.preview.border,
    color: definition.preview.text,
    "--widget-style-preview-accent": definition.defaultAccentColor,
    "--widget-style-preview-surface": definition.preview.surface,
  } as CSSProperties;
}

export function WidgetAppearanceControls({
  value,
  onChange,
  legend = "Estilo do widget",
  compact = false,
}: {
  value: WidgetAppearance;
  onChange: (appearance: WidgetAppearance) => void;
  legend?: string;
  compact?: boolean;
}) {
  return (
    <fieldset className={`widget-style-controls${compact ? " is-compact" : ""}`}>
      <legend>{legend}</legend>
      <p className="widget-style-controls__intro">
        Escolha uma base pronta e ajuste apenas o necessário para combinar com o seu site.
      </p>

      <div className="widget-style-presets" aria-label="Estilos predefinidos">
        {WIDGET_STYLE_PRESETS.map((preset) => {
          const selected = value.preset === preset.key;
          return (
            <label
              className={`widget-style-preset${selected ? " is-selected" : ""}`}
              key={preset.key}
            >
              <input
                type="radio"
                name={compact ? "widget-existing-style" : "widget-new-style"}
                value={preset.key}
                checked={selected}
                onChange={() => onChange(createAppearanceFromPreset(preset.key))}
              />
              <span className="widget-style-preset__swatch" style={presetSwatchStyle(preset.key)}>
                <i aria-hidden="true" />
                <b aria-hidden="true" />
              </span>
              <span className="widget-style-preset__copy">
                <strong>{preset.label}</strong>
                <small>{preset.description}</small>
              </span>
            </label>
          );
        })}
      </div>

      <div className="widget-style-tuning" aria-label="Ajustes do estilo selecionado">
        <label className="widget-style-field">
          <span>Cor de destaque</span>
          <div className="widget-style-color-control">
            <input
              type="color"
              value={value.accentColor}
              onChange={(event) =>
                onChange({ ...value, accentColor: event.target.value.toUpperCase() })
              }
              aria-label="Cor de destaque do widget"
            />
            <output>{value.accentColor}</output>
          </div>
        </label>

        <label className="widget-style-field">
          <span>Cantos · {value.radius}px</span>
          <input
            type="range"
            min="0"
            max="36"
            step="2"
            value={value.radius}
            onChange={(event) => onChange({ ...value, radius: Number(event.target.value) })}
          />
        </label>

        <label className="widget-style-field">
          <span>Densidade</span>
          <select
            value={value.density}
            onChange={(event) =>
              onChange({ ...value, density: event.target.value as WidgetDensity })
            }
          >
            <option value="comfortable">Confortável</option>
            <option value="compact">Compacta</option>
          </select>
        </label>
      </div>

      <div className="widget-style-sample" style={previewStyle(value)} aria-label="Amostra do estilo">
        <span>Tempo Pelotas</span>
        <div>
          <strong>18°C</strong>
          <small>Parcialmente nublado</small>
        </div>
        <i aria-hidden="true" />
      </div>
    </fieldset>
  );
}
