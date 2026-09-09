# Embrapa — restauração isolada da página interna

Data: 09/09/2026  
Rota: `/estacao-embrapa-pelotas`  
Fonte: `https://agromet.cpact.embrapa.br/online/Current_Monitor.htm`

## Decisão

A página interna da Estação Meteorológica da Embrapa Clima Temperado voltou a existir como superfície própria do Tempo Pelotas.

A restauração **não reativa a integração operacional antiga**. Scheduler, collector, lease e configuração histórica no Supabase permanecem aposentados.

Em 09/09/2026, o mesmo reader server-side de leitura direta passou também a alimentar o módulo `embrapa` do seletor observacional do **Agora/Hero**. Isso é uma arquitetura nova e independente do coletor antigo.

Continuam aposentados:

- scheduler/cron específico da Embrapa;
- configuração antiga em `weather_collector_settings`;
- lease/collector histórico;
- endpoint antigo `/api/weather/embrapa`, que continua `410 retired`;
- qualquer gravação automática dessa leitura direta no histórico antigo.

## O que voltou

A rota `/estacao-embrapa-pelotas` deixou de redirecionar para `/status-dos-dados` e voltou a renderizar uma página real.

A leitura faz uma consulta server-side direta e somente de leitura à página pública da Embrapa, com:

- timeout próprio de 5 segundos;
- cache público de 5 minutos na página dedicada;
- parser próprio para o HTML atual;
- suporte a `windows-1252`;
- estado `live`, `partial` ou `unavailable`;
- ausência de substituição por previsão quando a leitura falha.

## Dados exibidos

Quando a fonte responde e o parser reconhece os valores, a página pode mostrar:

- temperatura do ar;
- sensação térmica;
- umidade relativa;
- ponto de orvalho;
- pressão atmosférica e tendência;
- direção e velocidade do vento;
- nascer e pôr do sol;
- chuva diária, mensal e anual;
- mínimos e máximos diários com horário;
- evapotranspiração diária, mensal e anual.

Esses valores representam o Posto Meteorológico da Sede da Embrapa Clima Temperado. Eles não são convertidos em leitura representativa de toda a região.

## Módulo do Agora

O bloco observacional do portal passou a ter dois módulos independentes:

```text
Agora / Hero
    ↓
seletor observacional
    ├─ embrapa            ← principal atual
    └─ defesa-civil-rs    ← contingência atual
```

A chave operacional fica em:

```text
src/lib/weather/now-source.config.ts
```

Estado atual:

```ts
NOW_PRIMARY_SOURCE = "embrapa"
```

Os dois módulos são consultados em paralelo e possuem deadline independente. Se a fonte principal não entregar leitura utilizável e recente, a outra pode assumir silenciosamente. A troca não transforma previsão em observação.

Para a Embrapa compor o `Agora`, a leitura precisa ter temperatura reconhecida, horário válido e idade de no máximo 30 minutos. Horário ausente, leitura antiga, timeout ou falha de parsing retiram o módulo da seleção daquela consulta sem preencher os campos com modelo meteorológico.

A observação bruta da Defesa Civil continua preservada separadamente no agregado porque chuva acumulada e outras superfícies específicas da rede estadual dependem do contrato próprio dessa fonte.

## Semântica e separação de fontes

A arquitetura atual é:

```text
Current_Monitor.htm da Embrapa
    ↓
reader direto e somente leitura
    ├─ /estacao-embrapa-pelotas
    └─ módulo embrapa do Agora
```

Em paralelo:

```text
Rede de Monitoramento Hidrometeorológico da Defesa Civil RS
    ↓
módulo defesa-civil-rs do Agora
    + consumidores específicos da rede estadual
```

Open-Meteo e MET Norway permanecem previsão. Nenhum deles preenche uma medição ausente da Embrapa ou da Defesa Civil como se fosse observação atual.

A seleção entre Embrapa e Defesa Civil é uma escolha operacional de fonte observacional, não uma fusão das duas séries. Campos ausentes em uma estação não são completados silenciosamente com valores da outra dentro da mesma leitura selecionada.

## Apresentação pública

O Hero mostra a condição atual e o horário da leitura sem repetir o nome do fornecedor abaixo de cada bloco. A transparência detalhada de origem, papel das fontes e estado operacional permanece concentrada em `/status-dos-dados` e nas páginas dedicadas.

A proveniência continua preservada internamente para auditoria, APIs e diagnóstico. Menos texto de fornecedor na interface não significa perda de rastreabilidade.

## SEO e descoberta

A rota da Embrapa permanece deliberadamente em fase de revalidação:

- `noindex` nesta etapa;
- fora de `src/lib/public-routes.ts`;
- fora do sitemap;
- presente novamente no megamenu em `Explorar → Observação e contexto`;
- canonical preservado na própria URL.

O uso como módulo principal do `Agora` não implica indexação automática da página dedicada.

## Arquivos ativos

Leitura Embrapa:

- `src/lib/weather/embrapa-observation.types.ts`;
- `src/lib/weather/embrapa-observation.server.ts`;
- `src/lib/weather/embrapa-observation.functions.ts`;
- `src/components/weather/EmbrapaStationPage.tsx`;
- `src/components/weather/EmbrapaStationPage.css`;
- `src/routes/estacao-embrapa-pelotas.tsx`.

Seleção do Agora:

- `src/lib/weather/now-source.config.ts`;
- `src/lib/weather/now-source.server.ts`;
- `src/lib/weather/aggregated-weather.server.ts`;
- `src/lib/weather/aggregated-weather.types.ts`;
- `src/lib/weather/weather-traceability.ts`;
- `src/production/adapters/home.ts`;
- `src/production/components/weather-hero.tsx`.

Contratos:

- `tests/embrapa-station-page.test.ts`;
- `tests/now-source-modules.test.ts`;
- `tests/weather-traceability.test.ts`;
- `tests/retired-weather-source-cleanup.test.ts`.

## Operação futura

A troca de prioridade deve alterar apenas `NOW_PRIMARY_SOURCE`:

- `"embrapa"` para ativar a Embrapa como fonte principal do Agora;
- `"defesa-civil-rs"` para ativar a Defesa Civil como fonte principal do Agora.

O módulo não selecionado continua disponível como contingência enquanto sua integração estiver funcional. O coletor histórico da Embrapa não precisa ser religado para essa virada.