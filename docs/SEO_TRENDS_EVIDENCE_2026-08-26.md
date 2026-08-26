# Evidências do Google Trends para o plano SEO

Data: 26/08/2026  
Status: evidência de pesquisa — usar em conjunto com Search Console antes de abrir novas URLs  
Documento relacionado: `docs/SEO_SEARCH_INTENT_PLAN_2026-08-26.md`

## 1. Escopo analisado

A análise foi feita a partir de exports do Google Trends enviados em 26/08/2026 e de um HAR da sessão de pesquisa.

Arquivos analisados:

- `searched_with_rising-searches_BR_20250826-1258_20260826-1258.csv`;
- `searched_with_top-searches_BR_20250826-1258_20260826-1258.csv`;
- `searched_with_top-searches_BR_20250826-1256_20260826-1256.csv`;
- HAR da navegação no Google Trends usado apenas para confirmar contexto técnico da consulta.

O HAR bruto não deve ser versionado. Ele contém cookies e headers de sessão do navegador. Este documento registra somente conclusões sanitizadas e não preserva tokens, cookies, identificadores de sessão ou URLs autenticadas.

A consulta principal observada no Trends foi `tempo pelotas`, região Brasil, com janela anual terminando em 26/08/2026.

## 2. Como interpretar os números

Os valores de `search interest` do Google Trends são índices relativos, não volume absoluto de buscas.

Consequências:

- `100` representa o maior interesse relativo dentro do conjunto exportado;
- `1`, `2`, `3` etc. não significam uma, duas ou três buscas;
- `0` não deve ser interpretado automaticamente como ausência de buscas: pode representar interesse muito pequeno após normalização/arredondamento;
- `increase percent` mostra crescimento relativo dentro da comparação do Trends e também não equivale a volume absoluto.

Portanto, os dados servem muito bem para descobrir linguagem e intenções. A decisão final de criar uma URL própria deve considerar também Search Console, qualidade do conteúdo possível e risco de canibalização.

## 3. Confirmação importante: buscas por dia da semana

A hipótese de existir demanda por páginas ou conteúdo direcionado ao dia da semana recebeu evidência direta no relatório de buscas em ascensão relacionado a `tempo pelotas`.

Consultas encontradas:

| Consulta | Interesse relativo | Crescimento |
| --- | ---: | ---: |
| `previsão do tempo para sábado em pelotas` | 0 | +20% |
| `previsão do tempo para sexta-feira em pelotas` | 0 | +20% |

Isso confirma que pessoas realmente formulam a busca usando o nome do dia da semana, em vez de navegar mentalmente pela página de 7 dias.

### Decisão provisória

Não criar sete páginas automaticamente.

Priorizar investigação das intenções:

- sexta-feira;
- sábado;
- domingo;
- fim de semana.

Sexta e sábado já possuem sinal direto no export. Domingo e `fim de semana` ainda precisam de evidência adicional no Trends/Search Console antes de ganhar URL própria.

### Arquitetura a testar

Possíveis URLs, se a demanda for confirmada:

- `/previsao-sexta-feira-pelotas`;
- `/previsao-sabado-pelotas`;
- `/previsao-domingo-pelotas`;
- `/previsao-fim-de-semana-pelotas`.

A URL deve ser permanente e o conteúdo deve avançar semanalmente para o próximo dia correspondente. Não criar URLs datadas descartáveis.

### Copy-base de primeira dobra

Exemplo para sábado:

**H1:** `Previsão do tempo para sábado em Pelotas`

**Abertura:** `Veja como deve ficar o tempo em Pelotas neste sábado, com temperatura, chance de chuva, vento e previsão para manhã, tarde e noite.`

A data real do sábado deve aparecer de forma dinâmica no conteúdo visível quando houver dado confiável.

### Estrutura útil ao visitante

A página por dia deve responder de forma mais direta que uma simples duplicação da previsão semanal:

- resumo do dia;
- manhã;
- tarde;
- noite;
- mínima e máxima;
- chance e volume de chuva;
- vento e rajadas;
- aviso oficial aplicável, quando houver;
- link para radar perto da data;
- link para previsão por hora quando o dia chegar.

Variações semânticas que a mesma página pode responder naturalmente:

- `tempo sábado em Pelotas`;
- `como vai estar o tempo sábado`;
- `vai chover sábado em Pelotas`;
- `temperatura sábado Pelotas`;
- `tempo sábado à tarde`;
- `previsão sábado à noite`.

Não criar uma URL para cada variação.

## 4. Horizonte de 15 dias ganhou prioridade

No relatório de buscas em ascensão:

| Consulta | Interesse relativo | Crescimento |
| --- | ---: | ---: |
| `previsão do tempo pelotas 15 dias` | 1 | +110% |
| `previsão do tempo em pelotas para 10 dias` | 2 | +1% |

A busca de 15 dias apresenta crescimento muito superior dentro deste recorte e reforça a prioridade já registrada em `SEO_SEARCH_INTENT_PLAN_2026-08-26.md`.

Decisão mantida:

- criar uma única página forte `/previsao-15-dias-pelotas`;
- atender 10 dias dentro dessa mesma página;
- não criar `/previsao-10-dias-pelotas` apenas para trocar o número.

## 5. Intenções principais de Pelotas

Top searches do export relacionado a `tempo pelotas`:

| Consulta | Interesse relativo | Crescimento |
| --- | ---: | ---: |
| `previsão tempo pelotas` | 100 | +4% |
| `previsão do tempo` | 97 | 0% |
| `pelotas previsão do tempo` | 96 | -1% |
| `previsão do tempo pelotas` | 96 | -8% |
| `tempo para pelotas` | 26 | +10% |
| `tempo em pelotas` | 24 | +20% |
| `tempo pelotas rs` | 16 | +3% |
| `previsão do tempo em pelotas` | 10 | -2% |

Implicação: a Home deve continuar cobrindo a intenção ampla `tempo/previsão em Pelotas`, sem fragmentar essas variações em páginas diferentes.

## 6. Hoje, amanhã e agora

O export confirma demanda clara e recorrente para horizontes curtos.

Exemplos:

| Consulta | Interesse relativo | Crescimento |
| --- | ---: | ---: |
| `tempo pelotas hoje` | 7 | +8% |
| `tempo pelotas amanhã` | 6 | +3% |
| `previsão do tempo pelotas amanhã` | 5 | +1% |
| `previsão do tempo hoje pelotas` | 5 | +3% |
| `previsão do tempo pelotas hoje` | 5 | +4% |
| `tempo pelotas agora` | 4 | -2% |
| `tempo agora pelotas` | 4 | -2% |
| `tempo agora em pelotas` | 2 | +1% |

Decisão:

- Home continua sendo a intenção `agora`;
- `/tempo-hoje-pelotas` continua sendo `hoje` e `por hora`;
- `/tempo-amanha-pelotas` continua sendo `amanhã`;
- não criar páginas redundantes para variações de ordem das palavras.

## 7. Cidades regionais confirmadas pelo Trends

Consultas em ascensão encontradas:

| Consulta | Interesse relativo | Crescimento |
| --- | ---: | ---: |
| `tempo em rio grande` | 1 | +40% |
| `previsão do tempo rio grande` | 2 | +10% |
| `tempo rio grande` | 3 | +10% |
| `previsão do tempo jaguarão` | 0 | +10% |
| `previsão do tempo capão do leão` | 0 | +9% |

Essas cidades já pertencem ao inventário regional atual. A ação recomendada não é criar outra URL, e sim reforçar a página municipal existente com linguagem de busca simples, conteúdo local próprio e links internos adequados.

## 8. Sinal de expansão geográfica

O export também mostra `tempo porto alegre` com interesse relativo 3 e crescimento +6%, além de `previsão do tempo porto alegre` com interesse relativo 1 e +1%.

Esse sinal não é suficiente, sozinho, para transformar o Tempo Pelotas em portal estadual.

Decisão: monitorar. Expansão para cidades fora da cobertura regional atual deve seguir gate editorial/técnico próprio e não ser feita apenas porque um termo aparece entre consultas relacionadas.

## 9. Eventos meteorológicos e alertas

Duas consultas merecem atenção específica:

| Consulta | Interesse relativo | Crescimento |
| --- | ---: | ---: |
| `ciclone pelotas` | 0 | +250% |
| `alerta precipitação acumulada` | 0 | +30% |

### Ciclone

`ciclone pelotas` foi a consulta com maior crescimento percentual no export.

Isso sugere forte comportamento de busca episódico durante situações meteorológicas relevantes.

Não criar imediatamente uma página que afirme existência de ciclone. Avaliar uma página permanente e factual que possa responder, quando necessário, a perguntas como:

- há ciclone afetando Pelotas?;
- o que os avisos oficiais dizem?;
- qual a previsão de vento e chuva?;
- onde acompanhar radar, satélite e alertas?

Qualquer estado atual deve ser derivado de dados reais e avisos oficiais. A página não pode transformar modelo ou notícia em alerta oficial.

### Precipitação acumulada

Antes de criar uma URL nova, avaliar se `/alertas` e `/chuva-em-pelotas` conseguem responder melhor a essa intenção com seção dedicada e links entre si.

## 10. Buscas por concorrentes e ferramentas meteorológicas

O relatório de ascensão também contém:

- `yr tempo pelotas` +60%;
- `yr pelotas` +50%;
- `clic tempo pelotas` +40%;
- `windguru pelotas` +30%;
- `windy` +30%.

Esses termos não justificam páginas usando marcas concorrentes como alvo artificial.

Eles indicam, porém, o que o visitante procura em outros serviços:

- previsão rápida;
- visualização de vento;
- mapas;
- atualização frequente;
- horizonte estendido.

A resposta correta é melhorar o produto próprio nessas funções, não produzir páginas do tipo `Tempo Pelotas vs Windy` sem necessidade editorial real.

## 11. Evidência ampla de comportamento de busca meteorológica

O terceiro export, mais amplo e não específico de Pelotas, contém:

- `clima para amanhã` com interesse relativo 31 e +20%;
- `previsão do tempo` com interesse relativo 29 e +30%.

Esse arquivo não deve ser tratado como prova de demanda local em Pelotas, mas reforça o comportamento geral de busca orientado a respostas imediatas e ao próximo dia.

## 12. Prioridade SEO revisada após esta evidência

### P0 — aproveitar páginas já existentes

- Home: `tempo em Pelotas`, `tempo para Pelotas`, `agora`;
- hoje/por hora;
- amanhã;
- Rio Grande;
- Jaguarão;
- Capão do Leão;
- outras cidades atuais quando Search Console mostrar demanda.

### P1 — novas frentes com evidência direta

1. `/previsao-15-dias-pelotas`;
2. estudo/validação de página para sábado;
3. estudo/validação de página para sexta-feira;
4. conteúdo de eventos/alertas para `ciclone pelotas` sem inventar ocorrência;
5. reforço da intenção `precipitação acumulada` entre chuva e alertas.

### P2 — validar antes de publicar

- domingo;
- fim de semana;
- demais dias da semana;
- páginas estaduais fora da cobertura regional atual.

## 13. Próxima coleta recomendada no Google Trends

Comparar especificamente, no Brasil e depois no Rio Grande do Sul:

- `tempo sexta`;
- `previsão do tempo sexta`;
- `tempo sábado`;
- `previsão do tempo sábado`;
- `tempo domingo`;
- `previsão do tempo domingo`;
- `tempo fim de semana`;
- `previsão fim de semana`;
- `vai chover sábado`;
- `vai chover domingo`.

Usar `tempo amanhã` e `previsão 7 dias` como referências de escala quando o Trends permitir comparação útil.

Também registrar `Consultas relacionadas` e `Em ascensão` para descobrir a linguagem real usada pelo visitante.

## 14. Regra para incorporar novas evidências

Cada novo lote de sugestões ou Trends deve ser classificado em uma destas ações:

1. página existente já responde;
2. página existente precisa de nova seção/copy;
3. intenção merece URL própria;
4. intenção é episódica e pede página/estado dinâmico;
5. intenção ainda não possui evidência suficiente.

Nenhuma página nova deve nascer apenas da presença de uma palavra-chave. Ela precisa conseguir entregar uma resposta útil, atualizada e diferenciada ao visitante.