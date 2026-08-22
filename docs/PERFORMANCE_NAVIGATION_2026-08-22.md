# Performance de navegação — baseline e intervenção de 22/08/2026

## Escopo

Este documento registra a análise sanitizada de performance feita em 22/08/2026 e a intervenção aplicada à navegação e à Home do Tempo Pelotas.

O HAR usado na análise é material operacional temporário e **não deve ser versionado**. Apenas métricas agregadas e conclusões técnicas entram no repositório.

## Baseline observado

Na captura analisada, com cache do navegador deliberadamente desabilitado pela ferramenta de desenvolvimento:

- documento HTML inicial da Home: aproximadamente **2,94 s**;
- tempo aguardando a resposta inicial do servidor: aproximadamente **2,92 s**;
- `DOMContentLoaded`: aproximadamente **3,45 s**;
- evento `load`: aproximadamente **3,53 s**;
- chunk JavaScript observado em uma navegação para `/tempo-hoje-pelotas`: aproximadamente **295 ms**;
- CSS correspondente da rota: aproximadamente **302 ms**.

A leitura técnica do baseline é que a troca de rota cliente já estava razoável, enquanto o principal gargalo observado estava no tempo de resposta do HTML inicial.

Os assets versionados usam cache de longa duração; por isso a captura com `no-cache` não representa a melhor condição de uma visita recorrente.

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

Foram acrescentados:

- `tests/route-loading-overlay.test.ts`;
- `tests/home-deferred-hydrology.test.ts`.

O workflow `Qualidade` executa ambos explicitamente, além dos contratos, build, rotas, TypeScript e lint já existentes. O contrato da hidrologia diferida também protege a separação de erro local, impedindo que uma rejeição secundária volte a derrubar a Home inteira.

## Critério de validação pós-deploy

Depois que o novo HEAD estiver publicado, repetir uma captura equivalente e comparar:

1. TTFB/documento inicial da Home;
2. `DOMContentLoaded` e `load`;
3. comportamento da navegação interna com e sem cache;
4. ausência de flash do overlay em transições rápidas;
5. aparecimento do overlay somente em transições foreground realmente demoradas;
6. resolução progressiva da seção de águas sem layout quebrado;
7. falha hidrológica eventual preservando a Home meteorológica;
8. ausência de regressão de scroll, foco, acessibilidade ou navegação mobile.

Não considerar a melhoria de TTFB confirmada apenas pela alteração de arquitetura. A conclusão depende da medição do runtime publicado.

## Próxima investigação se o TTFB continuar alto

Se o documento inicial continuar significativamente lento depois desta separação, o gargalo restante está no caminho meteorológico crítico ou no runtime que o serve.

A próxima decomposição deve partir de:

`getWeatherIntelligence()` → `fetchWeatherIntelligence()` → `fetchAggregatedPelotasWeather()` e snapshot Weather AI.

Medir individualmente, sem alterar semântica ou proveniência:

- baseline Open-Meteo / MET Norway;
- Embrapa;
- INMET;
- CPPMet/UFPel;
- leitura do snapshot Weather AI;
- tempos de cache hit/miss e timeouts de cada fonte.

Priorizar cache/snapshot e stale-while-revalidate para evitar que uma dependência externa lenta segure cada resposta SSR. Só retirar outro dado do caminho crítico se a medição demonstrar necessidade e o conteúdo continuar semanticamente correto.
