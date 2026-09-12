# Tempo Pelotas Observatório — fundação silenciosa

Data: 12/09/2026  
Branch operacional: `main`  
Rota interna: `/observatorio`  
Estado: **Fase 1 em andamento**

## 1. Escopo desta entrega

Esta etapa inicia a Fase 1 definida em `docs/TEMPO_PELOTAS_OBSERVATORIO_3D_ARCHITECTURE.md` sem antecipar radar, satélite, STSC, alertas ou hidrologia.

O objetivo desta fatia é garantir primeiro:

- autorização PRO centralizada;
- rota interna e não indexável;
- resposta privada;
- shell próprio do Observatório;
- contratos de camada;
- Layer Manager;
- Render Governor;
- testes de regressão da fundação.

A instalação do runtime Cesium, seus assets, base cartográfica e terreno permanecem deliberadamente pendentes nesta mesma Fase 1.

## 2. Entitlement implementado

`AccountEntitlements` passou a possuir:

```ts
observatoryAccess: boolean
```

Política efetiva:

```text
Free -> false
PRO ativo -> true
PRO suspenso/expirado -> false, por fail-closed para Free
```

A rota não decide acesso por `tier === "pro"`. O contrato continua centralizado em `resolveAccountAccess()`.

Nenhuma migration foi criada e o schema `account_access` não foi alterado. O entitlement é derivado do tier/status já existentes.

## 3. Gate server-side

Arquivo:

```text
src/observatory/data/observatory-access.functions.ts
```

O gate:

1. valida configuração pública do Supabase;
2. resolve a sessão no servidor com `client.auth.getUser()`;
3. lê `account_access` do usuário autenticado;
4. reutiliza `ensure_current_user_account_foundation` se a fundação da conta estiver ausente;
5. resolve `EffectiveAccountAccess` pelo contrato central;
6. autoriza somente quando `access.entitlements.observatoryAccess` for `true`;
7. falha fechado quando a conta/acesso não puder ser resolvido.

Headers aplicados pela fundação de acesso:

```text
Cache-Control: private, no-store, max-age=0
CDN-Cache-Control: no-store
Pragma: no-cache
Vary: Cookie, Authorization
X-Robots-Tag: noindex, nofollow, noarchive, nosnippet, noimageindex
```

Nenhum `service_role` é utilizado ou exposto.

## 4. Rota interna

Criada:

```text
src/routes/observatorio.tsx
```

Comportamento:

### Visitante não autenticado

Redireciona para:

```text
/conta?next=/observatorio
```

### Conta autenticada sem entitlement

Renderiza somente estado privado de acesso PRO.

Não monta `ObservatoryShell`.

Não consulta camada meteorológica do Observatório.

### Conta PRO autorizada

Renderiza o shell interno da ferramenta.

Nesta etapa ainda não existe runtime 3D real.

## 5. SEO e descoberta

A rota usa:

```text
noindex
nofollow
noarchive
nosnippet
noimageindex
```

Também possui `googlebot` equivalente e canonical próprio `/observatorio`.

A rota:

- não foi adicionada ao header;
- não foi adicionada ao megamenu;
- não foi adicionada ao footer;
- não foi adicionada ao feed;
- não foi adicionada ao sitemap;
- não foi adicionada a `src/lib/public-routes.ts`;
- não altera a contagem de URLs públicas indexáveis.

`noindex` permanece apenas política de descoberta. A barreira real é sessão + entitlement server-side.

## 6. Shell do Observatório

Arquivos:

```text
src/observatory/ui/ObservatoryShell.tsx
src/observatory/ui/ObservatoryShell.css
```

A primeira superfície estabelece a identidade do produto sem copiar o HUD/cockpit do God's Eye View.

Estrutura inicial:

- cabeçalho `Tempo Pelotas / Observatório`;
- selo `PRO`;
- área de camadas;
- viewport central reservada ao globo;
- barra inferior reservada à timeline;
- layout responsivo;
- suporte a `prefers-reduced-motion`.

O texto da interface informa explicitamente que a fundação 3D ainda está em implantação. Não há mapa falso, globo fake ou dado meteorológico ilustrativo apresentado como runtime.

## 7. Contratos internos

### `ObservatoryTypes`

Foram definidos contratos mínimos para:

- categoria de camada;
- classificação `observed | forecast | derived | visual`;
- estados `loading | current | stale | degraded | unavailable | disabled | review`;
- entitlement requerido;
- attribution;
- source policy;
- estado de runtime.

### `ObservatoryLayerManager`

Implementa:

- registro central;
- prevenção de IDs duplicados;
- listagem/leitura defensiva;
- ligar/desligar;
- controle de opacidade limitado a `0..1`;
- atualização de estado;
- cleanup do registro.

Nenhuma camada meteorológica é registrada implicitamente nesta fase.

### `ObservatoryRenderGovernor`

Foi criada a abstração de renderização sob demanda antes da chegada do Cesium.

Ela:

- recebe um alvo com `requestRender()`;
- agrupa solicitações em `requestAnimationFrame` quando disponível;
- permanece utilizável sem DOM durante testes/SSR;
- possui detach/destroy explícitos.

O adapter para `viewer.scene.requestRender()` será conectado quando o viewer Cesium existir.

## 8. Testes

Criado:

```text
tests/observatory-foundation.test.ts
```

O contrato cobre:

- Free sem `observatoryAccess`;
- PRO ativo com acesso;
- PRO suspenso fail-closed;
- meta robots estrita;
- ausência da rota em `public-routes`;
- gate server-side por entitlement;
- headers privados/noindex;
- ausência de `service_role`;
- shell montado somente após gate;
- comportamento básico do Layer Manager;
- existência do Render Governor;
- ausência deliberada de Cesium enquanto instalação versionada ainda não foi concluída.

O teste foi adicionado a `npm run test:contracts`.

As dependências de `package.json` foram preservadas. Apenas o script de contratos recebeu o novo teste, de modo que `package-lock.json` não precisa ser alterado nesta fatia.

## 9. Cesium ainda não implementado

A tentativa de executar a parte de instalação pelo projeto conectado ao Lovable foi bloqueada porque o workspace estava sem créditos no momento desta implementação.

Como o workflow do projeto usa:

```text
npm ci
```

não foi adicionada uma dependência `cesium` manualmente sem atualizar corretamente os lockfiles.

Isso evita deixar a `main` em estado em que:

- `package.json` declara Cesium;
- `package-lock.json` não conhece Cesium;
- `npm ci` falha antes dos testes.

Portanto permanecem pendentes na Fase 1:

- instalar versão aprovada do `cesium` pelo fluxo normal;
- atualizar `package-lock.json` e `bun.lock` coerentemente;
- materializar `Workers`, `Assets`, `Widgets` e `ThirdParty`;
- definir `CESIUM_BASE_URL`/equivalente;
- criar `ObservatoryViewer` real;
- conectar `ObservatoryRenderGovernor` ao scene;
- configurar base cartográfica keyless;
- integrar Re:Earth Terrain com fallback elipsoidal;
- revisar CSP somente para os hosts efetivamente adotados;
- validar build Vite/TanStack/Nitro;
- validar a rota no preview/domínio com conta PRO real.

## 10. Estado da Fase 1

### Concluído nesta fatia

- [x] entitlement `observatoryAccess`;
- [x] Free `false`;
- [x] PRO ativo `true`;
- [x] PRO suspenso/expirado fail-closed;
- [x] `/observatorio` criada;
- [x] gate server-side;
- [x] meta robots estrita;
- [x] `X-Robots-Tag` na fundação de acesso;
- [x] cache privado/no-store;
- [x] ausência em `public-routes`/sitemap/navegação;
- [x] shell interno;
- [x] contratos de camada;
- [x] Layer Manager;
- [x] Render Governor abstrato;
- [x] teste de fundação versionado.

### Pendente antes de marcar Fase 1 como concluída

- [ ] Cesium instalado com lockfiles coerentes;
- [ ] lazy import do runtime Cesium;
- [ ] assets Cesium materializados no build;
- [ ] `ObservatoryViewer` real;
- [ ] base cartográfica;
- [ ] terreno + fallback;
- [ ] CSP final dos providers escolhidos;
- [ ] build/typecheck/testes executados em executor funcional;
- [ ] smoke com conta PRO real;
- [ ] confirmação de que bundles públicos convencionais não carregam Cesium.

## 11. Próxima ação

Retomar a própria Fase 1 pelo runtime 3D assim que houver executor capaz de instalar dependências e regenerar lockfiles com segurança.

Não iniciar radar, satélite, STSC, alertas ou hidrologia antes de fechar esse bloco.
