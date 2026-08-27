import { createFileRoute, notFound, redirect } from "@tanstack/react-router";

import { RegionalCityWeatherPageClient } from "@/components/regional/RegionalCityWeatherPageClient";
import { createPageHead } from "@/lib/page-meta";
import {
  regionalCityMetaDescription,
  regionalCityPageTitle,
} from "@/lib/regional-city-editorial";
import {
  REGIONAL_HOME_CITY_SLUG,
  findPublicRegionalCity,
  isRegionalCityIndexable,
  regionalCityPath,
} from "@/lib/regional-cities";
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
    return createPageHead(
      regionalCityPageTitle(city),
      regionalCityMetaDescription(city),
      regionalCityPath(city),
      [],
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
