# Base dos Dados / BDMEP — avaliação para o Tempo Pelotas

Data da avaliação: 27/08/2026  
Status: **fonte candidata aprovada para histórico/climatologia; sem integração no runtime nesta rodada**  
Escopo desta rodada: **documentação somente**

## 1. Fonte avaliada

Catálogo informado:

- Base dos Dados — Banco de Dados Meteorológicos (INMET);
- dataset: `782c5607-9f69-4e12-b0d5-aa0f1a7a94e2`;
- tabela selecionada no catálogo: `2c7fdc3d-f2ed-4c78-84b8-d9c792a06703`;
- URL: `https://basedosdados.org/dataset/782c5607-9f69-4e12-b0d5-aa0f1a7a94e2?table=2c7fdc3d-f2ed-4c78-84b8-d9c792a06703`.

O catálogo público descreve o BDMEP como acervo de **dados meteorológicos diários** de séries históricas de estações meteorológicas **convencionais** da rede do INMET, digitalizadas conforme normas técnicas internacionais da Organização Meteorológica Mundial.

Cobertura temporal publicada na consulta de 27/08/2026:

- início: `2000`;
- fim publicado: `2026-07-31`.

Organização/titular de origem identificado pelo catálogo: **Instituto Nacional de Meteorologia — INMET**.

No ecossistema técnico da Base dos Dados, o conjunto é identificado como `br_inmet_bdmep`, com tabela `microdados`. Antes de qualquer implementação, o schema efetivamente disponível deve ser confirmado no guia de uso/consulta vigente da própria plataforma; esta avaliação não congela nomes de colunas nem cria dependência de schema ainda não validado.

## 2. Decisão arquitetural

A Base dos Dados/BDMEP **não deve substituir fontes operacionais do Tempo Pelotas**.

Seu papel aprovado é:

> **camada histórica observacional complementar, voltada a climatologia, comparações temporais, pesquisa e backfill diário quando a estação/período forem adequados.**

Não usar como:

- condição meteorológica atual;
- previsão;
- alerta;
- radar/satélite;
- substituto automático da Embrapa;
- substituto automático do arquivo horário direto do INMET A887;
- mecanismo para preencher silenciosamente lacunas de outra estação.

## 3. Relação com o INMET A887 já arquivado

O Tempo Pelotas já possui arquivo especializado da estação automática:

- código: `A887`;
- referência regional: Capão do Leão / Pelotas;
- classe: `observation`;
- granularidade: horária;
- origem: arquivos históricos anuais oficiais do INMET;
- armazenamento: `inmet_hourly_observations`;
- backfill protegido por Edge Function e execução auditável.

Esse arquivo direto possui variáveis horárias mais ricas, incluindo, conforme disponibilidade do arquivo anual:

- precipitação;
- pressão;
- radiação global;
- temperatura;
- ponto de orvalho;
- máximas/mínimas horárias publicadas;
- umidade;
- direção do vento;
- rajada;
- velocidade do vento.

Portanto, para períodos/variáveis comparáveis, **INMET direto A887 continua preferencial ao espelho tratado por terceiro**.

A Base dos Dados/BDMEP é complementar porque representa outro contrato histórico: série diária de estações convencionais, potencialmente útil para ampliar a janela temporal, comparar estações e sustentar climatologia regional.

## 4. Hierarquia recomendada de proveniência

Para histórico observado em Pelotas e região, a regra proposta é:

1. **observação local direta preservada pelo Tempo Pelotas**, quando existir e for adequada ao local/período;
2. **INMET oficial direto**, incluindo A887 e outras estações selecionadas conscientemente;
3. **Base dos Dados / BDMEP / INMET**, mantendo dupla proveniência: origem INMET + tratamento/disponibilização Base dos Dados;
4. outros acervos observacionais oficiais/revisados;
5. reanálise/modelados, sempre classificados separadamente como `reanalysis`.

A ordem não autoriza fusão automática de séries. Fonte, estação, instrumento, período, granularidade e qualidade precisam permanecer auditáveis.

## 5. Classe do dado

Quando importado, o BDMEP deve entrar como:

```text
data_class = observation
```

Motivo: o catálogo descreve medições provenientes de estações meteorológicas do INMET, não reconstrução de modelo.

Entretanto, cada linha importada deve manter metadados suficientes para deixar explícito:

- estação de origem;
- código da estação quando fornecido;
- município/UF quando disponível;
- data;
- variável;
- unidade;
- granularidade diária;
- origem original `INMET`;
- distribuidor/tratador `Base dos Dados`;
- versão/data de extração;
- qualidade/ausência conforme schema efetivo;
- método de ingestão.

Nunca converter a proveniência para apenas “Tempo Pelotas”.

## 6. Casos de uso aprovados para estudo futuro

### 6.1. Climatologia histórica

Possíveis análises, quando a cobertura da estação for suficiente:

- médias mensais e anuais;
- extremos do período disponível;
- distribuição sazonal;
- comparação entre anos;
- comparação entre meses homólogos;
- número de dias com chuva por período;
- acumulados mensais/anuais de precipitação;
- frequência de eventos definidos por limiares documentados.

Evitar chamar qualquer média calculada de “normal climatológica oficial” sem obedecer período, completude e metodologia apropriados.

### 6.2. Contexto para o histórico recente

A rota pública `/historico-climatico-pelotas` hoje trabalha com janela recente e explicitamente não chama 30 dias de climatologia.

O BDMEP pode futuramente oferecer uma referência histórica separada, permitindo perguntas como:

- como este mês se compara ao mesmo mês de outros anos;
- como o acumulado de chuva atual se posiciona na série disponível;
- quais anos tiveram maiores/menores valores na estação selecionada.

Essa camada não deve alterar a semântica da página atual sem projeto específico.

### 6.3. Enchente de 2024

Pode servir de contexto meteorológico para a rota `/enchente-2024-pelotas-laranjal`, desde que:

- a estação usada seja identificada;
- chuva permaneça associada à estação e ao período;
- não seja inferida causalidade automática entre precipitação e nível da Lagoa;
- séries hidrológicas e meteorológicas permaneçam semanticamente distintas;
- timestamps/janelas sejam comparados explicitamente.

### 6.4. Central Regional

O conjunto pode ajudar a mapear estações históricas relevantes para as cidades já aprovadas no inventário regional.

Regra permanente:

> **cidade não herda automaticamente a série de uma estação próxima.**

Antes de vincular uma estação a uma página municipal, validar distância, contexto geográfico, período, continuidade da estação, eventuais mudanças de local/código e adequação editorial.

### 6.5. Produtos editoriais e sociais

Possíveis produtos derivados, após validação metodológica:

- “neste dia na história”;
- comparação do mês corrente com anos anteriores;
- ranking de meses/anos mais chuvosos dentro da série consultada;
- extremos do período disponível;
- retrospectivas anuais;
- gráficos históricos para matérias do portal;
- contextualização de eventos meteorológicos relevantes.

Nenhum conteúdo deve apresentar recorde municipal/oficial quando o cálculo representar apenas o máximo/mínimo encontrado na série da estação consultada.

## 7. O que não fazer

- não consultar o BigQuery diretamente do navegador;
- não expor credenciais de Google Cloud/Base dos Dados;
- não baixar o Brasil inteiro por padrão;
- não importar todas as estações sem inventário regional;
- não misturar estação convencional do BDMEP com A887 automática como se fossem uma única série contínua;
- não substituir `null`/ausência por zero;
- não converter dado diário em falsa observação horária;
- não inferir horários de máximas/mínimas quando a fonte não os fornecer;
- não rotular dado de outra estação como “medido em Pelotas” apenas pela proximidade;
- não liberar exportação/PRO antes da revisão de direitos e redistribuição.

## 8. Estratégia técnica futura — não implementada

Quando houver autorização para implementação, a arquitetura preferencial é server-side:

```text
Base dos Dados / BigQuery ou mecanismo de acesso vigente
        ↓
consulta restrita por estação + período + colunas necessárias
        ↓
normalização e validação
        ↓
Historical Data Layer / Supabase
        ↓
rollups e API interna
        ↓
portal / análises / recursos permitidos
```

Não criar dependência de consulta ao provedor a cada pageview.

Para reduzir custo e volume:

- selecionar somente estações relevantes;
- selecionar somente colunas necessárias;
- filtrar período;
- executar backfill por lotes idempotentes;
- registrar `collection_run`/manifesto de importação;
- persistir hash/versão ou metadado equivalente quando útil;
- gerar rollups para consultas longas.

## 9. Governança e uso comercial

A Base dos Dados informa em seus Termos de Serviço que os direitos de propriedade intelectual dos dados fornecidos pertencem a terceiros e estão sujeitos às respectivas políticas de uso.

Consequência para o Tempo Pelotas:

- titular/origem do dado deve continuar identificado como INMET;
- tratamento/disponibilização pela Base dos Dados deve ser registrado quando essa rota de acesso for usada;
- termos da Base dos Dados e política do INMET precisam ser revisados para retenção, redistribuição, cache, exportação e uso comercial;
- eventual acesso por assinatura/BigQuery/Python/R não implica automaticamente autorização para redistribuir dados em recursos pagos;
- `paid_access_allowed=false` deve permanecer como padrão até revisão específica.

Esta rodada **não aprova uso comercial nem exportação**.

## 10. Compatibilidade com o Historical Data Layer

A fonte encaixa no modelo já existente porque o projeto separa:

- `observation`;
- `forecast`;
- `reanalysis`;
- `derived`.

Uma eventual ingestão deve preferir a camada canônica do Historical Data Layer, sem destruir tabelas especializadas já corretas como `inmet_hourly_observations`.

Recomendação de cadastro futuro, ainda não aplicado:

```text
source_key: basedosdados-inmet-bdmep
category: weather-station-daily
attribution: Instituto Nacional de Meteorologia — INMET; tratamento/disponibilização Base dos Dados
retention_policy_status: pending_review
paid_access_allowed: false
collection_enabled: false
coverage_start: 2000-01-01 (confirmar granularidade real por estação)
```

`coverage_end`/última data efetiva deve vir do lote consultado, não ser presumida globalmente a partir do cabeçalho do catálogo.

## 11. Gate antes de implementar

Antes de escrever coletor, migration ou consulta de produção:

1. confirmar schema atual da tabela `microdados` no acesso oficial da Base dos Dados;
2. inventariar estações do RS e identificar candidatas para Pelotas/Zona Sul;
3. comparar estações convencionais disponíveis com A887 e outras fontes locais;
4. medir cobertura, lacunas e mudanças de estação;
5. confirmar unidades e semântica de cada coluna;
6. definir tratamento de valores ausentes/flags;
7. revisar termos INMET + Base dos Dados;
8. definir se a ingestão será via BigQuery, pacote oficial ou outro acesso estável;
9. estimar custo/volume de backfill;
10. definir mapeamento para `historical_measurements` ou estrutura especializada quando justificável;
11. criar testes de proveniência, idempotência e não-fusão de estações;
12. só então autorizar implementação.

## 12. Prioridade

Classificação: **P1 — backfill observacional/climatologia**.

Não compete com P0 de preservar dados que já estão passando pelos coletores atuais. Deve entrar depois das tarefas críticas de não-perda e em paralelo ao inventário técnico de estações INMET.

## 13. Resultado desta rodada

Decisão registrada:

> **APROVEITAR COMO CANDIDATO HISTÓRICO.** A Base dos Dados/BDMEP agrega valor para climatologia, comparação temporal, chuva histórica, contexto da Enchente de 2024 e expansão regional. Não usar como fonte de tempo real, previsão ou alerta; não substituir o arquivo direto A887; não integrar ao runtime até o gate técnico e jurídico estar concluído.

Nenhum código, migration, Edge Function, secret, cron, schema de banco ou página pública foi alterado nesta avaliação.
