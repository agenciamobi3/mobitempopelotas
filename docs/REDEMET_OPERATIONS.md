# REDEMET / DECEA — operação atual do Tempo Pelotas

Última consolidação: 07/09/2026.

Este documento é a fonte de verdade operacional para radar, satélite e trovoadas da REDEMET no Tempo Pelotas. Ele substitui, para a implementação nativa em `src/`, referências antigas que ainda possam existir em `_legacy/`.

## Resumo do estado atual

- A integração REDEMET é server-side e depende de `REDEMET_API_KEY`.
- O Tempo Pelotas possui acesso autorizado à API da REDEMET/DECEA para coleta automatizada de produtos meteorológicos oficiais.
- Essa autorização permite a conexão técnica entre sistemas; não deve ser descrita como chancela editorial, certificação ou endosso da REDEMET/DECEA ao Tempo Pelotas.
- A credencial nunca deve usar prefixo `VITE_`, nunca deve ser enviada ao browser e nunca deve aparecer em logs, screenshots, HARs versionados ou mensagens de diagnóstico.
- O radar operacional para Pelotas é selecionado pela disponibilidade real e pela cobertura geográfica da imagem.
- Em 18/08/2026, os HARs oficiais analisados mostraram Canguçu (`cn`) cadastrado, porém sem `path` e sem timestamp de imagem recente, enquanto Santiago (`sg`) entregava imagem válida.
- O MAXCAPPI de Santiago observado cobria Pelotas; produtos de alcance menor só podem ser usados quando os bounds efetivamente incluírem Pelotas.
- Canguçu continua como alternativa automática quando voltar a entregar imagem oficial adequada.
- Na rota `/radar-e-satelite-pelotas`, o PNG do radar é georreferenciado pelos bounds oficiais sobre a base MapLibre/OpenFreeMap, com Pelotas marcada; a imagem bruta permanece como fallback se a base cartográfica falhar.
- A página dedicada mantém teto de 2,8 s no documento inicial. Se a composição REDEMET ainda não terminou nesse prazo, o navegador faz uma única recuperação pós-hidratação e preserva qualquer coleta que já tenha chegado.
- Para a composição pública dedicada, o overview prioriza uma janela curta de dados reais: até 4 imagens por camada e 6 leituras STSC. Os endpoints diretos continuam aceitando seus limites maiores de 8 imagens e 12 leituras STSC.
- A página mostra os horários que vieram nas próprias coletas. Não cria horários para preencher lacunas e não transforma ausência de coleta em zero.
- A copy pública usa linguagem simples e separa observação, previsão e aviso oficial. O radar não mede os números da previsão e STSC não é apresentado como alerta oficial.
- A referência temporal dos produtos REDEMET/TSC é UTC/Z. Timestamps recebidos sem sufixo de zona são normalizados como UTC e só depois formatados para `America/Sao_Paulo` na interface.
- A interface rejeita timestamps inválidos ou mais de cinco minutos no futuro para o cálculo de “imagem mais recente”; eles aparecem como horário da fonte em verificação e não como “Atualizado agora”.
- Satélite e STSC continuam independentes da disponibilidade do radar.

## Arquivos ativos

- `src/lib/redemet/redemet-radar.server.ts`: seleção resiliente do radar e parsing da resposta oficial.
- `src/lib/redemet/redemet-stsc.server.ts`: contrato atual do STSC/trovoadas e requisição da janela de animação.
- `src/lib/redemet/redemet-display-time.ts`: validação defensiva, frescor e apresentação dos timestamps REDEMET.
- `src/lib/redemet/redemet.functions.ts`: composição server-side do overview e janelas públicas compactas.
- `src/lib/redemet/radar-page-loader.ts`: teto curto do documento inicial da página dedicada.
- `src/production/lib/redemet-browser-recovery.ts`: recuperação única pós-hidratação quando o SSR entrega fallback incompleto.
- `src/lib/redemet/redemet.server.ts`: integração de satélite e compatibilidade histórica; não é a fonte de verdade do radar novo.
- `src/lib/redemet/redemet-last-good.server.ts`: último quadro válido durante indisponibilidades curtas.
- `src/routes/api/redemet/radar.ts`: endpoint público sanitizado do radar.
- `src/routes/api/redemet/satellite.ts`: endpoint público sanitizado de satélite.
- `src/routes/api/redemet/storms.ts`: endpoint público sanitizado do STSC.
- `src/routes/api/redemet/image.ts`: proxy controlado das imagens oficiais.
- `src/production/components/weather-map.tsx`: renderização MapLibre na Home.
- `src/components/redemet/RadarMapFrame.tsx`: georreferenciamento do frame do radar na página dedicada.
- `src/components/redemet/RedemetOverview.tsx`: monitor público com coletas reais, horários e controles de sequência.
- `src/components/redemet/RedemetDerivedContext.tsx`: histórico curto dos horários realmente recebidos e distância de ocorrências STSC.
- `src/components/redemet/RadarForecastContext.tsx`: comparação explícita entre a imagem observada e a previsão horária mais próxima.
- `tests/redemet-performance.test.ts`: contratos de regressão extraídos dos formatos observados.
- `tests/redemet-display-time-and-map.test.ts`: contrato de timezone, proteção contra timestamp futuro e georreferenciamento do radar dedicado.
- `tests/radar-satellite-retail.test.ts`: contrato da página dedicada, recuperação, copy e visual.

## Radar

### Contrato observado

A resposta de `produtos/radar/{produto}` pode trazer registros de várias estações. A seleção da estação é feita no servidor depois que a resposta chega; não se deve assumir que o parâmetro `area` é necessário para obter o conjunto correto.

Cada registro útil precisa conter, no mínimo:

- `localidade` da estação;
- `path` de uma imagem oficial permitida;
- `data` ou timestamp equivalente;
- `lon_min`, `lon_max`, `lat_min` e `lat_max` válidos.

A ausência de `path` é tratada como estação cadastrada, porém sem imagem disponível naquele quadro — não como falha de autenticação.

### Seleção para Pelotas

Ordem operacional de estações:

1. Santiago (`sg`), estado operacional observado em 18/08/2026;
2. Canguçu (`cn`), mantido como alternativa quando voltar a fornecer imagem recente.

A ordem pode começar pela área configurada em `REDEMET_RADAR_AREA`, mas o código sempre mantém os candidatos conhecidos. O template de ambiente deve usar `sg` enquanto Santiago for a estação operacional preferencial.

Ordem de produtos consultados:

1. `maxcappi`;
2. `10km`;
3. `07km`;
4. `05km`;
5. `03km`.

Um produto só pode ser exibido para Pelotas se os bounds do quadro incluírem as coordenadas de Pelotas. Isso evita mostrar um produto de Santiago com alcance insuficiente apenas porque a estação está operacional.

### Renderização georreferenciada na página dedicada

Na rota `/radar-e-satelite-pelotas`, o quadro selecionado não é mostrado como uma imagem escura isolada. O componente `RadarMapFrame` usa os bounds que já acompanham cada `RedemetImageFrame` para posicionar o PNG oficial como `image source` do MapLibre.

As coordenadas são aplicadas na ordem esperada pelo MapLibre:

1. oeste/norte;
2. leste/norte;
3. leste/sul;
4. oeste/sul.

A base cartográfica reutiliza o OpenFreeMap já adotado por outros mapas do projeto. O raster do radar é colocado abaixo das camadas de labels do mapa e usa opacidade controlada para que cidades, estradas e referências permaneçam visíveis através do fundo escuro do MAXCAPPI. Pelotas recebe um marcador discreto para orientação regional.

Durante reprodução/timeline, a troca de quadro atualiza a mesma image source em vez de recriar o mapa. Se os bounds mudarem, a câmera é reajustada. Se MapLibre, a base cartográfica ou a camada raster falharem, a imagem oficial bruta continua visível como fallback; o botão `Abrir imagem` continua apontando para o PNG via proxy controlado.

Essa composição aplica-se somente ao radar. As imagens de satélite permanecem apresentadas como imagens oficiais, sem georreferenciamento adicional na página dedicada.

### Coletas na página dedicada

A página não espera uma animação grande para decidir se existe dado. O overview solicita até 4 imagens recentes por camada e mantém os horários originais recebidos. Essa janela menor reduz a chance de o documento inicial cair em fallback apenas porque uma sequência maior demorou demais.

O limite de 4 imagens vale para a composição da página dedicada. O endpoint público de radar continua podendo responder até 8 quadros, conforme seu próprio contrato.

Se o teto SSR de 2,8 s vencer antes de `getRedemetOverview()` terminar, a página continua navegável e, após a hidratação, faz uma única nova leitura do overview. A mesclagem é conservadora: uma coleta já recebida não é apagada por uma tentativa posterior vazia.

### Evidência de agosto de 2026

Nos HARs analisados em 18/08/2026:

- Canguçu (`cn`) aparecia na resposta da REDEMET com `path: null` e `data: null`;
- Santiago (`sg`) aparecia com imagem MAXCAPPI recente e bounds que incluíam Pelotas;
- uma segunda fonte oficial analisada em modo de pesquisa (SIGMA/CPTEC) também mostrava Canguçu com último CAPPI antigo e Santiago com CAPPI atualizado. Essa fonte não faz parte do runtime de produção; ver `docs/CPTEC_SIGMA_RESEARCH.md`.

A conclusão operacional é: não rotular uma imagem de Santiago como se fosse de Canguçu. A interface deve sempre exibir a estação real que originou o quadro.

## Satélite

Os produtos usados pelo portal permanecem:

- `realcada` — infravermelho realçado;
- `ir` — infravermelho;
- `vis` — visível.

Satélite é uma camada independente do radar. Falha ou ausência de imagem de uma estação de radar não deve derrubar o satélite.

Na página dedicada, cada fonte de satélite mostra o horário real e a quantidade de imagens recebidas. Nuvens são descritas como nuvens; a página não transforma automaticamente uma imagem de satélite em confirmação de chuva no solo.

## Trovoadas / STSC

O contrato observado no portal oficial usa o endpoint STSC no formato `produtos/stsc/0`.

A resposta relevante pode trazer `data` como lista de quadros, com campos como:

- `start`;
- `stop`;
- `horario`;
- `ultima_ocorrencia`;
- `pontos`, com coordenadas `la` e `lo`.

### Referência temporal

A interface oficial da REDEMET identifica o relógio TSC e a última ocorrência em UTC e publica o horário de atualização com sufixo `Z`. Por isso, timestamps do STSC que chegam sem timezone explícito são tratados como UTC no parser. Somente a apresentação ao usuário é convertida para `America/Sao_Paulo`.

Não reinterpretar esses valores sem zona como `-03:00`: isso acrescenta três horas ao instante real e pode produzir um horário futuro na interface. A camada de apresentação também mantém uma segunda defesa: timestamps inválidos ou mais de cinco minutos no futuro são excluídos do cálculo global de “imagem mais recente” e exibidos como `Horário da fonte em verificação`.

### Janela temporal

Para obter uma sequência de quadros, a chamada upstream precisa enviar `anima=<quantidade>`. Omitir esse parâmetro pode resultar em apenas um quadro, o que faz a timeline aparentar uma sequência mesmo quando início e fim têm o mesmo horário.

Existem dois limites diferentes, por função:

- `src/routes/api/redemet/storms.ts` mantém o endpoint público limitado a **12 quadros**;
- `src/lib/redemet/redemet-stsc.server.ts` mantém o máximo técnico de **12 quadros**;
- `getRedemetOverview()` pede **6 leituras STSC** para a composição da página dedicada, priorizando resposta mais rápida com histórico real suficiente;
- a quantidade validada é enviada à REDEMET em `anima`;
- só depois da resposta o parser normaliza, ordena e recorta a janela pedida.

Não voltar ao comportamento de consultar um único quadro upstream e executar apenas `slice()` localmente. Isso não produz histórico real.

### Filtro regional e zero ocorrências

O Tempo Pelotas normaliza os quadros e mantém apenas pontos em um raio regional de até 450 km de Pelotas.

Um quadro com **zero pontos dentro desse raio pode ser um resultado válido**. Nesse caso:

- a camada continua disponível;
- zero não deve ser apresentado como falha de integração;
- a interface deve explicar que nenhum raio foi detectado naquele quadro dentro da área monitorada;
- zero ocorrências STSC não significa ausência de risco meteorológico e não substitui avisos oficiais.

STSC representa ocorrências detectadas de atividade elétrica e não deve ser apresentado como alerta meteorológico oficial.

Toda chamada nova da página e do overview deve usar `redemet-stsc.server.ts`; o parser antigo não é a fonte de verdade.

## Separação entre observação, previsão e aviso

Na página dedicada:

- radar, satélite e STSC são observações ou registros recebidos das fontes identificadas;
- `RadarForecastContext` pode mostrar a previsão horária mais próxima apenas como comparação separada;
- um valor ausente de rajada permanece `Não informado`; vento sustentado não substitui rajada na interface;
- a sequência de imagens mostra o passado recente e não é apresentada como previsão do movimento futuro;
- STSC não gera severidade ou alerta por conta própria;
- orientações de risco remetem aos avisos oficiais.

## Segurança

Regras obrigatórias:

- `REDEMET_API_KEY` somente no runtime de servidor;
- nunca adicionar a chave em `VITE_*`, HTML, JSON público, query string retornada ao browser ou atributos de DOM;
- nunca registrar a URL autenticada completa em logs;
- permitir apenas hosts oficiais explicitamente allowlisted;
- imagens passam pelo proxy do Tempo Pelotas, com validação de protocolo, host, tipo e tamanho;
- `.env` e variantes privadas ficam ignorados pelo Git;
- HARs que contenham credenciais são material de diagnóstico privado e não devem ser commitados.

O fato de o portal oficial poder usar uma credencial em query string não autoriza expor a chave do Tempo Pelotas. Quando o contrato externo exigir esse formato, a query autenticada é construída exclusivamente no servidor.

## Comunicação institucional

A formulação pública recomendada é:

> O Tempo Pelotas possui acesso autorizado à API da REDEMET/DECEA para coleta automatizada de produtos meteorológicos oficiais por conexão entre sistemas. As informações mantêm a identificação da fonte, do produto e do horário recebido.

Evitar formulações como “homologado pela REDEMET”, “certificado pela Aeronáutica” ou equivalentes, pois a autorização técnica de acesso não implica endosso institucional ao conteúdo editorial do portal.

## Cache e contingência

- Radar disponível: pode usar cache curto e `stale-while-revalidate` para reduzir carga.
- Radar indisponível: o TTL negativo deve permanecer curto para que uma estação que volte a operar seja detectada rapidamente.
- `withRedemetLastGood` pode manter temporariamente o último quadro válido durante falhas curtas, sem transformar dado antigo em dado atual.
- O documento inicial da página dedicada não espera mais de 2,8 s pela composição; fallback de SSR não encerra a tentativa de mostrar dados reais, porque existe uma única recuperação pós-hidratação.
- A recuperação não apaga quadros já disponíveis quando uma fonte volta vazia.
- Toda interface deve mostrar horário/origem e estado explícito de indisponibilidade.
- Timestamp futuro ou incompatível não pode ser promovido a quadro mais recente nem receber estado “Atualizado agora”.
- A página dedicada mantém o PNG oficial como fallback quando a base MapLibre/OpenFreeMap não puder ser carregada.

## Diagnóstico seguro

Quando uma camada falhar, registrar somente dados sanitizados, por exemplo:

- estação consultada;
- produto;
- quantidade de registros correspondentes;
- quantidade de registros com `path` utilizável;
- quantidade de quadros cujos bounds cobrem Pelotas;
- quantidade de quadros STSC retornados;
- quantidade de pontos STSC após filtro regional;
- código HTTP ou motivo normalizado da falha.

Nunca registrar headers de autenticação, valor da chave, cookies ou a URL autenticada completa.

## Validação

Os seguintes contratos devem continuar protegidos por testes e smoke de produção:

- radar não confunde Santiago com Canguçu;
- Canguçu com `path: null` não é tratado como imagem válida;
- Santiago/MAXCAPPI só é usado se os bounds cobrirem Pelotas;
- o quadro do radar dedicado é georreferenciado pelos bounds oficiais sobre MapLibre e mantém fallback para a imagem bruta;
- a rota pública não expõe segredo;
- a página mostra horários recebidos da fonte e não fabrica cadência ou timestamps;
- o overview dedicado pede 4 imagens e 6 leituras STSC, sem reduzir os limites dos endpoints diretos;
- fallback do SSR de 2,8 s recebe uma única recuperação pós-hidratação;
- uma recuperação vazia não apaga uma coleta já recebida;
- STSC aceita o formato observado em HAR, interpreta timestamps sem zona como UTC e filtra a área regional;
- timestamps futuros não dominam o resumo global nem são tratados como atualização recente;
- STSC envia a quantidade validada de quadros em `anima` para a API externa;
- o limite server-side do STSC permanece alinhado em 12 quadros;
- um quadro STSC válido com zero pontos regionais não é tratado como indisponibilidade;
- satélite continua disponível independentemente do radar;
- comparação com previsão não transforma vento sustentado em rajada;
- proxy de imagens bloqueia hosts não autorizados;
- respostas negativas de radar não ficam presas em cache longo.

Veja também:

- `docs/RUNTIME_READINESS.md`;
- `docs/CPTEC_SIGMA_RESEARCH.md`;
- `docs/ANA_RHN_INTEGRATION.md`;
- `MIGRATION_MATRIX.md`.
