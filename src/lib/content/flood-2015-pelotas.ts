export type Flood2015Source = {
  name: string;
  organization: string;
  date: string;
  url: string;
  role: string;
};

export type Flood2015Measurement = {
  label: string;
  value: string;
  detail?: string;
};

export type Flood2015TimelineItem = {
  date: string;
  title: string;
  stage: "lagoa" | "pelotas";
  stageLabel: string;
  paragraphs: string[];
  measurements?: Flood2015Measurement[];
  highlight?: string;
};

export type Flood2015ArchiveEntry = {
  date: string;
  publications: string[];
  retrieval: "full" | "indexed";
  note: string;
};

export const FLOOD_2015_KEY_FACTS = [
  {
    label: "Chuva até 20/10",
    value: "299 mm",
    detail: "acumulado de outubro na Estação da Embrapa; a média citada para o mês era 101 mm",
  },
  {
    label: "Canal São Gonçalo",
    value: "2,20 m",
    detail: "valor citado no balanço municipal para o período mais crítico",
  },
  {
    label: "Atendimento",
    value: "~1.300 famílias",
    detail: "total atendido ao longo da enchente; não é o número de famílias desabrigadas ao mesmo tempo",
  },
] as const;

export const FLOOD_2015_TIMELINE: Flood2015TimelineItem[] = [
  {
    date: "14 de outubro · tarde",
    title: "Cinco dias antes do pico, a cidade já estava em alerta",
    stage: "lagoa",
    stageLabel: "Primeiros sinais",
    paragraphs: [
      "A Prefeitura já relacionava a subida da Lagoa dos Patos à água do Guaíba que seguia para o sul e mantinha as equipes em alerta.",
      "A Defesa Civil retirava famílias do Cedrinho, na Z3. No Santo Antônio, a água alcançava a área do shopping Mar de Dentro e, no Valverde, o trapiche estava praticamente submerso.",
      "Até 13 de outubro, Pelotas havia acumulado 170 mm de chuva no mês, diante da média de 101 mm citada pelo Município. A régua da Casa de Bombas do Porto marcava 2,10 m naquela tarde.",
    ],
    measurements: [
      { label: "Chuva em outubro até 13/10", value: "170 mm", detail: "média de outubro citada pela Prefeitura: 101 mm" },
      { label: "Casa de Bombas do Porto", value: "2,10 m", detail: "régua local; não é a mesma medição da Lagoa ou do São Gonçalo" },
    ],
    highlight: "A cheia já dava sinais claros antes do período mais crítico de 18 e 19 de outubro.",
  },
  {
    date: "18-19 de outubro de 2015",
    title: "A noite de 18 para 19 é apontada como o período mais crítico",
    stage: "pelotas",
    stageLabel: "Áreas mais atingidas",
    paragraphs: [
      "O balanço municipal publicado em 6 de novembro identifica a noite de 18 para 19 de outubro como o período mais crítico da enchente.",
      "A Prefeitura relacionou o cenário à chuva intensa, à água do Guaíba chegando à Lagoa dos Patos e à contribuição da Lagoa Mirim e dos rios Piratini e Jaguarão para o Canal São Gonçalo.",
      "Valverde, Novo Valverde, Pontal da Barra, Z3, Barra e Doquinhas aparecem entre as áreas atingidas nos registros municipais.",
    ],
    highlight: "É o balanço de 6 de novembro que identifica 18 e 19 de outubro como o período mais crítico.",
  },
  {
    date: "19 de outubro",
    title: "Lagoa e Canal altos dificultam a saída da água",
    stage: "lagoa",
    stageLabel: "Lagoa e Canal altos",
    paragraphs: [
      "A Prefeitura explicou que as áreas mais baixas estavam recebendo água ao mesmo tempo em que tinham dificuldade para escoá-la.",
      "Havia muita água chegando ao Canal São Gonçalo, a Lagoa dos Patos estava alta e o vento dificultava a saída da água em direção ao mar.",
      "Por isso, as casas de bombas não resolveriam o problema sozinhas enquanto a Lagoa e o Canal continuassem altos.",
    ],
  },
  {
    date: "20 de outubro · tarde",
    title: "Resgates continuam e o São Gonçalo marca 2,04 m",
    stage: "pelotas",
    stageLabel: "Resgates e medições",
    paragraphs: [
      "Na Z3, o boletim municipal registrou 180 pessoas em abrigos oficiais e outras 120 em casas de parentes ou amigos.",
      "Em Pontal da Barra, Valverde e Novo Valverde, 135 pessoas estavam fora de casa e 33 haviam sido resgatadas naquele dia. A Defesa Civil informou que outras famílias saíram por conta própria, por isso a contagem não era completa.",
      "Desde a manhã, a Lagoa dos Patos havia baixado 30 cm e o Canal São Gonçalo, 21 cm.",
    ],
    measurements: [
      { label: "Canal São Gonçalo", value: "2,04 m", detail: "tarde de 20/10" },
      { label: "Variação do São Gonçalo", value: "-21 cm", detail: "desde a manhã" },
      { label: "Variação da Lagoa", value: "-30 cm", detail: "desde a manhã; o boletim não informa o nível absoluto" },
    ],
  },
  {
    date: "20 de outubro · noite",
    title: "Pelotas decreta Situação de Emergência",
    stage: "pelotas",
    stageLabel: "Decreto e resgates",
    paragraphs: [
      "O prefeito Eduardo Leite assinou o decreto de Situação de Emergência nas áreas atingidas pelos alagamentos.",
      "Uma reportagem do G1 publicada naquele dia apontou cerca de 300 pessoas fora de casa e aproximadamente 400 militares ajudando no atendimento. Barcos e caminhões eram usados para retirar moradores.",
      "A reportagem também registrou corte preventivo de energia e o desabamento do trapiche da Praia do Laranjal durante a tarde.",
    ],
    highlight: "Os números deste bloco vêm da reportagem do G1 publicada no dia do decreto.",
  },
  {
    date: "21 de outubro",
    title: "Chuva chega a 299 mm no mês até o dia 20",
    stage: "pelotas",
    stageLabel: "Chuva, Lagoa, Canal e vento",
    paragraphs: [
      "A Prefeitura informou que a Estação da Embrapa havia acumulado 270 mm em setembro e 299 mm em outubro até o dia 20. No mesmo texto, a média citada para outubro era de 101 mm.",
      "O Município explicou a cheia pela combinação de muita água no Canal São Gonçalo, Lagoa dos Patos alta com contribuição do Guaíba e vento nordeste dificultando a saída para o mar.",
      "Na Z3, o boletim registrou 300 pessoas fora de casa e 180 em abrigos. No Valverde, 198 pessoas haviam sido retiradas de suas casas.",
      "O boletim da manhã seguinte informa que, no dia 21, o São Gonçalo estava em 2,12 m e a Lagoa dos Patos em 1,60 m.",
    ],
    measurements: [
      { label: "Canal São Gonçalo", value: "2,12 m", detail: "valor do dia 21 citado no boletim de 22/10" },
      { label: "Lagoa dos Patos", value: "1,60 m", detail: "valor do dia 21 citado no boletim de 22/10" },
      { label: "Chuva em outubro", value: "299 mm", detail: "Embrapa, acumulado até 20/10" },
    ],
  },
  {
    date: "22 de outubro · 8h30",
    title: "Vento desfavorável faz os níveis subirem de novo",
    stage: "lagoa",
    stageLabel: "Nova subida",
    paragraphs: [
      "Depois de uma queda parcial, os boletins voltaram a registrar alta e relacionaram a mudança ao vento desfavorável à saída da água.",
      "O Canal São Gonçalo passou de 2,12 m no dia 21 para 2,18 m na manhã do dia 22. A Lagoa dos Patos passou de 1,60 m para 1,90 m nas referências divulgadas pela Prefeitura.",
      "Mais oito pessoas foram retiradas do Valverde, elevando de 198 para 206 o número informado naquela atualização.",
    ],
    measurements: [
      { label: "Canal São Gonçalo", value: "2,18 m", detail: "+6 cm em relação ao valor do dia 21" },
      { label: "Lagoa dos Patos", value: "1,90 m", detail: "+30 cm em relação ao valor do dia 21" },
    ],
    highlight: "A água não baixou de forma contínua: houve novas subidas durante a emergência.",
  },
  {
    date: "23 de outubro",
    title: "Ônibus volta a circular para a Z3",
    stage: "pelotas",
    stageLabel: "Primeiros sinais de recuo",
    paragraphs: [
      "A estrada de acesso à Colônia Z3 voltou a receber transporte coletivo depois de obras na pista e da redução do nível da Lagoa dos Patos.",
      "A Defesa Civil havia restringido a passagem dos ônibus no início da semana.",
      "A própria notícia anunciava nova atualização sobre os alagamentos para as 17h30, mostrando a frequência dos boletins durante a emergência.",
    ],
  },
  {
    date: "25 de outubro",
    title: "Começa a construção do dique no Pontal da Barra",
    stage: "pelotas",
    stageLabel: "Obra de emergência",
    paragraphs: [
      "Depois de uma vistoria no dia 24, a Prefeitura iniciou um dique para separar o banhado das áreas habitadas e ajudar bombas e canais a retirar a água acumulada.",
      "O projeto previa aproximadamente 2 km de extensão e 3 m de largura, com duas frentes de trabalho.",
      "A Prefeitura voltou a relacionar a enchente ao grande volume no São Gonçalo, à Lagoa dos Patos alta e ao vento que dificultava a saída para o mar.",
    ],
    highlight: "Projeto anunciado em 25/10: cerca de 2 km de extensão e 3 m de largura.",
  },
  {
    date: "26 de outubro",
    title: "A água baixa em alguns pontos e serviços começam a voltar",
    stage: "pelotas",
    stageLabel: "Recuperação desigual",
    paragraphs: [
      "O boletim da tarde registrou a Lagoa dos Patos em 1,80 m às 10h30 e 1,70 m mais tarde. O dado mais recente do São Gonçalo naquela publicação era 2,16 m pela manhã.",
      "A energia havia voltado para 948 residências entre a avenida Joaquim Assumpção e a rua 29, e a bomba de drenagem da rua 29 voltou a funcionar.",
      "A Barra ainda recebia atendimento por barco, mostrando que algumas áreas se recuperavam antes de outras.",
    ],
    measurements: [
      { label: "Lagoa dos Patos · 10h30", value: "1,80 m" },
      { label: "Lagoa dos Patos · tarde", value: "1,70 m", detail: "queda de 10 cm no intervalo informado" },
      { label: "Canal São Gonçalo · manhã", value: "2,16 m", detail: "valor mais recente citado no boletim das 18h" },
    ],
  },
  {
    date: "27 de outubro · manhã",
    title: "A Lagoa recua, mas o retorno às casas ainda não é recomendado",
    stage: "lagoa",
    stageLabel: "Defesa Civil citada pela GZH",
    paragraphs: [
      "Os textos completos dos boletins municipais de 27 de outubro não foram recuperados. A leitura da manhã aparece em uma reportagem da GZH que cita a Defesa Civil de Pelotas.",
      "A Lagoa dos Patos havia baixado 40 cm e media 1,60 m. A água recuava nas ruas, mas a orientação ainda era não voltar para casa por causa da previsão de ventos fortes.",
      "Ainda havia 137 pessoas em abrigos. A CEEE já havia restabelecido a energia em 1.270 casas e avaliava outros 686 pontos sem luz. O dique provisório do Valverde seguia em construção.",
    ],
    measurements: [
      { label: "Lagoa dos Patos", value: "1,60 m", detail: "manhã de 27/10; GZH citando a Defesa Civil de Pelotas" },
      { label: "Variação da Lagoa", value: "-40 cm", detail: "na manhã de 27/10, segundo a mesma fonte" },
      { label: "Pessoas em abrigos", value: "137", detail: "Defesa Civil citada pela GZH" },
    ],
    highlight: "Como o boletim municipal completo não foi recuperado, estes dados permanecem atribuídos à GZH e à Defesa Civil.",
  },
  {
    date: "27 de outubro · fim da tarde",
    title: "Boletim do dia seguinte confirma os níveis do fim da tarde",
    stage: "lagoa",
    stageLabel: "Valores confirmados em 28/10",
    paragraphs: [
      "O arquivo municipal mostra que houve boletins às 11h e às 19h em 27 de outubro, mas os textos completos dessas páginas antigas ainda não foram recuperados.",
      "No boletim de 28 de outubro, a Prefeitura informa que as leituras daquela manhã eram as mesmas do fim da tarde do dia anterior.",
      "Assim, é possível registrar os valores do fim da tarde de 27 sem inventar as demais medições daquele dia.",
    ],
    measurements: [
      { label: "Canal São Gonçalo", value: "2,02 m", detail: "fim da tarde de 27/10, confirmado no boletim de 28/10" },
      { label: "Lagoa dos Patos", value: "1,80 m", detail: "fim da tarde de 27/10, confirmado no boletim de 28/10" },
    ],
  },
  {
    date: "28 de outubro · 11h",
    title: "Chuva e vento mantêm os níveis do fim da tarde anterior",
    stage: "pelotas",
    stageLabel: "Prefeitura",
    paragraphs: [
      "A Prefeitura informou que os fortes ventos da madrugada e a chuva até as 2h mantiveram os níveis da Lagoa e do São Gonçalo iguais aos do fim da tarde anterior.",
      "Ainda havia 137 pessoas em abrigos oficiais: 123 da Z3 e 14 de Novo Valverde, Pontal da Barra e Valverde.",
      "No mesmo dia, o Município divulgou o reconhecimento federal da Situação de Emergência e continuou os trabalhos no dique do Valverde.",
    ],
    measurements: [
      { label: "Canal São Gonçalo", value: "2,02 m", detail: "mesmo valor do fim da tarde de 27/10" },
      { label: "Lagoa dos Patos", value: "1,80 m", detail: "mesmo valor do fim da tarde de 27/10" },
      { label: "Pessoas em abrigos oficiais", value: "137", detail: "123 da Z3 e 14 de Novo Valverde, Pontal da Barra e Valverde" },
    ],
  },
  {
    date: "28 de outubro · cerca de 14h",
    title: "Nova medição mostra o São Gonçalo em 2,04 m",
    stage: "lagoa",
    stageLabel: "Defesa Civil citada pela GZH",
    paragraphs: [
      "Uma reportagem da GZH publicada às 14h01 registrou a medição mais recente da Defesa Civil naquele momento: Lagoa em 1,80 m e Canal São Gonçalo em 2,04 m.",
      "O São Gonçalo estava 2 cm acima do valor divulgado pela Prefeitura às 11h, enquanto a Lagoa permanecia igual.",
      "A mesma reportagem registrou 137 pessoas em abrigos e reproduziu a estimativa municipal de mais de 3 mil casas e cerca de 10 mil pessoas atingidas, com levantamento ainda em andamento.",
    ],
    measurements: [
      { label: "Canal São Gonçalo", value: "2,04 m", detail: "Defesa Civil citada pela GZH às 14h01" },
      { label: "Lagoa dos Patos", value: "1,80 m", detail: "Defesa Civil citada pela GZH às 14h01" },
      { label: "Variação do São Gonçalo", value: "+2 cm", detail: "comparação com o boletim da Prefeitura das 11h" },
    ],
    highlight: "O boletim municipal das 18h não foi recuperado; esta medição registra apenas o começo da tarde.",
  },
  {
    date: "29 de outubro",
    title: "Boletim das 11h foi localizado, mas o texto completo não",
    stage: "pelotas",
    stageLabel: "Boletim localizado",
    paragraphs: [
      "O índice da Prefeitura confirma uma nova edição de “Cheias 2015 - Boletim atualizado às 11h” em 29 de outubro.",
      "O texto completo dessa página antiga não está disponível de forma confiável no arquivo atual. A GZH também preserva o registro de uma matéria daquele dia sobre a queda do número de desabrigados, mas o texto completo não foi recuperado.",
      "Por isso, esta linha do tempo registra que as publicações existiram, mas não atribui a elas números que não foram encontrados no texto original.",
    ],
    highlight: "Boletim localizado; medições não são preenchidas sem o texto da publicação.",
  },
  {
    date: "30 de outubro · fim da tarde",
    title: "Dique emergencial é concluído no Valverde",
    stage: "pelotas",
    stageLabel: "Obra concluída",
    paragraphs: [
      "A Prefeitura informou que o Sanep concluiu a barreira de contenção entre a área habitada do Valverde e o banhado.",
      "No registro final, o dique tinha 1,8 km de comprimento e 3 m de altura, além de uma comporta móvel de 6 m para controlar a passagem da água.",
      "Naquela tarde, a água já começava a baixar no Valverde e no Novo Valverde. A própria Prefeitura apresentou a obra como uma medida de emergência, e não como solução definitiva para o Laranjal.",
    ],
    highlight: "O projeto inicial previa cerca de 2 km de extensão e 3 m de largura. O registro da obra concluída descreve 1,8 km de comprimento, 3 m de altura e comporta de 6 m.",
  },
  {
    date: "3 de novembro · manhã",
    title: "Defesa Civil prepara o encerramento do plantão no Laranjal",
    stage: "pelotas",
    stageLabel: "Situação estável",
    paragraphs: [
      "Com a situação considerada estável, a Defesa Civil anunciou que encerraria o plantão na Administração do Laranjal em 4 de novembro.",
      "Na manhã do dia 3, o São Gonçalo marcava 1,80 m e a Lagoa dos Patos 1,40 m nas referências usadas naquele acompanhamento.",
      "O trabalho passava a se concentrar na drenagem da água restante, recuperação das ruas e retirada de móveis e entulhos.",
    ],
    measurements: [
      { label: "Canal São Gonçalo", value: "1,80 m", detail: "manhã de 03/11" },
      { label: "Lagoa dos Patos", value: "1,40 m", detail: "manhã de 03/11" },
    ],
  },
  {
    date: "5 de novembro",
    title: "A emergência dá lugar à limpeza e ao retorno",
    stage: "pelotas",
    stageLabel: "Retorno e limpeza",
    paragraphs: [
      "Com a água baixando, a Prefeitura concentrou equipes na limpeza de ruas, canais e orla do Laranjal e na retirada de móveis e entulhos.",
      "No dia 4 haviam sido recolhidas 19 cargas de móveis e entulho na orla e sete no Pontal da Barra e Valverde. No dia 5, três caçambas e duas retroescavadeiras retiravam aguapés e juncos.",
      "A Prefeitura informou que já não havia desabrigados no Valverde nem na Z3 e que os abrigos do Laranjal Praia Clube e do CRAS São Gonçalo haviam sido desativados.",
    ],
  },
  {
    date: "6 de novembro",
    title: "Balanço final reúne os principais números da cheia",
    stage: "pelotas",
    stageLabel: "Balanço da Prefeitura",
    paragraphs: [
      "A Prefeitura informou que aproximadamente 1.300 famílias receberam atendimento ao longo do episódio no Laranjal, Z3, Barra e Doquinhas. Esse total não significa 1.300 famílias desabrigadas ao mesmo tempo.",
      "O balanço registrou o São Gonçalo em 2,20 m no período mais crítico e informou que 1.956 moradias tiveram a energia cortada por segurança.",
      "Para a Lagoa dos Patos, o documento informa que uma régua de 1,80 m ficou submersa. Isso mostra que a água passou desse nível, mas não permite afirmar qual foi o pico exato.",
      "A estimativa de prejuízos usada na Situação de Emergência ficou em cerca de R$ 40 milhões. O dique reforçado e ampliado tinha aproximadamente 2 km de comprimento e 3 m de largura.",
      "O mesmo balanço confirma que a Prefeitura publicou boletins todos os dias, em alguns casos mais de uma vez por dia.",
    ],
    measurements: [
      { label: "Canal São Gonçalo · período crítico", value: "2,20 m", detail: "balanço de 06/11; o documento cita 1,20 m como nível normal para outubro" },
      { label: "Lagoa dos Patos", value: "> 1,80 m", detail: "a régua de 1,80 m ficou submersa; o pico exato não foi informado" },
    ],
    highlight: "~1.300 famílias atendidas ao longo da enchente · São Gonçalo em 2,20 m no período mais crítico",
  },
];

export const FLOOD_2015_ARCHIVE: Flood2015ArchiveEntry[] = [
  {
    date: "25/10",
    publications: ["Defesa Civil remove 14 pessoas neste domingo", "Começa a construção de dique no Pontal da Barra"],
    retrieval: "full",
    note: "Os textos foram recuperados e ajudam a documentar a continuidade dos resgates e o início do dique.",
  },
  {
    date: "26/10",
    publications: ["Boletim atualizado às 11h", "Boletim atualizado às 18h"],
    retrieval: "full",
    note: "A edição das 18h foi recuperada e registra medições da manhã e da tarde.",
  },
  {
    date: "27/10",
    publications: ["Boletim atualizado às 11h", "Boletim atualizado às 19h"],
    retrieval: "indexed",
    note: "As duas edições aparecem no índice oficial, mas o texto completo não foi recuperado. A leitura da manhã aparece na GZH citando a Defesa Civil, e os valores do fim da tarde reaparecem no boletim de 28/10.",
  },
  {
    date: "28/10",
    publications: ["Boletim atualizado às 11h", "Boletim atualizado às 18h", "União reconhece Situação de Emergência de Pelotas"],
    retrieval: "full",
    note: "A edição das 11h e o reconhecimento federal foram recuperados. O texto das 18h não; uma medição por volta das 14h aparece na GZH citando a Defesa Civil.",
  },
  {
    date: "29/10",
    publications: ["Boletim atualizado às 11h"],
    retrieval: "indexed",
    note: "O índice municipal confirma que o boletim existiu, mas o texto completo não foi recuperado.",
  },
  {
    date: "30/10",
    publications: ["Sanep conclui dique de contenção emergencial no Laranjal"],
    retrieval: "full",
    note: "O texto oficial foi recuperado e documenta a conclusão do dique e o início da baixa da água no Valverde e Novo Valverde.",
  },
  {
    date: "03/11",
    publications: ["Boletim atualizado às 11h", "Defesa Civil encerra operações na Administração do Laranjal"],
    retrieval: "full",
    note: "O comunicado de encerramento preserva as últimas medições antes da transição para a recuperação.",
  },
] as const;

export const FLOOD_2015_SOURCES: Flood2015Source[] = [
  {
    name: "Nível da Lagoa dos Patos sobe e põe prefeitura em alerta",
    organization: "Prefeitura Municipal de Pelotas",
    date: "14/10/2015",
    url: "https://www.pelotas.com.br/noticia/nivel-da-lagoa-dos-patos-sobe-e-poe-prefeitura-em-alerta",
    role: "Registra os primeiros sinais da cheia, a chuva acumulada, retiradas na Z3 e a régua da Casa de Bombas do Porto.",
  },
  {
    name: "Enchentes 2015",
    organization: "Prefeitura Municipal de Pelotas",
    date: "19/10/2015",
    url: "https://www.pelotas.rs.gov.br/index.php/noticia/enchentes-2015",
    role: "Explica por que Lagoa e Canal altos dificultavam a drenagem do Laranjal.",
  },
  {
    name: "Cheias 2015: Prefeitura divulga boletim atualizado",
    organization: "Prefeitura Municipal de Pelotas",
    date: "20/10/2015",
    url: "https://www.pelotas.com.br/noticia/cheias-2015-prefeitura-divulga-boletim-atualizado",
    role: "Registra resgates, pessoas fora de casa e a leitura do Canal São Gonçalo em 20 de outubro.",
  },
  {
    name: "Prefeito decreta situação de emergência devido à cheia",
    organization: "G1 RS",
    date: "20/10/2015",
    url: "https://g1.globo.com/rs/rio-grande-do-sul/noticia/2015/10/prefeito-de-pelotas-decreta-situacao-de-emergencia-devido-cheia-no-rs.html",
    role: "Reportagem do dia do decreto, com retirada de moradores, apoio militar, corte de energia e queda do trapiche.",
  },
  {
    name: "Situação de emergência: prefeito reúne o secretariado",
    organization: "Prefeitura Municipal de Pelotas",
    date: "21/10/2015",
    url: "https://www.pelotas.rs.gov.br/index.php/noticia/situacao-de-emergencia-prefeito-reune-o-secretariado",
    role: "Fonte para os 299 mm de chuva, a explicação da cheia e o número de pessoas retiradas das áreas atingidas.",
  },
  {
    name: "Enchentes 2015: boletim atualizado às 8h30min",
    organization: "Prefeitura Municipal de Pelotas",
    date: "22/10/2015",
    url: "https://www.pelotas.rs.gov.br/index.php/noticia/enchentes-2015-boletim-atualizado-as-8h30min",
    role: "Registra a nova subida dos níveis na manhã de 22 de outubro.",
  },
  {
    name: "Transporte coletivo retoma atividade na Colônia Z3",
    organization: "Prefeitura Municipal de Pelotas",
    date: "23/10/2015",
    url: "https://www.pelotas.com.br/noticia/transporte-coletivo-retoma-atividade-na-colonia-z3",
    role: "Registra a redução do nível da Lagoa e a volta dos ônibus à Z3.",
  },
  {
    name: "Começa a construção de dique no Pontal da Barra",
    organization: "Prefeitura Municipal de Pelotas",
    date: "25/10/2015",
    url: "https://www.pelotas.com.br/noticia/comeca-a-construcao-de-dique-no-pontal-da-barra",
    role: "Documenta o início do dique e as dimensões previstas para a obra.",
  },
  {
    name: "Cheias 2015: boletim atualizado às 18h",
    organization: "Prefeitura Municipal de Pelotas",
    date: "26/10/2015",
    url: "https://pelotashomolog.coinpel.com.br/noticia/cheias-2015-boletim-atualizado-as-18h",
    role: "Registra níveis da manhã e da tarde, volta da energia e continuidade do atendimento à Barra.",
  },
  {
    name: "Nível da Lagoa dos Patos diminui mas moradores ainda não devem retornar às casas",
    organization: "GZH",
    date: "27/10/2015",
    url: "https://gauchazh.clicrbs.com.br/geral/noticia/2015/10/nivel-da-lagoa-dos-patos-diminui-mas-moradores-ainda-nao-devem-retornar-as-casas-cj5w4c09l1aj4xbj0f6wchaut.html",
    role: "Reportagem que cita a Defesa Civil para a Lagoa em 1,60 m, queda de 40 cm, 137 pessoas em abrigos e situação da energia.",
  },
  {
    name: "Arquivo municipal de Segurança Pública - página 84",
    organization: "Prefeitura Municipal de Pelotas",
    date: "25-29/10/2015",
    url: "https://pelotashomolog.coinpel.com.br/listar-noticias?categoria=Seguran%C3%A7a+P%C3%BAblica&page=84",
    role: "Confirma a existência dos boletins publicados entre 25 e 29 de outubro, inclusive mais de uma atualização em alguns dias.",
  },
  {
    name: "Cheias 2015: boletim atualizado às 11h",
    organization: "Prefeitura Municipal de Pelotas",
    date: "28/10/2015",
    url: "https://www.pelotas.rs.gov.br/index.php/noticia/cheias-2015-boletim-atualizado-as-11h",
    role: "Registra os níveis de 28 de outubro, os valores do fim da tarde de 27 e o número de pessoas em abrigos.",
  },
  {
    name: "Prejuízos públicos em Pelotas ultrapassam R$ 40 milhões",
    organization: "GZH",
    date: "28/10/2015",
    url: "https://gauchazh.clicrbs.com.br/geral/noticia/2015/10/prejuizos-publicos-em-pelotas-ultrapassam-r-40-milhoes-cj5w4d3cf1akrxbj0i844scuk.html",
    role: "Reportagem que cita a Defesa Civil para Lagoa em 1,80 m e São Gonçalo em 2,04 m por volta das 14h.",
  },
  {
    name: "União reconhece Situação de Emergência de Pelotas",
    organization: "Prefeitura Municipal de Pelotas",
    date: "28/10/2015",
    url: "https://pelotashomolog.coinpel.com.br/noticia/uniao-reconhece-situacao-de-emergencia-de-pelotas",
    role: "Registra a divulgação do reconhecimento federal e a continuidade do dique emergencial.",
  },
  {
    name: "Sanep conclui dique de contenção emergencial no Laranjal",
    organization: "Prefeitura Municipal de Pelotas",
    date: "30/10/2015",
    url: "https://www.pelotas.com.br/noticia/sanep-conclui-dique-de-contencao-emergencial-no-laranjal",
    role: "Documenta a conclusão do dique, suas dimensões e o começo da baixa da água no Valverde e Novo Valverde.",
  },
  {
    name: "Defesa Civil encerra operações na Administração do Laranjal",
    organization: "Prefeitura Municipal de Pelotas",
    date: "03/11/2015",
    url: "https://www.pelotas.rs.gov.br/index.php/noticia/defesa-civil-encerra-operacoes-na-administracao-do-laranjal",
    role: "Marca a estabilização da cheia, as últimas medições e a passagem para a recuperação.",
  },
  {
    name: "Cheias: equipes mobilizadas na limpeza das áreas atingidas",
    organization: "Prefeitura Municipal de Pelotas",
    date: "05/11/2015",
    url: "https://www.pelotas.com.br/noticia/cheias-equipes-mobilizadas-na-limpeza-das-areas-atingidas",
    role: "Documenta a volta para casa, o fechamento dos abrigos e a limpeza das áreas atingidas.",
  },
  {
    name: "Cheias 2015: balanço registra mobilização gigantesca",
    organization: "Prefeitura Municipal de Pelotas",
    date: "06/11/2015",
    url: "https://www.pelotas.rs.gov.br/index.php/noticia/cheias-2015-balanco-registra-mobilizacao-gigantesca",
    role: "Reúne o período mais crítico, famílias atendidas, níveis, danos, infraestrutura e frequência dos boletins.",
  },
] as const;