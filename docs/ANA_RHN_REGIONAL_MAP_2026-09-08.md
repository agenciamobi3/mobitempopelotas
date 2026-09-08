# ANA / SNIRH — inventário e cartografia regional em Pelotas

Data: 08/09/2026

## Objetivo

Enriquecer `/situacao-hidrologica-pelotas` com contexto oficial da Rede Hidrometeorológica Nacional sem promover a ANA a terceira fonte de medição atual do Laranjal.

A implementação separa explicitamente três papéis:

1. **inventário de estações** — cadastro público de pontos próximos de Pelotas;
2. **cartografia hidrográfica** — rios principais e massas d'água para contexto visual;
3. **medição atual do Laranjal** — permanece sob o contrato próprio LabHidroSens/UFPel → CIEX/FURG, sem ingestão ANA nesta fase.

## Inventário regional

Fonte pública:

`https://portal1.snirh.gov.br/server/rest/services/Estações_Hidrometeorológicas_SNIRH/FeatureServer/0`

O adapter consulta um raio de 180 km a partir de Pelotas, ordena estações operando antes das demais e depois por distância, e limita a apresentação pública a 16 pontos.

Campos públicos aproveitados quando existentes:

- nome;
- código;
- município e UF;
- rio, bacia e sub-bacia;
- situação cadastral de operação;
- área de drenagem;
- responsável e operadora;
- presença de régua de nível, registrador de nível, pluviômetro, registrador de chuva e telemetria.

Se o inventário não responder ou não produzir estações úteis, a seção inteira fica ausente. Não existe placeholder público de “em breve”.

## Cartografia hidrográfica

Camadas oficiais usadas:

- rios principais: `https://portal1.snirh.gov.br/server/rest/services/RiosPrincipais/MapServer/0`;
- massas d'água: `https://portal1.snirh.gov.br/server/rest/services/Hidrografia/MapServer/2`.

A consulta é limitada a um envelope regional no entorno de Pelotas e solicita GeoJSON em EPSG:4326. A geometria recebe simplificação cartográfica por `maxAllowableOffset=0.002` e `geometryPrecision=5` apenas para reduzir o payload de visualização. Essa geometria não é usada para distância, nível, cota, vazão ou qualquer cálculo hidrológico.

Nomes aproveitados:

- rios: `NORIOCOMP`;
- massas d'água: `NOME_ESP`, com `NOME_ALT` como contingência de nome.

As duas camadas degradam independentemente. Se apenas uma responder, o mapa utiliza a camada disponível. Se ambas falharem, as estações continuam sendo apresentadas no mapa-base e na listagem.

## Apresentação pública

`AnaRhnRegionalMap` usa o MapLibre já presente no projeto e OpenFreeMap como mapa-base.

Ordem visual:

1. massas d'água;
2. rios principais e nomes quando publicados;
3. estações ANA/SNIRH;
4. Pelotas como referência cartográfica.

A listagem abaixo do mapa continua sendo a camada acessível e informativa principal para os metadados das estações.

A copy pública evita explicar termos técnicos ao longo da seção. Uma explicação resumida fica no rodapé, informando que inventário e cartografia não substituem a leitura atual do Laranjal nem autorizam associação automática de uma estação próxima à cidade.

## Segurança e governança

- somente HTTPS;
- host `portal1.snirh.gov.br` em allowlist;
- nenhum token, cookie, API key ou credencial é enviado;
- consultas executadas em server function;
- timeout curto;
- indisponibilidade não vira zero ou normalidade;
- cartografia não cria medições;
- `87955001` continua readiness/cross-check;
- `87955000` continua histórica e separada da telemetria atual.

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
