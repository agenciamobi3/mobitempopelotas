import { createFileRoute } from "@tanstack/react-router";

import { TempoPelotasAboutPage } from "@/components/about/TempoPelotasAboutPage";
import { InternalWeatherPageShell } from "@/components/layout/InternalWeatherPageShell";
import { createPageHead } from "@/lib/page-meta";
import { createEditorialPageJsonLd } from "@/lib/structured-data";
import { getWeatherIntelligence } from "@/lib/weather/weather-intelligence.functions";

const PAGE_TITLE = "Quem Somos | Tempo Pelotas";
const PAGE_DESCRIPTION =
  "Conheça o Tempo Pelotas, uma plataforma de disseminação de informações meteorológicas, ambientais e hidrológicas baseada em fontes oficiais e tecnologia desenvolvida pela MOBI.";
const PAGE_PATH = "/quem-somos";

export const Route = createFileRoute("/quem-somos")({
  head: () =>
    createPageHead(PAGE_TITLE, PAGE_DESCRIPTION, PAGE_PATH, [
      createEditorialPageJsonLd({
        name: PAGE_TITLE,
        description: PAGE_DESCRIPTION,
        path: PAGE_PATH,
        breadcrumbs: [
          { name: "Início", path: "/" },
          { name: "Quem Somos", path: PAGE_PATH },
        ],
        about: [
          "Tempo Pelotas",
          "Meteorologia em Pelotas",
          "Monitoramento hidrológico",
          "Informação climática regional",
          "MOBI Marketing Inteligente",
          "Fontes meteorológicas oficiais",
        ],
      }),
    ]),
  loader: async () => ({ weather: await getWeatherIntelligence() }),
  staleTime: 60 * 60 * 1_000,
  component: QuemSomosPage,
});

function QuemSomosPage() {
  const { weather } = Route.useLoaderData();

  return (
    <InternalWeatherPageShell data={weather} pageClassName="internal-weather-shell--about">
      <TempoPelotasAboutPage />
    </InternalWeatherPageShell>
  );
}
