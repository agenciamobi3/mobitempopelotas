# /tempo-amanha-pelotas — atualização visual editorial

Data: 08/09/2026  
Branch: `main`

## Objetivo

A página `/tempo-amanha-pelotas` deixou de usar no topo a composição de dashboard/retail com fotografia grande, painel cromático, tiles e múltiplos CTAs. O objetivo desta rodada foi aproximar a página do sistema editorial limpo já adotado nas páginas históricas do Tempo Pelotas, sem alterar contratos meteorológicos, fontes, SEO ou recuperação de dados.

## Hero

O hero ativo continua sendo `TomorrowRetailHero`, mas a implementação visual foi reescrita para uma faixa editorial aberta.

Contrato atual:

- fundo claro em largura total, com gradientes discretos;
- título principal `Tempo amanhã em Pelotas`;
- resumo textual curto com condição, mínima e máxima;
- data e estado de avisos oficiais como metadados discretos;
- leitura lateral reduzida à condição prevista e três fatos: temperatura, chuva e rajadas;
- sem fotografia meteorológica no hero;
- sem painel roxo, tiles auxiliares ou botões de ação concorrendo com a previsão;
- estados `normal`, `attention` e `warning` continuam alterando a tonalidade do fundo sem transformar o hero em alerta oficial.

Arquivos principais:

- `src/components/weather/TomorrowRetailHero.tsx`;
- `src/components/weather/TomorrowRetailHero.css`;
- `src/components/layout/InternalWeatherPageShell.css`.

## Corpo da página

`TomorrowForecastPageV3` preserva:

- resumo de amanhã;
- comparação Hoje x Amanhã;
- diferenças de máxima, mínima, chance de chuva e rajadas;
- orientações práticas;
- contexto de INMET e CPPMet/UFPel;
- FAQ com JSON-LD;
- links para previsões relacionadas;
- nota de fonte e horário.

A apresentação foi aberta para leitura editorial:

- seções separadas por linhas e espaço vertical, sem uma caixa grande em torno de cada capítulo;
- cards mantidos apenas quando representam dados que realmente se beneficiam da comparação visual;
- sombras removidas dos blocos informativos principais;
- FAQ em lista aberta, com divisórias;
- navegação relacionada em faixa simples.

## Índice da página

O componente compartilhado `InternalPageChapters` continua sendo usado por compatibilidade estrutural, mas em `/tempo-amanha-pelotas` recebe um refinamento próprio em `TomorrowForecastEditorialRefinement.css`.

Na rota de amanhã:

- números e descrições secundárias ficam ocultos visualmente;
- permanece apenas o rótulo útil de cada destino;
- borda arredondada, fundo e sombra são removidos;
- o índice vira uma faixa horizontal simples;
- no mobile, os links usam rolagem horizontal sem transformar cada item em cartão.

Isso evita alterar o componente compartilhado usado por Hoje e 7 dias.

## Mobile e acessibilidade

- hero passa para uma coluna abaixo de 980 px;
- metadados do hero empilham no mobile;
- índice permite scroll horizontal abaixo de 760 px;
- seções e grids passam progressivamente para 2 e 1 coluna;
- foco visível é preservado em links;
- `forced-colors` recebe tratamento específico;
- conteúdo meteorológico e estados indisponíveis continuam sem inventar valores.

## Dados e SEO preservados

Esta rodada não altera:

- canonical;
- título e description de SEO;
- JSON-LD editorial e FAQ;
- Open-Meteo como previsão principal;
- contingência MET Norway quando aplicável;
- contexto INMET/CPPMet;
- regra de data ISO para casar previsão oficial;
- semântica de `null`, zero de rajada ou volume de chuva;
- recuperação pós-hidratação.

## Contratos automatizados

`tests/tomorrow-retail-visual.test.ts` protege agora:

- hero sem fotografia/tiles antigos;
- três fatos essenciais;
- faixa editorial responsiva;
- índice simplificado específico de amanhã;
- ausência de sombras recuperadas por CSS global;
- comportamento mobile do índice;
- manutenção dos contratos de dados, fontes e SEO.

## CI

O estado do GitHub Actions deve continuar sendo tratado separadamente do estado do código. Runs recentes do repositório vêm encerrando antes dos steps, com jobs sem execução real. Enquanto isso persistir, não considerar teste, build, lint, typecheck ou auditoria visual como executados apenas porque a run foi criada.
