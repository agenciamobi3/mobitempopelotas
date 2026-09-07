# INMET por Gmail → Web Push

## Objetivo

Usar mensagens oficiais de **Previsões por E-mail do INMET** como gatilho para uma atualização de previsão do Tempo Pelotas.

O fluxo é **100% determinístico**. Não usa Gemini, OpenAI nem outro modelo para ler o e-mail, classificar a mensagem ou escrever o push.

O e-mail não vira conteúdo público. Ele funciona apenas como sinal de que o INMET publicou uma atualização. Depois desse sinal, o backend consulta novamente a previsão estruturada oficial do INMET para Pelotas e monta o texto com template fixo.

## Estado operacional

O pipeline está preparado na `main`, porém permanece **desativado para entrega**.

```env
INMET_GMAIL_PUSH_ENABLED=false
```

Enquanto o valor não for exatamente `true`, o fluxo normal `task=inmet-gmail` retorna `success/skipped` e **não consulta o Gmail nem tenta enviar notificações**.

Além disso, existe uma segunda trava obrigatória antes de qualquer verificação ou ativação:

```env
INMET_GMAIL_EXPECTED_RECIPIENT=
```

Esse valor deve ser um **endereço ou alias dedicado exclusivamente à assinatura do INMET usada pelo Tempo Pelotas**. Não deve ser o e-mail pessoal de uma pessoa nem um endereço genérico usado para outras assinaturas.

Enquanto esse destinatário dedicado não for definido, o modo `check` também permanece fail-closed.

Portanto, o estado correto neste corte é:

- arquitetura e pipeline implementados;
- integração Gmail do Lovable reutilizada;
- Web Push público continua suspenso;
- `INMET_GMAIL_PUSH_ENABLED=false`;
- destinatário exclusivo ainda deve ser escolhido/configurado antes de uma homologação real;
- nenhum envio automático deve ser considerado operacional neste momento.

## Por que o destinatário dedicado é obrigatório

A caixa conectada pode receber mensagens legítimas do INMET destinadas a pessoas, clientes ou outros projetos.

Sem essa trava, um e-mail real do INMET sobre Pelotas poderia ser interpretado como gatilho coletivo mesmo que a assinatura tivesse sido feita por uma pessoa para uso próprio.

A regra de segurança passa a ser:

```text
remetente oficial do INMET
+ autenticação Gmail/SPF/DMARC válida
+ destinatário exclusivo do Tempo Pelotas
+ conteúdo referente a Pelotas
+ formato conhecido de previsão
= candidata ao pipeline
```

Exemplos conceituais:

- e-mail do INMET para um endereço pessoal → ignorado;
- e-mail do INMET para um endereço genérico da agência → ignorado se não for o destinatário reservado;
- e-mail do INMET para o alias/endereço exclusivo configurado em `INMET_GMAIL_EXPECTED_RECIPIENT` → pode continuar para as demais validações.

O endereço definitivo deve ser decidido antes da ativação. O código não inventa nem assume um alias.

## Arquitetura refinada

```text
INMET
  ↓
assinatura dedicada do Tempo Pelotas
  ↓
Gmail conectado no Lovable
  ↓
Lovable App Connector: google_mail
  ↓
GET /api/cron/push-daily?task=inmet-gmail
  ↓
gate INMET_GMAIL_PUSH_ENABLED
  ↓
validação de INMET_GMAIL_EXPECTED_RECIPIENT
  ↓
busca fixa: INMET + Pelotas + destinatário dedicado + janela de 6 h
  ↓
validação do Authentication-Results do Gmail
  ↓
From @inmet.gov.br + SPF pass + DMARC pass
  ↓
validação redundante de To / Delivered-To / X-Original-To / Envelope-To
  ↓
classificação determinística
  ↓
confirmação / desconhecido / outra cidade / outro destinatário → ignorado
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

## Verificação segura antes da ativação

A rota protegida abaixo existe para **ler e validar** a integração sem abrir a entrega:

```http
GET /api/cron/push-daily?task=inmet-gmail-check
Authorization: Bearer $CRON_SECRET
```

Ela pode ser executada com:

```env
INMET_GMAIL_PUSH_ENABLED=false
```

Mas exige que `INMET_GMAIL_EXPECTED_RECIPIENT` já esteja configurado com o endereço exclusivo da assinatura do Tempo Pelotas.

Esse modo:

- consulta o App Connector Gmail real;
- usa a mesma busca de INMET + Pelotas + destinatário dedicado + janela de 6 horas;
- aplica a mesma autenticação de remetente;
- valida o destinatário exato novamente nos headers da mensagem;
- aplica a mesma classificação sem IA;
- escolhe a mesma candidata mais recente;
- consulta `fetchInmetForecast()` para saber qual texto público seria formado;
- retorna contadores, horário da candidata, um hash curto do ID interno, estado da previsão estruturada e uma prévia do push;
- **não chama `claim_web_push_dispatch`, não reserva envio e não chama `broadcastPushNotification`**.

A resposta não devolve assunto, corpo, endereço do remetente, destinatário bruto nem ID bruto do Gmail.

`wouldDispatch=true` significa apenas que existe uma candidata válida e que, se o pipeline estivesse ativo, ela chegaria à etapa de deduplicação/entrega. **Não significa que a notificação foi enviada.**

## Conector do Lovable

O runtime usa o gateway do App Connector:

```text
https://connector-gateway.lovable.dev/google_mail/gmail/v1
```

A autenticação usa valores server-only gerenciados pelo Lovable:

- `LOVABLE_API_KEY`;
- `GOOGLE_MAIL_API_KEY`.

Esses valores **não devem ser copiados para `.env.example`, versionados nem expostos ao navegador**. O projeto não cria uma segunda credencial Google para a mesma caixa postal.

## Leitura da caixa postal

O backend monta uma busca server-only com estes filtros obrigatórios:

```text
in:inbox -in:spam -in:trash from:(inmet.gov.br) Pelotas to:<destinatário-dedicado> after:<início-da-janela>
```

`after:` é calculado em cada execução para cobrir somente a janela operacional de **6 horas**. O servidor ainda valida a idade real de cada mensagem após a leitura; o filtro do Gmail é apenas a primeira camada.

São considerados no máximo **20 IDs por execução**. O visitante não consegue fornecer `query`, `messageId`, remetente, destinatário, cidade ou outro parâmetro para pesquisar a caixa postal.

As duas operações permitidas permanecem atrás do mesmo `CRON_SECRET`:

```http
GET /api/cron/push-daily?task=inmet-gmail
GET /api/cron/push-daily?task=inmet-gmail-check
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

`ARC-Authentication-Results` não substitui essa prova no fluxo atual.

A mensagem de confirmação recebida de `sepre2.df@inmet.gov.br` em 07/09/2026 apresentou SPF e DMARC válidos e permanece como referência do formato esperado. Ela foi recebida no endereço geral usado no cadastro inicial e **não deve ser usada como prova de que o destinatário exclusivo já está configurado**.

## Segurança do destinatário

O destinatário esperado é lido somente do runtime:

```env
INMET_GMAIL_EXPECTED_RECIPIENT=
```

O backend usa esse valor em duas camadas:

1. no filtro Gmail com `to:<destinatário>`;
2. depois da leitura, validando o endereço exato nos headers `To`, `Delivered-To`, `X-Original-To` e `Envelope-To`.

A mensagem só continua se pelo menos um desses headers contiver exatamente o destinatário esperado.

Essa redundância impede que uma assinatura pessoal ou de outro projeto use a mesma caixa conectada e acione o broadcast coletivo.

## Escopo obrigatório: Pelotas

Uma mensagem reconhecida como previsão só continua se o assunto ou o corpo extraído contiver **Pelotas**.

A busca do Gmail já inclui `Pelotas`, mas o backend repete essa validação antes do disparo. A regra é deliberadamente redundante e fail-closed.

## Classificação sem IA

As regras permanecem estreitas:

- confirmação de cadastro: ignorada;
- previsão por e-mail: candidata;
- mensagens administrativas ou desconhecidas: ignoradas;
- previsão sem referência a Pelotas: ignorada;
- mensagem destinada a outro endereço: ignorada.

Uma mensagem desconhecida nunca é entregue a um modelo para “tentar interpretar”.

## Coalescência

O Gmail pode retornar mais de uma previsão válida dentro das seis horas. O pipeline **não dispara uma notificação para cada uma**.

Depois da validação, as candidatas são ordenadas pelo horário de recebimento e apenas a mais recente pode avançar para entrega. As anteriores entram na métrica `supersededForecasts`.

Se a previsão mais recente já tiver sido enviada, o fluxo termina como duplicado. Ele não volta para uma mensagem antiga para produzir um push atrasado.

## Deduplicação por conteúdo público

A deduplicação não usa o ID interno do Gmail como identidade final do push.

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

## Scheduler e execução manual

O workflow `.github/workflows/inmet-gmail-poll.yml` chama o fluxo normal a cada **10 minutos**.

Ele usa:

```text
TEMPO_PELOTAS_CRON_SECRET
```

que deve ter o mesmo valor de `CRON_SECRET` em produção.

No `workflow_dispatch`, o modo padrão é **`check`**. Também existe a opção manual `delivery`, mas ela continua sujeita a `INMET_GMAIL_PUSH_ENABLED=true`.

Enquanto o flag permanecer `false`, o agendamento não consulta Gmail nem envia push.

O GitHub Actions continua sendo uma dependência operacional separada do código. Se o runner não iniciar e aparecer `steps: null`, o polling/check não ocorreu e isso não deve ser tratado como falha do pipeline do INMET.

## Fail-safe

O fluxo prefere não enviar a enviar algo incorreto:

- `INMET_GMAIL_PUSH_ENABLED` diferente de `true` → fluxo normal sai antes de tocar no Gmail;
- `INMET_GMAIL_EXPECTED_RECIPIENT` ausente ou inválido → check e scanner falham fechados;
- `inmet-gmail-check` → pode ler/validar o Gmail quando o destinatário dedicado estiver configurado, mas nunca tenta entregar;
- Web Push sem configuração operacional → fluxo normal sai sem consultar a caixa;
- conector Gmail do Lovable indisponível → nenhum push;
- mensagem sem autenticação direta do Gmail para o domínio INMET → ignorada;
- mensagem para outro destinatário → ignorada;
- formato desconhecido → ignorado;
- previsão de outra cidade → ignorada;
- mensagem antiga → ignorada;
- várias atualizações → somente a mais recente avança;
- conteúdo público já enviado → duplicado, sem novo push;
- previsão estruturada indisponível → apenas texto genérico, sem números inventados.

## Ativação em produção

Para ativar o fluxo de verdade, a ordem correta é:

1. manter `INMET_GMAIL_PUSH_ENABLED=false`;
2. escolher um endereço ou alias dedicado exclusivamente à assinatura INMET do Tempo Pelotas;
3. cadastrar esse endereço no INMET;
4. configurar o mesmo valor em `INMET_GMAIL_EXPECTED_RECIPIENT` no runtime;
5. confirmar a assinatura recebida nesse endereço dedicado;
6. executar manualmente o workflow no modo `check`;
7. comprovar que uma previsão real para Pelotas foi reconhecida somente quando destinada ao endereço reservado;
8. validar a prévia do texto e o estado da previsão estruturada;
9. homologar a reativação do Web Push público;
10. confirmar VAPID, Supabase e inscrições com consentimento;
11. confirmar `CRON_SECRET` e `TEMPO_PELOTAS_CRON_SECRET` equivalentes;
12. definir `INMET_GMAIL_PUSH_ENABLED=true` no runtime;
13. executar uma rodada manual `delivery`;
14. só então considerar o polling automático operacional.

Não criar OAuth Client ID/Secret, refresh token, tópico Pub/Sub ou Gmail Watch especificamente para esta integração.
