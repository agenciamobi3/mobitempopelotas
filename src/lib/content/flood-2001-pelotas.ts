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
    label: "Data do evento",
    value: "08/10/2001",
    detail: "madrugada descrita pela reportagem publicada no dia seguinte",
  },
  {
    label: "Vento em Pelotas",
    value: "105 km/h",
    detail: "valor publicado pela Folha de S.Paulo em 09/10/2001",
  },
  {
    label: "Água no Laranjal",
    value: "~600 m",
    detail: "seis quadras para dentro da área urbana, segundo a reportagem da época",
  },
  {
    label: "Colônia Z3",
    value: "~3.000 isolados",
    detail: "estimativa publicada durante o evento; não é o número de desabrigados",
  },
] as const;

export const FLOOD_2001_TIMELINE: Flood2001TimelineItem[] = [
  {
    date: "8 de outubro de 2001 · madrugada",
    title: "Temporal, vento de 105 km/h e avanço da água",
    stageLabel: "Temporal e Lagoa dos Patos",
    paragraphs: [
      "A Folha de S.Paulo publicou no dia seguinte, citando meteorologistas, que um ciclone extratropical atingiu o Rio Grande do Sul durante a madrugada de 8 de outubro.",
      "Em Pelotas, a reportagem registrou vento de 105 km/h e ondas de aproximadamente um metro na Lagoa dos Patos.",
      "No Laranjal, as águas avançaram seis quadras, cerca de 600 metros, para dentro da área urbana. Na Colônia Z3, aproximadamente 3 mil pessoas ficaram isoladas.",
      "A estação Laranjal 87955000 guarda duas versões da medição daquele dia: 2,90 m na série bruta e 1,90 m na série revisada, marcada como estimada. As duas permanecem visíveis na página.",
    ],
    highlight: "105 km/h em Pelotas · avanço de cerca de 600 m no Laranjal · 2,90 m bruto e 1,90 m revisado/estimado · cerca de 3 mil isolados na Z3",
  },
  {
    date: "9 de outubro de 2001",
    title: "A reportagem do dia seguinte registra os principais números",
    stageLabel: "Reportagem de 09/10",
    paragraphs: [
      "A matéria da Folha é, até agora, a fonte da época localizada que reúne a classificação como ciclone extratropical e os principais números do episódio em Pelotas.",
      "Por isso, os 105 km/h, o avanço das águas e o número de pessoas isoladas continuam atribuídos à reportagem, e não à Prefeitura.",
    ],
  },
  {
    date: "22 de outubro de 2001",
    title: "Duas semanas depois, ainda havia obras no Laranjal",
    stageLabel: "Prefeitura e recuperação",
    paragraphs: [
      "A Prefeitura descreveu os problemas no Laranjal como consequência dos fortes ventos e da entrada das águas do Canal São Gonçalo e da Lagoa dos Patos.",
      "As equipes trabalhavam na limpeza da beira da Lagoa, recuperação de acessos e retirada de entulhos.",
      "Retroescavadeiras também atuavam na drenagem de áreas próximas ao Valverde e ao Pontal da Barra em direção ao Canal São Gonçalo.",
    ],
    highlight: "A Prefeitura confirma vento forte, entrada da água, danos e recuperação. O termo “ciclone extratropical” vem da reportagem da Folha.",
  },
  {
    date: "até 4 de novembro de 2001",
    title: "A recuperação segue até o começo de novembro",
    stageLabel: "Obras no Laranjal",
    paragraphs: [
      "O comunicado municipal de 22 de outubro previa que o mutirão e as obras no Laranjal seguiriam até 4 de novembro.",
      "Isso mostra que os impactos não terminaram quando o vento passou. Acessos, áreas alagadas e infraestrutura ainda exigiam trabalho semanas depois.",
    ],
  },
  {
    date: "18 de outubro de 2002 · memória do evento",
    title: "Em 2002, a Prefeitura lembra o “nordestão” de 2001",
    stageLabel: "Memória publicada em 2002",
    paragraphs: [
      "Ao noticiar uma nova entrada das águas em 2002, a Prefeitura lembrou que o “nordestão” do ano anterior havia deixado a Z3 isolada e causado danos nos balneários.",
      "“Nordestão” é a expressão local usada para o vento nordeste forte. O termo ajuda a preservar a memória de moradores e pescadores, mas não substitui a classificação meteorológica publicada pela Folha em 2001.",
    ],
  },
];

export const FLOOD_2001_RESEARCH_GAPS = [
  "Ainda falta o relatório que explique por que a medição de 8 de outubro aparece como 2,90 m na série bruta e 1,90 m na série revisada e estimada.",
  "Ainda falta confirmar qual referência da régua vale para 2001. Mudanças registradas em 2017 e 2018 não podem ser aplicadas automaticamente às medições antigas.",
  "Ainda falta um documento que diga se as estações 87955000 e 87955001 usam exatamente o mesmo zero e a mesma referência de nível.",
  "Ainda buscamos boletins meteorológicos oficiais da época que detalhem o sistema que atingiu Pelotas e a Lagoa dos Patos.",
  "Fotos, jornais e documentos da Biblioteca Pública, Defesa Civil, Sanep, UFPel, Embrapa, FURG, ANA, SGB, Marinha e imprensa local podem ampliar a história do evento.",
] as const;

export const FLOOD_2001_SOURCES: Flood2001Source[] = [
  {
    name: "Laranjal: recuperação vai até o dia 4",
    organization: "Prefeitura Municipal de Pelotas",
    date: "22/10/2001",
    url: "https://www.pelotas.com.br/noticia/laranjal--recuperacao-vai-ate-o-dia-4",
    role: "Mostra os danos, os acessos afetados e as obras de recuperação no Laranjal.",
  },
  {
    name: "Clima: Ciclone atinge o RS e provoca duas mortes",
    organization: "Folha de S.Paulo",
    date: "09/10/2001",
    url: "https://www1.folha.uol.com.br/fsp/cotidian/ff0910200111.htm",
    role: "Fonte da época para a classificação como ciclone extratropical, vento de 105 km/h, isolamento da Z3 e avanço das águas no Laranjal.",
  },
  {
    name: "Exportação de cotas da estação Laranjal 87955000",
    organization: "ANA · Sistema de Informações Hidrológicas / Hidro",
    date: "exportada em 06/09/2026",
    url: "https://www.snirh.gov.br/hidroweb/",
    role: "Guarda as duas versões do nível de 08/10/2001: 2,90 m na série bruta e 1,90 m na série revisada, marcada como estimada.",
  },
  {
    name: "Relatório de Caracterização Municipal · Plano Municipal de Saneamento Básico",
    organization: "Prefeitura Municipal do Rio Grande · dados ANA",
    date: "2013",
    url: "https://www.riogrande.rs.gov.br/planosaneamento/arquivos/home/%282.1%29_Relatorio_de_Caracterizacao_Municipal.pdf",
    role: "Registra 2,90 m em 08/10/2001. Os arquivos Hidro atuais mostram que esse valor corresponde à série bruta.",
  },
  {
    name: "Inundação de maio de 2024 no Rio Grande do Sul: levantamento dos níveis máximos em estações fluviométricas",
    organization: "Serviço Geológico do Brasil · SGB",
    date: "2025",
    url: "https://rigeo.sgb.gov.br/handle/doc/25517",
    role: "Documenta a estação Laranjal 87955000 e alerta que sua leitura não deve ser tratada como altitude sem a referência adequada.",
  },
  {
    name: "Prefeitura trabalha para conter a invasão das águas da Lagoa dos Patos",
    organization: "Prefeitura Municipal de Pelotas",
    date: "18/10/2002",
    url: "https://www.pelotas.com.br/noticia/prefeitura-trabalha-para-conter-a-invasao-das-aguas-da-lagoa-os-patos",
    role: "Lembra o “nordestão” de 2001, o isolamento da Z3 e os danos nos balneários.",
  },
  {
    name: "Análise das condições meteorológicas associadas a um caso de vento extremo na região sul da Laguna dos Patos",
    organization: "Faculdade de Meteorologia · UFPel",
    date: "2013",
    url: "https://anais-siiepe.ufpel.edu.br/2013/CE_02822.pdf",
    role: "Estudo feito depois do evento que ajuda a explicar o papel dos ventos de leste e nordeste no avanço da água.",
  },
  {
    name: "O balanço das águas da Lagoa dos Patos",
    organization: "POPA / acervo náutico",
    date: "10/02/2005",
    url: "https://acervo.popa.com.br/diversos/ventos_lpatos.htm",
    role: "Ajuda a entender, de forma geral, como o vento nordeste pode alterar os níveis da Lagoa dos Patos. Não documenta diretamente o evento de 2001.",
  },
] as const;