# ANA / SNIRH / RHN — integração hidrometeorológica do Tempo Pelotas

Última consolidação: 06/09/2026.

## 1. Estado atual e decisão de produto

A integração ANA/RHN está em **readiness/cross-check somente**. Não há ingestão planejada da estação pública atual usada pelo adapter, **LARANJAL 87955001**, nesta fase, porque o Laranjal já é coberto por **duas fontes de coleta do projeto**.

Essa é uma decisão de produto, não apenas um bloqueio técnico. Portanto, mesmo que a referência vertical da estação seja descoberta futuramente, a coleta ANA/RHN **não será habilitada automaticamente**. Uma ativação futura exige decisão explícita e revisão do papel da fonte no produto.

Estado obrigatório:

- `collection_enabled=false`;
- `publicMeasurementIngestionEnabled=false`;
- `collectionStrategy=readiness-cross-check-only`;
- `ingestionDeferredByProductPolicy=true`;
- `activationRequiresExplicitProductDecision=true`;
- `coveredByExistingSourceCount=2`;
- zero medições ANA/RHN no arquivo canônico.

A referência vertical continua não confirmada e deve permanecer documentada como limitação semântica, mas **não é mais tratada como o único passo antes de ativar ingestão**.

## 2. Identidade confirmada da estação pública atual

Estação validada na camada pública `CotasReferencia2` do SNIRH/ANA e usada pelo adapter de readiness:

- código: `87955001`;
- nome: LARANJAL;
- tipo operacional no contrato do projeto: leitura pública de nível/cota;
- município: Pelotas/RS;
- corpo hídrico: Lagoa dos Patos;
- responsável: UFPel;
- operadora: UFPel;
- parâmetro do último dado público: `Nivel`.

Registro interno:

- fonte: `ana-rhn`;
- station key: `ana-rhn-laranjal-87955001`.

O payload sanitizado validado no projeto para `87955001` retornou `Nome=LARANJAL`, `Municipio=PELOTAS`, `Responsavel=UFPEL`, `Operadora=UFPEL`, `Parametro=Nivel` e último dado público coerente com o contrato.

### 2.1 A estação histórica 87955000 é outra identidade até prova em contrário

A pesquisa da enchente de 2001 recuperou uma segunda identidade oficial chamada Laranjal:

- código histórico: `87955000`;
- nome: LARANJAL;
- município: Pelotas/RS;
- série de cota documentada no inventário municipal/ANA: 1984–2012;
- responsável no inventário histórico: ANA;
- operação: CPRM;
- série recompilada em relatório municipal registra **2,90 m em 08/10/2001**;
- documentação recente do SGB continua identificando `87955000` como LARANJAL e classifica sua cota como **não nivelada**, lida diretamente na seção de réguas existente.

A própria ANA, em comunicado de maio de 2024 sobre a cheia da Lagoa dos Patos, informou Pelotas como **estação Laranjal, código 87955000**. Já a camada pública `CotasReferencia2` validada pelo Tempo Pelotas em agosto de 2026 retorna `87955001`, sob responsabilidade/operação da UFPel.

**Nenhuma fonte oficial localizada nesta rodada declara que `87955001` é renumeração, substituição, sensor filho ou continuação com o mesmo zero da régua `87955000`.**

Consequência obrigatória:

- não unir as duas séries automaticamente;
- não transferir zero, datum, RN, cota de referência ou histórico entre os códigos;
- não usar uma leitura de `87955001` para recalibrar `87955000`;
- não usar o pico de 2001 da `87955000` como referência classificatória da `87955001`;
- qualquer futura relação entre os códigos exige documento oficial da ANA/SNIRH/SGB ou ficha de estação que explicite continuidade/referencial.

A página `/enchente-2001-pelotas` usa `87955000` apenas como **régua histórica** do evento de 2001. O adapter `ana-rhn-public.server.ts` continua usando `87955001` apenas para **readiness/cross-check atual**. São papéis e identidades separados.

## 3. Contrato público usado para readiness

Origem oficial:

`https://portal1.snirh.gov.br`

Layer de último dado:

`/server/rest/services/SGH/CotasReferencia2/MapServer/2/query`

O adapter `src/lib/hydrology/ana-rhn-public.server.ts` usa HTTPS, host fixo em allowlist, sem token/cookie/API key e timeout curto.

A camada ArcGIS declara suporte a `Query` e expõe, entre outros, os campos `Codigo`, `Parametro`, `Nome`, `Bacia`, `SubBacia`, `Municipio`, `Estado`, `Responsavel`, `Operadora`, `Status_Estacao`, `Data_ult_dado`, `Ult_Dado` e `Status_Dado`.

O payload público validado para `87955001` é usado para **readiness e cross-check**, não para persistência automática.

## 4. Unidade e timezone confirmados para 87955001

A unidade da leitura de nível/cota foi confirmada como **centímetros**.

Evidência cruzada registrada no projeto:

- ArcGIS público: `Ult_Dado = 116.0`, `Data_ult_dado = 2026-08-28T16:22:00Z`;
- consulta diagnóstica oficial: `Nivel = 116.00`, `DataHora = 2026-08-28 13:22:00`;
- documentação atual do HidroWebService: cota adotada em cm.

Consequências:

- `unitStatus=confirmed`;
- `unit=cm`;
- `timezoneStatus=confirmed`;
- `timezone=America/Sao_Paulo`.

Essas confirmações pertencem ao contrato atual de `87955001`. Elas não estabelecem continuidade de zero ou datum com `87955000`.

O serviço legado usado no diagnóstico não é dependência de runtime.

## 5. Referência vertical permanece não confirmada

O inventário público inspecionado para `87955001` retorna:

- `Altitude=null`;
- `EscalaNivel=Não`;
- `EscalaNivelInicio=null`;
- `EscalaNivelFim=null`;
- `RegistradorNivel=Não`;
- `EstacaoTelemetrica=Sim`.

O catálogo público `SGH` contém `CotasReferencia2` e `EstacaoInventarioFluviometrica`. `CotasReferencia2`, inclusive com `outFields=*`, não expõe RN, datum, benchmark, altitude do zero ou referência vertical. `Status_Dado = Sem dados de referencia` refere-se às cotas classificatórias da camada, e não define datum vertical da régua.

Portanto:

- `verticalReference=null`;
- `verticalReferenceStatus=unconfirmed`;
- não converter `116 cm` em altitude sobre nível do mar;
- não transferir referência de outra estação, outro código ou outro sensor;
- a cota histórica de `2,90 m` da `87955000` não fecha essa lacuna da `87955001`.

Se uma ficha oficial futura fornecer zero/RN da estação, o metadado pode ser enriquecido, mas isso **não altera sozinho a política de coleta**.

## 6. Recuperação da série histórica bruta da ANA

A pesquisa de 2001 localizou a cota histórica por uma recompilação oficial/municipal da série ANA e confirmou a identidade `87955000` em documentação recente do SGB. O próximo passo de proveniência é recuperar o arquivo bruto da ANA para outubro de 2001 e os metadados da régua daquele período.

### API moderna

A documentação atual do HidroWebService expõe:

`GET /EstacoesTelemetricas/HidroSerieCotas/v1`

A rota retorna séries de cota de estações convencionais e aceita código de estação + período, limitado a 366 dias por requisição.

O acesso automatizado à API moderna exige cadastro/autorização. A ANA orienta solicitar credenciais pelo e-mail `hidro@ana.gov.br`, fornecendo identificação do usuário/instituição, CPF/CNPJ e e-mail. Nenhuma credencial deve ser criada, simulada ou versionada pelo Tempo Pelotas.

### Serviço legado

O antigo `ServiceANA` ainda publica a definição da operação:

`HidroSerieHistorica`

com parâmetros:

- `codEstacao`;
- `dataInicio`;
- `dataFim`;
- `tipoDados=1` para cotas;
- `nivelConsistencia=1` bruto ou `2` consistido.

A ANA anunciou que esse serviço, já tecnologicamente defasado e redirecionado a base secundária, teria suporte prorrogado somente até **30/06/2026**. Como esta consolidação é de 06/09/2026, ele não deve ser adotado como dependência nova de runtime, mesmo que páginas/definições ainda respondam.

Estratégia correta:

1. solicitar acesso oficial à API HidroWebService moderna;
2. extrair `87955000` para outubro de 2001 em bruto e consistido, preservando flags de consistência;
3. recuperar inventário/ficha da estação e qualquer metadado sobre lances de régua, zero, RN, datum e mudanças de operação;
4. somente depois avaliar comparabilidade com dados modernos;
5. manter `87955001` fora dessa série até a relação oficial entre códigos ser comprovada.

## 7. Relação com as fontes atuais do Laranjal

A coleta operacional do Laranjal já é atendida por duas fontes do projeto. A ANA/RHN não deve ser introduzida como terceira coleta redundante nesta fase.

Seu papel atual é:

- readiness da integração pública `87955001`;
- cross-check técnico;
- referência futura de inventário/metadados;
- pesquisa histórica separada da `87955000`;
- possível fonte complementar somente se houver decisão de produto posterior.

Não usar proximidade numérica entre leituras para concluir equivalência de régua, zero ou datum.

## 8. Monitor operacional

O monitor continua executando `fetchAnaRhnLaranjalPublicSnapshot()` para verificar readiness da `87955001`, mantendo sempre:

`state = implementation`

Esse estado:

- não entra no cálculo do `overall` do portal;
- não expõe `rawValue` na mensagem pública;
- não grava `historical_measurements`;
- pode informar se o endpoint público está respondendo.

A mensagem operacional deve deixar claro que ANA/RHN permanece como readiness/cross-check sem ingestão nesta fase porque o Laranjal já possui duas fontes de coleta. Unidade e timezone estão confirmados para o contrato atual; referência vertical permanece não confirmada.

## 9. Historical Data Layer

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

## 10. Condição para eventual ativação futura

A ativação não faz parte da fase atual. Se for reconsiderada futuramente, deve exigir simultaneamente:

1. decisão explícita de produto justificando uma terceira fonte de coleta para o Laranjal;
2. definição do papel da ANA/RHN: primária, fallback, auditoria ou série histórica;
3. contrato de QC, stale, deduplicação e periodicidade;
4. revisão de governança/redistribuição;
5. confirmação da referência vertical se a apresentação exigir comparação ou transformação entre réguas;
6. se houver uso histórico, resolução documental da relação `87955000` ↔ `87955001` antes de qualquer junção de séries.

Sem essa decisão, a integração permanece em readiness/cross-check mesmo que todos os metadados técnicos sejam posteriormente fechados.

## 11. Segurança

- não armazenar credenciais em código;
- não automatizar sessão de navegador quando existe contrato público estável;
- não usar serviço legado como runtime;
- não registrar URLs autenticadas, cookies ou tokens;
- falha de API não vira nível zero;
- códigos com o mesmo nome de estação não são tratados como a mesma régua sem prova documental.

## 12. Referências externas principais

- ANA, comunicado de maio de 2024: `https://www.gov.br/ana/pt-br/assuntos/noticias-e-eventos/noticias/ana-divulga-dados-de-monitoramento-de-niveis-de-agua-do-lago-guaiba-do-rio-uruguai-e-da-lagoa-dos-patos-rs` — identifica Laranjal/Pelotas como `87955000`;
- SGB/RIGEO, levantamento da cheia de 2024: `https://rigeo.sgb.gov.br/handle/doc/25517` — identifica `87955000` e a cota como não nivelada;
- ANA HidroWebService Swagger: `https://www.ana.gov.br/hidrowebservice/swagger-ui/index.html`;
- ANA, manual de acesso ao HidroWebService: `https://www.gov.br/ana/pt-br/assuntos/monitoramento-e-eventos-criticos/monitoramento-hidrologico/orientacoes-manuais/manuais/manual-hidrowebservice_publica.pdf`;
- ServiceANA legado: `https://telemetriaws1.ana.gov.br/ServiceANA.asmx`.

## 13. Referências internas

- `PROJECT_CURRENT_STATE.md`;
- `docs/FLOOD_2001_WIND_CONTEXT_2026-09-06.md`;
- `docs/HISTORICAL_DATA_INVENTORY.md`;
- `src/lib/hydrology/ana-rhn-public.server.ts`;
- `src/lib/status/data-status.server.ts`;
- `src/lib/status/data-status-redemet-probes.server.ts`;
- `tests/ana-rhn-public.test.ts`;
- `tests/flood-2001-historical-page.test.ts`;
- migrations `register_ana_rhn_historical_source`, `confirm_ana_rhn_unit_timezone` e `defer_ana_rhn_ingestion_by_product_policy`.
