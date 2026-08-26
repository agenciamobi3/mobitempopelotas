# SEO + fontes de dados — plano de aplicação por etapas

Data: 26/08/2026  
Status: planejamento técnico-editorial — executar por fases após fechar a rodada de coleta no Google Trends  
Branch de referência: `main`

## 1. Objetivo

Cruzar o plano de intenções SEO com as fontes reais de coleta já existentes no Tempo Pelotas para definir **o que pode ser aplicado imediatamente**, **o que exige adaptação de backend**, **o que depende de nova fonte** e **o que deve permanecer bloqueado até existir evidência ou contrato de dados suficiente**.

Este documento complementa:

- `docs/SEO_SEARCH_INTENT_PLAN_2026-08-26.md`;
- `docs/SEO_TRENDS_EVIDENCE_2026-08-26.md`;
- `docs/SEO_TRENDS_HYDROLOGY_GROUP1_2026-08-26.md`;
- `docs/SEO_TRENDS_HYDROLOGY_GROUP2_2026-08-26.md`;
- `docs/SEO_TRENDS_HYDROLOGY_GROUP3_2026-08-26.md`;
- `docs/OFFICIAL_DATA_SOURCE_POLICY.md`;
- `docs/HISTORICAL_DATA_INVENTORY.md`;
- `docs/ANA_RHN_INTEGRATION.md`;
- `docs/DEFESA_CIVIL_RS_HYDROMET_PLAN.md`;
- `docs/REDEMET_OPERATIONS.md`;
- `PROJECT_CURRENT_STATE.md`.

Princípio central:

> Uma intenção só deve ganhar página própria quando o Tempo Pelotas conseguir respondê-la com dado, contexto ou pesquisa editorial realmente diferenciados. Palavra-chave sem contrato de conteúdo não é motivo suficiente para abrir URL.

## 2. Mapa atual de fontes e papéis

### Meteorologia operacional

#### Embrapa Clima Temperado

Papel atual: **observação local de Pelotas**.

O agregador do portal usa a Embrapa como fonte exclusiva para o bloco de condições atuais quando a leitura está utilizável. Modelo numérico não substitui silenciosamente uma observação ausente.

Usos adequados:

- temperatura observada agora;
- umidade;
- sensação;
- pressão;
- vento;
- acumulados observados;
- extremos diários;
- histórico local conforme o arquivo próprio.

Não usar como previsão futura.

#### Open-Meteo

Papel atual: **previsão detalhada principal**.

O contrato ativo pede hoje `forecast_days=7` e limita a série pública horária usada pelo portal a 24 horas.

Usos adequados:

- previsão por hora;
- previsão diária;
- mínima e máxima;
- chance de precipitação;
- volume de precipitação;
- vento e rajadas;
- nuvens e demais campos de modelo já normalizados.

O Historical Data Layer já arquiva forecast runs ricos do Open-Meteo por ciclos próprios, preservando previsão como `forecast`, não como observação.

#### MET Norway

Papel atual: **contingência de previsão** quando o Open-Meteo não entrega dados utilizáveis.

Não deve ser apresentado como segunda observação atual. É provedor de forecast.

#### INMET

Papéis atuais:

- previsão municipal oficial;
- avisos meteorológicos oficiais;
- estação de referência/metadados;
- futura fonte prioritária de backfill de observação histórica.

Aviso do INMET nunca deve ser inferido a partir de modelo ou de leitura de estação. Severidade, validade, abrangência e instruções pertencem ao aviso oficial.

#### CPPMet / UFPel

Papel atual: **contexto regional de previsão**.

É usado para comparar/qualificar a grade de modelo, não para substituir silenciosamente a previsão detalhada.

### Monitoramento visual e eventos meteorológicos

#### REDEMET / DECEA

Papel atual:

- radar;
- satélite;
- STSC/trovoadas.

STSC é observação de atividade elétrica, não alerta oficial. Radar e satélite permanecem produtos identificados pela estação/produto/horário real da fonte.

### Hidrologia

#### LabHidroSens / UFPel — Estação Laranjal

Papel atual: **medição operacional local do nível na Praia do Laranjal**.

O contrato já fornece:

- nível atual disponível;
- horário da leitura;
- idade da leitura;
- tendência em cm/h;
- variação em 1 h, 6 h e 24 h;
- mínimo, máximo e média da janela;
- série recente;
- estado `live`, `stale` ou `unavailable`.

É a fonte adequada para a intenção local `nível da Lagoa dos Patos hoje em Pelotas/Laranjal`.

#### Rede Monitoramento Lagoa dos Patos

Pontos ativos no contrato atual:

- FURG CCMAR — Rio Grande;
- São Lourenço do Sul;
- Arambaré;
- São José do Norte;
- Itapuã.

O contrato já normaliza nível, horário, tendência, variação em 1/6/24 h, mínimos/máximos e referências próprias de cada estação.

Essas réguas não devem ser comparadas por simples subtração entre si.

#### Guaíba

Contrato atual do portal:

- fonte preferencial: MetSul / TideSat no Cais Mauá;
- fallback: serviço Nível Guaíba, identificado no código com origem ANA/SGB;
- nível atual;
- horário;
- idade da leitura;
- tendência em cm/h;
- variação em 24 h;
- mínimo/máximo/média;
- distância da referência de inundação da própria estação;
- série recente;
- referências separadas para Cais Mauá e Gasômetro;
- estado `live`, `stale` ou `unavailable`.

#### Defesa Civil RS

Integração pública ativa, server-side, via GraphQL oficial.

Pode fornecer, conforme a capacidade real de cada estação:

- nível de rio;
- tendência informada pela própria fonte;
- chuva acumulada em 1, 3, 6, 12, 24, 48, 72, 96, 120, 144 e 168 h;
- temperatura;
- sensação;
- umidade;
- pressão;
- vento;
- rajada;
- direção;
- radiação.

A classificação `HYDROLOGY`, `METEOROLOGY`, `BOTH` ou `UNKNOWN` descreve capacidade de sensores, não risco.

#### ANA / SNIRH / RHN

Acesso autorizado e integração em validação.

Potencial:

- nível;
- vazão;
- chuva;
- acervo HidroWeb;
- telemetria recente pela Hidrotelemetria.

Ainda não deve substituir silenciosamente a fonte atual da Estação Laranjal nem ser usado em produção como se todo o contrato de estação/unidade/referência já estivesse fechado.

### Histórico

O Historical Data Layer já separa:

- `observation`;
- `forecast`;
- `reanalysis`;
- `derived`.

Já preserva Embrapa, extremos diários, hidrologia ambiental e forecast runs do Open-Meteo. INMET histórico, ANA/RHN, boletins Embrapa/UFPel, Defesa Civil Historic e outros conjuntos permanecem frentes de expansão conforme governança de cada dataset.

## 3. Cruzamento intenção -> página -> fonte -> prontidão

| Intenção | Página/destino | Fonte principal | Complementos | Prontidão |
| --- | --- | --- | --- | --- |
| tempo agora | `/` | Embrapa | Open-Meteo/MET Norway apenas para forecast; INMET/CPPMet contexto | pronta |
| tempo hoje | `/tempo-hoje-pelotas` | Embrapa + Open-Meteo | INMET, CPPMet, alertas | pronta |
| previsão por hora | `/tempo-hoje-pelotas` | Open-Meteo | MET Norway fallback | pronta |
| amanhã | `/tempo-amanha-pelotas` | Open-Meteo | INMET e CPPMet | pronta |
| 7 dias | `/previsao-7-dias-pelotas` | Open-Meteo | MET Norway, INMET e CPPMet no período em que houver sobreposição | pronta |
| 10/15 dias | `/previsao-15-dias-pelotas` | Open-Meteo em consulta estendida dedicada | fontes oficiais apenas como contexto nos dias cobertos | exige adaptação de backend |
| sexta/sábado/domingo | páginas por dia, se aprovadas | mesmo dataset diário estendido | hourly quando o dia estiver próximo; INMET/CPPMet/alertas quando aplicáveis | exige rota/camada editorial, não novo coletor principal |
| 20/30 dias | `/previsao-30-dias-pelotas` | ainda sem contrato de longo prazo aprovado | 15 dias detalhados como ponte | bloqueada até nova camada de tendência |
| nível Lagoa dos Patos hoje | `/nivel-da-lagoa-dos-patos-laranjal` | LabHidroSens/UFPel | ANA/RHN futuramente como validação/complemento | pronta para otimização |
| situação Lagoa / águas | `/situacao-hidrologica-pelotas` | Laranjal + rede Lagoa + Guaíba + Defesa Civil RS | SACE e ANA/RHN conforme contratos vigentes | pronta para otimização |
| enchente em Pelotas hoje | `/situacao-hidrologica-pelotas` | mesmas fontes hidrológicas | INMET para avisos meteorológicos | pronta para bloco de resposta, sem diagnóstico automático |
| nível do Guaíba hoje | futura página própria | MetSul/TideSat + Nível Guaíba fallback | Defesa Civil/ANA apenas quando referência/estação forem compatíveis e validadas | fonte pronta; página P1 |
| nível Canal São Gonçalo | não decidido | nenhuma fonte operacional dedicada validada no contrato atual | Defesa Civil/ANA podem futuramente fornecer estação aplicável | bloqueada por fonte |
| nível Lagoa em Rio Grande | avaliar futura página | FURG CCMAR da rede Lagoa | Defesa Civil/ANA se houver estação compatível | dado existe; demanda ainda insuficiente |
| precipitação acumulada | `/chuva-em-pelotas` + `/alertas` | Embrapa observado + Open-Meteo previsto | Defesa Civil acumulados; INMET aviso oficial | pronta para enriquecimento |
| ciclone em Pelotas | ainda não abrir URL | REDEMET para observação visual + Open-Meteo/INMET/CPPMet para meteorologia | INMET para avisos oficiais | bloqueada para afirmação de ciclone sem fonte/classificação explícita |
| enchente de 1941 | futura `/enchente-1941-pelotas` | pesquisa documental | comparação cuidadosa com 2024 | bloqueada até pesquisa histórica |
| cidades existentes | `/tempo-em/{slug}` | Open-Meteo por coordenada real | INMET municipal | pronta para otimização editorial |
| Camaquã | candidata regional | Open-Meteo + INMET | contexto editorial local | pode entrar em `draft`, respeitando publication gate |
| Cassino | futura localidade | Open-Meteo por coordenada própria | INMET de Rio Grande para avisos territoriais quando aplicável | exige contrato de localidade |

## 4. Etapa 0 — fechar a pesquisa antes de abrir novas URLs

Objetivo: terminar os HARs/exports pendentes e congelar o mapa de intenção.

Ainda investigar isoladamente:

- Canal São Gonçalo;
- alagamento urbano em Pelotas;
- chuva acumulada;
- ciclone/temporal/vento forte;
- perguntas completas (`a lagoa está subindo?`, `tem risco de enchente?`, `quanto choveu?`);
- sexta, sábado, domingo e fim de semana;
- Rio Grande/Lagoa isolado, sem o Guaíba dominar a escala.

Saída da etapa:

`consulta -> intenção -> URL -> fonte -> dado necessário -> prontidão -> prioridade`.

Nenhuma URL nova precisa ser publicada durante essa etapa.

## 5. Etapa 1 — ganhar SEO usando apenas ativos e fontes que já existem

É a etapa de menor risco e melhor relação retorno/esforço.

### 5.1. Lagoa dos Patos / Laranjal

Refinar `/nivel-da-lagoa-dos-patos-laranjal` para responder imediatamente:

1. última leitura;
2. horário;
3. idade da leitura;
4. subindo/baixando/estável quando a série sustentar;
5. variação 1 h / 6 h / 24 h;
6. fonte.

A página já possui todos esses campos no backend. O trabalho é principalmente de hierarquia visual, title/H1/copy e testes.

Não criar URLs redundantes com `hoje`, `Pelotas` ou `agora`.

### 5.2. Situação hidrológica / enchente hoje

Fortalecer `/situacao-hidrologica-pelotas` sem transformá-la em painel alarmista.

Criar blocos de pergunta/resposta como:

- `Há enchente em Pelotas hoje?`;
- `Existe risco de enchente em Pelotas?`;
- `A Lagoa dos Patos está subindo?`;
- `Como estão Guaíba, Lagoa e Laranjal?`.

Regra: resposta só pode usar fatos que os dados e avisos sustentem. Ausência de transmissão não significa situação normal.

### 5.3. Chuva acumulada

Antes de abrir URL nova, enriquecer `/chuva-em-pelotas` e `/alertas`.

Combinar claramente:

- observado: Embrapa;
- acumulados regionais: Defesa Civil RS quando presentes;
- previsto: Open-Meteo;
- aviso oficial: INMET.

Nunca somar observado e previsto como se fossem uma mesma série sem rótulo.

### 5.4. Cidades já existentes

Priorizar Rio Grande, Canguçu, Dom Pedrito, Jaguarão, Capão do Leão e outras cidades que Trends/GSC confirmarem.

Não precisa de novo coletor: usar coordenadas reais no Open-Meteo e avisos INMET do município, enriquecendo apenas a camada editorial local.

## 6. Etapa 2 — novas páginas sustentadas por dados já disponíveis ou adaptação pequena

### 6.1. Previsão de 15 dias

Criar uma consulta Open-Meteo específica para a rota estendida.

Regra arquitetural:

- não mudar o `forecast_days=7` global para todo o portal;
- criar serviço/função própria para 15 dias;
- manter o fluxo atual de Home/Hoje/Amanhã/7 dias leve;
- normalizar a série estendida no mesmo vocabulário de `DailyForecast` ou contrato derivado compatível;
- cache próprio;
- timeout próprio;
- fallback seguro;
- nenhuma data ausente vira zero.

INMET e CPPMet podem aparecer como contexto quando cobrirem datas coincidentes, mas não devem ser usados para inventar dias 8–15 ausentes.

### 6.2. Páginas de sexta/sábado

Não exigem um novo provedor.

Derivação recomendada:

- quando o dia estiver a mais de 24 h: usar previsão diária;
- quando entrar na janela de 24 h: acrescentar manhã/tarde/noite a partir da série horária;
- quando houver aviso INMET que cubra o período: mostrar o aviso oficial separadamente;
- CPPMet/INMET podem fornecer contexto, mas o card operacional permanece ligado ao dataset principal.

A URL é permanente e sempre aponta para a próxima ocorrência do dia correspondente.

Só publicar os dias que a pesquisa final justificar.

### 6.3. Nível do Guaíba

A fonte já está tecnicamente pronta para uma página operacional própria.

Primeira dobra deve mostrar:

- última leitura;
- horário;
- estação usada;
- estado de atualização;
- tendência;
- variação em 24 h;
- referência aplicável da própria estação;
- gráfico recente;
- fonte original.

Candidato de canonical durável: `/nivel-do-guaiba`.

Title/H1 podem trabalhar `hoje` sem amarrar o path ao tempo.

A página não representa expansão meteorológica para Porto Alegre; ela pertence ao eixo hidrológico Guaíba -> Lagoa dos Patos -> Pelotas.

## 7. Etapa 3 — histórico e patrimônio editorial

### Enchente de 1941

Só produzir depois de pesquisa documental própria.

Fontes a procurar/validar antes de escrever:

- arquivos institucionais;
- acervo de jornais/documentos históricos;
- ANA/SNIRH/HidroWeb quando houver série aplicável;
- registros UFPel/Embrapa/instituições locais;
- bibliografia técnica;
- documentos municipais/estaduais.

Não usar a linha do tempo de 2024 como substituto de pesquisa de 1941.

Estrutura final pode comparar 1941 e 2024, mas somente depois de verificar diferenças de régua, referência, local e metodologia.

O Historical Data Layer pode futuramente armazenar séries históricas normalizadas, mas a página editorial precisa citar a fonte documental de cada afirmação histórica relevante.

## 8. Etapa 4 — páginas que exigem nova camada de dados

### 8.1. Previsão de 30 dias

Bloquear implementação até existir uma fonte/subsistema específico de tendência de semanas 3–4.

A página não pode ser construída apenas estendendo cards diários.

Contrato desejado:

- dias 1–15: previsão diária detalhada;
- dias 16–30: tendência semanal/subsemanal;
- categorias simples para temperatura e chuva;
- grau de incerteza explícito;
- fonte/modelo identificados;
- metodologia separada.

O dataset de longo prazo deve entrar como fonte própria, sem contaminar `WeatherHomeData` nem o pipeline curto já resiliente.

### 8.2. Canal São Gonçalo

Só considerar página operacional depois de validar uma estação/fonte estável com:

- código;
- localização;
- unidade;
- referência vertical;
- timestamp;
- atualização;
- histórico mínimo;
- termos de uso.

ANA/RHN e Defesa Civil RS são candidatos de investigação, não uma garantia de que o contrato específico já está pronto.

### 8.3. Ciclone

REDEMET, Open-Meteo, CPPMet e INMET permitem mostrar efeitos meteorológicos e observações, mas não são automaticamente um contrato de classificação de `há ciclone` para Pelotas.

Antes de uma URL permanente afirmar situação de ciclone, definir fonte explícita para identificação/classificação do sistema.

Enquanto isso, fortalecer `/alertas`, `/radar-e-satelite-pelotas`, `/vento-em-pelotas` e `/chuva-em-pelotas` para absorver a demanda de evento.

## 9. Etapa 5 — expansão geográfica controlada

### Camaquã

Pode entrar primeiro como `draft` porque a previsão por coordenada e o aviso municipal são tecnicamente possíveis.

Seguir `docs/REGIONAL_CITY_PUBLICATION_GATE.md` antes de qualquer indexação.

### Cassino

Não cadastrar como município.

Criar primeiro um contrato de `localidade` com:

- nome;
- município pai;
- coordenadas próprias;
- descrição territorial;
- fonte de forecast por coordenada;
- regra de alertas herdados do município quando aplicável;
- canonical e breadcrumbs coerentes.

Depois avaliar `/tempo-no-cassino-rs`.

### Porto Alegre, Santa Maria, Uruguaiana

Não abrir como simples consequência do Trends. Exigem decisão de produto sobre abrangência estadual.

## 10. Ordem recomendada de implementação após fechar os HARs

### Rodada A — sem novo coletor

1. refinar Lagoa/Laranjal;
2. refinar situação hidrológica para perguntas de enchente/risco;
3. enriquecer chuva acumulada/alertas;
4. otimizar cidades existentes com demanda;
5. reforçar links internos entre essas superfícies.

### Rodada B — pequena adaptação de dados

1. serviço dedicado de forecast 15 dias;
2. `/previsao-15-dias-pelotas`;
3. primeira página por dia da semana aprovada (provavelmente sábado);
4. segunda página por dia aprovada (provavelmente sexta-feira);
5. página operacional do Guaíba.

### Rodada C — conteúdo documental

1. pesquisa de 1941;
2. página histórica se as fontes forem suficientes;
3. comparação 1941 x 2024 com referências explícitas;
4. links cruzados com situação hidrológica atual e histórico 2024.

### Rodada D — fontes novas/contratos novos

1. camada de tendência 16–30 dias;
2. `/previsao-30-dias-pelotas`;
3. Canal São Gonçalo, se houver fonte operacional validada;
4. event page de ciclone apenas se houver fonte adequada de classificação;
5. Rio Grande nível próprio se a demanda isolada justificar.

### Rodada E — expansão territorial

1. Camaquã em `draft` -> `basic` -> `complete`;
2. contrato de localidade e Cassino;
3. nova avaliação de expansão estadual pelo GSC/Trends.

## 11. Regras de degradação por página

Toda página nova deve nascer com estado degradado explícito.

### Forecast

- fonte principal falhou: usar fallback compatível quando existir;
- fallback também falhou: mostrar indisponibilidade, não valores antigos como atuais;
- previsão antiga só pode permanecer se estiver rotulada como tal e o contrato permitir.

### Hidrologia

- leitura atrasada: mostrar valor com horário + estado atrasado;
- fonte indisponível: não inferir normalidade;
- outra estação: nunca transferir limiar/referência automaticamente;
- `agora`, `hoje`, `ao vivo`, `tempo real`: usar linguagem compatível com a cadência real da fonte.

### Alertas

- classificação e severidade somente da fonte oficial;
- modelo, radar, STSC ou nível não criam alerta por conta própria.

## 12. Critério de liberação de uma URL nova

Antes de colocar uma nova página em `PUBLIC_ROUTES`/sitemap, exigir:

1. intenção distinta comprovada;
2. fonte principal definida;
3. fallback ou estado indisponível definido;
4. unidade/timestamp/referência validados;
5. primeira dobra útil sem texto genérico;
6. canonical própria e sem canibalização;
7. links internos de entrada e saída;
8. copy de fonte/metodologia correta;
9. testes de rota/SEO/dados;
10. mobile validado;
11. atualização de `PROJECT_CURRENT_STATE.md` quando a rota realmente for publicada.

## 13. Síntese de prontidão

### Pode começar assim que a pesquisa fechar

- otimização Laranjal;
- situação hidrológica/enchente hoje;
- chuva acumulada;
- cidades existentes;
- 15 dias;
- Guaíba;
- dias da semana aprovados.

### Depende de pesquisa/editorial

- enchente de 1941;
- alagamento urbano;
- Rio Grande nível próprio;
- Cassino como localidade.

### Depende de nova fonte/contrato técnico

- 30 dias;
- Canal São Gonçalo operacional;
- afirmação específica de ciclone/evento sinótico.

Essa separação deve impedir que o plano SEO empurre o produto a publicar páginas vazias, dados com semântica errada ou afirmações que as fontes atuais não sustentam.