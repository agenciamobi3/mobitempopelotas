# Renovação visual da previsão de 15 dias — 08/09/2026

## Objetivo

Levar `/previsao-15-dias-pelotas` para a mesma linguagem editorial adotada nas páginas de amanhã, 7 dias e na central pública de dados, preservando a previsão estendida, SEO, estados parciais e ausência de valores.

## Hero

O hero deixou de reutilizar a estrutura `TodayRetailHero`.

Foram removidos:

- fotografia meteorológica;
- crédito de foto;
- painel `current`;
- tiles auxiliares;
- CTAs dentro do hero;
- dependência de `TodayRetailHero.css`, `TodayRetailHeroPhoto.css` e `today-retail-hero-backgrounds`.

A superfície atual usa fundo editorial claro em largura total e conteúdo no mesmo rail de 1440 px da Home, com 1180 px no breakpoint compacto e gutter móvel de 20 px.

O conteúdo mostra somente informação concreta da janela disponível:

- quantidade de dias recebidos;
- data final da janela;
- faixa de temperatura;
- maior volume de chuva previsto;
- rajada mais forte informada;
- modelo e horário de atualização.

## Corpo

Os três capítulos principais deixaram de ser grandes cards brancos independentes. `FifteenDayForecastEditorialRefinement.css` abre as superfícies e usa divisórias entre os capítulos.

Cards continuam nos dias individuais porque ali a comparação diária justifica o formato.

A seção de temperaturas continua como lista gráfica aberta e o bloco de chuva/rajadas mantém duas colunas com divisor central no desktop e empilha no mobile.

## Semântica dos dias

Os rótulos derivados `Acompanhar` e `Mais chuva/vento` foram removidos. Eles eram inferências locais a partir de thresholds internos e poderiam parecer uma classificação de risco.

Os únicos rótulos especiais preservados são `Hoje` e `Amanhã`. Chuva, volume e rajadas aparecem pelos valores efetivamente recebidos da previsão.

## Rail

`InternalWeatherPageShell.css` não controla mais `.fifteen-day-retail-hero__inner`. O rail do hero pertence exclusivamente a `FifteenDayForecastHero.css`, evitando o mesmo conflito de largura que já havia sido corrigido em amanhã e 7 dias.

## Arquivos

- `src/components/weather/FifteenDayForecastHero.tsx`
- `src/components/weather/FifteenDayForecastHero.css`
- `src/components/weather/FifteenDayForecastPage.tsx`
- `src/components/weather/FifteenDayForecastEditorialRefinement.css`
- `src/routes/previsao-15-dias-pelotas.tsx`
- `src/components/layout/InternalWeatherPageShell.css`
- `tests/fifteen-day-forecast.test.ts`

## Validação

O contrato automatizado protege:

- ausência da estrutura `TodayRetailHero` no hero de 15 dias;
- rail próprio da página;
- ausência de foto, tiles e CTAs retail;
- manutenção dos grids de 7 + 8 dias;
- capítulos principais abertos;
- ausência dos rótulos heurísticos de risco;
- estados parciais e valores ausentes preservados.

Validação visual em preview/domínio continua sendo uma etapa separada de versionamento, sincronização e CI.
