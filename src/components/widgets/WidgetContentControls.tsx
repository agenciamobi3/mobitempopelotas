import {
  createDefaultWidgetContent,
  getWidgetContentCatalog,
  type WidgetContentDefinition,
  type WidgetPresentation,
} from "@/lib/widgets/widget-content";
import type { WidgetType } from "@/lib/widgets/widget-registry";

import "./WidgetContentControls.css";

const PRESENTATIONS: ReadonlyArray<{
  key: WidgetPresentation;
  label: string;
  description: string;
}> = [
  {
    key: "card",
    label: "Cartão",
    description: "Formato equilibrado para colunas, páginas e áreas de conteúdo.",
  },
  {
    key: "compact",
    label: "Compacto",
    description: "Ocupa menos largura e funciona bem em sidebar, rodapé e grids estreitos.",
  },
  {
    key: "horizontal",
    label: "Horizontal",
    description: "Aproveita faixas largas, homepages e blocos de largura total.",
  },
];

export function WidgetContentControls({
  widgetType,
  value,
  onChange,
  compact = false,
  controlName = "widget-content",
}: {
  widgetType: WidgetType;
  value: WidgetContentDefinition;
  onChange: (content: WidgetContentDefinition) => void;
  compact?: boolean;
  controlName?: string;
}) {
  const catalog = getWidgetContentCatalog(widgetType);

  function toggleBlock(block: string) {
    const selected = value.visibleBlocks.includes(block);
    if (selected && value.visibleBlocks.length === 1) return;

    onChange({
      ...value,
      visibleBlocks: selected
        ? value.visibleBlocks.filter((item) => item !== block)
        : [...value.visibleBlocks, block],
    });
  }

  function resetBlocks() {
    onChange({
      ...value,
      visibleBlocks: createDefaultWidgetContent(widgetType).visibleBlocks,
    });
  }

  return (
    <fieldset className={`widget-content-controls${compact ? " is-compact" : ""}`}>
      <legend>Apresentação e conteúdo</legend>
      <p className="widget-content-controls__intro">
        Escolha o formato que melhor ocupa o espaço do seu site e mantenha apenas os blocos úteis.
        A fonte, as unidades e a origem dos dados não podem ser alteradas.
      </p>

      <div className="widget-content-presentations" aria-label="Formato do widget">
        {PRESENTATIONS.map((presentation) => (
          <label
            className={`widget-content-presentation${
              value.presentation === presentation.key ? " is-selected" : ""
            }`}
            key={presentation.key}
          >
            <input
              type="radio"
              name={`${controlName}-presentation`}
              value={presentation.key}
              checked={value.presentation === presentation.key}
              onChange={() => onChange({ ...value, presentation: presentation.key })}
            />
            <span className={`widget-content-presentation__shape is-${presentation.key}`} aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span>
              <strong>{presentation.label}</strong>
              <small>{presentation.description}</small>
            </span>
          </label>
        ))}
      </div>

      <div className="widget-content-blocks">
        <div className="widget-content-blocks__heading">
          <div>
            <strong>Blocos visíveis</strong>
            <span>Ao menos um bloco configurável permanece ativo.</span>
          </div>
          <button type="button" onClick={resetBlocks}>
            Mostrar padrão
          </button>
        </div>

        <div className="widget-content-blocks__grid">
          {catalog.blocks.map((block) => {
            const checked = value.visibleBlocks.includes(block.key);
            const lastVisible = checked && value.visibleBlocks.length === 1;
            return (
              <label className={`widget-content-block${checked ? " is-selected" : ""}`} key={block.key}>
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={lastVisible}
                  onChange={() => toggleBlock(block.key)}
                />
                <span>
                  <strong>{block.label}</strong>
                  <small>{block.description}</small>
                </span>
              </label>
            );
          })}
        </div>
      </div>
    </fieldset>
  );
}
