import { createFileRoute, Link } from "@tanstack/react-router";

import { WidgetBuilder } from "@/components/widgets/WidgetBuilder";
import { getWidgetManagerSnapshot } from "@/lib/widgets/widget.functions";
import { SiteFooter } from "@/production/components/site-footer";
import { SiteHeader } from "@/production/components/site-header";
import type { WeatherData } from "@/production/lib/weather-data";

const footerSource = {
  name: "Tempo Pelotas",
  url: "/status-dos-dados",
  isFallback: false,
  observationName: "Dados e fontes do portal",
  observationUrl: "/status-dos-dados",
  forecastName: "Status das fontes",
  forecastUrl: "/status-dos-dados",
} satisfies WeatherData["source"];

export const Route = createFileRoute("/widgets")({
  head: () => ({
    meta: [
      { title: "Meus widgets | Tempo Pelotas" },
      {
        name: "description",
        content: "Crie e gerencie widgets responsivos do Tempo Pelotas para incorporar em outros sites.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  loader: () => getWidgetManagerSnapshot(),
  component: WidgetsPage,
});

function WidgetsPage() {
  const snapshot = Route.useLoaderData();

  if (snapshot.status === "unavailable") {
    return (
      <div className="site-shell site-shell--account">
        <SiteHeader advisoryLevel="normal" />
        <main className="widget-builder-login" id="conteudo-principal">
          <span className="eyebrow">Widgets Tempo Pelotas</span>
          <h1>Gerador temporariamente indisponível</h1>
          <p>A área pública do portal continua funcionando normalmente.</p>
          <Link to="/">Voltar ao Tempo Pelotas</Link>
        </main>
        <SiteFooter source={footerSource} />
      </div>
    );
  }

  if (snapshot.status === "unauthenticated") {
    return (
      <div className="site-shell site-shell--account">
        <SiteHeader advisoryLevel="normal" />
        <main className="widget-builder-login" id="conteudo-principal">
          <span className="eyebrow">Widgets Tempo Pelotas</span>
          <h1>Entre para criar seus widgets</h1>
          <p>
            O gerador salva seus widgets na conta para que você possa copiar, pausar e reutilizar o
            código quando quiser.
          </p>
          <a href="/conta?next=/widgets">Entrar com minha conta</a>
        </main>
        <SiteFooter source={footerSource} />
      </div>
    );
  }

  return (
    <div className="site-shell site-shell--account">
      <SiteHeader advisoryLevel="normal" />
      <WidgetBuilder snapshot={snapshot} />
      <SiteFooter source={footerSource} />
    </div>
  );
}