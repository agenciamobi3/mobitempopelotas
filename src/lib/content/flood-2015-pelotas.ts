export type Flood2015Source = {
  name: string;
  organization: string;
  date: string;
  url: string;
  role: string;
};

export type Flood2015TimelineItem = {
  date: string;
  title: string;
  stage: "lagoa" | "pelotas";
  stageLabel: string;
  paragraphs: string[];
  highlight?: string;
};

export const FLOOD_2015_KEY_FACTS = [
  {
    label: "Chuva até 20/10",
    value: "299 mm",
    detail:
      "acumulado de outubro na Estação da Embrapa citado pela Prefeitura; a média mensal informada no mesmo registro era 101 mm",
  },
  {
    label: "Canal São Gonçalo",
    value: "2,20 m",
    detail:
      "marca registrada no balanço municipal para o período mais crítico, preservada na referência usada em 2015",
  },
  {
    label: "Atendimento",
    value: "~1.300 famílias",
    detail:
      "total de famílias atendidas ao longo do episódio; não representa famílias simultaneamente desabrigadas",
  },
] as const;

export const FLOOD_2015_TIMELINE: Flood2015TimelineItem[] = [
  {
    date: "18–19 de outubro de 2015",
    title: "O período mais crítico da cheia",
    stage: "pelotas",
    stageLabel: "Laranjal, Z3, Barra e áreas baixas",
    paragraphs: [
      "O balanço municipal publicado em 6 de novembro identificou a noite de 18 para 19 de outubro como o período mais crítico do evento.",
      "A Prefeitura associou o cenário às chuvas intensas, ao excedente do Guaíba chegando à Lagoa dos Patos e às contribuições da Lagoa Mirim e dos rios Piratini e Jaguarão para o Canal São Gonçalo.",
      "Valverde, Novo Valverde, Pontal da Barra, Z3, Barra e Doquinhas aparecem entre as áreas atingidas nos registros municipais.",
    ],
    highlight: "O pico é uma conclusão do balanço retrospectivo de 06/11, não uma reconstrução feita a partir de leituras soltas.",
  },
  {
    date: "19 de outubro",
    title: "Lagoa e São Gonçalo altos reduzem a capacidade de drenagem",
    stage: "lagoa",
    stageLabel: "Lagoa dos Patos + Canal São Gonçalo",
    paragraphs: [
      "A Prefeitura explicou que as baixas cotas das áreas afetadas se combinaram com excesso regional de água chegando ao São Gonçalo, contribuição do Guaíba para a Lagoa dos Patos e vento desfavorável ao escoamento da laguna para o mar.",
      "Com a Lagoa represada, o São Gonçalo se espalhava pelas áreas mais baixas e os canais de drenagem do Laranjal perdiam capacidade de descarga.",
      "O próprio informativo municipal registrou que casas de bombas, sozinhas, não resolveriam o problema enquanto não existisse um corpo receptor em nível mais baixo para receber a água.",
    ],
  },
  {
    date: "20 de outubro · tarde",
    title: "Resgates continuam e o São Gonçalo marca 2,04 m",
    stage: "pelotas",
    stageLabel: "Operação de resposta",
    paragraphs: [
      "Boletim municipal registrou na Z3 180 pessoas em abrigos oficiais e outras 120 desalojadas em casas de parentes ou amigos.",
      "Em Pontal da Barra, Valverde e Novo Valverde, 135 pessoas estavam desalojadas; 33 haviam sido resgatadas naquele dia. A Defesa Civil advertia que outras famílias tinham saído por conta própria, impedindo uma contagem completa naquele momento.",
      "Naquela atualização, a Lagoa dos Patos havia baixado 30 cm desde a manhã e o Canal São Gonçalo havia recuado 21 cm, marcando 2,04 m.",
    ],
  },
  {
    date: "20 de outubro · noite",
    title: "Pelotas decreta Situação de Emergência",
    stage: "pelotas",
    stageLabel: "Laranjal e Z3",
    paragraphs: [
      "O prefeito Eduardo Leite assinou o decreto de Situação de Emergência nas áreas atingidas pelos alagamentos.",
      "Em registro jornalístico contemporâneo, o G1 apontou cerca de 300 pessoas fora de casa e aproximadamente 400 militares auxiliando os afetados. Barcos e caminhões eram usados na retirada de moradores.",
      "A reportagem também registrou corte preventivo de energia e o desabamento do trapiche da Praia do Laranjal durante a tarde.",
    ],
    highlight: "O G1 é usado como registro complementar do dia do decreto; os números operacionais principais permanecem ancorados nos boletins municipais.",
  },
  {
    date: "21 de outubro",
    title: "299 mm em outubro ajudam a explicar a dimensão do evento",
    stage: "pelotas",
    stageLabel: "Chuva + bacias regionais + vento",
    paragraphs: [
      "A Prefeitura informou que a Estação da Embrapa havia acumulado 270 mm em setembro e 299 mm em outubro até o dia 20. No mesmo texto, a média de outubro foi indicada como 101 mm.",
      "O Município descreveu a cheia como resultado da combinação entre o grande volume no Canal São Gonçalo, alimentado pela Lagoa Mirim e pelos rios Piratini e Jaguarão, a elevação da Lagoa dos Patos com contribuição do Guaíba e o vento nordeste dificultando o escoamento para o mar.",
      "Na Z3, o informativo registrou 300 desalojados e 180 desabrigados; no Valverde, 198 pessoas haviam sido removidas de suas casas.",
    ],
  },
  {
    date: "22 de outubro · 8h30",
    title: "Vento desfavorável provoca nova subida",
    stage: "lagoa",
    stageLabel: "Oscilação dos níveis",
    paragraphs: [
      "Depois de um recuo parcial, os boletins voltaram a registrar alta associada a ventos desfavoráveis ao escoamento.",
      "O Canal São Gonçalo passou de 2,12 m no dia 21 para 2,18 m na manhã do dia 22. A Lagoa dos Patos passou de 1,60 m para 1,90 m nas referências divulgadas pela Prefeitura.",
      "Mais oito pessoas foram removidas no Valverde, elevando de 198 para 206 o número de desalojados informado para a localidade naquela atualização.",
    ],
    highlight: "A cheia não recuou em linha reta: vento e níveis regionais produziram novas oscilações durante a emergência.",
  },
  {
    date: "26 de outubro",
    title: "O recuo permite retomada parcial de serviços",
    stage: "pelotas",
    stageLabel: "Recuo irregular",
    paragraphs: [
      "Boletim da tarde registrou a Lagoa dos Patos em 1,80 m às 10h30 e 1,70 m mais tarde. O dado mais recente do São Gonçalo naquela publicação era 2,16 m pela manhã.",
      "A energia elétrica havia sido restabelecida em 948 residências entre a avenida Joaquim Assumpção e a rua 29, e a bomba de drenagem da rua 29 voltara a operar.",
      "A Barra ainda recebia assistência por barco, mostrando que a recuperação ocorria de maneira desigual entre as áreas atingidas.",
    ],
  },
  {
    date: "28 de outubro",
    title: "Ainda há 137 pessoas em abrigos e a União reconhece a emergência",
    stage: "pelotas",
    stageLabel: "Resposta e reconhecimento federal",
    paragraphs: [
      "Após chuva e ventos fortes na madrugada, boletim das 11h mantinha o Canal São Gonçalo em 2,02 m e a Lagoa dos Patos em 1,80 m.",
      "Ainda permaneciam 137 pessoas em abrigos oficiais: 123 da Z3 e 14 de Novo Valverde, Pontal da Barra e Valverde.",
      "No mesmo dia, o Ministério da Integração Nacional reconheceu a Situação de Emergência de Pelotas. A Prefeitura também trabalhava em dique emergencial no Valverde para setorizar a área habitada e favorecer a drenagem.",
    ],
  },
  {
    date: "3–4 de novembro",
    title: "A Defesa Civil encerra o plantão especial no Laranjal",
    stage: "pelotas",
    stageLabel: "Estabilização e recuperação",
    paragraphs: [
      "Com a situação considerada estável, a Defesa Civil anunciou o encerramento do plantão na Administração do Laranjal para 4 de novembro.",
      "Na manhã do dia 3, o São Gonçalo registrava 1,80 m e a Lagoa dos Patos 1,40 m nas referências usadas naquele acompanhamento.",
      "O trabalho passava a se concentrar na recuperação: drenagem de água remanescente, ensaibramento e retirada de móveis e entulhos.",
    ],
  },
  {
    date: "6 de novembro",
    title: "Balanço consolida a dimensão da cheia",
    stage: "pelotas",
    stageLabel: "Balanço municipal",
    paragraphs: [
      "A Prefeitura informou que aproximadamente 1.300 famílias receberam atendimento ao longo do episódio no Laranjal, Z3, Barra e Doquinhas. Esse total é cumulativo e não equivale a 1.300 famílias simultaneamente desabrigadas.",
      "O balanço registrou o São Gonçalo em 2,20 m no período crítico, diante de 1,20 m indicado no documento como nível normal para outubro, e informou que 1.956 moradias tiveram a energia cortada por segurança.",
      "A estimativa de prejuízos usada na fundamentação da Situação de Emergência ficou em cerca de R$ 40 milhões, e o dique emergencial reforçado e ampliado tinha aproximadamente 2 km de comprimento e 3 m de largura.",
      "O mesmo documento confirma que a Assessoria de Comunicação publicou boletins diariamente, duas ou mais vezes, transformando a série municipal em uma fonte especialmente rica para reconstruir a evolução da cheia.",
    ],
    highlight: "~1.300 famílias atendidas ao longo do episódio · São Gonçalo 2,20 m na referência de 2015",
  },
];

export const FLOOD_2015_SOURCES: Flood2015Source[] = [
  {
    name: "Enchentes 2015",
    organization: "Prefeitura Municipal de Pelotas",
    date: "19/10/2015",
    url: "https://www.pelotas.rs.gov.br/index.php/noticia/enchentes-2015",
    role: "Explica áreas críticas, níveis regionais, vento desfavorável e a limitação da drenagem do Laranjal.",
  },
  {
    name: "Cheias 2015: Prefeitura divulga boletim atualizado",
    organization: "Prefeitura Municipal de Pelotas",
    date: "20/10/2015",
    url: "https://www.pelotas.com.br/noticia/cheias-2015-prefeitura-divulga-boletim-atualizado",
    role: "Boletim contemporâneo de resgates, desalojados e leituras da Lagoa dos Patos e do Canal São Gonçalo.",
  },
  {
    name: "Prefeito decreta situação de emergência devido à cheia",
    organization: "G1 RS",
    date: "20/10/2015",
    url: "https://g1.globo.com/rs/rio-grande-do-sul/noticia/2015/10/prefeito-de-pelotas-decreta-situacao-de-emergencia-devido-cheia-no-rs.html",
    role: "Registro jornalístico contemporâneo complementar sobre o decreto, retirada de moradores, apoio militar, corte de energia e desabamento do trapiche.",
  },
  {
    name: "Situação de emergência: prefeito reúne o secretariado",
    organization: "Prefeitura Municipal de Pelotas",
    date: "21/10/2015",
    url: "https://www.pelotas.rs.gov.br/index.php/noticia/situacao-de-emergencia-prefeito-reune-o-secretariado",
    role: "Fonte para chuva da Embrapa, mecanismo regional, vento nordeste e população removida das áreas atingidas.",
  },
  {
    name: "Enchentes 2015: boletim atualizado às 8h30min",
    organization: "Prefeitura Municipal de Pelotas",
    date: "22/10/2015",
    url: "https://www.pelotas.rs.gov.br/index.php/noticia/enchentes-2015-boletim-atualizado-as-8h30min",
    role: "Registra a nova subida associada ao vento e as leituras de Lagoa e São Gonçalo naquela manhã.",
  },
  {
    name: "Cheias 2015: boletim atualizado às 18h",
    organization: "Prefeitura Municipal de Pelotas",
    date: "26/10/2015",
    url: "https://pelotashomolog.coinpel.com.br/noticia/cheias-2015-boletim-atualizado-as-18h",
    role: "Registra recuo parcial, restabelecimento de energia, drenagem e continuidade da assistência à Barra.",
  },
  {
    name: "Cheias 2015: boletim atualizado às 11h",
    organization: "Prefeitura Municipal de Pelotas",
    date: "28/10/2015",
    url: "https://www.pelotas.rs.gov.br/index.php/noticia/cheias-2015-boletim-atualizado-as-11h",
    role: "Fonte para níveis e número de pessoas ainda em abrigos oficiais em 28 de outubro.",
  },
  {
    name: "União reconhece Situação de Emergência de Pelotas",
    organization: "Prefeitura Municipal de Pelotas",
    date: "28/10/2015",
    url: "https://pelotashomolog.coinpel.com.br/noticia/uniao-reconhece-situacao-de-emergencia-de-pelotas",
    role: "Registra o reconhecimento federal e a estratégia do dique emergencial no Valverde.",
  },
  {
    name: "Defesa Civil encerra operações na Administração do Laranjal",
    organization: "Prefeitura Municipal de Pelotas",
    date: "03/11/2015",
    url: "https://www.pelotas.rs.gov.br/index.php/noticia/defesa-civil-encerra-operacoes-na-administracao-do-laranjal",
    role: "Marca a estabilização, as últimas leituras operacionais e a transição para a recuperação.",
  },
  {
    name: "Cheias 2015: balanço registra mobilização gigantesca",
    organization: "Prefeitura Municipal de Pelotas",
    date: "06/11/2015",
    url: "https://www.pelotas.rs.gov.br/index.php/noticia/cheias-2015-balanco-registra-mobilizacao-gigantesca",
    role: "Balanço retrospectivo para pico crítico, famílias atendidas, impactos, infraestrutura e frequência dos boletins oficiais.",
  },
] as const;
