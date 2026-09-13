import { Link } from "@tanstack/react-router";

import type { AccountSnapshot } from "@/lib/auth/account.functions";

type AuthenticatedAccount = Extract<AccountSnapshot, { status: "authenticated" }>;
type Entitlements = AuthenticatedAccount["access"]["entitlements"];

type AccessItem = {
  title: string;
  description: string;
  state: "available" | "preparing";
};

function accessStateLabel(state: AccessItem["state"]) {
  return state === "available" ? "Disponível" : "Em preparação";
}

function buildAccessItems(entitlements: Entitlements): AccessItem[] {
  return [
    {
      title: "Favoritos pessoais",
      description: "Salve páginas, estações, locais e ferramentas no seu painel.",
      state: entitlements.favorites ? "available" : "preparing",
    },
    {
      title: "Preferências da conta",
      description: "Escolha comunicações opcionais e mantenha suas decisões registradas.",
      state: entitlements.preferences ? "available" : "preparing",
    },
    {
      title: "Gerador de widgets",
      description: "Crie widgets responsivos e gerencie a publicação pela sua conta.",
      state:
        entitlements.widgetsAccess && entitlements.widgetsCreate ? "available" : "preparing",
    },
    {
      title: "Observatório",
      description: "Explore radar, satélite, raios, alertas e hidrologia em uma experiência geoespacial 3D.",
      state: entitlements.observatoryAccess ? "available" : "preparing",
    },
    {
      title: "Histórico pessoal",
      description:
        entitlements.historyAccessDays === null
          ? "Consulte observações arquivadas diretamente no painel, com seleção de local e período."
          : `Consulte até ${entitlements.historyAccessDays} dias de observações arquivadas diretamente no painel.`,
      state: "available",
    },
    {
      title: "Comparações, exportações e análises",
      description:
        "Esses módulos estão em desenvolvimento e serão liberados quando fontes, interface e validações estiverem prontas para uso consistente.",
      state: "preparing",
    },
  ];
}

export function AccountAccessOverview({ snapshot }: { snapshot: AuthenticatedAccount }) {
  const { access } = snapshot;
  const items = buildAccessItems(access.entitlements);

  return (
    <section className="account-access-overview" aria-labelledby="account-access-title">
      <div className="account-access-overview__intro">
        <div>
          <span className="eyebrow">Seu acesso</span>
          <div className="account-access-overview__title-row">
            <h2 id="account-access-title">Conta {access.label}</h2>
            <span className={`account-access-overview__badge is-${access.tier}`}>
              {access.status === "active"
                ? "Ativa"
                : access.status === "expired"
                  ? "Expirada"
                  : "Suspensa"}
            </span>
          </div>
        </div>
        <p>
          O cadastro acrescenta organização pessoal e ferramentas de trabalho. Previsão, alertas,
          radar, câmeras e demais dados públicos continuam abertos sem login, enquanto os recursos de
          conta ganham uma experiência própria.
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
          Os recursos da conta entram gradualmente conforme dados, fontes, experiência e segurança
          ficam prontos para uso contínuo.
        </p>
        <Link to="/painel">Abrir recursos da minha conta →</Link>
      </div>
    </section>
  );
}
