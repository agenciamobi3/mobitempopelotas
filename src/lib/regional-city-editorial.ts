import { COSTA_DOCE_REGIONAL_EDITORIAL } from "./regional-city-editorial-costa-doce";
import { REGIONAL_CITY_EDITORIAL_EXPANSION } from "./regional-city-editorial-expansion";
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
  "sao-jose-do-norte-rs": {
    metaDescription:
      "Veja o tempo em São José do Norte hoje e a previsão para as próximas horas e 7 dias, com chuva, vento, rajadas e avisos oficiais do INMET.",
    heroDescription:
      "Veja o tempo em São José do Norte agora e acompanhe chuva, vento e mudanças previstas no município costeiro da margem leste da Lagoa dos Patos.",
    sectionTitle: "Como acompanhar o tempo em São José do Norte",
    introduction:
      "São José do Norte está na margem leste da Lagoa dos Patos e possui forte exposição a condições costeiras. A previsão desta página representa as coordenadas centrais do município; chuva, vento e visibilidade podem variar ao longo de seu território.",
    facts: [
      "Vento médio e rajadas aparecem separados porque representam medidas diferentes.",
      "A previsão horária é a melhor referência para deslocamentos próximos; a janela de sete dias mostra tendência.",
      "Condições costeiras podem variar dentro do município, por isso a coordenada usada deve ser tratada como referência e não como medição de todos os pontos.",
      "Para contexto regional, compare também Rio Grande e Pelotas.",
    ],
  },
  "sao-lourenco-do-sul-rs": {
    metaDescription:
      "Veja o tempo em São Lourenço do Sul hoje e a previsão para as próximas horas e 7 dias, com chuva, vento, temperatura e avisos do INMET.",
    heroDescription:
      "Veja o tempo em São Lourenço do Sul agora e acompanhe chuva, vento e temperatura na cidade da Costa Doce às margens da Lagoa dos Patos.",
    sectionTitle: "O que observar no tempo em São Lourenço do Sul",
    introduction:
      "São Lourenço do Sul fica na Costa Doce, às margens da Lagoa dos Patos. Para atividades urbanas, rurais ou junto à orla, acompanhe chuva, vento e rajadas em conjunto e confirme a previsão quando o horário estiver mais próximo.",
    facts: [
      "A previsão usa as coordenadas centrais de São Lourenço do Sul e não representa automaticamente toda a orla ou zona rural.",
      "Vento e rajadas são especialmente úteis para atividades expostas junto à Lagoa dos Patos.",
      "Chance de chuva e volume previsto devem ser lidos separadamente.",
      "Para contexto da Costa Doce, compare também Turuçu, Cristal e Pelotas.",
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
  "piratini-rs": {
    metaDescription:
      "Veja o tempo em Piratini hoje e a previsão para as próximas horas e 7 dias, com temperatura, chuva, vento e avisos oficiais do INMET.",
    heroDescription:
      "Veja o tempo em Piratini agora e acompanhe temperatura, chuva e vento previstos no município histórico da Serra do Sudeste.",
    sectionTitle: "Como interpretar a previsão do tempo em Piratini",
    introduction:
      "Piratini está na Serra do Sudeste. A previsão desta página representa as coordenadas centrais do município, portanto temperatura, chuva, nevoeiro e vento podem variar em áreas com altitude, relevo e exposição diferentes.",
    facts: [
      "A previsão horária ajuda a acompanhar mudanças dentro do dia e deve ser atualizada antes de atividades sensíveis ao tempo.",
      "Mínimas e visibilidade podem variar entre pontos do município e não devem ser tratadas como medição uniforme de todo o território.",
      "Chance de chuva e volume previsto são informações distintas e devem ser analisadas em conjunto.",
      "Para contexto regional, compare também Canguçu, Pinheiro Machado e Pelotas.",
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
  "bage-rs": {
    metaDescription:
      "Veja o tempo em Bagé hoje e a previsão para as próximas horas e 7 dias, com temperatura, chuva, vento, rajadas e avisos do INMET.",
    heroDescription:
      "Veja o tempo em Bagé agora e acompanhe temperatura, chuva, vento e rajadas previstas no principal centro urbano da Campanha gaúcha.",
    sectionTitle: "Como acompanhar a previsão do tempo em Bagé",
    introduction:
      "Bagé é um dos principais centros urbanos da Campanha gaúcha. A página combina previsão horária, tendência diária e avisos oficiais para ajudar no planejamento, usando as coordenadas centrais do município como referência meteorológica.",
    facts: [
      "Temperatura, chuva e vento podem variar entre a área urbana e outras partes do município.",
      "Rajadas aparecem separadas do vento médio e merecem atenção em atividades externas ou expostas.",
      "A previsão de sete dias é uma tendência e deve ser confirmada novamente conforme o dia se aproxima.",
      "Para contexto da Campanha, compare também Candiota, Aceguá, Dom Pedrito e Pinheiro Machado.",
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
  "santa-vitoria-do-palmar-rs": {
    metaDescription:
      "Veja o tempo em Santa Vitória do Palmar hoje e a previsão para as próximas horas e 7 dias, com chuva, vento, temperatura e avisos do INMET.",
    heroDescription:
      "Veja o tempo em Santa Vitória do Palmar agora e acompanhe chuva, vento e temperatura no município do extremo sul entre lagoas e oceano.",
    sectionTitle: "O que acompanhar no tempo em Santa Vitória do Palmar",
    introduction:
      "Santa Vitória do Palmar ocupa uma extensa área do extremo sul entre lagoas e oceano. A previsão desta página usa as coordenadas centrais do município e deve ser tratada como referência, pois vento, chuva e temperatura podem variar bastante entre diferentes pontos.",
    facts: [
      "Vento médio e rajadas devem ser observados separadamente, especialmente em áreas abertas e expostas.",
      "A previsão das coordenadas centrais não representa automaticamente a costa, as lagoas e toda a área rural do município.",
      "Para viagens ou atividades externas, atualize a previsão próximo ao horário planejado.",
      "Para contexto do extremo sul, compare também Chuí e Rio Grande.",
    ],
  },
  "chui-rs": {
    metaDescription:
      "Veja o tempo no Chuí hoje e a previsão para as próximas horas e 7 dias, com temperatura, chuva, vento, rajadas e avisos oficiais do INMET.",
    heroDescription:
      "Veja o tempo no Chuí agora e acompanhe temperatura, chuva e vento no município mais ao sul do Brasil, na fronteira com o Uruguai.",
    sectionTitle: "Como acompanhar o tempo no Chuí",
    introduction:
      "O Chuí está no extremo sul do Brasil, na fronteira com o Uruguai. A previsão desta página representa as coordenadas do município e ajuda a acompanhar mudanças rápidas de temperatura, chuva, vento e rajadas antes de viagens e atividades externas.",
    facts: [
      "A previsão horária é a melhor referência para decisões próximas e deve ser atualizada antes do deslocamento.",
      "Vento e rajadas são medidas diferentes e aparecem separadas na página.",
      "A previsão local não substitui avisos oficiais emitidos para o município.",
      "Para contexto regional, compare também Santa Vitória do Palmar.",
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
    COSTA_DOCE_REGIONAL_EDITORIAL[city.slug]?.metaDescription ??
    REGIONAL_CITY_EDITORIAL_EXPANSION[city.slug]?.metaDescription ??
    `Veja o tempo em ${city.name} hoje e a previsão para as próximas horas e 7 dias, com temperatura, chuva, vento e avisos oficiais do INMET.`
  );
}

export function regionalCityEditorialProfile(city: RegionalCity) {
  return (
    PRIORITY_REGIONAL_EDITORIAL[city.slug] ??
    COSTA_DOCE_REGIONAL_EDITORIAL[city.slug] ??
    REGIONAL_CITY_EDITORIAL_EXPANSION[city.slug] ??
    null
  );
}
