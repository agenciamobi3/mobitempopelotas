# Performance de navegação — baseline e intervenção de 22/08/2026

## Escopo

Este documento registra a análise sanitizada de performance feita em 22/08/2026 e as intervenções aplicadas à navegação e à Home do Tempo Pelotas.

Os HARs usados na análise são material operacional temporário e **não devem ser versionados**. Apenas métricas agregadas e conclusões técnicas entram no repositório.

## Baseline observado

Na primeira captura analisada, com cache do navegador deliberadamente desabilitado pela ferramenta de desenvolvimento:

- documento HTML inicial da Home: aproximadamente **2,94 s**;
- tempo aguardando a resposta inicial do servidor: aproximadamente **2,92 s**;
- `DOMContentLoaded`: aproximadamente **3,45 s**;
- evento `load`: aproximadamente **3,53 s**;
- chunk JavaScript observado em uma navegação para `/tempo-hoje-pelotas`: aproximadamente **295 ms**;
- CSS correspondente da rota: aproximadamente **302 ms**.

A leitura técnica do baseline é que a troca de rota cliente já estava razoável, enquanto o principal gargalo observado estava no tempo de resposta do HTML inicial.

Os assets versionados usam cache de longa duração; por isso a captura com `no-cache` não representa a melhor condição de uma visita recorrente.

## Primeira validação pós-deploy

Uma segunda captura equivalente foi feita depois de retirar a hidrologia do caminho crítico da Home.

Resultados observados:

- documento HTML inicial: **2,46 s**;
- espera da resposta inicial do servidor: **2,42 s**;
- `DOMContentLoaded`: **3,66 s**;
- evento `load`: **3,84 s**;
- chunk JavaScript de `/tempo-hoje-pelotas`: aproximadamente **491 ms**;
- CSS correspondente: aproximadamente **486 ms**.

Comparação com o baseline:

- HTML inicial: melhora de aproximadamente **476 ms / 16,2%**;
- espera do servidor: melhora de aproximadamente **498 ms / 17,1%**;
- `DOMContentLoaded`: piora de aproximadamente **211 ms / 6,1%**;
- `load`: piora de aproximadamente **305 ms / 8,6%**.

A melhora do caminho crítico é consistente com a mudança arquitetural, mas uma única captura não prova causalidade isolada porque as fontes externas e o runtime podem oscilar entre requests. A intervenção permanece válida porque remove uma dependência secundária da resposta crítica sem eliminar dados.

Os tempos maiores dos chunks de rota também foram medidos com cache HTTP desabilitado; não devem ser interpretados isoladamente como regressão de navegação recorrente, pois esses arquivos respondem com `public, max-age=31536000, immutable`.

### Ruído adicional identificado no HAR

A segunda captura revelou um problema separado da meteorologia:

- o mesmo `/brand/tempo-pelotas-purple.svg` apareceu quatro vezes no HTML inicial: preload, header, footer e overlay de navegação;
- o HAR registrou quatro transferências do mesmo SVG na janela inicial;
- três dessas transferências foram iniciadas por `staleWhileRevalidate()` no `sw.js` e uma pelo parser da página;
- as revalidações ficaram na faixa de aproximadamente **0,57–0,64 s** de espera;
- o SVG não apresentou `Cache-Control` na resposta observada, enquanto chunks versionados usam cache imutável de um ano.

O service worker mantinha uma nova `fetch(request)` para cada ocorrência concorrente do mesmo asset. Em cache frio ou com revalidação forçada isso pode gerar um pequeno efeito de *cache stampede*.

Correções aplicadas após essa captura:

1. o conteúdo do overlay, inclusive o logo, só é montado quando o overlay realmente fica visível;
2. `sw.js` passou para a geração de cache `tempo-pelotas-v8`;
3. o logo oficial foi incluído no app shell opcional do service worker;
4. revalidações simultâneas do mesmo URL estático são coalescidas em uma única requisição de rede em voo;
5. consumidores concorrentes de cache miss recebem clones da mesma resposta, evitando reutilização insegura do mesmo body;
6. contratos automatizados passaram a proteger esse comportamento.

O header de cache específico do SVG ainda depende da política do hosting. Não alterar a fonte oficial da marca nem criar cópia divergente apenas para contornar esse header; primeiro validar o comportamento após a coalescência do service worker.

## Overlay global de navegação

Foi criado `src/components/navigation/RouteLoadingOverlay.tsx`, montado uma única vez no shell raiz.

Contrato atual:

- usa `routerState.isLoading`, restrito ao carregamento foreground do TanStack Router;
- não transforma refresh silencioso de dados em tela de carregamento;
- não é exibido no carregamento/hidratação inicial;
- aguarda **190 ms** antes de aparecer;
- navegações concluídas antes desse limiar não exibem overlay;
- quando exibido, permanece visível por no mínimo **280 ms** para evitar flash visual;
- usa o logo oficial `/brand/tempo-pelotas-purple.svg` e o texto `Carregando...`;
- o subtree visual não é montado enquanto o overlay está invisível, evitando request inicial desnecessário do logo;
- bloqueia interação apenas enquanto efetivamente visível;
- respeita `prefers-reduced-motion` e `forced-colors`;
- o preload global existente (`intent`, atraso zero) foi preservado.

O overlay é acabamento de UX. Ele não é tratado como correção de performance real e não deve ser usado para mascarar regressões de TTFB.

## Home: retirada da hidrologia do caminho crítico

Antes desta rodada, o loader da Home aguardava em um único `Promise.all`:

- inteligência meteorológica;
- nível do Laranjal;
- observação do Guaíba;
- rede regional da Lagoa dos Patos.

Isso fazia o HTML depender da conclusão da mais lenta entre essas quatro cadeias.

A Home continua iniciando meteorologia e hidrologia em paralelo, porém apenas `getWeatherIntelligence()` permanece no caminho crítico da primeira renderização. Laranjal, Guaíba e rede da Lagoa são mantidos em uma promessa diferida e resolvidos na seção de águas com `Suspense` + `Await`.

Enquanto a hidrologia ainda não resolveu, a seção mostra um estado acessível `Atualizando níveis e medições...`. Nenhum dado hidrológico é inventado e nenhuma fonte foi removida.

Uma rejeição inesperada da cadeia hidrológica é convertida em estado local `unavailable`. Nesse caso, a Home meteorológica permanece renderizada e somente o bloco de águas informa indisponibilidade temporária, com link para `/situacao-hidrologica-pelotas`. A falha de uma fonte secundária não deve promover toda a Home ao error boundary global.

Essa decisão segue a hierarquia atual da Home: meteorologia principal, previsão, radar e observação aparecem antes do bloco hidrológico. Portanto, uma oscilação de fonte secundária não deve segurar a primeira entrega do conteúdo meteorológico principal.

## Contratos e CI

Foram acrescentados ou ampliados:

- `tests/route-loading-overlay.test.ts`;
- `tests/home-deferred-hydrology.test.ts`;
- `tests/service-worker-static-cache.test.ts`.

O workflow `Qualidade` executa os contratos específicos explicitamente, além dos contratos rápidos, build, rotas, TypeScript e lint já existentes. O contrato da hidrologia diferida protege a separação de erro local; o contrato do service worker protege o app shell da marca e a coalescência de revalidação.

## Próxima validação pós-deploy

Depois que o novo HEAD estiver publicado, repetir uma captura equivalente e comparar:

1. TTFB/documento inicial da Home;
2. `DOMContentLoaded` e `load`;
3. quantidade de requests para `/brand/tempo-pelotas-purple.svg`;
4. iniciadores desses requests, verificando se desaparece o padrão de três revalidações paralelas do `sw.js`;
5. comportamento da navegação interna com e sem cache;
6. ausência de flash do overlay em transições rápidas;
7. aparecimento do overlay somente em transições foreground realmente demoradas;
8. resolução progressiva da seção de águas sem layout quebrado;
9. falha hidrológica eventual preservando a Home meteorológica;
10. ausência de regressão de scroll, foco, acessibilidade ou navegação mobile.

## Próxima investigação se o TTFB continuar alto

O HTML ainda levou aproximadamente **2,46 s** na segunda captura. Portanto, depois de validar a rodada de assets, o gargalo restante deve ser decomposto no caminho meteorológico crítico ou no runtime que o serve.

A próxima decomposição deve partir de:

`getWeatherIntelligence()` → `fetchWeatherIntelligence()` → `fetchAggregatedPelotasWeather()` e snapshot Weather AI.

Medir individualmente, sem alterar semântica ou proveniência:

- baseline Open-Meteo / MET Norway;
- Embrapa;
- INMET;
- CPPMet/UFPel;
- leitura do snapshot Weather AI;
- tempos de cache hit/miss e timeouts de cada fonte.

Priorizar cache/snapshot e stale-while-revalidate para evitar que uma dependência externa lenta segure cada resposta SSR. Só retirar outro dado do caminho crítico se múltiplas medições demonstrarem necessidade e o conteúdo continuar semanticamente correto.
