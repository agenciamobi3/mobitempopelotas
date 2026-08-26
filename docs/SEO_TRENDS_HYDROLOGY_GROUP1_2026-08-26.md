# Google Trends — grupo 1: nível da Lagoa dos Patos

Data: 26/08/2026  
Status: evidência parcial — consolidar com os próximos grupos antes de implementar mudanças SEO  
Documento relacionado: `docs/SEO_TRENDS_EVIDENCE_2026-08-26.md`

## 1. Escopo desta coleta

Este documento registra somente o primeiro grupo da coleta ampliada no Google Trends, voltado à intenção de acompanhar o nível da Lagoa dos Patos.

Arquivos recebidos:

- HAR da sessão do Google Trends, usado de forma sanitizada;
- série temporal Brasil, janela de cinco anos, de agosto de 2021 a agosto de 2026;
- comparação por região para o Brasil.

O HAR bruto não deve ser versionado nem copiado para o repositório porque contém cookies e headers de sessão. Nenhum cookie, token, identificador de sessão ou cabeçalho autenticado foi preservado neste documento.

O HAR contém também interações transitórias feitas durante a navegação. Para não misturar grupos, as conclusões quantitativas abaixo usam como fonte principal os dois CSVs exportados para a comparação final de cinco termos.

## 2. Termos comparados

1. `nível lagoa dos patos`;
2. `nível da lagoa dos patos hoje`;
3. `nível lagoa dos patos pelotas`;
4. `nível lagoa dos patos laranjal`;
5. `nível da lagoa em pelotas`.

Os valores do Google Trends são índices relativos e não volume absoluto de buscas. Um valor `0` pode significar interesse abaixo do limiar de normalização/arredondamento e não prova ausência de pesquisas.

## 3. Resultado por região

No export por região, somente o Rio Grande do Sul aparece na comparação final, com a seguinte distribuição relativa entre os cinco termos:

| Consulta | Índice relativo no RS |
| --- | ---: |
| `nível lagoa dos patos` | 67 |
| `nível da lagoa dos patos hoje` | 23 |
| `nível lagoa dos patos pelotas` | 10 |
| `nível lagoa dos patos laranjal` | 0 |
| `nível da lagoa em pelotas` | 0 |

### Interpretação

A formulação principal é claramente `nível lagoa dos patos`.

A palavra `hoje` merece atenção: dentro do comparativo regional ela representa um sinal relevante de intenção operacional e atual. O visitante quer saber a leitura atual, não apenas aprender sobre a Lagoa.

`Pelotas` também aparece de forma explícita e confirma intenção local.

`Laranjal` não deve ser descartado porque ficou em `0` no Trends. A página do Laranjal já possui desempenho orgânico próprio no Search Console, portanto o Trends não deve substituir a evidência real do site.

A formulação genérica `nível da lagoa em pelotas` teve pouco ou nenhum sinal mensurável neste recorte. Ela não deve ser usada como expressão principal de title/H1 enquanto existirem formulações mais naturais e comprovadas.

## 4. Série temporal — cinco anos

A série mensal mostra comportamento fortemente episódico.

### Maio de 2024

- `nível lagoa dos patos`: 100;
- `nível da lagoa dos patos hoje`: 21;
- demais termos: 0 no índice mensal normalizado.

Esse é o maior pico do recorte e coincide temporalmente com a grande cheia de 2024 no Rio Grande do Sul. O Trends, por si só, não explica a causa do pico; a correlação temporal serve como sinal de que a intenção cresce fortemente durante eventos hidrológicos relevantes.

### Junho de 2026

- `nível lagoa dos patos`: 24;
- demais termos: 0 no índice mensal normalizado.

### Agosto de 2026

- `nível lagoa dos patos`: 10;
- `nível da lagoa dos patos hoje`: 2;
- `nível lagoa dos patos pelotas`: 1;
- `nível lagoa dos patos laranjal`: 0;
- `nível da lagoa em pelotas`: 0.

### Leitura estratégica

A demanda não se comporta como uma palavra-chave estável com o mesmo interesse todos os meses. Ela dispara quando o nível da água volta a ser assunto relevante e depois pode cair abaixo do limiar mensal do Trends.

Isso favorece uma URL permanente, atualizada e forte, capaz de acumular autoridade entre os eventos, em vez de criar páginas novas a cada cheia ou pico de procura.

## 5. Cruzamento com a arquitetura atual do Tempo Pelotas

O portal já possui duas páginas que atendem corretamente essa frente:

### `/nivel-da-lagoa-dos-patos-laranjal`

Função: resposta local e operacional da Estação Laranjal.

Hoje já trabalha com:

- nível da Lagoa dos Patos;
- Estação Laranjal;
- evolução recente;
- horário da leitura;
- chuva e vento em Pelotas;
- explicação de que uma leitura local não confirma sozinha inundação.

### `/situacao-hidrologica-pelotas`

Função: visão regional das águas.

Relaciona:

- Laranjal;
- outros pontos da Lagoa dos Patos;
- Guaíba;
- rios ligados ao SACE;
- horário e tendência;
- chuva, vento e referências de medição.

## 6. Decisão de arquitetura

Não criar novas URLs para:

- `/nivel-lagoa-dos-patos-hoje`;
- `/nivel-lagoa-dos-patos-pelotas`;
- `/nivel-da-lagoa-em-pelotas`;
- outras variações que apenas repetiriam a mesma intenção.

Essas buscas devem consolidar autoridade principalmente em `/nivel-da-lagoa-dos-patos-laranjal`, enquanto `/situacao-hidrologica-pelotas` permanece como visão regional e explicativa.

Essa decisão também preserva o direcionamento já registrado na baseline do Search Console: não diluir a autoridade hidrológica entre páginas redundantes.

## 7. Oportunidade de copy — provisória

Não implementar ainda. Consolidar com os demais grupos antes de alterar title/H1.

### Página do Laranjal

A evidência sugere testar, na rodada final, uma formulação que aproxime a página da linguagem `nível da Lagoa dos Patos hoje` e `Pelotas`, sem fingir que uma única estação representa toda a Lagoa.

Candidato de title:

`Nível da Lagoa dos Patos hoje: Estação Laranjal, Pelotas`

Candidato de H1:

`Nível da Lagoa dos Patos hoje no Laranjal, em Pelotas`

Candidato de description:

`Veja a medição atual da Estação Laranjal, em Pelotas, o horário da última leitura e a evolução do nível da Lagoa dos Patos nas últimas horas.`

A copy final deve continuar deixando claro que se trata da leitura da Estação Laranjal e da referência própria da estação.

### Página de situação das águas

Não transformar a página regional em duplicata da página do Laranjal.

Ela pode absorver variações como:

- situação da Lagoa dos Patos;
- níveis da água em Pelotas;
- Lagoa dos Patos subindo ou baixando;
- situação hidrológica de Pelotas;
- relação entre Guaíba, Lagoa e Laranjal.

Essas intenções precisam ser validadas pelos próximos grupos antes de mudar a copy.

## 8. Implicação de produto

A expressão `hoje` reforça que a página precisa responder imediatamente a quatro perguntas do visitante:

1. qual é a última leitura disponível?;
2. de que horário é essa leitura?;
3. está subindo, baixando ou estável dentro da janela observada?;
4. o dado está atualizado ou atrasado?

A resposta deve aparecer antes de explicações longas de metodologia.

Em situação de indisponibilidade, a página deve dizer claramente que não há leitura atual em vez de inferir normalidade.

## 9. Prioridade provisória após o grupo 1

Classificação: **P0 — otimizar ativo existente, sem criar URL nova**.

Motivos:

- a intenção é comprovada pelo Trends;
- a intenção já possui páginas apropriadas;
- Search Console já mostrou autoridade hidrológica nas URLs existentes;
- a demanda é episódica e se beneficia de uma URL permanente;
- `hoje` e `Pelotas` são variações que podem ser absorvidas pela copy sem fragmentar indexação.

## 10. O que ainda falta antes de alterar produção

Aguardar os próximos grupos da coleta para cruzar:

- enchente e alagamento;
- risco de enchente;
- Guaíba e Canal São Gonçalo;
- chuva acumulada e eventos meteorológicos;
- perguntas completas como `a lagoa está subindo?`;
- consultas relacionadas e em ascensão, quando houver export específico.

Somente depois consolidar o mapa final `consulta -> intenção -> URL -> copy -> dado necessário -> prioridade` e decidir mudanças de produção.