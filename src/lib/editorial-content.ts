export type EditorialFaq = {
  question: string;
  answer: string;
};

export type EditorialInternalPath =
  | "/"
  | "/alertas"
  | "/cameras-ao-vivo-pelotas"
  | "/chuva-em-pelotas"
  | "/clima-em-pelotas"
  | "/estacao-embrapa-pelotas"
  | "/historico-climatico-pelotas"
  | "/mapa-de-geadas-rio-grande-do-sul"
  | "/meteograma-pelotas"
  | "/metodologia"
  | "/nivel-da-lagoa-dos-patos-laranjal"
  | "/nivel-do-guaiba"
  | "/previsao-7-dias-pelotas"
  | "/radar-e-satelite-pelotas"
  | "/situacao-hidrologica-pelotas"
  | "/tempo-amanha-pelotas"
  | "/tempo-hoje-pelotas"
  | "/vento-em-pelotas";

export type EditorialRelatedLink = {
  label: string;
  href: EditorialInternalPath;
  description: string;
};

export type EditorialContentDefinition = {
  eyebrow: string;
  title: string;
  answer: string;
  facts: readonly string[];
  faqs: readonly EditorialFaq[];
  relatedLinks: readonly EditorialRelatedLink[];
};

export const HOME_EDITORIAL_CONTENT = {
  eyebrow: "Entenda a leitura",
  title: "Como o Tempo Pelotas organiza a informação meteorológica",
  answer:
    "O portal separa claramente o que foi medido em Pelotas do que é previsto pelos modelos. A condição atual prioriza observações locais verificáveis; previsões, alertas e imagens de monitoramento aparecem identificados por origem e finalidade.",
  facts: [
    "Condição atual: prioriza medições locais recentes, especialmente da Embrapa Clima Temperado, sem apresentar previsão como se fosse observação.",
    "Previsão: usa a fonte meteorológica ativa e complementa a leitura com dados oficiais e regionais quando disponíveis.",
    "Risco: avisos oficiais do INMET e orientações das autoridades aparecem separados da interpretação editorial do portal.",
  ],
  faqs: [
    {
      question: "De onde vêm os dados do Tempo Pelotas?",
      answer:
        "O portal consulta fontes locais, oficiais e regionais, incluindo Embrapa Clima Temperado, INMET, CPPMet/UFPel, REDEMET/DECEA e o provedor de previsão identificado em cada atualização.",
    },
    {
      question: "O Tempo Pelotas substitui os alertas oficiais?",
      answer:
        "Não. O portal organiza e contextualiza informações meteorológicas, mas, em situações de risco, devem prevalecer os comunicados da Defesa Civil, do INMET e das autoridades locais.",
    },
    {
      question: "Qual área o portal acompanha?",
      answer:
        "O foco principal é Pelotas e a Zona Sul do Rio Grande do Sul, com contexto regional para a Lagoa dos Patos, o Laranjal e sistemas meteorológicos que influenciam o município.",
    },
  ],
  relatedLinks: [
    {
      label: "Fontes e metodologia",
      href: "/metodologia",
      description: "Veja como cada fonte é usada, atualizada e identificada.",
    },
    {
      label: "Estação Embrapa em Pelotas",
      href: "/estacao-embrapa-pelotas",
      description: "Consulte a observação meteorológica local e sua rastreabilidade.",
    },
    {
      label: "Radar e satélite",
      href: "/radar-e-satelite-pelotas",
      description: "Acompanhe produtos visuais de monitoramento regional.",
    },
  ],
} as const satisfies EditorialContentDefinition;

export const TODAY_EDITORIAL_CONTENT = {
  eyebrow: "Como interpretar o dia",
  title: "Previsão de hoje em Pelotas: o que observar",
  answer:
    "Para planejar o dia, combine a condição observada agora com a evolução prevista por hora. Temperatura, chuva, vento e alertas podem mudar ao longo do período, e cada informação mantém sua fonte e finalidade próprias.",
  facts: [
    "A temperatura atual é uma observação quando existe leitura local recente; a evolução das próximas horas é previsão.",
    "Chance de chuva e volume previsto são medidas diferentes: uma indica probabilidade, a outra estima quantidade.",
    "Rajadas podem ser maiores que o vento médio e merecem atenção em atividades externas.",
  ],
  faqs: [
    {
      question: "A previsão por hora é uma medição?",
      answer:
        "Não. Os horários futuros são previsões. A observação atual aparece separada quando existe uma estação local utilizável.",
    },
    {
      question: "Por que a previsão pode mudar ao longo do dia?",
      answer:
        "Modelos são atualizados com novas informações e a atmosfera evolui continuamente. Por isso, chuva, vento e temperatura podem receber ajustes.",
    },
    {
      question: "Onde vejo alertas oficiais?",
      answer:
        "A página de alertas reúne os avisos oficiais disponíveis para Pelotas, preservando validade, severidade, abrangência e orientações da fonte.",
    },
  ],
  relatedLinks: [
    {
      label: "Previsão para amanhã",
      href: "/tempo-amanha-pelotas",
      description: "Veja a evolução prevista para o próximo dia.",
    },
    {
      label: "Chuva em Pelotas",
      href: "/chuva-em-pelotas",
      description: "Compare probabilidade e volume de precipitação.",
    },
    {
      label: "Alertas oficiais",
      href: "/alertas",
      description: "Confira avisos vigentes e orientações oficiais.",
    },
  ],
} as const satisfies EditorialContentDefinition;

export const TOMORROW_EDITORIAL_CONTENT = {
  eyebrow: "Planeje o próximo dia",
  title: "Como usar a previsão de amanhã em Pelotas",
  answer:
    "A previsão de amanhã ajuda a organizar horários, deslocamentos e atividades externas, mas deve ser revisada conforme o dia se aproxima. Compare temperatura, chuva e vento e confira alertas oficiais quando houver mudança de tempo relevante.",
  facts: [
    "Mínima e máxima representam a faixa prevista para o dia, não valores constantes ao longo de todas as horas.",
    "Chance de chuva não indica sozinha quanto vai chover; o volume previsto complementa a leitura.",
    "Para decisões sensíveis ao vento, consulte também as rajadas previstas.",
  ],
  faqs: [
    {
      question: "A previsão de amanhã ainda pode mudar?",
      answer:
        "Sim. Mesmo em horizonte curto, ajustes são possíveis conforme entram observações e novas rodadas dos modelos.",
    },
    {
      question: "Como saber em que horário pode chover amanhã?",
      answer:
        "Quando o período estiver dentro da janela horária do portal, a página de hoje/por hora oferece o detalhamento mais próximo do evento.",
    },
    {
      question: "A previsão substitui um alerta oficial?",
      answer:
        "Não. A previsão descreve o tempo esperado; avisos oficiais possuem critérios, validade e orientações próprias e devem ser consultados separadamente.",
    },
  ],
  relatedLinks: [
    {
      label: "Previsão de 7 dias",
      href: "/previsao-7-dias-pelotas",
      description: "Compare amanhã com a tendência da semana.",
    },
    {
      label: "Tempo hoje em Pelotas",
      href: "/tempo-hoje-pelotas",
      description: "Acompanhe as próximas horas e a condição atual.",
    },
    {
      label: "Vento em Pelotas",
      href: "/vento-em-pelotas",
      description: "Veja velocidade, direção e rajadas previstas.",
    },
  ],
} as const satisfies EditorialContentDefinition;

export const SEVEN_DAY_EDITORIAL_CONTENT = {
  eyebrow: "Entenda a tendência semanal",
  title: "Como interpretar a previsão dos próximos 7 dias",
  answer:
    "A previsão de uma semana é útil para comparar dias mais frios, quentes, secos, chuvosos ou ventosos, mas a confiança tende a diminuir conforme a data fica mais distante. Use os primeiros dias para decisões práticas e revise os demais conforme se aproximarem.",
  facts: [
    "Cada card representa uma previsão diária e pode mudar nas atualizações seguintes.",
    "Mínima, máxima, chance de chuva, volume e rajada respondem perguntas diferentes e devem ser lidos em conjunto.",
    "Alertas oficiais aparecem separadamente e não são extrapolados para datas sem aviso publicado.",
  ],
  faqs: [
    {
      question: "A previsão de 7 dias é confiável?",
      answer:
        "Ela é útil para planejamento, especialmente nos primeiros dias. Quanto mais distante a data, maior a possibilidade de ajustes.",
    },
    {
      question: "Por que um dia pode ter alta chance de chuva e pouco volume?",
      answer:
        "Probabilidade e quantidade são métricas distintas. Pode haver boa chance de ocorrência com acumulado baixo, ou uma chance menor associada a eventos mais localizados.",
    },
    {
      question: "O portal mostra alerta para toda a semana?",
      answer:
        "Não. Avisos oficiais só são exibidos quando a fonte publica validade e abrangência aplicáveis. O portal não cria alertas a partir da previsão.",
    },
  ],
  relatedLinks: [
    {
      label: "Previsão de amanhã",
      href: "/tempo-amanha-pelotas",
      description: "Aprofunde o próximo dia antes de tomar decisões práticas.",
    },
    {
      label: "Chuva em Pelotas",
      href: "/chuva-em-pelotas",
      description: "Veja probabilidade, volume e acumulados de precipitação.",
    },
    {
      label: "Vento em Pelotas",
      href: "/vento-em-pelotas",
      description: "Compare vento médio, direção e rajadas.",
    },
  ],
} as const satisfies EditorialContentDefinition;

export const RAIN_EDITORIAL_CONTENT = {
  eyebrow: "Chuva sem confusão",
  title: "Chance de chuva e volume previsto não são a mesma coisa",
  answer:
    "A probabilidade indica a chance de ocorrer precipitação no período; o volume em milímetros estima quanto pode acumular. Para entender o impacto potencial, compare os dois e mantenha chuva observada separada da previsão futura.",
  facts: [
    "Chuva observada vem de estação ou rede de medição identificada; chuva prevista vem de modelo meteorológico.",
    "Acumulados com janelas diferentes não devem ser somados automaticamente.",
    "Aviso de chuva do INMET é um produto oficial separado da medição e da previsão numérica.",
  ],
  faqs: [
    {
      question: "70% de chance significa que vai chover 70% do dia?",
      answer:
        "Não. O percentual expressa probabilidade de ocorrência no local e período considerados; não representa duração da chuva.",
    },
    {
      question: "Milímetros de chuva são chance de chuva?",
      answer:
        "Não. Milímetros representam quantidade acumulada ou prevista de água; chance é uma probabilidade.",
    },
    {
      question: "Onde vejo se há aviso oficial de chuva forte?",
      answer:
        "Na página de alertas, que preserva severidade, validade, abrangência e instruções publicadas pela fonte oficial.",
    },
  ],
  relatedLinks: [
    {
      label: "Alertas oficiais",
      href: "/alertas",
      description: "Confira avisos meteorológicos vigentes para Pelotas.",
    },
    {
      label: "Radar e satélite",
      href: "/radar-e-satelite-pelotas",
      description: "Acompanhe visualmente áreas de precipitação e nebulosidade.",
    },
    {
      label: "Tempo hoje em Pelotas",
      href: "/tempo-hoje-pelotas",
      description: "Veja a evolução prevista nas próximas horas.",
    },
  ],
} as const satisfies EditorialContentDefinition;

export const WIND_EDITORIAL_CONTENT = {
  eyebrow: "Vento e rajadas",
  title: "Vento médio e rajada descrevem comportamentos diferentes",
  answer:
    "A velocidade do vento ajuda a entender o fluxo predominante; a rajada representa picos mais fortes e curtos. Em atividades ao ar livre, navegação ou situações de tempo severo, a rajada pode ser mais relevante do que a média.",
  facts: [
    "Direção indica de onde o vento vem, seguindo a convenção meteorológica.",
    "Rajadas podem variar rapidamente e não significam que o vento permanece naquele pico durante todo o período.",
    "Aviso oficial de vento forte deve ser consultado separadamente quando publicado.",
  ],
  faqs: [
    {
      question: "Rajada e vento são a mesma coisa?",
      answer:
        "Não. A rajada é um aumento curto e mais intenso da velocidade; o vento médio descreve um comportamento mais sustentado.",
    },
    {
      question: "A direção do vento mostra para onde ele vai?",
      answer:
        "Na convenção meteorológica, a direção normalmente indica de onde o vento vem. Um vento sul, por exemplo, sopra a partir do sul.",
    },
    {
      question: "Onde vejo alerta de vento forte?",
      answer:
        "Consulte a página de alertas oficiais. O portal não cria um alerta apenas porque o modelo prevê rajadas elevadas.",
    },
  ],
  relatedLinks: [
    {
      label: "Alertas oficiais",
      href: "/alertas",
      description: "Confira avisos de vento e tempestade publicados para Pelotas.",
    },
    {
      label: "Radar e satélite",
      href: "/radar-e-satelite-pelotas",
      description: "Acompanhe sistemas meteorológicos na região.",
    },
    {
      label: "Chuva em Pelotas",
      href: "/chuva-em-pelotas",
      description: "Compare vento com chance e volume de precipitação.",
    },
  ],
} as const satisfies EditorialContentDefinition;

export const ALERTS_EDITORIAL_CONTENT = {
  eyebrow: "Avisos oficiais",
  title: "Como interpretar alertas meteorológicos para Pelotas",
  answer:
    "Avisos oficiais possuem evento, severidade, período de validade, área afetada e instruções próprias. O Tempo Pelotas organiza essas informações, mas não aumenta, reduz ou inventa a classificação publicada pela fonte.",
  facts: [
    "Severidade e instruções pertencem ao aviso oficial.",
    "Ausência de um aviso recuperado pelo portal não deve ser interpretada automaticamente como ausência de risco.",
    "Radar, previsão, trovoadas e medições podem complementar a compreensão do cenário, mas não substituem o alerta oficial.",
  ],
  faqs: [
    {
      question: "Quem emite os alertas mostrados pelo Tempo Pelotas?",
      answer:
        "Os avisos meteorológicos exibidos pelo portal são publicados por fontes oficiais identificadas, como o INMET, com seus próprios critérios e orientações.",
    },
    {
      question: "O Tempo Pelotas pode criar um alerta próprio?",
      answer:
        "O portal pode explicar observações e previsões, mas não deve apresentar uma interpretação própria como se fosse um aviso oficial.",
    },
    {
      question: "Se não aparece alerta, está tudo seguro?",
      answer:
        "Não necessariamente. Falhas de consulta, atraso de atualização ou mudanças rápidas podem ocorrer. Em situação de risco, consulte diretamente os canais oficiais e a Defesa Civil.",
    },
  ],
  relatedLinks: [
    {
      label: "Radar e satélite",
      href: "/radar-e-satelite-pelotas",
      description: "Veja produtos visuais que ajudam a acompanhar a evolução do tempo.",
    },
    {
      label: "Chuva em Pelotas",
      href: "/chuva-em-pelotas",
      description: "Compare chuva observada, chance e volume previsto.",
    },
    {
      label: "Vento em Pelotas",
      href: "/vento-em-pelotas",
      description: "Acompanhe vento médio, direção e rajadas.",
    },
  ],
} as const satisfies EditorialContentDefinition;

export const RADAR_EDITORIAL_CONTENT = {
  eyebrow: "Monitoramento visual",
  title: "Radar e satélite mostram o que está sendo observado, não uma previsão fechada",
  answer:
    "As imagens ajudam a localizar áreas de precipitação, nebulosidade e atividade convectiva no horário indicado. Elas devem ser lidas junto da previsão e dos alertas, sem transformar uma imagem isolada em diagnóstico automático do que acontecerá em Pelotas.",
  facts: [
    "Cada imagem mantém produto, fonte e horário próprios.",
    "Imagem de radar ou satélite atrasada deve ser identificada como tal.",
    "Atividade elétrica do STSC é monitoramento e não equivale a alerta oficial de tempestade.",
  ],
  faqs: [
    {
      question: "O radar mostra exatamente onde vai chover depois?",
      answer:
        "Ele mostra ecos observados no horário do quadro. A evolução futura exige previsão e acompanhamento das imagens seguintes.",
    },
    {
      question: "Satélite e radar são a mesma coisa?",
      answer:
        "Não. O satélite observa características das nuvens a partir do espaço; o radar detecta ecos relacionados à precipitação e outros alvos na área de cobertura.",
    },
    {
      question: "Trovoada no STSC significa alerta oficial?",
      answer:
        "Não. STSC é uma observação de atividade elétrica. Alertas oficiais possuem fonte, severidade, validade e instruções próprias.",
    },
  ],
  relatedLinks: [
    {
      label: "Alertas oficiais",
      href: "/alertas",
      description: "Confira avisos vigentes e orientações oficiais.",
    },
    {
      label: "Chuva em Pelotas",
      href: "/chuva-em-pelotas",
      description: "Veja chance, volume previsto e chuva observada.",
    },
    {
      label: "Tempo hoje em Pelotas",
      href: "/tempo-hoje-pelotas",
      description: "Compare o monitoramento visual com a previsão das próximas horas.",
    },
  ],
} as const satisfies EditorialContentDefinition;

export const LARANJAL_LEVEL_EDITORIAL_CONTENT = {
  eyebrow: "Nível da Lagoa dos Patos",
  title: "A leitura do Laranjal representa uma estação local",
  answer:
    "O nível exibido pertence à referência da Estação Laranjal e ajuda a acompanhar a evolução local da Lagoa dos Patos. Ele não deve ser comparado diretamente com réguas de outros municípios nem tratado isoladamente como confirmação de inundação.",
  facts: [
    "Sempre confira o horário da leitura e o estado de atualização.",
    "A tendência é calculada a partir da própria série recente do Laranjal.",
    "Outros pontos da Lagoa e do Guaíba são referências regionais, não substitutos da estação local.",
  ],
  faqs: [
    {
      question: "O nível do Laranjal é o nível de toda a Lagoa dos Patos?",
      answer:
        "Não. É uma medição local na referência da Estação Laranjal. Outros pontos da Lagoa podem apresentar valores e tendências diferentes.",
    },
    {
      question: "Posso comparar diretamente o Laranjal com Rio Grande ou Guaíba?",
      answer:
        "Não por simples subtração. Cada régua possui referência própria. A comparação mais segura observa tendência, horário e evolução de cada ponto.",
    },
    {
      question: "Nível alto significa inundação?",
      answer:
        "Não necessariamente. O impacto depende da referência da estação, da evolução, do vento, da drenagem e das condições locais. Para segurança, siga comunicados oficiais.",
    },
  ],
  relatedLinks: [
    {
      label: "Situação das águas em Pelotas",
      href: "/situacao-hidrologica-pelotas",
      description: "Veja o contexto regional da Lagoa, Guaíba e rios que influenciam o sistema.",
    },
    {
      label: "Chuva em Pelotas",
      href: "/chuva-em-pelotas",
      description: "Compare a evolução do nível com chuva observada e prevista.",
    },
    {
      label: "Vento em Pelotas",
      href: "/vento-em-pelotas",
      description: "Acompanhe direção e rajadas que podem influenciar a Lagoa.",
    },
  ],
} as const satisfies EditorialContentDefinition;

export const CLIMATE_EDITORIAL_CONTENT = {
  eyebrow: "Clima e estações do ano",
  title: "Clima descreve padrões de longo prazo, não a previsão de hoje",
  answer:
    "Climatologia resume o comportamento típico observado ao longo de períodos extensos. Ela ajuda a entender sazonalidade de temperatura, chuva e vento, mas não substitui a previsão para um dia específico.",
  facts: [
    "Normais climatológicas exigem séries longas e períodos padronizados.",
    "Um mês recente mais quente ou mais chuvoso não redefine sozinho o clima local.",
    "Previsão diária e climatologia respondem perguntas diferentes e devem permanecer separadas.",
  ],
  faqs: [
    {
      question: "Clima e tempo são a mesma coisa?",
      answer:
        "Não. Tempo descreve condições atmosféricas em períodos curtos; clima resume padrões observados ao longo de muitos anos.",
    },
    {
      question: "A página de clima diz se vai chover hoje?",
      answer:
        "Não. Para hoje, use a previsão diária e os dados observados. A página de clima explica comportamento sazonal e contexto de longo prazo.",
    },
    {
      question: "Trinta dias são suficientes para definir uma normal climatológica?",
      answer:
        "Não. Normais climatológicas usam períodos padronizados e séries muito mais longas.",
    },
  ],
  relatedLinks: [
    {
      label: "Histórico recente",
      href: "/historico-climatico-pelotas",
      description: "Compare os últimos dias sem confundir o recorte com normal climatológica.",
    },
    {
      label: "Estação Embrapa",
      href: "/estacao-embrapa-pelotas",
      description: "Veja observações meteorológicas locais identificadas.",
    },
    {
      label: "Tempo hoje em Pelotas",
      href: "/tempo-hoje-pelotas",
      description: "Consulte a previsão e a condição atual do dia.",
    },
  ],
} as const satisfies EditorialContentDefinition;

export const HISTORY_EDITORIAL_CONTENT = {
  eyebrow: "Histórico recente",
  title: "Histórico de 30 dias não é normal climatológica",
  answer:
    "O histórico recente ajuda a comparar dias quentes, frios, secos, chuvosos ou ventosos dentro da janela consultada. Ele não deve ser usado sozinho para concluir se o período foi normal ou recorde em relação ao clima de Pelotas.",
  facts: [
    "A fonte histórica e o período efetivamente disponível são identificados na página.",
    "Dados ausentes permanecem ausentes e não são preenchidos com zero.",
    "Recordes dentro de 30 dias são apenas extremos da janela, não recordes históricos oficiais do município.",
  ],
  faqs: [
    {
      question: "O dia mais quente dos últimos 30 dias é recorde de Pelotas?",
      answer:
        "Não. É apenas o maior valor dentro da janela consultada e da fonte usada pela página.",
    },
    {
      question: "Posso comparar diretamente esse histórico com uma normal climatológica?",
      answer:
        "Somente com cuidado e usando períodos e fontes compatíveis. A página não faz essa equivalência automaticamente.",
    },
    {
      question: "O que acontece se a fonte histórica falhar?",
      answer:
        "O portal pode usar dias já arquivados quando disponíveis e identifica explicitamente estados parciais, sem inventar números para completar a série.",
    },
  ],
  relatedLinks: [
    {
      label: "Clima de Pelotas",
      href: "/clima-em-pelotas",
      description: "Entenda padrões sazonais e a diferença entre clima e tempo.",
    },
    {
      label: "Estação Embrapa",
      href: "/estacao-embrapa-pelotas",
      description: "Consulte observações locais e extremos diários.",
    },
    {
      label: "Metodologia",
      href: "/metodologia",
      description: "Veja como o portal diferencia observação, previsão e histórico.",
    },
  ],
} as const satisfies EditorialContentDefinition;

export const EMBRAPA_STATION_EDITORIAL_CONTENT = {
  eyebrow: "Observação local",
  title: "O que a Estação Embrapa mostra sobre Pelotas",
  answer:
    "A estação fornece observações meteorológicas locais que o Tempo Pelotas usa para representar a condição medida quando a leitura está recente e utilizável. Campos indisponíveis permanecem ausentes e não são substituídos por previsão.",
  facts: [
    "Observação de estação e previsão de modelo permanecem separadas.",
    "O horário da leitura é parte essencial da informação e ajuda a identificar atraso.",
    "Extremos diários e acumulados pertencem à estação e ao período informado.",
  ],
  faqs: [
    {
      question: "A temperatura da Embrapa é uma previsão?",
      answer:
        "Não. Quando a estação está disponível, trata-se de uma observação medida. Previsões futuras aparecem em outras camadas do portal.",
    },
    {
      question: "O que acontece quando a estação fica indisponível?",
      answer:
        "O portal identifica a ausência ou atraso em vez de apresentar um valor de modelo como se tivesse sido medido pela estação.",
    },
    {
      question: "Os acumulados da estação representam toda Pelotas?",
      answer:
        "Não necessariamente. Eles representam a medição no ponto da estação e ajudam a contextualizar o município, mas a chuva pode variar entre bairros e áreas rurais.",
    },
  ],
  relatedLinks: [
    {
      label: "Tempo hoje em Pelotas",
      href: "/tempo-hoje-pelotas",
      description: "Veja a observação atual junto da previsão das próximas horas.",
    },
    {
      label: "Histórico recente",
      href: "/historico-climatico-pelotas",
      description: "Compare a evolução dos últimos dias.",
    },
    {
      label: "Metodologia",
      href: "/metodologia",
      description: "Entenda como a estação entra no contrato meteorológico do portal.",
    },
  ],
} as const satisfies EditorialContentDefinition;

export const FROST_EDITORIAL_CONTENT = {
  eyebrow: "Geada e frio",
  title: "Mapa de geadas é observação/registro e não deve ser confundido com previsão automática",
  answer:
    "O produto de geadas ajuda a identificar registros e contexto de frio conforme a fonte publicada. Ele não deve ser transformado em previsão de geada futura sem um contrato meteorológico específico que sustente essa afirmação.",
  facts: [
    "O horário e a data do produto devem acompanhar qualquer interpretação.",
    "Frio intenso favorece geada, mas temperatura prevista sozinha não confirma ocorrência em todo o estado.",
    "Avisos oficiais, quando existentes, permanecem separados do mapa.",
  ],
  faqs: [
    {
      question: "O mapa mostra onde vai gear amanhã?",
      answer:
        "Não necessariamente. A página identifica a natureza do produto exibido e não converte registro/monitoramento em previsão futura sem fonte adequada.",
    },
    {
      question: "Geada ocorre apenas quando a temperatura do ar chega a 0 °C?",
      answer:
        "Não. A formação depende também da temperatura junto à superfície, umidade, vento, nebulosidade e condições locais.",
    },
    {
      question: "Onde vejo a previsão de temperatura para Pelotas?",
      answer:
        "Use as páginas de hoje, amanhã ou 7 dias, conforme o horizonte desejado.",
    },
  ],
  relatedLinks: [
    {
      label: "Tempo hoje em Pelotas",
      href: "/tempo-hoje-pelotas",
      description: "Consulte a temperatura e a evolução das próximas horas.",
    },
    {
      label: "Previsão de 7 dias",
      href: "/previsao-7-dias-pelotas",
      description: "Compare mínimas e máximas da semana.",
    },
    {
      label: "Alertas oficiais",
      href: "/alertas",
      description: "Veja avisos meteorológicos publicados para Pelotas.",
    },
  ],
} as const satisfies EditorialContentDefinition;
