import { createFileRoute } from "@tanstack/react-router";

import { OfficialDataAccessNotice } from "@/components/content/OfficialDataAccessNotice";
import { DataExperiencePageShell } from "@/components/layout/DataExperiencePageShell";
import { ForecastAccuracyPanel } from "@/components/methodology/ForecastAccuracyPanel";
import { MethodologyPage } from "@/components/methodology/MethodologyPage";
import "@/components/methodology/MethodologyHomeContract.css";
import { loadMethodologyPageData } from "@/lib/methodology/methodology-page-loader";
import { createPageHead } from "@/lib/page-meta";
import { createEditorialPageJsonLd } from "@/lib/structured-data";

const PAGE_TITLE = "Como os dados do Tempo Pelotas funcionam";
const PAGE_DESCRIPTION =
  "Veja de onde vêm as informações de tempo e nível da água, como o Tempo Pelotas integra e dissemina fontes oficiais, como a precisão das previsões é medida e quais são os limites de cada dado.";
const PAGE_PATH = "/metodologia";

export const Route = createFileRoute("/metodologia")({
  head: () =>
    createPageHead(PAGE_TITLE, PAGE_DESCRIPTION, PAGE_PATH, [
      createEditorialPageJsonLd({
        name: PAGE_TITLE,
        description: PAGE_DESCRIPTION,
        path: PAGE_PATH,
        breadcrumbs: [
          { name: "Início", path: "/" },
          { name: "Como os dados funcionam", path: PAGE_PATH },
        ],
        about: ["Metodologia meteorológica", "Fontes de dados meteorológicos em Pelotas"],
      }),
    ]),
  loader: () => loadMethodologyPageData(),
  staleTime: 60 * 1_000,
  component: MetodologiaPage,
});

function MetodologiaPage() {
  const data = Route.useLoaderData();

  return (
    <DataExperiencePageShell pageClassName="methodology-data-shell">
      <MethodologyPage
        weather={data.weather}
        level={data.level}
        redemet={data.redemet}
        guaiba={data.guaiba}
        lagoon={data.lagoon}
      />
      <OfficialDataAccessNotice scope="all" />
      <ForecastAccuracyPanel summary={data.accuracy} />
    </DataExperiencePageShell>
  );
}
