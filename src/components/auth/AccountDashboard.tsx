import { Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState, type DragEvent, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";

import { AccountFavoritesPanel } from "@/components/auth/AccountFavoritesPanel";
import { AccountLiveOverview } from "@/components/auth/AccountLiveOverview";
import { AccountObservatoryProduct } from "@/components/auth/AccountObservatoryProduct";
import {
  DashboardPersonalizationBar,
  DashboardSectionFrame,
} from "@/components/auth/DashboardPersonalization";
import { HistoricalModerationPanel } from "@/components/history/HistoricalModerationPanel";
import {
  getAccountDashboardLiveSnapshot,
  type AccountDashboardLiveSnapshot,
} from "@/lib/auth/account-dashboard-live.functions";
import type { AccountSnapshot } from "@/lib/auth/account.functions";
import {
  DEFAULT_DASHBOARD_LAYOUT,
  moveDashboardItem,
  normalizeDashboardLayout,
  placeDashboardItem,
  type DashboardLayout,
  type DashboardSectionId,
} from "@/lib/auth/dashboard-layout";
import { saveAccountDashboardLayout } from "@/lib/auth/dashboard-layout.functions";
import type { AccountFavoritesSnapshot } from "@/lib/auth/favorites.functions";
import type { HistoricalModerationSnapshot } from "@/lib/history/moderation.functions";
import type { ObservatoryAccessSnapshot } from "@/observatory/data/observatory-access.functions";
import { SiteFooter } from "@/production/components/site-footer";
import { SiteHeader } from "@/production/components/site-header";
import type { WeatherData } from "@/production/lib/weather-data";

const dashboardFooterSource = {
  name: "Tempo Pelotas",
  url: "/status-dos-dados",
  isFallback: false,
  observationName: "Dados e fontes do portal",
  observationUrl: "/status-dos-dados",
  forecastName: "Dados e fontes do portal",
  forecastUrl: "/status-dos-dados",
} satisfies WeatherData["source"];

type AuthenticatedAccount = Extract<AccountSnapshot, { status: "authenticated" }>;
type AuthenticatedFavorites = Extract<AccountFavoritesSnapshot, { status: "authenticated" }>;
type DashboardPath = "/widgets";

type DashboardModule = {
  title: string;
  description: string;
  state: "available" | "preparing" | "pro";
  href?: DashboardPath;
  actionLabel?: string;
};

const SECTION_LABELS: Record<DashboardSectionId, string> = {
  live: "Painel Vivo",
  favorites: "Favoritos Vivos",
  site: "Para meu site",
};

function moduleStateLabel(state: DashboardModule["state"]) {
  if (state === "available") return "Disponível";
  if (state === "pro") return "PRO";
  return "Em evolução";
}

function layoutsEqual(first: DashboardLayout, second: DashboardLayout) {
  return JSON.stringify(first) === JSON.stringify(second);
}

export function AccountDashboard({
  snapshot,
  moderation,
  favorites,
  observatory,
}: {
  snapshot: AuthenticatedAccount;
  moderation: HistoricalModerationSnapshot;
  favorites: AuthenticatedFavorites;
  observatory: ObservatoryAccessSnapshot;
}) {
  const loadLiveSnapshot = useServerFn(getAccountDashboardLiveSnapshot);
  const saveLayout = useServerFn(saveAccountDashboardLayout);
  const [liveSnapshot, setLiveSnapshot] = useState<AccountDashboardLiveSnapshot | null>(null);
  const [liveRefreshing, setLiveRefreshing] = useState(false);
  const [liveFailed, setLiveFailed] = useState(false);
  const [layout, setLayout] = useState<DashboardLayout>(snapshot.dashboardLayout);
  const [savedLayout, setSavedLayout] = useState<DashboardLayout>(snapshot.dashboardLayout);
  const [customizing, setCustomizing] = useState(false);
  const [layoutSaving, setLayoutSaving] = useState(false);
  const [layoutFeedback, setLayoutFeedback] = useState<string | null>(null);
  const [draggedSection, setDraggedSection] = useState<DashboardSectionId | null>(null);
  const isPro = snapshot.access.tier === "pro";
  const historyLimit = snapshot.access.entitlements.historyAccessDays;
  const favoriteCount = favorites.storageReady ? favorites.favoriteKeys.length : 0;
  const layoutDirty = !layoutsEqual(layout, savedLayout);

  const refreshLiveSnapshot = useCallback(async () => {
    setLiveRefreshing(true);
    setLiveFailed(false);
    try {
      const next = await loadLiveSnapshot();
      if (next.status === "unauthenticated") {
        window.location.assign("/conta?next=/painel");
        return;
      }
      setLiveSnapshot(next);
      setLiveFailed(next.status === "unavailable");
    } catch {
      setLiveFailed(true);
    } finally {
      setLiveRefreshing(false);
    }
  }, [loadLiveSnapshot]);

  useEffect(() => {
    void refreshLiveSnapshot();
  }, [refreshLiveSnapshot]);

  const siteModules: DashboardModule[] = [
    {
      title: "Gerador de widgets e distribuição",
      description:
        "Crie widgets responsivos, incorpore dados do Tempo Pelotas em outros sites e acompanhe a rede de distribuição dos seus embeds.",
      state: "available",
      href: "/widgets",
      actionLabel: "Criar meus widgets →",
    },
  ];
  const futureModules: DashboardModule[] = [
    {
      title: "Histórico pessoal",
      description:
        historyLimit === null
          ? "Sua camada prevê acesso completo ao acervo quando a experiência histórica pessoal estiver consolidada no painel."
          : `Sua camada prevê históricos de até ${historyLimit} dias nos recursos pessoais que forem liberados.`,
      state: "preparing",
    },
    {
      title: "Comparações avançadas",
      description:
        "Comparações entre períodos, estações e variáveis serão uma camada de profundidade para quem precisa investigar os dados, não apenas consultá-los.",
      state: isPro ? "preparing" : "pro",
    },
    {
      title: "Exportações e análises",
      description:
        "Exportação estruturada e análises avançadas serão adicionadas sobre o acervo e as fontes que permitem esse tipo de uso.",
      state: isPro ? "preparing" : "pro",
    },
  ];

  function updateSectionOrder(section: DashboardSectionId, direction: -1 | 1) {
    setLayout((current) => ({
      ...current,
      sections: moveDashboardItem(current.sections, section, direction),
    }));
  }

  function startSectionDrag(event: DragEvent<HTMLButtonElement>, section: DashboardSectionId) {
    setDraggedSection(section);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", section);
  }

  function dropSection(target: DashboardSectionId) {
    if (!draggedSection) return;
    setLayout((current) => ({
      ...current,
      sections: placeDashboardItem(current.sections, draggedSection, target),
    }));
    setDraggedSection(null);
  }

  async function persistLayout() {
    setLayoutSaving(true);
    setLayoutFeedback(null);
    try {
      const result = await saveLayout({ data: layout });
      if (!result.ok) {
        if (result.code === "unauthenticated") {
          window.location.assign("/conta?next=/painel");
          return;
        }
        setLayoutFeedback("Não foi possível salvar a organização do painel agora.");
        return;
      }
      setLayout(result.layout);
      setSavedLayout(result.layout);
      setCustomizing(false);
      setLayoutFeedback("Layout salvo na sua conta.");
    } catch {
      setLayoutFeedback("Não foi possível salvar a organização do painel agora.");
    } finally {
      setLayoutSaving(false);
    }
  }

  function cancelCustomization() {
    setLayout(savedLayout);
    setCustomizing(false);
    setLayoutFeedback(null);
  }

  function resetCustomization() {
    setLayout(normalizeDashboardLayout(DEFAULT_DASHBOARD_LAYOUT));
    setLayoutFeedback("Layout padrão preparado. Salve para manter essa organização.");
  }

  function siteSection(): ReactNode {
    return (
      <section className="account-dashboard__modules" aria-labelledby="dashboard-site-title">
        <div className="account-dashboard__section-heading">
          <span className="eyebrow">Para meu site</span>
          <h2 id="dashboard-site-title">Distribua o Tempo Pelotas fora do portal</h2>
          <p>
            Esta área reúne ferramentas de publicação vinculadas à sua conta. O painel pessoal
            fica acima; aqui entram os recursos para quem também mantém um site, portal ou projeto digital.
          </p>
        </div>

        <div className="account-dashboard__grid">
          {siteModules.map((module) => (
            <article className="account-dashboard__module" key={module.title}>
              <div className="account-dashboard__module-topline">
                <span>{moduleStateLabel(module.state)}</span>
              </div>
              <h3>{module.title}</h3>
              <p>{module.description}</p>
              {module.href ? (
                <Link to={module.href} className="account-dashboard__module-link">
                  {module.actionLabel}
                </Link>
              ) : null}
            </article>
          ))}
        </div>
      </section>
    );
  }

  function personalizedSection(section: DashboardSectionId): ReactNode {
    if (section === "live") {
      return (
        <AccountLiveOverview
          summary={liveSnapshot?.weather ?? null}
          refreshing={liveRefreshing}
          failed={liveFailed}
          layout={layout}
          customizing={customizing}
          onLayoutChange={setLayout}
        />
      );
    }

    if (section === "favorites") {
      return (
        <AccountFavoritesPanel
          snapshot={favorites}
          liveCards={liveSnapshot?.favorites ?? {}}
          liveLoading={(liveSnapshot === null && !liveFailed) || liveRefreshing}
          onFavoritesChanged={refreshLiveSnapshot}
          layout={layout}
          customizing={customizing}
          onLayoutChange={setLayout}
        />
      );
    }

    return siteSection();
  }

  return (
    <div className="site-shell site-shell--account">
      <SiteHeader advisoryLevel="normal" />

      <main className="account-page account-dashboard" id="conteudo-principal" tabIndex={-1}>
        <section className="account-dashboard__hero" aria-labelledby="dashboard-title">
          <div>
            <span className="eyebrow">Meu Tempo Pelotas</span>
            <div className="account-dashboard__title-row">
              <h1 id="dashboard-title">Olá, {snapshot.identity.displayName}</h1>
              <span className={`account-tier-badge is-${snapshot.access.tier}`}>
                {snapshot.access.label}
              </span>
            </div>
            <p>
              Este é o seu ponto de partida no Tempo Pelotas: um resumo vivo do que acontece agora,
              seus recursos favoritos e as ferramentas vinculadas à sua conta. O conteúdo público
              continua aberto; a conta serve para organizar e aprofundar a experiência.
            </p>
          </div>

          <div className="account-dashboard__actions">
            <Link
              className="account-dashboard__primary"
              to="/conta"
              search={{ erro: undefined, next: "/conta" }}
            >
              Configurar minha conta
            </Link>
            <Link className="account-dashboard__secondary" to="/">
              Ver portal público
            </Link>
          </div>
        </section>

        <section className="account-dashboard__summary" aria-label="Resumo da minha conta">
          <div>
            <small>Camada atual</small>
            <strong>{snapshot.access.label}</strong>
            <span>{isPro ? "Recursos conforme entitlements PRO" : "Conta Free com painel pessoal"}</span>
          </div>
          <div>
            <small>Favoritos</small>
            <strong>{favorites.storageReady ? favoriteCount : "Indisponível"}</strong>
            <span>Recursos que você escolheu acompanhar mais de perto</span>
          </div>
          <div>
            <small>Painel vivo</small>
            <strong>Incluído</strong>
            <span>Resumo meteorológico recuperado das mesmas fontes do portal</span>
          </div>
          <div>
            <small>Layout pessoal</small>
            <strong>Personalizável</strong>
            <span>Ordem e tamanho dos cards ficam salvos na sua conta</span>
          </div>
        </section>

        <AccountObservatoryProduct access={observatory} />

        <DashboardPersonalizationBar
          editing={customizing}
          dirty={layoutDirty}
          saving={layoutSaving}
          feedback={layoutFeedback}
          onEdit={() => {
            setCustomizing(true);
            setLayoutFeedback(null);
          }}
          onSave={() => void persistLayout()}
          onCancel={cancelCustomization}
          onReset={resetCustomization}
        />

        {layout.sections.map((section, index) => (
          <DashboardSectionFrame
            key={section}
            id={section}
            label={SECTION_LABELS[section]}
            editing={customizing}
            index={index}
            total={layout.sections.length}
            onMove={updateSectionOrder}
            onDragStart={startSectionDrag}
            onDrop={dropSection}
          >
            {personalizedSection(section)}
          </DashboardSectionFrame>
        ))}

        <section className="account-dashboard__modules" aria-labelledby="dashboard-evolution-title">
          <div className="account-dashboard__section-heading">
            <span className="eyebrow">Próximas camadas</span>
            <h2 id="dashboard-evolution-title">Mais profundidade, sem empobrecer o Free</h2>
            <p>
              O Free precisa continuar útil por si só. As próximas camadas entram para ampliar histórico,
              comparação e capacidade de trabalho, sem esconder atrás de assinatura os dados públicos básicos.
            </p>
          </div>

          <div className="account-dashboard__grid">
            {futureModules.map((module) => (
              <article className="account-dashboard__module" key={module.title}>
                <div className="account-dashboard__module-topline">
                  <span>{moduleStateLabel(module.state)}</span>
                </div>
                <h3>{module.title}</h3>
                <p>{module.description}</p>
              </article>
            ))}
          </div>
        </section>

        <HistoricalModerationPanel snapshot={moderation} />
      </main>

      <SiteFooter source={dashboardFooterSource} />
    </div>
  );
}
