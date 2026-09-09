import { findPublicRegionalCity, regionalCityPath } from "../regional-cities";

export type CostaDoceCity = {
  slug: string;
  name: string;
  lagoonLevelPath: string | null;
};

export const COSTA_DOCE_CITIES: readonly CostaDoceCity[] = [
  { slug: "arambare-rs", name: "Arambaré", lagoonLevelPath: "/nivel-da-lagoa-dos-patos/arambare" },
  { slug: "arroio-do-padre-rs", name: "Arroio do Padre", lagoonLevelPath: null },
  { slug: "arroio-grande-rs", name: "Arroio Grande", lagoonLevelPath: null },
  { slug: "barra-do-ribeiro-rs", name: "Barra do Ribeiro", lagoonLevelPath: null },
  { slug: "camaqua-rs", name: "Camaquã", lagoonLevelPath: null },
  { slug: "cangucu-rs", name: "Canguçu", lagoonLevelPath: null },
  { slug: "cerro-grande-do-sul-rs", name: "Cerro Grande do Sul", lagoonLevelPath: null },
  { slug: "chui-rs", name: "Chuí", lagoonLevelPath: null },
  { slug: "cristal-rs", name: "Cristal", lagoonLevelPath: null },
  { slug: "dom-feliciano-rs", name: "Dom Feliciano", lagoonLevelPath: null },
  { slug: "guaiba-rs", name: "Guaíba", lagoonLevelPath: null },
  { slug: "jaguarao-rs", name: "Jaguarão", lagoonLevelPath: null },
  { slug: "mariana-pimentel-rs", name: "Mariana Pimentel", lagoonLevelPath: null },
  { slug: "morro-redondo-rs", name: "Morro Redondo", lagoonLevelPath: null },
  { slug: "mostardas-rs", name: "Mostardas", lagoonLevelPath: null },
  { slug: "pelotas-rs", name: "Pelotas", lagoonLevelPath: "/nivel-da-lagoa-dos-patos-laranjal" },
  { slug: "piratini-rs", name: "Piratini", lagoonLevelPath: null },
  { slug: "rio-grande-rs", name: "Rio Grande", lagoonLevelPath: "/nivel-da-lagoa-dos-patos/rio-grande" },
  { slug: "santa-vitoria-do-palmar-rs", name: "Santa Vitória do Palmar", lagoonLevelPath: null },
  { slug: "sao-jose-do-norte-rs", name: "São José do Norte", lagoonLevelPath: "/nivel-da-lagoa-dos-patos/sao-jose-do-norte" },
  { slug: "sao-lourenco-do-sul-rs", name: "São Lourenço do Sul", lagoonLevelPath: "/nivel-da-lagoa-dos-patos/sao-lourenco-do-sul" },
  { slug: "sertao-santana-rs", name: "Sertão Santana", lagoonLevelPath: null },
  { slug: "tapes-rs", name: "Tapes", lagoonLevelPath: null },
  { slug: "tavares-rs", name: "Tavares", lagoonLevelPath: null },
  { slug: "turucu-rs", name: "Turuçu", lagoonLevelPath: null },
] as const;

export function costaDoceWeatherPath(city: CostaDoceCity) {
  if (city.slug === "pelotas-rs") return "/tempo-hoje-pelotas";
  const regionalCity = findPublicRegionalCity(city.slug);
  return regionalCity ? regionalCityPath(regionalCity) : null;
}

export function costaDoceCoverage() {
  const withLagoonLevel = COSTA_DOCE_CITIES.filter((city) => city.lagoonLevelPath !== null);
  const withWeather = COSTA_DOCE_CITIES.filter((city) => costaDoceWeatherPath(city) !== null);
  const weatherMissing = COSTA_DOCE_CITIES.filter((city) => costaDoceWeatherPath(city) === null);

  return {
    total: COSTA_DOCE_CITIES.length,
    withLagoonLevel,
    withWeather,
    weatherMissing,
  };
}
