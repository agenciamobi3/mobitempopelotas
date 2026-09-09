# Módulos de fonte do Agora / Hero

Data: 09/09/2026

## Objetivo

Separar a observação meteorológica usada no `Agora` e no Hero em módulos independentes, permitindo trocar a fonte principal sem reescrever o agregador ou a interface.

## Módulos ativos

```text
embrapa
  reader: src/lib/weather/embrapa-observation.server.ts
  estação: Posto Meteorológico da Sede - Embrapa Clima Temperado

defesa-civil-rs
  reader: src/lib/weather/defesa-civil-current.server.ts
  estações locais permitidas: DCRS-00039 e DCRS-00062
```

Os módulos convergem em:

```text
src/lib/weather/now-source.server.ts
```

A prioridade operacional fica em:

```text
src/lib/weather/now-source.config.ts
```

## Estado atual

```ts
export const NOW_PRIMARY_SOURCE = "embrapa";
```

Logo:

```text
Embrapa            = principal
Defesa Civil RS    = contingência observacional
```

## Regra de virada

A troca deve ser pequena e explícita. Não se altera o Hero, o agregador, os componentes ou as páginas para trocar a fonte principal.

Frase operacional:

```text
Ativar Defesa Civil no modo Agora
```

significa alterar:

```ts
NOW_PRIMARY_SOURCE = "defesa-civil-rs";
```

Frase operacional:

```text
Ativar Embrapa no modo Agora
```

significa alterar:

```ts
NOW_PRIMARY_SOURCE = "embrapa";
```

Depois da virada, o módulo não principal continua disponível como contingência.

## Failover silencioso

Os dois módulos são consultados em paralelo com deadline independente de 5,5 segundos no seletor.

A seleção segue:

```text
fonte principal utilizável?
  sim -> publica a principal
  não -> contingência utilizável?
           sim -> publica a contingência
           não -> Agora fica sem medição recente
```

Uma queda do módulo de contingência não deve rebaixar o Hero quando a Embrapa estiver entregando uma observação utilizável.

A troca de módulo não gera mensagem pública do tipo "mudamos de fonte" no Hero. A informação de origem permanece disponível na camada de transparência e na rastreabilidade interna.

## Critério de leitura atual

Uma observação só entra no `Agora` quando atende ao contrato do módulo e tem idade de no máximo 30 minutos.

Embrapa exige, no mínimo:

- temperatura reconhecida;
- horário de observação reconhecido;
- idade de até 30 minutos.

Defesa Civil exige:

- estação explicitamente permitida para Pelotas;
- capacidade meteorológica válida;
- horário confiável;
- idade de até 30 minutos.

Leitura antiga continua leitura antiga. Não existe promoção de last-known para `Agora`.

## Campos

O contrato comum do Agora suporta:

- temperatura;
- sensação térmica;
- umidade;
- pressão;
- vento médio;
- rajada, quando a fonte realmente publica;
- direção do vento;
- nascer e pôr do sol, quando a fonte publica;
- horário observado.

Campos que a fonte selecionada não possui permanecem ausentes. Não é permitido montar uma leitura híbrida, por exemplo temperatura da Embrapa com rajada da Defesa Civil, sob aparência de uma única observação.

## Separação de previsão

Open-Meteo e MET Norway continuam sendo módulos de previsão, não módulos do `Agora` observacional.

Se Embrapa e Defesa Civil estiverem sem leitura recente, a previsão horária pode continuar visível como **previsão da próxima hora**, mas nunca assume o rótulo de medição atual.

## Defesa Civil preservada para outros usos

O agregado mantém `weather.observation` como a observação bruta da Defesa Civil RS mesmo quando a Embrapa está selecionada no `Agora`.

Isso é intencional porque existem consumidores específicos da rede estadual, especialmente chuva acumulada e superfícies hidrometeorológicas, que não devem mudar de semântica apenas porque a fonte principal do Hero foi trocada.

A seleção visual do Agora é registrada separadamente em `weather.now` e `quality.currentSource`.

## Apresentação pública

O Hero não repete o fornecedor abaixo da temperatura, umidade, pressão ou vento.

Permanece visível o que interessa ao visitante na leitura rápida:

- condição atual;
- temperatura;
- sensação;
- umidade;
- pressão;
- vento;
- horário da leitura;
- previsão das próximas horas em bloco separado.

A página `/status-dos-dados` concentra origem, estado e condição das integrações. A Embrapa passa a aparecer como módulo de observação meteorológica local, e a Defesa Civil continua documentada como rede hidrometeorológica e módulo observacional.

## Arquivos centrais

- `src/lib/weather/now-source.config.ts`
- `src/lib/weather/now-source.server.ts`
- `src/lib/weather/aggregated-weather.types.ts`
- `src/lib/weather/aggregated-weather.server.ts`
- `src/lib/weather/weather-traceability.ts`
- `src/production/adapters/home.ts`
- `src/production/components/weather-hero.tsx`
- `src/lib/status/data-status.server.ts`
- `tests/now-source-modules.test.ts`
- `tests/weather-traceability.test.ts`
- `tests/data-status-data-condition.test.ts`

## O que não voltou

A arquitetura modular não reativa:

- cron antigo da Embrapa;
- collector antigo;
- lease antigo;
- `weather_collector_settings` antigo;
- `/api/weather/embrapa`, que continua aposentado;
- gravação automática da leitura direta da Embrapa no histórico legado.

O módulo `embrapa` usa o reader direto e somente leitura criado para a página restaurada.