# Google Trends — hidrologia regional — grupo 3

Data: 26/08/2026  
Status: evidência de pesquisa — não implementar automaticamente antes da consolidação dos grupos  
Documentos relacionados:

- `docs/SEO_SEARCH_INTENT_PLAN_2026-08-26.md`;
- `docs/SEO_TRENDS_EVIDENCE_2026-08-26.md`;
- `docs/SEO_TRENDS_HYDROLOGY_GROUP1_2026-08-26.md`;
- `docs/SEO_TRENDS_HYDROLOGY_GROUP2_2026-08-26.md`.

## 1. Escopo da coleta

O terceiro grupo investigou intenções hidrológicas regionais relacionadas ao sistema Guaíba → Lagoa dos Patos → Pelotas/Rio Grande.

Termos comparados no export de cinco anos:

- `nível guaíba`;
- `nível guaíba hoje`;
- `nível canal são gonçalo`;
- `nível lagoa dos patos rio grande`;
- `situação lagoa dos patos`.

Também foi exportado um recorte das últimas 24 horas com os mesmos cinco termos.

O HAR da sessão foi usado somente para confirmar contexto técnico e payloads do Google Trends. O arquivo bruto não deve ser versionado porque pode conter cookies, headers e identificadores de sessão.

A navegação registrada no HAR iniciou em `nível guaíba`, região Brasil, janela de um dia (`date=now 1-d`, `geo=BR`).

## 2. Leitura correta dos índices

Os valores do Google Trends são relativos e normalizados.

Consequências para este grupo:

- `100` representa o pico relativo do conjunto, não cem buscas;
- `0` não prova ausência de pesquisas;
- quando um termo muito maior domina a comparação, termos menores podem ficar abaixo da escala;
- a janela de 24 horas retornando zeros não deve ser interpretada como inexistência de demanda, principalmente para termos regionais de baixo volume;
- `Breakout` indica crescimento muito forte em relação à base anterior, mas não informa volume absoluto.

## 3. Série histórica de cinco anos

### `nível guaíba`

A expressão domina a comparação.

Pontos relevantes do índice mensal:

| Mês | nível guaíba | nível guaíba hoje |
| --- | ---: | ---: |
| 09/2023 | 5 | 2 |
| 11/2023 | 4 | 1 |
| 05/2024 | 100 | 29 |
| 06/2024 | 39 | 10 |
| 07/2024 | 10 | 3 |
| 06/2025 | 45 | 6 |
| 07/2026 | 22 | 4 |
| 08/2026 | 8 | 1 |

A demanda é episódica, mas recorrente. Não ficou restrita à enchente de maio de 2024: surgem novos picos em 2025 e 2026.

### Demais termos comparados

No mesmo export, `nível canal são gonçalo` e `nível lagoa dos patos rio grande` permaneceram abaixo da escala mensal durante todo o período. `situação lagoa dos patos` só marcou índice 1 em maio de 2024.

Isso não é evidência suficiente para declarar que não há busca. O resultado apenas mostra que, quando comparados diretamente com `nível guaíba`, esses termos são muito menores na amostra do Trends.

Decisão: não criar páginas para Canal São Gonçalo ou Lagoa dos Patos em Rio Grande apenas com base neste grupo. Continuar procurando sinais próprios em Search Console, Trends isolado e consultas relacionadas.

## 4. Recorte das últimas 24 horas

O export das últimas 24 horas retornou índice 0 para os cinco termos em todos os intervalos de aproximadamente 16 minutos.

Não usar esse resultado como prova de zero buscas. Para consultas hidrológicas regionais, a granularidade de 24 horas e o mecanismo de normalização do Trends podem não produzir escala suficiente.

O recorte de cinco anos e as consultas relacionadas são mais úteis para decisão editorial neste caso.

## 5. Linguagem real usada para o Guaíba

O relatório de consultas principais/relacionadas mostra uma intenção extremamente operacional.

Principais sinais:

| Consulta | Interesse relativo | Variação |
| --- | ---: | ---: |
| `nível do guaíba` | 100 | +1% |
| `nível guaíba agora` | 37 | +150% |
| `nível do guaíba agora` | 35 | +120% |
| `nível do guaíba hoje` | 25 | +160% |
| `nível do guaíba agora ao vivo` | 17 | Breakout |

Outras formulações encontradas como Breakout:

- `qual o nível do guaíba agora`;
- `nível do guaíba em tempo real`;
- `nível do guaíba hoje ao vivo`;
- `nível do guaíba agora atualizado`;
- `nível do guaíba defesa civil`;
- `nível do guaíba defesa civil agora`;
- `nível guaíba cais mauá`;
- `nível do guaíba agora ana`;
- buscas por MetSul;
- buscas relacionadas a nível dos rios Sinos e Jacuí.

A intenção central não é uma explicação genérica sobre o Guaíba. O visitante quer saber o valor mais recente e se a informação está atualizada.

## 6. O que a primeira dobra de uma futura página deve responder

Se a página dedicada for aprovada, a primeira tela deve responder imediatamente:

1. qual é a última leitura disponível;
2. em que horário ela foi registrada;
3. qual estação/referência está sendo mostrada;
4. se o nível está subindo, baixando ou relativamente estável;
5. qual foi a variação em 24 horas;
6. se o dado está atualizado ou atrasado;
7. qual é a fonte da leitura.

Explicações históricas e metodológicas devem vir depois da resposta operacional.

## 7. `agora`, `ao vivo` e `tempo real`

As expressões `agora`, `ao vivo`, `tempo real` e `atualizado` aparecem porque fazem parte da linguagem real do usuário.

Não transformar essa linguagem em promessa técnica falsa.

Regra proposta:

- `agora` pode ser usado para a intenção da página desde que a interface informe claramente o horário da última leitura;
- preferir `última leitura disponível` e `atualizado às ...` no dado operacional;
- `ao vivo` e `tempo real` não devem sugerir streaming contínuo quando a fonte trabalha com leituras periódicas;
- se a leitura estiver atrasada, isso deve ser explicitado imediatamente e o valor antigo não deve ser apresentado como nível atual.

## 8. Capacidade já existente no portal

O backend atual já possui contrato próprio para o Guaíba.

A implementação de `guaiba.server.ts` oferece, entre outros campos:

- `currentLevel`;
- `updatedAt`;
- `ageMinutes`;
- `trendCmPerHour`;
- `variation24hCm`;
- mínimo/máximo/média do período;
- distância até a referência de inundação;
- série para gráfico;
- estado `live`, `stale` ou `unavailable`;
- referências de Gasômetro e Cais Mauá;
- nome e origem da fonte.

A fonte preferencial atual é MetSul/TideSat para o Cais Mauá, com fallback pelo serviço Nível Guaíba, cuja origem é identificada no código como ANA/SGB.

Isso significa que uma eventual página própria pode nascer de dados operacionais existentes, e não de conteúdo SEO puramente textual.

## 9. Relação com a arquitetura atual

Hoje o dado do Guaíba participa de `/situacao-hidrologica-pelotas`, que funciona como visão regional e explica a relação entre Laranjal, Lagoa dos Patos, Guaíba e rios ligados ao SACE.

Essa página deve continuar existindo como visão de sistema.

A intenção `nível do Guaíba agora/hoje` é suficientemente específica e operacional para ser considerada separadamente, porque uma pessoa que chega procurando o valor atual do Guaíba não está necessariamente buscando uma explicação geral da situação hidrológica de Pelotas.

Portanto, uma página própria não seria automaticamente canibalização se tiver função clara:

- página do Guaíba = leitura atual e evolução do Guaíba;
- situação hidrológica de Pelotas = relação regional entre as águas e impacto potencial sobre Pelotas;
- nível no Laranjal = leitura local da Lagoa dos Patos em Pelotas.

## 10. Candidata de URL

Candidata provisória:

`/nivel-do-guaiba-hoje`

Alternativa a avaliar na consolidação:

`/nivel-do-guaiba`

Não decidir pela URL apenas pelo exact match. A escolha final deve considerar Search Console, canonicalização, longevidade semântica e a forma como o conteúdo será atualizado.

Possível intenção de title:

`Nível do Guaíba hoje: última leitura e tendência`

Possível H1:

`Nível do Guaíba hoje`

A copy só deve ser fechada depois da consolidação dos grupos e da revisão do contrato de dados em produção.

## 11. Expansão geográfica versus ligação hidrológica

Uma página do Guaíba não deve ser tratada automaticamente como expansão do Tempo Pelotas para previsão meteorológica de Porto Alegre.

O Guaíba faz parte do sistema hidrológico que alimenta a Lagoa dos Patos e influencia o contexto observado em Pelotas. Isso cria uma justificativa editorial/técnica própria dentro da frente de águas do portal.

Não usar esta evidência para criar páginas genéricas como `tempo em Porto Alegre`.

## 12. Canal São Gonçalo

Apesar de sua importância hidrológica e histórica para Pelotas, o termo `nível canal são gonçalo` ficou abaixo da escala do Trends nesta comparação.

Não descartar a intenção, mas não criar URL com base somente neste resultado.

Próximas evidências desejáveis:

- Search Console do domínio;
- comparação isolada no Trends sem o Guaíba dominando a escala;
- consultas relacionadas a `canal são gonçalo pelotas`;
- disponibilidade de uma fonte atual, estável e corretamente referenciada para nível operacional.

## 13. Lagoa dos Patos em Rio Grande

`nível lagoa dos patos rio grande` também ficou abaixo da escala nesta comparação.

Rio Grande já participa da rede regional do portal, mas uma página de nível dedicada à cidade só deve ser considerada quando houver combinação de:

- procura real;
- fonte de nível confiável;
- dado atualizado;
- função distinta das páginas municipais e da visão hidrológica regional.

## 14. Prioridade provisória após o grupo 3

### P1 — candidata forte

- página operacional própria para `nível do Guaíba hoje/agora`, condicionada à consolidação final dos grupos e validação de produção das fontes.

### P1 — reforço de produto

- na visão hidrológica atual, tornar mais evidente horário, estado de atualização, tendência e variação de cada leitura;
- usar linguagem simples que responda `agora`, `hoje` e `atualizado` sem prometer streaming contínuo.

### P2 — continuar investigando

- `nível canal são gonçalo`;
- `nível lagoa dos patos rio grande`;
- `situação lagoa dos patos`;
- níveis dos rios Sinos, Jacuí e demais componentes do sistema apenas quando houver relação editorial e dados suficientes.

## 15. Decisão deste grupo

Este grupo não pede a criação imediata de páginas.

Ele estabelece que:

1. `nível do Guaíba` possui demanda claramente maior e recorrente;
2. a linguagem de busca é fortemente orientada a `agora`, `hoje`, `atualizado`, `ao vivo` e `tempo real`;
3. o portal já possui dados suficientes para estudar uma página operacional própria;
4. Canal São Gonçalo e Rio Grande precisam de coleta isolada antes de receber URL;
5. a página regional `/situacao-hidrologica-pelotas` deve continuar sendo a visão de sistema e não ser transformada em uma página genérica do Guaíba;
6. nenhuma promessa de risco, normalidade, segurança, transmissão ao vivo ou dado em tempo real deve ser inferida sem suporte explícito da fonte e do horário da leitura.
