import { createFileRoute } from "@tanstack/react-router";

import { RegisteredWeatherEnrichment } from "@/components/auth/RegisteredWeatherEnrichment";
import { InternalWeatherPageShell } from "@/components/layout/InternalWeatherPageShell";
import { RainForecastPageV2 } from "@/components/weather/RainForecastPageV2";
import { RainRetailHero } from "@/components/weather/RainRetailHero";
import "@/components/weather/RainPageRefinement.css";
import { createPageHead } from "@/lib/page-meta";
import { RAIN_CITATIONS } from "@/lib/seo-source-citations";
import { createEditorialPageJsonLd } from "@/lib/structured-data";
import type { WeatherIntelligenceData } from "@/lib/weather/weather-intelligence.types";
import { loadPublicWeatherPage } from "@/lib/weather/public-weather-page-loader";

const PAGE_TITLE = "Chuva em Pelotas hoje: medição, chance e previsão";
const PAGE_DESCRIPTION =
  "Chuva em Pelotas: acumulado medido nas últimas 24 horas pela rede da Defesa Civil RS, chance e volume previsto por horário, próximos dias e avisos do INMET.";
const PAGE_PATH = "/chuva-em-pelotas";

function getObservedRain24h(data: WeatherIntelligenceData) {
  const source = data.weather.sources["defesa-civil-rs"];
  return data.weather.observation.status === "live" && source.usable
    ? data.weather.observation.rain.h24Mm
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
          "Chuva medida em 24 horas em Pelotas",
          "Rede de Monitoramento Hidrometeorológico da Defesa Civil RS",
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
  loader: () => loadPublicWeatherPage(),
  staleTime: 5 * 60 * 1_000,
  component: ChuvaPage,
});

function ChuvaPage() {
  const weather = Route.useLoaderData();

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
          observedRain24h={getObservedRain24h(recoveredWeather)}
        />
      )}
    >
      {(recoveredWeather) => (
        <>
          <RainForecastPageV2 data={recoveredWeather} />
          <RegisteredWeatherEnrichment data={recoveredWeather} variant="rain" pagePath={PAGE_PATH} />
        </>
      )}
    </InternalWeatherPageShell>
  );
}
