# Tempo Pelotas — analytics de distribuição dos widgets

Data: 11/09/2026  
Estado: implementação V1 versionada; schema live reconciliado; gravação restrita ao servidor; ranking por domínio disponível no painel; origem do distribuidor confirmada pelo navegador; visão consolidada da rede disponível em `/widgets`

## Objetivo

Medir a distribuição real dos widgets gerenciados do Tempo Pelotas sem transformar pageviews gerais do GA4 em uma falsa contagem de visitantes e sem criar rastreamento pessoal.

A unidade desta V1 é **visualização/carregamento do widget**, não pessoa única. O sistema não usa cookie próprio, fingerprint, endereço IP, user-agent ou URL completa do site hospedeiro para esta métrica.

## O que conta

Uma visualização é registrada quando:

- o snippet oficial `https://tempopelotas.com.br/widgets/embed.js` cria o iframe;
- o iframe é carregado dentro de uma página externa;
- existe token público válido e ativo;
- o iframe solicita a identidade do site pai por `postMessage`;
- o snippet pai responde com o hostname local;
- o renderer confirma que esse hostname coincide com `event.origin`, fornecido pelo navegador;
- o hostname passa pela validação final da Server Function e da função SQL.

O hostname é normalizado no banco, inclusive removendo `www.` para não separar artificialmente duas instalações do mesmo site.

## Confirmação da origem do distribuidor

O hostname não é mais aceito por query string do iframe. Essa decisão evita tratar um parâmetro manipulável como prova de origem.

O fluxo atual é:

1. o iframe publica `request-host` para a janela pai;
2. somente o `embed.js` oficial responde com `tempo-pelotas-widget-parent`;
3. o renderer exige que a mensagem venha de `window.parent`;
4. o renderer extrai o hostname de `event.origin`;
5. o hostname declarado pelo script precisa ser exatamente igual ao hostname derivado de `event.origin`;
6. somente então a Server Function registra a visualização.

`event.origin` é preenchido pelo navegador para a mensagem recebida e não pelo conteúdo da mensagem. Isso impede que um site A simplesmente declare que é o site B para atribuir visualizações a outro domínio.

Essa confirmação não transforma a métrica em antifraude absoluto. Um site que realmente hospeda o widget ainda pode recarregar a própria página repetidamente. A V1 mede carregamentos reais do embed, não pessoas únicas nem sessões deduplicadas.

## O que não conta

Não entram nas métricas:

- prévia efêmera `previewType` do gerador;
- prévia de edição de um widget existente;
- iframe de um widget salvo aberto dentro de `/widgets`;
- abertura direta de `/embed/widget` fora de um iframe;
- iframe inserido manualmente sem o handshake do snippet oficial;
- host do próprio `tempopelotas.com.br` ou subdomínios;
- token inválido, removido ou widget pausado.

Assim, o painel não infla a própria audiência apenas porque o proprietário abriu ou personalizou seus widgets.

## Persistência

A migration live e versionada `20260911034558_create_widget_insights.sql` usa duas tabelas.

### `widget_installations`

Agrega a presença histórica por `widget_id + site_host`:

- proprietário (`user_id`);
- total acumulado de carregamentos;
- primeira observação;
- última observação.

### `widget_usage_daily`

Agrega o uso diário por `widget_id + site_host + day`:

- proprietário (`user_id`);
- carregamentos do dia;
- primeira observação do dia;
- última observação do dia.

Não existe uma linha por visitante ou por request individual.

## Escrita atômica

`record_widget_load(uuid, text)`:

1. normaliza e valida o hostname;
2. rejeita o domínio do Tempo Pelotas;
3. resolve somente token de widget ativo;
4. faz upsert atômico em `widget_installations`;
5. faz upsert atômico em `widget_usage_daily` usando a data de `America/Sao_Paulo`.

A migration `20260911044137_harden_widget_insights_rpc.sql` remove execução direta de `anon` e `authenticated`. A RPC fica executável por `service_role`; o navegador chama uma Server Function do TanStack e a credencial administrativa nunca é enviada ao cliente.

## Leitura do proprietário

`getWidgetAnalyticsSnapshot` exige sessão autenticada e lê `widget_usage_daily` sob RLS. O painel agrega uma janela móvel de 30 dias e mostra por widget:

- Hoje;
- 7 dias;
- 30 dias;
- Sites ativos nos últimos 30 dias;
- até cinco sites que mais distribuíram o widget no período;
- quantidade de outros sites ativos fora do top 5.

`Sites ativos` significa hostnames distintos com pelo menos um carregamento na janela. Não significa usuários únicos.

### Ranking de distribuição

O ranking é calculado a partir da mesma consulta agregada já usada pelos contadores. Não existe nova coleta e não existe nova tabela para essa interface.

Para cada hostname o snapshot calcula:

- visualizações acumuladas nos últimos 30 dias;
- última data com atividade dentro da janela.

A ordenação usa, nesta sequência:

1. maior número de visualizações em 30 dias;
2. atividade mais recente;
3. hostname, para manter resultado determinístico em empates.

O painel apresenta no máximo cinco domínios por widget, com:

- posição no ranking;
- hostname;
- visualizações do período;
- participação percentual nas visualizações de 30 dias daquele widget;
- última atividade registrada.

Quando houver mais de cinco domínios, o card informa quantos outros sites continuam ativos no período. Quando ainda não houver uso externo, a interface mostra estado vazio em vez de inventar exemplos ou reaproveitar GA4.

## Visão consolidada da rede

`/widgets` também apresenta uma camada acima dos cards individuais. A Server Function continua fazendo uma única leitura de `widget_usage_daily` e produz, no mesmo payload, os agregados individuais e a visão da rede.

O resumo global mostra:

- visualizações externas acumuladas nos últimos 30 dias;
- quantidade de domínios distribuidores únicos no período;
- quantidade de widgets que tiveram ao menos um carregamento externo na janela;
- os cinco principais domínios de toda a rede;
- os cinco widgets mais vistos no período.

A contagem global de domínios é feita antes do corte top 5 de cada widget. Por isso um domínio pode não aparecer entre os cinco maiores de um widget específico e ainda assim contribuir corretamente para o ranking e para a cobertura da rede.

### Principais domínios

O ranking global agrega todas as linhas da janela por hostname e apresenta:

- posição;
- hostname;
- visualizações em 30 dias;
- participação percentual no tráfego externo da rede;
- última atividade registrada.

Quando houver mais de cinco domínios, o painel informa quantos outros continuam ativos.

### Widgets mais vistos

Cada widget é ranqueado por:

1. maior número de visualizações em 30 dias;
2. maior número de domínios ativos;
3. atividade mais recente;
4. ID do widget apenas como desempate determinístico final.

A interface resolve o `widget_id` para o título que já existe no gerenciador e mostra visualizações, participação no total da rede, quantidade de sites ativos e última atividade.

Na interface, “Sites parceiros” é uma leitura amigável. Tecnicamente o número representa domínios externos distribuidores com uso registrado nos últimos 30 dias; ele não afirma, por si só, a existência de vínculo comercial formal.

## Privacidade

Dados guardados nesta V1:

- ID do widget;
- ID do proprietário;
- hostname normalizado;
- dia;
- contadores;
- primeira/última observação.

Dados deliberadamente não guardados:

- IP;
- cookie de analytics;
- fingerprint;
- user-agent;
- URL completa;
- path da página hospedeira;
- identificador de visitante.

O ranking por domínio e a visão consolidada da rede são somente apresentações diferentes dos agregados já existentes. O handshake usa a origem da mensagem apenas para validar o hostname do site distribuidor e não adiciona um novo dado persistido.

## Relação com GA4

GA4 continua útil para análise geral do portal e historicamente enxerga rotas `/embed/widget`. Ele não é a fonte canônica do contador mostrado ao proprietário porque pageviews podem incluir prévias e outras cargas técnicas.

A fonte canônica da V1 passa a ser `widget_usage_daily`.

## Limite histórico

Não existe backfill automático dos pageviews antigos do GA4. A nova métrica começa a ser confiável a partir da publicação conjunta do runtime que contém o `embed.js` com handshake de origem e o renderer que confirma `event.origin` antes de registrar a impressão.

Isso evita misturar números antigos de proveniência ambígua com a nova definição de visualização externa real.

## Proteções de contrato

`tests/widget-builder-foundation.test.ts` protege a existência do schema agregado, RLS, incremento atômico, ausência de campos de rastreamento pessoal, handshake do snippet oficial, correspondência entre hostname declarado e `event.origin`, exclusão de preview, apresentação das métricas, ranking top 5, contagem de outros domínios, participação percentual e estado vazio no painel.

`tests/widget-network-overview.test.ts` protege a visão consolidada: mesma leitura agregada, ausência de uma segunda chamada de analytics no `WidgetBuilder`, total da rede, sites parceiros/distribuidores, widgets distribuídos, top 5 de domínios, top 5 de widgets e comportamento responsivo. O arquivo está incluído explicitamente em `npm run test:contracts`.

O workflow `Qualidade` continua sendo o gate completo. Em 11/09/2026 os runs observados ainda falham antes de qualquer step, com `runner_id=0` e `steps=[]`; esse estado é indisponibilidade do runner e não resultado dos testes do código.
