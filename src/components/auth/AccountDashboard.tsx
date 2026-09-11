import { Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";

import { AccountFavoritesPanel } from "@/components/auth/AccountFavoritesPanel";
import { AccountLiveOverview } from "@/components/auth/AccountLiveOverview";
import { HistoricalModerationPanel } from "@/components/history/HistoricalModerationPanel";
import {
  getAccountDashboardLiveSnapshot,
  type AccountDashboardLiveSnapshot,
} from "@/lib/auth/account-dashboard-live.functions";
import type { AccountSnapshot } from "@/lib/auth/account.functions";
import type { AccountFavoritesSnapshot } from "@/lib/auth/favorites.functions";
import type { HistoricalModerationSnapshot } from "@/lib/history/moderation.functions";
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

function moduleStateLabel(state: DashboardModule["state"]) {
  if (state === "available") return "Disponível";
  if (state === "pro") return "PRO";
  return "Em evolução";
}

export function AccountDashboard({
  snapshot,
  moderation,
  favorites,
}: {
  snapshot: AuthenticatedAccount;
  moderation: HistoricalModerationSnapshot;
  favorites: AuthenticatedFavorites;
}) {
  const loadLiveSnapshot = useServerFn(getAccountDashboardLiveSnapshot);
  const [liveSnapshot, setLiveSnapshot] = useState<AccountDashboardLiveSnapshot | null>(null);
  const [liveRefreshing, setLiveRefreshing] = useState(false);
  const [liveFailed, setLiveFailed] = useState(false);
  const isPro = snapshot.access.tier === "pro";
  const historyLimit = snapshot.access.entitlements.historyAccessDays;
  const favoriteCount = favorites.storageReady ? favorites.favoriteKeys.length : 0;

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
            <small>Histórico pessoal</small>
            <strong>{historyLimit === null ? "Completo" : `Até ${historyLimit} dias`}</strong>
            <span>Profundidade prevista para a evolução da sua conta</span>
          </div>
        </section>

        <AccountLiveOverview
          summary={liveSnapshot?.weather ?? null}
          refreshing={liveRefreshing}
          failed={liveFailed}
        />

        <AccountFavoritesPanel
          snapshot={favorites}
          liveCards={liveSnapshot?.favorites ?? {}}
          liveLoading={(liveSnapshot === null && !liveFailed) || liveRefreshing}
          onFavoritesChanged={refreshLiveSnapshot}
        />

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
