import { Link } from "@tanstack/react-router";
import { PanelsTopLeft } from "lucide-react";
import { useCallback, useEffect, useState, type DragEvent, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";

import { AccountDashboardNavigation } from "@/components/auth/AccountDashboardNavigation";
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

type AuthenticatedAccount = Extract<AccountSnapshot, { status: "authenticated" }>;
type AuthenticatedFavorites = Extract<AccountFavoritesSnapshot, { status: "authenticated" }>;

type FutureModule = {
  title: string;
  description: string;
};

const SECTION_LABELS: Record<DashboardSectionId, string> = {
  live: "Painel Vivo",
  favorites: "Favoritos",
  site: "Ferramentas",
};

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

  const futureModules: FutureModule[] = [
    {
      title: "Histórico pessoal",
      description:
        historyLimit === null
          ? "A conta já prevê acesso amplo ao acervo. A experiência histórica pessoal está sendo integrada ao workspace."
          : `A experiência pessoal está sendo preparada com uma janela inicial de até ${historyLimit} dias.`,
    },
    {
      title: "Comparações avançadas",
      description:
        "Comparações entre períodos, estações e variáveis vão permitir investigar os dados sem perder o contexto das fontes.",
    },
    {
      title: "Exportações e análises",
      description:
        "Exportações estruturadas e análises aprofundadas entrarão conforme cada fonte estiver pronta para esse tipo de uso.",
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

  function toolsSection(): ReactNode {
    return (
      <section className="account-dashboard__tools" aria-labelledby="dashboard-tools-title">
        <div className="account-dashboard__section-heading account-dashboard__section-heading--compact">
          <div>
            <span className="eyebrow">Ferramentas da conta</span>
            <h2 id="dashboard-tools-title">Recursos para usar, explorar e publicar</h2>
          </div>
          <p>
            Abra suas ferramentas diretamente daqui e mantenha os recursos cadastrados organizados
            em um único espaço de trabalho.
          </p>
        </div>

        <div className="account-dashboard__tools-grid">
          <AccountObservatoryProduct access={observatory} />

          <article className="account-tool-card account-tool-card--widgets">
            <div className="account-tool-card__topline">
              <span className="account-tool-card__icon" aria-hidden="true">
                <PanelsTopLeft size={20} />
              </span>
              <span className="account-tool-card__status is-unlocked">Incluído na conta</span>
            </div>

            <div className="account-tool-card__body">
              <span className="eyebrow">Ferramenta</span>
              <h3>Gerador de widgets</h3>
              <p>
                Monte widgets responsivos do Tempo Pelotas, publique em outros sites e acompanhe sua
                rede de distribuição sem sair da conta.
              </p>
              <div className="account-tool-card__features" aria-label="Recursos dos widgets">
                <span>Responsivos</span>
                <span>Embeds</span>
                <span>Temas</span>
                <span>Distribuição</span>
              </div>
            </div>

            <div className="account-tool-card__footer">
              <small>Disponível para contas cadastradas.</small>
              <Link to="/widgets">Criar meus widgets →</Link>
            </div>
          </article>
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

    return toolsSection();
  }

  return (
    <div className="account-app-shell">
      <AccountDashboardNavigation snapshot={snapshot} />

      <div className="account-app-main">
        <main className="account-page account-dashboard" id="conteudo-principal" tabIndex={-1}>
          <header className="account-dashboard__topbar" id="visao-geral">
            <div className="account-dashboard__topbar-copy">
              <span className="eyebrow">Meu Tempo Pelotas</span>
              <div className="account-dashboard__title-row">
                <h1>Olá, {snapshot.identity.displayName}</h1>
                <span className={`account-tier-badge is-${snapshot.access.tier}`}>
                  {snapshot.access.label}
                </span>
              </div>
              <p>
                Seu espaço pessoal para acompanhar o que importa, abrir ferramentas e organizar os
                recursos do Tempo Pelotas sem transformar o painel em outra versão do portal público.
              </p>
            </div>

            <div className="account-dashboard__topbar-actions">
              <Link
                className="account-dashboard__primary"
                to="/conta"
                search={{ erro: undefined, next: "/conta" }}
              >
                Configurar conta
              </Link>
              <Link className="account-dashboard__secondary" to="/">
                Portal público
              </Link>
            </div>
          </header>

          <section className="account-dashboard__summary" aria-label="Resumo da minha conta">
            <div>
              <small>Conta</small>
              <strong>{snapshot.access.label}</strong>
              <span>Recursos cadastrados ativos nesta experiência</span>
            </div>
            <div>
              <small>Favoritos</small>
              <strong>{favorites.storageReady ? favoriteCount : "Indisponível"}</strong>
              <span>Atalhos e leituras que você acompanha</span>
            </div>
            <div>
              <small>Ferramentas</small>
              <strong>2 disponíveis</strong>
              <span>Observatório e gerador de widgets</span>
            </div>
            <div>
              <small>Painel</small>
              <strong>Personalizável</strong>
              <span>Ordem e tamanho dos cards ficam salvos</span>
            </div>
          </section>

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

          <section className="account-dashboard__roadmap" aria-labelledby="dashboard-roadmap-title">
            <div className="account-dashboard__section-heading account-dashboard__section-heading--compact">
              <div>
                <span className="eyebrow">Em construção</span>
                <h2 id="dashboard-roadmap-title">Próximos recursos da conta</h2>
              </div>
              <p>
                Novos módulos entram quando dados, fontes e experiência estiverem maduros o suficiente
                para uso consistente dentro da conta.
              </p>
            </div>

            <div className="account-dashboard__roadmap-grid">
              {futureModules.map((module) => (
                <article className="account-dashboard__roadmap-card" key={module.title}>
                  <span>Em desenvolvimento</span>
                  <h3>{module.title}</h3>
                  <p>{module.description}</p>
                </article>
              ))}
            </div>
          </section>

          <HistoricalModerationPanel snapshot={moderation} />

          <footer className="account-dashboard__footer">
            <p>Tempo Pelotas · seu painel pessoal de tempo, água e ferramentas.</p>
            <div>
              <Link to="/status-dos-dados">Dados e fontes</Link>
              <Link to="/privacidade-e-dados">Privacidade</Link>
              <Link to="/">Voltar ao portal</Link>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
