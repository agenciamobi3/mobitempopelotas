# ANA / SNIRH — consistência da estação histórica Laranjal 87955000

Data: 08/09/2026

## Objetivo

Enriquecer `/enchente-2001-pelotas` com a avaliação cadastral de consistência publicada pela ANA/SNIRH para a estação histórica **LARANJAL 87955000**, sem transformar essa avaliação em explicação automática para a enchente de 2001 ou para a diferença entre a série bruta e a série consistida.

## Fonte oficial

Camada pública:

`https://portal1.snirh.gov.br/server/rest/services/NotasConsistencia/MapServer/0`

Consulta utilizada pelo Tempo Pelotas:

- estação fixa: `Codigo=87955000`;
- HTTPS;
- host `portal1.snirh.gov.br` em allowlist;
- sem token, cookie ou API key;
- sem geometria;
- no máximo um registro;
- timeout de 3,5 segundos.

## Campos utilizados

O adapter solicita somente:

- `Codigo`;
- `Notas`;
- `Indice`;
- `Nome`;
- `Operando`;
- `AreaDrenag`;
- `Bacia`;
- `SubBacia`;
- `Rio`;
- `UF`;
- `Municipio`.

A classificação `Indice` é preservada apenas nos estados publicados pela própria camada:

- `OTIMO`;
- `BOM`;
- `RAZOAVEL`;
- `RUIM`;
- `PESSIMO`.

Na interface, esses valores são apresentados em português legível, sem mudar sua semântica.

`Notas` é exibido somente como **nota publicada pela ANA**, sem assumir denominador, percentual ou escala que não esteja documentada no contrato consultado.

## Campos deliberadamente não utilizados

A camada também possui `c1` a `c16`. A definição pública da camada não descreve o significado individual desses campos.

Por isso:

- `c1` a `c16` não entram em `outFields`;
- não são normalizados;
- não são apresentados ao visitante;
- não alimentam inferências internas;
- uma interpretação futura exige documentação oficial que descreva a semântica desses campos.

## Relação com a enchente de 2001

Esta avaliação pertence à **estação/série histórica**, não ao evento de 8 de outubro de 2001.

Ela não autoriza afirmar que:

- a enchente recebeu uma “nota de qualidade”;
- `Notas` é percentual ou nota de 0 a 10/100;
- a classificação explica a diferença de 100 cm entre os valores históricos;
- 2,90 m bruto ou 1,90 m consistido/estimado é automaticamente o valor correto para todos os usos;
- a consistência cadastral resolve a referência vertical da régua em 2001.

A página continua preservando separadamente:

- série bruta: média diária de 290 cm em 08/10/2001;
- série consistida: 190 cm no mesmo dia, marcada como estimada;
- lacuna documental sobre a causa exata da revisão;
- ausência de comprovação de um datum/zero aplicável ao período que permita recalcular a série.

## Separação 87955000 × 87955001

A consulta é restrita a `87955000`.

Ela não modifica o contrato da estação atual `87955001`, que continua:

- separada da identidade histórica;
- sem fusão automática de séries;
- readiness/cross-check para leitura ANA atual nesta fase;
- sem uso para recalibrar a série de 2001.

## Apresentação pública

Componente:

`src/components/history/AnaRhnHistoricalConsistency.tsx`

A seção só aparece quando a consulta retorna a estação e há pelo menos `Indice` ou `Notas` aproveitável.

Se ocorrer:

- ausência do registro;
- HTTP inválido;
- timeout;
- falha de parsing;
- classificação/nota ausentes;

nenhuma avaliação é inventada e não há placeholder público de “em breve”.

A explicação educativa fica no fim da seção e informa os limites da avaliação sem interromper a narrativa principal da enchente.

## Arquivos principais

- `src/lib/hydrology/ana-rhn-consistency.server.ts`;
- `src/lib/hydrology/ana-rhn-consistency.functions.ts`;
- `src/components/history/AnaRhnHistoricalConsistency.tsx`;
- `src/components/history/AnaRhnHistoricalConsistency.css`;
- `src/routes/enchente-2001-pelotas.tsx`;
- `tests/ana-rhn-consistency.test.ts`.

## Estado da validação

O contrato da camada e as categorias oficiais foram confirmados no serviço público da ANA/SNIRH.

Nesta rodada, o valor efetivamente devolvido para `87955000` ainda não foi confirmado de forma independente no runtime do preview. O workspace Lovable ficou sem créditos no momento da inspeção. Por isso, este documento não registra nem antecipa um valor de `Indice` ou `Notas` para a estação.

A implementação é fail-closed: quando o runtime conseguir consultar a fonte, o conteúdo só aparece se houver um registro real compatível com o contrato acima.
