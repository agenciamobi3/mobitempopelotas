# Tempo Pelotas — recuperação de runtime entre navegações

Data: 27/08/2026

## Problema observado

Usuários reportaram ocorrências recorrentes do boundary global durante a troca entre páginas públicas. Em 27/08/2026 houve novo registro em `/tempo-na-regiao-sul-rs`, com a tela `Não foi possível carregar esta página` aparecendo mesmo depois da primeira rodada de mitigação.

O padrão continua compatível com incoerência de versão em abas mantidas abertas durante deploys: o documento pode permanecer com JavaScript da publicação anterior e uma navegação SPA posterior pode solicitar route chunks, preloads ou server functions que pertencem a outro deploy.

A primeira rodada melhorou a política de HTML/cache e a recuperação de chunks, mas o novo caso mostrou que apenas tornar o service worker mais tolerante não era suficiente. A decisão operacional passou a ser mais conservadora: **no portal público, robustez de navegação tem prioridade sobre manter SPA/PWA no caminho crítico**.

## 1. HTML público continua sem cache entre deploys

`src/server-brazil.ts` mantém para documentos HTML públicos fora de embeds:

- `Cache-Control: no-store, no-cache, max-age=0, must-revalidate`;
- `CDN-Cache-Control: no-store`;
- `Pragma: no-cache`;
- `Expires: 0`.

O HTML SSR referencia o runtime da publicação corrente e não deve sobreviver no cache entre deploys. Assets versionados por hash continuam semanticamente diferentes de HTML e podem ser cacheáveis pelo host/navegador conforme sua própria política.

APIs sensíveis e embeds continuam com contratos próprios.

## 2. Navegação pública passa a usar documento completo

Foi criado `src/components/navigation/PublicDocumentNavigationGuard.tsx` e montado no root.

Depois da hidratação, o guard captura cliques em links internos públicos same-origin antes da navegação do TanStack Router e realiza `window.location.assign()` para o destino. Assim, cada troca de página pública recebe um novo documento HTML e o runtime da versão publicada atual, em vez de depender de route chunks mantidos em memória por uma aba antiga.

O guard preserva:

- links externos;
- downloads;
- targets diferentes de `_self`;
- clique com Ctrl/Cmd/Shift/Alt ou botão diferente do principal;
- navegação somente por hash dentro do mesmo documento;
- áreas autenticadas/operacionais (`/conta`, `/painel`, `/auth`, `/login`, `/admin`) como SPA;
- opt-out explícito por `data-spa-navigation="true"` quando necessário.

A mudança não altera URLs, canonicals, conteúdo, fontes meteorológicas ou contratos de dados.

## 3. Service worker temporariamente aposentado do portal público

`PwaManager` não registra mais `/sw.js`.

Na hidratação ele executa somente uma limpeza controlada e idempotente:

- consulta registrations existentes;
- desregistra apenas workers do mesmo origin cujo script seja `/sw.js` do Tempo Pelotas;
- remove somente caches cujo nome começa com `tempo-pelotas-`;
- usa `Promise.allSettled` para que falha de cleanup nunca derrube a aplicação;
- não força reload apenas por realizar a limpeza.

O arquivo `public/sw.js` permanece versionado como artefato dormente para permitir reavaliação futura, mas não pertence mais ao runtime ativo do portal.

O manifest, metadados móveis e `PwaAppExperience` permanecem disponíveis. A experiência de conectividade continua funcionando mesmo quando `getRegistration("/")` não retorna worker.

A decisão é temporária e deliberada: a instalação/offline via service worker só deve voltar ao caminho crítico depois que a navegação pública estiver estável em produção por uma janela suficiente e houver um modelo de atualização que não reintroduza incompatibilidade de versão.

## 4. Recuperação global usa documento realmente fresco

`src/lib/stale-client-recovery.ts` mantém o listener `vite:preloadError` e a classificação de falhas de asset, rede e server function, mas a recuperação foi endurecida.

Em vez de `location.reload()`, a tentativa automática usa navegação de documento com `location.replace()` e o parâmetro interno `__tp_recover=<timestamp>`.

Regras:

1. a URL lógica usada para a trava ignora `__tp_recover`;
2. existe no máximo uma tentativa automática por URL lógica em uma janela de 60 segundos;
3. erro de chunk/preload usa razão `asset`;
4. falha transitória reconhecida usa razão `navigation`;
5. qualquer outro erro que alcance o boundary depois de uma hidratação bem-sucedida recebe uma única tentativa controlada com razão `runtime`;
6. o navegador offline nunca é forçado a navegar;
7. depois que o novo runtime hidrata, `markClientRuntimeReady()` remove `__tp_recover` com `history.replaceState`, sem nova navegação.

Essa estratégia também contorna cache HTTP intermediário que ignore uma recarga comum, porque a requisição de recuperação possui URL distinta apenas durante o bootstrap.

## 5. O boundary global deixou de ser uma tela fatal

`src/routes/__root.tsx` continua reportando o erro para a telemetria e chama `recoverClientNavigationFailure(error)`.

Porém o usuário não recebe mais as mensagens:

- `Erro inesperado`;
- `Não foi possível carregar esta página`.

O fallback agora é neutro e orientado a recuperação: `Carregando a versão mais recente do Tempo Pelotas`.

Se a tentativa automática estiver bloqueada pela trava de loop, se o navegador estiver offline ou se um erro determinístico persistir, a pessoa continua com navegação útil por âncoras nativas para:

- Tempo agora;
- Tempo hoje;
- 7 dias;
- Chuva;
- Radar;
- Situação das águas;
- Região Sul do RS.

Esses atalhos fazem carregamento de documento completo e não dependem do router cliente quebrado.

## 6. O mapa regional não pode derrubar a Central Regional

`src/components/regional/RegionalCitiesMapDeferred.tsx` perdeu o `import("./RegionalCitiesMap")` assíncrono, removendo um route-adjacent chunk adicional dessa página.

`RegionalCitiesMap` passa a ser importado estaticamente, enquanto a renderização continua postergada pelo `IntersectionObserver`. O próprio `maplibre-gl` continua sendo carregado dinamicamente dentro do componente de mapa, onde já existe `try/catch`.

Além disso, foi adicionado um `RegionalMapErrorBoundary` local. Qualquer erro do subtree do mapa passa a renderizar apenas o fallback do mapa com a mensagem de que a lista de cidades continua disponível. A lista, busca, filtros e links municipais não são promovidos ao boundary global por uma falha do mapa.

## 7. Vento e Chuva continuam degradando consultas secundárias

`src/lib/weather/public-weather-page-loader.ts` continua usando `Promise.allSettled` para separar `getWeatherIntelligence()` e `getPelotasMeteogram()`.

Falha de uma consulta entrega o contrato `unavailable` correspondente sem inventar valor e sem derrubar a rota inteira.

## 8. Contratos automatizados

`tests/public-route-resilience.test.ts` passou a proteger:

- `__tp_recover` + `location.replace()`;
- remoção do parâmetro depois da hidratação;
- trava de 60 segundos por URL lógica;
- tentativa única também para erro genérico de runtime hidratado;
- navegação pública por documento completo;
- preservação das áreas autenticadas como SPA;
- ausência da antiga mensagem fatal no root;
- fallback global com anchors nativas;
- import estático do mapa regional;
- boundary local do mapa;
- loaders resilientes de Vento/Chuva.

`tests/pwa-app-refinement.test.ts` passou a proteger:

- ausência de novo `serviceWorker.register()`;
- cleanup de registrations do `/sw.js` do próprio origin;
- cleanup restrito aos caches `tempo-pelotas-*`;
- ausência de reload causado somente pela limpeza;
- permanência do manifest e da camada de conectividade.

`tests/service-worker-static-cache.test.ts` ainda documenta o contrato do arquivo v9 preservado no repositório, embora o worker esteja dormente no runtime atual.

Os contratos estão versionados. A aprovação executável continua dependente de runner funcional; não se deve declarar a suíte verde enquanto o GitHub Actions não executar os steps normalmente.

## 9. Validação pós-deploy

Após publicação desta segunda rodada:

1. abrir Home em sessão normal;
2. navegar repetidamente pelos menus públicos entre Agora, Hoje, Amanhã, 7/15 dias, Chuva, Vento, Radar, Águas e Região;
3. confirmar no DevTools que os cliques públicos geram requisições de documento, não somente navegação SPA;
4. confirmar que não há registration ativo de `/sw.js` depois da hidratação da nova versão;
5. confirmar que caches `tempo-pelotas-*` antigos são removidos;
6. manter uma aba aberta durante um deploy e depois navegar para uma rota ainda não visitada;
7. confirmar que a troca recebe HTML/runtime atual e não exibe a antiga tela fatal;
8. validar `/tempo-na-regiao-sul-rs` com mapa normal, mapa indisponível e falha simulada do subtree do mapa;
9. repetir em desktop, mobile e janela anônima;
10. observar telemetria para distinguir falhas residuais determinísticas de problemas de versão já eliminados do fluxo público.

## 10. Limites e decisão operacional

Nenhum sistema web pode prometer ausência absoluta de falhas. O objetivo desta rodada é retirar do caminho crítico público as duas fontes de fragilidade mais compatíveis com os relatos: navegação SPA entre deploys e service worker controlando versões do portal.

Depois que esta versão chegar ao navegador, os menus públicos deixam de depender do runtime antigo para trocar de página, e o service worker deixa de controlar novas sessões. Um usuário que ainda esteja com uma aba aberta anterior à publicação pode precisar de uma última recarga/navegação de documento para receber o hardening; a partir daí a navegação pública passa pelo novo contrato.

Critério para reintroduzir SPA agressiva ou service worker: evidência de estabilidade em produção, testes de aba antiga durante deploy e ausência de regressão de versão. Até lá, **robustez > SPA/PWA**.
