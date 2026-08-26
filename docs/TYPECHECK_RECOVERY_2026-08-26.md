# Recuperação do typecheck — 26/08/2026

Status: **correções de código aplicadas; validação executável pendente por falha do runner antes dos steps**

Este registro delimita a rodada de recuperação de TypeScript/build antes da próxima frente SEO.

## Escopo corrigido

### Navegação tipada da conta

A rota `/conta` possui `validateSearch` e, por isso, os links/redirects tipados precisam fornecer o objeto `search` esperado pelo TanStack Router.

Foram ajustados:

- `src/routes/privacidade-e-dados.tsx`;
- `src/components/auth/AccountDashboard.tsx`;
- `src/routes/painel.tsx`;
- contrato correspondente em `tests/account-friendly-route.test.ts`.

Os destinos públicos variáveis do `AccountDashboard` também deixaram de ser `string` genérica e passaram a usar união explícita de rotas válidas.

### Fonte tipada do footer

`ContentPageShell`, `DataExperiencePageShell` e `ObservationDataPageShell` não passam mais a string `"Tempo Pelotas"` para uma prop que espera `WeatherData["source"]`.

Foi criado `src/components/layout/footer-source.ts`, com `PORTAL_FOOTER_SOURCE` validado por `satisfies WeatherData["source"]`, e os três shells reutilizam esse objeto.

### MapLibre

Em `src/components/regional/RegionalCitiesMap.tsx`, `attributionControl: true` foi substituído por um objeto de opções compatível com o contrato atual do MapLibre (`attributionControl: {}`). A atribuição continua habilitada.

### Readiness regional

`evaluateRegionalCandidateReadiness()` retorna um objeto de avaliação que contém o estado consolidado em `readiness`.

`src/lib/regional-candidate-promotion.ts` passou a consultar:

`readinessEvaluation.readiness.hydrologyEvidenceValidated`

em vez de procurar `hydrologyEvidenceValidated` no nível superior. Não foi duplicada propriedade no tipo apenas para esconder o erro do consumidor.

### Navegação editorial tipada

`src/production/components/home-editorial-header.tsx` recebeu tipos explícitos para:

- links estáticos;
- links regionais dinâmicos;
- `params.citySlug`;
- caminho materializado usado para estado ativo;
- type guard `isRegionalMenuLink()`.

Isso remove a dependência de narrowing por `"params" in item`, que deixava combinações heterogêneas do megamenu chegarem a `unknown`/rotas com parâmetros obrigatórios sem contrato suficientemente estreito.

`src/components/weather/HomeExplorePortal.tsx` também deixou de propagar destinos como `string` e passou a usar a união editorial de rotas internas.

### Conteúdo editorial e links relacionados

`src/components/content/EditorialContentSection.tsx` mantém a estrutura de `EditorialContentDefinition` e `EditorialRelatedLink`, mas amplia no boundary de renderização somente o conjunto conhecido de páginas editoriais estáticas que já existem no route tree e não exigem `params` ou `search`.

Isso cobre, entre outras, a ligação da situação hidrológica para `/enchente-2024-pelotas-laranjal` sem abrir a prop para `string`, rotas de API ou rotas dinâmicas.

## Regras preservadas

- nenhum `any` foi adicionado para esconder erro de TypeScript;
- nenhum cast genérico foi usado para contornar o TanStack Router;
- `src/routeTree.gen.ts` não foi editado manualmente;
- nenhuma rota pública, fonte de dados ou funcionalidade nova foi criada nesta rodada;
- a semântica das páginas e dos dados foi preservada.

## Validação disponível

O workflow `Qualidade` deveria executar checkout, instalação, contratos, build, rotas, `npm run typecheck` e lint. O workflow versionado continua contendo essas etapas normalmente.

Nas execuções observadas desta rodada, porém, o job encerrou como falha antes de iniciar qualquer step: a API do GitHub retorna `steps: []`. O mesmo comportamento já havia ocorrido em commits anteriores, inclusive em mudança somente documental.

Consequência: **a falha atual do GitHub Actions não pode ser usada nem como prova de regressão nem como prova de que o typecheck passou**.

Até o runner voltar a executar, a validação possível nesta rodada é estrutural/estática sobre os contratos e os arquivos corrigidos. A próxima frente de produto deve permanecer separada desta pendência de infraestrutura, e o primeiro build executável disponível deve rodar, no mínimo:

```text
npm run routes:check
npm run test:contracts
npm run build
npm run typecheck
```
