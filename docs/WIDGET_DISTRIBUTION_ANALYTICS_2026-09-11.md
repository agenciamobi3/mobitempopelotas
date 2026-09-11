# Tempo Pelotas — analytics de distribuição dos widgets

Data: 11/09/2026  
Estado: implementação V1 versionada; schema live reconciliado; gravação restrita ao servidor

## Objetivo

Medir a distribuição real dos widgets gerenciados do Tempo Pelotas sem transformar pageviews gerais do GA4 em uma falsa contagem de visitantes e sem criar rastreamento pessoal.

A unidade desta V1 é **visualização/carregamento do widget**, não pessoa única. O sistema não usa cookie próprio, fingerprint, endereço IP, user-agent ou URL completa do site hospedeiro para esta métrica.

## O que conta

Uma visualização é registrada quando:

- o snippet oficial `https://tempopelotas.com.br/widgets/embed.js` cria o iframe;
- o iframe é carregado dentro de uma página externa;
- existe token público válido e ativo;
- o snippet informa o hostname do site hospedeiro;
- o hostname passa pela validação do renderer e da função SQL.

O hostname é normalizado no banco, inclusive removendo `www.` para não separar artificialmente duas instalações do mesmo site.

## O que não conta

Não entram nas métricas:

- prévia efêmera `previewType` do gerador;
- prévia de edição de um widget existente;
- iframe de um widget salvo aberto dentro de `/widgets`;
- abertura direta de `/embed/widget` fora de um iframe;
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
- Sites ativos nos últimos 30 dias.

`Sites ativos` significa hostnames distintos com pelo menos um carregamento na janela. Não significa usuários únicos.

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

## Relação com GA4

GA4 continua útil para análise geral do portal e historicamente enxerga rotas `/embed/widget`. Ele não é a fonte canônica do contador mostrado ao proprietário porque pageviews podem incluir prévias e outras cargas técnicas.

A fonte canônica da V1 passa a ser `widget_usage_daily`.

## Limite histórico

Não existe backfill automático dos pageviews antigos do GA4. A nova métrica começa a ser confiável a partir da publicação do runtime que contém o `embed.js` com transmissão do hostname e o renderer com registro de impressão.

Isso evita misturar números antigos de proveniência ambígua com a nova definição de visualização externa real.

## Proteções de contrato

`tests/widget-builder-foundation.test.ts` protege a existência do schema agregado, RLS, incremento atômico, ausência de campos de rastreamento pessoal, transmissão de hostname pelo snippet oficial, exclusão de preview e apresentação das métricas no painel.

O workflow `Qualidade` continua sendo o gate completo. Em 11/09/2026 os runs observados ainda falham antes de qualquer step, com `runner_id=0` e `steps=[]`; esse estado é indisponibilidade do runner e não resultado dos testes do código.
