import { createFileRoute, Link, redirect } from "@tanstack/react-router";

import { getObservatoryAccess } from "@/observatory/data/observatory-access.functions";
import { ObservatoryShell } from "@/observatory/ui/ObservatoryShell";
import { absoluteUrl, SITE_NAME } from "@/lib/site-config";

const ROBOTS_POLICY = "noindex, nofollow, noarchive, nosnippet, noimageindex";

export const Route = createFileRoute("/observatorio")({
  head: () => ({
    meta: [
      { title: `Observatório | ${SITE_NAME}` },
      {
        name: "description",
        content: "Ferramenta avançada do Tempo Pelotas para exploração espacial e temporal de dados meteorológicos e hidrológicos.",
      },
      { name: "robots", content: ROBOTS_POLICY },
      { name: "googlebot", content: ROBOTS_POLICY },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/observatorio") }],
  }),
  loader: async () => {
    const access = await getObservatoryAccess();

    if (access.status === "unauthenticated") {
      throw redirect({
        to: "/conta",
        search: { erro: undefined, next: "/observatorio" },
      });
    }

    return access;
  },
  component: ObservatoryRoute,
});

function ObservatoryRoute() {
  const access = Route.useLoaderData();

  if (access.status === "unavailable") {
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
        <section className="login-card" aria-labelledby="observatory-unavailable-title">
          <span className="eyebrow">Observatório</span>
          <h1 id="observatory-unavailable-title">O Observatório está temporariamente indisponível</h1>
          <p>
            O portal público continua funcionando normalmente enquanto a área PRO recupera o acesso
            da conta.
          </p>
        </section>
        <Link className="login-page__back" to="/">
          ← Voltar para a previsão
        </Link>
      </main>
    );
  }

  if (access.status !== "authenticated") return null;

  if (!access.allowed) {
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
        <section className="login-card" aria-labelledby="observatory-pro-title">
          <span className="eyebrow">Tempo Pelotas PRO</span>
          <h1 id="observatory-pro-title">Observatório disponível no plano PRO</h1>
          <p>
            Sua conta continua com acesso normal aos recursos públicos e gratuitos. O Observatório é
            uma ferramenta avançada do plano PRO e ainda está em desenvolvimento interno.
          </p>
          <Link className="button" to="/painel">
            Voltar ao meu painel
          </Link>
        </section>
        <Link className="login-page__back" to="/">
          ← Voltar para a previsão
        </Link>
      </main>
    );
  }

  return <ObservatoryShell />;
}
