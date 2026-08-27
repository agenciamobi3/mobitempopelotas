import { createFileRoute, notFound, redirect } from "@tanstack/react-router";

import { RegionalCityWeatherPageClient } from "@/components/regional/RegionalCityWeatherPageClient";
import { createPageHead } from "@/lib/page-meta";
import {
  regionalCityFaqs,
  regionalCityMetaDescription,
  regionalCityPageTitle,
} from "@/lib/regional-city-editorial";
import {
  REGIONAL_HOME_CITY_SLUG,
  findPublicRegionalCity,
  isRegionalCityIndexable,
  regionalCityPath,
} from "@/lib/regional-cities";
import { createEditorialPageJsonLd, createFaqPageJsonLd } from "@/lib/structured-data";
import { getRegionalCityWeather } from "@/lib/weather/regional-city-weather.functions";

export const Route = createFileRoute("/tempo-em/$citySlug")({
  beforeLoad: ({ params }) => {
    if (params.citySlug === REGIONAL_HOME_CITY_SLUG) {
      throw redirect({
        to: "/",
        statusCode: 301,
        replace: true,
      });
    }

    if (!findPublicRegionalCity(params.citySlug)) throw notFound();
  },
  loader: async ({ params }) => {
    const data = await getRegionalCityWeather({ data: { slug: params.citySlug } });
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => {
    const city = loaderData?.city;
    if (!city) return {};

    const path = regionalCityPath(city);
    const title = regionalCityPageTitle(city);
    const description = regionalCityMetaDescription(city);
    const faqs = regionalCityFaqs(city);
    const location = {
      "@type": "Place",
      name: `${city.name}, Rio Grande do Sul`,
      geo: {
        "@type": "GeoCoordinates",
        latitude: city.latitude,
        longitude: city.longitude,
      },
    };

    return createPageHead(
      title,
      description,
      path,
      [
        createEditorialPageJsonLd({
          name: title,
          description,
          path,
          breadcrumbs: [
            { name: "Início", path: "/" },
            { name: "Tempo na Zona Sul do RS", path: "/tempo-na-regiao-sul-rs" },
            { name: `Tempo em ${city.name}`, path },
          ],
          about: [
            `Tempo em ${city.name}`,
            `Previsão do tempo em ${city.name}`,
            `Chuva em ${city.name}`,
            `Vento em ${city.name}`,
            `Avisos do INMET em ${city.name}`,
            city.descriptor,
          ],
          location,
        }),
        createFaqPageJsonLd(path, faqs),
      ],
      {
        indexable: isRegionalCityIndexable(city),
        geo: {
          region: "BR-RS",
          placename: city.name,
          latitude: city.latitude,
          longitude: city.longitude,
        },
      },
    );
  },
  staleTime: 5 * 60 * 1_000,
  component: RegionalCityRoute,
});

function RegionalCityRoute() {
  return <RegionalCityWeatherPageClient data={Route.useLoaderData()} />;
}
