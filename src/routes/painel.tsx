import { createFileRoute, Link, redirect } from "@tanstack/react-router";

import { AccountDashboard } from "@/components/auth/AccountDashboard";
import { getAccountSnapshot } from "@/lib/auth/account.functions";
import { getAccountFavorites } from "@/lib/auth/favorites.functions";
import { getHistoricalModerationSnapshot } from "@/lib/history/moderation.functions";
import { absoluteUrl, SITE_NAME } from "@/lib/site-config";
import { getObservatoryAccess } from "@/observatory/data/observatory-access.functions";

export const Route = createFileRoute("/painel")({
  head: () => ({
    meta: [
      { title: `Meu painel | ${SITE_NAME}` },
      {
        name: "description",
        content: "Painel pessoal do Tempo Pelotas para usuários autenticados.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/painel") }],
  }),
  loader: async () => {
    const snapshot = await getAccountSnapshot();

    if (snapshot.status === "unauthenticated") {
      throw redirect({
        to: "/conta",
        search: { erro: undefined, next: "/painel" },
      });
    }

    if (snapshot.status !== "authenticated") {
      return {
        snapshot,
        moderation: { status: "unavailable" as const },
        favorites: { status: "unavailable" as const },
        observatory: { status: "unavailable" as const },
      };
    }

    const [moderation, favorites, observatory] = await Promise.all([
      getHistoricalModerationSnapshot(),
      getAccountFavorites(),
      getObservatoryAccess(),
    ]);

    return { snapshot, moderation, favorites, observatory };
  },
  component: PainelPage,
});

function PainelPage() {
  const { snapshot, moderation, favorites, observatory } = Route.useLoaderData();

  if (snapshot.status === "unavailable") {
    return (
      <main className="login-page" id="conteudo-principal">
        <Link className="login-page__brand" to="/" aria-label="Voltar ao Tempo Pelotas">
          <img
            src="/brand/tempo-pelotas-header.svg"
            alt="Tempo Pelotas"
            width={11349}
            height={1552}
          />
        </Link>
        <section className="login-card" aria-labelledby="panel-unavailable-title">
          <span className="eyebrow">Meu painel</span>
          <h1 id="panel-unavailable-title">A área autenticada está temporariamente indisponível</h1>
          <p>
            O portal público continua funcionando normalmente enquanto a configuração da conta é
            restabelecida.
          </p>
        </section>
        <Link className="login-page__back" to="/">
          ← Voltar para a previsão
        </Link>
      </main>
    );
  }

  if (
    snapshot.status !== "authenticated" ||
    favorites.status !== "authenticated"
  ) {
    return null;
  }

  return (
    <AccountDashboard
      snapshot={snapshot}
      moderation={moderation}
      favorites={favorites}
      observatory={observatory}
    />
  );
}
