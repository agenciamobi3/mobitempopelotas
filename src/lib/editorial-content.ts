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
  | "/historico-climatico-pelotas"
  | "/mapa-de-geadas-rio-grande-do-sul"
  | "/meteograma-pelotas"
  | "/status-dos-dados"
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
    "O portal separa o que foi medido do que é previsto. O Agora usa uma estação meteorológica recente da Rede de Monitoramento Hidrometeorológico da Defesa Civil RS; previsões, alertas e imagens permanecem identificados por origem e finalidade.",
  facts: [
    "Condição atual: usa uma estação meteorológica recente da rede estadual e não apresenta previsão como se fosse observação.",
    "Previsão: usa o provedor meteorológico ativo e mantém os valores de modelo separados das medições.",
    "Risco: avisos oficiais do INMET e orientações das autoridades aparecem separados da interpretação editorial do portal.",
  ],
  faqs: [
    {
      question: "De onde vêm os dados do Tempo Pelotas?",
      answer:
        "A observação atual usa a Rede de Monitoramento Hidrometeorológico da Defesa Civil RS. O portal também consulta INMET, CPPMet/UFPel, REDEMET/DECEA e os provedores de previsão identificados em cada atualização.",
    },
    {
      question: "O Tempo Pelotas substitui os alertas oficiais?",
      answer:
        "Não. Em situações de risco, prevalecem os comunicados da Defesa Civil, do INMET e das autoridades competentes.",
    },
    {
      question: "Qual área o portal acompanha?",
      answer:
        "O foco principal é Pelotas e a Zona Sul do Rio Grande do Sul, com contexto para a Lagoa dos Patos, o Laranjal e sistemas meteorológicos que influenciam o município.",
    },
  ],
  relatedLinks: [
    {
      label: "Dados e fontes",
      href: "/status-dos-dados",
      description: "Veja como a Defesa Civil RS, previsão, alertas e demais fontes são usados.",
    },
    {
      label: "Radar e satélite",
      href: "/radar-e-satelite-pelotas",
      description: "Acompanhe a evolução regional de chuva, nuvens e trovoadas.",
    },
    {
      label: "Situação das águas",
      href: "/situacao-hidrologica-pelotas",
      description: "Consulte o contexto hidrológico regional e as estações disponíveis.",
    },
  ],
} satisfies EditorialContentDefinition;

export const TODAY_EDITORIAL_CONTENT = {
  eyebrow: "Resposta rápida",
  title: "Como interpretar o tempo de hoje em Pelotas",
  answer:
    "A página de hoje combina a observação mais recente da rede estadual com a previsão das próximas horas. Valores medidos e valores previstos permanecem em blocos e contratos distintos.",
  facts: [
    "Medição e previsão são exibidas separadamente para evitar confusão entre dado observado e valor estimado.",
    "Chance de chuva representa probabilidade; o volume em milímetros representa quantidade estimada para o período.",
    "A previsão pode mudar ao longo do dia conforme novas rodadas dos modelos e novas observações.",
  ],
  faqs: [
    {
      question: "A temperatura atual é uma previsão?",
      answer:
        "Quando existe estação recente e utilizável da Defesa Civil RS, a temperatura atual vem dessa observação. Se a medição estiver indisponível, o portal não preenche o Agora com um modelo de previsão.",
    },
    {
      question: "Chance de chuva e volume previsto são a mesma coisa?",
      answer:
        "Não. A chance indica a probabilidade de precipitação; o volume em milímetros estima quanto pode chover no período.",
    },
    {
      question: "Quando devo consultar a previsão novamente?",
      answer:
        "Consulte novamente antes de deslocamentos, eventos ou atividades ao ar livre, especialmente quando houver instabilidade, vento forte ou avisos oficiais ativos.",
    },
  ],
  relatedLinks: [
    {
      label: "Previsão para amanhã em Pelotas",
      href: "/tempo-amanha-pelotas",
      description: "Planeje o próximo dia com máxima, mínima, chuva e vento.",
    },
    {
      label: "Chuva em Pelotas",
      href: "/chuva-em-pelotas",
      description: "Veja chuva medida em janelas móveis e previsão por horário.",
    },
    {
      label: "Avisos meteorológicos oficiais",
      href: "/alertas",
      description: "Confira alertas vigentes e orientações de segurança.",
    },
  ],
} satisfies EditorialContentDefinition;

export const SEVEN_DAY_EDITORIAL_CONTENT = {
  eyebrow: "Planejamento semanal",
  title: "Como usar a previsão de 7 dias para Pelotas",
  answer:
    "A previsão semanal é mais útil para identificar tendências de temperatura, chuva e vento do que para definir horários exatos com muitos dias de antecedência. Quanto mais distante o dia, maior a possibilidade de ajuste.",
  facts: [
    "Os primeiros dias normalmente têm maior estabilidade do que o fim da janela de sete dias.",
    "Probabilidade de chuva, volume previsto e rajadas devem ser analisados em conjunto.",
    "Atividades sensíveis ao tempo devem ser confirmadas novamente nas páginas de hoje ou amanhã.",
  ],
  faqs: [
    {
      question: "A previsão de 7 dias é confiável?",
      answer:
        "Ela é adequada para acompanhar tendências, mas a precisão diminui com a distância temporal. Para decisões operacionais, confirme os dados mais perto do horário.",
    },
    {
      question: "Por que a previsão muda ao longo da semana?",
      answer:
        "Modelos recebem novas observações e recalculam a atmosfera várias vezes ao dia. Mudanças iniciais podem alterar chuva, temperatura e vento previstos.",
    },
    {
      question: "Qual dado devo observar primeiro?",
      answer:
        "Comece pela condição predominante e faixa de temperatura; depois compare chance e volume de chuva, rajadas e alertas oficiais.",
    },
  ],
  relatedLinks: [
    {
      label: "Tempo hoje em Pelotas",
      href: "/tempo-hoje-pelotas",
      description: "Veja observação atual e evolução das próximas horas.",
    },
    {
      label: "Tempo amanhã em Pelotas",
      href: "/tempo-amanha-pelotas",
      description: "Consulte a previsão detalhada para o próximo dia.",
    },
    {
      label: "Vento e rajadas em Pelotas",
      href: "/vento-em-pelotas",
      description: "Compare velocidade, direção e rajadas previstas.",
    },
  ],
} satisfies EditorialContentDefinition;

export const RAIN_EDITORIAL_CONTENT = {
  eyebrow: "Leitura da precipitação",
  title: "O que significam chuva medida, chance e milímetros previstos",
  answer:
    "A rede estadual publica acumulados observados em janelas móveis, como 1, 6 e 24 horas. A previsão informa probabilidade e volume futuro. Esses períodos não devem ser misturados nem somados automaticamente.",
  facts: [
    "Acumulado de 24 horas é uma janela móvel e não deve ser chamado de chuva do dia calendário.",
    "Probabilidade responde se pode chover; milímetros previstos ajudam a estimar quanto pode chover.",
    "Em risco de temporal, alagamento ou inundação, consulte os avisos oficiais e a situação hidrológica.",
  ],
  faqs: [
    {
      question: "O que significa 70% de chance de chuva?",
      answer:
        "Significa alta probabilidade estimada de precipitação no local e período indicados. O percentual não informa sozinho duração ou intensidade.",
    },
    {
      question: "O acumulado de 24 horas é a chuva de hoje?",
      answer:
        "Não necessariamente. Ele representa as 24 horas anteriores ao horário da leitura da estação, atravessando a meia-noite quando for o caso.",
    },
    {
      question: "A chuva prevista já foi medida?",
      answer:
        "Não. Valores futuros são estimativas dos modelos. As medições da rede estadual aparecem identificadas separadamente.",
    },
  ],
  relatedLinks: [
    {
      label: "Previsão completa de hoje",
      href: "/tempo-hoje-pelotas",
      description: "Compare chuva, temperatura, sensação térmica e vento.",
    },
    {
      label: "Radar e satélite meteorológico",
      href: "/radar-e-satelite-pelotas",
      description: "Observe a posição e evolução regional das áreas de chuva.",
    },
    {
      label: "Alertas de chuva e tempestade",
      href: "/alertas",
      description: "Consulte avisos oficiais vigentes para Pelotas.",
    },
  ],
} satisfies EditorialContentDefinition;

export const WIND_EDITORIAL_CONTENT = {
  eyebrow: "Leitura do vento",
  title: "Diferença entre velocidade do vento, direção e rajadas",
  answer:
    "A velocidade representa o vento médio no período; a rajada é um pico de curta duração. O Tempo Pelotas mantém essas grandezas separadas e não usa vento médio para preencher uma rajada ausente.",
  facts: [
    "Vento médio e rajada não são a mesma medida.",
    "A direção informa de onde o vento sopra e mantém a origem da estação ou do modelo indicada.",
    "Quando houver aviso oficial, a orientação de segurança prevalece sobre a interpretação geral da previsão.",
  ],
  faqs: [
    {
      question: "Qual é a diferença entre vento e rajada?",
      answer:
        "O vento é a velocidade média em um intervalo; a rajada é um aumento breve e mais intenso. Se a fonte não informar rajada, o portal mantém esse campo indisponível.",
    },
    {
      question: "O que significa a direção do vento?",
      answer:
        "A direção indica de onde o vento sopra. Vento sul, por exemplo, vem do sul em direção ao norte.",
    },
    {
      question: "Quando o vento exige atenção?",
      answer:
        "Atenção é necessária quando as rajadas aumentam, existem estruturas vulneráveis ou há avisos oficiais. Consulte a evolução horária antes de atividades externas ou náuticas.",
    },
  ],
  relatedLinks: [
    {
      label: "Tempo hoje em Pelotas",
      href: "/tempo-hoje-pelotas",
      description: "Veja medição atual e previsão para as próximas horas.",
    },
    {
      label: "Previsão para os próximos 7 dias",
      href: "/previsao-7-dias-pelotas",
      description: "Compare rajadas e tendências ao longo da semana.",
    },
    {
      label: "Avisos meteorológicos oficiais",
      href: "/alertas",
      description: "Verifique alertas relacionados a vento forte e tempestades.",
    },
  ],
} satisfies EditorialContentDefinition;

export const RADAR_EDITORIAL_CONTENT = {
  eyebrow: "Monitoramento por imagem",
  title: "Como interpretar radar, satélite e registros de trovoadas",
  answer:
    "O radar ajuda a localizar ecos associados à precipitação; o satélite mostra nuvens e seus topos; registros de trovoadas indicam atividade elétrica. São produtos complementares e mantêm o horário real da fonte.",
  facts: [
    "O horário de cada quadro é essencial: imagens antigas não representam necessariamente a situação atual.",
    "Nuvens visíveis no satélite não significam, por si só, chuva no solo em Pelotas.",
    "Radar, satélite e trovoadas não substituem alertas oficiais nem medições das estações.",
  ],
  faqs: [
    {
      question: "O radar mostra se está chovendo exatamente no meu bairro?",
      answer:
        "Ele oferece visão regional com resolução e alcance limitados. Confirme a situação com observações próximas e avisos oficiais.",
    },
    {
      question: "Uma nuvem no satélite significa chuva?",
      answer:
        "Não necessariamente. Para avaliar precipitação, compare satélite, radar, previsão e observações próximas.",
    },
    {
      question: "Registro de trovoada é o mesmo que alerta meteorológico?",
      answer:
        "Não. Ele indica atividade elétrica detectada; alertas oficiais possuem critérios próprios de risco, abrangência e validade.",
    },
  ],
  relatedLinks: [
    {
      label: "Chuva em Pelotas",
      href: "/chuva-em-pelotas",
      description: "Compare imagens regionais com chuva medida e prevista.",
    },
    {
      label: "Avisos meteorológicos oficiais",
      href: "/alertas",
      description: "Verifique severidade, abrangência e período dos avisos.",
    },
    {
      label: "Dados e fontes",
      href: "/status-dos-dados",
      description: "Entenda origem, atualização e limites de cada produto.",
    },
  ],
} satisfies EditorialContentDefinition;

export const HISTORY_EDITORIAL_CONTENT = {
  eyebrow: "Contexto recente",
  title: "Como interpretar o histórico dos últimos 30 dias",
  answer:
    "O histórico reúne dias completos recentes para mostrar o que ocorreu segundo a fonte identificada. Ele ajuda a comparar máximas, mínimas, chuva e rajadas, mas não substitui uma normal climatológica de longo prazo.",
  facts: [
    "Histórico descreve o passado; previsão estima o futuro.",
    "Trinta dias mostram um período recente, não definem sozinhos o clima de Pelotas.",
    "Falhas ou lacunas da fonte permanecem explícitas e não são preenchidas com valores inventados.",
  ],
  faqs: [
    {
      question: "O histórico climático é uma previsão?",
      answer:
        "Não. A página apresenta dados de dias já concluídos. Para condições futuras, consulte hoje, amanhã e sete dias.",
    },
    {
      question: "Os últimos 30 dias representam o clima normal de Pelotas?",
      answer:
        "Não. Normais climatológicas exigem séries longas e metodologia específica.",
    },
    {
      question: "Por que a máxima diária difere da temperatura atual?",
      answer:
        "A máxima é o maior valor registrado durante um dia completo. A temperatura atual corresponde a uma leitura em um horário específico.",
    },
  ],
  relatedLinks: [
    {
      label: "Dados e fontes",
      href: "/status-dos-dados",
      description: "Veja como a observação atual da Defesa Civil RS e as séries históricas são tratadas.",
    },
    {
      label: "Previsão para os próximos 7 dias",
      href: "/previsao-7-dias-pelotas",
      description: "Compare o período recente com a tendência futura.",
    },
    {
      label: "Tempo hoje em Pelotas",
      href: "/tempo-hoje-pelotas",
      description: "Consulte a observação recente e as próximas horas.",
    },
  ],
} satisfies EditorialContentDefinition;

export const CAMERAS_EDITORIAL_CONTENT = {
  eyebrow: "Observação visual",
  title: "Como usar as câmeras para acompanhar o tempo em Pelotas",
  answer:
    "As câmeras oferecem contexto visual sobre céu, visibilidade e superfície em pontos específicos. Elas complementam radar, estações e previsão, mas uma imagem não mede temperatura, vento, chuva ou nível da água.",
  facts: [
    "Uma transmissão só deve ser tratada como ao vivo quando o estado e o horário indicarem atualização recente.",
    "Lente molhada, neblina, reflexos, posição e iluminação podem alterar a percepção da imagem.",
    "Condições observadas em um ponto não representam automaticamente toda Pelotas ou toda a orla.",
  ],
  faqs: [
    {
      question: "Todas as câmeras estão sempre ao vivo?",
      answer:
        "Não. O portal informa o estado conhecido de cada transmissão e não converte imagem estática em sinal ao vivo.",
    },
    {
      question: "A câmera confirma que está chovendo em Pelotas?",
      answer:
        "Ela pode mostrar chuva aparente no ponto enquadrado, mas não mede intensidade nem abrangência. Compare com radar e estações.",
    },
    {
      question: "A imagem substitui os dados meteorológicos?",
      answer:
        "Não. Câmeras são apoio visual. Decisões de segurança devem considerar medições, avisos e informações das autoridades.",
    },
  ],
  relatedLinks: [
    {
      label: "Tempo hoje em Pelotas",
      href: "/tempo-hoje-pelotas",
      description: "Compare a imagem com observação e previsão horária.",
    },
    {
      label: "Radar e satélite",
      href: "/radar-e-satelite-pelotas",
      description: "Acompanhe nuvens, precipitação e trovoadas na região.",
    },
    {
      label: "Nível da Lagoa no Laranjal",
      href: "/nivel-da-lagoa-dos-patos-laranjal",
      description: "Consulte a telemetria pública e a tendência recente da água.",
    },
  ],
} satisfies EditorialContentDefinition;

export const HYDROLOGY_EDITORIAL_CONTENT = {
  eyebrow: "Leitura das águas",
  title: "Como interpretar a situação hidrológica de Pelotas",
  answer:
    "A página reúne leituras de estações e contexto meteorológico para acompanhar a Lagoa dos Patos e sistemas relacionados. Cada estação possui localização, referência e horário próprios.",
  facts: [
    "A tendência recente ajuda a identificar subida, estabilidade ou descida, mas não é uma previsão garantida do nível futuro.",
    "Vento, chuva, descargas fluviais e circulação da Lagoa podem influenciar níveis em escalas e locais diferentes.",
    "Situações de inundação ou emergência devem ser avaliadas pelos órgãos responsáveis e comunicados oficiais.",
  ],
  faqs: [
    {
      question: "O nível é igual em toda a Lagoa dos Patos?",
      answer:
        "Não. Vento, geometria da lagoa, afluentes e localização provocam diferenças entre estações.",
    },
    {
      question: "Um nível em elevação significa que haverá inundação?",
      answer:
        "Não necessariamente. O impacto depende de cotas locais, duração, vento, chuva, drenagem e orientações oficiais.",
    },
    {
      question: "Qual é a relação entre tempo e nível da água?",
      answer:
        "Chuva contribui para vazões e volumes, enquanto ventos persistentes podem represar ou deslocar água na Lagoa dos Patos.",
    },
  ],
  relatedLinks: [
    {
      label: "Nível da Lagoa no Laranjal",
      href: "/nivel-da-lagoa-dos-patos-laranjal",
      description: "Veja a leitura local e evolução das últimas horas.",
    },
    {
      label: "Avisos meteorológicos oficiais",
      href: "/alertas",
      description: "Consulte alertas associados a chuva, vento e tempestades.",
    },
    {
      label: "Dados e fontes",
      href: "/status-dos-dados",
      description: "Conheça as redes, referências e limites das integrações.",
    },
  ],
} satisfies EditorialContentDefinition;

export const LARANJAL_LEVEL_EDITORIAL_CONTENT = {
  eyebrow: "Telemetria no Laranjal",
  title: "O que significa a leitura do nível da Lagoa no Laranjal",
  answer:
    "A leitura representa o nível registrado pela Estação Laranjal no horário informado e segundo a referência publicada pela fonte. A evolução recente ajuda a identificar tendência local, mas não confirma alagamento ou inundação por si só.",
  facts: [
    "Telemetria pode sofrer atrasos, interrupções ou correções; a última atualização deve acompanhar qualquer leitura.",
    "Uma variação curta pode refletir vento, oscilação local ou ruído; a sequência de leituras é mais informativa do que um ponto isolado.",
    "Em condição de risco, siga a Defesa Civil, autoridades municipais e comunicados oficiais.",
  ],
  faqs: [
    {
      question: "O que representa o número exibido para o Laranjal?",
      answer:
        "Ele representa a leitura da estação no referencial utilizado pela fonte. Não deve ser comparado diretamente com outras réguas sem datum compatível.",
    },
    {
      question: "Com que frequência o nível é atualizado?",
      answer:
        "A frequência depende da fonte e disponibilidade da telemetria. O portal apresenta o horário da última leitura válida.",
    },
    {
      question: "Um valor alto confirma inundação no Laranjal?",
      answer:
        "Não por si só. O impacto depende da referência local, tendência, vento, drenagem e condições em cada trecho.",
    },
  ],
  relatedLinks: [
    {
      label: "Situação das águas em Pelotas",
      href: "/situacao-hidrologica-pelotas",
      description: "Compare a leitura local com a rede regional e o contexto meteorológico.",
    },
    {
      label: "Avisos meteorológicos oficiais",
      href: "/alertas",
      description: "Confira alertas vigentes de chuva, vento e tempestade.",
    },
    {
      label: "Câmeras do Laranjal",
      href: "/cameras-ao-vivo-pelotas",
      description: "Use observação visual como complemento, sem substituir a telemetria.",
    },
  ],
} satisfies EditorialContentDefinition;
