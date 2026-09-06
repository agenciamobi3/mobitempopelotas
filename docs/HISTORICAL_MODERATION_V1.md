# Moderação do arquivo histórico — V1

Data: 06/09/2026

## Objetivo

Criar uma superfície operacional para revisar as contribuições enviadas pelo arquivo histórico sem alterar automaticamente o conteúdo público e sem enfraquecer o RLS dos colaboradores.

A V1 vive dentro de `/painel`, que já é autenticado e `noindex`. O módulo somente aparece quando o servidor reconhece o usuário como operador autorizado.

## Autorização

A autorização administrativa é fail-closed e usa duas condições independentes:

1. o usuário precisa estar autenticado no Supabase normal do portal;
2. o e-mail autenticado precisa constar em `MOBI_PORTAL_ADMIN_EMAILS`, variável disponível somente no runtime do servidor.

Além disso, o cliente administrativo do Supabase precisa estar configurado (`MOBI_SUPABASE_SECRET_KEY` ou equivalente server-side já aceito pelo projeto).

Se a allowlist estiver ausente, vazia, o secret administrativo não existir ou o usuário não corresponder, o módulo não é exibido e nenhuma consulta administrativa é executada.

Formato da allowlist:

```text
MOBI_PORTAL_ADMIN_EMAILS=operador1@exemplo.com,operador2@exemplo.com
```

Também são aceitos `;` e quebra de linha como separadores.

Nunca criar uma variável `VITE_*` para essa allowlist. Ela não pode entrar no bundle do navegador.

## Fluxo de dados

1. `/painel` carrega primeiro o snapshot normal da conta;
2. se a conta não estiver autenticada, o fluxo de login/redirect ocorre sem consultar a fila administrativa;
3. somente depois de uma conta autenticada, `getHistoricalModerationSnapshot` verifica a autorização do operador;
4. somente após `authorized`, o servidor cria `createSupabaseAdminClient()`;
5. a consulta administrativa busca até 51 registros `pending`/`reviewing` para saber se a fila ultrapassa os 50 itens exibidos;
6. anexos continuam no bucket privado `historical-contributions`;
7. links de anexos são assinados por apenas 10 minutos;
8. nenhuma URL assinada é criada para usuário não autorizado.

## Estados de moderação

A V1 permite:

- `pending` — estado inicial criado pelo colaborador;
- `reviewing` — operador iniciou a conferência;
- `accepted` — material aceito para uso na pesquisa;
- `rejected` — material recusado para o arquivo de pesquisa.

A ação de moderação pode alterar somente:

- `status`;
- `moderation_note`;
- `reviewed_at`.

Ela não altera título, descrição, anexos, autoria, consentimento ou autorização de publicação.

## Aceito não significa publicado

`accepted` significa apenas que o material foi considerado útil/confiável o suficiente para a pesquisa editorial.

`publication_authorized` continua independente:

- `true`: o colaborador autorizou reprodução pública nos termos apresentados no envio;
- `false`: o material pode orientar análise/pesquisa, mas não deve ser reproduzido publicamente.

Nenhuma ação da V1 publica conteúdo automaticamente em 1941, 2001, 2015, 2024 ou qualquer outra página.

## Privacidade e anexos

- bucket permanece privado;
- V1 não muda policies do colaborador;
- cliente administrativo só roda após autorização server-side;
- links assinados expiram em 10 minutos;
- links de fonte informados pelo colaborador só são clicáveis quando usam `http:` ou `https:`;
- o painel não precisa mostrar e-mail ou identificador interno do colaborador;
- `credit_name` e a escolha de anonimato permanecem os únicos dados de crédito necessários para a decisão editorial inicial.

## Limites da V1

- mostra no máximo os 50 itens ativos mais recentes;
- não possui paginação ainda;
- itens aceitos/rejeitados saem da fila ativa após a decisão;
- não há publicação automática;
- não há comparação de versões ou trilha de auditoria separada por operador além de `moderation_note` e `reviewed_at`;
- a allowlist precisa ser configurada no ambiente de produção para o módulo aparecer.

## Arquivos principais

- `src/lib/admin/operator-authorization.server.ts`;
- `src/lib/history/moderation.functions.ts`;
- `src/components/history/HistoricalModerationPanel.tsx`;
- `src/components/history/HistoricalModerationPanel.css`;
- `src/routes/painel.tsx`;
- `tests/historical-moderation.test.ts`.

## Próxima evolução

Depois que a V1 estiver validada em runtime com uma conta descartável/autorizada:

1. adicionar paginação e filtro por ano/status/tipo;
2. registrar operador/revisor de forma auditável, se necessário;
3. permitir reabrir itens aceitos/rejeitados em uma área de histórico;
4. criar fluxo editorial separado para promover material autorizado a uma galeria/publicação;
5. manter qualquer publicação como ação explícita e independente da moderação.
