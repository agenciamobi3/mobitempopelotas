import { createFileRoute } from "@tanstack/react-router";

import { RegisteredWeatherEnrichment } from "@/components/auth/RegisteredWeatherEnrichment";
import { InternalWeatherPageShell } from "@/components/layout/InternalWeatherPageShell";
import { ForecastHorizonBridge } from "@/components/weather/ForecastHorizonBridge";
import { SevenDayForecastPageV2 } from "@/components/weather/SevenDayForecastPageV2";
import "@/components/weather/SevenDayForecastEditorialRefinement.css";
import { SevenDayRetailHero } from "@/components/weather/SevenDayRetailHero";
import { createPageHead } from "@/lib/page-meta";
import { CORE_WEATHER_CITATIONS } from "@/lib/seo-source-citations";
import { createEditorialPageJsonLd } from "@/lib/structured-data";
import { createUnavailableWeatherIntelligence } from "@/lib/weather/weather-intelligence-fallback";

const PAGE_TITLE = "Previsão do tempo em Pelotas: 7 dias e semana";
const PAGE_DESCRIPTION =
  "Veja a previsão de 7 dias em Pelotas com mínimas, máximas, chance e volume de chuva, rajadas e comparação entre os dias.";
const PAGE_PATH = "/previsao-7-dias-pelotas";

export const Route = createFileRoute("/previsao-7-dias-pelotas")({
  head: () =>
    createPageHead(PAGE_TITLE, PAGE_DESCRIPTION, PAGE_PATH, [
      createEditorialPageJsonLd({
        name: PAGE_TITLE,
        description: PAGE_DESCRIPTION,
        path: PAGE_PATH,
        citations: CORE_WEATHER_CITATIONS,
        breadcrumbs: [
          { name: "Início", path: "/" },
          { name: "Previsão de 7 dias para Pelotas", path: PAGE_PATH },
        ],
        about: [
          "Previsão do tempo em Pelotas para 7 dias",
          "Previsão do tempo para a semana em Pelotas",
          "Tendência meteorológica semanal em Pelotas",
          "Previsão de chuva para 7 dias",
          "Temperaturas para os próximos 7 dias",
          "Rajadas de vento para os próximos dias",
        ],
      }),
    ]),
  // A rota entrega HTML imediatamente. A consolidação semanal real entra depois
  // pela recuperação client-side, sem manter o visitante esperando server function.
  loader: () => createUnavailableWeatherIntelligence(),
  staleTime: 5 * 60 * 1_000,
  component: PrevisaoSeteDiasPage,
});

function PrevisaoSeteDiasPage() {
  const weather = Route.useLoaderData();

  return (
    <InternalWeatherPageShell
      data={weather}
      pageClassName="internal-weather-shell--seven-day"
      hero={({ weather: productionWeather, advisoryLevel, officialAlertCount }) => (
        <SevenDayRetailHero
          weather={productionWeather}
          advisoryLevel={advisoryLevel}
          officialAlertCount={officialAlertCount}
        />
      )}
    >
      {(recoveredWeather) => (
        <>
          <SevenDayForecastPageV2 data={recoveredWeather} />
          <RegisteredWeatherEnrichment data={recoveredWeather} variant="week" pagePath={PAGE_PATH} />
          <ForecastHorizonBridge />
        </>
      )}
    </InternalWeatherPageShell>
  );
}
