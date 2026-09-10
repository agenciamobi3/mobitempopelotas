import { useMemo, useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";

import {
  createUserWidget,
  setUserWidgetActive,
  updateUserWidgetAppearance,
  type ManagedWidget,
  type WidgetManagerSnapshot,
} from "@/lib/widgets/widget.functions";
import {
  createAppearanceFromPreset,
  getWidgetStylePreset,
  type WidgetAppearance,
} from "@/lib/widgets/widget-appearance";

import { WidgetAppearanceControls } from "./WidgetAppearanceControls";
import "./WidgetBuilder.css";
import "./WidgetBuilderAppearance.css";

type AuthenticatedSnapshot = Extract<WidgetManagerSnapshot, { status: "authenticated" }>;

type Feedback = {
  tone: "success" | "error";
  text: string;
} | null;

function WidgetAppearanceEditor({
  widget,
  onSaved,
}: {
  widget: ManagedWidget;
  onSaved: (widget: ManagedWidget) => void;
}) {
  const updateAppearance = useServerFn(updateUserWidgetAppearance);
  const [draft, setDraft] = useState<WidgetAppearance>(widget.appearance);
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  async function saveAppearance() {
    setPending(true);
    setFeedback(null);
    try {
      const result = await updateAppearance({
        data: { id: widget.id, appearance: draft },
      });
      if (!result.ok) {
        if (result.code === "unauthenticated") {
          window.location.assign("/conta?next=/widgets");
          return;
        }
        setFeedback({
          tone: "error",
          text:
            result.code === "conflict"
              ? "Este widget mudou em outra sessão. Recarregue a página antes de salvar novamente."
              : result.code === "not_entitled"
                ? "A personalização visual não está habilitada para esta conta."
                : "Não foi possível salvar o estilo agora.",
        });
        return;
      }

      setDraft(result.widget.appearance);
      onSaved(result.widget);
      setFeedback({ tone: "success", text: "Estilo salvo e aplicado ao widget." });
    } catch {
      setFeedback({ tone: "error", text: "Não foi possível salvar o estilo agora." });
    } finally {
      setPending(false);
    }
  }

  return (
    <details className="widget-builder-style-editor">
      <summary>Personalizar estilo</summary>
      <WidgetAppearanceControls
        value={draft}
        onChange={setDraft}
        legend="Editar aparência"
        compact
        controlName={`widget-style-${widget.id}`}
      />
      <div className="widget-builder-style-editor__actions">
        <p>
          A prévia real é atualizada depois de salvar. O código de incorporação continua o mesmo.
        </p>
        <button
          className="widget-builder-button is-secondary"
          type="button"
          onClick={saveAppearance}
          disabled={pending}
        >
          {pending ? "Salvando..." : "Salvar estilo"}
        </button>
      </div>
      {feedback ? (
        <p className={`widget-builder-feedback is-${feedback.tone}`} role="status">
          {feedback.text}
        </p>
      ) : null}
    </details>
  );
}

export function WidgetBuilder({ snapshot }: { snapshot: AuthenticatedSnapshot }) {
  const createWidget = useServerFn(createUserWidget);
  const setActive = useServerFn(setUserWidgetActive);
  const enabledModules = useMemo(
    () => snapshot.modules.filter((module) => module.enabled),
    [snapshot.modules],
  );
  const canCustomizeAppearance = snapshot.access.entitlements.widgetsAdvancedThemes;
  const [widgets, setWidgets] = useState(snapshot.widgets);
  const [selectedType, setSelectedType] = useState(enabledModules[0]?.type ?? "nivel-laranjal");
  const selectedModule =
    enabledModules.find((module) => module.type === selectedType) ?? enabledModules[0] ?? null;
  const [title, setTitle] = useState(selectedModule?.defaultTitle ?? "Widget Tempo Pelotas");
  const [appearance, setAppearance] = useState<WidgetAppearance>(() =>
    createAppearanceFromPreset("tempo-dark"),
  );
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  function changeModule(nextType: typeof selectedType) {
    setSelectedType(nextType);
    const module = enabledModules.find((item) => item.type === nextType);
    if (module) setTitle(module.defaultTitle);
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedModule) return;

    setPending(true);
    setFeedback(null);
    try {
      const result = await createWidget({
        data: {
          widgetType: selectedModule.type,
          title,
          ...(canCustomizeAppearance ? { appearance } : {}),
        },
      });

      if (!result.ok) {
        if (result.code === "unauthenticated") {
          window.location.assign("/conta?next=/widgets");
          return;
        }
        setFeedback({
          tone: "error",
          text:
            result.code === "limit"
              ? "Você atingiu o limite atual de widgets da sua conta."
              : result.code === "not_entitled"
                ? "Este módulo ou estilo não está habilitado para sua conta."
                : "Não foi possível criar o widget agora.",
        });
        return;
      }

      setWidgets((current) => [result.widget, ...current]);
      setFeedback({
        tone: "success",
        text: "Widget criado. O estilo escolhido já está aplicado e o código pode ser usado em outro site.",
      });
    } catch {
      setFeedback({ tone: "error", text: "Não foi possível criar o widget agora." });
    } finally {
      setPending(false);
    }
  }

  async function toggleWidget(widget: ManagedWidget) {
    setFeedback(null);
    const active = widget.status !== "active";

    try {
      const result = await setActive({ data: { id: widget.id, active } });
      if (!result.ok) {
        setFeedback({ tone: "error", text: "Não foi possível alterar o widget agora." });
        return;
      }
      setWidgets((current) =>
        current.map((item) =>
          item.id === widget.id ? { ...item, status: active ? "active" : "inactive" } : item,
        ),
      );
    } catch {
      setFeedback({ tone: "error", text: "Não foi possível alterar o widget agora." });
    }
  }

  function replaceWidget(updated: ManagedWidget) {
    setWidgets((current) => current.map((item) => (item.id === updated.id ? updated : item)));
  }

  async function copyEmbed(widget: ManagedWidget) {
    try {
      await navigator.clipboard.writeText(widget.embedCode);
      setCopiedId(widget.id);
      window.setTimeout(() => setCopiedId((current) => (current === widget.id ? null : current)), 1800);
    } catch {
      setFeedback({
        tone: "error",
        text: "Não foi possível copiar automaticamente. Selecione o código do widget e copie manualmente.",
      });
    }
  }

  return (
    <main className="widget-builder-page" id="conteudo-principal" tabIndex={-1}>
      <section className="widget-builder-hero">
        <div>
          <span className="eyebrow">Widgets Tempo Pelotas</span>
          <h1>Leve os dados do Tempo Pelotas para o seu site</h1>
          <p>
            Escolha um módulo, parta de um estilo pronto e ajuste a aparência para combinar com o
            seu site. O widget continua responsivo e isolado do CSS da página onde for incorporado.
          </p>
        </div>
        <aside className="widget-builder-plan-card">
          <span>Conta atual</span>
          <strong>Plano {snapshot.access.label}</strong>
          <span>
            {snapshot.access.entitlements.widgetsMax === null
              ? "Widgets sem limite de quantidade nesta fase."
              : `Até ${snapshot.access.entitlements.widgetsMax} widgets.`}
          </span>
          <span>
            {canCustomizeAppearance
              ? "Estilos predefinidos e ajustes visuais liberados."
              : "Aparência padrão aplicada aos novos widgets."}
          </span>
        </aside>
      </section>

      <section className="widget-builder-create" aria-labelledby="widget-create-title">
        <div className="widget-builder-create__heading">
          <div>
            <span className="eyebrow">Novo widget</span>
            <h2 id="widget-create-title">Monte uma base que combine com o seu site</h2>
          </div>
          <p>{selectedModule?.description ?? "Nenhum módulo disponível para esta conta."}</p>
        </div>

        {enabledModules.length > 0 ? (
          <form className="widget-builder-form" onSubmit={handleCreate}>
            <div className="widget-builder-form__fields">
              <label>
                <span>Módulo</span>
                <select
                  value={selectedType}
                  onChange={(event) => changeModule(event.target.value as typeof selectedType)}
                >
                  {enabledModules.map((module) => (
                    <option value={module.type} key={module.type}>
                      {module.label} · {module.category}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Nome do widget</span>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  minLength={1}
                  maxLength={100}
                  required
                />
              </label>
            </div>

            {canCustomizeAppearance ? (
              <WidgetAppearanceControls
                value={appearance}
                onChange={setAppearance}
                controlName="widget-new-style"
              />
            ) : null}

            <div className="widget-builder-form__footer">
              <p>
                A personalização altera somente a apresentação. Fonte, horários, unidades e dados do
                módulo continuam controlados pelo Tempo Pelotas.
              </p>
              <button className="widget-builder-button" type="submit" disabled={pending}>
                {pending ? "Criando..." : "Criar widget"}
              </button>
            </div>
          </form>
        ) : (
          <p className="widget-builder-empty">Nenhum módulo de widget está habilitado nesta conta.</p>
        )}

        {feedback ? (
          <p className={`widget-builder-feedback is-${feedback.tone}`} role="status">
            {feedback.text}
          </p>
        ) : null}
      </section>

      <section aria-labelledby="widget-list-title">
        <div className="widget-builder-list__heading">
          <div>
            <span className="eyebrow">Meus widgets</span>
            <h2 id="widget-list-title">Prontos para incorporar e refinar</h2>
          </div>
          <span className="widget-builder-count">{widgets.length} criados</span>
        </div>

        {widgets.length === 0 ? (
          <div className="widget-builder-empty">
            Crie o primeiro widget acima. A prévia e o código de incorporação aparecerão aqui.
          </div>
        ) : (
          <div className="widget-builder-grid">
            {widgets.map((widget) => {
              const module = snapshot.modules.find((item) => item.type === widget.widgetType);
              const preset = getWidgetStylePreset(widget.appearance.preset);
              return (
                <article className="widget-builder-card" key={widget.id}>
                  <div className="widget-builder-card__content">
                    <div className="widget-builder-card__heading">
                      <div>
                        <h3>{widget.title}</h3>
                        <p>{module?.label ?? widget.widgetType}</p>
                      </div>
                      <span className={`widget-builder-badge is-${widget.status}`}>
                        {widget.status === "active" ? "Ativo" : "Pausado"}
                      </span>
                    </div>
                    <div className="widget-builder-card__meta">
                      <span className="widget-builder-badge">{preset.label}</span>
                      <span className="widget-builder-badge">Responsivo</span>
                      <span className="widget-builder-badge">v{widget.version}</span>
                      <span className="widget-builder-badge">Marca Tempo Pelotas</span>
                    </div>
                  </div>

                  {widget.status === "active" ? (
                    <div className="widget-builder-preview">
                      <iframe
                        key={`${widget.id}-${widget.version}`}
                        src={widget.embedUrl}
                        title={`Prévia: ${widget.title}`}
                        loading="lazy"
                        scrolling="no"
                      />
                    </div>
                  ) : null}

                  <div className="widget-builder-card__content">
                    {canCustomizeAppearance ? (
                      <WidgetAppearanceEditor widget={widget} onSaved={replaceWidget} />
                    ) : null}
                    <code className="widget-builder-code">{widget.embedCode}</code>
                    <div className="widget-builder-card__actions">
                      <button
                        className="widget-builder-button is-secondary"
                        type="button"
                        onClick={() => copyEmbed(widget)}
                      >
                        {copiedId === widget.id ? "Copiado" : "Copiar código"}
                      </button>
                      <button
                        className="widget-builder-button is-secondary"
                        type="button"
                        onClick={() => toggleWidget(widget)}
                      >
                        {widget.status === "active" ? "Pausar widget" : "Reativar widget"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
