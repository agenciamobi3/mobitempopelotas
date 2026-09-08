# Gate de referência vertical ANA / RHN 87955001

Data: 08/09/2026

## Objetivo

Registrar quais evidências existem e quais ainda faltam antes de qualquer uso público da medição de nível da estação ANA/RHN `87955001` no Tempo Pelotas.

A conclusão desta rodada é objetiva: **o gate permanece fechado**.

A estação fornece uma leitura numérica de nível em centímetros no serviço público usado para readiness, mas ainda não existe documentação recuperada suficiente para ligar essa leitura a um zero de régua, RN ou datum vertical específico e verificável.

## O que já está confirmado

Para `87955001`:

- código: `87955001`;
- nome: `LARANJAL`;
- município: Pelotas/RS;
- responsável e operadora: UFPel no contrato público já validado;
- parâmetro: `Nivel`;
- unidade: `cm`;
- timezone operacional usado pelo adapter: `America/Sao_Paulo`;
- cadastro recente como identidade telemétrica;
- leitura pública existe no endpoint de readiness;
- nenhuma medição ANA é persistida ou publicada pelo Tempo Pelotas.

Isso é suficiente para readiness e cross-check técnico. Não é suficiente para declarar a referência vertical da leitura.

## Evidência dos HARs ANA/SNIRH

Os HARs enviados durante a investigação foram analisados localmente e não são versionados no repositório.

### Hidro-Telemetria

O tráfego capturado mostra navegação pelo Hidro-Telemetria e registra a existência de uma página pública identificada como `EstacoesCadastro.aspx`, apresentada pela interface como ficha de estação.

O mesmo conjunto de tráfego identifica a estação `87955001` no acompanhamento de PCDs.

Porém, a captura disponível não preservou o corpo da ficha de estação com um eventual quadro de RNs, nivelamentos ou altitude do zero da régua. Portanto, a existência da tela não é prova de que o documento necessário foi recuperado.

### CotasReferencia2

O mapa público consulta `SGH/CotasReferencia2/MapServer/2` solicitando os campos:

- bacia;
- código;
- data do último dado;
- estado;
- município;
- nome;
- operadora;
- parâmetro;
- projeto;
- responsável;
- status do dado;
- status da estação;
- sub-bacia;
- último dado;
- identificador interno da estação.

Não aparecem nessa consulta campos de:

- RN;
- benchmark;
- altitude do zero da régua;
- datum vertical;
- cadeia de nivelamento;
- relação vertical com a estação histórica `87955000`.

Por isso, o endpoint de último dado não pode fornecer sozinho a evidência vertical exigida pelo produto.

## WGS 84 do mapa não é datum vertical da régua

Requests cartográficos do ArcGIS carregam definições como `WGS_1984`/`D_WGS_1984` na referência espacial do mapa.

Esses valores descrevem o sistema de coordenadas usado para posicionar geometrias no mapa. Eles **não** definem a referência vertical da leitura hidrológica e não autorizam converter `Ult_Dado` em altitude sobre nível do mar.

O Tempo Pelotas não trata CRS cartográfico como datum da régua.

## Inventário cadastral não fecha o gate

A ficha pública de inventário da `87955001` pode trazer campos cadastrais como localização, responsável, operadora, instrumentos e `Altitude` quando disponível.

`Altitude` do inventário não é aceita automaticamente como altitude do zero da régua.

Na evidência já consolidada para `87955001`, a referência vertical específica permanece não confirmada. A ausência de `EscalaNivel` ou de um campo público de RN impede inferir equivalência com outra régua.

## A pista histórica da 87955000 não é transferível

O histórico da estação `87955000` registra em 2017 uma alteração cadastral para `-0,02 m`, descrita no material recuperado como altitude do zero da régua levantado em campo.

Esse registro é uma pista válida para a identidade histórica, mas não pode ser transferido para `87955001` porque ainda não foi recuperada documentação que prove:

- o mesmo RN;
- o mesmo zero físico;
- a mesma cadeia de nivelamento;
- continuidade vertical entre a régua convencional/histórica e o sensor telemétrico atual.

A proximidade física, o mesmo nome `LARANJAL` ou valores numericamente próximos não substituem essa prova.

## Regra operacional codificada

`src/lib/hydrology/ana-rhn-public.server.ts` mantém:

- `verticalReference=null`;
- `publishableMeasurement=false`;
- zero ingestão pública da leitura ANA.

A partir desta auditoria, o snapshot explicita três bloqueios independentes:

1. `vertical-reference-unconfirmed`;
2. `station-specific-leveling-not-recovered`;
3. `historical-current-vertical-continuity-unproven`.

O objeto `verticalReferenceEvidence` também mantém como `false`:

- zero da régua específico documentado;
- RN específico documentado;
- nivelamento específico recuperado;
- continuidade vertical com `87955000` documentada;
- uso de `Altitude` do inventário como zero da régua;
- presença de referência vertical na camada `CotasReferencia2`.

O status do dado recebido da ANA, inclusive se vier como normal/aprovado, não remove esses bloqueios.

## Evidência mínima para reconsiderar o gate

A medição ANA só pode ser reavaliada se surgir documentação específica da `87955001`, por exemplo:

- ficha de campo ou ficha de estação com RN e nivelamento aplicáveis ao sensor;
- memória de nivelamento ligando o zero/sensor a um RN identificado;
- documento oficial ANA/UFPel que declare explicitamente a referência vertical da telemetria;
- documento técnico que estabeleça, se for o caso, continuidade vertical entre `87955000` e `87955001`.

Uma leitura numérica, coordenada geográfica, `Altitude` cadastral isolada, WGS 84 do mapa ou status de qualidade do dado não atendem esse gate.

## Decisão de produto continua separada

Mesmo que a referência vertical seja documentada futuramente, a ANA não entra automaticamente como terceira fonte pública do Laranjal.

O produto atualmente já possui:

1. LabHidroSens/UFPel como prioridade enquanto `live`;
2. CIEX/FURG `sensor_7` como alternativa quando a fonte principal atrasa ou falha.

Qualquer futura ativação ANA exige também uma decisão explícita de produto sobre seu papel: auditoria, fallback, fonte primária ou outro uso claramente definido.

## Próxima investigação documental

Prioridade:

1. recuperar a ficha de estação/ficha de campo específica da `87955001`;
2. procurar documentos de nivelamento/RNs associados ao ponto Laranjal;
3. verificar se existe documento da UFPel ou ANA sobre instalação e referência do sensor telemétrico cadastrado em 2026;
4. manter o gate fechado enquanto essa evidência não existir.

Nenhum secret, cookie, ViewState, URL autenticada ou conteúdo sensível dos HARs deve ser versionado durante essa investigação.
