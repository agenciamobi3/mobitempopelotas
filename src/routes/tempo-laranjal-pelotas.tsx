import { createFileRoute } from "@tanstack/react-router";

import { LaranjalWeatherPageClient } from "@/components/weather/LaranjalWeatherPageClient";
import {
  LARANJAL_LATITUDE,
  LARANJAL_LONGITUDE,
  LARANJAL_WEATHER_DESCRIPTION,
  LARANJAL_WEATHER_PATH,
  LARANJAL_WEATHER_TITLE,
} from "@/lib/laranjal-weather";
import { createPageHead } from "@/lib/page-meta";
import { SEO_SOURCE_URLS } from "@/lib/seo-source-citations";
import { createEditorialPageJsonLd } from "@/lib/structured-data";

const LARANJAL_PLACE = {
  "@type": "Place",
  name: "Laranjal, Pelotas, Rio Grande do Sul, Brasil",
  containedInPlace: {
    "@type": "City",
    name: "Pelotas",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Pelotas",
      addressRegion: "RS",
      addressCountry: "BR",
    },
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: LARANJAL_LATITUDE,
    longitude: LARANJAL_LONGITUDE,
  },
};

export const Route = createFileRoute("/tempo-laranjal-pelotas")({
  head: () =>
    createPageHead(
      LARANJAL_WEATHER_TITLE,
      LARANJAL_WEATHER_DESCRIPTION,
      LARANJAL_WEATHER_PATH,
      [
        createEditorialPageJsonLd({
          name: LARANJAL_WEATHER_TITLE,
          description: LARANJAL_WEATHER_DESCRIPTION,
          path: LARANJAL_WEATHER_PATH,
          breadcrumbs: [
            { name: "Início", path: "/" },
            { name: "Previsão do tempo no Laranjal", path: LARANJAL_WEATHER_PATH },
          ],
          about: [
            "Previsão do tempo no Laranjal em Pelotas",
            "Tempo na Praia do Laranjal",
            "Temperatura no Laranjal",
            "Chuva no Laranjal",
            "Vento e rajadas no Laranjal",
            "Lagoa dos Patos",
          ],
          citations: [SEO_SOURCE_URLS.methodology, SEO_SOURCE_URLS.openMeteo],
          location: LARANJAL_PLACE,
        }),
      ],
      {
        geo: {
          region: "BR-RS",
          placename: "Laranjal, Pelotas",
          latitude: LARANJAL_LATITUDE,
          longitude: LARANJAL_LONGITUDE,
        },
      },
    ),
  component: TempoLaranjalPage,
});

function TempoLaranjalPage() {
  return <LaranjalWeatherPageClient />;
}
