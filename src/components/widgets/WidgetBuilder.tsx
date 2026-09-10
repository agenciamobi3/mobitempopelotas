import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
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
import {
  createDefaultWidgetContent,
  type WidgetContentDefinition,
  type WidgetPresentation,
} from "@/lib/widgets/widget-content";
import type { WidgetType } from "@/lib/widgets/widget-registry";

import { WidgetAppearanceControls } from "./WidgetAppearanceControls";
import { WidgetContentControls } from "./WidgetContentControls";
import "./WidgetBuilder.css";
import "./WidgetBuilderAppearance.css";
import "./WidgetBuilderLivePreview.css";

type AuthenticatedSnapshot = Extract<WidgetManagerSnapshot, { status: "authenticated" }>;

type Feedback = {
  tone: "success" | "error";
  text: string;
} | null;

function presentationLabel(presentation: WidgetPresentation) {
  if (presentation === "compact") return "Compacto";
  if (presentation === "horizontal") return "Horizontal";
  return "Cartão";
}

function previewInitialHeight(presentation: WidgetPresentation) {
  return presentation === "compact" ? 380 : presentation === "horizontal" ? 460 : 520;
}

function buildLivePreviewUrl(
  widgetType: WidgetType,
  appearance: WidgetAppearance,
  content: WidgetContentDefinition,
) {
  const params = new URLSearchParams({
    previewType: widgetType,
    preset: appearance.preset,
    accent: appearance.accentColor,
    radius: String(appearance.radius),
    density: appearance.density,
    presentation: content.presentation,
    blocks: content.visibleBlocks.join(","),
  });
  return `/embed/widget?${params.toString()}`;
}

function ResponsiveWidgetFrame({
  src,
  title,
  resizeToken,
  initialHeight,
  loading = "lazy",
}: {
  src: string;
  title: string;
  resizeToken: string;
  initialHeight: number;
  loading?: "eager" | "lazy";
}) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(initialHeight);

  useEffect(() => {
    setHeight(initialHeight);
  }, [initialHeight, src]);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      if (event.source !== frameRef.current?.contentWindow) return;
      const message = event.data as { source?: string; token?: string; type?: string; height?: number };
      if (
        message.source !== "tempo-pelotas-widget" ||
        message.token !== resizeToken ||
        message.type !== "resize" ||
        typeof message.height !== "number"
      ) {
        return;
      }
      setHeight(Math.max(180, Math.min(900, Math.ceil(message.height + 4))));
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [resizeToken]);

  return (
    <iframe
      ref={frameRef}
      src={src}
      title={title}
      height={height}
      loading={loading}
      scrolling="no"
    />
  );
}

function WidgetLivePreview({
  src,
  title,
  presentation,
}: {
  src: string;
  title: string;
  presentation: WidgetPresentation;
}) {
  return (
    <div className={`widget-builder-live-preview is-${presentation}`}>
      <div className="widget-builder-live-preview__heading">
        <div>
          <span>Prévia real</span>
          <strong>Dados atuais do Tempo Pelotas</strong>
        </div>
        <small>{presentationLabel(presentation)}</small>
      </div>
      <ResponsiveWidgetFrame
        src={src}
        title={title}
        resizeToken="preview"
        initialHeight={previewInitialHeight(presentation)}
        loading="eager"
      />
      <p>
        Esta prévia usa o mesmo renderer do código incorporado. Alterações visuais não modificam
        fonte, unidade, horário ou significado dos dados.
      </p>
    </div>
  );
}

function WidgetCustomizationEditor({
  widget,
  onSaved,
}: {
  widget: ManagedWidget;
  onSaved: (widget: ManagedWidget) => void;
}) {
  const updateAppearance = useServerFn(updateUserWidgetAppearance);
  const [appearanceDraft, setAppearanceDraft] = useState<WidgetAppearance>(widget.appearance);
  const [contentDraft, setContentDraft] = useState<WidgetContentDefinition>(widget.content);
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  async function saveCustomization() {
    setPending(true);
    setFeedback(null);
    try {
      const result = await updateAppearance({
        data: {
          id: widget.id,
          appearance: appearanceDraft,
          content: contentDraft,
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
            result.code === "conflict"
              ? "Este widget mudou em outra sessão. Recarregue a página antes de salvar novamente."
              : result.code === "not_entitled"
                ? "A personalização não está habilitada para esta conta."
                : result.code === "invalid_config"
                  ? "Um dos blocos selecionados não pertence a este módulo."
                  : "Não foi possível salvar a personalização agora.",
        });
        return;
      }

      setAppearanceDraft(result.widget.appearance);
      setContentDraft(result.widget.content);
      onSaved(result.widget);
      setFeedback({ tone: "success", text: "Aparência e conteúdo salvos no widget." });
    } catch {
      setFeedback({ tone: "error", text: "Não foi possível salvar a personalização agora." });
    } finally {
      setPending(false);
    }
  }

  return (
    <details className="widget-builder-style-editor">
      <summary>Personalizar widget</summary>
      <WidgetAppearanceControls
        value={appearanceDraft}
        onChange={setAppearanceDraft}
        legend="Editar aparência"
        compact
        controlName={`widget-style-${widget.id}`}
      />
      <WidgetContentControls
        widgetType={widget.widgetType}
        value={contentDraft}
        onChange={setContentDraft}
        compact
        controlName={`widget-content-${widget.id}`}
      />
      <div className="widget-builder-style-editor__actions">
        <p>
          A prévia real é atualizada depois de salvar. O código de incorporação continua o mesmo.
        </p>
        <button
          className="widget-builder-button is-secondary"
          type="button"
          onClick={saveCustomization}
          disabled={pending}
        >
          {pending ? "Salvando..." : "Salvar personalização"}
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
  const [selectedType, setSelectedType] = useState<WidgetType>(
    enabledModules[0]?.type ?? "nivel-laranjal",
  );
  const selectedModule =
    enabledModules.find((module) => module.type === selectedType) ?? enabledModules[0] ?? null;
  const [title, setTitle] = useState(selectedModule?.defaultTitle ?? "Widget Tempo Pelotas");
  const [appearance, setAppearance] = useState<WidgetAppearance>(() =>
    createAppearanceFromPreset("tempo-dark"),
  );
  const [content, setContent] = useState<WidgetContentDefinition>(() =>
    createDefaultWidgetContent(selectedType),
  );
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const livePreviewUrl = useMemo(
    () => buildLivePreviewUrl(selectedType, appearance, content),
    [appearance, content, selectedType],
  );

  function changeModule(nextType: WidgetType) {
    setSelectedType(nextType);
    const module = enabledModules.find((item) => item.type === nextType);
    if (module) setTitle(module.defaultTitle);
    setContent(createDefaultWidgetContent(nextType));
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
          ...(canCustomizeAppearance ? { appearance, content } : {}),
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
                ? "Este módulo ou personalização não está habilitado para sua conta."
                : result.code === "invalid_config"
                  ? "Um dos blocos selecionados não pertence a este módulo."
                  : "Não foi possível criar o widget agora.",
        });
        return;
      }

      setWidgets((current) => [result.widget, ...current]);
      setFeedback({
        tone: "success",
        text: "Widget criado. A apresentação vista na prévia já está aplicada ao código incorporável.",
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
            Escolha um módulo, parta de um estilo pronto, defina o formato e mantenha somente os
            blocos úteis. A prévia usa dados reais e o widget continua isolado do CSS do seu site.
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
              ? "Presets, formatos e blocos configuráveis liberados."
              : "Apresentação padrão aplicada aos novos widgets."}
          </span>
        </aside>
      </section>

      <section className="widget-builder-create" aria-labelledby="widget-create-title">
        <div className="widget-builder-create__heading">
          <div>
            <span className="eyebrow">Novo widget</span>
            <h2 id="widget-create-title">Monte o widget no espaço onde ele vai viver</h2>
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
                  onChange={(event) => changeModule(event.target.value as WidgetType)}
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
              <>
                <WidgetAppearanceControls
                  value={appearance}
                  onChange={setAppearance}
                  controlName="widget-new-style"
                />
                <WidgetContentControls
                  widgetType={selectedType}
                  value={content}
                  onChange={setContent}
                  controlName="widget-new-content"
                />
              </>
            ) : null}

            <WidgetLivePreview
              src={livePreviewUrl}
              title={`Prévia real: ${title}`}
              presentation={content.presentation}
            />

            <div className="widget-builder-form__footer">
              <p>
                A personalização altera apenas a apresentação e a quantidade de blocos visíveis.
                Fonte, horários, unidades e dados do módulo continuam controlados pelo Tempo Pelotas.
              </p>
              <button className="widget-builder-button" type="submit" disabled={pending}>
                {pending ? "Criando..." : "Criar este widget"}
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
                      <span className="widget-builder-badge">
                        {presentationLabel(widget.content.presentation)}
                      </span>
                      <span className="widget-builder-badge">Responsivo</span>
                      <span className="widget-builder-badge">v{widget.version}</span>
                      <span className="widget-builder-badge">Marca Tempo Pelotas</span>
                    </div>
                  </div>

                  {widget.status === "active" ? (
                    <div className="widget-builder-preview">
                      <ResponsiveWidgetFrame
                        key={`${widget.id}-${widget.version}`}
                        src={widget.embedUrl}
                        title={`Prévia: ${widget.title}`}
                        resizeToken={widget.publicToken}
                        initialHeight={previewInitialHeight(widget.content.presentation)}
                      />
                    </div>
                  ) : null}

                  <div className="widget-builder-card__content">
                    {canCustomizeAppearance ? (
                      <WidgetCustomizationEditor widget={widget} onSaved={replaceWidget} />
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
