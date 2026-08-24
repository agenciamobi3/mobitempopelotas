# Fallback persistente da visão meteorológica regional

## Objetivo

Evitar que a página `/tempo-na-regiao-sul-rs` fique sem resumo regional quando o provedor meteorológico responder com rate limit (`HTTP 429`), erro transitório ou timeout.

## Estratégia

A visão regional usa uma cadeia de contingência controlada:

1. consulta direta e única em lote ao Open-Meteo;
2. Edge Function `regional-weather-overview` no Supabase externo;
3. snapshot em memória do processo atual;
4. snapshot persistido no Supabase, com idade máxima de 6 horas.

A Edge Function também usa uma única chamada em lote. Ela lê o último snapshot antes de consultar o provedor, considera snapshots de até 5 minutos como frescos, persiste uma nova resposta normalizada quando precisa atualizar e pode devolver um snapshot de até 6 horas quando o próprio acesso externo falha.

Somente quando toda a cadeia falha a resposta é marcada como `unavailable`. As páginas municipais permanecem navegáveis independentemente do resumo regional.

## Persistência

A migration `20260823193000_create_regional_weather_snapshots.sql` define o contrato esperado de `public.regional_weather_snapshots` no repositório.

A tabela mantém o payload normalizado, status, fonte e horário de coleta. RLS permanece habilitado. Leitura pública é permitida porque o conteúdo já é público; não existe policy pública de `INSERT`. Escritas acontecem somente em contexto administrativo: runtime de servidor quando disponível ou a Edge Function, que usa a service role interna do Supabase e não aceita payload arbitrário do visitante.

A persistência é best-effort para o runtime principal: falha de banco nunca pode derrubar a consulta regional.

## Estado de produção

O Supabase externo do Tempo Pelotas possui a tabela `public.regional_weather_snapshots` com RLS habilitado e policy pública apenas para `SELECT`.

Durante a aplicação em produção foi detectado drift entre a primeira versão aplicada no banco e o contrato consumido pela aplicação: a tabela usava `collected_at`, default de fonte `open-meteo` e status `success`, enquanto o runtime consulta `fetched_at` e persiste `Open-Meteo` com status `live | partial`.

A migration `20260824011500_reconcile_regional_weather_snapshots_schema.sql` reconcilia esse drift de forma idempotente:

- renomeia `collected_at` para `fetched_at` quando necessário;
- alinha o default de `source` para `Open-Meteo`;
- alinha o default de `status` para `live`;
- garante índice por `fetched_at desc`;
- preserva RLS.

A migration `20260824012500_drop_legacy_regional_weather_snapshot_index.sql` remove o índice legado que ficou redundante depois da renomeação da coluna.

As duas migrations foram aplicadas no Supabase externo em 23/08/2026.

## Edge Function de contingência

`supabase/functions/regional-weather-overview/index.ts` existe para contornar rate limits específicos do egress do runtime de hospedagem sem voltar ao padrão de uma chamada por município.

A função:

- não recebe coordenadas, slugs ou URL de provedor enviados pelo cliente;
- trabalha somente com o inventário fixo das 24 cidades públicas;
- aceita somente `GET`/`OPTIONS`;
- faz uma chamada Open-Meteo em lote;
- normaliza o mesmo conjunto mínimo da Central Regional;
- persiste o snapshot com service role interna;
- mantém apenas a janela operacional recente, com limpeza best-effort de registros acima de 24 horas;
- devolve cache recente antes de chamar novamente o provedor.

Ela é pública porque a resposta contém somente dados meteorológicos já públicos e não oferece operação arbitrária de banco ou proxy. A limitação do contrato fixo reduz a superfície de abuso.

## Segurança e integridade

Snapshots lidos pelo aplicativo não são aceitos por cast cego. Antes do uso, o payload é validado contra o contrato regional atual, incluindo:

- status conhecido;
- fonte `Open-Meteo`;
- `fetchedAt` válido;
- quantidade de itens igual ao inventário público atual;
- correspondência de cada `slug` com `PUBLIC_REGIONAL_CITIES`;
- campos numéricos nulos ou finitos;
- validade máxima de 6 horas para leitura persistida.

Isso evita que payload antigo, incompatível ou adulterado seja promovido silenciosamente para a interface.

## Rate limit

A consulta continua sendo única e em lote para todas as cidades públicas. Não criar `Promise.all` com uma chamada por município: isso aumenta custo, latência e risco de `429`.

Em smoke de produção em 23/08/2026, a rota pública respondeu `HTTP 200`, mas o acesso direto do runtime ao Open-Meteo registrou `HTTP 429`. A Edge Function foi então validada separadamente com `HTTP 200`, retornou as 24 cidades com status `live` e criou o primeiro registro real em `regional_weather_snapshots`.

O aplicativo passa a consultar essa rota de contingência antes de desistir para cache em memória/snapshot persistido localmente.

## Operação

Validações concluídas nesta camada:

1. schema de produção reconciliado;
2. RLS mantido com leitura pública e sem policy pública de escrita;
3. índice legado redundante removido;
4. Edge Function implantada e respondendo `HTTP 200`;
5. primeiro snapshot real criado no Supabase externo;
6. rota pública `/tempo-na-regiao-sul-rs` confirmada com resposta HTTP 200;
7. comportamento `429` do acesso direto reproduzido em produção.

Após novos deploys, o smoke recomendado é confirmar que a página deixa de exibir estado `unavailable` durante `429` e passa a informar a rota de contingência ou usar snapshot válido.
