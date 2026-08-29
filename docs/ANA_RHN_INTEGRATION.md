# ANA / SNIRH / RHN — integração hidrometeorológica do Tempo Pelotas

Última consolidação: 29/08/2026.

## 1. Estado atual

A integração ANA/RHN está em **readiness ativo, ingestão bloqueada**.

Já confirmado:

- acesso autorizado à plataforma integrada da ANA;
- estação **LARANJAL**, código oficial **87955001**;
- município Pelotas/RS;
- responsável e operadora UFPel;
- estação fluviométrica e telemétrica ativa no inventário público;
- parâmetro de último dado: `Nivel`;
- unidade da cota/nível: **cm**;
- timezone usado pela série da estação: **`America/Sao_Paulo`**;
- endpoint ArcGIS público do SNIRH utilizável para readiness sem sessão de navegador.

Ainda não confirmado:

- referência vertical/zero da régua da estação 87955001;
- contrato final de ingestão e QC para o Historical Data Layer;
- política de ativação pública da leitura ANA.

Por isso permanecem obrigatórios:

- `collection_enabled=false`;
- `paid_access_allowed=false`;
- `publicMeasurementIngestionEnabled=false`;
- `verticalReferenceStatus=unconfirmed`;
- zero medições ANA/RHN no arquivo canônico.

Nenhuma credencial, cookie, sessão, token ou HAR autenticado deve ser versionado.

## 2. Identidade canônica da estação

Estação adotada para validação:

- código: `87955001`;
- nome: LARANJAL;
- tipo: Fluviométrica;
- município: PELOTAS;
- UF: RIO GRANDE DO SUL;
- rio/corpo hídrico: LAGOA DOS PATOS;
- responsável: UFPEL;
- operadora: UFPEL;
- estação telemétrica: Sim.

Registro no Tempo Pelotas:

- fonte: `ana-rhn`;
- station key: `ana-rhn-laranjal-87955001`.

A migration inicial registra identidade e governança sem inserir leituras. A migration posterior confirma unidade e timezone, mas mantém a referência vertical e a ingestão bloqueadas.

## 3. Contrato público ArcGIS usado para readiness

Origem oficial:

`https://portal1.snirh.gov.br`

Layer validada:

`/server/rest/services/SGH/CotasReferencia2/MapServer/2/query`

O adapter `src/lib/hydrology/ana-rhn-public.server.ts` consulta somente HTTPS, host em allowlist, sem token/API key/cookie e com timeout curto.

Campos usados:

- `Codigo`;
- `Parametro`;
- `Nome`;
- `Bacia`;
- `SubBacia`;
- `Municipio`;
- `Estado`;
- `Responsavel`;
- `Operadora`;
- `Status_Estacao`;
- `Data_ult_dado`;
- `Ult_Dado`;
- `Status_Dado`.

Payload real sanitizado observado para 87955001:

- `Parametro = Nivel`;
- `Ult_Dado = 116.0`;
- `Data_ult_dado = 2026-08-28T16:22:00Z`;
- `Status_Dado = Sem dados de referencia`.

A inspeção do catálogo público `SGH` mostrou somente dois serviços: `CotasReferencia2` e `EstacaoInventarioFluviometrica`. Ambos foram inspecionados integralmente para 87955001.

A consulta `outFields=*` de `CotasReferencia2` confirmou que a feição completa expõe apenas `estcodigo`, identidade da estação, `Projeto`, `Status_Estacao`, `Data_ult_dado`, `Ult_Dado` e `Status_Dado`. Não existe campo de RN, datum, altitude do zero, benchmark ou referência vertical.

`Status_Dado = Sem dados de referencia` se refere às referências usadas pela camada para classificação/limiares — atenção, normalidade e estiagem — e **não deve ser interpretado como prova sobre datum vertical da estação**.

O ArcGIS é usado neste momento para readiness e identidade de último dado, não para inserir automaticamente uma observação pública.

## 4. Unidade confirmada: centímetros

O manual oficial atual do HidroWebService documenta a série telemétrica adotada com:

- chuva adotada em mm;
- **cota adotada em cm**;
- vazão adotada em m³/s;
- timestamp de medição separado de atualização;
- indicadores de qualidade.

Para a estação 87955001, uma consulta diagnóstica ao serviço legado oficial retornou exatamente:

- `Nivel = 116.00`;
- `DataHora = 2026-08-28 13:22:00`.

O ArcGIS público retornou no mesmo evento:

- `Ult_Dado = 116.0`;
- `Data_ult_dado = 2026-08-28T16:22:00Z`.

A igualdade exata de estação, valor e instante conecta o `Ult_Dado` do ArcGIS ao campo de nível/cota documentado em centímetros.

Consequência atual:

- `unitStatus = confirmed`;
- `unit = cm`.

O serviço legado foi usado **somente como evidência cruzada de diagnóstico**. Ele está descontinuado para novas integrações e não deve entrar como dependência do runtime.

## 5. Timezone confirmado: America/Sao_Paulo

O mesmo evento fornece a evidência temporal:

- serviço diagnóstico: `2026-08-28 13:22:00`;
- ArcGIS público: `2026-08-28T16:22:00Z`.

A diferença é exatamente UTC−03:00, correspondente a Pelotas em `America/Sao_Paulo` na data analisada.

Consequência atual:

- `timezoneStatus = confirmed`;
- `timezone = America/Sao_Paulo`.

O Historical Data Layer deve continuar armazenando timestamps canônicos em UTC, preservando o timezone de origem em metadados quando necessário para auditoria/apresentação local.

## 6. Referência vertical ainda bloqueada

Este é o último gate semântico antes da primeira medição ANA.

O inventário público oficial da estação 87955001 retornou:

- `Altitude = null`;
- `EscalaNivel = Não`;
- `EscalaNivelInicio = null`;
- `EscalaNivelFim = null`;
- `RegistradorNivel = Não`;
- `EstacaoTelemetrica = Sim`.

O schema completo de `EstacaoInventarioFluviometrica` também não contém campo de RN, datum ou zero de régua. Somado à inspeção completa de `CotasReferencia2`, o catálogo público SGH disponível foi exaurido sem fornecer a referência vertical específica da estação.

A documentação geral da ANA explica que réguas/cotas fluviométricas se relacionam ao plano de referência e referências de nível da própria estação. Isso não autoriza converter `116 cm` para altitude sobre o nível do mar sem a referência específica do ponto.

Portanto:

- `verticalReference = null`;
- `verticalReferenceStatus = unconfirmed`;
- `publishableMeasurement = false` no adapter de readiness;
- blocker atual: `vertical-reference-unconfirmed`.

Não usar como substituto automático:

- referência de estação histórica com outro código, inclusive `87955000`;
- estação hidrográfica/maregráfica vizinha chamada Laranjal;
- datum documentado para outro sensor UFPel, como Canal São Gonçalo;
- altitude geográfica aproximada;
- correlação visual com a régua LabHidroSens.

Somente evidência específica que ligue a estação 87955001 à sua referência/zero pode fechar esse gate.

## 7. Relação com LabHidroSens / UFPel

A página pública `/nivel-da-lagoa-dos-patos-laranjal` já possui fonte operacional própria e não será alterada silenciosamente.

A observação do LabHidroSens continua sendo tratada segundo a referência própria dessa estação/sensor. A ANA/RHN pode futuramente servir como:

- fonte adicional;
- cross-check;
- série histórica complementar;
- fonte primária somente após contrato formal e validação semântica.

Mesmo quando duas leituras têm valores próximos, não se deve assumir que compartilham o mesmo zero de régua.

## 8. Monitor operacional

O monitor executa `fetchAnaRhnLaranjalPublicSnapshot()` dentro da coleta de status, mas a fonte permanece sempre em:

`state = implementation`

Isso significa:

- readiness pode ser observado;
- falha/intermitência do endpoint não derruba o `overall` do portal;
- nenhum `rawValue` é exposto na mensagem pública do monitor;
- nenhum valor é escrito no Historical Data Layer por esse adapter.

O corte `2026-08-29-ana-rhn-contract-v2` foi validado em produção no domínio canônico:

- `/api/runtime-version`: HTTP 200 com a release v2;
- monitor: HTTP 200, 14 serviços, no mesmo `x-deployment-id`;
- `ana-rhn`: `implementation`;
- detalhe persistido: unidade cm e timezone confirmados, somente referência vertical pendente;
- `/status-dos-dados`: HTTP 200 no mesmo deployment e com a cópia v2;
- arquivo canônico ANA: zero medições.

## 9. Historical Data Layer

Estado oficial no Supabase:

- source `ana-rhn` registrada;
- station `ana-rhn-laranjal-87955001` registrada;
- `unitStatus=confirmed`;
- `unit=cm`;
- `timezoneStatus=confirmed`;
- `timezone=America/Sao_Paulo`;
- `verticalReferenceStatus=unconfirmed`;
- coleta desabilitada;
- uso pago bloqueado;
- ingestão pública desabilitada;
- zero medições ANA/RHN persistidas.

Quando a referência vertical for fechada, a primeira ingestão deverá preservar no mínimo:

```ts
type AnaRhnLevelObservation = {
  stationCode: "87955001";
  stationName: "LARANJAL";
  operator: "UFPEL";
  parameter: "level";
  value: number;
  unit: "cm";
  verticalReference: string;
  observedAt: string;
  sourceTimeZone: "America/Sao_Paulo";
  fetchedAt: string;
  qualityFlag: string;
  source: "ANA_RHN";
};
```

Deduplicação deve usar fonte + estação + variável + classe + `observedAt`.

## 10. Próximo gate

Antes de habilitar ingestão:

1. obter referência vertical/zero específica da estação 87955001, idealmente via ficha oficial ANA/SNIRH ou documentação UFPel da estação;
2. documentar a evidência;
3. decidir se a leitura será publicada como cota relativa de régua ou transformada para outra referência — transformação só se houver metadados suficientes;
4. definir QC/stale e periodicidade;
5. habilitar coleta em migration separada;
6. inserir a primeira observação somente após validação;
7. manter a fonte fora de funcionalidades pagas até revisão de governança/redistribuição.

Até o item 1 ser resolvido, a decisão operacional é manter `verticalReferenceStatus=unconfirmed`, coleta desligada e zero medições.

## 11. Segurança

- não armazenar credenciais em código;
- não automatizar sessão de navegador quando existe contrato de API mais estável;
- não usar o serviço legado como runtime;
- não registrar URLs autenticadas;
- não registrar token OAuth;
- logs devem ser sanitizados;
- falha de API não vira nível zero.

## 12. Referências internas

- `PROJECT_CURRENT_STATE.md`;
- `docs/HISTORICAL_DATA_INVENTORY.md`;
- `src/lib/hydrology/ana-rhn-public.server.ts`;
- `src/lib/status/data-status.server.ts`;
- `src/lib/status/data-status-redemet-probes.server.ts`;
- `tests/ana-rhn-public.test.ts`;
- migrations `register_ana_rhn_historical_source` e `confirm_ana_rhn_unit_timezone`.
