# Inventário regional ANA / SNIRH no Tempo Pelotas

Data: 08/09/2026

## Objetivo

Enriquecer `/situacao-hidrologica-pelotas` com contexto oficial da Rede Hidrometeorológica Nacional próxima de Pelotas, sem transformar a ANA em nova fonte automática de medição do nível do Laranjal.

A implementação separa três papéis:

1. **inventário de estações** — cadastro público de pontos próximos de Pelotas;
2. **cartografia hidrográfica** — rios principais e massas d'água para contexto visual;
3. **medição atual do Laranjal** — permanece sob o contrato próprio LabHidroSens/UFPel → CIEX/FURG, sem ingestão ANA nesta fase.

## Inventário de estações

Camada oficial:

`https://portal1.snirh.gov.br/server/rest/services/Estações_Hidrometeorológicas_SNIRH/FeatureServer/0`

A camada é pública, usa HTTPS e não exige token, cookie ou API key para a consulta utilizada pelo portal.

O adapter `src/lib/hydrology/ana-rhn-regional.server.ts`:

- usa Pelotas como centro de referência (`-31.7719`, `-52.3371`);
- consulta estações em um raio de 180 km;
- solicita no máximo 200 registros ao serviço;
- normaliza, ordena por situação operacional e distância;
- publica no máximo 16 estações na página;
- mantém timeout curto de 3,5 segundos;
- não grava medições no Historical Data Layer;
- não usa Supabase;
- não consulta série temporal;
- não altera o seletor de fonte do Laranjal.

## Dados apresentados ao visitante

A seção usa somente valores concretos devolvidos pelo inventário quando disponíveis:

- nome da estação;
- município e UF;
- código adicional/código cadastral quando disponível;
- tipo de estação;
- situação operacional cadastrada;
- latitude e longitude;
- distância aproximada de Pelotas;
- rio, bacia ou sub-bacia;
- área de drenagem quando publicada;
- instituição responsável;
- instituição operadora;
- presença cadastrada de régua de nível, registrador de nível, pluviômetro, registrador de chuva e telemetria.

Não são criadas tags genéricas para preencher a interface. Campos ausentes simplesmente não são renderizados.

Se a consulta falhar ou não retornar estação útil, o componente retorna `null` e a página continua sem um bloco vazio ou texto de preenchimento.

## Cartografia hidrográfica

Camadas oficiais usadas:

- rios principais: `https://portal1.snirh.gov.br/server/rest/services/RiosPrincipais/MapServer/0`;
- massas d'água: `https://portal1.snirh.gov.br/server/rest/services/Hidrografia/MapServer/2`.

O adapter `src/lib/hydrology/ana-rhn-hydrography.server.ts` consulta apenas um envelope regional no entorno de Pelotas e solicita GeoJSON em EPSG:4326.

Para reduzir o payload de mapa, a geometria recebe simplificação cartográfica por:

- `maxAllowableOffset=0.002`;
- `geometryPrecision=5`.

Essa simplificação serve somente para desenho no mapa. A geometria não é usada para distância, nível, cota, vazão, área de risco ou qualquer cálculo hidrológico.

Nomes aproveitados:

- rios: `NORIOCOMP`;
- massas d'água: `NOME_ESP`, com `NOME_ALT` como contingência de nome.

As duas camadas degradam independentemente. Se apenas uma responder, o mapa utiliza a camada disponível. Se ambas falharem, as estações continuam no mapa-base e na listagem.

## Apresentação

Componentes:

- `src/components/hydrology/AnaRhnRegionalStations.tsx`;
- `src/components/hydrology/AnaRhnRegionalMap.tsx`.

O mapa usa MapLibre, já presente no projeto, e OpenFreeMap como mapa-base.

Ordem visual:

1. massas d'água;
2. rios principais e nomes quando publicados;
3. estações ANA/SNIRH;
4. Pelotas como referência cartográfica.

A seção contém:

1. título e número real de estações encontradas;
2. mapa com estações e cartografia oficial quando disponível;
3. resumo de estações operando e com telemetria cadastrada;
4. fichas com os metadados reais de cada estação;
5. explicação educativa curta somente no final;
6. link para o inventário oficial.

A listagem abaixo do mapa continua sendo a camada acessível e informativa principal para os metadados das estações.

## Limite editorial e de produto

Esta implementação é **inventário e cartografia**, não **medição**.

Ela não muda a política ANA/RHN já vigente:

- `87955001` continua readiness/cross-check para leitura atual;
- `publishableMeasurement=false` continua válido para esse adapter;
- a referência vertical de `87955001` continua não confirmada;
- `87955000` permanece separada como identidade histórica;
- nenhuma estação regional passa a ser referência de nível para Pelotas apenas por proximidade geográfica;
- nenhum valor é convertido entre réguas;
- a cartografia não produz alerta, diagnóstico de inundação ou área atingida.

## Segurança e resiliência

- somente HTTPS;
- `portal1.snirh.gov.br` em allowlist;
- nenhum token, cookie, API key ou credencial é enviado;
- consultas executadas em server functions;
- timeout curto;
- inventário e cartografia degradam isoladamente;
- indisponibilidade não vira zero, normalidade ou afirmação de ausência de risco.

## Arquivos principais

- `src/lib/hydrology/ana-rhn-regional.server.ts`
- `src/lib/hydrology/ana-rhn-regional.functions.ts`
- `src/lib/hydrology/ana-rhn-hydrography.server.ts`
- `src/lib/hydrology/ana-rhn-hydrography.functions.ts`
- `src/components/hydrology/AnaRhnRegionalStations.tsx`
- `src/components/hydrology/AnaRhnRegionalMap.tsx`
- `src/routes/situacao-hidrologica-pelotas.tsx`
- `tests/ana-rhn-regional-inventory.test.ts`
- `tests/ana-rhn-hydrography.test.ts`

## Etapa histórica relacionada concluída

A consulta à camada `NotasConsistencia` para a estação histórica `87955000` foi implementada separadamente em `/enchente-2001-pelotas`. O contrato e os limites dessa integração estão documentados em `docs/ANA_RHN_CONSISTENCY_87955000_2026-09-08.md`.

Essa consulta não altera inventário, cartografia regional ou medição atual do Laranjal.

## Próximas etapas relacionadas

1. validar visualmente as estações e a hidrografia retornadas no domínio/preview;
2. confirmar quais pontos mais relevantes merecem prioridade editorial na listagem;
3. confirmar no runtime, quando houver executor disponível, se `87955000` retorna registro real em `NotasConsistencia` e quais valores exatos de `Indice` e `Notas` são publicados;
4. criar a ficha cadastral resumida da `87955001` em `/nivel-da-lagoa-dos-patos-laranjal`.
