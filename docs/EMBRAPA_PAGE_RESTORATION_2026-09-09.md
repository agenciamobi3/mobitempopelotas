# Embrapa — restauração isolada da página interna

Data: 09/09/2026  
Rota: `/estacao-embrapa-pelotas`  
Fonte: `https://agromet.cpact.embrapa.br/online/Current_Monitor.htm`

## Decisão

A página interna da Estação Meteorológica da Embrapa Clima Temperado voltou a existir como superfície própria do Tempo Pelotas.

Esta restauração **não reativa a integração operacional antiga** e não altera a fonte observacional usada pela Home.

Continuam aposentados nesta etapa:

- scheduler/cron específico da Embrapa;
- configuração antiga em `weather_collector_settings`;
- lease/collector histórico;
- endpoint antigo `/api/weather/embrapa`, que continua `410 retired`;
- uso da Embrapa como fonte automática do `Agora` na Home;
- descoberta da página em sitemap, header, footer ou atalhos editoriais.

## O que voltou

A rota `/estacao-embrapa-pelotas` deixou de redirecionar para `/status-dos-dados` e voltou a renderizar uma página real.

A página faz uma consulta server-side direta e somente de leitura à página pública da Embrapa, com:

- timeout de 5 segundos;
- cache público de 5 minutos com `stale-while-revalidate`;
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

Esses valores representam o Posto Meteorológico da Sede da Embrapa Clima Temperado. Eles não são convertidos em leitura representativa de toda Pelotas.

## Semântica e separação de fontes

Nesta etapa:

```text
/estacao-embrapa-pelotas
    ↓
consulta direta da página pública da Embrapa
    ↓
página interna isolada
```

Enquanto isso:

```text
Home / Agora
    ↓
Rede de Monitoramento Hidrometeorológico da Defesa Civil RS
```

Uma previsão Open-Meteo/MET Norway não preenche uma medição ausente da Embrapa, e a leitura da Embrapa não substitui automaticamente a observação atual da Defesa Civil RS.

## SEO e descoberta

A rota voltou, mas permanece deliberadamente em fase de revalidação:

- `noindex` nesta etapa;
- fora de `src/lib/public-routes.ts`;
- fora do sitemap;
- sem retorno automático ao header/footer;
- canonical preservado na própria URL.

A decisão de reindexar ou promover a página deve ocorrer somente depois de validar estabilidade da fonte e utilidade editorial sustentada.

## Arquivos ativos

- `src/lib/weather/embrapa-observation.types.ts`;
- `src/lib/weather/embrapa-observation.server.ts`;
- `src/lib/weather/embrapa-observation.functions.ts`;
- `src/components/weather/EmbrapaStationPage.tsx`;
- `src/components/weather/EmbrapaStationPage.css`;
- `src/routes/estacao-embrapa-pelotas.tsx`;
- `tests/embrapa-station-page.test.ts`.

## Próximo passo possível

Antes de qualquer retorno da Embrapa ao `Agora`, observar estabilidade da página pública e comparar leituras consecutivas com a Rede da Defesa Civil RS. A restauração da página interna não autoriza religar o coletor histórico nem mudar a prioridade das fontes do portal.
