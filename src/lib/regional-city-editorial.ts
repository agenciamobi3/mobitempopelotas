import type { RegionalCity } from "./regional-cities";

export type RegionalCityEditorialProfile = {
  metaDescription: string;
  heroDescription: string;
  sectionTitle: string;
  introduction: string;
  facts: readonly string[];
};

const PRIORITY_REGIONAL_EDITORIAL: Readonly<Record<string, RegionalCityEditorialProfile>> = {
  "rio-grande-rs": {
    metaDescription:
      "Veja o tempo em Rio Grande hoje e a previsão para as próximas horas e 7 dias, com temperatura, chuva, vento, rajadas e avisos do INMET.",
    heroDescription:
      "Veja o tempo em Rio Grande agora e acompanhe chuva, vento, rajadas e a previsão dos próximos dias na cidade entre a Lagoa dos Patos e o oceano Atlântico.",
    sectionTitle: "O que observar na previsão do tempo em Rio Grande",
    introduction:
      "Rio Grande fica entre a Lagoa dos Patos e o oceano Atlântico. Para planejar deslocamentos e atividades ao ar livre, acompanhe em conjunto chuva, vento, rajadas e avisos oficiais, lembrando que a previsão desta página representa as coordenadas centrais do município.",
    facts: [
      "Chuva e vento são previstos para as coordenadas centrais de Rio Grande e podem variar em outras áreas do município.",
      "Rajadas merecem leitura separada do vento médio, principalmente em atividades expostas ao tempo.",
      "Avisos do INMET usam a abrangência oficial do município e devem prevalecer em situações de risco.",
      "Para comparar a região, consulte também São José do Norte e Pelotas.",
    ],
  },
  "cangucu-rs": {
    metaDescription:
      "Veja o tempo em Canguçu hoje e a previsão para as próximas horas e 7 dias, com temperatura, chuva, vento e avisos oficiais do INMET.",
    heroDescription:
      "Veja o tempo em Canguçu agora e acompanhe temperatura, chuva, vento e mudanças previstas para os próximos dias no município da Serra do Sudeste.",
    sectionTitle: "Como acompanhar o tempo em Canguçu",
    introduction:
      "Canguçu está na Serra do Sudeste e possui forte atividade rural. A previsão desta página representa as coordenadas centrais do município; por isso, chuva localizada, nevoeiro, vento e temperatura podem variar entre diferentes áreas.",
    facts: [
      "Use a previsão horária para atividades próximas e a tendência diária para planejamento dos próximos dias.",
      "Chuva localizada pode apresentar diferenças entre a área urbana e outras partes do município.",
      "Temperatura, vento e rajadas devem ser conferidos novamente quando a atividade depender diretamente do tempo.",
      "Para contexto regional, compare também Morro Redondo, Pelotas e Piratini.",
    ],
  },
  "dom-pedrito-rs": {
    metaDescription:
      "Veja o tempo em Dom Pedrito hoje e a previsão para as próximas horas e 7 dias, com temperatura, chuva, vento, rajadas e avisos do INMET.",
    heroDescription:
      "Veja o tempo em Dom Pedrito agora e acompanhe temperatura, chuva, vento e rajadas previstas para os próximos dias na Campanha gaúcha.",
    sectionTitle: "O que acompanhar na previsão de Dom Pedrito",
    introduction:
      "Dom Pedrito fica na Campanha e tem forte atividade agropecuária. Chuva, temperatura, vento e rajadas são informações úteis para planejamento, mas a previsão desta página representa as coordenadas centrais do município e pode variar em outras áreas.",
    facts: [
      "Compare chance de chuva e volume previsto; um percentual alto não significa necessariamente grande acumulado.",
      "Rajadas podem ser bem diferentes do vento médio e aparecem separadas na previsão.",
      "Para atividades de campo, confirme novamente a previsão quando o horário estiver mais próximo.",
      "Avisos oficiais do INMET devem ser consultados sempre que houver condição de risco.",
    ],
  },
  "jaguarao-rs": {
    metaDescription:
      "Veja o tempo em Jaguarão hoje e a previsão para as próximas horas e 7 dias, com temperatura, chuva, vento e avisos oficiais do INMET.",
    heroDescription:
      "Veja o tempo em Jaguarão agora e acompanhe temperatura, chuva e vento previstos para os próximos dias na cidade de fronteira com o Uruguai.",
    sectionTitle: "Como usar a previsão do tempo em Jaguarão",
    introduction:
      "Jaguarão fica na Fronteira Sul, junto ao Uruguai. Para viagens, deslocamentos e atividades ao ar livre, acompanhe chuva, temperatura, vento e avisos oficiais e confirme a previsão quando o horário estiver mais próximo.",
    facts: [
      "A previsão horária ajuda a acompanhar mudanças dentro do dia.",
      "A tendência de sete dias é mais adequada para planejamento geral do que para definir horários distantes.",
      "Chuva e vento podem variar dentro do município; a página usa as coordenadas centrais como referência.",
      "Avisos do INMET são exibidos separadamente da previsão do modelo.",
    ],
  },
  "capao-do-leao-rs": {
    metaDescription:
      "Veja o tempo em Capão do Leão hoje e a previsão para as próximas horas e 7 dias, com temperatura, chuva, vento e avisos oficiais do INMET.",
    heroDescription:
      "Veja o tempo em Capão do Leão agora e acompanhe temperatura, chuva e vento previstos para os próximos dias no município vizinho a Pelotas.",
    sectionTitle: "Como acompanhar o tempo em Capão do Leão",
    introduction:
      "Capão do Leão é vizinho a Pelotas, mas possui coordenadas próprias no portal. A página usa a previsão calculada para o município, permitindo comparar as condições quando o deslocamento ou a atividade ocorre entre as duas cidades.",
    facts: [
      "A previsão de Capão do Leão é consultada para suas próprias coordenadas e não reaproveita os valores de Pelotas.",
      "Compare chuva, temperatura e vento quando houver deslocamento entre os municípios.",
      "Mudanças localizadas podem ocorrer mesmo entre cidades próximas.",
      "Avisos oficiais são consultados pelo código municipal do INMET.",
    ],
  },
};

export function regionalCityPageTitle(city: RegionalCity) {
  return `Tempo em ${city.name} hoje: previsão, chuva e vento`;
}

export function regionalCityMetaDescription(city: RegionalCity) {
  return (
    PRIORITY_REGIONAL_EDITORIAL[city.slug]?.metaDescription ??
    `Veja o tempo em ${city.name} hoje e a previsão para as próximas horas e 7 dias, com temperatura, chuva, vento e avisos oficiais do INMET.`
  );
}

export function regionalCityEditorialProfile(city: RegionalCity) {
  return PRIORITY_REGIONAL_EDITORIAL[city.slug] ?? null;
}
