# Gate de publicação das cidades regionais

Última atualização: 23/08/2026

## Objetivo

Permitir que a cobertura regional do Tempo Pelotas seja ampliada em ondas sem transformar automaticamente todo novo cadastro de município em página pública indexável.

O inventário atual permanece com exatamente 24 cidades aprovadas: Pelotas usa a Home e as outras 23 possuem página `/tempo-em/{slug}`. Nenhuma cidade foi adicionada nesta implementação.

## Estágios

Cada `RegionalCity` pode declarar opcionalmente `coverage` e `indexable`.

### `draft`

Cadastro preparatório.

- não participa da Central Regional;
- não participa da consulta meteorológica em lote;
- não responde pela rota municipal pública;
- não responde pelo server function meteorológico regional;
- não entra em sitemap/indexação.

### `basic`

Cobertura pública inicial, ainda não liberada para indexação.

- pode participar da Central Regional;
- pode ter página pública;
- recebe `noindex, follow`;
- não entra em `PUBLIC_ROUTES`/sitemap.

### `complete`

Cobertura editorial/técnica pronta para indexação.

- participa da Central Regional;
- possui rota pública;
- é elegível ao sitemap;
- pode ser explicitamente retirada da indexação com `indexable: false`.

Para preservar compatibilidade com o inventário já publicado, uma cidade sem `coverage` explícito é tratada como `complete` e, salvo `indexable: false`, como indexável.

## Listas derivadas

`src/lib/regional-cities.ts` mantém duas superfícies distintas:

- `PUBLIC_REGIONAL_CITIES`: cidades cuja cobertura não é `draft`;
- `INDEXABLE_REGIONAL_CITIES`: cidades públicas, `complete` e não marcadas com `indexable: false`.

A Central Regional e agrupamentos/navegação geográfica trabalham com a lista pública. Sitemap e inventário SEO trabalham somente com a lista indexável.

## Defesa em profundidade

A ausência de uma cidade `draft` no sitemap não é considerada controle suficiente.

A rota dinâmica `/tempo-em/$citySlug` valida o cadastro público antes do loader. O server function `getRegionalCityWeather` repete a verificação e retorna estado não cacheável/não indexável para slugs que não pertencem à superfície pública.

Isso evita que um município em preparação seja publicado por conhecimento direto do slug ou por chamada do server function.

## SEO

`createPageHead()` aceita `indexable?: boolean`.

- comportamento padrão: `index, follow`;
- `indexable: false`: `noindex, follow`.

A rota municipal deriva esse valor de `isRegionalCityIndexable(city)`. Assim uma cidade `basic` pode ser usada para validação pública antes de ser promovida ao sitemap.

## Contratos automatizados

`tests/regional-city-publication-gate.test.ts` protege:

- as 24 cidades atuais como públicas/completas/indexáveis;
- comportamento de `draft`, `basic` e `complete`;
- exclusão de draft da Central Regional;
- exclusão de não indexáveis do sitemap;
- bloqueio de draft na rota e no server function;
- `noindex` para cobertura pública ainda não completa.

Os contratos existentes da Central Regional e de SEO também usam, respectivamente, `PUBLIC_REGIONAL_CITIES` e `INDEXABLE_REGIONAL_CITIES`.

## Regra para expansão

Adicionar uma cidade ao cadastro não significa publicá-la.

A promoção recomendada é:

`draft -> basic -> complete`

Uma cidade só deve chegar a `complete` depois de coordenadas, código IBGE, previsão, avisos aplicáveis, contexto editorial, visual/mobile e SEO terem sido validados.

A decisão de produto vigente permanece: não ampliar o inventário além das 24 cidades atuais antes da validação em produção da Central Regional/mapa e dos gates operacionais já definidos.
