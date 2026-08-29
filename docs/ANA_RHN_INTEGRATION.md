# ANA / SNIRH / RHN — integração hidrometeorológica do Tempo Pelotas

Última consolidação: 29/08/2026.

## 1. Estado atual e decisão de produto

A integração ANA/RHN está em **readiness/cross-check somente**. Não há ingestão planejada da estação **LARANJAL 87955001** nesta fase, porque o Laranjal já é coberto por **duas fontes de coleta do projeto**.

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

## 2. Identidade confirmada da estação

Estação validada em serviços públicos oficiais do SNIRH/ANA:

- código: `87955001`;
- nome: LARANJAL;
- tipo: fluviométrica e telemétrica;
- município: Pelotas/RS;
- corpo hídrico: Lagoa dos Patos;
- responsável: UFPel;
- operadora: UFPel;
- parâmetro do último dado público: `Nivel`.

Registro interno:

- fonte: `ana-rhn`;
- station key: `ana-rhn-laranjal-87955001`.

## 3. Contrato público usado para readiness

Origem oficial:

`https://portal1.snirh.gov.br`

Layer de último dado:

`/server/rest/services/SGH/CotasReferencia2/MapServer/2/query`

O adapter `src/lib/hydrology/ana-rhn-public.server.ts` usa HTTPS, host fixo em allowlist, sem token/cookie/API key e timeout curto.

O payload público validado para 87955001 inclui identidade, status da estação, data do último dado, valor e classificação do dado. Ele é usado para **readiness e cross-check**, não para persistência automática.

## 4. Unidade e timezone confirmados

A unidade da leitura de nível/cota foi confirmada como **centímetros**.

Evidência cruzada:

- ArcGIS público: `Ult_Dado = 116.0`, `Data_ult_dado = 2026-08-28T16:22:00Z`;
- consulta diagnóstica oficial: `Nivel = 116.00`, `DataHora = 2026-08-28 13:22:00`;
- documentação atual do HidroWebService: cota adotada em cm.

Consequências:

- `unitStatus=confirmed`;
- `unit=cm`;
- `timezoneStatus=confirmed`;
- `timezone=America/Sao_Paulo`.

O serviço legado usado no diagnóstico não é dependência de runtime.

## 5. Referência vertical permanece não confirmada

O inventário público da estação retorna:

- `Altitude=null`;
- `EscalaNivel=Não`;
- `EscalaNivelInicio=null`;
- `EscalaNivelFim=null`;
- `RegistradorNivel=Não`;
- `EstacaoTelemetrica=Sim`.

O catálogo público `SGH` contém somente `CotasReferencia2` e `EstacaoInventarioFluviometrica`. As duas interfaces foram inspecionadas integralmente para a estação 87955001.

`CotasReferencia2`, inclusive com `outFields=*`, não expõe RN, datum, benchmark, altitude do zero ou referência vertical. `Status_Dado = Sem dados de referencia` refere-se às cotas classificatórias de atenção/normal/estiagem da camada, e não define o datum vertical da régua.

Portanto:

- `verticalReference=null`;
- `verticalReferenceStatus=unconfirmed`;
- não converter `116 cm` em altitude sobre nível do mar;
- não transferir referência de outra estação, outro código ou outro sensor.

Se uma ficha oficial futura fornecer o zero/RN da estação, o metadado pode ser enriquecido, mas isso **não altera sozinho a política de coleta**.

## 6. Relação com as fontes atuais do Laranjal

A coleta operacional do Laranjal já é atendida por duas fontes do projeto. A ANA/RHN não deve ser introduzida como terceira coleta redundante nesta fase.

Seu papel atual é:

- readiness da integração pública;
- cross-check técnico;
- referência futura de inventário/metadados;
- possível fonte complementar somente se houver decisão de produto posterior.

Não usar proximidade numérica entre leituras para concluir equivalência de régua, zero ou datum.

## 7. Monitor operacional

O monitor continua executando `fetchAnaRhnLaranjalPublicSnapshot()` para verificar readiness, mantendo sempre:

`state = implementation`

Esse estado:

- não entra no cálculo do `overall` do portal;
- não expõe `rawValue` na mensagem pública;
- não grava `historical_measurements`;
- pode informar se o endpoint público está respondendo.

A mensagem operacional deve deixar claro que ANA/RHN permanece como readiness/cross-check sem ingestão nesta fase porque o Laranjal já possui duas fontes de coleta. Unidade e timezone estão confirmados; referência vertical permanece não confirmada.

## 8. Historical Data Layer

Estado oficial no Supabase:

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

## 9. Condição para eventual ativação futura

A ativação não faz parte da fase atual. Se for reconsiderada futuramente, deve exigir simultaneamente:

1. decisão explícita de produto justificando uma terceira fonte de coleta para o Laranjal;
2. definição do papel da ANA/RHN: primária, fallback, auditoria ou série histórica;
3. contrato de QC, stale, deduplicação e periodicidade;
4. revisão de governança/redistribuição;
5. confirmação da referência vertical se a apresentação exigir comparação ou transformação entre réguas.

Sem essa decisão, a integração permanece em readiness/cross-check mesmo que todos os metadados técnicos sejam posteriormente fechados.

## 10. Segurança

- não armazenar credenciais em código;
- não automatizar sessão de navegador quando existe contrato público estável;
- não usar serviço legado como runtime;
- não registrar URLs autenticadas, cookies ou tokens;
- falha de API não vira nível zero.

## 11. Referências internas

- `PROJECT_CURRENT_STATE.md`;
- `docs/HISTORICAL_DATA_INVENTORY.md`;
- `src/lib/hydrology/ana-rhn-public.server.ts`;
- `src/lib/status/data-status.server.ts`;
- `src/lib/status/data-status-redemet-probes.server.ts`;
- `tests/ana-rhn-public.test.ts`;
- migrations `register_ana_rhn_historical_source`, `confirm_ana_rhn_unit_timezone` e `defer_ana_rhn_ingestion_by_product_policy`.
