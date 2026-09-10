import { createFileRoute } from "@tanstack/react-router";

import { LaranjalEmbedGuide } from "@/components/embed/LaranjalEmbedGuide";
import { AnaRhnLaranjalStationProfile } from "@/components/hydrology/AnaRhnLaranjalStationProfile";
import { HydrologyEditorialHero } from "@/components/hydrology/HydrologyEditorialHero";
import "@/components/hydrology/HydrologyEditorialRefinements.css";
import "@/components/hydrology/HydrologyEditorialRoute.css";
import { LaranjalLevelPage } from "@/components/hydrology/HydrologyPages";
import "@/components/hydrology/HydrologyDetailHomeContract.css";
import "@/components/hydrology/LaranjalLevelVisualRefresh.css";
import { LaranjalMonitoringHistory } from "@/components/hydrology/LaranjalMonitoringHistory";
import { useLaranjalLevelRefresh } from "@/components/hydrology/useLaranjalLevelRefresh";
import { loadLaranjalHydrologyPageData } from "@/lib/hydrology/public-hydrology-page-loader";
import { createPageHead } from "@/lib/page-meta";
import { createEditorialPageJsonLd } from "@/lib/structured-data";

const PAGE_TITLE = "Nível da Lagoa dos Patos hoje no Laranjal, Pelotas";
const PAGE_DESCRIPTION =
  "Veja o nível da Lagoa dos Patos hoje em Pelotas com fonte identificada, horário da última leitura, movimento recente e variação nas últimas 24 horas.";
const PAGE_PATH = "/nivel-da-lagoa-dos-patos-laranjal";

export const Route = createFileRoute("/nivel-da-lagoa-dos-patos-laranjal")({
  head: () =>
    createPageHead(PAGE_TITLE, PAGE_DESCRIPTION, PAGE_PATH, [
      createEditorialPageJsonLd({
        name: PAGE_TITLE,
        description: PAGE_DESCRIPTION,
        path: PAGE_PATH,
        breadcrumbs: [
          { name: "Início", path: "/" },
          { name: "Situação das águas", path: "/situacao-hidrologica-pelotas" },
          { name: "Nível da Lagoa no Laranjal", path: PAGE_PATH },
        ],
        about: [
          "Nível da Lagoa dos Patos hoje",
          "Nível da Lagoa dos Patos em Pelotas",
          "Estação Laranjal",
          "Estação ANA 87955001",
          "Praia do Laranjal",
          "LabHidroSens / UFPel",
          "CIEX/FURG",
          "Rede de Monitoramento do Nível da Lagoa dos Patos",
          "Marégrafo de Imbituba",
          "Rede Hidrometeorológica Nacional",
          "Agência Nacional de Águas e Saneamento Básico",
          "Medição automática do nível em Pelotas",
          "Movimento recente do nível da água no Laranjal",
          "Contexto regional do Guaíba e Lagoa dos Patos",
          "Histórico das cheias de 1941 e 2024 em Pelotas",
        ],
      }),
    ]),
  loader: () => loadLaranjalHydrologyPageData(),
  staleTime: 60 * 1_000,
  component: NivelLagoaPage,
});

function NivelLagoaPage() {
  const data = Route.useLoaderData();
  const level = useLaranjalLevelRefresh(data.level);

  return (
    <div className="hydrology-editorial-route hydrology-editorial-route--laranjal">
      <HydrologyEditorialHero level={level} variant="detail" />
      <LaranjalLevelPage weather={data.weather} level={level} />
      <AnaRhnLaranjalStationProfile data={data.anaRhnProfile} />
      <LaranjalMonitoringHistory anaRhnProfile={data.anaRhnProfile} />
      <LaranjalEmbedGuide />
    </div>
  );
}
