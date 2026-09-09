export type CostaDoceRegionalEditorialProfile = {
  metaDescription: string;
  heroDescription: string;
  sectionTitle: string;
  introduction: string;
  facts: readonly string[];
};

/**
 * Conteúdo local da expansão meteorológica da Costa Doce.
 * Os 11 perfis abaixo passaram pelo gate final de publicação em 09/09/2026.
 */
export const COSTA_DOCE_REGIONAL_EDITORIAL: Readonly<
  Record<string, CostaDoceRegionalEditorialProfile>
> = {
  "arambare-rs": {
    metaDescription:
      "Veja o tempo em Arambaré hoje e a previsão para as próximas horas e 7 dias, com chuva, vento, temperatura e avisos oficiais do INMET.",
    heroDescription:
      "Veja o tempo em Arambaré agora e acompanhe chuva, vento e temperatura na cidade balneária da Costa Doce, junto à Lagoa dos Patos.",
    sectionTitle: "O que observar no tempo em Arambaré",
    introduction:
      "Arambaré fica na margem oeste da Lagoa dos Patos. A previsão desta página usa as coordenadas da sede municipal e ajuda a acompanhar chuva, vento e temperatura para atividades urbanas e junto à orla.",
    facts: [
      "A previsão meteorológica é independente da leitura de nível da Lagoa disponível para Arambaré.",
      "Vento médio e rajadas devem ser lidos separadamente, sobretudo em atividades expostas junto à água.",
      "Chance de chuva e volume previsto são informações diferentes e devem ser analisadas em conjunto.",
      "Para contexto da Costa Doce, compare também Tapes, Camaquã e São Lourenço do Sul.",
    ],
  },
  "barra-do-ribeiro-rs": {
    metaDescription:
      "Veja o tempo em Barra do Ribeiro hoje e a previsão para as próximas horas e 7 dias, com chuva, vento, temperatura e avisos do INMET.",
    heroDescription:
      "Veja o tempo em Barra do Ribeiro agora e acompanhe chuva, vento e temperatura no município da Costa Doce junto ao Guaíba.",
    sectionTitle: "Como acompanhar o tempo em Barra do Ribeiro",
    introduction:
      "Barra do Ribeiro está na margem oeste do Guaíba. A previsão usa as coordenadas da sede municipal como referência e pode variar em áreas rurais e pontos mais próximos da água.",
    facts: [
      "Vento e rajadas merecem atenção separada em áreas abertas e junto ao Guaíba.",
      "A previsão por coordenadas não representa uma medição de todas as localidades do município.",
      "A janela horária é mais adequada para decisões próximas; sete dias servem ao planejamento geral.",
      "Para contexto regional, compare também Guaíba, Mariana Pimentel e Tapes.",
    ],
  },
  "camaqua-rs": {
    metaDescription:
      "Veja o tempo em Camaquã hoje e a previsão para as próximas horas e 7 dias, com chuva, temperatura, vento e avisos oficiais do INMET.",
    heroDescription:
      "Veja o tempo em Camaquã agora e acompanhe chuva, temperatura e vento no principal polo urbano do centro da Costa Doce.",
    sectionTitle: "O que acompanhar na previsão de Camaquã",
    introduction:
      "Camaquã é um polo regional da Costa Doce e está inserida na bacia do rio Camaquã. A previsão meteorológica desta página representa a sede municipal e não deve ser interpretada como medição de nível do rio.",
    facts: [
      "Chuva prevista e nível do rio são dados diferentes e permanecem separados no portal.",
      "Para atividades rurais, confirme a previsão novamente quando o horário estiver mais próximo.",
      "Chance de chuva não informa sozinha o volume esperado.",
      "Para contexto da Costa Doce, compare também Arambaré, Cristal e Dom Feliciano.",
    ],
  },
  "cerro-grande-do-sul-rs": {
    metaDescription:
      "Veja o tempo em Cerro Grande do Sul hoje e a previsão para as próximas horas e 7 dias, com temperatura, chuva, vento e avisos do INMET.",
    heroDescription:
      "Veja o tempo em Cerro Grande do Sul agora e acompanhe temperatura, chuva e vento no município rural da Costa Doce.",
    sectionTitle: "Como usar a previsão em Cerro Grande do Sul",
    introduction:
      "Cerro Grande do Sul possui território rural e relevo que pode produzir diferenças locais de temperatura, chuva e vento. A página usa as coordenadas da sede municipal como referência meteorológica.",
    facts: [
      "A previsão central não representa automaticamente todas as áreas rurais do município.",
      "Temperatura e nevoeiro podem variar em função do relevo e da exposição local.",
      "A previsão horária deve ser atualizada antes de atividades sensíveis à chuva ou ao vento.",
      "Para contexto regional, compare também Sertão Santana, Barra do Ribeiro e Camaquã.",
    ],
  },
  "dom-feliciano-rs": {
    metaDescription:
      "Veja o tempo em Dom Feliciano hoje e a previsão para as próximas horas e 7 dias, com chuva, temperatura, vento e avisos do INMET.",
    heroDescription:
      "Veja o tempo em Dom Feliciano agora e acompanhe chuva, temperatura e vento no município rural da bacia do rio Camaquã.",
    sectionTitle: "O que acompanhar no tempo em Dom Feliciano",
    introduction:
      "Dom Feliciano faz parte da bacia hidrográfica do rio Camaquã e possui forte presença rural. A previsão usa as coordenadas da sede e ajuda no planejamento sem transformar precipitação prevista em leitura hidrológica.",
    facts: [
      "Previsão de chuva não equivale a nível ou vazão do rio Camaquã.",
      "Atividades rurais devem considerar atualizações próximas ao horário de execução.",
      "Vento médio e rajadas são apresentados como variáveis diferentes.",
      "Para contexto regional, compare também Camaquã, Cerro Grande do Sul e Mariana Pimentel.",
    ],
  },
  "guaiba-rs": {
    metaDescription:
      "Veja o tempo em Guaíba hoje e a previsão para as próximas horas e 7 dias, com chuva, vento, temperatura e avisos oficiais do INMET.",
    heroDescription:
      "Veja o tempo em Guaíba agora e acompanhe chuva, vento e temperatura na cidade da margem oeste do Guaíba.",
    sectionTitle: "Como acompanhar o tempo em Guaíba",
    introduction:
      "Guaíba fica na margem oeste do Guaíba, em frente à região de Porto Alegre. A previsão desta página representa a sede municipal e deve permanecer separada das leituras de nível disponíveis nas páginas hidrológicas.",
    facts: [
      "Vento previsto pode ser relevante junto à orla e deve ser lido junto das rajadas.",
      "Previsão meteorológica e nível do Guaíba são produtos diferentes no portal.",
      "A previsão horária ajuda em decisões próximas e pode mudar com novas rodadas dos modelos.",
      "Para contexto regional, compare também Barra do Ribeiro e Mariana Pimentel.",
    ],
  },
  "mariana-pimentel-rs": {
    metaDescription:
      "Veja o tempo em Mariana Pimentel hoje e a previsão para as próximas horas e 7 dias, com temperatura, chuva, vento e avisos do INMET.",
    heroDescription:
      "Veja o tempo em Mariana Pimentel agora e acompanhe temperatura, chuva e vento no município rural da Costa Doce.",
    sectionTitle: "Como interpretar a previsão em Mariana Pimentel",
    introduction:
      "Mariana Pimentel possui perfil rural e fica entre a região do Guaíba e áreas de relevo interiorano. A previsão usa as coordenadas da sede e não representa automaticamente todos os pontos do município.",
    facts: [
      "Chuva pode variar de forma localizada em áreas rurais e com relevo diferente.",
      "Temperatura e vento devem ser confirmados novamente para atividades sensíveis ao tempo.",
      "A janela de sete dias é uma tendência e ganha precisão conforme a data se aproxima.",
      "Para contexto regional, compare também Barra do Ribeiro, Guaíba e Sertão Santana.",
    ],
  },
  "mostardas-rs": {
    metaDescription:
      "Veja o tempo em Mostardas hoje e a previsão para as próximas horas e 7 dias, com chuva, vento, temperatura e avisos do INMET.",
    heroDescription:
      "Veja o tempo em Mostardas agora e acompanhe chuva, vento e temperatura no município entre a Lagoa dos Patos e o oceano Atlântico.",
    sectionTitle: "O que observar no tempo em Mostardas",
    introduction:
      "Mostardas ocupa uma faixa extensa entre a Lagoa dos Patos e o oceano Atlântico. A previsão da sede municipal funciona como referência e não representa automaticamente toda a costa, a zona rural ou os balneários.",
    facts: [
      "Vento médio e rajadas são especialmente importantes em áreas abertas e costeiras.",
      "A previsão das coordenadas centrais pode diferir das condições ao longo do litoral e da Lagoa.",
      "Para viagens, confirme novamente chuva e vento próximo ao horário do deslocamento.",
      "Para contexto regional, compare também Tavares e São José do Norte.",
    ],
  },
  "sertao-santana-rs": {
    metaDescription:
      "Veja o tempo em Sertão Santana hoje e a previsão para as próximas horas e 7 dias, com temperatura, chuva, vento e avisos do INMET.",
    heroDescription:
      "Veja o tempo em Sertão Santana agora e acompanhe temperatura, chuva e vento no município rural da Costa Doce.",
    sectionTitle: "Como acompanhar o tempo em Sertão Santana",
    introduction:
      "Sertão Santana possui perfil rural e fica na transição entre a região do Guaíba e o interior da Costa Doce. A previsão usa as coordenadas da sede como referência meteorológica.",
    facts: [
      "A previsão por coordenadas pode variar em diferentes áreas rurais do município.",
      "Chance de chuva e acumulado previsto devem ser lidos separadamente.",
      "Vento e rajadas podem ter impactos diferentes em atividades externas.",
      "Para contexto regional, compare também Mariana Pimentel, Cerro Grande do Sul e Tapes.",
    ],
  },
  "tapes-rs": {
    metaDescription:
      "Veja o tempo em Tapes hoje e a previsão para as próximas horas e 7 dias, com chuva, vento, temperatura e avisos do INMET.",
    heroDescription:
      "Veja o tempo em Tapes agora e acompanhe chuva, vento e temperatura na cidade da Costa Doce às margens da Lagoa dos Patos.",
    sectionTitle: "O que observar na previsão de Tapes",
    introduction:
      "Tapes fica na margem oeste da Lagoa dos Patos. Para atividades urbanas e junto à orla, acompanhe chuva, vento e rajadas em conjunto, usando a previsão da sede municipal como referência.",
    facts: [
      "Vento médio e rajadas devem ser observados separadamente em atividades junto à Lagoa.",
      "A previsão meteorológica não representa uma medição de nível da água.",
      "Chance de chuva e volume previsto informam aspectos diferentes da precipitação.",
      "Para contexto da Costa Doce, compare também Arambaré, Barra do Ribeiro e Sertão Santana.",
    ],
  },
  "tavares-rs": {
    metaDescription:
      "Veja o tempo em Tavares hoje e a previsão para as próximas horas e 7 dias, com chuva, vento, temperatura e avisos do INMET.",
    heroDescription:
      "Veja o tempo em Tavares agora e acompanhe chuva, vento e temperatura no município costeiro entre lagoas e oceano.",
    sectionTitle: "Como acompanhar o tempo em Tavares",
    introduction:
      "Tavares está em uma faixa costeira próxima à Lagoa dos Patos, à Lagoa do Peixe e ao oceano Atlântico. A previsão usa a sede municipal como referência e pode variar bastante em outros pontos do território.",
    facts: [
      "Vento e rajadas merecem atenção em áreas abertas e costeiras.",
      "A previsão central não representa automaticamente toda a faixa entre lagoas e oceano.",
      "Para deslocamentos, atualize a previsão quando o horário estiver mais próximo.",
      "Para contexto regional, compare também Mostardas e São José do Norte.",
    ],
  },
};