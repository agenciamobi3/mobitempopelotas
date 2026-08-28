export type RegionalCityEditorialExpansionProfile = {
  metaDescription: string;
  heroDescription: string;
  sectionTitle: string;
  introduction: string;
  facts: readonly string[];
};

/**
 * Perfis editoriais específicos das cidades que antes dependiam do texto-base.
 * O conteúdo usa somente contexto geográfico/operacional já cadastrado no projeto
 * e não transforma previsão por coordenadas em observação local.
 */
export const REGIONAL_CITY_EDITORIAL_EXPANSION: Readonly<
  Record<string, RegionalCityEditorialExpansionProfile>
> = {
  "morro-redondo-rs": {
    metaDescription:
      "Veja o tempo em Morro Redondo hoje e a previsão para as próximas horas e 7 dias, com temperatura, chuva, vento e avisos oficiais do INMET.",
    heroDescription:
      "Veja o tempo em Morro Redondo agora e acompanhe temperatura, chuva e vento previstos no município serrano próximo a Pelotas.",
    sectionTitle: "Como acompanhar o tempo em Morro Redondo",
    introduction:
      "Morro Redondo é um município serrano próximo a Pelotas. A previsão desta página usa as coordenadas centrais do município, por isso temperatura, chuva, vento e visibilidade podem variar entre diferentes pontos do território.",
    facts: [
      "A previsão de Morro Redondo é calculada para suas próprias coordenadas e não reaproveita os valores de Pelotas.",
      "Temperatura mínima e visibilidade podem variar em áreas com relevo e exposição diferentes.",
      "Para atividades ao ar livre, confirme chuva, vento e rajadas novamente quando o horário estiver mais próximo.",
      "Para contexto regional, compare também Canguçu, Capão do Leão e Pelotas.",
    ],
  },
  "turucu-rs": {
    metaDescription:
      "Veja o tempo em Turuçu hoje e a previsão para as próximas horas e 7 dias, com temperatura, chuva, vento e avisos oficiais do INMET.",
    heroDescription:
      "Veja o tempo em Turuçu agora e acompanhe temperatura, chuva e vento no município entre Pelotas e São Lourenço do Sul.",
    sectionTitle: "O que observar na previsão do tempo em Turuçu",
    introduction:
      "Turuçu fica entre Pelotas e São Lourenço do Sul. A página oferece uma referência própria para o município, útil para comparar chuva, temperatura e vento ao longo desse trecho da região sem assumir que cidades próximas terão os mesmos valores.",
    facts: [
      "A previsão usa as coordenadas de Turuçu e pode diferir das condições estimadas para Pelotas ou São Lourenço do Sul.",
      "Chance de chuva e volume previsto são informações diferentes e devem ser avaliadas em conjunto.",
      "A previsão horária ajuda em decisões próximas; a janela de sete dias serve melhor ao planejamento geral.",
      "Para contexto regional, compare também Pelotas, São Lourenço do Sul e Canguçu.",
    ],
  },
  "arroio-do-padre-rs": {
    metaDescription:
      "Veja o tempo em Arroio do Padre hoje e a previsão para as próximas horas e 7 dias, com temperatura, chuva, vento e avisos oficiais do INMET.",
    heroDescription:
      "Veja o tempo em Arroio do Padre agora e acompanhe temperatura, chuva e vento previstos no município rural da região de Pelotas.",
    sectionTitle: "Como usar a previsão do tempo em Arroio do Padre",
    introduction:
      "Arroio do Padre é um município rural da região de Pelotas. Para atividades de campo e deslocamentos locais, a previsão por hora ajuda a acompanhar chuva, temperatura e vento, sempre tomando as coordenadas centrais como referência e não como medição de todo o território.",
    facts: [
      "Chuva localizada pode variar dentro do município, principalmente quando a precipitação ocorre de forma irregular.",
      "Vento médio e rajadas aparecem separados porque têm usos diferentes no planejamento de atividades externas.",
      "A previsão de sete dias é uma tendência e deve ser atualizada conforme a data se aproxima.",
      "Para contexto do entorno de Pelotas, compare também Canguçu, Morro Redondo e Pelotas.",
    ],
  },
  "pedro-osorio-rs": {
    metaDescription:
      "Veja o tempo em Pedro Osório hoje e a previsão para as próximas horas e 7 dias, com chuva, temperatura, vento e avisos oficiais do INMET.",
    heroDescription:
      "Veja o tempo em Pedro Osório agora e acompanhe chuva, temperatura e vento no município às margens do rio Piratini.",
    sectionTitle: "O que acompanhar no tempo em Pedro Osório",
    introduction:
      "Pedro Osório fica às margens do rio Piratini. A previsão desta página ajuda a acompanhar chuva, temperatura e vento para as coordenadas do município, mas previsão de precipitação não deve ser interpretada automaticamente como nível ou condição do rio.",
    facts: [
      "Chance de chuva e volume previsto informam precipitação; não representam medição do rio Piratini.",
      "A previsão horária é mais útil para decisões próximas e pode mudar conforme novas rodadas do modelo chegam.",
      "Vento e rajadas aparecem separadamente para não confundir velocidade média com picos previstos.",
      "Para comparação local, consulte também Cerrito, Piratini e Capão do Leão.",
    ],
  },
  "cerrito-rs": {
    metaDescription:
      "Veja o tempo em Cerrito hoje e a previsão para as próximas horas e 7 dias, com temperatura, chuva, vento e avisos oficiais do INMET.",
    heroDescription:
      "Veja o tempo em Cerrito agora e acompanhe temperatura, chuva e vento previstos no município da Zona Sul próximo a Pedro Osório.",
    sectionTitle: "Como interpretar a previsão do tempo em Cerrito",
    introduction:
      "Cerrito fica na Zona Sul e é próximo a Pedro Osório, mas possui previsão calculada para suas próprias coordenadas. A comparação entre cidades próximas é útil justamente porque chuva, temperatura e vento podem apresentar diferenças locais.",
    facts: [
      "Os valores de Cerrito não são copiados de Pedro Osório ou Pelotas; a consulta usa a referência geográfica do próprio município.",
      "Chuva prevista pode variar em distância curta, por isso vale comparar a evolução horária quando houver deslocamento regional.",
      "A janela de sete dias deve ser tratada como tendência e confirmada quando a data estiver mais próxima.",
      "Para contexto local, compare também Pedro Osório, Piratini e Capão do Leão.",
    ],
  },
  "cristal-rs": {
    metaDescription:
      "Veja o tempo em Cristal hoje e a previsão para as próximas horas e 7 dias, com chuva, temperatura, vento e avisos oficiais do INMET.",
    heroDescription:
      "Veja o tempo em Cristal agora e acompanhe chuva, temperatura e vento no município da Costa Doce junto ao rio Camaquã.",
    sectionTitle: "O que observar no tempo em Cristal",
    introduction:
      "Cristal integra a Costa Doce e fica junto ao rio Camaquã. A previsão meteorológica desta página representa as coordenadas do município; chuva prevista deve permanecer separada de qualquer leitura hidrológica do rio.",
    facts: [
      "Chance e volume de chuva ajudam a acompanhar precipitação, mas não informam automaticamente o nível do rio Camaquã.",
      "Temperatura e vento podem variar entre diferentes pontos do município e áreas próximas ao rio.",
      "Para decisões sensíveis à chuva, confira a previsão novamente perto do horário planejado.",
      "Para contexto da Costa Doce, compare também São Lourenço do Sul e Turuçu.",
    ],
  },
  "arroio-grande-rs": {
    metaDescription:
      "Veja o tempo em Arroio Grande hoje e a previsão para as próximas horas e 7 dias, com chuva, vento, rajadas e avisos oficiais do INMET.",
    heroDescription:
      "Veja o tempo em Arroio Grande agora e acompanhe chuva, vento e rajadas no município da planície costeira do extremo sul.",
    sectionTitle: "Como acompanhar o tempo em Arroio Grande",
    introduction:
      "Arroio Grande está na planície costeira do extremo sul. Para deslocamentos e atividades em áreas abertas, acompanhe chuva, vento e rajadas em conjunto, lembrando que a previsão usa as coordenadas centrais do município como referência.",
    facts: [
      "Vento médio e rajadas são informações distintas e podem ter impactos diferentes em atividades expostas.",
      "A previsão horária ajuda a acompanhar mudanças dentro do dia; sete dias servem ao planejamento mais amplo.",
      "Avisos oficiais do INMET permanecem separados da previsão numérica apresentada na página.",
      "Para contexto da Fronteira Sul, compare também Jaguarão, Herval e Santa Vitória do Palmar.",
    ],
  },
  "herval-rs": {
    metaDescription:
      "Veja o tempo em Herval hoje e a previsão para as próximas horas e 7 dias, com temperatura, chuva, vento e avisos oficiais do INMET.",
    heroDescription:
      "Veja o tempo em Herval agora e acompanhe temperatura, chuva e vento previstos no município rural da Fronteira Sul.",
    sectionTitle: "Como usar a previsão do tempo em Herval",
    introduction:
      "Herval é um município rural da Fronteira Sul. A previsão horária ajuda no planejamento de atividades próximas, enquanto a tendência diária permite comparar temperatura, chuva e vento nos próximos dias sem tratar a coordenada central como medição de toda a área rural.",
    facts: [
      "Atividades de campo devem considerar atualização frequente da previsão quando chuva ou vento forem relevantes.",
      "Chance de chuva e volume previsto não significam a mesma coisa e aparecem como informações separadas.",
      "A previsão municipal não substitui avisos oficiais emitidos pelo INMET para situações de risco.",
      "Para contexto regional, compare também Jaguarão, Arroio Grande e Pedras Altas.",
    ],
  },
  "pinheiro-machado-rs": {
    metaDescription:
      "Veja o tempo em Pinheiro Machado hoje e a previsão para as próximas horas e 7 dias, com temperatura, chuva, vento e avisos do INMET.",
    heroDescription:
      "Veja o tempo em Pinheiro Machado agora e acompanhe temperatura, chuva e vento no município entre a Serra do Sudeste e a Campanha.",
    sectionTitle: "O que acompanhar na previsão de Pinheiro Machado",
    introduction:
      "Pinheiro Machado está entre a Serra do Sudeste e a Campanha. A página usa as coordenadas centrais do município para acompanhar temperatura, chuva e vento, mantendo a previsão como referência e não como medição uniforme de todo o território.",
    facts: [
      "Temperatura e vento podem variar em pontos com exposição e relevo diferentes dentro do município.",
      "A previsão horária é mais adequada para decisões próximas do que a tendência de vários dias.",
      "Rajadas devem ser observadas separadamente do vento médio quando houver atividade externa.",
      "Para contexto regional, compare também Piratini, Candiota, Pedras Altas e Bagé.",
    ],
  },
  "pedras-altas-rs": {
    metaDescription:
      "Veja o tempo em Pedras Altas hoje e a previsão para as próximas horas e 7 dias, com temperatura, chuva, vento e avisos do INMET.",
    heroDescription:
      "Veja o tempo em Pedras Altas agora e acompanhe temperatura, chuva e vento no município da Campanha próximo à fronteira.",
    sectionTitle: "Como acompanhar o tempo em Pedras Altas",
    introduction:
      "Pedras Altas fica na Campanha, próximo à fronteira. A previsão desta página ajuda a planejar atividades e deslocamentos usando a referência central do município, com atenção separada para temperatura, chuva, vento e rajadas.",
    facts: [
      "A previsão por coordenadas não representa automaticamente todas as áreas rurais do município.",
      "Vento médio e rajadas são apresentados separadamente para facilitar decisões em áreas abertas.",
      "A previsão de sete dias deve ser confirmada conforme a data se aproxima.",
      "Para contexto da Campanha, compare também Pinheiro Machado, Candiota, Aceguá e Bagé.",
    ],
  },
  "candiota-rs": {
    metaDescription:
      "Veja o tempo em Candiota hoje e a previsão para as próximas horas e 7 dias, com temperatura, chuva, vento, rajadas e avisos do INMET.",
    heroDescription:
      "Veja o tempo em Candiota agora e acompanhe temperatura, chuva, vento e rajadas no município da Campanha com atividade energética e rural.",
    sectionTitle: "O que acompanhar na previsão do tempo em Candiota",
    introduction:
      "Candiota está na Campanha e reúne atividades energéticas e rurais. Para planejamento operacional e atividades externas, acompanhe em conjunto temperatura, chuva, vento e rajadas, usando a coordenada central como referência meteorológica do município.",
    facts: [
      "Vento médio e rajadas são variáveis diferentes e devem ser avaliadas separadamente em atividades expostas.",
      "Chance de chuva não informa sozinha o volume esperado; a página apresenta os dois campos quando disponíveis.",
      "A previsão numérica não substitui avisos oficiais do INMET para situações de risco.",
      "Para contexto da Campanha, compare também Bagé, Pedras Altas, Aceguá e Pinheiro Machado.",
    ],
  },
  "acegua-rs": {
    metaDescription:
      "Veja o tempo em Aceguá hoje e a previsão para as próximas horas e 7 dias, com temperatura, chuva, vento e avisos oficiais do INMET.",
    heroDescription:
      "Veja o tempo em Aceguá agora e acompanhe temperatura, chuva e vento no município de fronteira da Campanha gaúcha.",
    sectionTitle: "Como usar a previsão do tempo em Aceguá",
    introduction:
      "Aceguá é um município de fronteira na Campanha. A previsão horária ajuda no planejamento de deslocamentos e atividades próximas, enquanto a tendência de sete dias permite acompanhar mudanças de temperatura, chuva e vento com antecedência.",
    facts: [
      "A página usa as coordenadas centrais de Aceguá e não assume condições idênticas em toda a área de fronteira.",
      "Para viagens e atividades externas, atualize chuva, vento e rajadas quando o horário estiver mais próximo.",
      "Avisos do INMET são exibidos separadamente da previsão e têm prioridade em situações de risco.",
      "Para contexto regional, compare também Bagé, Candiota e Pedras Altas.",
    ],
  },
};
