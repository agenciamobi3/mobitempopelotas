export type Flood2001Source = {
  name: string;
  organization: string;
  date: string;
  url: string;
  role: string;
};

export type Flood2001TimelineItem = {
  date: string;
  title: string;
  stageLabel: string;
  paragraphs: string[];
  highlight?: string;
};

export const FLOOD_2001_KEY_FACTS = [
  {
    label: "Evento documentado",
    value: "08/10/2001",
    detail: "madrugada do episódio classificado como ciclone extratropical pela reportagem contemporânea",
  },
  {
    label: "Vento em Pelotas",
    value: "105 km/h",
    detail: "valor publicado pela Folha de S.Paulo em 09/10/2001",
  },
  {
    label: "Avanço no Laranjal",
    value: "~600 m",
    detail: "seis quadras para dentro da área urbana, segundo a reportagem contemporânea",
  },
  {
    label: "Colônia Z3",
    value: "~3.000 isolados",
    detail: "estimativa publicada durante o evento; não equivale a número de desabrigados",
  },
] as const;

export const FLOOD_2001_TIMELINE: Flood2001TimelineItem[] = [
  {
    date: "8 de outubro de 2001 · madrugada",
    title: "Vento extremo e avanço das águas atingem Pelotas",
    stageLabel: "Ciclone extratropical + Lagoa dos Patos",
    paragraphs: [
      "A Folha de S.Paulo publicou no dia seguinte, atribuindo a classificação a meteorologistas, que um ciclone extratropical atingiu o Rio Grande do Sul durante a madrugada de 8 de outubro.",
      "Em Pelotas, a reportagem registrou vento de 105 km/h. Na Lagoa dos Patos, as ondas chegavam a aproximadamente um metro durante o episódio.",
      "No Laranjal, as águas avançaram seis quadras, cerca de 600 metros, para dentro da área urbana. Na Colônia de Pescadores Z3, aproximadamente 3 mil pessoas ficaram isoladas.",
    ],
    highlight: "105 km/h em Pelotas · avanço de aproximadamente 600 m no Laranjal · cerca de 3 mil isolados na Z3",
  },
  {
    date: "9 de outubro de 2001",
    title: "A imprensa nacional registra o episódio e seus impactos locais",
    stageLabel: "Registro contemporâneo",
    paragraphs: [
      "A matéria da Folha é, até agora, a fonte contemporânea localizada que fornece a classificação meteorológica e os principais valores quantitativos do episódio em Pelotas.",
      "Por essa razão, a expressão “ciclone extratropical”, os 105 km/h e os números de avanço das águas e isolamento permanecem explicitamente atribuídos a essa fonte, e não à Prefeitura.",
    ],
  },
  {
    date: "22 de outubro de 2001",
    title: "Prefeitura documenta danos e recuperação no Laranjal",
    stageLabel: "Fonte municipal contemporânea",
    paragraphs: [
      "Duas semanas depois do episódio, a Prefeitura descreveu os problemas no Laranjal como consequências dos fortes ventos e da invasão das águas do Canal São Gonçalo e da Lagoa dos Patos.",
      "O Município informou que recuperava estragos causados pelos vendavais de outubro, com limpeza da beira da Lagoa, recuperação de acessos e infraestrutura e retirada de entulhos.",
      "Na terceira via de acesso ao balneário, com passagem direta ao Valverde e ao Pontal da Barra, retroescavadeiras também trabalhavam na drenagem dos banhados em direção ao Canal São Gonçalo.",
    ],
    highlight: "A Prefeitura confirma oficialmente vento forte, invasão das águas, danos e recuperação, mas não usa a classificação meteorológica “ciclone extratropical”.",
  },
  {
    date: "até 4 de novembro de 2001",
    title: "Recuperação ainda mobilizava obras semanas depois",
    stageLabel: "Recuperação do balneário",
    paragraphs: [
      "O comunicado municipal de 22 de outubro previa que o mutirão e as obras de recuperação no Laranjal prosseguiriam até 4 de novembro.",
      "A duração das intervenções ajuda a documentar que o impacto não se limitou à passagem do vento: acessos, áreas alagadas e infraestrutura ainda exigiam trabalho semanas depois.",
    ],
  },
  {
    date: "18 de outubro de 2002 · memória do evento",
    title: "Prefeitura relembra o “nordestão” de 2001",
    stageLabel: "Fonte municipal retrospectiva",
    paragraphs: [
      "Ao noticiar uma nova invasão das águas em 2002, a Prefeitura relembrou que em outubro do ano anterior a força do “nordestão”, expressão usada por pescadores para o vento nordeste forte, havia deixado a Z3 isolada e causado danos nos balneários.",
      "O registro ajuda a preservar a linguagem local usada para descrever o vento, mas não deve ser confundido com a classificação atmosférica em escala maior publicada pela Folha.",
    ],
  },
];

export const FLOOD_2001_RESEARCH_GAPS = [
  "Ainda não foi localizada uma série diária de níveis da Lagoa dos Patos ou do Canal São Gonçalo comparável aos boletins disponíveis para 2015.",
  "Não há, nesta fase, uma cota máxima calibrada e documentada que possa ser comparada diretamente às réguas atuais.",
  "Ainda buscamos boletins meteorológicos oficiais da época que detalhem o sistema atmosférico sobre Pelotas e a Lagoa dos Patos.",
  "Acervos da Biblioteca Pública, Defesa Civil, Sanep, UFPel, Embrapa, FURG, Marinha e imprensa local podem ampliar a cronologia, os impactos e a documentação fotográfica.",
] as const;

export const FLOOD_2001_SOURCES: Flood2001Source[] = [
  {
    name: "Laranjal: recuperação vai até o dia 4",
    organization: "Prefeitura Municipal de Pelotas",
    date: "22/10/2001",
    url: "https://www.pelotas.com.br/noticia/laranjal--recuperacao-vai-ate-o-dia-4",
    role: "Principal fonte municipal contemporânea para invasão das águas, danos, acessos e recuperação no Laranjal.",
  },
  {
    name: "Clima: Ciclone atinge o RS e provoca duas mortes",
    organization: "Folha de S.Paulo",
    date: "09/10/2001",
    url: "https://www1.folha.uol.com.br/fsp/cotidian/ff0910200111.htm",
    role: "Fonte contemporânea para classificação como ciclone extratropical, vento de 105 km/h, isolamento da Z3 e avanço das águas no Laranjal.",
  },
  {
    name: "Prefeitura trabalha para conter a invasão das águas da Lagoa dos Patos",
    organization: "Prefeitura Municipal de Pelotas",
    date: "18/10/2002",
    url: "https://www.pelotas.com.br/noticia/prefeitura-trabalha-para-conter-a-invasao-das-aguas-da-lagoa-os-patos",
    role: "Fonte retrospectiva que relembra o “nordestão” de 2001, o isolamento da Z3 e danos nos balneários.",
  },
  {
    name: "O balanço das águas da Lagoa dos Patos",
    organization: "POPA / acervo náutico",
    date: "10/02/2005",
    url: "https://acervo.popa.com.br/diversos/ventos_lpatos.htm",
    role: "Fonte posterior de contexto hidrodinâmico sobre a influência geral do vento Nordeste nos níveis da Lagoa dos Patos; não documenta o evento de 2001.",
  },
] as const;
