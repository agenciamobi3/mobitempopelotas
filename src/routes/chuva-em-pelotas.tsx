import { createFileRoute } from "@tanstack/react-router";

import { InternalWeatherPageShell } from "@/components/layout/InternalWeatherPageShell";
import { RainForecastPageV2 } from "@/components/weather/RainForecastPageV2";
import { RainRetailHero } from "@/components/weather/RainRetailHero";
import "@/components/weather/RainPageRefinement.css";
import { createPageHead } from "@/lib/page-meta";
import { RAIN_CITATIONS } from "@/lib/seo-source-citations";
import { createEditorialPageJsonLd } from "@/lib/structured-data";
import type { WeatherIntelligenceData } from "@/lib/weather/weather-intelligence.types";
import { loadPublicWeatherWithMeteogram } from "@/lib/weather/public-weather-page-loader";

const PAGE_TITLE = "Chuva em Pelotas hoje: acumulado, chance e previsão";
const PAGE_DESCRIPTION =
  "Chuva em Pelotas hoje: acumulado observado, chance e volume previsto por horário, próximos dias e avisos do INMET.";
const PAGE_PATH = "/chuva-em-pelotas";

function getObservedRainDaily(data: WeatherIntelligenceData) {
  const embrapaStatus = data.weather.sources.embrapa.status;
  return data.weather.observation.status !== "unavailable" &&
    (embrapaStatus === "live" || embrapaStatus === "partial")
    ? data.weather.observation.accumulated.rainDaily
    : null;
}

export const Route = createFileRoute("/chuva-em-pelotas")({
  head: () =>
    createPageHead(PAGE_TITLE, PAGE_DESCRIPTION, PAGE_PATH, [
      createEditorialPageJsonLd({
        name: PAGE_TITLE,
        description: PAGE_DESCRIPTION,
        path: PAGE_PATH,
        citations: RAIN_CITATIONS,
        breadcrumbs: [
          { name: "Início", path: "/" },
          { name: "Chuva em Pelotas", path: PAGE_PATH },
        ],
        about: [
          "Chuva acumulada em Pelotas",
          "Quanto choveu hoje em Pelotas",
          "Chuva observada pela Embrapa em Pelotas",
          "Acumulado de chuva em 24 horas",
          "Previsão de chuva em Pelotas",
          "Probabilidade de chuva em Pelotas",
          "Volume de precipitação por hora em Pelotas",
          "Chuva por hora em Pelotas",
          "Acumulado previsto de chuva em Pelotas",
          "Relação entre chuva e situação hidrológica em Pelotas",
          "Alertas oficiais de chuva em Pelotas",
        ],
      }),
    ]),
  loader: () =>
    loadPublicWeatherWithMeteogram({
      meteogramUnavailableMessage:
        "O volume de chuva por hora está temporariamente indisponível. As demais informações de chuva permanecem acessíveis quando houver dados.",
    }),
  staleTime: 5 * 60 * 1_000,
  component: ChuvaPage,
});

function ChuvaPage() {
  const { weather, meteogram } = Route.useLoaderData();

  return (
    <InternalWeatherPageShell
      data={weather}
      pageClassName="internal-weather-shell--rain"
      hero={({
        data: recoveredWeather,
        weather: productionWeather,
        advisoryLevel,
        officialAlertCount,
      }) => (
        <RainRetailHero
          weather={productionWeather}
          advisoryLevel={advisoryLevel}
          officialAlertCount={officialAlertCount}
          observedRainDaily={getObservedRainDaily(recoveredWeather)}
        />
      )}
    >
      {(recoveredWeather) => (
        <RainForecastPageV2 data={recoveredWeather} meteogram={meteogram} />
      )}
    </InternalWeatherPageShell>
  );
}
