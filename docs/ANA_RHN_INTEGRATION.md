# ANA / SNIRH / RHN — integração hidrometeorológica do Tempo Pelotas

Última consolidação: 06/09/2026.

## 1. Estado atual e decisão de produto

A integração ANA/RHN permanece em **readiness/cross-check somente**. Não há ingestão planejada da estação pública atual usada pelo adapter, **LARANJAL 87955001**, nesta fase, porque o Laranjal já é coberto por **duas fontes de coleta do projeto**.

Essa é uma decisão de produto, não apenas um bloqueio técnico. Portanto, mesmo que a referência vertical seja descoberta futuramente, a coleta ANA/RHN **não será habilitada automaticamente**. Uma ativação futura exige decisão explícita e revisão do papel da fonte no produto.

Estado obrigatório:

- `collection_enabled=false`;
- `publicMeasurementIngestionEnabled=false`;
- `collectionStrategy=readiness-cross-check-only`;
- `ingestionDeferredByProductPolicy=true`;
- `activationRequiresExplicitProductDecision=true`;
- `coveredByExistingSourceCount=2`;
- zero medições ANA/RHN no arquivo canônico.

A pesquisa histórica usa os arquivos Hidro apenas como evidência documental. Ela não altera essa política de runtime.

## 2. Duas identidades LARANJAL, dois papéis operacionais

### 2.1 Estação pública atual 87955001

Estação validada na camada pública `CotasReferencia2` do SNIRH/ANA e usada pelo adapter de readiness:

- código: `87955001`;
- nome: LARANJAL;
- município: Pelotas/RS;
- corpo hídrico: Lagoa dos Patos;
- responsável: UFPel;
- operadora: UFPel;
- parâmetro do último dado público: `Nivel`.

Registro interno:

- fonte: `ana-rhn`;
- station key: `ana-rhn-laranjal-87955001`.

O payload sanitizado validado no projeto para `87955001` retornou `Nome=LARANJAL`, `Municipio=PELOTAS`, `Responsavel=UFPEL`, `Operadora=UFPEL`, `Parametro=Nivel` e último dado público coerente com o contrato.

O MDB fornecido para auditoria registra:

- data de cadastro: **08/06/2026**;
- nome: `LARANJAL`;
- descrição: `TELEMÉTRICA`.

As exportações CSV e TXT fornecidas para `87955001` são ZIPs vazios, sem arquivo de série `Cotas` no pacote. O MDB tem somente 8.192 bytes a mais que o `Banco_Hidro_Vazio.mdb` usado como referência estrutural. Esse tamanho é apenas evidência auxiliar do caráter recente do cadastro e não prova ausência de dados em outros serviços da ANA.

### 2.2 Estação histórica 87955000

A pesquisa da enchente de 2001 recuperou a identidade histórica Laranjal:

- código: `87955000`;
- nome: LARANJAL;
- município: Pelotas/RS;
- responsável no inventário histórico: ANA;
- operação histórica: CPRM;
- série de cota disponível no Hidro;
- documentação recente do SGB classifica sua cota como **não nivelada**, lida diretamente na seção de réguas existente.

A própria ANA, em comunicado de maio de 2024 sobre a cheia da Lagoa dos Patos, informou Pelotas como **estação Laranjal, código 87955000**.

O histórico do MDB registra em **30/04/2026** uma solicitação da CPLAR/SGH para corrigir o tipo/coleta da `87955000` para **F apenas**, retirando `T`, a data de coleta telemétrica e a descrição `TELEMÉTRICA`.

Pouco depois, o MDB da `87955001` registra seu cadastro como `LARANJAL` / `TELEMÉTRICA` em 08/06/2026.

Isso permite refinar a interpretação operacional do Tempo Pelotas:

- `87955000` = identidade convencional/histórica da régua e da série de cotas;
- `87955001` = identidade telemétrica recente usada pelo adapter atual;
- os papéis são relacionados ao mesmo contexto de monitoramento do Laranjal, mas os códigos continuam **separados** no modelo de dados.

Nenhum arquivo analisado estabelece que as duas identidades compartilham o mesmo zero de régua, RN ou datum vertical. Portanto:

- não unir as duas séries automaticamente;
- não transferir zero, datum, RN, cota de referência ou histórico entre os códigos;
- não usar uma leitura de `87955001` para recalibrar `87955000`;
- não usar valores históricos da `87955000` como cotas classificatórias da `87955001`;
- não concatenar as séries apenas porque o nome da estação é o mesmo.

A página `/enchente-2001-pelotas` usa `87955000` apenas como **régua histórica**. O adapter `ana-rhn-public.server.ts` continua usando `87955001` apenas para **readiness/cross-check atual**.

Documento de auditoria: `docs/LARANJAL_HIDRO_EXPORT_AUDIT_2026-09-06.md`.

## 3. Contrato público usado para readiness

Origem oficial:

`https://portal1.snirh.gov.br`

Layer de último dado:

`/server/rest/services/SGH/CotasReferencia2/MapServer/2/query`

O adapter `src/lib/hydrology/ana-rhn-public.server.ts` usa HTTPS, host fixo em allowlist, sem token/cookie/API key e timeout curto.

A camada ArcGIS expõe, entre outros, os campos `Codigo`, `Parametro`, `Nome`, `Bacia`, `SubBacia`, `Municipio`, `Estado`, `Responsavel`, `Operadora`, `Status_Estacao`, `Data_ult_dado`, `Ult_Dado` e `Status_Dado`.

O payload público validado para `87955001` é usado para **readiness e cross-check**, não para persistência automática.

## 4. Unidade e timezone confirmados para 87955001

A unidade da leitura de nível/cota foi confirmada como **centímetros**.

Evidência cruzada registrada no projeto:

- ArcGIS público: `Ult_Dado = 116.0`, `Data_ult_dado = 2026-08-28T16:22:00Z`;
- consulta diagnóstica oficial: `Nivel = 116.00`, `DataHora = 2026-08-28 13:22:00`;
- documentação do HidroWebService: cota adotada em cm.

Consequências:

- `unitStatus=confirmed`;
- `unit=cm`;
- `timezoneStatus=confirmed`;
- `timezone=America/Sao_Paulo`.

Essas confirmações pertencem ao contrato atual de `87955001`. Elas não estabelecem continuidade de zero ou datum com `87955000`.

## 5. Referência vertical permanece não confirmada

O inventário público inspecionado para `87955001` retorna:

- `Altitude=null`;
- `EscalaNivel=Não`;
- `EscalaNivelInicio=null`;
- `EscalaNivelFim=null`;
- `RegistradorNivel=Não`;
- `EstacaoTelemetrica=Sim`.

`CotasReferencia2`, inclusive com `outFields=*`, não expõe RN, datum, benchmark, altitude do zero ou referência vertical. `Status_Dado = Sem dados de referencia` refere-se às cotas classificatórias da camada, e não define datum vertical da régua.

Portanto:

- `verticalReference=null`;
- `verticalReferenceStatus=unconfirmed`;
- não converter `116 cm` em altitude sobre nível do mar;
- não transferir referência de outra estação, outro código ou outro sensor.

## 6. Série histórica 87955000 recuperada diretamente do Hidro

A antiga prioridade de “recuperar o arquivo bruto/consistido” foi concluída com os arquivos fornecidos para auditoria em 06/09/2026.

As exportações `87955000_Cotas.csv` e `87955000_Cotas.txt` são byte a byte idênticas. O cabeçalho define:

- `NivelConsistencia=1` = Bruto;
- `NivelConsistencia=2` = Consistido;
- `MediaDiaria=1` = média diária;
- `TipoMedicaoCotas=1` = Escala;
- `Status=1` = Real;
- `Status=2` = Estimado.

### 6.1 08/10/2001

Para o dia 8 de outubro:

- bruto 07:00: **300 cm**, status Real;
- bruto 17:00: **280 cm**, status Real;
- bruto média diária: **290 cm**, status Real;
- consistido média diária: **190 cm**, status **Estimado**.

Na linha consistida, `Maxima=190`, `DiaMaxima=8` e os status de máxima/mínima/média estão marcados como estimados.

Consequência:

- `2,90 m` permanece como registro da camada bruta;
- `1,90 m` passa a ser mostrado como valor da camada consistida atualmente exportada;
- o portal não escolhe silenciosamente um dos dois;
- a camada consistida não é chamada de “verdade absoluta” sem a memória técnica da correção.

### 6.2 Rastreabilidade da consistência

O histórico do MDB da `87955000` registra em **29/06/2018** que os dados fluviométricos da estação foram alterados no âmbito do **Contrato ANA nº 10/2015**, cujo objeto era a análise de consistência de dados fluviométricos.

Esse registro comprova que houve uma intervenção formal de consistência na série. Ele **não explica**, no texto histórico consultado, por que especificamente o valor de 08/10/2001 foi ajustado em 100 cm.

Próxima lacuna correta: localizar o relatório/entregável técnico do contrato ou outra memória de consistência que documente essa correção.

## 7. Pista de zero da régua e por que não retroprojetá-la

O MDB da `87955000` registra em **05/10/2017** alteração do campo altitude de `5,00 m` para **`-0,02 m`**, descrita como a altitude correspondente ao zero da régua levantado em campo pela entidade operadora.

Em **30/03/2018**, o histórico registra substituição das réguas e numeração dos lances `0–1`, `1–2` e `2–3 m`.

Em 29/06/2018, os dados fluviométricos foram alterados pelo processo de consistência já citado.

Portanto, `-0,02 m` é uma pista cadastral importante, mas **não é aplicado retroativamente a 2001** sem os levantamentos de RN/nivelamento que demonstrem continuidade do referencial entre as configurações da estação.

A documentação operacional da RHN reforça essa cautela ao exigir verificação de RNs, nivelamento geométrico de réguas e manutenção dos elementos físicos das estações.

## 8. Serviço moderno e serviço legado

A documentação do HidroWebService expõe a rota moderna:

`GET /EstacoesTelemetricas/HidroSerieCotas/v1`

O acesso automatizado exige cadastro/autorização. Nenhuma credencial deve ser criada, simulada ou versionada pelo Tempo Pelotas.

O antigo `ServiceANA/HidroSerieHistorica` é tratado apenas como pista histórica. A ANA informou suporte prorrogado somente até **30/06/2026**, portanto ele não deve virar dependência nova de runtime.

Como a série necessária de 2001 já foi obtida pelos arquivos Hidro, não há razão de produto para introduzir o serviço legado no runtime.

## 9. Relação com as fontes atuais do Laranjal

A coleta operacional do Laranjal já é atendida por duas fontes do projeto. ANA/RHN não deve ser introduzida como terceira coleta redundante nesta fase.

Seu papel atual é:

- readiness da integração pública `87955001`;
- cross-check técnico;
- referência futura de inventário/metadados;
- pesquisa histórica separada da `87955000`;
- possível fonte complementar somente se houver decisão de produto posterior.

Não usar proximidade numérica entre leituras para concluir equivalência de régua, zero ou datum.

## 10. Monitor operacional

O monitor continua executando `fetchAnaRhnLaranjalPublicSnapshot()` para verificar readiness da `87955001`, mantendo sempre:

`state = implementation`

Esse estado:

- não entra no cálculo do `overall` do portal;
- não expõe `rawValue` na mensagem pública;
- não grava `historical_measurements`;
- pode informar se o endpoint público está respondendo.

## 11. Historical Data Layer

Estado oficial no Supabase para a estação atual:

- source `ana-rhn` registrada;
- station `ana-rhn-laranjal-87955001` registrada;
- `unitStatus=confirmed`;
- `unit=cm`;
- `timezoneStatus=confirmed`;
- `timezone=America/Sao_Paulo`;
- `verticalReferenceStatus=unconfirmed`;
- `collection_enabled=false`;
- `publicMeasurementIngestionEnabled=false`;
- `collectionStrategy=readiness-cross-check-only`;
- `ingestionDeferredByProductPolicy=true`;
- `activationRequiresExplicitProductDecision=true`;
- `coveredByExistingSourceCount=2`;
- zero medições ANA/RHN persistidas.

A série histórica `87955000` **não é** importada para esse station key e não deve ser anexada a ele por similaridade nominal.

Se a série histórica for importada no futuro, bruto e consistido devem ser preservados como camadas/proveniências distintas, sem sobrescrever silenciosamente um ao outro.

## 12. Condição para eventual ativação futura

A ativação não faz parte da fase atual. Se for reconsiderada futuramente, deve exigir simultaneamente:

1. decisão explícita de produto justificando uma terceira fonte de coleta para o Laranjal;
2. definição do papel da ANA/RHN: primária, fallback, auditoria ou série histórica;
3. contrato de QC, stale, deduplicação e periodicidade;
4. revisão de governança/redistribuição;
5. confirmação da referência vertical se a apresentação exigir comparação ou transformação entre réguas;
6. resolução documental da relação vertical `87955000` ↔ `87955001` antes de qualquer junção de séries.

## 13. Segurança

- não armazenar credenciais em código;
- não automatizar sessão de navegador quando existe contrato público estável;
- não usar serviço legado como runtime;
- não registrar URLs autenticadas, cookies ou tokens;
- falha de API não vira nível zero;
- códigos com o mesmo nome de estação não são tratados como a mesma régua sem prova documental;
- arquivos MDB/CSV/TXT recebidos para pesquisa não são versionados no repositório.

## 14. Referências externas principais

- ANA, comunicado de maio de 2024: `https://www.gov.br/ana/pt-br/assuntos/noticias-e-eventos/noticias/ana-divulga-dados-de-monitoramento-de-niveis-de-agua-do-lago-guaiba-do-rio-uruguai-e-da-lagoa-dos-patos-rs`;
- SGB/RIGEO, levantamento da cheia de 2024: `https://rigeo.sgb.gov.br/handle/doc/25517`;
- ANA HidroWeb: `https://www.snirh.gov.br/hidroweb/`;
- ANA HidroWebService Swagger: `https://www.ana.gov.br/hidrowebservice/swagger-ui/index.html`.

## 15. Referências internas

- `PROJECT_CURRENT_STATE.md`;
- `docs/FLOOD_2001_WIND_CONTEXT_2026-09-06.md`;
- `docs/LARANJAL_HIDRO_EXPORT_AUDIT_2026-09-06.md`;
- `docs/HISTORICAL_DATA_INVENTORY.md`;
- `src/lib/hydrology/ana-rhn-public.server.ts`;
- `src/lib/status/data-status.server.ts`;
- `tests/ana-rhn-public.test.ts`;
- `tests/flood-2001-historical-page.test.ts`;
- migrations `register_ana_rhn_historical_source`, `confirm_ana_rhn_unit_timezone` e `defer_ana_rhn_ingestion_by_product_policy`.
