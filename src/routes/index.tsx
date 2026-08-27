import { createFileRoute } from "@tanstack/react-router";

import { HOME_EDITORIAL_CONTENT } from "@/lib/editorial-content";
import { getGuaibaObservation } from "@/lib/hydrology/guaiba.functions";
import { getLagoonMonitoringNetwork } from "@/lib/hydrology/lagoon-network.functions";
import { getLaranjalLevelData } from "@/lib/hydrology/laranjal-level.functions";
import { createPageHead } from "@/lib/page-meta";
import { createEditorialPageJsonLd, createFaqPageJsonLd } from "@/lib/structured-data";
import { getWeatherIntelligence } from "@/lib/weather/weather-intelligence.functions";
import { ProductionHome, type HomeHydrologyResult } from "@/production/ProductionHome";

const PAGE_TITLE = "Tempo agora em Pelotas: temperatura, chuva e previsão";
const PAGE_DESCRIPTION =
  "Veja o tempo agora em Pelotas com temperatura atual, sensação térmica, próximas horas, chuva, vento, previsão para 7 e 15 dias, radar, alertas do INMET e situação das águas.";
const PAGE_PATH = "/";

export const Route = createFileRoute("/")({
  head: () =>
    createPageHead(PAGE_TITLE, PAGE_DESCRIPTION, PAGE_PATH, [
      createEditorialPageJsonLd({
        name: PAGE_TITLE,
        description: PAGE_DESCRIPTION,
        path: PAGE_PATH,
        breadcrumbs: [{ name: "Tempo Pelotas", path: PAGE_PATH }],
        about: [
          "Tempo agora em Pelotas",
          "Temperatura atual em Pelotas",
          "Sensação térmica em Pelotas",
          "Previsão do tempo em Pelotas",
          "Previsão do tempo por hora em Pelotas",
          "Previsão de 7 dias em Pelotas",
          "Previsão de 15 dias em Pelotas",
          "Chuva em Pelotas",
          "Vento em Pelotas",
          "Alertas do INMET em Pelotas",
          "Meteorologia na Zona Sul do Rio Grande do Sul",
          "Lagoa dos Patos",
          "Nível da Lagoa no Laranjal",
          "Nível do Guaíba",
          "Câmera ao vivo da Praia do Laranjal",
        ],
      }),
      createFaqPageJsonLd(PAGE_PATH, HOME_EDITORIAL_CONTENT.faqs),
    ]),
  loader: async () => {
    const hydrology: Promise<HomeHydrologyResult> = Promise.all([
      getLaranjalLevelData(),
      getGuaibaObservation(),
      getLagoonMonitoringNetwork(),
    ])
      .then(([laranjal, guaiba, lagoon]) => ({
        status: "ready" as const,
        laranjal,
        guaiba,
        lagoon,
      }))
      .catch(() => ({ status: "unavailable" as const }));

    const weather = await getWeatherIntelligence();
    return { weather, hydrology };
  },
  staleTime: 60 * 1_000,
  component: HomePage,
});

function HomePage() {
  const { weather, hydrology } = Route.useLoaderData();
  return <ProductionHome data={weather} hydrology={hydrology} />;
}
