# Previsão de 15 dias — resiliência e contingência

Data: 09/09/2026  
Rota: `/previsao-15-dias-pelotas`  
Status: implementado na `main`; validação executável continua dependente de runner funcional

## Objetivo

Garantir que a página de previsão estendida tente entregar os 15 dias reais antes de degradar para uma janela menor, sem ampliar o payload meteorológico compartilhado pela Home, Hoje, Amanhã e 7 dias.

## Cadeia atual

A resolução da previsão estendida ficou assim:

1. Open-Meteo Forecast API / Best Match, consulta diária de 15 dias;
2. Open-Meteo GFS API / NOAA GFS, consulta diária de 15 dias;
3. cache/Edge Function dedicada `open-meteo-extended-forecast`;
4. contingência legada Open-Meteo de 7 dias somente como último recurso;
5. `unavailable` se nenhuma janela publicável estiver disponível.

Best Match e NOAA GFS são consultados em paralelo para manter a resposta dentro do budget público. Entre respostas utilizáveis, vence a janela com maior número de dias. Em empate, a ordem acima preserva a prioridade operacional.

A documentação oficial do Open-Meteo informa horizonte de até 16 dias tanto para Forecast API quanto para GFS API. A implementação pede 15 dias e usa somente agregados diários.

Referências:

- https://open-meteo.com/en/docs
- https://open-meteo.com/en/docs/gfs-api

## Campos usados

A consulta estendida continua limitada a:

- `weather_code`;
- `temperature_2m_max`;
- `temperature_2m_min`;
- `precipitation_probability_max`;
- `precipitation_sum`;
- `wind_gusts_10m_max`.

Não foram adicionados `current` nem `hourly` ao contrato de 15 dias.

## Budget de resposta

`extended-forecast.server.ts` mantém:

- timeout direto por candidato: 2,2 s;
- budget interno total: 2,55 s;
- tentativa Edge estendida limitada ao tempo restante, com teto de 900 ms;
- contingência legada limitada ao tempo restante, com teto de 500 ms.

O loader público continua com deadline próprio de 2,8 s por dependência. O objetivo é impedir que a nova camada de contingência transforme uma resposta direta já disponível em timeout de SSR.

Se Best Match ou GFS retornarem os 15 dias, a função retorna imediatamente sem esperar Edge ou cache legado.

## Cache dedicado

Foi criado o provider interno:

`open-meteo-extended`

A migration `20260909192000_add_open_meteo_extended_cache.sql`:

- adiciona o provider ao constraint de `weather_provider_payload_cache`;
- cria a linha inicial do cache;
- cria a RPC pública restrita `get_public_open_meteo_extended_cache_snapshot()`;
- mantém a tabela privada e expõe somente payload/timestamps necessários à leitura pública.

A Edge Function dedicada fica em:

`supabase/functions/open-meteo-extended-forecast/index.ts`

Ela usa o mesmo token de coletor meteorológico já configurado para Pelotas, mas possui cache e payload próprios. Dentro da Edge, Best Match é tentado primeiro e NOAA GFS funciona como contingência do refresh.

O payload persistido guarda também qual modelo originou a previsão, permitindo manter a proveniência interna mesmo quando a interface não mostra o nome da fonte.

## Semântica de publicação

Permanecem válidas as regras:

- `requestedDays` continua 15;
- `returnedDays` representa somente dias realmente recebidos;
- a segunda semana nunca é inventada ou extrapolada;
- ausência de campo obrigatório não vira zero;
- previsão de modelo não vira aviso oficial;
- a contingência de 7 dias permanece `partial`, nunca é apresentada como 15 dias completos.

A interface pública não precisa expor `Open-Meteo Best Match`, `NOAA GFS` ou o nome do cache nos blocos removidos em 09/09/2026. A proveniência continua registrada no contrato interno `source.model`.

## Arquivos principais

- `src/lib/weather/extended-forecast.server.ts`;
- `src/lib/weather/extended-forecast.types.ts`;
- `src/lib/weather/open-meteo-extended-edge.server.ts`;
- `supabase/functions/open-meteo-extended-forecast/index.ts`;
- `supabase/migrations/20260909192000_add_open_meteo_extended_cache.sql`;
- `tests/open-meteo-extended-forecast.test.ts`;
- `tests/fifteen-day-forecast.test.ts`.

## Validação

Foi adicionado contrato estático para proteger:

- endpoint GFS dedicado;
- horizonte de 15 dias;
- ausência de payload horário/current;
- provider/cache separado;
- RPC pública restrita;
- ordem Best Match → GFS na Edge;
- seleção da janela mais ampla;
- preservação da contingência de 7 dias.

Não declarar build, typecheck, lint ou testes como PASS enquanto não houver execução real em runner funcional.

## Gate de implantação

Para a contingência persistida ficar operacional no ambiente Supabase, o ambiente precisa receber:

1. a migration `20260909192000_add_open_meteo_extended_cache.sql`;
2. deploy da Edge Function `open-meteo-extended-forecast`.

Mesmo antes disso, a aplicação já possui as duas consultas diretas de 15 dias, Best Match e NOAA GFS. A ausência temporária da nova Edge não deve derrubar a rota; ela apenas reduz uma camada de contingência.
