import { createFileRoute } from "@tanstack/react-router";

import { RegisteredWeatherEnrichment } from "@/components/auth/RegisteredWeatherEnrichment";
import { InternalWeatherPageShell } from "@/components/layout/InternalWeatherPageShell";
import { WindDirectionContext } from "@/components/weather/WindDirectionContext";
import { WindForecastPageV3 } from "@/components/weather/WindForecastPageV3";
import "@/components/weather/WindForecastHomeContract.css";
import "@/components/weather/WindPageRefinement.css";
import { WindRetailHero } from "@/components/weather/WindRetailHero";
import { createPageHead } from "@/lib/page-meta";
import { WIND_CITATIONS } from "@/lib/seo-source-citations";
import { createEditorialPageJsonLd } from "@/lib/structured-data";
import { loadPublicWeatherPage } from "@/lib/weather/public-weather-page-loader";

const PAGE_TITLE = "Vento em Pelotas hoje: direção e rajadas por hora";
const PAGE_DESCRIPTION =
  "Vento em Pelotas hoje com direção atual, velocidade, rajadas nas próximas 24 horas, direção por horário e previsão para 7 dias.";
const PAGE_PATH = "/vento-em-pelotas";

export const Route = createFileRoute("/vento-em-pelotas")({
  head: () =>
    createPageHead(PAGE_TITLE, PAGE_DESCRIPTION, PAGE_PATH, [
      createEditorialPageJsonLd({
        name: PAGE_TITLE,
        description: PAGE_DESCRIPTION,
        path: PAGE_PATH,
        citations: WIND_CITATIONS,
        breadcrumbs: [
          { name: "Início", path: "/" },
          { name: "Vento em Pelotas hoje", path: PAGE_PATH },
        ],
        about: [
          "Vento em Pelotas hoje",
          "Vento atual em Pelotas",
          "Origem da velocidade e direção do vento",
          "Rajadas de vento em Pelotas",
          "Direção do vento em Pelotas",
          "Direção do vento por hora em Pelotas",
          "Previsão de vento por hora em Pelotas",
          "Maiores rajadas nas próximas 24 horas",
          "Previsão de rajadas para 7 dias",
          "Vento observado pela Rede de Monitoramento Hidrometeorológico da Defesa Civil RS",
          "Avisos oficiais de vento em Pelotas",
        ],
      }),
    ]),
  loader: () => loadPublicWeatherPage(),
  staleTime: 5 * 60 * 1_000,
  component: VentoPage,
});

function VentoPage() {
  const weather = Route.useLoaderData();

  return (
    <InternalWeatherPageShell
      data={weather}
      pageClassName="internal-weather-shell--wind"
      showOfficialAlerts={false}
      hero={({ weather: productionWeather, advisoryLevel, officialAlertCount }) => (
        <WindRetailHero
          weather={productionWeather}
          advisoryLevel={advisoryLevel}
          officialAlertCount={officialAlertCount}
        />
      )}
    >
      {(recoveredWeather) => (
        <>
          <WindForecastPageV3 data={recoveredWeather} />
          <RegisteredWeatherEnrichment data={recoveredWeather} variant="wind" pagePath={PAGE_PATH} />
          <WindDirectionContext
            hourly={recoveredWeather.weather.hourly}
            forecastProvider={recoveredWeather.weather.quality.forecastProvider}
            forecastFetchedAt={recoveredWeather.weather.source.fetchedAt}
          />
        </>
      )}
    </InternalWeatherPageShell>
  );
}
