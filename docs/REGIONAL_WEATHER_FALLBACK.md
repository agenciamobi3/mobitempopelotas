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

A migration `20260823193000_create_regional_weather_snapshots.sql` cria `public.regional_weather_snapshots`.

A tabela mantém o payload normalizado, status, fonte e horário de coleta. RLS permanece habilitado. Leitura pública é permitida porque o conteúdo já é público; gravação não recebe policy pública e depende da credencial administrativa disponível somente no runtime do servidor.

O código de persistência é best-effort: falha de banco nunca pode derrubar a consulta regional.

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

O projeto utiliza configuração de Supabase externo no runtime. A migration precisa estar aplicada nesse banco para que o fallback sobreviva a reinícios/serverless cold starts.

Sem a tabela aplicada, o sistema continua funcionando com consulta ao vivo e cache em memória; apenas a camada persistente fica indisponível.

## Operação

Após aplicar a migration no Supabase externo, validar:

1. primeira consulta regional bem-sucedida;
2. criação de um registro em `regional_weather_snapshots`;
3. resposta da página após simulação de `429`;
4. mensagem indicando uso do último resumo disponível;
5. rejeição automática de snapshots com mais de 6 horas.
