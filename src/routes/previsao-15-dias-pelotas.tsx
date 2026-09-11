import { createFileRoute } from "@tanstack/react-router";

import { RegisteredExtendedForecastEnrichment } from "@/components/auth/RegisteredExtendedForecastEnrichment";
import { InternalWeatherPageShell } from "@/components/layout/InternalWeatherPageShell";
import { FifteenDayForecastHero } from "@/components/weather/FifteenDayForecastHero";
import { FifteenDayForecastPage } from "@/components/weather/FifteenDayForecastPage";
import "@/components/weather/FifteenDayForecastEditorialRefinement.css";
import { createPageHead } from "@/lib/page-meta";
import { createEditorialPageJsonLd } from "@/lib/structured-data";
import { loadPublicExtendedForecastPage } from "@/lib/weather/extended-forecast-page-loader";

const PAGE_TITLE = "Previsão do tempo em Pelotas: 10 e 15 dias";
const PAGE_DESCRIPTION =
  "Veja a previsão de 10 e 15 dias em Pelotas com mínimas, máximas, chance e volume de chuva e rajadas dia a dia.";
const PAGE_PATH = "/previsao-15-dias-pelotas";

export const Route = createFileRoute("/previsao-15-dias-pelotas")({
  head: () =>
    createPageHead(PAGE_TITLE, PAGE_DESCRIPTION, PAGE_PATH, [
      createEditorialPageJsonLd({
        name: PAGE_TITLE,
        description: PAGE_DESCRIPTION,
        path: PAGE_PATH,
        breadcrumbs: [
          { name: "Início", path: "/" },
          { name: "Previsão de 10 e 15 dias para Pelotas", path: PAGE_PATH },
        ],
        about: [
          "Previsão do tempo em Pelotas para 15 dias",
          "Previsão do tempo em Pelotas para 10 dias",
          "Previsão estendida em Pelotas",
          "Temperaturas para os próximos 15 dias",
          "Chance de chuva nos próximos 15 dias",
          "Volume previsto de chuva em Pelotas",
          "Rajadas de vento para os próximos 15 dias",
        ],
      }),
    ]),
  loader: () => loadPublicExtendedForecastPage(),
  staleTime: 5 * 60 * 1_000,
  component: PrevisaoQuinzeDiasPage,
});

function PrevisaoQuinzeDiasPage() {
  const { weather, extendedForecast } = Route.useLoaderData();

  return (
    <InternalWeatherPageShell
      data={weather}
      pageClassName="internal-weather-shell--fifteen-day"
      hero={({ advisoryLevel }) => (
        <FifteenDayForecastHero
          forecast={extendedForecast}
          advisoryLevel={advisoryLevel}
        />
      )}
    >
      <>
        <FifteenDayForecastPage forecast={extendedForecast} />
        <RegisteredExtendedForecastEnrichment forecast={extendedForecast} />
      </>
    </InternalWeatherPageShell>
  );
}
