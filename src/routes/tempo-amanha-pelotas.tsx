import { createFileRoute } from "@tanstack/react-router";

import { InternalWeatherPageShell } from "@/components/layout/InternalWeatherPageShell";
import { TomorrowForecastPageV3 } from "@/components/weather/TomorrowForecastPageV3";
import "@/components/weather/TomorrowForecastEditorialRefinement.css";
import { TomorrowRetailHero } from "@/components/weather/TomorrowRetailHero";
import { createPageHead } from "@/lib/page-meta";
import { CORE_WEATHER_CITATIONS } from "@/lib/seo-source-citations";
import { createEditorialPageJsonLd, createFaqPageJsonLd } from "@/lib/structured-data";
import { createUnavailableWeatherIntelligence } from "@/lib/weather/weather-intelligence-fallback";

const PAGE_TITLE = "Tempo amanhã em Pelotas: temperatura, chuva e vento";
const PAGE_DESCRIPTION =
  "Veja a previsão do tempo para amanhã em Pelotas: mínima, máxima, chance e volume de chuva, vento, rajadas, INMET e CPPMet/UFPel.";
const PAGE_PATH = "/tempo-amanha-pelotas";

const TOMORROW_FAQS = [
  {
    question: "Vai chover amanhã em Pelotas?",
    answer:
      "Veja a chance e o volume de chuva previstos para amanhã. Se o tempo estiver instável, confira também o radar e os avisos oficiais.",
  },
  {
    question: "Qual será a temperatura amanhã em Pelotas?",
    answer: "A previsão mostra a mínima e a máxima esperadas para o dia.",
  },
  {
    question: "A previsão de amanhã pode mudar ainda hoje?",
    answer:
      "Sim. Temperatura, chuva e vento podem mudar conforme entram novas observações e previsões atualizadas.",
  },
  {
    question: "Onde vejo os próximos dias?",
    answer: "Use a previsão de 7 dias ou a previsão de 15 dias.",
  },
] as const;

export const Route = createFileRoute("/tempo-amanha-pelotas")({
  head: () =>
    createPageHead(PAGE_TITLE, PAGE_DESCRIPTION, PAGE_PATH, [
      createEditorialPageJsonLd({
        name: PAGE_TITLE,
        description: PAGE_DESCRIPTION,
        path: PAGE_PATH,
        citations: CORE_WEATHER_CITATIONS,
        breadcrumbs: [
          { name: "Início", path: "/" },
          { name: "Tempo amanhã em Pelotas", path: PAGE_PATH },
        ],
        about: [
          "Tempo amanhã em Pelotas",
          "Previsão do tempo para amanhã em Pelotas",
          "Chuva amanhã em Pelotas",
          "Temperatura amanhã em Pelotas",
          "Vento amanhã em Pelotas",
          "Rajadas amanhã em Pelotas",
        ],
      }),
      createFaqPageJsonLd(PAGE_PATH, TOMORROW_FAQS),
    ]),
  // O primeiro HTML é independente das integrações; a consolidação real entra no
  // navegador depois que a rota já está disponível para o visitante.
  loader: () => createUnavailableWeatherIntelligence(),
  staleTime: 5 * 60 * 1_000,
  component: TempoAmanhaPage,
});

function TempoAmanhaPage() {
  const weather = Route.useLoaderData();

  return (
    <InternalWeatherPageShell
      data={weather}
      pageClassName="internal-weather-shell--tomorrow"
      hero={({ weather: productionWeather, advisoryLevel, officialAlertCount }) => (
        <TomorrowRetailHero
          weather={productionWeather}
          advisoryLevel={advisoryLevel}
          officialAlertCount={officialAlertCount}
        />
      )}
    >
      {(recoveredWeather) => <TomorrowForecastPageV3 data={recoveredWeather} />}
    </InternalWeatherPageShell>
  );
}
