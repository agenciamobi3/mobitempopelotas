# Historical Data Inventory — adendo INMET / BDMEP

Data: 27/08/2026  
Escopo: reconciliação documental do estado do INMET e registro da Base dos Dados/BDMEP como candidata histórica.  
Runtime alterado: **não**.

## 1. Por que este adendo existe

`docs/HISTORICAL_DATA_INVENTORY.md` foi consolidado em 22/08/2026 e ainda registra, na linha de “INMET — estações automáticas”, que o conjunto não havia sido importado para o arquivo próprio.

Esse ponto ficou desatualizado após a implementação posterior do arquivo histórico da estação A887.

Até a próxima consolidação integral do inventário mestre, este adendo deve ser lido junto com:

- `PROJECT_CURRENT_STATE.md`;
- `docs/HISTORICAL_DATA_INVENTORY.md`;
- `docs/BASE_DOS_DADOS_BDMEP_REVIEW_2026-08-27.md`;
- `supabase/migrations/20260822153000_archive_inmet_a887_hourly_history.sql`;
- `supabase/functions/inmet-historical-backfill/index.ts`.

Quando houver divergência sobre o estado **atual**, `PROJECT_CURRENT_STATE.md` e o código ativo continuam prevalecendo.

## 2. Correção do estado do INMET automático

Estado atual correto:

| Fonte / conjunto | Classe | Estado em 27/08/2026 | Papel |
| --- | --- | --- | --- |
| INMET A887 — Capão do Leão/Pelotas | `observation` | **arquivo horário implementado** | observação histórica direta de referência regional |
| Outros arquivos anuais INMET de estações automáticas | `observation` | expansão ainda não inventariada/implementada | futuro backfill regional selecionado |
| Base dos Dados / BDMEP / INMET | `observation` | **candidata documentada; não integrada** | série diária histórica complementar de estações convencionais |

A afirmação antiga “INMET — estações automáticas: ainda não importado para o arquivo próprio” não deve mais ser usada para descrever a A887.

## 3. A887 permanece separada do BDMEP

O arquivo A887 atual é baseado nos arquivos históricos anuais oficiais do INMET e mantém granularidade horária.

A Base dos Dados/BDMEP possui contrato diferente: o catálogo público descreve dados meteorológicos **diários** de estações **convencionais** do INMET.

Consequência:

> A887 e BDMEP não são duas URLs intercambiáveis para a mesma série.

Não fundir automaticamente:

- estação automática com convencional;
- granularidade horária com diária;
- códigos/locais distintos;
- períodos distintos;
- valores de fontes tratadas por rotas diferentes.

## 4. Nova linha lógica para o inventário executivo

Na próxima consolidação de `docs/HISTORICAL_DATA_INVENTORY.md`, incluir ou refletir a seguinte decisão:

| Fonte / conjunto | Variáveis ou ativos históricos | Classe | Situação | Potencial retroativo | Prioridade |
| --- | --- | --- | --- | --- | --- |
| INMET A887 — automática | temperatura, extremos, umidade, ponto de orvalho, pressão, chuva, vento, direção, rajada, radiação | `observation` | **arquivo horário ativo** | arquivos anuais oficiais conforme disponibilidade da estação | muito alta / em execução |
| Base dos Dados / BDMEP / INMET — convencionais | medições meteorológicas diárias conforme schema efetivamente disponível por estação | `observation` | **candidata aprovada documentalmente; sem ingestão** | catálogo publicado com cobertura geral 2000–31/07/2026; validar por estação | P1 |

## 5. Hierarquia documental aprovada

Para histórico meteorológico observado:

1. observação local direta preservada pelo Tempo Pelotas;
2. INMET oficial direto, quando disponível e adequado;
3. Base dos Dados/BDMEP como acesso/tratamento complementar do acervo INMET;
4. outros acervos observacionais aprovados;
5. reanálise/modelados em `data_class = reanalysis`.

Essa ordem é de preferência/proveniência, não regra para sobrescrever registros existentes.

## 6. Prioridade

A Base dos Dados/BDMEP entra em:

**Prioridade 1 — backfill observacional local/regional.**

Ela não passa à frente da Prioridade 0 de preservar o que já entra continuamente pelos coletores do Tempo Pelotas.

Antes de implementação, aplicar o gate registrado em `docs/BASE_DOS_DADOS_BDMEP_REVIEW_2026-08-27.md`.

## 7. Estado após esta rodada

- A887: já implementada e mantida como fonte direta especializada;
- BDMEP/Base dos Dados: documentada como candidata complementar;
- nenhuma consulta BigQuery criada;
- nenhuma credencial adicionada;
- nenhuma migration criada;
- nenhum coletor criado;
- nenhum cron criado;
- nenhuma rota pública alterada;
- nenhuma regra PRO/Free alterada.

Este adendo pode ser absorvido e removido quando `docs/HISTORICAL_DATA_INVENTORY.md` receber sua próxima consolidação integral.
