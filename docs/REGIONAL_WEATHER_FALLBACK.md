# Fallback persistente da visão meteorológica regional

## Objetivo

Evitar que a página `/tempo-na-regiao-sul-rs` fique sem resumo regional quando o provedor meteorológico responder com rate limit (`HTTP 429`), erro transitório ou timeout.

## Estratégia

A visão regional usa três níveis de disponibilidade, nesta ordem:

1. consulta ao vivo em lote no Open-Meteo;
2. snapshot em memória do processo atual;
3. snapshot persistido no Supabase, com idade máxima de 6 horas.

Somente quando os três níveis falham a resposta é marcada como `unavailable`. As páginas municipais permanecem navegáveis independentemente do resumo regional.

## Persistência

A migration `20260823193000_create_regional_weather_snapshots.sql` define o contrato esperado de `public.regional_weather_snapshots` no repositório.

A tabela mantém o payload normalizado, status, fonte e horário de coleta. RLS permanece habilitado. Leitura pública é permitida porque o conteúdo já é público; gravação não recebe policy pública e depende da credencial administrativa disponível somente no runtime do servidor.

O código de persistência é best-effort: falha de banco nunca pode derrubar a consulta regional.

## Estado de produção

O Supabase externo do Tempo Pelotas possui a tabela `public.regional_weather_snapshots` com RLS habilitado e policy pública apenas para `SELECT`.

Durante a aplicação em produção foi detectado drift entre a primeira versão aplicada no banco e o contrato consumido pela aplicação: a tabela usava `collected_at`, default de fonte `open-meteo` e status `success`, enquanto o runtime consulta `fetched_at` e persiste `Open-Meteo` com status `live | partial`.

A migration `20260824011500_reconcile_regional_weather_snapshots_schema.sql` reconcilia esse drift de forma idempotente:

- renomeia `collected_at` para `fetched_at` quando necessário;
- alinha o default de `source` para `Open-Meteo`;
- alinha o default de `status` para `live`;
- garante índice por `fetched_at desc`;
- preserva RLS.

Essa reconciliação foi aplicada no Supabase externo em 23/08/2026 antes do deploy seguinte do projeto.

## Segurança e integridade

Snapshots lidos do banco não são aceitos por cast cego. Antes do uso, o payload é validado contra o contrato regional atual, incluindo:

- status conhecido;
- fonte `Open-Meteo`;
- `fetchedAt` válido;
- quantidade de itens igual ao inventário público atual;
- correspondência de cada `slug` com `PUBLIC_REGIONAL_CITIES`;
- campos numéricos nulos ou finitos;
- validade máxima de 6 horas.

Isso evita que payload antigo, incompatível ou adulterado seja promovido silenciosamente para a interface.

## Rate limit

A consulta ao Open-Meteo continua sendo única e em lote para todas as cidades públicas. Não criar `Promise.all` com uma chamada por município: isso aumenta custo, latência e risco de `429`.

Quando o provedor falhar e existir snapshot válido, a interface recebe os últimos dados disponíveis acompanhados de mensagem explícita de fallback.

## Pré-requisito de produção

O projeto utiliza configuração de Supabase externo no runtime. A tabela e a migration de reconciliação precisam estar aplicadas nesse banco para que o fallback sobreviva a reinícios/serverless cold starts e use exatamente o contrato esperado pelo código.

Sem a tabela aplicada, o sistema continua funcionando com consulta ao vivo e cache em memória; apenas a camada persistente fica indisponível.

## Operação

Após aplicar as migrations no Supabase externo, validar:

1. primeira consulta regional bem-sucedida;
2. criação de um registro em `regional_weather_snapshots`;
3. resposta da página após simulação de `429`;
4. mensagem indicando uso do último resumo disponível;
5. rejeição automática de snapshots com mais de 6 horas.

No momento da reconciliação o banco ainda estava com `0` snapshots, portanto a próxima consulta regional bem-sucedida é o gatilho esperado para validar a persistência ponta a ponta.
