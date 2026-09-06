import { createFileRoute } from "@tanstack/react-router";

import { GoogleLoginCard } from "@/components/auth/GoogleLoginCard";
import { HistoricalContributionForm } from "@/components/history/HistoricalContributionForm";
import { ContentPageShell } from "@/components/layout/ContentPageShell";
import { getAccountSnapshot } from "@/lib/auth/account.functions";
import {
  contributionPath,
  getHistoricalCollaborationContext,
  HISTORICAL_COLLABORATION_ORDER,
} from "@/lib/history/historical-collaboration";
import { absoluteUrl, SITE_NAME } from "@/lib/site-config";

function validateSearch(search: Record<string, unknown>) {
  return {
    pagina: typeof search.pagina === "string" ? search.pagina : undefined,
    erro: typeof search.erro === "string" ? search.erro : undefined,
  };
}

export const Route = createFileRoute("/contribuir")({
  validateSearch,
  head: () => ({
    meta: [
      { title: `Ajude a completar a história | ${SITE_NAME}` },
      {
        name: "description",
        content:
          "Envie fontes, fotos, documentos, relatos e medições para revisão do arquivo histórico do Tempo Pelotas.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/contribuir") }],
  }),
  loader: () => getAccountSnapshot(),
  component: ContribuirPage,
});

function ContextSelector() {
  return (
    <section className="tp-contribution-page" aria-labelledby="contribution-selector-title">
      <header className="tp-contribution-page__header">
        <span>Arquivo histórico colaborativo</span>
        <h1 id="contribution-selector-title">Qual história você pode ajudar a completar?</h1>
        <p>
          Escolha uma enchente para enviar fotos, documentos, fontes, depoimentos, medições ou
          correções. Todo material passa por revisão antes de qualquer publicação.
        </p>
      </header>
      <div className="tp-history-collab__grid">
        {HISTORICAL_COLLABORATION_ORDER.map((context) => (
          <article key={context.pagePath}>
            <strong>Enchente de {context.eventYear}</strong>
            <p>{context.pageTitle}</p>
            <a className="tp-history-collab-button" href={contributionPath(context)}>
              Enviar contribuição sobre {context.eventYear}
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}

function ContribuirPage() {
  const snapshot = Route.useLoaderData();
  const search = Route.useSearch();
  const context = getHistoricalCollaborationContext(search.pagina);

  if (!context) {
    return (
      <ContentPageShell pageClassName="internal-weather-shell--flood-history">
        <ContextSelector />
      </ContentPageShell>
    );
  }

  const nextPath = contributionPath(context);

  if (snapshot.status === "unavailable") {
    return (
      <ContentPageShell pageClassName="internal-weather-shell--flood-history">
        <section className="tp-contribution-page">
          <header className="tp-contribution-page__header">
            <span>Arquivo histórico colaborativo</span>
            <h1>A área de contribuições está temporariamente indisponível</h1>
            <p>
              O registro histórico continua público. O envio autenticado depende da área de membros
              e será reaberto quando a conexão estiver disponível.
            </p>
          </header>
          <a className="tp-contribution-page__back" href={context.pagePath}>
            ← Voltar para {context.pageTitle}
          </a>
        </section>
      </ContentPageShell>
    );
  }

  if (snapshot.status === "unauthenticated") {
    return (
      <ContentPageShell pageClassName="internal-weather-shell--flood-history">
        <section className="tp-contribution-page">
          <header className="tp-contribution-page__header">
            <span>Colaboração comunitária</span>
            <h1>Ajude a completar a história de {context.eventYear}</h1>
            <p>
              Para proteger o acervo contra spam e manter a origem das contribuições auditável, o
              envio usa a conta gratuita do Tempo Pelotas. Após o acesso, você volta direto para este
              formulário.
            </p>
          </header>
          <GoogleLoginCard
            nextPath={nextPath}
            errorCode={search.erro}
            eyebrow="Conta gratuita · Tempo Pelotas"
            title="Entre para enviar sua contribuição"
            description="O acesso identifica quem enviou o material para fins de revisão. Seu nome só aparece publicamente como colaborador se o material for aprovado, houver autorização de publicação e você permitir essa identificação."
          />
          <a className="tp-contribution-page__back" href={context.pagePath}>
            ← Voltar para {context.pageTitle}
          </a>
        </section>
      </ContentPageShell>
    );
  }

  return (
    <ContentPageShell pageClassName="internal-weather-shell--flood-history">
      <section className="tp-contribution-page" aria-labelledby="contribution-form-title">
        <header className="tp-contribution-page__header">
          <span>Colaboração comunitária · revisão editorial</span>
          <h1 id="contribution-form-title">Ajude a completar esta história</h1>
          <p>
            Envie o que você tem sobre {context.eventYear}. Pode ser uma fonte perdida na internet,
            uma fotografia de família, um recorte de jornal, um documento, uma medição, uma correção
            ou a memória de quem viveu a enchente.
          </p>
        </header>
        <p className="tp-contribution-page__notice">
          A contribuição fica privada enquanto estiver em revisão. O envio não altera automaticamente
          a página histórica. Você também pode compartilhar material apenas para análise, sem autorizar
          sua reprodução pública.
        </p>
        <HistoricalContributionForm
          context={context}
          contributorName={snapshot.identity.displayName || snapshot.identity.email}
        />
        <a className="tp-contribution-page__back" href={context.pagePath}>
          ← Voltar para {context.pageTitle}
        </a>
      </section>
    </ContentPageShell>
  );
}
