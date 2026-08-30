import { createFileRoute } from "@tanstack/react-router";

import { HOME_EDITORIAL_CONTENT } from "@/lib/editorial-content";
import { createPageHead } from "@/lib/page-meta";
import { CORE_WEATHER_CITATIONS } from "@/lib/seo-source-citations";
import { createEditorialPageJsonLd, createFaqPageJsonLd } from "@/lib/structured-data";
import { createUnavailableWeatherIntelligence } from "@/lib/weather/weather-intelligence-fallback";
import { ProductionHome, type HomeHydrologyResult } from "@/production/ProductionHome";

const PAGE_TITLE = "Tempo agora em Pelotas: temperatura, chuva e previsão";
const PAGE_DESCRIPTION =
  "Veja o tempo agora em Pelotas com temperatura atual, sensação térmica, próximas horas, chuva, vento, previsão para 7 e 15 dias, radar, alertas do INMET e situação das águas.";
const PAGE_PATH = "/";

function createInitialHomeData() {
  const hydrology: Promise<HomeHydrologyResult> = Promise.resolve({
    status: "unavailable" as const,
  });

  return {
    weather: createUnavailableWeatherIntelligence(),
    hydrology,
  };
}

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
        citations: CORE_WEATHER_CITATIONS,
      }),
      createFaqPageJsonLd(PAGE_PATH, HOME_EDITORIAL_CONTENT.faqs),
    ]),
  // P0 de estabilidade: o primeiro documento nunca consulta fonte externa.
  // A Home hidrata com contrato auditável e a recuperação meteorológica do
  // navegador preenche a previsão depois que o HTML já existe.
  loader: () => createInitialHomeData(),
  staleTime: 60 * 1_000,
  component: HomePage,
});

function HomePage() {
  const { weather, hydrology } = Route.useLoaderData();
  return <ProductionHome data={weather} hydrology={hydrology} />;
}
