# Auditoria de radar, satélite e STSC — 08/09/2026

## Escopo

Auditoria da rota pública `/radar-e-satelite-pelotas` e das integrações que a alimentam, cobrindo coleta server-side, parsing, segurança do proxy de imagens, contingência, timestamps, recuperação pós-hidratação, renderização e estados sem dado.

A auditoria diferencia quatro situações: produto oficial existente, integração do Tempo Pelotas capaz de consultá-lo, coleta realmente recebida nesta atualização e informação exibida ao visitante. Uma falha na integração não é convertida em afirmação de indisponibilidade global da instituição.

## Contratos confirmados

### Radar REDEMET

- credencial permanece server-only em `REDEMET_API_KEY`;
- autenticação do produto de radar segue o contrato observado nos HARs por `api_key` na requisição server-side;
- a seleção da estação ocorre sobre a resposta oficial, sem rotular Santiago como Canguçu;
- Santiago (`sg`) permanece candidato operacional principal e Canguçu (`cn`) alternativa quando houver imagem útil;
- produtos são tentados em ordem, começando por `maxcappi`;
- um quadro só é aceito para a página de Pelotas quando seus bounds realmente contêm as coordenadas de Pelotas;
- o PNG oficial é entregue pelo proxy sanitizado e georreferenciado sobre MapLibre usando os bounds do próprio quadro;
- se o mapa/base falhar, a imagem oficial bruta permanece como fallback.

### Satélite REDEMET

O backend mantém três produtos com semântica própria:

- `realcada` — infravermelho realçado;
- `ir` — infravermelho;
- `vis` — visível.

`realcada` e `ir` podem receber GOES/INMET como contingência oficial quando a REDEMET não entrega camada utilizável. `vis` nunca recebe fallback infravermelho. A rota pública `/api/redemet/satellite` preserva essa distinção.

A página dedicada agora expõe os três produtos em um seletor público. `realcada` continua sendo o estado inicial vindo da composição server-side; `ir` e `vis` são carregados sob demanda em janela de quatro imagens pelo endpoint existente, sem ampliar o SSR inicial.

### Satélite INMET

O adaptador atual usa GOES / Região Sul / produto `IV` e permanece separado da REDEMET. A integração:

- reproduz o contexto HTTP necessário ao portal público;
- em HTTP 403 faz somente a contingência controlada definida no adapter;
- não interpreta 403 como prova de indisponibilidade pública do INMET;
- aceita imagem direta ou resposta JSON/base64;
- o proxy valida host, tamanho e assinatura binária antes de entregar a imagem ao navegador.

O INMET documenta publicamente produtos de infravermelho termal, vapor d'água, visível e topo de nuvens, com atualização do serviço informada como diária a cada 15 minutos. O Tempo Pelotas só publica códigos de produto que foram tecnicamente validados; não inventa códigos para produtos adicionais.

### STSC / atividade elétrica

- a janela de animação é solicitada upstream com `anima`;
- a composição dedicada pede seis quadros, enquanto o endpoint público aceita até doze;
- timestamps sem zona no contrato STSC são tratados como UTC antes da apresentação em `America/Sao_Paulo`;
- pontos são filtrados para o recorte regional de até 450 km de Pelotas;
- um quadro válido com zero pontos continua sendo uma observação válida de zero ocorrências naquele quadro;
- zero ocorrências não é aviso de segurança nem substitui alertas oficiais.

## Correções aplicadas nesta auditoria

### 1. Contingência INMET não pode aparecer duas vezes

`getRedemetOverview()` mantém `satellite` como a camada selecionada e `inmetSatellite` como coleta independente. Quando a REDEMET falhava e o INMET assumia a contingência, `satellite` já passava a representar a própria camada INMET, enquanto a interface ainda renderizava `inmetSatellite` novamente.

A interface agora avalia o `provider` da camada de satélite efetivamente selecionada e:

- identifica a camada selecionada como `Satélite INMET · contingência` quando aplicável;
- não cria uma segunda linha/painel com a mesma coleta;
- não infla a contagem de fontes/conjuntos disponíveis;
- mantém origem, produto, horário e link oficial do provedor realmente usado.

No estado inicial Realçado, o histórico derivado segue a mesma regra.

### 2. Ausência de quadro STSC não é zero raios

A leitura derivada de distância usava lista vazia tanto para “quadro válido sem pontos” quanto para “nenhum quadro com horário utilizável”. Isso podia apresentar zero nas três faixas mesmo sem coleta.

Agora existem dois estados distintos:

- quadro válido + zero pontos: `Nenhum raio detectado na última coleta recebida`, com contagens 0;
- sem quadro utilizável: `Sem coleta STSC com horário utilizável`, com contagens `—` e explicação explícita de que isso não equivale a zero raios.

### 3. Recuperação do navegador inclui o satélite INMET

A rota abre com teto SSR curto de 2,8 s. Antes, a recuperação pós-hidratação era dispensada quando radar, satélite selecionado e STSC já haviam chegado, mesmo que o painel INMET independente tivesse ficado vazio no SSR.

A completude agora exige as quatro coleções que podem aparecer ao visitante: radar, satélite selecionado inicial, satélite INMET e STSC. A recuperação continua ocorrendo uma única vez e nunca apaga um quadro já recebido com uma tentativa posterior vazia.

### 4. Budget interno do radar alinhado ao pipeline

O adapter de radar abortava sozinho em 2,4 s, embora:

- o overview dê até 4,5 s para cada camada;
- o probe independente de status dê até 5 s;
- o SSR da página tenha teto próprio de 2,8 s e recuperação posterior.

Esse desalinhamento impedia o radar de usar boa parte do orçamento já reservado para recuperação/monitoramento. O budget interno foi ajustado para 4,2 s, ainda abaixo dos tetos de 4,5 s e 5 s. O SSR inicial continua limitado a 2,8 s; portanto a navegação inicial não ficou mais lenta por causa dessa alteração.

### 5. Produtos Realçado, Infravermelho e Visível promovidos à página dedicada

O seletor público usa três botões acessíveis com `aria-pressed`:

- **Realçado** — destaca contrastes e temperaturas de topo de nuvem para facilitar a leitura regional;
- **Infravermelho** — funciona dia e noite e mostra diferenças térmicas das nuvens;
- **Visível** — depende de luz solar e mostra cobertura de nuvens em luz refletida.

Regras da implementação:

- Realçado continua vindo de `data.satellite`, portanto preserva o loader e a recuperação pós-hidratação existentes;
- IR e Visível consultam `/api/redemet/satellite?type=<tipo>&frames=4` somente quando selecionados;
- troca rápida cancela a requisição anterior com `AbortController` e guarda a última resposta recebida por tipo na sessão do componente;
- enquanto um tipo sem cache carrega, a interface mostra busca explícita em vez de reutilizar dados de outro produto;
- se o fetch client-side falhar sem cache, a camada vazia usa `updatedAt: ""`; não é criado horário de atualização artificial;
- o resumo de fontes, o painel principal, produto, provider, quantidade de quadros e horários passam a acompanhar a camada selecionada;
- se Realçado ou IR forem atendidos pelo GOES/INMET como contingência, o painel INMET complementar é ocultado para não duplicar a mesma fonte/coleta;
- Visível permanece REDEMET mesmo indisponível e nunca recebe GOES infravermelho como substituto.

### 6. Estado noturno do canal Visível

Quando o backend devolve `availabilityReason: "daylight"`, a interface não transforma a situação em “fonte indisponível” genérica.

O estado público passa a ser `Aguardando luz solar` / `Canal Visível aguardando luz solar`, com explicação de que o canal usa luz solar refletida. Quando `nextExpectedAt` existe e é válido, a próxima janela é formatada separadamente em `America/Sao_Paulo`.

Essa formatação não reutiliza a validação de timestamp observacional, porque uma janela esperada é, por definição, futura. Ela também não cria uma coleta, frescor ou horário de atualização que a fonte não tenha enviado.

## Evidência operacional observada antes das correções

A versão pública de `/status-dos-dados` consultada em 08/09/2026 registrava, na verificação das 03:32:

- radar REDEMET sem dado utilizável naquela verificação e vários incidentes curtos de restauração/falha;
- satélite REDEMET operacional;
- STSC operacional;
- satélite INMET complementar sem dado utilizável pela integração.

Na janela publicada de até sete dias, o monitor mostrava aproximadamente 49% para radar REDEMET, 98,1% para satélite REDEMET e 98,6% para STSC. Esses números descrevem o comportamento da integração do Tempo Pelotas e não provam disponibilidade global das plataformas oficiais.

O baixo índice do radar, combinado ao antigo timeout interno de 2,4 s e aos incidentes curtos, justificou alinhar o budget. Isso não prova que todos os eventos históricos tenham sido causados por timeout; respostas sem produto, latência upstream e outras falhas transitórias continuam possíveis.

O satélite INMET complementar aparecia sem coleta utilizável. O código permanece fail-closed: enquanto a integração não entregar imagem válida, a página não fabrica quadro, horário ou substitui silenciosamente o produto por outra fonte.

## Segurança revisada

`/api/redemet/image` continua exigindo:

- URL REDEMET em host allowlisted ou tokens INMET válidos;
- HTTPS;
- revalidação do host após redirect;
- tipo de imagem permitido;
- tamanho máximo de 12 MB;
- detecção da assinatura binária para payload base64 do INMET;
- `nosniff` e `noindex`.

A chave REDEMET não é retornada ao browser.

## Recursos de interface confirmados no código

- imagem de radar georreferenciada e fallback bruto;
- marcador de Pelotas;
- horário real do quadro e estado de frescor;
- anterior/próxima coleta;
- slider da sequência;
- reproduzir/pausar;
- voltar ao quadro mais recente;
- abrir imagem oficial pelo proxy;
- seletor Realçado / Infravermelho / Visível;
- descrição curta do produto ativo;
- loading explícito e cancelamento de requisição em troca rápida;
- satélite REDEMET/contingência e INMET com fonte explícita;
- estado `Aguardando luz solar` para o Visível;
- próxima janela do Visível somente quando `nextExpectedAt` é recebido;
- STSC com sequência temporal e contagem de pontos;
- distâncias STSC derivadas somente quando existe quadro válido;
- comparação radar × previsão em bloco separado, sem dizer que os números foram medidos pelo radar;
- estados vazios sem preenchimento manual;
- recuperação pós-hidratação após o budget curto do SSR.

## Contratos e validação pendente

A auditoria é protegida por `tests/redemet-data-display-audit.test.ts`, além dos contratos já existentes de performance, resiliência, timezone, mapa, daylight e visual da página dedicada. O contrato antigo da Home foi reconciliado com a implementação MapLibre atual: gesto cooperativo, player interativo na faixa inferior e controles nativos dentro da área real do mapa.

A validação executável desta última etapa ainda não foi concluída porque, no momento do fechamento, o executor do workspace Lovable estava sem créditos e o GitHub Actions continuava encerrando o job antes de executar steps. Portanto, não declarar build, typecheck, suíte REDEMET ou validação visual como aprovados para os commits finais até existir uma execução real.

A validação em preview/domínio deve conferir especificamente:

1. Realçado como estado inicial;
2. troca Realçado → IR → Visível e retorno sem overflow em desktop/mobile;
3. fonte, produto e horário mudando com a camada selecionada;
4. contingência INMET para Realçado/IR sem painel duplicado;
5. Visível noturno em `Aguardando luz solar`, sem fallback IR, com próxima janela quando fornecida;
6. radar georreferenciado, sequência e estabilidade após o budget de 4,2 s;
7. STSC distinguindo ausência de coleta de zero real.

Não declarar validação de build/testes pelo GitHub Actions enquanto os jobs continuarem terminando antes de executar steps.