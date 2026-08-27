export type Flood1941Source = {
  name: string;
  organization: string;
  url: string;
  role: string;
};

export type Flood1941TimelineItem = {
  date: string;
  title: string;
  paragraphs: string[];
  highlight?: string;
};

export const FLOOD_1941_KEY_FACTS = [
  {
    label: "Referência histórica",
    value: "2,88 m",
    detail:
      "marca associada ao Canal São Gonçalo, reconstruída por pesquisadores a partir do acervo histórico e confirmada por mapa de época",
  },
  {
    label: "Acervo preservado",
    value: "61 fotos",
    detail:
      "registros em preto e branco do acervo Nelson Nobre Magalhães, mantido pelo Museu da UCPel",
  },
  {
    label: "Persistência",
    value: "semanas",
    detail:
      "fotografias documentam pontos alagados em meados de maio e ainda no fim de maio e início de junho",
  },
] as const;

export const FLOOD_1941_TIMELINE: Flood1941TimelineItem[] = [
  {
    date: "Maio de 1941",
    title: "Pelotas enfrenta uma inundação que se tornaria referência histórica",
    paragraphs: [
      "Registros preservados em Pelotas mostram a cidade tomada pela água durante a grande cheia que atingiu o sistema da Lagoa dos Patos em 1941.",
      "A Praça do Porto e o entorno da antiga Alfândega aparecem entre os pontos documentados pelo acervo histórico usado décadas depois por pesquisadores para reconstruir o nível alcançado pelo Canal São Gonçalo.",
    ],
  },
  {
    date: "17 e 18 de maio de 1941",
    title: "Fotografias registram vários pontos da cidade ainda alagados",
    paragraphs: [
      "O acervo preservado pela Universidade Católica de Pelotas contém grande quantidade de fotografias desses dois dias com áreas urbanas inundadas.",
      "A persistência da água nesses registros indica que diferentes partes de Pelotas já conviviam com a cheia havia pelo menos cerca de duas semanas.",
    ],
  },
  {
    date: "Fim de maio de 1941",
    title: "A inundação não desaparece rapidamente",
    paragraphs: [
      "Outras fotografias históricas continuam mostrando ruas tomadas pela água no fim de maio.",
      "Esse material é importante porque demonstra que o evento não foi apenas um pico rápido de nível: a permanência da água fez parte da dimensão da enchente de 1941.",
    ],
  },
  {
    date: "Início de junho de 1941",
    title: "Há registros de ruas ainda inundadas",
    paragraphs: [
      "Segundo o levantamento realizado com o acervo da UCPel, algumas imagens ainda mostram ruas inundadas no início de junho.",
      "A duração documentada ajuda pesquisadores atuais a compreender não apenas a altura da cheia, mas também a permanência da inundação no território urbano.",
    ],
  },
  {
    date: "2024 — reconstrução e comparação",
    title: "A referência de 2,88 m volta a orientar o monitoramento de Pelotas",
    paragraphs: [
      "Durante a enchente de 2024, pesquisadores da UFPel recorreram às fotografias de 1941 para amarrar as réguas de monitoramento e reconstruir a marca histórica do São Gonçalo.",
      "Uma fotografia da Praça do Porto, com o prédio da Alfândega como referência física, permitiu estimar o nível histórico. Depois, um mapa de 1940 foi localizado com a mesma informação de 2,88 metros, reforçando a metodologia utilizada.",
      "Em 12 de maio de 2024, a Prefeitura de Pelotas informou que a régua do Porto havia atingido novamente 2,88 metros. Em 15 de maio, a mesma referência foi superada com uma leitura de 2,89 metros.",
    ],
    highlight: "1941 permanece como referência histórica; 2024 exige leitura na mesma régua e contexto de cada medição",
  },
];

export const FLOOD_1941_SOURCES: Flood1941Source[] = [
  {
    name: "Acervo fotográfico de 1941 e pesquisa de monitoramento",
    organization: "Universidade Católica de Pelotas / pesquisadores da UFPel",
    url: "https://ucpel.edu.br/noticias/acervo-fotografico-mantido-pela-ucpel-e-usado-em-estudo-para-monitoramento-do-nivel-da-lagoa-dos-patos-e-canal-sao-goncalo",
    role:
      "Fonte principal para o acervo de 61 fotografias, a reconstrução da marca de 2,88 m, a Praça do Porto/Alfândega e a duração documentada da inundação.",
  },
  {
    name: "Canal São Gonçalo atinge cota histórica de 1941",
    organization: "Prefeitura Municipal de Pelotas",
    url: "https://www.pelotas.rs.gov.br/noticia/canal-sao-goncalo-atinge-cota-historica-de-1941",
    role:
      "Registro oficial de 12 de maio de 2024 que usa 2,88 m como referência da enchente de 1941 no Canal São Gonçalo.",
  },
  {
    name: "Paula reforça saída da população em áreas de risco",
    organization: "Prefeitura Municipal de Pelotas",
    url: "https://www.pelotas.rs.gov.br/noticia/paula-reforca-saida-da-populacao-em-areas-de-risco",
    role:
      "Registro oficial de 15 de maio de 2024 informando a superação da referência de 1941 com leitura de 2,89 m.",
  },
  {
    name: "História e tecnologia na contribuição para a construção de cidades resilientes: estudo de caso Pelotas-RS",
    organization: "Universidade Federal de Pelotas — SIIEPE 2025",
    url: "https://anais-siiepe.ufpel.edu.br/2025/MD_05091.pdf",
    role:
      "Trabalho acadêmico que registra levantamento documental do evento de 1941 e georreferenciamento de fotografias do acervo da UCPel.",
  },
];
