import { createFileRoute } from "@tanstack/react-router";

import { RegisteredMeteogramEnrichment } from "@/components/auth/RegisteredMeteogramEnrichment";
import { InternalWeatherPageShell } from "@/components/layout/InternalWeatherPageShell";
import { MeteogramForecastHighlights } from "@/components/weather/MeteogramForecastHighlights";
import { MeteogramHero, MeteogramPage } from "@/components/weather/MeteogramPage";
import "@/components/weather/MeteogramHomeContract.css";
import "@/components/weather/MeteogramStateContract.css";
import "@/components/weather/MeteogramRefinement.css";
import { SimagroModelProducts } from "@/components/weather/SimagroModelProducts";
import { createPageHead } from "@/lib/page-meta";
import { createEditorialPageJsonLd } from "@/lib/structured-data";
import { loadPublicWeatherWithMeteogram } from "@/lib/weather/public-weather-page-loader";
import type { WeatherIntelligenceData } from "@/lib/weather/weather-intelligence.types";

const PAGE_TITLE = "Meteograma de Pelotas: previsão hora a hora por 48h";
const PAGE_DESCRIPTION =
  "Meteograma de Pelotas com temperatura, chuva, nuvens, visibilidade, pressão, vento e rajadas hora a hora por até 48 horas.";
const PAGE_PATH = "/meteograma-pelotas";

function normalizeWeatherTraceability(data: WeatherIntelligenceData): WeatherIntelligenceData {
  const key = data.weather.quality.forecastSource;
  if (!key || data.weather.sources[key]) return data;

  return {
    ...data,
    weather: {
      ...data.weather,
      quality: {
        ...data.weather.quality,
        forecastSource: null,
        forecastProvider: null,
      },
    },
  };
}

async function loadMeteogramPageData() {
  const { weather, meteogram } = await loadPublicWeatherWithMeteogram({
    meteogramUnavailableMessage:
      "A previsão detalhada não respondeu. Mostrando os dados horários disponíveis.",
  });

  return {
    weather: normalizeWeatherTraceability(weather),
    meteogram,
  };
}

export const Route = createFileRoute("/meteograma-pelotas")({
  head: () =>
    createPageHead(PAGE_TITLE, PAGE_DESCRIPTION, PAGE_PATH, [
      createEditorialPageJsonLd({
        name: PAGE_TITLE,
        description: PAGE_DESCRIPTION,
        path: PAGE_PATH,
        breadcrumbs: [
          { name: "Início", path: "/" },
          { name: "Meteograma e previsão hora a hora em Pelotas", path: PAGE_PATH },
        ],
        about: [
          "Meteograma de Pelotas",
          "Previsão hora a hora por 48 horas em Pelotas",
          "Previsão horária de temperatura e ponto de orvalho",
          "Chance e volume de chuva por hora",
          "Nuvens baixas, médias e altas",
          "Visibilidade prevista em Pelotas",
          "Pressão atmosférica",
          "Vento e rajadas por hora",
          "CAPE e possibilidade de tempestade",
          "Open-Meteo Best Match",
          "NOAA GFS",
          "SIMAGRO RS",
          "Meteograma WRF para Pelotas",
          "Meteograma GFS para Pelotas",
          "Agrometeograma GFS para Pelotas",
        ],
      }),
    ]),
  loader: loadMeteogramPageData,
  staleTime: 5 * 60 * 1_000,
  component: MeteogramaPelotasPage,
});

function MeteogramaPelotasPage() {
  const { weather, meteogram } = Route.useLoaderData();

  return (
    <InternalWeatherPageShell
      data={weather}
      pageClassName="internal-weather-shell--meteogram"
      showOfficialAlerts={false}
      hero={({ data: recoveredWeather }) => (
        <MeteogramHero weather={recoveredWeather} meteogram={meteogram} />
      )}
    >
      {(recoveredWeather) => (
        <>
          <MeteogramForecastHighlights meteogram={meteogram} />
          <MeteogramPage weather={recoveredWeather} meteogram={meteogram} />
          <RegisteredMeteogramEnrichment meteogram={meteogram} />
          <SimagroModelProducts />
        </>
      )}
    </InternalWeatherPageShell>
  );
}
