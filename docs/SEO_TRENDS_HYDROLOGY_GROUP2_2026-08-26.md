# Google Trends — Hidrologia, grupo 2: enchentes e alagamentos

Data: 26/08/2026  
Status: evidência de pesquisa — não implementar novas URLs antes da consolidação dos demais grupos  
Documentos relacionados:

- `docs/SEO_SEARCH_INTENT_PLAN_2026-08-26.md`;
- `docs/SEO_TRENDS_EVIDENCE_2026-08-26.md`;
- `docs/SEO_TRENDS_HYDROLOGY_GROUP1_2026-08-26.md`.

## 1. Escopo da coleta

Este segundo grupo comparou, no Google Trends, as seguintes expressões:

- `enchente pelotas`;
- `alagamento pelotas`;
- `lagoa dos patos enchente`;
- `lagoa dos patos cheia`;
- `risco de enchente pelotas`.

Arquivos usados nesta rodada:

- `time_series_BR_20210826-1357_20260826-1357.csv`;
- `by_region_BR_20210826-1357_20260826-1357.csv`;
- `searched_with_top-searches_BR-RS_20210826-1357_20260826-1357.csv`;
- `searched_with_rising-searches_BR-RS_20210826-1357_20260826-1357.csv`;
- HAR do segundo grupo, usado apenas para validar o contexto da comparação e a troca posterior para o recorte `BR-RS`.

O HAR bruto não deve ser versionado. Ele pode conter cookies, tokens e cabeçalhos de sessão. Este documento preserva somente evidências sanitizadas.

## 2. Como interpretar os números

Os valores do Google Trends são índices relativos, não volume absoluto de buscas.

Regras de leitura:

- `100` representa o ponto de maior interesse relativo dentro da comparação;
- `0` não significa necessariamente ausência total de buscas; pode ser arredondamento ou interesse abaixo da escala disponível;
- a tabela `by_region` normaliza a composição dos termos dentro de cada região, portanto um estado com `100` em um termo não deve ser interpretado como tendo mais buscas absolutas que outro estado;
- `Breakout` indica crescimento muito forte no recorte comparado, mas também não fornece volume absoluto.

## 3. Série temporal: comportamento fortemente episódico

A série de cinco anos confirma que a procura por enchente em Pelotas cresce principalmente em momentos de evento hidrológico relevante.

Pontos observados:

| Mês | enchente Pelotas | alagamento Pelotas | Lagoa dos Patos enchente | Lagoa dos Patos cheia | risco de enchente Pelotas |
| --- | ---: | ---: | ---: | ---: | ---: |
| set/2023 | 6 | 2 | 1 | 0 | 0 |
| mai/2024 | 100 | 11 | 14 | 2 | 4 |
| jun/2024 | 7 | 0 | 1 | 0 | 0 |
| jul/2024 | 2 | 0 | 0 | 0 | 0 |
| set/2024 | 2 | 0 | 0 | 0 | 0 |
| out/2024 | 2 | 0 | 0 | 0 | 0 |
| nov/2024 | 1 | 0 | 0 | 0 | 0 |
| abr/2025 | 1 | 0 | 0 | 0 | 0 |
| jun/2025 | 2 | 0 | 0 | 0 | 0 |
| abr/2026 | 1 | 0 | 0 | 0 | 0 |
| jul/2026 | 2 | 0 | 0 | 0 | 0 |
| ago/2026 | 1 | 0 | 0 | 0 | 0 |

A concentração em maio de 2024 é inequívoca. A intenção não deve ser tratada como palavra-chave de volume constante; ela funciona como uma intenção de emergência/evento que pode explodir rapidamente.

## 4. Composição relativa no Rio Grande do Sul

No recorte regional da comparação, o Rio Grande do Sul apresentou:

| Termo | Índice relativo no RS |
| --- | ---: |
| `enchente pelotas` | 71 |
| `alagamento pelotas` | 13 |
| `lagoa dos patos enchente` | 11 |
| `risco de enchente pelotas` | 3 |
| `lagoa dos patos cheia` | 2 |

Leitura:

1. `enchente Pelotas` é claramente a formulação dominante deste conjunto;
2. `alagamento Pelotas` aparece como intenção secundária e pode representar um problema urbano diferente da cheia da Lagoa;
3. `Lagoa dos Patos enchente` possui presença relevante, mas menor;
4. `risco de enchente` e `Lagoa dos Patos cheia` aparecem, porém com baixa escala relativa neste comparativo.

Não concluir a partir dessa tabela que 71 representa 71 buscas ou 71% do volume absoluto.

## 5. Consultas relacionadas no RS: intenção atual

Entre as consultas principais relacionadas a `enchente pelotas` no recorte do Rio Grande do Sul aparecem:

| Consulta | Interesse relativo | Crescimento |
| --- | ---: | ---: |
| `enchente em pelotas` | 100 | +170% |
| `pelotas rs enchente` | 44 | +20% |
| `enchente rs` | 43 | +250% |
| `pelotas enchente hoje` | 22 | +60% |
| `enchente em pelotas hoje` | 10 | Breakout |

Isso confirma uma intenção operacional muito clara: durante eventos, o visitante quer saber se há enchente em Pelotas **agora/hoje**, e não apenas ler uma explicação histórica sobre enchentes.

### Decisão provisória para a intenção atual

Não criar automaticamente `/enchente-pelotas`, `/enchente-pelotas-hoje` e outras variações.

O portal já possui `/situacao-hidrologica-pelotas`, que reúne:

- nível do Laranjal;
- pontos da Lagoa dos Patos;
- Guaíba;
- SACE;
- horário e tendência das leituras;
- chuva e vento;
- explicações sobre diferenças entre estações.

A melhor estratégia, salvo evidência futura em contrário, é reforçar essa URL como resposta canônica para a intenção atual de situação/risco de enchente, sem afirmar que existe enchente quando não houver confirmação.

### Copy que deve ser avaliada depois da consolidação

Sem alterar ainda a produção, avaliar se a página de situação hidrológica precisa de um bloco visível com perguntas na linguagem real de busca, por exemplo:

- `Há enchente em Pelotas hoje?`;
- `Existe risco de enchente em Pelotas?`;
- `A Lagoa dos Patos está subindo?`;
- `Qual é o nível da Lagoa hoje?`.

As respostas devem ser derivadas de dados e comunicados reais. Um nível elevado isolado não deve ser convertido automaticamente em afirmação de enchente ou risco.

## 6. Achado novo: Enchente de 1941 em Pelotas

O segundo grupo revelou uma intenção histórica que não estava no plano inicial.

Consultas relacionadas em ascensão:

| Consulta | Interesse relativo | Crescimento |
| --- | ---: | ---: |
| `enchente 1941 pelotas` | 37 | Breakout |
| `enchente pelotas 1941` | 36 | Breakout |
| `enchente de 1941` | 21 | Breakout |
| `enchente de 1941 pelotas` | 20 | Breakout |
| `enchente em pelotas 1941` | 17 | Breakout |
| `enchente de 1941 em pelotas` | 13 | Breakout |
| `enchente de 1941 em pelotas rs` | 4 | Breakout |

Esse conjunto é semanticamente distinto da situação atual e da enchente de 2024.

## 7. Estado atual do portal em relação a 1941

O portal já possui a página:

`/enchente-2024-pelotas-laranjal`

Ela é uma linha do tempo histórica do evento de 2024 e cita 1941 em vários pontos de comparação, incluindo:

- o recorde histórico do Guaíba;
- referência de 2,88 m no Canal São Gonçalo;
- superação dessa referência durante maio de 2024.

Entretanto, o conteúdo existente não é uma página sobre o evento de 1941 em si. Portanto, ele não responde de forma completa a perguntas como:

- como foi a enchente de 1941 em Pelotas?;
- quais áreas foram atingidas?;
- qual foi o nível do Canal São Gonçalo?;
- qual era a situação da Lagoa dos Patos?;
- como o evento de 1941 se compara ao de 2024?;
- quais registros históricos confiáveis existem?

## 8. Candidata nova: página histórica de 1941

A intenção de 1941 merece entrar no backlog como candidata real a URL própria, mas **não deve ser implementada apenas com base no Trends**.

Candidato de URL:

`/enchente-1941-pelotas`

Candidato de title:

`Enchente de 1941 em Pelotas: o que aconteceu e como se compara a 2024`

Candidato de H1:

`Enchente de 1941 em Pelotas`

Antes de produção, exigir pesquisa documental com fontes históricas/primárias ou institucionais confiáveis. Não completar lacunas com memória coletiva, posts sem fonte ou reprodução automática do conteúdo de 2024.

### Estrutura editorial possível

Somente após validação das fontes:

1. o que aconteceu em 1941;
2. contexto de Pelotas e da Lagoa dos Patos;
3. Canal São Gonçalo e registros de nível disponíveis;
4. regiões atingidas;
5. duração e evolução da cheia;
6. como as informações eram medidas/documentadas na época;
7. comparação cuidadosa com 2024, respeitando diferenças de referência e medição;
8. fontes históricas utilizadas.

A página histórica não deve substituir `/situacao-hidrologica-pelotas` nem `/enchente-2024-pelotas-laranjal`.

## 9. `alagamento Pelotas` deve permanecer separado conceitualmente

`alagamento Pelotas` atingiu 13 na composição relativa do RS e 11 no pico de maio de 2024 na série comparada.

Enchente e alagamento não devem ser tratados automaticamente como sinônimos no produto:

- enchente/cheia pode envolver Lagoa, rios, canais e evolução hidrológica;
- alagamento pode ser urbano e localizado, associado também a drenagem e chuva intensa.

Não criar página nova neste momento. Fazer uma coleta dedicada a `alagamento pelotas` e suas consultas relacionadas antes de decidir se a intenção é atendida por chuva, situação hidrológica, alertas ou uma futura página própria.

## 10. Relação com o grupo 1

Grupo 1 mostrou força para:

- `nível lagoa dos patos`;
- `nível da lagoa dos patos hoje`;
- `nível lagoa dos patos pelotas`.

Grupo 2 acrescenta:

- `enchente em Pelotas`;
- `enchente em Pelotas hoje`;
- `risco de enchente Pelotas`;
- `Lagoa dos Patos enchente`;
- intenção histórica `Enchente de 1941 em Pelotas`.

A arquitetura começa a se separar em três superfícies:

### Atual — medição local

`/nivel-da-lagoa-dos-patos-laranjal`

Responder nível, horário, tendência e atualização da Estação Laranjal.

### Atual — visão regional e risco

`/situacao-hidrologica-pelotas`

Responder situação das águas, evolução regional, Lagoa, Guaíba, SACE, chuva, vento e contexto de risco sem inventar diagnóstico.

### Histórico

- `/enchente-2024-pelotas-laranjal` — existente;
- `/enchente-1941-pelotas` — candidata, condicionada a pesquisa documental própria.

Essa divisão evita que uma página histórica concorra com a página de monitoramento atual.

## 11. Prioridades provisórias após o grupo 2

### P0 — não abrir nova URL de emergência

- preservar `/situacao-hidrologica-pelotas` como candidata a resposta canônica para `enchente em Pelotas hoje` e `risco de enchente Pelotas`;
- depois da consolidação dos grupos, revisar title, H1, abertura e perguntas visíveis dessa página;
- nunca apresentar ausência de dado como ausência de risco.

### P1 — pesquisa histórica de 1941

- levantar fontes confiáveis;
- verificar referências de nível e possíveis diferenças de cota/régua;
- mapear áreas atingidas e cronologia;
- decidir, depois da pesquisa, se `/enchente-1941-pelotas` possui conteúdo suficiente para publicação própria.

### P2 — alagamentos urbanos

- fazer coleta específica para `alagamento pelotas`;
- descobrir consultas como `ruas alagadas`, `alagamento hoje`, bairros, chuva forte e drenagem;
- somente depois decidir arquitetura.

## 12. Regra de segurança editorial

Em páginas atuais sobre cheia/enchente:

- não inferir risco apenas pela palavra-chave pesquisada;
- não inferir enchente por nível isolado sem referência validada;
- diferenciar medição, tendência, alerta oficial, observação e interpretação;
- informar horário e idade do dado;
- priorizar Defesa Civil e comunicados oficiais em situações de segurança;
- manter páginas históricas claramente separadas de estado atual.

## 13. Próximos grupos

Continuar recebendo os grupos planejados antes de alterar produção. Ao final, consolidar tudo em uma matriz única:

`consulta → intenção → URL atual → nova seção/copy → URL nova? → dado/fonte necessário → prioridade`.
