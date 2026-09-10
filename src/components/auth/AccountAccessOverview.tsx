import { Link } from "@tanstack/react-router";

import type { AccountSnapshot } from "@/lib/auth/account.functions";

type AuthenticatedAccount = Extract<AccountSnapshot, { status: "authenticated" }>;
type Entitlements = AuthenticatedAccount["access"]["entitlements"];

type AccessItem = {
  title: string;
  description: string;
  state: "available" | "preparing" | "not-included";
};

function accessStateLabel(state: AccessItem["state"]) {
  if (state === "available") return "Disponível";
  if (state === "preparing") return "Em preparação";
  return "Não incluído";
}

function buildAccessItems(entitlements: Entitlements): AccessItem[] {
  const hasAdvancedAccess =
    entitlements.historyCompare ||
    entitlements.stationCompare ||
    entitlements.variableCompare ||
    entitlements.dataExport ||
    entitlements.forecastAccuracy ||
    entitlements.advancedCharts;

  return [
    {
      title: "Favoritos pessoais",
      description: "Salve páginas, estações, locais e ferramentas no seu painel.",
      state: entitlements.favorites ? "available" : "not-included",
    },
    {
      title: "Preferências da conta",
      description: "Escolha comunicações opcionais e mantenha suas decisões registradas.",
      state: entitlements.preferences ? "available" : "not-included",
    },
    {
      title: "Gerador de widgets",
      description: "Crie widgets permitidos pela sua camada e gerencie-os pela conta.",
      state:
        entitlements.widgetsAccess && entitlements.widgetsCreate ? "available" : "not-included",
    },
    {
      title: "Histórico pessoal",
      description:
        entitlements.historyAccessDays === null
          ? "A camada prevê histórico completo, mas a superfície pessoal ainda está em construção."
          : `A camada prevê até ${entitlements.historyAccessDays} dias nos recursos que forem liberados para o painel.`,
      state: "preparing",
    },
    {
      title: "Comparações e análises avançadas",
      description: hasAdvancedAccess
        ? "Sua camada prevê recursos avançados, mas cada módulo só aparece como disponível depois de implementado e validado para as fontes envolvidas."
        : "Comparações, exportações e análises avançadas não fazem parte da camada Free atual.",
      state: hasAdvancedAccess ? "preparing" : "not-included",
    },
  ];
}

export function AccountAccessOverview({ snapshot }: { snapshot: AuthenticatedAccount }) {
  const { access } = snapshot;
  const items = buildAccessItems(access.entitlements);
  const isFree = access.tier === "free";

  return (
    <section className="account-access-overview" aria-labelledby="account-access-title">
      <div className="account-access-overview__intro">
        <div>
          <span className="eyebrow">Seu acesso</span>
          <div className="account-access-overview__title-row">
            <h2 id="account-access-title">Plano {access.label}</h2>
            <span className={`account-access-overview__badge is-${access.tier}`}>
              {access.status === "active"
                ? "Ativo"
                : access.status === "expired"
                  ? "Expirado"
                  : "Suspenso"}
            </span>
          </div>
        </div>
        <p>
          {isFree
            ? "O cadastro gratuito acrescenta organização pessoal e ferramentas de conta. Previsão, alertas oficiais, radar, câmeras e dados públicos continuam acessíveis sem login."
            : "Sua camada de acesso é aplicada por capacidades. O conteúdo público continua aberto, enquanto ferramentas adicionais são liberadas apenas quando estiverem implementadas e permitidas pelas fontes."}
        </p>
      </div>

      <div className="account-access-overview__grid">
        {items.map((item) => (
          <article className={`account-access-overview__item is-${item.state}`} key={item.title}>
            <span>{accessStateLabel(item.state)}</span>
            <strong>{item.title}</strong>
            <p>{item.description}</p>
          </article>
        ))}
      </div>

      <div className="account-access-overview__footer">
        <p>
          {isFree
            ? "Sua conta Free não tem cobrança. O PRO permanece separado e não é necessário para consultar informação pública do Tempo Pelotas."
            : "O painel mostra apenas recursos realmente disponíveis. Entitlements futuros não são apresentados como produto concluído antes da implementação."}
        </p>
        <Link to="/painel">Abrir recursos da minha conta →</Link>
      </div>
    </section>
  );
}
