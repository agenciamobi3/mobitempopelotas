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
    date: "14 de outubro · tarde",
    title: "A Prefeitura entra em alerta antes do auge da cheia",
    stage: "lagoa",
    stageLabel: "Prelúdio documentado",
    paragraphs: [
      "Cinco dias antes do período mais crítico, a Prefeitura já relacionava a subida da Lagoa dos Patos ao escoamento para o sul das águas do Guaíba e mantinha as secretarias envolvidas em alerta.",
      "A Defesa Civil retirava famílias do Cedrinho, na Z3. No Santo Antônio, a água alcançava a área do shopping Mar de Dentro e, no Valverde, o trapiche estava praticamente submerso.",
      "Até 13 de outubro, o acumulado mensal de chuva era de 170 mm, diante da média de 101 mm citada pelo Município. A régua da Casa de Bombas do Porto marcava 2,10 m de profundidade naquela tarde.",
    ],
    measurements: [
      { label: "Chuva em outubro até 13/10", value: "170 mm", detail: "média de outubro citada pela Prefeitura: 101 mm" },
      { label: "Casa de Bombas do Porto", value: "2,10 m", detail: "profundidade na régua local; não é cota diretamente comparável à série Lagoa/São Gonçalo" },
    ],
    highlight:
      "A cheia já apresentava sinais operacionais antes do auge de 18-19/10; a régua do Porto é preservada como referência própria.",
  },
  {
    date: "18-19 de outubro de 2015",
    title: "O período mais crítico da cheia",
    stage: "pelotas",
    stageLabel: "Laranjal, Z3, Barra e áreas baixas",
    paragraphs: [
      "O balanço municipal publicado em 6 de novembro identificou a noite de 18 para 19 de outubro como o período mais crítico do evento.",
      "A Prefeitura associou o cenário às chuvas intensas, ao excedente do Guaíba chegando à Lagoa dos Patos e às contribuições da Lagoa Mirim e dos rios Piratini e Jaguarão para o Canal São Gonçalo.",
      "Valverde, Novo Valverde, Pontal da Barra, Z3, Barra e Doquinhas aparecem entre as áreas atingidas nos registros municipais.",
    ],
    highlight:
      "O pico é uma conclusão do balanço retrospectivo de 06/11, não uma reconstrução feita a partir de leituras soltas.",
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
      "A atualização preserva também a variação desde a manhã: a Lagoa dos Patos havia baixado 30 cm e o Canal São Gonçalo havia recuado 21 cm.",
    ],
    measurements: [
      { label: "Canal São Gonçalo", value: "2,04 m", detail: "tarde de 20/10" },
      { label: "Variação do São Gonçalo", value: "-21 cm", detail: "desde a manhã" },
      { label: "Variação da Lagoa", value: "-30 cm", detail: "desde a manhã; sem cota absoluta no boletim" },
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
    highlight:
      "O G1 é usado como registro complementar do dia do decreto; os números operacionais principais permanecem ancorados nos boletins municipais.",
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
      "O boletim da manhã seguinte preservou como referência para o dia 21 as leituras de 2,12 m no São Gonçalo e 1,60 m na Lagoa dos Patos.",
    ],
    measurements: [
      { label: "Canal São Gonçalo", value: "2,12 m", detail: "referência do dia 21 citada no boletim de 22/10" },
      { label: "Lagoa dos Patos", value: "1,60 m", detail: "referência do dia 21 citada no boletim de 22/10" },
      { label: "Chuva em outubro", value: "299 mm", detail: "Embrapa, acumulado até 20/10" },
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
    measurements: [
      { label: "Canal São Gonçalo", value: "2,18 m", detail: "+6 cm frente à referência do dia 21" },
      { label: "Lagoa dos Patos", value: "1,90 m", detail: "+30 cm frente à referência do dia 21" },
    ],
    highlight:
      "A cheia não recuou em linha reta: vento e níveis regionais produziram novas oscilações durante a emergência.",
  },
  {
    date: "23 de outubro",
    title: "A baixa da Lagoa permite reabrir o acesso de ônibus à Z3",
    stage: "pelotas",
    stageLabel: "Primeiros sinais de recuo",
    paragraphs: [
      "A Prefeitura informou que a estrada de acesso à Colônia de Pescadores Z3 voltou a receber transporte coletivo na tarde de sexta-feira, depois de elevação da pista e correção de danos do alagamento.",
      "A Defesa Civil havia restringido a passagem dos ônibus no início da semana. O Município atribuiu a normalização do acesso à baixa dos níveis da Lagoa dos Patos naquele dia.",
      "A própria notícia anunciava novo boletim de alagamentos para 17h30, um exemplo da frequência operacional adotada durante a emergência.",
    ],
  },
  {
    date: "25 de outubro",
    title: "Começa a construção do dique no Pontal da Barra",
    stage: "pelotas",
    stageLabel: "Obra emergencial",
    paragraphs: [
      "Após vistoria realizada no dia 24, a Prefeitura iniciou no domingo um dique para separar o banhado das áreas habitadas e favorecer o escoamento por bombas e canais já existentes.",
      "O projeto previa aproximadamente 2 km de extensão e 3 m de largura, com duas frentes de trabalho em sentidos opostos.",
      "O texto municipal voltou a atribuir a enchente ao somatório entre o grande volume no São Gonçalo, a Lagoa dos Patos elevada pela contribuição do Guaíba e ventos desfavoráveis ao escoamento para o mar.",
    ],
    highlight: "Dique emergencial: aproximadamente 2 km de extensão e 3 m de largura.",
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
    measurements: [
      { label: "Lagoa dos Patos · 10h30", value: "1,80 m" },
      { label: "Lagoa dos Patos · tarde", value: "1,70 m", detail: "-10 cm no intervalo informado" },
      { label: "Canal São Gonçalo · manhã", value: "2,16 m", detail: "dado mais recente citado no boletim das 18h" },
    ],
  },
  {
    date: "27 de outubro · manhã",
    title: "Lagoa recua 40 cm, mas Defesa Civil ainda desaconselha o retorno",
    stage: "lagoa",
    stageLabel: "Corroboração contemporânea da Defesa Civil",
    paragraphs: [
      "Como os corpos dos boletins municipais de 27/10 continuam inacessíveis, esta leitura foi resgatada em reportagem contemporânea da GZH que atribui os dados à Defesa Civil de Pelotas.",
      "A Lagoa dos Patos havia baixado 40 cm naquela manhã e media 1,60 m. A água recuava nas ruas e nenhuma família havia sido resgatada nas horas anteriores, mas a orientação ainda era não retornar às casas por causa da previsão de ventos fortes.",
      "Ainda havia 137 pessoas em abrigos. A CEEE já havia restabelecido a energia em 1.270 casas e avaliava outros 686 pontos sem luz. O dique provisório do Valverde seguia em construção.",
    ],
    measurements: [
      { label: "Lagoa dos Patos", value: "1,60 m", detail: "manhã de 27/10; GZH citando Defesa Civil de Pelotas" },
      { label: "Variação da Lagoa", value: "-40 cm", detail: "na manhã de 27/10, segundo a mesma fonte" },
      { label: "Pessoas em abrigos", value: "137", detail: "registro contemporâneo da Defesa Civil reproduzido pela GZH" },
    ],
    highlight:
      "Corroboração contemporânea: a leitura não substitui os boletins municipais de 11h e 19h, cujos corpos continuam perdidos.",
  },
  {
    date: "27 de outubro · fim da tarde",
    title: "A série oficial registra 2,02 m no São Gonçalo e 1,80 m na Lagoa",
    stage: "lagoa",
    stageLabel: "Níveis restatados pelo boletim seguinte",
    paragraphs: [
      "O arquivo municipal lista boletins às 11h e às 19h em 27 de outubro, mas os corpos dessas duas páginas antigas ainda não foram recuperados.",
      "Há, porém, uma referência oficial inequívoca no boletim de 28 de outubro: a Prefeitura informa que as leituras daquela manhã eram as mesmas do final da tarde do dia anterior.",
      "Por isso, os valores abaixo podem ser associados ao fim da tarde de 27 sem reconstruir o restante das leituras daquele dia.",
    ],
    measurements: [
      { label: "Canal São Gonçalo", value: "2,02 m", detail: "fim da tarde de 27/10, restatado no boletim oficial de 28/10" },
      { label: "Lagoa dos Patos", value: "1,80 m", detail: "fim da tarde de 27/10, restatado no boletim oficial de 28/10" },
    ],
  },
  {
    date: "28 de outubro · 11h",
    title: "Chuva e vento mantêm os níveis do fim da tarde anterior",
    stage: "pelotas",
    stageLabel: "Boletim oficial",
    paragraphs: [
      "A Prefeitura informou que os fortes ventos da madrugada e a chuva até as 2h mantiveram inalterados os níveis da Lagoa e do São Gonçalo em relação ao fim da tarde anterior.",
      "Ainda permaneciam 137 pessoas em abrigos oficiais: 123 da Z3 e 14 de Novo Valverde, Pontal da Barra e Valverde.",
      "No mesmo dia, o Município divulgou o reconhecimento federal da Situação de Emergência. A Prefeitura também trabalhava no dique emergencial para setorizar a área habitada e favorecer a drenagem.",
    ],
    measurements: [
      { label: "Canal São Gonçalo", value: "2,02 m", detail: "inalterado frente ao fim da tarde de 27/10" },
      { label: "Lagoa dos Patos", value: "1,80 m", detail: "inalterada frente ao fim da tarde de 27/10" },
      { label: "Pessoas em abrigos oficiais", value: "137", detail: "123 da Z3 e 14 de Novo Valverde, Pontal da Barra e Valverde" },
    ],
  },
  {
    date: "28 de outubro · cerca de 14h",
    title: "Nova medição mostra o São Gonçalo em 2,04 m",
    stage: "lagoa",
    stageLabel: "Corroboração contemporânea da Defesa Civil",
    paragraphs: [
      "Uma reportagem da GZH publicada às 14h01 registrou a medição mais recente da Defesa Civil naquele momento: a Lagoa permanecia em 1,80 m e o Canal São Gonçalo aparecia em 2,04 m.",
      "A leitura intermediária mostra uma oscilação de 2 cm no canal em relação ao boletim municipal das 11h, enquanto a Lagoa permanecia no mesmo valor.",
      "A mesma reportagem registrou 137 pessoas ainda em abrigos e reproduziu a estimativa municipal de mais de 3 mil casas e cerca de 10 mil pessoas atingidas, com levantamento ainda não finalizado.",
    ],
    measurements: [
      { label: "Canal São Gonçalo", value: "2,04 m", detail: "última medição da Defesa Civil citada pela GZH às 14h01" },
      { label: "Lagoa dos Patos", value: "1,80 m", detail: "última medição da Defesa Civil citada pela GZH às 14h01" },
      { label: "Variação do São Gonçalo", value: "+2 cm", detail: "comparação com o boletim oficial das 11h; não substitui o boletim perdido das 18h" },
    ],
    highlight:
      "O boletim municipal das 18h continua sem corpo recuperado; esta medição documenta apenas o meio da tarde.",
  },
  {
    date: "29 de outubro",
    title: "O arquivo oficial registra nova atualização às 11h",
    stage: "pelotas",
    stageLabel: "Arquivo municipal",
    paragraphs: [
      "A listagem histórica da Prefeitura confirma uma nova edição de “Cheias 2015 - Boletim atualizado às 11h” em 29 de outubro.",
      "O corpo dessa notícia não está sendo entregue de forma confiável pelo arquivo público atual. A GZH também preserva no seu índice uma matéria daquele dia sobre a queda do número de desabrigados em Pelotas e Rio Grande, mas o corpo dessa reportagem tampouco foi recuperado nesta pesquisa.",
      "Por isso, esta linha do tempo registra a existência documental das publicações, mas não atribui a elas níveis, totais ou tendência que não tenham sido recuperados do texto original.",
    ],
    highlight: "Boletim identificado; medições não preenchidas sem o corpo documental.",
  },
  {
    date: "3 de novembro · manhã",
    title: "A Defesa Civil encerra o plantão especial no Laranjal",
    stage: "pelotas",
    stageLabel: "Estabilização e recuperação",
    paragraphs: [
      "Com a situação considerada estável, a Defesa Civil anunciou o encerramento do plantão na Administração do Laranjal para 4 de novembro.",
      "Na manhã do dia 3, o São Gonçalo registrava 1,80 m e a Lagoa dos Patos 1,40 m nas referências usadas naquele acompanhamento.",
      "O trabalho passava a se concentrar na recuperação: drenagem de água remanescente, ensaibramento e retirada de móveis e entulhos.",
    ],
    measurements: [
      { label: "Canal São Gonçalo", value: "1,80 m", detail: "manhã de 03/11" },
      { label: "Lagoa dos Patos", value: "1,40 m", detail: "manhã de 03/11" },
    ],
  },
  {
    date: "5 de novembro",
    title: "A operação passa da emergência para limpeza e reconstrução",
    stage: "pelotas",
    stageLabel: "Retorno às casas",
    paragraphs: [
      "Com o escoamento das águas, a Prefeitura concentrou equipes na limpeza de ruas, canais e orla do Laranjal e na retirada de móveis descartados e entulhos.",
      "No dia 4 haviam sido recolhidas 19 cargas de móveis e entulho na orla e sete cargas no Pontal da Barra e Valverde. No dia 5, três caçambas e duas retroescavadeiras trabalhavam na retirada de aguapés e juncos.",
      "A Prefeitura informou que já não havia desabrigados no Valverde nem na Z3 e que os abrigos do Laranjal Praia Clube e do CRAS São Gonçalo haviam sido desativados.",
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
      "Para a Lagoa dos Patos, o balanço informa que a régua de 1,80 m ficou submersa e cita 0,60 m como altura normal para o período. Sem uma leitura calibrada acima do limite da régua, a página não transforma esse registro em um pico numérico da Lagoa.",
      "A estimativa de prejuízos usada na fundamentação da Situação de Emergência ficou em cerca de R$ 40 milhões, e o dique emergencial reforçado e ampliado tinha aproximadamente 2 km de comprimento e 3 m de largura.",
      "O mesmo documento confirma que a Assessoria de Comunicação publicou boletins diariamente, duas ou mais vezes, transformando a série municipal em uma fonte especialmente rica para reconstruir a evolução da cheia.",
    ],
    measurements: [
      { label: "Canal São Gonçalo · pico retrospectivo", value: "2,20 m", detail: "balanço de 06/11; normal citado: 1,20 m" },
      { label: "Lagoa dos Patos", value: "> 1,80 m", detail: "régua de 1,80 m ficou submersa; sem pico calibrado informado" },
    ],
    highlight:
      "~1.300 famílias atendidas ao longo do episódio · São Gonçalo 2,20 m na referência de 2015",
  },
];

export const FLOOD_2015_ARCHIVE: Flood2015ArchiveEntry[] = [
  {
    date: "25/10",
    publications: ["Defesa Civil remove 14 pessoas neste domingo", "Começa a construção de dique no Pontal da Barra"],
    retrieval: "full",
    note: "O arquivo confirma a continuidade dos resgates; o texto integral do dique foi recuperado e incorporado à cronologia.",
  },
  {
    date: "26/10",
    publications: ["Boletim atualizado às 11h", "Boletim atualizado às 18h"],
    retrieval: "full",
    note: "A edição das 18h foi recuperada integralmente e preserva leituras da manhã e da tarde.",
  },
  {
    date: "27/10",
    publications: ["Boletim atualizado às 11h", "Boletim atualizado às 19h"],
    retrieval: "indexed",
    note: "As duas edições aparecem no índice oficial, com URLs históricas terminadas em 39270 e 39279. Os corpos seguem indisponíveis; a leitura da manhã foi resgatada pela GZH citando a Defesa Civil e os valores do fim da tarde são restatados pelo boletim oficial de 28/10.",
  },
  {
    date: "28/10",
    publications: ["Boletim atualizado às 11h", "Boletim atualizado às 18h", "União reconhece Situação de Emergência de Pelotas"],
    retrieval: "full",
    note: "A edição das 11h e o reconhecimento federal foram recuperados. A edição das 18h, URL histórica terminada em 39294, segue sem corpo; uma medição intermediária por volta de 14h foi resgatada pela GZH citando a Defesa Civil.",
  },
  {
    date: "29/10",
    publications: ["Boletim atualizado às 11h"],
    retrieval: "indexed",
    note: "A existência da edição está comprovada pelo índice municipal, mas o corpo antigo não é entregue de forma confiável pelo arquivo atual. Um índice contemporâneo da GZH comprova notícia sobre queda de desabrigados, também sem corpo recuperado.",
  },
  {
    date: "03/11",
    publications: ["Boletim atualizado às 11h", "Defesa Civil encerra operações na Administração do Laranjal"],
    retrieval: "full",
    note: "As últimas leituras operacionais foram recuperadas no comunicado de encerramento do plantão.",
  },
] as const;

export const FLOOD_2015_SOURCES: Flood2015Source[] = [
  {
    name: "Nível da Lagoa dos Patos sobe e põe prefeitura em alerta",
    organization: "Prefeitura Municipal de Pelotas",
    date: "14/10/2015",
    url: "https://www.pelotas.com.br/noticia/nivel-da-lagoa-dos-patos-sobe-e-poe-prefeitura-em-alerta",
    role: "Registra o prelúdio da cheia, 170 mm acumulados até 13/10, evacuações na Z3 e a régua local da Casa de Bombas do Porto.",
  },
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
    role: "Boletim contemporâneo de resgates, desalojados, variações desde a manhã e leitura do Canal São Gonçalo.",
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
    role: "Registra a nova subida associada ao vento e permite comparar as referências do dia 21 com a manhã de 22.",
  },
  {
    name: "Transporte coletivo retoma atividade na Colônia Z3",
    organization: "Prefeitura Municipal de Pelotas",
    date: "23/10/2015",
    url: "https://www.pelotas.com.br/noticia/transporte-coletivo-retoma-atividade-na-colonia-z3",
    role: "Registra a baixa da Lagoa e a retomada do acesso de ônibus à Z3.",
  },
  {
    name: "Começa a construção de dique no Pontal da Barra",
    organization: "Prefeitura Municipal de Pelotas",
    date: "25/10/2015",
    url: "https://www.pelotas.com.br/noticia/comeca-a-construcao-de-dique-no-pontal-da-barra",
    role: "Documenta a obra emergencial, dimensões previstas e o mecanismo hidrológico descrito pelo Município.",
  },
  {
    name: "Cheias 2015: boletim atualizado às 18h",
    organization: "Prefeitura Municipal de Pelotas",
    date: "26/10/2015",
    url: "https://pelotashomolog.coinpel.com.br/noticia/cheias-2015-boletim-atualizado-as-18h",
    role: "Registra leituras da manhã e tarde, restabelecimento de energia, drenagem e continuidade da assistência à Barra.",
  },
  {
    name: "Nível da Lagoa dos Patos diminui mas moradores ainda não devem retornar às casas",
    organization: "GZH",
    date: "27/10/2015",
    url: "https://gauchazh.clicrbs.com.br/geral/noticia/2015/10/nivel-da-lagoa-dos-patos-diminui-mas-moradores-ainda-nao-devem-retornar-as-casas-cj5w4c09l1aj4xbj0f6wchaut.html",
    role: "Corroboração jornalística contemporânea que atribui à Defesa Civil a leitura de 1,60 m da Lagoa, queda de 40 cm, 137 abrigados e situação da energia.",
  },
  {
    name: "Arquivo municipal de Segurança Pública - página 84",
    organization: "Prefeitura Municipal de Pelotas",
    date: "25-29/10/2015",
    url: "https://pelotashomolog.coinpel.com.br/listar-noticias?categoria=Seguran%C3%A7a+P%C3%BAblica&page=84",
    role: "Inventário oficial que comprova as edições de boletins em 25, 26, 27, 28 e 29 de outubro, inclusive mais de uma atualização em alguns dias.",
  },
  {
    name: "Cheias 2015: boletim atualizado às 11h",
    organization: "Prefeitura Municipal de Pelotas",
    date: "28/10/2015",
    url: "https://www.pelotas.rs.gov.br/index.php/noticia/cheias-2015-boletim-atualizado-as-11h",
    role: "Fonte para os níveis de 28/10 e para os mesmos valores registrados no fim da tarde de 27/10, além do número de pessoas ainda em abrigos.",
  },
  {
    name: "Prejuízos públicos em Pelotas ultrapassam R$ 40 milhões",
    organization: "GZH",
    date: "28/10/2015",
    url: "https://gauchazh.clicrbs.com.br/geral/noticia/2015/10/prejuizos-publicos-em-pelotas-ultrapassam-r-40-milhoes-cj5w4d3cf1akrxbj0i844scuk.html",
    role: "Corroboração jornalística contemporânea que reproduz a última medição da Defesa Civil por volta das 14h: Lagoa 1,80 m e São Gonçalo 2,04 m.",
  },
  {
    name: "União reconhece Situação de Emergência de Pelotas",
    organization: "Prefeitura Municipal de Pelotas",
    date: "28/10/2015",
    url: "https://pelotashomolog.coinpel.com.br/noticia/uniao-reconhece-situacao-de-emergencia-de-pelotas",
    role: "Registra a divulgação municipal do reconhecimento federal e a estratégia do dique emergencial.",
  },
  {
    name: "Defesa Civil encerra operações na Administração do Laranjal",
    organization: "Prefeitura Municipal de Pelotas",
    date: "03/11/2015",
    url: "https://www.pelotas.rs.gov.br/index.php/noticia/defesa-civil-encerra-operacoes-na-administracao-do-laranjal",
    role: "Marca a estabilização, as últimas leituras operacionais e a transição para a recuperação.",
  },
  {
    name: "Cheias: equipes mobilizadas na limpeza das áreas atingidas",
    organization: "Prefeitura Municipal de Pelotas",
    date: "05/11/2015",
    url: "https://www.pelotas.com.br/noticia/cheias-equipes-mobilizadas-na-limpeza-das-areas-atingidas",
    role: "Documenta retorno às casas, desativação dos abrigos e a escala da limpeza após o escoamento das águas.",
  },
  {
    name: "Cheias 2015: balanço registra mobilização gigantesca",
    organization: "Prefeitura Municipal de Pelotas",
    date: "06/11/2015",
    url: "https://www.pelotas.rs.gov.br/index.php/noticia/cheias-2015-balanco-registra-mobilizacao-gigantesca",
    role: "Balanço retrospectivo para pico crítico, famílias atendidas, impactos, limite da régua da Lagoa, infraestrutura e frequência dos boletins oficiais.",
  },
] as const;
