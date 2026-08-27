# Tempo Pelotas — recuperação de runtime entre navegações

Data: 27/08/2026

## Problema observado

Usuários reportaram ocorrências recorrentes do boundary global `Não foi possível carregar esta página` e mensagens de conteúdo não encontrado durante a troca entre páginas públicas, inclusive em `/vento-em-pelotas`.

O padrão é compatível com incoerência de versão durante navegação SPA: uma aba pode permanecer aberta durante um novo deploy e continuar executando JavaScript da publicação anterior. Ao abrir uma rota ainda não visitada, esse runtime antigo pode solicitar um chunk ou uma server function que já não existe no deploy atual.

A investigação também identificou um risco concreto no service worker: a geração anterior de cache era removida integralmente quando um worker novo ativava. Para uma aplicação com chunks de rota carregados sob demanda, isso reduz a janela de compatibilidade de abas antigas justamente durante a troca de versão.

A página de Vento não foi tratada como causa isolada. A correção foi aplicada em três camadas: coerência de HTML/cache, recuperação global do runtime e degradação local das rotas com múltiplas consultas.

## 1. HTML e cache não podem misturar deploys

`src/server-brazil.ts` passou a identificar respostas de documento HTML fora dos embeds e aplicar:

- `Cache-Control: no-store, no-cache, max-age=0, must-revalidate`;
- `CDN-Cache-Control: no-store`;
- `Pragma: no-cache`;
- `Expires: 0`.

A regra é deliberadamente diferente da política dos assets com hash. O HTML SSR contém referências ao runtime da publicação corrente e não deve sobreviver no cache entre deploys. Já os arquivos em `/assets/` continuam podendo usar cache porque a URL versionada por hash identifica o próprio conteúdo.

O service worker também faz navegações de documento com `cache: "no-store"`. O navigation preload foi desativado nessa camada para não competir com a requisição fresca que existe justamente para recuperar coerência de versão.

Embeds preservam suas políticas próprias de cache e APIs sensíveis continuam com `private, no-store`.

## 2. Service worker com transição segura de geração

`public/sw.js` passou para a geração `tempo-pelotas-v9` e mudou o contrato de atualização:

- o worker novo usa `skipWaiting()` depois de instalar o shell atual;
- na ativação, assume os clientes com `clients.claim()`;
- quando detecta uma geração anterior do Tempo Pelotas, mantém a geração atual e uma geração anterior como janela curta de compatibilidade;
- somente caches com prefixo do próprio Tempo Pelotas entram na limpeza; caches de outros componentes do navegador não são removidos;
- abas abertas durante uma troca de geração são recarregadas uma vez para alinhar HTML, JavaScript e server functions;
- `/assets/` usa cache-first através das gerações preservadas, o que é seguro porque esses arquivos têm nome com hash;
- `/brand/`, que não possui a mesma garantia de hash, continua com revalidação de rede;
- se uma aba antiga solicitar um asset versionado que não está em cache e o host responder `404` ou `410`, o worker força uma navegação fresca do próprio cliente;
- existe trava em memória por `clientId` para o worker não provocar repetidas navegações de recuperação na mesma execução.

Essa política atende dois cenários diferentes: uma atualização explícita do service worker e um deploy futuro em que uma aba antiga encontre um chunk removido mesmo sem mudança adicional no arquivo do worker.

## 3. Recuperação global de navegação no React/TanStack

`src/lib/stale-client-recovery.ts` distingue:

- erro de asset/chunk/preload;
- erro transitório de navegação ou server function.

Além dos padrões de bundle, a recuperação reconhece falhas de `fetch`, rede, server function e respostas transitórias como 404, 408, 410, 425, 429, 500, 502, 503 e 504.

A recuperação genérica só é habilitada depois que o runtime cliente hidratou com sucesso. Dessa forma, um erro determinístico no carregamento inicial não dispara recargas em ciclo.

Quando uma falha transitória alcança o boundary durante uma navegação:

1. o erro continua sendo reportado à telemetria disponível;
2. o navegador registra em `sessionStorage` a URL e o instante da tentativa;
3. é feita uma única recarga completa da própria URL;
4. HTML e runtime passam a pertencer à mesma versão publicada;
5. nova tentativa automática na mesma URL fica bloqueada por 60 segundos.

Se o navegador estiver offline, a recuperação genérica não força reload. O listener `vite:preloadError` permanece ativo para falhas de preload detectadas antes do boundary.

## 4. Vento e Chuva não dependem mais de sucesso conjunto

Antes desta correção, `/vento-em-pelotas` e `/chuva-em-pelotas` combinavam:

- `getWeatherIntelligence()`;
- `getPelotasMeteogram()`;

em `Promise.all`.

Mesmo com fallbacks server-side, uma falha no transporte da própria server function podia rejeitar a Promise no navegador e derrubar toda a rota.

`src/lib/weather/public-weather-page-loader.ts` usa `Promise.allSettled` e trata cada domínio separadamente:

- se a inteligência meteorológica não chegar, usa `createUnavailableWeatherIntelligence()`;
- se o meteograma não chegar, entrega `MeteogramData` com `status: unavailable` e série vazia;
- nenhuma falha é convertida em valor zero, observação falsa ou previsão fictícia;
- componentes dependentes do detalhamento ausente deixam de renderizar apenas aquela camada;
- o restante da página continua navegável.

## 5. Contratos automatizados

`tests/public-route-resilience.test.ts` protege a recuperação do runtime e os loaders resilientes de Vento/Chuva.

`tests/service-worker-static-cache.test.ts` protege agora:

- geração v9;
- `skipWaiting()`;
- preservação de uma geração anterior;
- limpeza restrita aos caches do Tempo Pelotas;
- cache-first de assets com hash entre gerações;
- recuperação de chunk ausente em 404/410;
- navegação de documento com `cache: no-store`;
- recarga de clientes antigos após upgrade;
- headers `no-store` do HTML SSR;
- coalescência de requests simultâneos.

`tests/pwa-app-refinement.test.ts` foi alinhado ao novo contrato de produção e não espera mais uma geração antiga do service worker.

O workflow `Qualidade` executa explicitamente `tests/public-route-resilience.test.ts` e `tests/service-worker-static-cache.test.ts`. A execução do runner continua sendo tratada separadamente da existência dos contratos.

## 6. Validação pós-deploy

Após publicação, validar em sessão normal, janela anônima e uma aba mantida aberta durante uma publicação:

1. abrir Home e manter a aba aberta;
2. publicar uma nova versão de teste sem alterar a URL das páginas;
3. navegar para uma rota ainda não visitada pela aba antiga;
4. confirmar que a aba é atualizada ou recuperada sem exibir `conteúdo não encontrado`;
5. navegar repetidamente entre Home, Hoje, Chuva, Vento, 7 dias, Radar e Águas;
6. confirmar ausência de ciclos de reload;
7. confirmar que documentos HTML respondem com política `no-store` no ambiente publicado;
8. confirmar que assets com hash continuam cacheáveis;
9. validar offline: a tela informativa continua disponível e não é apresentada como dado meteorológico atual;
10. repetir em desktop e mobile.

## 7. Limites

A solução não mascara um bug determinístico recorrente e não converte indisponibilidade em dado normal. Ela também não depende de cache para fornecer previsão, observação, alertas ou níveis das águas.

Uma aba que já estava aberta antes da primeira publicação desta correção ainda pode executar o JavaScript e o service worker antigos até o navegador verificar a nova versão. Uma recarga manual dessa aba acelera a migração inicial. Depois que a geração v9 assumir, o próprio worker e o runtime passam a tratar as próximas transições de deploy automaticamente.
