# INMET por Gmail → Web Push

## Objetivo

Usar as mensagens oficiais de **Previsões por E-mail do INMET** recebidas em `contato.agenciamobi@gmail.com` como gatilho para uma atualização de previsão do Tempo Pelotas.

O fluxo é **100% determinístico**. Não usa Gemini, OpenAI nem outro modelo para ler o e-mail, classificar a mensagem ou escrever o push.

O e-mail não vira conteúdo público. Ele funciona apenas como sinal de que o INMET publicou uma atualização. Depois desse sinal, o backend consulta novamente a previsão estruturada oficial do INMET para Pelotas e monta o texto com template fixo.

## Estado operacional

O código do pipeline está preparado, mas o Web Push público do Tempo Pelotas permanece suspenso enquanto a fase de estabilidade não for homologada.

Por isso existe um gate server-only:

```env
INMET_GMAIL_PUSH_ENABLED=false
```

Enquanto o valor não for exatamente `true`, a rota protegida retorna `success/skipped` e **não consulta o Gmail nem tenta enviar notificações**.

A ativação desse flag deve acontecer somente junto da reativação formal do Web Push público. O cron versionado pode permanecer agendado sem furar essa suspensão.

## Arquitetura refinada

```text
INMET
  ↓
Gmail contato.agenciamobi@gmail.com
  ↓
Lovable App Connector: google_mail
  ↓
GET /api/cron/push-daily?task=inmet-gmail
  ↓
gate INMET_GMAIL_PUSH_ENABLED
  ↓
busca fixa: INMET + Pelotas + janela de 6 h
  ↓
validação do Authentication-Results do Gmail
  ↓
From @inmet.gov.br + SPF pass + DMARC pass
  ↓
classificação determinística
  ↓
confirmação / desconhecido / outra cidade → ignorado
  ↓
se houver várias previsões elegíveis → mantém somente a mais recente
  ↓
consulta da previsão estruturada do INMET para Pelotas
  ↓
template fixo
  ↓
fingerprint da atualização pública, não do ID do e-mail
  ↓
claim_web_push_dispatch / deduplicação
  ↓
Web Push topic=weather + daily_summary
```

Não existe OAuth próprio do Tempo Pelotas para Gmail, refresh token próprio, Gmail Watch ou Google Cloud Pub/Sub nesse fluxo.

## Conector do Lovable

O runtime usa o gateway do App Connector:

```text
https://connector-gateway.lovable.dev/google_mail/gmail/v1
```

A autenticação usa valores server-only gerenciados pelo Lovable:

- `LOVABLE_API_KEY`;
- `GOOGLE_MAIL_API_KEY`.

Esses valores **não devem ser copiados para `.env.example`, versionados nem expostos ao navegador**. O projeto não cria uma segunda credencial Google para a mesma caixa postal.

A integração deve permanecer vinculada à conexão Gmail de `contato.agenciamobi@gmail.com` usada pelo projeto Tempo Pelotas.

## Leitura da caixa postal

O backend monta uma busca server-only com estes filtros obrigatórios:

```text
in:inbox -in:spam -in:trash from:(inmet.gov.br) Pelotas after:<início-da-janela>
```

`after:` é calculado em cada execução para cobrir somente a janela operacional de **6 horas**. O servidor ainda valida a idade real de cada mensagem após a leitura; o filtro do Gmail é apenas a primeira camada.

São considerados no máximo **20 IDs por execução**. O visitante não consegue fornecer `query`, `messageId`, remetente, cidade ou outro parâmetro para pesquisar a caixa postal.

Apenas esta rota protegida inicia o fluxo:

```http
GET /api/cron/push-daily?task=inmet-gmail
Authorization: Bearer $CRON_SECRET
```

Não existe endpoint público genérico para Gmail.

## Segurança do remetente

O backend não aceita qualquer header chamado `Authentication-Results` como prova.

Para uma mensagem ser confiável, é necessário que **um mesmo `Authentication-Results` do Gmail**:

1. comece com `mx.google.com;`;
2. tenha `spf=pass`;
3. associe `smtp.mailfrom` ao domínio `inmet.gov.br`;
4. tenha `dmarc=pass`;
5. declare `header.from=inmet.gov.br`.

Além disso, o `From` visível deve terminar exatamente em `@inmet.gov.br`.

`ARC-Authentication-Results` não substitui essa prova no fluxo atual. Isso reduz o risco de aceitar um cabeçalho injetado ou uma cadeia de encaminhamento como se fosse autenticação direta do remetente.

A mensagem de confirmação recebida de `sepre2.df@inmet.gov.br` em 07/09/2026 apresentou SPF e DMARC válidos e permanece como referência do formato esperado.

## Escopo obrigatório: Pelotas

Uma mensagem reconhecida como previsão só continua se o assunto ou o corpo extraído contiver **Pelotas**.

Isso é importante porque a caixa pode receber outros produtos ou previsões do INMET. Um e-mail de outra cidade nunca pode provocar um push dizendo que a previsão de Pelotas mudou.

A busca do Gmail já inclui `Pelotas`, mas o backend repete essa validação antes do disparo. A regra é deliberadamente redundante e fail-closed.

## Classificação sem IA

As regras permanecem estreitas:

- confirmação de cadastro: ignorada;
- previsão por e-mail: candidata;
- mensagens administrativas ou desconhecidas: ignoradas;
- previsão sem referência a Pelotas: ignorada.

Uma mensagem desconhecida nunca é entregue a um modelo para “tentar interpretar”.

## Coalescência

O Gmail pode retornar mais de uma previsão válida dentro das seis horas. O pipeline **não dispara uma notificação para cada uma**.

Depois da validação, as candidatas são ordenadas pelo horário de recebimento e apenas a mais recente pode avançar para entrega. As anteriores entram na métrica `supersededForecasts`.

Se a previsão mais recente já tiver sido enviada, o fluxo termina como duplicado. Ele não volta para uma mensagem antiga para produzir um push atrasado.

Isso evita tempestade de notificações após atraso do scheduler, deploy ou mais de uma atualização do INMET em sequência curta.

## Deduplicação por conteúdo público

A deduplicação não usa mais o ID interno do Gmail como identidade final do push.

O fingerprint combina:

- data local da mensagem em `America/Sao_Paulo`;
- título público;
- corpo público;
- destino público.

Formato conceitual:

```text
inmet-gmail-AAAA-MM-DD-<sha256 curto do conteúdo público>
```

Consequências:

- o mesmo e-mail reprocessado não duplica;
- dois e-mails diferentes que resultem no mesmo texto público não duplicam;
- uma mudança real no conteúdo público pode gerar uma nova atualização;
- o mesmo texto em outro dia pode ser enviado novamente.

A reserva continua usando `claim_web_push_dispatch` e lease renovável do Web Push existente.

## Separação entre previsão e alerta

Uma previsão normal do INMET usa:

- `topic: "weather"`;
- `consentPreference: "daily_summary"`;
- urgência normal;
- destino `/tempo-hoje-pelotas`.

Ela **não** é promovida a `weather_alerts` só porque veio de `@inmet.gov.br`.

Avisos oficiais de risco continuam no pipeline estruturado de avisos do INMET, com `weather_alerts`, prioridade alta e destino `/alertas`.

## Copy determinística

Depois de escolher a mensagem mais recente, o backend chama `fetchInmetForecast()` uma única vez para o ciclo.

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

O e-mail continua sendo somente o gatilho. Números meteorológicos não são extraídos do texto da mensagem para publicação.

## Falhas parciais

Uma mensagem problemática não derruba automaticamente todo o lote.

O backend registra apenas uma impressão curta do ID da mensagem no log, nunca assunto ou corpo, conta `messageErrors` e continua avaliando as demais.

Se **todas** as mensagens retornadas pelo Gmail falharem na leitura/avaliação, a execução falha. Se somente parte falhar e o restante puder ser classificado com segurança, o fluxo continua de forma degradada.

## Scheduler

O workflow `.github/workflows/inmet-gmail-poll.yml` chama a rota a cada **10 minutos**.

Ele usa:

```text
TEMPO_PELOTAS_CRON_SECRET
```

que deve ter o mesmo valor de `CRON_SECRET` em produção.

O workflow não envia headers de navegador, portanto não entra no bloqueio geográfico aplicado a navegação web. Também não cancela uma execução já iniciada quando outra rodada é enfileirada. Isso evita interromper um request no meio de uma possível entrega.

O GitHub Actions continua sendo uma dependência operacional separada do código. Se o runner não iniciar e aparecer `steps: null`, o polling não ocorreu e isso não deve ser tratado como falha do pipeline do INMET.

## Fail-safe

O fluxo prefere não enviar a enviar algo incorreto:

- `INMET_GMAIL_PUSH_ENABLED` diferente de `true` → sai antes de tocar no Gmail;
- Web Push sem configuração operacional → sai sem consultar a caixa;
- conector Gmail do Lovable indisponível → nenhum push;
- mensagem sem autenticação direta do Gmail para o domínio INMET → ignorada;
- formato desconhecido → ignorado;
- previsão de outra cidade → ignorada;
- mensagem antiga → ignorada;
- várias atualizações → somente a mais recente avança;
- conteúdo público já enviado → duplicado, sem novo push;
- previsão estruturada indisponível → apenas texto genérico, sem números inventados.

## Ativação em produção

Para ativar o fluxo de verdade, a ordem correta é:

1. homologar a reativação do Web Push público;
2. confirmar VAPID, Supabase e inscrições com consentimento;
3. confirmar o App Connector Gmail na conta correta;
4. confirmar `CRON_SECRET` e `TEMPO_PELOTAS_CRON_SECRET` equivalentes;
5. definir `INMET_GMAIL_PUSH_ENABLED=true` no runtime;
6. executar uma rodada manual protegida;
7. comprovar uma mensagem real do INMET para Pelotas chegando ao pipeline;
8. só então considerar o polling automático operacional.

Não criar OAuth Client ID/Secret, refresh token, tópico Pub/Sub ou Gmail Watch especificamente para esta integração.
