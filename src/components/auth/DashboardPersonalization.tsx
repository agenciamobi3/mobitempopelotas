import type { DragEvent, ReactNode } from "react";
import { ArrowDown, ArrowUp, GripVertical, RotateCcw, SlidersHorizontal } from "lucide-react";

import type { DashboardCardSize, DashboardSectionId } from "@/lib/auth/dashboard-layout";

import "./DashboardPersonalization.css";

export function DashboardPersonalizationBar({
  editing,
  dirty,
  saving,
  feedback,
  onEdit,
  onSave,
  onCancel,
  onReset,
}: {
  editing: boolean;
  dirty: boolean;
  saving: boolean;
  feedback: string | null;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onReset: () => void;
}) {
  return (
    <section className={`dashboard-personalize${editing ? " is-editing" : ""}`} aria-label="Personalização do painel">
      <div>
        <span className="dashboard-personalize__icon" aria-hidden="true">
          <SlidersHorizontal size={18} />
        </span>
        <div>
          <strong>{editing ? "Organize do seu jeito" : "Seu painel pode se adaptar a você"}</strong>
          <p>
            {editing
              ? "Arraste pelas alças no computador ou use as setas. Nos cards, escolha também o tamanho."
              : "Mude a ordem das seções e dos cards e destaque o que você consulta mais."}
          </p>
        </div>
      </div>

      <div className="dashboard-personalize__actions">
        {editing ? (
          <>
            <button type="button" className="is-ghost" disabled={saving} onClick={onReset}>
              <RotateCcw size={15} aria-hidden="true" /> Padrão
            </button>
            <button type="button" className="is-ghost" disabled={saving} onClick={onCancel}>
              Cancelar
            </button>
            <button type="button" className="is-primary" disabled={saving || !dirty} onClick={onSave}>
              {saving ? "Salvando…" : dirty ? "Salvar layout" : "Layout salvo"}
            </button>
          </>
        ) : (
          <button type="button" className="is-primary" onClick={onEdit}>
            Personalizar painel
          </button>
        )}
      </div>

      {feedback ? <p className="dashboard-personalize__feedback" role="status">{feedback}</p> : null}
    </section>
  );
}

export function DashboardItemControls({
  label,
  size,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onSizeChange,
  onDragStart,
}: {
  label: string;
  size?: DashboardCardSize;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onSizeChange?: (size: DashboardCardSize) => void;
  onDragStart: (event: DragEvent<HTMLButtonElement>) => void;
}) {
  return (
    <div className="dashboard-personalize__item-controls" aria-label={`Organizar ${label}`}>
      <button
        type="button"
        className="dashboard-personalize__drag-handle"
        draggable
        onDragStart={onDragStart}
        aria-label={`Arrastar ${label}`}
        title={`Arrastar ${label}`}
      >
        <GripVertical size={17} aria-hidden="true" />
      </button>
      <button type="button" disabled={!canMoveUp} onClick={onMoveUp} aria-label={`Mover ${label} para cima`}>
        <ArrowUp size={15} aria-hidden="true" />
      </button>
      <button type="button" disabled={!canMoveDown} onClick={onMoveDown} aria-label={`Mover ${label} para baixo`}>
        <ArrowDown size={15} aria-hidden="true" />
      </button>
      {size && onSizeChange ? (
        <label>
          <span>Tamanho</span>
          <select
            value={size}
            onChange={(event) => onSizeChange(event.target.value as DashboardCardSize)}
            aria-label={`Tamanho de ${label}`}
          >
            <option value="compact">Compacto</option>
            <option value="medium">Médio</option>
            <option value="wide">Amplo</option>
          </select>
        </label>
      ) : null}
    </div>
  );
}

function sectionAnchor(id: DashboardSectionId) {
  if (id === "live") return "painel-vivo";
  if (id === "favorites") return "favoritos";
  return "ferramentas";
}

export function DashboardSectionFrame({
  id,
  label,
  editing,
  index,
  total,
  onMove,
  onDragStart,
  onDrop,
  children,
}: {
  id: DashboardSectionId;
  label: string;
  editing: boolean;
  index: number;
  total: number;
  onMove: (id: DashboardSectionId, direction: -1 | 1) => void;
  onDragStart: (event: DragEvent<HTMLButtonElement>, id: DashboardSectionId) => void;
  onDrop: (id: DashboardSectionId) => void;
  children: ReactNode;
}) {
  return (
    <div
      id={sectionAnchor(id)}
      className={`dashboard-section-frame${editing ? " is-editing" : ""}`}
      data-dashboard-section={id}
      onDragOver={editing ? (event) => event.preventDefault() : undefined}
      onDrop={editing ? () => onDrop(id) : undefined}
    >
      {editing ? (
        <div className="dashboard-section-frame__controls">
          <span>{label}</span>
          <DashboardItemControls
            label={`seção ${label}`}
            canMoveUp={index > 0}
            canMoveDown={index < total - 1}
            onMoveUp={() => onMove(id, -1)}
            onMoveDown={() => onMove(id, 1)}
            onDragStart={(event) => onDragStart(event, id)}
          />
        </div>
      ) : null}
      {children}
    </div>
  );
}
