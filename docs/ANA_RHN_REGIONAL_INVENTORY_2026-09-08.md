# Inventário regional ANA / SNIRH no Tempo Pelotas

Data: 08/09/2026

## Objetivo

Enriquecer `/situacao-hidrologica-pelotas` com o inventário público de estações da Rede Hidrometeorológica Nacional próximas de Pelotas, sem transformar essas estações em novas fontes de medição do nível do Laranjal.

## Fonte pública

Camada oficial:

`https://portal1.snirh.gov.br/server/rest/services/Estações_Hidrometeorológicas_SNIRH/FeatureServer/0`

A camada é pública, usa HTTPS e não exige token, cookie ou API key para a consulta utilizada pelo portal.

## Consulta do Tempo Pelotas

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

## Apresentação

Componente:

`src/components/hydrology/AnaRhnRegionalStations.tsx`

A seção contém:

1. título e número real de estações encontradas;
2. distribuição geográfica calculada com as coordenadas publicadas;
3. resumo de estações operando e com telemetria cadastrada;
4. fichas com os metadados reais de cada estação;
5. explicação educativa curta somente no final;
6. link para o inventário oficial.

Se a consulta falhar ou não retornar estação útil, o componente retorna `null` e a página continua sem um bloco vazio ou texto de preenchimento.

## Limite editorial e de produto

Esta implementação é **inventário**, não **medição**.

Ela não muda a política ANA/RHN já vigente:

- `87955001` continua readiness/cross-check para leitura atual;
- `publishableMeasurement=false` continua válido para esse adapter;
- a referência vertical de `87955001` continua não confirmada;
- `87955000` permanece separada como identidade histórica;
- nenhuma estação regional passa a ser referência de nível para Pelotas apenas por proximidade geográfica;
- nenhum valor é convertido entre réguas.

## Próximas etapas relacionadas

1. validar visualmente as estações retornadas no domínio/preview;
2. confirmar quais pontos mais relevantes merecem prioridade editorial na listagem;
3. incorporar hidrografia oficial ao mapa regional;
4. consultar `NotasConsistencia` para a estação histórica `87955000`;
5. criar a ficha cadastral resumida da `87955001` em `/nivel-da-lagoa-dos-patos-laranjal`.
