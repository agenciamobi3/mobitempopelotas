# Tempo Pelotas Observatório — fundação executável

Data: 12/09/2026  
Branch operacional: `main`  
Rota interna: `/observatorio`  
Estado: **fundação 3D, camadas observacionais, timeline e cenários implementados; validação final do PR #135 pendente**

## 1. Escopo atual

A Fase 1 deixou de ser apenas uma casca técnica. O Observatório já possui:

- entitlement PRO centralizado;
- exceção administrativa server-only para desenvolvimento;
- rota interna e não indexável;
- gate server-side;
- CesiumJS isolado e lazy;
- assets locais do Cesium;
- viewer 3D real;
- base OpenStreetMap;
- Re:Earth Terrain com fallback elipsoidal;
- Layer Manager;
- Render Governor;
- CSP restrita aos providers adotados;
- radar REDEMET georreferenciado;
- satélite REDEMET georreferenciado;
- raios/STSC por pontos;
- alertas INMET e hidrologia reutilizando integrações canônicas;
- timeline global para radar, satélite e raios;
- cenários compartilháveis com câmera, tempo, camadas e opacidade;
- contratos de regressão dedicados.

O Observatório continua privado durante o desenvolvimento e não substitui nenhuma superfície pública do Tempo Pelotas.

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

O gate do Observatório reaproveita `isPortalOperatorEmail()` antes de consultar a assinatura. Dessa forma o admin/dev pode testar a ferramenta com uma conta Free sem alterar o contrato comercial dos demais usuários.

A variável continua sendo:

```text
MOBI_PORTAL_ADMIN_EMAILS
```

Ela deve permanecer somente no runtime do servidor.

## 3. Gate server-side

Arquivo:

```text
src/observatory/data/observatory-access.functions.ts
```

Fluxo:

1. valida configuração pública do Supabase;
2. resolve a sessão com `client.auth.getUser()` no servidor;
3. se a conta possui e-mail confirmado e está em `MOBI_PORTAL_ADMIN_EMAILS`, concede `grant: "admin"`;
4. caso contrário, lê `account_access`;
5. reutiliza `ensure_current_user_account_foundation` quando necessário;
6. resolve `EffectiveAccountAccess` pelo contrato central;
7. concede `grant: "entitlement"` somente quando `observatoryAccess=true`;
8. Free comum recebe `grant: "none"`;
9. falhas permanecem fail-closed.

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

Se a URL original contém `#scenario=...`, o fragmento permanece no navegador durante o redirect. O `GoogleLoginCard` preserva exclusivamente esse parâmetro e o reaplica ao `nextPath` já validado por `safeNextPath` depois do login.

### Conta Free comum

Vê somente o estado privado informando que o Observatório pertence ao PRO. O viewer não é montado.

### Conta PRO ativa

Recebe o viewer.

### Admin/dev confirmado

Recebe o viewer mesmo que sua conta esteja em Free.

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

Cesium não entra no bundle inicial das páginas convencionais do portal.

Fluxo:

```text
/observatorio
  -> gate server-side
  -> ObservatoryShell
  -> React.lazy(ObservatoryViewer)
  -> import("./observatory-cesium-runtime")
  -> import do pacote Cesium somente na árvore lazy
```

A Home, previsão, radar público e hidrologia pública continuam independentes.

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

## 8. Viewer e runtime 3D

Arquivos:

```text
src/observatory/core/ObservatoryViewer.tsx
src/observatory/core/observatory-cesium-runtime.ts
```

O viewer/runtime:

- inicializa apenas no navegador;
- define `CESIUM_BASE_URL` antes do runtime;
- usa `CesiumWidget`, não `Viewer`/Knockout;
- usa `OpenStreetMapImageryProvider` como base keyless;
- preserva atribuição do OpenStreetMap;
- tenta Re:Earth Terrain por `CesiumTerrainProvider.fromUrl()`;
- usa fallback `EllipsoidTerrainProvider` se o terreno falhar;
- inicia a câmera no contexto Pelotas/Lagoa;
- usa `requestRenderMode`;
- mantém `maximumRenderTimeChange = Infinity` em repouso;
- conecta `ObservatoryRenderGovernor` a `scene.requestRender()`;
- destrói runtime e governor no cleanup;
- apresenta fallback de interface se WebGL/Cesium não iniciar;
- expõe leitura, restauração e assinatura da câmera para cenários compartilháveis.

Não existe Google Photorealistic 3D nem Cesium ion como requisito atual.

## 9. Camadas observacionais atuais

Catálogo:

```text
radar
satellite
lightning
alerts
hydrology
```

### Radar

- endpoint canônico `/api/redemet/radar?frames=8`;
- imagery georreferenciada pelos bounds reais;
- opacidade controlável;
- série temporal reutilizada pela timeline.

### Satélite

- endpoint canônico `/api/redemet/satellite?type=realcada&frames=8`;
- imagery georreferenciada;
- opacidade controlável;
- série temporal reutilizada pela timeline.

### Raios / STSC

- endpoint canônico `/api/redemet/storms?frames=12`;
- pontos temporais;
- ausência de frame não é convertida automaticamente em zero ocorrências.

### Alertas

Reutilizam a integração INMET já existente. Não existe nova API externa exclusiva do Observatório.

### Hidrologia

Reutiliza os contratos canônicos de Laranjal/rede regional já integrados. Séries e referências distintas não são fundidas silenciosamente.

O Observatório agrega ferramentas sobre dados já públicos; ele não move esses dados para um paywall.

## 10. Timeline global

Arquivos principais:

```text
src/observatory/data/observatory-temporal-layers.ts
src/observatory/ui/ObservatoryShell.tsx
src/observatory/ui/ObservatoryTimeline.css
```

Camadas temporais atuais:

```text
radar
satellite
lightning
```

O shell agrega os timestamps válidos em uma linha do tempo comum. Ao escolher um instante, cada fonte seleciona o último frame que não esteja no futuro em relação ao horário global; se não houver frame anterior, usa a primeira observação posterior disponível como contingência.

Controles atuais:

- anterior;
- próximo;
- play/pause;
- slider global;
- horário selecionado;
- `Ir para agora`.

A troca de horário reutiliza os frames carregados em memória e não refaz a consulta da série a cada movimento do slider.

## 11. Cenários compartilháveis

Arquivos principais:

```text
src/observatory/core/ObservatoryScenario.ts
src/observatory/ui/ObservatoryShell.tsx
src/components/auth/GoogleLoginCard.tsx
```

O estado V1 transporta:

- instante selecionado;
- camadas ligadas/desligadas;
- opacidade;
- câmera Cesium.

Formato:

```text
/observatorio#scenario=<payload-versionado>
```

O codec aceita somente IDs canônicos, normaliza limites e falha fechado para versões/payloads inválidos.

### Login

O hash não chega ao servidor. Para um destinatário ainda sem sessão, o navegador mantém o fragmento durante o redirect para `/conta`; depois do login Google, `GoogleLoginCard` extrai apenas `scenario` e o reaplica ao caminho já aprovado por `safeNextPath`.

Nenhum redirect externo é aceito e nenhuma API foi criada para transportar o cenário.

### Restauração temporal

Quando o cenário ativa várias fontes temporais, o horário solicitado permanece pendente até **todas as fontes temporais esperadas assentarem**, inclusive fontes que terminem vazias/indisponíveis. Só então o shell resolve o instante contra a união final dos timestamps.

Isso elimina a condição de corrida em que a primeira resposta poderia escolher um frame aproximado antes de chegar a fonte que contém o timestamp exato.

Documento específico: `docs/TEMPO_PELOTAS_OBSERVATORIO_SCENARIO_SHARING_2026-09-12.md`.

## 12. Providers e CSP

Providers iniciais adicionais:

```text
https://tile.openstreetmap.org
https://terrain.reearth.land
```

Eles entram onde necessário em `img-src`/`connect-src`.

Não foram adicionados a `script-src`.

`worker-src 'self' blob:` permanece adequado aos workers locais do Cesium.

## 13. Layer Manager e Render Governor

### Layer Manager

`ObservatoryLayerManager` suporta:

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

### Render Governor

`ObservatoryRenderGovernor`:

- conecta a `requestRender()`;
- agrupa pedidos de render;
- pode ficar ocioso;
- funciona em ambiente sem DOM durante testes;
- possui detach/destroy explícitos.

O Observatório não mantém 60 FPS contínuos quando a cena está parada.

## 14. Validação e CI

Workflow dedicado:

```text
.github/workflows/observatory-foundation.yml
```

Contratos dedicados:

```text
tests/account-access-entitlements.test.ts
tests/observatory-foundation.test.ts
tests/observatory-timeline.test.ts
tests/observatory-interface.test.ts
tests/observatory-scenario.test.ts
```

O workflow dedicado executa contratos, typecheck e build quando acionado no escopo previsto.

No PR #135, o workflow geral `Qualidade` atualmente é interrompido antes desses checks por um contrato de hierarquia Defesa Civil/SACE fora do escopo do Observatório. Portanto não declarar testes/typecheck/build do PR como aprovados com base nessa run abortada cedo e não corrigir hidrologia dentro do PR de cenário apenas para fabricar verde.

## 15. Contratos protegidos

A suíte do Observatório protege, entre outros:

- Free sem entitlement;
- PRO ativo;
- PRO suspenso fail-closed;
- bypass administrativo somente server-side;
- exigência de e-mail confirmado para admin;
- noindex completo;
- ausência em public routes;
- gate no servidor;
- headers privados;
- shell somente após autorização;
- Layer Manager e Render Governor;
- Cesium 1.145.0 e lazy import;
- assets locais;
- OSM;
- Re:Earth Terrain e fallback elipsoidal;
- raster e pontos no Cesium;
- três séries temporais canônicas;
- seleção temporal sem usar frame futuro quando existe observação anterior;
- player global;
- interface simplificada;
- round-trip de cenário;
- falha fechada do codec;
- câmera transportável;
- preservação do cenário através do login;
- espera pelo assentamento das fontes temporais antes de resolver o horário compartilhado.

## 16. Estado atual

- [x] entitlement `observatoryAccess`;
- [x] acesso administrativo server-only;
- [x] `/observatorio` privada e fora da descoberta pública;
- [x] gate server-side;
- [x] cache privado/no-store;
- [x] shell próprio;
- [x] Cesium 1.145.0;
- [x] lazy import;
- [x] assets locais;
- [x] viewer 3D;
- [x] base OpenStreetMap;
- [x] Re:Earth Terrain + fallback;
- [x] Layer Manager;
- [x] Render Governor;
- [x] radar;
- [x] satélite;
- [x] raios/STSC;
- [x] alertas;
- [x] hidrologia;
- [x] timeline global para radar/satélite/raios;
- [x] cenários compartilháveis V1;
- [x] câmera no cenário;
- [x] preservação através do login;
- [x] restauração temporal esperando todas as fontes ativas;
- [ ] validar contratos dirigidos + typecheck + build para o HEAD final do PR #135;
- [ ] smoke autenticado no domínio canônico;
- [ ] confirmar por análise de build que páginas públicas convencionais não recebem chunk Cesium no carregamento inicial.

## 17. Próxima fronteira

A próxima frente de produto é o **Comparador A/B**, em PR separado e sem duplicar `CesiumWidget`.

Primeira versão aprovada:

1. radar e satélite como raster comparável;
2. uma única câmera;
3. dois horários independentes A/B;
4. split nativo do Cesium;
5. cortina arrastável;
6. timeline editando somente o lado selecionado;
7. raios, alertas e hidrologia fora do split até existir contrato equivalente.

Depois do Swipe estabilizado, podem ser estudados modos `Opacity`, `Spy`, inspector meteorológico, gráficos por ponto, modelos e outras ferramentas PRO.
