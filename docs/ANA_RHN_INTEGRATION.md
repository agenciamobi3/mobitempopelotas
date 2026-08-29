# ANA / SNIRH / RHN — integração hidrometeorológica do Tempo Pelotas

Última consolidação: 29/08/2026.

Este documento registra o estado técnico e editorial da integração do Tempo Pelotas com a Agência Nacional de Águas e Saneamento Básico (ANA), o Sistema Nacional de Informações sobre Recursos Hídricos (SNIRH) e a Rede Hidrometeorológica Nacional (RHN).

## Estado atual

- O responsável pelo Tempo Pelotas possui acesso autorizado à plataforma integrada da ANA.
- O acesso autenticado ao Sistema HIDRO / Hidrotelemetria foi validado anteriormente.
- A estação **LARANJAL**, código oficial **87955001**, foi confirmada também por um serviço ArcGIS público do SNIRH, sem sessão de navegador.
- A fonte `ana-rhn` e a estação `ana-rhn-laranjal-87955001` já estão registradas no Historical Data Layer oficial do Tempo Pelotas.
- `collection_enabled=false`, `paid_access_allowed=false` e `publicMeasurementIngestionEnabled=false` permanecem obrigatórios nesta fase.
- Há **zero medições ANA/RHN** persistidas no arquivo canônico enquanto unidade, referência vertical e contrato de timezone não estiverem fechados.
- Nenhuma credencial, cookie, senha, sessão ou HAR autenticado deve ser versionado.
- A existência de acesso autorizado não é certificação, homologação, parceria oficial ou endosso editorial da ANA.

## 1. Papel da ANA/RHN no Tempo Pelotas

O HidroWeb integra o SNIRH e reúne séries e inventários da Rede Hidrometeorológica Nacional. O ecossistema distingue, em termos operacionais, acervo/séries do HidroWeb e dados mais recentes/telemétricos de estações.

Para o Tempo Pelotas, a ANA/RHN pode futuramente fornecer:

- nível;
- vazão;
- chuva;
- inventário e metadados de estações;
- séries históricas para validação e Historical Data Layer.

“Dado da RHN” não significa necessariamente “estação operada diretamente pela ANA”. Operadora e entidade responsável precisam permanecer associadas à estação quando a fonte as fornecer.

## 2. Estação LARANJAL confirmada

Identidade atualmente validada:

- nome: **LARANJAL**;
- código: **87955001**;
- município: **Pelotas**;
- estado: **Rio Grande do Sul**;
- parâmetro retornado no serviço público: **Nivel**;
- bacia: **ATLÂNTICO, TRECHO SUDESTE**;
- sub-bacia: **LAGOA DOS PATOS**;
- responsável: **UFPEL**;
- operadora: **UFPEL**;
- status da estação: **Ativo**.

No banco oficial do Tempo Pelotas, essa identidade está registrada como:

- source key: `ana-rhn`;
- station key: `ana-rhn-laranjal-87955001`;
- `integrationStatus=validation`;
- `parameterStatus=unconfirmed` para normalização editorial/canônica, mesmo que o endpoint público informe `Nivel`;
- `unitStatus=unconfirmed`;
- `verticalReferenceStatus=unconfirmed`;
- `timezoneStatus=unconfirmed`;
- `crossValidationOnlyUntilContractClosed=true`.

A migration correspondente é `supabase/migrations/20260829034000_register_ana_rhn_historical_source.sql` e já foi aplicada no Supabase oficial.

## 3. Contrato público ArcGIS validado

Foi validado um endpoint público do SNIRH no serviço:

`https://portal1.snirh.gov.br/server/rest/services/SGH/CotasReferencia2/MapServer/2/query`

A consulta da estação `87955001` respondeu HTTP 200 sem cookie, sessão ou credencial e expôs, entre outros, os campos:

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

Na verificação de 29/08/2026, a estação retornou:

- `Parametro = Nivel`;
- `Ult_Dado = 116.0`;
- `Data_ult_dado = 1787934120000`, correspondente ao instante UTC `2026-08-28T16:22:00.000Z` no transporte ArcGIS;
- `Status_Dado = Sem dados de referencia`.

### Regra crítica

`116.0` é preservado como **valor bruto**, não como `1,16 m` e não como `116 cm` no runtime público.

Há evidência contextual de que cotas ANA são frequentemente expressas em centímetros e o valor é plausível nessa escala, mas isso ainda não substitui a confirmação do contrato específico da série/estação. O Tempo Pelotas não normaliza unidade por plausibilidade.

`Status_Dado = Sem dados de referencia` também impede inferir automaticamente classes como normal, atenção, alerta ou inundação.

## 4. Adapter público de readiness

Arquivo:

`src/lib/hydrology/ana-rhn-public.server.ts`

Objetivo do adapter nesta fase:

- consultar somente o endpoint público ArcGIS;
- usar host HTTPS fixo/allowlist `portal1.snirh.gov.br`;
- validar payload com Zod;
- preservar código, nome, operador, parâmetro, valor bruto, timestamp e status da fonte;
- devolver `unit=null`;
- devolver `verticalReference=null`;
- devolver `publishableMeasurement=false`;
- declarar bloqueios explícitos:
  - `unit-unconfirmed`;
  - `vertical-reference-unconfirmed`;
  - `timezone-contract-unconfirmed`;
- nunca escrever em `historical_measurements`.

O request tem budget curto de 3,5 s e não utiliza token, `api_key`, cookie ou sessão.

Contrato de regressão: `tests/ana-rhn-public.test.ts`, incluído em `test:contracts`.

## 5. Cross-check com a Estação Laranjal já operacional

A página `/nivel-da-lagoa-dos-patos-laranjal` continua usando sua fonte operacional atual e **não muda silenciosamente de referência**.

Próximo ao instante bruto ANA de `2026-08-28T16:22Z`, o arquivo próprio LabHidroSens/UFPel possuía leitura próxima de `1,12 m`. O valor ANA `116.0` é numericamente compatível com a hipótese de centímetros, mas existe diferença suficiente — e, principalmente, referência vertical ainda não confirmada — para proibir equivalência automática.

Esse cross-check serve apenas para orientar investigação de contrato. Não é conversão, calibração ou conciliação de réguas.

## 6. HidroWeb Service oficial

Também foi identificado o HidroWeb Service oficial, com documentação Swagger/manual e famílias de endpoints para:

- inventário de estações;
- série telemétrica detalhada;
- série telemétrica adotada;
- série de cotas;
- série de chuva;
- série de vazão;
- entidades, bacias e metadados relacionados.

A documentação pública indica limites de período por chamada, incluindo janelas menores para séries telemétricas e até 366 dias para série convencional de cotas.

O serviço autenticado deve ser a próxima fonte de verdade para fechar:

1. unidade oficial da série;
2. semântica exata do parâmetro;
3. referência/datum quando fornecido ou documentado;
4. timezone/formato de datas;
5. flags de qualidade/dado adotado;
6. contrato de retenção e uso;
7. diferença entre série telemétrica adotada, bruta e convencional.

Não acoplar o runtime a sessão de navegador se o HidroWeb Service oferecer contrato oficial estável.

## 7. Arquitetura alvo

Fluxo final pretendido:

`ANA / SNIRH / RHN → coletor server-side → validação semântica → normalização → persistência → API sanitizada Tempo Pelotas → páginas públicas`

A integração só passa de `validation` para ingestão quando for possível produzir uma observação equivalente a:

```ts
type HydrometricObservation = {
  stationCode: string;
  stationName: string;
  operator: string | null;
  parameter: "level" | "flow" | "rain" | string;
  value: number;
  unit: string;
  reference: string | null;
  observedAt: string;
  fetchedAt: string;
  status: "live" | "stale" | "unavailable";
  source: "ANA_RHN";
};
```

Sem `unit`, `reference` e contrato temporal confiáveis, o objeto acima não pode ser emitido como medição canônica.

## 8. Persistência e governança

Quando a ingestão for liberada:

- preservar `observedAt` e `fetchedAt` separadamente;
- deduplicar por fonte + estação + variável + classe + horário;
- preservar o código oficial da estação;
- armazenar operadora/responsável em metadata quando aplicável;
- registrar quality/status da fonte sem transformar ausência em zero;
- usar last-good apenas com horário/idade originais;
- manter `paid_access_allowed=false` até revisão específica de retenção, redistribuição, atribuição e uso comercial.

## 9. Comunicação pública

Formulação segura:

> O Tempo Pelotas possui acesso autorizado à plataforma integrada da Agência Nacional de Águas e Saneamento Básico para trabalhar com informações hidrometeorológicas da Rede Hidrometeorológica Nacional. A integração é feita gradualmente, preservando estação de origem, unidade, referência e horário antes de qualquer medição ser publicada.

Evitar:

- “site oficial da ANA”;
- “homologado pela ANA”;
- “certificado pela ANA”;
- “parceiro oficial da ANA”, salvo instrumento específico;
- afirmar que toda estação RHN é operada diretamente pela ANA;
- afirmar que o nível público atual do Laranjal já vem da ANA enquanto a ingestão permanecer desativada.

## 10. Próximos gates

Antes de inserir a primeira linha ANA em `historical_measurements`:

1. confirmar unidade pelo HidroWeb Service oficial;
2. confirmar referência vertical/datum ou documentar formalmente sua ausência;
3. confirmar timezone/semântica temporal;
4. escolher entre série telemétrica adotada, detalhada e/ou série convencional conforme a estação;
5. validar flags de qualidade;
6. documentar limites de requisição e política de uso;
7. implementar fixture do payload autenticado sanitizado;
8. definir freshness/stale por tipo de série;
9. só então habilitar `collection_enabled` e criar o coletor;
10. somente depois avaliar exposição pública/cross-validation.

## 11. Segurança

- nunca versionar senha, cookie, token ou sessão;
- nunca versionar HAR autenticado bruto;
- nunca colocar credenciais ANA em query string, log ou resposta pública;
- secrets ficam exclusivamente no servidor/ambiente;
- não usar automação dependente de sessão de navegador quando existir serviço oficial estável.

## Referências internas

- `PROJECT_CURRENT_STATE.md`;
- `docs/HISTORICAL_DATA_INVENTORY.md`;
- `docs/DEFESA_CIVIL_RS_HYDROMET_PLAN.md`;
- `supabase/migrations/20260829034000_register_ana_rhn_historical_source.sql`;
- `src/lib/hydrology/ana-rhn-public.server.ts`;
- `tests/ana-rhn-public.test.ts`;
- `src/routes/situacao-hidrologica-pelotas.tsx`;
- `src/routes/nivel-da-lagoa-dos-patos-laranjal.tsx`.
