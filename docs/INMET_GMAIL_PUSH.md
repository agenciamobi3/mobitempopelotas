# INMET por Gmail → Web Push

## Objetivo

Usar as mensagens oficiais de **Previsões por E-mail do INMET** recebidas em `contato.agenciamobi@gmail.com` como gatilho para o Web Push já existente do Tempo Pelotas.

O fluxo é **100% determinístico**. Não usa Gemini, OpenAI nem outro modelo para ler o e-mail, classificar a mensagem ou escrever o push.

O e-mail também não é encaminhado cru. Quando chega uma previsão reconhecida, o backend consulta novamente a previsão estruturada oficial do INMET para Pelotas e monta a mensagem com template fixo. Se essa API estiver temporariamente indisponível, o push informa apenas que há uma nova previsão do INMET, sem inventar valores.

## Arquitetura atual

O projeto reutiliza o **App Connector Gmail já conectado no workspace da MOBI no Lovable**.

```text
INMET
  ↓
Gmail contato.agenciamobi@gmail.com
  ↓
Lovable App Connector: google_mail
  ↓
GET /api/cron/push-daily?task=inmet-gmail
  ↓
busca fixa de mensagens recentes do INMET
  ↓
validação de remetente + SPF + DMARC
  ↓
classificação determinística
  ↓
consulta da previsão estruturada do INMET para Pelotas
  ↓
template fixo
  ↓
claim_web_push_dispatch / deduplicação
  ↓
Web Push topic=weather
```

Não existe OAuth próprio do Tempo Pelotas para Gmail, refresh token próprio, Gmail Watch ou Google Cloud Pub/Sub nesse fluxo.

## Conector do Lovable

O runtime usa o gateway oficial do connector:

```text
https://connector-gateway.lovable.dev/google_mail/gmail/v1
```

A autenticação usa valores server-only gerenciados pelo Lovable:

- `LOVABLE_API_KEY`;
- `GOOGLE_MAIL_API_KEY`.

Esses valores **não devem ser copiados para `.env.example`, versionados nem expostos ao navegador**. O projeto não cria uma segunda credencial Google para a mesma caixa postal.

A integração precisa permanecer vinculada à conexão Gmail de `contato.agenciamobi@gmail.com` no projeto Tempo Pelotas.

## Leitura da caixa postal

A rota usa uma consulta fixa no servidor:

```text
in:inbox -in:spam -in:trash from:(inmet.gov.br) newer_than:1d
```

São lidas no máximo **20 mensagens por execução**. O visitante não consegue enviar `query`, `messageId`, remetente ou qualquer outro parâmetro para pesquisar a caixa postal.

Apenas esta rota protegida pode iniciar a leitura:

```http
GET /api/cron/push-daily?task=inmet-gmail
Authorization: Bearer $CRON_SECRET
```

Não existe endpoint público genérico para Gmail.

## Frequência

Como não usamos Pub/Sub, o scheduler deve chamar `task=inmet-gmail` em intervalo curto. **5 a 10 minutos** é um intervalo adequado para esse caso.

A repetição é segura porque cada mensagem é deduplicada antes do envio.

## Segurança do remetente

Antes de considerar um e-mail, o backend exige:

1. `From` terminado exatamente em `@inmet.gov.br`;
2. `spf=pass`;
3. `dmarc=pass`;
4. alinhamento `header.from=inmet.gov.br`.

Mensagens que não passam nessas verificações são ignoradas, mesmo que o assunto contenha “INMET”.

A mensagem de confirmação recebida de `sepre2.df@inmet.gov.br` em 07/09/2026 apresentou SPF e DMARC válidos e ajudou a validar esse contrato de cabeçalhos.

## Classificação sem IA

As regras são deliberadamente estreitas:

- confirmação de cadastro: ignorada;
- previsão por e-mail: elegível para o fluxo de previsão;
- mensagens administrativas ou desconhecidas: ignoradas.

Uma mensagem desconhecida nunca é “interpretada” por IA para tentar decidir o que fazer.

## Separação entre previsão e alerta

Uma previsão normal do INMET usa:

- `topic: "weather"`;
- `consentPreference: "daily_summary"`;
- urgência normal;
- destino `/tempo-hoje-pelotas`.

Ela **não** é promovida a `weather_alerts` só porque veio de `@inmet.gov.br`.

Avisos oficiais de risco continuam no pipeline já existente de avisos estruturados do INMET, com `weather_alerts`, alta prioridade e destino `/alertas`.

## Janela de idade

Somente previsões recebidas nas últimas **6 horas** podem gerar um novo push.

A busca olha um dia para trás para permitir recuperação, mas a regra de idade impede que um primeiro deploy ou uma indisponibilidade longa dispare mensagens antigas.

## Copy determinística

O template usa `fetchInmetForecast()`.

Exemplo:

```text
INMET atualizou a previsão de Pelotas

Manhã: muitas nuvens com possibilidade de chuva isolada. Mínima de 12 °C e máxima de 18 °C.
```

Se a previsão estruturada estiver indisponível:

```text
INMET atualizou a previsão de Pelotas

Uma nova previsão do INMET chegou por e-mail. Confira os detalhes atualizados no Tempo Pelotas.
```

Nenhuma chamada de IA participa desse caminho.

## Deduplicação

Cada mensagem do Gmail recebe um fingerprint derivado do ID interno da mensagem:

```text
inmet-gmail-<sha256 curto>
```

A reserva usa `claim_web_push_dispatch`, já empregado pelo restante do Web Push.

Se o cron consultar a mesma mensagem dezenas de vezes, ela continua gerando no máximo um disparo.

Se uma entrega for interrompida depois de já alcançar parte dos assinantes, o progresso parcial é encerrado no ledger para evitar uma repetição cega do mesmo lote.

## Fail-safe

O fluxo prefere não enviar a enviar algo incorreto:

- conector Gmail do Lovable indisponível → nenhum push;
- mensagem sem autenticação do domínio → ignorada;
- formato desconhecido → ignorado;
- mensagem antiga → ignorada;
- previsão estruturada indisponível → apenas texto genérico, sem números inventados;
- Web Push indisponível → nenhum envio.

## Operação no Lovable

Para produção, confirmar apenas:

1. o App Connector `Gmail` está habilitado no workspace;
2. a conexão usada pelo projeto Tempo Pelotas corresponde a `contato.agenciamobi@gmail.com`;
3. o connector permanece com acesso de leitura suficiente para listar e ler as mensagens;
4. `CRON_SECRET`, Supabase e Web Push/VAPID estão operacionais;
5. existe scheduler chamando `GET /api/cron/push-daily?task=inmet-gmail` a cada 5–10 minutos.

Não criar OAuth Client ID/Secret, refresh token, tópico Pub/Sub ou Gmail Watch especificamente para esta integração.
