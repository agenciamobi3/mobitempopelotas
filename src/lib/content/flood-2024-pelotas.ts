export type Flood2024Stage =
  | "centro-norte"
  | "rios"
  | "guaiba"
  | "lagoa"
  | "pelotas"
  | "estuario"
  | "retorno";

export type Flood2024TimelineItem = {
  date: string;
  title: string;
  stage: Flood2024Stage;
  stageLabel: string;
  paragraphs: string[];
  highlight?: string;
};

export const FLOOD_2024_HYDROLOGICAL_PATH = [
  "Centro e Norte do RS",
  "Taquari, Caí, Sinos, Jacuí e outros rios",
  "Guaíba — Porto Alegre",
  "Lagoa dos Patos",
  "Itapuã",
  "Arambaré",
  "São Lourenço do Sul",
  "Pelotas — Laranjal",
  "São José do Norte e Rio Grande",
  "Oceano Atlântico",
] as const;

export const FLOOD_2024_TIMELINE: Flood2024TimelineItem[] = [
  {
    date: "26 de abril de 2024",
    title: "Começam os primeiros alertas de chuva forte",
    stage: "centro-norte",
    stageLabel: "Centro e Norte do RS",
    paragraphs: [
      "O INMET já indicava a possibilidade de muita chuva no Rio Grande do Sul. As condições para chuva forte continuariam nos dias seguintes.",
      "Em 29 de abril foi emitido o primeiro aviso vermelho, com previsão de mais de 100 milímetros em 24 horas em uma grande área do Estado.",
    ],
  },
  {
    date: "28 de abril a 2 de maio",
    title: "Chuva excepcional atinge o Centro e o Norte do Estado",
    stage: "centro-norte",
    stageLabel: "Centro e Norte do RS",
    paragraphs: [
      "A chuva mais intensa se concentrou principalmente nas regiões dos rios que alimentam o sistema do Guaíba.",
      "Em partes do Rio Grande do Sul, choveram centenas de milímetros em poucos dias. Estudos posteriores classificaram o episódio como excepcional pela força e pela grande área atingida.",
      "Rios começaram a subir rapidamente e várias cidades tiveram enchentes e enxurradas. Em Pelotas, o principal efeito ainda levaria alguns dias para chegar.",
    ],
  },
  {
    date: "1º e 2 de maio",
    title: "Rios sobem rapidamente e a água segue para o Guaíba",
    stage: "rios",
    stageLabel: "Rios da Bacia do Guaíba",
    paragraphs: [
      "Santa Maria registrou 213,6 mm de chuva em um único dia em 1º de maio, recorde da estação em 112 anos. No dia seguinte, Caxias do Sul registrou 266,2 mm.",
      "A água recebida por rios como Taquari, Caí, Sinos e Jacuí avançou em direção à Região Metropolitana e ao Guaíba.",
      "Em 2 de maio, Pelotas já iniciou ações preventivas. A Prefeitura alertou que a água que inundava outras regiões poderia chegar depois à Lagoa dos Patos.",
    ],
  },
  {
    date: "3 de maio",
    title: "Pelotas começa a se preparar para a cheia",
    stage: "guaiba",
    stageLabel: "Guaíba → Lagoa dos Patos",
    paragraphs: [
      "A Defesa Civil Estadual alertou para a possível subida da Lagoa dos Patos por causa da água vinda da Região Metropolitana.",
      "Pelotas começou a preparar abrigos e acompanhar áreas mais vulneráveis, como Colônia Z3, Pontal da Barra, Laranjal e regiões próximas ao Canal São Gonçalo.",
      "Famílias da Z3 começaram a retirar móveis de casa antes da chegada da água.",
    ],
  },
  {
    date: "5 de maio",
    title: "Guaíba atinge 5,35 m no Cais Mauá",
    stage: "guaiba",
    stageLabel: "Guaíba — Porto Alegre",
    paragraphs: [
      "Às 5h30, a estação Cais Mauá registrou 5,35 metros no Guaíba, acima do recorde histórico associado à enchente de 1941.",
      "Grande parte desse volume seguiria para a Lagoa dos Patos, o caminho natural da água em direção ao sul.",
    ],
    highlight: "5,35 m no Cais Mauá às 5h30",
  },
  {
    date: "7 de maio",
    title: "ANA alerta para uma cheia histórica na Lagoa dos Patos",
    stage: "lagoa",
    stageLabel: "Lagoa dos Patos",
    paragraphs: [
      "A Agência Nacional de Águas passou a destacar o monitoramento de Arambaré, São Lourenço do Sul, Pelotas e Rio Grande.",
      "A ANA alertava que a cheia na Lagoa dos Patos e nas regiões de Pelotas e Rio Grande poderia superar o evento de 2023 e também a grande referência histórica de 1941.",
      "O problema já não estava concentrado em Porto Alegre: a água avançava pelo sistema da Lagoa.",
    ],
  },
  {
    date: "8 de maio",
    title: "O risco aumenta no Laranjal",
    stage: "pelotas",
    stageLabel: "Pelotas e Laranjal",
    paragraphs: [
      "O Cemaden registrou a Lagoa dos Patos em 2,15 metros em Pelotas e indicou risco muito alto de inundação severa em municípios próximos à Lagoa, incluindo Pelotas.",
      "O órgão destacou que vento, maré, nível da Lagoa e água vinda de outros rios ainda poderiam mudar o comportamento da cheia.",
      "No Laranjal, a situação piorou. A região da Nova Prata, no Valverde, entrou em processo de evacuação.",
      "A UBS Laranjal foi atingida e precisou fechar. Depois, foi constatado que a água chegou a aproximadamente 70 centímetros dentro da unidade.",
      "Nesse mesmo dia foi organizada a Sala de Situação Municipal, no 9º Batalhão de Infantaria Motorizado.",
    ],
  },
  {
    date: "9 de maio",
    title: "Evacuações aumentam no Valverde",
    stage: "pelotas",
    stageLabel: "Pelotas — Laranjal",
    paragraphs: [
      "A Defesa Civil retirou moradores da rua Nova Prata, no balneário Valverde.",
      "A ação envolveu cerca de 60 moradores de 15 casas em uma área considerada de alto risco. A água continuava avançando.",
    ],
  },
  {
    date: "10 de maio",
    title: "Valverde é tomado pela água",
    stage: "pelotas",
    stageLabel: "Laranjal e Canal São Gonçalo",
    paragraphs: [
      "O Laranjal entrou em uma das fases mais graves da enchente.",
      "Desde a madrugada, Bombeiros, Defesa Civil e Exército resgatavam moradores e animais ilhados no Valverde. Em alguns pontos, a água se aproximava de 1,5 metro de profundidade.",
      "Ao meio-dia, o Canal São Gonçalo chegou a 2,72 metros, depois de subir 36 centímetros em cerca de 24 horas.",
      "Ventos de leste e sudeste dificultavam a saída da água da Lagoa para o oceano e ajudavam a manter a água acumulada na região.",
    ],
    highlight: "Canal São Gonçalo: 2,72 m ao meio-dia",
  },
  {
    date: "11 de maio",
    title: "UFPel prevê a chegada do maior volume vindo do Guaíba",
    stage: "lagoa",
    stageLabel: "Lagoa dos Patos → Pelotas",
    paragraphs: [
      "Simulações feitas por pesquisadores da UFPel indicaram que uma parte importante da água vinda do sistema do Guaíba chegaria a Pelotas principalmente entre 13 e 15 de maio.",
      "Os pesquisadores explicaram que, por causa do relevo muito plano de Pelotas, a água tenderia a avançar mais devagar e se espalhar pelas áreas baixas, diferente das enxurradas rápidas vistas na Serra.",
    ],
  },
  {
    date: "12 de maio",
    title: "Canal São Gonçalo chega à marca de 1941",
    stage: "pelotas",
    stageLabel: "Canal São Gonçalo",
    paragraphs: [
      "Às 19h, a régua do Porto de Pelotas registrou 2,88 metros.",
      "Era a mesma marca associada à enchente de 1941, ocorrida 83 anos antes.",
      "Áreas próximas ao Canal entraram em alerta máximo e a Prefeitura reforçou a necessidade de evacuação. Vento, chuva e maré ainda influenciavam o nível da água.",
    ],
    highlight: "2,88 m — mesma marca de referência de 1941",
  },
  {
    date: "13 a 15 de maio",
    title: "Chega uma parte importante da água vinda do norte da Lagoa",
    stage: "pelotas",
    stageLabel: "Lagoa dos Patos → Pelotas",
    paragraphs: [
      "Esse era o período apontado pelas simulações da UFPel para a chegada de uma parte importante do volume vindo do Guaíba.",
      "A cheia já atingia diretamente Valverde, Santo Antônio, Colônia Z3 e outras áreas baixas de Pelotas.",
      "Nesse momento, não era apenas a chuva local ou o vento: a própria Lagoa dos Patos estava excepcionalmente cheia.",
    ],
  },
  {
    date: "15 de maio",
    title: "Canal passa da marca de 1941",
    stage: "pelotas",
    stageLabel: "Canal São Gonçalo",
    paragraphs: [
      "Às 21h, o Canal São Gonçalo registrou 2,89 metros.",
      "Pela primeira vez naquele evento, a medição passou da referência de 2,88 metros associada a 1941.",
      "Pesquisadores apontaram que o grande volume já acumulado na Lagoa podia manter os níveis altos mesmo sem chuva ou vento forte naquele momento.",
      "A água que chegava pelo sistema Guaíba–Lagoa saía por Rio Grande mais devagar do que entrava no sistema.",
    ],
    highlight: "2,89 m no Canal São Gonçalo às 21h",
  },
  {
    date: "16 de maio",
    title: "São Gonçalo passa dos três metros",
    stage: "estuario",
    stageLabel: "São Gonçalo e saída por Rio Grande",
    paragraphs: [
      "Durante a madrugada, o Canal São Gonçalo chegou a 3,00 metros. Ao meio-dia, atingiu 3,02 metros.",
      "O nível já passava das referências históricas usadas durante a emergência em Pelotas.",
      "Pesquisadores também observaram que a maré permanecia elevada havia mais de 36 horas na região de saída da Lagoa.",
      "Com a saída por Rio Grande dificultada, a água se acumulava na Lagoa dos Patos e também dificultava a baixa do Canal São Gonçalo.",
    ],
    highlight: "3,02 m no Canal São Gonçalo ao meio-dia",
  },
  {
    date: "17 a 21 de maio",
    title: "A água continua muito alta por vários dias",
    stage: "lagoa",
    stageLabel: "Lagoa dos Patos e São Gonçalo",
    paragraphs: [
      "Os níveis não voltaram rapidamente ao normal.",
      "A Lagoa dos Patos havia recebido um volume enorme de água, e essa água precisava de tempo para seguir em direção ao oceano.",
      "Em 21 de maio, Lagoa e São Gonçalo estavam relativamente estáveis, mas ainda altos. A previsão de mais chuva e mudanças no vento mantinha Pelotas em alerta.",
    ],
  },
  {
    date: "22 a 24 de maio",
    title: "Nova chuva agrava a situação",
    stage: "pelotas",
    stageLabel: "Pelotas",
    paragraphs: [
      "Pelotas voltou a receber muita chuva.",
      "Entre o dia 22 e a manhã do dia 24, os acumulados ficaram entre aproximadamente 130 e 160 milímetros, chegando a 167 mm em uma estação do Sanep.",
      "O solo já estava encharcado, Lagoa e Canal continuavam altos e a drenagem da cidade trabalhava sob forte pressão. Novas áreas entraram em risco máximo.",
      "A enchente entrou em uma segunda fase crítica.",
    ],
  },
  {
    date: "26 de maio",
    title: "Canal São Gonçalo chega a 3,04 m",
    stage: "pelotas",
    stageLabel: "Canal São Gonçalo",
    paragraphs: [
      "Quando parecia que o pior nível já havia passado, o Canal voltou a subir.",
      "O São Gonçalo chegou a 3,04 metros, o maior valor registrado pela régua usada pela Prefeitura durante a emergência.",
      "Mais de três semanas depois dos primeiros alertas para Pelotas, a cidade ainda enfrentava níveis extremos.",
    ],
    highlight: "3,04 m — maior valor registrado pela régua usada na emergência",
  },
  {
    date: "Final de maio",
    title: "A enchente ainda não tinha terminado",
    stage: "pelotas",
    stageLabel: "Pelotas e Laranjal",
    paragraphs: [
      "Em 29 de maio, uma vistoria identificou o Valverde como uma das áreas mais atingidas pelo avanço da Lagoa dos Patos.",
      "No dia 30, mesmo depois do período mais crítico, os níveis continuavam altos: Canal São Gonçalo em 2,89 m e Lagoa dos Patos no Trapiche em 2,30 m.",
      "A água baixava devagar.",
    ],
  },
  {
    date: "1º de junho",
    title: "Ainda não era possível retirar toda a água do Laranjal",
    stage: "retorno",
    stageLabel: "Laranjal — drenagem limitada",
    paragraphs: [
      "Mesmo com a cheia diminuindo, grandes áreas do Laranjal continuavam alagadas.",
      "Na manhã de 1º de junho, a Lagoa dos Patos no Trapiche marcou 2,43 metros.",
      "Com a Lagoa ainda muito alta, era difícil bombear para fora a água que havia ficado acumulada nos balneários.",
    ],
  },
  {
    date: "2 de junho",
    title: "A drenagem começa a funcionar melhor",
    stage: "retorno",
    stageLabel: "Laranjal — início da drenagem",
    paragraphs: [
      "Com a Lagoa dos Patos recuando para aproximadamente 2,21 metros, foi possível retomar a casa de bombas do Pontal da Barra.",
      "Bombas adicionais foram instaladas para retirar a água acumulada em Santo Antônio e Valverde.",
      "Aos poucos, o principal problema deixou de ser a entrada de água da Lagoa e passou a ser retirar a água que havia ficado presa dentro dos bairros.",
    ],
  },
  {
    date: "6 de junho",
    title: "Termina a fase mais crítica da operação",
    stage: "retorno",
    stageLabel: "Pelotas — início da reconstrução",
    paragraphs: [
      "Depois de 28 dias, foram encerradas as atividades coletivas da Sala de Situação Municipal.",
      "Os níveis da Lagoa e do Canal estavam baixando e Pelotas entrava em uma nova etapa: a reconstrução.",
      "Mesmo assim, Laranjal e áreas próximas ainda apareciam em vermelho no mapa de risco porque alguns moradores não conseguiam voltar para casa.",
    ],
    highlight: "28 dias de operação da Sala de Situação Municipal",
  },
  {
    date: "7 de junho",
    title: "Famílias começam a voltar ao Laranjal",
    stage: "retorno",
    stageLabel: "Laranjal — retorno gradual",
    paragraphs: [
      "A drenagem começou a apresentar resultados mais claros nos balneários.",
      "Famílias voltaram para casa e iniciaram a limpeza dos imóveis.",
      "O Pontal da Barra ainda era uma das áreas do Laranjal com água acumulada e precisava de drenagem específica.",
    ],
  },
  {
    date: "Junho de 2024",
    title: "Começa a reconstrução",
    stage: "retorno",
    stageLabel: "Reconstrução",
    paragraphs: [
      "A fase de maior emergência perdeu força, mas os danos continuaram.",
      "Casas, comércios, equipamentos públicos, estradas e serviços precisavam ser recuperados.",
      "Moradores afetados começaram a ser cadastrados para programas de auxílio e reconstrução. Até 6 de junho, Pelotas já havia encaminhado mais de 3,7 mil registros ao Auxílio Reconstrução, com muitos moradores da Z3, Valverde e Santo Antônio.",
    ],
  },
  {
    date: "1º de julho",
    title: "UBS Laranjal volta a funcionar",
    stage: "retorno",
    stageLabel: "Laranjal — recuperação",
    paragraphs: [
      "Depois de 54 dias fechada, a Unidade Básica de Saúde do Laranjal reabriu.",
      "A enchente havia deixado aproximadamente 70 centímetros de água dentro do prédio e atingido móveis, equipamentos e a rede elétrica.",
      "A reabertura marcou mais uma etapa da recuperação do bairro.",
    ],
    highlight: "54 dias até a reabertura da UBS Laranjal",
  },
];

export const FLOOD_2024_SOURCE_ORGANIZATIONS = [
  "Agência Nacional de Águas e Saneamento Básico (ANA)",
  "Serviço Geológico do Brasil (SGB)",
  "Cemaden",
  "INMET",
  "Universidade Federal de Pelotas (UFPel)",
  "Prefeitura Municipal de Pelotas",
  "Defesa Civil",
] as const;