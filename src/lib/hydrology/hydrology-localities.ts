export type HydrologyLocality = {
  slug: string;
  name: string;
  state: "RS";
  stationId: string;
  stationName: string;
  waterBody: "Lagoa dos Patos";
  cityLabel: string;
  weatherCitySlug?: string;
  title: string;
  description: string;
  heading: string;
  introduction: string;
};

export const HYDROLOGY_LOCALITIES: readonly HydrologyLocality[] = [
  { slug: "rio-grande", name: "Rio Grande", state: "RS", stationId: "furg-ccmar", stationName: "FURG CCMAR", waterBody: "Lagoa dos Patos", cityLabel: "Rio Grande / RS", weatherCitySlug: "rio-grande-rs", title: "Nível da Lagoa dos Patos em Rio Grande hoje", description: "Acompanhe o nível da Lagoa dos Patos em Rio Grande pela estação FURG CCMAR, com horário da última leitura, movimento recente derivado da série, variações e referência local.", heading: "Nível da Lagoa dos Patos em Rio Grande", introduction: "A estação FURG CCMAR acompanha o estuário e a saída da Lagoa dos Patos para o oceano. A leitura abaixo pertence à referência local da estação e não representa, sozinha, toda a Lagoa ou outras cidades." },
  { slug: "sao-lourenco-do-sul", name: "São Lourenço do Sul", state: "RS", stationId: "sao-lourenco-do-sul", stationName: "São Lourenço do Sul", waterBody: "Lagoa dos Patos", cityLabel: "São Lourenço do Sul / RS", weatherCitySlug: "sao-lourenco-do-sul-rs", title: "Nível da Lagoa dos Patos em São Lourenço do Sul hoje", description: "Veja o nível da Lagoa dos Patos em São Lourenço do Sul, com última leitura, movimento recente derivado da série, variações recentes e a referência local publicada para a estação.", heading: "Nível da Lagoa dos Patos em São Lourenço do Sul", introduction: "Este ponto acompanha a margem oeste da Lagoa dos Patos entre Arambaré e Pelotas. Os valores usam a referência da própria estação e não devem ser convertidos ou comparados diretamente com outras réguas." },
  { slug: "arambare", name: "Arambaré", state: "RS", stationId: "arambare", stationName: "Arambaré", waterBody: "Lagoa dos Patos", cityLabel: "Arambaré / RS", weatherCitySlug: "arambare-rs", title: "Nível da Lagoa dos Patos em Arambaré hoje", description: "Acompanhe o nível da Lagoa dos Patos em Arambaré, com horário da leitura, movimento recente derivado da série, variações recentes e referência local da estação de monitoramento.", heading: "Nível da Lagoa dos Patos em Arambaré", introduction: "A estação de Arambaré ajuda a observar a propagação dos níveis pela região centro-oeste da Lagoa dos Patos. A leitura exibida pertence ao ponto local de monitoramento." },
  { slug: "sao-jose-do-norte", name: "São José do Norte", state: "RS", stationId: "sao-jose-do-norte", stationName: "São José do Norte", waterBody: "Lagoa dos Patos", cityLabel: "São José do Norte / RS", weatherCitySlug: "sao-jose-do-norte-rs", title: "Nível da Lagoa dos Patos em São José do Norte hoje", description: "Consulte o nível da Lagoa dos Patos em São José do Norte, com última medição, movimento recente derivado da série, variações recentes e a referência local publicada pela rede.", heading: "Nível da Lagoa dos Patos em São José do Norte", introduction: "Este ponto complementa a observação do estuário no lado oposto a Rio Grande. Cada estação possui referência própria, portanto os números não devem ser subtraídos ou convertidos entre cidades." },
  { slug: "itapua-viamao", name: "Itapuã, Viamão", state: "RS", stationId: "itapua", stationName: "Itapuã", waterBody: "Lagoa dos Patos", cityLabel: "Viamão / RS", title: "Nível da Lagoa dos Patos em Itapuã, Viamão, hoje", description: "Veja o nível da Lagoa dos Patos em Itapuã, Viamão, com última leitura, movimento recente derivado da série, variações e referência local do ponto de monitoramento no norte da Lagoa.", heading: "Nível da Lagoa dos Patos em Itapuã, Viamão", introduction: "A estação de Itapuã acompanha a porção norte da Lagoa dos Patos, próxima à comunicação com o Guaíba. A leitura é local e não deve ser tratada como o nível único de toda a Lagoa." },
];

export function findHydrologyLocality(slug: string) {
  return HYDROLOGY_LOCALITIES.find((locality) => locality.slug === slug) ?? null;
}

export function findHydrologyLocalityByStationId(stationId: string) {
  return HYDROLOGY_LOCALITIES.find((locality) => locality.stationId === stationId) ?? null;
}

export function findHydrologyLocalityByWeatherCitySlug(weatherCitySlug: string) {
  return HYDROLOGY_LOCALITIES.find((locality) => locality.weatherCitySlug === weatherCitySlug) ?? null;
}

export function hydrologyLocalityPath(locality: Pick<HydrologyLocality, "slug">) {
  return `/nivel-da-lagoa-dos-patos/${locality.slug}` as const;
}

export function hydrologyLocalityWeatherPath(locality: HydrologyLocality) {
  return locality.weatherCitySlug ? `/tempo-em/${locality.weatherCitySlug}` : null;
}
