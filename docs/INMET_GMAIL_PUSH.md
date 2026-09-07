# INMET por Gmail → Web Push

## Objetivo

Usar a chegada das mensagens oficiais de **Previsões por E-mail do INMET** em `contato.agenciamobi@gmail.com` como gatilho para o Web Push já existente do Tempo Pelotas.

Este fluxo é **100% determinístico e não usa IA** para ler, classificar ou escrever a notificação.

O e-mail não é encaminhado cru ao visitante. Ele apenas dispara uma nova leitura da previsão estruturada do INMET para Pelotas. Quando a API estruturada estiver temporariamente indisponível, o push usa uma mensagem genérica informando que chegou uma nova previsão oficial por e-mail, sem inventar valores.

## Separação editorial

- e-mail de confirmação de cadastro: ignorado;
- e-mail reconhecido como previsão: dispara o fluxo de previsão;
- outros e-mails: ignorados;
- aviso oficial de risco continua no pipeline específico de `weather_alerts`, baseado nos avisos oficiais estruturados do INMET.

Uma previsão por e-mail nunca é promovida a "alerta oficial" apenas por ter vindo do INMET.

## Segurança do remetente

Antes de qualquer disparo o backend exige:

1. endereço `From` terminado exatamente em `@inmet.gov.br`;
2. `spf=pass`;
3. `dmarc=pass`;
4. alinhamento `header.from=inmet.gov.br`.

A confirmação recebida em 07/09/2026 de `sepre2.df@inmet.gov.br` apresentou SPF e DMARC válidos e serve como referência do contrato esperado.

Mensagens que não passam por essas verificações são ignoradas.

## Fluxo

```text
INMET
  ↓
Gmail contato.agenciamobi@gmail.com
  ↓
Gmail watch / Google Cloud Pub/Sub
  ↓
POST /api/cron/push-daily?task=inmet-gmail
  ↓
validação OIDC do Pub/Sub
  ↓
busca das mensagens recentes do domínio inmet.gov.br
  ↓
validação SPF + DMARC + remetente
  ↓
classificação determinística
  ↓
consulta /previsao do INMET para o geocódigo de Pelotas
  ↓
template fixo
  ↓
claim_web_push_dispatch / deduplicação
  ↓
Web Push topic=weather
```

## Consentimento

As atualizações de previsão usam:

- `topic: "weather"`;
- `consentPreference: "daily_summary"`.

Isso evita enviar previsão rotineira a uma pessoa que tenha escolhido apenas alertas meteorológicos graves.

O pipeline existente de alertas oficiais continua usando `weather_alerts`.

## Variáveis de ambiente

```env
INMET_GMAIL_USER=contato.agenciamobi@gmail.com
INMET_GMAIL_CLIENT_ID=
INMET_GMAIL_CLIENT_SECRET=
INMET_GMAIL_REFRESH_TOKEN=

INMET_GMAIL_QUERY=in:inbox -in:spam -in:trash from:(@inmet.gov.br) newer_than:1d
INMET_GMAIL_MAX_AGE_MINUTES=360

INMET_GMAIL_PUBSUB_TOPIC=projects/SEU_PROJETO/topics/tempo-pelotas-inmet-gmail
INMET_GMAIL_PUBSUB_AUDIENCE=https://tempopelotas.com.br/api/cron/push-daily?task=inmet-gmail
INMET_GMAIL_PUBSUB_SERVICE_ACCOUNT_EMAIL=
```

Todos os valores acima são server-only. Nunca criar variantes `VITE_*`.

O refresh token deve ser emitido com o menor escopo necessário:

```text
https://www.googleapis.com/auth/gmail.readonly
```

## Gmail watch

O watch é renovado por:

```http
GET /api/cron/push-daily?task=inmet-gmail-watch
Authorization: Bearer $CRON_SECRET
```

A chamada registra o tópico Pub/Sub e observa a `INBOX`. A filtragem por remetente continua no backend.

O Gmail watch expira e deve ser renovado periodicamente. Agendar a renovação **diariamente** é simples e evita depender do último dia de validade.

## Webhook Pub/Sub

Destino:

```text
https://tempopelotas.com.br/api/cron/push-daily?task=inmet-gmail
```

Método:

```http
POST
Content-Type: application/json
Authorization: Bearer <Google OIDC token>
```

A assinatura Pub/Sub deve usar autenticação OIDC. O backend valida:

- assinatura RS256 contra as chaves públicas do Google;
- issuer Google;
- audiência exata de `INMET_GMAIL_PUBSUB_AUDIENCE`;
- expiração;
- e, quando configurado, o e-mail da service account em `INMET_GMAIL_PUBSUB_SERVICE_ACCOUNT_EMAIL`.

Não usar segredo em query string como substituto da validação OIDC.

## Configuração do Google Cloud

1. habilitar Gmail API e Pub/Sub no projeto;
2. criar tópico Pub/Sub;
3. permitir que `gmail-api-push@system.gserviceaccount.com` publique nesse tópico;
4. criar uma push subscription para o endpoint do Tempo Pelotas;
5. configurar OIDC na push subscription com uma service account própria;
6. colocar a mesma URL do endpoint como audiência OIDC;
7. armazenar o e-mail dessa service account em `INMET_GMAIL_PUBSUB_SERVICE_ACCOUNT_EMAIL`;
8. gerar OAuth Client ID/Secret e refresh token da conta `contato.agenciamobi@gmail.com` com `gmail.readonly`;
9. chamar a rota `task=inmet-gmail-watch` para iniciar o watch.

## Recuperação sem webhook

O mesmo pipeline pode ser executado manualmente ou por scheduler:

```http
GET /api/cron/push-daily?task=inmet-gmail
Authorization: Bearer $CRON_SECRET
```

Ele busca até 20 mensagens recentes do INMET e usa `web_push_dispatches` para impedir duplicidade.

Esse GET funciona como recuperação se Pub/Sub ficar indisponível. Uma frequência curta, por exemplo 10 a 15 minutos, é suficiente como contingência; o caminho principal continua sendo o webhook.

## Janela de idade

Por padrão, somente previsões recebidas nas últimas **6 horas** podem gerar novo push.

Isso evita que o primeiro deploy ou uma recuperação longa dispare uma fila antiga de mensagens.

A janela é configurável por `INMET_GMAIL_MAX_AGE_MINUTES`, limitada pelo código entre 5 minutos e 24 horas.

## Copy sem IA

O template é construído por código a partir de `fetchInmetForecast()`.

Exemplo:

```text
INMET atualizou a previsão de Pelotas

Manhã: muitas nuvens com possibilidade de chuva isolada. Mínima de 12 °C e máxima de 18 °C.
```

Se a previsão estruturada não estiver disponível:

```text
INMET atualizou a previsão de Pelotas

Uma nova previsão do INMET chegou por e-mail. Confira os detalhes atualizados no Tempo Pelotas.
```

Não há chamada a Gemini, OpenAI ou qualquer outro modelo nesse caminho.

## Deduplicação

Cada mensagem Gmail recebe um fingerprint derivado do ID interno da mensagem:

```text
inmet-gmail-<sha256 curto>
```

A reserva usa o mesmo `claim_web_push_dispatch` já empregado pelo restante do Web Push.

Reentregas do Pub/Sub, recuperação por cron ou reinício do runtime não geram um segundo push para o mesmo e-mail.

## O que ainda depende de infraestrutura externa

O código fica pronto no repositório, mas a entrega em produção só começa após:

- cadastrar as credenciais OAuth no ambiente;
- criar o tópico e a push subscription no Google Cloud;
- configurar OIDC;
- renovar o Gmail watch;
- manter Web Push/VAPID/Supabase operacionais.

Nenhuma dessas credenciais deve ser versionada.
