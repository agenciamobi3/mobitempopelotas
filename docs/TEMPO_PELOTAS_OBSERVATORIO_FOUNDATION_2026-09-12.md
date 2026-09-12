# Tempo Pelotas Observatório — fundação silenciosa

Data: 12/09/2026  
Branch operacional: `main`  
Rota interna: `/observatorio`  
Estado: **Fase 1 tecnicamente implementada; smoke autenticado em produção pendente**

## 1. Escopo

Esta etapa executa a **Fase 1 — fundação silenciosa** definida em `docs/TEMPO_PELOTAS_OBSERVATORIO_3D_ARCHITECTURE.md` sem antecipar radar, satélite, STSC, alertas ou hidrologia.

A fundação agora cobre:

- entitlement PRO centralizado;
- exceção administrativa server-only para desenvolvimento;
- rota interna e não indexável;
- gate server-side;
- CesiumJS isolado e lazy;
- assets locais do Cesium;
- viewer mínimo;
- base OpenStreetMap;
- Re:Earth Terrain com fallback elipsoidal;
- Layer Manager;
- Render Governor;
- CSP restrita aos providers adotados;
- contratos de regressão;
- build Vite/TanStack/Nitro validado em runner real.

Nenhuma camada meteorológica do Observatório foi iniciada nesta fase.

## 2. Acesso PRO e acesso administrativo

`AccountEntitlements` possui:

```ts
observatoryAccess: boolean
```

Política comercial:

```text
Free -> false
PRO ativo -> true
PRO suspenso/expirado -> false
```

Durante desenvolvimento existe uma exceção administrativa deliberada:

```text
usuário autenticado
+ e-mail confirmado no Supabase
+ e-mail presente em MOBI_PORTAL_ADMIN_EMAILS
= acesso ao Observatório mesmo sem assinatura PRO
```

A allowlist é server-only. Não existe query string, cookie manual, flag no navegador nem e-mail hardcoded no repositório.

O helper canônico é:

```text
src/lib/admin/operator-authorization.server.ts
```

O gate do Observatório reaproveita `isPortalOperatorEmail()` antes de consultar a assinatura. Dessa forma o único admin/dev pode testar a ferramenta em produção com uma conta Free, sem alterar o contrato comercial dos demais usuários.

A variável continua sendo:

```text
MOBI_PORTAL_ADMIN_EMAILS
```

Ela deve conter o e-mail usado no login do Tempo Pelotas e permanecer somente no runtime do servidor.

## 3. Gate server-side

Arquivo:

```text
src/observatory/data/observatory-access.functions.ts
```

Fluxo:

1. valida configuração pública do Supabase;
2. resolve a sessão com `client.auth.getUser()` no servidor;
3. se a conta possui e-mail confirmado e está em `MOBI_PORTAL_ADMIN_EMAILS`, concede `grant: "admin"` imediatamente;
4. caso contrário, lê `account_access`;
5. reutiliza `ensure_current_user_account_foundation` quando necessário;
6. resolve `EffectiveAccountAccess` pelo contrato central;
7. concede `grant: "entitlement"` somente quando `observatoryAccess=true`;
8. Free comum recebe `grant: "none"`;
9. falhas de conta/acesso permanecem fail-closed.

Headers:

```text
Cache-Control: private, no-store, max-age=0
CDN-Cache-Control: no-store
Pragma: no-cache
Vary: Cookie, Authorization
X-Robots-Tag: noindex, nofollow, noarchive, nosnippet, noimageindex
```

Nenhum service role é enviado ao navegador.

## 4. Rota `/observatorio`

Arquivo:

```text
src/routes/observatorio.tsx
```

Comportamento:

### Visitante não autenticado

Redireciona para:

```text
/conta?next=/observatorio
```

### Conta Free comum

Vê somente o estado privado informando que o Observatório pertence ao PRO. O viewer não é montado.

### Conta PRO ativa

Recebe o viewer.

### Admin/dev confirmado

Recebe o viewer mesmo que sua conta esteja em Free e nunca tenha assinado o PRO.

A rota possui shell próprio e não herda header/footer público duplicado.

## 5. SEO e descoberta

A rota continua deliberadamente oculta:

```text
noindex
nofollow
noarchive
nosnippet
noimageindex
```

Também:

- `googlebot` recebe política equivalente;
- response possui `X-Robots-Tag`;
- `/observatorio` não está em `src/lib/public-routes.ts`;
- não está no sitemap;
- não está no header;
- não está no megamenu;
- não está no footer;
- não está no feed;
- não possui CTA público.

`noindex` é somente política de descoberta. A segurança real é sessão + entitlement/admin server-side.

## 6. CesiumJS

Versão fixada:

```text
cesium 1.145.0
```

`package.json`, `package-lock.json` e `bun.lock` foram atualizados de forma coerente por runner real. `npm ci` foi validado após a instalação.

Cesium não entra no bundle das páginas convencionais do portal.

Fluxo:

```text
/observatorio
  -> gate server-side
  -> ObservatoryShell
  -> React.lazy(ObservatoryViewer)
  -> import("cesium") somente no cliente
```

A rota e o shell não possuem import estático do pacote Cesium.

## 7. Assets

Script:

```text
scripts/prepare-cesium-assets.mjs
```

Antes de `dev` e `build`, o projeto materializa a partir de `node_modules/cesium/Build/Cesium`:

- `Assets`;
- `ThirdParty`;
- `Widgets`;
- `Workers`.

Destino:

```text
public/cesium/
```

Runtime:

```text
CESIUM_BASE_URL=/cesium/
```

A cópia gerada não é tratada como código-fonte manual nem como dataset do Observatório.

## 8. Viewer mínimo

Arquivo:

```text
src/observatory/core/ObservatoryViewer.tsx
```

O viewer:

- inicializa apenas no navegador;
- define `CESIUM_BASE_URL` antes do import do runtime;
- usa `OpenStreetMapImageryProvider` como base keyless;
- preserva atribuição do OpenStreetMap;
- tenta Re:Earth Terrain por `CesiumTerrainProvider.fromUrl()`;
- usa fallback `EllipsoidTerrainProvider` se o terreno falhar;
- inicia a câmera no contexto Pelotas/Lagoa;
- usa `requestRenderMode`;
- mantém `maximumRenderTimeChange = Infinity` em repouso;
- conecta o `ObservatoryRenderGovernor` a `viewer.scene.requestRender()`;
- destrói viewer e governor no cleanup;
- apresenta fallback de interface se WebGL/Cesium não puder iniciar.

Não existe Google Photorealistic 3D nem Cesium ion como requisito da Fase 1.

## 9. Providers e CSP

A fundação adiciona somente os hosts necessários:

```text
https://tile.openstreetmap.org
https://terrain.reearth.land
```

Eles entram onde necessário em `img-src`/`connect-src`.

Não foram adicionados a `script-src`.

`worker-src 'self' blob:` permanece adequado aos workers locais do Cesium.

## 10. Layer Manager e Render Governor

### Layer Manager

`ObservatoryLayerManager` já suporta:

- IDs únicos;
- classificação científica;
- categoria;
- temporalidade;
- entitlement requerido;
- attribution;
- source policy;
- estados de runtime;
- enable/disable;
- opacidade;
- cleanup.

Nenhuma camada meteorológica é registrada implicitamente.

### Render Governor

`ObservatoryRenderGovernor`:

- conecta a `requestRender()`;
- agrupa pedidos de render;
- pode ficar ocioso;
- funciona em ambiente sem DOM durante testes;
- possui detach/destroy explícitos.

A fundação não mantém 60 FPS contínuos quando a cena está parada.

## 11. Validação

Workflow dedicado:

```text
.github/workflows/observatory-foundation.yml
```

Validação real já comprovada durante a implementação:

- `npm ci` passou;
- geração de `routeTree` passou;
- `/observatorio` foi registrada na árvore versionada;
- contratos específicos do Observatório passaram;
- build de produção com Cesium passou;
- assets Cesium foram materializados durante o build.

O typecheck global continua encontrando uma incompatibilidade preexistente em:

```text
src/lib/hydrology/ana-rhn-hydrography.functions.ts
```

O erro é de serialização do campo `geometry.coordinates` tipado como `unknown` em um `createServerFn`. Não foi causado pela fundação do Observatório e não deve ser corrigido dentro desta frente apenas para produzir CI verde.

## 12. Contratos protegidos

`tests/observatory-foundation.test.ts` protege, entre outros:

- Free sem entitlement;
- PRO ativo;
- PRO suspenso fail-closed;
- bypass administrativo somente server-side;
- exigência de e-mail confirmado para admin;
- ausência de `VITE_MOBI_PORTAL_ADMIN_EMAILS`;
- noindex completo;
- ausência em public routes;
- gate no servidor;
- headers privados;
- ausência de service role no gate;
- shell somente após autorização;
- Layer Manager vazio na fundação;
- Render Governor;
- Cesium 1.145.0 fixado;
- import dinâmico;
- assets locais;
- OSM;
- Re:Earth Terrain;
- fallback elipsoidal;
- render sob demanda;
- CSP restrita aos providers usados.

## 13. Estado da Fase 1

- [x] entitlement `observatoryAccess`;
- [x] Free `false`;
- [x] PRO ativo `true`;
- [x] PRO suspenso/expirado fail-closed;
- [x] acesso admin/dev sem assinatura por allowlist server-only;
- [x] `/observatorio` criada;
- [x] gate server-side;
- [x] noindex completo;
- [x] cache privado/no-store;
- [x] fora de sitemap/public routes/navegação;
- [x] shell próprio;
- [x] Cesium instalado com lockfiles coerentes;
- [x] lazy import;
- [x] assets materializados;
- [x] `ObservatoryViewer` real;
- [x] base cartográfica;
- [x] terreno + fallback;
- [x] Layer Manager;
- [x] Render Governor;
- [x] CSP dos providers iniciais;
- [x] contratos focados;
- [x] build de produção com Cesium;
- [ ] confirmar `MOBI_PORTAL_ADMIN_EMAILS` no runtime de produção para a conta de desenvolvimento;
- [ ] smoke autenticado no domínio canônico;
- [ ] confirmar por análise de build que páginas públicas convencionais não recebem chunk Cesium no carregamento inicial.

## 14. Próxima fronteira

A Fase 2 só começa depois do smoke autenticado da fundação.

Ordem aprovada após o smoke:

1. radar REDEMET;
2. satélite Realçado;
3. satélite IR;
4. satélite Visível;
5. STSC;
6. alertas;
7. hidrologia;
8. inspector e transparência por camada.

A fundação 3D não deve receber dados meteorológicos antes de a rota, assets, terreno e autorização serem confirmados no runtime canônico.
