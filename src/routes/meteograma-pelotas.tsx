import { createFileRoute } from "@tanstack/react-router";

import { InternalWeatherPageShell } from "@/components/layout/InternalWeatherPageShell";
import { MeteogramHero, MeteogramPage } from "@/components/weather/MeteogramPage";
import "@/components/weather/MeteogramHomeContract.css";
import "@/components/weather/MeteogramStateContract.css";
import "@/components/weather/MeteogramRefinement.css";
import { SimagroModelProducts } from "@/components/weather/SimagroModelProducts";
import type { MeteogramData } from "@/lib/weather/meteogram.server";
import { getPelotasMeteogram } from "@/lib/weather/meteogram.functions";
import { createPageHead } from "@/lib/page-meta";
import { createEditorialPageJsonLd } from "@/lib/structured-data";
import { getWeatherIntelligence } from "@/lib/weather/weather-intelligence.functions";
import type { WeatherIntelligenceData } from "@/lib/weather/weather-intelligence.types";

const PAGE_TITLE = "Meteograma de Pelotas: previsão hora a hora por 48h";
const PAGE_DESCRIPTION =
  "Meteograma de Pelotas com temperatura, chuva, nuvens, visibilidade, pressão, vento e rajadas hora a hora por até 48 horas.";
const PAGE_PATH = "/meteograma-pelotas";

function unavailableMeteogram(message: string): MeteogramData {
  return {
    status: "unavailable",
    hours: [],
    source: {
      name: "Open-Meteo",
      model: "Best Match",
      url: "https://open-meteo.com/",
      fetchedAt: new Date().toISOString(),
      timezone: "America/Sao_Paulo",
      temporalResolutionMinutes: 60,
      forecastHours: 48,
      generationTimeMs: null,
    },
    message,
  };
}

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
  const [weatherResult, meteogramResult] = await Promise.allSettled([
    getWeatherIntelligence(),
    getPelotasMeteogram(),
  ]);

  let weather: WeatherIntelligenceData;
  if (weatherResult.status === "fulfilled") {
    weather = weatherResult.value;
  } else {
    weather = await getWeatherIntelligence();
  }

  let meteogram: MeteogramData;
  if (meteogramResult.status === "fulfilled") {
    meteogram = meteogramResult.value;
  } else {
    try {
      meteogram = await getPelotasMeteogram();
    } catch {
      meteogram = unavailableMeteogram(
        "A série dedicada do meteograma não respondeu. A página está usando a previsão horária disponível como contingência.",
      );
    }
  }

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
          <MeteogramPage weather={recoveredWeather} meteogram={meteogram} />
          <SimagroModelProducts />
        </>
      )}
    </InternalWeatherPageShell>
  );
}
