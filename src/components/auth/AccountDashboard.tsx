import { Link } from "@tanstack/react-router";

import { AccountFavoritesPanel } from "@/components/auth/AccountFavoritesPanel";
import { HistoricalModerationPanel } from "@/components/history/HistoricalModerationPanel";
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
type DashboardPath = "/situacao-hidrologica-pelotas" | "/radar-e-satelite-pelotas" | "/widgets";

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
  return "Em preparação";
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
  const isPro = snapshot.access.tier === "pro";
  const historyLimit = snapshot.access.entitlements.historyAccessDays;
  const favoriteCount = favorites.storageReady ? favorites.favoriteKeys.length : 0;
  const modules: DashboardModule[] = [
    {
      title: "Gerador de widgets",
      description:
        "Crie widgets responsivos do Tempo Pelotas, veja a prévia e copie o código para incorporar em outro site.",
      state: "available",
      href: "/widgets",
      actionLabel: "Criar meus widgets →",
    },
    {
      title: "Histórico",
      description:
        historyLimit === null
          ? "O entitlement desta conta prevê acesso ao acervo completo quando o módulo histórico pessoal estiver disponível."
          : `Sua camada prevê históricos de até ${historyLimit} dias nos recursos que forem liberados no painel.`,
      state: "preparing",
    },
    {
      title: "Situação das águas",
      description:
        "A visão pública das águas continua aberta e pode ser adicionada aos seus favoritos do painel.",
      state: "available",
      href: "/situacao-hidrologica-pelotas",
    },
    {
      title: "Radar e satélite",
      description:
        "A central pública segue aberta; recursos adicionais serão liberados conforme a camada da conta e as fontes permitirem.",
      state: "available",
      href: "/radar-e-satelite-pelotas",
    },
    {
      title: "Comparações avançadas",
      description:
        "Comparações entre períodos, estações e variáveis farão parte da evolução do Tempo Pelotas PRO.",
      state: isPro ? "preparing" : "pro",
    },
    {
      title: "Exportações e análises",
      description:
        "Ferramentas avançadas serão construídas sobre o acervo e os dados cuja utilização permita esse tipo de recurso.",
      state: isPro ? "preparing" : "pro",
    },
  ];

  return (
    <div className="site-shell site-shell--account">
      <SiteHeader advisoryLevel="normal" />

      <main className="account-page account-dashboard" id="conteudo-principal" tabIndex={-1}>
        <section className="account-dashboard__hero" aria-labelledby="dashboard-title">
          <div>
            <span className="eyebrow">Meu painel</span>
            <div className="account-dashboard__title-row">
              <h1 id="dashboard-title">Olá, {snapshot.identity.displayName}</h1>
              <span className={`account-tier-badge is-${snapshot.access.tier}`}>
                {snapshot.access.label}
              </span>
            </div>
            <p>
              Organize o que você acompanha no Tempo Pelotas. Sua conta reúne favoritos,
              preferências e widgets sem retirar do portal nenhuma informação que já é pública.
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
              Ver Tempo Pelotas
            </Link>
          </div>
        </section>

        <section className="account-dashboard__summary" aria-label="Resumo do acesso">
          <div>
            <small>Camada atual</small>
            <strong>{snapshot.access.label}</strong>
            <span>{isPro ? "Recursos PRO conforme entitlements" : "Conta gratuita autenticada"}</span>
          </div>
          <div>
            <small>Favoritos</small>
            <strong>{favorites.storageReady ? favoriteCount : "Indisponível"}</strong>
            <span>Atalhos pessoais salvos somente na sua conta</span>
          </div>
          <div>
            <small>Histórico pessoal</small>
            <strong>{historyLimit === null ? "Completo" : `Até ${historyLimit} dias`}</strong>
            <span>Limite previsto para o módulo histórico ainda em preparação</span>
          </div>
          <div>
            <small>Portal público</small>
            <strong>Continua aberto</strong>
            <span>Dados oficiais públicos não dependem da assinatura</span>
          </div>
        </section>

        <AccountFavoritesPanel snapshot={favorites} />

        <section className="account-dashboard__modules" aria-labelledby="dashboard-modules-title">
          <div className="account-dashboard__section-heading">
            <span className="eyebrow">Ferramentas</span>
            <h2 id="dashboard-modules-title">Recursos disponíveis e próximas camadas</h2>
            <p>
              O painel usa capacidades da conta, não bloqueios espalhados pela interface. Recursos
              públicos continuam públicos; Free adiciona organização pessoal e o PRO poderá adicionar
              profundidade e ferramentas avançadas.
            </p>
          </div>

          <div className="account-dashboard__grid">
            {modules.map((module) => (
              <article className="account-dashboard__module" key={module.title}>
                <div className="account-dashboard__module-topline">
                  <span>{moduleStateLabel(module.state)}</span>
                </div>
                <h3>{module.title}</h3>
                <p>{module.description}</p>
                {module.href ? (
                  <Link to={module.href} className="account-dashboard__module-link">
                    {module.actionLabel ?? "Abrir recurso público →"}
                  </Link>
                ) : null}
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
