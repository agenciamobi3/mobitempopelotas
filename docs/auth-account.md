# Autenticação, conta, painel, favoritos, preferências e direitos LGPD

Última atualização: 10/09/2026.

## Princípio de produto

A conta do Tempo Pelotas é opcional para o consumo do portal aberto. Nenhuma página pública de previsão, chuva, vento, radar, satélite, câmeras, alertas, dados oficiais ou situação das águas deve exigir autenticação apenas para criar escassez comercial.

A autenticação acrescenta uma camada pessoal ao portal:

- identificação básica;
- preferências opcionais;
- painel autenticado;
- favoritos persistentes para páginas, locais, estações e ferramentas canônicas;
- históricos e ferramentas definidos para a camada Free;
- futuros recursos PRO por entitlement;
- exercício de direitos LGPD.

A política de separação Público / Free / PRO está em `docs/DATA_ACCESS_PUBLIC_FREE_PRO_PLAN.md`.

## Arquitetura atual

O login Google para Web usa **Google Identity Services diretamente no Tempo Pelotas + Supabase `signInWithIdToken()`**.

Objetivo: manter o Supabase como provedor de sessão e identidade sem expor o domínio técnico `<project-ref>.supabase.co` na etapa em que o usuário escolhe a conta Google e sem depender do add-on pago de Custom Domain.

Fluxo principal:

1. `/conta` apresenta o botão oficial do Google quando não existe sessão;
2. `GoogleLoginCard` carrega `https://accounts.google.com/gsi/client` no navegador;
3. o Google Identity Services é inicializado com o **Web Client ID público** em `VITE_GOOGLE_CLIENT_ID`;
4. a aplicação gera nonce aleatório com Web Crypto, envia ao Google a versão SHA-256 e mantém o nonce bruto apenas em memória para validação;
5. o Google abre o seletor/fluxo diretamente a partir do Tempo Pelotas e devolve um ID Token para o callback JavaScript;
6. o browser chama `supabase.auth.signInWithIdToken({ provider: "google", token, nonce })`;
7. o Supabase valida a identidade Google e cria/abre a sessão normal do Supabase Auth;
8. após sucesso, a aplicação navega diretamente para o `next` interno normalizado, como `/painel`;
9. `/conta` e `/painel` revalidam o usuário no servidor e seguem usando as mesmas tabelas, RLS, preferências e entitlements;
10. se uma sessão válida existir mas alguma linha estrutural estiver ausente, a aplicação pode reparar apenas a própria fundação da conta, sempre recriando `account_access` como Free.

O fluxo antigo PKCE via `signInWithOAuth()` não é mais a entrada principal do Google. A rota `/auth/callback` permanece temporariamente como compatibilidade segura durante a transição, mas o novo botão Google não navega para `*.supabase.co/auth/v1/callback`.

As rotas legadas `/entrar` e `/minha-conta` permanecem apenas como redirecionamentos de compatibilidade para `/conta`.

O parâmetro `next` aceita somente caminhos internos normalizados. Isso permite que `/painel` envie o visitante para `/conta?next=/painel` e que, após a autenticação, o usuário retorne ao painel sem aceitar redirects externos.

## Configuração Google Web

O frontend precisa somente do **Web Client ID público** do Google:

```env
VITE_GOOGLE_CLIENT_ID=000000000000-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
```

Esse Client ID é público por natureza e pode ser incorporado ao bundle. O **Google Client Secret não pode ser colocado em `VITE_*`, no frontend ou versionado no GitHub**; ele continua restrito à configuração do provider no Supabase quando necessário.

No Google Auth Platform, as origens JavaScript autorizadas devem incluir os hosts reais do portal que executarão o Google Identity Services, por exemplo:

- `https://tempopelotas.com.br`;
- `https://www.tempopelotas.com.br`;
- ambientes adicionais somente quando realmente usados para teste.

O fluxo por ID Token não depende de cadastrar `https://tempopelotas.com.br/auth/v1/callback` como callback do Google. Esse caminho não hospeda o serviço Auth do Supabase.

Branding do Google deve usar nome, domínio, logotipo, política de privacidade e demais informações oficiais do Tempo Pelotas. Isso é independente da autenticação Supabase e melhora a identificação do aplicativo pelo usuário.

## Camada de acesso

A migration `20260822043000_create_account_access.sql` cria `public.account_access`.

Cada identidade autenticada recebe uma linha própria com:

- `user_id`;
- `tier` — `free` ou `pro`;
- `status` — `active`, `suspended` ou `expired`;
- `source` — origem da concessão, inicialmente `system`;
- `valid_until` opcional;
- timestamps de criação/atualização.

Regras:

- novos usuários nascem `free` e `active` automaticamente;
- usuários existentes são preenchidos como Free pela migration;
- o usuário autenticado pode somente **ler a própria linha**;
- não existe escrita direta de `account_access` pelo browser autenticado;
- escrita administrativa fica reservada a `service_role` e, futuramente, ao fluxo server-side de billing/administração;
- ausência, expiração ou estado inválido nunca concede PRO por fallback.

`src/lib/auth/account-access.ts` centraliza os entitlements. Componentes não devem espalhar verificações como `plan === "pro"`.

A camada Free inclui ou prepara:

- acesso ao painel;
- preferências;
- favoritos persistentes;
- widgets permitidos pelos entitlements Free;
- histórico de até 60 dias nos recursos que forem definidos e implementados como Free.

A camada PRO pode liberar, quando implementado e permitido pelas fontes:

- histórico completo;
- comparações entre períodos, estações e variáveis;
- exportações avançadas de dados;
- radar/satélite avançados;
- métricas de acurácia;
- gráficos e análises avançadas.

Esses entitlements não alteram a regra de que dados oficiais adequados à disseminação pública continuam públicos.

## Reparação segura da fundação da conta

A migration `20260822045500_repair_authenticated_account_foundation.sql` cria a RPC `ensure_current_user_account_foundation()`.

Finalidade: impedir que uma falha eventual de trigger deixe uma sessão Google válida com conta parcialmente criada.

A função:

- exige `auth.uid()` válido;
- lê somente a identidade autenticada correspondente em `auth.users`;
- recria/atualiza o próprio `profiles`;
- cria `user_preferences` ausente;
- cria `account_access` ausente estritamente como `free`, `active`, `system`;
- usa `ON CONFLICT ... DO NOTHING` em `account_access`, portanto não altera uma concessão existente;
- nunca concede ou restaura PRO;
- é `SECURITY DEFINER` com `search_path` vazio;
- não pode ser executada por `anon`;
- pode ser chamada por `authenticated` somente para a própria identidade obtida por `auth.uid()`.

`getAccountSnapshot()` consulta perfil, preferências e acesso. Se não houver erro de leitura, mas alguma dessas três linhas estiver ausente, chama a reparação uma vez e recarrega a fundação. `storageReady` somente fica verdadeiro quando as três estruturas existem e foram lidas sem erro.

A migration foi aplicada ao Supabase externo em 22/08/2026 e validada com `SECURITY DEFINER`, `search_path` vazio, execução negada a `anon` e liberada a `authenticated`.

## Favoritos Free

A migration live `20260910202606_create_user_favorites` cria `public.user_favorites` e está versionada com o mesmo número em `supabase/migrations/20260910202606_create_user_favorites.sql`.

Cada favorito guarda somente:

- `user_id`;
- `resource_key` canônica;
- `resource_type` (`page`, `location`, `station` ou `tool`);
- data de criação.

O browser **não envia URL nem título arbitrário** para persistência. `src/lib/auth/favorite-resources.ts` contém o catálogo canônico de recursos que podem ser salvos. `setAccountFavorite()` recebe somente uma `resourceKey` validada e o estado desejado.

Segurança:

- `user_favorites.user_id` referencia `auth.users(id)` com `ON DELETE CASCADE`;
- RLS está habilitado;
- `anon` não recebe acesso à tabela;
- `authenticated` pode selecionar, inserir e remover somente linhas cuja `user_id` seja `auth.uid()`;
- a mutação server-side também verifica `access.entitlements.favorites`;
- a exclusão da conta remove automaticamente seus favoritos.

O painel Free mostra favoritos salvos como atalhos e permite adicionar/remover recursos do catálogo. Favoritar uma página não altera sua disponibilidade pública e não cria paywall.

## `/conta` e `/painel`

### `/conta`

Responsabilidades:

- login quando não autenticado;
- identidade;
- nome de exibição;
- preferências e consentimentos;
- indicação da camada Free/PRO;
- acesso ao painel;
- exportação LGPD;
- exclusão de conta;
- logout.

### `/painel`

Responsabilidades:

- exigir autenticação server-side;
- permanecer `noindex, nofollow`;
- apresentar a camada efetiva da conta;
- funcionar como shell comum a Free e PRO;
- oferecer favoritos persistentes e widgets já disponíveis;
- receber progressivamente históricos e módulos avançados;
- nunca ser usado para esconder conteúdo governamental que já pertence ao portal público.

O painel deixou de ser apenas um shell. O primeiro valor pessoal efetivo da camada Free é o workspace de favoritos, acompanhado das preferências de conta e do gerador de widgets já existente. Histórico Free, comparações e análises só devem ser apresentados como disponíveis quando houver implementação real e contrato de dados correspondente.

## Variáveis

```env
SUPABASE_MODE=external
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=

VITE_SUPABASE_MODE=external
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_GOOGLE_CLIENT_ID=
```

As variáveis `VITE_*` contêm somente valores públicos. A chave administrativa e qualquer Client Secret permanecem exclusivamente fora do bundle do navegador.

## Cookies e cache

Respostas dependentes de sessão usam:

- `Cache-Control: private, no-store, max-age=0`;
- `Pragma: no-cache`;
- `Vary: Cookie, Authorization`.

Isso evita reutilização de respostas privadas por cache compartilhado.

## RLS e proteção

As tabelas `profiles`, `user_preferences`, `account_consent_events`, `account_access` e `user_favorites` possuem RLS.

O browser autenticado não recebe:

- access token como dado de aplicação;
- refresh token como dado de aplicação;
- chave administrativa;
- Google Client Secret;
- dados de outras contas;
- chaves criptográficas web push;
- mecanismo de escrita direta para promover a própria conta a PRO.

## Preferências e consentimentos

`update_account_preferences` é a RPC controlada para atualizar perfil e preferências. O histórico de consentimentos preserva:

- canal;
- estado autorizado/revogado;
- origem;
- versão da política;
- data/hora.

## Exportação dos dados

```http
GET /api/account/export
```

A rota exige sessão e entrega JSON com os dados pessoais previstos pelo contrato atual. Tokens, chaves criptográficas e credenciais administrativas são omitidos.

A exportação versão `1.3` inclui identidade, perfil, preferências, camada de acesso, favoritos, histórico de consentimentos, aparelhos de notificação e contribuições históricas da conta. Quando billing existir, dados financeiros sujeitos a retenção legal deverão ter política própria.

## Exclusão da conta

```http
POST /api/account/delete
Content-Type: application/json

{
  "confirmation": "EXCLUIR MINHA CONTA"
}
```

A rota exige mesma origem, limita o corpo, valida sessão, exige frase exata, remove a identidade pelo cliente administrativo e encerra a sessão local. `account_access`, `user_favorites` e demais estruturas vinculadas por FK usam cascata compatível com a exclusão da identidade.

## Logout

`POST /auth/signout` encerra somente a sessão local do dispositivo atual e redireciona para a Home.

## Estado de validação em 10/09/2026

Confirmado tecnicamente:

- existem 2 identidades em `auth.users` no projeto `tempopelotas`;
- as 2 identidades possuem `profiles`, `user_preferences` e `account_access` correspondentes;
- as 2 contas estão `free` e `active`;
- não há conta autenticada sem perfil, preferências ou acesso;
- migration `account_access` aplicada no Supabase externo;
- RLS de `account_access` permite apenas leitura da própria linha ao autenticado;
- reparação segura da fundação foi aplicada e validada no banco;
- migration `create_user_favorites` aplicada ao Supabase externo;
- `user_favorites` está com RLS habilitado;
- `anon` não possui `SELECT` em `user_favorites`;
- `authenticated` possui `SELECT`, `INSERT` e `DELETE`, sujeitos às políticas de dono da linha;
- `/conta` e `/painel` permanecem rotas privadas/noindex;
- `next` rejeita redirects externos por contrato;
- exportação LGPD versão 1.3 inclui favoritos e continua omitindo secrets;
- código do login usa Google Identity Services + `signInWithIdToken()`;
- nonce do Google é gerado com Web Crypto e validado pelo Supabase;
- o botão principal não referencia `/auth/v1/callback` do Supabase.

Ainda pendente para fechamento E2E da conta Free:

- testar em navegador real a inclusão e remoção de favoritos com uma conta Free;
- confirmar persistência após recarregar e entrar novamente;
- confirmar isolamento cruzado dos favoritos entre as duas contas;
- validar o novo workspace de favoritos em mobile real;
- repetir exportação e exclusão com favoritos existentes para confirmar o fluxo completo;
- validar visualmente estados degradados se a storage pessoal estiver indisponível.

## Checklist de validação final

1. [x] confirmar a migration `account_access` no Supabase externo;
2. [x] confirmar RLS e ausência de escrita autenticada direta em `account_access`;
3. [x] aplicar e validar a reparação segura da fundação da conta;
4. [x] remover `signInWithOAuth()` da entrada principal do Google;
5. [x] implementar Google Identity Services + `signInWithIdToken()` com nonce;
6. [x] confirmar existência de contas reais com fundação completa no Supabase;
7. [x] confirmar que as contas atuais recebem `Free` e `active`;
8. [x] proteger por contrato `next=https://exemplo.com` e `next=//exemplo.com`;
9. [x] manter `/conta` e `/painel` como `noindex` por contrato;
10. [x] implementar favoritos persistentes para Free com catálogo canônico;
11. [x] aplicar `user_favorites` no Supabase e validar RLS/privilégios;
12. [x] incluir favoritos na exportação LGPD e manter secrets fora do payload por contrato;
13. [ ] testar adicionar/remover favorito em navegador real;
14. [ ] confirmar persistência após reload e nova sessão;
15. [ ] confirmar em E2E que uma conta não consulta favoritos da outra;
16. [ ] testar atualização de preferências e consentimentos em navegador real;
17. [ ] testar exportação versão 1.3 em navegador real;
18. [ ] testar exclusão e cascata com `account_access` e `user_favorites`;
19. [ ] testar logout;
20. [ ] validar mobile real;
21. [ ] avançar histórico Free somente sobre datasets classificados e implementados para essa camada.
