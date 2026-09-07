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
    label: "Canal São Gonçalo",
    value: "2,88 m",
    detail: "marca histórica encontrada em fotos antigas e também em um mapa de 1940",
  },
  {
    label: "Fotos preservadas",
    value: "61 fotos",
    detail: "imagens em preto e branco do acervo Nelson Nobre Magalhães, preservado pelo Museu da UCPel",
  },
  {
    label: "Duração registrada",
    value: "semanas",
    detail: "há fotos de áreas ainda alagadas em maio e no início de junho de 1941",
  },
] as const;

export const FLOOD_1941_TIMELINE: Flood1941TimelineItem[] = [
  {
    date: "Maio de 1941",
    title: "Uma grande enchente atinge Pelotas",
    paragraphs: [
      "Fotos preservadas em Pelotas mostram ruas e áreas próximas ao Canal São Gonçalo tomadas pela água durante a grande enchente de 1941.",
      "A Praça do Porto e a antiga Alfândega aparecem entre os locais registrados nas imagens.",
    ],
  },
  {
    date: "17 e 18 de maio de 1941",
    title: "As fotos mostram vários pontos da cidade ainda alagados",
    paragraphs: [
      "Muitas das fotografias preservadas pela Universidade Católica de Pelotas foram feitas nesses dois dias e mostram áreas urbanas inundadas.",
      "Como há registros de água em diferentes momentos, sabemos que a enchente não durou apenas algumas horas ou um único dia.",
    ],
  },
  {
    date: "Fim de maio de 1941",
    title: "No fim de maio, ainda havia ruas alagadas",
    paragraphs: [
      "Outras fotografias continuam mostrando ruas tomadas pela água no fim do mês.",
      "Essas imagens ajudam a mostrar que a demora para a água baixar também fez parte da enchente de 1941.",
    ],
  },
  {
    date: "Início de junho de 1941",
    title: "Algumas ruas continuavam alagadas",
    paragraphs: [
      "O levantamento feito com o acervo da UCPel encontrou imagens de ruas ainda inundadas no início de junho.",
      "Isso mostra que o problema não foi apenas o quanto a água subiu. Em alguns pontos, ela também demorou semanas para baixar.",
    ],
  },
  {
    date: "2024, 83 anos depois",
    title: "As fotos de 1941 ajudam a entender a cheia de 2024",
    paragraphs: [
      "Durante a enchente de 2024, pesquisadores da UFPel voltaram às fotografias de 1941 para conferir a antiga marca do Canal São Gonçalo.",
      "Uma foto da Praça do Porto mostrava a antiga Alfândega, um prédio que ainda existe. Esse ponto ajudou no cálculo da altura alcançada pela água em 1941.",
      "Depois, os pesquisadores encontraram um mapa de 1940 com a mesma marca de 2,88 metros. Em 12 de maio de 2024, a Prefeitura informou que a régua do Porto havia chegado novamente a 2,88 metros. Em 15 de maio, a leitura chegou a 2,89 metros.",
    ],
    highlight: "A marca de 1941 serviu como comparação em 2024 usando a referência do Canal São Gonçalo",
  },
];

export const FLOOD_1941_SOURCES: Flood1941Source[] = [
  {
    name: "Acervo fotográfico de 1941 e pesquisa de monitoramento",
    organization: "Universidade Católica de Pelotas / pesquisadores da UFPel",
    url: "https://ucpel.edu.br/noticias/acervo-fotografico-mantido-pela-ucpel-e-usado-em-estudo-para-monitoramento-do-nivel-da-lagoa-dos-patos-e-canal-sao-goncalo",
    role: "Fonte principal sobre as 61 fotografias, a marca de 2,88 m, a Praça do Porto, a Alfândega e a duração registrada da enchente.",
  },
  {
    name: "Canal São Gonçalo atinge cota histórica de 1941",
    organization: "Prefeitura Municipal de Pelotas",
    url: "https://www.pelotas.rs.gov.br/noticia/canal-sao-goncalo-atinge-cota-historica-de-1941",
    role: "Registro oficial de 12 de maio de 2024 que usa 2,88 m como referência da enchente de 1941 no Canal São Gonçalo.",
  },
  {
    name: "Paula reforça saída da população em áreas de risco",
    organization: "Prefeitura Municipal de Pelotas",
    url: "https://www.pelotas.rs.gov.br/noticia/paula-reforca-saida-da-populacao-em-areas-de-risco",
    role: "Registro oficial de 15 de maio de 2024 informando que a leitura chegou a 2,89 m e passou da marca de 1941.",
  },
  {
    name: "História e tecnologia na contribuição para a construção de cidades resilientes: estudo de caso Pelotas-RS",
    organization: "Universidade Federal de Pelotas — SIIEPE 2025",
    url: "https://anais-siiepe.ufpel.edu.br/2025/MD_05091.pdf",
    role: "Pesquisa da UFPel que estudou documentos antigos e identificou no mapa onde algumas fotografias de 1941 foram feitas.",
  },
];
